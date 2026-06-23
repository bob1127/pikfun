"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { initialGameState, applyRally, announceScore } from "../../lib/pickleballScoring";

// ─── 球場尺寸 ──────────────────────────────────────────────────────────────────
const W = 400, H = 660;
const NET_Y = H / 2;          // 330 — 球網
const MX = 44, MY = 28;
const CL = MX, CR = W - MX, CT = MY, CB = H - MY;
const KITCHEN_D = 110;
const KT = NET_Y - KITCHEN_D; // 220 — 上廚房線
const KB = NET_Y + KITCHEN_D; // 440 — 下廚房線
const PA_Y = CB - 55;         // 577 — 玩家初始 Y
const PB_Y = CT + 55;         // 83  — AI 初始 Y

// ─── 遊戲數值 ─────────────────────────────────────────────────────────────────
const PLAYER_SPEED = 230;     // px/s
const AI_SPEED = 158;         // px/s
const BALL_SPEED_BASE = 255;  // px/s
const BALL_SPEED_MAX  = 370;
const SERVE_SPEED = 215;
const HIT_R = 52;             // 擊球範圍半徑
const PLAYER_R = 22;
const BALL_R = 11;
const H_START = 52;           // 擊球後初始高度
const H_DECAY = H_START / 0.38; // 高度衰減速率 px/s
const SWING_CD = 0.32;        // 擊球冷卻秒數

// ─── 顏色 ─────────────────────────────────────────────────────────────────────
const C = {
  bg: "#071628",
  court: "#1A4B22",
  kitchen: "rgba(21,101,192,0.32)",
  kitchenLine: "#42A5F5",
  kitchenWarn: "rgba(255,107,53,0.18)",
  line: "#ffffff",
  net: "#90A4AE",
  teamA: "#F59E0B",
  teamB: "#EF4444",
  server: "#00FF88",
  ball: "#F5F5DC",
  fault: "#FF1744",
  hitOK: "rgba(0,255,136,0.18)",
  hitBad: "rgba(255,107,53,0.22)",
};

// ─── 工具 ──────────────────────────────────────────────────────────────────────
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const hypot = (dx, dy) => Math.sqrt(dx * dx + dy * dy);
const rand  = (a, b) => a + Math.random() * (b - a);

// ─── Canvas 繪製 ───────────────────────────────────────────────────────────────
function drawCourt(ctx) {
  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = C.court;
  ctx.fillRect(CL, CT, CR - CL, CB - CT);

  // 廚房區塊
  ctx.fillStyle = C.kitchen;
  ctx.fillRect(CL, KT, CR - CL, KITCHEN_D);
  ctx.fillRect(CL, NET_Y, CR - CL, KITCHEN_D);

  // 外框
  ctx.strokeStyle = C.line; ctx.lineWidth = 2.5;
  ctx.strokeRect(CL, CT, CR - CL, CB - CT);

  // 中線
  ctx.beginPath(); ctx.moveTo(W / 2, CT); ctx.lineTo(W / 2, CB);
  ctx.lineWidth = 1.5; ctx.stroke();

  // 廚房線
  ctx.strokeStyle = C.kitchenLine; ctx.lineWidth = 2;
  [KT, KB].forEach(y => {
    ctx.beginPath(); ctx.moveTo(CL, y); ctx.lineTo(CR, y); ctx.stroke();
  });

  // 區域文字
  ctx.textAlign = "center";
  ctx.fillStyle = "rgba(66,165,245,0.55)";
  ctx.font = "bold 8.5px monospace";
  ctx.fillText("Non-Volley Zone (廚房)", W / 2, KT + KITCHEN_D / 2 + 4);
  ctx.fillText("Non-Volley Zone (廚房)", W / 2, NET_Y + KITCHEN_D / 2 + 4);
  ctx.fillStyle = "rgba(255,255,255,0.15)";
  ctx.font = "bold 8px monospace";
  ctx.fillText("截擊區 Volley Zone", W / 2, CT + (KT - CT) / 2 + 4);
  ctx.fillText("截擊區 Volley Zone", W / 2, KB + (CB - KB) / 2 + 4);

  // 球網
  ctx.strokeStyle = C.net; ctx.lineWidth = 5;
  ctx.beginPath(); ctx.moveTo(CL, NET_Y); ctx.lineTo(CR, NET_Y); ctx.stroke();
  // 球網柱
  ctx.fillStyle = "#607D8B";
  [[CL - 5, NET_Y - 11], [CR - 5, NET_Y - 11]].forEach(([x, y]) =>
    ctx.fillRect(x, y, 10, 22));
  // 球網紋
  ctx.strokeStyle = "rgba(144,164,174,0.3)"; ctx.lineWidth = 0.7;
  for (let i = 0; i <= 22; i++) {
    const x = CL + ((CR - CL) / 22) * i;
    ctx.beginPath(); ctx.moveTo(x, NET_Y - 5); ctx.lineTo(x, NET_Y + 5); ctx.stroke();
  }
}

