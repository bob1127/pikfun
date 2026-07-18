"use client";

import { useEffect, useMemo, useState } from "react";
import Head from "next/head";
import dynamic from "next/dynamic";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { AnimatePresence } from "framer-motion";
import { MapPin, ChevronDown } from "lucide-react";
import { PersonModal } from "@/components/play/PeopleShowcaseSection";

const CourtsTaiwanMap = dynamic(
  () => import("@/components/play/CourtsTaiwanMap"),
  { ssr: false },
);

const BLUE = "#3157B5";
const DEFAULT_COURT_IMAGE = "/images/3d96081d-fdbe-49fc-8b9a-f117eedc68a8.png";

/* ── 揪團／教練課與球場的對應 ──
   只認開團時從「球場搜尋」選到的唯一球場 ID（Google place_id），
   以及同來源的精確座標，100% 精確、不做名稱猜測比對。 */
function itemMatchesCourt(court, item) {
  if (item.court_id && item.court_id === court.id) return true;
  if (
    item.latitude != null &&
    item.longitude != null &&
    court.latitude != null &&
    Math.abs(Number(item.latitude) - court.latitude) < 0.0002 &&
    Math.abs(Number(item.longitude) - court.longitude) < 0.0002
  ) {
    return true;
  }
  return false;
}

function formatActivityTime(startsAt, locale) {
  if (!startsAt) return "";
  try {
    return new Date(startsAt).toLocaleString(
      locale === "en" ? "en-US" : "zh-TW",
      {
        month: "numeric",
        day: "numeric",
        weekday: "short",
        hour: "2-digit",
        minute: "2-digit",
      },
    );
  } catch {
    return "";
  }
}

