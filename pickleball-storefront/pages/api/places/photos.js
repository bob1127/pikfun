import { getPlacePhotoUrls } from "@/lib/googlePlacePhotos";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
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

    return res.status(200).json(result);
  } catch (e) {
    console.error("[places/photos]", e);
    return res.status(500).json({ photos: [], source: "error" });
  }
}
