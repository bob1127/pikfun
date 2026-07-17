import { assertCoachOwner } from "@/lib/coachOwnerAuth";
import {
  COACH_MEDIA_LIMITS,
} from "@/lib/coachMediaLimits";
import {
  getCoachMediaUsage,
  registerCoachMediaAsset,
} from "@/lib/coachMediaAssets";
import {
  bufferFromBase64,
  buildObjectKey,
  isR2Configured,
  uploadToR2,
} from "@/lib/r2";

export const config = {
  api: { bodyParser: { sizeLimit: "35mb" } },
};

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

  const {
    slug,
    email,
    member_id: memberId,
    fileBase64,
    fileName,
    contentType,
    mediaType,
  } = req.body || {};

  if (!slug || !email || !fileBase64 || !mediaType) {
    return res.status(400).json({ error: "缺少必要參數" });
  }

  const type = mediaType === "video" ? "video" : "image";
  const limits = COACH_MEDIA_LIMITS[type];

  if (!limits.allowedTypes.includes(contentType)) {
    return res.status(400).json({
      error: `${limits.label}格式不支援`,
    });
  }

  try {
    const coachRow = await assertCoachOwner(slug, { email, memberId });
    const usage = await getCoachMediaUsage(coachRow.id);

    if (usage[type].count >= limits.maxCount) {
      return res.status(400).json({
        error: `${limits.label}已達上限（${limits.maxCount} 個）`,
        usage,
        limits: COACH_MEDIA_LIMITS,
      });
    }

    const buffer = bufferFromBase64(fileBase64);

    if (buffer.length > limits.maxFileBytes) {
      return res.status(400).json({
        error: `${limits.label}超過 ${Math.round(limits.maxFileBytes / 1024 / 1024)}MB 限制`,
      });
    }

    const key = buildObjectKey(
      `coach-media/${slug}`,
      fileName,
      type === "video" ? "mp4" : "jpg",
    );

    const { url, key: storedKey } = await uploadToR2({
      key,
      body: buffer,
      contentType,
    });

    await registerCoachMediaAsset({
      coachId: coachRow.id,
      slug,
      mediaType: type,
      filePath: storedKey,
      publicUrl: url,
      byteSize: buffer.length,
    });

    const newUsage = await getCoachMediaUsage(coachRow.id);

    return res.status(200).json({
      url,
      mediaType: type,
      usage: newUsage,
    });
  } catch (err) {
    const status = err.status || 500;
    return res.status(status).json({ error: err.message || "上傳失敗" });
  }
}
