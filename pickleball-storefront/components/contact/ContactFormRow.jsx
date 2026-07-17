/** 左標籤／右輸入列 — 對齊 eISM 聯絡表單設計 */
import { CONTACT_UI } from "@/lib/contactUi";

export default function ContactFormRow({
  label,
  required,
  optional,
  hint,
  children,
  className = "",
}) {
  return (
    <div
      className={`grid grid-cols-1 md:grid-cols-[minmax(140px,200px)_minmax(0,1fr)] border-b border-slate-200 last:border-b-0 bg-white ${className}`}
    >
      <div className="px-4 py-4 md:py-5 md:bg-slate-50/80 flex flex-col justify-center gap-1.5 min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-bold text-slate-800">{label}</span>
          {required && (
            <span
              className="text-[10px] font-bold text-white px-1.5 py-0.5 leading-none"
              style={{ backgroundColor: CONTACT_UI.primary }}
            >
              必須
            </span>
          )}
          {optional && (
            <span className="text-[10px] font-medium text-slate-500 bg-slate-100 px-1.5 py-0.5 leading-none">
              任意
            </span>
          )}
        </div>
        {hint && (
          <p className="text-[11px] text-slate-400 leading-relaxed">{hint}</p>
        )}
      </div>
      <div className="px-4 py-4 md:py-5 min-w-0 max-w-full overflow-hidden">
        {children}
      </div>
    </div>
  );
}

export const inputClass =
  "w-full max-w-full box-border border border-slate-200 rounded-sm px-3 py-2.5 text-sm text-slate-800 bg-white placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-[#005caf]/25 focus:border-[#005caf]";

export const selectClass = inputClass;

export const textareaClass = `${inputClass} resize-y min-h-[120px]`;
