import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

/** 使用者手動確認已加好友（Messaging API 未設定時的後備） */
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const email = String(req.body?.email || "").toLowerCase().trim();
  if (!email) {
    return res.status(400).json({ error: "缺少 email" });
  }

  const { data: profile } = await supabase
    .from("user_line_profiles")
    .select("id")
    .eq("customer_email", email)
    .maybeSingle();

  if (!profile) {
    return res.status(404).json({ error: "尚未綁定 LINE" });
  }

  await supabase
    .from("user_line_profiles")
    .update({
      friend_added: true,
      updated_at: new Date().toISOString(),
    })
    .eq("customer_email", email);

  return res.status(200).json({ friend_added: true });
}
