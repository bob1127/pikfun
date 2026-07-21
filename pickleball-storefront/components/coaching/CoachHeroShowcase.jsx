// components/coaching/CoachHeroShowcase.jsx
// 教練開課頁 Hero：人物輪播 + 跑馬燈色帶 + 旋轉圓形文字徽章
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/router";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight } from "lucide-react";

/* ---------- 輪播人物資料（之後可換成真實教練） ---------- */
const SLIDES = [
  {
    id: "coach-1",
    name: "林佳穎",
    accent: "#f4408d",
    person: "/images/coaching/coach-cutout-1.png",
    tags: ["#新手友善教學", "#兒童體驗課程", "#前羽球校隊", "#一對一指導"],
    footer: "北區教練　C.Y.L.",
  },
  {
    id: "coach-2",
    name: "陳冠宇",
    accent: "#f26a21",
    person: "/images/coaching/coach-cutout-2.png",
    tags: ["#IPTPA 國際認證", "#進階戰術訓練", "#企業團課包班", "#殺球攻防教學"],
    footer: "中區教練　K.Y.C.",
  },
  {
    id: "coach-3",
    name: "張浩偉",
    accent: "#7cc242",
    person: "/images/coaching/coach-cutout-3.png",
    tags: ["#體驗課首選", "#活力滿分開團", "#學生族優惠", "#雙打默契攻略"],
    footer: "南區教練　H.W.C.",
  },
];

const AUTOPLAY_MS = 5500;

/* ---------- 跑馬燈文字（外框字與實心字交錯） ---------- */
function MarqueeRow() {
  const words = Array.from({ length: 10 }, (_, i) => i);
  return (
    <div className="pf-marquee-track flex items-center whitespace-nowrap">
      {[0, 1].map((dup) => (
        <div key={dup} className="flex items-center shrink-0">
          {words.map((i) => (
            <span
              key={i}
              className={`px-3 font-black uppercase leading-none tracking-tight text-[80px] md:text-[120px] ${
                i % 3 === 2 ? "text-white" : "pf-outline-text"
              }`}
            >
              PIKFUN
            </span>
          ))}
        </div>
      ))}
    </div>
  );
}

/* ---------- 旋轉圓形文字 ---------- */
function CircularText({ text, size, className = "", duration = 18 }) {
  const r = size / 2 - 11;
  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      width={size}
      height={size}
      className={`pf-spin ${className}`}
      style={{ animationDuration: `${duration}s` }}
      aria-hidden
    >
      <defs>
        <path
          id={`pf-circle-${size}`}
          d={`M ${size / 2},${size / 2} m -${r},0 a ${r},${r} 0 1,1 ${r * 2},0 a ${r},${r} 0 1,1 -${r * 2},0`}
        />
      </defs>
      <text fontSize="12.5" fontWeight="800" letterSpacing="2.5" fill="currentColor">
        <textPath href={`#pf-circle-${size}`}>{text}</textPath>
      </text>
    </svg>
  );
}

