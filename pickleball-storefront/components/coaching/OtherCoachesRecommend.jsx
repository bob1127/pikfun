"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useTranslation } from "next-i18next";
import { ChevronLeft, ChevronRight } from "lucide-react";

const ACCENT = "#3366CC";

function CoachRecommendCard({ coach }) {
  const { t } = useTranslation("coaching");
  const href = `/coaching/coach/${coach.slug}`;
  const badge =
    coach.featured_label || coach.region || t("featured.other_coaches.fallback_badge");
  const metaLeft =
    coach.city ||
    coach.title?.split("·").pop()?.trim() ||
    t("featured.other_coaches.fallback_meta_left");
  const metaRight =
    coach.subtitle?.slice(0, 12) ||
    (coach.tags?.[0]
      ? coach.tags[0]
      : t("featured.other_coaches.fallback_meta_right"));

  return (
    <Link
      href={href}
      className="group block shrink-0 w-[260px] sm:w-[280px] snap-start"
    >
      <div className="relative rounded-xl overflow-hidden aspect-[4/3] bg-gray-100">
        <img
          src={coach.cover_image || coach.avatar}
          alt={coach.name}
          className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500"
        />
        <span
          className="absolute top-3 right-3 text-[10px] font-bold text-white px-2.5 py-1 rounded-full"
          style={{ backgroundColor: ACCENT }}
        >
          {badge}
        </span>
        <div className="absolute -bottom-5 left-4 z-10">
          {coach.avatar ? (
            <img
              src={coach.avatar}
              alt={coach.name}
              className="w-12 h-12 rounded-full object-cover border-[3px] border-white shadow-md bg-white"
            />
          ) : (
            <div
              className="w-12 h-12 rounded-full border-[3px] border-white shadow-md flex items-center justify-center text-white font-bold text-lg"
              style={{ backgroundColor: ACCENT }}
            >
              {coach.name?.charAt(0)}
            </div>
          )}
        </div>
      </div>

      <div className="pt-7 px-1">
        <h3 className="font-bold text-[#1a2d4a] text-sm leading-snug line-clamp-2 min-h-[2.5rem] group-hover:text-[#3366CC] transition-colors">
          {coach.excerpt || coach.name}
        </h3>
        <div className="my-3 border-b border-dotted border-gray-300" />
        <p className="text-xs text-gray-500">
          <span className="text-[#1a2d4a] font-medium">{metaLeft}</span>
          <span className="mx-2 text-gray-300">|</span>
          <span>{metaRight}</span>
        </p>
      </div>
    </Link>
  );
}

/**
 * 圖：OTHER INTERVIEW 風格 — 其他教練推薦橫向輪播
 */
export default function OtherCoachesRecommend({
  excludeCoachName = "",
  sectionId = "section-other-coaches",
}) {
  const { t } = useTranslation("coaching");
  const scrollRef = useRef(null);
  const [coaches, setCoaches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/featured-coaches")
      .then((res) => res.json())
      .then((data) => {
        const list = (data.coaches || []).filter((c) => {
          if (!excludeCoachName) return true;
          return c.name?.trim() !== excludeCoachName?.trim();
        });
        setCoaches(list.slice(0, 8));
      })
      .catch(() => setCoaches([]))
      .finally(() => setLoading(false));
  }, [excludeCoachName]);

  const scroll = useCallback((dir) => {
    const el = scrollRef.current;
    if (!el) return;
    const step = el.clientWidth * 0.85;
    el.scrollBy({ left: dir * step, behavior: "smooth" });
  }, []);

  if (loading) return null;
  if (coaches.length === 0) return null;

  return (
    <section
      id={sectionId}
      className="scroll-mt-28 py-16 md:py-20 border-t border-gray-200"
    >
      <h2 className="text-2xl md:text-3xl font-bold text-[#1a2d4a] mb-10">
        {t("featured.other_coaches.title")}
      </h2>

      <div
        ref={scrollRef}
        className="flex gap-6 md:gap-8 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-2 -mx-1 px-1"
      >
        {coaches.map((coach) => (
          <CoachRecommendCard key={coach.slug} coach={coach} />
        ))}
      </div>

      <div className="flex items-center justify-between mt-8 pt-4">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => scroll(-1)}
            className="flex h-9 w-9 items-center justify-center rounded-full text-white transition-opacity hover:opacity-85"
            style={{ backgroundColor: ACCENT }}
            aria-label={t("featured.other_coaches.prev_aria")}
          >
            <ChevronLeft size={18} strokeWidth={2.5} />
          </button>
          <button
            type="button"
            onClick={() => scroll(1)}
            className="flex h-9 w-9 items-center justify-center rounded-full text-white transition-opacity hover:opacity-85"
            style={{ backgroundColor: ACCENT }}
            aria-label={t("featured.other_coaches.next_aria")}
          >
            <ChevronRight size={18} strokeWidth={2.5} />
          </button>
        </div>

        <Link
          href="/coaching#featured-coaches"
          className="inline-flex items-center gap-3 text-sm font-bold text-[#1a2d4a] hover:text-[#3366CC] transition-colors group"
        >
          {t("featured.other_coaches.view_all")}
          <span
            className="flex h-10 w-10 items-center justify-center rounded-full text-white group-hover:scale-105 transition-transform"
            style={{ backgroundColor: ACCENT }}
          >
            <ChevronRight size={18} />
          </span>
        </Link>
      </div>
    </section>
  );
}
