import { coachSupabase } from "@/lib/featuredCoaches";
import { slugify, commaToArray, linesToArray, isValidSlug } from "@/lib/coachProfileFields";

export default async function handler(req, res) {
  if (req.method === "GET") {
    const { email } = req.query;
    if (!email) {
      return res.status(400).json({ error: "請提供 email" });
    }

    const { data, error } = await coachSupabase
      .from("coach_applications")
      .select("*")
      .ilike("applicant_email", email.trim())
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({ application: data || null });
  }

  if (req.method === "POST") {
    const {
      member_id,
      applicant_email,
      applicant_name,
      applicant_avatar,
      slug,
      name,
      title,
      subtitle,
      city,
      region,
      avatar,
      cover_image,
      video_url,
      featured_label,
      tags,
      excerpt,
      bio,
      story,
      credentials,
      specialties,
      contact_email,
      instagram,
    } = req.body;

    if (!applicant_email || !applicant_name || !name || !excerpt || !bio) {
      return res.status(400).json({ error: "請填寫必填欄位" });
    }

    const finalSlug = slugify(slug || name);
    if (!finalSlug || !isValidSlug(finalSlug)) {
      return res.status(400).json({
        error: "網址代稱僅可使用英文、數字與連字號（至少 2 個字元），中文會自動轉為拼音",
      });
    }

    const { data: pending } = await coachSupabase
      .from("coach_applications")
      .select("id")
      .eq("applicant_email", applicant_email)
      .eq("status", "pending")
      .maybeSingle();

    if (pending) {
      return res.status(400).json({ error: "您已有待審核的申請，請耐心等候" });
    }

    const { data: slugUsed } = await coachSupabase
      .from("coach_applications")
      .select("id")
      .eq("slug", finalSlug)
      .neq("status", "rejected")
      .maybeSingle();

    const { data: slugCoach } = await coachSupabase
      .from("featured_coaches")
      .select("id")
      .eq("slug", finalSlug)
      .maybeSingle();

    if (slugUsed || slugCoach) {
      return res.status(400).json({ error: "此網址代稱已被使用，請換一個" });
    }

    const row = {
      status: "pending",
      member_id: member_id || null,
      applicant_email,
      applicant_name,
      applicant_avatar: applicant_avatar || null,
      slug: finalSlug,
      name,
      title: title || null,
      subtitle: subtitle || null,
      city: city || null,
      region: region || null,
      avatar: avatar || applicant_avatar || null,
      cover_image: cover_image || null,
      video_url: video_url || null,
      featured_label: featured_label || null,
      tags: Array.isArray(tags) ? tags : commaToArray(tags),
      excerpt,
      bio,
      story: story || null,
      credentials: Array.isArray(credentials)
        ? credentials
        : linesToArray(credentials),
      specialties: Array.isArray(specialties)
        ? specialties
        : linesToArray(specialties),
      contact_email: contact_email || applicant_email,
      instagram: instagram || null,
    };

    const { data, error } = await coachSupabase
      .from("coach_applications")
      .insert([row])
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.status(201).json({ application: data });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
