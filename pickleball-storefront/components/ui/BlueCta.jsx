"use client";

import Link from "next/link";
import { ChevronRight, Loader2 } from "lucide-react";

export const BLUE = "#005caf";

/** 圖一風格：藍圓箭頭 + 底線文字；可選 confetti 點擊噴彩帶後再導向 */
export function BlueArrowLink({
  href,
  children,
  className = "",
  onClick,
  type,
  confetti = false,
}) {
  const inner = (
    <>
      <span
        className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-white transition-transform group-hover:translate-x-0.5"
        style={{ backgroundColor: BLUE }}
      >
        <ChevronRight size={14} strokeWidth={3} />
      </span>
      <span
        className="font-bold underline underline-offset-4 decoration-1"
        style={{ color: BLUE }}
      >
        {children}
      </span>
    </>
  );

  const cls = `group inline-flex items-center gap-2 text-sm ${className}`;

  const handleClick = (e) => {
    if (confetti && typeof window !== "undefined") {
      e.preventDefault();
      const el = e.currentTarget;
      import("@/lib/fireCelebrationConfetti").then(
        ({ fireCelebrationConfettiFromElement }) => {
          fireCelebrationConfettiFromElement(el);
          setTimeout(() => {
            if (onClick) onClick(e);
            else if (href) window.location.href = href;
          }, 500);
        },
      );
      return;
    }
    onClick?.(e);
  };

  if (href) {
    return (
      <Link href={href} className={cls} onClick={handleClick}>
        {inner}
      </Link>
    );
  }

  return (
    <button type={type || "button"} className={cls} onClick={handleClick}>
      {inner}
    </button>
  );
}

/** 主操作按鈕：藍底白字膠囊（送出／核准） */
export function BluePillButton({
  children,
  onClick,
  disabled,
  type = "button",
  loading,
  className = "",
  variant = "solid",
}) {
  if (variant === "outline") {
    return (
      <button
        type={type}
        onClick={onClick}
        disabled={disabled || loading}
        className={`inline-flex items-center justify-center gap-1.5 rounded-full border-2 border-[#005caf] px-5 py-2.5 text-sm font-bold text-[#005caf] transition-colors disabled:opacity-50 ${className}`}
      >
        {loading && <Loader2 className="animate-spin" size={15} />}
        {children}
      </button>
    );
  }

  if (variant === "ghost") {
    return (
      <button
        type={type}
        onClick={onClick}
        disabled={disabled || loading}
        className={`inline-flex items-center justify-center gap-1.5 rounded-full px-4 py-2 text-sm font-bold text-gray-500 underline-offset-4 hover:underline disabled:opacity-50 ${className}`}
      >
        {children}
      </button>
    );
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-1.5 rounded-full bg-[#005caf] px-5 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50 ${className}`}
    >
      {loading && <Loader2 className="animate-spin" size={15} />}
      {children}
    </button>
  );
}

/** 膠囊分段 Tab：白底描邊容器 + 藍底選中（淺色藍系） */
export function BluePillTabs({ tabs, value, onChange, className = "" }) {
  return (
    <div
      className={`inline-flex max-w-full flex-wrap items-center gap-0.5 rounded-full border border-[#d7e3f2] bg-white p-1 shadow-[0_2px_10px_rgba(0,92,175,0.08)] ${className}`}
      role="tablist"
    >
      {tabs.map((tab) => {
        const active = value === tab.value;
        return (
          <button
            key={tab.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(tab.value)}
            className={`rounded-full px-4 py-2.5 text-sm font-bold transition-all ${
              active
                ? "text-white shadow-sm"
                : "text-gray-500 hover:text-[#005caf]"
            }`}
            style={active ? { backgroundColor: BLUE } : undefined}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
