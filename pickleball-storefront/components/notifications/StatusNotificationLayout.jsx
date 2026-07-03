"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

const DEEP_BLUE = "#0B2D6E";
const BAND_BLUE = "#3D8FD9";

/** 圖6 風格：深藍底 + 大標 watermark + 細框卡片 */
export function StatusNotificationLayout({
  watermark = "NOTICE",
  eyebrow,
  title,
  subtitle,
  children,
  footer = null,
}) {
  return (
    <main
      className="relative min-h-screen overflow-hidden text-white"
      style={{ backgroundColor: DEEP_BLUE }}
    >
      <div
        className="absolute inset-0 pointer-events-none opacity-40"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)
          `,
          backgroundSize: "48px 48px",
        }}
      />

      <div
        className="absolute right-[-4%] top-1/2 -translate-y-1/2 font-black leading-none pointer-events-none select-none text-[clamp(5rem,18vw,14rem)] tracking-tight"
        style={{ WebkitTextStroke: "1px rgba(255,255,255,0.1)", color: "transparent" }}
        aria-hidden
      >
        {watermark}
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen max-w-3xl flex-col justify-center px-6 py-24 md:px-10">
        {eyebrow && (
          <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.35em] text-white/55">
            {eyebrow}
          </p>
        )}
        {title && (
          <h1 className="text-3xl font-bold leading-tight tracking-wide md:text-[2.25rem]">
            {title}
          </h1>
        )}
        {subtitle && (
          <p className="mt-4 max-w-lg text-sm leading-relaxed text-white/70 md:text-[15px]">
            {subtitle}
          </p>
        )}

        <div className="mt-10">{children}</div>
        {footer && <div className="mt-8">{footer}</div>}
      </div>
    </main>
  );
}

/** 圖5 風格：亮藍色三欄步驟帶 */
export function StatusStepsBand({ steps }) {
  return (
    <div
      className="grid gap-0 border border-white/15 md:grid-cols-3"
      style={{ backgroundColor: BAND_BLUE }}
    >
      {steps.map((step, i) => (
        <div
          key={step.label}
          className={`px-6 py-8 ${i < steps.length - 1 ? "md:border-r md:border-white/20" : ""} ${i < steps.length - 1 ? "border-b border-white/20 md:border-b-0" : ""}`}
        >
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/60">
            STEP
          </p>
          <p className="mt-1 text-4xl font-extralight tracking-wider text-white/90">
            {String(i + 1).padStart(2, "0")}
          </p>
          <div className="mt-5 flex h-14 w-14 items-center justify-center rounded-full border border-white/30 bg-white/10 text-xl">
            {step.icon}
          </div>
          <p className="mt-4 text-sm font-bold leading-snug">{step.label}</p>
          {step.desc && (
            <p className="mt-2 text-xs leading-relaxed text-white/75">{step.desc}</p>
          )}
        </div>
      ))}
    </div>
  );
}

/** 圖6 風格：細框行動卡片 */
export function StatusActionCard({
  href,
  external = false,
  icon,
  title,
  subtitle,
  accent = "#06C755",
}) {
  const inner = (
    <>
      <span
        className="flex h-12 w-12 shrink-0 items-center justify-center text-lg"
        style={{ backgroundColor: `${accent}22`, border: `1px solid ${accent}55` }}
      >
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-bold leading-snug">{title}</span>
        {subtitle && (
          <span className="mt-1 block text-xs text-white/60">{subtitle}</span>
        )}
      </span>
      <span className="flex h-10 w-10 shrink-0 items-center justify-center border border-white/35 transition-colors group-hover:bg-white/10">
        <ArrowRight size={16} />
      </span>
    </>
  );

  const className =
    "group flex w-full items-center gap-4 border border-white/25 px-5 py-4 text-left transition-colors hover:bg-white/5";

  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
        {inner}
      </a>
    );
  }

  return (
    <Link href={href} className={className}>
      {inner}
    </Link>
  );
}

/** 細框資訊面板（loading / error 用） */
export function StatusPanel({ children, variant = "default" }) {
  const border =
    variant === "error"
      ? "border-red-400/40"
      : variant === "loading"
        ? "border-white/25"
        : "border-white/25";

  return (
    <div className={`border ${border} bg-white/[0.04] px-6 py-8 backdrop-blur-sm`}>
      {children}
    </div>
  );
}

/** 文字連結 + 方框箭頭 */
export function StatusTextLink({ href, children }) {
  return (
    <Link
      href={href}
      className="group inline-flex items-center gap-3 text-sm font-bold tracking-wide text-white/80 transition-colors hover:text-white"
    >
      {children}
      <span className="flex h-8 w-8 items-center justify-center border border-white/35 transition-colors group-hover:bg-white/10">
        <ArrowRight size={14} />
      </span>
    </Link>
  );
}

export { DEEP_BLUE, BAND_BLUE };