/* ---------- SVG 繪畫感匹克球場背景 ---------- */
function CourtBackground() {
  // 俯視平面球場：外圍緩衝區 + 球場 + 廚房區(非截擊區) + 白線 + 網
  const CX = 720; // 中心
  const courtW = 1000;
  const courtH = 460;
  const x0 = CX - courtW / 2;
  const y0 = 150;
  const kitchenW = 160; // 網兩側非截擊區寬
  return (
    <svg
      viewBox="0 0 1440 760"
      preserveAspectRatio="xMidYMid slice"
      className="absolute inset-0 w-full h-full"
      aria-hidden
    >
      {/* 外圍場地 */}
      <rect width="1440" height="760" fill="#2c8c74" />
      {/* 外圍淡紋理：手繪感斜線 */}
      <g stroke="#ffffff" strokeOpacity="0.05" strokeWidth="3">
        {Array.from({ length: 24 }, (_, i) => (
          <line key={i} x1={i * 70 - 120} y1="0" x2={i * 70 + 140} y2="760" />
        ))}
      </g>

      {/* 球場地面 */}
      <rect
        x={x0}
        y={y0}
        width={courtW}
        height={courtH}
        rx="6"
        fill="#1f6e5a"
      />
      {/* 廚房區（網兩側） */}
      <rect x={CX - kitchenW} y={y0} width={kitchenW} height={courtH} fill="#46a385" />
      <rect x={CX} y={y0} width={kitchenW} height={courtH} fill="#46a385" />

      {/* 白線（圓角線帽做出手繪感） */}
      <g
        stroke="#ffffff"
        strokeWidth="7"
        strokeLinecap="round"
        fill="none"
        strokeOpacity="0.95"
      >
        {/* 外框 */}
        <rect x={x0} y={y0} width={courtW} height={courtH} rx="4" />
        {/* 廚房線 */}
        <line x1={CX - kitchenW} y1={y0} x2={CX - kitchenW} y2={y0 + courtH} />
        <line x1={CX + kitchenW} y1={y0} x2={CX + kitchenW} y2={y0 + courtH} />
        {/* 左右發球區中線 */}
        <line x1={x0} y1={y0 + courtH / 2} x2={CX - kitchenW} y2={y0 + courtH / 2} />
        <line x1={CX + kitchenW} y1={y0 + courtH / 2} x2={x0 + courtW} y2={y0 + courtH / 2} />
      </g>

      {/* 中央球網 */}
      <g>
        <line
          x1={CX}
          y1={y0 - 26}
          x2={CX}
          y2={y0 + courtH + 26}
          stroke="#12352c"
          strokeWidth="10"
          strokeLinecap="round"
        />
        <line
          x1={CX}
          y1={y0 - 26}
          x2={CX}
          y2={y0 + courtH + 26}
          stroke="#ffffff"
          strokeOpacity="0.5"
          strokeWidth="4"
          strokeDasharray="2 10"
        />
      </g>

      {/* 裝飾：飛行中的匹克球 */}
      <g>
        <circle cx="270" cy="96" r="26" fill="#d7f24b" />
        {[
          [262, 88],
          [280, 92],
          [270, 104],
          [258, 100],
          [283, 104],
        ].map(([cx, cy], i) => (
          <circle key={i} cx={cx} cy={cy} r="3.4" fill="#a9c22c" />
        ))}
        <path
          d="M180 130 Q 225 118 244 104"
          stroke="#ffffff"
          strokeOpacity="0.55"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray="1 12"
          fill="none"
        />
      </g>
      <g>
        <circle cx="1210" cy="640" r="20" fill="#d7f24b" />
        {[
          [1204, 634],
          [1218, 636],
          [1210, 648],
        ].map(([cx, cy], i) => (
          <circle key={i} cx={cx} cy={cy} r="2.8" fill="#a9c22c" />
        ))}
      </g>

      {/* 場地光暈 */}
      <ellipse cx={CX} cy="340" rx="640" ry="330" fill="#ffffff" opacity="0.05" />
    </svg>
  );
}

/* ---------- 裝飾紙花 ---------- */
const CONFETTI = [
  { className: "top-[2%] left-[18%] w-10 h-3 rotate-[35deg]", color: "#b9f06a" },
  { className: "top-[8%] right-[6%] w-3 h-3 rounded-full", color: "#f4408d" },
  { className: "top-[46%] left-[1%] w-2.5 h-2.5 rounded-full", color: "#7cc242" },
  { className: "bottom-[6%] left-[30%] w-9 h-2.5 -rotate-[25deg]", color: "#9db8f7" },
  { className: "bottom-[14%] right-[2%] w-10 h-3 rotate-[55deg]", color: "#ffd94d" },
  { className: "top-[20%] left-[3%] w-8 h-2.5 rotate-[70deg]", color: "#ffd94d" },
];

