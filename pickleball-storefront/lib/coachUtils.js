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

export function formatClassDate(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("zh-TW", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
  });
}

export function formatClassTime(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleTimeString("zh-TW", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export function formatClassRange(startsAt, endsAt) {
  const s = formatClassTime(startsAt);
  if (!endsAt) return s;
  return `${s} – ${formatClassTime(endsAt)}`;
}

export function formatPrice(price) {
  if (!price || price === 0) return "免費";
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
