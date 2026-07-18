"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useTranslation } from "next-i18next";
import {
  Search,
  MapPin,
  ChevronDown,
  PenLine,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { TAIWAN_CITIES } from "@/lib/courtCities";
import { getDistrictsForCity } from "@/lib/taiwanDistricts";
import { districtMatches } from "@/lib/courtDistrict";

// 手動輸入時比對用：正規化名稱／地址（去空白、標點、臺→台）
const normText = (v) =>
  String(v || "")
    .toLowerCase()
    .replace(/臺/g, "台")
    .replace(/[\s（）()｜|,，、．.-]/g, "");

/**
 * 球場選擇器 — 與揪團（/play/create）共用同一套
 * /api/courts/google-search 快取邏輯：
 * - 以縣市為單位向伺服器取資料（伺服器端檔案快取，cache miss 才打 Google）
 * - 區域與關鍵字皆在前端過濾，切換／打字不會產生額外 API 呼叫
 */
export default function CourtPicker({
  locationName,
  locationAddress,
  courtId = null,
  onSelect,
  onManualChange,
  variant = "default",
}) {
  const { t } = useTranslation("play");
  const modern = variant === "modern";
  const [query, setQuery] = useState("");
  const [city, setCity] = useState("");
  const [district, setDistrict] = useState("");
  const [cityCourtsAll, setCityCourtsAll] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [unavailableMsg, setUnavailableMsg] = useState("");
  const [manualMode, setManualMode] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [allCourts, setAllCourts] = useState([]);
  const wrapRef = useRef(null);

  // 進入手動輸入模式時，載入一次全台球場快取（零 Google 用量）
  useEffect(() => {
    if (!manualMode || allCourts.length) return;
    let alive = true;
    fetch("/api/courts/all")
      .then((r) => (r.ok ? r.json() : { courts: [] }))
      .then((d) => {
        if (alive) setAllCourts(d.courts || []);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [manualMode, allCourts.length]);

  // 手動輸入時即時比對相符的 Google 球場（僅比對本地快取，不打 API）
  const manualSuggestions = useMemo(() => {
    if (!manualMode || courtId) return [];
    const nameQ = normText(locationName);
    const addrQ = normText(locationAddress);
    if (nameQ.length < 2 && addrQ.length < 2) return [];
    return allCourts
      .filter((c) => {
        const n = normText(c.name);
        const a = normText(c.address);
        const nameHit =
          nameQ.length >= 2 && (n.includes(nameQ) || nameQ.includes(n));
        const addrHit = addrQ.length >= 3 && a.includes(addrQ);
        return nameHit || addrHit;
      })
      .slice(0, 6);
  }, [manualMode, courtId, locationName, locationAddress, allCourts]);

  const districts = useMemo(() => getDistrictsForCity(city), [city]);

  const inputCls = modern
    ? "w-full bg-[#f8fafc] border border-[#e8edf3] rounded-2xl px-4 py-3.5 text-sm text-[#0f172a] placeholder:text-[#94a3b8] focus:outline-none focus:border-[#005caf] focus:ring-2 focus:ring-[#005caf]/10 transition-all"
    : "w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#3157B5] transition-colors";

  const searchCls = modern
    ? "w-full bg-[#f8fafc] border border-[#e8edf3] rounded-2xl pl-11 pr-10 py-3.5 text-sm focus:outline-none focus:border-[#005caf] focus:ring-2 focus:ring-[#005caf]/10"
    : "w-full border border-gray-200 rounded-xl pl-10 pr-10 py-3 text-sm focus:outline-none focus:border-[#3157B5]";

  const selectCls = modern
    ? "bg-[#f8fafc] border border-[#e8edf3] rounded-2xl px-3 py-2.5 text-xs focus:outline-none focus:border-[#005caf]"
    : "border border-gray-200 rounded-lg px-3 py-2 text-xs bg-white focus:outline-none focus:border-[#3157B5]";

  useEffect(() => {
    const onClick = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  // 以縣市為單位向伺服器取資料（伺服器有檔案快取，不會每次打 Google）
  useEffect(() => {
    if (manualMode || !city) {
      setCityCourtsAll([]);
      setUnavailableMsg("");
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      setUnavailableMsg("");
      try {
        const params = new URLSearchParams({ city });
        if (district) params.set("district", district);
        const res = await fetch(`/api/courts/google-search?${params}`);
        const data = res.ok
          ? await res.json()
          : { courts: [], available: false };

        if (data.available) {
          setCityCourtsAll(data.allCourts || data.courts || []);
        } else {
          setCityCourtsAll([]);
          if (data.message) setUnavailableMsg(data.message);
        }
      } catch {
        setCityCourtsAll([]);
      } finally {
        setLoading(false);
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [city, district, manualMode]);

  // 區域 + 關鍵字都在前端過濾，不產生額外 API 呼叫
  const courts = useMemo(() => {
    let list = cityCourtsAll;
    if (district) {
      list = list.filter((c) => districtMatches(city, c.address, district));
    }
    const q = query.trim();
    if (q && !q.includes("（")) {
      list = list.filter(
        (c) => c.name?.includes(q) || c.address?.includes(q),
      );
    }
    return list;
  }, [cityCourtsAll, city, district, query]);

  const applyCourt = (court) => {
    onSelect({
      location_name: court.name,
      location_address: court.address,
      court_type: court.court_type ?? null,
      latitude: court.latitude,
      longitude: court.longitude,
      court_id: court.id,
    });
  };

  const pickCourt = (court) => {
    setSelectedId(court.id);
    setQuery(`${court.name}（${city}）`);
    setOpen(false);
    applyCourt(court);
  };

  const switchManual = () => {
    setManualMode(true);
    setSelectedId(null);
    setQuery("");
    onSelect({ location_name: "", location_address: "" });
  };

  const switchPicker = () => {
    setManualMode(false);
    setSelectedId(null);
    setQuery("");
  };

  return (
    <div className="space-y-4" ref={wrapRef}>
      <div className="flex items-center justify-between gap-3">
        {!modern && (
          <label className="block text-xs font-bold text-gray-500">
            {t("court.select_label")}
          </label>
        )}
        <button
          type="button"
          onClick={manualMode ? switchPicker : switchManual}
          className={`ml-auto text-xs font-bold flex items-center gap-1 ${
            modern
              ? "text-[#005caf] bg-[#eef5fb] px-3 py-1.5 rounded-full"
              : "text-[#3157B5] hover:underline"
          }`}
        >
          <PenLine size={12} />
          {manualMode ? t("court.manual_toggle_to_list") : t("court.manual_toggle_to_manual")}
        </button>
      </div>

      {!manualMode ? (
        <>
          <div className="flex flex-wrap gap-2">
            <select
              value={city}
              onChange={(e) => {
                setCity(e.target.value);
                setDistrict("");
                setSelectedId(null);
                setQuery("");
              }}
              className={selectCls}
            >
              <option value="">{t("court.select_city")}</option>
              {TAIWAN_CITIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <select
              value={district}
              onChange={(e) => {
                setDistrict(e.target.value);
                setSelectedId(null);
              }}
              disabled={!city}
              className={`${selectCls} disabled:opacity-50`}
            >
              <option value="">{t("court.all_districts")}</option>
              {districts.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          <div className="relative">
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94a3b8]"
            />
            <input
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setOpen(true);
                setSelectedId(null);
              }}
              onFocus={() => setOpen(true)}
              placeholder={
                city ? t("court.search_placeholder") : t("court.select_city_first")
              }
              className={searchCls}
            />
            {loading ? (
              <Loader2
                size={16}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#94a3b8] animate-spin"
              />
            ) : (
              <ChevronDown
                size={16}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#94a3b8]"
              />
            )}

            {open && city && (
              <div
                data-lenis-prevent
                className={`absolute z-20 mt-2 w-full bg-white max-h-64 overflow-y-auto overscroll-contain ${
                  modern
                    ? "rounded-2xl shadow-xl shadow-[#005caf]/10 border border-[#e8edf3]"
                    : "border border-gray-200 rounded-xl shadow-lg"
                }`}
              >
                {loading ? (
                  <p className="p-4 text-sm text-gray-400 text-center">
                    {t("court.searching")}
                  </p>
                ) : courts.length === 0 ? (
                  <p className="p-4 text-sm text-gray-400 text-center">
                    {unavailableMsg || t("court.not_found")}
                  </p>
                ) : (
                  courts.map((court) => (
                    <button
                      key={court.id}
                      type="button"
                      onClick={() => pickCourt(court)}
                      className={`w-full text-left px-4 py-3.5 hover:bg-[#005caf]/5 border-b border-[#f1f5f9] last:border-0 transition-colors ${
                        selectedId === court.id ? "bg-[#005caf]/8" : ""
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <span className="w-9 h-9 rounded-xl bg-[#eef5fb] flex items-center justify-center shrink-0">
                          <MapPin size={16} className="text-[#005caf]" />
                        </span>
                        <div className="min-w-0">
                          <p className="font-bold text-sm text-[#0f172a] truncate">
                            {court.name}
                            {court.court_type_label && (
                              <span className="ml-1.5 text-[10px] font-bold text-[#94a3b8]">
                                {court.court_type_label}
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-[#64748b] truncate mt-0.5">
                            {court.address}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          {(locationName || locationAddress) && (
            <div
              className={`p-4 text-sm ${
                modern
                  ? "bg-gradient-to-br from-[#005caf] to-[#1a3a8a] rounded-2xl text-white"
                  : "bg-[#F8FAFC] rounded-xl border border-gray-100"
              }`}
            >
              <p className={`font-bold ${modern ? "text-white" : "text-black"}`}>
                {locationName}
              </p>
              {locationAddress && (
                <p
                  className={`text-xs mt-1 ${modern ? "text-white/80" : "text-gray-500"}`}
                >
                  {locationAddress}
                </p>
              )}
            </div>
          )}
        </>
      ) : (
        <>
          <div>
            <label className="block text-xs font-bold text-[#64748b] mb-2">
              {t("court.name_label")}
            </label>
            <input
              name="location_name"
              value={locationName}
              onChange={onManualChange}
              required
              placeholder={t("court.name_placeholder")}
              className={inputCls}
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-[#64748b] mb-2">
              {t("court.address_label")}
            </label>
            <input
              name="location_address"
              value={locationAddress}
              onChange={onManualChange}
              required
              placeholder={t("court.address_placeholder")}
              className={inputCls}
            />
            <p className="text-[11px] text-[#94a3b8] mt-2">
              {t("court.address_hint")}
            </p>
          </div>

          {/* 已對應到地圖球場 */}
          {courtId && (
            <div className="flex items-center gap-2 p-3 rounded-2xl bg-[#eafaf0] border border-[#bfe9cf]">
              <CheckCircle2 size={16} className="text-[#16a34a] shrink-0" />
              <p className="text-xs font-bold text-[#15803d]">
                {t("court.map_matched")}
              </p>
            </div>
          )}

          {/* 即時比對相符球場（不消耗 Google 用量） */}
          {!courtId && manualSuggestions.length > 0 && (
            <div className="rounded-2xl border border-[#e8edf3] bg-white overflow-hidden">
              <div className="flex items-center gap-1.5 px-4 pt-3 pb-1">
                <MapPin size={13} className="text-[#005caf]" />
                <p className="text-[11px] font-bold text-[#005caf]">
                  {t("court.map_match_title")}
                </p>
              </div>
              <p className="px-4 pb-2 text-[11px] text-[#94a3b8] leading-relaxed">
                {t("court.map_match_desc")}
              </p>
              <div className="max-h-56 overflow-y-auto" data-lenis-prevent>
                {manualSuggestions.map((court) => (
                  <button
                    key={court.id}
                    type="button"
                    onClick={() => applyCourt(court)}
                    className="w-full text-left px-4 py-3 hover:bg-[#005caf]/5 border-t border-[#f1f5f9] transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <span className="w-8 h-8 rounded-xl bg-[#eef5fb] flex items-center justify-center shrink-0">
                        <MapPin size={15} className="text-[#005caf]" />
                      </span>
                      <div className="min-w-0">
                        <p className="font-bold text-sm text-[#0f172a] truncate">
                          {court.name}
                          {court.city && (
                            <span className="ml-1.5 text-[10px] font-bold text-[#94a3b8]">
                              {court.city}
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-[#64748b] truncate mt-0.5">
                          {court.address}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
