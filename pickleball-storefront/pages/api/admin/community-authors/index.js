import { communitySupabase } from "@/lib/communityPosts";
import { assertAdmin } from "@/lib/adminAuth";

export default async function handler(req, res) {
  const adminEmail = assertAdmin(req, res);
  if (!adminEmail) return;

  if (req.method === "GET") {
    const { data, error } = await communitySupabase
      .from("community_authors")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ authors: data || [] });
  }

  if (req.method === "POST") {
    const { email, name, role, note } = req.body;

    if (!email?.trim()) {
      return res.status(400).json({ error: "請提供 email" });
    }
    if (!["court_owner", "organizer"].includes(role)) {
      return res.status(400).json({ error: "身分僅可為球場主或活動主揪" });
    }

    const { data, error } = await communitySupabase
      .from("community_authors")
      .upsert(
        [
          {
            email: email.trim().toLowerCase(),
            name: name || null,
            role,
            note: note || null,
            added_by: adminEmail,
          },
        ],
        { onConflict: "email" },
      )
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    return res.status(201).json({ author: data });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
