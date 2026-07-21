import { mkdirSync, existsSync, readFileSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { readPlacesCache } from "@/lib/googlePlacesCache";
import { TAIWAN_CITIES } from "@/lib/courtCities";
import { checkRateLimit, getClientIp } from "@/lib/apiRateLimit";

// Vercel 的專案目錄唯讀，只能寫 /tmp（warm 實例間共用，冷啟後失效）
const PHOTO_DIR = process.env.VERCEL
  ? join(tmpdir(), "court-photos")
  : join(process.cwd(), "data", "court-photos");
const REFS_DIR = join(PHOTO_DIR, "_refs");
const MAX_PHOTOS = 6;

// place_id → 單張(text search) 參照的記憶體索引
let searchRefIndex = null;
let searchRefBuiltAt = 0;
const SEARCH_INDEX_TTL = 30 * 60 * 1000;

// 進行中的 Place Details 請求去重
const inflightDetails = new Map();

async function getSearchRefs(placeId) {
  const now = Date.now();
  if (!searchRefIndex || now - searchRefBuiltAt > SEARCH_INDEX_TTL) {
    const index = new Map();
    for (const city of TAIWAN_CITIES) {
      const entry = await readPlacesCache(city);
      for (const c of entry?.data?.courts || []) {
        if (c.place_id && Array.isArray(c.photo_refs) && c.photo_refs.length) {
          index.set(c.place_id, c.photo_refs);
        }
      }
    }
    searchRefIndex = index;
    searchRefBuiltAt = now;
  }
  return searchRefIndex.get(placeId) || [];
}

function getApiKey() {
  return (
    process.env.GOOGLE_MAPS_API_KEY?.trim() ||
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.trim() ||
    ""
  );
}

/**
 * 只接受預先存在 Supabase 球場快取中的 Place ID。
 * 避免公開端點被拿來查任意地點並產生 Place Details 費用。
 */
async function getPhotoRefs(placeId) {
  const refsFile = join(REFS_DIR, `${placeId}.json`);
  if (existsSync(refsFile)) {
    try {
      return JSON.parse(readFileSync(refsFile, "utf8")).refs || [];
    } catch {
      /* fallthrough */
    }
  }

  if (inflightDetails.has(placeId)) {
    return inflightDetails.get(placeId);
  }

  const promise = (async () => {
    const refs = await getSearchRefs(placeId);
    try {
      mkdirSync(REFS_DIR, { recursive: true });
      writeFileSync(refsFile, JSON.stringify({ refs, ts: Date.now() }));
    } catch {
      /* ignore */
    }
    return refs;
  })();

  inflightDetails.set(placeId, promise);
  try {
    return await promise;
  } finally {
    inflightDetails.delete(placeId);
  }
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).end();
  }

  if (process.env.ENABLE_GOOGLE_PLACE_PHOTOS !== "true") {
    return res.status(410).end();
  }

  const ip = getClientIp(req);
  const limit = checkRateLimit(`court-photo:${ip}`, {
    limit: 30,
    windowMs: 60_000,
  });
  if (!limit.allowed) {
    res.setHeader("Retry-After", String(limit.retryAfterSec));
    return res.status(429).end();
  }

  const placeId = String(req.query.place_id || "").trim();
  const index = Math.min(
    MAX_PHOTOS - 1,
    Math.max(0, parseInt(req.query.i, 10) || 0),
  );
  if (!placeId || !/^[\w-]+$/.test(placeId)) {
    return res.status(400).end();
  }

  const filePath = join(PHOTO_DIR, `${placeId}_${index}.jpg`);

  // 圖片磁碟快取命中：不打 Google，零用量
  if (existsSync(filePath)) {
    res.setHeader("Content-Type", "image/jpeg");
    res.setHeader("Cache-Control", "public, max-age=2592000, immutable");
    return res.send(readFileSync(filePath));
  }

  const apiKey = getApiKey();
  const refs = await getPhotoRefs(placeId);
  const ref = refs[index];
  if (!ref) return res.status(404).end();
  if (!apiKey) return res.status(404).end();

  try {
    const url = new URL("https://maps.googleapis.com/maps/api/place/photo");
    url.searchParams.set("maxwidth", "800");
    url.searchParams.set("photo_reference", ref);
    url.searchParams.set("key", apiKey);

    const upstream = await fetch(url.toString(), { redirect: "follow" });
    if (!upstream.ok) return res.status(404).end();

    const buffer = Buffer.from(await upstream.arrayBuffer());
    mkdirSync(PHOTO_DIR, { recursive: true });
    writeFileSync(filePath, buffer);

    res.setHeader(
      "Content-Type",
      upstream.headers.get("content-type") || "image/jpeg",
    );
    res.setHeader("Cache-Control", "public, max-age=2592000, immutable");
    return res.send(buffer);
  } catch (e) {
    console.error("[courts/photo]", e.message);
    return res.status(404).end();
  }
}
