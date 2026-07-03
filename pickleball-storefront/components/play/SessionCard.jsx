"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bookmark,
  X,
  ChevronRight,
  Clock,
  MapPin,
  Users,
  CircleDollarSign,
} from "lucide-react";
import {
  getSkillLevelLabel,
  formatFee,
  formatCardDateTime,
} from "@/lib/playUtils";
import { toggleSavedSession, isSaved } from "@/lib/savedSessions";
import SessionCardImageCarousel from "@/components/play/SessionCardImageCarousel";

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

function getStatusMeta(session) {
  const isCancelled = session.display_status === "cancelled";
  const isFull = session.is_full && !isCancelled;
  const isJoined = session.my_status === "joined";
  const isWaitlist = session.my_status === "waitlist";

  if (isCancelled) return { label: "已取消", tone: "muted" };
  if (isJoined) return { label: "已加入", tone: "dark" };
  if (isWaitlist) return { label: "候補中", tone: "purple" };
  if (isFull) return { label: "已額滿", tone: "muted" };
  if (session.spots_left === 1) return { label: "差一人成團", tone: "urgent" };
  return { label: "報名受付中", tone: "blue" };
}

function InfoRow({ icon: Icon, label, value, valueClass = "" }) {
  return (
    <div className="psc-row">
      <span className="psc-row-label">
        <Icon size={14} strokeWidth={1.75} className="psc-row-icon" />
        {label}
      </span>
      <span className="psc-row-dots" aria-hidden="true" />
      <span className={`psc-row-value ${valueClass}`}>{value}</span>
    </div>
  );
}

