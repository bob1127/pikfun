"use client";

// 日期卡片與月曆選擇器（揪團建立頁 / 詳情頁共用）
import React, { useEffect, useState } from "react";
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";

function ordinalSuffix(day) {
  const mod100 = day % 100;
  if (mod100 >= 11 && mod100 <= 13) return "th";
  return { 1: "st", 2: "nd", 3: "rd" }[day % 10] || "th";
}

function toDateObj(value) {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function toDateStr(d) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/**
 * 小日期卡（圖二樣式）：靛藍色頭部（英文月份）＋大字日期＋年份
 */
export function MiniDateCard({ date, className = "", chinese = false }) {
  const d = toDateObj(date);
  if (!d) return null;
  const month = chinese
    ? `${d.getMonth() + 1}月`
    : d.toLocaleString("en-US", { month: "long" }).toUpperCase();
  const day = d.getDate();

  return (
    <div
      className={`w-[168px] shrink-0 overflow-hidden rounded-2xl border-2 border-[#5b6cfa] bg-white shadow-sm ${className}`}
    >
      <div className="flex items-center justify-between bg-[#5b6cfa] px-4 py-2">
        <span className="text-sm font-bold tracking-wide text-white">
          {month}
        </span>
        <ArrowLeft size={16} className="text-white/90" />
      </div>
      <div className="flex flex-col items-center px-4 pb-3 pt-5">
        <span className="text-5xl font-bold leading-none tracking-tight text-[#1e2456]">
          {day}
          <span className={chinese ? "ml-1 text-2xl" : "text-4xl"}>
            {chinese ? "日" : ordinalSuffix(day)}
          </span>
        </span>
        <span className="mt-4 text-xs font-medium text-[#3a3f5c]">
          {d.getFullYear()}
        </span>
      </div>
    </div>
  );
}

/**
 * 日期選擇器（圖一樣式）：左邊小日期卡 + 右邊月曆
 * @param {string} value  已選日期 "YYYY-MM-DD"
 * @param {string} [min]  可選的最早日期 "YYYY-MM-DD"
 * @param {Function} onChange  (dateStr) => void
 */
export function DateCardPicker({ value, min, onChange, chinese = false }) {
  const selected = toDateObj(value);
  const minDate = toDateObj(min);
  const [view, setView] = useState(() => {
    const base = selected || new Date();
    return { year: base.getFullYear(), month: base.getMonth() };
  });

  // 外部選取日期變動時，讓月曆跳到該月份
  useEffect(() => {
    if (selected) {
      setView({ year: selected.getFullYear(), month: selected.getMonth() });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const monthLabel = chinese
    ? `${view.year}年 ${view.month + 1}月`
    : new Date(view.year, view.month, 1).toLocaleString("en-US", {
        month: "short",
        year: "numeric",
      });
  const weekdays = chinese
    ? ["日", "一", "二", "三", "四", "五", "六"]
    : ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const firstWeekday = new Date(view.year, view.month, 1).getDay();
  const daysInMonth = new Date(view.year, view.month + 1, 0).getDate();

  const shiftMonth = (delta) => {
    setView((prev) => {
      const d = new Date(prev.year, prev.month + delta, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });
  };

  const isDisabled = (day) => {
    if (!minDate) return false;
    const d = new Date(view.year, view.month, day);
    const m = new Date(
      minDate.getFullYear(),
      minDate.getMonth(),
      minDate.getDate(),
    );
    return d < m;
  };

  const isSelected = (day) =>
    selected &&
    selected.getFullYear() === view.year &&
    selected.getMonth() === view.month &&
    selected.getDate() === day;

  return (
    <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center">
      <MiniDateCard
        date={selected || new Date(view.year, view.month, 1)}
        chinese={chinese}
      />

      <div className="w-full max-w-[300px] rounded-xl border border-[#d7dbea] bg-white px-4 py-3 shadow-sm">
        <div className="mb-1 flex items-center justify-between">
          <button
            type="button"
            onClick={() => shiftMonth(-1)}
            className="rounded p-1 text-[#1e2456] transition-colors hover:bg-gray-100"
            aria-label={chinese ? "上個月" : "Previous month"}
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-[15px] font-bold text-[#1e2456]">
            {monthLabel}
          </span>
          <button
            type="button"
            onClick={() => shiftMonth(1)}
            className="rounded p-1 text-[#1e2456] transition-colors hover:bg-gray-100"
            aria-label={chinese ? "下個月" : "Next month"}
          >
            <ChevronRight size={16} />
          </button>
        </div>

        <div className="grid grid-cols-7 text-center">
          {weekdays.map((w) => (
            <span
              key={w}
              className="py-1 text-[11px] font-semibold text-[#3a3f5c]"
            >
              {w}
            </span>
          ))}
          {Array.from({ length: firstWeekday }).map((_, i) => (
            <span key={`empty-${i}`} />
          ))}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const disabled = isDisabled(day);
            const active = isSelected(day);
            return (
              <button
                key={day}
                type="button"
                disabled={disabled}
                onClick={() =>
                  onChange(toDateStr(new Date(view.year, view.month, day)))
                }
                className={`mx-auto my-[2px] flex h-7 w-7 items-center justify-center rounded-md text-[13px] transition-colors ${
                  active
                    ? "border border-[#1e2456] bg-[#3b5bfd] font-bold text-white"
                    : disabled
                      ? "cursor-not-allowed text-gray-300"
                      : "text-[#1e2456] hover:bg-[#eef1ff]"
                }`}
              >
                {day}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
