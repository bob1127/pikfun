"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "next-i18next";
import { Bookmark, X, ChevronRight } from "lucide-react";
import {
  getSkillLevelLabel,
  formatFee,
  formatCardDateTime,
} from "@/lib/playUtils";
import { toggleSavedSession, isSaved } from "@/lib/savedSessions";
import SessionCardImageCarousel from "@/components/play/SessionCardImageCarousel";

function SaveToast({ t, show, saved, onClose }) {
  useEffect(() => {
    if (!show) return;
    const timer = setTimeout(onClose, 3500);
    return () => clearTimeout(timer);
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
                {saved ? t("card.saved") : t("card.unsaved")}
              </p>
              {saved && (
                <p className="text-xs text-gray-400 mt-0.5 truncate">
                  {t("card.saved_hint")}
                </p>
              )}
            </div>
            {saved && (
              <Link
                href="/member?tab=saved"
                className="shrink-0 inline-flex items-center gap-1 text-xs font-bold text-[#c8f542] bg-[#c8f542]/10 px-3 py-1.5 rounded-full hover:bg-[#c8f542]/20 transition-colors whitespace-nowrap"
                onClick={onClose}
              >
                {t("card.view_saved")} <ChevronRight size={12} />
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

function isSessionPast(session) {
  if (session.display_status === "ended" || session.is_past) return true;
  if (!session.starts_at) return false;
  return new Date(session.starts_at) <= new Date();
}

function getStatusMeta(session, t) {
  const isCancelled = session.display_status === "cancelled";
  const isPast = !isCancelled && isSessionPast(session);
  const isFull = session.is_full && !isCancelled && !isPast;
  const isJoined = session.my_status === "joined";
  const isWaitlist = session.my_status === "waitlist";

  if (isCancelled) return { label: t("status.cancelled"), tone: "muted" };
  if (isPast) return { label: t("status.ended"), tone: "muted" };
  if (isJoined) return { label: t("status.joined"), tone: "dark" };
  if (isWaitlist) return { label: t("status.waitlist"), tone: "purple" };
  if (isFull) return { label: t("status.full"), tone: "muted" };
  if (session.spots_left === 1)
    return { label: t("status.one_spot_left"), tone: "urgent" };
  // 與內頁「招募中」對齊；避免「受付」被誤讀成「支付」
  return { label: t("status.open_recruiting"), tone: "blue" };
}

function buildSessionTags(session, t) {
  const tags = [];
  const skill = getSkillLevelLabel(session.skill_level, t);
  if (skill && skill !== t("skill.all")) tags.push(skill);

  const feeText = formatFee(session.fee_per_person, session.payment_method, t);
  tags.push(feeText === t("common.free") ? t("common.free") : feeText.replace("NT$ ", "NT$"));

  const timeText = formatCardDateTime(session.starts_at, session.ends_at);
  if (timeText) tags.push(timeText);

  const isCancelled = session.display_status === "cancelled";
  const joined = session.joined_count || 0;
  const max = session.max_players || 4;
  const spotsLeft = session.spots_left ?? Math.max(0, max - joined);
  const past = isSessionPast(session);
  if (!session.is_full && !isCancelled && !past) {
    if (spotsLeft === 1) tags.push(t("status.one_spot_left"));
    else tags.push(t("status.spots_left", { count: spotsLeft }));
  }

  return tags.slice(0, 4);
}

export default function SessionCard({ session, index = 0 }) {
  const { t } = useTranslation("play");
  const router = useRouter();
  const [saved, setSaved] = useState(false);
  const [toast, setToast] = useState(false);
  const [toastSaved, setToastSaved] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [carousel, setCarousel] = useState({ active: 0, count: 0 });

  useEffect(() => {
    setSaved(isSaved(session.id));
  }, [session.id]);

  const isCancelled = session.display_status === "cancelled";
  const isPast = !isCancelled && isSessionPast(session);
  const status = getStatusMeta(session, t);
  const location =
    session.location_name || session.location_address || t("card.location_pending");
  const hostName = session.host_name || t("card.host_fallback");
  const tags = buildSessionTags(session, t);

  const handleCarouselState = useCallback((state) => {
    setCarousel(state);
  }, []);

  const handleSave = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      const nowSaved = toggleSavedSession(session);
      setSaved(nowSaved);
      setToastSaved(nowSaved);
      setToast(false);
      setTimeout(() => setToast(true), 20);
    },
    [session],
  );

  const closeToast = useCallback(() => setToast(false), []);

  return (
    <>
      <motion.article
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, delay: Math.min(index * 0.025, 0.2) }}
        className={`psc-card${isCancelled || isPast ? " psc-card--canceled" : ""}`}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <div
          className="psc-card-link"
          role="link"
          tabIndex={0}
          aria-label={session.title}
          onClick={() => router.push(`/play/${session.id}`)}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              router.push(`/play/${session.id}`);
            }
          }}
        >
          <div className="psc-media">
            <SessionCardImageCarousel
              session={session}
              isHovered={hovered}
              hideDots
              onStateChange={handleCarouselState}
            />
          </div>

          <div className="psc-body">
            <div className="psc-meta-row">
              <div className="psc-meta-left">
                <span className="psc-meta-label">{t("card.host_label")}</span>
                <span className="psc-meta-sep">|</span>
                {session.host_profile_slug ? (
                  <Link
                    href={`/play/host/${session.host_profile_slug}`}
                    className="psc-meta-value hover:underline"
                    onClick={(event) => event.stopPropagation()}
                  >
                    {hostName}
                  </Link>
                ) : (
                  <span className="psc-meta-value">{hostName}</span>
                )}
                <span className={`psc-pill psc-pill--${status.tone}`}>
                  {status.label}
                </span>
              </div>

              {carousel.count > 1 && (
                <div className="psc-dots" aria-hidden="true">
                  {Array.from({ length: carousel.count }).map((_, i) => (
                    <span
                      key={i}
                      className={`psc-dot${i === carousel.active ? " psc-dot--active" : ""}`}
                    />
                  ))}
                </div>
              )}
            </div>

            <h3 className="psc-title">{session.title}</h3>

            <div className="psc-tags-row">
              <span className="psc-category">( {location} )</span>
              {tags.map((tag) => (
                <span key={tag} className="psc-hash-tag">
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleSave}
          className={`psc-save${saved ? " psc-save--active" : ""}${hovered || saved ? " psc-save--visible" : ""}`}
          aria-label={saved ? t("card.aria_unsave") : t("card.aria_save")}
        >
          <Bookmark size={16} className={saved ? "fill-current" : ""} strokeWidth={1.75} />
        </button>
      </motion.article>

      <SaveToast t={t} show={toast} saved={toastSaved} onClose={closeToast} />

      <style jsx>{`
        .psc-card {
          position: relative;
        }
        .psc-card--cancelled {
          opacity: 0.55;
        }
        .psc-card-link {
          display: block;
          text-decoration: none;
          color: inherit;
          background: transparent;
          cursor: pointer;
        }
        .psc-card-link:focus-visible .psc-title {
          text-decoration: underline;
          text-underline-offset: 3px;
        }
        .psc-media {
          position: relative;
          aspect-ratio: 16 / 9;
          background: #dde3ea;
          overflow: hidden;
        }
        .psc-body {
          padding: 14px 0 0;
        }
        .psc-meta-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 12px;
          min-height: 24px;
        }
        .psc-meta-left {
          display: flex;
          align-items: center;
          gap: 6px;
          flex-wrap: wrap;
          min-width: 0;
        }
        .psc-meta-label,
        .psc-meta-sep,
        .psc-meta-value {
          font-size: 12px;
          line-height: 1.4;
          color: #6b7280;
        }
        .psc-meta-value {
          color: #374151;
          font-weight: 500;
          max-width: 120px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .psc-pill {
          display: inline-flex;
          align-items: center;
          padding: 2px 10px;
          border-radius: 999px;
          font-size: 10px;
          font-weight: 700;
          line-height: 1.5;
          letter-spacing: 0.02em;
          white-space: nowrap;
        }
        .psc-pill--blue {
          background: #2563eb;
          color: #fff;
        }
        .psc-pill--urgent {
          background: #2563eb;
          color: #fff;
        }
        .psc-pill--muted {
          background: #9ca3af;
          color: #fff;
        }
        .psc-pill--dark {
          background: #374151;
          color: #fff;
        }
        .psc-pill--purple {
          background: #7c3aed;
          color: #fff;
        }
        .psc-dots {
          display: flex;
          align-items: center;
          gap: 5px;
          flex-shrink: 0;
        }
        .psc-dot {
          width: 6px;
          height: 6px;
          border-radius: 999px;
          background: #d1d5db;
          transition: background 0.2s ease;
        }
        .psc-dot--active {
          background: #2563eb;
        }
        .psc-title {
          margin: 0 0 12px;
          font-size: 17px;
          font-weight: 800;
          line-height: 1.55;
          color: #111827;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .psc-tags-row {
          display: flex;
          flex-wrap: wrap;
          align-items: baseline;
          gap: 8px 10px;
          line-height: 1.6;
        }
        .psc-category {
          font-size: 12px;
          color: #6b7280;
          white-space: nowrap;
        }
        .psc-hash-tag {
          font-size: 12px;
          color: #9ca3af;
          white-space: nowrap;
        }
        .psc-save {
          position: absolute;
          top: 8px;
          right: 8px;
          z-index: 20;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 28px;
          padding: 0;
          border: none;
          background: transparent;
          color: rgba(255, 255, 255, 0.88);
          cursor: pointer;
          opacity: 0;
          filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.35));
          transition: opacity 0.2s ease;
        }
        .psc-save--visible {
          opacity: 1;
        }
        .psc-save--active {
          color: #fff;
        }
        @media (min-width: 1024px) {
          .psc-body {
            padding-top: 16px;
          }
          .psc-title {
            font-size: 18px;
          }
          .psc-meta-value {
            max-width: 160px;
          }
        }
      `}</style>
    </>
  );
}
