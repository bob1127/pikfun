import { DEFAULT_SITE_URL, DEFAULT_SERVICE_EMAIL } from "@/lib/siteUrl";

/** 從 HTML 內容擷取圖片 URL */
export function extractImagesFromHtml(html) {
  if (!html) return [];
  const matches = [...String(html).matchAll(/<img[^>]+src=["']([^"']+)["']/gi)];
  return [...new Set(matches.map((m) => m[1]))];
}

/** 長日期格式，依語系切換：zh-TW「2026年6月3日 09時10分」／en「June 3, 2026 09:10」 */
export function formatWpDateLong(iso, locale = "zh-TW") {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";

  if (locale === "en") {
    const datePart = d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    const h = String(d.getHours()).padStart(2, "0");
    const min = String(d.getMinutes()).padStart(2, "0");
    return `${datePart} ${h}:${min}`;
  }

  const h = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日 ${h}時${min}分`;
}

/** 文章主題對照（依分類，依語系切換顯示文字） */
const BLOG_TOPIC_LABEL_I18N = {
  active: { "zh-TW": "球場與活動", en: "Courts & Events" },
  knowledge: { "zh-TW": "運動教學", en: "Sports Education" },
};

const DEFAULT_TOPIC_LABEL = { "zh-TW": "匹克球", en: "Pickleball" };

/** 向後相容：預設（zh-TW）主題對照 */
export const BLOG_TOPIC_LABEL = Object.fromEntries(
  Object.entries(BLOG_TOPIC_LABEL_I18N).map(([key, val]) => [key, val["zh-TW"]]),
);

export function getBlogTopicLabel(categoryKey, locale = "zh-TW") {
  const entry = BLOG_TOPIC_LABEL_I18N[categoryKey];
  if (!entry) return DEFAULT_TOPIC_LABEL[locale] || DEFAULT_TOPIC_LABEL["zh-TW"];
  return entry[locale] || entry["zh-TW"];
}

// 站點概要中僅少數欄位需依語系顯示不同文字，其餘（網址、Email、Logo）為固定值
const SITE_PROFILE_I18N_FIELDS = {
  industry: { "zh-TW": "運動休閒／匹克球", en: "Sports & Leisure / Pickleball" },
  region: { "zh-TW": "台灣", en: "Taiwan" },
  representative: { "zh-TW": "PikFun 團隊", en: "PikFun Team" },
  established: { "zh-TW": "2024年", en: "2024" },
};

/** 向後相容：預設（zh-TW）站點概要 */
export const SITE_PROFILE = {
  name: "PikFun 匹克方",
  tagline: "台灣匹克球資訊與裝備平台",
  logo: "/images/company-logo.png",
  url: DEFAULT_SITE_URL,
  contact: DEFAULT_SERVICE_EMAIL,
  followers: "1,200+",
  industry: SITE_PROFILE_I18N_FIELDS.industry["zh-TW"],
  region: SITE_PROFILE_I18N_FIELDS.region["zh-TW"],
  representative: SITE_PROFILE_I18N_FIELDS.representative["zh-TW"],
  established: SITE_PROFILE_I18N_FIELDS.established["zh-TW"],
};

/** 依語系取得站點概要（industry / region / representative / established 依語系切換） */
export function getSiteProfile(locale = "zh-TW") {
  const localized = Object.fromEntries(
    Object.entries(SITE_PROFILE_I18N_FIELDS).map(([key, byLocale]) => [
      key,
      byLocale[locale] || byLocale["zh-TW"],
    ]),
  );
  return { ...SITE_PROFILE, ...localized };
}
