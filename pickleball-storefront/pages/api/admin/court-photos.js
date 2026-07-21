import { assertAdmin } from "@/lib/adminAuth";
import {
  listCourtCustomPhotos,
  saveCourtCustomPhotos,
} from "@/lib/courtCustomPhotos";
import {
  bufferFromBase64,
  buildObjectKey,
  isR2Configured,
  uploadToR2,
} from "@/lib/r2";

export const config = {
  api: { bodyParser: { sizeLimit: "6mb" } },
};

const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

function validPlaceId(value) {
  return /^[A-Za-z0-9_-]{6,200}$/.test(String(value || ""));
}

export default async function handler(req, res) {
  const adminEmail = assertAdmin(req, res);
  if (!adminEmail) return;

  if (req.method === "GET") {
    const rows = await listCourtCustomPhotos();
    return res.status(200).json({ photos: rows });
  }

  const {
    place_id: placeId,
    court_name: courtName = "",
    file_base64: fileBase64,
    file_name: fileName,
    content_type: contentType,
    remove_url: removeUrl,
  } = req.body || {};

  if (!validPlaceId(placeId)) {
    return res.status(400).json({ error: "無效的 Google Place ID" });
  }

  try {
    const rows = await listCourtCustomPhotos();
    const current =
      rows.find((row) => row.place_id === placeId)?.photo_urls || [];

    if (req.method === "DELETE") {
      const photoUrls = current.filter((url) => url !== removeUrl);
      const saved = await saveCourtCustomPhotos({
        placeId,
        courtName,
        photoUrls,
        updatedBy: adminEmail,
      });
      return res.status(200).json({ item: saved });
    }

    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }
    if (!isR2Configured()) {
      return res.status(500).json({ error: "Cloudflare R2 尚未設定" });
    }
    if (current.length >= 6) {
      return res.status(400).json({ error: "每個球場最多 6 張照片" });
    }
    if (!fileBase64 || !IMAGE_TYPES.has(contentType)) {
      return res.status(400).json({ error: "請選擇 JPG、PNG 或 WebP 圖片" });
    }

    const buffer = bufferFromBase64(fileBase64);
    if (!buffer.length || buffer.length > 4 * 1024 * 1024) {
      return res.status(400).json({ error: "圖片不可超過 4MB" });
    }

    const safePlaceId = String(placeId).replace(/[^A-Za-z0-9_-]/g, "");
    const key = buildObjectKey(
      `court-photos/${safePlaceId}`,
      fileName,
      "jpg",
    );
    const uploaded = await uploadToR2({
      key,
      body: buffer,
      contentType,
      cacheControl: "public, max-age=31536000, immutable",
    });

    const saved = await saveCourtCustomPhotos({
      placeId,
      courtName,
      photoUrls: [...current, uploaded.url],
      updatedBy: adminEmail,
    });
    return res.status(200).json({ item: saved, uploaded });
  } catch (error) {
    console.error("[admin/court-photos]", error);
    return res.status(500).json({ error: error.message || "球場照片更新失敗" });
  }
}
