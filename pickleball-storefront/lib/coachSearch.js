import {
  CLASS_TYPE_LABELS,
  SKILL_LABELS,
  PAYMENT_LABELS,
  formatPrice,
} from "./coachUtils";

/** 台灣常見地名別名（簡稱 ↔ 正式名稱） */
export const REGION_ALIASES = {
  台北: ["台北", "台北市", "臺北", "臺北市", "taipei"],
  新北: ["新北", "新北市", "new taipei"],
  桃園: ["桃園", "桃園市", "taoyuan"],
  台中: ["台中", "台中市", "臺中", "臺中市", "taichung"],
  台南: ["台南", "台南市", "臺南", "臺南市", "tainan"],
  高雄: ["高雄", "高雄市", "kaohsiung"],
  基隆: ["基隆", "基隆市", "keelung"],
  新竹: ["新竹", "新竹市", "新竹縣", "hsinchu"],
  苗栗: ["苗栗", "苗栗縣", "miaoli"],
  彰化: ["彰化", "彰化縣", "changhua"],
  南投: ["南投", "南投縣", "nantou"],
  雲林: ["雲林", "雲林縣", "yunlin"],
  嘉義: ["嘉義", "嘉義市", "嘉義縣", "chiayi"],
  屏東: ["屏東", "屏東縣", "pingtung"],
  宜蘭: ["宜蘭", "宜蘭縣", "yilan"],
  花蓮: ["花蓮", "花蓮縣", "hualien"],
  台東: ["台東", "台東縣", "臺東", "臺東縣", "taitung"],
  澎湖: ["澎湖", "澎湖縣", "penghu"],
  金門: ["金門", "金門縣", "kinmen"],
};

export function normalizeSearchText(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/臺/g, "台");
}

function tokenMatchesHaystack(token, haystack) {
  if (!token) return true;
  if (haystack.includes(token)) return true;

  for (const aliases of Object.values(REGION_ALIASES)) {
    const normalizedAliases = aliases.map(normalizeSearchText);
    if (!normalizedAliases.includes(token)) continue;
    if (normalizedAliases.some((alias) => haystack.includes(alias))) {
      return true;
    }
  }

  return false;
}

export function expandQueryTokens(query) {
  const rawTokens = String(query || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map(normalizeSearchText);

  const tokens = new Set(rawTokens);

  for (const token of rawTokens) {
    for (const aliases of Object.values(REGION_ALIASES)) {
      const normalizedAliases = aliases.map(normalizeSearchText);
      const hit = normalizedAliases.some(
        (alias) => token.includes(alias) || alias.includes(token)
      );
      if (hit) {
        normalizedAliases.forEach((alias) => tokens.add(alias));
      }
    }
  }

  return [...tokens];
}

export function buildClassSearchText(cls) {
  const parts = [
    cls.title,
    cls.description,
    cls.curriculum,
    cls.coach_name,
    cls.coach_bio,
    cls.coach_email,
    cls.location_name,
    cls.location_address,
    cls.class_type_label || CLASS_TYPE_LABELS[cls.class_type],
    cls.skill_level_label || SKILL_LABELS[cls.skill_level],
    cls.payment_method_label || PAYMENT_LABELS[cls.payment_method],
    cls.payment_note,
    cls.class_type,
    cls.skill_level,
    cls.payment_method,
    formatPrice(cls.price_per_person),
    cls.price_per_person != null ? String(cls.price_per_person) : "",
  ];

  return normalizeSearchText(parts.filter(Boolean).join(" "));
}

export function matchClassQuery(cls, query) {
  if (!query?.trim()) return true;

  const haystack = buildClassSearchText(cls);
  const tokens = expandQueryTokens(query);

  return tokens.every((token) => tokenMatchesHaystack(token, haystack));
}

export function filterCoachingClasses(classes, query) {
  if (!query?.trim()) return classes;
  return classes.filter((cls) => matchClassQuery(cls, query));
}

export function rankCoachingSearchResults(classes, query) {
  if (!query?.trim()) return classes;

  const tokens = expandQueryTokens(query);
  const now = Date.now();

  const scoreClass = (cls) => {
    let score = 0;
    const loc = normalizeSearchText(
      `${cls.location_name || ""}${cls.location_address || ""}`
    );
    const title = normalizeSearchText(cls.title);
    const coach = normalizeSearchText(cls.coach_name);
    const body = normalizeSearchText(
      `${cls.description || ""}${cls.curriculum || ""}`
    );

    for (const token of tokens) {
      if (loc.includes(token)) score += 20;
      if (title.includes(token)) score += 15;
      if (coach.includes(token)) score += 10;
      if (body.includes(token)) score += 5;
    }

    if (new Date(cls.starts_at).getTime() >= now) score += 3;
    if (cls.display_status === "open" && !cls.is_full) score += 2;

    return score;
  };

  return [...classes].sort((a, b) => scoreClass(b) - scoreClass(a));
}

/** 課程類型等非縣市快速篩選 */
export const EXTRA_QUICK_TAGS = ["團體班", "私人課", "初學", "免費"];
