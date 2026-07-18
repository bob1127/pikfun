"use client";

import { useState, useEffect, useCallback } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { motion } from "framer-motion";
import { Plus, ChevronRight, X } from "lucide-react";
import { EXTRA_QUICK_TAGS } from "@/lib/coachSearch";
import { useUser } from "@/components/context/UserContext";
import ClassCard from "@/components/coaching/ClassCard";
import CoachingSidebar from "@/components/coaching/CoachingSidebar";
import PeopleShowcaseSection from "@/components/play/PeopleShowcaseSection";
import CoachingRecruitFooter from "@/components/coaching/CoachingRecruitFooter";

const FILTERS = [
  { key: "upcoming", requireAuth: false },
  { key: "all", requireAuth: false },
  { key: "enrolled", requireAuth: true },
  { key: "teaching", requireAuth: true },
];

export async function getStaticProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ["coaching", "common", "play"])),
    },
  };
}

export default function CoachingListPage() {
  const { t } = useTranslation("coaching");
  const router = useRouter();
  const { userInfo, loading: userLoading } = useUser();
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("upcoming");
  const [classType, setClassType] = useState("all");
  const [skillLevel, setSkillLevel] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [searchMeta, setSearchMeta] = useState(null);
  const [cityTags, setCityTags] = useState([]);

  useEffect(() => {
    if (!router.isReady || !router.query.q) return;
    const query = Array.isArray(router.query.q)
      ? router.query.q[0]
      : router.query.q;
    const normalizedQuery = query.trim();
    setSearchQuery(normalizedQuery);
    setAppliedSearch(normalizedQuery);
  }, [router.isReady, router.query.q]);

  useEffect(() => {
    fetch("/api/pickleball-courts")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data.city_tags)) {
          setCityTags(data.city_tags);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setAppliedSearch(searchQuery.trim());
    }, 350);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchClasses = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ filter });
      if (userInfo?.email) params.set("email", userInfo.email);
      if (classType !== "all") params.set("class_type", classType);
      if (skillLevel !== "all") params.set("skill_level", skillLevel);
      if (appliedSearch) params.set("q", appliedSearch);

      const res = await fetch(`/api/coach-classes?${params}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t("errors.generic"));
      setClasses(data.classes || []);
      setSearchMeta(data.search || null);
    } catch (e) {
      setError(e.message);
      setClasses([]);
    } finally {
      setLoading(false);
    }
  }, [filter, userInfo?.email, classType, skillLevel, appliedSearch]);

  useEffect(() => {
    if (!userLoading) fetchClasses();
  }, [fetchClasses, userLoading]);

  const handleCreateClick = () => {
    if (!userInfo) {
      router.push("/login?redirect=/coaching/create");
      return;
    }
    router.push("/coaching/create");
  };

  const handleSearchSubmit = () => setAppliedSearch(searchQuery.trim());

  const clearSearch = () => {
    setSearchQuery("");
    setAppliedSearch("");
    setSearchMeta(null);
  };

  const handleQuickTag = (tag) => {
    setSearchQuery(tag);
    setAppliedSearch(tag);
  };

  const featuredClasses = classes
    .filter((c) => c.display_status === "open" && !c.is_full)
    .slice(0, 4);

  return (
    <>
      <Head>
        <title>{t("seo.list_title")}</title>
        <meta name="description" content={t("seo.list_desc")} />
      </Head>

      <main className="bg-[#f5f7fa] min-h-screen pt-24 pb-0">
        <div className="max-w-[1280px] mx-auto px-6 md:px-10">
          {/* 頂部標題 — 圖4 風格 */}
          <header className="flex items-end justify-between gap-6 py-12 md:py-16 border-b border-gray-200">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <p className="text-[10px] font-bold tracking-[0.35em] text-[#3366CC] uppercase mb-3">
                {t("list.eyebrow")}
              </p>
              <h1 className="text-3xl md:text-5xl font-bold text-[#1a2d4a] tracking-tight">
                {t("list.title")}
              </h1>
              <p className="text-sm text-gray-500 mt-3 max-w-md">
                {t("list.subtitle")}
              </p>
            </motion.div>
            <span className="hidden md:block text-[#3366CC] font-bold text-lg tracking-wider shrink-0">
              {"{01}"}
            </span>
          </header>

          <div className="flex flex-col lg:flex-row gap-0 py-10 md:py-14">
            {/* 左側直書標籤 — 圖1/2 */}
            <div
              className="hidden xl:flex w-12 shrink-0 items-start justify-center pt-2 border-r border-gray-200 mr-8"
              aria-hidden
            >
              <span
                className="text-xs font-bold tracking-[0.4em] text-gray-400 uppercase"
                style={{ writingMode: "vertical-rl" }}
              >
                {t("common.vertical_course_intro")}
              </span>
            </div>

            {/* 左側 Menu + 篩選 */}
            <CoachingSidebar
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              onSearchSubmit={handleSearchSubmit}
              onClearSearch={clearSearch}
              onQuickTag={handleQuickTag}
              cityTags={cityTags}
              extraTags={EXTRA_QUICK_TAGS}
              appliedSearch={appliedSearch}
              classType={classType}
              onClassTypeChange={setClassType}
              skillLevel={skillLevel}
              onSkillLevelChange={setSkillLevel}
              featuredClasses={featuredClasses}
            />

            {/* 主內容區 */}
            <div className="flex-1 min-w-0">
              {/* 篩選列 — 圖3 GROUP 風格 */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10 pb-6 border-b border-gray-200">
                <div>
                  <p className="text-[10px] font-bold tracking-[0.25em] text-[#3366CC] uppercase mb-2">
                    {t("common.group_label")}
                  </p>
                  <div className="flex flex-wrap gap-x-6 gap-y-2">
                    {FILTERS.filter((f) => !f.requireAuth || userInfo).map(
                      (f) => (
                        <button
                          key={f.key}
                          onClick={() => setFilter(f.key)}
                          className={`text-sm font-bold transition-colors pb-1 border-b-2 ${
                            filter === f.key
                              ? "text-[#1a2d4a] border-[#3366CC]"
                              : "text-gray-400 border-transparent hover:text-[#3366CC]"
                          }`}
                        >
                          {t(`list.filters.${f.key}`)}
                        </button>
                      ),
                    )}
                  </div>
                </div>
                <button
                  onClick={handleCreateClick}
                  className="hidden sm:inline-flex items-center gap-2 bg-[#3366CC] hover:bg-[#2855aa] text-white font-bold px-6 py-2.5 rounded-full transition-colors shrink-0 text-sm"
                >
                  {t("list.create_btn")}
                  <ChevronRight size={15} />
                </button>
              </div>

              {appliedSearch && !loading && (
                <div className="flex flex-wrap items-center gap-2 mb-8">
                  <span className="text-sm text-gray-600">
                    {t("list.search.prefix")}
                    <span className="font-bold text-[#1a2d4a]">
                      {appliedSearch}
                    </span>
                    {t("list.search.suffix")}
                    {searchMeta
                      ? t("list.search.found_count", {
                          count: searchMeta.count,
                        })
                      : ""}
                  </span>
                  <button
                    type="button"
                    onClick={clearSearch}
                    className="inline-flex items-center gap-1 text-xs font-bold text-gray-500 hover:text-[#3366CC] border border-gray-200 rounded-full px-2.5 py-1 bg-white"
                  >
                    <X size={12} /> {t("list.search.clear")}
                  </button>
                  {classes.length === 0 && filter === "upcoming" && (
                    <button
                      type="button"
                      onClick={() => setFilter("all")}
                      className="text-xs font-bold text-[#3366CC] underline"
                    >
                      {t("list.search.switch_all")}
                    </button>
                  )}
                </div>
              )}

              {loading ? (
                <div className="text-center py-24 text-gray-500 font-medium">
                  {t("list.loading")}
                </div>
              ) : error ? (
                <div className="text-center py-24 bg-white border border-gray-200 rounded-xl">
                  <p className="text-red-500 mb-2">{error}</p>
                  <p className="text-sm text-gray-500 mb-4">
                    {t("list.error.hint")}
                  </p>
                  <button
                    onClick={fetchClasses}
                    className="text-[#3366CC] font-bold underline"
                  >
                    {t("list.error.retry")}
                  </button>
                </div>
              ) : classes.length === 0 ? (
                <div className="text-center py-24 bg-white border border-gray-200 rounded-xl">
                  {appliedSearch ? (
                    <>
                      <p className="text-gray-600 mb-2">
                        {t("list.empty.no_match", { query: appliedSearch })}
                      </p>
                      <p className="text-sm text-gray-400 mb-6">
                        {t("list.empty.no_match_hint")}
                      </p>
                      <button
                        onClick={clearSearch}
                        className="inline-flex items-center gap-2 bg-[#1a2d4a] text-white font-bold px-6 py-3 rounded-full mr-2"
                      >
                        {t("list.empty.clear_search")}
                      </button>
                      {filter === "upcoming" && (
                        <button
                          onClick={() => setFilter("all")}
                          className="inline-flex items-center gap-2 border border-gray-300 text-[#1a2d4a] font-bold px-6 py-3 rounded-full bg-white"
                        >
                          {t("list.empty.view_all")}
                        </button>
                      )}
                    </>
                  ) : (
                    <>
                      <p className="text-gray-600 mb-6">
                        {t("list.empty.no_classes")}
                      </p>
                      <button
                        onClick={handleCreateClick}
                        className="inline-flex items-center gap-2 bg-[#3366CC] text-white font-bold px-6 py-3 rounded-full"
                      >
                        <Plus size={18} /> {t("list.empty.become_first")}
                      </button>
                    </>
                  )}
                </div>
              ) : (
                <div className="space-y-6 md:space-y-8">
                  {classes.map((cls, i) => (
                    <ClassCard key={cls.id} cls={cls} index={i} layout="horizontal" />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 底部 CTA — 圖3 ENTRY 橫幅 */}
        <section className="bg-[#3366CC] mt-4">
          <button
            type="button"
            onClick={handleCreateClick}
            className="w-full max-w-[1280px] mx-auto px-6 md:px-10 py-10 md:py-12 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 text-white hover:bg-[#2855aa] transition-colors group"
          >
            <div className="text-center sm:text-left">
              <p className="text-2xl md:text-3xl font-bold tracking-wide uppercase">
                {t("list.bottom_cta.title")}
              </p>
              <p className="text-sm text-white/75 mt-1">
                {t("list.bottom_cta.subtitle")}
              </p>
            </div>
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-[#3366CC] group-hover:scale-105 transition-transform">
              <ChevronRight size={22} />
            </span>
          </button>
        </section>

        {/* 進駐教練紹介（tab + popup 版型，與揪團頁一致） */}
        <div id="featured-coaches" className="pb-8">
          <PeopleShowcaseSection />
        </div>

        <CoachingRecruitFooter
          entryLabel="ENTRY"
          entryHref="/coaching/create"
          onEntryClick={handleCreateClick}
        />
      </main>
    </>
  );
}
