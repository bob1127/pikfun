const WP_BASE =
  process.env.NEXT_PUBLIC_WP_API_BASE ||
  process.env.WP_API_BASE ||
  "https://inf.fjg.mybluehost.me/website_e630c3cb";

export const WP_CATEGORY = {
  active: { slug: "active", id: 28, label: "查找球場與活動資訊" },
  knowledge: { slug: "knowledge", id: 26, label: "運動知識與攻略" },
  racketsEquipment: { slug: "rackets-equipment", id: 30, label: "球拍-裝備" },
  beginner: { slug: "beginner", id: 32, label: "新手球拍" },
  advanced: { slug: "advanced", id: 34, label: "進階球拍" },
};

const PLACEHOLDER_IMAGE =
  "https://images.unsplash.com/photo-1626224580190-8e7949364676?q=80&w=800&auto=format&fit=crop";

export function stripHtml(html) {
  if (!html) return "";
  return String(html)
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function formatWpDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}.${m}.${day}`;
}

function getFeaturedImage(post) {
  const media = post?._embedded?.["wp:featuredmedia"]?.[0];
  return (
    media?.source_url ||
    media?.media_details?.sizes?.medium_large?.source_url ||
    media?.media_details?.sizes?.medium?.source_url ||
    PLACEHOLDER_IMAGE
  );
}

function getCategoryNames(post) {
  const terms = post?._embedded?.["wp:term"]?.[0] || [];
  return terms
    .filter((t) => t.taxonomy === "category" && t.slug !== "uncategorized")
    .map((t) => t.name);
}

function getTagNames(post) {
  const terms = post?._embedded?.["wp:term"]?.[1] || [];
  return terms.filter((t) => t.taxonomy === "post_tag").map((t) => t.name);
}

export function mapPostToBase(post) {
  const categories = getCategoryNames(post);
  const tags = getTagNames(post);
  const excerpt = stripHtml(post.excerpt?.rendered || "");

  return {
    id: post.id,
    slug: post.slug,
    title: stripHtml(post.title?.rendered || ""),
    excerpt,
    content: post.content?.rendered || "",
    date: post.date,
    dateFormatted: formatWpDate(post.date),
    image: getFeaturedImage(post),
    categories,
    tags,
    link: post.link,
  };
}

/** Store.jsx 橫向卡片 */
export function mapPostToStoreCard(post, index, categoryLabel) {
  const base = mapPostToBase(post);
  const tag = base.tags[0] || base.categories[0] || categoryLabel;

  return {
    id: `No.${String(index + 1).padStart(3, "0")}`,
    slug: base.slug,
    brand: categoryLabel || base.categories[0] || "PikFun",
    title: base.title,
    date: base.dateFormatted,
    type: tag,
    status: "閱讀更多",
    description:
      base.excerpt ||
      stripHtml(post.content?.rendered || "").slice(0, 120) + "…",
    image: base.image,
    href: `/blog/${base.slug}`,
  };
}

/** AutoCarousel.jsx 輪播卡片 */
export function mapPostToCarouselItem(post) {
  const base = mapPostToBase(post);
  const tags = base.tags.length
    ? base.tags.slice(0, 2).map((t) => (t.startsWith("#") ? t : `#${t}`))
    : base.categories.slice(0, 2).map((c) => `#${c}`);

  return {
    id: base.id,
    slug: base.slug,
    date: base.dateFormatted,
    title: base.title,
    subtitle: base.excerpt ? base.excerpt.slice(0, 36) + "…" : "",
    tags,
    status: "閱讀更多",
    img: base.image,
    href: `/blog/${base.slug}`,
  };
}

const PARENT_CATEGORY_LABELS = new Set([WP_CATEGORY.racketsEquipment.label]);

/** 首頁球拍輪播：球拍-裝備 + 子分類（新手／進階） */
export const WP_SHOWCASE_CATEGORY_SLUGS = [
  WP_CATEGORY.racketsEquipment.slug,
  WP_CATEGORY.beginner.slug,
  WP_CATEGORY.advanced.slug,
];

export async function fetchShowcaseTopicPosts({ perPage = 12, lang } = {}) {
  const batches = await Promise.all(
    WP_SHOWCASE_CATEGORY_SLUGS.map((slug) =>
      fetchPostsByCategorySlug(slug, { perPage, lang }),
    ),
  );

  const seen = new Set();
  const merged = [];
  for (const batch of batches) {
    for (const post of batch) {
      if (seen.has(post.id)) continue;
      seen.add(post.id);
      merged.push(post);
    }
  }

  merged.sort((a, b) => new Date(b.date) - new Date(a.date));
  return merged.slice(0, perPage);
}

/** ProductGridShowcase.jsx TOPICS 輪播卡片 */
export function mapPostToTopicItem(post) {
  const base = mapPostToBase(post);
  const category =
    base.categories.find((c) => !PARENT_CATEGORY_LABELS.has(c)) ||
    base.categories[0] ||
    WP_CATEGORY.racketsEquipment.label;

  return {
    id: String(base.id),
    category,
    title: base.title,
    desc: base.excerpt || base.title,
    image: base.image,
    href: `/blog/${base.slug}`,
    icon: "link",
  };
}

export async function fetchPostsByCategorySlug(
  categorySlug,
  { perPage = 10, lang } = {}
) {
  const cat =
    Object.values(WP_CATEGORY).find((c) => c.slug === categorySlug) ||
    null;
  const categoryId = cat?.id;

  const params = new URLSearchParams({
    per_page: String(perPage),
    orderby: "date",
    order: "desc",
    _embed: "1",
    status: "publish",
  });

  if (categoryId) params.set("categories", String(categoryId));
  if (lang) params.set("lang", lang);

  const url = `${WP_BASE}/wp-json/wp/v2/posts?${params.toString()}`;
  const res = await fetch(url, { cache: "no-store" });

  if (!res.ok) {
    throw new Error(`WordPress API ${res.status}`);
  }

  const posts = await res.json();
  return Array.isArray(posts) ? posts : [];
}

export async function fetchPostBySlug(slug, { lang } = {}) {
  const params = new URLSearchParams({
    slug,
    _embed: "1",
    status: "publish",
  });
  if (lang) params.set("lang", lang);

  const url = `${WP_BASE}/wp-json/wp/v2/posts?${params.toString()}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`WordPress API ${res.status}`);

  const posts = await res.json();
  return posts?.[0] || null;
}

export async function fetchHomeWpPosts() {
  try {
    const [activeRaw, knowledgeRaw, topicRaw] = await Promise.all([
      fetchPostsByCategorySlug("active", { perPage: 12 }),
      fetchPostsByCategorySlug("knowledge", { perPage: 12 }),
      fetchShowcaseTopicPosts({ perPage: 12 }),
    ]);

    return {
      activePosts: activeRaw.map((p, i) =>
        mapPostToStoreCard(p, i, WP_CATEGORY.active.label)
      ),
      knowledgePosts: knowledgeRaw.map((p) => mapPostToCarouselItem(p)),
      topicPosts: topicRaw.map((p) => mapPostToTopicItem(p)),
      activeCount: activeRaw.length,
      knowledgeCount: knowledgeRaw.length,
    };
  } catch (err) {
    console.error("fetchHomeWpPosts:", err.message);
    return {
      activePosts: [],
      knowledgePosts: [],
      topicPosts: [],
      activeCount: 0,
      knowledgeCount: 0,
    };
  }
}
