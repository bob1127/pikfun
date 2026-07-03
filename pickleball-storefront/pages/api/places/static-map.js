import { fetchGoogleStaticMap } from "@/lib/googlePlacePhotos";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { lat = "", lng = "", width = "800", height = "450" } = req.query;
  if (lat === "" || lng === "") {
    return res.status(400).json({ error: "Missing coordinates" });
  }

  try {
    const image = await fetchGoogleStaticMap({
      lat: Number(lat),
      lng: Number(lng),
      width: Math.min(1200, Math.max(200, Number(width) || 800)),
      height: Math.min(800, Math.max(150, Number(height) || 450)),
    });
    if (!image) {
      return res.status(404).json({ error: "Map not found" });
    }

    res.setHeader("Content-Type", image.contentType);
    res.setHeader("Cache-Control", "public, max-age=86400, s-maxage=604800");
    return res.status(200).send(image.buffer);
  } catch (e) {
    console.error("[places/static-map]", e);
    return res.status(500).json({ error: "Failed to load map" });
  }
}
