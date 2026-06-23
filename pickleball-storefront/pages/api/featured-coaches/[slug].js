import {
  loadAllFeaturedCoaches,
  loadFeaturedCoachBySlug,
  coachSupabase,
} from "@/lib/featuredCoaches";
import { isCoachOwner } from "@/lib/coachOwnerAuth";
import { sanitizeCoachHtml } from "@/lib/sanitizeCoachHtml";
import {
  dbRowToCoach,
  commaToArray,
  linesToArray,
} from "@/lib/coachProfileFields";
import { parseInstagramEmbedUrls } from "@/lib/instagramEmbed";

export default async function handler(req, res) {
  const { slug } = req.query;

  if (req.method === "GET") {
    try {
      const coach = await loadFeaturedCoachBySlug(slug);
      if (!coach) {
        return res.status(404).json({ error: "找不到教練" });
      }

      const { email, member_id: memberId } = req.query;
      const isOwner =
        email && isCoachOwner(coach, { email, memberId });

      const data = await loadAllFeaturedCoaches();
      const related = (data.coaches || [])
        .filter((c) => c.slug !== slug)
        .sort((a, b) => {
          if (a.city === coach.city && b.city !== coach.city) return -1;
          if (b.city === coach.city && a.city !== coach.city) return 1;
          return (a.sort_order || 99) - (b.sort_order || 99);
        })
        .slice(0, 4);

      const allTags = [
        ...new Set((data.coaches || []).flatMap((c) => c.tags || [])),
      ].slice(0, 12);

      return res.status(200).json({
        coach,
        related,
        allTags,
        isOwner: Boolean(isOwner),
      });
    } catch {
      return res.status(500).json({ error: "教練資料載入失敗" });
    }
  }

  if (req.method === "PATCH") {
    const {
      email,
      member_id: memberId,
      name,
      title,
      subtitle,
      city,
      region,
      excerpt,
      bio,
      bio_html,
      story,
      story_html,
      credentials,
      specialties,
      tags,
      video_url,
      featured_label,
      contact_email,
      instagram,
      cover_image,
      avatar,
      instagram_embed_urls,
    } = req.body;

    if (!email) {
      return res.status(400).json({ error: "請先登入" });
    }

    try {
      const { data: row, error: fetchErr } = await coachSupabase
        .from("featured_coaches")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();

      if (fetchErr) throw fetchErr;
      if (!row) {
        return res.status(404).json({
          error: "找不到教練（僅審核通過的教練可編輯）",
        });
      }

      if (!isCoachOwner(row, { email, memberId })) {
        return res.status(403).json({ error: "無權限編輯此教練頁面" });
      }

      const payload = {
        updated_at: new Date().toISOString(),
      };

      if (name !== undefined) payload.name = String(name).trim();
      if (title !== undefined) payload.title = String(title).trim();
      if (subtitle !== undefined) payload.subtitle = String(subtitle).trim();
      if (city !== undefined) payload.city = String(city).trim();
      if (region !== undefined) payload.region = String(region).trim();
      if (excerpt !== undefined) payload.excerpt = String(excerpt).trim();
      if (bio !== undefined) payload.bio = String(bio).trim();
      if (story !== undefined) payload.story = String(story).trim();
      if (bio_html !== undefined) {
        payload.bio_html = sanitizeCoachHtml(bio_html);
      }
      if (story_html !== undefined) {
        payload.story_html = sanitizeCoachHtml(story_html);
      }
      if (video_url !== undefined) payload.video_url = String(video_url).trim();
      if (featured_label !== undefined) {
        payload.featured_label = String(featured_label).trim();
      }
      if (contact_email !== undefined) {
        payload.email = String(contact_email).trim();
      }
      if (instagram !== undefined) {
        payload.instagram = String(instagram).replace("@", "").trim();
      }
      if (cover_image !== undefined) payload.cover_image = cover_image;
      if (avatar !== undefined) payload.avatar = avatar;

      if (credentials !== undefined) {
        payload.credentials = Array.isArray(credentials)
          ? credentials
          : linesToArray(credentials);
      }
      if (specialties !== undefined) {
        payload.specialties = Array.isArray(specialties)
          ? specialties
          : commaToArray(specialties);
      }
      if (tags !== undefined) {
        payload.tags = Array.isArray(tags) ? tags : commaToArray(tags);
      }
      if (instagram_embed_urls !== undefined) {
        payload.instagram_embed_urls = parseInstagramEmbedUrls(
          instagram_embed_urls
        );
      }

      const { data: updated, error: updateErr } = await coachSupabase
        .from("featured_coaches")
        .update(payload)
        .eq("id", row.id)
        .select("*")
        .single();

      if (updateErr) throw updateErr;

      return res.status(200).json({ coach: dbRowToCoach(updated) });
    } catch (err) {
      console.error("coach profile update error:", err);
      return res.status(500).json({ error: err.message || "儲存失敗" });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
