/** 從 Google id_token + access_token 解析頭像與名稱 */
export async function resolveGoogleProfile(tokenData, idClaims = {}) {
  let name =
    idClaims.name ||
    [idClaims.given_name, idClaims.family_name].filter(Boolean).join(" ").trim();
  let picture = idClaims.picture || "";
  const email = idClaims.email || "";

  if ((!name || !picture) && tokenData?.access_token) {
    try {
      const res = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      });
      if (res.ok) {
        const info = await res.json();
        name = name || info.name || "";
        picture = picture || info.picture || "";
      }
    } catch {
      /* fallback to id_token claims */
    }
  }

  if (!name && email) {
    name = email.split("@")[0];
  }

  return {
    name: name.trim(),
    picture: picture.trim(),
    email,
  };
}

/** 從 LINE id_token + Profile API 解析頭像與名稱 */
export async function resolveLineProfile(tokenData, idClaims = {}) {
  let name = idClaims.name || "";
  let picture = idClaims.picture || "";
  const email = idClaims.email || "";

  if (tokenData?.access_token) {
    try {
      const res = await fetch("https://api.line.me/v2/profile", {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      });
      if (res.ok) {
        const profile = await res.json();
        name = name || profile.displayName || "";
        picture = picture || profile.pictureUrl || "";
      }
    } catch {
      /* fallback to id_token claims */
    }
  }

  if (!name && email) {
    name = email.split("@")[0];
  }

  return {
    name: name.trim(),
    picture: picture.trim(),
    email,
  };
}

/** 寫入 localStorage 供 UserContext 讀取 */
export function persistSocialProfile(provider, { name, picture, email }) {
  if (typeof window === "undefined") return;

  const prefix = provider;
  if (name) localStorage.setItem(`${prefix}_name`, name);
  if (picture) localStorage.setItem(`${prefix}_avatar`, picture);
  if (email) localStorage.setItem(`${prefix}_email`, email);
  localStorage.setItem(`is_${prefix}_login`, "true");

  ["google", "facebook", "line"].forEach((p) => {
    if (p !== provider) localStorage.removeItem(`is_${p}_login`);
  });
}
