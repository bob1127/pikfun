import { createClient } from "@supabase/supabase-js";
import { fetchApprovedCommunityPosts } from "@/lib/communityPosts";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);

/**
 * 導覽列公告輪播：站內最新的揪團／教練課／社群投稿標題（最多 5 則）。
 * 只讀 Supabase，零外部 API 用量。
 */
export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const now = new Date().toISOString();

    const [sessionsRes, classesRes, posts] = await Promise.all([
      supabase
        .from("play_sessions")
        .select("id, title, created_at")
        .gte("starts_at", now)
        .neq("status", "cancelled")
        .order("created_at", { ascending: false })
        .limit(5),
      supabase
        .from("coach_classes")
        .select("id, title, created_at")
        .gte("starts_at", now)
        .neq("status", "cancelled")
        .order("created_at", { ascending: false })
        .limit(5),
      fetchApprovedCommunityPosts({ limit: 5 }),
    ]);

    const items = [
      ...(sessionsRes.data || []).map((s) => ({
        type: "play",
        title: s.title,
        href: `/play/${s.id}`,
        created_at: s.created_at,
      })),
      ...(classesRes.data || []).map((c) => ({
        type: "class",
        title: c.title,
        href: `/coaching/${c.id}`,
        created_at: c.created_at,
      })),
      ...(posts || []).map((p) => ({
        type: "post",
        title: p.title,
        href: `/news/${p.slug}`,
        created_at: p.published_at || p.created_at,
      })),
    ]
      .filter((i) => i.title && i.created_at)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 5)
      .map(({ type, title, href }) => ({ type, title, href }));

    res.setHeader(
      "Cache-Control",
      "public, s-maxage=300, stale-while-revalidate=1800",
    );
    return res.status(200).json({ items });
  } catch (e) {
    console.error("[site-ticker]", e);
    return res.status(200).json({ items: [] });
  }
}
