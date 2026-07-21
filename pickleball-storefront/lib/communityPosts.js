import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);

export const communitySupabase = supabase;

// 角色與分類的顯示用文字（依語系切換），儲存值（key）維持不變，不影響資料庫與篩選邏輯
const AUTHOR_ROLE_LABEL_I18N = {
  coach: { "zh-TW": "教練", en: "Coach" },
  court_owner: { "zh-TW": "球場主", en: "Court Owner" },
  organizer: { "zh-TW": "活動主揪", en: "Organizer" },
  individual: { "zh-TW": "個人投稿者", en: "Individual Contributor" },
};

const DEFAULT_AUTHOR_ROLE_LABEL = { "zh-TW": "PikFun 夥伴", en: "PikFun Partner" };

/** 向後相容：預設（zh-TW）角色顯示文字 */
export const AUTHOR_ROLE_LABEL = Object.fromEntries(
  Object.entries(AUTHOR_ROLE_LABEL_I18N).map(([key, val]) => [key, val["zh-TW"]]),
);

export function getAuthorRoleLabel(role, locale = "zh-TW") {
  const entry = AUTHOR_ROLE_LABEL_I18N[role];
  if (!entry) return DEFAULT_AUTHOR_ROLE_LABEL[locale] || DEFAULT_AUTHOR_ROLE_LABEL["zh-TW"];
  return entry[locale] || entry["zh-TW"];
}

const CATEGORY_LABEL_I18N = {
  active: { "zh-TW": "揪團／臨打", en: "Group Play / Drop-in" },
  event: { "zh-TW": "賽事活動", en: "Tournaments & Events" },
  knowledge: { "zh-TW": "知識攻略", en: "Tips & Guides" },
  course: { "zh-TW": "課程開課", en: "Courses & Coaching" },
};

const DEFAULT_CATEGORY_LABEL = { "zh-TW": "最新消息", en: "News" };

/** 向後相容：預設（zh-TW）分類選項，label 為字串 */
export const CATEGORY_OPTIONS = Object.entries(CATEGORY_LABEL_I18N).map(
  ([value, labelByLocale]) => ({ value, label: labelByLocale["zh-TW"] }),
);

/** 依語系取得分類選項（value 保持不變，僅 label 依語系切換） */
export function getCategoryOptions(locale = "zh-TW") {
  return Object.entries(CATEGORY_LABEL_I18N).map(([value, labelByLocale]) => ({
    value,
    label: labelByLocale[locale] || labelByLocale["zh-TW"],
  }));
}

export function categoryLabel(value, locale = "zh-TW") {
  const entry = CATEGORY_LABEL_I18N[value];
  if (!entry) return DEFAULT_CATEGORY_LABEL[locale] || DEFAULT_CATEGORY_LABEL["zh-TW"];
  return entry[locale] || entry["zh-TW"];
}

export const NEWS_SUBMISSION_TYPES = [
  { value: "event", label: "活動賽事" },
  { value: "coach", label: "教練投稿" },
  { value: "court_owner", label: "球場主投稿" },
  { value: "individual", label: "個人投稿" },
];

const NEWS_SUBMISSION_TYPE_LABEL_I18N = {
  event: { "zh-TW": "活動賽事", en: "Events" },
  coach: { "zh-TW": "教練投稿", en: "Coach Post" },
  court_owner: { "zh-TW": "球場主投稿", en: "Court Owner Post" },
  individual: { "zh-TW": "個人投稿", en: "Individual Post" },
};

export function getNewsSubmissionTypes(locale = "zh-TW") {
  return Object.entries(NEWS_SUBMISSION_TYPE_LABEL_I18N).map(
    ([value, labels]) => ({
      value,
      label: labels[locale] || labels["zh-TW"],
    }),
  );
}

/** 活動類文章優先歸入活動賽事，其餘依已驗證的作者身分分類。 */
export function getNewsSubmissionType(category, authorRole) {
  if (category === "event") return "event";
  if (authorRole === "coach") return "coach";
  if (authorRole === "court_owner") return "court_owner";
  return "individual";
}

