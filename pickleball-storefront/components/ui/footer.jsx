"use client";

import Link from "next/link";
import { useRouter } from "next/router";
import React from "react";
import { ChevronRight } from "lucide-react";

/** 頁尾雙語字典：依 router.locale 取字，不依賴各頁面的 i18n namespace */
const FOOTER_TEXT = {
  "zh-TW": {
    intro_line1: "匹克方致力於打造最大的匹克球社群與資訊平台。",
    intro_line2: "球場預約、裝備選購、教練媒合與球友討論交流，通通交給我們。",
    login: "會員登入 / 註冊",
    privacy: "隱私權政策",
    terms: "服務條款",
    cookieSettings: "Cookie 設定",
    columns: [
      {
        title: "關於匹克方",
        links: [
          { name: "平台介紹與初衷", href: "/about" },
          { name: "最新消息・活動公告", href: "/news" },
          { name: "匹克球新手指南", href: "/guide" },
          { name: "常見問題", href: "/faq" },
          { name: "聯絡我們", href: "/contact" },
        ],
      },
      {
        title: "找球場與聚落",
        links: [
          { name: "全台匹克球場地圖", href: "/courts" },
          { name: "揪團打球", href: "/play" },
          { name: "近期揪團與賽事", href: "/events" },
          { name: "球友社群討論區", href: "/community" },
        ],
      },
      {
        title: "商城與產品",
        links: [
          { name: "線上商城 (球拍/裝備)", href: "/category" },
          { name: "匹克球知識文章", href: "/blog?category=knowledge" },
          { name: "球拍裝備攻略", href: "/blog?category=rackets-equipment" },
          { name: "購物與退換貨須知", href: "/shipping" },
        ],
      },
      {
        title: "教練與合作",
        links: [
          { name: "教練開課", href: "/coaching" },
          { name: "球場主進駐計畫", href: "/partners/courts" },
          { name: "賣家與品牌合作洽談", href: "/partners/brands" },
          { name: "企業贊助與廣告方案", href: "/partners/ads" },
        ],
      },
    ],
    quickLinks: [
      {
        subtitle: "運動知識與攻略",
        title: "匹克球知識",
        href: "/blog?category=knowledge",
      },
      {
        subtitle: "球拍・裝備挑選",
        title: "裝備攻略",
        href: "/blog?category=rackets-equipment",
      },
      {
        subtitle: "專業教練媒合",
        title: "教練開課",
        href: "/coaching",
      },
      {
        subtitle: "找球友一起打",
        title: "揪團打球",
        href: "/play",
      },
    ],
  },
  en: {
    intro_line1:
      "PikFun is building Taiwan's largest pickleball community and information platform.",
    intro_line2:
      "Court booking, gear shopping, coach matching, and player community — all in one place.",
    login: "Log In / Sign Up",
    privacy: "Privacy Policy",
    terms: "Terms of Service",
    cookieSettings: "Cookie Settings",
    columns: [
      {
        title: "About PikFun",
        links: [
          { name: "About the Platform", href: "/about" },
          { name: "News & Announcements", href: "/news" },
          { name: "Beginner's Guide", href: "/guide" },
          { name: "FAQ", href: "/faq" },
          { name: "Contact Us", href: "/contact" },
        ],
      },
      {
        title: "Courts & Community",
        links: [
          { name: "Court Map of Taiwan", href: "/courts" },
          { name: "Open Play", href: "/play" },
          { name: "Games & Tournaments", href: "/events" },
          { name: "Community Forum", href: "/community" },
        ],
      },
      {
        title: "Shop & Products",
        links: [
          { name: "Online Shop (Paddles & Gear)", href: "/category" },
          { name: "Pickleball Knowledge", href: "/blog?category=knowledge" },
          { name: "Gear Guides", href: "/blog?category=rackets-equipment" },
          { name: "Shipping & Returns", href: "/shipping" },
        ],
      },
      {
        title: "Coaching & Partnership",
        links: [
          { name: "Coaching", href: "/coaching" },
          { name: "Court Owner Program", href: "/partners/courts" },
          { name: "Seller & Brand Partnership", href: "/partners/brands" },
          { name: "Sponsorship & Ads", href: "/partners/ads" },
        ],
      },
    ],
    quickLinks: [
      {
        subtitle: "Tips & Knowledge",
        title: "Pickleball 101",
        href: "/blog?category=knowledge",
      },
      {
        subtitle: "Paddles & Gear",
        title: "Gear Guide",
        href: "/blog?category=rackets-equipment",
      },
      {
        subtitle: "Find a Coach",
        title: "Coaching",
        href: "/coaching",
      },
      {
        subtitle: "Play with Others",
        title: "Open Play",
        href: "/play",
      },
    ],
  },
};

