import { createClient } from "@supabase/supabase-js";
import { getMedusaCustomer } from "@/lib/medusaCustomerAuth";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);

/**
 * POST   儲存（或更新）此瀏覽器的推播訂閱；有登入就綁定會員 email
 * DELETE 取消此瀏覽器的推播訂閱
 */
export default async function handler(req, res) {
  if (req.method === "POST") {
    const { subscription } = req.body || {};
    const endpoint = subscription?.endpoint;
    const p256dh = subscription?.keys?.p256dh;
    const auth = subscription?.keys?.auth;

    if (!endpoint || !p256dh || !auth) {
      return res.status(400).json({ error: "訂閱資料不完整" });
    }

    // 有帶登入 token 就綁定 email（提醒通知需要），沒有也允許訂閱
    let email = null;
    if (req.headers.authorization) {
      try {
        const customer = await getMedusaCustomer(req);
        email = customer.email;
      } catch {
        /* token 失效不擋訂閱 */
      }
    }

    const { error } = await supabase.from("push_subscriptions").upsert(
      {
        endpoint,
        p256dh,
        auth,
        customer_email: email,
        user_agent: String(req.headers["user-agent"] || "").slice(0, 300),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "endpoint" },
    );

    if (error) {
      console.error("[push/subscribe]", error.message);
      return res.status(500).json({ error: "儲存訂閱失敗" });
    }
    return res.status(200).json({ ok: true, bound_email: email });
  }

  if (req.method === "DELETE") {
    const { endpoint } = req.body || {};
    if (!endpoint) return res.status(400).json({ error: "缺少 endpoint" });

    await supabase.from("push_subscriptions").delete().eq("endpoint", endpoint);
    return res.status(200).json({ ok: true });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
