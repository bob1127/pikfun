"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import {
  SKILL_LABELS,
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

const HERO_MARQUEE_TEXT =
  "揪團打球 · Pickleball Play · 一起上場揮拍 · Join the Game · 找球友開團 · ";

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

const DEMO_ALMOST_FULL_SESSIONS = [
  {
    id: "demo-1",
    title: "週末雙打揪團 — 石牌運動中心｜歡迎各程度球友加入",
    location_name: "石牌運動中心",
    skill_level: "intermediate",
    joined_count: 4,
    max_players: 5,
    starts_at: new Date(Date.now() + 86400000 * 2).toISOString(),
    fee_per_person: 150,
    payment_method: "cash",
  },
  {
    id: "demo-2",
    title: "平日晚上揪團 — 大安運動中心｜中階以上",
    location_name: "大安運動中心",
    skill_level: "advanced",
    joined_count: 3,
    max_players: 4,
    starts_at: new Date(Date.now() + 86400000 * 4).toISOString(),
    fee_per_person: 0,
    payment_method: "free",
  },
  {
    id: "demo-3",
    title: "假日早上揪團 — 板橋體育場｜輕鬆交流局",
    location_name: "板橋體育場",
    skill_level: "beginner",
    joined_count: 5,
    max_players: 6,
    starts_at: new Date(Date.now() + 86400000 * 6).toISOString(),
    fee_per_person: 200,
    payment_method: "cash",
  },
  {
    id: "demo-4",
    title: "夜間揪團 — 內湖匹克球場｜差一人即可開打",
    location_name: "內湖匹克球場",
    skill_level: "intermediate",
    joined_count: 3,
    max_players: 4,
    starts_at: new Date(Date.now() + 86400000 * 8).toISOString(),
    fee_per_person: 100,
    payment_method: "transfer",
  },
];

const PLACEHOLDER_SLIDE_BG = ["#d5dae0", "#c9cfd6", "#bdc4cc", "#b1bac3"];

function formatStatNumber(n) {
  return Number(n || 0).toLocaleString("zh-TW");
}

function getSessionCounts(session) {
  const max = session?.max_players || 4;
  const joined = session?.joined_count || 0;
  const spotsLeft =
    session?.spotsLeft ?? session?.spots_left ?? Math.max(0, max - joined);
  return { max, joined, spotsLeft };
}

function getSpotsMessage(spotsLeft) {
  if (spotsLeft <= 0) return "已額滿";
  if (spotsLeft === 1) return "差一人成團";
  return `差${spotsLeft}人成團`;
}

export function getAlmostFullSessions(sessions) {
  const now = new Date();
  return sessions
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
    })
    .filter((s) => s.fillRatio >= 0.5 || s.spotsLeft <= 2)
    .sort((a, b) => {
      const d = a.spotsLeft - b.spotsLeft;
      if (d !== 0) return d;
      return b.fillRatio - a.fillRatio;
    })
    .slice(0, 8);
}

export function computePlayStats(sessions) {
  return {
    ongoing: sessions.filter((s) => s.display_status === "open").length,
    participants: sessions.reduce((sum, s) => sum + (s.joined_count || 0), 0),
    available: sessions.filter(
      (s) => !s.is_full && s.display_status !== "cancelled",
    ).length,
  };
}

