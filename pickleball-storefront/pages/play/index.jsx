"use client";

import { useState, useEffect } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import {
  Plus,
  Users,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Map,
  Search,
  ChevronDown,
  Info,
} from "lucide-react";
import { useUser } from "@/components/context/UserContext";
import SessionCard from "@/components/play/SessionCard";
import PlaySessionsMapModal from "@/components/play/PlaySessionsMapModal";
import LiquidBlueBg from "@/components/play/LiquidBlueBg";
import PeopleShowcaseSection from "@/components/play/PeopleShowcaseSection";
import {
  PlayHeroBanner,
  PlayStatsBar,
  PlayAlmostFullSection,
  getAlmostFullSessions,
  computePlayStats,
} from "@/components/play/PlayEditorialSections";
import { BluePillTabs } from "@/components/ui/BlueCta";
import { getSkillLabels } from "@/lib/playUtils";

const PAGE_SIZE = 12;

function getTabs(t) {
  return [
    { key: "upcoming", label: t("list.tabs.upcoming") },
    { key: "ended", label: t("list.tabs.ended") },
    { key: "joined", label: t("list.tabs.joined"), requireAuth: true },
    { key: "hosting", label: t("list.tabs.hosting"), requireAuth: true },
  ];
}

function getSortOptions(t) {
  return [
    { key: "date_asc", label: t("list.sort.date_asc") },
    { key: "date_desc", label: t("list.sort.date_desc") },
    { key: "spots_asc", label: t("list.sort.spots_asc") },
    { key: "fee_asc", label: t("list.sort.fee_asc") },
    { key: "fee_desc", label: t("list.sort.fee_desc") },
  ];
}

function getSkillFilterOptions(t) {
  const skillLabels = getSkillLabels(t);
  return [
    { key: "all", label: t("filters.skill_all") },
    { key: "beginner", label: skillLabels.beginner },
    { key: "intermediate", label: skillLabels.intermediate },
    { key: "advanced", label: skillLabels.advanced },
  ];
}

function getFeeOptions(t) {
  return [
    { key: "any", label: t("common.unlimited") },
    { key: "free", label: t("filters.fee_free") },
    { key: "paid", label: t("filters.fee_paid") },
  ];
}

function getStatusOptions(t) {
  return [
    { key: "any", label: t("common.unlimited") },
    { key: "open", label: t("filters.status_open") },
    { key: "full", label: t("filters.status_full") },
  ];
}

