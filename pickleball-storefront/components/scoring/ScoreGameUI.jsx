import { motion, AnimatePresence } from "framer-motion";
import { announceScore } from "../../lib/pickleballScoring";

const TEAM_A_COLOR = "#F59E0B";
const TEAM_B_COLOR = "#EF4444";

// ─── 上方計分板 ───────────────────────────────────────────────────────────────
export function Scoreboard({ gameState }) {
  const { servingTeam, winner } = gameState;
  const score = announceScore(gameState);
  const [s1, s2, s3] = score.split("-");

  return (
    <motion.div
      className="flex items-center justify-between bg-black/80 backdrop-blur-sm px-4 py-3 rounded-2xl border border-white/10"
      layout
    >
      {/* A 隊 */}
      <div className="flex items-center gap-2">
        <span
          className="text-xs font-bold px-2 py-0.5 rounded-full"
          style={{
            background: servingTeam === "A" ? TEAM_A_COLOR : "rgba(245,158,11,0.15)",
            color: "white",
          }}
        >
          {servingTeam === "A" ? "★ 你們" : "A 隊"}
        </span>
        <motion.span
          key={`a-${gameState.teamA.pts}`}
          initial={{ scale: 1.6, color: "#00FF88" }}
          animate={{ scale: 1, color: "#ffffff" }}
          className="text-3xl font-black tabular-nums"
        >
          {gameState.teamA.pts}
        </motion.span>
      </div>

      {/* 中間報分 */}
      <div className="text-center">
        <motion.div
          key={score}
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-lg font-black tracking-widest"
          style={{ color: servingTeam === "A" ? TEAM_A_COLOR : TEAM_B_COLOR }}
        >
          {score}
        </motion.div>
        <div className="text-white/30 text-[10px]">發 – 接 – 序</div>
      </div>

      {/* B 隊 */}
      <div className="flex items-center gap-2">
        <motion.span
          key={`b-${gameState.teamB.pts}`}
          initial={{ scale: 1.6, color: "#00FF88" }}
          animate={{ scale: 1, color: "#ffffff" }}
          className="text-3xl font-black tabular-nums"
        >
          {gameState.teamB.pts}
        </motion.span>
        <span
          className="text-xs font-bold px-2 py-0.5 rounded-full"
          style={{
            background: servingTeam === "B" ? TEAM_B_COLOR : "rgba(239,68,68,0.15)",
            color: "white",
          }}
        >
          {servingTeam === "B" ? "★ 對手" : "B 隊"}
        </span>
      </div>
    </motion.div>
  );
}

// ─── 教學說明卡 ───────────────────────────────────────────────────────────────
export function LessonCard({ lesson }) {
  return (
    <motion.div
      key={lesson.id}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="bg-[#0d1b2a]/95 border border-[#1e88e5]/30 rounded-2xl p-3"
    >
      <div className="flex items-center gap-2 mb-1">
        <span className="text-[#00FF88] text-[11px] font-bold tracking-widest uppercase">教學</span>
        <span className="text-white/50 text-[11px]">{lesson.title}</span>
      </div>
      <p className="text-white/90 text-sm leading-relaxed whitespace-pre-line">
        {lesson.description}
      </p>
      {lesson.hint && (
        <div className="mt-2 bg-[#1e88e5]/15 rounded-xl px-3 py-1.5">
          <span className="text-[#90caf9] text-xs">💡 {lesson.hint}</span>
        </div>
      )}
    </motion.div>
  );
}

// ─── 操作後說明橫幅 ───────────────────────────────────────────────────────────
export function ExplanationBanner({ text }) {
  return (
    <AnimatePresence>
      {text && (
        <motion.div
          key={text}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-[#1a2744] border border-[#1e88e5]/40 rounded-xl px-4 py-3 text-center"
        >
          <p className="text-white/90 text-sm leading-relaxed whitespace-pre-line">{text}</p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── 得分按鈕 ─────────────────────────────────────────────────────────────────
export function ActionButtons({ onRally, disabled, winner, servingTeam }) {
  if (winner) {
    return (
      <div className="text-center py-3">
        <span className="text-white/50 text-sm">遊戲結束，請切換關卡繼續學習</span>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={() => onRally("A")}
        disabled={disabled}
        className="py-4 rounded-2xl font-bold text-base tracking-wide text-white disabled:opacity-40"
        style={{
          background:
            servingTeam === "A"
              ? "linear-gradient(135deg,#F59E0B,#D97706)"
              : "rgba(245,158,11,0.18)",
          border: `2px solid ${servingTeam === "A" ? "#F59E0B" : "rgba(245,158,11,0.3)"}`,
        }}
      >
        {servingTeam === "A" ? "★ A 隊得分" : "A 隊得分"}
      </motion.button>

      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={() => onRally("B")}
        disabled={disabled}
        className="py-4 rounded-2xl font-bold text-base tracking-wide text-white disabled:opacity-40"
        style={{
          background:
            servingTeam === "B"
              ? "linear-gradient(135deg,#EF4444,#DC2626)"
              : "rgba(239,68,68,0.18)",
          border: `2px solid ${servingTeam === "B" ? "#EF4444" : "rgba(239,68,68,0.3)"}`,
        }}
      >
        {servingTeam === "B" ? "★ B 隊得分" : "B 隊得分"}
      </motion.button>
    </div>
  );
}

// ─── 關卡選擇器 ───────────────────────────────────────────────────────────────
export function LessonSelector({ lessons, currentIndex, onChange }) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
      {lessons.map((l, i) => (
        <motion.button
          key={l.id}
          whileTap={{ scale: 0.92 }}
          onClick={() => onChange(i)}
          className="flex-shrink-0 text-xs px-3 py-1.5 rounded-full transition-all font-medium"
          style={{
            background: i === currentIndex ? "#1e88e5" : "rgba(255,255,255,0.08)",
            color: i === currentIndex ? "#fff" : "rgba(255,255,255,0.5)",
            border: i === currentIndex ? "1.5px solid #42a5f5" : "1.5px solid transparent",
          }}
        >
          {i + 1}. {l.title}
        </motion.button>
      ))}
    </div>
  );
}

// ─── 歷史連分條 ───────────────────────────────────────────────────────────────
export function RallyHistory({ history, gameState }) {
  if (history.length === 0) return null;
  // 把歷史裡每步 applyRally 的結果拿出來，顯示每分是誰得的
  // history 是 gameState 前一個陣列，因此每個元素就是「那一球前」的狀態
  const dots = history.map((_, i) => {
    const cur = history[i + 1] || gameState;
    const prev = history[i];
    const aGained = cur.teamA.pts > prev.teamA.pts;
    return { color: aGained ? "#F59E0B" : "#EF4444" };
  });

  return (
    <div className="flex items-center gap-1 flex-wrap justify-center">
      {dots.map((d, i) => (
        <motion.div
          key={i}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="w-2.5 h-2.5 rounded-full"
          style={{ background: d.color }}
        />
      ))}
    </div>
  );
}
