// 綠界伺服器端付款結果通知（ReturnURL）
// 綠界會以 application/x-www-form-urlencoded POST 付款結果，
// 驗證 CheckMacValue 成功後必須回覆 "1|OK"，否則綠界會重試通知。
import { verifyCheckMacValue } from "@/lib/ecpay";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).send("0|Method Not Allowed");
  }

  const body = req.body || {};

  if (!verifyCheckMacValue(body)) {
    console.error("❌ ECPay notify CheckMacValue 驗證失敗:", body);
    return res.status(400).send("0|CheckMacValue Error");
  }

  const {
    MerchantTradeNo,
    RtnCode,
    RtnMsg,
    TradeAmt,
    PaymentType,
    PaymentDate,
    CustomField1: cartId,
  } = body;

  // RtnCode === "1" 代表付款成功；ATM 取號成功會是 "2"（此時尚未付款）
  if (String(RtnCode) === "1") {
    console.log(
      `✅ ECPay 付款成功 訂單=${MerchantTradeNo} 金額=${TradeAmt} 方式=${PaymentType} 時間=${PaymentDate} cart=${cartId}`,
    );
    // TODO: 正式申請綠界並確定訂單系統對接方式後，
    // 在此將 Medusa cart（cartId）完成為正式訂單並寄送通知信。
  } else {
    console.log(
      `ℹ️ ECPay 通知 訂單=${MerchantTradeNo} RtnCode=${RtnCode} ${RtnMsg} cart=${cartId}`,
    );
  }

  return res.status(200).send("1|OK");
}
