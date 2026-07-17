import {
  communitySupabase,
  checkPostingEligibility,
  generateUniqueCommunitySlug,
  CATEGORY_OPTIONS,
} from "@/lib/communityPosts";

export default async function handler(req, res) {
  if (req.method === "GET") {
    const { email } = req.query;
    if (!email) {
      return res.status(400).json({ error: "請提供 email" });
    }

    const { data, error } = await communitySupabase
      .from("community_posts")
      .select("*")
      .ilike("author_email", email.trim())
      .order("created_at", { ascending: false });

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({ posts: data || [] });
  }

  if (req.method === "POST") {
    const {
      author_member_id,
      author_email,
      author_name,
      author_avatar,
      title,
      excerpt,
      cover_image,
      content_html,
      category,
    } = req.body;

    if (!author_email || !author_name) {
      return res.status(400).json({ error: "缺少作者資訊，請重新登入後再試" });
    }

    if (!title?.trim() || !content_html?.trim()) {
      return res.status(400).json({ error: "請填寫標題與內容" });
    }

    const eligibility = await checkPostingEligibility(author_email);
    if (!eligibility.eligible) {
      return res.status(403).json({
        error: "您目前沒有投稿權限，需經教練進駐審核，或由 PikFun 團隊核可後才能發文",
      });
    }

    const validCategory = CATEGORY_OPTIONS.some((c) => c.value === category)
      ? category
      : "active";

    const slug = await generateUniqueCommunitySlug(title);

    const row = {
      status: "pending",
      author_member_id: author_member_id || null,
      author_email,
      author_name,
      author_avatar: author_avatar || null,
      author_role: eligibility.role,
      slug,
      title: title.trim(),
      excerpt: excerpt?.trim() || null,
      cover_image: cover_image || null,
      content_html,
      category: validCategory,
    };

    const { data, error } = await communitySupabase
      .from("community_posts")
      .insert([row])
      .select()
      .single();

    if (error) {
      const isRls =
        error.message?.includes("row-level security") ||
        error.message?.includes("RLS");
      return res.status(500).json({
        error: isRls
          ? "資料庫權限不足：請在 Supabase SQL Editor 執行 supabase/community_posts_rls_fix.sql"
          : error.message,
      });
    }

    return res.status(201).json({ post: data });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
