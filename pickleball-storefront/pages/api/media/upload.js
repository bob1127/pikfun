import {
  bufferFromBase64,
  buildObjectKey,
  isR2Configured,
  uploadToR2,
} from "@/lib/r2";

export const config = {
  api: { bodyParser: { sizeLimit: "25mb" } },
};

const FOLDERS = new Set([
  "review-media",
  "community-posts",
  "avatars",
  "coach-covers",
  "coach-media",
  "uploads",
]);

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime"];

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!isR2Configured()) {
    return res.status(500).json({
      error:
        "R2 尚未設定：請在 .env.local 填入 R2_ACCOUNT_ID / R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY / R2_BUCKET / R2_PUBLIC_URL",
    });
  }

  const {
    folder = "uploads",
    fileBase64,
    imageBase64,
    fileName,
    contentType,
    subfolder,
  } = req.body || {};

  const payload = fileBase64 || imageBase64;
  if (!payload) {
    return res.status(400).json({ error: "請選擇檔案" });
  }

  if (!FOLDERS.has(folder)) {
    return res.status(400).json({ error: "不支援的上傳目錄" });
  }

  const mime = contentType || "image/jpeg";
  const allowVideo = folder === "review-media" || folder === "coach-media";
  const allowed = allowVideo
    ? [...IMAGE_TYPES, ...VIDEO_TYPES]
    : IMAGE_TYPES;

  if (!allowed.includes(mime)) {
    return res.status(400).json({
      error: allowVideo
        ? "僅支援 JPG、PNG、WebP、GIF、MP4、WebM"
        : "僅支援 JPG、PNG、WebP、GIF",
    });
  }

  try {
    const buffer = bufferFromBase64(payload);
    const maxBytes = mime.startsWith("video/")
      ? 20 * 1024 * 1024
      : 4 * 1024 * 1024;
    if (buffer.length > maxBytes) {
      return res.status(400).json({
        error: mime.startsWith("video/")
          ? "影片超過 20MB 限制"
          : "圖片超過 4MB 限制",
      });
    }

    const folderPath = subfolder
      ? `${folder}/${String(subfolder).replace(/[^a-zA-Z0-9_-]/g, "")}`
      : folder;

    const key = buildObjectKey(
      folderPath,
      fileName,
      mime.startsWith("video/") ? "mp4" : "jpg",
    );

    const { url, key: storedKey } = await uploadToR2({
      key,
      body: buffer,
      contentType: mime,
    });

    return res.status(200).json({ url, key: storedKey });
  } catch (err) {
    console.error("R2 media upload error:", err);
    return res.status(500).json({ error: err.message || "上傳失敗" });
  }
}
