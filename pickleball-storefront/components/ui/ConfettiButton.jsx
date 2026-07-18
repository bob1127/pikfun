"use client";

import { useState, useRef, useCallback } from "react";
import { useTranslation } from "next-i18next";
import { fireCelebrationConfettiFromElement } from "@/lib/fireCelebrationConfetti";

/**
 * ConfettiButton — 可重用的送出成功按鈕
 *
 * Props:
 *   onClick      async () => any   點擊執行的非同步函數，throw 即視為失敗
 *   children                       按鈕預設文字
 *   successLabel                   成功後顯示的文字（預設："完成！"）
 *   resetAfter   number (ms)       幾毫秒後自動重置回 idle（預設不重置）
 *   confettiOpts object            canvas-confetti 的額外選項
 *   disabled     boolean
 *   className    string            外層 className（會附加在 .cfb-btn 之後）
 *   type         "button"|"submit" 預設 "button"
 */
export default function ConfettiButton({
  onClick,
  children,
  successLabel,
  resetAfter,
  confettiOpts = {},
  disabled = false,
  className = "",
  type = "button",
  style,
  ...rest
}) {
  const { t } = useTranslation("common");
  const resolvedChildren = children ?? t("actions.submit");
  const resolvedSuccessLabel = successLabel ?? t("actions.done");
  const [phase, setPhase] = useState("idle"); // idle | loading | success | error
  const btnRef = useRef(null);
  const resetTimer = useRef(null);

  const fireConfetti = useCallback(() => {
    fireCelebrationConfettiFromElement(btnRef.current, confettiOpts);
  }, [confettiOpts]);

  const handleClick = useCallback(
    async (e) => {
      if (phase === "loading" || phase === "success" || disabled) return;
      if (!onClick) return;

      setPhase("loading");
      clearTimeout(resetTimer.current);

      try {
        await onClick(e);
        setPhase("success");
        fireConfetti();

        if (resetAfter != null) {
          resetTimer.current = setTimeout(() => setPhase("idle"), resetAfter);
        }
      } catch (err) {
        setPhase("error");
        // brief flash then reset — 不往外拋，避免 Next.js Unhandled Runtime Error
        resetTimer.current = setTimeout(() => setPhase("idle"), 1500);
        console.warn("[ConfettiButton]", err?.message || err);
      }
    },
    [phase, disabled, onClick, fireConfetti, resetAfter]
  );

  const isDisabled = disabled || phase === "loading" || phase === "success";

  return (
    <>
      <button
        ref={btnRef}
        type={type}
        disabled={isDisabled}
        onClick={handleClick}
        className={`cfb-btn cfb-phase-${phase} ${className}`}
        style={style}
        {...rest}
      >
        {phase === "loading" && (
          <span className="cfb-dots" aria-label={t("actions.loading")}>
            <span className="cfb-dot" style={{ animationDelay: "0s" }} />
            <span className="cfb-dot" style={{ animationDelay: "0.15s" }} />
            <span className="cfb-dot" style={{ animationDelay: "0.3s" }} />
          </span>
        )}
        {phase === "success" && (
          <span className="cfb-success-content">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="cfb-check"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
            {resolvedSuccessLabel}
          </span>
        )}
        {phase === "error" && (
          <span className="cfb-error-content">{t("actions.retry")}</span>
        )}
        {(phase === "idle") && resolvedChildren}
      </button>

      <style jsx global>{`
        .cfb-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          border: none;
          cursor: pointer;
          transition: opacity 0.2s, transform 0.15s, background 0.3s;
          position: relative;
          overflow: hidden;
          user-select: none;
          -webkit-tap-highlight-color: transparent;
        }
        .cfb-btn:not(:disabled):active {
          transform: scale(0.97);
        }
        .cfb-btn:disabled {
          cursor: not-allowed;
        }
        .cfb-btn.cfb-phase-loading {
          opacity: 0.9;
        }
        .cfb-btn.cfb-phase-success {
          opacity: 1;
        }
        .cfb-btn.cfb-phase-error {
          background: #ef4444 !important;
        }

        /* — bouncing dots — */
        .cfb-dots {
          display: inline-flex;
          align-items: center;
          gap: 5px;
        }
        .cfb-dot {
          width: 8px;
          height: 8px;
          background: #c8f542;
          border-radius: 50%;
          animation: cfb-bounce 0.6s ease-in-out infinite alternate;
        }
        @keyframes cfb-bounce {
          0%   { transform: translateY(0);    opacity: 1; }
          100% { transform: translateY(-7px); opacity: 0.7; }
        }

        /* — success checkmark draw — */
        .cfb-success-content {
          display: inline-flex;
          align-items: center;
          gap: 0.375rem;
          animation: cfb-pop 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .cfb-check {
          animation: cfb-draw 0.4s ease forwards;
          stroke-dasharray: 30;
          stroke-dashoffset: 30;
        }
        @keyframes cfb-draw {
          to { stroke-dashoffset: 0; }
        }
        @keyframes cfb-pop {
          0%   { transform: scale(0.7); opacity: 0; }
          100% { transform: scale(1);   opacity: 1; }
        }

        .cfb-error-content {
          animation: cfb-shake 0.4s ease;
        }
        @keyframes cfb-shake {
          0%,100% { transform: translateX(0); }
          20%,60% { transform: translateX(-4px); }
          40%,80% { transform: translateX(4px); }
        }
      `}</style>
    </>
  );
}
