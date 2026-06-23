import { isAdminEmail } from "@/lib/adminAuth";

export default function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { email } = req.query;
  return res.status(200).json({ isAdmin: isAdminEmail(email) });
}
