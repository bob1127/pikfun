/**
 * 匹克球雙打計分規則（標準 USAPA 規則）
 *
 * 狀態 (GameState):
 *   score      : [serverTeamPts, receiverTeamPts]  → 轉換為報分時依 servingTeam 對應
 *   teamA      : { pts: number }
 *   teamB      : { pts: number }
 *   servingTeam: 'A' | 'B'           目前發球隊
 *   serverNum  : 1 | 2               1 = 第一發球員, 2 = 第二發球員
 *   positions  : {
 *     A1: 'left' | 'right',          teamA 左右位
 *     A2: 'left' | 'right',
 *     B1: 'left' | 'right',
 *     B2: 'left' | 'right',
 *   }
 *   winTo      : number              幾分勝 (通常 11, 贏 2)
 *   winner     : null | 'A' | 'B'
 */

export function initialGameState({ winTo = 11 } = {}) {
  return {
    teamA: { pts: 0 },
    teamB: { pts: 0 },
    servingTeam: 'A',
    serverNum: 2,      // 開局先發隊只有 2 號發球（規則特殊）
    positions: {
      A1: 'right',     // 得分 0 → 偶數 → 右邊發球
      A2: 'left',
      B1: 'left',
      B2: 'right',
    },
    winTo,
    winner: null,
  };
}

/**
 * 依目前得分決定某隊的「發球站位邊」
 * 得分偶數 → 1號球員在右邊發球; 奇數 → 在左邊
 */
export function serverSide(team, pts) {
  // 1 號球員
  const even = pts % 2 === 0;
  return {
    [`${team}1`]: even ? 'right' : 'left',
    [`${team}2`]: even ? 'left' : 'right',
  };
}

/**
 * rally 結束後，回傳新 GameState
 * @param {object} state   - 目前狀態
 * @param {'A'|'B'} wonBy  - 哪隊贏得這球
 */
export function applyRally(state, wonBy) {
  if (state.winner) return { ...state, explanation: '遊戲已結束' };

  const { servingTeam, serverNum, teamA, teamB, winTo } = state;
  let newState = { ...state, teamA: { ...teamA }, teamB: { ...teamB } };

  if (wonBy === servingTeam) {
    // ─── 發球方得分 ───────────────────────────────────────────
    if (servingTeam === 'A') newState.teamA.pts += 1;
    else newState.teamB.pts += 1;

    const pts = servingTeam === 'A' ? newState.teamA.pts : newState.teamB.pts;

    // 換位（得分後發球方換邊）
    newState.positions = {
      ...state.positions,
      ...serverSide(servingTeam, pts),
    };

    newState.explanation = `${servingTeam === 'A' ? '你們隊' : '對手隊'}得分！\n發球方得分 → 同隊換邊，繼續由 ${servingTeam}${serverNum} 發球。`;

    // 勝利判定
    const ptsA = newState.teamA.pts;
    const ptsB = newState.teamB.pts;
    if (
      (ptsA >= winTo || ptsB >= winTo) &&
      Math.abs(ptsA - ptsB) >= 2
    ) {
      newState.winner = ptsA > ptsB ? 'A' : 'B';
      newState.explanation = `${newState.winner === 'A' ? '你們隊' : '對手隊'} 獲勝！🏆`;
    }

  } else {
    // ─── 接發方得分（Side out）────────────────────────────────
    if (serverNum === 2 || servingTeam !== wonBy) {
      // 換發球隊
      const nextTeam = servingTeam === 'A' ? 'B' : 'A';
      newState.servingTeam = nextTeam;
      newState.serverNum = 1;     // 換隊後從 1 號球員開始

      const pts = nextTeam === 'A' ? newState.teamA.pts : newState.teamB.pts;
      newState.positions = {
        ...state.positions,
        ...serverSide(nextTeam, pts),
      };
      newState.explanation = `接發方得分！\nSide out → 換 ${nextTeam === 'A' ? '你們隊' : '對手隊'} 發球，由 ${nextTeam}1 開始。`;
    } else {
      // 同隊換第二發球員
      newState.serverNum = 2;
      newState.explanation = `接發方得分！\n${servingTeam}1 失誤 → 換 ${servingTeam}2 發球（發球權未換隊）。`;
    }
  }

  return newState;
}

/**
 * 產生報分字串，例如 "6-4-1"
 * 順序：發球方分 - 接發方分 - 發球序
 */
export function announceScore(state) {
  const { servingTeam, serverNum, teamA, teamB } = state;
  const serverPts = servingTeam === 'A' ? teamA.pts : teamB.pts;
  const receiverPts = servingTeam === 'A' ? teamB.pts : teamA.pts;
  return `${serverPts}-${receiverPts}-${serverNum}`;
}

// ─── 教學關卡定義 ────────────────────────────────────────────────────────────

export const LESSONS = [
  {
    id: 'intro',
    title: '比賽開始',
    description: '比賽開始時，先發球隊只有一個發球機會（serverNum = 2）。\n請按「A 得分」看看會發生什麼。',
    hint: '發球方得分 → 同隊換邊。',
    initState: initialGameState(),
    targetAction: { wonBy: 'A' },
  },
  {
    id: 'sideout',
    title: 'Side Out 換發球',
    description: '目前比分 4-3-2，接發方 B 贏了這球。\n你認為下一個比分應該是？',
    hint: '接發方（B）得分，當 serverNum = 2 → 換 B 隊發球，從 B1 開始。',
    initState: {
      ...initialGameState(),
      teamA: { pts: 4 }, teamB: { pts: 3 },
      servingTeam: 'A', serverNum: 2,
      positions: { A1: 'right', A2: 'left', B1: 'left', B2: 'right' },
    },
    targetAction: { wonBy: 'B' },
  },
  {
    id: 'server2',
    title: '第二發球員',
    description: '目前是 A1 在發球（serverNum = 1），B 贏了這球。\n發球權換給 A2 還是換隊？',
    hint: 'serverNum = 1 → A 隊還有 A2 可以發球，不換隊。',
    initState: {
      ...initialGameState(),
      teamA: { pts: 2 }, teamB: { pts: 3 },
      servingTeam: 'A', serverNum: 1,
      positions: { A1: 'left', A2: 'right', B1: 'right', B2: 'left' },
    },
    targetAction: { wonBy: 'B' },
  },
  {
    id: 'deuce',
    title: '10-10 追平',
    description: '比分 10-10-1，發球方 A 得分，現在呢？',
    hint: '10-10 後仍需贏 2 分，換位繼續打。',
    initState: {
      ...initialGameState(),
      teamA: { pts: 10 }, teamB: { pts: 10 },
      servingTeam: 'A', serverNum: 1,
      positions: { A1: 'right', A2: 'left', B1: 'left', B2: 'right' },
    },
    targetAction: { wonBy: 'A' },
  },
  {
    id: 'freestyle',
    title: '自由練習',
    description: '自己操作看看！連續幾球你能算對嗎？',
    hint: '報分格式：發球方-接發方-發球序',
    initState: initialGameState(),
    targetAction: null,
  },
];
