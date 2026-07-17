import { createClient } from "@supabase/supabase-js";

export const partnerSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);

export const APPLY_TYPES = {
  coach: {
    key: "coach",
    label: "進駐教練",
    desc: "建立教練個人頁、開課招生，通過後可投稿至最新消息。",
    href: "/coaching/apply",
    badge: "教練",
  },
  vendor: {
    key: "vendor",
    label: "廠商（打廣告）",
    desc: "品牌曝光、廣告置放、聯名活動與贊助方案洽談。",
    href: "/member/apply/vendor",
    badge: "廠商",
  },
  court_owner: {
    key: "court_owner",
    label: "球場主（宣傳）",
    desc: "場地曝光、時段宣傳，核可後可投稿球場／活動資訊。",
    href: "/member/apply/court_owner",
    badge: "球場主",
  },
  organizer: {
    key: "organizer",
    label: "揪團主／活動策辦人",
    desc: "揪團、賽事與活動宣傳，核可後可投稿至最新消息。",
    href: "/member/apply/organizer",
    badge: "主揪",
  },
};

export const APPLY_TYPE_LABEL = {
  vendor: "廠商（打廣告）",
  court_owner: "球場主（宣傳）",
  organizer: "揪團主／活動策辦人",
};

/** community_authors.role 對應 */
export function applyTypeToAuthorRole(applyType) {
  if (applyType === "court_owner") return "court_owner";
  if (applyType === "organizer") return "organizer";
  return null;
}