export default function SessionCard({ session, index = 0 }) {
  const [saved, setSaved] = useState(false);
  const [toast, setToast] = useState(false);
  const [toastSaved, setToastSaved] = useState(false);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    setSaved(isSaved(session.id));
  }, [session.id]);

  const isCancelled = session.display_status === "cancelled";
  const status = getStatusMeta(session);
  const skill = getSkillLevelLabel(session.skill_level);
  const showSkill = skill && skill !== "不限程度";

  const joined = session.joined_count || 0;
  const max = session.max_players || 4;
  const spotsLeft = session.spots_left ?? Math.max(0, max - joined);
  const isFull = session.is_full && !isCancelled;
  const feeText = formatFee(session.fee_per_person, session.payment_method);
  const isFree = feeText === "免費";
  const location =
    session.location_name || session.location_address || "地點待定";
  const timeText = formatCardDateTime(session.starts_at, session.ends_at);

  const peopleValue = (
    <>
      <strong className="psc-val-people">{joined}</strong>
      <span className="psc-val-people-sep"> / </span>
      {max} 人
      {!isFull && !isCancelled && spotsLeft <= 2 && (
        <span className="psc-val-people-hint">
          {spotsLeft === 1 ? "（差 1 位）" : `（剩 ${spotsLeft} 位）`}
        </span>
      )}
    </>
  );

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
        className={`psc-card${isCancelled ? " psc-card--cancelled" : ""}`}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <Link
          href={`/play/${session.id}`}
          className="psc-card-link"
          aria-label={session.title}
        >
          <div className="psc-media">
            <SessionCardImageCarousel session={session} isHovered={hovered} />
          </div>

          <div className="psc-body">
            <div className="psc-title-row">
              <h3 className="psc-title">{session.title}</h3>
              <span className={`psc-badge psc-badge--${status.tone}`}>
                {status.label}
              </span>
            </div>

            <div className="psc-info-block">
              <p className="psc-info-heading">揪團資訊</p>
              <div className="psc-info-list">
                <InfoRow
                  icon={Users}
                  label="人數"
                  value={peopleValue}
                  valueClass="psc-val--people"
                />
                <InfoRow
                  icon={Clock}
                  label="時間"
                  value={timeText}
                  valueClass="psc-val--time"
                />
                <InfoRow
                  icon={MapPin}
                  label="地點"
                  value={location}
                  valueClass="psc-val--place"
                />
                <InfoRow
                  icon={CircleDollarSign}
                  label="費用"
                  value={feeText}
                  valueClass={isFree ? "psc-val--fee is-free" : "psc-val--fee"}
                />
              </div>
            </div>

            {showSkill && (
              <div className="psc-tags">
                <span className="psc-tag">{skill}</span>
              </div>
            )}
          </div>
        </Link>

        <button
          type="button"
          onClick={handleSave}
          className={`psc-save${saved ? " psc-save--active" : ""}${hovered || saved ? " psc-save--visible" : ""}`}
          aria-label={saved ? "取消收藏" : "收藏揪團"}
        >
          <Bookmark size={16} className={saved ? "fill-current" : ""} strokeWidth={1.75} />
        </button>
      </motion.article>

      <SaveToast show={toast} saved={toastSaved} onClose={closeToast} />

      <style jsx>{`
        .psc-card {
          position: relative;
        }
        .psc-card--cancelled {
          opacity: 0.5;
        }
        .psc-card-link {
          display: block;
          text-decoration: none;
          color: inherit;
          background: transparent;
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
          padding: 16px 0 0;
        }
        .psc-title-row {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 10px;
          margin-bottom: 16px;
        }
        .psc-title {
          margin: 0;
          flex: 1;
          min-width: 0;
          font-size: 16px;
          font-weight: 700;
          line-height: 1.65;
          color: #1a2332;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .psc-badge {
          flex-shrink: 0;
          padding: 3px 9px;
          border-radius: 2px;
          font-size: 10px;
          font-weight: 700;
          line-height: 1.35;
          letter-spacing: 0.04em;
          white-space: nowrap;
        }
        .psc-badge--blue {
          background: #2563eb;
          color: #fff;
        }
        .psc-badge--urgent {
          background: #005caf;
          color: #fff;
        }
        .psc-badge--muted {
          background: #b8c4d0;
          color: #fff;
        }
        .psc-badge--dark {
          background: #334155;
          color: #fff;
        }
        .psc-badge--purple {
          background: #7c3aed;
          color: #fff;
        }
        .psc-info-block {
          margin: 0;
        }
        .psc-info-heading {
          margin: 0 0 10px;
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 0.12em;
          color: #1e4976;
          text-transform: uppercase;
        }
        .psc-info-list {
          display: flex;
          flex-direction: column;
          gap: 7px;
        }
        .psc-row {
          display: flex;
          align-items: baseline;
          gap: 0;
          min-width: 0;
        }
        .psc-row-label {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          flex-shrink: 0;
          font-size: 12px;
          font-weight: 600;
          color: #5a6a7e;
          letter-spacing: 0.02em;
        }
        .psc-row-icon {
          color: #2a6f8a;
          flex-shrink: 0;
        }
        .psc-row-dots {
          flex: 1;
          min-width: 8px;
          margin: 0 6px;
          border-bottom: 1px dotted #c5d0db;
          align-self: center;
          height: 0;
          transform: translateY(-2px);
        }
        .psc-row-value {
          flex-shrink: 0;
          max-width: 58%;
          text-align: right;
          font-size: 12px;
          line-height: 1.45;
          color: #1a2332;
          font-weight: 600;
        }
        .psc-row-value.psc-val--people :global(.psc-val-people) {
          font-size: 18px;
          font-weight: 800;
          color: #005caf;
          letter-spacing: -0.02em;
        }
        .psc-row-value.psc-val--people :global(.psc-val-people-sep) {
          font-size: 12px;
          font-weight: 500;
          color: #94a3b8;
        }
        .psc-row-value.psc-val--people :global(.psc-val-people-hint) {
          display: block;
          margin-top: 1px;
          font-size: 10px;
          font-weight: 700;
          color: #2563eb;
        }
        .psc-row-value.psc-val--time {
          font-variant-numeric: tabular-nums;
          font-weight: 700;
          color: #1e4976;
        }
        .psc-row-value.psc-val--place {
          font-weight: 600;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          display: block;
          max-width: 100%;
        }
        .psc-row-value.psc-val--fee {
          font-weight: 800;
          color: #1a2332;
        }
        .psc-row-value.psc-val--fee.is-free {
          color: #2563eb;
        }
        .psc-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin-top: 14px;
        }
        .psc-tag {
          display: inline-flex;
          align-items: center;
          padding: 4px 12px;
          border-radius: 999px;
          background: #eff6ff;
          color: #1d4ed8;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.02em;
          line-height: 1.3;
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
            padding-top: 18px;
          }
          .psc-title {
            font-size: 17px;
          }
          .psc-row-value {
            font-size: 13px;
          }
          .psc-row-value :global(.psc-val-people) {
            font-size: 20px;
          }
        }
      `}</style>
    </>
  );
}
