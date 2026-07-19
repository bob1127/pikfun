"use client";

import { useState, useEffect } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import {
  ArrowLeft,
  Users,
  UserPlus,
  UserMinus,
  XCircle,
  Loader2,
  BellRing,
  Mail,
  UserCheck,
  Wallet,
} from "lucide-react";
import { useUser } from "@/components/context/UserContext";
import {
  getSkillLevelLabel,
  getSkillLevelColor,
  SKILL_COLORS,
  formatSessionDate,
  formatSessionRange,
  formatFee,
  buildGoogleMapsLink,
} from "@/lib/playUtils";
import MapEmbed from "@/components/play/MapEmbed";
import { fireCelebrationConfettiFromElement } from "@/lib/fireCelebrationConfetti";

// ─── 填入你的 LINE 設定（留空，之後在 .env.local 設定）──────────────────
// NEXT_PUBLIC_LINE_CHANNEL_ID  已存在
// NEXT_PUBLIC_LINE_OA_FRIEND_URL 範例：https://line.me/R/ti/p/@你的OA帳號
// ──────────────────────────────────────────────────────────────────────────

/** 組出 LINE OAuth 授權網址（bind 模式，state = sessionId） */
function buildLineBindUrl(sessionId, currentOrigin) {
  const channelId = process.env.NEXT_PUBLIC_LINE_CHANNEL_ID;
  if (!channelId) return null;
  const redirectUri = encodeURIComponent(
    `${currentOrigin}/auth/line/bind-callback`,
  );
  return [
    "https://access.line.me/oauth2/v2.1/authorize",
    `?response_type=code`,
    `&client_id=${channelId}`,
    `&redirect_uri=${redirectUri}`,
    `&state=${sessionId}`,
    `&scope=profile%20openid%20email`,
    `&prompt=consent`,
  ].join("");
}

/** 加入成功後 / 已加入但未開 LINE 提醒時顯示 */
function LineReminderCard({ t, sessionId, userEmail, isReturning = false }) {
  const handleClick = () => {
    const url = buildLineBindUrl(sessionId, window.location.origin);
    if (!url) {
      alert(t("detail.line.channel_missing"));
      return;
    }
    window.location.href = url;
  };

  const label = isReturning
    ? t("detail.line.title_returning")
    : t("detail.line.title_new");

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-6"
    >
      <button
        type="button"
        onClick={handleClick}
        aria-label={label}
        className="block w-full overflow-hidden rounded-xl transition-opacity hover:opacity-95 active:scale-[0.99] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#06C755] focus-visible:ring-offset-2"
      >
        <img
          src="/images/line-notify.png"
          alt={label}
          className="w-full h-auto block select-none"
        />
      </button>
      {userEmail ? (
        <p className="mt-2 text-[12px] text-gray-500 leading-relaxed px-0.5">
          {t("detail.line.email_note", { email: userEmail })}
        </p>
      ) : null}
    </motion.div>
  );
}

function LineReminderEnabledBadge({ t }) {
  return (
    <p className="mb-4 flex items-center gap-2 text-sm text-[#06C755] font-medium">
      <BellRing size={16} />
      {t("detail.line.enabled")}
    </p>
  );
}

function statusLabel(session, isCancelled, isPast, t) {
  if (isCancelled) return t("status.cancelled");
  if (isPast) return t("status.ended");
  if (session.is_full) return t("status.full");
  return t("status.recruiting_spots", { count: session.spots_left });
}

function InfoRow({ label, children }) {
  return (
    <div className="pld-row">
      <span className="pld-row-label">{label}</span>
      <div className="pld-row-value">{children}</div>
    </div>
  );
}

