import { coachSupabase } from "@/lib/featuredCoaches";
import { assertAdmin } from "@/lib/adminAuth";

export default async function handler(req, res) {
  const adminEmail = assertAdmin(req, res);
  if (!adminEmail) return;

  if (req.method === "GET") {
    const { status = "pending" } = req.query;

    let query = coachSupabase
      .from("coach_applications")
      .select("*")
      .order("created_at", { ascending: false });

    if (status !== "all") {
      query = query.eq("status", status);
    }

    const { data, error } = await query;
    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({ applications: data || [] });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
