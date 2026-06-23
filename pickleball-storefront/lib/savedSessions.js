/**
 * lib/savedSessions.js
 * localStorage-based saved sessions utility.
 * Key: "pikpie_saved_sessions" → JSON array of session objects (id, title, location_name, starts_at, fee_per_person, payment_method, max_players, host_name)
 */

const KEY = "pikpie_saved_sessions";

export function getSavedRaw() {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}

export function getSavedIds() {
  return new Set(getSavedRaw().map((s) => (typeof s === "string" ? s : s.id)));
}

/** Save full session object; toggle if already saved */
export function toggleSavedSession(session) {
  const raw = getSavedRaw();
  const idx = raw.findIndex((s) => {
    const id = typeof s === "string" ? s : s.id;
    return id === session.id;
  });
  let nowSaved;
  if (idx !== -1) {
    raw.splice(idx, 1);
    nowSaved = false;
  } else {
    raw.unshift({
      id: session.id,
      title: session.title,
      location_name: session.location_name,
      location_address: session.location_address,
      starts_at: session.starts_at,
      ends_at: session.ends_at,
      fee_per_person: session.fee_per_person,
      payment_method: session.payment_method,
      max_players: session.max_players,
      host_name: session.host_name,
      host_avatar: session.host_avatar,
      skill_level: session.skill_level,
      joined_count: session.joined_count,
      display_status: session.display_status,
      is_full: session.is_full,
      spots_left: session.spots_left,
      savedAt: new Date().toISOString(),
    });
    nowSaved = true;
  }
  localStorage.setItem(KEY, JSON.stringify(raw));
  // Dispatch event so other components can react
  window.dispatchEvent(new CustomEvent("savedSessionsChanged", { detail: { id: session.id, saved: nowSaved } }));
  return nowSaved;
}

export function isSaved(id) {
  return getSavedIds().has(id);
}
