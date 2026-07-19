// 綠界付款完成後，消費者瀏覽器 POST 導回的端點（OrderResultURL）
// 驗證結果後導向成功或失敗頁
import { verifyCheckMacValue } from "@/lib/ecpay";

export default function handler(req, res) {
  if (req.method !== "POST") {
    return res.redirect(302, "/");
  }

  const body = req.body || {};
  const valid = verifyCheckMacValue(body);
  const rtnCode = String(body.RtnCode || "");

  // RtnCode 1 = 付款成功；2 = ATM 取號成功（等待轉帳）
  if (valid && (rtnCode === "1" || rtnCode === "2")) {
    return res.redirect(302, "/checkout/success");
  }

  console.error("❌ ECPay result 導回失敗:", {
    valid,
    rtnCode,
    msg: body.RtnMsg,
  });
  return res.redirect(302, "/checkout/failed");
}
