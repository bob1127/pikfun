import { createClient } from "@supabase/supabase-js";
import { enrichPaymentFields } from "@/lib/playUtils";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

function enrichSession(session, participants = []) {
  const active = participants.filter((p) => p.status === "joined");
  const waitlist = participants.filter((p) => p.status === "waitlist");
  const joinedCount = active.length;
  const maxPlayers = session.max_players || 4;

  return enrichPaymentFields({
    ...session,
    participants: active,
    waitlist,
    joined_count: joinedCount,
    waitlist_count: waitlist.length,
    spots_left: Math.max(0, maxPlayers - joinedCount),
    is_full: joinedCount >= maxPlayers,
    display_status: session.status === "cancelled"
      ? "cancelled"
      : joinedCount >= maxPlayers
        ? "full"
        : "open",
  });
}

async function promoteWaitlist(sessionId) {
  const { data: session } = await supabase
    .from("play_sessions")
    .select("max_players")
    .eq("id", sessionId)
    .single();

  const { data: joined } = await supabase
    .from("play_session_participants")
    .select("id")
    .eq("session_id", sessionId)
    .eq("status", "joined");

  const joinedCount = joined?.length || 0;
  const maxPlayers = session?.max_players || 4;

  if (joinedCount >= maxPlayers) return;

  const { data: next } = await supabase
    .from("play_session_participants")
    .select("*")
    .eq("session_id", sessionId)
    .eq("status", "waitlist")
    .order("joined_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (next) {
    await supabase
      .from("play_session_participants")
      .update({ status: "joined" })
      .eq("id", next.id);
  }

  const newJoinedCount = joinedCount + (next ? 1 : 0);
  await supabase
    .from("play_sessions")
    .update({
      status: newJoinedCount >= maxPlayers ? "full" : "open",
      updated_at: new Date().toISOString(),
    })
    .eq("id", sessionId);
}

export default async function handler(req, res) {
  const { id } = req.query;

  if (req.method === "GET") {
    const { email } = req.query;

    const { data: session, error } = await supabase
      .from("play_sessions")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !session) {
      return res.status(404).json({ error: "找不到揪團" });
    }

    const { data: participants } = await supabase
      .from("play_session_participants")
      .select("*")
      .eq("session_id", id)
      .neq("status", "left")
      .order("joined_at", { ascending: true });

    const enriched = enrichSession(session, participants || []);
    let myStatus = null;
    if (email) {
      const mine = (participants || []).find(
        (p) => p.participant_email === email
      );
      myStatus = mine?.status || null;
    }

    return res.status(200).json({
      session: {
        ...enriched,
        my_status: myStatus,
        is_host: email ? session.host_email === email : false,
      },
    });
  }

  if (req.method === "PATCH") {
    const { action, participant_email, participant_name, participant_avatar } =
      req.body;

    if (!participant_email) {
      return res.status(400).json({ error: "請先登入會員" });
    }

    const { data: session, error: sessionErr } = await supabase
      .from("play_sessions")
      .select("*")
      .eq("id", id)
      .single();

    if (sessionErr || !session) {
      return res.status(404).json({ error: "找不到揪團" });
    }

    if (session.status === "cancelled") {
      return res.status(400).json({ error: "此揪團已取消" });
    }

    if (new Date(session.starts_at) <= new Date()) {
      return res.status(400).json({ error: "揪團已開始或已結束" });
    }

    if (action === "cancel") {
      if (session.host_email !== participant_email) {
        return res.status(403).json({ error: "只有團主可以取消揪團" });
      }
      await supabase
        .from("play_sessions")
        .update({ status: "cancelled", updated_at: new Date().toISOString() })
        .eq("id", id);
      return res.status(200).json({ ok: true, status: "cancelled" });
    }

    const { data: existing } = await supabase
      .from("play_session_participants")
      .select("*")
      .eq("session_id", id)
      .eq("participant_email", participant_email)
      .maybeSingle();

    if (action === "leave") {
      if (!existing || existing.status === "left") {
        return res.status(400).json({ error: "您尚未加入此揪團" });
      }
      if (session.host_email === participant_email) {
        return res.status(400).json({ error: "團主無法退出，請改為取消揪團" });
      }

      const wasJoined = existing.status === "joined";
      await supabase
        .from("play_session_participants")
        .update({ status: "left" })
        .eq("id", existing.id);

      if (wasJoined) {
        await promoteWaitlist(id);
      }

      return res.status(200).json({ ok: true, my_status: null });
    }

    if (action === "join") {
      if (existing && existing.status !== "left") {
        return res.status(400).json({ error: "您已在此揪團中" });
      }

      const { data: joinedList } = await supabase
        .from("play_session_participants")
        .select("id")
        .eq("session_id", id)
        .eq("status", "joined");

      const joinedCount = joinedList?.length || 0;
      const isFull = joinedCount >= session.max_players;
      const newStatus = isFull ? "waitlist" : "joined";

      if (existing?.status === "left") {
        await supabase
          .from("play_session_participants")
          .update({
            status: newStatus,
            participant_name: participant_name || existing.participant_name,
            participant_avatar:
              participant_avatar || existing.participant_avatar,
            joined_at: new Date().toISOString(),
          })
          .eq("id", existing.id);
      } else {
        await supabase.from("play_session_participants").insert([
          {
            session_id: id,
            participant_email,
            participant_name: participant_name || "會員",
            participant_avatar: participant_avatar || null,
            status: newStatus,
          },
        ]);
      }

      const newJoinedCount =
        newStatus === "joined" ? joinedCount + 1 : joinedCount;
      await supabase
        .from("play_sessions")
        .update({
          status: newJoinedCount >= session.max_players ? "full" : "open",
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);

      // ── Email 提醒（預設）：算出前 24h、前 2h，時間未過才寫入 ──────────
      const now = new Date();
      const reminderTimes = [
        new Date(new Date(session.starts_at).getTime() - 24 * 60 * 60 * 1000),
        new Date(new Date(session.starts_at).getTime() -  2 * 60 * 60 * 1000),
      ].filter((t) => t > now);

      if (reminderTimes.length > 0) {
        // 先清掉同一人同場次的舊提醒（避免重複）
        await supabase
          .from("play_session_reminders")
          .delete()
          .eq("session_id", id)
          .eq("participant_email", participant_email)
          .eq("sent", false);

        await supabase.from("play_session_reminders").insert(
          reminderTimes.map((t) => ({
            session_id: id,
            participant_email,
            remind_at: t.toISOString(),
            channel: "email",
          }))
        );
      }
      // ──────────────────────────────────────────────────────────────────────

      return res.status(200).json({
        ok: true,
        my_status: newStatus,
        message:
          newStatus === "waitlist"
            ? "名額已滿，已為您加入候補名單"
            : "成功加入揪團",
      });
    }

    return res.status(400).json({ error: "無效操作" });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
