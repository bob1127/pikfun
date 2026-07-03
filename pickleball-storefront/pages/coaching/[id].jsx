"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Clock,
  Users,
  UserPlus,
  UserMinus,
  XCircle,
  Loader2,
  ChevronRight,
  Plus,
  Briefcase,
} from "lucide-react";
import { useUser } from "@/components/context/UserContext";
import {
  CLASS_TYPE_LABELS,
  CLASS_TYPE_COLORS,
  SKILL_LABELS,
  formatClassDate,
  formatClassRange,
  formatPrice,
} from "@/lib/coachUtils";
import { buildGoogleMapsLink } from "@/lib/playUtils";
import MapEmbed, { FeePaymentBlock } from "@/components/play/MapEmbed";
import CoachingRecruitFooter from "@/components/coaching/CoachingRecruitFooter";
import OtherCoachesRecommend from "@/components/coaching/OtherCoachesRecommend";
import { fireCelebrationConfettiFromElement } from "@/lib/fireCelebrationConfetti";

const ACCENT = "#3366CC";
const NAVY = "#1a2d4a";
const INFO_BG = "#e8f0fa";

/* ── 圖3：白底橫條 + 圓形箭頭 ── */
function ActionLinkBar({ href, label, onClick, external }) {
  const inner = (
    <>
      <span className="font-bold text-[#1a2d4a] text-sm md:text-base">
        {label}
      </span>
      <span
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white transition-transform group-hover:scale-105"
        style={{ backgroundColor: ACCENT }}
      >
        <ChevronRight size={18} />
      </span>
    </>
  );
  const cls =
    "group flex items-center justify-between gap-4 bg-white rounded-xl px-5 md:px-6 py-4 transition-shadow hover:shadow-md";
  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`w-full text-left ${cls}`}
      >
        {inner}
      </button>
    );
  }
  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={cls}>
        {inner}
      </a>
    );
  }
  return (
    <Link href={href} className={cls}>
      {inner}
    </Link>
  );
}

/* ── 圖1：左側 Menu ── */
function SideMenu({ items, activeId }) {
  return (
    <nav className="hidden lg:block w-[200px] xl:w-[220px] shrink-0 pr-8 mr-6 border-r border-gray-200">
      <p className="text-xs font-bold text-[#1a2d4a] mb-5 tracking-wide">
        Menu
      </p>
      <ul className="space-y-1 sticky top-28">
        {items.map((item) => (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              className={`flex items-center gap-2 py-2 text-sm transition-colors ${
                activeId === item.id
                  ? "font-bold text-[#3366CC]"
                  : "text-gray-600 hover:text-[#3366CC]"
              }`}
            >
              <span className="text-[#3366CC] text-xs opacity-60">→</span>
              {item.label}
            </a>
          </li>
        ))}
        <li className="pt-4 mt-4 border-t border-gray-200">
          <Link
            href="/coaching"
            className="flex items-center gap-2 py-2 text-sm text-gray-600 hover:text-[#3366CC] transition-colors"
          >
            <span className="text-[#3366CC] text-xs opacity-60">→</span>
            返回課程列表
          </Link>
        </li>
        <li>
          <Link
            href="/coaching/apply"
            className="flex items-center gap-2 py-2 text-sm text-gray-600 hover:text-[#3366CC] transition-colors"
          >
            <span className="text-[#3366CC] text-xs opacity-60">→</span>
            教練進駐申請
          </Link>
        </li>
      </ul>
    </nav>
  );
}

function StudentRow({ s }) {
  return (
    <div className="flex items-center gap-3 py-3 border-b border-gray-100 last:border-0">
      {s.student_avatar ? (
        <img
          src={s.student_avatar}
          alt={s.student_name}
          className="w-9 h-9 rounded-full object-cover border border-gray-200"
        />
      ) : (
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm text-white"
          style={{ backgroundColor: ACCENT }}
        >
          {s.student_name?.charAt(0) || "?"}
        </div>
      )}
      <span className="font-bold text-sm text-[#1a2d4a]">{s.student_name}</span>
    </div>
  );
}

