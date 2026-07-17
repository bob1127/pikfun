import { communitySupabase } from "@/lib/communityPosts";

export default async function handler(req, res) {
  const { id } = req.query;

  if (req.method === "GET") {
    const { data, error } = await communitySupabase
      .from("community_post_comments")
      .select("*")
      .eq("post_id", id)
      .order("created_at", { ascending: false });

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ comments: data || [] });
  }

  if (req.method === "POST") {
    const { author_email, author_name, author_avatar, content, media } =
      req.body || {};

    if (!author_email?.trim() || !author_name?.trim()) {
      return res.status(401).json({ error: "請先登入後再留言" });
    }
    if (!content?.trim() || content.trim().length < 2) {
      return res.status(400).json({ error: "請填寫留言內容" });
    }

    const mediaList = Array.isArray(media)
      ? media
          .filter((m) => m?.url)
          .slice(0, 6)
          .map((m) => ({
            url: m.url,
            type: m.type || "image/jpeg",
          }))
      : [];

    const { data, error } = await communitySupabase
      .from("community_post_comments")
      .insert([
        {
          post_id: id,
          author_email: author_email.trim(),
          author_name: author_name.trim(),
          author_avatar: author_avatar || null,
          content: content.trim(),
          media: mediaList,
        },
      ])
      .select()
      .single();

    if (error) {
      const isMissingCol =
        error.message?.includes("media") ||
        error.message?.includes("column");
      const isRls =
        error.message?.includes("row-level security") ||
        error.message?.includes("RLS");
      return res.status(500).json({
        error: isMissingCol
          ? "請在 Supabase 執行 supabase/community_comments_media.sql"
          : isRls
            ? "請先在 Supabase 執行 supabase/community_engagement.sql"
            : error.message,
      });
    }

    return res.status(201).json({ comment: data });
  }

  if (req.method === "DELETE") {
    const { comment_id, email } = req.body || {};
    if (!comment_id || !email) {
      return res.status(400).json({ error: "缺少參數" });
    }

    const { data: comment } = await communitySupabase
      .from("community_post_comments")
      .select("*")
      .eq("id", comment_id)
      .single();

    if (!comment) return res.status(404).json({ error: "找不到留言" });
    if (
      comment.author_email.trim().toLowerCase() !== email.trim().toLowerCase()
    ) {
      return res.status(403).json({ error: "只能刪除自己的留言" });
    }

    const { error } = await communitySupabase
      .from("community_post_comments")
      .delete()
      .eq("id", comment_id);

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ ok: true });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