function applyLocalFilters(
  sessions,
  { skillLevel, feeType, statusType, keyword, sortKey },
) {
  let out = [...sessions];
  if (skillLevel && skillLevel !== "all")
    out = out.filter((s) => s.skill_level === skillLevel);
  if (feeType === "free")
    out = out.filter(
      (s) =>
        !s.fee_per_person ||
        s.fee_per_person === 0 ||
        s.payment_method === "free",
    );
  else if (feeType === "paid")
    out = out.filter(
      (s) => s.fee_per_person > 0 && s.payment_method !== "free",
    );
  if (statusType === "open")
    out = out.filter(
      (s) =>
        !s.is_full &&
        s.display_status !== "cancelled" &&
        s.display_status !== "ended",
    );
  else if (statusType === "full") out = out.filter((s) => s.is_full);

  const q = (keyword || "").trim().toLowerCase();
  if (q) {
    out = out.filter((s) => {
      const hay = [
        s.title,
        s.location_name,
        s.location_address,
        s.host_name,
        s.description,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }

  switch (sortKey) {
    case "date_desc":
      out.sort((a, b) => new Date(b.starts_at) - new Date(a.starts_at));
      break;
    case "spots_asc":
      out.sort((a, b) => (b.spots_left ?? 0) - (a.spots_left ?? 0));
      break;
    case "fee_asc":
      out.sort((a, b) => (a.fee_per_person ?? 0) - (b.fee_per_person ?? 0));
      break;
    case "fee_desc":
      out.sort((a, b) => (b.fee_per_person ?? 0) - (a.fee_per_person ?? 0));
      break;
    default:
      out.sort((a, b) => new Date(a.starts_at) - new Date(b.starts_at));
  }
  return out;
}

/* ── Pagination ─────────────────────────────────────────── */
function Pagination({ page, total, pageSize, onChange }) {
  const totalPages = Math.ceil(total / pageSize);
  if (totalPages <= 1) return null;

  const pages = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (page > 3) pages.push("...");
    for (
      let i = Math.max(2, page - 1);
      i <= Math.min(totalPages - 1, page + 1);
      i++
    )
      pages.push(i);
    if (page < totalPages - 2) pages.push("...");
    pages.push(totalPages);
  }

  return (
    <div className="flex items-center justify-center gap-1 overflow-hidden mt-12">
      <button
        onClick={() => onChange(page - 1)}
        disabled={page === 1}
        className="w-9 h-9 flex items-center justify-center text-gray-400 hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronLeft size={18} />
      </button>
      {pages.map((p, i) =>
        p === "..." ? (
          <span
            key={`e${i}`}
            className="w-9 h-9 flex items-center justify-center text-gray-400 text-sm"
          >
            ...
          </span>
        ) : (
          <button
            key={p}
            onClick={() => onChange(p)}
            className={`w-9 h-9 flex items-center justify-center text-sm font-medium transition-colors ${
              p === page
                ? "text-gray-900 font-bold border-b-2 border-gray-900"
                : "text-gray-500 hover:text-gray-900"
            }`}
          >
            {p}
          </button>
        ),
      )}
      <button
        onClick={() => onChange(page + 1)}
        disabled={page === totalPages}
        className="w-9 h-9 flex items-center justify-center text-gray-400 hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronRight size={18} />
      </button>
    </div>
  );
}

/* ── 淺色藍系橫向篩選列（參考搜尋列設計）───────────────── */
const FILTER_BLUE = "#005caf";

function FilterSelect({ value, onChange, options, className = "" }) {
  return (
    <div className={`relative min-w-0 ${className}`}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full appearance-none rounded-md border border-[#d7e3f2] bg-white pl-3.5 pr-9 py-3 text-sm text-gray-800 outline-none transition focus:border-[#005caf] focus:ring-2 focus:ring-[#005caf]/15"
      >
        {options.map((o) => (
          <option key={o.key} value={o.key}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown
        size={16}
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2"
        style={{ color: FILTER_BLUE }}
      />
    </div>
  );
}

function PlayFilterBar({
  t,
  filters,
  keywordDraft,
  onKeywordDraftChange,
  onFilterChange,
  onSearch,
  sortKey,
  onSortChange,
  onMapOpen,
  resultCount,
  onClear,
  hasActiveFilters,
}) {
  return (
    <div className="mb-6">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSearch();
        }}
        className="rounded-xl border border-[#d7e3f2]/80 bg-white/55 backdrop-blur-sm p-3 md:p-4 shadow-sm md:bg-[#f7fbff] md:backdrop-blur-none"
      >
        <div className="flex flex-col lg:flex-row gap-2.5 lg:items-stretch">
          <FilterSelect
            className="lg:w-[140px]"
            value={filters.skillLevel}
            onChange={(v) => onFilterChange("skillLevel", v)}
            options={getSkillFilterOptions(t)}
          />
          <FilterSelect
            className="lg:w-[120px]"
            value={filters.feeType}
            onChange={(v) => onFilterChange("feeType", v)}
            options={getFeeOptions(t)}
          />
          <FilterSelect
            className="lg:w-[180px]"
            value={filters.statusType}
            onChange={(v) => onFilterChange("statusType", v)}
            options={getStatusOptions(t)}
          />
          <div className="relative flex-1 min-w-0">
            <input
              type="search"
              value={keywordDraft}
              onChange={(e) => onKeywordDraftChange(e.target.value)}
              placeholder={t("list.search_placeholder")}
              className="w-full rounded-md border border-[#d7e3f2] bg-white px-3.5 py-3 text-sm text-gray-800 placeholder:text-gray-400 outline-none transition focus:border-[#005caf] focus:ring-2 focus:ring-[#005caf]/15"
            />
          </div>
          <button
            type="submit"
            className="inline-flex items-center justify-center gap-2 rounded-md px-5 py-3 text-sm font-bold text-white transition hover:opacity-90 shrink-0"
            style={{ backgroundColor: FILTER_BLUE }}
          >
            {t("common.search")}
            <Search size={16} strokeWidth={2.5} />
          </button>
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <p className="inline-flex items-center gap-1.5 text-xs text-[#5a7aa0]">
            <Info size={13} className="shrink-0" style={{ color: FILTER_BLUE }} />
            {t("list.result_count", { count: resultCount })}
            {hasActiveFilters ? t("list.filtered_suffix") : ""}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            {hasActiveFilters && (
              <button
                type="button"
                onClick={onClear}
                className="text-xs font-bold text-[#005caf] underline underline-offset-2"
              >
                {t("common.clear_filters")}
              </button>
            )}
            <button
              type="button"
              onClick={onMapOpen}
              className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold text-white shadow-md transition hover:opacity-90 hover:shadow-lg"
              style={{ backgroundColor: FILTER_BLUE }}
            >
              <Map size={16} strokeWidth={2.5} />
              {t("list.map_btn")}
            </button>
            <div className="relative">
              <select
                value={sortKey}
                onChange={(e) => onSortChange(e.target.value)}
                className="appearance-none rounded-md border border-[#d7e3f2] bg-white pl-3 pr-8 py-2 text-xs font-bold text-gray-700 outline-none focus:border-[#005caf]"
              >
                {getSortOptions(t).map((o) => (
                  <option key={o.key} value={o.key}>
                    {o.label}
                  </option>
                ))}
              </select>
              <ArrowUpDown
                size={12}
                className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[#005caf]"
              />
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════ */
export default function PlayListPage() {
  const router = useRouter();
  const { t } = useTranslation("play");
  const { userInfo, loading: userLoading } = useUser();

  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("upcoming");
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [listKey, setListKey] = useState(0);
  const [mapOpen, setMapOpen] = useState(false);
  const [courts, setCourts] = useState([]);
  const [mapSessions, setMapSessions] = useState([]);
  const [mapLoading, setMapLoading] = useState(false);

  const [filters, setFilters] = useState({
    skillLevel: "all",
    feeType: "any",
    statusType: "any",
    keyword: "",
  });
  const [keywordDraft, setKeywordDraft] = useState("");
  const [sortKey, setSortKey] = useState("date_asc");

  // 讀取網址 ?q= 參數（例如從策辦人介紹頁、標籤連結進來時自動套用篩選）
  useEffect(() => {
    if (!router.isReady) return;
    const q = typeof router.query.q === "string" ? router.query.q.trim() : "";
    if (q) {
      setFilters((prev) => ({ ...prev, keyword: q }));
      setKeywordDraft(q);
    }
  }, [router.isReady, router.query.q]);

  const fetchSessions = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ filter: tab });
      if (userInfo?.email) params.set("email", userInfo.email);
      const res = await fetch(`/api/play-sessions?${params}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t("list.load_failed"));
      setSessions(data.sessions || []);
    } catch (e) {
      setError(e.message);
      setSessions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!userLoading) fetchSessions();
  }, [tab, userInfo?.email, userLoading]);
  useEffect(() => {
    setPage(1);
    setListKey((k) => k + 1);
  }, [tab, filters, sortKey]);

  useEffect(() => {
    fetch("/api/pickleball-courts?all=1")
      .then((r) => r.json())
      .then((d) => setCourts(d.courts || []))
      .catch(() => setCourts([]));
  }, []);

  useEffect(() => {
    if (!mapOpen) return;

    if (tab === "joined" || tab === "hosting") {
      setMapSessions(
        applyLocalFilters(
          sessions.filter((s) => s.status !== "cancelled"),
          { ...filters, sortKey },
        ),
      );
      return;
    }

    setMapLoading(true);
    const params = new URLSearchParams({
      filter: tab === "ended" ? "ended" : "upcoming",
    });
    if (userInfo?.email) params.set("email", userInfo.email);

    fetch(`/api/play-sessions?${params}`)
      .then((r) => r.json())
      .then((d) => {
        setMapSessions(
          applyLocalFilters(d.sessions || [], { ...filters, sortKey }),
        );
      })
      .catch(() => setMapSessions([]))
      .finally(() => setMapLoading(false));
  }, [mapOpen, tab, filters, sortKey, userInfo?.email, sessions]);

  const displayed = applyLocalFilters(sessions, { ...filters, sortKey });
  const paginated = displayed.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const playStats = computePlayStats(sessions);
  const almostFullSessions = getAlmostFullSessions(sessions);

  const activeFilterCount = [
    filters.skillLevel !== "all",
    filters.feeType !== "any",
    filters.statusType !== "any",
    Boolean(filters.keyword?.trim()),
  ].filter(Boolean).length;

  const clearFilters = () => {
    setFilters({
      skillLevel: "all",
      feeType: "any",
      statusType: "any",
      keyword: "",
    });
    setKeywordDraft("");
  };

  const handlePageChange = (p) => {
    setPage(p);
    setListKey((k) => k + 1);
    // 捲到列表頂端（扣掉固定導覽列高度），而不是整頁最上方
    const list = document.getElementById("play-sessions-list");
    if (list) {
      const top = list.getBoundingClientRect().top + window.scrollY - 130;
      window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
    }
  };

  const handleCreateClick = () => {
    if (!userInfo) {
      router.push("/login?redirect=/play/create");
      return;
    }
    router.push("/play/create");
  };

  return (
    <>
      <Head>
        <title>{t("seo.list_title")}</title>
        <meta name="description" content={t("seo.list_description")} />
      </Head>

      <PlaySessionsMapModal
        open={mapOpen}
        onClose={() => setMapOpen(false)}
        sessions={mapSessions}
        courts={courts}
        tab={tab}
        onSwitchTab={setTab}
        loading={mapLoading}
      />

      <main
        className="relative min-h-screen pb-20 overflow-x-hidden bg-[#eef4fb] md:bg-[#F1F3F5]"
      >
        <LiquidBlueBg />
        <div className="relative z-10">
        <PlayHeroBanner
          stats={playStats}
          featuredSessions={almostFullSessions}
        />
        <PlayAlmostFullSection
          sessions={almostFullSessions}
          onCreateClick={handleCreateClick}
          loading={loading}
        />
        <PlayStatsBar stats={playStats} />

        <div
          id="play-sessions-list"
          className="max-w-[1400px] mx-auto px-6 md:px-10 pt-12 md:pt-16"
        >
          {/* Tabs + 開團 CTA */}
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <BluePillTabs
              tabs={getTabs(t)
                .filter((f) => !f.requireAuth || userInfo)
                .map((tb) => ({
                  value: tb.key,
                  label: tb.label,
                }))}
              value={tab}
              onChange={setTab}
            />
            <button
              type="button"
              onClick={handleCreateClick}
              className="inline-flex items-center gap-2 bg-[#3157B5] hover:bg-[#22408f] text-white font-bold text-sm px-6 py-3 rounded-full shadow-lg shadow-[#3157B5]/25 transition-all hover:scale-[1.03] active:scale-95"
            >
              <Plus size={18} strokeWidth={2.5} />
              {t("list.create_cta")}
            </button>
          </div>

          <PlayFilterBar
            t={t}
            filters={filters}
            keywordDraft={keywordDraft}
            onKeywordDraftChange={setKeywordDraft}
            onFilterChange={(key, value) =>
              setFilters((p) => ({ ...p, [key]: value }))
            }
            onSearch={() =>
              setFilters((p) => ({ ...p, keyword: keywordDraft.trim() }))
            }
            sortKey={sortKey}
            onSortChange={setSortKey}
            onMapOpen={() => setMapOpen(true)}
            resultCount={displayed.length}
            onClear={clearFilters}
            hasActiveFilters={activeFilterCount > 0}
          />

          {/* Content */}
          {loading ? (
            <div className="text-center py-20 text-gray-400">{t("list.loading")}</div>
          ) : error ? (
            <div className="text-center py-20">
              <p className="text-red-500 mb-2">{error}</p>
              <button
                onClick={fetchSessions}
                className="text-[#3157B5] font-bold underline"
              >
                {t("common.retry")}
              </button>
            </div>
          ) : displayed.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-300">
              <Users size={48} className="text-gray-200 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">
                {sessions.length > 0
                  ? t("list.empty_filtered")
                  : tab === "ended"
                    ? t("list.empty_ended")
                    : t("list.empty_upcoming")}
              </p>
              {sessions.length > 0 ? (
                <button
                  onClick={clearFilters}
                  className="inline-flex items-center gap-2 bg-[#005caf] text-white font-bold px-6 py-3 text-sm"
                >
                  {t("common.clear_filters")}
                </button>
              ) : (
                <button
                  onClick={handleCreateClick}
                  className="inline-flex items-center gap-2 bg-[#3157B5] text-white font-bold px-6 py-3 rounded-full"
                >
                  <Plus size={18} /> {t("list.create_cta")}
                </button>
              )}
            </div>
          ) : (
            <>
              <AnimatePresence mode="wait">
                <motion.div
                  key={listKey}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-14 lg:gap-x-10 lg:gap-y-16"
                >
                  {paginated.map((s, i) => (
                    <SessionCard key={s.id} session={s} index={i} />
                  ))}
                </motion.div>
              </AnimatePresence>

              <Pagination
                page={page}
                total={displayed.length}
                pageSize={PAGE_SIZE}
                onChange={handlePageChange}
              />
            </>
          )}
        </div>

        <PeopleShowcaseSection />
        </div>
      </main>
    </>
  );
}

export async function getStaticProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale ?? "zh-TW", ["play", "common"])),
    },
  };
}
