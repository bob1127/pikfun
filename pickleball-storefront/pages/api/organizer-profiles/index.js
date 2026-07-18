import { getMedusaCustomer, AuthError } from "@/lib/medusaCustomerAuth";
import {
  dbRowToOrganizer,
  ensureOrganizerProfile,
  organizerSupabase,
} from "@/lib/organizerProfiles";

export default async function handler(req, res) {
  if (!["GET", "POST"].includes(req.method)) {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // 公開列表：GET /api/organizer-profiles?list=1（僅回傳公開欄位）
  if (req.method === "GET" && req.query.list) {
    try {
      const { data, error } = await organizerSupabase
        .from("organizer_profiles")
        .select(
          "slug,display_name,title,avatar,cover_image,city,excerpt,bio,story,specialties,tags,instagram,created_at",
        )
        .eq("published", true)
        .order("created_at", { ascending: true })
        .limit(50);
      if (error) throw error;
      return res.status(200).json({ profiles: data || [] });
    } catch (error) {
      console.error("organizer profiles list error:", error);
      return res.status(200).json({ profiles: [] });
    }
  }

  try {
    const customer = await getMedusaCustomer(req);
    const profile = await ensureOrganizerProfile(customer);
    return res.status(req.method === "POST" ? 201 : 200).json({
      profile: dbRowToOrganizer(profile),
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return res.status(error.status).json({ error: error.message });
    }
    console.error("organizer profile ensure error:", error);
    const missingTable = /organizer_profiles/i.test(error.message || "");
    return res.status(500).json({
      error: missingTable
        ? "尚未建立揪團主資料表，請先執行 organizer_profiles.sql"
        : "建立揪團主介紹頁失敗",
    });
  }
}
