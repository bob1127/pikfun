import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { normalizeTaiwanAddress } from "@/lib/courtDistrict";

const CACHE_DIR = join(process.cwd(), "data/cache/google-places");

/** 搜尋邏輯升級時遞增，舊快取自動失效 */
export const PLACES_CACHE_VERSION = 2;

export function getCacheTtlMs() {
  const hours = Number(process.env.GOOGLE_PLACES_CACHE_TTL_HOURS || 720);
  if (!Number.isFinite(hours) || hours <= 0) return 720 * 60 * 60 * 1000;
  return hours * 60 * 60 * 1000;
}

function cacheFilePath(city) {
  const key = normalizeTaiwanAddress(city).replace(/\s/g, "") || "unknown";
  return join(CACHE_DIR, `${key}.json`);
}

export function readPlacesCache(city) {
  const file = cacheFilePath(city);
  if (!existsSync(file)) return null;

  try {
    const data = JSON.parse(readFileSync(file, "utf8"));
    const ttl = getCacheTtlMs();
    const age = Date.now() - (data.fetchedAt || 0);
    const versionStale = (data.version || 1) < PLACES_CACHE_VERSION;
    return {
      expired: versionStale || age >= ttl,
      data,
      ageMs: age,
      ttlMs: ttl,
    };
  } catch {
    return null;
  }
}

export function writePlacesCache(city, courts) {
  mkdirSync(CACHE_DIR, { recursive: true });
  const now = Date.now();
  const payload = {
    version: PLACES_CACHE_VERSION,
    city: normalizeTaiwanAddress(city),
    fetchedAt: now,
    expiresAt: now + getCacheTtlMs(),
    courts,
  };
  writeFileSync(cacheFilePath(city), JSON.stringify(payload, null, 2), "utf8");
  return payload;
}

export function formatCacheMeta(entry, { fromCache = false } = {}) {
  if (!entry) return null;
  const expiresAt = entry.expiresAt || entry.data?.expiresAt;
  const fetchedAt = entry.fetchedAt || entry.data?.fetchedAt;
  return {
    fromCache,
    fetchedAt: fetchedAt ? new Date(fetchedAt).toISOString() : null,
    expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
    ttlHours: Math.round(getCacheTtlMs() / (60 * 60 * 1000)),
  };
}
