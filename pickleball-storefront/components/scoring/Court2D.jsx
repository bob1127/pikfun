import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ─── 顏色 ─────────────────────────────────────────────────────────────────────
const C = {
  court: "#1B5E20",        // 深綠球場
  courtLight: "#2E7D32",   // 球場格子
  kitchen: "#1565C0",      // 廚房藍
  kitchenFill: "rgba(21,101,192,0.35)",
  line: "#FFFFFF",
  net: "#CCCCCC",
  teamA: "#F59E0B",
  teamADark: "#B45309",
  teamB: "#EF4444",
  teamBDark: "#B91C1C",
  server: "#00FF88",       // 發球者光環
  ball: "#F5F5F5",
  shadow: "rgba(0,0,0,0.25)",
};

// ─── 球場設定（SVG viewBox 單位）────────────────────────────────────────────
const VW = 400;   // viewBox width
const VH = 600;   // viewBox height
const CX = VW / 2;
const CY = VH / 2;
const CW = 300;   // 球場寬
const CH = 480;   // 球場高
const KH = 130;   // 廚房深度
const L = CX - CW / 2;
const R = CX + CW / 2;
const T = CY - CH / 2;
const B = CY + CH / 2;

// 球員在場上的 x 位置
function playerX(side) {
  return side === "right" ? CX + CW / 4 : CX - CW / 4;
}

// 球員在場上的 y 位置（A 在下半場，B 在上半場）
const PY = {
  A1: CY + CH / 8,
  A2: CY + CH / 3,
  B1: CY - CH / 8,
  B2: CY - CH / 3,
};

// ─── 球場線 SVG ───────────────────────────────────────────────────────────────
function CourtLines() {
  return (
    <g>
      {/* 底色 */}
      <rect x={L} y={T} width={CW} height={CH} fill={C.court} rx={4} />

      {/* 廚房（上） */}
      <rect
        x={L} y={T}
        width={CW} height={KH}
        fill={C.kitchenFill}
      />
      {/* 廚房（下） */}
      <rect
        x={L} y={B - KH}
        width={CW} height={KH}
        fill={C.kitchenFill}
      />

      {/* 外框線 */}
      <rect x={L} y={T} width={CW} height={CH} fill="none" stroke={C.line} strokeWidth={2.5} />

      {/* 球網 */}
      <line x1={L} y1={CY} x2={R} y2={CY} stroke={C.net} strokeWidth={5} />

      {/* 廚房邊線（上） */}
      <line x1={L} y1={T + KH} x2={R} y2={T + KH} stroke={C.line} strokeWidth={1.5} />
      {/* 廚房邊線（下） */}
      <line x1={L} y1={B - KH} x2={R} y2={B - KH} stroke={C.line} strokeWidth={1.5} />

      {/* 中線（貫穿全場） */}
      <line x1={CX} y1={T} x2={CX} y2={B} stroke={C.line} strokeWidth={1.5} />

      {/* 標籤：球網 */}
      <text x={CX} y={CY - 8} textAnchor="middle" fill={C.net} fontSize={10} fontWeight="bold">
        球網
      </text>

      {/* 廚房標籤 */}
      <text x={CX} y={T + KH / 2 + 4} textAnchor="middle" fill="rgba(255,255,255,0.35)" fontSize={10}>
        Non-Volley Zone
      </text>
      <text x={CX} y={B - KH / 2 + 4} textAnchor="middle" fill="rgba(255,255,255,0.35)" fontSize={10}>
        Non-Volley Zone
      </text>

      {/* 隊伍區塊標籤 */}
      <text x={L - 8} y={CY + CH / 4} textAnchor="end" fill={C.teamA} fontSize={12} fontWeight="bold">A 隊</text>
      <text x={L - 8} y={CY - CH / 4} textAnchor="end" fill={C.teamB} fontSize={12} fontWeight="bold">B 隊</text>
    </g>
  );
}

// ─── 球員元件 ─────────────────────────────────────────────────────────────────
function Player({ x, y, color, darkColor, label, isServer, prevX, prevY }) {
  const pulseRef = useRef(null);

  return (
    <motion.g
      initial={false}
      animate={{ x, y }}
      transition={{ type: "spring", stiffness: 260, damping: 24 }}
      style={{ originX: "0px", originY: "0px" }}
    >
      {/* 發球者光環（脈衝圓） */}
      {isServer && (
        <motion.circle
          cx={0} cy={0} r={26}
          fill="none"
          stroke={C.server}
          strokeWidth={3}
          animate={{ r: [22, 30, 22], opacity: [0.9, 0.3, 0.9] }}
          transition={{ repeat: Infinity, duration: 1.2, ease: "easeInOut" }}
        />
      )}

      {/* 陰影 */}
      <circle cx={2} cy={2} r={18} fill={C.shadow} />

      {/* 主圓 */}
      <motion.circle
        cx={0} cy={0} r={18}
        fill={isServer ? color : darkColor}
        stroke={isServer ? C.server : color}
        strokeWidth={isServer ? 3 : 2}
        whileHover={{ scale: 1.1 }}
      />

      {/* 發球者球拍圖示 */}
      {isServer && (
        <text x={0} y={5} textAnchor="middle" fontSize={14}>🏓</text>
      )}

      {/* 標籤 */}
      <text
        x={0} y={!isServer ? 5 : 26}
        textAnchor="middle"
        fill="white"
        fontSize={isServer ? 11 : 13}
        fontWeight="bold"
      >
        {label}
      </text>
    </motion.g>
  );
}

