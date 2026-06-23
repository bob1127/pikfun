/** 正規化球場資料中的縣市名稱（如 桃园市 → 桃園市） */
export function normalizeCourtCity(city) {
  return String(city || "")
    .trim()
    .replace(/园/g, "園");
}

/** 完整縣市名 → 按鈕顯示用簡稱（台中市 → 台中） */
export function cityToSearchLabel(city) {
  const normalized = normalizeCourtCity(city);
  return normalized.replace(/(市|縣)$/, "") || normalized;
}

/**
 * 從球場 city 列表產生去重、排序後的縣市標籤
 * @returns {{ full: string, label: string, search: string }[]}
 */
export function buildCourtCityTags(cities = []) {
  const fullNames = [
    ...new Set(cities.map(normalizeCourtCity).filter(Boolean)),
  ];

  const shortCounts = {};
  for (const full of fullNames) {
    const short = cityToSearchLabel(full);
    shortCounts[short] = (shortCounts[short] || 0) + 1;
  }

  const map = new Map();

  for (const full of fullNames) {
    const short = cityToSearchLabel(full);
    const label = shortCounts[short] > 1 ? full : short;
    map.set(full, { full, label, search: full });
  }

  return [...map.values()];
}

/** 台灣縣市列表（開團選地點等用途） */
export const TAIWAN_CITIES = [
  "基隆市",
  "台北市",
  "新北市",
  "桃園市",
  "新竹市",
  "新竹縣",
  "苗栗縣",
  "台中市",
  "彰化縣",
  "南投縣",
  "雲林縣",
  "嘉義市",
  "嘉義縣",
  "台南市",
  "高雄市",
  "屏東縣",
  "宜蘭縣",
  "花蓮縣",
  "台東縣",
  "澎湖縣",
  "金門縣",
];

export function sortCourtCityTags(tags) {
  const orderIndex = (full) => {
    const idx = TAIWAN_CITIES.indexOf(full);
    return idx === -1 ? 999 : idx;
  };

  return [...tags].sort((a, b) => {
    const diff = orderIndex(a.full) - orderIndex(b.full);
    if (diff !== 0) return diff;
    return a.full.localeCompare(b.full, "zh-Hant");
  });
}

export const EXTRA_QUICK_TAGS = ["團體班", "私人課", "初學", "免費"];
