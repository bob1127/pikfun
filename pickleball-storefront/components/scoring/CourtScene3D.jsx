"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Text, RoundedBox, Sphere } from "@react-three/drei";
import * as THREE from "three";

// ─── 球場尺寸（公尺縮比） ─────────────────────────────────────────────────────
// 真實球場 13.41m x 6.1m，這裡縮 1:1.5 → ~9 x 4.1
const CW = 9;   // court width
const CH = 4.1; // court height (depth)
const KW = CW;
const KH = 1.5; // kitchen depth

// 顏色
const COLORS = {
  courtBlue: '#1565C0',
  courtLine: '#ffffff',
  kitchen: '#1976D2',
  net: '#cccccc',
  teamA: '#F59E0B',    // 你們隊：黃
  teamB: '#EF4444',    // 對手隊：紅
  serverGlow: '#00FF88',
  shadow: '#0d47a1',
};

// ─── 球場地板 ─────────────────────────────────────────────────────────────────
function CourtFloor() {
  return (
    <group>
      {/* 主場地 */}
      <mesh receiveShadow position={[0, -0.01, 0]}>
        <boxGeometry args={[CW + 0.2, 0.04, CH + 0.2]} />
        <meshStandardMaterial color={COLORS.courtBlue} />
      </mesh>

      {/* 球場線框 */}
      <lineSegments>
        <edgesGeometry args={[new THREE.BoxGeometry(CW, 0.01, CH)]} />
        <lineBasicMaterial color={COLORS.courtLine} linewidth={2} />
      </lineSegments>

      {/* 廚房線（Non-Volley Zone）上半場 */}
      <mesh position={[0, 0, -(CH / 2 - KH / 2 - 0.01)]}>
        <planeGeometry args={[KW, KH]} />
        <meshStandardMaterial color={COLORS.kitchen} opacity={0.5} transparent />
      </mesh>

      {/* 廚房線 下半場 */}
      <mesh position={[0, 0, CH / 2 - KH / 2 + 0.01]}>
        <planeGeometry args={[KW, KH]} />
        <meshStandardMaterial color={COLORS.kitchen} opacity={0.5} transparent />
      </mesh>

      {/* 中線 */}
      <mesh position={[0, 0.01, 0]}>
        <planeGeometry args={[0.05, CH]} />
        <meshStandardMaterial color={COLORS.courtLine} />
      </mesh>

      {/* 廚房線 邊線 */}
      <mesh position={[0, 0.01, -(CH / 2 - KH)]}>
        <planeGeometry args={[CW, 0.05]} />
        <meshStandardMaterial color={COLORS.courtLine} />
      </mesh>
      <mesh position={[0, 0.01, CH / 2 - KH]}>
        <planeGeometry args={[CW, 0.05]} />
        <meshStandardMaterial color={COLORS.courtLine} />
      </mesh>
    </group>
  );
}

// ─── 球網 ─────────────────────────────────────────────────────────────────────
function Net() {
  const netRef = useRef();
  const rows = 8;
  const cols = 20;

  const geometry = useMemo(() => {
    const pts = [];
    // 橫向
    for (let r = 0; r <= rows; r++) {
      const y = (r / rows) * 0.91; // 球網高度 0.91m
      pts.push(-CW / 2, y, 0, CW / 2, y, 0);
    }
    // 縱向
    for (let c = 0; c <= cols; c++) {
      const x = -CW / 2 + (c / cols) * CW;
      pts.push(x, 0, 0, x, 0.91, 0);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
    return geo;
  }, []);

  return (
    <group ref={netRef} position={[0, 0, 0]}>
      <lineSegments geometry={geometry}>
        <lineBasicMaterial color={COLORS.net} opacity={0.7} transparent />
      </lineSegments>
      {/* 球網支柱 */}
      <mesh position={[-CW / 2, 0.45, 0]} castShadow>
        <cylinderGeometry args={[0.04, 0.04, 0.91, 8]} />
        <meshStandardMaterial color="#888" />
      </mesh>
      <mesh position={[CW / 2, 0.45, 0]} castShadow>
        <cylinderGeometry args={[0.04, 0.04, 0.91, 8]} />
        <meshStandardMaterial color="#888" />
      </mesh>
    </group>
  );
}

// ─── 球員（圓柱代表） ─────────────────────────────────────────────────────────
function Player({ position, color, label, isServer, isActive }) {
  const glowRef = useRef();

  useFrame((state) => {
    if (glowRef.current && isServer) {
      const t = state.clock.getElapsedTime();
      glowRef.current.intensity = 1.5 + Math.sin(t * 3) * 0.8;
    }
  });

  return (
    <group position={position}>
      {/* 發球者光環 */}
      {isServer && (
        <pointLight
          ref={glowRef}
          color={COLORS.serverGlow}
          intensity={2}
          distance={2}
        />
      )}

      {/* 身體 */}
      <mesh castShadow>
        <cylinderGeometry args={[0.22, 0.22, 0.9, 16]} />
        <meshStandardMaterial
          color={color}
          emissive={isServer ? COLORS.serverGlow : color}
          emissiveIntensity={isServer ? 0.3 : 0}
        />
      </mesh>

      {/* 頭 */}
      <mesh position={[0, 0.65, 0]} castShadow>
        <sphereGeometry args={[0.2, 16, 16]} />
        <meshStandardMaterial color={color} />
      </mesh>

      {/* 發球者帽 */}
      {isServer && (
        <mesh position={[0, 0.88, 0]}>
          <cylinderGeometry args={[0.22, 0.22, 0.12, 16]} />
          <meshStandardMaterial color={COLORS.serverGlow} />
        </mesh>
      )}

      {/* 標籤 */}
      <Text
        position={[0, 1.2, 0]}
        fontSize={0.28}
        color="white"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.02}
        outlineColor="#000"
      >
        {label}
      </Text>

      {/* 活動選擇高亮圈 */}
      {isActive && (
        <mesh position={[0, -0.45, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.3, 0.38, 32]} />
          <meshBasicMaterial color="#ffffff" side={THREE.DoubleSide} />
        </mesh>
      )}
    </group>
  );
}

