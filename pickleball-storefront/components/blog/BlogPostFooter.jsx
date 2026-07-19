import React, { useRef, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next";
import { ChevronRight, ChevronLeft, CalendarDays } from "lucide-react";
import { mapPostToBase } from "@/lib/wordpress";
import {
  getBlogTopicLabel,
  getSiteProfile,
  formatWpDateLong,
} from "@/lib/blogMeta";

const BLUE = "#005caf";
const AUTOPLAY_MS = 3500;

function OutlineTag({ children }) {
  return (
    <span className="inline-flex items-center text-[11px] font-bold px-2 py-0.5 border border-[#005caf] text-[#005caf] rounded-sm bg-white whitespace-nowrap">
      {children}
    </span>
  );
}

function CircleArrow({ size = 20 }) {
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-full text-white"
      style={{ width: size, height: size, backgroundColor: BLUE }}
    >
      <ChevronRight size={size * 0.55} strokeWidth={3} />
    </span>
  );
}

/* —— 圖二風格：Pickup 卡片（圖、粗標題＋藍圈箭頭、標籤、日期）—— */
function PickupCard({ post, locale, topicLabel }) {
  const base = mapPostToBase(post);
  const dateLong = formatWpDateLong(post.date, locale);
  const category = base.categories?.[0];

  return (
    <Link
      href={`/blog/${base.slug}`}
      className="group block w-[272px] md:w-[320px] shrink-0 snap-start"
    >
      <div className="relative w-full aspect-[16/10] overflow-hidden rounded-md bg-gray-100 mb-4">
        <Image
          src={base.image}
          alt={base.title}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          unoptimized
          sizes="320px"
        />
      </div>
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="text-[15px] font-bold text-gray-900 leading-snug line-clamp-2 group-hover:text-[#005caf] transition-colors">
          {base.title}
        </h3>
        <CircleArrow size={22} />
      </div>
      <div className="flex flex-wrap gap-1.5 mb-2.5">
        {category && <OutlineTag>{category}</OutlineTag>}
        <OutlineTag>{topicLabel}</OutlineTag>
      </div>
      <p className="flex items-center gap-1.5 text-xs text-gray-500">
        <CalendarDays size={13} className="text-[#005caf] shrink-0" />
        {dateLong}
      </p>
    </Link>
  );
}

/* —— 自動輪播軌道：hover / 觸控時暫停，捲到底自動回開頭 —— */
function AutoCarousel({ children, ariaNext, ariaPrev }) {
  const trackRef = useRef(null);
  const pausedRef = useRef(false);

  const scrollStep = useCallback((dir) => {
    const el = trackRef.current;
    if (!el) return;
    const step = el.clientWidth * 0.8 * dir;
    if (dir > 0 && el.scrollLeft + el.clientWidth >= el.scrollWidth - 12) {
      el.scrollTo({ left: 0, behavior: "smooth" });
    } else {
      el.scrollBy({ left: step, behavior: "smooth" });
    }
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      if (!pausedRef.current) scrollStep(1);
    }, AUTOPLAY_MS);
    return () => clearInterval(id);
  }, [scrollStep]);

  const pause = () => {
    pausedRef.current = true;
  };
  const resume = () => {
    pausedRef.current = false;
  };

  return (
    <div className="relative">
      <div
        ref={trackRef}
        className="flex gap-6 overflow-x-auto snap-x snap-mandatory pb-2 [&::-webkit-scrollbar]:hidden"
        style={{ scrollbarWidth: "none" }}
        onMouseEnter={pause}
        onMouseLeave={resume}
        onTouchStart={pause}
        onTouchEnd={resume}
      >
        {children}
      </div>

      <button
        type="button"
        aria-label={ariaPrev}
        onClick={() => scrollStep(-1)}
        className="hidden md:flex absolute -left-4 top-[92px] w-9 h-9 rounded-full items-center justify-center text-white shadow-md hover:scale-110 transition-transform"
        style={{ backgroundColor: BLUE }}
      >
        <ChevronLeft size={18} />
      </button>
      <button
        type="button"
        aria-label={ariaNext}
        onClick={() => scrollStep(1)}
        className="hidden md:flex absolute -right-4 top-[92px] w-9 h-9 rounded-full items-center justify-center text-white shadow-md hover:scale-110 transition-transform"
        style={{ backgroundColor: BLUE }}
      >
        <ChevronRight size={18} />
      </button>
    </div>
  );
}

