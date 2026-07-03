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
    10,
  );

  const displayCoaches = activeTag
    ? coaches.filter((c) => (c.tags || []).includes(activeTag))
    : coaches;

  return (
    <section className="mt-20 pt-16 border-t border-gray-200">
      <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12">
        <div>
          <p className="text-[10px] font-bold tracking-[0.35em] text-[#3366CC] uppercase mb-3">
            Featured Coaches
          </p>
          <h2 className="text-3xl md:text-4xl font-bold text-[#1a2d4a] tracking-tight">
            進駐教練
          </h2>
          <p className="text-sm text-gray-500 mt-2">PikFun 官網認證教練資訊</p>
        </div>
        <Link
          href="/coaching/apply"
          className="inline-flex items-center gap-2 bg-[#1a2d4a] hover:bg-[#0f1f35] text-white font-bold px-6 py-3 rounded-full transition-colors text-sm shrink-0"
        >
          教練進駐申請
          <ChevronRight size={16} />
        </Link>
      </header>

      {loading ? (
        <div className="text-center py-16 text-gray-500">載入教練資訊中...</div>
      ) : coaches.length === 0 ? (
        <div className="text-center py-16 text-gray-500 border border-gray-200 rounded-xl bg-white">
          教練資訊即將上線
        </div>
      ) : (
        <>
          <div className="-mx-2 px-2 overflow-x-auto scrollbar-hide pb-2">
            <div className="flex gap-6 min-w-min">
              {displayCoaches.map((coach, i) => (
                <div
                  key={coach.slug}
                  className="shrink-0 w-[72vw] sm:w-[280px] md:w-[300px]"
                >
                  <FeaturedCoachCard coach={coach} index={i} />
                </div>
              ))}
            </div>
          </div>

          {allTags.length > 0 && (
            <div className="border-t border-gray-200 pt-10 mt-12">
              <p className="text-sm font-bold text-[#1a2d4a] mb-4">【注目標籤】</p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTag(null)}
                  className={`text-xs font-bold px-4 py-2 rounded-full border transition-colors ${
                    !activeTag
                      ? "bg-[#3366CC] text-white border-[#3366CC]"
                      : "border-gray-200 text-gray-600 hover:border-[#3366CC] bg-white"
                  }`}
                >
                  全部
                </button>
                {allTags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => setActiveTag(tag)}
                    className={`text-xs font-bold px-4 py-2 rounded-full border transition-colors ${
                      activeTag === tag
                        ? "bg-[#3366CC] text-white border-[#3366CC]"
                        : "border-gray-200 text-gray-600 hover:border-[#3366CC] bg-white"
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