/* ── Part 1: Hero images + marquee + intro strip ─────────── */
export function PlayHeroBanner({ stats, featuredSessions = [] }) {
  const slideGroups = useMemo(() => chunkImages(HERO_CAROUSEL_IMAGES, 3), []);
  const [activeSlide, setActiveSlide] = useState(0);
  const marqueeItems = Array.from({ length: 3 }, () => HERO_MARQUEE_TEXT);

  useEffect(() => {
    if (slideGroups.length <= 1) return;
    const t = setInterval(() => {
      setActiveSlide((i) => (i + 1) % slideGroups.length);
    }, HERO_CAROUSEL_INTERVAL_MS);
    return () => clearInterval(t);
  }, [slideGroups.length]);

  return (
    <>
      <section className="relative w-full bg-[#F1F3F5]">
        <h1 className="sr-only">揪團打球</h1>

        <style>{`
          @keyframes play-hero-marquee {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
          .play-hero-marquee-track {
            animation: play-hero-marquee 180s linear infinite;
          }
        `}</style>

        <div className="relative">
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
            className="relative pointer-events-none select-none -mt-8 md:-mt-24 z-10"
            aria-hidden
          >
            <div className="flex w-max play-hero-marquee-track">
              {[...marqueeItems, ...marqueeItems].map((text, i) => (
                <span
                  key={i}
                  className="play-editorial-serif text-white leading-[0.9] tracking-[-0.02em] whitespace-nowrap pr-10 md:pr-16"
                  style={{ fontSize: "clamp(3rem, 10vw, 8.5rem)" }}
                >
                  {text}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <PlayHeroIntroStrip stats={stats} sessions={featuredSessions} />
    </>
  );
}

/* ── Below marquee: intro strip (reference image 2) ────── */
function PlayHeroIntroStrip({ stats, sessions }) {
  const [active, setActive] = useState(0);
  const items =
    sessions.length > 0
      ? sessions
      : [
          {
            id: "placeholder",
            title: "週末匹克球揪團 — 歡迎各程度球友加入",
            location_name: "台北運動中心",
            skill_level: "intermediate",
            starts_at: new Date().toISOString(),
          },
        ];

  useEffect(() => {
    if (items.length <= 1) return;
    const t = setInterval(() => {
      setActive((i) => (i + 1) % items.length);
    }, 5500);
    return () => clearInterval(t);
  }, [items.length]);

  const current = items[active];

  return (
    <section className="relative z-10" style={{ backgroundColor: PAGE_BG }}>
      <div className="max-w-[1200px] mx-auto px-6 md:px-12 lg:px-16 pt-16 md:pt-20 pb-12 md:pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-start">
          <div className="lg:pr-4">
            <h2 className="text-[1.625rem] md:text-[2rem] lg:text-[2.25rem] font-bold text-black leading-[1.5] tracking-[-0.01em] mb-8 md:mb-10">
              找到球友，
              <br />
              讓每場揪團都順利開打
            </h2>
            <div className="space-y-2 text-[13px] md:text-sm text-[#333] leading-relaxed">
              <p>
                進行揪團中{" "}
                <span className="font-bold text-black">
                  {formatStatNumber(stats?.ongoing ?? 0)}
                </span>{" "}
                場
              </p>
              <p>
                總參與人次{" "}
                <span className="font-bold text-black">
                  {formatStatNumber(stats?.participants ?? 0)}
                </span>{" "}
                人
              </p>
            </div>
          </div>

          <div className="relative min-h-[200px]">
            <div className="flex items-center justify-end gap-2 mb-4">
              {items.map((s, i) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setActive(i)}
                  aria-label={`第 ${i + 1} 則`}
                  className={`rounded-full transition-all ${
                    i === active
                      ? "w-2 h-2"
                      : "w-1.5 h-1.5 bg-[#ccc] hover:bg-[#aaa]"
                  }`}
                  style={i === active ? { backgroundColor: BLUE } : undefined}
                />
              ))}
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={current.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.3 }}
                className="space-y-3 pr-0 md:pr-36"
              >
                <div className="flex items-center gap-2 text-[11px] text-[#888] flex-wrap">
                  <span>場地</span>
                  <span className="text-[#d0d0d0]">|</span>
                  <span className="text-[#333]">
                    {current.location_name || "各區場地"}
                  </span>
                  <span
                    className="px-2 py-0.5 rounded-full text-[10px] font-medium text-white"
                    style={{ backgroundColor: BLUE }}
                  >
                    熱門揪團
                  </span>
                </div>

                <Link
                  href={
                    current.id === "placeholder"
                      ? "#play-sessions-list"
                      : `/play/${current.id}`
                  }
                  className="group inline-flex items-start gap-1.5 text-[15px] font-bold text-black leading-snug hover:opacity-65"
                >
                  <span className="line-clamp-2">{current.title}</span>
                  <ArrowUpRight
                    size={14}
                    className="shrink-0 mt-0.5 opacity-50"
                  />
                </Link>

                <div className="flex flex-wrap gap-x-3 text-[11px] text-[#aaa]">
                  {current.skill_level && (
                    <span>({SKILL_LABELS[current.skill_level]})</span>
                  )}
                  <span>#揪團打球</span>
                  <span>#匹克球</span>
                </div>
              </motion.div>
            </AnimatePresence>

            <Link
              href="/play/create"
              className="hidden md:flex absolute bottom-0 right-0 w-[148px] overflow-hidden rounded-sm shadow-sm hover:opacity-90 transition-opacity"
            >
              <div className="w-[52px] h-[72px] bg-[#1a3a5c] flex items-center justify-center p-1.5 shrink-0">
                <span className="text-[8px] text-white/90 leading-tight text-center font-bold">
                  開團
                  <br />
                  指南
                </span>
              </div>
              <div
                className="flex-1 h-[72px] flex flex-col justify-center px-2.5 text-white"
                style={{ backgroundColor: BLUE }}
              >
                <p className="text-[9px] leading-snug font-bold">
                  三步驟
                  <br />
                  輕鬆開團
                </p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── Figure 3: Stats row ─────────────────────────────────── */
export function PlayStatsBar({ stats }) {
  const items = [
    { label: "進行揪團中", value: stats.ongoing, unit: "場" },
    { label: "總參與人次", value: stats.participants, unit: "人" },
    { label: "可加入場次", value: stats.available, unit: "場" },
  ];

  return (
    <section
      className="border-y border-[#e2e5e8]"
      style={{ backgroundColor: PAGE_BG }}
    >
      <div className="max-w-[1400px] mx-auto px-5 md:px-10">
        <div className="grid grid-cols-1 sm:grid-cols-3">
          {items.map((item, i) => (
            <div
              key={item.label}
              className={`flex flex-col items-center justify-center py-10 md:py-14 px-4 ${
                i > 0 ? "sm:border-l sm:border-[#d0d0d0]" : ""
              } ${i > 0 ? "border-t sm:border-t-0 border-[#e0e0e0]" : ""}`}
            >
              <p className="text-[11px] md:text-xs text-black/80 tracking-[0.12em] mb-3 md:mb-4 font-medium">
                {item.label}
              </p>
              <div className="flex items-end gap-1">
                <span
                  className="play-editorial-serif text-black leading-none"
                  style={{ fontSize: "clamp(2.5rem, 6vw, 4.5rem)" }}
                >
                  {formatStatNumber(item.value)}
                </span>
                <span className="play-editorial-serif text-black/70 text-sm md:text-base pb-1 md:pb-1.5">
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
        假圖 {index + 1}
      </span>
    </div>
  );
}
function SessionMetaHeader({ session }) {
  return (
    <div className="flex items-center gap-2 text-[11px] text-[#666] flex-wrap min-w-0">
      <span>場地</span>
      <span className="text-[#d8d8d8]">|</span>
      <span className="text-[#222] truncate max-w-[160px]">
        {session.location_name || "待定"}
      </span>
      <span
        className="px-2.5 py-[3px] rounded-full text-[10px] font-medium text-white leading-none"
        style={{ backgroundColor: BLUE }}
      >
        即將成團
      </span>
    </div>
  );
}

function SessionMetaBody({ session, isDemo = false }) {
  const category =
    session.skill_level && SKILL_LABELS[session.skill_level]
      ? `(${SKILL_LABELS[session.skill_level]})`
      : null;
  const tags = [
    "揪團打球",
    "匹克球",
    session.location_name,
    formatFee(session.fee_per_person, session.payment_method),
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
            {getSpotsMessage(spotsLeft)}
            <br />
            即將額滿的揪團場次
          </p>
          <p className="text-[10px] text-[#aaa] mt-3 tracking-wide">
            ※{formatSessionDate(session.starts_at)} 開打
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
              人
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
  return (
    <div className="flex items-center justify-end gap-2 shrink-0">
      {Array.from({ length: count }, (_, i) => (
        <button
          key={i}
          type="button"
          onClick={() => onSelect(i)}
          aria-label={`第 ${i + 1} 場揪團`}
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
  return (
    <Link
      href="/play/create"
      className="hidden xl:flex absolute bottom-10 right-6 2xl:right-10 w-[156px] overflow-hidden hover:opacity-90 transition-opacity shadow-md"
    >
      <div className="w-[54px] h-[76px] bg-[#1a3352] flex items-center justify-center p-2 shrink-0">
        <span className="text-[8px] text-white/90 leading-tight text-center font-bold">
          開團
          <br />
          指南
        </span>
      </div>
      <div
        className="flex-1 h-[76px] flex flex-col justify-center px-2.5 text-white"
        style={{ backgroundColor: BLUE }}
      >
        <p className="text-[9px] leading-snug font-bold">
          新手上路
          <br />
          輕鬆開團
        </p>
      </div>
    </Link>
  );
}

export function PlayAlmostFullSection({ sessions, onCreateClick, loading }) {
  const [active, setActive] = useState(0);

  const displaySessions = useMemo(() => {
    const base =
      sessions.length > 0 ? sessions.slice(0, 4) : DEMO_ALMOST_FULL_SESSIONS;
    return base.map((s) => {
      const max = s.max_players || 4;
      const joined = s.joined_count || 0;
      return {
        ...s,
        spotsLeft: s.spotsLeft ?? s.spots_left ?? Math.max(0, max - joined),
      };
    });
  }, [sessions]);

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
    <section className="relative z-10 bg-white">
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
                匹克球揪團服務
              </span>
            </div>

            <h2 className="text-[1.75rem] md:text-[2.125rem] lg:text-[2.375rem] font-bold text-black leading-[1.45] tracking-[-0.02em] mb-8 md:mb-10">
              快要開團成功
              <br />
              把握最後名額
            </h2>

            {loading ? (
              <SessionCountBlock session={null} loading />
            ) : (
              <SessionCountBlock session={current} loading={false} />
            )}

            <p className="text-[13px] md:text-sm text-[#333] leading-[2] mb-10 md:mb-12 max-w-[460px] text-justify">
              瀏覽即將成團的匹克球場次，查看時間、地點與剩餘名額。
              人數即將額滿時把握最後加入機會，一鍵報名與球友相約上場，讓每場揪團都能順利開打。
            </p>

            <div className="flex flex-col sm:flex-row flex-wrap items-start gap-2.5">
              {current && !isDemo ? (
                <PillButton href={`/play/${current.id}`} variant="primary">
                  立即加入
                </PillButton>
              ) : (
                <PillButton onClick={onCreateClick} variant="primary">
                  我要開團
                </PillButton>
              )}
              <PillButton href="#play-sessions-list" variant="secondary">
                瀏覽全部場次
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
