import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);

export const communitySupabase = supabase;

export const AUTHOR_ROLE_LABEL = {
  coach: "教練",
  court_owner: "球場主",
  organizer: "活動主揪",
};

export const CATEGORY_OPTIONS = [
  { value: "active", label: "揪團／臨打" },
  { value: "event", label: "賽事活動" },
  { value: "knowledge", label: "知識攻略" },
  { value: "course", label: "課程開課" },
];

export function categoryLabel(value) {
  return CATEGORY_OPTIONS.find((c) => c.value === value)?.label || "最新消息";
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
export function mapCommunityPostToNewsCard(post) {
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
    categories: [categoryLabel(post.category)],
    authorName: post.author_name,
    authorRole: AUTHOR_ROLE_LABEL[post.author_role] || "PikFun 夥伴",
  };
}

export function mapCommunityPostToDetail(post) {
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
    categories: [categoryLabel(post.category)],
    categoryKey: post.category || "active",
    authorName: post.author_name,
    authorRole: AUTHOR_ROLE_LABEL[post.author_role] || "PikFun 夥伴",
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
