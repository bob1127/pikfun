"use client";

import React, { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { ExternalLink } from "lucide-react";

// --- 單一文字區塊元件 (進階滾動淡入淡出) ---
const FeatureBlock = ({ number, title, description, btnText }) => {
  const blockRef = useRef(null);

  // 當元素的頂部碰到視窗下方 90% 開始動畫，底部碰到上方 10% 結束
  const { scrollYProgress } = useScroll({
    target: blockRef,
    offset: ["start 90%", "end 10%"],
  });

  // 進場 -> 停留 -> 退場
  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0]);
  const y = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [80, 0, 0, -80]);

  return (
    <motion.div
      ref={blockRef}
      style={{ opacity, y }}
      className="mb-[40vh] last:mb-[20vh] max-w-xl relative z-10"
    >
      <span className="text-sm tracking-widest text-white/70 block mb-6 font-bold uppercase">
        Trend {number}
      </span>
      <h3 className="text-3xl md:text-[40px] font-bold text-white mb-8 tracking-wider leading-tight">
        {title}
      </h3>
      <p className="text-base md:text-lg text-white/80 leading-relaxed mb-10 font-light text-justify">
        {description}
      </p>

      <button className="group flex items-center gap-4 border border-white/40 rounded-full px-8 py-3.5 text-white hover:bg-white hover:text-[#0f43e7] transition-all duration-500 ease-out">
        <span className="font-bold tracking-widest text-sm uppercase">
          {btnText}
        </span>
        <ExternalLink
          size={16}
          className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform duration-300"
        />
      </button>

      <div className="mt-8">
        <a
          href="#"
          className="text-sm text-white/50 hover:text-white underline underline-offset-4 tracking-wider transition-colors duration-300"
        >
          探索更多匹克球資訊
        </a>
      </div>
    </motion.div>
  );
};

// --- 主元件 ---
export default function ScrollServiceSection() {
  const containerRef = useRef(null);

  // 監聽整個大區塊的滾動，控制背景影片的淡出
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  const videoOpacity = useTransform(scrollYProgress, [0.85, 1], [1, 0]);
  const videoScale = useTransform(scrollYProgress, [0, 1], [1, 1.15]);

  // 🔥 替換為匹克球介紹與趨勢統計資料
  const pickleballFeatures = [
    {
      num: "01",
      title: "新世代的國民運動",
      desc: "匹克球 (Pickleball) 完美結合了網球、羽毛球與桌球的元素，在相當於羽毛球大小的場地上，使用專用的複合材質球拍與塑膠穿孔球進行對戰。不僅上手門檻低，更兼具高度的競技與趣味性，無論是運動新手或資深運動員都能迅速體會其中的魅力。",
      btnText: "了解規則",
    },
    {
      num: "02",
      title: "連續三年成長率 NO.1",
      desc: "根據 SFIA（美國體育和健身產業協會）的最新統計，匹克球已連續數年蟬聯「全美發展最快運動」榜首，光是美國參與人數就突破 3,600 萬人次。這股熱潮正迅速席捲全球，亞洲與台灣的參與人數與專屬場館也正呈現爆發性的指數級成長。",
      btnText: "市場趨勢",
    },
    {
      num: "03",
      title: "跨越世代的社交體驗",
      desc: "匹克球不僅是一項體育運動，更是建立社群連結的絕佳橋樑。較小的場地拉近了玩家間的距離，讓比賽中充滿了歡笑與互動。它打破了年齡與體能的限制，讓祖孫同樂、跨世代交友成為日常，是現代人釋放壓力與拓展社交圈的最佳選擇。",
      btnText: "尋找球友",
    },
  ];

  return (
    <div ref={containerRef} className="relative bg-[#0f43e7] font-sans w-full">
      <div className="flex flex-col md:flex-row w-full max-w-[1920px] mx-auto relative">
        {/* === 左側：沾黏影片背景區 (Sticky Video) === */}
        <div className="w-full md:w-1/2 h-[50vh] md:h-screen sticky top-0 overflow-hidden flex items-center justify-center pointer-events-none z-0 bg-[#0f43e7]">
          <motion.div
            style={{
              opacity: videoOpacity,
              scale: videoScale,
              transformOrigin: "center center",
            }}
            className="absolute inset-0 w-full h-full flex items-center justify-center"
          >
            {/* YouTube Iframe 作為純淨滿版背景 (Dx60IHP5QlE) */}
            <iframe
              className="absolute top-1/2 left-1/2 w-[300%] h-[300%] md:w-[180%] md:h-[180%] -translate-x-1/2 -translate-y-1/2 max-w-none pointer-events-none object-cover"
              src="https://www.youtube.com/embed/Dx60IHP5QlE?autoplay=1&mute=1&controls=0&loop=1&playlist=Dx60IHP5QlE&modestbranding=1&rel=0&playsinline=1&disablekb=1"
              title="YouTube video background"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              tabIndex="-1"
            />

            {/* 色彩增殖層：讓影片染上主視覺藍色 */}
            <div className="absolute inset-0 bg-[#0f43e7]/80 mix-blend-multiply pointer-events-none" />

            {/* 基礎暗化層：確保文字對比度 */}
            <div className="absolute inset-0 bg-[#0f43e7]/40 pointer-events-none" />
          </motion.div>
        </div>

        {/* === 右側：文字滾動區 (Scroll) === */}
        <div className="w-full md:w-1/2 px-6 md:px-16 lg:px-24 pt-[20vh] md:pt-[30vh] pb-[30vh] relative z-10">
          {pickleballFeatures.map((feature, idx) => (
            <FeatureBlock
              key={idx}
              number={feature.num}
              title={feature.title}
              description={feature.desc}
              btnText={feature.btnText}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
