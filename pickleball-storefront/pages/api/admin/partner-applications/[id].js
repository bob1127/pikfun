import { partnerSupabase, applyTypeToAuthorRole } from "@/lib/partnerApplications";
import { assertAdmin } from "@/lib/adminAuth";
import { communitySupabase } from "@/lib/communityPosts";

export default async function handler(req, res) {
  const adminEmail = assertAdmin(req, res);
  if (!adminEmail) return;

  const { id } = req.query;

  if (req.method === "GET") {
    const { data, error } = await partnerSupabase
      .from("partner_applications")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: "找不到申請" });
    }
    return res.status(200).json({ application: data });
  }

  if (req.method === "PATCH") {
    const { action, admin_note } = req.body || {};

    const { data: app, error: fetchErr } = await partnerSupabase
      .from("partner_applications")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchErr || !app) {
      return res.status(404).json({ error: "找不到申請" });
    }

    if (action === "reject") {
      const { error } = await partnerSupabase
        .from("partner_applications")
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
      const authorRole = applyTypeToAuthorRole(app.apply_type);

      // 球場主／主揪：核准後寫入供稿白名單，即可投稿
      if (authorRole) {
        const { error: authorErr } = await communitySupabase
          .from("community_authors")
          .upsert(
            [
              {
                email: app.applicant_email.trim().toLowerCase(),
                name: app.company || app.applicant_name,
                role: authorRole,
                note: admin_note || `進駐申請核准`,
                added_by: adminEmail,
              },
            ],
            { onConflict: "email" },
          );

        if (authorErr) {
          return res.status(500).json({ error: authorErr.message });
        }
      }

      const { error } = await partnerSupabase
        .from("partner_applications")
        .update({
          status: "approved",
          admin_note: admin_note || null,
          reviewed_by: adminEmail,
          reviewed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json({
        ok: true,
        status: "approved",
        granted_posting: !!authorRole,
      });
    }

    return res.status(400).json({ error: "無效操作" });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
