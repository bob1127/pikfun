import {
  collectDistricts,
  districtMatches,
  sortCourtsByDistance,
} from "@/lib/courtDistrict";
import {
  formatCacheMeta,
  readPlacesCache,
  writePlacesCache,
} from "@/lib/googlePlacesCache";
import { searchGooglePickleballCourts } from "@/lib/googlePlacesSearch";

function mergeCourtLists(existing = [], incoming = []) {
  const map = new Map();
  for (const c of [...existing, ...incoming]) {
    const key = c.place_id || c.id;
    if (!key) continue;
    map.set(key, c);
  }
  return [...map.values()].sort((a, b) =>
    a.name.localeCompare(b.name, "zh-TW")
  );
}

/** 以「縣市」為單位快取；區域在前端或 API 層篩選，不重打 Google */
export async function getGoogleCourtsForCity(city, { forceRefresh = false } = {}) {
  const normalizedCity = String(city || "").trim();
  if (!normalizedCity) {
    return {
      available: false,
      courts: [],
      districts: [],
      message: "請先選擇縣市",
      cache: null,
    };
  }

  const cached = readPlacesCache(normalizedCity);

  if (!forceRefresh && cached && !cached.expired) {
    const courts = cached.data.courts || [];
    return {
      available: true,
      courts,
      districts: collectDistricts(courts.map((c) => ({ ...c, city: normalizedCity }))),
      message: null,
      cache: formatCacheMeta(cached.data, { fromCache: true }),
    };
  }

  const result = await searchGooglePickleballCourts({
    city: normalizedCity,
    district: "",
    maxPages: 3,
  });

  if (!result.available) {
    if (cached?.data?.courts?.length) {
      const courts = cached.data.courts;
      return {
        available: true,
        courts,
        districts: collectDistricts(courts.map((c) => ({ ...c, city: normalizedCity }))),
        message: "Google 暫時無法更新，顯示快取資料",
        cache: formatCacheMeta(cached.data, { fromCache: true }),
      };
    }
    return {
      available: false,
      courts: [],
      districts: [],
      message: result.message,
      cache: null,
    };
  }

  const stored = writePlacesCache(normalizedCity, result.courts);

  return {
    available: true,
    courts: result.courts,
    districts: collectDistricts(
      result.courts.map((c) => ({ ...c, city: normalizedCity }))
    ),
    message: null,
    cache: formatCacheMeta(stored, { fromCache: false }),
  };
}

/** 快取內沒有該區資料時，向 Google 補抓並寫回縣市快取 */
export async function supplementDistrictCourts(city, district, existingCourts = []) {
  const normalizedCity = String(city || "").trim();
  const normalizedDistrict = String(district || "").trim();
  if (!normalizedCity || !normalizedDistrict) {
    return { courts: existingCourts, supplemented: false };
  }

  const result = await searchGooglePickleballCourts({
    city: normalizedCity,
    district: normalizedDistrict,
    maxPages: 3,
  });

  if (!result.available || !result.courts.length) {
    return { courts: existingCourts, supplemented: false };
  }

  const merged = mergeCourtLists(existingCourts, result.courts);
  writePlacesCache(normalizedCity, merged);
  return { courts: merged, supplemented: true };
}

export async function getGoogleCourtsForSelection(
  city,
  { district = "", forceRefresh = false, allowSupplement = true } = {}
) {
  const cityResult = await getGoogleCourtsForCity(city, { forceRefresh });
  if (!cityResult.available) return cityResult;

  let allCourts = cityResult.courts;
  let supplemented = false;

  if (district && allowSupplement) {
    let filtered = filterGoogleCourts(allCourts, { city, district });
    if (filtered.length === 0) {
      const extra = await supplementDistrictCourts(city, district, allCourts);
      allCourts = extra.courts;
      supplemented = extra.supplemented;
    }
  }

  const courts = filterGoogleCourts(allCourts, {
    city,
    district,
  });

  return {
    ...cityResult,
    courts,
    allCourts,
    supplemented,
    cache: supplemented
      ? formatCacheMeta(readPlacesCache(city)?.data || {}, { fromCache: false })
      : cityResult.cache,
  };
}

export function filterGoogleCourts(courts, { city, district, lat, lng } = {}) {
  let list = [...courts];
  if (district && city) {
    list = list.filter((c) => districtMatches(city, c.address, district));
  }
  if (lat != null && lng != null) {
    list = sortCourtsByDistance(list, lat, lng);
  } else {
    list.sort((a, b) => a.name.localeCompare(b.name, "zh-TW"));
  }
  return list;
}
