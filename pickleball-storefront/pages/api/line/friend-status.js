import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const LINE_TOKEN =
  process.env.LINE_MESSAGING_CHANNEL_ACCESS_TOKEN || "";

/** 透過 Messaging API 確認是否已加官方帳號好友 */
async function checkLineFriendship(lineUserId) {
  if (!LINE_TOKEN || !lineUserId) return null;

  const res = await fetch(
    `https://api.line.me/v2/bot/profile/${encodeURIComponent(lineUserId)}`,
    {
      headers: { Authorization: `Bearer ${LINE_TOKEN}` },
    }
  );

  if (res.ok) return true;
  if (res.status === 404) return false;
  return null;
}

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).end();

  const email = String(req.query.email || "").toLowerCase().trim();
  if (!email) {
    return res.status(400).json({ error: "缺少 email" });
  }

  const { data: profile } = await supabase
    .from("user_line_profiles")
    .select("line_user_id, friend_added")
    .eq("customer_email", email)
    .maybeSingle();

  if (!profile?.line_user_id) {
    return res.status(200).json({
      friend_added: false,
      line_bound: false,
      check_available: Boolean(LINE_TOKEN),
    });
  }

  if (profile.friend_added) {
    return res.status(200).json({
      friend_added: true,
      line_bound: true,
      check_available: Boolean(LINE_TOKEN),
    });
  }

  const isFriend = await checkLineFriendship(profile.line_user_id);

  if (isFriend === true) {
    await supabase
      .from("user_line_profiles")
      .update({
        friend_added: true,
        updated_at: new Date().toISOString(),
      })
      .eq("customer_email", email);

    return res.status(200).json({
      friend_added: true,
      line_bound: true,
      check_available: true,
    });
  }

  return res.status(200).json({
    friend_added: false,
    line_bound: true,
    check_available: isFriend !== null,
  });
}
