"use client";

import { useState, useEffect, useRef } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Users,
  SlidersHorizontal,
  ArrowUpDown,
  X,
  Check,
  ChevronLeft,
  ChevronRight,
  Map,
} from "lucide-react";
import { useUser } from "@/components/context/UserContext";
import SessionCard from "@/components/play/SessionCard";
import PlaySessionsMapModal from "@/components/play/PlaySessionsMapModal";
import {
  PlayHeroBanner,
  PlayStatsBar,
  PlayAlmostFullSection,
  getAlmostFullSessions,
  computePlayStats,
} from "@/components/play/PlayEditorialSections";
import TrapezoidTabs from "@/components/ui/TrapezoidTabs";
import { SKILL_LABELS } from "@/lib/playUtils";

const PAGE_SIZE = 20;

const TABS = [
  { key: "upcoming", label: "即將開始" },
  { key: "all", label: "全部" },
  { key: "joined", label: "我加入的", requireAuth: true },
  { key: "hosting", label: "我開的團", requireAuth: true },
];

const SORT_OPTIONS = [
  { key: "date_asc", label: "最近優先" },
  { key: "date_desc", label: "最晚優先" },
  { key: "spots_asc", label: "空位由多到少" },
  { key: "fee_asc", label: "費用：低到高" },
  { key: "fee_desc", label: "費用：高到低" },
];

const SKILL_FILTER_OPTIONS = [
  { key: "all", label: "不限程度" },
  { key: "beginner", label: SKILL_LABELS.beginner },
  { key: "intermediate", label: SKILL_LABELS.intermediate },
  { key: "advanced", label: SKILL_LABELS.advanced },
];

const FEE_OPTIONS = [
  { key: "any", label: "不限" },
  { key: "free", label: "免費" },
  { key: "paid", label: "收費" },
];
const STATUS_OPTIONS = [
  { key: "any", label: "不限" },
  { key: "open", label: "可加入" },
  { key: "full", label: "已額滿" },
];

