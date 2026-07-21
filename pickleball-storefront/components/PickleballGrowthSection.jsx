// components/PickleballGrowthSection.jsx
// 台灣匹克球發展趨勢：成長曲線圖表區塊
import React from "react";
import { motion } from "framer-motion";

/* ---------- 曲線參數（指數成長曲線） ---------- */
const X0 = 60;
const X1 = 1400;
const Y0 = 560; // 曲線起點（左側低點）
const Y1 = 230; // 曲線終點（右側高點）
const K = 3.1;
const EXP_DENOM = Math.exp(K) - 1;

const curveX = (t) => X0 + (X1 - X0) * t;
const curveY = (t) => Y0 - (Y0 - Y1) * ((Math.exp(K * t) - 1) / EXP_DENOM);

const buildPath = (t0, t1, offset = 0, steps = 90) => {
  let d = "";
  for (let i = 0; i <= steps; i++) {
    const t = t0 + ((t1 - t0) * i) / steps;
    d += `${i === 0 ? "M" : "L"}${curveX(t).toFixed(1)},${(curveY(t) + offset).toFixed(1)} `;
  }
  return d;
};

/* ---------- 里程碑資料（直式中文 / 橫式英文交錯） ---------- */
const MILESTONES = [
  { type: "v", label: "運動傳入台灣", lift: 56 },
  { type: "h", title: "ORIGIN", sub: "Pickleball Arrives", lift: 44 },
  { type: "v", label: "協會推廣扎根", lift: 70 },
  { type: "h", title: "SEED", sub: "Associations Founded", lift: 48 },
  { type: "v", label: "疫後全民瘋打", lift: 60 },
  { type: "h", title: "BOOM", sub: "Post-Pandemic Wave", lift: 46 },
  { type: "v", label: "專屬球場倍增", lift: 76 },
  { type: "h", title: "COURTS", sub: "Indoor Courts Expand", lift: 50 },
  { type: "v", label: "全國賽事元年", lift: 64 },
  { type: "h", title: "GAMES", sub: "National Tournaments", lift: 48 },
  { type: "v", label: "品牌市場成形", lift: 78 },
  { type: "h", title: "MARKET", sub: "Brands & Gear", lift: 52 },
  { type: "v", label: "國際賽事接軌", lift: 66 },
  { type: "h", title: "SCALE", sub: "Sport for Everyone", lift: 48 },
];

const T_START = 0.035;
const T_STEP = 0.93 / (MILESTONES.length - 1);

/* ---------- 直式標籤（黑底白字） ---------- */
function VerticalLabel({ x, bottomY, label }) {
  const chars = label.split("");
  const lineH = 23;
  const boxW = 30;
  const boxH = chars.length * lineH + 14;
  const topY = bottomY - boxH;
  return (
    <g>
      <rect x={x - boxW / 2} y={topY} width={boxW} height={boxH} fill="#111" />
      {chars.map((c, i) => (
        <text
          key={i}
          x={x}
          y={topY + 14 + i * lineH + lineH / 2}
          textAnchor="middle"
          fontSize="16"
          fontWeight="700"
          fill="#fff"
        >
          {c}
        </text>
      ))}
    </g>
  );
}

/* ---------- 橫式標籤（粗體英文 + 小字副標） ---------- */
function HorizontalLabel({ x, baseY, title, sub }) {
  return (
    <g>
      <text
        x={x}
        y={baseY}
        textAnchor="middle"
        fontSize="21"
        fontWeight="800"
        fill="#111"
        letterSpacing="0.5"
      >
        {title}
      </text>
      <text x={x} y={baseY + 16} textAnchor="middle" fontSize="10.5" fill="#555">
        {sub}
      </text>
    </g>
  );
}

