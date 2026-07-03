import { createClient } from "@supabase/supabase-js";
import nodemailer from "nodemailer";
import {
  buildReminderContext,
  buildLineFlexMessage,
  buildReminderEmailHtml,
  buildReminderEmailSubject,
} from "@/lib/playReminderContent";

const LINE_CHANNEL_ACCESS_TOKEN =
  process.env.LINE_MESSAGING_CHANNEL_ACCESS_TOKEN || "";

const SMTP_HOST = process.env.SMTP_HOST || "";
const SMTP_PORT = Number(process.env.SMTP_PORT) || 465;
const SMTP_USER = process.env.SMTP_USER || "";
const SMTP_PASS = process.env.SMTP_PASS || "";
const MAIL_FROM = process.env.MAIL_FROM || "";

const CRON_SECRET = process.env.CRON_SECRET || "";
const LOOK_AHEAD_MINUTES = 15;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function sendLineMessage(lineUserId, session, reminder) {
  if (!LINE_CHANNEL_ACCESS_TOKEN) {
    console.warn("[cron/reminders] LINE_MESSAGING_CHANNEL_ACCESS_TOKEN 未設定，略過 LINE 通知");
    return;
  }

  const ctx = buildReminderContext(session, reminder);
  const flex = buildLineFlexMessage(ctx);

  const res = await fetch("https://api.line.me/v2/bot/message/push", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${LINE_CHANNEL_ACCESS_TOKEN}`,
    },
    body: JSON.stringify({
      to: lineUserId,
      messages: [flex],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`LINE Push 失敗: ${err}`);
  }
}

async function sendEmail(toEmail, session, reminder) {
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    console.warn("[cron/reminders] SMTP 未設定，略過 Email 通知");
    return;
  }

  const ctx = buildReminderContext(session, reminder);

  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });

  await transporter.sendMail({
    from: MAIL_FROM || `PikFun <${SMTP_USER}>`,
    to: toEmail,
    subject: buildReminderEmailSubject(ctx),
    html: buildReminderEmailHtml(ctx),
  });
}

export default async function handler(req, res) {
  if (CRON_SECRET) {
    const auth = req.headers.authorization || "";
    if (auth !== `Bearer ${CRON_SECRET}`) {
      return res.status(401).json({ error: "Unauthorized" });
    }
  }

  if (req.method !== "GET" && req.method !== "POST") {
    return res.status(405).end();
  }

  const now = new Date();
  const windowEnd = new Date(now.getTime() + LOOK_AHEAD_MINUTES * 60 * 1000);

  const { data: reminders, error } = await supabase
    .from("play_session_reminders")
    .select("*, play_sessions(*)")
    .eq("sent", false)
    .lte("remind_at", windowEnd.toISOString())
    .order("remind_at", { ascending: true })
    .limit(100);

  if (error) {
    console.error("[cron/reminders] DB 查詢失敗:", error);
    return res.status(500).json({ error: error.message });
  }

  const results = { sent: 0, skipped: 0, errors: [] };

  for (const reminder of reminders || []) {
    const session = reminder.play_sessions;
    if (!session) continue;

    if (session.status === "cancelled") {
      await supabase
        .from("play_session_reminders")
        .update({
          sent: true,
          sent_at: new Date().toISOString(),
          error_msg: "session cancelled",
        })
        .eq("id", reminder.id);
      results.skipped++;
      continue;
    }

    try {
      if (reminder.channel === "line") {
        const { data: profile } = await supabase
          .from("user_line_profiles")
          .select("line_user_id")
          .eq("customer_email", reminder.participant_email)
          .single();

        if (!profile?.line_user_id) throw new Error("LINE 帳號未綁定");
        await sendLineMessage(profile.line_user_id, session, reminder);
      } else {
        await sendEmail(reminder.participant_email, session, reminder);
      }

      await supabase
        .from("play_session_reminders")
        .update({ sent: true, sent_at: new Date().toISOString() })
        .eq("id", reminder.id);

      results.sent++;
    } catch (e) {
      console.error(`[cron/reminders] id=${reminder.id}`, e.message);
      await supabase
        .from("play_session_reminders")
        .update({ error_msg: e.message })
        .eq("id", reminder.id);
      results.errors.push({ id: reminder.id, error: e.message });
    }
  }

  return res.status(200).json({
    ok: true,
    total: (reminders || []).length,
    ...results,
  });
}
