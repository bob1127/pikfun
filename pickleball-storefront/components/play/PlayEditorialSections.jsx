"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "next-i18next";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import {
  getSkillLabels,
  formatSessionDate,
  formatSessionRange,
  formatFee,
} from "@/lib/playUtils";

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1554068865-24cecd4e24b8?auto=format&fit=crop&w=2000&q=80";

const HERO_CAROUSEL_IMAGES = [
  "/images/pik07.jpg",
  "/images/pik06.jpg",
  "/images/pik05.jpg",
  "/images/pik04.jpg",
  "/images/pik07.jpg",
  "/images/pik06.jpg",
  "/images/pik05.jpg",
  "/images/pik04.jpg",
];

const HERO_CAROUSEL_INTERVAL_MS = 4500;

function chunkImages(images, size) {
  const groups = [];
  for (let i = 0; i < images.length; i += size) {
    groups.push(images.slice(i, i + size));
  }
  return groups;
}

const PAGE_BG = "#F1F3F5";
const BLUE = "#005caf";
const CAROUSEL_INTERVAL_MS = 5000;

function getDemoAlmostFullSessions(t) {
  return [
    {
      id: "demo-1",
      title: t("editorial.demo.session1.title"),
      location_name: t("editorial.demo.session1.location_name"),
      skill_level: "intermediate",
      joined_count: 4,
      max_players: 5,
      starts_at: new Date(Date.now() + 86400000 * 2).toISOString(),
      fee_per_person: 150,
      payment_method: "cash",
    },
    {
      id: "demo-2",
      title: t("editorial.demo.session2.title"),
      location_name: t("editorial.demo.session2.location_name"),
      skill_level: "advanced",
      joined_count: 3,
      max_players: 4,
      starts_at: new Date(Date.now() + 86400000 * 4).toISOString(),
      fee_per_person: 0,
      payment_method: "free",
    },
    {
      id: "demo-3",
      title: t("editorial.demo.session3.title"),
      location_name: t("editorial.demo.session3.location_name"),
      skill_level: "beginner",
      joined_count: 5,
      max_players: 6,
      starts_at: new Date(Date.now() + 86400000 * 6).toISOString(),
      fee_per_person: 200,
      payment_method: "cash",
    },
    {
      id: "demo-4",
      title: t("editorial.demo.session4.title"),
      location_name: t("editorial.demo.session4.location_name"),
      skill_level: "intermediate",
      joined_count: 3,
      max_players: 4,
      starts_at: new Date(Date.now() + 86400000 * 8).toISOString(),
      fee_per_person: 100,
      payment_method: "transfer",
    },
  ];
}

const PLACEHOLDER_SLIDE_BG = ["#d5dae0", "#c9cfd6", "#bdc4cc", "#b1bac3"];

function formatStatNumber(n, locale = "zh-TW") {
  return Number(n || 0).toLocaleString(locale);
}

function getSessionCounts(session) {
  const max = session?.max_players || 4;
  const joined = session?.joined_count || 0;
  const spotsLeft =
    session?.spotsLeft ?? session?.spots_left ?? Math.max(0, max - joined);
  return { max, joined, spotsLeft };
}

function getSpotsMessage(spotsLeft, t) {
  if (spotsLeft <= 0) return t("status.full");
  if (spotsLeft === 1) return t("editorial.count_block.one_left");
  return t("editorial.count_block.left", { count: spotsLeft });
}

export function getAlmostFullSessions(sessions) {
  const now = new Date();
  const upcoming = sessions
    .filter(
      (s) =>
        s.display_status === "open" &&
        !s.is_full &&
        s.status !== "cancelled" &&
        new Date(s.starts_at) >= now,
    )
    .map((s) => {
      const max = s.max_players || 4;
      const joined = s.joined_count || 0;
      return {
        ...s,
        fillRatio: joined / max,
        spotsLeft: s.spots_left ?? Math.max(0, max - joined),
      };
    });

  const almostFull = upcoming
    .filter((s) => s.fillRatio >= 0.5 || s.spotsLeft <= 2)
    .sort((a, b) => {
      const d = a.spotsLeft - b.spotsLeft;
      if (d !== 0) return d;
      return b.fillRatio - a.fillRatio;
    })
    .slice(0, 8);

  if (almostFull.length > 0) return almostFull;

  // 沒有即將額滿的場次時，改帶入最新開的團
  return [...upcoming]
    .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
    .slice(0, 8);
}

