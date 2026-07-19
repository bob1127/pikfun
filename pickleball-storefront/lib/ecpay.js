// 綠界（ECPay）全方位金流 AioCheckOut 伺服器端工具
// 尚未申請正式帳號前，預設使用綠界官方公開的「測試環境」商店資訊，
// 正式上線時只要在環境變數設定 ECPAY_MERCHANT_ID / ECPAY_HASH_KEY / ECPAY_HASH_IV
// 並將 ECPAY_STAGE 設為 "false" 即可切換到正式環境。
import crypto from "crypto";

const IS_STAGE = process.env.ECPAY_STAGE !== "false";

// 綠界官方測試商店（文件公開之測試金鑰，僅能用於 payment-stage 測試環境）
const TEST_MERCHANT_ID = "3002607";
const TEST_HASH_KEY = "pwFHCqoQZGmho4w6";
const TEST_HASH_IV = "EkRm7iFT261dpevs";

export const ECPAY_MERCHANT_ID =
  process.env.ECPAY_MERCHANT_ID || TEST_MERCHANT_ID;
const HASH_KEY = process.env.ECPAY_HASH_KEY || TEST_HASH_KEY;
const HASH_IV = process.env.ECPAY_HASH_IV || TEST_HASH_IV;

export const ECPAY_CHECKOUT_URL = IS_STAGE
  ? "https://payment-stage.ecpay.com.tw/Cashier/AioCheckOut/V5"
  : "https://payment.ecpay.com.tw/Cashier/AioCheckOut/V5";

// 綠界物流「超商電子地圖」（選擇取貨門市用，不需 CheckMacValue）
// 測試環境使用綠界官方物流測試商店 2000933（C2C）
export const ECPAY_LOGISTICS_MAP_URL = IS_STAGE
  ? "https://logistics-stage.ecpay.com.tw/Express/map"
  : "https://logistics.ecpay.com.tw/Express/map";

export const ECPAY_LOGISTICS_MERCHANT_ID =
  process.env.ECPAY_LOGISTICS_MERCHANT_ID || "2000933";

// 綠界規範的 .NET 風格 URL encode
// encodeURIComponent 已保留 - _ . ! * ( )，僅需補上空白、~、' 的差異
function ecpayUrlEncode(value) {
  return encodeURIComponent(value)
    .replace(/%20/g, "+")
    .replace(/~/g, "%7e")
    .replace(/'/g, "%27");
}

// 依綠界規範計算 CheckMacValue（SHA256）
export function generateCheckMacValue(params) {
  const sortedKeys = Object.keys(params)
    .filter((k) => k !== "CheckMacValue")
    .sort((a, b) => a.localeCompare(b, "en", { sensitivity: "base" }));

  const query = sortedKeys.map((k) => `${k}=${params[k]}`).join("&");
  const raw = `HashKey=${HASH_KEY}&${query}&HashIV=${HASH_IV}`;
  const encoded = ecpayUrlEncode(raw).toLowerCase();

  return crypto.createHash("sha256").update(encoded).digest("hex").toUpperCase();
}

// 驗證綠界回傳資料的 CheckMacValue
export function verifyCheckMacValue(body) {
  const received = body?.CheckMacValue;
  if (!received) return false;
  const expected = generateCheckMacValue(body);
  return expected === String(received).toUpperCase();
}

// 產生訂單編號（綠界限制 20 碼英數字，需唯一）
export function generateMerchantTradeNo() {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `PF${ts}${rand}`.slice(0, 20);
}

// 綠界要求的時間格式：yyyy/MM/dd HH:mm:ss（台北時間）
export function formatMerchantTradeDate(date = new Date()) {
  const parts = new Intl.DateTimeFormat("zh-TW", {
    timeZone: "Asia/Taipei",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(date);
  const get = (type) => parts.find((p) => p.type === type)?.value || "00";
  return `${get("year")}/${get("month")}/${get("day")} ${get("hour")}:${get("minute")}:${get("second")}`;
}

/**
 * 組出送往綠界 AioCheckOut 的完整參數（含 CheckMacValue）
 * @param {Object} options
 * @param {number} options.totalAmount 訂單總金額（新台幣整數）
 * @param {string} options.itemName 商品名稱（多項以 # 分隔）
 * @param {string} options.choosePayment "Credit" | "ATM" | "ALL"
 * @param {string} options.returnUrl 伺服器端付款結果通知網址
 * @param {string} [options.orderResultUrl] 付款完成後導回的網址（POST）
 * @param {string} [options.clientBackUrl] 綠界頁面「返回商店」的網址
 * @param {string} [options.customField1] 自訂欄位（放 Medusa cart id）
 * @param {string} [options.merchantTradeNo] 自訂訂單編號
 */
export function buildCheckoutParams({
  totalAmount,
  itemName,
  choosePayment = "ALL",
  returnUrl,
  orderResultUrl,
  clientBackUrl,
  customField1 = "",
  merchantTradeNo,
}) {
  const params = {
    MerchantID: ECPAY_MERCHANT_ID,
    MerchantTradeNo: merchantTradeNo || generateMerchantTradeNo(),
    MerchantTradeDate: formatMerchantTradeDate(),
    PaymentType: "aio",
    TotalAmount: String(Math.max(1, Math.round(totalAmount))),
    TradeDesc: "PikFun Order",
    ItemName: String(itemName || "PikFun 商品").slice(0, 390),
    ReturnURL: returnUrl,
    ChoosePayment: choosePayment,
    EncryptType: "1",
    CustomField1: customField1,
  };

  if (orderResultUrl) params.OrderResultURL = orderResultUrl;
  if (clientBackUrl) params.ClientBackURL = clientBackUrl;
  if (choosePayment === "ATM") {
    params.ExpireDate = "3"; // ATM 虛擬帳號繳費期限（天）
  }

  params.CheckMacValue = generateCheckMacValue(params);
  return params;
}
