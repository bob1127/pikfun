import { getMedusaCustomer } from "@/lib/medusaCustomerAuth";
import { sendWebPushToEmail, isWebPushEnabled } from "@/lib/webPush";

/** 對登入會員自己的所有裝置發一則測試推播 */
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  if (!isWebPushEnabled()) {
    return res.status(500).json({ error: "VAPID 金鑰未設定" });
  }

  try {
    const customer = await getMedusaCustomer(req);
    const sent = await sendWebPushToEmail(customer.email, {
      title: "PikFun 推播測試",
      body: "看到這則通知代表推播設定成功。",
      url: "/",
      tag: "push-test",
    });
    return res.status(200).json({ ok: true, sent });
  } catch (e) {
    return res.status(e.status || 500).json({ error: e.message });
  }
}