export function computePlayStats(sessions) {
  const now = new Date();
  const upcomingOpen = (s) =>
    s.status !== "cancelled" &&
    s.display_status !== "cancelled" &&
    s.display_status !== "ended" &&
    !s.is_past &&
    s.starts_at &&
    new Date(s.starts_at) >= now;

  return {
    ongoing: sessions.filter(
      (s) => upcomingOpen(s) && s.display_status === "open",
    ).length,
    participants: sessions.reduce((sum, s) => sum + (s.joined_count || 0), 0),
    available: sessions.filter(
      (s) => upcomingOpen(s) && !s.is_full,
    ).length,
  };
}

/* ── Part 1: Hero images + marquee + intro strip ─────────── */
export function PlayHeroBanner({ stats, featuredSessions = [] }) {
  const { t } = useTranslation("play");
  const slideGroups = useMemo(() => chunkImages(HERO_CAROUSEL_IMAGES, 3), []);
  const [activeSlide, setActiveSlide] = useState(0);
  const marqueeText = t("editorial.hero.marquee_text");
  const marqueeItems = Array.from({ length: 3 }, () => marqueeText);

  useEffect(() => {
    if (slideGroups.length <= 1) return;
    const t = setInterval(() => {
      setActiveSlide((i) => (i + 1) % slideGroups.length);
    }, HERO_CAROUSEL_INTERVAL_MS);
    return () => clearInterval(t);
  }, [slideGroups.length]);

  return (
    <>
      <section className="relative w-full overflow-x-hidden bg-transparent md:bg-[#F1F3F5]">
        <h1 className="sr-only">{t("editorial.sr_title")}</h1>

        <style>{`
          @keyframes play-hero-marquee {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
          .play-hero-marquee-track {
            animation: play-hero-marquee 180s linear infinite;
            will-change: transform;
          }
        `}</style>

        <div className="relative overflow-x-hidden">
          <div className="relative h-[38vh] min-h-[260px] md:h-[48vh] md:min-h-[340px] lg:h-[52vh] overflow-x-hidden">
            <motion.div
              className="flex h-full"
              animate={{ x: `-${activeSlide * 100}%` }}
              transition={{ duration: 0.9, ease: [0.45, 0, 0.15, 1] }}
            >
              {slideGroups.map((group, groupIndex) => (
                <div
                  key={groupIndex}
                  className="flex min-w-full h-full shrink-0"
                >
                  {group.map((src, imageIndex) => (
                    <div
                      key={`${groupIndex}-${imageIndex}`}
                      className="flex-1 h-full min-w-0"
                    >
                      <img
                        src={src}
                        alt=""
                        className="w-full h-full object-cover object-center"
                      />
                    </div>
                  ))}
                </div>
              ))}
            </motion.div>

            <div className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-black/45 via-black/10 to-transparent pointer-events-none" />
          </div>

          <div
            className="relative overflow-hidden pointer-events-none select-none -mt-8 md:-mt-24 z-10"
            aria-hidden
          >
            <div className="flex w-max play-hero-marquee-track">
              {[...marqueeItems, ...marqueeItems].map((text, i) => (
                <span
                  key={i}
                  className="play-editorial-serif text-[#d9dfe6] leading-[0.9] tracking-[-0.02em] whitespace-nowrap pr-10 md:pr-16"
                  style={{ fontSize: "clamp(3rem, 10vw, 8.5rem)" }}
                >
                  {text}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

/* ── Figure 3: Stats row ─────────────────────────────────── */
export function PlayStatsBar({ stats }) {
  const { t, i18n } = useTranslation("play");
  const items = [
    {
      label: t("editorial.stats.ongoing"),
      value: stats.ongoing,
      unit: t("editorial.stats.unit_session"),
    },
    {
      label: t("editorial.stats.participants"),
      value: stats.participants,
      unit: t("editorial.stats.unit_person"),
    },
    {
      label: t("editorial.stats.available"),
      value: stats.available,
      unit: t("editorial.stats.unit_session"),
    },
  ];

  return (
    <section
      className="border-y border-[#e2e5e8]/80 bg-white/45 backdrop-blur-[2px] md:bg-[#F1F3F5] md:backdrop-blur-none"
    >
      <div className="max-w-[1400px] mx-auto px-4 md:px-10">
        <div className="grid grid-cols-3">
          {items.map((item, i) => (
            <div
              key={item.label}
              className={`flex flex-col items-center justify-center py-7 md:py-14 px-2 md:px-4 ${
                i > 0 ? "border-l border-[#d0d0d0]" : ""
              }`}
            >
              <p className="text-[10px] md:text-xs text-black/80 tracking-[0.08em] md:tracking-[0.12em] mb-2 md:mb-4 font-medium text-center leading-snug">
                {item.label}
              </p>
              <div className="flex items-end gap-0.5 md:gap-1">
                <span
                  className="play-editorial-serif text-black leading-none"
                  style={{ fontSize: "clamp(1.75rem, 7vw, 4.5rem)" }}
                >
                  {formatStatNumber(item.value, i18n.language)}
                </span>
                <span className="play-editorial-serif text-black/70 text-[11px] md:text-base pb-0.5 md:pb-1.5">
                  {item.unit}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function PlaceholderSlide({ index }) {
  const { t } = useTranslation("play");
  return (
    <div
      className="absolute inset-0 flex flex-col items-center justify-center"
      style={{ backgroundColor: PLACEHOLDER_SLIDE_BG[index % PLACEHOLDER_SLIDE_BG.length] }}
    >
      <div className="w-[72px] h-[52px] border-2 border-[#9aa5b1] rounded-[2px] flex items-center justify-center mb-2">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            stroke="#8a939e"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <span className="text-[11px] text-[#7d8793] tracking-[0.2em] font-medium">
        {t("editorial.placeholder_slide", { index: index + 1 })}
      </span>
    </div>
  );
}
function SessionMetaHeader({ session }) {
  const { t } = useTranslation("play");
  return (
    <div className="flex items-center gap-2 text-[11px] text-[#666] flex-wrap min-w-0">
      <span>{t("editorial.meta.field_label")}</span>
      <span className="text-[#d8d8d8]">|</span>
      <span className="text-[#222] truncate max-w-[160px]">
        {session.location_name || t("editorial.meta.field_fallback")}
      </span>
      <span
        className="px-2.5 py-[3px] rounded-full text-[10px] font-medium text-white leading-none"
        style={{ backgroundColor: BLUE }}
      >
        {t("editorial.meta.coming_soon_badge")}
      </span>
    </div>
  );
}

function SessionMetaBody({ session, isDemo = false }) {
  const { t } = useTranslation("play");
  const skillLabels = getSkillLabels(t);
  const category =
    session.skill_level && skillLabels[session.skill_level]
      ? `(${skillLabels[session.skill_level]})`
      : null;
  const tags = [
    t("editorial.tags.play"),
    t("editorial.tags.pickleball"),
    session.location_name,
    formatFee(session.fee_per_person, session.payment_method, t),
  ].filter(Boolean);

  const href = isDemo ? "#play-sessions-list" : `/play/${session.id}`;

  return (
    <>
      <Link
        href={href}
        className="group inline-flex items-start gap-1.5 text-[15px] md:text-[16px] font-bold text-black leading-[1.55] hover:opacity-60 transition-opacity mb-4"
      >
        <span className="line-clamp-3">{session.title}</span>
        <ArrowUpRight
          size={15}
          strokeWidth={2}
          className="shrink-0 mt-1 opacity-45 group-hover:opacity-100"
        />
      </Link>

      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11px] text-[#999] leading-relaxed">
        {category && <span>{category}</span>}
        {tags.map((t) => (
          <span key={t}>#{t}</span>
        ))}
      </div>
    </>
  );
}

function SessionCountBlock({ session, loading }) {
  const { t, i18n } = useTranslation("play");
  if (loading || !session) {
    return (
      <div className="flex items-start gap-4 md:gap-6 mb-10 md:mb-12 max-w-md">
        <div className="flex-1 space-y-2 pt-0.5">
          <div className="h-3.5 w-32 bg-[#eee] animate-pulse" />
          <div className="h-3.5 w-24 bg-[#eee] animate-pulse" />
        </div>
        <div className="w-px bg-[#ccc] self-stretch min-h-[4.5rem]" />
        <div className="w-[6.5rem] space-y-2">
          <div className="h-11 w-full bg-[#eee] animate-pulse" />
          <div className="h-3 w-20 bg-[#eee] animate-pulse ml-auto" />
        </div>
      </div>
    );
  }

  const { max, joined, spotsLeft } = getSessionCounts(session);

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={session.id}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.35 }}
        className="flex items-start gap-4 md:gap-5 mb-10 md:mb-12"
      >
        <div className="flex-1 min-w-0">
          <p className="text-[12px] md:text-[13px] text-[#333] leading-[1.9]">
            {getSpotsMessage(spotsLeft, t)}
            <br />
            {t("editorial.count_block.almost_full_desc")}
          </p>
          <p className="text-[10px] text-[#aaa] mt-3 tracking-wide">
            {t("editorial.count_block.starts_note", {
              date: formatSessionDate(session.starts_at, i18n.language),
            })}
          </p>
        </div>

        <div className="w-px bg-[#ccc] self-stretch min-h-[4.75rem] shrink-0" />

        <div className="shrink-0 pt-0.5">
          <div className="flex items-end gap-0.5">
            <span
              className="play-editorial-serif text-black leading-none tabular-nums"
              style={{ fontSize: "clamp(2.5rem, 5.5vw, 3.75rem)" }}
            >
              {joined}/{max}
            </span>
            <span className="play-editorial-serif text-[13px] text-[#444] pb-1.5">
              {t("editorial.count_block.unit_person")}
            </span>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

function PillButton({ href, onClick, variant = "primary", children }) {
  const isPrimary = variant === "primary";
  const className = [
    "inline-flex items-center gap-2.5 rounded-full pl-5 pr-1.5 py-1.5 text-[12px] md:text-[13px] font-bold transition-opacity whitespace-nowrap",
    isPrimary
      ? "text-white hover:opacity-90"
      : "text-[#333] bg-[#f0f0f0] hover:bg-[#e8e8e8]",
  ].join(" ");

  const inner = (
    <>
      <span className="py-1 px-1">{children}</span>
      <span
        className={`inline-flex items-center justify-center w-7 h-7 rounded-full shrink-0 ${
          isPrimary ? "bg-white/25" : "bg-black/[0.06]"
        }`}
      >
        <ArrowRight size={13} strokeWidth={2.5} />
      </span>
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className={className}
        style={isPrimary ? { backgroundColor: BLUE } : undefined}
      >
        {inner}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={className}
      style={isPrimary ? { backgroundColor: BLUE } : undefined}
    >
      {inner}
    </button>
  );
}

function CarouselDots({ count, active, onSelect, overlay = false }) {
  const { t } = useTranslation("play");
  return (
    <div className="flex items-center justify-end gap-2 shrink-0">
      {Array.from({ length: count }, (_, i) => (
        <button
          key={i}
          type="button"
          onClick={() => onSelect(i)}
          aria-label={t("editorial.carousel_dot_aria", { index: i + 1 })}
          aria-current={i === active ? "true" : undefined}
          className={`rounded-full transition-all duration-300 ${
            i === active
              ? "w-[7px] h-[7px]"
              : `w-[5px] h-[5px] ${overlay ? "bg-white/45 hover:bg-white/70" : "bg-[#d0d0d0] hover:bg-[#aaa]"}`
          }`}
          style={i === active ? { backgroundColor: BLUE } : undefined}
        />
      ))}
    </div>
  );
}

function PromoFloatCard() {
  const { t } = useTranslation("play");
  return (
    <Link
      href="/play/create"
      className="hidden xl:flex absolute bottom-10 right-6 2xl:right-10 w-[156px] overflow-hidden hover:opacity-90 transition-opacity shadow-md"
    >
      <div className="w-[54px] h-[76px] bg-[#1a3352] flex items-center justify-center p-2 shrink-0">
        <span className="text-[8px] text-white/90 leading-tight text-center font-bold">
          {t("editorial.promo_card.guide_line1")}
          <br />
          {t("editorial.promo_card.guide_line2")}
        </span>
      </div>
      <div
        className="flex-1 h-[76px] flex flex-col justify-center px-2.5 text-white"
        style={{ backgroundColor: BLUE }}
      >
        <p className="text-[9px] leading-snug font-bold">
          {t("editorial.promo_card.tip_line1")}
          <br />
          {t("editorial.promo_card.tip_line2")}
        </p>
      </div>
    </Link>
  );
}

export function PlayAlmostFullSection({ sessions, onCreateClick, loading }) {
  const { t } = useTranslation("play");
  const [active, setActive] = useState(0);

  const displaySessions = useMemo(() => {
    const base =
      sessions.length > 0
        ? sessions.slice(0, 4)
        : getDemoAlmostFullSessions(t);
    return base.map((s) => {
      const max = s.max_players || 4;
      const joined = s.joined_count || 0;
      return {
        ...s,
        spotsLeft: s.spotsLeft ?? s.spots_left ?? Math.max(0, max - joined),
      };
    });
  }, [sessions, t]);

  useEffect(() => {
    setActive(0);
  }, [displaySessions]);

  useEffect(() => {
    if (displaySessions.length <= 1) return;
    const t = setInterval(() => {
      setActive((i) => (i + 1) % displaySessions.length);
    }, CAROUSEL_INTERVAL_MS);
    return () => clearInterval(t);
  }, [displaySessions.length]);

  const current = displaySessions[active];
  const isDemo = current?.id?.startsWith("demo-");

  return (
    <section className="relative z-10 bg-white/55 backdrop-blur-[1px] md:bg-white md:backdrop-blur-none">
      <div className="max-w-[1200px] mx-auto px-6 md:px-12 lg:px-16 py-16 md:py-20 lg:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.05fr] gap-12 lg:gap-16 xl:gap-24 items-start">
          {/* ── Left column ── */}
          <div className="lg:pt-1">
            <div className="flex items-center gap-2 mb-4 md:mb-5">
              <span
                className="w-[6px] h-[6px] rounded-full shrink-0"
                style={{ backgroundColor: BLUE }}
              />
              <span className="text-[11px] md:text-xs text-[#555] tracking-[0.02em]">
                {t("editorial.almost_full.eyebrow")}
              </span>
            </div>

            <h2 className="text-[1.75rem] md:text-[2.125rem] lg:text-[2.375rem] font-bold text-black leading-[1.45] tracking-[-0.02em] mb-8 md:mb-10">
              {t("editorial.almost_full.title_line1")}
              <br />
              {t("editorial.almost_full.title_line2")}
            </h2>

            {loading ? (
              <SessionCountBlock session={null} loading />
            ) : (
              <SessionCountBlock session={current} loading={false} />
            )}

            <p className="text-[13px] md:text-sm text-[#333] leading-[2] mb-10 md:mb-12 max-w-[460px] text-justify">
              {t("editorial.almost_full.description")}
            </p>

            <div className="flex flex-col sm:flex-row flex-wrap items-start gap-2.5">
              {current && !isDemo ? (
                <PillButton href={`/play/${current.id}`} variant="primary">
                  {t("editorial.almost_full.join_now")}
                </PillButton>
              ) : (
                <PillButton onClick={onCreateClick} variant="primary">
                  {t("editorial.almost_full.create_cta")}
                </PillButton>
              )}
              <PillButton href="#play-sessions-list" variant="secondary">
                {t("editorial.almost_full.browse_all")}
              </PillButton>
            </div>
          </div>

          {/* ── Right column ── */}
          <div className="lg:pt-1">
            {loading ? (
              <div className="aspect-[10/7] bg-[#eee] animate-pulse" />
            ) : (
              <>
                <div className="relative aspect-[10/7] bg-[#eee]">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={current?.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.45 }}
                      className="absolute inset-0"
                    >
                      <PlaceholderSlide index={active} />
                    </motion.div>
                  </AnimatePresence>

                  <div className="absolute bottom-4 right-4 z-10">
                    <CarouselDots
                      count={displaySessions.length}
                      active={active}
                      onSelect={setActive}
                      overlay
                    />
                  </div>
                </div>

                <div className="mt-4 md:mt-5 mb-3">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={current?.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.3 }}
                    >
                      <SessionMetaHeader session={current} />
                    </motion.div>
                  </AnimatePresence>
                </div>

                <AnimatePresence mode="wait">
                  <motion.div
                    key={current?.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.35 }}
                  >
                    <SessionMetaBody session={current} isDemo={isDemo} />
                  </motion.div>
                </AnimatePresence>
              </>
            )}
          </div>
        </div>
      </div>

      <PromoFloatCard />
    </section>
  );
}
