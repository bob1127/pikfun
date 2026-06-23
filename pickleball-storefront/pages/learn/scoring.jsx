import { useState, useCallback, useRef } from "react";
import Head from "next/head";
import { motion, AnimatePresence } from "framer-motion";
import {
  LESSONS,
  applyRally,
  announceScore,
} from "../../lib/pickleballScoring";
import {
  Scoreboard,
  LessonCard,
  ExplanationBanner,
  ActionButtons,
  LessonSelector,
  RallyHistory,
} from "../../components/scoring/ScoreGameUI";
import Court2D from "../../components/scoring/Court2D";

// ─── 開始畫面 ─────────────────────────────────────────────────────────────────
function IntroScreen({ onStart }) {
  return (
    <motion.div
      className="flex flex-col items-center justify-center min-h-screen bg-[#071628] px-6 py-10 text-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="text-6xl mb-4 leading-none">🏓</div>
      <h1 className="text-3xl font-black text-white mb-2 tracking-tight">
        匹克球計分教學
      </h1>
      <p className="text-white/60 text-sm mb-8 max-w-xs leading-relaxed">
        互動 2D 球場，邊看邊學雙打計分。
        <br />
        每球操作完，立刻看到球員換邊與說明。
      </p>

      {/* 規則速查 */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-5 mb-8 w-full max-w-xs text-left space-y-3">
        {[
          ["報分格式", "發球方 – 接發方 – 發球序\n例：6-4-1"],
          ["★ 發球方得分", "同隊換邊，繼續由同球員發球"],
          ["Side out", "接發方得分 → 換對方發球"],
          ["開局特例", "先發球隊從 server 2（序號 2）開始"],
          ["勝利條件", "11 分且領先 ≥ 2 分"],
        ].map(([t, d]) => (
          <div key={t} className="flex gap-3">
            <span className="text-[#00FF88] font-bold text-xs min-w-[72px] mt-0.5 leading-snug">{t}</span>
            <span className="text-white/60 text-xs leading-snug whitespace-pre-line">{d}</span>
          </div>
        ))}
      </div>

      <motion.button
        whileTap={{ scale: 0.96 }}
        onClick={onStart}
        className="w-full max-w-xs py-4 rounded-2xl text-white font-bold text-lg tracking-wide"
        style={{ background: "linear-gradient(135deg,#1e88e5,#0d47a1)" }}
      >
        開始練習
      </motion.button>
    </motion.div>
  );
}

// ─── 勝利畫面 ─────────────────────────────────────────────────────────────────
function WinBanner({ winner, onNext, hasNext }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      className="absolute inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-sm"
    >
      <div className="bg-[#071628] border border-white/10 rounded-3xl p-8 text-center max-w-xs mx-4">
        <div className="text-5xl mb-3">{winner === "A" ? "🏆" : "😅"}</div>
        <h2 className="text-2xl font-black text-white mb-1">
          {winner === "A" ? "A 隊獲勝！" : "B 隊獲勝"}
        </h2>
        <p className="text-white/50 text-sm mb-6">
          {winner === "A" ? "你們隊贏得比賽！" : "繼續練習，下次一定可以！"}
        </p>
        {hasNext && (
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={onNext}
            className="w-full py-3 rounded-2xl text-white font-bold"
            style={{ background: "linear-gradient(135deg,#1e88e5,#0d47a1)" }}
          >
            下一關 →
          </motion.button>
        )}
      </div>
    </motion.div>
  );
}

