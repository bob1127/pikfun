import { createClient } from "@supabase/supabase-js";
import { enrichClassFields } from "@/lib/coachUtils";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

function enrichClass(cls, enrollments = []) {
  const active = enrollments.filter((e) => e.status === "enrolled");
  const waitlist = enrollments.filter((e) => e.status === "waitlist");
  const enrolledCount = active.length;
  const maxStudents = cls.max_students || 4;

  return enrichClassFields({
    ...cls,
    students: active,
    waitlist,
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

async function promoteWaitlist(classId) {
  const { data: cls } = await supabase
    .from("coach_classes")
    .select("max_students")
    .eq("id", classId)
    .single();

  const { data: enrolled } = await supabase
    .from("coach_class_enrollments")
    .select("id")
    .eq("class_id", classId)
    .eq("status", "enrolled");

  const enrolledCount = enrolled?.length || 0;
  const maxStudents = cls?.max_students || 4;

  if (enrolledCount >= maxStudents) return;

  const { data: next } = await supabase
    .from("coach_class_enrollments")
    .select("*")
    .eq("class_id", classId)
    .eq("status", "waitlist")
    .order("enrolled_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (next) {
    await supabase
      .from("coach_class_enrollments")
      .update({ status: "enrolled" })
      .eq("id", next.id);
  }

  const newCount = enrolledCount + (next ? 1 : 0);
  await supabase
    .from("coach_classes")
    .update({
      status: newCount >= maxStudents ? "full" : "open",
      updated_at: new Date().toISOString(),
    })
    .eq("id", classId);
}

export default async function handler(req, res) {
  const { id } = req.query;

  if (req.method === "GET") {
    const { email } = req.query;

    const { data: cls, error } = await supabase
      .from("coach_classes")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !cls) {
      return res.status(404).json({ error: "找不到課程" });
    }

    const { data: enrollments } = await supabase
      .from("coach_class_enrollments")
      .select("*")
      .eq("class_id", id)
      .neq("status", "left")
      .order("enrolled_at", { ascending: true });

    const enriched = enrichClass(cls, enrollments || []);
    let myStatus = null;
    if (email) {
      const mine = (enrollments || []).find(
        (e) => e.student_email === email
      );
      myStatus = mine?.status || null;
    }

    let related = [];
    const { data: relatedRaw } = await supabase
      .from("coach_classes")
      .select("*")
      .neq("id", id)
      .neq("status", "cancelled")
      .gte("starts_at", new Date().toISOString())
      .order("starts_at", { ascending: true })
      .limit(4);

    related = (relatedRaw || []).map((c) => enrichClassFields(c));

    return res.status(200).json({
      class: {
        ...enriched,
        my_status: myStatus,
        is_coach: email ? cls.coach_email === email : false,
      },
      related,
    });
  }

  if (req.method === "PATCH") {
    const { action, student_email, student_name, student_avatar } = req.body;

    if (!student_email) {
      return res.status(400).json({ error: "請先登入會員" });
    }

    const { data: cls, error: clsErr } = await supabase
      .from("coach_classes")
      .select("*")
      .eq("id", id)
      .single();

    if (clsErr || !cls) {
      return res.status(404).json({ error: "找不到課程" });
    }

    if (cls.status === "cancelled") {
      return res.status(400).json({ error: "此課程已取消" });
    }

    if (new Date(cls.starts_at) <= new Date()) {
      return res.status(400).json({ error: "課程已開始或已結束" });
    }

    if (action === "cancel") {
      if (cls.coach_email !== student_email) {
        return res.status(403).json({ error: "只有教練可以取消課程" });
      }
      await supabase
        .from("coach_classes")
        .update({ status: "cancelled", updated_at: new Date().toISOString() })
        .eq("id", id);
      return res.status(200).json({ ok: true, status: "cancelled" });
    }

    const { data: existing } = await supabase
      .from("coach_class_enrollments")
      .select("*")
      .eq("class_id", id)
      .eq("student_email", student_email)
      .maybeSingle();

    if (action === "leave") {
      if (!existing || existing.status === "left") {
        return res.status(400).json({ error: "您尚未報名此課程" });
      }
      if (cls.coach_email === student_email) {
        return res.status(400).json({ error: "教練無法退出，請改為取消課程" });
      }

      const wasEnrolled = existing.status === "enrolled";
      await supabase
        .from("coach_class_enrollments")
        .update({ status: "left" })
        .eq("id", existing.id);

      if (wasEnrolled) {
        await promoteWaitlist(id);
      }

      return res.status(200).json({ ok: true, my_status: null });
    }

    if (action === "enroll") {
      if (existing && existing.status !== "left") {
        return res.status(400).json({ error: "您已報名此課程" });
      }

      const { data: enrolledList } = await supabase
        .from("coach_class_enrollments")
        .select("id")
        .eq("class_id", id)
        .eq("status", "enrolled");

      const enrolledCount = enrolledList?.length || 0;
      const isFull = enrolledCount >= cls.max_students;
      const newStatus = isFull ? "waitlist" : "enrolled";

      if (existing?.status === "left") {
        await supabase
          .from("coach_class_enrollments")
          .update({
            status: newStatus,
            student_name: student_name || existing.student_name,
            student_avatar: student_avatar || existing.student_avatar,
            enrolled_at: new Date().toISOString(),
          })
          .eq("id", existing.id);
      } else {
        await supabase.from("coach_class_enrollments").insert([
          {
            class_id: id,
            student_email,
            student_name: student_name || "會員",
            student_avatar: student_avatar || null,
            status: newStatus,
          },
        ]);
      }

      const newEnrolledCount =
        newStatus === "enrolled" ? enrolledCount + 1 : enrolledCount;
      await supabase
        .from("coach_classes")
        .update({
          status: newEnrolledCount >= cls.max_students ? "full" : "open",
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);

      return res.status(200).json({
        ok: true,
        my_status: newStatus,
        message:
          newStatus === "waitlist"
            ? "名額已滿，已為您加入候補名單"
            : "成功報名課程",
      });
    }

    return res.status(400).json({ error: "無效操作" });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
