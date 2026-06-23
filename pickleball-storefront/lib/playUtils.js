export const SKILL_LABELS = {
  all: "不限程度",
  beginner: "初學",
  intermediate: "中階",
  advanced: "高階",
};

export const SKILL_COLORS = {
  all: "bg-[#3157B5]/10 text-[#3157B5]",
  beginner: "bg-green-100 text-green-700",
  intermediate: "bg-amber-100 text-amber-700",
  advanced: "bg-red-100 text-red-700",
};

export function formatSessionDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString("zh-TW", {
    month: "long",
    day: "numeric",
    weekday: "short",
  });
}

export function formatSessionTime(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleTimeString("zh-TW", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export function formatSessionRange(startsAt, endsAt) {
  const start = formatSessionTime(startsAt);
  if (!endsAt) return start;
  return `${start} – ${formatSessionTime(endsAt)}`;
}

export const PAYMENT_METHODS = [
  { value: "free", label: "免費" },
  { value: "cash", label: "現場現金" },
  { value: "transfer", label: "銀行轉帳" },
  { value: "line_pay", label: "LINE Pay" },
  { value: "other", label: "其他方式" },
];

export const PAYMENT_LABELS = Object.fromEntries(
  PAYMENT_METHODS.map((m) => [m.value, m.label])
);

export function formatFee(fee, paymentMethod) {
  if (!fee || fee === 0 || paymentMethod === "free") return "免費";
  return `NT$ ${Number(fee).toLocaleString()}/人`;
}

export function buildGoogleMapsEmbedUrl(locationName, locationAddress) {
  const query = [locationName, locationAddress].filter(Boolean).join(" ");
  if (!query.trim()) return null;
  return `https://maps.google.com/maps?q=${encodeURIComponent(query)}&hl=zh-TW&z=16&output=embed`;
}

export function buildGoogleMapsLink(locationName, locationAddress) {
  const query = [locationName, locationAddress].filter(Boolean).join(" ");
  if (!query.trim()) return null;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

export function isSessionPast(startsAt) {
  return new Date(startsAt) <= new Date();
}

function pad2(n) {
  return String(n).padStart(2, "0");
}

/** datetime-local 字串 → Date */
export function parseLocalDatetime(value) {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function toLocalDatetimeValue(date) {
  if (!date || Number.isNaN(date.getTime())) return "";
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(
    date.getDate()
  )}T${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
}

export function sameLocalDay(a, b) {
  if (!a || !b) return false;
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function endOfLocalDay(date) {
  const d = new Date(date);
  d.setHours(23, 59, 0, 0);
  return d;
}

const MIN_SESSION_MS = 60 * 60 * 1000;
const DEFAULT_SESSION_MS = 2 * 60 * 60 * 1000;

/** 開始時間變更時，同步結束時間（同一天、晚於開始） */
export function syncEndsAtOnStartChange(startsAt, endsAt) {
  const start = parseLocalDatetime(startsAt);
  if (!start) return { starts_at: startsAt, ends_at: endsAt };

  let end = parseLocalDatetime(endsAt);
  if (!end || !sameLocalDay(start, end)) {
    end = new Date(start.getTime() + DEFAULT_SESSION_MS);
    if (!sameLocalDay(start, end)) end = endOfLocalDay(start);
  }
  if (end <= start) {
    end = new Date(start.getTime() + MIN_SESSION_MS);
    if (end > endOfLocalDay(start)) end = endOfLocalDay(start);
  }

  return {
    starts_at: startsAt,
    ends_at: toLocalDatetimeValue(end),
  };
}

/** 結束時間變更時，強制與開始同一天 */
export function syncEndsAtOnEndChange(startsAt, endsAt) {
  const start = parseLocalDatetime(startsAt);
  const end = parseLocalDatetime(endsAt);
  if (!start || !end) return { ends_at: endsAt };

  const aligned = new Date(start);
  aligned.setHours(end.getHours(), end.getMinutes(), 0, 0);

  const dayEnd = endOfLocalDay(start);
  let next = aligned > dayEnd ? dayEnd : aligned;
  if (next <= start) {
    next = new Date(Math.min(start.getTime() + MIN_SESSION_MS, dayEnd.getTime()));
  }

  return { ends_at: toLocalDatetimeValue(next) };
}

/** 結束時間可選範圍（同一天內） */
export function getEndsAtBounds(startsAt) {
  const start = parseLocalDatetime(startsAt);
  if (!start) return { min: "", max: "" };
  const min = new Date(start.getTime() + 60 * 1000);
  return { min: toLocalDatetimeValue(min), max: toLocalDatetimeValue(endOfLocalDay(start)) };
}

export function validateSessionTimes(startsAt, endsAt) {
  const start = parseLocalDatetime(startsAt);
  if (!start) return "開始時間格式不正確";
  if (start <= new Date()) return "開始時間必須在未來";

  if (!endsAt) return null;

  const end = parseLocalDatetime(endsAt);
  if (!end) return "結束時間格式不正確";
  if (!sameLocalDay(start, end)) return "結束時間必須與開始時間同一天";
  if (end <= start) return "結束時間必須晚於開始時間";
  return null;
}

export function enrichPaymentFields(session) {
  if (!session) return session;
  return {
    ...session,
    payment_method_label:
      PAYMENT_LABELS[session.payment_method] || session.payment_method,
  };
}