function SessionActions({
  t,
  session,
  isCancelled,
  isPast,
  canJoin,
  canWaitlistJoin,
  canLeave,
  actionLoading,
  onJoin,
  onLeave,
  onCancel,
  layout = "inline",
}) {
  if (isCancelled || isPast) return null;

  const btnClass =
    layout === "sticky"
      ? "pld-btn pld-btn-primary pld-btn-sticky"
      : "pld-btn pld-btn-primary";

  return (
    <div className={`pld-actions pld-actions--${layout}`}>
      {canJoin && !canWaitlistJoin && (
        <button
          type="button"
          onClick={onJoin}
          disabled={actionLoading}
          className={btnClass}
        >
          {actionLoading ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <UserPlus size={18} />
          )}
          {t("detail.actions.join")}
        </button>
      )}
      {canWaitlistJoin && (
        <button
          type="button"
          onClick={onJoin}
          disabled={actionLoading}
          className={`${btnClass} pld-btn-waitlist`}
        >
          {actionLoading ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <UserPlus size={18} />
          )}
          {t("detail.actions.join_waitlist")}
        </button>
      )}
      {canLeave && (
        <button
          type="button"
          onClick={onLeave}
          disabled={actionLoading}
          className="pld-btn pld-btn-outline"
        >
          <UserMinus size={18} />
          {session.my_status === "waitlist"
            ? t("detail.actions.leave_waitlist")
            : t("detail.actions.leave")}
        </button>
      )}
      {session.is_host && (
        <button
          type="button"
          onClick={onCancel}
          disabled={actionLoading}
          className="pld-btn pld-btn-ghost"
        >
          <XCircle size={18} /> {t("detail.actions.cancel_session")}
        </button>
      )}
    </div>
  );
}

function ParticipantRow({ t, p, isHost }) {
  return (
    <div className="pld-participant">
      {p.participant_avatar ? (
        <img
          src={p.participant_avatar}
          alt={p.participant_name}
          className="pld-participant-avatar"
        />
      ) : (
        <div className="pld-participant-fallback">
          {p.participant_name?.charAt(0) || "?"}
        </div>
      )}
      <div className="pld-participant-info">
        <span className="pld-participant-name">{p.participant_name}</span>
        {isHost && (
          <span className="pld-participant-host">
            {t("card.host_label")}
          </span>
        )}
      </div>
    </div>
  );
}

