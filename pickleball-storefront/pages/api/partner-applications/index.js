import {
  partnerSupabase,
  APPLY_TYPE_LABEL,
} from "@/lib/partnerApplications";

export default async function handler(req, res) {
  if (req.method === "GET") {
    const { email } = req.query;
    if (!email) {
      return res.status(400).json({ error: "請提供 email" });
    }

    const { data, error } = await partnerSupabase
      .from("partner_applications")
      .select("*")
      .ilike("applicant_email", email.trim())
      .order("created_at", { ascending: false });

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({ applications: data || [] });
  }

  if (req.method === "POST") {
    const {
      apply_type,
      member_id,
      applicant_email,
      applicant_name,
      applicant_avatar,
      company,
      phone,
      city,
      website,
      instagram,
      line_url,
      instagram_url,
      facebook_url,
      message,
    } = req.body || {};

    if (!APPLY_TYPE_LABEL[apply_type]) {
      return res.status(400).json({ error: "無效的申請類型" });
    }

    if (!applicant_email || !applicant_name) {
      return res.status(400).json({ error: "請先登入後再申請" });
    }

    if (!message?.trim()) {
      return res.status(400).json({ error: "請填寫申請說明" });
    }

    const socialLinks = { line_url, instagram_url, facebook_url };
    for (const [field, value] of Object.entries(socialLinks)) {
      if (value?.trim() && !/^https?:\/\//i.test(value.trim())) {
        return res.status(400).json({
          error: `${field.replace("_url", "")} 請填寫完整的 http:// 或 https:// 網址`,
        });
      }
    }

    const { data: pending } = await partnerSupabase
      .from("partner_applications")
      .select("id")
      .ilike("applicant_email", applicant_email.trim())
      .eq("apply_type", apply_type)
      .eq("status", "pending")
      .maybeSingle();

    if (pending) {
      return res.status(400).json({
        error: "您已有此類型的待審核申請，請耐心等候",
      });
    }

    const row = {
      status: "pending",
      apply_type,
      member_id: member_id || null,
      applicant_email: applicant_email.trim(),
      applicant_name: applicant_name.trim(),
      applicant_avatar: applicant_avatar || null,
      company: company?.trim() || null,
      phone: phone?.trim() || null,
      city: city?.trim() || null,
      website: website?.trim() || null,
      instagram: instagram?.trim() || null,
      line_url: line_url?.trim() || null,
      instagram_url: instagram_url?.trim() || null,
      facebook_url: facebook_url?.trim() || null,
      message: message.trim(),
    };

    const { data, error } = await partnerSupabase
      .from("partner_applications")
      .insert([row])
      .select()
      .single();

    if (error) {
      const isRls =
        error.message?.includes("row-level security") ||
        error.message?.includes("RLS");
      return res.status(500).json({
        error: isRls
          ? "資料庫權限不足：請在 Supabase 執行 supabase/partner_applications.sql"
          : error.message,
      });
    }

    return res.status(201).json({ application: data });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
