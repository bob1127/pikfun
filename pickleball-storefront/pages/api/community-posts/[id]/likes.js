import { communitySupabase } from "@/lib/communityPosts";

export default async function handler(req, res) {
  const { id } = req.query;

  if (req.method === "GET") {
    const { email } = req.query;

    const { count, error } = await communitySupabase
      .from("community_post_likes")
      .select("*", { count: "exact", head: true })
      .eq("post_id", id);

    if (error) return res.status(500).json({ error: error.message });

    let liked = false;
    if (email) {
      const { data } = await communitySupabase
        .from("community_post_likes")
        .select("id")
        .eq("post_id", id)
        .ilike("member_email", email.trim())
        .maybeSingle();
      liked = !!data;
    }

    return res.status(200).json({ count: count || 0, liked });
  }

  if (req.method === "POST") {
    const { email, action } = req.body || {};
    if (!email?.trim()) {
      return res.status(401).json({ error: "請先登入後再按讚" });
    }

    const normalized = email.trim().toLowerCase();

    if (action === "unlike") {
      await communitySupabase
        .from("community_post_likes")
        .delete()
        .eq("post_id", id)
        .ilike("member_email", normalized);
    } else {
      const { error } = await communitySupabase
        .from("community_post_likes")
        .upsert(
          [{ post_id: id, member_email: normalized }],
          { onConflict: "post_id,member_email", ignoreDuplicates: true },
        );
      if (error && !error.message?.includes("duplicate")) {
        return res.status(500).json({ error: error.message });
      }
    }

    const { count } = await communitySupabase
      .from("community_post_likes")
      .select("*", { count: "exact", head: true })
      .eq("post_id", id);

    const liked = action !== "unlike";
    return res.status(200).json({ count: count || 0, liked });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
