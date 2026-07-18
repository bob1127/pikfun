import { readPlacesCache } from "@/lib/googlePlacesCache";
import { TAIWAN_CITIES } from "@/lib/courtCities";

/**
 * 全台球場總覽：只彙整 Supabase 內既有的 Google Places 快取，
 * 不會發出任何 Google API 請求（零額外用量）。
 * 快取由揪團開團流程或球場搜尋逐步累積。
 */
export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const perCity = await Promise.all(
      TAIWAN_CITIES.map(async (city) => {
        const entry = await readPlacesCache(city);
        const courts = entry?.data?.courts || [];
        return courts.map((c) => ({ ...c, city }));
      }),
    );

    const seen = new Set();
    const courts = [];
    for (const court of perCity.flat()) {
      const key = court.place_id || court.id;
      if (!key || seen.has(key)) continue;
      if (court.latitude == null || court.longitude == null) continue;
      seen.add(key);
      const { photo_refs, ...publicCourt } = court;
      courts.push({
        ...publicCourt,
        photo_count: Array.isArray(photo_refs) ? photo_refs.length : 0,
      });
    }

    courts.sort((a, b) => a.name.localeCompare(b.name, "zh-TW"));

    const cities = {};
    for (const c of courts) {
      cities[c.city] = (cities[c.city] || 0) + 1;
    }

    res.setHeader(
      "Cache-Control",
      "public, s-maxage=1800, stale-while-revalidate=86400",
    );
    return res.status(200).json({ count: courts.length, courts, cities });
  } catch (e) {
    console.error("[courts/all]", e);
    return res.status(500).json({ error: "球場資料載入失敗", courts: [] });
  }
}
