import { coachSupabase } from "@/lib/featuredCoaches";

export default async function handler(req, res) {
  const { email, member_id } = req.query;
  if (!email) return res.status(400).json({ error: "need email" });

  const { data: all } = await coachSupabase
    .from("coach_applications")
    .select("id, applicant_email, member_id, status, slug, name, created_at")
    .order("created_at", { ascending: false })
    .limit(20);

  const { data: matched } = await coachSupabase
    .from("coach_applications")
    .select("id, applicant_email, member_id, status, slug, name")
    .ilike("applicant_email", email.trim())
    .maybeSingle();

  let byMemberId = null;
  if (member_id) {
    const { data } = await coachSupabase
      .from("coach_applications")
      .select("id, applicant_email, member_id, status, slug, name")
      .eq("member_id", member_id)
      .maybeSingle();
    byMemberId = data;
  }

  const { data: featured } = await coachSupabase
    .from("featured_coaches")
    .select("id, applicant_email, member_id, slug, name")
    .ilike("applicant_email", email.trim())
    .maybeSingle();

  return res.status(200).json({
    query_email: email,
    query_member_id: member_id || null,
    all_applications: all || [],
    matched_by_email: matched,
    matched_by_member_id: byMemberId,
    featured_coach: featured,
  });
}
