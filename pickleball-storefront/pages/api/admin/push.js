import { getMedusaCustomer } from "@/lib/medusaCustomerAuth";
import { isAdminEmail } from "@/lib/adminAuth";
import {
  getWebPushStats,
  isWebPushEnabled,
  sendWebPushBroadcast,
  sendWebPushToEmail,
} from "@/lib/webPush";

async function requireAdmin(req, res) {
  try {
    const customer = await getMedusaCustomer(req);
    if (!isAdminEmail(customer.email)) {
      res.status(403).json({ error: "無管理員權限" });
      return null;
    }
    return customer;
  } catch (error) {
    res.status(error.status || 401).json({ error: "請先以管理員帳號登入" });
    return null;
  }
}

function normalizeInternalUrl(value) {
  const url = String(value || "/").trim() || "/";
  // 防止手動推播被拿來製作外部釣魚連結
  if (!url.startsWith("/") || url.startsWith("//")) return null;
  return url.slice(0, 500);
}

export default async function handler(req, res) {
  const admin = await requireAdmin(req, res);
  if (!admin) return;

  if (!isWebPushEnabled()) {
    return res.status(503).json({ error: "VAPID 推播金鑰尚未設定" });
  }

  if (req.method === "GET") {
    try {
      const stats = await getWebPushStats();
      return res.status(200).json({ ok: true, stats });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const {
    title,
    body,
    url,
    audience = "all",
    target_email: targetEmail,
  } = req.body || {};
  const cleanTitle = String(title || "").trim();
  const cleanBody = String(body || "").trim();
  const cleanUrl = normalizeInternalUrl(url);

  if (!cleanTitle || !cleanBody) {
    return res.status(400).json({ error: "請輸入推播標題與內容" });
  }
  if (cleanTitle.length > 80 || cleanBody.length > 300) {
    return res.status(400).json({ error: "標題最多 80 字，內容最多 300 字" });
  }
  if (!cleanUrl) {
    return res.status(400).json({ error: "點擊網址只能使用站內路徑" });
  }

  const payload = {
    title: cleanTitle,
    body: cleanBody,
    url: cleanUrl,
    tag: `admin-${Date.now()}`,
  };

  try {
    let result;
    if (audience === "email") {
      const email = String(targetEmail || "").trim().toLowerCase();
      if (!email || !email.includes("@")) {
        return res.status(400).json({ error: "請輸入有效的指定會員 Email" });
      }
      const sent = await sendWebPushToEmail(email, payload);
      result = { total: sent, sent, failed: 0, target_email: email };
    } else {
      result = await sendWebPushBroadcast(payload);
    }

    console.info(
      `[admin/push] ${admin.email} sent "${cleanTitle}" audience=${audience} sent=${result.sent}`,
    );
    return res.status(200).json({ ok: true, result });
  } catch (error) {
    console.error("[admin/push]", error);
    return res.status(500).json({ error: error.message || "推播發送失敗" });
  }
}
