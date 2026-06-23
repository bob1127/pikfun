import { createClient } from "@supabase/supabase-js";
import { assertCoachOwner } from "@/lib/coachOwnerAuth";
import {
  COACH_MEDIA_LIMITS,
  COACH_MEDIA_BUCKET,
} from "@/lib/coachMediaLimits";
import {
  getCoachMediaUsage,
  registerCoachMediaAsset,
} from "@/lib/coachMediaAssets";

export const config = {
  api: { bodyParser: { sizeLimit: "35mb" } },
};

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("Supabase 未設定");
  return createClient(url, key);
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const {
    slug,
    email,
    member_id: memberId,
    fileBase64,
    fileName,
    contentType,
    mediaType,
  } = req.body;

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

    const supabase = getSupabase();
    const base64Data = fileBase64.replace(/^data:[^;]+;base64,/, "");
    const buffer = Buffer.from(base64Data, "base64");

    if (buffer.length > limits.maxFileBytes) {
      return res.status(400).json({
        error: `${limits.label}超過 ${Math.round(limits.maxFileBytes / 1024 / 1024)}MB 限制`,
      });
    }

    const ext = (fileName?.split(".").pop() || (type === "video" ? "mp4" : "jpg"))
      .replace(/[^a-z0-9]/gi, "")
      .toLowerCase();
    const path = `${slug}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from(COACH_MEDIA_BUCKET)
      .upload(path, buffer, { contentType, upsert: false });

    if (uploadError) {
      const isRls =
        uploadError.message?.includes("row-level security") ||
        uploadError.message?.includes("RLS");
      return res.status(500).json({
        error: isRls
          ? "上傳失敗：請在 Supabase 執行 supabase/coach_profile_editor.sql，或設定 SUPABASE_SERVICE_ROLE_KEY"
          : `上傳失敗：${uploadError.message}`,
      });
    }

    const { data: urlData } = supabase.storage
      .from(COACH_MEDIA_BUCKET)
      .getPublicUrl(path);

    await registerCoachMediaAsset({
      coachId: coachRow.id,
      slug,
      mediaType: type,
      filePath: path,
      publicUrl: urlData.publicUrl,
      byteSize: buffer.length,
    });

    const newUsage = await getCoachMediaUsage(coachRow.id);

    return res.status(200).json({
      url: urlData.publicUrl,
      mediaType: type,
      usage: newUsage,
    });
  } catch (err) {
    const status = err.status || 500;
    return res.status(status).json({ error: err.message || "上傳失敗" });
  }
}
