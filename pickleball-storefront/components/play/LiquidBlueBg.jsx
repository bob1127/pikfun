"use client";

/**
 * 手機版液體藍漸層背景
 * 參考：Gradient Liquid Blue Shapes（流動有機形狀 + 柔焦藍漸層）
 * Desktop 不顯示。
 */
export default function LiquidBlueBg({ className = "" }) {
  return (
    <div
      className={`pointer-events-none absolute inset-0 overflow-hidden md:hidden ${className}`}
      aria-hidden
    >
      <style>{`
        @keyframes liquid-morph-a {
          0%, 100% {
            transform: translate(0%, 0%) scale(1) rotate(0deg);
            border-radius: 42% 58% 55% 45% / 48% 42% 58% 52%;
          }
          25% {
            transform: translate(18%, -12%) scale(1.15) rotate(12deg);
            border-radius: 58% 42% 38% 62% / 55% 48% 52% 45%;
          }
          50% {
            transform: translate(-8%, 16%) scale(0.9) rotate(-8deg);
            border-radius: 38% 62% 60% 40% / 42% 58% 42% 58%;
          }
          75% {
            transform: translate(10%, 6%) scale(1.08) rotate(6deg);
            border-radius: 52% 48% 42% 58% / 60% 40% 55% 45%;
          }
        }
        @keyframes liquid-morph-b {
          0%, 100% {
            transform: translate(0%, 0%) scale(1.05) rotate(0deg);
            border-radius: 55% 45% 48% 52% / 42% 58% 42% 58%;
          }
          30% {
            transform: translate(-20%, 14%) scale(1.2) rotate(-14deg);
            border-radius: 40% 60% 55% 45% / 58% 42% 60% 40%;
          }
          60% {
            transform: translate(14%, -10%) scale(0.88) rotate(10deg);
            border-radius: 62% 38% 45% 55% / 48% 52% 38% 62%;
          }
        }
        @keyframes liquid-morph-c {
          0%, 100% {
            transform: translate(-50%, -50%) scale(1);
            border-radius: 48% 52% 58% 42% / 55% 45% 55% 45%;
          }
          50% {
            transform: translate(-38%, -62%) scale(1.35);
            border-radius: 60% 40% 42% 58% / 40% 60% 48% 52%;
          }
        }
        @keyframes liquid-morph-d {
          0%, 100% {
            transform: translate(0%, 0%) scale(1) rotate(0deg);
            border-radius: 50% 50% 45% 55% / 55% 45% 55% 45%;
          }
          40% {
            transform: translate(-12%, -18%) scale(1.22) rotate(18deg);
            border-radius: 35% 65% 60% 40% / 45% 55% 40% 60%;
          }
          80% {
            transform: translate(16%, 10%) scale(0.85) rotate(-12deg);
            border-radius: 58% 42% 50% 50% / 40% 60% 55% 45%;
          }
        }
        .liquid-blob {
          position: absolute;
          filter: blur(56px);
          will-change: transform, border-radius;
        }
        .liquid-blob-a {
          width: 85vw;
          height: 85vw;
          top: -18%;
          left: -30%;
          opacity: 0.72;
          background: radial-gradient(
            circle at 32% 30%,
            #9ec8ff 0%,
            #4a9be8 28%,
            #005caf 55%,
            transparent 74%
          );
          animation: liquid-morph-a 16s ease-in-out infinite;
        }
        .liquid-blob-b {
          width: 95vw;
          height: 95vw;
          bottom: -5%;
          right: -38%;
          opacity: 0.65;
          background: radial-gradient(
            circle at 62% 38%,
            #b8dcff 0%,
            #5aa3e0 32%,
            #1a6fbf 58%,
            transparent 76%
          );
          animation: liquid-morph-b 20s ease-in-out infinite;
        }
        .liquid-blob-c {
          width: 70vw;
          height: 70vw;
          top: 38%;
          left: 50%;
          opacity: 0.5;
          background: radial-gradient(
            circle at 50% 50%,
            #dff0ff 0%,
            #7eb6ff 35%,
            #3d8fd9 62%,
            transparent 78%
          );
          animation: liquid-morph-c 12s ease-in-out infinite;
        }
        .liquid-blob-d {
          width: 60vw;
          height: 60vw;
          top: 18%;
          right: -12%;
          opacity: 0.45;
          background: radial-gradient(
            circle at 40% 50%,
            #c5e2ff 0%,
            #6ba8e8 40%,
            transparent 72%
          );
          animation: liquid-morph-d 14s ease-in-out infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .liquid-blob-a,
          .liquid-blob-b,
          .liquid-blob-c,
          .liquid-blob-d {
            animation: none;
          }
        }
      `}</style>
      <div className="absolute inset-0 bg-[#d6e8f8]" />
      <div className="liquid-blob liquid-blob-a" />
      <div className="liquid-blob liquid-blob-b" />
      <div className="liquid-blob liquid-blob-c" />
      <div className="liquid-blob liquid-blob-d" />
      <div className="absolute inset-0 bg-gradient-to-b from-white/40 via-transparent to-white/50" />
    </div>
  );
}
