import { communitySupabase } from "@/lib/communityPosts";
import { assertAdmin } from "@/lib/adminAuth";

export default async function handler(req, res) {
  const adminEmail = assertAdmin(req, res);
  if (!adminEmail) return;

  const { id } = req.query;

  if (req.method === "GET") {
    const { data: post, error } = await communitySupabase
      .from("community_posts")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !post) {
      return res.status(404).json({ error: "找不到文章" });
    }

    return res.status(200).json({ post });
  }

  if (req.method === "PATCH") {
    const { action, admin_note } = req.body;

    const { data: post, error: fetchErr } = await communitySupabase
      .from("community_posts")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchErr || !post) {
      return res.status(404).json({ error: "找不到文章" });
    }

    if (action === "reject") {
      const { error } = await communitySupabase
        .from("community_posts")
        .update({
          status: "rejected",
          admin_note: admin_note || null,
          reviewed_by: adminEmail,
          reviewed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json({ ok: true, status: "rejected" });
    }

    if (action === "approve") {
      const { error } = await communitySupabase
        .from("community_posts")
        .update({
          status: "approved",
          admin_note: admin_note || null,
          reviewed_by: adminEmail,
          reviewed_at: new Date().toISOString(),
          published_at: post.published_at || new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json({
        ok: true,
        status: "approved",
        slug: post.slug,
        post_url: `/news/${post.slug}`,
      });
    }

    if (action === "unpublish") {
      const { error } = await communitySupabase
        .from("community_posts")
        .update({
          status: "rejected",
          admin_note: admin_note || "已由管理員下架",
          reviewed_by: adminEmail,
          reviewed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json({ ok: true, status: "rejected" });
    }

    return res.status(400).json({ error: "無效操作" });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