export default function CoachHeroShowcase() {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const active = SLIDES[index];

  const next = useCallback(
    () => setIndex((i) => (i + 1) % SLIDES.length),
    [],
  );

  useEffect(() => {
    const timer = setInterval(next, AUTOPLAY_MS);
    return () => clearInterval(timer);
  }, [index, next]);

  return (
    <section className="relative bg-white overflow-hidden select-none">
      {/* 裝飾紙花 */}
      {CONFETTI.map((c, i) => (
        <span
          key={i}
          aria-hidden
          className={`absolute z-[5] ${c.className}`}
          style={{ background: c.color }}
        />
      ))}

      {/* 左上角站名標題 */}
      <div className="absolute top-6 left-5 md:top-10 md:left-10 z-40 pointer-events-none">
        <h1 className="text-[26px] md:text-[42px] font-black leading-[1.05] tracking-tight text-gray-900 uppercase">
          Pikfun
          <br />
          Coach
          <br />
          Class
          <br />
          Site
          <span style={{ color: active.accent }} className="transition-colors duration-700">
            .
          </span>
        </h1>
      </div>

      {/* 左緣 SCROLL 直書 */}
      <div className="hidden md:flex absolute left-3 top-1/2 -translate-y-1/2 z-40 flex-col items-center gap-3">
        <span
          className="text-[10px] font-bold tracking-[0.35em] text-gray-800 uppercase"
          style={{ writingMode: "vertical-rl" }}
        >
          Scroll
        </span>
        <span className="w-[1px] h-10 bg-gray-800" />
        <span
          className="w-1.5 h-1.5 rounded-full transition-colors duration-700"
          style={{ background: active.accent }}
        />
      </div>

      <div className="max-w-[1560px] mx-auto px-2 md:px-6 pt-5 pb-6 md:py-8">
        {/* 大圓角球場容器 */}
        <div className="relative h-[620px] md:h-[780px] rounded-[36px] md:rounded-[56px] overflow-hidden bg-[#2c8c74] md:ml-12 md:mr-8">
          {/* SVG 繪畫感球場背景 */}
          <CourtBackground />

          {/* 中央色帶 + 跑馬燈文字 */}
          <div className="absolute left-0 right-0 top-[46%] -translate-y-1/2 z-10">
            <div
              className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-9 md:h-12 transition-colors duration-700"
              style={{ background: active.accent }}
            />
            <div className="relative overflow-hidden">
              <MarqueeRow />
            </div>
          </div>

          {/* 人物 */}
          <AnimatePresence mode="wait">
            <motion.img
              key={active.id}
              src={active.person}
              alt={active.name}
              initial={{ opacity: 0, y: 80 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 40 }}
              transition={{ duration: 0.55, ease: "easeOut" }}
              className="absolute z-20 bottom-0 left-1/2 -translate-x-1/2 h-[74%] md:h-[90%] w-auto max-w-none drop-shadow-[0_18px_30px_rgba(0,0,0,0.35)]"
            />
          </AnimatePresence>

          {/* 旋轉徽章 + 編號 + 下一位 */}
          <div className="absolute z-30 top-[16%] left-1/2 -translate-x-[150%] md:-translate-x-[175%] w-[120px] h-[120px] md:w-[150px] md:h-[150px]">
            <CircularText
              text="PIKFUN COACH ・ PIKFUN COACH ・ PIKFUN COACH ・"
              size={150}
              className="absolute inset-0 w-full h-full text-white"
            />
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <AnimatePresence mode="wait">
                <motion.span
                  key={index}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.3 }}
                  className="text-white font-black text-4xl md:text-5xl italic tracking-wider drop-shadow"
                >
                  {String(index + 1).padStart(2, "0")}
                </motion.span>
              </AnimatePresence>
              <button
                type="button"
                aria-label="下一位教練"
                onClick={next}
                className="mt-1 w-9 h-9 rounded-full bg-white text-gray-900 flex items-center justify-center shadow-md hover:scale-110 transition-transform"
              >
                <ArrowRight size={16} />
              </button>
            </div>
          </div>

          {/* 人物 hashtag 標籤 */}
          <div className="absolute z-30 bottom-[8%] left-1/2 translate-x-[4%] md:translate-x-[10%] flex flex-col items-start gap-1.5">
            <AnimatePresence mode="wait">
              <motion.div
                key={active.id}
                initial="hidden"
                animate="show"
                exit="hidden"
                variants={{
                  show: { transition: { staggerChildren: 0.08 } },
                  hidden: {},
                }}
                className="flex flex-col items-start gap-1.5"
              >
                {active.tags.map((tag) => (
                  <motion.span
                    key={tag}
                    variants={{
                      hidden: { opacity: 0, x: -14 },
                      show: { opacity: 1, x: 0 },
                    }}
                    className="bg-black text-white text-[11px] md:text-[13px] font-bold px-2.5 py-1"
                  >
                    {tag}
                  </motion.span>
                ))}
                <motion.span
                  variants={{
                    hidden: { opacity: 0, x: -14 },
                    show: { opacity: 1, x: 0 },
                  }}
                  className="bg-white text-gray-900 text-[11px] md:text-[13px] font-bold px-2.5 py-1"
                >
                  {active.footer}
                </motion.span>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* 手機版指示點 */}
          <div className="md:hidden absolute z-30 bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
            {SLIDES.map((s, i) => (
              <button
                key={s.id}
                type="button"
                aria-label={s.name}
                onClick={() => setIndex(i)}
                className="w-2 h-2 rounded-full transition-colors"
                style={{ background: i === index ? active.accent : "rgba(255,255,255,0.5)" }}
              />
            ))}
          </div>

          {/* 右側教練頭貼圓圈導覽（框內） */}
          <div className="hidden md:flex absolute right-5 lg:right-7 top-1/2 -translate-y-1/2 z-30 flex-col gap-4">
            {SLIDES.map((s, i) => (
              <button
                key={s.id}
                type="button"
                aria-label={s.name}
                onClick={() => setIndex(i)}
                className={`relative w-[52px] h-[52px] rounded-full overflow-hidden bg-white shadow-md transition-all duration-300 ${
                  i === index
                    ? "scale-[1.18] ring-[3px] ring-offset-2 ring-offset-transparent"
                    : "opacity-85 hover:opacity-100 hover:scale-105 ring-2 ring-white/80"
                }`}
                style={i === index ? { "--tw-ring-color": s.accent } : undefined}
              >
                <img
                  src={s.person}
                  alt={s.name}
                  className="absolute w-[240%] max-w-none left-1/2 -translate-x-1/2 top-0.5"
                />
              </button>
            ))}
          </div>
        </div>

        {/* 左下角 ENTRY! 旋轉徽章 */}
        <button
          type="button"
          onClick={() => router.push("/coaching/apply")}
          className="absolute z-40 -left-8 -bottom-8 md:left-2 md:bottom-2 w-[120px] h-[120px] md:w-[136px] md:h-[136px] group"
          aria-label="申請成為教練"
        >
          <span className="absolute inset-0 rounded-full bg-white border-[3px] border-gray-900 group-hover:scale-105 transition-transform" />
          <CircularText
            text="ENTRY! ENTRY! ENTRY! ENTRY! ENTRY! "
            size={136}
            duration={14}
            className="absolute inset-0 w-full h-full text-gray-900"
          />
          <span className="absolute inset-0 flex items-center justify-center text-3xl">
            🏓
          </span>
        </button>
      </div>

      <style jsx global>{`
        .pf-outline-text {
          color: transparent;
          -webkit-text-stroke: 2px rgba(255, 255, 255, 0.92);
        }
        .pf-marquee-track {
          animation: pf-marquee 26s linear infinite;
          will-change: transform;
        }
        @keyframes pf-marquee {
          from {
            transform: translateX(0);
          }
          to {
            transform: translateX(-50%);
          }
        }
        .pf-spin {
          animation-name: pf-rotate;
          animation-timing-function: linear;
          animation-iteration-count: infinite;
        }
        @keyframes pf-rotate {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </section>
  );
}
