export const MAX_INSTAGRAM_EMBEDS = 9;

/** 教練自行貼上的 IG 貼文／Reels 網址 */
export function normalizeInstagramPostUrl(input) {
  const trimmed = String(input || "").trim();
  if (!trimmed) return null;

  try {
    const url = new URL(trimmed.startsWith("http") ? trimmed : `https://${trimmed}`);
    if (!url.hostname.replace("www.", "").includes("instagram.com")) {
      return null;
    }

    let path = url.pathname.replace(/\/embed\/?$/, "");
    if (!/^\/(p|reel|reels|tv)\/[^/]+/.test(path)) {
      return null;
    }

    path = path.replace(/\/+$/, "") + "/";
    return `${url.origin}${path}`;
  } catch {
    return null;
  }
}

export function parseInstagramEmbedUrls(textOrList) {
  const lines = Array.isArray(textOrList)
    ? textOrList
    : String(textOrList || "")
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);

  const seen = new Set();
  const urls = [];

  for (const line of lines) {
    const normalized = normalizeInstagramPostUrl(line);
    if (normalized && !seen.has(normalized)) {
      seen.add(normalized);
      urls.push(normalized);
    }
    if (urls.length >= MAX_INSTAGRAM_EMBEDS) break;
  }

  return urls;
}
