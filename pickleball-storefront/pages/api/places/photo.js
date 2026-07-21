import { fetchGooglePlacePhoto } from "@/lib/googlePlacePhotos";
import { checkRateLimit, getClientIp } from "@/lib/apiRateLimit";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (process.env.ENABLE_GOOGLE_PLACE_PHOTOS !== "true") {
    return res.status(410).json({ error: "Google Place photos are disabled" });
  }

  const limit = checkRateLimit(`places-photo:${getClientIp(req)}`, {
    limit: 30,
    windowMs: 60_000,
  });
  if (!limit.allowed) {
    res.setHeader("Retry-After", String(limit.retryAfterSec));
    return res.status(429).json({ error: "Too many requests" });
  }

  const { ref = "", maxwidth = "800" } = req.query;
  const photoRef = String(ref);
  if (
    !photoRef ||
    photoRef.length > 2048 ||
    !/^[A-Za-z0-9_-]+$/.test(photoRef)
  ) {
    return res.status(400).json({ error: "Missing photo reference" });
  }

  try {
    const image = await fetchGooglePlacePhoto(
      photoRef,
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
