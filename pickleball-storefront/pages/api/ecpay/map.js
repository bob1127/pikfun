// 產生綠界「超商電子地圖」的開啟參數
// 前端拿到後以表單 POST（新視窗）開啟門市選擇地圖
import {
  ECPAY_LOGISTICS_MAP_URL,
  ECPAY_LOGISTICS_MERCHANT_ID,
} from "@/lib/ecpay";

const SUB_TYPES = {
  FAMI: "FAMIC2C", // 全家
  UNIMART: "UNIMARTC2C", // 7-ELEVEN
  HILIFE: "HILIFEC2C", // 萊爾富
};

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

  const { subType } = req.body || {};
  const logisticsSubType = SUB_TYPES[subType];
  if (!logisticsSubType) {
    return res.status(400).json({ message: "不支援的超商類型" });
  }

  const siteUrl = getSiteUrl(req);

  return res.status(200).json({
    action: ECPAY_LOGISTICS_MAP_URL,
    params: {
      MerchantID: ECPAY_LOGISTICS_MERCHANT_ID,
      LogisticsType: "CVS",
      LogisticsSubType: logisticsSubType,
      IsCollection: "N",
      ServerReplyURL: `${siteUrl}/api/ecpay/map-reply`,
      ExtraData: subType,
      Device: "0",
    },
  });
}
