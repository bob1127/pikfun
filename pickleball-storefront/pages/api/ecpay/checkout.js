// 建立綠界付款參數：前端拿到後以表單 POST 導向綠界付款頁
import {
  buildCheckoutParams,
  ECPAY_CHECKOUT_URL,
} from "@/lib/ecpay";

function getSiteUrl(req) {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  const proto = req.headers["x-forwarded-proto"] || "http";
  const host = req.headers["x-forwarded-host"] || req.headers.host;
  return `${proto}://${host}`;
}

export default function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { amount, itemName, cartId, paymentType } = req.body || {};

  const totalAmount = Number(amount);
  if (!Number.isFinite(totalAmount) || totalAmount < 1) {
    return res.status(400).json({ message: "金額不正確" });
  }

  const choosePayment =
    paymentType === "ATM" ? "ATM" : paymentType === "Credit" ? "Credit" : "ALL";

  const siteUrl = getSiteUrl(req);

  try {
    const params = buildCheckoutParams({
      totalAmount,
      itemName,
      choosePayment,
      // 綠界伺服器端付款結果通知（需要可由外部連到的網址，本機測試時不會收到）
      returnUrl: `${siteUrl}/api/ecpay/notify`,
      // 消費者付款完成後由瀏覽器 POST 導回
      orderResultUrl: `${siteUrl}/api/ecpay/result`,
      clientBackUrl: `${siteUrl}/checkout/failed`,
      customField1: String(cartId || ""),
    });

    return res.status(200).json({
      action: ECPAY_CHECKOUT_URL,
      params,
    });
  } catch (err) {
    console.error("❌ ECPay checkout 參數建立失敗:", err);
    return res.status(500).json({ message: "建立綠界付款參數失敗" });
  }
}
