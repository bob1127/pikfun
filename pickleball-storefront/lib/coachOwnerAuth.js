import { coachSupabase } from "@/lib/featuredCoaches";

export function emailsMatch(a, b) {
  if (!a || !b) return false;
  return String(a).trim().toLowerCase() === String(b).trim().toLowerCase();
}

export function isCoachOwner(coachRow, { email, memberId }) {
  if (!coachRow) return false;
  if (memberId && coachRow.member_id && coachRow.member_id === memberId) {
    return true;
  }
  const ownerEmail = coachRow.applicant_email || coachRow.email;
  return emailsMatch(ownerEmail, email);
}

export async function loadCoachRowBySlug(slug) {
  const { data, error } = await coachSupabase
    .from("featured_coaches")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function assertCoachOwner(slug, { email, memberId }) {
  const row = await loadCoachRowBySlug(slug);
  if (!row) {
    const err = new Error("找不到教練");
    err.status = 404;
    throw err;
  }
  if (!isCoachOwner(row, { email, memberId })) {
    const err = new Error("無權限編輯此教練頁面");
    err.status = 403;
    throw err;
  }
  return row;
}
