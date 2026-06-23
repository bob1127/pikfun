import { normalizeTaiwanAddress, districtMatches } from "@/lib/courtDistrict";

const PICKLEBALL_KEYWORDS =
  /匹克|pickle|pickleball|皮克|pick\s*zone|dink|pickzone/i;

const SPORTS_VENUE_TYPES = new Set([
  "gym",
  "stadium",
  "sports_complex",
  "health",
  "point_of_interest",
  "establishment",
]);

function getApiKey() {
  return (
    process.env.GOOGLE_MAPS_API_KEY?.trim() ||
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.trim() ||
    ""
  );
}

function friendlyGoogleError(message = "") {
  const msg = String(message);
  if (/enable Billing|billing account/i.test(msg)) {
    return "Google 地圖商家：請到 Google Cloud 專案「啟用帳單」（綁定金融卡）。免費額度內通常 $0，完成後重新整理此頁。";
  }
  if (/referer|referrer/i.test(msg)) {
    return "Google API 金鑰網站限制不符。伺服器搜尋請用「無」應用程式限制的金鑰，或另建伺服器專用金鑰。";
  }
  return msg || "Google Places API 未啟用或 Key 無權限";
}

/** 產生多組搜尋字串，提高涵蓋率 */
export function buildPlacesTextQueries({ city = "", district = "" } = {}) {
  const base = [city, district].filter(Boolean).join("");
  if (district) {
    return [
      `${base} 匹克球`,
      `${base} 匹克球場`,
      `${base} 匹克球館`,
      `${base} pickleball`,
    ];
  }
  return [
    `${city} 匹克球場`,
    `${city} 匹克球`,
    `${city} 匹克球館`,
    `${city} pickleball`,
    `${city} Pickleball`,
  ];
}

export function placeToCourt(place) {
  const name = place.name || place.displayName?.text || "";
  const address =
    place.formatted_address ||
    place.formattedAddress ||
    "";
  const lat =
    place.geometry?.location?.lat ??
    place.location?.latitude;
  const lng =
    place.geometry?.location?.lng ??
    place.location?.longitude;
  const placeId = place.place_id || place.id?.replace(/^places\//, "") || "";

  return {
    id: `google:${placeId}`,
    name,
    address,
    city: "",
    latitude: lat != null ? Number(lat) : null,
    longitude: lng != null ? Number(lng) : null,
    court_type: null,
    court_type_label: "Google 地圖",
    source: "google",
    place_id: placeId,
  };
}

export function isPickleballPlace(place) {
  const name = place.name || place.displayName?.text || "";
  const address = place.formatted_address || place.formattedAddress || "";
  const types = place.types || [];
  const blob = `${name} ${address} ${types.join(" ")}`;
  if (PICKLEBALL_KEYWORDS.test(blob)) return true;
  if (types.some((t) => SPORTS_VENUE_TYPES.has(t)) && /球/.test(blob)) {
    return PICKLEBALL_KEYWORDS.test(blob) || /匹克球|pickleball/i.test(blob);
  }
  return false;
}

export function isInCity(city, address) {
  if (!city) return true;
  const c = normalizeTaiwanAddress(city).replace(/市|縣$/, "");
  const addr = normalizeTaiwanAddress(address);
  return addr.includes(c);
}

export function isDuplicateCourt(local, googleCourt) {
  const a = normalizeTaiwanAddress(local.name);
  const b = normalizeTaiwanAddress(googleCourt.name);
  if (!a || !b) return false;
  if (a === b || a.includes(b) || b.includes(a)) return true;

  if (
    local.latitude != null &&
    googleCourt.latitude != null &&
    Math.abs(local.latitude - googleCourt.latitude) < 0.0005 &&
    Math.abs(local.longitude - googleCourt.longitude) < 0.0005
  ) {
    return true;
  }
  return false;
}

/** 合併 PikPie 資料庫與 Google 商家，本地資料優先 */
export function mergeCourtLists(localCourts = [], googleCourts = [], { typeFilter = "all" } = {}) {
  let local = [...localCourts];
  if (typeFilter && typeFilter !== "all") {
    local = local.filter((c) => c.court_type === typeFilter);
  }

  const google = googleCourts.filter(
    (g) => !local.some((l) => isDuplicateCourt(l, g))
  );

  return [
    ...local.map((c) => ({ ...c, source: c.source || "pikpie" })),
    ...google,
  ];
}

async function fetchTextSearchPage(query, apiKey, pageToken = null) {
  const url = new URL(
    "https://maps.googleapis.com/maps/api/place/textsearch/json"
  );
  url.searchParams.set("query", query);
  url.searchParams.set("key", apiKey);
  url.searchParams.set("language", "zh-TW");
  url.searchParams.set("region", "tw");
  if (pageToken) url.searchParams.set("pagetoken", pageToken);

  const res = await fetch(url.toString());
  return res.json();
}

async function searchSingleQuery(query, apiKey, maxPages = 2) {
  const places = [];
  let pageToken = null;

  for (let page = 0; page < maxPages; page += 1) {
    const data = await fetchTextSearchPage(query, apiKey, pageToken);

    if (data.status === "REQUEST_DENIED") {
      return { denied: true, message: data.error_message, places: [] };
    }

    if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
      break;
    }

    places.push(...(data.results || []));

    if (!data.next_page_token) break;
    pageToken = data.next_page_token;
    await new Promise((r) => setTimeout(r, 2100));
  }

  return { denied: false, places };
}

export async function searchGooglePickleballCourts({
  city = "",
  district = "",
  maxPages = 2,
} = {}) {
  const apiKey = getApiKey();
  if (!apiKey) {
    return { available: false, courts: [], message: "未設定 Google Maps API Key" };
  }

  const queries = buildPlacesTextQueries({ city, district });
  const courts = [];
  let deniedMessage = null;

  for (const query of queries) {
    const { denied, message, places } = await searchSingleQuery(
      query,
      apiKey,
      maxPages
    );

    if (denied) {
      deniedMessage = message;
      break;
    }

    const queryIsPickleball = PICKLEBALL_KEYWORDS.test(query);

    for (const place of places) {
      if (!queryIsPickleball && !isPickleballPlace(place)) continue;

      const court = placeToCourt(place);
      if (city && !isInCity(city, court.address)) continue;
      if (district && city && !districtMatches(city, court.address, district)) {
        continue;
      }
      courts.push(court);
    }
  }

  if (!courts.length && deniedMessage) {
    return {
      available: false,
      courts: [],
      message: friendlyGoogleError(deniedMessage),
    };
  }

  const unique = new Map();
  for (const c of courts) {
    if (!unique.has(c.place_id)) unique.set(c.place_id, c);
  }

  return {
    available: true,
    courts: [...unique.values()].sort((a, b) =>
      a.name.localeCompare(b.name, "zh-TW")
    ),
  };
}
