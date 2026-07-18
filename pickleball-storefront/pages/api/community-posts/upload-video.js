import {
  bufferFromBase64,
  buildObjectKey,
  isR2Configured,
  uploadToR2,
} from "@/lib/r2";

const MAX_VIDEO_BYTES = 25 * 1024 * 1024;
const ALLOWED_TYPES = {
  "video/mp4": "mp4",
  "video/webm": "webm",
  "video/quicktime": "mov",
};

// Base64 約增加 33%，先由 Next body parser 擋掉明顯超限的請求。
export const config = {
  api: { bodyParser: { sizeLimit: "35mb" } },
};

function matchesSignature(buffer, mime) {
  if (mime === "video/webm") {
    return (
      buffer.length >= 4 &&
      buffer[0] === 0x1a &&
      buffer[1] === 0x45 &&
      buffer[2] === 0xdf &&
      buffer[3] === 0xa3
    );
  }

  // MP4 / MOV 都是 ISO Base Media File Format，位元 4–7 應為 ftyp。
  return buffer.length >= 12 && buffer.subarray(4, 8).toString() === "ftyp";
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!isR2Configured()) {
    return res.status(500).json({ error: "R2 尚未設定，無法上傳影片" });
  }

  const { videoBase64, fileName, contentType } = req.body || {};
  const extension = ALLOWED_TYPES[contentType];
  if (!videoBase64 || !extension) {
    return res.status(400).json({
      error: "僅支援 MP4、WebM、MOV 影片",
    });
  }

  try {
    const buffer = bufferFromBase64(videoBase64);

    // 這是伺服器端實際解碼後的大小，無法靠修改前端 file.size 繞過。
    if (buffer.length > MAX_VIDEO_BYTES) {
      return res.status(413).json({ error: "影片超過 25MB 限制" });
    }
    if (buffer.length < 12 || !matchesSignature(buffer, contentType)) {
      return res.status(400).json({ error: "影片格式或檔案內容不正確" });
    }

    const key = buildObjectKey("community-posts/videos", fileName, extension);
    const { url } = await uploadToR2({
      key,
      body: buffer,
      contentType,
    });
    return res.status(200).json({ url, maxBytes: MAX_VIDEO_BYTES });
  } catch (err) {
    console.error("community post video upload error:", err);
    return res.status(500).json({ error: err.message || "影片上傳失敗" });
  }
}
