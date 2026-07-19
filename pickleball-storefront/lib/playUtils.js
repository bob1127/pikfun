export const SKILL_LABELS = {
  all: "不限程度",
  beginner: "初學",
  intermediate: "中階",
  advanced: "高階",
};

/** 開團表單：常見匹克球級數（DUPR 風格） */
export const SKILL_RATING_PRESETS = [
  "2.0",
  "2.5",
  "3.0",
  "3.5",
  "4.0",
  "4.5",
  "5.0",
  "5.5+",
];

export const SKILL_BADGE_STYLE = {
  background: "#e0f2fe",
  borderColor: "#7dd3fc",
  color: "#0369a1",
};

/** 依 t() 取得程度標籤（i18n），未提供 t 時回退中文 */
export function getSkillLabels(t) {
  if (!t) return SKILL_LABELS;
  return {
    all: t("skill.all"),
    beginner: t("skill.beginner"),
    intermediate: t("skill.intermediate"),
    advanced: t("skill.advanced"),
  };
}

export function getSkillLevelLabel(value, t) {
  const labels = getSkillLabels(t);
  if (!value || value === "all") return labels.all;
  if (labels[value]) return labels[value];
  if (value === "5.5+") return t ? t("skill.above", { value: "5.5" }) : "5.5 以上";
  if (/^\d+(\.\d)?$/.test(value))
    return t ? t("skill.level_suffix", { value }) : `${value} 級`;
  return value;
}

export const SKILL_COLORS = {
  all: "bg-[#3157B5]/10 text-[#3157B5]",
  beginner: "bg-green-100 text-green-700",
  intermediate: "bg-amber-100 text-amber-700",
  advanced: "bg-red-100 text-red-700",
};

export function getSkillLevelColor(value) {
  if (SKILL_COLORS[value]) return SKILL_COLORS[value];
  return "bg-sky-100 text-sky-700";
}

/** 全站活動時間一律以台灣時區顯示（伺服器端跑在 UTC，未指定會差 8 小時） */
const SESSION_TIME_ZONE = "Asia/Taipei";

export function formatSessionDate(iso, locale = "zh-TW") {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString(locale, {
    month: "long",
    day: "numeric",
    weekday: "short",
    timeZone: SESSION_TIME_ZONE,
  });
}

export function formatSessionTime(iso, locale = "zh-TW") {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleTimeString(locale, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: SESSION_TIME_ZONE,
  });
}

export function formatSessionRange(startsAt, endsAt, locale = "zh-TW") {
  const start = formatSessionTime(startsAt, locale);
  if (!endsAt) return start;
  return `${start} – ${formatSessionTime(endsAt, locale)}`;
}

/** 卡片用時間區間：18:00-19:00 */
export function formatCardTimeRange(startsAt, endsAt, locale = "zh-TW") {
  const start = formatSessionTime(startsAt, locale);
  if (!endsAt) return start;
  return `${start}-${formatSessionTime(endsAt, locale)}`;
}

/** 揪團卡片：2026.07.09 18:00-19:00 */
export function formatCardDateTime(startsAt, endsAt, locale = "zh-TW") {
  if (!startsAt) return "";
  const parts = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: SESSION_TIME_ZONE,
  }).format(new Date(startsAt)); // en-CA → YYYY-MM-DD
  const [y, m, day] = parts.split("-");
  return `${y}.${m}.${day} ${formatCardTimeRange(startsAt, endsAt, locale)}`;
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

/** 依 t() 取得付款方式選項（i18n），未提供 t 時回退中文 */
export function getPaymentMethods(t) {
  if (!t) return PAYMENT_METHODS;
  return [
    { value: "free", label: t("payment.free") },
    { value: "cash", label: t("payment.cash") },
    { value: "transfer", label: t("payment.transfer") },
    { value: "line_pay", label: t("payment.line_pay") },
    { value: "other", label: t("payment.other") },
  ];
}

export function getPaymentLabel(paymentMethod, t) {
  const methods = getPaymentMethods(t);
  const match = methods.find((m) => m.value === paymentMethod);
  return match ? match.label : paymentMethod;
}

export function formatFee(fee, paymentMethod, t) {
  if (!fee || fee === 0 || paymentMethod === "free")
    return t ? t("common.free") : "免費";
  const amount = `NT$ ${Number(fee).toLocaleString()}`;
  if (t) return `${amount}/${t("common.person_unit")}`;
  return `${amount}/人`;
}

export function buildGoogleMapsEmbedUrl(locationName, locationAddress, locale = "zh-TW") {
  const query = [locationName, locationAddress].filter(Boolean).join(" ");
  if (!query.trim()) return null;
  return `https://maps.google.com/maps?q=${encodeURIComponent(query)}&hl=${locale}&z=16&output=embed`;
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

/**
 * 驗證開團時間。
 * 提供 t() 時回傳已翻譯訊息；未提供 t 時回傳中文訊息或 errors.* 鍵名可自行翻譯。
 */
export function validateSessionTimes(startsAt, endsAt, t) {
  const tr = (key, fallback) => (t ? t(key) : fallback);
  const start = parseLocalDatetime(startsAt);
  if (!start) return tr("errors.startTimeInvalid", "開始時間格式不正確");
  if (start <= new Date()) return tr("errors.startInPast", "開始時間必須在未來");

  if (!endsAt) return null;

  const end = parseLocalDatetime(endsAt);
  if (!end) return tr("errors.endTimeInvalid", "結束時間格式不正確");
  if (!sameLocalDay(start, end))
    return tr("errors.endNotSameDay", "結束時間必須與開始時間同一天");
  if (end <= start) return tr("errors.endBeforeStart", "結束時間必須晚於開始時間");
  return null;
}

export function enrichPaymentFields(session, t) {
  if (!session) return session;
  return {
    ...session,
    payment_method_label: getPaymentLabel(session.payment_method, t),
  };
}
