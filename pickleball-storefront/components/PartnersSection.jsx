"use client";

import React, { useState } from "react";
import { Play, ArrowRight, X } from "lucide-react";

export default function PartnersSection() {
  const [isVideoOpen, setIsVideoOpen] = useState(false);

  // 第一排滾動標籤 (球場與服務)
  const marqueeRow1 = [
    "專業室內匹克球場",
    "24小時自助式球場",
    "國際知名球拍品牌",
    "認證匹克球專業教練",
    "地方匹克球推廣協會",
    "賽事活動主辦單位",
    "運動防護與物理治療",
  ];

  // 第二排滾動標籤 (商品與進駐商)
  const marqueeRow2 = [
    "獨家代理匹克球裝備",
    "運動機能服飾品牌",
    "企業包場團建合作",
    "匹克球網預訂服務",
    "聯名周邊商品賣家",
    "高階碳纖維球拍",
    "新手體驗課程機構",
  ];

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
        您的瀏覽器不支援 HTML5 影片。
      </video>

      {/* 品牌藍色半透明遮罩，確保文字易讀並符合 TSUNORU 視覺 */}
      <div className="absolute inset-0 bg-[#e9bb25]/80 mix-blend-multiply z-0"></div>
      <div className="absolute inset-0 bg-[#e9bb25]/80 z-0"></div>

      {/* ==========================================
          2. 主視覺內容區塊 (Hero Content)
      ========================================== */}
      <div className="relative z-10 pt-20 pb-12 md:pt-28 md:pb-16 px-6 text-center flex flex-col items-center flex-1 justify-center">
        <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-white tracking-widest mb-6 drop-shadow-lg">
          什麼是 PIKPIE？
        </h2>
        <p className="text-white/95 text-sm md:text-base leading-relaxed tracking-wider max-w-2xl mb-12 drop-shadow-md font-medium">
          PIKPIE，旨在解決全台匹克球友的痛點。
          <br className="hidden md:block" />
          我們匯聚了最專業的球場主、最具規模的裝備商家與認證教練，
          <br className="hidden md:block" />
          為球友與經營者打造一個專屬的「一站式資源生態圈」。
        </p>

        {/* 雙按鈕群組 */}
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          {/* 觀看影片按鈕 */}
          <button
            onClick={() => setIsVideoOpen(true)}
            className="flex items-center justify-center gap-3 bg-[#24428B] hover:bg-[#152754] text-white px-8 py-4 rounded-full font-bold tracking-widest transition-all duration-300 shadow-xl border border-white/10 w-full sm:w-auto group"
          >
            <Play
              fill="currentColor"
              size={18}
              className="group-hover:scale-110 transition-transform"
            />
            觀看平台介紹
          </button>

          {/* 了解更多按鈕 */}
          <a
            href="#learn-more"
            className="flex items-center justify-center gap-3 bg-[#24428B] hover:bg-[#152754] text-white px-8 py-4 rounded-full font-bold tracking-widest transition-all duration-300 shadow-xl border border-white/10 w-full sm:w-auto group"
          >
            了解進駐商家詳情
            <ArrowRight
              size={18}
              className="group-hover:translate-x-1 transition-transform"
            />
          </a>
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

      {/* ==========================================
          4. 彈出式影片視窗 (Video Modal)
      ========================================== */}
      {isVideoOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/85 backdrop-blur-md p-4 md:p-10">
          <button
            onClick={() => setIsVideoOpen(false)}
            className="absolute top-6 right-6 text-white/70 hover:text-[#FFD43A] transition-colors p-2"
          >
            <X size={40} strokeWidth={1.5} />
          </button>

          <div className="relative w-full max-w-5xl aspect-video bg-black rounded-xl overflow-hidden shadow-2xl ring-1 ring-white/20">
            <video
              className="w-full h-full object-cover"
              controls
              autoPlay
              playsInline
            >
              <source
                src="https://www.pexels.com/zh-tw/download/video/30937583/"
                type="video/mp4"
              />
              您的瀏覽器不支援 HTML5 影片。
            </video>
          </div>
        </div>
      )}
    </section>
  );
}
