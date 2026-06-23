import { createClient } from "@supabase/supabase-js";

export const config = {
  api: { bodyParser: { sizeLimit: "5mb" } },
};

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { imageBase64, fileName, contentType } = req.body;

  if (!imageBase64) {
    return res.status(400).json({ error: "請選擇圖片" });
  }

  const mime = contentType || "image/jpeg";
  if (!ALLOWED_TYPES.includes(mime)) {
    return res.status(400).json({ error: "僅支援 JPG、PNG、WebP、GIF" });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return res.status(500).json({ error: "Supabase 未設定" });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Data, "base64");

    if (buffer.length > 2 * 1024 * 1024) {
      return res.status(400).json({ error: "圖片超過 2MB 限制" });
    }

    const ext = (fileName?.split(".").pop() || "jpg").replace(/[^a-z0-9]/gi, "");
    const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("coach-covers")
      .upload(path, buffer, { contentType: mime, upsert: false });

    if (uploadError) {
      const isRls =
        uploadError.message?.includes("row-level security") ||
        uploadError.message?.includes("RLS");
      return res.status(500).json({
        error: isRls
          ? "上傳失敗：Storage 權限不足。請在 Supabase SQL Editor 執行 supabase/coach_covers_storage.sql，或在 .env.local 設定 SUPABASE_SERVICE_ROLE_KEY 後重啟 dev server。"
          : `上傳失敗：${uploadError.message}`,
      });
    }

    const { data } = supabase.storage.from("coach-covers").getPublicUrl(path);

    return res.status(200).json({ url: data.publicUrl });
  } catch (err) {
    console.error("coach cover upload error:", err);
    return res.status(500).json({ error: err.message || "上傳失敗" });
  }
}