// ─── 主頁面 ───────────────────────────────────────────────────────────────────
export default function ScoringGame() {
  const [started, setStarted] = useState(false);
  const [lessonIdx, setLessonIdx] = useState(0);
  const [gameState, setGameState] = useState(() => LESSONS[0].initState);
  const [history, setHistory] = useState([]);
  const [explanation, setExplanation] = useState("");
  const [lastWonBy, setLastWonBy] = useState(null);
  const rallyKey = useRef(0);
  const [rallyCounter, setRallyCounter] = useState(0);

  const currentLesson = LESSONS[lessonIdx];

  const handleLessonChange = useCallback((idx) => {
    setLessonIdx(idx);
    setGameState(LESSONS[idx].initState);
    setHistory([]);
    setExplanation("");
    setLastWonBy(null);
  }, []);

  const handleRally = useCallback((wonBy) => {
    setGameState((prev) => {
      const next = applyRally(prev, wonBy);
      setExplanation(next.explanation || "");
      setHistory((h) => [...h, prev]);
      setLastWonBy(wonBy);
      rallyKey.current += 1;
      setRallyCounter((c) => c + 1);
      return next;
    });
  }, []);

  const handleUndo = useCallback(() => {
    setHistory((h) => {
      if (h.length === 0) return h;
      const prev = h[h.length - 1];
      setGameState(prev);
      setExplanation("");
      return h.slice(0, -1);
    });
  }, []);

  const handleReset = useCallback(() => {
    setGameState(currentLesson.initState);
    setHistory([]);
    setExplanation("");
    setLastWonBy(null);
  }, [currentLesson]);

  const handleNextLesson = useCallback(() => {
    const next = lessonIdx + 1;
    if (next < LESSONS.length) handleLessonChange(next);
  }, [lessonIdx, handleLessonChange]);

  const { positions, servingTeam, serverNum, teamA, teamB, winner } = gameState;

  if (!started) {
    return (
      <AnimatePresence>
        <IntroScreen onStart={() => setStarted(true)} />
      </AnimatePresence>
    );
  }

  return (
    <>
      <Head>
        <title>匹克球計分教學 | PikPie</title>
        <meta name="description" content="2D 互動球場，學習匹克球雙打計分" />
      </Head>

      <div className="min-h-screen bg-[#071628] flex flex-col">
        {/* ── Header ── */}
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <a href="/" className="text-white/30 hover:text-white text-xl transition-colors leading-none">
            ←
          </a>
          <h1 className="text-white font-bold text-base tracking-wide">
            🏓 匹克球計分教學
          </h1>
          <div className="flex gap-2">
            <button
              onClick={handleUndo}
              disabled={history.length === 0}
              className="text-white/30 hover:text-white disabled:opacity-20 text-lg transition-colors"
              title="上一步"
            >
              ↩
            </button>
            <button
              onClick={handleReset}
              className="text-white/30 hover:text-white text-lg transition-colors"
              title="重置"
            >
              ↺
            </button>
          </div>
        </div>

        {/* ── 計分板 ── */}
        <div className="px-4 mb-2">
          <Scoreboard gameState={gameState} />
        </div>

        {/* ── 關卡選擇 ── */}
        <div className="px-4 mb-2">
          <LessonSelector
            lessons={LESSONS}
            currentIndex={lessonIdx}
            onChange={handleLessonChange}
          />
        </div>

        {/* ── 2D 球場（相對定位放勝利 banner） ── */}
        <div className="relative flex-1 px-2">
          <Court2D
            positions={positions}
            servingTeam={servingTeam}
            serverNum={serverNum}
            lastWonBy={lastWonBy}
            rallyKey={rallyCounter}
          />

          {/* 勝利 banner */}
          <AnimatePresence>
            {winner && (
              <WinBanner
                winner={winner}
                onNext={handleNextLesson}
                hasNext={lessonIdx < LESSONS.length - 1}
              />
            )}
          </AnimatePresence>
        </div>

        {/* ── 底部控制區 ── */}
        <div className="px-4 pb-6 space-y-3">
          {/* 歷史連分圓點 */}
          <RallyHistory history={history} gameState={gameState} />

          {/* 教學說明 */}
          <AnimatePresence mode="wait">
            <LessonCard key={lessonIdx} lesson={currentLesson} />
          </AnimatePresence>

          {/* 操作說明 */}
          <ExplanationBanner text={explanation} />

          {/* 得分按鈕 */}
          <ActionButtons
            onRally={handleRally}
            disabled={!!winner}
            winner={winner}
            servingTeam={servingTeam}
          />
        </div>
      </div>
    </>
  );
}
