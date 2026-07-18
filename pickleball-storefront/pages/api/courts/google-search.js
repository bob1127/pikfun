import { getGoogleCourtsForSelection } from "@/lib/googlePlacesCached";
import { isForceRefreshAllowed } from "@/lib/googlePlacesCache";
import { TAIWAN_CITIES, normalizeCourtCity } from "@/lib/courtCities";
import { getDistrictsForCity } from "@/lib/taiwanDistricts";
import { normalizeTaiwanAddress } from "@/lib/courtDistrict";
import { checkRateLimit, getClientIp } from "@/lib/apiRateLimit";

/**
 * 安全 / 成本控制：
 * 1. 縣市白名單 — 任意字串會各自產生 Google 查詢與快取檔，白名單擋掉灌爆攻擊
 * 2. 區域白名單 — 空區域會觸發補抓（真 Google 呼叫），僅接受該縣市合法區域
 * 3. IP 限流 — 短時間爆量直接 429
 * 4. refresh=1 需管理金鑰，且受冷卻時間限制，不讓外部強制重打 Google
 * 5. 一般流量一律走檔案快取（TTL 預設 720 小時），cache miss 才打 Google
 */
export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // ── IP 限流：每分鐘 30 次、每小時 300 次 ──
  const ip = getClientIp(req);
  const perMinute = checkRateLimit(`courts:m:${ip}`, {
    limit: 30,
    windowMs: 60_000,
  });
  const perHour = checkRateLimit(`courts:h:${ip}`, {
    limit: 300,
    windowMs: 60 * 60_000,
  });
  if (!perMinute.allowed || !perHour.allowed) {
    const retry = Math.max(perMinute.retryAfterSec, perHour.retryAfterSec);
    res.setHeader("Retry-After", String(retry));
    return res.status(429).json({ error: "請求過於頻繁，請稍後再試" });
  }

  const { city = "", district = "", refresh = "" } = req.query;

  // ── 縣市白名單 ──
  const normalizedCity = normalizeCourtCity(
    normalizeTaiwanAddress(String(city))
  );
  if (!normalizedCity) {
    return res.status(400).json({ error: "請先選擇縣市" });
  }
  if (!TAIWAN_CITIES.includes(normalizedCity)) {
    return res.status(400).json({ error: "縣市不在支援範圍" });
  }

  // ── 區域白名單（防止亂填區域觸發補抓） ──
  let normalizedDistrict = "";
  if (district) {
    normalizedDistrict = normalizeTaiwanAddress(String(district));
    const validDistricts = getDistrictsForCity(normalizedCity);
    if (!validDistricts.includes(normalizedDistrict)) {
      return res.status(400).json({ error: "區域不在支援範圍" });
    }
  }

  // ── 強制更新：需管理金鑰 + 冷卻時間 ──
  let forceRefresh = false;
  if (refresh === "1") {
    const adminKey = process.env.COURTS_ADMIN_KEY || "";
    const provided = req.headers["x-admin-key"] || "";
    const authorized = adminKey && provided === adminKey;
    if (authorized && (await isForceRefreshAllowed(normalizedCity))) {
      forceRefresh = true;
    }
    // 未授權或冷卻中：靜默降級為一般快取查詢，不回報細節
  }

  try {
    const result = await getGoogleCourtsForSelection(normalizedCity, {
      district: normalizedDistrict,
      forceRefresh,
      allowSupplement: refresh !== "0",
    });

    res.setHeader("Cache-Control", "no-store");

    if (!result.available) {
      return res.status(200).json({
        available: false,
        message: result.message,
        count: 0,
        courts: [],
        allCourts: [],
        districts: [],
        cache: result.cache,
      });
    }

    return res.status(200).json({
      available: true,
      message: result.message,
      count: result.courts.length,
      courts: result.courts,
      allCourts: result.allCourts,
      supplemented: result.supplemented || false,
      districts: result.districts,
      cache: result.cache,
    });
  } catch (e) {
    console.error("[google-search]", e);
    return res.status(500).json({
      available: false,
      error: "Google 球場搜尋失敗",
      courts: [],
      districts: [],
    });
  }
}
