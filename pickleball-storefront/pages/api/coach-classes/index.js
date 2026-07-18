import { createClient } from "@supabase/supabase-js";
import { enrichClassFields } from "@/lib/coachUtils";
import {
  filterCoachingClasses,
  rankCoachingSearchResults,
} from "@/lib/coachSearch";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const parseMissingColumn = (message) => {
  const m = message?.match(/Could not find the '(\w+)' column/);
  return m?.[1] || null;
};

async function insertWithFallback(row) {
  let current = { ...row };
  const extras = {};

  for (let i = 0; i < 10; i++) {
    const result = await supabase
      .from("coach_classes")
      .insert([current])
      .select()
      .single();
    if (!result.error) {
      return {
        data: { ...result.data, ...extras },
        error: null,
        notPersisted: Object.keys(extras),
      };
    }
    const missing = parseMissingColumn(result.error.message);
    if (!missing || !(missing in current)) return result;
    if (current[missing] != null) extras[missing] = current[missing];
    const next = { ...current };
    delete next[missing];
    current = next;
  }
  return { data: null, error: { message: "插入失敗" } };
}

function enrichClass(cls, enrollments = []) {
  const active = enrollments.filter((e) => e.status === "enrolled");
  const waitlist = enrollments.filter((e) => e.status === "waitlist");
  const enrolledCount = active.length;
  const maxStudents = cls.max_students || 4;
  const isFull = enrolledCount >= maxStudents;
  const spotsLeft = Math.max(0, maxStudents - enrolledCount);

  return enrichClassFields({
    ...cls,
    students: active,
    waitlist,
    enrolled_count: enrolledCount,
    waitlist_count: waitlist.length,
    spots_left: spotsLeft,
    is_full: isFull,
    display_status:
      cls.status === "cancelled"
        ? "cancelled"
        : isFull
          ? "full"
          : "open",
  });
}

export default async function handler(req, res) {
  if (req.method === "GET") {
    const { filter, email, class_type, skill_level, q } = req.query;
    const now = new Date().toISOString();
    const searchQuery = q?.trim() || "";
    const isSearching = searchQuery.length > 0;

    let query = supabase
      .from("coach_classes")
      .select("*")
      .order("starts_at", { ascending: true });

    // 有關鍵字時先查全部未取消課程，避免日期篩選把結果擋掉
    if (isSearching) {
      query = query.neq("status", "cancelled");
    } else if (filter !== "all") {
      query = query.gte("starts_at", now).neq("status", "cancelled");
    }

    if (class_type && class_type !== "all") {
      query = query.eq("class_type", class_type);
    }

    if (skill_level && skill_level !== "all") {
      query = query.eq("skill_level", skill_level);
    }

    const { data: classes, error } = await query;
    if (error) {
      return res.status(500).json({ error: error.message });
    }

    const ids = (classes || []).map((c) => c.id);
    let enrollmentsByClass = {};

    if (ids.length) {
      const { data: enrollments } = await supabase
        .from("coach_class_enrollments")
        .select("*")
        .in("class_id", ids)
        .neq("status", "left");

      for (const e of enrollments || []) {
        if (!enrollmentsByClass[e.class_id]) {
          enrollmentsByClass[e.class_id] = [];
        }
        enrollmentsByClass[e.class_id].push(e);
      }
    }

    let enriched = (classes || []).map((c) =>
      enrichClass(c, enrollmentsByClass[c.id] || [])
    );

    if (isSearching) {
      enriched = filterCoachingClasses(enriched, searchQuery);
      enriched = rankCoachingSearchResults(enriched, searchQuery);

      if (filter === "upcoming") {
        enriched = enriched.filter((c) => new Date(c.starts_at) >= new Date());
      }
    }

    if (filter === "teaching" && email) {
      enriched = enriched.filter((c) => c.coach_email === email);
    } else if (filter === "enrolled" && email) {
      enriched = enriched.filter((c) =>
        (enrollmentsByClass[c.id] || []).some(
          (e) =>
            e.student_email === email &&
            (e.status === "enrolled" || e.status === "waitlist")
        )
      );
    }

    if (email) {
      enriched = enriched.map((c) => {
        const mine = (enrollmentsByClass[c.id] || []).find(
          (e) => e.student_email === email && e.status !== "left"
        );
        return {
          ...c,
          my_status: mine?.status || null,
          is_coach: c.coach_email === email,
        };
      });
    }

    return res.status(200).json({
      classes: enriched,
      search: isSearching
        ? { query: searchQuery, count: enriched.length }
        : null,
    });
  }

  if (req.method === "POST") {
    const {
      title,
      description,
      curriculum,
      class_type,
      skill_level,
      location_name,
      location_address,
      latitude,
      longitude,
      court_id,
      starts_at,
      ends_at,
      max_students,
      price_per_person,
      payment_method,
      payment_note,
      coach_email,
      coach_name,
      coach_avatar,
      coach_bio,
      cover_image,
    } = req.body;

    if (!title || !location_name || !starts_at || !coach_email || !coach_name) {
      return res.status(400).json({ error: "請填寫必填欄位" });
    }

    if (new Date(starts_at) <= new Date()) {
      return res.status(400).json({ error: "開始時間必須在未來" });
    }

    // 驗證是否為核准教練
    const { data: approvedApp } = await supabase
      .from("coach_applications")
      .select("id")
      .ilike("applicant_email", coach_email.trim())
      .eq("status", "approved")
      .limit(1)
      .maybeSingle();

    if (!approvedApp) {
      const { data: featuredCoach } = await supabase
        .from("featured_coaches")
        .select("id")
        .ilike("applicant_email", coach_email.trim())
        .limit(1)
        .maybeSingle();

      if (!featuredCoach) {
        return res.status(403).json({ error: "僅限通過進駐審核的教練才能開課" });
      }
    }

    const price = Number(price_per_person) || 0;
    const payMethod = price === 0 ? "free" : payment_method || "cash";

    const result = await insertWithFallback({
      title,
      description: description || null,
      curriculum: curriculum || null,
      class_type: class_type || "group",
      skill_level: skill_level || "all",
      location_name,
      location_address: location_address || null,
      latitude: latitude != null ? Number(latitude) : null,
      longitude: longitude != null ? Number(longitude) : null,
      court_id: court_id || null,
      starts_at,
      ends_at: ends_at || null,
      max_students: max_students || 4,
      price_per_person: price,
      payment_method: payMethod,
      payment_note: payment_note || null,
      coach_email,
      coach_name,
      coach_avatar: coach_avatar || null,
      coach_bio: coach_bio || null,
      cover_image: cover_image || null,
    });

    if (result.error) {
      return res.status(500).json({ error: result.error.message });
    }

    return res.status(201).json({
      class: enrichClass(result.data, []),
      ...(result.notPersisted?.length
        ? {
            warning: `部分欄位未存入資料庫（${result.notPersisted.join("、")}）`,
          }
        : {}),
    });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
