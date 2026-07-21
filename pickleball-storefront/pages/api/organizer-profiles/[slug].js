import { getMedusaCustomer, AuthError } from "@/lib/medusaCustomerAuth";
import {
  dbRowToOrganizer,
  loadOrganizerBySlug,
  loadOrganizerSessions,
  organizerSupabase,
} from "@/lib/organizerProfiles";

const editableFields = new Set([
  "display_name",
  "title",
  "avatar",
  "cover_image",
  "city",
  "region",
  "excerpt",
  "bio",
  "story",
  "specialties",
  "tags",
  "instagram",
  "line_url",
  "instagram_url",
  "facebook_url",
  "contact_email",
]);

const cleanText = (value, max = 4000) =>
  String(value ?? "").trim().slice(0, max);
const cleanList = (value) =>
  (Array.isArray(value) ? value : String(value || "").split(/[,，、\n]/))
    .map((item) => cleanText(item, 40))
    .filter(Boolean)
    .slice(0, 20);
const SOCIAL_URL_FIELDS = new Set([
  "line_url",
  "instagram_url",
  "facebook_url",
]);

export default async function handler(req, res) {
  const { slug } = req.query;

  if (req.method === "GET") {
    try {
      const row = await loadOrganizerBySlug(slug);
      if (!row || !row.published) {
        return res.status(404).json({ error: "找不到活動策辦人" });
      }

      let isOwner = false;
      if (req.headers.authorization) {
        try {
          const customer = await getMedusaCustomer(req);
          isOwner = customer.id === row.member_id;
        } catch {
          isOwner = false;
        }
      }

      const sessions = await loadOrganizerSessions(row.owner_email);
      const now = Date.now();
      const upcoming = sessions
        .filter(
          (session) =>
            session.status !== "cancelled" &&
            new Date(session.starts_at).getTime() >= now,
        )
        .sort((a, b) => new Date(a.starts_at) - new Date(b.starts_at));
      const past = sessions.filter(
        (session) =>
          session.status === "cancelled" ||
          new Date(session.starts_at).getTime() < now,
      );

      return res.status(200).json({
        profile: dbRowToOrganizer(row),
        upcoming,
        past,
        stats: {
          total_sessions: sessions.length,
          upcoming_sessions: upcoming.length,
        },
        isOwner,
      });
    } catch (error) {
      console.error("organizer profile load error:", error);
      return res.status(500).json({ error: "活動策辦人資料載入失敗" });
    }
  }

  if (req.method === "PATCH") {
    try {
      const customer = await getMedusaCustomer(req);
      const row = await loadOrganizerBySlug(slug);
      if (!row) return res.status(404).json({ error: "找不到活動策辦人" });
      if (customer.id !== row.member_id) {
        return res.status(403).json({ error: "無權限編輯此介紹頁" });
      }

      const payload = {};
      for (const [key, value] of Object.entries(req.body || {})) {
        if (!editableFields.has(key)) continue;
        if (key === "specialties" || key === "tags") {
          payload[key] = cleanList(value);
        } else if (key === "bio" || key === "story") {
          payload[key] = cleanText(value, 8000);
        } else if (key === "avatar" || key === "cover_image") {
          const url = cleanText(value, 1000);
          if (url && !/^https?:\/\//i.test(url)) continue;
          payload[key] = url || null;
        } else if (SOCIAL_URL_FIELDS.has(key)) {
          const url = cleanText(value, 1000);
          if (url && !/^https?:\/\//i.test(url)) {
            return res.status(400).json({
              error: "社群連結需為完整的 http:// 或 https:// 網址",
            });
          }
          payload[key] = url || null;
        } else {
          payload[key] = cleanText(value, 300);
        }
      }
      payload.updated_at = new Date().toISOString();

      const { data, error } = await organizerSupabase
        .from("organizer_profiles")
        .update(payload)
        .eq("id", row.id)
        .select("*")
        .single();
      if (error) throw error;
      return res.status(200).json({ profile: dbRowToOrganizer(data) });
    } catch (error) {
      if (error instanceof AuthError) {
        return res.status(error.status).json({ error: error.message });
      }
      console.error("organizer profile update error:", error);
      return res.status(500).json({ error: "儲存失敗" });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