export default function PlayDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const { t, i18n } = useTranslation("play");
  const locale = i18n.language || "zh-TW";
  const { userInfo, loading: userLoading } = useUser();

  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [justJoined, setJustJoined] = useState(false);
  const [lineReminderEnabled, setLineReminderEnabled] = useState(false);
  const [lineStatusLoading, setLineStatusLoading] = useState(false);

  const fetchLineReminderStatus = async (sessionId, email) => {
    if (!sessionId || !email) return;
    setLineStatusLoading(true);
    try {
      const params = new URLSearchParams({
        email,
        session_id: sessionId,
      });
      const res = await fetch(`/api/line/reminder-status?${params}`);
      if (!res.ok) return;
      const data = await res.json();
      setLineReminderEnabled(Boolean(data.line_reminder_enabled));
    } catch {
      /* 表尚未建立時不阻擋 UI */
      setLineReminderEnabled(false);
    } finally {
      setLineStatusLoading(false);
    }
  };

  const fetchSession = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (userInfo?.email) params.set("email", userInfo.email);
      const token = localStorage.getItem("medusa_auth_token");
      const res = await fetch(`/api/play-sessions/${id}?${params}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSession(data.session);
    } catch {
      setSession(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id && !userLoading) fetchSession();
  }, [id, userInfo?.email, userLoading]);

  useEffect(() => {
    if (!id || !userInfo?.email || !session) return;
    const inSession =
      session.my_status === "joined" || session.my_status === "waitlist";
    if (inSession) {
      fetchLineReminderStatus(id, userInfo.email);
    } else {
      setLineReminderEnabled(false);
      setJustJoined(false);
    }
  }, [id, userInfo?.email, session?.my_status]);

  const requireLogin = () => {
    if (userLoading) return;
    setShowLoginPrompt(true);
  };

  const goToLogin = () => {
    setShowLoginPrompt(false);
    router.push(`/login?redirect=${encodeURIComponent(`/play/${id}`)}`);
  };

  const goToRegister = () => {
    setShowLoginPrompt(false);
    router.push(`/register?redirect=${encodeURIComponent(`/play/${id}`)}`);
  };

  const patchAction = async (action, originEl) => {
    if (userLoading) return;
    if (!userInfo?.email) return requireLogin();
    setActionLoading(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/play-sessions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          participant_email: userInfo.email,
          participant_name: userInfo.name,
          participant_avatar: userInfo.avatar,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || t("errors.actionFailed"));
        return;
      }
      if (data.message) setMessage(data.message);
      if (action === "join") {
        setJustJoined(true);
        setLineReminderEnabled(false);
        fireCelebrationConfettiFromElement(originEl);
      }
      if (action === "leave") {
        setJustJoined(false);
        setLineReminderEnabled(false);
      }
      if (action === "cancel") {
        router.push("/play");
        return;
      }
      await fetchSession();
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen pt-24 flex items-center justify-center text-gray-400">
        <Loader2 className="animate-spin mr-2" size={20} /> {t("detail.loading")}
      </main>
    );
  }

  if (!session) {
    return (
      <main className="min-h-screen pt-24 text-center">
        <p className="text-gray-500 mb-4">{t("detail.not_found")}</p>
        <Link href="/play" className="text-[#3157B5] font-bold underline">
          {t("detail.back_to_list")}
        </Link>
      </main>
    );
  }

  const isCancelled = session.display_status === "cancelled";
  const isPast = new Date(session.starts_at) <= new Date();
  const canJoin =
    !isCancelled && !isPast && !session.my_status && !session.is_host;
  const canLeave =
    session.my_status && session.my_status !== "left" && !session.is_host;
  const canWaitlistJoin = canJoin && session.is_full;

  const isInSession =
    session.my_status === "joined" || session.my_status === "waitlist";
  const showLineReminderCard =
    userInfo?.email &&
    isInSession &&
    !isCancelled &&
    !isPast &&
    !lineStatusLoading &&
    !lineReminderEnabled;
  const showLineReminderReturning = showLineReminderCard && !justJoined;

  const fee = session.fee_per_person ?? 0;
  const isFree = fee === 0 || session.payment_method === "free";
  const mapsLink = buildGoogleMapsLink(
    session.location_name,
    session.location_address,
  );
  const statusText = statusLabel(session, isCancelled, isPast, t);
  const showStickyCta =
    !isCancelled && !isPast && (canJoin || canWaitlistJoin || canLeave);

  const handleJoin = (e) => patchAction("join", e?.currentTarget);
  const handleLeave = () => patchAction("leave");
  const handleCancel = () => {
    if (confirm(t("detail.confirm_cancel"))) patchAction("cancel");
  };

  return (
    <>
      <Head>
        <title>{session.title} | {t("seo.detail_title_suffix")}</title>
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
                {t("detail.login_prompt.title")}
              </h3>
              <p className="text-gray-500 text-sm mb-7 leading-relaxed">
                {t("detail.login_prompt.desc1")}
                <br />
                {t("detail.login_prompt.desc2")}
              </p>
              <div className="flex flex-col gap-3">
                <button
                  type="button"
                  onClick={goToRegister}
                  className="w-full bg-[#F4596A] text-white py-3 rounded-full text-sm font-bold hover:bg-[#e04d5e] transition-colors"
                >
                  {t("detail.login_prompt.register")}
                </button>
                <button
                  type="button"
                  onClick={goToLogin}
                  className="w-full bg-[#3157B5] text-white py-3 rounded-full text-sm font-bold hover:bg-[#2748a0] transition-colors"
                >
                  {t("detail.login_prompt.login")}
                </button>
                <button
                  type="button"
                  onClick={() => setShowLoginPrompt(false)}
                  className="text-sm text-gray-400 hover:text-gray-600 transition-colors py-1"
                >
                  {t("detail.login_prompt.later")}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="pld-page">
        <Link href="/play" className="pld-back pld-mobile-only">
          <ArrowLeft size={16} /> {t("detail.back_to_list_full")}
        </Link>

        {/* ── MOBILE HERO ─────────────────────────── */}
        <div className="pld-hero pld-mobile-only">
          <div className="pld-hero-top">
            <span
              className={`pld-badge ${
                isCancelled
                  ? "pld-badge-muted"
                  : session.is_full
                    ? "pld-badge-warn"
                    : "pld-badge-ok"
              }`}
            >
              {statusText}
            </span>
            <span className={`pld-badge ${getSkillLevelColor(session.skill_level)}`}>
              {getSkillLevelLabel(session.skill_level, t)}
            </span>
            {session.my_status === "joined" && (
              <span className="pld-badge pld-badge-joined">
                {t("status.joined_badge")}
              </span>
            )}
            {session.my_status === "waitlist" && (
              <span className="pld-badge pld-badge-wait">
                {t("status.waitlist")}
              </span>
            )}
          </div>
          <h1 className="pld-hero-title">{session.title}</h1>
          <p className="pld-hero-meta">
            {formatSessionDate(session.starts_at, locale)} ·{" "}
            {formatSessionRange(session.starts_at, session.ends_at, locale)}
          </p>
        </div>

        {/* ── DESKTOP HEADER (THEO) ───────────────── */}
        <div className="pld-dsk-brand pld-desktop-only">
          <Link href="/play" className="pld-dsk-back">
            <ArrowLeft size={16} /> {t("detail.back_to_list_full")}
          </Link>
          <span className="pld-dsk-logo">PikFun</span>
          <div className="pld-dsk-icon" aria-hidden>
            <Users size={36} strokeWidth={1.25} />
          </div>
          <h1 className="pld-dsk-title">{session.title}</h1>
          <p className="pld-dsk-sub">
            {statusText} · {getSkillLevelLabel(session.skill_level, t)}
          </p>
        </div>

        {/* ── INFO (narrow / sheet) ───────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="pld-sheet"
        >
          <div className="pld-info">
            <InfoRow label={t("detail.info.date")}>
              {formatSessionDate(session.starts_at, locale)}
            </InfoRow>
            <InfoRow label={t("detail.info.time")}>
              {formatSessionRange(session.starts_at, session.ends_at, locale)}
            </InfoRow>
            <InfoRow label={t("detail.info.court")}>
              <p className="pld-loc-name">{session.location_name}</p>
              {session.location_address && (
                <p className="pld-loc-addr">{session.location_address}</p>
              )}
              {mapsLink && (
                <a
                  href={mapsLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="pld-map-link"
                >
                  {t("detail.info.map_link")}
                </a>
              )}
            </InfoRow>
            <InfoRow label={t("detail.info.fee")}>
              {isFree ? (
                <span className="pld-fee-free">{t("common.free")}</span>
              ) : (
                <span className="pld-fee-paid">
                  NT$ {Number(fee).toLocaleString()}
                  <span className="pld-fee-unit"> {t("detail.info.fee_unit")}</span>
                </span>
              )}
              {!isFree && session.payment_method_label && (
                <p className="pld-pay-note">
                  {session.payment_method_label}
                  {session.payment_note ? ` · ${session.payment_note}` : ""}
                </p>
              )}
            </InfoRow>
            <InfoRow label={t("detail.info.people")}>
              <span className="pld-count">
                <em>{session.joined_count}</em> / {session.max_players}{" "}
                {t("detail.info.people_unit")}
              </span>
              {(session.waitlist_count || 0) > 0 && (
                <span className="pld-waitlist">
                  {t("detail.info.waitlist_count", {
                    count: session.waitlist_count,
                  })}
                </span>
              )}
            </InfoRow>
          </div>

          {session.host_profile_slug && (
            <Link
              href={`/play/host/${session.host_profile_slug}`}
              className="group my-7 flex items-center gap-4 rounded-2xl border border-[#005caf]/20 bg-[#005caf]/[0.04] p-4 transition hover:border-[#005caf]/50 hover:bg-[#005caf]/[0.07]"
            >
              {session.host_profile_avatar ? (
                <img
                  src={session.host_profile_avatar}
                  alt={session.host_name}
                  className="h-14 w-14 shrink-0 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#005caf] text-lg font-black text-white">
                  {session.host_name?.charAt(0) || "P"}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-black tracking-wider text-[#005caf]">
                  {t("card.host_label")}
                </p>
                <p className="truncate font-black text-slate-900">
                  {session.host_name}
                </p>
                <p className="truncate text-xs text-slate-500">
                  {session.host_profile_title ||
                    t("host_profile.fallback_title")}
                </p>
              </div>
              <span className="text-xs font-black text-[#005caf] group-hover:underline">
                {t("host_profile.detail_cta")} →
              </span>
            </Link>
          )}

          {session.description && (
            <div className="pld-desc">
              <p className="pld-desc-label">{t("detail.info.description_label")}</p>
              <p className="pld-desc-text">{session.description}</p>
            </div>
          )}

          {message && <p className="pld-message">{message}</p>}

          {lineReminderEnabled && isInSession && !isCancelled && !isPast && (
            <LineReminderEnabledBadge t={t} />
          )}

          {showLineReminderCard && (
            <LineReminderCard
              t={t}
              sessionId={id}
              userEmail={userInfo.email}
              isReturning={showLineReminderReturning}
            />
          )}

          <div className="pld-desktop-only">
            <SessionActions
              t={t}
              session={session}
              isCancelled={isCancelled}
              isPast={isPast}
              canJoin={canJoin}
              canWaitlistJoin={canWaitlistJoin}
              canLeave={canLeave}
              actionLoading={actionLoading}
              onJoin={handleJoin}
              onLeave={handleLeave}
              onCancel={handleCancel}
            />
          </div>

          {isPast && !isCancelled && (
            <p className="pld-ended">{t("detail.info.ended_note")}</p>
          )}
        </motion.div>

        {/* ── DESKTOP PANEL ───────────────────────── */}
        <div className="pld-dsk-panel pld-desktop-only">
          <div className="pld-dsk-panel-inner">
            <h2 className="pld-dsk-panel-title">{t("detail.panel.title")}</h2>
            <p className="pld-dsk-panel-lead">{t("detail.panel.lead")}</p>

            <div className="pld-dsk-panel-grid">
              <div className="pld-dsk-panel-box">
                <p className="pld-dsk-panel-box-label">
                  {t("detail.panel.signup_status")}
                </p>
                <p className="pld-dsk-panel-highlight">
                  <em>
                    {session.joined_count} / {session.max_players}{" "}
                    {t("detail.info.people_unit")}
                  </em>
                </p>
                <p className="pld-dsk-panel-meta">{statusText}</p>
              </div>
              <div className="pld-dsk-panel-box">
                <p className="pld-dsk-panel-box-label">
                  {t("detail.panel.fee_per_person")}
                </p>
                <p className="pld-dsk-panel-fee">
                  {isFree ? (
                    <em>{t("common.free")}</em>
                  ) : (
                    <>
                      NT$ <em>{Number(fee).toLocaleString()}</em>
                    </>
                  )}
                </p>
                <p className="pld-dsk-panel-meta">
                  {formatFee(fee, session.payment_method, t)}
                </p>
              </div>
            </div>

            {(session.location_name || session.location_address) && (
              <div className="pld-map-block">
                <h3 className="pld-section-title">
                  {t("detail.panel.court_location")}
                </h3>
                <MapEmbed
                  locationName={session.location_name}
                  locationAddress={session.location_address}
                  className="pld-map-embed"
                />
              </div>
            )}

            <div className="pld-dsk-steps">
              <div className="pld-dsk-step-col">
                <h3 className="pld-dsk-step-heading">
                  {t("detail.panel.join_steps_title")}
                </h3>
                <ol className="pld-dsk-step-list">
                  <li>
                    <span className="pld-dsk-step-icon">
                      <Mail size={18} strokeWidth={1.5} />
                    </span>
                    {t("detail.panel.step_login")}
                  </li>
                  <li>
                    <span className="pld-dsk-step-icon">
                      <UserCheck size={18} strokeWidth={1.5} />
                    </span>
                    {t("detail.panel.step_join")}
                  </li>
                  <li>
                    <span className="pld-dsk-step-icon">
                      <Wallet size={18} strokeWidth={1.5} />
                    </span>
                    {t("detail.panel.step_pay")}
                  </li>
                </ol>
              </div>
              <div className="pld-dsk-step-col">
                <h3 className="pld-section-title">
                  {t("detail.panel.joined_title", { count: session.joined_count })}
                </h3>
                <div className="pld-participant-list">
                  {(session.participants || []).map((p) => (
                    <ParticipantRow
                      key={p.id || p.participant_email}
                      t={t}
                      p={p}
                      isHost={p.participant_email === session.host_email}
                    />
                  ))}
                </div>
                {(session.waitlist || []).length > 0 && (
                  <>
                    <h3 className="pld-section-title pld-section-title-spaced">
                      {t("detail.panel.waitlist_title", {
                        count: session.waitlist_count,
                      })}
                    </h3>
                    <div className="pld-participant-list pld-participant-list-muted">
                      {session.waitlist.map((p) => (
                        <ParticipantRow
                          key={p.id || p.participant_email}
                          t={t}
                          p={p}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── MOBILE: map + participants ───────────── */}
        <div className="pld-mobile-extra pld-mobile-only">
          {(session.location_name || session.location_address) && (
            <div className="pld-map-block">
              <h3 className="pld-section-title">
                {t("detail.panel.court_location")}
              </h3>
              <MapEmbed
                locationName={session.location_name}
                locationAddress={session.location_address}
              />
            </div>
          )}
          <div className="pld-participants-mobile">
            <h3 className="pld-section-title">
              {t("detail.panel.joined_title", { count: session.joined_count })}
            </h3>
            <div className="pld-participant-list">
              {(session.participants || []).map((p) => (
                <ParticipantRow
                  key={p.id || p.participant_email}
                  t={t}
                  p={p}
                  isHost={p.participant_email === session.host_email}
                />
              ))}
            </div>
            {(session.waitlist || []).length > 0 && (
              <>
                <h3 className="pld-section-title pld-section-title-spaced">
                  {t("detail.panel.waitlist_title", {
                    count: session.waitlist_count,
                  })}
                </h3>
                <div className="pld-participant-list pld-participant-list-muted">
                  {session.waitlist.map((p) => (
                    <ParticipantRow key={p.id || p.participant_email} t={t} p={p} />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* ── MOBILE STICKY CTA ────────────────────── */}
        {showStickyCta && (
          <div className="pld-sticky pld-mobile-only">
            <SessionActions
              t={t}
              session={session}
              isCancelled={isCancelled}
              isPast={isPast}
              canJoin={canJoin}
              canWaitlistJoin={canWaitlistJoin}
              canLeave={canLeave}
              actionLoading={actionLoading}
              onJoin={handleJoin}
              onLeave={handleLeave}
              onCancel={handleCancel}
              layout="sticky"
            />
          </div>
        )}
        {showStickyCta && (
          <div className="pld-mobile-spacer pld-mobile-only" aria-hidden />
        )}
      </main>

      <style jsx global>{`
        .pld-mobile-only {
          display: block;
        }
        .pld-desktop-only {
          display: none !important;
        }
        @media (min-width: 1024px) {
          .pld-mobile-only {
            display: none !important;
          }
          .pld-desktop-only {
            display: block !important;
          }
        }

        .pld-page {
          min-height: 100vh;
          background: #f0f4f8;
          padding: 3.5rem 1.25rem 2rem;
        }
        @media (min-width: 1024px) {
          .pld-page {
            background: #fff;
            padding-top: 6.5rem;
            padding-bottom: 5rem;
          }
        }

        .pld-back {
          display: inline-flex;
          align-items: center;
          gap: 0.375rem;
          font-size: 0.8125rem;
          font-weight: 600;
          color: #64748b;
          text-decoration: none;
          margin-bottom: 1rem;
        }

        /* mobile hero */
        .pld-hero {
          background: linear-gradient(
            155deg,
            #0a5bb5 0%,
            #1a3a8a 55%,
            #0d2668 100%
          );
          margin: 0 -1.25rem;
          padding: 1.25rem 1.25rem 2.5rem;
          border-radius: 0 0 1.75rem 1.75rem;
        }
        .pld-hero-top {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          margin-bottom: 1rem;
        }
        .pld-badge {
          font-size: 0.6875rem;
          font-weight: 800;
          padding: 0.25rem 0.625rem;
          border-radius: 999px;
        }
        .pld-badge-ok {
          background: rgba(255, 255, 255, 0.2);
          color: #fff;
        }
        .pld-badge-warn {
          background: #fed7aa;
          color: #c2410c;
        }
        .pld-badge-muted {
          background: rgba(255, 255, 255, 0.15);
          color: rgba(255, 255, 255, 0.8);
        }
        .pld-badge-joined {
          background: #c8f542;
          color: #0f172a;
        }
        .pld-badge-wait {
          background: #e9d5ff;
          color: #7c3aed;
        }
        .pld-hero-title {
          font-size: 1.625rem;
          font-weight: 900;
          color: #fff;
          margin: 0 0 0.5rem;
          line-height: 1.2;
        }
        .pld-hero-meta {
          font-size: 0.8125rem;
          color: rgba(255, 255, 255, 0.75);
          margin: 0;
        }

        /* desktop brand */
        .pld-dsk-brand {
          text-align: center;
          max-width: 28rem;
          margin: 0 auto 1.75rem;
          padding: 0 1.5rem;
        }
        .pld-dsk-back {
          display: inline-flex;
          align-items: center;
          gap: 0.375rem;
          font-size: 0.8125rem;
          font-weight: 600;
          color: #64748b;
          text-decoration: none;
          margin-bottom: 1.5rem;
        }
        .pld-dsk-back:hover {
          color: #1a9be8;
        }
        .pld-dsk-logo {
          display: block;
          font-size: 2rem;
          font-weight: 900;
          color: #1a9be8;
          letter-spacing: -0.03em;
          margin-bottom: 1.25rem;
        }
        .pld-dsk-icon {
          color: #1a9be8;
          display: flex;
          justify-content: center;
          margin-bottom: 1.25rem;
        }
        .pld-dsk-title {
          font-size: 1.375rem;
          font-weight: 700;
          color: #1a1a1a;
          margin: 0 0 0.625rem;
          line-height: 1.35;
        }
        .pld-dsk-sub {
          font-size: 0.875rem;
          color: #6b7280;
          margin: 0;
        }

        /* sheet / info */
        .pld-sheet {
          background: #fff;
          border-radius: 1.75rem 1.75rem 0 0;
          margin: -1.5rem -0.25rem 0;
          padding: 1.5rem 1.25rem 1.25rem;
          position: relative;
        }
        @media (min-width: 1024px) {
          .pld-sheet {
            max-width: 28rem;
            margin: 0 auto;
            padding: 0 1.5rem;
            background: transparent;
            border-radius: 0;
          }
        }

        .pld-row {
          padding: 0.875rem 0;
          border-bottom: 1px solid #e8edf3;
        }
        @media (min-width: 1024px) {
          .pld-row {
            border-bottom-color: #d1d5db;
          }
        }
        .pld-row-label {
          display: block;
          font-size: 0.75rem;
          font-weight: 600;
          color: #6b7280;
          margin-bottom: 0.375rem;
        }
        .pld-row-value {
          font-size: 0.9375rem;
          color: #1a1a1a;
          line-height: 1.5;
        }
        .pld-loc-name {
          font-weight: 700;
          margin: 0;
        }
        .pld-loc-addr {
          font-size: 0.8125rem;
          color: #94a3b8;
          margin: 0.25rem 0 0;
        }
        .pld-map-link {
          display: inline-block;
          font-size: 0.75rem;
          font-weight: 700;
          color: #1a9be8;
          margin-top: 0.375rem;
          text-decoration: none;
        }
        .pld-map-link:hover {
          text-decoration: underline;
        }
        .pld-fee-free {
          font-weight: 700;
          color: #16a34a;
        }
        .pld-fee-paid {
          font-weight: 800;
          color: #1a9be8;
          font-size: 1.0625rem;
        }
        .pld-fee-unit {
          font-weight: 600;
          color: #94a3b8;
          font-size: 0.875rem;
        }
        .pld-pay-note {
          font-size: 0.75rem;
          color: #94a3b8;
          margin: 0.25rem 0 0;
        }
        .pld-count em {
          font-style: normal;
          font-weight: 800;
          color: #1a9be8;
        }
        .pld-waitlist {
          display: block;
          font-size: 0.75rem;
          color: #7c3aed;
          margin-top: 0.125rem;
        }

        .pld-desc {
          margin-top: 1.25rem;
          padding-top: 1.25rem;
          border-top: 1px solid #f1f5f9;
        }
        .pld-desc-label {
          font-size: 0.75rem;
          font-weight: 600;
          color: #6b7280;
          margin: 0 0 0.5rem;
        }
        .pld-desc-text {
          font-size: 0.875rem;
          color: #475569;
          line-height: 1.65;
          margin: 0;
          white-space: pre-wrap;
        }
        .pld-message {
          font-size: 0.875rem;
          color: #16a34a;
          font-weight: 600;
          margin: 1rem 0 0;
        }
        .pld-ended {
          text-align: center;
          font-size: 0.875rem;
          color: #94a3b8;
          margin: 1.5rem 0 0;
        }

        /* actions */
        .pld-actions {
          display: flex;
          flex-direction: column;
          gap: 0.625rem;
          margin-top: 1.5rem;
        }
        .pld-actions--sticky {
          flex-direction: row;
          flex-wrap: wrap;
          margin-top: 0;
        }
        .pld-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          border: none;
          border-radius: 999px;
          font-size: 0.9375rem;
          font-weight: 700;
          cursor: pointer;
          transition: opacity 0.2s;
          padding: 0.9375rem 1.5rem;
        }
        .pld-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .pld-btn-primary {
          background: #1a9be8;
          color: #fff;
          width: 100%;
        }
        .pld-btn-waitlist {
          background: #7c3aed;
          color: #fff;
          width: 100%;
        }
        .pld-btn-outline {
          background: #fff;
          border: 1.5px solid #e2e8f0;
          color: #475569;
          width: 100%;
        }
        .pld-btn-ghost {
          background: transparent;
          color: #ef4444;
          width: 100%;
        }
        .pld-actions--sticky .pld-btn-primary,
        .pld-actions--sticky .pld-btn-waitlist {
          flex: 1;
          min-width: 7rem;
        }
        .pld-actions--sticky .pld-btn-outline,
        .pld-actions--sticky .pld-btn-ghost {
          flex: 1;
        }
        .pld-btn-sticky {
          padding: 0.875rem 1rem;
          font-size: 0.875rem;
        }

        /* desktop panel */
        .pld-dsk-panel {
          max-width: 54rem;
          margin: 2.5rem auto 0;
          padding: 0 1.5rem;
        }
        .pld-dsk-panel-inner {
          border: 1px solid #b8d4f0;
          border-radius: 0.75rem;
          padding: 2.5rem 2.75rem 2.25rem;
        }
        .pld-dsk-panel-title {
          text-align: center;
          font-size: 1.125rem;
          font-weight: 700;
          color: #1a9be8;
          margin: 0 0 0.5rem;
        }
        .pld-dsk-panel-lead {
          text-align: center;
          font-size: 0.8125rem;
          color: #6b7280;
          margin: 0 0 2rem;
        }
        .pld-dsk-panel-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.25rem;
          margin-bottom: 2rem;
        }
        .pld-dsk-panel-box {
          border: 1px solid #b8d4f0;
          border-radius: 0.5rem;
          padding: 1.5rem 1.25rem;
          text-align: center;
        }
        .pld-dsk-panel-box-label {
          font-size: 0.8125rem;
          font-weight: 600;
          color: #374151;
          margin: 0 0 0.75rem;
        }
        .pld-dsk-panel-highlight {
          font-size: 1rem;
          font-weight: 700;
          color: #1a9be8;
          margin: 0 0 0.5rem;
        }
        .pld-dsk-panel-highlight em {
          font-style: normal;
          background: linear-gradient(transparent 58%, #fef08a 58%);
        }
        .pld-dsk-panel-fee {
          font-size: 1.75rem;
          font-weight: 700;
          color: #1a9be8;
          margin: 0 0 0.5rem;
        }
        .pld-dsk-panel-fee em {
          font-style: normal;
          background: linear-gradient(transparent 58%, #fef08a 58%);
        }
        .pld-dsk-panel-meta {
          font-size: 0.75rem;
          color: #6b7280;
          margin: 0;
        }

        .pld-map-block {
          margin-bottom: 2rem;
        }
        .pld-map-embed {
          border-color: #b8d4f0 !important;
          border-radius: 0.5rem !important;
        }

        .pld-dsk-steps {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 2.5rem;
          border-top: 1px solid #e5e7eb;
          padding-top: 2rem;
        }
        .pld-dsk-step-heading,
        .pld-section-title {
          font-size: 0.875rem;
          font-weight: 700;
          color: #374151;
          margin: 0 0 1rem;
        }
        .pld-section-title-spaced {
          margin-top: 1.25rem;
        }
        .pld-dsk-step-list {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .pld-dsk-step-list li {
          display: flex;
          align-items: center;
          gap: 0.875rem;
          font-size: 0.8125rem;
          color: #4b5563;
        }
        .pld-dsk-step-icon {
          width: 2.25rem;
          height: 2.25rem;
          border-radius: 999px;
          background: #eef6fc;
          color: #1a9be8;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .pld-participant-list {
          display: flex;
          flex-direction: column;
        }
        .pld-participant {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.625rem 0;
          border-bottom: 1px solid #f1f5f9;
        }
        .pld-participant:last-child {
          border-bottom: none;
        }
        .pld-participant-avatar,
        .pld-participant-fallback {
          width: 2.25rem;
          height: 2.25rem;
          border-radius: 999px;
          flex-shrink: 0;
        }
        .pld-participant-avatar {
          object-fit: cover;
        }
        .pld-participant-fallback {
          background: #eef6fc;
          color: #1a9be8;
          font-weight: 800;
          font-size: 0.875rem;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .pld-participant-name {
          font-size: 0.875rem;
          font-weight: 700;
          color: #1a1a1a;
        }
        .pld-participant-host {
          margin-left: 0.5rem;
          font-size: 0.625rem;
          font-weight: 800;
          color: #ef4444;
          background: #fef2f2;
          padding: 0.125rem 0.375rem;
          border-radius: 999px;
        }
        .pld-participant-list-muted {
          opacity: 0.75;
        }

        .pld-mobile-extra {
          padding: 0 0.25rem;
          margin-top: 1rem;
        }
        .pld-participants-mobile {
          background: #fff;
          border-radius: 1.25rem;
          padding: 1.25rem;
          margin-top: 1rem;
        }

        .pld-sticky {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          z-index: 50;
          padding: 0.75rem 1rem calc(0.75rem + env(safe-area-inset-bottom, 0px));
          background: #fff;
          border-top: 1px solid #e8edf3;
          box-shadow: 0 -4px 24px rgba(15, 23, 42, 0.08);
        }
        .pld-mobile-spacer {
          height: calc(5rem + env(safe-area-inset-bottom, 0px));
        }
      `}</style>
    </>
  );
}

export async function getServerSideProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale ?? "zh-TW", ["play", "common"])),
    },
  };
}
