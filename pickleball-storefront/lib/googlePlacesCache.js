import { createClient } from "@supabase/supabase-js";
import { normalizeTaiwanAddress } from "@/lib/courtDistrict";

/**
 * Google Places 球場快取（Supabase 版）
 *
 * 為什麼不寫檔案：Vercel serverless 檔案系統唯讀、且多實例不共用，
 * 原本的 data/cache/google-places/*.json 在正式環境不會生效。
 * 改成寫 Supabase 一張 google_places_cache table：跨實例共用、永久保存。
 *
 * 防竄改：table 開 RLS 且不開公開政策，只有 server 端用
 * SUPABASE_SERVICE_ROLE_KEY 能讀寫（見 supabase/google_places_cache.sql）。
 */

const TABLE = "google_places_cache";

/** 搜尋邏輯升級時遞增，舊快取自動失效 */
export const PLACES_CACHE_VERSION = 2;

let _client = null;
function getSupabase() {
  if (_client) return _client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    console.warn(
      "[googlePlacesCache] 缺少 Supabase 環境變數，快取停用（每次都會打 Google）"
    );
    return null;
  }
  _client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return _client;
}

function cacheKey(city) {
  return normalizeTaiwanAddress(city).replace(/\s/g, "") || "unknown";
}

/**
 * 極短命記憶體快取：同一個 warm 實例在數秒內對同縣市的多次讀取
 * （getGoogleCourtsForCity → formatCacheMeta → supplement…）只打一次 Supabase，
 * 降低對 Supabase 的往返與流量。
 */
const MEM_TTL_MS = 5_000;
const _mem = new Map(); // key -> { at, row }

function memGet(key) {
  const hit = _mem.get(key);
  if (hit && Date.now() - hit.at < MEM_TTL_MS) return hit.row;
  return undefined;
}
function memSet(key, row) {
  _mem.set(key, { at: Date.now(), row });
}
function memClear(key) {
  _mem.delete(key);
}

export function getCacheTtlMs() {
  const hours = Number(process.env.GOOGLE_PLACES_CACHE_TTL_HOURS || 720);
  if (!Number.isFinite(hours) || hours <= 0) return 720 * 60 * 60 * 1000;
  return hours * 60 * 60 * 1000;
}

/** 讀取原始 row（帶極短命記憶體快取）；查無資料回 null */
async function fetchRow(city) {
  const key = cacheKey(city);
  const cached = memGet(key);
  if (cached !== undefined) return cached;

  const supabase = getSupabase();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .eq("city", key)
    .maybeSingle();

  if (error) {
    console.error("[googlePlacesCache] read error:", error.message);
    return null;
  }
  memSet(key, data || null);
  return data || null;
}

function rowToData(row) {
  return {
    version: row.version || 1,
    city: row.city,
    fetchedAt: row.fetched_at || 0,
    expiresAt: row.expires_at || 0,
    districtChecks: row.district_checks || {},
    lastForcedRefresh: row.last_forced_refresh ?? null,
    courts: row.courts || [],
  };
}

export async function readPlacesCache(city) {
  const row = await fetchRow(city);
  if (!row) return null;

  const data = rowToData(row);
  const ttl = getCacheTtlMs();
  const age = Date.now() - (data.fetchedAt || 0);
  const versionStale = (data.version || 1) < PLACES_CACHE_VERSION;
  return {
    expired: versionStale || age >= ttl,
    data,
    ageMs: age,
    ttlMs: ttl,
  };
}

export async function writePlacesCache(city, courts, meta = {}) {
  const supabase = getSupabase();
  const key = cacheKey(city);
  const now = Date.now();

  // 保留既有 meta（districtChecks 等），避免補抓紀錄被整筆覆寫
  const prevRow = await fetchRow(city);
  const prev = prevRow ? rowToData(prevRow) : {};

  const payload = {
    version: PLACES_CACHE_VERSION,
    city: normalizeTaiwanAddress(city),
    fetchedAt: now,
    expiresAt: now + getCacheTtlMs(),
    districtChecks: {
      ...(prev.districtChecks || {}),
      ...(meta.districtChecks || {}),
    },
    lastForcedRefresh: meta.lastForcedRefresh ?? prev.lastForcedRefresh ?? null,
    courts,
  };

  if (supabase) {
    const { error } = await supabase.from(TABLE).upsert(
      {
        city: key,
        version: payload.version,
        courts: payload.courts,
        district_checks: payload.districtChecks,
        last_forced_refresh: payload.lastForcedRefresh,
        fetched_at: payload.fetchedAt,
        expires_at: payload.expiresAt,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "city" }
    );
    if (error) console.error("[googlePlacesCache] write error:", error.message);
  }

  // 更新後讓短命記憶體快取失效，下次讀取取得最新資料
  memClear(key);
  return payload;
}

/** 區域補抓冷卻：同一區域在冷卻期內不再向 Google 補查（含查無結果的區域） */
export function getDistrictCheckTtlMs() {
  const hours = Number(process.env.GOOGLE_PLACES_DISTRICT_CHECK_TTL_HOURS || 168);
  if (!Number.isFinite(hours) || hours <= 0) return 168 * 60 * 60 * 1000;
  return hours * 60 * 60 * 1000;
}

export async function isDistrictRecentlyChecked(city, district) {
  const entry = await readPlacesCache(city);
  const checkedAt = entry?.data?.districtChecks?.[district];
  if (!checkedAt) return false;
  return Date.now() - checkedAt < getDistrictCheckTtlMs();
}

export async function markDistrictChecked(city, district) {
  const entry = await readPlacesCache(city);
  const courts = entry?.data?.courts || [];
  await writePlacesCache(city, courts, {
    districtChecks: { [district]: Date.now() },
  });
}

/** 強制更新冷卻（預設 6 小時），防止 refresh=1 被濫用重打 Google */
export function getForceRefreshCooldownMs() {
  const hours = Number(process.env.GOOGLE_PLACES_REFRESH_COOLDOWN_HOURS || 6);
  if (!Number.isFinite(hours) || hours < 0) return 6 * 60 * 60 * 1000;
  return hours * 60 * 60 * 1000;
}

export async function isForceRefreshAllowed(city) {
  const entry = await readPlacesCache(city);
  const last = entry?.data?.lastForcedRefresh;
  if (!last) return true;
  return Date.now() - last >= getForceRefreshCooldownMs();
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
