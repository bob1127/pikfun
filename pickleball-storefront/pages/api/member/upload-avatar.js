import {
  bufferFromBase64,
  buildObjectKey,
  isR2Configured,
  uploadToR2,
} from "@/lib/r2";

export const config = {
  api: { bodyParser: { sizeLimit: "5mb" } },
};

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { imageBase64, fileName, token } = req.body || {};

  if (!imageBase64 || !token) {
    return res.status(400).json({ error: "資料不完整" });
  }

  if (!isR2Configured()) {
    return res.status(500).json({
      error:
        "R2 尚未設定：請在 .env.local 填入 R2_* 變數（見 DEPLOYMENT.md）",
    });
  }

  try {
    const buffer = bufferFromBase64(imageBase64);
    const key = buildObjectKey(
      "avatars",
      fileName || `avatar-${Date.now()}.jpg`,
      "jpg",
    );

    const { url: newAvatarUrl } = await uploadToR2({
      key,
      body: buffer,
      contentType: "image/jpeg",
    });

    const BACKEND_URL =
      process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000";
    const API_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY;

    const meRes = await fetch(`${BACKEND_URL}/store/customers/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "x-publishable-api-key": API_KEY,
      },
    });
    const meData = await meRes.json();
    const currentMetadata = meData.customer?.metadata || {};

    const updateRes = await fetch(`${BACKEND_URL}/store/customers/me`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        "x-publishable-api-key": API_KEY,
      },
      body: JSON.stringify({
        metadata: {
          ...currentMetadata,
          avatar_url: newAvatarUrl,
        },
      }),
    });

    if (!updateRes.ok) throw new Error("無法更新 Medusa 顧客資料");

    res.status(200).json({ url: newAvatarUrl });
  } catch (error) {
    console.error("更換大頭貼流程失敗:", error);
    res.status(500).json({ error: error.message || "伺服器處理失敗" });
  }
}
