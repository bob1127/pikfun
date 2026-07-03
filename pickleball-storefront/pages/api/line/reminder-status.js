import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

/** 查詢會員是否已綁 LINE，以及此揪團是否已排 LINE 提醒 */
export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).end();

  const { email, session_id } = req.query;
  if (!email) {
    return res.status(400).json({ error: "缺少 email" });
  }

  const { data: profile } = await supabase
    .from("user_line_profiles")
    .select("line_user_id, friend_added")
    .eq("customer_email", String(email).toLowerCase())
    .maybeSingle();

  let lineReminderEnabled = false;
  if (session_id) {
    const { data: reminders } = await supabase
      .from("play_session_reminders")
      .select("id")
      .eq("session_id", String(session_id))
      .eq("participant_email", String(email).toLowerCase())
      .eq("channel", "line")
      .limit(1);

    lineReminderEnabled = (reminders?.length || 0) > 0;
  }

  return res.status(200).json({
    line_bound: Boolean(profile?.line_user_id),
    friend_added: Boolean(profile?.friend_added),
    line_reminder_enabled: lineReminderEnabled,
    /** 前端：已加入揪團且尚未排 LINE 提醒時顯示按鈕 */
    show_line_prompt: !lineReminderEnabled,
  });
}
