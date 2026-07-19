import webpush from "web-push";
import { createClient } from "@supabase/supabase-js";

/**
 * Web Push（PWA 推播）伺服器端工具
 *
 * 需要的環境變數：
 * - NEXT_PUBLIC_VAPID_PUBLIC_KEY：前端訂閱用的公鑰
 * - VAPID_PRIVATE_KEY：伺服器簽章用的私鑰（勿外流）
 * - VAPID_SUBJECT：聯絡方式（mailto: 或網站 URL）
 */

let _configured = false;
function ensureConfigured() {
  if (_configured) return true;
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey) return false;
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || "https://www.pikfun.com.tw",
    publicKey,
    privateKey,
  );
  _configured = true;
  return true;
}

let _supabase = null;
function getSupabase() {
  if (_supabase) return _supabase;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  _supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return _supabase;
}

export function isWebPushEnabled() {
  return ensureConfigured();
}

/**
 * 推播給單一訂閱；訂閱已失效（404/410）時自動從資料庫移除。
 * @returns {Promise<boolean>} 是否成功送出
 */
export async function sendToSubscription(sub, payload) {
  if (!ensureConfigured()) return false;
  try {
    await webpush.sendNotification(
      {
        endpoint: sub.endpoint,
        keys: { p256dh: sub.p256dh, auth: sub.auth },
      },
      JSON.stringify(payload),
    );
    return true;
  } catch (e) {
    if (e.statusCode === 404 || e.statusCode === 410) {
      const supabase = getSupabase();
      if (supabase) {
        await supabase
          .from("push_subscriptions")
          .delete()
          .eq("endpoint", sub.endpoint);
      }
    } else {
      console.error("[webPush] send error:", e.statusCode, e.message);
    }
    return false;
  }
}

/**
 * 推播給某會員的所有裝置。
 * @returns {Promise<number>} 成功送出的裝置數
 */
export async function sendWebPushToEmail(email, payload) {
  if (!ensureConfigured() || !email) return 0;
  const supabase = getSupabase();
  if (!supabase) return 0;

  const { data: subs, error } = await supabase
    .from("push_subscriptions")
    .select("endpoint, p256dh, auth")
    .eq("customer_email", String(email).trim().toLowerCase());

  if (error || !subs?.length) return 0;

  const results = await Promise.all(
    subs.map((sub) => sendToSubscription(sub, payload)),
  );
  return results.filter(Boolean).length;
}

/**
 * 取得目前推播訂閱概況（管理後台使用）。
 */
export async function getWebPushStats() {
  const supabase = getSupabase();
  if (!supabase) return { devices: 0, members: 0 };

  const { data, error } = await supabase
    .from("push_subscriptions")
    .select("customer_email");
  if (error) throw error;

  const members = new Set(
    (data || [])
      .map((row) => String(row.customer_email || "").trim().toLowerCase())
      .filter(Boolean),
  );
  return { devices: (data || []).length, members: members.size };
}

/**
 * 推播給所有已訂閱裝置。分頁讀取、分批發送，避免一次開啟過多連線。
 */
export async function sendWebPushBroadcast(payload) {
  if (!ensureConfigured()) {
    throw new Error("VAPID 金鑰未設定");
  }
  const supabase = getSupabase();
  if (!supabase) throw new Error("Supabase 尚未設定");

  const pageSize = 500;
  const batchSize = 25;
  let offset = 0;
  let total = 0;
  let sent = 0;

  while (true) {
    const { data: subs, error } = await supabase
      .from("push_subscriptions")
      .select("endpoint, p256dh, auth")
      .range(offset, offset + pageSize - 1);
    if (error) throw error;
    if (!subs?.length) break;

    total += subs.length;
    for (let i = 0; i < subs.length; i += batchSize) {
      const results = await Promise.all(
        subs
          .slice(i, i + batchSize)
          .map((sub) => sendToSubscription(sub, payload)),
      );
      sent += results.filter(Boolean).length;
    }

    if (subs.length < pageSize) break;
    offset += pageSize;
  }

  return { total, sent, failed: total - sent };
}