/**
 * 解析單一 Instagram 貼文／Reels 網址。
 * @returns {{ ok: true, url: string } | { ok: false, code: string, reason: string }}
 */
export function parseInstagramPostUrl(input) {
  const trimmed = String(input || "").trim();
  if (!trimmed) {
    return {
      ok: false,
      code: "empty",
      reason: "請貼上 Instagram 貼文網址",
    };
  }

  let url;
  try {
    url = new URL(
      /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`,
    );
  } catch {
    return {
      ok: false,
      code: "invalidUrl",
      reason: "網址格式不正確，請確認是否為完整連結（含 https://）",
    };
  }

  if (!/(^|\.)instagram\.com$/i.test(url.hostname)) {
    return {
      ok: false,
      code: "notInstagram",
      reason: "僅支援 instagram.com 網址，請勿貼其他平台連結",
    };
  }

  const path = url.pathname.replace(/\/embed\/?$/i, "");
  const match = path.match(/^\/(p|reel|reels|tv)\/([^/?#]+)/i);
  if (!match) {
    if (/^\/(stories)\//i.test(path)) {
      return {
        ok: false,
        code: "storiesUnsupported",
        reason: "不支援限時動態（Stories），請改貼公開貼文或 Reels 網址",
      };
    }
    if (/^\/[^/]+\/?$/i.test(path) && !/^\/(p|reel|reels|tv)\b/i.test(path)) {
      return {
        ok: false,
        code: "profileUrl",
        reason:
          "這看起來是個人檔案網址，請改貼單則貼文（/p/…）或 Reels（/reel/…）",
      };
    }
    return {
      ok: false,
      code: "needPostOrReel",
      reason:
        "請貼公開貼文或 Reels 網址，例如 https://www.instagram.com/p/xxxxx/ 或 /reel/xxxxx/",
    };
  }

  const type = match[1].toLowerCase() === "reels" ? "reel" : match[1].toLowerCase();
  return {
    ok: true,
    url: `https://www.instagram.com/${type}/${match[2]}/`,
  };
}

export function normalizeInstagramPostUrls(value) {
  const values = Array.isArray(value) ? value : [];
  const normalized = [];
  for (const item of values) {
    const parsed = parseInstagramPostUrl(item);
    if (parsed.ok && !normalized.includes(parsed.url)) {
      normalized.push(parsed.url);
    }
  }
  return normalized.slice(0, 6);
}

/** 將原始陣列與正規化結果比對，回傳第一個無效網址的原因（若有） */
export function getInstagramUrlsValidationError(value) {
  if (!Array.isArray(value)) return null;
  if (value.length > 6) {
    return "Instagram 貼文最多可加入 6 則";
  }
  const seen = new Set();
  for (const item of value) {
    const parsed = parseInstagramPostUrl(item);
    if (!parsed.ok) {
      return parsed.reason;
    }
    if (seen.has(parsed.url)) {
      return "同一個 Instagram 貼文請勿重複加入";
    }
    seen.add(parsed.url);
  }
  return null;
}

export function formatCommunityPostsDbError(error) {
  const message = String(error?.message || "");
  if (
    message.includes("instagram_urls") &&
    (message.includes("schema cache") || message.includes("column"))
  ) {
    return "資料庫尚未加入 Instagram 欄位：請在 Supabase SQL Editor 執行 supabase/community_posts_instagram.sql，執行後稍候再試";
  }
  if (
    message.includes("row-level security") ||
    message.includes("RLS")
  ) {
    return "資料庫權限不足：請在 Supabase SQL Editor 執行 supabase/community_posts_rls_fix.sql";
  }
  return message || "儲存失敗，請稍後再試";
}

function slugifyBase(input) {
  return String(input || "")
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export async function generateUniqueCommunitySlug(title) {
  const base = slugifyBase(title) || "post";
  // 前台 /news/[slug] 與 WordPress 文共用路由，統一加 c- 前綴避免撞名
  let candidate = `c-${base}`;
  let n = 2;

  while (true) {
    const { data } = await supabase
      .from("community_posts")
      .select("id")
      .eq("slug", candidate)
      .maybeSingle();
    if (!data) return candidate;
    candidate = `c-${base}-${n}`;
    n += 1;
  }
}

/**
 * 供稿資格判斷：
 * - 教練：coach_applications.status === 'approved'
 * - 球場主／活動主揪：目前無正式申請流程，由管理員在 community_authors 手動核可
 */
export async function checkPostingEligibility(email) {
  if (!email) return { eligible: false, role: null };

  const normalized = email.trim().toLowerCase();

  const { data: coachApp } = await supabase
    .from("coach_applications")
    .select("status, name, slug")
    .ilike("applicant_email", normalized)
    .eq("status", "approved")
    .maybeSingle();

  if (coachApp) {
    return {
      eligible: true,
      role: "coach",
      displayName: coachApp.name,
      coachSlug: coachApp.slug,
    };
  }

  const { data: author } = await supabase
    .from("community_authors")
    .select("role, name")
    .ilike("email", normalized)
    .maybeSingle();

  if (author) {
    return {
      eligible: true,
      role: author.role,
      displayName: author.name,
    };
  }

  return { eligible: false, role: null };
}

function stripHtmlToExcerpt(html, max = 100) {
  const text = String(html || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return text.length > max ? `${text.slice(0, max)}…` : text;
}

export function formatCommunityDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}.${m}.${day}`;
}

const PLACEHOLDER_IMAGE =
  "https://images.unsplash.com/photo-1626224580190-8e7949364676?q=80&w=800&auto=format&fit=crop";

/** 統一映射成跟 WordPress 一致的新聞卡片格式，供 /news 合併顯示 */
export function mapCommunityPostToNewsCard(post, locale = "zh-TW") {
  const dateSrc = post.published_at || post.created_at;
  return {
    id: `community-${post.id}`,
    source: "community",
    slug: post.slug,
    title: post.title,
    excerpt: post.excerpt || stripHtmlToExcerpt(post.content_html),
    image: post.cover_image || PLACEHOLDER_IMAGE,
    date: formatCommunityDate(dateSrc),
    rawDate: dateSrc,
    categories: [categoryLabel(post.category, locale)],
    categoryKey: post.category || "active",
    authorName: post.author_name,
    authorRole: getAuthorRoleLabel(post.author_role, locale),
    authorRoleKey: post.author_role,
    newsType: getNewsSubmissionType(post.category, post.author_role),
    instagram_urls: post.instagram_urls || [],
  };
}

export function mapCommunityPostToDetail(post, locale = "zh-TW") {
  return {
    id: `community-${post.id}`,
    postId: post.id,
    source: "community",
    slug: post.slug,
    title: post.title,
    content: post.content_html,
    excerpt: post.excerpt || stripHtmlToExcerpt(post.content_html, 160),
    image: post.cover_image || PLACEHOLDER_IMAGE,
    date: formatCommunityDate(post.published_at || post.created_at),
    categories: [categoryLabel(post.category, locale)],
    categoryKey: post.category || "active",
    authorName: post.author_name,
    authorRole: getAuthorRoleLabel(post.author_role, locale),
    authorRoleKey: post.author_role,
    newsType: getNewsSubmissionType(post.category, post.author_role),
    instagram_urls: post.instagram_urls || [],
    authorEmail: post.author_email,
    authorAvatar: post.author_avatar || null,
  };
}

export async function fetchAuthorProfile(email) {
  if (!email) return null;
  const { data } = await supabase
    .from("community_author_profiles")
    .select("*")
    .ilike("email", email.trim())
    .maybeSingle();
  return data || null;
}

export async function fetchApprovedCommunityPosts({ limit = 50 } = {}) {
  const { data, error } = await supabase
    .from("community_posts")
    .select("*")
    .eq("status", "approved")
    .order("published_at", { ascending: false })
    .limit(limit);

  if (error) return [];
  return data || [];
}

export async function fetchCommunityPostBySlug(slug) {
  const { data } = await supabase
    .from("community_posts")
    .select("*")
    .eq("slug", slug)
    .eq("status", "approved")
    .maybeSingle();
  return data || null;
}
