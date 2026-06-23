import { getGoogleCourtsForSelection } from "@/lib/googlePlacesCached";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { city = "", district = "", lat = "", lng = "", refresh = "" } = req.query;

  if (!city) {
    return res.status(400).json({ error: "請先選擇縣市" });
  }

  try {
    const result = await getGoogleCourtsForSelection(String(city), {
      district: district ? String(district) : "",
      forceRefresh: refresh === "1",
      allowSupplement: refresh !== "0",
    });

    if (!result.available) {
      return res.status(200).json({
        available: false,
        message: result.message,
        count: 0,
        courts: [],
        allCourts: [],
        districts: [],
        cache: result.cache,
      });
    }

    return res.status(200).json({
      available: true,
      message: result.message,
      count: result.courts.length,
      courts: result.courts,
      allCourts: result.allCourts,
      supplemented: result.supplemented || false,
      districts: result.districts,
      cache: result.cache,
    });
  } catch (e) {
    console.error("[google-search]", e);
    return res.status(500).json({
      available: false,
      error: "Google 球場搜尋失敗",
      courts: [],
      districts: [],
    });
  }
}
