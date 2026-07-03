"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { initialGameState, applyRally, announceScore } from "../../lib/pickleballScoring";

// ── 球場尺寸 ─────────────────────────────────────────────────────────────
const W = 400, H = 660;
const NET_Y = H / 2;
const MX = 44, MY = 28;
const CL = MX, CR = W - MX, CT = MY, CB = H - MY;
const KITCHEN_D = 110;
const KT = NET_Y - KITCHEN_D;   // 220 上廚房線
const KB = NET_Y + KITCHEN_D;   // 440 下廚房線
const PA_Y = CB - 62;            // 570 玩家側基線
const PB_Y = CT + 62;            // 90  AI 側基線

// ── 物理常數 ─────────────────────────────────────────────────────────────
const PLAYER_SPEED   = 235;
const PARTNER_SPEED  = 192;
const AI_SPD_NORMAL  = 168;
const AI_SPD_TIRED   = 108;
const BALL_SPEED_BASE = 258;
const BALL_SPEED_MAX  = 448;
const SERVE_SPEED    = 218;
const HIT_R    = 52;
const PLAYER_R = 20;
const BALL_R   = 11;
const H_START  = 54;
const H_DECAY  = H_START / 1.65;     // ≈33 px/s — 球弧足夠飛到對方球場才落地
const BOUNCE_H_KEEP  = 0.72;          // 彈跳保留高度比例（較高讓對打有時間）
const BOUNCE_SPD_KEEP = 0.86;         // 彈跳後速度保留比例
const SWING_CD = 0.30;
const CHARGE_FULL_SEC  = 0.75;        // 集氣滿的秒數
const CHARGE_BONUS_SPD = 175;         // 滿氣額外速度
const RALLY_TIRED  = 9;               // 幾次後 AI 疲勞
const AI_DISTRACT  = 0.22;           // AI 分心機率

// ── 顏色 ─────────────────────────────────────────────────────────────────
const C = {
  bg: "#071628", court: "#1A4B22",
  kitchen: "rgba(21,101,192,0.32)", kitchenLine: "#42A5F5",
  kitchenWarn: "rgba(255,107,53,0.18)",
  line: "#fff", net: "#90A4AE",
  p1: "#F59E0B", p2: "#FCD34D",
  ai1: "#EF4444", ai2: "#FCA5A5",
  server: "#00FF88",
  ball: "#F5F5DC", fault: "#FF1744",
  hitOK: "rgba(0,255,136,0.18)", hitBad: "rgba(255,107,53,0.22)",
};

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const hypot  = (dx, dy) => Math.sqrt(dx * dx + dy * dy);
const rand   = (a, b)   => a + Math.random() * (b - a);

// 左/右 發球區 X 座標（依 'left'|'right' 換算）
const SVC_X_LEFT  = CL + (CR - CL) * 0.27;  // ≈ 122
const SVC_X_RIGHT = CL + (CR - CL) * 0.73;  // ≈ 278
const posToX = (side) => side === 'left' ? SVC_X_LEFT : SVC_X_RIGHT;

// 從 scoring.positions 取出四個人的起始 X
function getStartX(scoring) {
  const p = scoring.positions || { A1:'right', A2:'left', B1:'left', B2:'right' };
  return {
    p1x: posToX(p.A1),   // 玩家 (A1)
    p2x: posToX(p.A2),   // 隊友 (A2)
    a1x: posToX(p.B1),   // AI1 (B1)
    a2x: posToX(p.B2),   // AI2 (B2)
  };
}

// ── 繪製：球場 ────────────────────────────────────────────────────────────
function drawCourt(ctx) {
  ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = C.court; ctx.fillRect(CL, CT, CR - CL, CB - CT);
  ctx.fillStyle = C.kitchen;
  ctx.fillRect(CL, KT, CR - CL, KITCHEN_D);
  ctx.fillRect(CL, NET_Y, CR - CL, KITCHEN_D);
  ctx.strokeStyle = C.line; ctx.lineWidth = 2.5;
  ctx.strokeRect(CL, CT, CR - CL, CB - CT);
  ctx.beginPath(); ctx.moveTo(W / 2, CT); ctx.lineTo(W / 2, CB);
  ctx.lineWidth = 1.5; ctx.stroke();
  ctx.strokeStyle = C.kitchenLine; ctx.lineWidth = 2;
  [KT, KB].forEach(y => {
    ctx.beginPath(); ctx.moveTo(CL, y); ctx.lineTo(CR, y); ctx.stroke();
  });
  ctx.textAlign = "center";
  ctx.fillStyle = "rgba(66,165,245,0.55)"; ctx.font = "bold 8px monospace";
  ctx.fillText("Non-Volley Zone 廚房", W / 2, KT + KITCHEN_D / 2 + 4);
  ctx.fillText("Non-Volley Zone 廚房", W / 2, NET_Y + KITCHEN_D / 2 + 4);
  ctx.fillStyle = "rgba(255,255,255,0.15)"; ctx.font = "bold 7.5px monospace";
  ctx.fillText("截擊區 Volley Zone", W / 2, CT + (KT - CT) / 2 + 4);
  ctx.fillText("截擊區 Volley Zone", W / 2, KB + (CB - KB) / 2 + 4);
  ctx.strokeStyle = C.net; ctx.lineWidth = 5;
  ctx.beginPath(); ctx.moveTo(CL, NET_Y); ctx.lineTo(CR, NET_Y); ctx.stroke();
  ctx.fillStyle = "#607D8B";
  [[CL - 5, NET_Y - 11], [CR - 5, NET_Y - 11]].forEach(([x, y]) => ctx.fillRect(x, y, 10, 22));
  ctx.strokeStyle = "rgba(144,164,174,0.3)"; ctx.lineWidth = 0.7;
  for (let i = 0; i <= 22; i++) {
    const x = CL + ((CR - CL) / 22) * i;
    ctx.beginPath(); ctx.moveTo(x, NET_Y - 5); ctx.lineTo(x, NET_Y + 5); ctx.stroke();
  }
}