/* ── 圖2/3：Q&A 訪談區塊（置中標題 + 左對齊內文）── */
function InterviewSection({ id, tag, bracket, title, children }) {
  return (
    <section
      id={id}
      className="scroll-mt-28 py-12 md:py-16 border-t border-gray-200 first:border-t-0"
    >
      <div className="w-full text-center mb-8">
        <p
          className="text-[10px] font-bold tracking-[0.3em] uppercase mb-3"
          style={{ color: ACCENT }}
        >
          Interview
        </p>
        <div className="flex justify-center items-center gap-3 mb-4">
          <span
            className="inline-flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white"
            style={{ backgroundColor: ACCENT }}
          >
            {tag}
          </span>
        </div>
        {bracket && (
          <p className="text-sm font-bold text-[#1a2d4a] mb-2">{bracket}</p>
        )}
        <h2
          className="text-xl md:text-2xl font-bold leading-snug"
          style={{ color: ACCENT }}
        >
          {title}
        </h2>
      </div>
      <div className="w-full text-gray-700 leading-[1.9] text-sm md:text-base">
        {children}
      </div>
    </section>
  );
}

function InfoTile({ icon: Icon, label, children }) {
  return (
    <div className="flex items-start gap-3">
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
        style={{ backgroundColor: `${ACCENT}20`, color: ACCENT }}
      >
        <Icon size={20} />
      </div>
      <div>
        <p className="text-sm font-bold mb-1" style={{ color: ACCENT }}>
          {label}
        </p>
        <div className="text-sm text-[#1a2d4a] leading-relaxed">{children}</div>
      </div>
    </div>
  );
}

/* ── 圖3：OTHER INTERVIEW 風格推薦課程卡 ── */
function RelatedCourseCard({ course }) {
  return (
    <Link href={`/coaching/${course.id}`} className="group block">
      <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-gray-100 mb-3">
        {course.cover_image ? (
          <img
            src={course.cover_image}
            alt={course.title}
            className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center text-white text-4xl font-bold"
            style={{ backgroundColor: ACCENT }}
          >
            {course.coach_name?.charAt(0) || "C"}
          </div>
        )}
        <span
          className="absolute top-3 right-3 text-[10px] font-bold text-white px-2.5 py-1 rounded-full"
          style={{ backgroundColor: ACCENT }}
        >
          {CLASS_TYPE_LABELS[course.class_type] || "課程"}
        </span>
      </div>
      <p className="text-sm font-bold text-[#1a2d4a] leading-snug group-hover:text-[#3366CC] transition-colors line-clamp-2">
        {course.title}
      </p>
      <p className="text-xs text-gray-500 mt-1">{course.coach_name}</p>
    </Link>
  );
}

function EnrollPanel({
  cls,
  feeSession,
  message,
  canEnroll,
  canLeave,
  isCancelled,
  isPast,
  actionLoading,
  onEnroll,
  onLeave,
  onCancel,
}) {
  return (
    <div
      id="section-enroll"
      className="scroll-mt-28 bg-white rounded-2xl border border-gray-200 p-6 md:p-7 shadow-sm"
    >
      <h3 className="text-lg font-bold text-[#1a2d4a] mb-5">報名資訊</h3>

      <div className="space-y-3 mb-6 text-sm">
        <div className="flex items-center gap-2 text-gray-600">
          <Calendar size={16} style={{ color: ACCENT }} className="shrink-0" />
          <span>{formatClassDate(cls.starts_at)}</span>
        </div>
        <div className="flex items-center gap-2 text-gray-600">
          <Clock size={16} style={{ color: ACCENT }} className="shrink-0" />
          <span>{formatClassRange(cls.starts_at, cls.ends_at)}</span>
        </div>
        <div className="flex items-center gap-2 text-gray-600">
          <Users size={16} style={{ color: ACCENT }} className="shrink-0" />
          <span>
            <span className="font-bold text-[#1a2d4a]">
              {cls.enrolled_count || 0}
            </span>
            / {cls.max_students} 人
            {cls.spots_left > 0 && !isCancelled && (
              <span className="text-emerald-600 ml-1">
                （剩 {cls.spots_left} 位）
              </span>
            )}
          </span>
        </div>
      </div>

      <div className="mb-6 pb-6 border-b border-gray-100">
        <FeePaymentBlock session={feeSession} compact />
      </div>

      {message && (
        <p className="text-sm text-emerald-600 font-medium mb-4">{message}</p>
      )}

      <div className="space-y-3">
        {canEnroll && (
          <button
            type="button"
            onClick={(e) => onEnroll(e.currentTarget)}
            disabled={actionLoading}
            className="w-full flex items-center justify-center gap-2 text-white font-bold py-3.5 rounded-full transition-opacity hover:opacity-90 disabled:opacity-50"
            style={{ backgroundColor: ACCENT }}
          >
            {actionLoading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <>
                <UserPlus size={18} />
                {cls.is_full ? "加入候補" : "立即報名"}
              </>
            )}
          </button>
        )}

        {canLeave && (
          <button
            type="button"
            onClick={onLeave}
            disabled={actionLoading}
            className="w-full flex items-center justify-center gap-2 border border-gray-200 text-gray-700 font-bold py-3 rounded-full hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <UserMinus size={18} />
            取消報名
          </button>
        )}

        {cls.my_status === "enrolled" && (
          <p
            className="text-center text-sm font-bold"
            style={{ color: ACCENT }}
          >
            ✓ 您已報名此課程
          </p>
        )}
        {cls.my_status === "waitlist" && (
          <p className="text-center text-sm font-bold text-purple-600">
            您在候補名單中
          </p>
        )}

        {cls.is_coach && !isCancelled && !isPast && (
          <button
            type="button"
            onClick={onCancel}
            disabled={actionLoading}
            className="w-full flex items-center justify-center gap-2 text-red-500 font-bold py-2 text-sm hover:underline disabled:opacity-50"
          >
            <XCircle size={16} /> 取消課程
          </button>
        )}

        {isPast && (
          <p className="text-center text-sm text-gray-400">課程已結束</p>
        )}
        {isCancelled && (
          <p className="text-center text-sm text-gray-400">課程已取消</p>
        )}
      </div>
    </div>
  );
}

