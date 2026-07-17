import { partnerSupabase, applyTypeToAuthorRole } from "@/lib/partnerApplications";
import { assertAdmin } from "@/lib/adminAuth";
import { communitySupabase } from "@/lib/communityPosts";

export default async function handler(req, res) {
  const adminEmail = assertAdmin(req, res);
  if (!adminEmail) return;

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { status = "pending" } = req.query;
  let query = partnerSupabase
    .from("partner_applications")
    .select("*")
    .order("created_at", { ascending: false });

  if (status !== "all") {
    query = query.eq("status", status);
  }

  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  return res.status(200).json({ applications: data || [] });
}
