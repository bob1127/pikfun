import { unifiedSearch } from "@/lib/unifiedSearch";
import { checkRateLimit, getClientIp } from "@/lib/apiRateLimit";

const VALID_TYPES = new Set([
  "product",
  "coach",
  "organizer",
  "author",
  "play_session",
  "coaching_class",
  "court",
  "news",
]);

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const rate = checkRateLimit(`global-search:${getClientIp(req)}`, {
    limit: 40,
    windowMs: 60_000,
  });
  if (!rate.allowed) {
    res.setHeader("Retry-After", String(rate.retryAfterSec));
    return res.status(429).json({ error: "搜尋次數過多，請稍後再試" });
  }

  const query = String(req.query.q || "").trim().slice(0, 80);
  if (query.length < 2) {
    return res.status(200).json({
      query,
      items: [],
      counts: {},
      partial: false,
      errors: [],
    });
  }

  const requestedTypes = String(req.query.types || "")
    .split(",")
    .map((value) => value.trim())
    .filter((value) => VALID_TYPES.has(value));
  const limit = Math.min(8, Math.max(1, Number(req.query.limit) || 5));
  const locale = req.query.locale === "en" ? "en" : "zh-TW";

  try {
    const result = await unifiedSearch({
      query,
      locale,
      limit,
      types: requestedTypes.length ? requestedTypes : undefined,
    });
    res.setHeader(
      "Cache-Control",
      "public, s-maxage=30, stale-while-revalidate=120",
    );
    return res.status(200).json(result);
  } catch (error) {
    console.error("Unified search error:", error);
    return res.status(500).json({ error: "全站搜尋暫時無法使用" });
  }
}
