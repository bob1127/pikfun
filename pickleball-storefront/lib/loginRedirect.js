// 登入後導回原頁面的工具
// 進入 /login 時記下來源頁（存 localStorage，社群登入跳轉外站後仍能取回），
// 登入成功後（Email 或社群 callback）讀出並導回。
const KEY = "login_redirect_path";
const LOCALES = ["zh-TW", "en"];

// 這些頁面不該作為登入後的目的地
const EXCLUDED_PREFIXES = ["/login", "/register", "/auth/", "/reset-password"];

function stripLocalePrefix(path) {
  for (const locale of LOCALES) {
    if (path === `/${locale}`) return "/";
    if (path.startsWith(`/${locale}/`)) return path.slice(locale.length + 1);
  }
  return path;
}

function isValidTarget(path) {
  if (!path || typeof path !== "string") return false;
  // 僅允許站內路徑，避免 open redirect
  if (!path.startsWith("/") || path.startsWith("//")) return false;
  return !EXCLUDED_PREFIXES.some((p) => path.startsWith(p));
}

export function rememberLoginRedirect(path) {
  try {
    const cleaned = stripLocalePrefix(path);
    if (isValidTarget(cleaned)) {
      localStorage.setItem(KEY, cleaned);
    }
  } catch {
    /* localStorage 不可用時略過 */
  }
}

// 讀出導回網址（含語系前綴）並清除記錄；沒有記錄時回首頁
export function consumeLoginRedirect(locale) {
  let path = "/";
  try {
    const saved = localStorage.getItem(KEY);
    localStorage.removeItem(KEY);
    if (isValidTarget(saved)) path = saved;
  } catch {
    /* localStorage 不可用時略過 */
  }
  const prefix = !locale || locale === "zh-TW" ? "" : `/${locale}`;
  return `${prefix}${path}` || "/";
}