function drawPlayer(ctx, x, y, color, label, isServer, showHitZone, hitZoneOK, pT) {
  if (showHitZone) {
    ctx.beginPath(); ctx.arc(x, y, HIT_R, 0, Math.PI * 2);
    ctx.fillStyle = hitZoneOK ? C.hitOK : C.hitBad;
    ctx.fill();
    ctx.strokeStyle = hitZoneOK ? "rgba(0,255,136,0.6)" : "rgba(255,107,53,0.6)";
    ctx.lineWidth = 1.5; ctx.stroke();
  }
  if (isServer) {
    const a = 0.5 + 0.5 * Math.sin(pT * 2.2);
    ctx.beginPath(); ctx.arc(x, y, PLAYER_R + 8, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(0,255,136,${a * 0.85})`; ctx.lineWidth = 2.5; ctx.stroke();
  }
  // 陰影
  ctx.beginPath(); ctx.arc(x + 3, y + 3, PLAYER_R, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(0,0,0,0.28)"; ctx.fill();
  // 主圓
  ctx.beginPath(); ctx.arc(x, y, PLAYER_R, 0, Math.PI * 2);
  ctx.fillStyle = color; ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.5)"; ctx.lineWidth = 2; ctx.stroke();
  // 文字
  ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.fillStyle = "#fff"; ctx.font = "bold 10px sans-serif";
  ctx.fillText(label, x, y);
  ctx.textBaseline = "alphabetic";
}

function drawBall(ctx, x, y, height) {
  const drawY = y - height * 0.38;
  const r = BALL_R + height * 0.07;
  const sR = Math.max(3, BALL_R - height * 0.05);
  // 影子
  ctx.beginPath(); ctx.arc(x, y, sR, 0, Math.PI * 2);
  ctx.fillStyle = `rgba(0,0,0,${clamp(0.5 - height / 200, 0.1, 0.5)})`; ctx.fill();
  // 球
  const grd = ctx.createRadialGradient(x - 2, drawY - 2, 1, x, drawY, r);
  grd.addColorStop(0, "#ffffff"); grd.addColorStop(1, C.ball);
  ctx.beginPath(); ctx.arc(x, drawY, r, 0, Math.PI * 2);
  ctx.fillStyle = grd; ctx.fill();
  ctx.strokeStyle = "rgba(0,0,0,0.2)"; ctx.lineWidth = 1; ctx.stroke();
}

function drawTrail(ctx, trail) {
  trail.forEach((p, i) => {
    const a = (i / trail.length) * 0.28;
    const r = BALL_R * 0.5 * (i / trail.length);
    ctx.beginPath();
    ctx.arc(p.x, p.y - p.h * 0.38, r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(245,245,220,${a})`; ctx.fill();
  });
}

