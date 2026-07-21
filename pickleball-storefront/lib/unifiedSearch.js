import courtsData from "@/data/pickleball-courts.json";
import {
  getMedusaBackendUrl,
  getMedusaFetchHeaders,
} from "@/lib/medusa";
import { loadAllFeaturedCoaches } from "@/lib/featuredCoaches";
import { organizerSupabase } from "@/lib/organizerProfiles";
import { communitySupabase } from "@/lib/communityPosts";
import { fetchMergedNewsFeed } from "@/lib/newsFeed";

const FALLBACK_IMAGE = "/images/placeholder.jpg";

const normalize = (value) =>
  String(value || "")
    .toLocaleLowerCase("zh-TW")
    .replace(/\s+/g, " ")
    .trim();

const joinText = (...values) =>
  normalize(
    values
      .flat(Infinity)
      .filter((value) => value !== null && value !== undefined)
      .join(" "),
  );

function matchesQuery(query, ...fields) {
  const q = normalize(query);
  if (!q) return false;
  const haystack = joinText(fields);
  if (haystack.includes(q)) return true;
  const tokens = q.split(" ").filter(Boolean);
  return tokens.length > 1 && tokens.every((token) => haystack.includes(token));
}

function scoreResult(query, title, ...fields) {
  const q = normalize(query);
  const normalizedTitle = normalize(title);
  const haystack = joinText(fields);
  if (normalizedTitle === q) return 100;
  if (normalizedTitle.startsWith(q)) return 80;
  if (normalizedTitle.includes(q)) return 60;
  if (haystack.includes(q)) return 35;
  return 20;
}

function getMatchReason(query, candidates, fallback = "內容符合關鍵字") {
  const q = normalize(query);
  const tokens = q.split(" ").filter(Boolean);
  for (const [label, value] of candidates) {
    const readable = Array.isArray(value)
      ? value.filter(Boolean).join("、")
      : String(value || "").trim();
    if (!readable) continue;
    const normalizedValue = normalize(readable);
    const matched =
      normalizedValue.includes(q) ||
      (tokens.length > 1 &&
        tokens.every((token) => normalizedValue.includes(token)));
    if (matched) {
      const preview =
        readable.length > 42 ? `${readable.slice(0, 42)}…` : readable;
      return `${label}：${preview}`;
    }
  }
  return fallback;
}

function sortAndLimit(items, limit) {
  return items
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ score, ...item }) => item);
}

function formatDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("zh-TW", {
    month: "numeric",
    day: "numeric",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

async function searchProducts(query, limit) {
  const url = `${getMedusaBackendUrl()}/store/products?q=${encodeURIComponent(
    query,
  )}&limit=${Math.max(limit, 8)}`;
  const response = await fetch(url, {
    headers: getMedusaFetchHeaders(),
    signal: AbortSignal.timeout(6000),
  });
  if (!response.ok) throw new Error(`Medusa ${response.status}`);
  const data = await response.json();

  return (data.products || []).slice(0, limit).map((product) => {
    const rawAmount = product.variants?.[0]?.prices?.[0]?.amount || 0;
    const amount = rawAmount > 1000000 ? rawAmount / 100 : rawAmount;
    return {
      id: `product:${product.id}`,
      type: "product",
      title: product.title,
      subtitle: amount ? `NT$ ${Number(amount).toLocaleString("zh-TW")}` : "",
      excerpt: product.subtitle || product.description || "",
      image: product.thumbnail || product.images?.[0]?.url || FALLBACK_IMAGE,
      url: `/product/${product.handle}`,
      badge: "商品",
      match_reason: getMatchReason(
        query,
        [
          ["商品名稱", product.title],
          ["商品說明", product.subtitle || product.description],
        ],
        "商品資料符合關鍵字",
      ),
    };
  });
}

async function searchCoaches(query, limit) {
  const { coaches } = await loadAllFeaturedCoaches();
  const results = (coaches || [])
    .filter((coach) =>
      matchesQuery(
        query,
        coach.name,
        coach.title,
        coach.subtitle,
        coach.city,
        coach.region,
        coach.excerpt,
        coach.bio,
        coach.credentials,
        coach.specialties,
        coach.tags,
      ),
    )
    .map((coach) => ({
      id: `coach:${coach.id || coach.slug}`,
      type: "coach",
      title: coach.name,
      subtitle: [coach.title, coach.city].filter(Boolean).join(" · "),
      excerpt: coach.excerpt || coach.bio || "",
      image: coach.avatar || coach.cover_image || FALLBACK_IMAGE,
      url: `/coaching/coach/${coach.slug}`,
      badge: "教練",
      match_reason: getMatchReason(query, [
        ["教練姓名", coach.name],
        ["教練標題", [coach.title, coach.subtitle]],
        ["地區", [coach.city, coach.region]],
        ["專長與標籤", [coach.specialties, coach.tags]],
        ["教練介紹", [coach.excerpt, coach.bio]],
      ]),
      score: scoreResult(query, coach.name, coach.title, coach.tags),
    }));
  return sortAndLimit(results, limit);
}

async function searchOrganizers(query, limit) {
  const { data, error } = await organizerSupabase
    .from("organizer_profiles")
    .select(
      "id,slug,display_name,title,avatar,cover_image,city,region,excerpt,bio,specialties,tags",
    )
    .eq("published", true)
    .limit(100);
  if (error) throw error;

  const results = (data || [])
    .filter((host) =>
      matchesQuery(
        query,
        host.display_name,
        host.title,
        host.city,
        host.region,
        host.excerpt,
        host.bio,
        host.specialties,
        host.tags,
      ),
    )
    .map((host) => ({
      id: `organizer:${host.id}`,
      type: "organizer",
      title: host.display_name,
      subtitle: [host.title, host.city].filter(Boolean).join(" · "),
      excerpt: host.excerpt || host.bio || "",
      image: host.avatar || host.cover_image || FALLBACK_IMAGE,
      url: `/play/host/${host.slug}`,
      badge: "揪團者",
      match_reason: getMatchReason(query, [
        ["策辦人姓名", host.display_name],
        ["身分標題", host.title],
        ["活動地區", [host.city, host.region]],
        ["特色與標籤", [host.specialties, host.tags]],
        ["個人介紹", [host.excerpt, host.bio]],
      ]),
      score: scoreResult(query, host.display_name, host.title, host.tags),
    }));
  return sortAndLimit(results, limit);
}

async function searchCommunityAuthors(query, limit) {
  const { data, error } = await communitySupabase
    .from("community_posts")
    .select(
      "id,slug,title,cover_image,author_name,author_role,published_at,created_at",
    )
    .eq("status", "approved")
    .order("published_at", { ascending: false })
    .limit(150);
  if (error) throw error;

  const authorMap = new Map();
  for (const post of data || []) {
    if (!post.author_name || post.author_role === "coach") continue;
    const key = `${post.author_role}:${normalize(post.author_name)}`;
    if (!authorMap.has(key)) authorMap.set(key, post);
  }

  const results = [...authorMap.values()]
    .filter((post) =>
      matchesQuery(query, post.author_name, post.author_role, post.title),
    )
    .map((post) => {
      const isCourtOwner = post.author_role === "court_owner";
      return {
        id: `author:${post.author_role}:${post.id}`,
        type: isCourtOwner ? "court_owner" : "individual",
        title: post.author_name,
        subtitle: isCourtOwner ? "球場主" : "匹克球投稿者",
        excerpt: `最新投稿：${post.title}`,
        image: post.cover_image || FALLBACK_IMAGE,
        url: `/news/${post.slug}`,
        badge: isCourtOwner ? "球場主" : "個人",
        match_reason: getMatchReason(query, [
          ["作者姓名", post.author_name],
          ["投稿文章", post.title],
          ["作者身分", isCourtOwner ? "球場主" : "個人投稿者"],
        ]),
        score: scoreResult(query, post.author_name, post.title),
      };
    });
  return sortAndLimit(results, limit);
}

async function searchPlaySessions(query, limit) {
  const { data, error } = await organizerSupabase
    .from("play_sessions")
    .select(
      "id,title,description,location_name,location_address,starts_at,host_name,host_avatar,fee_per_person,status",
    )
    .neq("status", "cancelled")
    .gte("starts_at", new Date().toISOString())
    .order("starts_at", { ascending: true })
    .limit(150);
  if (error) throw error;

  const results = (data || [])
    .filter((session) =>
      matchesQuery(
        query,
        session.title,
        session.description,
        session.location_name,
        session.location_address,
        session.host_name,
      ),
    )
    .map((session) => ({
      id: `play:${session.id}`,
      type: "play_session",
      title: session.title,
      subtitle: [formatDate(session.starts_at), session.location_name]
        .filter(Boolean)
        .join(" · "),
      excerpt: session.description || session.location_address || "",
      image: session.host_avatar || FALLBACK_IMAGE,
      url: `/play/${session.id}`,
      badge: "開團",
      match_reason: getMatchReason(query, [
        ["開團標題", session.title],
        ["揪團者", session.host_name],
        ["活動地點", [session.location_name, session.location_address]],
        ["活動說明", session.description],
      ]),
      score: scoreResult(
        query,
        session.title,
        session.location_name,
        session.host_name,
      ),
    }));
  return sortAndLimit(results, limit);
}

async function searchCoachingClasses(query, limit) {
  const { data, error } = await organizerSupabase
    .from("coach_classes")
    .select(
      "id,title,description,curriculum,class_type,skill_level,location_name,location_address,starts_at,coach_name,coach_avatar,cover_image,price_per_person,status",
    )
    .neq("status", "cancelled")
    .gte("starts_at", new Date().toISOString())
    .order("starts_at", { ascending: true })
    .limit(150);
  if (error) throw error;

  const results = (data || [])
    .filter((item) =>
      matchesQuery(
        query,
        item.title,
        item.description,
        item.curriculum,
        item.class_type,
        item.skill_level,
        item.location_name,
        item.location_address,
        item.coach_name,
      ),
    )
    .map((item) => ({
      id: `class:${item.id}`,
      type: "coaching_class",
      title: item.title,
      subtitle: [item.coach_name, formatDate(item.starts_at)]
        .filter(Boolean)
        .join(" · "),
      excerpt: item.description || item.location_name || "",
      image: item.cover_image || item.coach_avatar || FALLBACK_IMAGE,
      url: `/coaching/${item.id}`,
      badge: "教練課",
      match_reason: getMatchReason(query, [
        ["課程名稱", item.title],
        ["授課教練", item.coach_name],
        ["上課地點", [item.location_name, item.location_address]],
        ["課程說明", [item.description, item.curriculum]],
        ["程度與類型", [item.skill_level, item.class_type]],
      ]),
      score: scoreResult(
        query,
        item.title,
        item.coach_name,
        item.location_name,
      ),
    }));
  return sortAndLimit(results, limit);
}

async function searchCourts(query, limit) {
  const results = (courtsData.courts || [])
    .filter((court) =>
      matchesQuery(
        query,
        court.name,
        court.city,
        court.address,
        court.court_type_label,
        court.fee_hint,
      ),
    )
    .map((court) => ({
      id: `court:${court.id}`,
      type: "court",
      title: court.name,
      subtitle: [court.city, court.court_type_label]
        .filter(Boolean)
        .join(" · "),
      excerpt: court.address || court.fee_hint || "",
      image: court.image || FALLBACK_IMAGE,
      url: `/courts?q=${encodeURIComponent(court.name)}`,
      badge: "球場",
      match_reason: getMatchReason(query, [
        ["球場名稱", court.name],
        ["縣市", court.city],
        ["地址", court.address],
        ["場地類型", court.court_type_label],
      ]),
      score: scoreResult(query, court.name, court.city, court.address),
    }));
  return sortAndLimit(results, limit);
}

async function searchNews(query, limit, locale) {
  const posts = await fetchMergedNewsFeed({
    perPage: 60,
    locale,
  });
  const results = posts
    .filter((post) =>
      matchesQuery(
        query,
        post.title,
        post.excerpt,
        post.categories,
        post.authorName,
        post.authorRole,
      ),
    )
    .map((post) => ({
      id: `news:${post.id}`,
      type: "news",
      title: post.title,
      subtitle: [post.categories?.[0], post.date].filter(Boolean).join(" · "),
      excerpt: post.excerpt || "",
      image: post.image || FALLBACK_IMAGE,
      url: `/news/${post.slug}`,
      badge: post.source === "wordpress" ? "官方文章" : "投稿文章",
      match_reason: getMatchReason(query, [
        ["文章標題", post.title],
        ["文章摘要", post.excerpt],
        ["文章分類", post.categories],
        ["作者", [post.authorName, post.authorRole]],
      ]),
      score: scoreResult(query, post.title, post.excerpt, post.categories),
    }));
  return sortAndLimit(results, limit);
}

const ADAPTERS = {
  product: searchProducts,
  coach: searchCoaches,
  organizer: searchOrganizers,
  author: searchCommunityAuthors,
  play_session: searchPlaySessions,
  coaching_class: searchCoachingClasses,
  court: searchCourts,
  news: searchNews,
};

export async function unifiedSearch({
  query,
  locale = "zh-TW",
  limit = 5,
  types = Object.keys(ADAPTERS),
}) {
  const selected = types.filter((type) => ADAPTERS[type]);
  const settled = await Promise.allSettled(
    selected.map((type) =>
      ADAPTERS[type](query, limit, locale).then((items) => ({
        type,
        items,
      })),
    ),
  );

  const items = [];
  const counts = {};
  const errors = [];

  settled.forEach((result, index) => {
    const type = selected[index];
    if (result.status === "fulfilled") {
      counts[type] = result.value.items.length;
      items.push(...result.value.items);
    } else {
      counts[type] = 0;
      errors.push({ type, message: result.reason?.message || "搜尋失敗" });
    }
  });

  return {
    query,
    locale,
    items,
    counts,
    partial: errors.length > 0,
    errors,
  };
}
