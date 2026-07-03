"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  GraduationCap,
  Loader2,
  ExternalLink,
  Pencil,
  Plus,
  Users,
  Calendar,
  Clock,
  ChevronRight,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import {
  CLASS_TYPE_LABELS,
  formatClassDate,
  formatClassRange,
  formatPrice,
} from "@/lib/coachUtils";

function StatusBadge({ status }) {
  const map = {
    pending: { label: "審核中", className: "bg-[#FFD43A]/30 text-black" },
    approved: { label: "已通過", className: "bg-green-100 text-green-800" },
    rejected: { label: "未通過", className: "bg-red-100 text-red-700" },
  };
  const s = map[status] || map.pending;
  return (
    <span
      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${s.className}`}
    >
      {s.label}
    </span>
  );
}

function ClassRow({ cls, showEnrollments = false }) {
  return (
    <Link
      href={`/coaching/${cls.id}`}
      className="flex gap-4 p-4 border border-gray-100 bg-white hover:border-gray-300 transition-colors group"
    >
      <div className="w-16 h-16 shrink-0 rounded-md overflow-hidden bg-gray-100">
        {cls.cover_image ? (
          <img
            src={cls.cover_image}
            alt=""
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-[#3157B5]/10 text-[#3157B5] font-black">
            {cls.coach_name?.charAt(0) || "C"}
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-bold text-sm text-black group-hover:text-[#3157B5] line-clamp-1">
          {cls.title}
        </h4>
        <p className="text-xs text-gray-500 mt-0.5">
          {formatClassDate(cls.starts_at)} ·{" "}
          {formatClassRange(cls.starts_at, cls.ends_at)}
        </p>
        <div className="flex flex-wrap gap-2 mt-1.5">
          <span className="text-[10px] font-bold text-gray-600">
            {formatPrice(cls.price_per_person)}
          </span>
          <span className="text-[10px] font-bold text-gray-400">
            {CLASS_TYPE_LABELS[cls.class_type] || cls.class_type}
          </span>
          {showEnrollments && (
            <span className="text-[10px] font-bold text-[#3157B5]">
              {cls.enrolled_count ?? 0}/{cls.max_students} 人
            </span>
          )}
          {cls.my_status === "enrolled" && (
            <span className="text-[10px] font-bold text-green-700">已報名</span>
          )}
          {cls.my_status === "waitlist" && (
            <span className="text-[10px] font-bold text-purple-700">候補</span>
          )}
        </div>
      </div>
      <ChevronRight
        size={16}
        className="text-gray-300 group-hover:text-black shrink-0 self-center"
      />
    </Link>
  );
}

export default function MemberCoachingPanel({ email, memberId }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!email) return;
    setLoading(true);
    const params = new URLSearchParams({ email });
    if (memberId) params.set("member_id", memberId);

    fetch(`/api/member/coaching?${params}`)
      .then((r) => r.json())
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [email, memberId]);

  if (loading) {
    return (
      <div className="py-16 flex items-center justify-center text-gray-400 text-sm">
        <Loader2 className="animate-spin mr-2" size={18} /> 載入教練資料…
      </div>
    );
  }

  if (!data) {
    return (
      <div className="py-16 text-center text-gray-500 text-sm">
        無法載入教練資料
      </div>
    );
  }

  const {
    isCoach,
    isFeaturedCoach,
    coachProfile,
    application,
    teaching,
    enrolled,
    stats,
  } = data;

  return (
    <div className="space-y-10">
      {/* 教練身份 / 進駐狀態 */}
      {isFeaturedCoach && coachProfile ? (
        <div className="p-6 border border-gray-200 bg-gradient-to-br from-[#3157B5]/5 to-white">
          <div className="flex flex-col sm:flex-row gap-5 sm:items-center">
            <img
              src={coachProfile.avatar}
              alt={coachProfile.name}
              className="w-16 h-16 rounded-full object-cover border-2 border-white shadow"
            />
            <div className="flex-1">
              <p className="text-[10px] font-bold tracking-widest uppercase text-[#3157B5] mb-1">
                進駐教練
              </p>
              <h3 className="text-lg font-black text-black">
                {coachProfile.name}
              </h3>
              <p className="text-sm text-gray-500">{coachProfile.title}</p>
              {coachProfile.excerpt && (
                <p className="text-xs text-gray-600 mt-2 line-clamp-2">
                  {coachProfile.excerpt}
                </p>
              )}
            </div>
            <div className="flex flex-wrap gap-2 shrink-0">
              <Link
                href={`/coaching/coach/${coachProfile.slug}`}
                className="inline-flex items-center gap-1.5 text-xs font-bold border border-gray-300 px-4 py-2.5 hover:border-black"
              >
                <ExternalLink size={14} /> 查看教練頁
              </Link>
              <Link
                href={`/coaching/coach/${coachProfile.slug}`}
                className="inline-flex items-center gap-1.5 text-xs font-bold bg-[#3157B5] text-white px-4 py-2.5 hover:bg-[#2746a0]"
              >
                <Pencil size={14} /> 編輯教練頁
              </Link>
            </div>
          </div>
        </div>
      ) : application?.status === "pending" ? (
        <div className="p-5 border border-[#FFD43A]/50 bg-[#FFD43A]/10">
          <div className="flex gap-3">
            <Clock className="text-black shrink-0" size={20} />
            <div className="flex-1">
              <p className="font-bold text-sm text-black">教練進駐申請審核中</p>
              <p className="text-xs text-gray-600 mt-1">
                已收到您的申請，通過後將開通教練個人頁面。
              </p>
              <div className="mt-2">
                <StatusBadge status="pending" />
              </div>
              <p className="text-xs text-amber-800 bg-amber-50/80 border border-amber-200/80 rounded-lg px-3 py-2 mt-3 leading-relaxed">
                審核期間可編輯申請內容。重新提交後，審核工作天數將從送出當日重新計算。
              </p>
              <Link
                href="/coaching/apply?edit=1"
                className="inline-flex items-center gap-1.5 mt-3 text-xs font-bold bg-black text-white px-4 py-2.5 hover:bg-gray-800 transition-colors"
              >
                <Pencil size={13} /> 編輯申請內容
              </Link>
            </div>
          </div>
        </div>
      ) : application?.status === "rejected" ? (
        <div className="p-5 border border-red-200 bg-red-50 flex gap-3">
          <AlertCircle className="text-red-600 shrink-0" size={20} />
          <div>
            <p className="font-bold text-sm text-red-800">教練進駐申請未通過</p>
            {application.admin_note && (
              <p className="text-xs text-red-700 mt-1">
                {application.admin_note}
              </p>
            )}
            <Link
              href="/coaching/apply"
              className="inline-block mt-2 text-xs font-bold text-[#3157B5] hover:underline"
            >
              重新申請 →
            </Link>
          </div>
        </div>
      ) : !isCoach ? (
        <div className="p-8 border border-dashed border-gray-200 text-center bg-gray-50">
          <GraduationCap size={32} className="mx-auto text-gray-400 mb-4" />
          <p className="font-bold text-black mb-1">成為 PikFun 教練</p>
          <p className="text-xs text-gray-500 mb-4 max-w-sm mx-auto">
            開設課程、建立教練個人頁，讓更多球友找到你。
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            <Link
              href="/coaching/create"
              className="inline-flex items-center gap-1.5 text-xs font-bold bg-black text-white px-5 py-2.5"
            >
              <Plus size={14} /> 我要開課
            </Link>
            <Link
              href="/coaching/apply"
              className="inline-flex items-center gap-1.5 text-xs font-bold border border-gray-300 px-5 py-2.5 hover:border-black"
            >
              申請進駐教練
            </Link>
          </div>
        </div>
      ) : null}

      {/* 教練數據概覽 */}
      {(isCoach || hasTeachingClasses(stats)) && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "即將開課", value: stats.upcomingCount, icon: Calendar },
            {
              label: "累計開課",
              value: stats.totalClasses,
              icon: GraduationCap,
            },
            { label: "總報名人次", value: stats.totalEnrollments, icon: Users },
            {
              label: "我報名的課",
              value: stats.enrolledCount,
              icon: CheckCircle,
            },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="p-4 border border-gray-100 bg-white">
              <Icon size={16} className="text-gray-400 mb-2" />
              <p className="text-2xl font-black text-black">{value}</p>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">
                {label}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* 快捷操作 */}
      {(isCoach || teaching?.all?.length > 0) && (
        <div className="flex flex-wrap gap-2">
          <Link
            href="/coaching/create"
            className="inline-flex items-center gap-1.5 text-xs font-bold bg-black text-white px-4 py-2.5 hover:bg-gray-800"
          >
            <Plus size={14} /> 開新課程
          </Link>
          <Link
            href="/coaching"
            className="inline-flex items-center gap-1.5 text-xs font-bold border border-gray-300 px-4 py-2.5 hover:border-black"
          >
            瀏覽教練開課
          </Link>
          {!isFeaturedCoach && !application && (
            <Link
              href="/coaching/apply"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#3157B5] border border-[#3157B5]/30 px-4 py-2.5"
            >
              申請進駐教練頁
            </Link>
          )}
          {!isFeaturedCoach && application?.status === "pending" && (
            <Link
              href="/coaching/apply?edit=1"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-black border border-[#FFD43A]/50 bg-[#FFD43A]/20 px-4 py-2.5 hover:bg-[#FFD43A]/30"
            >
              <Pencil size={13} /> 編輯申請
            </Link>
          )}
          {!isFeaturedCoach && application?.status === "approved" && (
            <Link
              href={`/coaching/coach/${application.slug}`}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-green-700 border border-green-200 bg-green-50 px-4 py-2.5"
            >
              <CheckCircle size={13} /> 查看教練頁
            </Link>
          )}
        </div>
      )}

      {/* 我開的課 */}
      {(isCoach || teaching?.all?.length > 0) && (
        <section>
          <div className="flex justify-between items-end mb-4 pb-2 border-b border-gray-100">
            <h3 className="text-sm font-bold tracking-widest uppercase text-black">
              我開的課程
            </h3>
            <Link
              href="/coaching/create"
              className="text-[10px] font-bold text-[#3157B5] hover:underline"
            >
              + 新增
            </Link>
          </div>

          {teaching.upcoming.length > 0 ? (
            <div className="space-y-2 mb-6">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                即將開始
              </p>
              {teaching.upcoming.map((cls) => (
                <ClassRow key={cls.id} cls={cls} showEnrollments />
              ))}
            </div>
          ) : (
            <div className="py-8 text-center border border-dashed border-gray-200 mb-6">
              <p className="text-xs text-gray-500 mb-3">
                目前沒有即將開始的課程
              </p>
              <Link
                href="/coaching/create"
                className="text-xs font-bold text-[#3157B5] hover:underline"
              >
                立即開課 →
              </Link>
            </div>
          )}

          {teaching.past.length > 0 && (
            <div className="space-y-2">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                過去課程
              </p>
              {teaching.past.map((cls) => (
                <ClassRow key={cls.id} cls={cls} showEnrollments />
              ))}
            </div>
          )}
        </section>
      )}

      {/* 我報名的課 */}
      {enrolled.all.length > 0 && (
        <section>
          <div className="flex justify-between items-end mb-4 pb-2 border-b border-gray-100">
            <h3 className="text-sm font-bold tracking-widest uppercase text-black">
              我報名的課程
            </h3>
            <Link
              href="/coaching"
              className="text-[10px] font-bold text-gray-400 hover:text-black"
            >
              探索更多
            </Link>
          </div>
          <div className="space-y-2">
            {(enrolled.upcoming.length
              ? enrolled.upcoming
              : enrolled.all.slice(0, 5)
            ).map((cls) => (
              <ClassRow key={cls.id} cls={cls} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function hasTeachingClasses(stats) {
  return stats?.totalClasses > 0;
}
