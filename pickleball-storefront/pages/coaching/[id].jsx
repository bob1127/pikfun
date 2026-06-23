"use client";

import { useState, useEffect } from "react";
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
import ClassCard from "@/components/coaching/ClassCard";

function StudentRow({ s }) {
  return (
    <div className="flex items-center gap-3 py-2.5">
      {s.student_avatar ? (
        <img
          src={s.student_avatar}
          alt={s.student_name}
          className="w-9 h-9 rounded-full object-cover border border-gray-100"
        />
      ) : (
        <div className="w-9 h-9 rounded-full bg-[#3157B5]/10 text-[#3157B5] flex items-center justify-center font-bold text-sm">
          {s.student_name?.charAt(0) || "?"}
        </div>
      )}
      <span className="font-bold text-sm text-black">{s.student_name}</span>
    </div>
  );
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

  const patchAction = async (action) => {
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
      if (action === "cancel") {
        router.push("/coaching");
        return;
      }
      await fetchClass();
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen pt-24 flex items-center justify-center text-gray-500 bg-[#E8E8E3]">
        <Loader2 className="animate-spin mr-2" size={20} /> 載入中...
      </main>
    );
  }

  if (!cls) {
    return (
      <main className="min-h-screen pt-24 text-center bg-[#E8E8E3]">
        <p className="text-gray-600 mb-4">找不到此課程</p>
        <Link href="/coaching" className="text-black font-bold underline">
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
              <h3 className="text-xl font-bold text-black mb-2">
                尚未註冊或登入會員嗎？
              </h3>
              <p className="text-gray-500 text-sm mb-7 leading-relaxed">
                報名課程需要先成為 PikPie 會員。
                <br />
                註冊後即可一鍵報名。
              </p>
              <div className="flex flex-col gap-3">
                <button
                  type="button"
                  onClick={goToRegister}
                  className="w-full bg-[#F4596A] text-white py-3 rounded-full text-sm font-bold hover:bg-[#e04d5e] transition-colors"
                >
                  立即註冊
                </button>
                <button
                  type="button"
                  onClick={goToLogin}
                  className="w-full bg-[#3157B5] text-white py-3 rounded-full text-sm font-bold hover:bg-[#2748a0] transition-colors"
                >
                  已有帳號，登入
                </button>
                <button
                  type="button"
                  onClick={() => setShowLoginPrompt(false)}
                  className="text-sm text-gray-400 hover:text-gray-600 transition-colors py-1"
                >
                  稍後再說
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="bg-[#E8E8E3] min-h-screen pt-24 pb-20">
        <div className="max-w-[1200px] mx-auto px-6 md:px-10">
          <Link
            href="/coaching"
            className="inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-black mb-8 transition-colors"
          >
            <ArrowLeft size={16} /> 返回課程列表
          </Link>

          {/* Hero */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 mb-12 pb-12 border-b border-dashed border-gray-400/60"
          >
            <div className="relative aspect-[4/3] rounded-lg overflow-hidden bg-gradient-to-br from-[#3157B5] to-[#1a3a8a]">
              {cls.cover_image ? (
                <img
                  src={cls.cover_image}
                  alt={cls.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-white/80 font-black text-7xl">
                    {cls.coach_name?.charAt(0) || "C"}
                  </span>
                </div>
              )}
            </div>

            <div className="flex flex-col justify-center">
              <div className="flex flex-wrap gap-2 mb-4">
                <span
                  className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${CLASS_TYPE_COLORS[cls.class_type]}`}
                >
                  {CLASS_TYPE_LABELS[cls.class_type]}
                </span>
                <span className="text-[10px] font-bold px-2.5 py-1 rounded-full border border-gray-400 text-gray-600">
                  {SKILL_LABELS[cls.skill_level]}
                </span>
                {isCancelled && (
                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-gray-200 text-gray-600">
                    已取消
                  </span>
                )}
              </div>

              <h1 className="text-2xl md:text-4xl font-black text-black leading-tight mb-4">
                {cls.title}
              </h1>

              <p className="text-sm text-gray-600 mb-6">
                {formatClassDate(cls.starts_at)}
                <span className="mx-2 text-gray-300">|</span>
                {formatClassRange(cls.starts_at, cls.ends_at)}
              </p>

              <div className="flex items-center gap-3 mb-6">
                {cls.coach_avatar ? (
                  <img
                    src={cls.coach_avatar}
                    alt={cls.coach_name}
                    className="w-12 h-12 rounded-full object-cover border-2 border-white shadow"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-[#3157B5]/10 text-[#3157B5] flex items-center justify-center font-black text-lg">
                    {cls.coach_name?.charAt(0)}
                  </div>
                )}
                <div>
                  <p className="font-black text-black">{cls.coach_name}</p>
                  <p className="text-xs text-gray-500">教練</p>
                </div>
              </div>

              <p className="text-2xl font-black text-black mb-6">
                {formatPrice(cls.price_per_person)}
              </p>
            </div>
          </motion.div>

          {/* Two-column content */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-10 lg:gap-16">
            {/* Main */}
            <div className="space-y-10">
              {cls.description && (
                <section>
                  <h2 className="text-2xl  font-black tracking-widest uppercase text-stone-500 mb-4">
                    課程介紹
                  </h2>
                  <p className="text-stone-800 text-2xl   leading-relaxed whitespace-pre-wrap">
                    {cls.description}
                  </p>
                </section>
              )}

              {cls.curriculum && (
                <section className="border-t border-dashed border-gray-400/60 pt-10">
                  <h2 className="text-xs font-black tracking-widest uppercase text-gray-500 mb-4">
                    課程內容
                  </h2>
                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {cls.curriculum}
                  </p>
                </section>
              )}

              {cls.coach_bio && (
                <section className="border-t border-dashed border-gray-400/60 pt-10">
                  <h2 className="text-xs font-black tracking-widest uppercase text-gray-500 mb-4">
                    教練介紹
                  </h2>
                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {cls.coach_bio}
                  </p>
                </section>
              )}

              <section className="border-t border-dashed border-gray-400/60 pt-10">
                <h2 className="text-xs font-black tracking-widest uppercase text-gray-500 mb-4">
                  上課地點
                </h2>
                <div className="flex items-start gap-2 text-gray-700 mb-4">
                  <MapPin
                    size={18}
                    className="text-[#F4596A] shrink-0 mt-0.5"
                  />
                  <div>
                    <p className="font-bold text-black">{cls.location_name}</p>
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
                        className="inline-flex items-center gap-1 text-sm text-[#3157B5] font-bold mt-2 hover:underline"
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
              </section>

              {(cls.students?.length > 0 || cls.waitlist?.length > 0) && (
                <section className="border-t border-dashed border-gray-400/60 pt-10">
                  <h2 className="text-xs font-black tracking-widest uppercase text-gray-500 mb-4">
                    已報名學員 ({cls.enrolled_count}/{cls.max_students})
                  </h2>
                  <div className="divide-y divide-gray-200">
                    {(cls.students || []).map((s) => (
                      <StudentRow key={s.id || s.student_email} s={s} />
                    ))}
                  </div>
                  {(cls.waitlist?.length || 0) > 0 && (
                    <div className="mt-4 pt-4 border-t border-dashed border-gray-300">
                      <p className="text-xs font-bold text-purple-600 mb-2">
                        候補名單 ({cls.waitlist_count})
                      </p>
                      {cls.waitlist.map((s) => (
                        <StudentRow key={s.id || s.student_email} s={s} />
                      ))}
                    </div>
                  )}
                </section>
              )}
            </div>

            {/* Sticky sidebar */}
            <aside className="lg:sticky lg:top-28 lg:self-start">
              <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                <h3 className="font-black text-lg text-black mb-4">報名資訊</h3>

                <div className="space-y-3 mb-6 text-sm">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Calendar size={16} className="text-[#3157B5] shrink-0" />
                    <span>{formatClassDate(cls.starts_at)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Clock size={16} className="text-[#3157B5] shrink-0" />
                    <span>{formatClassRange(cls.starts_at, cls.ends_at)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Users size={16} className="text-[#3157B5] shrink-0" />
                    <span>
                      <span className="font-bold text-black">
                        {cls.enrolled_count || 0}
                      </span>
                      / {cls.max_students} 人
                      {cls.spots_left > 0 && !isCancelled && (
                        <span className="text-green-600 ml-1">
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
                  <p className="text-sm text-green-600 font-medium mb-4">
                    {message}
                  </p>
                )}

                <div className="space-y-3">
                  {canEnroll && (
                    <button
                      onClick={() => patchAction("enroll")}
                      disabled={actionLoading}
                      className="w-full flex items-center justify-center gap-2 bg-[#FFD43A] hover:bg-[#e6bf00] text-black font-black py-3.5 rounded-md transition-colors disabled:opacity-50"
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
                      onClick={() => patchAction("leave")}
                      disabled={actionLoading}
                      className="w-full flex items-center justify-center gap-2 border border-gray-300 text-gray-700 font-bold py-3 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50"
                    >
                      <UserMinus size={18} />
                      取消報名
                    </button>
                  )}

                  {cls.my_status === "enrolled" && (
                    <p className="text-center text-sm font-bold text-[#3157B5]">
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
                      onClick={() => {
                        if (confirm("確定要取消此課程？"))
                          patchAction("cancel");
                      }}
                      disabled={actionLoading}
                      className="w-full flex items-center justify-center gap-2 text-red-500 font-bold py-2 text-sm hover:underline disabled:opacity-50"
                    >
                      <XCircle size={16} /> 取消課程
                    </button>
                  )}

                  {isPast && (
                    <p className="text-center text-sm text-gray-400">
                      課程已結束
                    </p>
                  )}
                  {isCancelled && (
                    <p className="text-center text-sm text-gray-400">
                      課程已取消
                    </p>
                  )}
                </div>
              </div>

              {/* Related */}
              {related.length > 0 && (
                <div className="mt-8">
                  <p className="text-[10px] font-black tracking-widest text-gray-500 uppercase mb-2">
                    推薦課程 👍
                  </p>
                  {related.map((r) => (
                    <ClassCard key={r.id} cls={r} compact />
                  ))}
                </div>
              )}
            </aside>
          </div>
        </div>
      </main>
    </>
  );
}