// ─── 匹克球動畫 ───────────────────────────────────────────────────────────────
function Ball({ fromTeam, animating }) {
  const startY = fromTeam === "A" ? CY + 60 : CY - 60;
  const endY = fromTeam === "A" ? CY - 60 : CY + 60;

  if (!animating) return null;
  return (
    <motion.circle
      cx={CX}
      cy={startY}
      r={10}
      fill={C.ball}
      stroke="#ccc"
      strokeWidth={1}
      initial={{ cy: startY, opacity: 1, scale: 1 }}
      animate={{
        cy: [startY, CY, endY],
        scale: [1, 1.4, 1],
        opacity: [1, 1, 0],
      }}
      transition={{ duration: 0.55, ease: "easeInOut" }}
    />
  );
}

// ─── 得分爆炸特效 ─────────────────────────────────────────────────────────────
function ScorePopup({ text, color, key: k }) {
  return (
    <AnimatePresence>
      <motion.text
        key={k}
        x={CX}
        y={CY}
        textAnchor="middle"
        fill={color}
        fontSize={36}
        fontWeight="black"
        stroke="black"
        strokeWidth={1}
        initial={{ opacity: 1, y: CY, scale: 1 }}
        animate={{ opacity: 0, y: CY - 80, scale: 1.4 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.9 }}
      >
        {text}
      </motion.text>
    </AnimatePresence>
  );
}

// ─── 主元件 ───────────────────────────────────────────────────────────────────
export default function Court2D({ positions, servingTeam, serverNum, lastWonBy, rallyKey }) {
  const [ballAnim, setBallAnim] = useState(false);
  const [popup, setPopup] = useState(null);
  const prevRallyKey = useRef(null);

  useEffect(() => {
    if (rallyKey === null || rallyKey === prevRallyKey.current) return;
    prevRallyKey.current = rallyKey;

    setBallAnim(true);
    setPopup({
      text: lastWonBy === "A" ? "+1 A 得分！" : "+1 B 得分！",
      color: lastWonBy === "A" ? C.teamA : C.teamB,
      key: rallyKey,
    });

    const t = setTimeout(() => {
      setBallAnim(false);
      setPopup(null);
    }, 900);
    return () => clearTimeout(t);
  }, [rallyKey, lastWonBy]);

  const players = [
    { id: "A1", x: playerX(positions.A1), y: PY.A1, color: C.teamA, dark: C.teamADark, isServer: servingTeam === "A" && serverNum === 1 },
    { id: "A2", x: playerX(positions.A2), y: PY.A2, color: C.teamA, dark: C.teamADark, isServer: servingTeam === "A" && serverNum === 2 },
    { id: "B1", x: playerX(positions.B1), y: PY.B1, color: C.teamB, dark: C.teamBDark, isServer: servingTeam === "B" && serverNum === 1 },
    { id: "B2", x: playerX(positions.B2), y: PY.B2, color: C.teamB, dark: C.teamBDark, isServer: servingTeam === "B" && serverNum === 2 },
  ];

  return (
    <div className="w-full flex justify-center items-center select-none">
      <svg
        viewBox={`0 0 ${VW} ${VH}`}
        style={{ width: "100%", maxWidth: 380, height: "auto" }}
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* 背景 */}
        <rect width={VW} height={VH} fill="#071628" />

        {/* 球場 */}
        <CourtLines />

        {/* 球飛行動畫 */}
        <Ball fromTeam={lastWonBy === "A" ? "B" : "A"} animating={ballAnim} />

        {/* 球員（用 foreignObject trick 讓 motion.g 可以用） */}
        {players.map((p) => (
          <Player
            key={p.id}
            x={p.x}
            y={p.y}
            color={p.color}
            darkColor={p.dark}
            label={p.id}
            isServer={p.isServer}
          />
        ))}

        {/* 得分特效 */}
        {popup && (
          <ScorePopup
            key={popup.key}
            text={popup.text}
            color={popup.color}
          />
        )}
      </svg>
    </div>
  );
}
