"use client";

import { useState, useEffect } from "react";
import { useTranslation } from "next-i18next";
import FeaturedCoachCard from "./FeaturedCoachCard";

const BLUE = "#005caf";

export default function FeaturedCoachesSection() {
  const { t } = useTranslation("coaching");
  const [coaches, setCoaches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/featured-coaches")
      .then((res) => res.json())
      .then((data) => setCoaches(data.coaches || []))
      .catch(() => setCoaches([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="bg-white py-16 md:py-24">
      <div className="max-w-[1280px] mx-auto px-6 md:px-10">
        <header className="mb-10 md:mb-14 max-w-3xl">
          {t("featured.eyebrow") ? (
            <p
            className="text-sm md:text-[15px] font-bold tracking-wide mb-3"
            style={{ color: BLUE }}
          >
            {t("featured.eyebrow")}
          </p>
          ) : null}
          <h2 className="text-3xl md:text-4xl lg:text-[2.75rem] font-bold text-black tracking-tight leading-tight mb-4">
            {t("featured.title")}
          </h2>
          <p className="text-sm md:text-base text-gray-500 leading-relaxed">
            {t("featured.desc")}
          </p>
        </header>

        {loading ? (
          <div className="text-center py-16 text-gray-400">{t("featured.loading")}</div>
        ) : coaches.length === 0 ? (
          <div className="text-center py-16 text-gray-400 border border-gray-100 rounded-xl">
            {t("featured.empty")}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-5 gap-y-10 md:gap-x-6">
            {coaches.map((coach, i) => (
              <FeaturedCoachCard
                key={coach.slug}
                coach={coach}
                index={i}
                variant="portrait"
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
