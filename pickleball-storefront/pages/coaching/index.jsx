"use client";

import { useState, useEffect, useCallback } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { motion } from "framer-motion";
import { Plus, ChevronRight, X } from "lucide-react";
import { EXTRA_QUICK_TAGS } from "@/lib/coachSearch";
import { useUser } from "@/components/context/UserContext";
import ClassCard from "@/components/coaching/ClassCard";
import CoachingSidebar from "@/components/coaching/CoachingSidebar";
import FeaturedCoachesSection from "@/components/coaching/FeaturedCoachesSection";

const FILTERS = [
  { key: "upcoming", label: "即將開課" },
  { key: "all", label: "全部" },
  { key: "enrolled", label: "我報名的", requireAuth: true },
  { key: "teaching", label: "我開的課", requireAuth: true },
];

export default function CoachingListPage() {
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
      if (!res.ok) throw new Error(data.error || "載入失敗");
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
        <title>教練開課 | PikFun</title>
        <meta
          name="description"
          content="瀏覽匹克球教練課程，團體班、私人課、主題班，找到適合你的教練"
        />
      </Head>

      <main className="bg-[#E8E8E3] min-h-screen pt-24 pb-20">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10">
          {/* Header */}
          <header className="text-center py-10 md:py-14 border-b border-dashed border-gray-400/50 mb-10">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <p className="text-[10px] md:text-xs font-black tracking-[0.3em] text-gray-500 uppercase mb-3">
                Pickleball Coaching
              </p>
              <h1 className="text-4xl md:text-6xl font-black text-black tracking-tight uppercase mb-3">
                教練開課
              </h1>
              <p className="text-sm text-gray-600 max-w-md mx-auto">
                匹克球教練課程 · 從新手入門到進階技術
              </p>
            </motion.div>
          </header>

          {/* Yellow pill nav */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-10">
            <div className="flex items-center gap-1 bg-[#FFD43A] rounded-full px-2 py-2 overflow-x-auto scrollbar-hide">
              {FILTERS.filter((f) => !f.requireAuth || userInfo).map((f) => (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key)}
                  className={`shrink-0 px-4 py-2 rounded-full text-xs font-black tracking-wide transition-colors ${
                    filter === f.key
                      ? "bg-black text-white"
                      : "text-black hover:bg-black/10"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <button
              onClick={handleCreateClick}
              className="flex items-center justify-center gap-2 bg-black hover:bg-gray-800 text-white font-bold px-6 py-3 rounded-md transition-colors shrink-0"
            >
              我要開課
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Two-column layout */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-10 lg:gap-16">
            {/* Main grid */}
            <div>
              {appliedSearch && !loading && (
                <div className="flex flex-wrap items-center gap-2 mb-6">
                  <span className="text-sm text-gray-600">
                    搜尋「
                    <span className="font-bold text-black">
                      {appliedSearch}
                    </span>
                    」{searchMeta ? ` · 找到 ${searchMeta.count} 堂課` : ""}
                  </span>
                  <button
                    type="button"
                    onClick={clearSearch}
                    className="inline-flex items-center gap-1 text-xs font-bold text-gray-500 hover:text-black border border-gray-300 rounded-full px-2.5 py-1"
                  >
                    <X size={12} /> 清除
                  </button>
                  {classes.length === 0 && filter === "upcoming" && (
                    <button
                      type="button"
                      onClick={() => setFilter("all")}
                      className="text-xs font-bold text-[#3157B5] underline"
                    >
                      改查全部課程
                    </button>
                  )}
                </div>
              )}

              {loading ? (
                <div className="text-center py-20 text-gray-500 font-medium">
                  載入課程中...
                </div>
              ) : error ? (
                <div className="text-center py-20">
                  <p className="text-red-500 mb-2">{error}</p>
                  <p className="text-sm text-gray-500 mb-4">
                    若為資料表錯誤，請先在 Supabase 執行
                    supabase/coach_classes.sql
                  </p>
                  <button
                    onClick={fetchClasses}
                    className="text-black font-bold underline"
                  >
                    重試
                  </button>
                </div>
              ) : classes.length === 0 ? (
                <div className="text-center py-20 border border-dashed border-gray-400 rounded-lg">
                  {appliedSearch ? (
                    <>
                      <p className="text-gray-600 mb-2">
                        找不到符合「{appliedSearch}」的課程
                      </p>
                      <p className="text-sm text-gray-400 mb-4">
                        試試球場名稱、地址、教練姓名，或改用「全部」篩選
                      </p>
                      <button
                        onClick={clearSearch}
                        className="inline-flex items-center gap-2 bg-black text-white font-bold px-6 py-3 rounded-md mr-2"
                      >
                        清除搜尋
                      </button>
                      {filter === "upcoming" && (
                        <button
                          onClick={() => setFilter("all")}
                          className="inline-flex items-center gap-2 border border-gray-400 text-black font-bold px-6 py-3 rounded-md"
                        >
                          查看全部課程
                        </button>
                      )}
                    </>
                  ) : (
                    <>
                      <p className="text-gray-600 mb-4">目前沒有課程</p>
                      <button
                        onClick={handleCreateClick}
                        className="inline-flex items-center gap-2 bg-black text-white font-bold px-6 py-3 rounded-md"
                      >
                        <Plus size={18} /> 成為第一位開課教練
                      </button>
                    </>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-x-8 gap-y-12">
                  {classes.map((cls, i) => (
                    <div
                      key={cls.id}
                      className={
                        i % 3 !== 2
                          ? "sm:border-r sm:border-dashed sm:border-gray-300 sm:pr-8"
                          : ""
                      }
                    >
                      <ClassCard cls={cls} index={i} />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Sidebar */}
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
          </div>

          {/* 進駐教練 */}
          <div id="featured-coaches">
            <FeaturedCoachesSection />
          </div>
        </div>
      </main>
    </>
  );
}
