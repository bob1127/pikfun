/** 聯絡我們頁 — 與全站藍色系 (#005caf) 一致 */
import { DEFAULT_CONTACT_EMAIL, DEFAULT_SERVICE_EMAIL } from "@/lib/siteUrl";

export const CONTACT_UI = {
  primary: "#005caf",
  primaryDark: "#1a3a8a",
  accent: "#005caf",
  text: "#0f2a4a",
  bg: "#eef1f6",
  formBg: "#f5f7fa",
  /** 內容區最大寬度（px）；同時用 style 鎖定，避免 Tailwind 動態 class 失效 */
  contentMaxPx: 960,
};

export const CONTACT_INFO = {
  email: DEFAULT_CONTACT_EMAIL,
  serviceEmail: DEFAULT_SERVICE_EMAIL,
  phoneDisplay: "請以 Email / LINE 聯繫",
  phoneTel: `mailto:${DEFAULT_CONTACT_EMAIL}`,
  lineUrl: "https://line.me/",
  lineLabel: "LINE 官方",
};

export const CONTACT_TABS = [
  { id: "general", label: "一般聯絡", step: "01" },
  { id: "consignment", label: "寄賣／銷售合作", step: "02" },
  { id: "marketing", label: "球場・教練行銷", step: "03" },
];

export const GENERAL_CATEGORIES = [
  { value: "product", label: "商品／球拍裝備諮詢" },
  { value: "order", label: "訂單／出貨／售後" },
  { value: "play", label: "揪團打球相關" },
  { value: "coaching", label: "教練開課相關" },
  { value: "other", label: "其他" },
];

export const CONSIGNMENT_TYPES = [
  { value: "consign", label: "球拍／運動用品寄賣" },
  { value: "resale", label: "經銷／批發銷售合作" },
  { value: "brand", label: "品牌／通路入駐" },
  { value: "other", label: "其他銷售合作" },
];

export const MARKETING_ROLES = [
  { value: "court_owner", label: "球場主／場地營運" },
  { value: "coach", label: "教練／教練團隊" },
  { value: "both", label: "球場主兼教練" },
  { value: "other", label: "其他行銷合作" },
];

export const MARKETING_NEEDS = [
  { value: "court_website", label: "球場官網／預約系統建置" },
  { value: "coach_page", label: "教練個人頁面／形象頁" },
  { value: "site_promo", label: "於 PikFun 放置行銷素材／宣傳" },
  { value: "event", label: "賽事／活動聯合宣傳" },
  { value: "ads", label: "廣告／贊助方案" },
  { value: "other", label: "其他（請於說明填寫）" },
];
