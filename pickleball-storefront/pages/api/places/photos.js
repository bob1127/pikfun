import { getPlacePhotoUrls } from "@/lib/googlePlacePhotos";
import { checkRateLimit, getClientIp } from "@/lib/apiRateLimit";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // IP 限流：揪團卡片一頁最多十幾張，正常使用不會踩到
  const ip = getClientIp(req);
  const limit = checkRateLimit(`places-photos:${ip}`, {
    limit: 60,
    windowMs: 60_000,
  });
  if (!limit.allowed) {
    res.setHeader("Retry-After", String(limit.retryAfterSec));
    return res.status(429).json({ photos: [], source: "rate_limited" });
  }

  const {
    court_id: courtId = "",
    name = "",
    address = "",
    lat = "",
    lng = "",
    max = "5",
  } = req.query;

  try {
    const result = await getPlacePhotoUrls({
      courtId: String(courtId),
      name: String(name),
      address: String(address),
      latitude: lat !== "" ? Number(lat) : null,
      longitude: lng !== "" ? Number(lng) : null,
      maxPhotos: Math.min(8, Math.max(1, Number(max) || 5)),
    });

    // Vercel Edge 依完整 URL 快取 7 天：同一場地的照片清單只算一次 Google 用量
    res.setHeader(
      "Cache-Control",
      "public, s-maxage=604800, stale-while-revalidate=86400",
    );
    return res.status(200).json(result);
  } catch (e) {
    console.error("[places/photos]", e);
    return res.status(500).json({ photos: [], source: "error" });
  }
}