function applyLocalFilters(
  sessions,
  { skillLevel, feeType, statusType, sortKey },
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
    out = out.filter((s) => !s.is_full && s.display_status !== "cancelled");
  else if (statusType === "full") out = out.filter((s) => s.is_full);
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

/* ── FilterDrawer ───────────────────────────────────────── */
function FilterSection({ label, children }) {
  return (
    <div className="py-5">
      <p className="text-[10px] font-black tracking-widest uppercase text-gray-500 mb-4">
        {label}
      </p>
      <div className="space-y-3">{children}</div>
    </div>
  );
}
function CheckRow({ label, checked, onToggle }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="flex items-center gap-3 w-full text-left group"
    >
      <span
        className={`w-4 h-4 border flex items-center justify-center flex-shrink-0 transition-colors ${checked ? "bg-gray-900 border-gray-900" : "bg-white border-gray-400 group-hover:border-gray-600"}`}
      >
        {checked && <Check size={10} strokeWidth={3} className="text-white" />}
      </span>
      <span className="text-sm text-gray-800">{label}</span>
    </button>
  );
}
function FilterDrawer({ open, onClose, filters, onChange, onApply }) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/30"
            onClick={onClose}
            aria-hidden
          />
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "tween", duration: 0.28 }}
            className="fixed inset-y-0 left-0 z-50 w-72 bg-[#f2f2f2] flex flex-col"
          >
            <div className="flex items-center justify-between px-6 pt-8 pb-5">
              <span className="text-xs font-black tracking-widest uppercase text-gray-900">
                FILTER
              </span>
              <button
                type="button"
                onClick={onClose}
                className="p-1 text-gray-500 hover:text-gray-900"
              >
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 divide-y divide-gray-300">
              <FilterSection label="程度">
                {SKILL_FILTER_OPTIONS.map((o) => (
                  <CheckRow
                    key={o.key}
                    label={o.label}
                    checked={filters.skillLevel === o.key}
                    onToggle={() => onChange("skillLevel", o.key)}
                  />
                ))}
              </FilterSection>
              <FilterSection label="費用">
                {FEE_OPTIONS.map((o) => (
                  <CheckRow
                    key={o.key}
                    label={o.label}
                    checked={filters.feeType === o.key}
                    onToggle={() => onChange("feeType", o.key)}
                  />
                ))}
              </FilterSection>
              <FilterSection label="狀態">
                {STATUS_OPTIONS.map((o) => (
                  <CheckRow
                    key={o.key}
                    label={o.label}
                    checked={filters.statusType === o.key}
                    onToggle={() => onChange("statusType", o.key)}
                  />
                ))}
              </FilterSection>
            </div>
            <div className="px-6 py-5 border-t border-gray-300">
              <button
                type="button"
                onClick={() => {
                  onApply();
                  onClose();
                }}
                className="w-full py-3.5 bg-gray-900 text-white text-sm font-bold tracking-widest uppercase hover:bg-gray-800 transition-colors"
              >
                VIEW RESULTS
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/* ── SortDropdown ───────────────────────────────────────── */
function SortDropdown({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const h = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 bg-white text-xs font-bold tracking-widest uppercase text-gray-700 hover:bg-gray-50 transition-colors"
      >
        <ArrowUpDown size={13} /> SORT
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-1 w-52 bg-white border border-gray-200 z-50"
          >
            {SORT_OPTIONS.map((o) => (
              <button
                key={o.key}
                type="button"
                onClick={() => {
                  onChange(o.key);
                  setOpen(false);
                }}
                className={`block w-full text-left px-5 py-3.5 text-sm transition-colors ${o.key === value ? "text-gray-900 font-bold underline" : "text-gray-700 hover:bg-gray-50"}`}
              >
                {o.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function FilterTag({ label, onRemove }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-900 text-white text-xs font-semibold">
      {label}
      <button type="button" onClick={onRemove} className="hover:opacity-70">
        <X size={11} strokeWidth={2.5} />
      </button>
    </span>
  );
}

/* ══════════════════════════════════════════════════════════ */
export default function PlayListPage() {
  const router = useRouter();
  const { userInfo, loading: userLoading } = useUser();

  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("upcoming");
  const [error, setError] = useState(null);
  const [filterOpen, setFilterOpen] = useState(false);
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
  });
  const [sortKey, setSortKey] = useState("date_asc");
  const [pendingFilters, setPendingFilters] = useState(filters);

  const fetchSessions = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ filter: tab });
      if (userInfo?.email) params.set("email", userInfo.email);
      const res = await fetch(`/api/play-sessions?${params}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "載入失敗");
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
    const params = new URLSearchParams({ filter: "all" });
    if (userInfo?.email) params.set("email", userInfo.email);

    fetch(`/api/play-sessions?${params}`)
      .then((r) => r.json())
      .then((d) => {
        const now = new Date();
        let list = (d.sessions || []).filter((s) => s.status !== "cancelled");
        if (tab === "upcoming") {
          list = list.filter((s) => new Date(s.starts_at) >= now);
        }
        setMapSessions(applyLocalFilters(list, { ...filters, sortKey }));
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
  ].filter(Boolean).length;

  const handlePageChange = (p) => {
    setPage(p);
    setListKey((k) => k + 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
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
        <title>揪團打球 | PikFun</title>
        <meta
          name="description"
          content="尋找附近的匹克球揪團，加入球友一起打球"
        />
      </Head>

      <FilterDrawer
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        filters={pendingFilters}
        onChange={(k, v) => setPendingFilters((p) => ({ ...p, [k]: v }))}
        onApply={() => setFilters(pendingFilters)}
      />

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
        className="min-h-screen pb-20 overflow-x-hidden"
        style={{ backgroundColor: "#F1F3F5" }}
      >
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
          {/* Tabs */}
          <div className="mb-0">
            <TrapezoidTabs
              items={TABS.filter((f) => !f.requireAuth || userInfo)}
              value={tab}
              onChange={setTab}
            />
          </div>

          {/* Filter/Sort bar */}
          <div className="flex items-center justify-between py-3 border-b border-gray-900 mb-6 gap-3 flex-wrap">
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => {
                  setPendingFilters(filters);
                  setFilterOpen(true);
                }}
                className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 bg-white text-xs font-bold tracking-widest uppercase text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <SlidersHorizontal size={13} />
                FILTER
                <span className="text-gray-400 font-medium normal-case tracking-normal">
                  {displayed.length} 場次
                </span>
                {activeFilterCount > 0 && (
                  <span className="ml-1 w-4 h-4 rounded-full bg-gray-900 text-white text-[10px] flex items-center justify-center font-bold">
                    {activeFilterCount}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setMapOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold transition-colors border border-gray-300 bg-white text-gray-700 hover:bg-[#005caf] hover:text-white hover:border-[#005caf]"
              >
                <Map size={13} /> 地圖
              </button>
            </div>
            <SortDropdown value={sortKey} onChange={setSortKey} />
          </div>

          {/* Active filter tags */}
          {activeFilterCount > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {filters.skillLevel !== "all" && (
                <FilterTag
                  label={
                    SKILL_FILTER_OPTIONS.find(
                      (o) => o.key === filters.skillLevel,
                    )?.label
                  }
                  onRemove={() =>
                    setFilters((p) => ({ ...p, skillLevel: "all" }))
                  }
                />
              )}
              {filters.feeType !== "any" && (
                <FilterTag
                  label={
                    FEE_OPTIONS.find((o) => o.key === filters.feeType)?.label
                  }
                  onRemove={() => setFilters((p) => ({ ...p, feeType: "any" }))}
                />
              )}
              {filters.statusType !== "any" && (
                <FilterTag
                  label={
                    STATUS_OPTIONS.find((o) => o.key === filters.statusType)
                      ?.label
                  }
                  onRemove={() =>
                    setFilters((p) => ({ ...p, statusType: "any" }))
                  }
                />
              )}
              <button
                type="button"
                onClick={() =>
                  setFilters({
                    skillLevel: "all",
                    feeType: "any",
                    statusType: "any",
                  })
                }
                className="text-xs text-gray-400 underline hover:text-gray-700 px-1"
              >
                清除全部
              </button>
            </div>
          )}

          {/* Content */}
          {loading ? (
            <div className="text-center py-20 text-gray-400">載入揪團中...</div>
          ) : error ? (
            <div className="text-center py-20">
              <p className="text-red-500 mb-2">{error}</p>
              <button
                onClick={fetchSessions}
                className="text-[#3157B5] font-bold underline"
              >
                重試
              </button>
            </div>
          ) : displayed.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-300">
              <Users size={48} className="text-gray-200 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">
                {sessions.length > 0
                  ? "目前篩選條件下沒有揪團"
                  : "目前沒有揪團，成為第一個開團的人吧！"}
              </p>
              {sessions.length > 0 ? (
                <button
                  onClick={() =>
                    setFilters({
                      skillLevel: "all",
                      feeType: "any",
                      statusType: "any",
                    })
                  }
                  className="inline-flex items-center gap-2 bg-gray-900 text-white font-bold px-6 py-3 text-sm uppercase tracking-widest"
                >
                  清除篩選
                </button>
              ) : (
                <button
                  onClick={handleCreateClick}
                  className="inline-flex items-center gap-2 bg-[#3157B5] text-white font-bold px-6 py-3 rounded-full"
                >
                  <Plus size={18} /> 我要開團
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
      </main>
    </>
  );
}