export default function PickleballGrowthSection() {
  const fadeUpProps = {
    initial: { opacity: 0, y: 40 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: "-100px" },
    transition: { duration: 0.8, ease: "easeOut" },
  };

  // 主曲線路徑
  const mainPath = buildPath(0, 1, 0);
  // 右側三條藍色加速曲線
  const bluePaths = [26, 34, 42].map((off) => buildPath(0.5, 1.005, off));
  // 左側藍色粗曲線（萌芽期底線）
  const blueSwoosh = buildPath(0.01, 0.4, 42);

  return (
    <section className="relative bg-white pb-24 pt-8">
      <div className="max-w-[1440px] mx-auto px-6 md:px-16">
        {/* ---------- 標題區 ---------- */}
        <motion.div {...fadeUpProps}>
          <div className="flex items-center gap-2 mb-6">
            <span className="w-[7px] h-[7px] rounded-full bg-[#0f43e7] inline-block" />
            <span className="text-[11px] font-bold tracking-[0.15em] text-gray-800 uppercase">
              Pickleball Trends in Taiwan
            </span>
          </div>
          <h2 className="text-2xl md:text-3xl lg:text-[32px] font-bold text-gray-900 leading-[1.6] tracking-wide mb-8">
            台灣匹克球近年發展趨勢
          </h2>
          <p className="text-gray-600 leading-[2.2] text-[14px] md:text-[15px] text-justify max-w-[760px] mb-4">
            匹克球正在台灣快速升溫：從協會推廣、社區與校園扎根，到疫情後全民瘋打、室內專屬球場接連開幕、全國賽事與品牌市場成形。PikFun
            整理台灣匹克球的發展軌跡，並以社群、裝備與課程的完整支援，陪伴這項運動一路走向全民普及、與國際接軌。
          </p>
        </motion.div>

        {/* ---------- 成長曲線圖（手機可橫向捲動） ---------- */}
        <motion.div
          {...fadeUpProps}
          transition={{ delay: 0.15, duration: 0.8 }}
          className="overflow-x-auto"
        >
          <svg
            viewBox="0 0 1440 640"
            className="min-w-[1100px] w-full h-auto select-none"
            role="img"
            aria-label="台灣匹克球發展趨勢成長曲線圖"
          >
            <defs>
              <marker
                id="pf-arrow"
                viewBox="0 0 10 10"
                refX="7"
                refY="5"
                markerWidth="7"
                markerHeight="7"
                orient="auto-start-reverse"
              >
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#0f43e7" />
              </marker>
            </defs>

            {/* 左側藍色粗曲線（萌芽期） */}
            <path
              d={blueSwoosh}
              fill="none"
              stroke="#0f43e7"
              strokeWidth="5"
              strokeLinecap="round"
            />

            {/* 右側三條藍色加速曲線（成長期） */}
            {bluePaths.map((d, i) => (
              <path
                key={i}
                d={d}
                fill="none"
                stroke="#0f43e7"
                strokeWidth={i === 0 ? 4 : 2.5}
                strokeLinecap="round"
                markerEnd="url(#pf-arrow)"
              />
            ))}

            {/* 主成長曲線（黑） */}
            <path
              d={mainPath}
              fill="none"
              stroke="#111"
              strokeWidth="3.5"
              strokeLinecap="round"
            />

            {/* 階段註記：萌芽期（沿平緩段） */}
            <text
              x={curveX(0.19)}
              y={curveY(0.19) + 30}
              fontSize="13"
              fill="#333"
              letterSpacing="2"
              transform={`rotate(-3 ${curveX(0.19)} ${curveY(0.19) + 30})`}
            >
              台灣匹克球萌芽期
            </text>

            {/* 階段註記：快速成長期（沿陡升段） */}
            <text
              x={curveX(0.78)}
              y={curveY(0.78) + 96}
              fontSize="13"
              fill="#333"
              letterSpacing="2"
              transform={`rotate(-33 ${curveX(0.78)} ${curveY(0.78) + 96})`}
            >
              全民普及／快速成長期
            </text>

            {/* 軸線刻度（0 → 1 → 10 → 100） */}
            {[
              { t: 0.02, label: "0" },
              { t: 0.5, label: "1" },
              { t: 0.78, label: "10" },
              { t: 0.93, label: "100" },
            ].map(({ t, label }) => (
              <g key={label}>
                <line
                  x1={curveX(t)}
                  y1={curveY(t) - 7}
                  x2={curveX(t)}
                  y2={curveY(t) + 7}
                  stroke="#111"
                  strokeWidth="1.5"
                />
                <text
                  x={curveX(t) - 14}
                  y={curveY(t) + 22}
                  fontSize="14"
                  fontStyle="italic"
                  fill="#666"
                  fontFamily="Georgia, serif"
                >
                  {label}
                </text>
              </g>
            ))}

            {/* 里程碑：節點、虛線引導線、標籤 */}
            {MILESTONES.map((m, i) => {
              const t = T_START + i * T_STEP;
              const x = curveX(t);
              const dotY = curveY(t);
              const labelBottom = dotY - m.lift;
              return (
                <g key={i}>
                  {/* 虛線引導線 */}
                  <line
                    x1={x}
                    y1={dotY - 9}
                    x2={x}
                    y2={m.type === "v" ? labelBottom + 4 : labelBottom + 22}
                    stroke="#999"
                    strokeWidth="1"
                    strokeDasharray="2 4"
                  />
                  {/* 曲線上的節點 */}
                  <circle cx={x} cy={dotY} r="5.5" fill="#111" stroke="#fff" strokeWidth="2" />
                  {/* 標籤 */}
                  {m.type === "v" ? (
                    <VerticalLabel x={x} bottomY={labelBottom} label={m.label} />
                  ) : (
                    <HorizontalLabel x={x} baseY={labelBottom} title={m.title} sub={m.sub} />
                  )}
                </g>
              );
            })}
          </svg>
        </motion.div>

        {/* ---------- 下方兩欄：發展動能 ---------- */}
        <motion.div
          {...fadeUpProps}
          transition={{ delay: 0.25, duration: 0.8 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-20 mt-6 md:mt-2 md:px-10"
        >
          <div>
            <h3 className="text-[#0f43e7] text-lg font-bold tracking-wider mb-4">
              社群擴散動能
            </h3>
            <p className="text-[13px] leading-[2] text-gray-800">
              協會與地方推廣 / 校園體育課程導入 / 社區揪團開打文化 /
              銀髮與親子族群參與 / 新手友善入門環境 / 球友交流與配對平台
            </p>
          </div>
          <div>
            <h3 className="text-[#0f43e7] text-lg font-bold tracking-wider mb-4">
              市場成長動能
            </h3>
            <p className="text-[13px] leading-[2] text-gray-800">
              室內專屬球場快速展店 / 裝備品牌與代理進駐 / 教練認證與課程體系 /
              全國排名賽與企業賽事 / 企業團建與包場需求 / 媒體聲量與轉播曝光
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
