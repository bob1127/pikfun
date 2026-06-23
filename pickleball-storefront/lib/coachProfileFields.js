import { pinyin } from "pinyin-pro";

export const COACH_REGIONS = [
  { value: "北部", label: "北部" },
  { value: "中部", label: "中部" },
  { value: "南部", label: "南部" },
  { value: "東部", label: "東部" },
  { value: "離島", label: "離島" },
];

export const CREDENTIAL_PRESETS = [
  "PPR 認證教練",
  "體育署合格教練",
  "運動科學背景",
  "運動防護基礎證照",
  "協會特約教練",
  "5 年以上教學經驗",
  "競賽選手經歷",
  "國家級運動員",
];

export const SPECIALTY_PRESETS = [
  "新手入門",
  "雙打策略",
  "網前短球",
  "第三拍",
  "發球接發",
  "動作矯正",
  "比賽心理",
  "女性專班",
  "銀髮族",
  "青少年",
  "親子班",
  "私人課",
];

export const TAG_PRESETS = [
  "初學入門",
  "團體班",
  "私人課",
  "主題班",
  "新手班",
  "女性專班",
  "銀髮族",
  "比賽準備",
  "雙打",
  "室內",
  "室外",
  "週末班",
];

const CJK_RE = /[\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff]/;

function romanizeForSlug(text) {
  const raw = String(text || "");
  if (!raw) return "";
  if (!CJK_RE.test(raw)) return raw;
  return pinyin(raw, { toneType: "none", nonZh: "consecutive" });
}

/** 送出前正規化：中文轉拼音、去除非法字元、整理首尾與連續分隔符 */
function toAsciiSlug(text) {
  return String(text || "")
    .trim()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9_-]+/g, "")
    .replace(/[-_]{2,}/g, (m) => m[0])
    .replace(/^[-_]+|[-_]+$/g, "")
    .slice(0, 48);
}

/** 教練網址代稱：中文轉拼音，僅保留 a-z、0-9、-、_ */
export function slugify(text) {
  return toAsciiSlug(romanizeForSlug(text));
}

/** 輸入時清理：過濾中文與非法符號，保留 - _ 且不在打字時刪掉尾端分隔符 */
export function sanitizeSlugInput(text) {
  return romanizeForSlug(String(text || ""))
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9_-]/g, "")
    .slice(0, 48);
}

export function isValidSlug(slug) {
  if (!slug || slug.length < 2) return false;
  return /^[a-z0-9]+([_-][a-z0-9]+)*$/.test(slug);
}

/** 輸入過程中的寬鬆檢查（允許尾端尚未完成的 - 或 _） */
export function isValidSlugDraft(slug) {
  if (!slug || slug.length < 2) return false;
  return /^[a-z0-9]+([_-][a-z0-9]+)*[_-]?$/.test(slug);
}

export function slugifyFromName(name) {
  return slugify(name);
}

export function linesToArray(text) {
  return String(text || "")
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
}

export function commaToArray(text) {
  return String(text || "")
    .split(/[,，、]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function toggleLineItem(text, item) {
  const lines = linesToArray(text);
  const idx = lines.indexOf(item);
  if (idx >= 0) lines.splice(idx, 1);
  else lines.push(item);
  return lines.join("\n");
}

export function toggleCommaItem(text, item) {
  const items = commaToArray(text);
  const idx = items.indexOf(item);
  if (idx >= 0) items.splice(idx, 1);
  else items.push(item);
  return items.join("、");
}

export function hasLineItem(text, item) {
  return linesToArray(text).includes(item);
}

export function hasCommaItem(text, item) {
  return commaToArray(text).includes(item);
}

export function dbRowToCoach(row) {
  if (!row) return null;
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    title: row.title,
    subtitle: row.subtitle,
    avatar: row.avatar,
    cover_image: row.cover_image,
    video_url: row.video_url,
    featured_label: row.featured_label,
    city: row.city,
    region: row.region,
    tags: row.tags || [],
    excerpt: row.excerpt,
    bio: row.bio,
    bio_html: row.bio_html,
    story: row.story,
    story_html: row.story_html,
    credentials: row.credentials || [],
    specialties: row.specialties || [],
    email: row.email || row.contact_email,
    instagram: row.instagram,
    instagram_embed_urls: row.instagram_embed_urls || [],
    is_featured: row.is_featured !== false,
    sort_order: row.sort_order ?? 99,
    published_at: row.published_at,
    member_id: row.member_id,
    applicant_email: row.applicant_email,
  };
}
