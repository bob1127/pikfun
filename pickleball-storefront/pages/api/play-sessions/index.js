import { createClient } from "@supabase/supabase-js";
import { enrichPaymentFields, validateSessionTimes } from "@/lib/playUtils";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const parseMissingColumn = (message) => {
  const m = message?.match(/Could not find the '(\w+)' column/);
  return m?.[1] || null;
};

async function insertWithFallback(row) {
  let current = { ...row };
  const extras = {};

  for (let i = 0; i < 10; i++) {
    const result = await supabase
      .from("play_sessions")
      .insert([current])
      .select()
      .single();
    if (!result.error) {
      return {
        data: { ...result.data, ...extras },
        error: null,
        notPersisted: Object.keys(extras),
      };
    }
    const missing = parseMissingColumn(result.error.message);
    if (!missing || !(missing in current)) return result;
    if (current[missing] != null) extras[missing] = current[missing];
    const next = { ...current };
    delete next[missing];
    current = next;
  }
  return { data: null, error: { message: "插入失敗" } };
}

function enrichSession(session, participants = []) {
  const active = participants.filter((p) => p.status === "joined");
  const waitlist = participants.filter((p) => p.status === "waitlist");
  const joinedCount = active.length;
  const maxPlayers = session.max_players || 4;
  const isFull = joinedCount >= maxPlayers;
  const spotsLeft = Math.max(0, maxPlayers - joinedCount);

  return enrichPaymentFields({
    ...session,
    participants: active,
    waitlist,
    joined_count: joinedCount,
    waitlist_count: waitlist.length,
    spots_left: spotsLeft,
    is_full: isFull,
    display_status: session.status === "cancelled"
      ? "cancelled"
      : isFull
        ? "full"
        : "open",
  });
}

export default async function handler(req, res) {
  if (req.method === "GET") {
    const { filter, email } = req.query;
    const now = new Date().toISOString();

    let query = supabase
      .from("play_sessions")
      .select("*")
      .order("starts_at", { ascending: true });

    if (filter !== "all") {
      query = query.gte("starts_at", now).neq("status", "cancelled");
    }

    const { data: sessions, error } = await query;
    if (error) {
      return res.status(500).json({ error: error.message });
    }

    const ids = (sessions || []).map((s) => s.id);
    let participantsBySession = {};

    if (ids.length) {
      const { data: participants } = await supabase
        .from("play_session_participants")
        .select("*")
        .in("session_id", ids)
        .neq("status", "left");

      for (const p of participants || []) {
        if (!participantsBySession[p.session_id]) {
          participantsBySession[p.session_id] = [];
        }
        participantsBySession[p.session_id].push(p);
      }
    }

    let enriched = (sessions || []).map((s) =>
      enrichSession(s, participantsBySession[s.id] || [])
    );

    if (filter === "hosting" && email) {
      enriched = enriched.filter((s) => s.host_email === email);
    } else if (filter === "joined" && email) {
      enriched = enriched.filter((s) =>
        (participantsBySession[s.id] || []).some(
          (p) =>
            p.participant_email === email &&
            (p.status === "joined" || p.status === "waitlist")
        )
      );
    }

    if (email) {
      enriched = enriched.map((s) => {
        const mine = (participantsBySession[s.id] || []).find(
          (p) => p.participant_email === email && p.status !== "left"
        );
        return {
          ...s,
          my_status: mine?.status || null,
          is_host: s.host_email === email,
        };
      });
    }

    return res.status(200).json({ sessions: enriched });
  }

  if (req.method === "POST") {
    const {
      title,
      description,
      location_name,
      location_address,
      latitude,
      longitude,
      court_id,
      starts_at,
      ends_at,
      max_players,
      skill_level,
      host_email,
      host_name,
      host_avatar,
      fee_per_person,
      payment_method,
      payment_note,
    } = req.body;

    if (!title || !location_name || !starts_at || !host_email || !host_name) {
      return res.status(400).json({ error: "請填寫必填欄位" });
    }

    const timeError = validateSessionTimes(starts_at, ends_at);
    if (timeError) {
      return res.status(400).json({ error: timeError });
    }

    const fee = Number(fee_per_person) || 0;
    const payMethod =
      fee === 0 ? "free" : payment_method || "cash";

    const result = await insertWithFallback({
      title,
      description: description || null,
      location_name,
      location_address: location_address || null,
      latitude: latitude != null ? Number(latitude) : null,
      longitude: longitude != null ? Number(longitude) : null,
      court_id: court_id || null,
      starts_at,
      ends_at: ends_at || null,
      max_players: max_players || 4,
      skill_level: skill_level || "all",
      host_email,
      host_name,
      host_avatar: host_avatar || null,
      fee_per_person: fee,
      payment_method: payMethod,
      payment_note: payment_note || null,
    });

    if (result.error) {
      return res.status(500).json({ error: result.error.message });
    }

    const session = result.data;

    await supabase.from("play_session_participants").insert([
      {
        session_id: session.id,
        participant_email: host_email,
        participant_name: host_name,
        participant_avatar: host_avatar || null,
        status: "joined",
      },
    ]);

    return res.status(201).json({
      session: enrichSession(session, [
        {
          participant_email: host_email,
          participant_name: host_name,
          participant_avatar: host_avatar,
          status: "joined",
        },
      ]),
      ...(result.notPersisted?.length
        ? { warning: `部分欄位未存入資料庫（${result.notPersisted.join("、")}），請執行 supabase/play_sessions_fee.sql` }
        : {}),
    });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
