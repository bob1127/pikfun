import {
  bufferFromBase64,
  buildObjectKey,
  isR2Configured,
  uploadToR2,
} from "@/lib/r2";

export const config = {
  api: { bodyParser: { sizeLimit: "6mb" } },
};

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!isR2Configured()) {
    return res.status(500).json({
      error:
        "R2 尚未設定：請在 .env.local 填入 R2_* 變數（見 DEPLOYMENT.md）",
    });
  }

  const { imageBase64, fileName, contentType } = req.body || {};

  if (!imageBase64) {
    return res.status(400).json({ error: "請選擇圖片" });
  }

  const mime = contentType || "image/jpeg";
  if (!ALLOWED_TYPES.includes(mime)) {
    return res.status(400).json({ error: "僅支援 JPG、PNG、WebP、GIF" });
  }

  try {
    const buffer = bufferFromBase64(imageBase64);
    if (buffer.length > 4 * 1024 * 1024) {
      return res.status(400).json({ error: "圖片超過 4MB 限制" });
    }

    const key = buildObjectKey("community-posts", fileName, "jpg");
    const { url } = await uploadToR2({
      key,
      body: buffer,
      contentType: mime,
    });

    return res.status(200).json({ url });
  } catch (err) {
    console.error("community post image upload error:", err);
    return res.status(500).json({ error: err.message || "上傳失敗" });
  }
}