/* ── 手機版：捲過課程概要後固定底部報名列 ── */
function MobileEnrollSticky({
  visible,
  cls,
  feeSession,
  canEnroll,
  canLeave,
  isCancelled,
  isPast,
  actionLoading,
  onEnroll,
  onLeave,
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const fee = feeSession.fee_per_person ?? 0;
  const isFree = fee === 0 || feeSession.payment_method === "free";

  if (!mounted || !visible) return null;

  const bar = (
    <AnimatePresence>
      <motion.div
        key="mobile-enroll-sticky"
        initial={{ y: "100%", opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: "100%", opacity: 0 }}
        transition={{ duration: 0.22, ease: "easeOut" }}
        className="fixed bottom-0 left-0 right-0 z-[200] lg:hidden bg-white border-t border-gray-100 px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))]"
      >
        <div className="flex items-center gap-3 max-w-lg mx-auto">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#1a2d4a]">
              <Calendar size={13} style={{ color: ACCENT }} className="shrink-0" />
              <span className="truncate">{formatClassDate(cls.starts_at)}</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-0.5">
              <Clock size={13} className="shrink-0 opacity-60" />
              <span>{formatClassRange(cls.starts_at, cls.ends_at)}</span>
            </div>
          </div>

          <div className="shrink-0 text-right px-1">
            <p
              className={`text-sm font-bold leading-tight ${
                isFree ? "text-green-600" : "text-[#1a2d4a]"
              }`}
            >
              {isFree ? "免費" : formatPrice(fee)}
            </p>
          </div>

          <div className="shrink-0">
            {canEnroll && (
              <button
                type="button"
                onClick={(e) => onEnroll(e.currentTarget)}
                disabled={actionLoading}
                className="flex items-center justify-center gap-1.5 text-white text-sm font-bold px-5 py-2.5 rounded-full transition-opacity hover:opacity-90 disabled:opacity-50 whitespace-nowrap"
                style={{ backgroundColor: ACCENT }}
              >
                {actionLoading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <>
                    <UserPlus size={16} />
                    {cls.is_full ? "候補" : "報名"}
                  </>
                )}
              </button>
            )}
            {canLeave && (
              <button
                type="button"
                onClick={onLeave}
                disabled={actionLoading}
                className="flex items-center justify-center gap-1.5 border border-gray-200 text-gray-700 text-sm font-bold px-4 py-2.5 rounded-full hover:bg-gray-50 transition-colors disabled:opacity-50 whitespace-nowrap"
              >
                <UserMinus size={16} />
                取消
              </button>
            )}
            {!canEnroll && !canLeave && isPast && (
              <span className="text-xs font-bold text-gray-400 px-2">已結束</span>
            )}
            {!canEnroll && !canLeave && isCancelled && (
              <span className="text-xs font-bold text-gray-400 px-2">已取消</span>
            )}
            {cls.my_status === "enrolled" && !canLeave && (
              <span
                className="text-xs font-bold px-3 py-2 rounded-full"
                style={{ color: ACCENT, backgroundColor: `${ACCENT}15` }}
              >
                已報名
              </span>
            )}
            {cls.my_status === "waitlist" && !canLeave && (
              <span className="text-xs font-bold text-purple-600 px-3 py-2 rounded-full bg-purple-50">
                候補中
              </span>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );

  return createPortal(bar, document.body);
}

export default function CoachingDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const { userInfo, loading: userLoading } = useUser();

  const [cls, setCls] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [showMobileSticky, setShowMobileSticky] = useState(false);
  const overviewRef = useRef(null);
  const overviewEndRef = useRef(null);

  const fetchClass = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (userInfo?.email) params.set("email", userInfo.email);
      const res = await fetch(`/api/coach-classes/${id}?${params}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setCls(data.class);
      setRelated(data.related || []);
    } catch {
      setCls(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id && !userLoading) fetchClass();
  }, [id, userInfo?.email, userLoading]);

  useEffect(() => {
    if (!cls?.id) return;

    const update = () => {
      const isMobile = window.matchMedia("(max-width: 1023px)").matches;
      if (!isMobile) {
        setShowMobileSticky(false);
        return;
      }
      const el = overviewEndRef.current || overviewRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      setShowMobileSticky(rect.top <= 0);
    };

    update();
    const timer = window.setTimeout(update, 50);
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [cls?.id]);

  const requireLogin = () => {
    if (userLoading) return;
    setShowLoginPrompt(true);
  };

  const goToLogin = () => {
    setShowLoginPrompt(false);
    router.push(`/login?redirect=${encodeURIComponent(`/coaching/${id}`)}`);
  };

  const goToRegister = () => {
    setShowLoginPrompt(false);
    router.push(`/register?redirect=${encodeURIComponent(`/coaching/${id}`)}`);
  };

  const patchAction = async (action, originEl) => {
    if (userLoading) return;
    if (!userInfo?.email) return requireLogin();
    setActionLoading(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/coach-classes/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          student_email: userInfo.email,
          student_name: userInfo.name,
          student_avatar: userInfo.avatar,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "操作失敗");
        return;
      }
      if (data.message) setMessage(data.message);
      if (action === "enroll") {
        fireCelebrationConfettiFromElement(originEl);
      }
      if (action === "cancel") {
        router.push("/coaching");
        return;
      }
      await fetchClass();
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = () => {
    if (confirm("確定要取消此課程？")) patchAction("cancel");
  };

  const menuItems = useMemo(() => {
    if (!cls) return [];
    const items = [{ id: "section-overview", label: "課程概要" }];
    if (cls.description) items.push({ id: "section-desc", label: "課程介紹" });
    if (cls.curriculum)
      items.push({ id: "section-curriculum", label: "課程內容" });
    if (cls.coach_bio) items.push({ id: "section-coach", label: "教練介紹" });
    items.push({ id: "section-location", label: "上課地點" });
    if (cls.students?.length > 0 || cls.waitlist?.length > 0) {
      items.push({ id: "section-students", label: "已報名學員" });
    }
    items.push({ id: "section-enroll", label: "報名資訊" });
    if (related.length > 0)
      items.push({ id: "section-related", label: "其他課程" });
    items.push({ id: "section-other-coaches", label: "其他教練" });
    return items;
  }, [cls, related.length]);

  if (loading) {
    return (
      <main className="min-h-screen pt-24 flex items-center justify-center text-gray-500 bg-white">
        <Loader2 className="animate-spin mr-2" size={20} /> 載入中...
      </main>
    );
  }

  if (!cls) {
    return (
      <main className="min-h-screen pt-24 text-center bg-white">
        <p className="text-gray-600 mb-4">找不到此課程</p>
        <Link
          href="/coaching"
          className="font-bold underline"
          style={{ color: ACCENT }}
        >
          返回課程列表
        </Link>
      </main>
    );
  }

  const isCancelled = cls.display_status === "cancelled";
  const isPast = new Date(cls.starts_at) <= new Date();
  const canEnroll = !isCancelled && !isPast && !cls.my_status && !cls.is_coach;
  const canLeave = cls.my_status && cls.my_status !== "left" && !cls.is_coach;
  const mapsLink = buildGoogleMapsLink(cls.location_name, cls.location_address);

  const feeSession = {
    fee_per_person: cls.price_per_person,
    payment_method: cls.payment_method,
    payment_method_label: cls.payment_method_label,
    payment_note: cls.payment_note,
  };

  const enrollProps = {
    cls,
    feeSession,
    message,
    canEnroll,
    canLeave,
    isCancelled,
    isPast,
    actionLoading,
    onEnroll: (el) => patchAction("enroll", el),
    onLeave: () => patchAction("leave"),
    onCancel: handleCancel,
  };

  let qNum = 0;
  const nextQ = () => {
    qNum += 1;
    return `Q${qNum}`;
  };

  return (
    <>
      <Head>
        <title>{cls.title} | 教練開課 | PikFun</title>
      </Head>

      <AnimatePresence>
        {showLoginPrompt && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm"
            onClick={() => setShowLoginPrompt(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white w-full max-w-md rounded-2xl p-8 shadow-2xl text-center"
            >
              <h3 className="text-xl font-bold text-[#1a2d4a] mb-2">
                尚未註冊或登入會員嗎？
              </h3>
              <p className="text-gray-500 text-sm mb-7 leading-relaxed">
                報名課程需要先成為 PikFun 會員。
                <br />
                註冊後即可一鍵報名。
              </p>
              <div className="flex flex-col gap-3">
                <button
                  type="button"
                  onClick={goToRegister}
                  className="w-full text-white py-3 rounded-full text-sm font-bold"
                  style={{ backgroundColor: NAVY }}
                >
                  立即註冊
                </button>
                <button
                  type="button"
                  onClick={goToLogin}
                  className="w-full text-white py-3 rounded-full text-sm font-bold"
                  style={{ backgroundColor: ACCENT }}
                >
                  已有帳號，登入
                </button>
                <button
                  type="button"
                  onClick={() => setShowLoginPrompt(false)}
                  className="text-sm text-gray-400 hover:text-gray-600 py-1"
                >
                  稍後再說
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <main
        className={`bg-white min-h-screen pt-24 pb-0 ${
          showMobileSticky
            ? "max-lg:pb-[calc(4.5rem+env(safe-area-inset-bottom,0px))]"
            : ""
        }`}
      >
        <div className="max-w-[1520px] mx-auto px-6 md:px-10">
          {/* 頂部 */}
          <div className="flex items-center justify-between py-6 md:py-8 border-b border-gray-100">
            <Link
              href="/coaching"
              className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#1a2d4a]"
            >
              <ArrowLeft size={16} /> for Coaching
            </Link>
            {canEnroll && (
              <button
                type="button"
                onClick={(e) => patchAction("enroll", e.currentTarget)}
                disabled={actionLoading}
                className="inline-flex items-center gap-2 text-white text-sm font-bold px-6 py-2.5 rounded-full disabled:opacity-50"
                style={{ backgroundColor: ACCENT }}
              >
                ENTRY
                <ChevronRight size={15} />
              </button>
            )}
          </div>

          <div className="flex pt-10 md:pt-14 pb-8">
            {/* 直書標籤 */}
            <div className="hidden xl:block w-8 shrink-0 mr-6" aria-hidden>
              <span
                className="text-xs font-bold tracking-[0.4em] text-gray-300 uppercase"
                style={{ writingMode: "vertical-rl" }}
              >
                課程詳情
              </span>
            </div>

            <SideMenu items={menuItems} activeId="section-overview" />

            <div className="flex-1 min-w-0">
              {/* Hero — 圖5 置中 */}
              <motion.header
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center mb-10 md:mb-14 relative"
              >
                <span
                  className="hidden md:block absolute right-0 top-0 text-sm font-bold"
                  style={{ color: ACCENT }}
                >
                  {"{02}"}
                </span>

                <div className="flex flex-wrap justify-center gap-2 mb-5">
                  <span
                    className={`text-[10px] font-bold px-3 py-1 rounded-full ${CLASS_TYPE_COLORS[cls.class_type]}`}
                  >
                    {CLASS_TYPE_LABELS[cls.class_type]}
                  </span>
                  <span className="text-[10px] font-bold px-3 py-1 rounded-full border border-gray-200 text-gray-600">
                    {SKILL_LABELS[cls.skill_level]}
                  </span>
                  {isCancelled && (
                    <span className="text-[10px] font-bold px-3 py-1 rounded-full bg-gray-200 text-gray-600">
                      已取消
                    </span>
                  )}
                </div>

                <h1 className="text-2xl md:text-[2rem] font-bold text-[#1a2d4a] leading-tight mb-6">
                  {cls.title}
                </h1>

                <div className="inline-flex items-center gap-3 mb-2">
                  {cls.coach_avatar ? (
                    <img
                      src={cls.coach_avatar}
                      alt={cls.coach_name}
                      className="w-12 h-12 rounded-full object-cover border-2 border-white shadow"
                      style={{ backgroundColor: `${ACCENT}30` }}
                    />
                  ) : (
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg text-white"
                      style={{ backgroundColor: ACCENT }}
                    >
                      {cls.coach_name?.charAt(0)}
                    </div>
                  )}
                  <div className="text-left text-sm">
                    <p className="font-bold text-[#1a2d4a]">{cls.coach_name}</p>
                    <p className="text-gray-500 text-xs">
                      教練 · {cls.location_name || "地點待定"}
                    </p>
                  </div>
                </div>

                <p
                  className="text-2xl font-bold mt-4"
                  style={{ color: ACCENT }}
                >
                  {formatPrice(cls.price_per_person)}
                </p>
              </motion.header>

              {/* 主視覺 */}
              <div className="relative aspect-[16/9] md:aspect-[2/1] rounded-2xl overflow-hidden mb-10 bg-gradient-to-br from-[#3D85C6] to-[#1a4a8a]">
                {cls.cover_image ? (
                  <img
                    src={cls.cover_image}
                    alt={cls.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div
                    className="w-full h-full flex items-center justify-center"
                    style={{
                      background: `linear-gradient(135deg, ${ACCENT}, #1a4a8a)`,
                    }}
                  >
                    <span className="text-white/80 font-bold text-7xl">
                      {cls.coach_name?.charAt(0) || "C"}
                    </span>
                  </div>
                )}
              </div>

              {/* 圖2：淺藍概要盒 + GROUP 標 */}
              <section
                id="section-overview"
                ref={overviewRef}
                className="scroll-mt-28 mb-12"
              >
                <p
                  className="text-[10px] font-bold tracking-[0.3em] uppercase mb-3"
                  style={{ color: ACCENT }}
                >
                  Group
                </p>
                <h2 className="text-xl md:text-2xl font-bold text-[#1a2d4a] mb-6 pb-4 border-b border-gray-200">
                  課程概要
                </h2>

                <div
                  className="rounded-2xl p-6 md:p-10 grid sm:grid-cols-2 gap-8"
                  style={{ backgroundColor: INFO_BG }}
                >
                  <InfoTile icon={Briefcase} label="課程類型">
                    {CLASS_TYPE_LABELS[cls.class_type]} ·{" "}
                    {SKILL_LABELS[cls.skill_level]}
                    <span className="block text-xs text-gray-500 mt-1 font-normal">
                      由 {cls.coach_name} 教練開設
                    </span>
                  </InfoTile>
                  <InfoTile icon={MapPin} label="主要上課地點">
                    {cls.location_name || "—"}
                    {cls.location_address && (
                      <span className="block text-xs text-gray-500 mt-1 font-normal">
                        {cls.location_address}
                      </span>
                    )}
                  </InfoTile>
                  <InfoTile icon={Calendar} label="上課日期">
                    {formatClassDate(cls.starts_at)}
                  </InfoTile>
                  <InfoTile icon={Clock} label="上課時間">
                    {formatClassRange(cls.starts_at, cls.ends_at)}
                  </InfoTile>
                  <InfoTile icon={Users} label="名額">
                    {cls.enrolled_count || 0} / {cls.max_students} 人
                    {cls.spots_left > 0 && !isCancelled && (
                      <span className="text-emerald-600">
                        {" "}
                        · 剩 {cls.spots_left} 位
                      </span>
                    )}
                  </InfoTile>
                </div>
                <div ref={overviewEndRef} className="h-px" aria-hidden />
              </section>

              {/* 兩欄：Q&A 內容 + 報名 */}
              <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_260px] gap-10 lg:gap-10 xl:gap-14">
                <div>
                  {cls.description && (
                    <InterviewSection
                      id="section-desc"
                      tag={nextQ()}
                      bracket="【課程介紹】"
                      title="這堂課程是什麼？"
                    >
                      <p className="whitespace-pre-wrap text-[#1a2d4a]">
                        {cls.description}
                      </p>
                    </InterviewSection>
                  )}

                  {cls.curriculum && (
                    <InterviewSection
                      id="section-curriculum"
                      tag={nextQ()}
                      bracket="【課程內容】"
                      title="上課會做什麼？"
                    >
                      <p className="whitespace-pre-wrap">{cls.curriculum}</p>
                    </InterviewSection>
                  )}

                  {cls.coach_bio && (
                    <InterviewSection
                      id="section-coach"
                      tag={nextQ()}
                      bracket="【教練介紹】"
                      title={`${cls.coach_name} 教練`}
                    >
                      <div className="flex items-center gap-4 mb-6 p-4 rounded-xl bg-[#f5f9fd]">
                        {cls.coach_avatar ? (
                          <img
                            src={cls.coach_avatar}
                            alt={cls.coach_name}
                            className="w-16 h-16 rounded-full object-cover"
                          />
                        ) : (
                          <div
                            className="w-16 h-16 rounded-full flex items-center justify-center text-white text-xl font-bold"
                            style={{ backgroundColor: ACCENT }}
                          >
                            {cls.coach_name?.charAt(0)}
                          </div>
                        )}
                        <div>
                          <p className="font-bold text-[#1a2d4a]">
                            {cls.coach_name}
                          </p>
                          <p className="text-xs text-gray-500">
                            PikFun 認證教練
                          </p>
                        </div>
                      </div>
                      <p className="whitespace-pre-wrap">{cls.coach_bio}</p>
                    </InterviewSection>
                  )}

                  <InterviewSection
                    id="section-location"
                    tag={nextQ()}
                    bracket="【上課地點】"
                    title="在哪裡上課？"
                  >
                    <div className="flex items-start gap-2 mb-5">
                      <MapPin
                        size={18}
                        style={{ color: ACCENT }}
                        className="shrink-0 mt-0.5"
                      />
                      <div>
                        <p className="font-bold text-[#1a2d4a]">
                          {cls.location_name}
                        </p>
                        {cls.location_address && (
                          <p className="text-sm text-gray-500 mt-1">
                            {cls.location_address}
                          </p>
                        )}
                        {mapsLink && (
                          <a
                            href={mapsLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-sm font-bold mt-2 hover:underline"
                            style={{ color: ACCENT }}
                          >
                            在 Google 地圖開啟
                            <ChevronRight size={14} />
                          </a>
                        )}
                      </div>
                    </div>
                    <MapEmbed
                      locationName={cls.location_name}
                      locationAddress={cls.location_address}
                    />
                  </InterviewSection>

                  {(cls.students?.length > 0 || cls.waitlist?.length > 0) && (
                    <InterviewSection
                      id="section-students"
                      tag={nextQ()}
                      bracket="【已報名學員】"
                      title={`目前 ${cls.enrolled_count} / ${cls.max_students} 人`}
                    >
                      <div className="bg-white rounded-xl border border-gray-200 px-4">
                        {(cls.students || []).map((s) => (
                          <StudentRow key={s.id || s.student_email} s={s} />
                        ))}
                      </div>
                      {(cls.waitlist?.length || 0) > 0 && (
                        <div className="mt-4">
                          <p className="text-xs font-bold text-purple-600 mb-2">
                            候補名單（{cls.waitlist_count}）
                          </p>
                          <div className="bg-white rounded-xl border border-gray-200 px-4">
                            {cls.waitlist.map((s) => (
                              <StudentRow key={s.id || s.student_email} s={s} />
                            ))}
                          </div>
                        </div>
                      )}
                    </InterviewSection>
                  )}
                </div>

                <aside className="lg:sticky lg:top-28 lg:self-start">
                  <EnrollPanel {...enrollProps} />
                </aside>
              </div>

              {/* 圖3：OTHER INTERVIEW 推薦課程 */}
              {related.length > 0 && (
                <section
                  id="section-related"
                  className="scroll-mt-28 py-16 md:py-20 border-t border-gray-200 mt-8"
                >
                  <p
                    className="text-[10px] font-bold tracking-[0.3em] uppercase mb-3 text-center"
                    style={{ color: ACCENT }}
                  >
                    Other Courses
                  </p>
                  <h2
                    className="text-2xl md:text-3xl font-bold text-center mb-10"
                    style={{ color: ACCENT }}
                  >
                    その他の課程
                  </h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-8">
                    {related.map((course) => (
                      <RelatedCourseCard key={course.id} course={course} />
                    ))}
                  </div>
                </section>
              )}

              {/* 其他教練推薦輪播 */}
              <OtherCoachesRecommend
                excludeCoachName={cls.coach_name}
                sectionId="section-other-coaches"
              />
            </div>
          </div>
        </div>

        {/* 圖3/4：藍底 + 白底行動列 */}
        <section style={{ backgroundColor: ACCENT }} className="py-12 md:py-16">
          <div className="max-w-[1520px] mx-auto px-6 md:px-10">
            <div className="grid lg:grid-cols-[1fr_1.2fr] gap-10 items-center">
              <div className="text-white text-center lg:text-left">
                <p className="text-3xl md:text-4xl font-bold tracking-wide uppercase mb-2">
                  ENTRY
                </p>
                <p className="text-sm text-white/75 leading-relaxed">
                  {canEnroll
                    ? "確認課程資訊後，立即報名加入"
                    : "更多 PikFun 教練課程"}
                </p>
                {canEnroll && (
                  <p className="text-xs text-white/60 mt-2">
                    {formatClassDate(cls.starts_at)} ·{" "}
                    {formatPrice(cls.price_per_person)}
                  </p>
                )}
              </div>
              <div className="space-y-3">
                {canEnroll && (
                  <ActionLinkBar
                    label={cls.is_full ? "加入候補名單" : "立即報名此課程"}
                    onClick={(e) => patchAction("enroll", e.currentTarget)}
                  />
                )}
                <ActionLinkBar href="/coaching" label="返回課程列表" />
                <ActionLinkBar href="/coaching/create" label="我要開課" />
                <ActionLinkBar
                  href="/coaching/apply"
                  label="教練進駐 PikFun 官網"
                />
              </div>
            </div>
          </div>
        </section>

        {/* 圖4：GROUP 底部連結 */}
        <div className="max-w-[1520px] mx-auto px-6 md:px-10 py-10 border-t border-gray-100 bg-white">
          <p
            className="text-[10px] font-bold tracking-[0.3em] uppercase mb-4"
            style={{ color: ACCENT }}
          >
            Group
          </p>
          <div className="grid sm:grid-cols-2 gap-0 border border-gray-200 rounded-xl overflow-hidden divide-y sm:divide-y-0 sm:divide-x divide-gray-200">
            <Link
              href="/coaching"
              className="flex items-center justify-between px-6 py-5 hover:bg-gray-50 transition-colors group"
            >
              <span className="font-bold text-[#1a2d4a]">全部課程</span>
              <span className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-gray-500 group-hover:border-[#3366CC] group-hover:text-[#3366CC]">
                <ChevronRight size={14} />
              </span>
            </Link>
            <Link
              href="/coaching#featured-coaches"
              className="flex items-center justify-between px-6 py-5 hover:bg-gray-50 transition-colors group"
            >
              <span className="font-bold text-[#1a2d4a]">進駐教練</span>
              <span className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-gray-500 group-hover:border-[#3366CC] group-hover:text-[#3366CC]">
                <ChevronRight size={14} />
              </span>
            </Link>
          </div>
        </div>

        {/* SURUGA 風格四欄 Footer */}
        <CoachingRecruitFooter
          entryLabel={canEnroll ? (cls.is_full ? "候補" : "ENTRY") : "開課"}
          onEntryClick={
            canEnroll ? (e) => patchAction("enroll", e?.currentTarget) : undefined
          }
          entryHref={canEnroll ? undefined : "/coaching/create"}
          showEntry
        />

      </main>

      <MobileEnrollSticky
        visible={showMobileSticky}
        cls={cls}
        feeSession={feeSession}
        canEnroll={canEnroll}
        canLeave={canLeave}
        isCancelled={isCancelled}
        isPast={isPast}
        actionLoading={actionLoading}
        onEnroll={(el) => patchAction("enroll", el)}
        onLeave={() => patchAction("leave")}
      />
    </>
  );
}
