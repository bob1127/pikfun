"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useTranslation } from "next-i18next";

export default function PartnersSection() {
  const { t } = useTranslation("home");

  // 第一排滾動標籤 (球場與服務)
  const marqueeRow1 = t("partners.marquee1", { returnObjects: true });

  // 第二排滾動標籤 (商品與進駐商)
  const marqueeRow2 = t("partners.marquee2", { returnObjects: true });

  return (
    <section className="relative w-full overflow-hidden font-sans min-h-[80vh] flex flex-col justify-center">
      {/* 內聯 CSS 定義跑馬燈動畫 */}
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 30s linear infinite;
        }
        .animate-marquee-reverse {
          animation: marquee 35s linear infinite reverse;
        }
        .marquee-container:hover .animate-marquee,
        .marquee-container:hover .animate-marquee-reverse {
          animation-play-state: paused;
        }
      `}</style>

      {/* ==========================================
          1. 背景影片與遮罩 (Background Video & Overlay)
      ========================================== */}
      {/* 自動循環播放的背景影片 */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover z-0"
      >
        <source
          src="https://www.pexels.com/zh-tw/download/video/30937583/"
          type="video/mp4"
        />
        {t("partners.video_unsupported")}
      </video>

      {/* 品牌藍色半透明遮罩，確保文字易讀並符合 TSUNORU 視覺 */}
      <div className="absolute inset-0 bg-[#e9bb25]/80 mix-blend-multiply z-0"></div>
      <div className="absolute inset-0 bg-[#e9bb25]/80 z-0"></div>

      {/* ==========================================
          2. 主視覺內容區塊 (Hero Content)
      ========================================== */}
      <div className="relative z-10 pt-20 pb-12 md:pt-28 md:pb-16 px-6 text-center flex flex-col items-center flex-1 justify-center">
        <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-white tracking-widest mb-6 drop-shadow-lg">
          {t("partners.heading")}
        </h2>
        <p className="text-white/95 text-sm md:text-base leading-relaxed tracking-wider max-w-2xl mb-12 drop-shadow-md font-medium">
          {t("partners.desc_line1")}
          <br className="hidden md:block" />
          {t("partners.desc_line2")}
          <br className="hidden md:block" />
          {t("partners.desc_line3")}
        </p>

        {/* 雙按鈕群組 */}
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          {/* 揪團按鈕 */}
          <Link
            href="/play"
            className="flex items-center justify-center gap-3 bg-[#24428B] hover:bg-[#152754] text-white px-8 py-4 rounded-full font-bold tracking-widest transition-all duration-300 shadow-xl border border-white/10 w-full sm:w-auto group"
          >
            {t("partners.watch_btn")}
            <ArrowRight
              size={18}
              className="group-hover:translate-x-1 transition-transform"
            />
          </Link>

          {/* 專業教練按鈕 */}
          <Link
            href="/coaching"
            className="flex items-center justify-center gap-3 bg-[#24428B] hover:bg-[#152754] text-white px-8 py-4 rounded-full font-bold tracking-widest transition-all duration-300 shadow-xl border border-white/10 w-full sm:w-auto group"
          >
            {t("partners.learn_btn")}
            <ArrowRight
              size={18}
              className="group-hover:translate-x-1 transition-transform"
            />
          </Link>
        </div>
      </div>

      {/* ==========================================
          3. Hashtag 跑馬燈區塊 (Marquee Tags)
          (疊加在背景影片的下方區域)
      ========================================== */}
      <div className="relative z-10 pb-12 flex flex-col gap-5 overflow-hidden marquee-container w-full">
        {/* 第一排向左滾動 */}
        <div className="flex w-max animate-marquee">
          {[...marqueeRow1, ...marqueeRow1].map((tag, index) => (
            <div
              key={`row1-${index}`}
              className="flex items-center bg-white px-6 py-3.5 mx-2.5 rounded-md shadow-lg cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all"
            >
              <span className="text-[#FFD43A] font-black text-lg mr-2">#</span>
              <span className="text-[#3157B5] font-bold text-sm tracking-widest whitespace-nowrap">
                {tag}
              </span>
            </div>
          ))}
        </div>

        {/* 第二排向左滾動 (起始位置不同，產生錯落感) */}
        <div className="flex w-max animate-marquee-reverse pl-20">
          {[...marqueeRow2, ...marqueeRow2].map((tag, index) => (
            <div
              key={`row2-${index}`}
              className="flex items-center bg-white px-6 py-3.5 mx-2.5 rounded-md shadow-lg cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all"
            >
              <span className="text-[#FFD43A] font-black text-lg mr-2">#</span>
              <span className="text-[#3157B5] font-bold text-sm tracking-widest whitespace-nowrap">
                {tag}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
