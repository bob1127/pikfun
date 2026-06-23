/** 從 HTML 內容擷取圖片 URL */
export function extractImagesFromHtml(html) {
  if (!html) return [];
  const matches = [...String(html).matchAll(/<img[^>]+src=["']([^"']+)["']/gi)];
  return [...new Set(matches.map((m) => m[1]))];
}

/** PR TIMES 風格長日期：2026年6月3日 09時10分 */
export function formatWpDateLong(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const h = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日 ${h}時${min}分`;
}

/** 文章主題對照（依分類） */
export const BLOG_TOPIC_LABEL = {
  active: "球場與活動",
  knowledge: "運動教學",
};

/** PikPie 站點資訊（会社概要區塊） */
export const SITE_PROFILE = {
  name: "PikFun 匹克方",
  tagline: "台灣匹克球資訊與裝備平台",
  logo: "/images/company-logo.png",
  url: "https://www.PikFuncom.tw",
  industry: "運動休閒／匹克球",
  region: "台灣",
  contact: "service@PikFuncom.tw",
  representative: "PikPie 團隊",
  established: "2024年",
  followers: "1,200+",
};
