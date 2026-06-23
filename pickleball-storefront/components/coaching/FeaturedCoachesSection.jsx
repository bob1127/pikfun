"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import FeaturedCoachCard from "./FeaturedCoachCard";

export default function FeaturedCoachesSection() {
  const [coaches, setCoaches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTag, setActiveTag] = useState(null);

  useEffect(() => {
    fetch("/api/featured-coaches")
      .then((res) => res.json())
      .then((data) => setCoaches(data.coaches || []))
      .catch(() => setCoaches([]))
      .finally(() => setLoading(false));
  }, []);

  const allTags = [...new Set(coaches.flatMap((c) => c.tags || []))].slice(
    0,
    10
  );

  const displayCoaches = activeTag
    ? coaches.filter((c) => (c.tags || []).includes(activeTag))
    : coaches;

  return (
    <section className="mt-20 pt-16 border-t border-dashed border-gray-400/60">
      <header className="text-center mb-12">
        <p className="text-[10px] md:text-xs font-black tracking-[0.3em] text-gray-500 uppercase mb-3">
          Featured Coaches
        </p>
        <h2 className="text-3xl md:text-5xl font-black text-black tracking-tight uppercase mb-3">
          WHAT&apos;S NEW
        </h2>
        <p className="text-sm text-gray-600 mb-6">進駐 PikPie 官網的教練資訊</p>
        <Link
          href="/coaching/apply"
          className="inline-flex items-center gap-2 bg-black hover:bg-gray-800 text-white font-bold px-6 py-3 rounded-md transition-colors"
        >
          我是教練，申請進駐 PikPie 官網
          <ChevronRight size={16} />
        </Link>
      </header>

      {loading ? (
        <div className="text-center py-16 text-gray-500">載入教練資訊中...</div>
      ) : coaches.length === 0 ? (
        <div className="text-center py-16 text-gray-500 border border-dashed border-gray-400 rounded-lg">
          教練資訊即將上線
        </div>
      ) : (
        <>
          {/* 單行橫向捲動，doda 三欄卡片風格 */}
          <div className="mb-12 -mx-6 md:-mx-10 px-6 md:px-10">
            <div className="flex gap-0 overflow-x-auto scrollbar-hide pb-2 snap-x snap-mandatory">
              {displayCoaches.map((coach, i) => (
                <div
                  key={coach.slug}
                  className={`shrink-0 w-[72vw] sm:w-[280px] md:w-[300px] lg:w-[calc(33.333%-1rem)] snap-start ${
                    i !== displayCoaches.length - 1
                      ? "border-r border-dashed border-gray-400/70 pr-6 md:pr-8 mr-6 md:mr-8"
                      : ""
                  }`}
                >
                  <FeaturedCoachCard coach={coach} index={i} />
                </div>
              ))}
            </div>
          </div>

          {allTags.length > 0 && (
            <div className="border-t border-dashed border-gray-400/60 pt-10">
              <p className="text-sm font-black text-black mb-4">注目タグ</p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTag(null)}
                  className={`text-xs font-bold px-4 py-2 rounded-full border transition-colors ${
                    !activeTag
                      ? "bg-black text-white border-black"
                      : "border-gray-300 text-gray-600 hover:border-black"
                  }`}
                >
                  全部
                </button>
                {allTags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() =>
                      setActiveTag(activeTag === tag ? null : tag)
                    }
                    className={`text-xs font-bold px-4 py-2 rounded-full border transition-colors ${
                      activeTag === tag
                        ? "bg-black text-white border-black"
                        : "border-gray-300 text-gray-600 hover:border-black"
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </section>
  );
}
