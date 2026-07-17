import { checkPostingEligibility } from "@/lib/communityPosts";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { email } = req.query;
  if (!email) {
    return res.status(400).json({ error: "請提供 email" });
  }

  const result = await checkPostingEligibility(email);
  return res.status(200).json(result);
}