// ── 繪製：玩家圓形（含集氣環） ───────────────────────────────────────────
function drawPlayer(ctx, x, y, color, label, isServer, showHit, hitOK, pt, charge) {
  if (showHit) {
    ctx.beginPath(); ctx.arc(x, y, HIT_R, 0, Math.PI * 2);
    ctx.fillStyle = hitOK ? C.hitOK : C.hitBad; ctx.fill();
    ctx.strokeStyle = hitOK ? "rgba(0,255,136,0.6)" : "rgba(255,107,53,0.6)";
    ctx.lineWidth = 1.5; ctx.stroke();
  }
  if (charge > 0) {
    const rr = PLAYER_R + 9;
    ctx.beginPath(); ctx.arc(x, y, rr, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(255,255,255,0.08)"; ctx.lineWidth = 4; ctx.stroke();
    const col = charge >= 1
      ? `rgba(255,30,30,${0.7 + 0.3 * Math.sin(pt * 8)})`
      : charge > 0.5 ? "rgba(255,165,0,0.9)" : "rgba(0,255,136,0.85)";
    ctx.beginPath();
    ctx.arc(x, y, rr, -Math.PI / 2, -Math.PI / 2 + charge * Math.PI * 2);
    ctx.strokeStyle = col; ctx.lineWidth = 4; ctx.stroke();
  }
  if (isServer) {
    const a = 0.5 + 0.5 * Math.sin(pt * 2.2);
    ctx.beginPath(); ctx.arc(x, y, PLAYER_R + 8, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(0,255,136,${a * 0.85})`; ctx.lineWidth = 2.5; ctx.stroke();
  }
  ctx.beginPath(); ctx.arc(x + 3, y + 3, PLAYER_R, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(0,0,0,0.28)"; ctx.fill();
  ctx.beginPath(); ctx.arc(x, y, PLAYER_R, 0, Math.PI * 2);
  ctx.fillStyle = color; ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.5)"; ctx.lineWidth = 2; ctx.stroke();
  ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.fillStyle = "#fff"; ctx.font = "bold 9px sans-serif";
  ctx.fillText(label, x, y); ctx.textBaseline = "alphabetic";
}

// ── 繪製：集氣條 ─────────────────────────────────────────────────────────
function drawChargeBar(ctx, x, y, charge) {
  if (charge <= 0) return;
  const w = 44, h = 5;
  const bx = x - w / 2, by = y - PLAYER_R - 13;
  ctx.fillStyle = "rgba(0,0,0,0.55)"; ctx.fillRect(bx, by, w, h);
  ctx.fillStyle = charge >= 1 ? "#FF1744" : charge > 0.5 ? "#FFA500" : "#00FF88";
  ctx.fillRect(bx, by, w * charge, h);
  ctx.strokeStyle = "rgba(255,255,255,0.35)"; ctx.lineWidth = 0.8;
  ctx.strokeRect(bx, by, w, h);
}

// ── 繪製：球 + 影子 ──────────────────────────────────────────────────────
function drawBall(ctx, x, y, height) {
  const h0 = Math.max(0, height);
  const drawY = y - h0 * 0.38;
  const r  = BALL_R + h0 * 0.07;
  const sR = Math.max(3, BALL_R - h0 * 0.05);
  ctx.beginPath(); ctx.arc(x, y, sR, 0, Math.PI * 2);
  ctx.fillStyle = `rgba(0,0,0,${clamp(0.5 - h0 / 200, 0.1, 0.5)})`; ctx.fill();
  const grd = ctx.createRadialGradient(x - 2, drawY - 2, 1, x, drawY, r);
  grd.addColorStop(0, "#ffffff"); grd.addColorStop(1, C.ball);
  ctx.beginPath(); ctx.arc(x, drawY, r, 0, Math.PI * 2);
  ctx.fillStyle = grd; ctx.fill();
  ctx.strokeStyle = "rgba(0,0,0,0.2)"; ctx.lineWidth = 1; ctx.stroke();
}

// ── 繪製：球跡 ───────────────────────────────────────────────────────────
function drawTrail(ctx, trail) {
  trail.forEach((p, i) => {
    const a = (i / trail.length) * 0.28;
    const r = BALL_R * 0.5 * (i / trail.length);
    ctx.beginPath();
    ctx.arc(p.x, p.y - Math.max(0, p.h) * 0.38, r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(245,245,220,${a})`; ctx.fill();
  });
}

// ── 繪製：落地光環 ───────────────────────────────────────────────────────
function drawBounceFlashes(ctx, flashes) {
  flashes.forEach(f => {
    const ratio = f.t / f.maxT;
    const r = 6 + (1 - ratio) * 18;
    ctx.beginPath(); ctx.arc(f.x, f.y, r, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(255,255,160,${ratio * 0.85})`; ctx.lineWidth = 2.5; ctx.stroke();
    ctx.beginPath(); ctx.arc(f.x, f.y, 3, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255,255,170,${ratio * 0.55})`; ctx.fill();
  });
}

// ── 繪製：廚房警告 ───────────────────────────────────────────────────────
function drawKitchenWarning(ctx, show) {
  if (!show) return;
  ctx.fillStyle = C.kitchenWarn; ctx.fillRect(CL, NET_Y, CR - CL, KITCHEN_D);
  ctx.strokeStyle = "rgba(255,107,53,0.75)"; ctx.lineWidth = 2;
  ctx.setLineDash([5, 4]); ctx.strokeRect(CL, NET_Y, CR - CL, KITCHEN_D); ctx.setLineDash([]);
  ctx.textAlign = "center"; ctx.fillStyle = "rgba(255,107,53,0.95)";
  ctx.font = "bold 9px sans-serif";
  ctx.fillText("⚠ 廚房！等球落地再截擊", W / 2, NET_Y + KITCHEN_D / 2 + 4);
}

// ── 主元件 ────────────────────────────────────────────────────────────────
export default function PickleballGame({ onBack }) {
  const canvasRef       = useRef(null);
  const gRef            = useRef(null);
  const rafRef          = useRef(null);
  const keysRef         = useRef({});
  const spacePressRef   = useRef(false);   // 上升緣：剛按下
  const spaceHeldRef    = useRef(false);   // 持續按住
  const spaceReleaseRef = useRef(false);   // 剛放開
  const chargeRef       = useRef(0);       // 0-1 集氣量
  const chargeTimerRef  = useRef(0);       // 已集氣秒數
  const ptRef           = useRef(0);       // 動畫計時

  const [ui, setUi] = useState({
    phase: "intro", score: "0-0-2",
    aScore: 0, bScore: 0,
    msg: "", msgColor: "#fff",
    servingTeam: "A", winner: null,
    countdown: 0, pointWinner: null, showServePrompt: false,
  });

  const resumeTimerRef = useRef(null);
  const setMsg = useCallback((msg, color = "#fff") =>
    setUi(p => ({ ...p, msg, msgColor: color })), []);

  const clearResumeTimer = useCallback(() => {
    if (resumeTimerRef.current) { clearTimeout(resumeTimerRef.current); resumeTimerRef.current = null; }
  }, []);

  const freshBall = (x, y) => ({
    x, y, vx: 0, vy: 0, height: 0,
    bouncePhase: "flying",  // "flying" | "landed1" | "dead"
    hasLanded: false,
  });

  const freshAI = (x, y) => ({
    x, y,
    errX: 0, errTimer: 0,
    stateTimer: 0, focused: true,
    swingCD: 0,
  });

  // ── 開始下一回合 ──────────────────────────────────────────────────────
  const startNextRound = useCallback((scoring) => {
    clearResumeTimer();
    chargeRef.current = 0; chargeTimerRef.current = 0;
    spaceHeldRef.current = false;
    spacePressRef.current = false;
    spaceReleaseRef.current = false;

    const isAServ = scoring.servingTeam === "A";
    const srvNum  = scoring.serverNum;           // 1 或 2
    const { p1x, p2x, a1x, a2x } = getStartX(scoring);

    // 誰是發球員？A 隊：serverNum=1→P1，2→P2；B 隊：serverNum=1→AI1，2→AI2
    const serveX = isAServ
      ? (srvNum === 1 ? p1x : p2x)
      : (srvNum === 1 ? a1x : a2x);
    const serveY = isAServ ? PA_Y : PB_Y;

    // 服務訊息
    const serveMsg = isAServ
      ? (srvNum === 1 ? "你 (A1) 發球！按住 Space 集氣" : "隊友 (A2) 發球！按住 Space 集氣")
      : (srvNum === 1 ? "AI₁ 發球中..." : "AI₂ 發球中...");

    gRef.current = {
      phase: isAServ ? "serve_player" : "serve_ai",
      scoring,
      ball: { x: serveX, y: serveY, vx: 0, vy: 0, height: 0, bouncePhase: "flying", hasLanded: false },
      player:  { x: p1x, y: PA_Y },
      partner: { x: p2x, y: PA_Y, swingCD: 0 },
      ai1: freshAI(a1x, PB_Y),
      ai2: freshAI(a2x, PB_Y),
      trail: [], swingCD: 0,
      locked: false, scoringDone: false,
      rallyCount: 0, bounceFlashes: [],
    };

    setUi(p => ({
      ...p, phase: "playing", countdown: 0, pointWinner: null,
      msg: serveMsg,
      msgColor: isAServ ? C.server : C.ai1,
      showServePrompt: isAServ,
    }));

    if (!isAServ) {
      resumeTimerRef.current = setTimeout(() => {
        const gg = gRef.current;
        if (!gg || gg.phase !== "serve_ai") return;
        // AI 從發球員位置發球，對角線落點
        const tx = serveX > W / 2 ? rand(CL + 20, W / 2 - 20) : rand(W / 2 + 20, CR - 20);
        const ty = rand(KB + 20, CB - 30);
        const dx = tx - serveX, dy = ty - serveY, d = hypot(dx, dy);
        gg.ball = { x: serveX, y: serveY, vx: (dx / d) * SERVE_SPEED, vy: (dy / d) * SERVE_SPEED, height: H_START, bouncePhase: "flying", hasLanded: false };
        gg.phase = "playing";
        setMsg("");
      }, 700);
    }
  }, [clearResumeTimer, setMsg]);

  // ── 初始化 ────────────────────────────────────────────────────────────
  const initGame = useCallback(() => {
    const scoring = initialGameState();
    // 開局：A2 是先發球員（serverNum=2），A1 在右邊
    const { p1x, p2x, a1x, a2x } = getStartX(scoring);
    chargeRef.current = 0; chargeTimerRef.current = 0;
    spaceHeldRef.current = false;
    clearResumeTimer();
    gRef.current = {
      phase: "serve_player", scoring,
      // 開局 A2 發球 → 球在 A2 位置
      ball: { x: p2x, y: PA_Y, vx: 0, vy: 0, height: 0, bouncePhase: "flying", hasLanded: false },
      player:  { x: p1x, y: PA_Y },
      partner: { x: p2x, y: PA_Y, swingCD: 0 },
      ai1: freshAI(a1x, PB_Y),
      ai2: freshAI(a2x, PB_Y),
      trail: [], swingCD: 0,
      locked: false, scoringDone: false,
      rallyCount: 0, bounceFlashes: [],
    };
    setUi({
      phase: "playing", score: announceScore(scoring),
      aScore: 0, bScore: 0,
      msg: "隊友 (A2) 發球！按住 Space 集氣", msgColor: C.server,
      servingTeam: "A", winner: null,
      countdown: 0, pointWinner: null, showServePrompt: true,
    });
  }, [clearResumeTimer]);

  // ── 得分 ──────────────────────────────────────────────────────────────
  const scorePoint = useCallback((wonBy) => {
    const g = gRef.current; if (!g || g.scoringDone) return;
    g.scoringDone = true; g.locked = true; g.phase = "scored";
    g.ball = { ...g.ball, vx: 0, vy: 0, height: 0 };
    chargeRef.current = 0; spaceHeldRef.current = false;

    const next = applyRally(g.scoring, wonBy);
    g.scoring = next;
    const score = announceScore(next);
    const isGameOver = !!next.winner;

    setUi(p => ({
      ...p,
      phase: isGameOver ? "gameover" : "scored",
      score,
      aScore: next.teamA.pts, bScore: next.teamB.pts,
      msg: wonBy === "A" ? "🏆 A 隊得分！" : "😓 B 隊（AI）得分！",
      msgColor: wonBy === "A" ? C.p1 : C.ai1,
      servingTeam: next.servingTeam, winner: next.winner || null,
      pointWinner: wonBy, countdown: isGameOver ? 0 : 3,
    }));
    if (isGameOver) return;

    let count = 3;
    const tickCd = () => {
      count--;
      if (count <= 0) { startNextRound(next); return; }
      setUi(p => ({ ...p, countdown: count, msg: `按 Space 繼續（${count}）` }));
      resumeTimerRef.current = setTimeout(tickCd, 1000);
    };
    resumeTimerRef.current = setTimeout(tickCd, 1000);
  }, [startNextRound]);

  // ── 主遊戲循環 ───────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let lastT = performance.now();

    const tick = (now) => {
      rafRef.current = requestAnimationFrame(tick);
      const dt = clamp((now - lastT) / 1000, 0, 0.05);
      lastT = now;
      ptRef.current += dt * 3;
      const pt = ptRef.current;

      const g = gRef.current;
      if (!g) { drawCourt(ctx); return; }

      const keys = keysRef.current;
      const ball = g.ball;

      // ── Space 上升緣：發球 / 跳過得分等待 ─────────────────────────
      if (spacePressRef.current) {
        spacePressRef.current = false;
        if (g.phase === "scored") {
          clearResumeTimer(); startNextRound(g.scoring);
        } else if (g.phase === "serve_player") {
          const tx = rand(CL + 30, CR - 30), ty = rand(CT + 20, KT - 20);
          const dx = tx - g.player.x, dy = ty - g.player.y, d = hypot(dx, dy);
          g.ball = { x: g.player.x, y: g.player.y, vx: (dx / d) * SERVE_SPEED, vy: (dy / d) * SERVE_SPEED, height: H_START, bouncePhase: "flying", hasLanded: false };
          g.phase = "playing";
          setUi(p => ({ ...p, showServePrompt: false, msg: "" }));
        }
      }

      // ── 集氣（持續按住 Space 時累積） ────────────────────────────
      if (spaceHeldRef.current && g.phase === "playing" && !g.locked) {
        chargeTimerRef.current = Math.min(chargeTimerRef.current + dt, CHARGE_FULL_SEC);
        chargeRef.current = chargeTimerRef.current / CHARGE_FULL_SEC;
      }

      // ── Space 放開：嘗試擊球 ─────────────────────────────────────
      if (spaceReleaseRef.current) {
        spaceReleaseRef.current = false;
        if (g.phase === "playing" && g.swingCD <= 0 && !g.locked) {
          const dist = hypot(ball.x - g.player.x, ball.y - g.player.y);
          if (dist <= HIT_R && ball.vy > 0) {
            const inKitchen = g.player.y > NET_Y && g.player.y < KB;
            if (inKitchen && !ball.hasLanded) {
              g.phase = "fault";
              g.ball = { ...ball, vx: 0, vy: 0, height: 0 };
              setMsg("廚房截擊犯規！❌", C.fault);
              setTimeout(() => scorePoint("B"), 1200);
            } else {
              const charge = chargeRef.current;
              const relX = clamp((ball.x - g.player.x) / (HIT_R * 0.85), -1, 1);
              const angle = relX * (Math.PI / 3.2);
              const spd = clamp(BALL_SPEED_BASE + charge * CHARGE_BONUS_SPD + g.scoring.teamA.pts * 4, BALL_SPEED_BASE, BALL_SPEED_MAX);
              g.ball.vx = Math.sin(angle) * spd;
              g.ball.vy = -Math.abs(Math.cos(angle) * spd);
              g.ball.height = H_START * (1 + charge * 0.35);
              g.ball.bouncePhase = "flying";
              g.ball.hasLanded = false;
              g.swingCD = SWING_CD;
              g.rallyCount++;
              if (charge > 0.55) {
                g.bounceFlashes.push({ x: g.player.x, y: g.player.y - 8, t: 0.3, maxT: 0.3 });
              }
            }
          }
          chargeRef.current = 0; chargeTimerRef.current = 0;
        }
      }

      // ── P1 移動 ─────────────────────────────────────────────────
      if (!g.locked) {
        const mvX = ((keys["ArrowRight"] || keys["d"] || keys["D"]) ? 1 : 0)
                  - ((keys["ArrowLeft"]  || keys["a"] || keys["A"]) ? 1 : 0);
        const mvY = ((keys["ArrowDown"]  || keys["s"] || keys["S"]) ? 1 : 0)
                  - ((keys["ArrowUp"]    || keys["w"] || keys["W"]) ? 1 : 0);
        const len = hypot(mvX, mvY) || 1;
        if (mvX || mvY) {
          g.player.x += (mvX / len) * PLAYER_SPEED * dt;
          g.player.y += (mvY / len) * PLAYER_SPEED * dt;
        }
        g.player.x = clamp(g.player.x, CL + PLAYER_R, CR - PLAYER_R);
        g.player.y = clamp(g.player.y, NET_Y + PLAYER_R + 2, CB - PLAYER_R);
      }

      // ── P2 自動隊友 ─────────────────────────────────────────────
      if (!g.locked) {
        const ballOnUs = ball.vy > 0 && ball.y > NET_Y;
        const tX = ballOnUs ? clamp(ball.x, W / 2, CR - PLAYER_R) : 3 * W / 4;
        const tY = ballOnUs ? clamp(ball.y, NET_Y + PLAYER_R + 2, CB - PLAYER_R) : PA_Y;
        const ddx = tX - g.partner.x, ddy = tY - g.partner.y;
        const dd = hypot(ddx, ddy);
        if (dd > 1) {
          const step = Math.min(dd, PARTNER_SPEED * dt);
          g.partner.x = clamp(g.partner.x + (ddx / dd) * step, CL + PLAYER_R, CR - PLAYER_R);
          g.partner.y = clamp(g.partner.y + (ddy / dd) * step, NET_Y + PLAYER_R + 2, CB - PLAYER_R);
        }
        g.partner.swingCD = Math.max(0, (g.partner.swingCD || 0) - dt);

        if (g.partner.swingCD <= 0 && ball.vy > 0) {
          const p2d = hypot(ball.x - g.partner.x, ball.y - g.partner.y);
          const p1d = hypot(ball.x - g.player.x,  ball.y - g.player.y);
          if (p2d <= HIT_R && p2d < p1d && g.swingCD <= 0) {
            const inK = g.partner.y > NET_Y && g.partner.y < KB;
            if (!inK || ball.hasLanded) {
              const relX = clamp((ball.x - g.partner.x) / (HIT_R * 0.85), -1, 1);
              const angle = relX * (Math.PI / 3.2);
              const spd = clamp(BALL_SPEED_BASE + g.scoring.teamA.pts * 4, BALL_SPEED_BASE, BALL_SPEED_MAX - 40);
              g.ball.vx = Math.sin(angle) * spd;
              g.ball.vy = -Math.abs(Math.cos(angle) * spd);
              g.ball.height = H_START;
              g.ball.bouncePhase = "flying"; g.ball.hasLanded = false;
              g.partner.swingCD = SWING_CD; g.rallyCount++;
            }
          }
        }
      }

      // ── AI1 + AI2 ─────────────────────────────────────────────────
      const aiTired = g.rallyCount >= RALLY_TIRED;
      const aiSpd = aiTired ? AI_SPD_TIRED : AI_SPD_NORMAL;

      [g.ai1, g.ai2].forEach((ai, idx) => {
        const prefX = idx === 0 ? W / 4 : 3 * W / 4;
        const ballOnAI = ball.vy < 0 && ball.y < NET_Y;

        // 分心 / 專注 狀態切換
        ai.stateTimer = (ai.stateTimer || 0) - dt;
        if (ai.stateTimer <= 0) {
          ai.focused = Math.random() > AI_DISTRACT;
          ai.stateTimer = rand(0.9, 2.8);
          if (!ai.focused) ai.errX = rand(-72, 72);
        }

        if (ballOnAI) {
          if (ai.focused) {
            ai.errTimer = (ai.errTimer || 0) - dt;
            if (ai.errTimer <= 0) { ai.errX = rand(-26, 26); ai.errTimer = rand(0.3, 0.65); }
          }
          // X 移動
          const tX = clamp(ball.x + ai.errX, CL + PLAYER_R, CR - PLAYER_R);
          const stepX = Math.sign(tX - ai.x) * Math.min(Math.abs(tX - ai.x), aiSpd * dt);
          ai.x = clamp(ai.x + stepX, CL + PLAYER_R, CR - PLAYER_R);
          // Y 移動（跟球）
          const tY = clamp(ball.y, CT + PLAYER_R, NET_Y - PLAYER_R - 2);
          const stepY = Math.sign(tY - ai.y) * Math.min(Math.abs(tY - ai.y), aiSpd * 0.65 * dt);
          ai.y = clamp(ai.y + stepY, CT + PLAYER_R, NET_Y - PLAYER_R - 2);
        } else {
          // 回到預設站位
          const stepX = Math.sign(prefX - ai.x) * Math.min(Math.abs(prefX - ai.x), aiSpd * 0.45 * dt);
          ai.x = clamp(ai.x + stepX, CL + PLAYER_R, CR - PLAYER_R);
          const stepY = Math.sign(PB_Y - ai.y) * Math.min(Math.abs(PB_Y - ai.y), aiSpd * 0.45 * dt);
          ai.y = clamp(ai.y + stepY, CT + PLAYER_R, NET_Y - PLAYER_R - 2);
        }

        ai.swingCD = Math.max(0, (ai.swingCD || 0) - dt);

        // AI 擊球（只有專注狀態才出拍）
        if (ballOnAI && ai.focused && ai.swingCD <= 0) {
          const d = hypot(ball.x - ai.x, ball.y - ai.y);
          if (d <= HIT_R) {
            const inK = ai.y > KT && ai.y < NET_Y;
            if (!inK || ball.hasLanded) {
              const relX = clamp((ball.x - ai.x) / (HIT_R * 0.85), -1, 1);
              const angle = relX * (Math.PI / 3.5);
              // 疲勞時速度不穩定，可能出界
              const variance = aiTired ? rand(0.70, 1.20) : rand(0.88, 1.08);
              const spd = clamp(
                (BALL_SPEED_BASE + g.scoring.teamB.pts * 4) * variance,
                BALL_SPEED_BASE * 0.75, BALL_SPEED_MAX
              );
              g.ball.vx = Math.sin(angle) * spd;
              g.ball.vy = Math.abs(Math.cos(angle) * spd);
              g.ball.height = H_START;
              g.ball.bouncePhase = "flying"; g.ball.hasLanded = false;
              ai.swingCD = SWING_CD; g.rallyCount++;
            }
          }
        }
      });

      // ── 球物理 ──────────────────────────────────────────────────
      if (g.phase === "playing" && (ball.vx || ball.vy)) {
        g.ball.x += ball.vx * dt;
        g.ball.y += ball.vy * dt;
        g.ball.height -= H_DECAY * dt;
        g.swingCD = Math.max(0, g.swingCD - dt);

        g.trail.push({ x: ball.x, y: ball.y, h: ball.height });
        if (g.trail.length > 9) g.trail.shift();

        g.bounceFlashes = g.bounceFlashes
          .map(f => ({ ...f, t: f.t - dt }))
          .filter(f => f.t > 0);

        // 側牆反彈
        if (ball.x < CL + BALL_R) { g.ball.x = CL + BALL_R; g.ball.vx = Math.abs(ball.vx); }
        if (ball.x > CR - BALL_R) { g.ball.x = CR - BALL_R; g.ball.vx = -Math.abs(ball.vx); }

        // ── 落地彈跳邏輯 ─────────────────────────────────────────
        // 只在「接球方半場」才觸發落地；發球方那側高度歸零後直接滑地繼續
        // vy < 0 → 球往 AI 飛，接收方是 AI（y < NET_Y）
        // vy ≥ 0 → 球往玩家飛，接收方是玩家（y > NET_Y）
        if (g.ball.height <= 0 && !g.scoringDone) {
          const isMoving = Math.abs(ball.vx) > 0.5 || Math.abs(ball.vy) > 0.5;
          const onReceiverSide = ball.vy < 0 ? ball.y < NET_Y : ball.y > NET_Y;

          if (isMoving && onReceiverSide) {
            if (ball.bouncePhase === "flying") {
              // 第一次落地 → 彈起，可以接球
              g.ball.bouncePhase = "landed1";
              g.ball.hasLanded = true;
              g.ball.height = H_START * BOUNCE_H_KEEP;
              g.ball.vx *= BOUNCE_SPD_KEEP;
              g.ball.vy *= BOUNCE_SPD_KEEP;
              g.bounceFlashes.push({ x: ball.x, y: ball.y, t: 0.40, maxT: 0.40 });
            } else if (ball.bouncePhase === "landed1") {
              // 第二次落地 → 失分
              g.ball.bouncePhase = "dead";
              g.ball.height = 0;
              const winner = ball.y < NET_Y ? "A" : "B";
              scorePoint(winner);
            } else {
              g.ball.height = 0;
            }
          } else {
            // 在發球方那側：高度歸零但不彈跳，讓球繼續滑向對方
            g.ball.height = 0;
          }
        }

        // 出界（超出底線）
        if (!g.scoringDone) {
          if (ball.y < CT - 25) scorePoint("A");
          else if (ball.y > CB + 25) scorePoint("B");
        }
      }

      // ── 繪製 ────────────────────────────────────────────────────
      drawCourt(ctx);

      const inKitchen = g.player.y > NET_Y && g.player.y < KB;
      const ballComing = ball.vy > 0;
      const ballNear = hypot(ball.x - g.player.x, ball.y - g.player.y) < HIT_R * 1.4;
      const kitchenWarn = inKitchen && ballComing && !ball.hasLanded && g.phase === "playing";

      drawKitchenWarning(ctx, kitchenWarn);
      drawBounceFlashes(ctx, g.bounceFlashes || []);
      drawTrail(ctx, g.trail);
      drawBall(ctx, ball.x, ball.y, ball.height);

      // 精確判斷誰是當前發球員（顯示光環）
      const sc = g.scoring;
      const p1IsServer  = sc.servingTeam === "A" && sc.serverNum === 1;
      const p2IsServer  = sc.servingTeam === "A" && sc.serverNum === 2;
      const ai1IsServer = sc.servingTeam === "B" && sc.serverNum === 1;
      const ai2IsServer = sc.servingTeam === "B" && sc.serverNum === 2;

      drawPlayer(ctx, g.partner.x, g.partner.y, C.p2, "隊友", p2IsServer, false, true, pt, 0);
      drawPlayer(ctx, g.player.x, g.player.y, C.p1, "你", p1IsServer,
        ballNear && ballComing, !inKitchen || ball.hasLanded, pt, chargeRef.current);
      drawChargeBar(ctx, g.player.x, g.player.y, chargeRef.current);
      drawPlayer(ctx, g.ai1.x, g.ai1.y, C.ai1, "AI₁", ai1IsServer, false, true, pt, 0);
      drawPlayer(ctx, g.ai2.x, g.ai2.y, C.ai2, "AI₂", ai2IsServer, false, true, pt, 0);

      // 發球區高亮
      if (g.phase === "serve_player") {
        const a = 0.5 + 0.5 * Math.sin(pt * 2);
        ctx.fillStyle = `rgba(0,255,136,${a * 0.12})`; ctx.fillRect(CL, KB, CR - CL, CB - KB);
        ctx.strokeStyle = `rgba(0,255,136,${a * 0.55})`; ctx.lineWidth = 2;
        ctx.setLineDash([5, 4]); ctx.strokeRect(CL, KB, CR - CL, CB - KB); ctx.setLineDash([]);
      }

      // AI 疲勞提示
      if (aiTired) {
        ctx.textAlign = "center";
        ctx.fillStyle = "rgba(255,165,0,0.7)"; ctx.font = "bold 8.5px sans-serif";
        ctx.fillText("😓 AI 疲勞體力下降", W / 2, CT + 15);
      }
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [scorePoint, setMsg, startNextRound, clearResumeTimer]);

  // ── 鍵盤事件 ─────────────────────────────────────────────────────────
  useEffect(() => {
    const dn = (e) => {
      keysRef.current[e.key] = true;
      if ((e.key === " " || e.key === "Enter") && e.target.tagName !== "BUTTON") {
        e.preventDefault();
        if (!spaceHeldRef.current) {
          spacePressRef.current = true;   // 上升緣
          spaceHeldRef.current = true;
          chargeTimerRef.current = 0;
          chargeRef.current = 0;
        }
      }
    };
    const up = (e) => {
      keysRef.current[e.key] = false;
      if (e.key === " " || e.key === "Enter") {
        spaceHeldRef.current = false;
        spaceReleaseRef.current = true;  // 放開觸發擊球
      }
    };
    window.addEventListener("keydown", dn);
    window.addEventListener("keyup", up);
    return () => { window.removeEventListener("keydown", dn); window.removeEventListener("keyup", up); };
  }, []);

  // ── 觸控 ─────────────────────────────────────────────────────────────
  const touchRef = useRef({ x: 0, y: 0, id: null });
  const onTouchStart = useCallback((e) => {
    e.preventDefault();
    const t = e.changedTouches[0];
    touchRef.current = { x: t.clientX, y: t.clientY, id: t.identifier };
    if (!spaceHeldRef.current) {
      spacePressRef.current = true;
      spaceHeldRef.current = true;
      chargeTimerRef.current = 0; chargeRef.current = 0;
    }
  }, []);
  const onTouchMove = useCallback((e) => {
    e.preventDefault();
    const t = Array.from(e.touches).find(tt => tt.identifier === touchRef.current.id);
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
    ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].forEach(k => keysRef.current[k] = false);
    spaceHeldRef.current = false;
    spaceReleaseRef.current = true;
  }, []);

  return (
    <div className="relative w-full flex flex-col bg-[#071628]" style={{ maxWidth: 420, margin: "0 auto", minHeight: "100svh" }}>

      {/* ── 計分板 ── */}
      {ui.phase !== "intro" && (
        <div className="flex items-center justify-between px-4 pt-3 pb-2 gap-2">
          <button onClick={onBack} className="text-white/30 hover:text-white text-xl transition-colors w-6">←</button>
          <div className="flex-1 flex items-center justify-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full transition-all ${ui.servingTeam === "A" ? "bg-yellow-500 text-black" : "bg-yellow-500/15 text-yellow-400"}`}>
                {ui.servingTeam === "A" ? "★" : ""} A
              </span>
              <motion.span key={ui.aScore} initial={{ scale: 1.6, color: "#00FF88" }} animate={{ scale: 1, color: "#fff" }}
                className="text-3xl font-black tabular-nums">{ui.aScore}</motion.span>
            </div>
            <div className="text-center">
              <motion.div key={ui.score} initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                className="text-xl font-black tracking-widest"
                style={{ color: ui.servingTeam === "A" ? C.p1 : C.ai1 }}>
                {ui.score}
              </motion.div>
              <div className="text-white/30 text-[9px]">2v2 雙打</div>
            </div>
            <div className="flex items-center gap-1.5">
              <motion.span key={ui.bScore} initial={{ scale: 1.6, color: "#00FF88" }} animate={{ scale: 1, color: "#fff" }}
                className="text-3xl font-black tabular-nums">{ui.bScore}</motion.span>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full transition-all ${ui.servingTeam === "B" ? "bg-red-500 text-white" : "bg-red-500/15 text-red-400"}`}>
                {ui.servingTeam === "B" ? "★" : ""} B
              </span>
            </div>
          </div>
          <div className="w-6" />
        </div>
      )}

      {/* ── Canvas ── */}
      <div className="relative w-full flex-1">
        <canvas
          ref={canvasRef} width={W} height={H}
          className="w-full block" style={{ touchAction: "none" }}
          onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}
        />

        {/* 訊息 */}
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

        {/* 得分 overlay */}
        <AnimatePresence>
          {ui.phase === "scored" && (
            <motion.div key="scored-overlay"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 flex flex-col items-center justify-center bg-black/55 backdrop-blur-[2px] pointer-events-none">
              <motion.div initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center px-6">
                <div className="text-4xl font-black mb-2" style={{ color: ui.msgColor }}>{ui.msg}</div>
                <div className="text-white/80 text-lg font-bold mb-1">比分 {ui.score}</div>
                {ui.countdown > 0 ? (
                  <>
                    <div className="text-5xl font-black text-[#00FF88] my-3 tabular-nums">{ui.countdown}</div>
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
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="absolute bottom-24 left-0 right-0 flex justify-center pointer-events-none">
              <div className="px-5 py-2.5 rounded-2xl font-bold text-sm animate-pulse"
                style={{ background: "rgba(0,255,136,0.15)", border: "2px solid #00FF88", color: "#00FF88" }}>
                按住 Space 集氣 → 放開發球！
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── 開始畫面 ── */}
        <AnimatePresence>
          {ui.phase === "intro" && (
            <motion.div className="absolute inset-0 flex flex-col items-center justify-center bg-[#071628] overflow-y-auto"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="text-6xl mb-3">🏓</div>
              <h1 className="text-2xl font-black text-white mb-1">匹克球 2v2 雙打</h1>
              <p className="text-white/50 text-sm text-center px-6 mb-4 leading-relaxed max-w-xs">
                你 + 隊友（自動）對抗 AI₁ + AI₂<br />
                <span className="text-[#FCD34D]">WASD / 方向鍵</span> 移動<br />
                <span className="text-[#00FF88] font-bold">按住 Space 集氣，放開大力擊！</span><br />
                <span style={{ color: C.kitchenLine }}>廚房必須等球落地再截擊</span><br />
                <span className="text-yellow-400">球彈兩次 = 失分</span>
              </p>

              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 mx-6 mb-5 w-full max-w-xs">
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                  {[
                    [C.p1,          "你（P1）",    "WASD/方向鍵控制"],
                    [C.p2,          "隊友（P2）",  "自動補位回球"],
                    [C.ai1,         "AI₁（左）",   "分心時失誤"],
                    [C.ai2,         "AI₂（右）",   "長拍後體力下降"],
                    [C.kitchenLine, "廚房 NVZ",    "等落地才能截"],
                    ["#4CAF50",     "截擊區",      "可直接空中截"],
                    ["#FFA500",     "橘色集氣條",  ">50% 大力擊出"],
                    ["#FF1744",     "紅色滿氣",    "最強火力！"],
                  ].map(([col, k, v]) => (
                    <div key={k} className="flex gap-1.5 items-start">
                      <div className="w-2 h-2 rounded-full mt-0.5 flex-shrink-0" style={{ background: col }} />
                      <div>
                        <span className="text-white/80 font-medium">{k}</span>
                        <span className="text-white/40 block">{v}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <motion.button whileTap={{ scale: 0.95 }} onClick={initGame}
                className="py-4 px-10 rounded-2xl text-white font-bold text-lg"
                style={{ background: "linear-gradient(135deg,#1e88e5,#0d47a1)" }}>
                開始雙打！
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
                  {ui.winner === "A" ? "你們贏了！" : "AI 隊獲勝"}
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

      {/* ── 操作說明（遊戲中） ── */}
      {ui.phase !== "intro" && ui.phase !== "gameover" && (
        <div className="px-4 py-2 flex items-center justify-center gap-3 flex-wrap">
          {[["WASD/↑↓←→", "移動"], ["按住Space", "集氣擊球"]].map(([k, v]) => (
            <div key={k} className="flex items-center gap-1.5">
              <kbd className="text-[10px] px-1.5 py-0.5 bg-white/10 rounded text-white/60 font-mono">{k}</kbd>
              <span className="text-white/30 text-[10px]">{v}</span>
            </div>
          ))}
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ background: C.kitchenLine }} />
            <span className="text-white/30 text-[10px]">廚房：等落地</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ background: C.p2 }} />
            <span className="text-white/30 text-[10px]">隊友自動補位</span>
          </div>
        </div>
      )}
    </div>
  );
}
