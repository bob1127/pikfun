import { coachSupabase } from "@/lib/featuredCoaches";
import { dbRowToCoach } from "@/lib/coachProfileFields";
import { enrichClassFields } from "@/lib/coachUtils";

function emailsMatch(a, b) {
  if (!a || !b) return false;
  return String(a).trim().toLowerCase() === String(b).trim().toLowerCase();
}

function enrichClass(cls, enrollments = []) {
  const active = enrollments.filter((e) => e.status === "enrolled");
  const waitlist = enrollments.filter((e) => e.status === "waitlist");
  const enrolledCount = active.length;
  const maxStudents = cls.max_students || 4;
  return enrichClassFields({
    ...cls,
    enrolled_count: enrolledCount,
    waitlist_count: waitlist.length,
    spots_left: Math.max(0, maxStudents - enrolledCount),
    is_full: enrolledCount >= maxStudents,
    display_status:
      cls.status === "cancelled"
        ? "cancelled"
        : enrolledCount >= maxStudents
          ? "full"
          : "open",
  });
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { email, member_id: memberId } = req.query;
  if (!email) {
    return res.status(400).json({ error: "請提供 email" });
  }

  try {
    let coachRow = null;

    const { data: byEmail } = await coachSupabase
      .from("featured_coaches")
      .select("*")
      .ilike("applicant_email", email.trim())
      .maybeSingle();

    coachRow = byEmail;

    if (!coachRow && memberId) {
      const { data: byMember } = await coachSupabase
        .from("featured_coaches")
        .select("*")
        .eq("member_id", memberId)
        .maybeSingle();
      coachRow = byMember;
    }

    const { data: application } = await coachSupabase
      .from("coach_applications")
      .select("id, status, slug, name, created_at, reviewed_at, admin_note")
      .ilike("applicant_email", email.trim())
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    // Fallback: search by member_id if email didn't match (user may have applied with a different email)
    let resolvedApplication = application;
    if (!resolvedApplication && memberId) {
      const { data: byMemberId } = await coachSupabase
        .from("coach_applications")
        .select("id, status, slug, name, created_at, reviewed_at, admin_note")
        .eq("member_id", memberId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      resolvedApplication = byMemberId || null;
    }

    const { data: teachingRows, error: teachErr } = await coachSupabase
      .from("coach_classes")
      .select("*")
      .ilike("coach_email", email.trim())
      .order("starts_at", { ascending: false });

    if (teachErr) throw teachErr;

    const classIds = (teachingRows || []).map((c) => c.id);
    let enrollmentsByClass = {};

    if (classIds.length) {
      const { data: enrollments } = await coachSupabase
        .from("coach_class_enrollments")
        .select("*")
        .in("class_id", classIds)
        .neq("status", "left");

      for (const e of enrollments || []) {
        if (!enrollmentsByClass[e.class_id]) {
          enrollmentsByClass[e.class_id] = [];
        }
        enrollmentsByClass[e.class_id].push(e);
      }
    }

    const teachingClasses = (teachingRows || []).map((c) =>
      enrichClass(c, enrollmentsByClass[c.id] || [])
    );

    const now = new Date();
    const upcomingTeaching = teachingClasses.filter(
      (c) =>
        c.status !== "cancelled" &&
        c.status !== "completed" &&
        new Date(c.starts_at) >= now
    );
    const pastTeaching = teachingClasses.filter(
      (c) =>
        c.status === "completed" ||
        c.status === "cancelled" ||
        new Date(c.starts_at) < now
    );

    const { data: myEnrollments } = await coachSupabase
      .from("coach_class_enrollments")
      .select("*, coach_classes(*)")
      .ilike("student_email", email.trim())
      .neq("status", "left")
      .order("enrolled_at", { ascending: false });

    const enrolledClasses = (myEnrollments || [])
      .filter((e) => e.coach_classes)
      .map((e) => ({
        ...enrichClassFields(e.coach_classes),
        my_status: e.status,
        enrolled_at: e.enrolled_at,
      }));

    const upcomingEnrolled = enrolledClasses.filter(
      (c) =>
        c.status !== "cancelled" &&
        c.status !== "completed" &&
        new Date(c.starts_at) >= now
    );

    const totalEnrollments = teachingClasses.reduce(
      (sum, c) => sum + (c.enrolled_count || 0),
      0
    );

    const coachProfile = coachRow ? dbRowToCoach(coachRow) : null;
    const isFeaturedCoach = Boolean(coachProfile);
    const hasTeachingClasses = teachingClasses.length > 0;
    const isCoach =
      isFeaturedCoach || hasTeachingClasses || resolvedApplication?.status === "approved";

    return res.status(200).json({
      isCoach,
      isFeaturedCoach,
      coachProfile,
      application: resolvedApplication || null,
      teaching: {
        upcoming: upcomingTeaching,
        past: pastTeaching.slice(0, 10),
        all: teachingClasses,
      },
      enrolled: {
        upcoming: upcomingEnrolled,
        all: enrolledClasses,
      },
      stats: {
        upcomingCount: upcomingTeaching.length,
        totalClasses: teachingClasses.length,
        totalEnrollments,
        enrolledCount: enrolledClasses.length,
      },
    });
  } catch (err) {
    console.error("member coaching error:", err);
    return res.status(500).json({ error: err.message || "載入失敗" });
  }
}
