import { fetchGooglePlacePhoto } from "@/lib/googlePlacePhotos";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { ref = "", maxwidth = "800" } = req.query;
  if (!ref) {
    return res.status(400).json({ error: "Missing photo reference" });
  }

  try {
    const image = await fetchGooglePlacePhoto(
      String(ref),
      Math.min(1600, Math.max(200, Number(maxwidth) || 800)),
    );
    if (!image) {
      return res.status(404).json({ error: "Photo not found" });
    }

    res.setHeader("Content-Type", image.contentType);
    res.setHeader("Cache-Control", "public, max-age=86400, s-maxage=604800");
    return res.status(200).send(image.buffer);
  } catch (e) {
    console.error("[places/photo]", e);
    return res.status(500).json({ error: "Failed to load photo" });
  }
}