/* —— 圖三風格：文章清單列 —— */
function ListRow({ post, locale, topicLabel }) {
  const base = mapPostToBase(post);
  const dateLong = formatWpDateLong(post.date, locale);
  const category = base.categories?.[0];

  return (
    <Link
      href={`/blog/${base.slug}`}
      className="group block py-6 border-b border-gray-100 last:border-0"
    >
      <p className="text-xs font-bold text-gray-400 mb-1.5">{topicLabel}</p>
      <h3 className="text-base md:text-lg font-bold text-gray-900 leading-snug mb-3 group-hover:text-[#005caf] transition-colors">
        {base.title}
      </h3>
      {base.excerpt && (
        <p className="text-sm text-gray-500 leading-relaxed line-clamp-2 mb-3">
          {base.excerpt}
        </p>
      )}
      <div className="flex flex-wrap items-center gap-1.5">
        {category && <OutlineTag>{category}</OutlineTag>}
        <OutlineTag>{topicLabel}</OutlineTag>
        <span className="flex items-center gap-1 text-xs text-gray-400 ml-1">
          <CalendarDays size={12} className="text-[#005caf]" />
          {dateLong}
        </span>
      </div>
    </Link>
  );
}

/* —— 主元件 —— */
export default function BlogPostFooter({
  base,
  categoryKey,
  categoryLabel,
  listHref,
  latestPosts = [],
  recommendedPosts = [],
}) {
  const { t } = useTranslation("blog");
  const router = useRouter();
  const locale = router.locale || "zh-TW";
  const topicLabel = getBlogTopicLabel(categoryKey, locale);
  const siteProfile = getSiteProfile(locale);

  const otherCategoryKey = categoryKey === "knowledge" ? "active" : "knowledge";
  const otherListHref = `/blog?category=${otherCategoryKey}`;
  const otherTopicLabel = getBlogTopicLabel(otherCategoryKey, locale);

  const sidebarRows = [
    { label: t("footer.profile.labels.industry"), value: siteProfile.industry },
    { label: t("footer.profile.labels.region"), value: siteProfile.region },
    {
      label: t("footer.profile.labels.representative"),
      value: siteProfile.representative,
    },
  ];

  const socialLinks = [
    {
      name: "Facebook",
      href: "https://www.facebook.com/pikfun.tw",
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      ),
    },
    {
      name: "Instagram",
      href: "https://www.instagram.com/pikfun.tw",
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zm0 10.162a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
        </svg>
      ),
    },
    {
      name: "LINE",
      href: "https://line.me/R/ti/p/@pikfun",
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
          <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
        </svg>
      ),
    },
    {
      name: "Email",
      href: `mailto:${siteProfile.contact}`,
      icon: (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="w-4 h-4"
        >
          <rect x="2" y="4" width="20" height="16" rx="2" />
          <path d="m22 7-10 6L2 7" />
        </svg>
      ),
    },
  ];

  return (
    <div className="max-w-[1180px] mx-auto px-6">
      {/* ① 圖二風格：最新文章 Pickup 卡片自動輪播 */}
      {latestPosts.length > 0 && (
        <section className="pt-14">
          <p className="text-xs font-bold tracking-[0.15em] uppercase text-[#005caf] mb-2">
            Relevant Pickup Articles
          </p>
          <div className="flex items-end justify-between gap-4 mb-8">
            <h2 className="text-2xl md:text-3xl font-black text-gray-900">
              {t("footer.carousel.latest")}
            </h2>
            <Link
              href={listHref}
              className="text-xs font-bold text-[#005caf] hover:underline whitespace-nowrap"
            >
              {t("footer.carousel.viewMore")}
            </Link>
          </div>
          <AutoCarousel
            ariaNext={t("footer.carousel.nextAria")}
            ariaPrev={t("footer.carousel.nextAria")}
          >
            {latestPosts.slice(0, 10).map((p) => (
              <PickupCard
                key={p.id}
                post={p}
                locale={locale}
                topicLabel={topicLabel}
              />
            ))}
          </AutoCarousel>
        </section>
      )}

      {/* ② 圖三風格：推薦閱讀清單 + 右側站點資訊卡 */}
      <section className="mt-16 pt-12 border-t border-gray-100">
        <p className="text-xs font-bold tracking-[0.15em] uppercase text-[#005caf] mb-2">
          Recommended Reading
        </p>
        <h2 className="text-2xl md:text-3xl font-black text-gray-900 mb-2">
          {t("footer.carousel.recommended")}
        </h2>
        <div className="w-12 h-1 mb-8" style={{ backgroundColor: BLUE }} />

        <div className="grid lg:grid-cols-[1fr_300px] gap-12 items-start">
          <div className="min-w-0">
            {recommendedPosts.slice(0, 5).map((p) => (
              <ListRow
                key={p.id}
                post={p}
                locale={locale}
                topicLabel={otherTopicLabel}
              />
            ))}
            <div className="pt-6">
              <Link
                href={otherListHref}
                className="inline-flex items-center gap-2 text-sm font-bold text-[#005caf] hover:underline"
              >
                {t("footer.carousel.viewMore")}
                <CircleArrow size={20} />
              </Link>
            </div>
          </div>

          {/* 右側資訊卡（圖三側欄風格） */}
          <aside className="lg:sticky lg:top-28 border border-gray-200 rounded-lg overflow-hidden bg-white">
            <div className="p-6 pb-5 text-center border-b border-gray-100">
              <div className="flex justify-center mb-3">
                <Image
                  src={siteProfile.logo}
                  alt={siteProfile.name}
                  width={120}
                  height={48}
                  className="object-contain max-h-12"
                  unoptimized
                />
              </div>
              <p className="text-sm font-black text-gray-900">
                {siteProfile.name}
              </p>
              <a
                href={siteProfile.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] text-gray-400 hover:text-[#005caf] break-all"
              >
                {siteProfile.url}
              </a>
            </div>

            <ul className="px-6 py-5 space-y-3">
              {sidebarRows.map((row) => (
                <li key={row.label} className="flex items-start gap-2 text-xs">
                  <span
                    className="mt-1 inline-block w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: BLUE }}
                  />
                  <span className="font-bold text-gray-700 whitespace-nowrap">
                    {row.label}
                  </span>
                  <span className="text-gray-500 min-w-0 break-all">
                    {row.value}
                  </span>
                </li>
              ))}
              <li className="flex items-center gap-2 text-xs">
                <span
                  className="inline-block w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: BLUE }}
                />
                <span className="font-bold text-gray-700 whitespace-nowrap">
                  {t("footer.profile.labels.contact")}
                </span>
                <span className="flex items-center gap-1.5">
                  {socialLinks.map((s) => (
                    <a
                      key={s.name}
                      href={s.href}
                      target={s.href.startsWith("mailto:") ? undefined : "_blank"}
                      rel="noopener noreferrer"
                      aria-label={s.name}
                      title={s.name}
                      className="w-7 h-7 rounded-full flex items-center justify-center text-white hover:opacity-85 transition-opacity"
                      style={{ backgroundColor: BLUE }}
                    >
                      {s.icon}
                    </a>
                  ))}
                </span>
              </li>
            </ul>

            <div className="px-6 pb-6 space-y-3">
              <Link
                href={`/register?redirect=${encodeURIComponent(`/blog/${base.slug}`)}`}
                className="flex items-center justify-center gap-2 w-full bg-[#005caf] text-white text-sm font-bold rounded-md py-3.5 hover:opacity-90 transition-opacity"
              >
                {t("footer.cta.registerBtn")}
                <ChevronRight size={16} strokeWidth={3} />
              </Link>
              <Link
                href={`/login?redirect=${encodeURIComponent(`/blog/${base.slug}`)}`}
                className="flex items-center justify-center w-full border border-gray-300 text-gray-700 text-sm font-bold rounded-md py-3 hover:border-[#005caf] hover:text-[#005caf] transition-colors"
              >
                {t("footer.cta.loginBtn")}
              </Link>
              <p className="text-[11px] text-gray-400 leading-relaxed">
                {t("footer.cta.note")}
              </p>
            </div>
          </aside>
        </div>
      </section>

      {/* ③ 底部麵包屑 */}
      <nav
        className="mt-16 pt-6 border-t border-gray-100 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-gray-500"
        aria-label={t("breadcrumbAria")}
      >
        <Link href="/" className="text-[#005caf] hover:underline">
          {t("footer.bottomCrumb.home")}
        </Link>
        <span aria-hidden> &gt; </span>
        <Link href={listHref} className="text-[#005caf] hover:underline">
          {categoryLabel}
        </Link>
        <span aria-hidden> &gt; </span>
        <span className="truncate max-w-[240px] md:max-w-md">{base.title}</span>
      </nav>
    </div>
  );
}