function courtToPerson(court, t, locale, activities = []) {
  const mapsUrl = court.place_id
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        court.name,
      )}&query_place_id=${encodeURIComponent(court.place_id)}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        `${court.name} ${court.address || ""}`,
      )}`;

  // Place Details 最多回傳約 6 張，抓不到的候選會由輪播元件自動略過
  const photos =
    court.place_id && court.photo_count > 0
      ? Array.from(
          { length: 6 },
          (_, i) =>
            `/api/courts/photo?place_id=${encodeURIComponent(court.place_id)}&i=${i}`,
        )
      : [];

  return {
    key: court.place_id || court.id,
    name: court.name,
    role: `${court.city || ""}${court.city ? "・" : ""}${t("courts_map.role")}`,
    photo: DEFAULT_COURT_IMAGE,
    photos,
    heroImageFull: true,
    catch: court.address || "",
    href: mapsUrl,
    hrefExternal: true,
    hrefLabel: t("courts_map.open_in_google"),
    note: t("courts_map.shared_note"),
    activitiesLabel: t("courts_map.activities_title"),
    activities: activities.map((a) => ({
      key: `${a.kind}-${a.id}`,
      title: a.title,
      typeLabel:
        a.kind === "class"
          ? t("courts_map.activity_class")
          : t("courts_map.activity_play"),
      time: formatActivityTime(a.starts_at, locale),
      meta:
        a.spots_left > 0
          ? t("courts_map.activity_spots", { count: a.spots_left })
          : null,
      href: a.kind === "class" ? `/coaching/${a.id}` : `/play/${a.id}`,
    })),
    fields: [
      { label: t("courts_map.fields.address"), text: court.address },
      { label: t("courts_map.fields.city"), text: court.city },
      {
        label: t("courts_map.fields.source"),
        text: court.court_type_label || t("courts_map.source_google"),
      },
    ],
  };
}

export default function CourtsMapPage() {
  const { t, i18n } = useTranslation("play");
  const [courts, setCourts] = useState([]);
  const [cities, setCities] = useState({});
  const [loading, setLoading] = useState(true);
  const [city, setCity] = useState("all");
  const [activeKey, setActiveKey] = useState(null);
  const [upcomingItems, setUpcomingItems] = useState([]);

  useEffect(() => {
    let alive = true;
    fetch("/api/courts/all")
      .then((r) => (r.ok ? r.json() : { courts: [], cities: {} }))
      .then((data) => {
        if (!alive) return;
        setCourts(data.courts || []);
        setCities(data.cities || {});
      })
      .catch(() => {})
      .finally(() => alive && setLoading(false));

    // 即將舉行的揪團與教練課，用來在地標上顯示數字徽章
    Promise.all([
      fetch("/api/play-sessions")
        .then((r) => (r.ok ? r.json() : { sessions: [] }))
        .then((d) =>
          (d.sessions || []).map((s) => ({ ...s, kind: "play" })),
        )
        .catch(() => []),
      fetch("/api/coach-classes")
        .then((r) => (r.ok ? r.json() : { classes: [] }))
        .then((d) =>
          (d.classes || []).map((c) => ({ ...c, kind: "class" })),
        )
        .catch(() => []),
    ]).then(([sessions, classes]) => {
      if (alive) setUpcomingItems([...sessions, ...classes]);
    });

    return () => {
      alive = false;
    };
  }, []);

  const filtered = useMemo(
    () => (city === "all" ? courts : courts.filter((c) => c.city === city)),
    [courts, city],
  );

  // 每個球場對應的進行中活動（揪團／教練課）
  const activitiesByCourt = useMemo(() => {
    if (!upcomingItems.length || !filtered.length) return {};
    const map = {};
    for (const court of filtered) {
      const key = court.place_id || court.id;
      const matched = upcomingItems.filter((item) =>
        itemMatchesCourt(court, item),
      );
      if (matched.length) map[key] = matched;
    }
    return map;
  }, [upcomingItems, filtered]);

  const activityCounts = useMemo(() => {
    const counts = {};
    for (const [key, list] of Object.entries(activitiesByCourt)) {
      counts[key] = list.length;
    }
    return counts;
  }, [activitiesByCourt]);

  const people = useMemo(
    () =>
      filtered.map((c) =>
        courtToPerson(
          c,
          t,
          i18n.language,
          activitiesByCourt[c.place_id || c.id] || [],
        ),
      ),
    [filtered, t, i18n.language, activitiesByCourt],
  );

  const activeIndex = useMemo(
    () => people.findIndex((p) => p.key === activeKey),
    [people, activeKey],
  );

  const cityChips = useMemo(
    () =>
      Object.entries(cities)
        .filter(([, count]) => count > 0)
        .map(([name, count]) => ({ name, count })),
    [cities],
  );

  return (
    <>
      <Head>
        <title>{t("courts_map.seo_title")}</title>
        <meta name="description" content={t("courts_map.seo_description")} />
      </Head>

      <main className="bg-[#eef4fb] min-h-screen pb-24">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10 pt-10 md:pt-14">
          <p
            className="text-xs font-black tracking-widest uppercase mb-3"
            style={{ color: BLUE }}
          >
            {t("courts_map.eyebrow")}
          </p>
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl md:text-4xl font-black text-gray-900 mb-3">
                {t("courts_map.title")}
              </h1>
              <p className="text-sm text-gray-500 max-w-xl leading-relaxed">
                {t("courts_map.desc")}
              </p>
            </div>
            <p
              className="text-sm font-black shrink-0 flex items-center gap-1.5"
              style={{ color: BLUE }}
            >
              <MapPin size={16} />
              {t("courts_map.count_label", { count: filtered.length })}
            </p>
          </div>

          {/* 縣市篩選：手機版下拉選單 */}
          <div className="md:hidden mb-6">
            <div className="relative">
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full appearance-none bg-white rounded-full px-5 py-3 text-sm font-bold text-gray-800 shadow-sm border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#3157B5]/40 pr-10"
              >
                <option value="all">
                  {t("courts_map.all_cities")}（{courts.length}）
                </option>
                {cityChips.map((c) => (
                  <option key={c.name} value={c.name}>
                    {c.name}（{c.count}）
                  </option>
                ))}
              </select>
              <ChevronDown
                size={16}
                className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none"
                style={{ color: BLUE }}
              />
            </div>
          </div>

          {/* 縣市篩選：桌機版按鈕 */}
          <div className="hidden md:flex flex-wrap gap-2 mb-6">
            <button
              type="button"
              onClick={() => setCity("all")}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-colors ${
                city === "all"
                  ? "text-white"
                  : "bg-white text-gray-500 hover:text-gray-800"
              }`}
              style={city === "all" ? { background: BLUE } : undefined}
            >
              {t("courts_map.all_cities")}
            </button>
            {cityChips.map((c) => (
              <button
                key={c.name}
                type="button"
                onClick={() => setCity(c.name)}
                className={`px-4 py-2 rounded-full text-xs font-bold transition-colors ${
                  city === c.name
                    ? "text-white"
                    : "bg-white text-gray-500 hover:text-gray-800"
                }`}
                style={city === c.name ? { background: BLUE } : undefined}
              >
                {c.name}
                <span className="ml-1 opacity-70">{c.count}</span>
              </button>
            ))}
          </div>

          {/* 地圖 */}
          <div className="relative h-[62vh] min-h-[460px] rounded-2xl overflow-hidden shadow-sm border border-white">
            {loading ? (
              <div className="flex items-center justify-center h-full bg-white">
                <p className="text-sm text-gray-400">
                  {t("courts_map.loading")}
                </p>
              </div>
            ) : (
              <CourtsTaiwanMap
                courts={filtered}
                activeKey={activeKey}
                onSelect={setActiveKey}
                fitToCourts={city !== "all"}
                activityCounts={activityCounts}
              />
            )}
          </div>

          {!loading && filtered.length === 0 && (
            <p className="text-center text-sm text-gray-400 mt-6">
              {t("courts_map.empty")}
            </p>
          )}

          <p className="mt-6 text-xs text-gray-400 leading-relaxed text-center md:text-left">
            {t("courts_map.shared_note")}
          </p>
        </div>
      </main>

      <AnimatePresence>
        {activeIndex >= 0 && (
          <PersonModal
            people={people}
            index={activeIndex}
            onClose={() => setActiveKey(null)}
            onNavigate={(dir) => {
              if (!people.length) return;
              const next =
                (activeIndex + dir + people.length) % people.length;
              setActiveKey(people[next].key);
            }}
            t={t}
          />
        )}
      </AnimatePresence>
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
