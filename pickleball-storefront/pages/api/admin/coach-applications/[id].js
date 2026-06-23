import { coachSupabase } from "@/lib/featuredCoaches";
import { assertAdmin } from "@/lib/adminAuth";

export default async function handler(req, res) {
  const adminEmail = assertAdmin(req, res);
  if (!adminEmail) return;

  const { id } = req.query;

  if (req.method === "GET") {
    const { data: app, error } = await coachSupabase
      .from("coach_applications")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !app) {
      return res.status(404).json({ error: "找不到申請" });
    }

    return res.status(200).json({ application: app });
  }

  if (req.method === "PATCH") {
    const { action, admin_note, sort_order } = req.body;

    const { data: app, error: fetchErr } = await coachSupabase
      .from("coach_applications")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchErr || !app) {
      return res.status(404).json({ error: "找不到申請" });
    }

    if (action === "reject") {
      const { error } = await coachSupabase
        .from("coach_applications")
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
      if (app.status === "approved") {
        return res.status(400).json({ error: "此申請已核准" });
      }

      const coachRow = {
        slug: app.slug,
        member_id: app.member_id,
        applicant_email: app.applicant_email,
        name: app.name,
        title: app.title,
        subtitle: app.subtitle,
        avatar: app.avatar,
        cover_image: app.cover_image,
        video_url: app.video_url,
        featured_label: app.featured_label,
        city: app.city,
        region: app.region,
        tags: app.tags || [],
        excerpt: app.excerpt,
        bio: app.bio,
        story: app.story,
        credentials: app.credentials || [],
        specialties: app.specialties || [],
        email: app.contact_email || app.applicant_email,
        instagram: app.instagram,
        is_featured: true,
        sort_order: sort_order ?? 50,
        published_at: new Date().toISOString().slice(0, 10),
        updated_at: new Date().toISOString(),
      };

      const { data: existing } = await coachSupabase
        .from("featured_coaches")
        .select("id")
        .eq("slug", app.slug)
        .maybeSingle();

      let featuredCoachId = existing?.id;

      if (existing) {
        const { error: upErr } = await coachSupabase
          .from("featured_coaches")
          .update(coachRow)
          .eq("id", existing.id);
        if (upErr) return res.status(500).json({ error: upErr.message });
      } else {
        const { data: inserted, error: inErr } = await coachSupabase
          .from("featured_coaches")
          .insert([coachRow])
          .select()
          .single();
        if (inErr) return res.status(500).json({ error: inErr.message });
        featuredCoachId = inserted.id;
      }

      const { error: appErr } = await coachSupabase
        .from("coach_applications")
        .update({
          status: "approved",
          admin_note: admin_note || null,
          reviewed_by: adminEmail,
          reviewed_at: new Date().toISOString(),
          featured_coach_id: featuredCoachId,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (appErr) return res.status(500).json({ error: appErr.message });

      return res.status(200).json({
        ok: true,
        status: "approved",
        slug: app.slug,
        profile_url: `/coaching/coach/${app.slug}`,
      });
    }

    return res.status(400).json({ error: "無效操作" });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
