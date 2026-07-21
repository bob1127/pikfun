import { createClient } from "@supabase/supabase-js";

const TABLE = "court_custom_photos";
let client = null;
let rowsCache = null;
let rowsCachedAt = 0;
const ROWS_CACHE_MS = 30_000;

function getClient() {
  if (client) return client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return client;
}

export async function listCourtCustomPhotos() {
  if (rowsCache && Date.now() - rowsCachedAt < ROWS_CACHE_MS) {
    return rowsCache;
  }
  const supabase = getClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from(TABLE)
    .select("place_id,court_name,photo_urls,updated_by,updated_at")
    .order("updated_at", { ascending: false });

  if (error) {
    // Migration 尚未執行時維持球場頁可用，不讓照片附加功能拖垮主流程。
    console.warn("[courtCustomPhotos] read:", error.message);
    return [];
  }
  rowsCache = data || [];
  rowsCachedAt = Date.now();
  return rowsCache;
}

export async function getCourtCustomPhotosMap() {
  const rows = await listCourtCustomPhotos();
  return new Map(
    rows.map((row) => [
      row.place_id,
      Array.isArray(row.photo_urls) ? row.photo_urls.filter(Boolean) : [],
    ]),
  );
}

export async function saveCourtCustomPhotos({
  placeId,
  courtName,
  photoUrls,
  updatedBy,
}) {
  const supabase = getClient();
  if (!supabase) throw new Error("Supabase service role 尚未設定");

  const urls = [...new Set((photoUrls || []).filter(Boolean))].slice(0, 6);
  const { data, error } = await supabase
    .from(TABLE)
    .upsert(
      {
        place_id: placeId,
        court_name: courtName || "",
        photo_urls: urls,
        updated_by: updatedBy || null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "place_id" },
    )
    .select()
    .single();

  if (error) throw error;
  rowsCache = null;
  rowsCachedAt = 0;
  return data;
}
