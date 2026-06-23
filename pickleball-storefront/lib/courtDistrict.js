import { normalizeCourtCity } from "@/lib/courtCities";

/** 統一地址用字（臺→台、去郵遞區號前綴） */
export function normalizeTaiwanAddress(text) {
  return String(text || "")
    .trim()
    .replace(/臺/g, "台")
    .replace(/区/g, "區")
    .replace(/^\d{3,5}\s*/, "");
}

/** 從完整地址擷取鄉鎮市區（例：台中市潭子區… → 潭子區） */
export function extractDistrict(city, address) {
  const normalizedCity = normalizeTaiwanAddress(normalizeCourtCity(city));
  let rest = normalizeTaiwanAddress(address);
  if (normalizedCity && rest.startsWith(normalizedCity)) {
    rest = rest.slice(normalizedCity.length);
  }
  const m = rest.match(/^(.+?(?:區|鎮|鄉|市))/);
  return m ? m[1] : "";
}

/** 區域名稱比對（烏日區 = 烏日區，忽略臺/台） */
export function districtMatches(city, address, district) {
  if (!district) return true;
  const extracted = extractDistrict(city, address);
  return (
    normalizeTaiwanAddress(extracted) === normalizeTaiwanAddress(district)
  );
}

/** 從球場列表產生不重複、排序後的區域清單 */
export function collectDistricts(courts = []) {
  const set = new Set();
  for (const c of courts) {
    const d = extractDistrict(c.city, c.address);
    if (d) set.add(d);
  }
  return [...set].sort((a, b) => a.localeCompare(b, "zh-TW"));
}

const EARTH_KM = 6371;

/** 兩點距離（公里） */
export function haversineKm(lat1, lng1, lat2, lng2) {
  if (lat1 == null || lng1 == null || lat2 == null || lng2 == null) return Infinity;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return EARTH_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function sortCourtsByDistance(courts, lat, lng) {
  const latN = Number(lat);
  const lngN = Number(lng);
  if (!Number.isFinite(latN) || !Number.isFinite(lngN)) return courts;

  return [...courts].sort(
    (a, b) =>
      haversineKm(latN, lngN, a.latitude, a.longitude) -
      haversineKm(latN, lngN, b.latitude, b.longitude)
  );
}
