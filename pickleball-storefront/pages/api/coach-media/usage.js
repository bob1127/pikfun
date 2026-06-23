import { assertCoachOwner } from "@/lib/coachOwnerAuth";
import { getCoachMediaUsage } from "@/lib/coachMediaAssets";
import { COACH_MEDIA_LIMITS } from "@/lib/coachMediaLimits";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { slug, email, member_id: memberId } = req.query;
  if (!slug || !email) {
    return res.status(400).json({ error: "缺少 slug 或 email" });
  }

  try {
    const coachRow = await assertCoachOwner(slug, { email, memberId });
    const usage = await getCoachMediaUsage(coachRow.id);
    return res.status(200).json({ usage, limits: COACH_MEDIA_LIMITS });
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message });
  }
}
