import { communitySupabase, checkPostingEligibility } from "@/lib/communityPosts";

export default async function handler(req, res) {
  if (req.method === "GET") {
    const { email } = req.query;
    if (!email) {
      return res.status(400).json({ error: "請提供 email" });
    }

    const { data, error } = await communitySupabase
      .from("community_author_profiles")
      .select("*")
      .ilike("email", email.trim())
      .maybeSingle();

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ profile: data || null });
  }

  if (req.method === "PUT" || req.method === "POST") {
    const {
      email,
      member_id,
      display_name,
      title,
      credentials,
      bio,
      avatar_url,
      highlight,
    } = req.body || {};

    if (!email?.trim()) {
      return res.status(400).json({ error: "請先登入" });
    }

    const eligibility = await checkPostingEligibility(email);
    if (!eligibility.eligible) {
      return res.status(403).json({
        error: "需具備投稿資格才能編輯作者資訊",
      });
    }

    const row = {
      email: email.trim().toLowerCase(),
      member_id: member_id || null,
      display_name: display_name?.trim() || null,
      title: title?.trim() || null,
      credentials: credentials?.trim() || null,
      bio: bio?.trim() || null,
      avatar_url: avatar_url || null,
      highlight: highlight?.trim() || null,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await communitySupabase
      .from("community_author_profiles")
      .upsert([row], { onConflict: "email" })
      .select()
      .single();

    if (error) {
      const isRls =
        error.message?.includes("row-level security") ||
        error.message?.includes("RLS");
      return res.status(500).json({
        error: isRls
          ? "請先在 Supabase 執行 supabase/community_engagement.sql"
          : error.message,
      });
    }

    return res.status(200).json({ profile: data });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
