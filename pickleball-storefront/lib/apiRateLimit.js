/**
 * 輕量級 in-memory 限流（sliding-window bucket）。
 * 用於保護會產生外部 API 費用的端點（如 Google Places）。
 * 單機部署即生效；多節點部署時每節點各自計數，仍可擋住單點爆量。
 */

const buckets = new Map();
const MAX_BUCKETS = 10000;

export function getClientIp(req) {
  const fwd = req.headers["x-forwarded-for"];
  if (typeof fwd === "string" && fwd.length > 0) {
    return fwd.split(",")[0].trim();
  }
  return req.socket?.remoteAddress || "unknown";
}

function sweep(now) {
  for (const [key, entry] of buckets) {
    if (now >= entry.resetAt) buckets.delete(key);
  }
}

/**
 * @returns {{ allowed: boolean, retryAfterSec: number }}
 */
export function checkRateLimit(key, { limit = 30, windowMs = 60_000 } = {}) {
  const now = Date.now();

  if (buckets.size > MAX_BUCKETS) sweep(now);

  let entry = buckets.get(key);
  if (!entry || now >= entry.resetAt) {
    entry = { count: 0, resetAt: now + windowMs };
    buckets.set(key, entry);
  }

  entry.count += 1;

  if (entry.count > limit) {
    return {
      allowed: false,
      retryAfterSec: Math.max(1, Math.ceil((entry.resetAt - now) / 1000)),
    };
  }
  return { allowed: true, retryAfterSec: 0 };
}
