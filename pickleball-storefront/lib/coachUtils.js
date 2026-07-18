// 預設（繁中）標籤 — 供伺服器端（無 locale 情境，如 API 搜尋索引）與尚未
// i18n 化的呼叫端使用。畫面顯示請優先使用下方 getXxxLabel(t, value) 或
// getXxxLabel(value, locale)，才能隨語言切換。
export const CLASS_TYPE_LABELS = {
  group: "團體班",
  private: "私人課",
  clinic: "主題班",
  beginner: "新手班",
};

export const CLASS_TYPE_COLORS = {
  group: "bg-[#FFD43A] text-black",
  private: "bg-black text-white",
  clinic: "bg-[#3157B5] text-white",
  beginner: "bg-[#F4596A] text-white",
};

export const SKILL_LABELS = {
  all: "不限程度",
  beginner: "初學",
  intermediate: "中階",
  advanced: "高階",
};

export const PAYMENT_METHODS = [
  { value: "free", label: "免費體驗" },
  { value: "cash", label: "現場現金" },
  { value: "transfer", label: "銀行轉帳" },
  { value: "line_pay", label: "LINE Pay" },
  { value: "other", label: "其他方式" },
];

export const PAYMENT_LABELS = Object.fromEntries(
  PAYMENT_METHODS.map((m) => [m.value, m.label])
);

const LOCALE_MAP = { "zh-TW": "zh-TW", zh: "zh-TW", en: "en-US" };

function resolveIntlLocale(locale) {
  return LOCALE_MAP[locale] || "zh-TW";
}

/**
 * 通用 enum label 取得器：
 * - 傳入 `t`（next-i18next 的 t function）→ 從 coaching.json 的 enums.* 取翻譯
 * - 傳入字串 locale（如 "en"）→ 從內建 fallback 表取對應語言（目前僅 zh-TW 有完整內建表，
 *   其餘語言請改用 t）
 */
function resolveEnumLabel(group, value, tOrLocale, fallbackTable) {
  if (!value) return "";
  if (typeof tOrLocale === "function") {
    const translated = tOrLocale(`coaching:enums.${group}.${value}`, {
      defaultValue: "",
    });
    if (translated) return translated;
  }
  return fallbackTable[value] || value;
}

/** 課程類型標籤，可傳入 t() 或忽略以取得繁中預設值 */
export function getClassTypeLabel(value, t) {
  return resolveEnumLabel("class_type", value, t, CLASS_TYPE_LABELS);
}

/** 適合程度標籤，可傳入 t() 或忽略以取得繁中預設值 */
export function getSkillLabel(value, t) {
  return resolveEnumLabel("skill", value, t, SKILL_LABELS);
}

/** 付款方式標籤，可傳入 t() 或忽略以取得繁中預設值 */
export function getPaymentLabel(value, t) {
  return resolveEnumLabel("payment", value, t, PAYMENT_LABELS);
}

/** 依 locale 取得課程類型 { value, label } 選項清單（供表單使用） */
export function getClassTypeOptions(t) {
  return Object.keys(CLASS_TYPE_LABELS).map((value) => ({
    value,
    label: getClassTypeLabel(value, t),
  }));
}

/** 依 locale 取得適合程度 { value, label } 選項清單（供表單使用） */
export function getSkillOptions(t) {
  return Object.keys(SKILL_LABELS).map((value) => ({
    value,
    label: getSkillLabel(value, t),
  }));
}

/** 依 locale 取得付款方式 { value, label } 選項清單（供表單使用） */
export function getPaymentOptions(t) {
  return PAYMENT_METHODS.map(({ value }) => ({
    value,
    label: getPaymentLabel(value, t),
  }));
}

export function formatClassDate(iso, locale = "zh-TW") {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString(resolveIntlLocale(locale), {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
  });
}

export function formatClassTime(iso, locale = "zh-TW") {
  if (!iso) return "";
  return new Date(iso).toLocaleTimeString(resolveIntlLocale(locale), {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export function formatClassRange(startsAt, endsAt, locale = "zh-TW") {
  const s = formatClassTime(startsAt, locale);
  if (!endsAt) return s;
  return `${s} – ${formatClassTime(endsAt, locale)}`;
}

/**
 * 價格格式化。第二參數可傳入 t() 以翻譯「免費」文字，或忽略取得繁中預設值。
 */
export function formatPrice(price, t) {
  if (!price || price === 0) {
    if (typeof t === "function") {
      return t("coaching:common.free", { defaultValue: "免費" });
    }
    return "免費";
  }
  return `NT$ ${Number(price).toLocaleString()}`;
}

export function enrichClassFields(item) {
  if (!item) return item;
  return {
    ...item,
    class_type_label: CLASS_TYPE_LABELS[item.class_type] || item.class_type,
    skill_level_label: SKILL_LABELS[item.skill_level] || item.skill_level,
    payment_method_label:
      PAYMENT_LABELS[item.payment_method] || item.payment_method,
  };
}
