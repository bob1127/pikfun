import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";

// ─── 填入你的金鑰（留空，之後在 .env.local 設定）─────────────────────────
// LINE Login Channel（跟現有 LINE 登入同一個 Channel 即可）
// NEXT_PUBLIC_LINE_CHANNEL_ID 已在 .env.local 存在
// LINE_CHANNEL_SECRET         已在 .env.local 存在
// ──────────────────────────────────────────────────────────────────────────

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/** 計算提醒時間（前 24h、前 2h），若時間已過就略過 */
function buildRemindTimes(startsAt: string): Date[] {
  const start = new Date(startsAt);
  const now = new Date();
  return [
    new Date(start.getTime() - 24 * 60 * 60 * 1000), // 前 24 小時
    new Date(start.getTime() -  2 * 60 * 60 * 1000), // 前 2 小時
  ].filter((t) => t > now);
}

/** 寫入 play_session_reminders（先刪同 session+email 的舊筆，再重建） */
async function upsertReminders(
  sessionId: string,
  participantEmail: string,
  startsAt: string,
  channel: "line" | "email"
) {
  // 刪除同一人同一場次的未送出提醒（重新綁定時更新 channel）
  await supabase
    .from("play_session_reminders")
    .delete()
    .eq("session_id", sessionId)
    .eq("participant_email", participantEmail)
    .eq("sent", false);

  const times = buildRemindTimes(startsAt);
  if (times.length === 0) return;

  const rows = times.map((t) => ({
    session_id: sessionId,
    participant_email: participantEmail,
    remind_at: t.toISOString(),
    channel,
  }));

  await supabase.from("play_session_reminders").insert(rows);
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") return res.status(405).end();

  const { code, session_id, customer_email } = req.body as {
    code: string;
    session_id: string;
    customer_email: string;
  };

  if (!code || !customer_email) {
    return res.status(400).json({ error: "缺少必要參數" });
  }

  const protocol = process.env.NODE_ENV === "development" ? "http" : "https";
  const host = req.headers.host;
  const redirectUri = `${protocol}://${host}/auth/line/bind-callback`;

  // ── Step 1：用 code 換 LINE token ─────────────────────────────
  const tokenParams = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri,
    client_id: process.env.NEXT_PUBLIC_LINE_CHANNEL_ID || "",
    client_secret: process.env.LINE_CHANNEL_SECRET || "",
  });

  const lineTokenRes = await fetch("https://api.line.me/oauth2/v2.1/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: tokenParams.toString(),
  });

  const tokenData = await lineTokenRes.json();
  if (!tokenData.id_token) {
    return res.status(400).json({ error: "LINE 授權失敗，請重試" });
  }

  // ── Step 2：解析 id_token 取得 LINE User ID ───────────────────
  const payloadB64 = tokenData.id_token.split(".")[1];
  const lineUser = JSON.parse(
    Buffer.from(payloadB64, "base64").toString("utf-8")
  );
  const lineUserId: string = lineUser.sub;

  // ── Step 3：存入 user_line_profiles（upsert）─────────────────
  await supabase.from("user_line_profiles").upsert(
    {
      customer_email,
      line_user_id: lineUserId,
      display_name: lineUser.name || null,
      picture_url: lineUser.picture || null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "customer_email" }
  );

  // ── Step 4：若有 session_id，建立 LINE 提醒排程 ───────────────
  if (session_id) {
    const { data: session } = await supabase
      .from("play_sessions")
      .select("starts_at")
      .eq("id", session_id)
      .single();

    if (session?.starts_at) {
      await upsertReminders(session_id, customer_email, session.starts_at, "line");
    }
  }

  return res.status(200).json({ ok: true, line_user_id: lineUserId });
}
