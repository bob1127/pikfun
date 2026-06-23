import { coachSupabase } from "@/lib/featuredCoaches";
import { slugify, commaToArray, linesToArray, isValidSlug } from "@/lib/coachProfileFields";

function emailsMatch(a, b) {
  if (!a || !b) return false;
  return String(a).trim().toLowerCase() === String(b).trim().toLowerCase();
}

export default async function handler(req, res) {
  if (req.method !== "PATCH") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { id } = req.query;
  if (!id) {
    return res.status(400).json({ error: "缺少申請 ID" });
  }

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

  const { data: existing, error: fetchErr } = await coachSupabase
    .from("coach_applications")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (fetchErr) {
    return res.status(500).json({ error: fetchErr.message });
  }
  if (!existing) {
    return res.status(404).json({ error: "找不到申請" });
  }
  if (existing.status !== "pending") {
    return res.status(400).json({ error: "僅審核中的申請可編輯" });
  }

  const ownsByEmail = emailsMatch(existing.applicant_email, applicant_email);
  const ownsByMember =
    member_id && existing.member_id && existing.member_id === member_id;
  if (!ownsByEmail && !ownsByMember) {
    return res.status(403).json({ error: "無權限編輯此申請" });
  }

  const { data: slugUsed } = await coachSupabase
    .from("coach_applications")
    .select("id")
    .eq("slug", finalSlug)
    .neq("status", "rejected")
    .neq("id", id)
    .maybeSingle();

  const { data: slugCoach } = await coachSupabase
    .from("featured_coaches")
    .select("id")
    .eq("slug", finalSlug)
    .maybeSingle();

  if (slugUsed || slugCoach) {
    return res.status(400).json({ error: "此網址代稱已被使用，請換一個" });
  }

  const now = new Date().toISOString();
  const row = {
    status: "pending",
    member_id: member_id || existing.member_id || null,
    applicant_email,
    applicant_name,
    applicant_avatar: applicant_avatar || null,
    slug: finalSlug,
    name,
    title: title || null,
    subtitle: subtitle || null,
    city: city || null,
    region: region || null,
    avatar: avatar || applicant_avatar || existing.avatar || null,
    cover_image: cover_image ?? existing.cover_image ?? null,
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
    admin_note: null,
    reviewed_by: null,
    reviewed_at: null,
    created_at: now,
    updated_at: now,
  };

  const { data, error } = await coachSupabase
    .from("coach_applications")
    .update(row)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  return res.status(200).json({ application: data });
}
