export function getAdminEmails() {
  const raw = process.env.ADMIN_EMAILS || process.env.NEXT_PUBLIC_ADMIN_EMAILS || "";
  return raw
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminEmail(email) {
  if (!email) return false;
  const admins = getAdminEmails();
  if (!admins.length) return false;
  return admins.includes(email.trim().toLowerCase());
}

export function assertAdmin(req, res) {
  const email =
    req.headers["x-admin-email"] ||
    req.body?.admin_email ||
    req.query?.admin_email;

  if (!isAdminEmail(email)) {
    res.status(403).json({ error: "無管理員權限" });
    return null;
  }
  return email;
}
