function normalize(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[|｜]/g, "")
    .trim();
}

/** 將揪團地點對應到球場資料取得經緯度 */
export function matchSessionToCourt(session, courts = []) {
  const name = normalize(session?.location_name);
  const addr = normalize(session?.location_address);
  if (!name && !addr) return null;

  const withCoords = courts.filter(
    (c) => Number.isFinite(c.latitude) && Number.isFinite(c.longitude)
  );

  const exactName = withCoords.find((c) => normalize(c.name) === name);
  if (exactName) return exactName;

  const partialName = withCoords.find(
    (c) =>
      (name && normalize(c.name).includes(name)) ||
      (name && name.includes(normalize(c.name)))
  );
  if (partialName) return partialName;

  if (addr) {
    const exactAddr = withCoords.find((c) => normalize(c.address) === addr);
    if (exactAddr) return exactAddr;

    const partialAddr = withCoords.find(
      (c) =>
        normalize(c.address).includes(addr) || addr.includes(normalize(c.address))
    );
    if (partialAddr) return partialAddr;
  }

  return null;
}

export function enrichSessionsWithCoords(sessions = [], courts = []) {
  return sessions.map((session) => {
    if (
      Number.isFinite(Number(session.latitude)) &&
      Number.isFinite(Number(session.longitude))
    ) {
      return {
        ...session,
        lat: Number(session.latitude),
        lng: Number(session.longitude),
      };
    }

    const court = matchSessionToCourt(session, courts);
    if (!court) {
      return { ...session, lat: null, lng: null, matched_court: null };
    }
    return {
      ...session,
      lat: court.latitude,
      lng: court.longitude,
      matched_court: court.name,
    };
  });
}

/** 同一球場的多場揪團合併為地圖標記 */
export function groupSessionsByLocation(sessions = []) {
  const mapped = sessions.filter((s) => s.lat != null && s.lng != null);
  const groups = new Map();

  for (const session of mapped) {
    const key = `${session.lat.toFixed(5)}_${session.lng.toFixed(5)}`;
    if (!groups.has(key)) {
      groups.set(key, {
        id: key,
        lat: session.lat,
        lng: session.lng,
        location_name: session.location_name,
        location_address: session.location_address,
        sessions: [],
      });
    }
    groups.get(key).sessions.push(session);
  }

  return [...groups.values()];
}