export default function Footer() {
  const router = useRouter();
  const T = FOOTER_TEXT[router.locale === "en" ? "en" : "zh-TW"];
  const footerColumns = T.columns;
  const quickLinks = T.quickLinks;

  return (
    <footer className="bg-[#242424] text-[#cccccc] font-sans">
      <div className="max-w-[1200px] mx-auto px-6 pt-16 pb-12">
        {/* ==========================================
            1. 頂部：Logo 簡介 & 會員登入按鈕
        ========================================== */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center pb-12 border-b border-[#3d3d3d]">
          {/* 左側資訊 */}
          <div className="mb-8 md:mb-0">
            {/* Logo 替代文字/圖示 (可換成您的 Image 元件) */}
            <div className="mb-4">
              <img
                src="/images/logo-white.png"
                className="max-w-[85px]"
                alt=""
              />
              <p className="text-[10px] tracking-[0.2em] text-[#999999] mt-1 uppercase">
                Taiwan Pickleball Community
              </p>
            </div>
            {/* 網站簡介 */}
            <div className="text-xs text-[#999999] leading-relaxed tracking-wider">
              <p>{T.intro_line1}</p>
              <p>{T.intro_line2}</p>
            </div>
          </div>

          {/* 右側白色大按鈕 */}
          <Link
            href="/login"
            className="group flex items-center justify-center bg-white w-full md:w-[280px] py-4 rounded-sm transition-transform hover:opacity-90"
          >
            <span className="text-[#e22f5c] text-sm font-bold tracking-widest mr-2 group-hover:mr-4 transition-all">
              {T.login}
            </span>
            <ChevronRight size={16} className="text-[#e22f5c]" />
          </Link>
        </div>

        {/* ==========================================
            2. 中間：四欄位選單
        ========================================== */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-12 gap-y-12 py-16">
          {footerColumns.map((col, index) => (
            <div key={index}>
              {/* 欄位標題 (帶有圓形箭頭 icon) */}
              <div className="flex items-center mb-6">
                <div className="w-[14px] h-[14px] rounded-full bg-[#4a4a4a] flex items-center justify-center mr-2">
                  <ChevronRight
                    size={10}
                    className="text-[#242424] ml-[1px]"
                    strokeWidth={4}
                  />
                </div>
                <h3 className="text-sm font-bold tracking-widest text-[#e8e8e8]">
                  {col.title}
                </h3>
              </div>

              {/* 連結列表 */}
              <ul className="flex flex-col gap-4">
                {col.links.map((link, linkIndex) => (
                  <li key={linkIndex}>
                    <Link
                      href={link.href}
                      className="group flex items-center text-xs text-[#999999] hover:text-white transition-colors tracking-wide"
                    >
                      <ChevronRight
                        size={12}
                        className="mr-2 text-[#666666] group-hover:text-white transition-colors"
                      />
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* ==========================================
            3. 底部：快速入口（網站核心功能）
        ========================================== */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-[2px] mb-12">
          {quickLinks.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="bg-[#333333] hover:bg-[#3d3d3d] transition-colors py-6 px-4 flex flex-col items-center justify-center text-center h-[90px]"
            >
              <span className="text-[10px] text-[#888888] mb-1">
                {item.subtitle}
              </span>
              <span className="text-xs text-[#cccccc] font-bold tracking-widest">
                {item.title}
              </span>
            </Link>
          ))}
        </div>

        {/* ==========================================
            4. 最底部：版權宣告與隱私權
        ========================================== */}
        <div className="flex flex-col md:flex-row justify-between items-center text-[10px] text-[#666666] tracking-widest">
          <div className="flex gap-4 mb-4 md:mb-0">
            <Link
              href="/privacy"
              className="hover:text-white transition-colors"
            >
              {T.privacy}
            </Link>
            <span className="text-[#444444]">|</span>
            <Link href="/terms" className="hover:text-white transition-colors">
              {T.terms}
            </Link>
            <span className="text-[#444444]">|</span>
            <button
              type="button"
              onClick={() =>
                window.dispatchEvent(
                  new CustomEvent("pikfun:open-cookie-settings"),
                )
              }
              className="hover:text-white transition-colors"
            >
              {T.cookieSettings}
            </button>
          </div>
          <div className="flex flex-col md:flex-row items-center gap-1.5 md:gap-3 text-center">
            <p>Copyright © PikFun All rights reserved.</p>
            <span className="hidden md:inline text-[#444444]">|</span>
            <p>藍鏈數位企業社 60982396</p>
            <span className="hidden md:inline text-[#444444]">|</span>
            <p>
              Design by{" "}
              <a
                href="https://www.jeek-webdesign.com.tw/"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white transition-colors underline underline-offset-2"
              >
                極客網頁設計
              </a>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
