"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Bookmark, X, ChevronRight } from "lucide-react";
import { SKILL_LABELS, formatFee, formatSessionRange } from "@/lib/playUtils";
import { toggleSavedSession, isSaved } from "@/lib/savedSessions";

/* ── helpers ─────────────────────────────────────── */
function HostAvatar({ name, avatar }) {
  if (avatar)
    return (
      <img
        src={avatar}
        alt={name}
        className="w-10 h-10 rounded-full object-cover border border-gray-100 shrink-0"
      />
    );
  return (
    <div className="w-10 h-10 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center font-bold text-sm shrink-0">
      {name?.charAt(0) || "?"}
    </div>
  );
}

function formatRelativeTime(iso) {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "剛剛";
  if (mins < 60) return `${mins} 分鐘前`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} 小時前`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} 天前`;
  return `${Math.floor(days / 30)} 個月前`;
}

/* ── Save Toast ──────────────────────────────────── */
function SaveToast({ show, saved, onClose }) {
  useEffect(() => {
    if (!show) return;
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [show, onClose]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 12, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 12, scale: 0.95 }}
          transition={{ duration: 0.22 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] w-[calc(100%-2rem)] max-w-sm bg-gray-900 text-white rounded-2xl shadow-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center gap-3 px-4 py-3.5">
            <Bookmark
              size={17}
              className={saved ? "fill-[#c8f542] text-[#c8f542]" : "text-gray-400"}
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold leading-tight">
                {saved ? "已加入收藏" : "已移除收藏"}
              </p>
              {saved && (
                <p className="text-xs text-gray-400 mt-0.5 truncate">
                  可至會員中心查看所有收藏揪團
                </p>
              )}
            </div>
            {saved && (
              <Link
                href="/member?tab=saved"
                className="shrink-0 inline-flex items-center gap-1 text-xs font-bold text-[#c8f542] bg-[#c8f542]/10 px-3 py-1.5 rounded-full hover:bg-[#c8f542]/20 transition-colors whitespace-nowrap"
                onClick={onClose}
              >
                前往查看 <ChevronRight size={12} />
              </Link>
            )}
            <button
              type="button"
              onClick={onClose}
              className="shrink-0 text-gray-500 hover:text-white transition-colors p-1"
            >
              <X size={14} />
            </button>
          </div>
          {saved && (
            <div className="h-0.5 bg-gray-800">
              <motion.div
                className="h-full bg-[#c8f542]"
                initial={{ width: "100%" }}
                animate={{ width: "0%" }}
                transition={{ duration: 3.5, ease: "linear" }}
              />
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ══════════════════════════════════════════════════
   SessionCard
══════════════════════════════════════════════════ */
export default function SessionCard({ session, index = 0 }) {
  const [saved, setSaved] = useState(false);
  const [toast, setToast] = useState(false);
  const [toastSaved, setToastSaved] = useState(false);

  useEffect(() => {
    setSaved(isSaved(session.id));
  }, [session.id]);

  const isCancelled = session.display_status === "cancelled";
  const isFull = session.is_full && !isCancelled;
  const isJoined = session.my_status === "joined";
  const isWaitlist = session.my_status === "waitlist";

  const ctaLabel = isCancelled
    ? "已取消"
    : isJoined
      ? "已加入"
      : isWaitlist
        ? "候補中"
        : isFull
          ? "已額滿"
          : "立即加入";

  const ctaDisabled = isCancelled || isFull || isJoined || isWaitlist;

  const tags = [
    SKILL_LABELS[session.skill_level] || "不限程度",
    `${session.joined_count || 0}/${session.max_players} 人`,
    formatSessionRange(session.starts_at, session.ends_at),
  ];
  if (session.spots_left <= 2 && !isFull && !isCancelled) {
    tags.push(`剩 ${session.spots_left} 位`);
  }

  const handleSave = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      const nowSaved = toggleSavedSession(session);
      setSaved(nowSaved);
      setToastSaved(nowSaved);
      setToast(false);
      // micro delay so AnimatePresence re-mounts
      setTimeout(() => setToast(true), 20);
    },
    [session]
  );

  const closeToast = useCallback(() => setToast(false), []);

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: Math.min(index * 0.04, 0.4) }}
        className={`relative group h-full ${isCancelled ? "opacity-60" : ""}`}
      >
        {/* Full-card link */}
        <Link
          href={`/play/${session.id}`}
          className="flex flex-col h-full bg-white rounded-[1.25rem] shadow-[0_2px_16px_rgba(15,23,42,0.06)] border border-gray-100/80 p-6 hover:shadow-[0_4px_28px_rgba(15,23,42,0.10)] hover:border-gray-200 transition-all duration-300"
          aria-label={session.title}
        >
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <HostAvatar name={session.host_name} avatar={session.host_avatar} />
            {/* Save button (intercepts click) */}
            <button
              type="button"
              onClick={handleSave}
              className={`relative z-10 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-semibold transition-colors ${
                saved
                  ? "bg-gray-100 border-gray-200 text-gray-900"
                  : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
              aria-label={saved ? "取消收藏" : "收藏揪團"}
            >
              <Bookmark
                size={13}
                className={saved ? "fill-gray-900 text-gray-900" : "text-gray-500"}
              />
              {saved ? "已收藏" : "收藏"}
            </button>
          </div>

          {/* Host + time */}
          <p className="text-sm text-gray-500 mb-2">
            <span className="font-semibold text-gray-900">{session.host_name}</span>
            <span className="mx-1.5 text-gray-300">·</span>
            <span>{formatRelativeTime(session.created_at || session.starts_at)}</span>
          </p>

          {/* Title */}
          <h3 className="text-xl font-bold text-gray-900 leading-snug line-clamp-2 mb-4 group-hover:text-gray-700 transition-colors">
            {session.title}
          </h3>

          {/* Tags */}
          <div className="flex flex-wrap gap-2 mb-6 flex-1">
            {tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center px-3 py-1 rounded-full bg-gray-100 text-gray-600 text-xs font-medium"
              >
                {tag}
              </span>
            ))}
            {isJoined && (
              <span className="inline-flex items-center px-3 py-1 rounded-full bg-gray-900 text-white text-xs font-medium">
                已加入
              </span>
            )}
            {isWaitlist && (
              <span className="inline-flex items-center px-3 py-1 rounded-full bg-purple-100 text-purple-700 text-xs font-medium">
                候補中
              </span>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-end justify-between gap-4 mt-auto pt-1">
            <div className="min-w-0">
              <p className="font-bold text-gray-900 text-base leading-tight">
                {formatFee(session.fee_per_person, session.payment_method)}
              </p>
              <p className="text-sm text-gray-400 mt-1 truncate">
                {session.location_name || session.location_address || "地點待定"}
              </p>
            </div>
            <span
              className={`shrink-0 inline-flex items-center justify-center px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                ctaDisabled
                  ? "bg-gray-100 text-gray-400"
                  : "bg-gray-900 text-white group-hover:bg-gray-800"
              }`}
            >
              {ctaLabel}
            </span>
          </div>
        </Link>
      </motion.div>

      <SaveToast show={toast} saved={toastSaved} onClose={closeToast} />
    </>
  );
}
