"use client";

import Link from "next/link";
import { ChevronRight, ArrowUp } from "lucide-react";

const BLUE = "#005caf";
const YELLOW = "#FFD43A";

const CARDS = [
  {
    title: "了解 PikFun",
    description:
      "認識平台理念、最新消息與新手指南，快速融入匹克球社群。",
    href: "/about",
    illustration: "platform",
  },
  {
    title: "教練與課程",
    description:
      "瀏覽全部教練課程、申請進駐或查看認證教練，開啟你的教學之路。",
    href: "/coaching",
    illustration: "coaching",
  },
  {
    title: "揪團與球場",
    description:
      "揪團打球、發起活動或查詢球場地圖，隨時找到適合的場次與場地。",
    href: "/play",
    illustration: "courts",
  },
  {
    title: "我要開課",
    description:
      "成為 PikFun 教練，刊登課程、招募學員，讓更多人愛上匹克球。",
    href: "/coaching/create",
    illustration: "entry",
    isEntry: true,
  },
];

function CardIllustration({ type }) {
  const blob = (
    <ellipse
      cx="52"
      cy="48"
      rx="44"
      ry="38"
      fill="white"
      className="drop-shadow-sm"
    />
  );

  if (type === "platform") {
    return (
      <svg viewBox="0 0 104 96" className="w-24 h-24 md:w-28 md:h-28" aria-hidden>
        {blob}
        <rect x="30" y="28" width="18" height="18" rx="2" fill="none" stroke="#1a1a1a" strokeWidth="2" />
        <rect x="52" y="28" width="18" height="18" rx="2" fill="none" stroke="#1a1a1a" strokeWidth="2" />
        <rect x="41" y="50" width="18" height="18" rx="2" fill={YELLOW} stroke="#1a1a1a" strokeWidth="2" />
      </svg>
    );
  }

  if (type === "coaching") {
    return (
      <svg viewBox="0 0 104 96" className="w-24 h-24 md:w-28 md:h-28" aria-hidden>
        {blob}
        <circle cx="52" cy="58" r="10" fill="none" stroke="#1a1a1a" strokeWidth="2" />
        <path d="M52 34 L52 48" stroke="#1a1a1a" strokeWidth="2" strokeLinecap="round" />
        <path d="M44 42 Q52 30 60 42" fill="none" stroke={BLUE} strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="52" cy="34" r="4" fill={YELLOW} />
      </svg>
    );
  }

  if (type === "courts") {
    return (
      <svg viewBox="0 0 104 96" className="w-24 h-24 md:w-28 md:h-28" aria-hidden>
        {blob}
        <path
          d="M38 62 L52 34 L66 62 Z"
          fill="none"
          stroke="#1a1a1a"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <path d="M46 54 L58 54" stroke={BLUE} strokeWidth="2.5" strokeLinecap="round" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 104 96" className="w-24 h-24 md:w-28 md:h-28" aria-hidden>
      {blob}
      <rect x="34" y="36" width="36" height="24" rx="12" fill="none" stroke="#1a1a1a" strokeWidth="2" />
      <circle cx="44" cy="48" r="3" fill={BLUE} />
      <circle cx="60" cy="48" r="3" fill={BLUE} />
      <path d="M48 56 Q52 62 56 56" fill="none" stroke="#1a1a1a" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function ResourceCard({ card, onEntryClick }) {
  const isEntry = Boolean(card.isEntry);

  const inner = (
    <>
      <div className="relative z-10 pr-24">
        <h3
          className={`text-base md:text-lg font-bold leading-snug transition-colors ${
            isEntry
              ? "text-[#005caf] group-hover:text-[#1a2d4a]"
              : "text-[#1a1a1a] group-hover:text-[#005caf]"
          }`}
        >
          {card.title}
        </h3>
        <p className="text-xs md:text-sm text-gray-600 leading-relaxed mt-3 max-w-[220px]">
          {card.description}
        </p>
      </div>

      <div className="absolute right-4 top-4 md:right-6 md:top-6 pointer-events-none opacity-90">
        <CardIllustration type={card.illustration} />
      </div>

      <span
        className="absolute bottom-5 right-5 flex h-8 w-8 items-center justify-center rounded-full text-white transition-transform group-hover:scale-105"
        style={{ backgroundColor: isEntry ? YELLOW : BLUE, color: isEntry ? "#1a2d4a" : "#fff" }}
      >
        <ChevronRight size={16} strokeWidth={2.5} />
      </span>
    </>
  );

  const cls = [
    "group relative flex flex-col justify-between min-h-[180px] md:min-h-[200px] rounded-2xl bg-[#f3f3f3] p-6 md:p-8 border-2 transition-colors overflow-hidden",
    isEntry
      ? "border-[#FFD43A] hover:border-[#005caf]"
      : "border-transparent hover:border-[#005caf]",
  ].join(" ");

  if (isEntry && onEntryClick) {
    return (
      <button type="button" onClick={onEntryClick} className={`${cls} text-left w-full`}>
        {inner}
      </button>
    );
  }

  return (
    <Link href={card.href} className={cls}>
      {inner}
    </Link>
  );
}

/**
 * 制度・環境風格 — 2×2 資源卡片 + 簡潔版權列
 */
export default function CoachingRecruitFooter({
  entryLabel,
  entryHref = "/coaching/create",
  onEntryClick,
  showEntry = true,
}) {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const visibleCards = (showEntry ? CARDS : CARDS.filter((c) => !c.isEntry)).map(
    (card) => {
      if (!card.isEntry) return card;
      return {
        ...card,
        title: entryLabel || card.title,
        href: entryHref,
      };
    },
  );

  return (
    <footer className="bg-white border-t border-gray-200">
      <div className="max-w-[1200px] mx-auto px-6 md:px-10 pt-14 pb-12">
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-10 md:mb-12">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl md:text-3xl font-bold text-[#1a1a1a] tracking-tight">
              平台・資源
            </h2>
            <Link
              href="/"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white transition-transform hover:scale-105"
              style={{ backgroundColor: BLUE }}
              aria-label="PikFun 首頁"
            >
              <ChevronRight size={16} strokeWidth={2.5} />
            </Link>
          </div>
          <p className="text-[11px] text-gray-400 tracking-wider font-mono">
            [Platform&Resources]
          </p>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-5">
          {visibleCards.map((card) => (
            <ResourceCard
              key={card.title}
              card={{ ...card, href: card.isEntry ? entryHref : card.href }}
              onEntryClick={card.isEntry ? onEntryClick : undefined}
            />
          ))}
        </div>

        <div className="mt-10 pt-8 border-t border-gray-200 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-gray-500">
          <Link href="/" className="font-bold text-[#1a2d4a] hover:text-[#005caf] transition-colors">
            PikFun
          </Link>
          <Link href="/" className="hover:text-[#005caf] transition-colors">
            官網首頁
          </Link>
          <Link href="/privacy" className="hover:text-[#005caf] transition-colors">
            個人資料保護方針
          </Link>
          <Link href="/contact" className="hover:text-[#005caf] transition-colors">
            聯絡我們
          </Link>
        </div>
      </div>

      <div className="border-t border-gray-200 bg-[#1a1a1a]">
        <div className="max-w-[1200px] mx-auto px-6 md:px-10 py-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-[11px] text-white/50 tracking-wide order-2 sm:order-1">
            Copyright © {new Date().getFullYear()} PikFun. All Rights Reserved.
          </p>
          <button
            type="button"
            onClick={scrollToTop}
            className="inline-flex items-center gap-2 text-[11px] font-bold text-white/70 tracking-[0.2em] hover:text-white transition-colors order-1 sm:order-2"
          >
            PAGE TOP
            <span
              className="flex h-8 w-8 items-center justify-center rounded-full transition-transform hover:scale-105"
              style={{ backgroundColor: YELLOW, color: "#1a2d4a" }}
            >
              <ArrowUp size={14} strokeWidth={2.5} />
            </span>
          </button>
        </div>
      </div>
    </footer>
  );
}
