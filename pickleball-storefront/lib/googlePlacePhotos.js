const PHOTO_CACHE = new Map();
const PHOTO_CACHE_TTL_MS = 24 * 60 * 60 * 1000;

function getApiKey() {
  return (
    process.env.GOOGLE_MAPS_API_KEY?.trim() ||
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.trim() ||
    ""
  );
}

export function extractGooglePlaceId(courtId) {
  if (!courtId || typeof courtId !== "string") return null;
  if (courtId.startsWith("google:")) return courtId.slice("google:".length);
  return null;
}

export function buildPhotoProxyUrl(photoReference, maxWidth = 800) {
  const params = new URLSearchParams({
    ref: photoReference,
    maxwidth: String(maxWidth),
  });
  return `/api/places/photo?${params}`;
}

export function buildStaticMapProxyUrl({ lat, lng, width = 800, height = 450 }) {
  const params = new URLSearchParams({
    lat: String(lat),
    lng: String(lng),
    width: String(width),
    height: String(height),
  });
  return `/api/places/static-map?${params}`;
}

function readPhotoCache(key) {
  const hit = PHOTO_CACHE.get(key);
  if (!hit) return null;
  if (Date.now() - hit.at > PHOTO_CACHE_TTL_MS) {
    PHOTO_CACHE.delete(key);
    return null;
  }
  return hit.value;
}

function writePhotoCache(key, value) {
  PHOTO_CACHE.set(key, { at: Date.now(), value });
}

async function fetchPlaceDetails(placeId, apiKey) {
  const url = new URL(
    "https://maps.googleapis.com/maps/api/place/details/json",
  );
  url.searchParams.set("place_id", placeId);
  url.searchParams.set("fields", "photos,name");
  url.searchParams.set("language", "zh-TW");
  url.searchParams.set("key", apiKey);

  const res = await fetch(url.toString());
  const data = await res.json();
  if (data.status !== "OK" || !data.result) return null;
  return data.result;
}

async function findPlaceIdByText(name, address, apiKey) {
  const query = [name, address].filter(Boolean).join(" ").trim();
  if (!query) return null;

  const url = new URL(
    "https://maps.googleapis.com/maps/api/place/findplacefromtext/json",
  );
  url.searchParams.set("input", query);
  url.searchParams.set("inputtype", "textquery");
  url.searchParams.set("fields", "place_id");
  url.searchParams.set("language", "zh-TW");
  url.searchParams.set("key", apiKey);

  const res = await fetch(url.toString());
  const data = await res.json();
  const placeId = data.candidates?.[0]?.place_id;
  return placeId || null;
}

async function resolvePlaceId({ courtId, name, address }) {
  const fromCourt = extractGooglePlaceId(courtId);
  if (fromCourt) return fromCourt;

  const apiKey = getApiKey();
  if (!apiKey || !name) return null;

  const cacheKey = `find:${name}|${address || ""}`;
  const cached = readPhotoCache(cacheKey);
  if (cached?.placeId) return cached.placeId;

  const placeId = await findPlaceIdByText(name, address, apiKey);
  if (placeId) writePhotoCache(cacheKey, { placeId });
  return placeId;
}

/**
 * 取得地點圖片 proxy URL 列表；無照片時回傳 static map 或 null
 */
export async function getPlacePhotoUrls({
  courtId,
  name,
  address,
  latitude,
  longitude,
  maxPhotos = 5,
  maxWidth = 800,
} = {}) {
  const apiKey = getApiKey();
  if (!apiKey) {
    return {
      photos: [],
      fallback: buildStaticMapFallback({ latitude, longitude }),
      source: "none",
    };
  }

  const placeId = await resolvePlaceId({ courtId, name, address });
  const staticFallback = buildStaticMapFallback({ latitude, longitude });

  if (!placeId) {
    return { photos: staticFallback ? [staticFallback] : [], source: "static" };
  }

  const cacheKey = `photos:${placeId}:${maxPhotos}:${maxWidth}`;
  const cached = readPhotoCache(cacheKey);
  if (cached) return cached;

  const details = await fetchPlaceDetails(placeId, apiKey);
  const refs = (details?.photos || [])
    .slice(0, maxPhotos)
    .map((p) => p.photo_reference)
    .filter(Boolean);

  const photos = refs.map((ref) => buildPhotoProxyUrl(ref, maxWidth));

  const result =
    photos.length > 0
      ? { photos, source: "places" }
      : {
          photos: staticFallback ? [staticFallback] : [],
          source: staticFallback ? "static" : "none",
        };

  writePhotoCache(cacheKey, result);
  return result;
}

function buildStaticMapFallback({ latitude, longitude }) {
  const lat = Number(latitude);
  const lng = Number(longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return buildStaticMapProxyUrl({ lat, lng });
}

export async function fetchGooglePlacePhoto(photoReference, maxWidth = 800) {
  const apiKey = getApiKey();
  if (!apiKey || !photoReference) return null;

  const url = new URL("https://maps.googleapis.com/maps/api/place/photo");
  url.searchParams.set("maxwidth", String(maxWidth));
  url.searchParams.set("photo_reference", photoReference);
  url.searchParams.set("key", apiKey);

  const res = await fetch(url.toString(), { redirect: "follow" });
  if (!res.ok) return null;

  const contentType = res.headers.get("content-type") || "image/jpeg";
  const buffer = Buffer.from(await res.arrayBuffer());
  return { buffer, contentType };
}

export async function fetchGoogleStaticMap({ lat, lng, width = 800, height = 450 }) {
  const apiKey = getApiKey();
  const latitude = Number(lat);
  const longitude = Number(lng);
  if (!apiKey || !Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return null;
  }

  const url = new URL("https://maps.googleapis.com/maps/api/staticmap");
  url.searchParams.set("center", `${latitude},${longitude}`);
  url.searchParams.set("zoom", "16");
  url.searchParams.set("size", `${width}x${height}`);
  url.searchParams.set("scale", "2");
  url.searchParams.set("maptype", "roadmap");
  url.searchParams.set(
    "markers",
    `color:0x005caf|${latitude},${longitude}`,
  );
  url.searchParams.set("key", apiKey);

  const res = await fetch(url.toString());
  if (!res.ok) return null;

  const contentType = res.headers.get("content-type") || "image/png";
  const buffer = Buffer.from(await res.arrayBuffer());
  return { buffer, contentType };
}
