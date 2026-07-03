"use client";

import Link from "next/link";
import { ChevronRight, ArrowUp, ExternalLink } from "lucide-react";

const ACCENT = "#3366CC";

const COLUMNS = [
  {
    title: "了解 PikFun",
    links: [
      { name: "平台介紹", href: "/about" },
      { name: "最新消息", href: "/blog" },
      { name: "匹克球新手指南", href: "/learn" },
      { name: "常見問題", href: "/faq" },
    ],
  },
  {
    title: "教練與課程",
    links: [
      { name: "全部教練課程", href: "/coaching" },
      { name: "我要開課", href: "/coaching/create" },
      { name: "教練進駐申請", href: "/coaching/apply" },
      { name: "進駐教練介紹", href: "/coaching#featured-coaches" },
    ],
  },
  {
    title: "揪團與球場",
    links: [
      { name: "揪團打球", href: "/play" },
      { name: "發起揪團", href: "/play/create" },
      { name: "球場地圖", href: "/courts" },
      { name: "會員中心", href: "/member" },
    ],
  },
];

function FooterLink({ href, children, external }) {
  const cls =
    "inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-[#3366CC] transition-colors underline decoration-gray-300 underline-offset-4 hover:decoration-[#3366CC]";
  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={cls}>
        {children}
        <ExternalLink size={13} className="shrink-0 opacity-60" />
      </a>
    );
  }
  return (
    <Link href={href} className={cls}>
      {children}
    </Link>
  );
}

/**
 * SURUGA 風格白底四欄 Footer + PAGE TOP
 * 用於教練開課內頁 / 列表頁底部
 */
export default function CoachingRecruitFooter({
  entryLabel = "ENTRY",
  entryHref = "/coaching/create",
  onEntryClick,
  showEntry = true,
}) {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="bg-white border-t border-gray-200">
      <div className="max-w-[1200px] mx-auto px-6 md:px-10 pt-14 pb-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-8">
          {/* 欄 1：品牌 + ENTRY */}
          <div>
            <div className="mb-8">
              <Link href="/" className="inline-block group">
                <p className="text-lg font-bold text-[#1a2d4a] tracking-tight group-hover:text-[#3366CC] transition-colors">
                  PikFun
                </p>
                <p className="text-[10px] text-gray-400 tracking-[0.15em] mt-0.5">
                  | Coaching Site
                </p>
              </Link>
            </div>

            {showEntry &&
              (onEntryClick ? (
                <button
                  type="button"
                  onClick={onEntryClick}
                  className="inline-flex items-center justify-center min-w-[140px] px-8 py-3 rounded-full text-white text-sm font-bold tracking-widest transition-opacity hover:opacity-90"
                  style={{ backgroundColor: ACCENT }}
                >
                  {entryLabel}
                </button>
              ) : (
                <Link
                  href={entryHref}
                  className="inline-flex items-center justify-center min-w-[140px] px-8 py-3 rounded-full text-white text-sm font-bold tracking-widest transition-opacity hover:opacity-90"
                  style={{ backgroundColor: ACCENT }}
                >
                  {entryLabel}
                </Link>
              ))}

            <ul className="mt-8 space-y-3">
              <li>
                <FooterLink href="/">PikFun 官網首頁</FooterLink>
              </li>
              <li>
                <FooterLink href="/privacy">個人資料保護方針</FooterLink>
              </li>
              <li>
                <FooterLink href="/contact">聯絡我們</FooterLink>
              </li>
            </ul>
          </div>

          {/* 欄 2–4 */}
          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h3 className="text-sm font-bold text-[#1a2d4a] mb-6 leading-snug">
                {col.title}
              </h3>
              <ul className="space-y-4">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-gray-600 hover:text-[#3366CC] transition-colors leading-relaxed"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* 最底列：版權 + PAGE TOP */}
      <div className="border-t border-gray-200">
        <div className="max-w-[1200px] mx-auto px-6 md:px-10 py-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-[11px] text-gray-400 tracking-wide order-2 sm:order-1">
            Copyright © {new Date().getFullYear()} PikFun. All Rights Reserved.
          </p>
          <button
            type="button"
            onClick={scrollToTop}
            className="inline-flex items-center gap-2 text-[11px] font-bold text-gray-500 tracking-[0.2em] hover:text-[#3366CC] transition-colors order-1 sm:order-2"
          >
            PAGE TOP
            <span
              className="flex h-8 w-8 items-center justify-center rounded-full text-white transition-transform hover:scale-105"
              style={{ backgroundColor: ACCENT }}
            >
              <ArrowUp size={14} strokeWidth={2.5} />
            </span>
          </button>
        </div>
      </div>
    </footer>
  );
}
