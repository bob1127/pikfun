import { communitySupabase } from "@/lib/communityPosts";
import { assertAdmin } from "@/lib/adminAuth";

export default async function handler(req, res) {
  const adminEmail = assertAdmin(req, res);
  if (!adminEmail) return;

  const { id } = req.query;

  if (req.method === "DELETE") {
    const { error } = await communitySupabase
      .from("community_authors")
      .delete()
      .eq("id", id);

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ ok: true });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