function drawKitchenWarning(ctx, show) {
  if (!show) return;
  ctx.fillStyle = C.kitchenWarn;
  ctx.fillRect(CL, NET_Y, CR - CL, KITCHEN_D);
  ctx.strokeStyle = "rgba(255,107,53,0.75)"; ctx.lineWidth = 2;
  ctx.setLineDash([5, 4]);
  ctx.strokeRect(CL, NET_Y, CR - CL, KITCHEN_D);
  ctx.setLineDash([]);
  ctx.textAlign = "center"; ctx.fillStyle = "rgba(255,107,53,0.95)";
  ctx.font = "bold 9.5px sans-serif";
  ctx.fillText("⚠ 廚房！等球落地再擊", W / 2, NET_Y + KITCHEN_D / 2 + 4);
}

// ─── 主元件 ───────────────────────────────────────────────────────────────────
export default function PickleballGame({ onBack }) {
  const canvasRef = useRef(null);
  const gRef = useRef(null);
  const rafRef = useRef(null);
  const keysRef = useRef({});
  const spacePressRef = useRef(false);
  const ptRef = useRef(0);

  const [ui, setUi] = useState({
    phase: "intro",
    score: "0-0-2",
    aScore: 0, bScore: 0,
    msg: "", msgColor: "#fff",
    servingTeam: "A",
    winner: null,
    countdown: 0,
    pointWinner: null,
    showServePrompt: false,
  });

  const resumeTimerRef = useRef(null);

  const setMsg = useCallback((msg, color = "#fff") =>
    setUi(p => ({ ...p, msg, msgColor: color })), []);

  // 清除等待計時器
  const clearResumeTimer = useCallback(() => {
    if (resumeTimerRef.current) {
      clearTimeout(resumeTimerRef.current);
      resumeTimerRef.current = null;
    }
  }, []);

  // 開始下一回合（發球）
  const startNextRound = useCallback((scoring) => {
    const g = gRef.current;
    if (!g) return;
    clearResumeTimer();

    const isAServ = scoring.servingTeam === "A";
    g.phase = isAServ ? "serve_player" : "serve_ai";
    g.ball = { x: W / 2, y: isAServ ? PA_Y : PB_Y, vx: 0, vy: 0, height: 0 };
    g.player = { x: W / 2, y: PA_Y, vx: 0, vy: 0 };
    g.ai = { x: W / 2, y: PB_Y, errX: 0, errTimer: 0 };
    g.trail = [];
    g.swingCD = 0;
    g.aiSwingCD = 0;
    g.locked = false;
    g.scoringDone = false;

    setUi(p => ({
      ...p,
      phase: "playing",
      countdown: 0,
      pointWinner: null,
      msg: isAServ ? "按 Space 發球！" : "AI 發球中...",
      msgColor: isAServ ? C.server : C.teamB,
      showServePrompt: isAServ,
    }));

    if (!isAServ) {
      resumeTimerRef.current = setTimeout(() => {
        const gg = gRef.current;
        if (!gg || gg.phase !== "serve_ai") return;
        const tx = rand(CL + 30, CR - 30);
        const ty = rand(KB + 20, CB - 30);
        const dx = tx - W / 2, dy = ty - PB_Y, d = hypot(dx, dy);
        gg.ball = { x: W / 2, y: PB_Y, vx: (dx / d) * SERVE_SPEED, vy: (dy / d) * SERVE_SPEED, height: H_START };
        gg.phase = "playing";
        setMsg("");
      }, 700);
    }
  }, [clearResumeTimer, setMsg]);

  // ── 初始化 ────────────────────────────────────────────────────────────────
  const initGame = useCallback(() => {
    const scoring = initialGameState();
    gRef.current = {
      phase: "serve_player",
      scoring,
      ball: { x: W / 2, y: PA_Y, vx: 0, vy: 0, height: 0 },
      player: { x: W / 2, y: PA_Y, vx: 0, vy: 0 },
      ai: { x: W / 2, y: PB_Y, errX: 0, errTimer: 0 },
      trail: [],
      swingCD: 0, aiSwingCD: 0,
      locked: false,
      scoringDone: false,
    };
    clearResumeTimer();
    setUi({
      phase: "playing",
      score: announceScore(scoring),
      aScore: 0, bScore: 0,
      msg: "按 Space 發球！",
      msgColor: C.server,
      servingTeam: "A",
      winner: null,
      countdown: 0,
      pointWinner: null,
      showServePrompt: true,
    });
  }, [clearResumeTimer]);

  // ── 得分處理 ──────────────────────────────────────────────────────────────
  const scorePoint = useCallback((wonBy) => {
    const g = gRef.current;
    if (!g || g.scoringDone) return; // 防止重複計分
    g.scoringDone = true;
    g.locked = true;
    g.phase = "scored";
    g.ball = { ...g.ball, vx: 0, vy: 0, height: 0 };

    const next = applyRally(g.scoring, wonBy);
    g.scoring = next;
    const score = announceScore(next);
    const isGameOver = !!next.winner;

    setUi(p => ({
      ...p,
      phase: isGameOver ? "gameover" : "scored",
      score,
      aScore: next.teamA.pts,
      bScore: next.teamB.pts,
      msg: wonBy === "A" ? "A 隊得分！" : "B 隊（AI）得分！",
      msgColor: wonBy === "A" ? C.teamA : C.teamB,
      servingTeam: next.servingTeam,
      winner: next.winner || null,
      pointWinner: wonBy,
      countdown: isGameOver ? 0 : 3,
    }));

    if (isGameOver) return;

    // 3 秒倒數後自動開始下一回合（可按 Space 跳過）
    let count = 3;
    const tickCountdown = () => {
      count -= 1;
      if (count <= 0) {
        startNextRound(next);
        return;
      }
      setUi(p => ({ ...p, countdown: count, msg: `按 Space 繼續（${count}）` }));
      resumeTimerRef.current = setTimeout(tickCountdown, 1000);
    };
    resumeTimerRef.current = setTimeout(tickCountdown, 1000);
  }, [startNextRound]);

  // ── 主遊戲循環 ────────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let lastT = performance.now();

    const tick = (now) => {
      rafRef.current = requestAnimationFrame(tick);
      const dt = clamp((now - lastT) / 1000, 0, 0.05);
      lastT = now;
      ptRef.current += dt * 3;

      const g = gRef.current;
      const keys = keysRef.current;

      // ── 玩家移動 ──
      if (g && !g.locked) {
        const mvX = ((keys["ArrowRight"] || keys["d"] || keys["D"]) ? 1 : 0)
                  - ((keys["ArrowLeft"]  || keys["a"] || keys["A"]) ? 1 : 0);
        const mvY = ((keys["ArrowDown"]  || keys["s"] || keys["S"]) ? 1 : 0)
                  - ((keys["ArrowUp"]    || keys["w"] || keys["W"]) ? 1 : 0);
        const len = hypot(mvX, mvY) || 1;
        g.player.vx = (mvX / len) * PLAYER_SPEED;
        g.player.vy = (mvY / len) * PLAYER_SPEED;
        if (mvX !== 0 || mvY !== 0) {
          g.player.x += g.player.vx * dt;
          g.player.y += g.player.vy * dt;
        } else { g.player.vx = 0; g.player.vy = 0; }
        // 限制在下半場
        g.player.x = clamp(g.player.x, CL + PLAYER_R, CR - PLAYER_R);
        g.player.y = clamp(g.player.y, NET_Y + PLAYER_R + 2, CB - PLAYER_R);
      }

      // ── Space / Enter 按下 ──
      if (g && spacePressRef.current) {
        spacePressRef.current = false;

        // 得分後按 Space 跳過等待
        if (g.phase === "scored" && g.scoring) {
          clearResumeTimer();
          startNextRound(g.scoring);
        } else if (g.phase === "serve_player") {
          // 發球
          const tx = rand(CL + 30, CR - 30), ty = rand(CT + 20, KT - 20);
          const dx = tx - g.player.x, dy = ty - g.player.y, d = hypot(dx, dy);
          g.ball = { x: g.player.x, y: g.player.y, vx: (dx / d) * SERVE_SPEED, vy: (dy / d) * SERVE_SPEED, height: H_START };
          g.phase = "playing";
          setUi(p => ({ ...p, showServePrompt: false, msg: "" }));
        } else if (g.phase === "playing" && g.swingCD <= 0 && !g.locked) {
          // 嘗試回擊
          const dist = hypot(g.ball.x - g.player.x, g.ball.y - g.player.y);
          if (dist <= HIT_R && g.ball.vy > 0) {
            const inKitchen = g.player.y < KB && g.player.y > NET_Y;
            if (inKitchen && g.ball.height > 6) {
              // 廚房截擊犯規
              g.phase = "fault";
              g.ball = { ...g.ball, vx: 0, vy: 0, height: 0 };
              setMsg("廚房截擊犯規！❌", C.fault);
              setTimeout(() => scorePoint("B"), 1200);
            } else {
              // 合法回擊
              const relX = clamp((g.ball.x - g.player.x) / (HIT_R * 0.85), -1, 1);
              const mv = g.player.vx / PLAYER_SPEED * 0.28;
              const angle = (relX + mv) * (Math.PI / 3.2);
              const spd = clamp(BALL_SPEED_BASE + g.scoring.teamA.pts * 4, BALL_SPEED_BASE, BALL_SPEED_MAX);
              g.ball.vx = Math.sin(angle) * spd;
              g.ball.vy = -Math.abs(Math.cos(angle) * spd);
              g.ball.height = H_START;
              g.swingCD = SWING_CD;
            }
          }
        }
      }

      // ── 球物理 ──
      if (g && g.phase === "playing" && (g.ball.vx || g.ball.vy)) {
        g.ball.x += g.ball.vx * dt;
        g.ball.y += g.ball.vy * dt;
        g.ball.height = Math.max(0, g.ball.height - H_DECAY * dt);
        g.swingCD = Math.max(0, g.swingCD - dt);

        // 球跡
        g.trail.push({ x: g.ball.x, y: g.ball.y, h: g.ball.height });
        if (g.trail.length > 9) g.trail.shift();

        // 側牆彈跳
        if (g.ball.x < CL + BALL_R) { g.ball.x = CL + BALL_R; g.ball.vx = Math.abs(g.ball.vx); }
        if (g.ball.x > CR - BALL_R) { g.ball.x = CR - BALL_R; g.ball.vx = -Math.abs(g.ball.vx); }

        // 球出界（上下底線）
        if (g.ball.y < CT - 25 && !g.scoringDone) {
          g.ball = { ...g.ball, vx: 0, vy: 0, height: 0 };
          scorePoint("A");
        } else if (g.ball.y > CB + 25 && !g.scoringDone) {
          g.ball = { ...g.ball, vx: 0, vy: 0, height: 0 };
          scorePoint("B");
        }

        // ── AI 行為 ──
        if (g.ball.vy < 0 && g.ball.y < NET_Y) {
          // 球在 AI 半場
          g.ai.errTimer = (g.ai.errTimer || 0) - dt;
          if (g.ai.errTimer <= 0) {
            g.ai.errX = rand(-38, 38);
            g.ai.errTimer = rand(0.35, 0.85);
          }
          const tx = clamp(g.ball.x + g.ai.errX, CL + PLAYER_R, CR - PLAYER_R);
          const step = Math.sign(tx - g.ai.x) * Math.min(Math.abs(tx - g.ai.x), AI_SPEED * dt);
          g.ai.x = clamp(g.ai.x + step, CL + PLAYER_R, CR - PLAYER_R);

          g.aiSwingCD = Math.max(0, (g.aiSwingCD || 0) - dt);
          if (g.aiSwingCD <= 0) {
            const dist = hypot(g.ball.x - g.ai.x, g.ball.y - g.ai.y);
            if (dist <= HIT_R) {
              const relX = clamp((g.ball.x - g.ai.x) / (HIT_R * 0.85), -1, 1);
              const angle = relX * (Math.PI / 3.5);
              const spd = clamp(BALL_SPEED_BASE + g.scoring.teamB.pts * 4, BALL_SPEED_BASE, BALL_SPEED_MAX);
              g.ball.vx = Math.sin(angle) * spd;
              g.ball.vy = Math.abs(Math.cos(angle) * spd); // 往下打
              g.ball.height = H_START;
              g.aiSwingCD = SWING_CD;
            }
          }
        }
      }

      // ── 繪製 ──
      drawCourt(ctx);

      if (g) {
        const inKitchen = g.player.y < KB && g.player.y > NET_Y;
        const ballComing = g.ball.vy > 0;
        const ballNear = hypot(g.ball.x - g.player.x, g.ball.y - g.player.y) < HIT_R * 1.4;
        const kitchenWarn = inKitchen && ballComing && g.ball.height > 6 && g.phase === "playing";

        drawKitchenWarning(ctx, kitchenWarn);
        drawTrail(ctx, g.trail);
        drawBall(ctx, g.ball.x, g.ball.y, g.ball.height);
        drawPlayer(ctx, g.player.x, g.player.y, C.teamA, "A  你",
          g.scoring.servingTeam === "A", ballNear && ballComing, !inKitchen || g.ball.height <= 6, ptRef.current);
        drawPlayer(ctx, g.ai.x, g.ai.y, C.teamB, "B  AI",
          g.scoring.servingTeam === "B", false, true, ptRef.current);

        // 發球提示閃爍
        if (g.phase === "serve_player") {
          const a = 0.5 + 0.5 * Math.sin(ptRef.current * 2);
          ctx.fillStyle = `rgba(0,255,136,${a * 0.12})`;
          ctx.fillRect(CL, KB, CR - CL, CB - KB);
          ctx.strokeStyle = `rgba(0,255,136,${a * 0.55})`; ctx.lineWidth = 2;
          ctx.setLineDash([5, 4]); ctx.strokeRect(CL, KB, CR - CL, CB - KB); ctx.setLineDash([]);
        }
      }
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [scorePoint, setMsg, startNextRound, clearResumeTimer]);

  // ── 鍵盤事件 ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const dn = (e) => {
      keysRef.current[e.key] = true;
      if ((e.key === " " || e.key === "Enter") && e.target.tagName !== "BUTTON") {
        e.preventDefault();
        spacePressRef.current = true;
      }
    };
    const up = (e) => { keysRef.current[e.key] = false; };
    window.addEventListener("keydown", dn);
    window.addEventListener("keyup", up);
    return () => { window.removeEventListener("keydown", dn); window.removeEventListener("keyup", up); };
  }, []);

  // ── 觸控（虛擬搖桿） ──────────────────────────────────────────────────────
  const touchRef = useRef({ x: 0, y: 0, id: null });
  const onTouchStart = useCallback((e) => {
    e.preventDefault();
    const t = e.changedTouches[0];
    touchRef.current = { x: t.clientX, y: t.clientY, id: t.identifier };
  }, []);
  const onTouchMove = useCallback((e) => {
    e.preventDefault();
    const t = Array.from(e.touches).find(t => t.identifier === touchRef.current.id);
    if (!t) return;
    const dx = t.clientX - touchRef.current.x;
    const dy = t.clientY - touchRef.current.y;
    const th = 9;
    keysRef.current["ArrowLeft"]  = dx < -th;
    keysRef.current["ArrowRight"] = dx > th;
    keysRef.current["ArrowUp"]    = dy < -th;
    keysRef.current["ArrowDown"]  = dy > th;
  }, []);
  const onTouchEnd = useCallback((e) => {
    e.preventDefault();
    ["ArrowLeft","ArrowRight","ArrowUp","ArrowDown"].forEach(k => keysRef.current[k] = false);
    spacePressRef.current = true;
  }, []);

  const isPlaying = ui.phase === "playing" || ui.phase === "scored" || ui.phase === "serve_player";

  return (
    <div className="relative w-full flex flex-col bg-[#071628]" style={{ maxWidth: 420, margin: "0 auto", minHeight: "100svh" }}>

      {/* ── 計分板 ── */}
      {ui.phase !== "intro" && (
        <div className="flex items-center justify-between px-4 pt-3 pb-2 gap-2">
          <button onClick={onBack} className="text-white/30 hover:text-white text-xl transition-colors w-6">←</button>
          <div className="flex-1 flex items-center justify-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full transition-all ${ui.servingTeam === 'A' ? 'bg-yellow-500 text-black' : 'bg-yellow-500/15 text-yellow-400'}`}>
                {ui.servingTeam === 'A' ? '★' : ''} A
              </span>
              <motion.span key={ui.aScore} initial={{ scale: 1.6, color: "#00FF88" }} animate={{ scale: 1, color: "#fff" }}
                className="text-3xl font-black tabular-nums">{ui.aScore}</motion.span>
            </div>
            <div className="text-center">
              <motion.div key={ui.score} initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                className="text-xl font-black tracking-widest"
                style={{ color: ui.servingTeam === "A" ? C.teamA : C.teamB }}>
                {ui.score}
              </motion.div>
              <div className="text-white/30 text-[9px]">發-接-序</div>
            </div>
            <div className="flex items-center gap-1.5">
              <motion.span key={ui.bScore} initial={{ scale: 1.6, color: "#00FF88" }} animate={{ scale: 1, color: "#fff" }}
                className="text-3xl font-black tabular-nums">{ui.bScore}</motion.span>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full transition-all ${ui.servingTeam === 'B' ? 'bg-red-500 text-white' : 'bg-red-500/15 text-red-400'}`}>
                {ui.servingTeam === 'B' ? '★' : ''} B
              </span>
            </div>
          </div>
          <div className="w-6" />
        </div>
      )}

      {/* ── Canvas ── */}
      <div className="relative w-full flex-1">
        <canvas
          ref={canvasRef}
          width={W} height={H}
          className="w-full block"
          style={{ touchAction: "none" }}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        />

        {/* 訊息橫幅（遊戲進行中） */}
        <AnimatePresence>
          {ui.msg && ui.phase === "playing" && (
            <motion.div key={ui.msg}
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="absolute bottom-28 left-4 right-4 flex justify-center pointer-events-none">
              <div className="text-sm font-bold text-center px-5 py-3 rounded-2xl backdrop-blur-sm whitespace-pre-line leading-snug"
                style={{ background: "rgba(7,22,40,0.9)", border: `1.5px solid ${ui.msgColor}40`, color: ui.msgColor, maxWidth: 300 }}>
                {ui.msg}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 得分後全屏提示 */}
        <AnimatePresence>
          {ui.phase === "scored" && (
            <motion.div
              key="scored-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex flex-col items-center justify-center bg-black/55 backdrop-blur-[2px] pointer-events-none"
            >
              <motion.div
                initial={{ scale: 0.7, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-center px-6"
              >
                <div className="text-4xl font-black mb-2" style={{ color: ui.msgColor }}>
                  {ui.msg}
                </div>
                <div className="text-white/80 text-lg font-bold mb-1">
                  比分 {ui.score}
                </div>
                {ui.countdown > 0 ? (
                  <>
                    <div className="text-5xl font-black text-[#00FF88] my-3 tabular-nums">
                      {ui.countdown}
                    </div>
                    <div className="text-white/60 text-sm">
                      按 <kbd className="px-2 py-0.5 bg-white/15 rounded font-mono text-white">Space</kbd> 立即繼續
                    </div>
                  </>
                ) : (
                  <div className="text-white/60 text-sm mt-2">準備中...</div>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 發球提示 */}
        <AnimatePresence>
          {ui.showServePrompt && ui.phase === "playing" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="absolute bottom-24 left-0 right-0 flex justify-center pointer-events-none"
            >
              <div className="px-6 py-3 rounded-2xl font-bold text-base animate-pulse"
                style={{ background: "rgba(0,255,136,0.15)", border: "2px solid #00FF88", color: "#00FF88" }}>
                按 Space 發球！
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── 開始畫面 ── */}
        <AnimatePresence>
          {ui.phase === "intro" && (
            <motion.div className="absolute inset-0 flex flex-col items-center justify-center bg-[#071628]"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="text-6xl mb-4">🏓</div>
              <h1 className="text-2xl font-black text-white mb-1 tracking-tight">匹克球即時對戰</h1>
              <p className="text-white/50 text-sm text-center px-6 mb-6 leading-relaxed max-w-xs">
                鍵盤 WASD / 方向鍵移動，<br />
                Space / Enter 擊球。<br />
                <span style={{ color: C.kitchenLine }}>廚房區</span>的球必須先落地才能擊！
              </p>

              {/* 鍵盤圖示 */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-5 mx-6 mb-6 w-full max-w-xs">
                <div className="flex justify-center gap-1 flex-col items-center mb-3">
                  <div className="flex gap-1">
                    {["W / ↑"].map(k => <kbd key={k} className="px-3 py-1.5 bg-white/10 rounded-lg text-white text-xs font-mono">{k}</kbd>)}
                  </div>
                  <div className="flex gap-1">
                    {["A / ←", "S / ↓", "D / →"].map(k => <kbd key={k} className="px-2 py-1.5 bg-white/10 rounded-lg text-white text-xs font-mono">{k}</kbd>)}
                  </div>
                  <div className="mt-2">
                    <kbd className="px-6 py-1.5 bg-[#1e88e5]/60 rounded-lg text-white text-xs font-mono">Space / Enter — 擊球</kbd>
                  </div>
                </div>
                <div className="border-t border-white/10 pt-3 space-y-1.5">
                  {[
                    [C.kitchenLine, "藍色廚房區（NVZ）", "必須讓球落地後才能擊"],
                    ["#4CAF50", "截擊區", "可直接截擊"],
                    [C.server, "★ 閃爍光環", "目前發球隊"],
                  ].map(([c, k, v]) => (
                    <div key={k} className="flex gap-2 text-xs items-start">
                      <div className="w-2 h-2 rounded-full mt-0.5 flex-shrink-0" style={{ background: c }} />
                      <span className="text-white/70 font-medium">{k}</span>
                      <span className="text-white/40">— {v}</span>
                    </div>
                  ))}
                </div>
              </div>

              <motion.button whileTap={{ scale: 0.95 }} onClick={initGame}
                className="py-4 px-10 rounded-2xl text-white font-bold text-lg"
                style={{ background: "linear-gradient(135deg,#1e88e5,#0d47a1)" }}>
                開始遊戲
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── 遊戲結束 ── */}
        <AnimatePresence>
          {ui.phase === "gameover" && (
            <motion.div className="absolute inset-0 flex flex-col items-center justify-center bg-black/75 backdrop-blur-sm"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="bg-[#071628] border border-white/10 rounded-3xl p-8 text-center mx-6 max-w-xs">
                <div className="text-5xl mb-3">{ui.winner === "A" ? "🏆" : "😓"}</div>
                <h2 className="text-2xl font-black text-white mb-1">
                  {ui.winner === "A" ? "你贏了！" : "AI 獲勝"}
                </h2>
                <p className="text-white/50 text-sm mb-2">最終比分 {ui.aScore} – {ui.bScore}</p>
                <p className="text-white/30 text-xs mb-6 whitespace-pre-line leading-relaxed">{ui.msg}</p>
                <motion.button whileTap={{ scale: 0.96 }} onClick={initGame}
                  className="w-full py-3 rounded-2xl text-white font-bold"
                  style={{ background: "linear-gradient(135deg,#1e88e5,#0d47a1)" }}>
                  再玩一局
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── 鍵盤提示（遊戲中） ── */}
      {ui.phase !== "intro" && ui.phase !== "gameover" && (
        <div className="px-4 py-2 flex items-center justify-center gap-4 flex-wrap">
          {[["WASD / ↑↓←→", "移動"], ["Space / Enter", "擊球"]].map(([k, v]) => (
            <div key={k} className="flex items-center gap-1.5">
              <kbd className="text-[10px] px-1.5 py-0.5 bg-white/10 rounded text-white/60 font-mono">{k}</kbd>
              <span className="text-white/30 text-[10px]">{v}</span>
            </div>
          ))}
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ background: C.kitchenLine }} />
            <span className="text-white/30 text-[10px]">廚房：等落地</span>
          </div>
        </div>
      )}
    </div>
  );
}
