"use client";

/**
 * 開團頁 hero 霓虹液體背景
 * 參考：Gradient Liquid shapes — 黑底 + cyan / blue / magenta / pink 流動層
 */
export default function LiquidNeonBg({ className = "" }) {
  return (
    <div
      className={`crt-liquid-neon ${className}`}
      aria-hidden
    >
      <style>{`
        .crt-liquid-neon {
          position: absolute;
          inset: 0;
          overflow: hidden;
          pointer-events: none;
          z-index: 0;
        }
        .crt-liquid-neon__base {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            165deg,
            #0a2a6e 0%,
            #0c3d8f 40%,
            #0a4db0 70%,
            #0b3a8a 100%
          );
        }
        .crt-liquid-neon__svg {
          position: absolute;
          inset: -15% -20%;
          width: 140%;
          height: 130%;
        }
        .crt-liquid-neon__blob {
          position: absolute;
          filter: blur(40px);
          opacity: 0.85;
          will-change: transform, border-radius;
        }
        .crt-liquid-neon__blob--a {
          width: 70%;
          height: 55%;
          left: -18%;
          bottom: -8%;
          background: radial-gradient(
            ellipse at 40% 40%,
            #ff4fd8 0%,
            #7b2fff 35%,
            #1a6bff 65%,
            transparent 78%
          );
          animation: crt-neon-a 14s ease-in-out infinite;
        }
        .crt-liquid-neon__blob--b {
          width: 65%;
          height: 50%;
          right: -22%;
          bottom: -5%;
          background: radial-gradient(
            ellipse at 55% 45%,
            #00e5ff 0%,
            #3d7bff 40%,
            #9b4dff 70%,
            transparent 80%
          );
          animation: crt-neon-b 17s ease-in-out infinite;
        }
        .crt-liquid-neon__blob--c {
          width: 55%;
          height: 45%;
          left: 20%;
          bottom: -18%;
          background: radial-gradient(
            ellipse at 50% 40%,
            #ff2d9b 0%,
            #c44dff 45%,
            transparent 75%
          );
          animation: crt-neon-c 12s ease-in-out infinite;
          opacity: 0.7;
        }
        .crt-liquid-neon__blob--d {
          width: 45%;
          height: 40%;
          right: 5%;
          top: 35%;
          background: radial-gradient(
            ellipse at 50% 50%,
            #5ef0ff 0%,
            #2a6fff 50%,
            transparent 72%
          );
          animation: crt-neon-d 15s ease-in-out infinite;
          opacity: 0.55;
        }
        .crt-liquid-neon__ribbon {
          position: absolute;
          inset: 0;
          opacity: 0.9;
        }
        .crt-liquid-neon__vignette {
          position: absolute;
          inset: 0;
          background:
            radial-gradient(ellipse 85% 70% at 50% 28%, rgba(8, 42, 110, 0.92) 0%, transparent 62%),
            linear-gradient(
              180deg,
              rgba(8, 42, 110, 0.75) 0%,
              transparent 38%,
              transparent 72%,
              rgba(10, 58, 140, 0.45) 100%
            );
        }
        @keyframes crt-neon-a {
          0%, 100% {
            transform: translate(0, 0) scale(1) rotate(0deg);
            border-radius: 48% 52% 58% 42% / 42% 58% 42% 58%;
          }
          33% {
            transform: translate(10%, -12%) scale(1.12) rotate(8deg);
            border-radius: 58% 42% 40% 60% / 55% 45% 55% 45%;
          }
          66% {
            transform: translate(-8%, 8%) scale(0.92) rotate(-6deg);
            border-radius: 40% 60% 55% 45% / 48% 52% 38% 62%;
          }
        }
        @keyframes crt-neon-b {
          0%, 100% {
            transform: translate(0, 0) scale(1.05) rotate(0deg);
            border-radius: 55% 45% 48% 52% / 42% 58% 42% 58%;
          }
          40% {
            transform: translate(-14%, -10%) scale(1.18) rotate(-10deg);
            border-radius: 42% 58% 55% 45% / 60% 40% 55% 45%;
          }
          70% {
            transform: translate(8%, 12%) scale(0.9) rotate(12deg);
            border-radius: 60% 40% 42% 58% / 45% 55% 40% 60%;
          }
        }
        @keyframes crt-neon-c {
          0%, 100% {
            transform: translate(0, 0) scale(1);
            border-radius: 50% 50% 45% 55% / 55% 45% 55% 45%;
          }
          50% {
            transform: translate(12%, -16%) scale(1.25);
            border-radius: 38% 62% 58% 42% / 48% 52% 42% 58%;
          }
        }
        @keyframes crt-neon-d {
          0%, 100% {
            transform: translate(0, 0) scale(1) rotate(0deg);
            border-radius: 52% 48% 55% 45% / 48% 52% 48% 52%;
          }
          50% {
            transform: translate(-10%, 14%) scale(1.15) rotate(-14deg);
            border-radius: 45% 55% 40% 60% / 58% 42% 60% 40%;
          }
        }
        @keyframes crt-ribbon-drift {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-4%) scale(1.03); }
        }
        .crt-liquid-neon__ribbon {
          animation: crt-ribbon-drift 11s ease-in-out infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .crt-liquid-neon__blob--a,
          .crt-liquid-neon__blob--b,
          .crt-liquid-neon__blob--c,
          .crt-liquid-neon__blob--d,
          .crt-liquid-neon__ribbon {
            animation: none;
          }
        }
      `}</style>

      <div className="crt-liquid-neon__base" />
      <div className="crt-liquid-neon__blob crt-liquid-neon__blob--a" />
      <div className="crt-liquid-neon__blob crt-liquid-neon__blob--b" />
      <div className="crt-liquid-neon__blob crt-liquid-neon__blob--c" />
      <div className="crt-liquid-neon__blob crt-liquid-neon__blob--d" />

      <svg
        className="crt-liquid-neon__svg crt-liquid-neon__ribbon"
        viewBox="0 0 400 320"
        preserveAspectRatio="xMidYMax slice"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="crtNeonG1" x1="0%" y1="50%" x2="100%" y2="50%">
            <stop offset="0%" stopColor="#ff3db5" />
            <stop offset="35%" stopColor="#7c4dff" />
            <stop offset="70%" stopColor="#2f7bff" />
            <stop offset="100%" stopColor="#00e8ff" />
          </linearGradient>
          <linearGradient id="crtNeonG2" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#5ef0ff" />
            <stop offset="40%" stopColor="#4a6fff" />
            <stop offset="100%" stopColor="#d14dff" />
          </linearGradient>
          <linearGradient id="crtNeonG3" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ff2d9b" />
            <stop offset="55%" stopColor="#b44dff" />
            <stop offset="100%" stopColor="#3d8fff" />
          </linearGradient>
          <filter id="crtNeonSoft" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="3.5" />
          </filter>
          <filter id="crtNeonGlow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="1.2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* soft fill layers */}
        <path
          fill="url(#crtNeonG1)"
          opacity="0.55"
          filter="url(#crtNeonSoft)"
          d="M-20 220 C40 180 90 250 150 210 C210 170 250 240 320 195 C380 155 420 220 440 200 L440 340 L-20 340 Z"
        >
          <animate
            attributeName="d"
            dur="13s"
            repeatCount="indefinite"
            values="
              M-20 220 C40 180 90 250 150 210 C210 170 250 240 320 195 C380 155 420 220 440 200 L440 340 L-20 340 Z;
              M-20 235 C50 195 100 265 160 225 C220 185 260 255 330 210 C385 170 420 235 440 215 L440 340 L-20 340 Z;
              M-20 210 C35 170 85 240 145 200 C205 160 245 230 315 185 C375 145 415 210 440 190 L440 340 L-20 340 Z;
              M-20 220 C40 180 90 250 150 210 C210 170 250 240 320 195 C380 155 420 220 440 200 L440 340 L-20 340 Z
            "
          />
        </path>

        <path
          fill="url(#crtNeonG2)"
          opacity="0.5"
          filter="url(#crtNeonSoft)"
          d="M-20 260 C60 230 110 290 180 250 C250 210 290 280 360 245 C400 225 430 260 440 250 L440 340 L-20 340 Z"
        >
          <animate
            attributeName="d"
            dur="16s"
            repeatCount="indefinite"
            values="
              M-20 260 C60 230 110 290 180 250 C250 210 290 280 360 245 C400 225 430 260 440 250 L440 340 L-20 340 Z;
              M-20 245 C55 215 100 275 170 235 C240 195 285 265 350 230 C395 210 425 250 440 240 L440 340 L-20 340 Z;
              M-20 270 C65 245 115 300 185 265 C255 225 295 290 365 255 C405 235 430 270 440 260 L440 340 L-20 340 Z;
              M-20 260 C60 230 110 290 180 250 C250 210 290 280 360 245 C400 225 430 260 440 250 L440 340 L-20 340 Z
            "
          />
        </path>

        {/* glowing ribbon edges */}
        <path
          fill="none"
          stroke="url(#crtNeonG2)"
          strokeWidth="2.2"
          opacity="0.85"
          filter="url(#crtNeonGlow)"
          d="M-10 195 C50 155 100 225 160 185 C220 145 270 215 340 170 C390 140 420 185 450 165"
        >
          <animate
            attributeName="d"
            dur="12s"
            repeatCount="indefinite"
            values="
              M-10 195 C50 155 100 225 160 185 C220 145 270 215 340 170 C390 140 420 185 450 165;
              M-10 210 C55 170 105 240 165 200 C225 160 275 230 345 185 C395 155 425 200 450 180;
              M-10 185 C45 145 95 215 155 175 C215 135 265 205 335 160 C385 130 415 175 450 155;
              M-10 195 C50 155 100 225 160 185 C220 145 270 215 340 170 C390 140 420 185 450 165
            "
          />
        </path>

        <path
          fill="none"
          stroke="url(#crtNeonG3)"
          strokeWidth="1.8"
          opacity="0.75"
          filter="url(#crtNeonGlow)"
          d="M-10 245 C70 210 120 275 190 235 C260 195 310 265 380 230 C420 210 440 245 460 235"
        >
          <animate
            attributeName="d"
            dur="15s"
            repeatCount="indefinite"
            values="
              M-10 245 C70 210 120 275 190 235 C260 195 310 265 380 230 C420 210 440 245 460 235;
              M-10 255 C75 220 125 285 195 245 C265 205 315 275 385 240 C425 220 445 255 460 245;
              M-10 235 C65 200 115 265 185 225 C255 185 305 255 375 220 C415 200 435 235 460 225;
              M-10 245 C70 210 120 275 190 235 C260 195 310 265 380 230 C420 210 440 245 460 235
            "
          />
        </path>

        <path
          fill="url(#crtNeonG3)"
          opacity="0.35"
          filter="url(#crtNeonSoft)"
          d="M280 40 C340 20 380 80 420 50 L420 180 C380 160 340 200 290 170 C250 145 260 70 280 40 Z"
        >
          <animate
            attributeName="d"
            dur="14s"
            repeatCount="indefinite"
            values="
              M280 40 C340 20 380 80 420 50 L420 180 C380 160 340 200 290 170 C250 145 260 70 280 40 Z;
              M290 55 C350 30 385 95 420 65 L420 195 C385 175 345 215 295 185 C255 160 270 85 290 55 Z;
              M270 30 C330 10 375 70 420 40 L420 170 C375 150 335 190 285 160 C245 135 250 60 270 30 Z;
              M280 40 C340 20 380 80 420 50 L420 180 C380 160 340 200 290 170 C250 145 260 70 280 40 Z
            "
          />
        </path>
      </svg>

      <div className="crt-liquid-neon__vignette" />
    </div>
  );
}