// ─── 匹克球 ──────────────────────────────────────────────────────────────────
function PickleballBall({ position, visible: show }) {
  const ref = useRef();

  useFrame((state) => {
    if (!ref.current || !show) return;
    ref.current.position.y = position[1] + Math.abs(Math.sin(state.clock.getElapsedTime() * 2)) * 0.4;
  });

  if (!show) return null;
  return (
    <mesh ref={ref} position={position} castShadow>
      <sphereGeometry args={[0.12, 16, 16]} />
      <meshStandardMaterial color="#F5F5F5" roughness={0.3} />
    </mesh>
  );
}

// ─── 主要球場 Scene ───────────────────────────────────────────────────────────
/**
 * positions: { A1: 'left'|'right', A2, B1, B2 }
 * servingTeam: 'A'|'B'
 * serverNum: 1|2
 * showBall: boolean
 */
export default function CourtScene3D({ positions, servingTeam, serverNum, teamApts, teamBpts }) {
  // 將 'left'/'right' 轉為實際 x 座標
  // Team A = 下半場 z > 0; Team B = 上半場 z < 0
  function px(side) {
    return side === 'right' ? CW / 4 : -CW / 4;
  }

  const players = [
    {
      key: 'A1',
      pos: [px(positions.A1), 0.45, CH / 4],
      color: COLORS.teamA,
      label: 'A1',
      isServer: servingTeam === 'A' && serverNum === 1,
    },
    {
      key: 'A2',
      pos: [px(positions.A2), 0.45, CH / 4 + CH / 4],
      color: COLORS.teamA,
      label: 'A2',
      isServer: servingTeam === 'A' && serverNum === 2,
    },
    {
      key: 'B1',
      pos: [px(positions.B1), 0.45, -CH / 4],
      color: COLORS.teamB,
      label: 'B1',
      isServer: servingTeam === 'B' && serverNum === 1,
    },
    {
      key: 'B2',
      pos: [px(positions.B2), 0.45, -CH / 4 - CH / 4],
      color: COLORS.teamB,
      label: 'B2',
      isServer: servingTeam === 'B' && serverNum === 2,
    },
  ];

  return (
    <>
      {/* 環境光 */}
      <ambientLight intensity={0.6} />
      <directionalLight
        position={[5, 8, 5]}
        intensity={1.2}
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
      <pointLight position={[-5, 5, -5]} intensity={0.5} color="#bbdefb" />

      {/* 背景地板 */}
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.03, 0]}>
        <planeGeometry args={[30, 30]} />
        <meshStandardMaterial color="#0a2744" />
      </mesh>

      {/* 球場 */}
      <group rotation={[-Math.PI / 2, 0, 0]}>
        <CourtFloor />
      </group>

      {/* 球網 */}
      <Net />

      {/* 球員 */}
      {players.map((p) => (
        <Player
          key={p.key}
          position={p.pos}
          color={p.color}
          label={p.label}
          isServer={p.isServer}
        />
      ))}

      {/* 球（在場中央彈跳） */}
      <PickleballBall position={[0, 0.5, 0]} visible />

      {/* 隊伍標籤 */}
      <Text position={[-CW / 2 - 0.5, 0.5, CH / 3]} fontSize={0.35} color={COLORS.teamA} anchorX="right">
        {`A 隊\n${teamApts}分`}
      </Text>
      <Text position={[-CW / 2 - 0.5, 0.5, -CH / 3]} fontSize={0.35} color={COLORS.teamB} anchorX="right">
        {`B 隊\n${teamBpts}分`}
      </Text>
    </>
  );
}
