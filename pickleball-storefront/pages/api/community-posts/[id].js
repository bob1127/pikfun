import { communitySupabase, CATEGORY_OPTIONS } from "@/lib/communityPosts";
import { isAdminEmail } from "@/lib/adminAuth";

async function loadOwnedPost(id, email) {
  const { data: post, error } = await communitySupabase
    .from("community_posts")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !post) return { post: null, isOwner: false };

  const isOwner =
    !!email &&
    post.author_email?.trim().toLowerCase() === email.trim().toLowerCase();

  return { post, isOwner };
}

export default async function handler(req, res) {
  const { id } = req.query;

  if (req.method === "GET") {
    const { email } = req.query;
    const { post, isOwner } = await loadOwnedPost(id, email);

    if (!post) return res.status(404).json({ error: "找不到文章" });
    if (!isOwner && !isAdminEmail(email)) {
      return res.status(403).json({ error: "無權限查看" });
    }

    return res.status(200).json({ post });
  }

  if (req.method === "PATCH") {
    const { email, title, excerpt, cover_image, content_html, category } =
      req.body;

    const { post, isOwner } = await loadOwnedPost(id, email);
    if (!post) return res.status(404).json({ error: "找不到文章" });
    if (!isOwner) return res.status(403).json({ error: "無權限編輯" });

    if (post.status === "approved") {
      return res.status(400).json({
        error: "已上架文章請聯繫 PikFun 團隊協助修改",
      });
    }

    if (!title?.trim() || !content_html?.trim()) {
      return res.status(400).json({ error: "請填寫標題與內容" });
    }

    const validCategory = CATEGORY_OPTIONS.some((c) => c.value === category)
      ? category
      : post.category;

    const { data, error } = await communitySupabase
      .from("community_posts")
      .update({
        title: title.trim(),
        excerpt: excerpt?.trim() || null,
        cover_image: cover_image || null,
        content_html,
        category: validCategory,
        status: "pending",
        admin_note: null,
        reviewed_by: null,
        reviewed_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });

    return res.status(200).json({ post: data });
  }

  if (req.method === "DELETE") {
    const { email } = req.body || {};
    const { post, isOwner } = await loadOwnedPost(id, email);
    if (!post) return res.status(404).json({ error: "找不到文章" });
    if (!isOwner) return res.status(403).json({ error: "無權限刪除" });

    if (post.status === "approved") {
      return res.status(400).json({
        error: "已上架文章請聯繫 PikFun 團隊協助下架",
      });
    }

    const { error } = await communitySupabase
      .from("community_posts")
      .delete()
      .eq("id", id);

    if (error) return res.status(500).json({ error: error.message });

    return res.status(200).json({ ok: true });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
