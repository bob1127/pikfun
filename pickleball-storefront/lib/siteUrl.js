/** 正式站點網域（可被 NEXT_PUBLIC_SITE_URL 覆寫） */
export const DEFAULT_SITE_URL = "https://www.pikfun.com.tw";

export const DEFAULT_CONTACT_EMAIL = "contact@pikfun.com.tw";
export const DEFAULT_SERVICE_EMAIL = "service@pikfun.com.tw";

export function getSiteUrl() {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_STORE_URL ||
    DEFAULT_SITE_URL
  ).replace(/\/$/, "");
}
