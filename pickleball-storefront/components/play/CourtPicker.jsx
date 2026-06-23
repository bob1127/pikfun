"use client";

import { useState, useEffect, useRef } from "react";
import { Search, MapPin, Building2, Trees, ChevronDown, PenLine } from "lucide-react";

const TYPE_ICONS = {
  indoor: Building2,
  outdoor: Trees,
  covered: Building2,
};

const chipBase =
  "px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all border";
const chipActive =
  "bg-[#005caf] text-white border-[#005caf] shadow-sm shadow-[#005caf]/20";
const chipIdle =
  "bg-white text-[#475569] border-[#e2e8f0] hover:border-[#005caf]/40";

export default function CourtPicker({
  locationName,
  locationAddress,
  onSelect,
  onManualChange,
  variant = "default",
}) {
  const modern = variant === "modern";
  const [query, setQuery] = useState("");
  const [city, setCity] = useState("");
  const [courtType, setCourtType] = useState("all");
  const [courts, setCourts] = useState([]);
  const [cities, setCities] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [manualMode, setManualMode] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const wrapRef = useRef(null);

  const inputCls = modern
    ? "w-full bg-[#f8fafc] border border-[#e8edf3] rounded-2xl px-4 py-3.5 text-sm text-[#0f172a] placeholder:text-[#94a3b8] focus:outline-none focus:border-[#005caf] focus:ring-2 focus:ring-[#005caf]/10 transition-all"
    : "w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#3157B5] transition-colors";

  const searchCls = modern
    ? "w-full bg-[#f8fafc] border border-[#e8edf3] rounded-2xl pl-11 pr-10 py-3.5 text-sm focus:outline-none focus:border-[#005caf] focus:ring-2 focus:ring-[#005caf]/10"
    : "w-full border border-gray-200 rounded-xl pl-10 pr-10 py-3 text-sm focus:outline-none focus:border-[#3157B5]";

  useEffect(() => {
    const onClick = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  useEffect(() => {
    if (manualMode) return;
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (query) params.set("q", query);
        if (city) params.set("city", city);
        if (courtType !== "all") params.set("type", courtType);
        const res = await fetch(`/api/pickleball-courts?${params}`);
        const data = await res.json();
        setCourts(data.courts || []);
        if (!cities.length && data.cities) setCities(data.cities);
      } catch {
        setCourts([]);
      } finally {
        setLoading(false);
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [query, city, courtType, manualMode]);

  useEffect(() => {
    if (!cities.length) {
      fetch("/api/pickleball-courts")
        .then((r) => r.json())
        .then((d) => setCities(d.cities || []));
    }
  }, []);

  const pickCourt = (court) => {
    setSelectedId(court.id);
    setQuery(`${court.name}（${court.city}）`);
    setOpen(false);
    onSelect({
      location_name: court.name,
      location_address: court.address,
      court_type: court.court_type,
      latitude: court.latitude,
      longitude: court.longitude,
      court_id: court.id,
    });
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

  const typeFilters = [
    { value: "all", label: "全部" },
    { value: "indoor", label: "室內" },
    { value: "outdoor", label: "室外" },
    { value: "covered", label: "風雨場" },
  ];

  return (
    <div className="space-y-4" ref={wrapRef}>
      <div className="flex items-center justify-between gap-3">
        {!modern && (
          <label className="block text-xs font-bold text-gray-500">
            選擇球場
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
          {manualMode ? "改從球場列表選擇" : "改為手動輸入地址"}
        </button>
      </div>

      {!manualMode ? (
        <>
          {modern ? (
            <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className={`${chipBase} ${city ? chipActive : chipIdle} appearance-none pr-6`}
              >
                <option value="">全部縣市</option>
                {cities.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              {typeFilters.map((f) => (
                <button
                  key={f.value}
                  type="button"
                  onClick={() => setCourtType(f.value)}
                  className={`${chipBase} ${
                    courtType === f.value ? chipActive : chipIdle
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-2 text-xs bg-white"
              >
                <option value="">全部縣市</option>
                {cities.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <select
                value={courtType}
                onChange={(e) => setCourtType(e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-2 text-xs bg-white"
              >
                <option value="all">室內 + 室外</option>
                <option value="indoor">室內</option>
                <option value="outdoor">室外</option>
                <option value="covered">風雨球場</option>
              </select>
            </div>
          )}

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
              placeholder="搜尋球場名稱或地址..."
              className={searchCls}
            />
            <ChevronDown
              size={16}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-[#94a3b8]"
            />

            {open && (
              <div
                className={`absolute z-20 mt-2 w-full bg-white max-h-64 overflow-y-auto ${
                  modern
                    ? "rounded-2xl shadow-xl shadow-[#005caf]/10 border border-[#e8edf3]"
                    : "border border-gray-200 rounded-xl shadow-lg"
                }`}
              >
                {loading ? (
                  <p className="p-4 text-sm text-gray-400 text-center">搜尋中...</p>
                ) : courts.length === 0 ? (
                  <p className="p-4 text-sm text-gray-400 text-center">
                    找不到球場，可改用手動輸入
                  </p>
                ) : (
                  courts.map((court) => {
                    const Icon = TYPE_ICONS[court.court_type] || MapPin;
                    return (
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
                            <Icon size={16} className="text-[#005caf]" />
                          </span>
                          <div className="min-w-0">
                            <p className="font-bold text-sm text-[#0f172a] truncate">
                              {court.name}
                              <span className="ml-1.5 text-[10px] font-bold text-[#94a3b8]">
                                {court.court_type_label}
                              </span>
                            </p>
                            <p className="text-xs text-[#64748b] truncate mt-0.5">
                              {court.city} · {court.address}
                            </p>
                            {court.fee_hint && (
                              <p className="text-[10px] text-[#ef4023] mt-1 font-bold">
                                收費 {court.fee_hint}
                              </p>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })
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
              球場名稱 *
            </label>
            <input
              name="location_name"
              value={locationName}
              onChange={onManualChange}
              required
              placeholder="例：大安運動中心匹克球場"
              className={inputCls}
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-[#64748b] mb-2">
              地址 *
            </label>
            <input
              name="location_address"
              value={locationAddress}
              onChange={onManualChange}
              required
              placeholder="例：台北市大安區辛亥路三段55號"
              className={inputCls}
            />
            <p className="text-[11px] text-[#94a3b8] mt-2">
              填寫完整地址後，詳情頁會自動顯示 Google 地圖
            </p>
          </div>
        </>
      )}
    </div>
  );
}
