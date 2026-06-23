"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  ChevronRight,
  Bell,
  MapPin,
  Users,
  Minus,
  Plus,
  DollarSign,
  FileText,
  Calendar,
  X,
  Loader2,
  Mail,
  UserCheck,
  Wallet,
} from "lucide-react";
import { useUser } from "@/components/context/UserContext";
import {
  SKILL_LABELS,
  PAYMENT_METHODS,
  toLocalDatetimeValue,
  syncEndsAtOnStartChange,
  syncEndsAtOnEndChange,
  getEndsAtBounds,
  validateSessionTimes,
} from "@/lib/playUtils";
import {
  sortCourtCityTags,
  buildCourtCityTags,
  TAIWAN_CITIES,
} from "@/lib/courtCities";
import { districtMatches, sortCourtsByDistance } from "@/lib/courtDistrict";
import { getDistrictsForCity } from "@/lib/taiwanDistricts";
import ConfettiButton from "@/components/ui/ConfettiButton";

/* ─── helpers ─────────────────────────────────────────── */
function pad(n) {
  return String(n).padStart(2, "0");
}
function fmtDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()} (${["日", "一", "二", "三", "四", "五", "六"][d.getDay()]})`;
}
function fmtTime(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/* ─── skill options ────────────────────────────────────── */
const SKILL_OPTIONS = [
  { value: "all", label: SKILL_LABELS.all, color: "#e0f2fe", text: "#0369a1" },
  {
    value: "beginner",
    label: SKILL_LABELS.beginner,
    color: "#dcfce7",
    text: "#16a34a",
  },
  {
    value: "intermediate",
    label: SKILL_LABELS.intermediate,
    color: "#c8f542",
    text: "#365314",
  },
  {
    value: "advanced",
    label: SKILL_LABELS.advanced,
    color: "#fde68a",
    text: "#92400e",
  },
];

/* ─── Section row header ───────────────────────────────── */
function SectionTitle({
  icon: Icon,
  label,
  iconBg = "#eef5fb",
  iconColor = "#005caf",
}) {
  return (
    <div className="crt-sec-title">
      <span
        className="crt-sec-icon"
        style={{ background: iconBg, color: iconColor }}
      >
        <Icon size={15} />
      </span>
      <span className="crt-sec-label">{label}</span>
    </div>
  );
}

/* ─── Blue info tile ───────────────────────────────────── */
function InfoTile({ label, value, onClick, wide, lime }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`crt-tile ${wide ? "crt-tile-wide" : ""} ${lime ? "crt-tile-lime" : ""}`}
    >
      <span className="crt-tile-label">{label}</span>
      <span className="crt-tile-value">{value}</span>
      {onClick && <ChevronRight size={14} className="crt-tile-arrow" />}
    </button>
  );
}

/* ─── Datetime bottom drawer ───────────────────────────── */
function DatetimeDrawer({ label, value, onChange, onClose, min, max }) {
  return (
    <div className="crt-drawer-overlay" onClick={onClose}>
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 28, stiffness: 300 }}
        className="crt-drawer"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="crt-drawer-handle" />
        <div className="crt-drawer-head">
          <span className="crt-drawer-title">{label}</span>
          <button type="button" onClick={onClose} className="crt-drawer-close">
            <X size={18} />
          </button>
        </div>
        <input
          type="datetime-local"
          value={value}
          onChange={onChange}
          min={min || undefined}
          max={max || undefined}
          className="crt-dt-input"
        />
        <button type="button" onClick={onClose} className="crt-drawer-confirm">
          確認
        </button>
      </motion.div>
    </div>
  );
}

/* ─── Court picker inline ──────────────────────────────── */
function CourtSearch({
  locationName,
  locationAddress,
  onSelect,
  onManualChange,
}) {
  const cityTags = useMemo(
    () => sortCourtCityTags(buildCourtCityTags(TAIWAN_CITIES)),
    [],
  );
  const [city, setCity] = useState("");
  const [district, setDistrict] = useState("");
  const [cityCourtsAll, setCityCourtsAll] = useState([]);
  const districts = useMemo(() => getDistrictsForCity(city), [city]);
  const [courtId, setCourtId] = useState("");
  const [loading, setLoading] = useState(false);
  const [manual, setManual] = useState(false);
  const [editing, setEditing] = useState(!locationName);
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoHint, setGeoHint] = useState("");
  const [geoCoords, setGeoCoords] = useState(null);

  const courts = useMemo(() => {
    let list = cityCourtsAll;
    if (district) {
      list = list.filter((c) => districtMatches(city, c.address, district));
    }
    if (geoCoords) {
      list = sortCourtsByDistance(list, geoCoords.lat, geoCoords.lng);
    }
    return list;
  }, [cityCourtsAll, city, district, geoCoords]);

  useEffect(() => {
    if (manual || !city) {
      setCityCourtsAll([]);
      if (!city) {
        setDistrict("");
        setCourtId("");
      }
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      setCourtId("");
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
        }
      } catch {
        setCityCourtsAll([]);
      } finally {
        setLoading(false);
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [city, district, manual]);

  const pickCourtById = (id) => {
    setCourtId(id);
    const court = courts.find((c) => c.id === id);
    if (!court) return;
    setEditing(false);
    onSelect({
      location_name: court.name,
      location_address: court.address,
      latitude: court.latitude,
      longitude: court.longitude,
      court_id: court.id,
    });
  };

  const resetPicker = () => {
    setEditing(true);
    setCourtId("");
    setCity("");
    setDistrict("");
    setCityCourtsAll([]);
    setGeoHint("");
    setGeoCoords(null);
    onSelect({
      location_name: "",
      location_address: "",
      latitude: null,
      longitude: null,
      court_id: null,
    });
  };

  const sortByMyLocation = () => {
    if (!navigator.geolocation) {
      setGeoHint("此裝置不支援定位");
      return;
    }
    setGeoLoading(true);
    setGeoHint("");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGeoCoords({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
        setGeoHint("已依距離排序（由近到遠）");
        setGeoLoading(false);
      },
      () => {
        setGeoHint("無法取得位置，請允許定位權限");
        setGeoLoading(false);
      },
      { enableHighAccuracy: false, timeout: 10000 },
    );
  };

  if (locationName && !editing) {
    return (
      <div className="crt-court-selected">
        <div className="crt-court-sel-icon">
          <MapPin size={16} />
        </div>
        <div className="crt-court-sel-info">
          <p className="crt-court-sel-name">{locationName}</p>
          <p className="crt-court-sel-addr">{locationAddress}</p>
        </div>
        <button
          type="button"
          onClick={resetPicker}
          className="crt-court-change"
        >
          更換
        </button>
      </div>
    );
  }

  return (
    <div className="crt-court-wrap">
      <div className="crt-court-filters">
        <button
          type="button"
          onClick={() => setManual((v) => !v)}
          className={`crt-court-fchip ${manual ? "active" : ""}`}
        >
          手動輸入地址
        </button>
      </div>

      {manual ? (
        <div className="crt-court-manual">
          <input
            name="location_name"
            value={locationName}
            onChange={onManualChange}
            placeholder="球場名稱"
            className="crt-input"
          />
          <input
            name="location_address"
            value={locationAddress}
            onChange={onManualChange}
            placeholder="完整地址（例：台中市潭子區…）"
            className="crt-input"
          />
          <p className="crt-court-hint">
            手動地址可能無法顯示在地圖上，建議從球場列表選擇
          </p>
        </div>
      ) : (
        <>
          <div className="crt-court-steps">
            <label className="crt-court-field">
              <span className="crt-court-label">1. 縣市</span>
              <select
                value={city}
                onChange={(e) => {
                  setCity(e.target.value);
                  setDistrict("");
                  setCourtId("");
                  setCityCourtsAll([]);
                  setGeoCoords(null);
                  setGeoHint("");
                }}
                className="crt-select"
              >
                <option value="">請選擇縣市</option>
                {cityTags.map((t) => (
                  <option key={t.full} value={t.full}>
                    {t.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="crt-court-field">
              <span className="crt-court-label">2. 鄉鎮市區</span>
              <select
                value={district}
                onChange={(e) => {
                  setDistrict(e.target.value);
                  setCourtId("");
                }}
                disabled={!city}
                className="crt-select"
              >
                <option value="">{city ? "全部區域" : "請先選縣市"}</option>
                {districts.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="crt-court-field">
            <span className="crt-court-label">3. 球場</span>
            <div className="crt-court-select-row">
              <select
                value={courtId}
                onChange={(e) => pickCourtById(e.target.value)}
                disabled={!city || loading}
                className="crt-select crt-select--court"
              >
                <option value="">
                  {!city
                    ? "請先選擇縣市"
                    : loading
                      ? "載入中…"
                      : courts.length === 0
                        ? "此區域尚無球場資料"
                        : "請選擇球場"}
                </option>
                {courts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              {loading && (
                <Loader2
                  size={16}
                  className="animate-spin text-[#94a3b8] shrink-0"
                />
              )}
            </div>
          </label>

          {city && (
            <div className="crt-court-geo-row">
              <button
                type="button"
                onClick={sortByMyLocation}
                disabled={geoLoading}
                className="crt-court-geo-btn"
              >
                {geoLoading ? "定位中…" : "依我的位置排序"}
              </button>
              {geoHint && <span className="crt-court-hint">{geoHint}</span>}
            </div>
          )}

          {courtId && locationAddress && (
            <div className="crt-court-preview">
              <MapPin size={14} className="text-[#005caf] shrink-0" />
              <span className="crt-court-preview-addr">{locationAddress}</span>
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════ */
/*  Main Page                                              */
/* ═══════════════════════════════════════════════════════ */
export default function CreatePlayPage() {
  const router = useRouter();
  const { userInfo, loading: userLoading } = useUser();
  const pendingIdRef = useRef(null);
  const [drawer, setDrawer] = useState(null); // "starts_at" | "ends_at"
  const formRef = useRef(null);

  const defaultStart = new Date();
  defaultStart.setHours(defaultStart.getHours() + 2, 0, 0, 0);
  const defaultEnd = new Date(defaultStart);
  defaultEnd.setHours(defaultEnd.getHours() + 2);

  const [form, setForm] = useState({
    title: "",
    description: "",
    location_name: "",
    location_address: "",
    latitude: null,
    longitude: null,
    court_id: null,
    starts_at: toLocalDatetimeValue(defaultStart),
    ends_at: toLocalDatetimeValue(defaultEnd),
    max_players: 4,
    skill_level: "all",
    fee_per_person: 0,
    payment_method: "free",
    payment_note: "",
  });

  useEffect(() => {
    if (!userLoading && !userInfo) {
      router.push("/login?redirect=/play/create");
    }
  }, [userLoading, userInfo, router]);

  const set = (name, value) =>
    setForm((prev) => {
      const next = { ...prev, [name]: value };
      if (name === "fee_per_person") {
        if (Number(value) === 0) next.payment_method = "free";
        else if (prev.payment_method === "free") next.payment_method = "cash";
      }
      if (name === "payment_method" && value === "free")
        next.fee_per_person = 0;
      return next;
    });

  const handleChange = (e) => set(e.target.name, e.target.value);

  const handleDatetimeChange = (name, value) => {
    setForm((prev) => {
      if (name === "starts_at") {
        return { ...prev, ...syncEndsAtOnStartChange(value, prev.ends_at) };
      }
      if (name === "ends_at") {
        return { ...prev, ...syncEndsAtOnEndChange(prev.starts_at, value) };
      }
      return { ...prev, [name]: value };
    });
  };

  const endsAtBounds = getEndsAtBounds(form.starts_at);
  const startsAtMin = toLocalDatetimeValue(
    (() => {
      const now = new Date();
      now.setSeconds(0, 0);
      return now;
    })(),
  );

  // Validate & call API — returns session id on success, throws on failure
  const doSubmit = async () => {
    if (!userInfo?.email) throw new Error("請先登入");
    if (!form.title?.trim()) throw new Error("請填寫揪團標題");
    if (!form.location_name?.trim() || !form.location_address?.trim()) {
      throw new Error("請選擇球場或填寫完整地址");
    }
    const timeError = validateSessionTimes(form.starts_at, form.ends_at);
    if (timeError) throw new Error(timeError);
    const res = await fetch("/api/play-sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        starts_at: new Date(form.starts_at).toISOString(),
        ends_at: form.ends_at ? new Date(form.ends_at).toISOString() : null,
        max_players: Number(form.max_players),
        fee_per_person: Number(form.fee_per_person) || 0,
        payment_note: form.payment_note || null,
        host_email: userInfo.email,
        host_name: userInfo.name || "會員",
        host_avatar: userInfo.avatar || null,
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "開團失敗");
    pendingIdRef.current = data.session.id;
  };

  // Called by ConfettiButton after confetti fires
  const handleSubmitClick = async () => {
    try {
      await doSubmit();
      // navigate after a short delay so confetti is visible
      setTimeout(() => router.push(`/play/${pendingIdRef.current}`), 1400);
    } catch (err) {
      alert(err.message || "開團失敗，請稍後再試");
      throw err; // let ConfettiButton enter error state
    }
  };

  const handleSubmit = (e) => {
    if (e?.preventDefault) e.preventDefault();
  };

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 6) return "深夜好";
    if (h < 12) return "早安";
    if (h < 18) return "午安";
    return "晚安";
  })();

  const todayStr = (() => {
    const d = new Date();
    return `${d.getMonth() + 1} 月 ${d.getDate()} 日`;
  })();

  const skill =
    SKILL_OPTIONS.find((s) => s.value === form.skill_level) || SKILL_OPTIONS[0];
  const showPaymentDetail = Number(form.fee_per_person) > 0;

  if (userLoading || !userInfo) {
    return (
      <div className="crt-page flex items-center justify-center min-h-screen text-[#94a3b8]">
        <Loader2 className="animate-spin mr-2" size={20} /> 載入中...
      </div>
    );
  }

  const formSections = (
    <>
      {/* ① 揪團資訊 */}
      <section className="crt-section crt-section-full">
        <SectionTitle
          icon={FileText}
          label="揪團資訊"
          iconBg="#eef5fb"
          iconColor="#005caf"
        />
        <input
          name="title"
          value={form.title}
          onChange={handleChange}
          required
          placeholder="揪團標題（例：週末大安公園雙打）"
          className="crt-input"
        />
        <textarea
          name="description"
          value={form.description}
          onChange={handleChange}
          rows={2}
          placeholder="補充說明：程度、裝備、注意事項…"
          className="crt-input crt-textarea"
        />
      </section>

      {/* ② 球場 */}
      <section className="crt-section crt-section-half">
        <SectionTitle
          icon={MapPin}
          label="選擇球場"
          iconBg="#e8f8ef"
          iconColor="#16a34a"
        />
        <CourtSearch
          locationName={form.location_name}
          locationAddress={form.location_address}
          onSelect={({
            location_name,
            location_address,
            latitude,
            longitude,
            court_id,
          }) =>
            setForm((p) => ({
              ...p,
              location_name,
              location_address,
              latitude: latitude ?? null,
              longitude: longitude ?? null,
              court_id: court_id ?? null,
            }))
          }
          onManualChange={handleChange}
        />
      </section>

      {/* ③ 時間 */}
      <section className="crt-section crt-section-half">
        <SectionTitle
          icon={Calendar}
          label="時間安排"
          iconBg="#fff8e6"
          iconColor="#d97706"
        />
        <div className="crt-mobile-only">
          <div className="crt-tiles">
            <InfoTile
              label="開始日期"
              value={fmtDate(form.starts_at)}
              onClick={() => setDrawer("starts_at")}
            />
            <InfoTile
              label="開始時間"
              value={fmtTime(form.starts_at)}
              onClick={() => setDrawer("starts_at")}
            />
            <InfoTile
              label="結束時間"
              value={fmtTime(form.ends_at)}
              onClick={() => setDrawer("ends_at")}
            />
          </div>
          <p className="crt-time-hint">結束時間須與開始時間同一天</p>
        </div>
        <div className="crt-dsk-time-fields crt-desktop-only">
          <label className="crt-dsk-fl">
            <span className="crt-dsk-fl-label">開始時間</span>
            <input
              type="datetime-local"
              name="starts_at"
              value={form.starts_at}
              min={startsAtMin}
              onChange={(e) =>
                handleDatetimeChange("starts_at", e.target.value)
              }
              className="crt-input"
            />
          </label>
          <label className="crt-dsk-fl">
            <span className="crt-dsk-fl-label">結束時間（同一天）</span>
            <input
              type="datetime-local"
              name="ends_at"
              value={form.ends_at}
              min={endsAtBounds.min}
              max={endsAtBounds.max}
              onChange={(e) => handleDatetimeChange("ends_at", e.target.value)}
              className="crt-input"
            />
          </label>
          <p className="crt-time-hint">
            結束時間須與開始時間同一天，且晚於開始時間
          </p>
        </div>
      </section>

      {/* ④ 人數與程度 */}
      <section className="crt-section crt-section-half">
        <SectionTitle
          icon={Users}
          label="人數與程度"
          iconBg="#f3eeff"
          iconColor="#7c3aed"
        />

        <div className="crt-field-label">人數上限</div>
        <div className="crt-stepper">
          <button
            type="button"
            onClick={() =>
              set("max_players", Math.max(2, Number(form.max_players) - 2))
            }
            className="crt-stepper-btn"
          >
            <Minus size={18} />
          </button>
          <div className="crt-stepper-display">
            <span className="crt-stepper-num">{form.max_players}</span>
            <span className="crt-stepper-unit">人</span>
          </div>
          <button
            type="button"
            onClick={() =>
              set("max_players", Math.min(40, Number(form.max_players) + 2))
            }
            className="crt-stepper-btn"
          >
            <Plus size={18} />
          </button>
        </div>

        <div className="crt-field-label crt-field-label-spaced">程度建議</div>
        <div className="crt-skill-grid">
          {SKILL_OPTIONS.map((s) => (
            <button
              key={s.value}
              type="button"
              onClick={() => set("skill_level", s.value)}
              className={`crt-skill-card ${form.skill_level === s.value ? "active" : ""}`}
              style={
                form.skill_level === s.value
                  ? { background: s.color, borderColor: s.color, color: s.text }
                  : {}
              }
            >
              {s.label}
            </button>
          ))}
        </div>
      </section>

      {/* ⑤ 費用 */}
      <section className="crt-section crt-section-half crt-section-last">
        <SectionTitle
          icon={DollarSign}
          label="費用設定"
          iconBg="#fef2f2"
          iconColor="#dc2626"
        />

        <div className="crt-fee-row">
          <span className="crt-fee-label">每人費用</span>
          <div className="crt-fee-stepper">
            <button
              type="button"
              onClick={() =>
                set(
                  "fee_per_person",
                  Math.max(0, Number(form.fee_per_person) - 50),
                )
              }
              className="crt-stepper-btn crt-stepper-btn-sm"
            >
              <Minus size={14} />
            </button>
            <span className="crt-fee-value">
              NT${" "}
              {Number(form.fee_per_person) === 0 ? "免費" : form.fee_per_person}
            </span>
            <button
              type="button"
              onClick={() =>
                set("fee_per_person", Number(form.fee_per_person) + 50)
              }
              className="crt-stepper-btn crt-stepper-btn-sm"
            >
              <Plus size={14} />
            </button>
          </div>
        </div>

        <AnimatePresence>
          {showPaymentDetail && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="crt-fee-detail">
                <select
                  name="payment_method"
                  value={form.payment_method}
                  onChange={handleChange}
                  className="crt-input"
                >
                  {PAYMENT_METHODS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
                {["transfer", "line_pay", "other"].includes(
                  form.payment_method,
                ) && (
                  <textarea
                    name="payment_note"
                    value={form.payment_note}
                    onChange={handleChange}
                    rows={2}
                    placeholder="付款說明（帳號、連結等）"
                    className="crt-input crt-textarea"
                  />
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>
    </>
  );

  return (
    <>
      <Head>
        <title>我要開團 | PikFun</title>
      </Head>

      <div className="crt-page">
        {/* ── MOBILE HERO ─────────────────────────────── */}
        <div className="crt-hero crt-mobile-only">
          <div className="crt-hero-topbar">
            <Link href="/play" className="crt-hero-back">
              <ArrowLeft size={20} />
            </Link>
            <button type="button" className="crt-hero-bell">
              <Bell size={20} />
            </button>
          </div>

          <div className="crt-hero-body">
            <div className="crt-hero-greeting">
              {userInfo.avatar ? (
                <img src={userInfo.avatar} alt="" className="crt-hero-avatar" />
              ) : (
                <span className="crt-hero-avatar crt-hero-avatar-fallback">
                  {userInfo.name?.charAt(0) || "球"}
                </span>
              )}
              <div>
                <p className="crt-hero-hi">{greeting}，</p>
                <p className="crt-hero-name">{userInfo.name || "揪球員"}</p>
              </div>
            </div>

            <div className="crt-hero-main">
              <p className="crt-hero-date">{todayStr}</p>
              <h1 className="crt-hero-title">開揪球局</h1>
              <p className="crt-hero-sub">找球友一起上場 🏓</p>
            </div>

            <div className="crt-hero-tags">
              <span className="crt-hero-tag">雙打</span>
              <span className="crt-hero-tag">單打</span>
              <span className="crt-hero-tag">混打</span>
            </div>
          </div>
        </div>

        {/* ── DESKTOP HEADER (THEO) ───────────────────── */}
        <div className="crt-dsk-brand crt-desktop-only">
          <span className="crt-dsk-logo">PikFun</span>
          <div className="crt-dsk-icon" aria-hidden>
            <MapPin size={36} strokeWidth={1.25} />
          </div>
          <h1 className="crt-dsk-title">開揪球局</h1>
          <p className="crt-dsk-sub">
            {greeting}，{userInfo.name || "揪球員"}
            。填寫以下資訊，找球友一起上場
          </p>
        </div>

        {/* ── FORM ────────────────────────────────────── */}
        <div className="crt-sheet">
          <form
            id="crt-form"
            ref={formRef}
            onSubmit={handleSubmit}
            className="crt-form-grid"
          >
            {formSections}
          </form>
        </div>

        {/* ── DESKTOP CTA + INFO ──────────────────────── */}
        <div className="crt-dsk-actions crt-desktop-only">
          <p className="crt-dsk-note">
            發布揪團即表示你同意 PikPie 揪團使用規範，並確認所填資訊正確。
          </p>
          <ConfettiButton
            onClick={handleSubmitClick}
            successLabel="揪團成立！🎉"
            className="crt-btn-submit crt-btn-submit-dsk"
          >
            發布揪團
          </ConfettiButton>
          <Link href="/play" className="crt-dsk-footlink">
            返回揪團列表
          </Link>
        </div>

        <div className="crt-dsk-panel crt-desktop-only">
          <div className="crt-dsk-panel-inner">
            <h2 className="crt-dsk-panel-title">發布後，球友即可報名</h2>
            <p className="crt-dsk-panel-lead">
              完成上方表單並發布，你的球局會出現在 PikPie 揪團列表
            </p>

            <div className="crt-dsk-panel-grid">
              <div className="crt-dsk-panel-box">
                <p className="crt-dsk-panel-box-label">揪團預覽</p>
                <p className="crt-dsk-panel-highlight">
                  <em>{form.max_players} 人</em>
                  <span className="crt-dsk-panel-sep">·</span>
                  <em>{skill.label}</em>
                </p>
                <p className="crt-dsk-panel-meta">
                  {fmtDate(form.starts_at)} {fmtTime(form.starts_at)}–
                  {fmtTime(form.ends_at)}
                </p>
                {form.location_name ? (
                  <p className="crt-dsk-panel-meta">{form.location_name}</p>
                ) : (
                  <p className="crt-dsk-panel-meta crt-dsk-panel-meta--muted">
                    尚未選擇球場
                  </p>
                )}
              </div>
              <div className="crt-dsk-panel-box">
                <p className="crt-dsk-panel-box-label">每人費用</p>
                <p className="crt-dsk-panel-fee">
                  {Number(form.fee_per_person) === 0 ? (
                    <em>免費</em>
                  ) : (
                    <>
                      NT$ <em>{form.fee_per_person}</em>
                    </>
                  )}
                </p>
                <p className="crt-dsk-panel-meta">發布後仍可至揪團頁面編輯</p>
              </div>
            </div>

            <div className="crt-dsk-steps">
              <div className="crt-dsk-step-col">
                <h3 className="crt-dsk-step-heading">開團流程</h3>
                <ol className="crt-dsk-step-list">
                  <li>
                    <span className="crt-dsk-step-icon">
                      <Mail size={18} strokeWidth={1.5} />
                    </span>
                    填寫球場、時間與人數
                  </li>
                  <li>
                    <span className="crt-dsk-step-icon">
                      <UserCheck size={18} strokeWidth={1.5} />
                    </span>
                    發布揪團，分享給球友
                  </li>
                  <li>
                    <span className="crt-dsk-step-icon">
                      <Wallet size={18} strokeWidth={1.5} />
                    </span>
                    球友報名，到場開打
                  </li>
                </ol>
              </div>
              <div className="crt-dsk-step-col">
                <h3 className="crt-dsk-step-heading">小提醒</h3>
                <ul className="crt-dsk-tips">
                  <li>建議從球場列表選擇，地圖定位較準確</li>
                  <li>程度建議可幫助球友判斷是否適合</li>
                  <li>發布後可至揪團頁面管理報名</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* ── MOBILE STICKY CTA ───────────────────────── */}
        <div className="crt-sticky crt-mobile-only">
          <div className="crt-sticky-inner">
            <div className="crt-sticky-info">
              <div className="crt-sticky-line">
                <span className="crt-sticky-count">{form.max_players} 人</span>
                <span className="crt-sticky-sep">·</span>
                <span
                  className="crt-sticky-skill"
                  style={{ color: skill.text, background: skill.color }}
                >
                  {skill.label}
                </span>
              </div>
              <div className="crt-sticky-line crt-sticky-line-sub">
                {fmtDate(form.starts_at)} {fmtTime(form.starts_at)}
              </div>
            </div>
            <ConfettiButton
              onClick={handleSubmitClick}
              successLabel="成立！🎉"
              className="crt-btn-submit crt-btn-submit-sm crt-btn-submit-sticky"
            >
              發布揪團 <ChevronRight size={18} />
            </ConfettiButton>
          </div>
        </div>

        <div className="crt-mobile-spacer crt-mobile-only" aria-hidden />
      </div>

      {/* ── Datetime Drawer ────────────────────────────── */}
      <AnimatePresence>
        {drawer && (
          <DatetimeDrawer
            label={drawer === "starts_at" ? "開始時間" : "結束時間（同一天）"}
            value={form[drawer]}
            onChange={(e) => handleDatetimeChange(drawer, e.target.value)}
            onClose={() => setDrawer(null)}
            min={drawer === "starts_at" ? startsAtMin : endsAtBounds.min}
            max={drawer === "ends_at" ? endsAtBounds.max : undefined}
          />
        )}
      </AnimatePresence>

      <style jsx global>{`
        /* ─── layout visibility ───────────────────── */
        .crt-mobile-only {
          display: block;
        }
        .crt-desktop-only {
          display: none !important;
        }
        @media (min-width: 1024px) {
          .crt-mobile-only {
            display: none !important;
          }
          .crt-desktop-only {
            display: block !important;
          }
          .crt-btn-submit.crt-btn-submit-dsk {
            display: flex !important;
          }
        }

        /* ─── page & hero ──────────────────────────── */
        .crt-page {
          min-height: 100vh;
          background: #f0f4f8;
          padding-top: 3.5rem;
        }
        @media (min-width: 1024px) {
          .crt-page {
            padding-top: 6.5rem;
            padding-bottom: 5rem;
            background: #fff;
          }
        }

        .crt-hero {
          background: linear-gradient(
            155deg,
            #0a5bb5 0%,
            #1a3a8a 55%,
            #0d2668 100%
          );
          padding: 0 1.25rem 2.75rem;
          position: relative;
          overflow: hidden;
        }
        .crt-hero::before {
          content: "";
          position: absolute;
          inset: 0;
          background: url("data:image/svg+xml,%3Csvg width='200' height='200' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='160' cy='40' r='120' fill='rgba(255,255,255,0.04)'/%3E%3Ccircle cx='20' cy='170' r='80' fill='rgba(255,255,255,0.03)'/%3E%3C/svg%3E")
            no-repeat right top;
          background-size: 280px;
        }

        .crt-hero-topbar {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1rem 0;
        }
        .crt-hero-back,
        .crt-hero-bell {
          width: 2.5rem;
          height: 2.5rem;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.15);
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
          cursor: pointer;
          text-decoration: none;
          transition: background 0.2s;
        }
        .crt-hero-back:hover,
        .crt-hero-bell:hover {
          background: rgba(255, 255, 255, 0.25);
        }

        .crt-hero-body {
          position: relative;
        }

        .crt-hero-greeting {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 1.25rem;
        }
        .crt-hero-avatar {
          width: 3rem;
          height: 3rem;
          border-radius: 999px;
          object-fit: cover;
          border: 2.5px solid rgba(255, 255, 255, 0.6);
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
        }
        .crt-hero-avatar-fallback {
          background: linear-gradient(135deg, #c8f542, #86efac);
          color: #0f172a;
          font-size: 1.125rem;
          font-weight: 900;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .crt-hero-hi {
          font-size: 0.75rem;
          color: rgba(255, 255, 255, 0.7);
          margin: 0;
          font-weight: 500;
        }
        .crt-hero-name {
          font-size: 1rem;
          font-weight: 800;
          color: #fff;
          margin: 0;
        }

        .crt-hero-main {
          margin-bottom: 1.25rem;
        }
        .crt-hero-date {
          font-size: 0.6875rem;
          color: rgba(255, 255, 255, 0.6);
          letter-spacing: 0.08em;
          margin: 0 0 0.25rem;
          font-weight: 600;
        }
        .crt-hero-title {
          font-size: 2.5rem;
          font-weight: 900;
          color: #fff;
          line-height: 1.1;
          margin: 0 0 0.375rem;
          letter-spacing: -0.01em;
        }
        .crt-hero-sub {
          font-size: 0.9375rem;
          color: rgba(255, 255, 255, 0.75);
          margin: 0;
        }

        .crt-hero-tags {
          display: flex;
          gap: 0.5rem;
        }
        .crt-hero-tag {
          padding: 0.3rem 0.875rem;
          border-radius: 999px;
          font-size: 0.75rem;
          font-weight: 700;
          color: rgba(255, 255, 255, 0.85);
          border: 1.5px solid rgba(255, 255, 255, 0.3);
          background: rgba(255, 255, 255, 0.08);
        }

        /* ─── desktop brand (THEO) ────────────────── */
        .crt-dsk-brand {
          text-align: center;
          max-width: 28rem;
          margin: 0 auto;
          padding: 0 1.5rem 1.75rem;
        }
        .crt-dsk-logo {
          display: block;
          font-size: 2rem;
          font-weight: 900;
          color: #1a9be8;
          letter-spacing: -0.03em;
          margin-bottom: 1.5rem;
        }
        .crt-dsk-icon {
          color: #1a9be8;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 1.5rem;
        }
        .crt-dsk-title {
          font-size: 1.375rem;
          font-weight: 700;
          color: #1a1a1a;
          margin: 0 0 0.75rem;
          letter-spacing: 0.01em;
        }
        .crt-dsk-sub {
          font-size: 0.875rem;
          color: #6b7280;
          margin: 0;
          line-height: 1.7;
        }

        .crt-dsk-actions {
          max-width: 28rem;
          margin: 0 auto;
          padding: 0 1.5rem;
          text-align: center;
        }
        .crt-dsk-note {
          font-size: 0.6875rem;
          color: #9ca3af;
          line-height: 1.7;
          margin: 0 0 1.25rem;
        }
        .crt-dsk-footlink {
          display: inline-block;
          margin-top: 1.25rem;
          font-size: 0.8125rem;
          font-weight: 600;
          color: #1a9be8;
          text-decoration: none;
        }
        .crt-dsk-footlink:hover {
          text-decoration: underline;
        }

        .crt-dsk-fl {
          display: block;
          margin-bottom: 1.5rem;
        }
        .crt-dsk-fl-label {
          display: block;
          font-size: 0.75rem;
          font-weight: 600;
          color: #6b7280;
          margin-bottom: 0.375rem;
        }
        .crt-dsk-time-fields {
          margin-top: 0.25rem;
        }
        .crt-time-hint {
          font-size: 0.6875rem;
          color: #94a3b8;
          margin: -0.5rem 0 0;
          line-height: 1.5;
        }
        @media (min-width: 1024px) {
          .crt-time-hint {
            margin-top: -0.25rem;
          }
        }

        /* ─── bottom sheet / form ─────────────────── */
        .crt-sheet {
          background: #fff;
          border-radius: 2rem 2rem 0 0;
          margin-top: -2rem;
          padding: 1.75rem 1.25rem 1.5rem;
          position: relative;
          min-height: 60vh;
        }
        @media (min-width: 1024px) {
          .crt-sheet {
            max-width: 28rem;
            margin: 0 auto;
            margin-top: 0;
            border-radius: 0;
            padding: 0 1.5rem;
            box-shadow: none;
            border: none;
            min-height: auto;
            background: transparent;
          }
          .crt-dsk-actions {
            margin-top: 0.5rem;
          }
        }

        .crt-form-grid {
          display: block;
        }

        /* ─── section ─────────────────────────────── */
        .crt-section {
          padding-bottom: 1.5rem;
          margin-bottom: 1.5rem;
          border-bottom: 1px solid #f1f5f9;
        }
        .crt-section:last-of-type {
          border-bottom: none;
        }
        @media (min-width: 1024px) {
          .crt-section {
            border-bottom: none;
            padding-bottom: 0;
            margin-bottom: 0;
          }
          .crt-sec-icon {
            display: none;
          }
          .crt-sec-title {
            margin-bottom: 0.875rem;
            margin-top: 2rem;
          }
          .crt-form-grid > .crt-section:first-child .crt-sec-title {
            margin-top: 0;
          }
          .crt-sec-label {
            font-size: 0.75rem;
            font-weight: 600;
            color: #6b7280;
          }
        }

        .crt-sec-title {
          display: flex;
          align-items: center;
          gap: 0.625rem;
          margin-bottom: 1rem;
        }
        .crt-sec-icon {
          width: 2rem;
          height: 2rem;
          border-radius: 0.625rem;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .crt-sec-label {
          font-size: 0.9375rem;
          font-weight: 800;
          color: #0f172a;
        }

        .crt-field-label {
          font-size: 0.6875rem;
          font-weight: 700;
          color: #64748b;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          margin-bottom: 0.625rem;
        }
        .crt-field-label-spaced {
          margin-top: 1rem;
        }

        /* ─── input ───────────────────────────────── */
        .crt-input {
          width: 100%;
          background: #f8fafc;
          border: 1.5px solid #e8edf3;
          border-radius: 1rem;
          padding: 0.875rem 1rem;
          font-size: 0.9375rem;
          color: #0f172a;
          outline: none;
          transition:
            border-color 0.2s,
            box-shadow 0.2s;
          margin-bottom: 0.625rem;
          display: block;
          font-family: inherit;
        }
        .crt-input::placeholder {
          color: #94a3b8;
        }
        .crt-input:focus {
          border-color: #005caf;
          box-shadow: 0 0 0 3px rgba(0, 92, 175, 0.1);
        }
        .crt-textarea {
          resize: none;
          min-height: 76px;
        }
        @media (min-width: 1024px) {
          .crt-input {
            background: transparent;
            border: none;
            border-bottom: 1px solid #d1d5db;
            border-radius: 0;
            padding: 0.5rem 0 0.625rem;
            margin-bottom: 0;
            font-size: 0.9375rem;
          }
          .crt-input::placeholder {
            color: #c4c9d0;
          }
          .crt-input:focus {
            border-bottom-color: #1a9be8;
            box-shadow: none;
          }
          .crt-textarea {
            min-height: 72px;
            border: none;
            border-bottom: 1px solid #d1d5db;
            border-radius: 0;
            padding: 0.5rem 0 0.625rem;
            background: transparent;
            margin-top: 0.25rem;
          }
          .crt-textarea:focus {
            border-bottom-color: #1a9be8;
            box-shadow: none;
          }
          .crt-select {
            border: none;
            border-bottom: 1px solid #d1d5db;
            border-radius: 0;
            padding: 0.5rem 1.5rem 0.625rem 0;
            background-color: transparent;
            font-weight: 500;
          }
          .crt-select:focus {
            border-bottom-color: #1a9be8;
            box-shadow: none;
          }
          .crt-court-steps {
            grid-template-columns: 1fr;
            gap: 0;
          }
          .crt-court-field {
            margin-bottom: 1.25rem;
          }
          .crt-court-label {
            font-size: 0.75rem;
            font-weight: 600;
            color: #6b7280;
            text-transform: none;
            letter-spacing: 0;
          }
          .crt-court-fchip {
            border: none;
            border-bottom: 1px solid #d1d5db;
            border-radius: 0;
            background: transparent;
            padding: 0.5rem 0;
            font-size: 0.8125rem;
            font-weight: 500;
            color: #6b7280;
          }
          .crt-court-fchip.active {
            color: #1a9be8;
            background: transparent;
            border-bottom-color: #1a9be8;
            box-shadow: none;
          }
          .crt-court-selected {
            border: none;
            border-bottom: 1px solid #d1d5db;
            border-radius: 0;
            background: transparent;
            padding: 0.75rem 0;
          }
          .crt-court-sel-icon {
            display: none;
          }
          .crt-court-preview {
            border: none;
            background: transparent;
            padding: 0.5rem 0 0;
          }
          .crt-stepper {
            background: transparent;
            border: none;
            border-bottom: 1px solid #d1d5db;
            border-radius: 0;
            padding: 0.375rem 0 0.625rem;
          }
          .crt-stepper-btn {
            width: 2rem;
            height: 2rem;
            background: #1a9be8;
            box-shadow: none;
          }
          .crt-stepper-num {
            font-size: 1.5rem;
            font-weight: 700;
          }
          .crt-skill-grid {
            grid-template-columns: repeat(4, 1fr);
            gap: 0.5rem;
            margin-top: 0.5rem;
          }
          .crt-skill-card {
            border-radius: 999px;
            padding: 0.5rem 0.25rem;
            font-size: 0.75rem;
            font-weight: 600;
            border: 1px solid #e5e7eb;
          }
          .crt-fee-row {
            background: transparent;
            border: none;
            border-bottom: 1px solid #d1d5db;
            border-radius: 0;
            padding: 0.375rem 0 0.625rem;
            margin-bottom: 0;
          }
          .crt-field-label {
            text-transform: none;
            letter-spacing: 0;
            font-size: 0.75rem;
            color: #6b7280;
          }
        }

        /* ─── tiles (time display) ───────────────── */
        .crt-tiles {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 0.625rem;
        }
        @media (max-width: 400px) {
          .crt-tiles {
            grid-template-columns: 1fr 1fr;
          }
          .crt-tile-value {
            font-size: 0.875rem;
          }
          .crt-stepper-num {
            font-size: 1.75rem;
          }
          .crt-stepper-btn {
            width: 2.75rem;
            height: 2.75rem;
          }
          .crt-fee-row {
            flex-direction: column;
            align-items: stretch;
            gap: 0.75rem;
          }
          .crt-fee-stepper {
            justify-content: center;
          }
        }
        .crt-tile {
          background: #005caf;
          border-radius: 1rem;
          padding: 0.875rem 0.75rem;
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
          text-align: left;
          border: none;
          cursor: pointer;
          transition:
            opacity 0.15s,
            transform 0.15s;
          position: relative;
          overflow: hidden;
        }
        .crt-tile:active {
          transform: scale(0.97);
          opacity: 0.9;
        }
        .crt-tile-wide {
          grid-column: span 2;
        }
        .crt-tile-lime {
          background: #c8f542;
        }
        .crt-tile-label {
          font-size: 0.625rem;
          font-weight: 700;
          color: rgba(255, 255, 255, 0.75);
          letter-spacing: 0.06em;
          text-transform: uppercase;
        }
        .crt-tile-lime .crt-tile-label {
          color: rgba(0, 0, 0, 0.5);
        }
        .crt-tile-value {
          font-size: 1rem;
          font-weight: 800;
          color: #fff;
          line-height: 1.2;
        }
        .crt-tile-lime .crt-tile-value {
          color: #0f172a;
        }
        .crt-tile-arrow {
          position: absolute;
          top: 0.625rem;
          right: 0.625rem;
          color: rgba(255, 255, 255, 0.6);
        }
        .crt-tile-lime .crt-tile-arrow {
          color: rgba(0, 0, 0, 0.35);
        }

        /* ─── stepper ─────────────────────────────── */
        .crt-stepper {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: #f8fafc;
          border: 1.5px solid #e8edf3;
          border-radius: 1.25rem;
          padding: 0.5rem;
        }
        .crt-stepper-btn {
          width: 3rem;
          height: 3rem;
          border-radius: 999px;
          background: #005caf;
          color: #fff;
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition:
            opacity 0.2s,
            transform 0.15s;
          flex-shrink: 0;
          box-shadow: 0 4px 12px rgba(0, 92, 175, 0.3);
        }
        .crt-stepper-btn-sm {
          width: 2.25rem;
          height: 2.25rem;
          box-shadow: 0 2px 8px rgba(0, 92, 175, 0.25);
        }
        .crt-stepper-btn:active {
          transform: scale(0.93);
          opacity: 0.85;
        }
        .crt-stepper-display {
          display: flex;
          align-items: baseline;
          gap: 0.25rem;
        }
        .crt-stepper-num {
          font-size: 2.25rem;
          font-weight: 900;
          color: #0f172a;
          line-height: 1;
        }
        .crt-stepper-unit {
          font-size: 1rem;
          font-weight: 700;
          color: #64748b;
        }

        /* ─── skill grid ──────────────────────────── */
        .crt-skill-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.625rem;
        }
        .crt-skill-card {
          padding: 0.75rem;
          border-radius: 1rem;
          font-size: 0.875rem;
          font-weight: 700;
          border: 1.5px solid #e2e8f0;
          background: #fff;
          color: #475569;
          cursor: pointer;
          transition: all 0.2s;
          text-align: center;
        }
        .crt-skill-card:active {
          transform: scale(0.97);
        }

        /* ─── fee row ─────────────────────────────── */
        .crt-fee-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: #f8fafc;
          border: 1.5px solid #e8edf3;
          border-radius: 1.25rem;
          padding: 1rem 1.25rem;
          margin-bottom: 0.625rem;
        }
        .crt-fee-label {
          font-size: 0.9375rem;
          font-weight: 700;
          color: #0f172a;
        }
        .crt-fee-stepper {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }
        .crt-fee-value {
          font-size: 1.125rem;
          font-weight: 800;
          color: #005caf;
          min-width: 5rem;
          text-align: center;
        }
        .crt-fee-detail {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        /* ─── court search ────────────────────────── */
        .crt-court-wrap {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .crt-court-filters {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
        }
        .crt-court-fchip {
          padding: 0.375rem 0.875rem;
          border-radius: 999px;
          font-size: 0.75rem;
          font-weight: 700;
          border: 1.5px solid #e2e8f0;
          background: #fff;
          color: #475569;
          cursor: pointer;
          transition: all 0.2s;
        }
        .crt-court-fchip.active {
          background: #005caf;
          border-color: #005caf;
          color: #fff;
          box-shadow: 0 4px 12px rgba(0, 92, 175, 0.25);
        }

        .crt-court-search-wrap {
          position: relative;
        }
        .crt-search-row {
          position: relative;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .crt-search-icon {
          position: absolute;
          left: 1rem;
          color: #94a3b8;
          pointer-events: none;
        }
        .crt-search-input {
          padding-left: 2.5rem !important;
        }

        .crt-court-list {
          background: #fff;
          border: 1.5px solid #e8edf3;
          border-radius: 1.25rem;
          overflow: hidden;
          margin-top: 0.5rem;
          box-shadow: 0 8px 32px rgba(15, 23, 42, 0.08);
        }
        .crt-court-row {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.875rem 1rem;
          width: 100%;
          text-align: left;
          background: transparent;
          border: none;
          border-bottom: 1px solid #f1f5f9;
          cursor: pointer;
          transition: background 0.15s;
        }
        .crt-court-row:last-child {
          border-bottom: none;
        }
        .crt-court-row:hover {
          background: #f8fafc;
        }
        .crt-court-row-icon {
          width: 2.25rem;
          height: 2.25rem;
          border-radius: 0.75rem;
          background: #eef5fb;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #005caf;
          flex-shrink: 0;
        }
        .crt-court-row-info {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 0.125rem;
          min-width: 0;
        }
        .crt-court-row-name {
          font-size: 0.875rem;
          font-weight: 700;
          color: #0f172a;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .crt-court-row-addr {
          font-size: 0.75rem;
          color: #94a3b8;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .crt-court-row-badge {
          font-size: 0.6875rem;
          font-weight: 700;
          color: #005caf;
          background: #eef5fb;
          padding: 0.2rem 0.5rem;
          border-radius: 999px;
          flex-shrink: 0;
        }

        .crt-court-selected {
          display: flex;
          align-items: center;
          gap: 0.875rem;
          background: #eef8ff;
          border: 1.5px solid #bfdbfe;
          border-radius: 1.25rem;
          padding: 1rem 1.25rem;
        }
        .crt-court-sel-icon {
          width: 2.5rem;
          height: 2.5rem;
          border-radius: 0.875rem;
          background: #005caf;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
          flex-shrink: 0;
        }
        .crt-court-sel-info {
          flex: 1;
          min-width: 0;
        }
        .crt-court-sel-name {
          font-size: 0.9375rem;
          font-weight: 800;
          color: #0f172a;
          margin: 0 0 0.125rem;
        }
        .crt-court-sel-addr {
          font-size: 0.75rem;
          color: #64748b;
          margin: 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .crt-court-change {
          font-size: 0.75rem;
          font-weight: 700;
          color: #005caf;
          background: #fff;
          border: 1.5px solid #bfdbfe;
          border-radius: 999px;
          padding: 0.35rem 0.875rem;
          cursor: pointer;
          flex-shrink: 0;
          white-space: nowrap;
        }
        .crt-court-manual {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .crt-court-steps {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.75rem;
        }
        @media (max-width: 480px) {
          .crt-court-steps {
            grid-template-columns: 1fr;
          }
        }
        .crt-court-field {
          display: flex;
          flex-direction: column;
          gap: 0.375rem;
        }
        .crt-court-label {
          font-size: 0.6875rem;
          font-weight: 800;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: #64748b;
        }
        .crt-select {
          width: 100%;
          appearance: none;
          background: #fff
            url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")
            no-repeat right 0.875rem center;
          border: 1.5px solid #e2e8f0;
          border-radius: 1rem;
          padding: 0.75rem 2.25rem 0.75rem 1rem;
          font-size: 0.875rem;
          font-weight: 600;
          color: #0f172a;
          transition: border-color 0.2s;
        }
        .crt-select:focus {
          outline: none;
          border-color: #005caf;
          box-shadow: 0 0 0 3px rgba(0, 92, 175, 0.1);
        }
        .crt-select:disabled {
          background-color: #f8fafc;
          color: #94a3b8;
          cursor: not-allowed;
        }
        .crt-select--court {
          font-weight: 700;
        }
        .crt-court-select-row {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .crt-court-geo-row {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          flex-wrap: wrap;
        }
        .crt-court-geo-btn {
          font-size: 0.75rem;
          font-weight: 700;
          color: #005caf;
          background: #eef5fb;
          border: none;
          border-radius: 999px;
          padding: 0.4rem 0.875rem;
          cursor: pointer;
        }
        .crt-court-geo-btn:disabled {
          opacity: 0.6;
          cursor: wait;
        }
        .crt-court-hint {
          font-size: 0.6875rem;
          color: #94a3b8;
          margin: 0;
        }
        .crt-court-hint--google {
          color: #005caf;
          font-weight: 600;
        }
        .crt-court-preview {
          display: flex;
          align-items: flex-start;
          gap: 0.5rem;
          padding: 0.75rem 1rem;
          background: #f8fafc;
          border-radius: 0.875rem;
          border: 1px solid #e8edf3;
        }
        .crt-court-preview-addr {
          font-size: 0.75rem;
          color: #64748b;
          line-height: 1.4;
        }

        /* ─── submit button ───────────────────────── */
        .crt-btn-submit.cfb-btn {
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
        }
        .crt-btn-submit {
          display: flex;
          width: 100%;
          padding: 1.0625rem 1.5rem;
          border-radius: 999px;
          background: linear-gradient(135deg, #005caf, #1a3a8a);
          color: #fff;
          font-size: 1rem;
          font-weight: 800;
          letter-spacing: 0.04em;
          border: none;
          box-shadow: 0 8px 28px rgba(0, 92, 175, 0.4);
          cursor: pointer;
          transition:
            opacity 0.2s,
            transform 0.15s;
          margin-top: 1rem;
        }
        .crt-btn-submit:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .crt-btn-submit:not(:disabled):active {
          transform: scale(0.98);
        }
        .crt-btn-submit-sm {
          padding: 0.875rem 1.25rem;
          font-size: 0.9375rem;
          margin-top: 0;
        }
        .crt-btn-submit-sticky {
          width: auto !important;
          flex-shrink: 0;
          min-width: 7.5rem;
        }
        .crt-btn-submit-dsk {
          width: 100%;
          max-width: 100%;
          margin: 0;
          padding: 1rem 2rem;
          border-radius: 999px;
          background: #1a9be8;
          box-shadow: none;
          font-size: 0.9375rem;
          font-weight: 700;
          letter-spacing: 0.02em;
        }
        .crt-btn-submit-dsk:hover {
          opacity: 0.92;
        }

        /* ─── sticky bar (mobile) ─────────────────── */
        .crt-sticky {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          z-index: 50;
          padding: 0.75rem 1rem calc(0.75rem + env(safe-area-inset-bottom, 0px));
          background: #fff;
          border-top: 1px solid #e8edf3;
          box-shadow: 0 -4px 24px rgba(15, 23, 42, 0.08);
        }
        .crt-sticky-inner {
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto;
          align-items: center;
          gap: 0.75rem;
          max-width: 32rem;
          margin: 0 auto;
        }
        .crt-sticky-info {
          min-width: 0;
          overflow: hidden;
        }
        .crt-sticky-line {
          display: flex;
          align-items: center;
          gap: 0.375rem;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .crt-sticky-line-sub {
          font-size: 0.6875rem;
          color: #94a3b8;
          font-weight: 600;
          margin-top: 0.125rem;
        }
        .crt-sticky-count {
          font-size: 0.8125rem;
          font-weight: 800;
          color: #005caf;
          flex-shrink: 0;
        }
        .crt-sticky-sep {
          color: #cbd5e1;
          font-size: 0.75rem;
          flex-shrink: 0;
        }
        .crt-sticky-skill {
          font-size: 0.625rem;
          font-weight: 800;
          padding: 0.15rem 0.5rem;
          border-radius: 999px;
          flex-shrink: 0;
          max-width: 5.5rem;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .crt-mobile-spacer {
          height: calc(5.5rem + env(safe-area-inset-bottom, 0px));
          flex-shrink: 0;
        }

        /* ─── desktop info panel (THEO) ───────────── */
        .crt-dsk-panel {
          max-width: 54rem;
          margin: 2.5rem auto 0;
          padding: 0 1.5rem;
        }
        .crt-dsk-panel-inner {
          width: 100%;
          background: #fff;
          border: 1px solid #b8d4f0;
          border-radius: 0.75rem;
          padding: 2.5rem 2.75rem 2.25rem;
        }
        .crt-dsk-panel-title {
          text-align: center;
          font-size: 1.125rem;
          font-weight: 700;
          color: #1a9be8;
          margin: 0 0 0.5rem;
        }
        .crt-dsk-panel-lead {
          text-align: center;
          font-size: 0.8125rem;
          color: #6b7280;
          margin: 0 0 2rem;
          line-height: 1.6;
        }
        .crt-dsk-panel-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.25rem;
          margin-bottom: 2rem;
        }
        .crt-dsk-panel-box {
          border: 1px solid #b8d4f0;
          border-radius: 0.5rem;
          padding: 1.5rem 1.25rem;
          text-align: center;
        }
        .crt-dsk-panel-box-label {
          font-size: 0.8125rem;
          font-weight: 600;
          color: #374151;
          margin: 0 0 0.75rem;
        }
        .crt-dsk-panel-highlight {
          font-size: 0.9375rem;
          font-weight: 700;
          color: #1a9be8;
          margin: 0 0 0.5rem;
        }
        .crt-dsk-panel-highlight em {
          font-style: normal;
          background: linear-gradient(transparent 58%, #fef08a 58%);
        }
        .crt-dsk-panel-sep {
          color: #9ca3af;
          margin: 0 0.25rem;
        }
        .crt-dsk-panel-fee {
          font-size: 1.75rem;
          font-weight: 700;
          color: #1a9be8;
          margin: 0 0 0.5rem;
          line-height: 1.2;
        }
        .crt-dsk-panel-fee em {
          font-style: normal;
          background: linear-gradient(transparent 58%, #fef08a 58%);
        }
        .crt-dsk-panel-meta {
          font-size: 0.75rem;
          color: #6b7280;
          margin: 0.125rem 0 0;
          line-height: 1.5;
        }
        .crt-dsk-panel-meta--muted {
          color: #9ca3af;
        }
        .crt-dsk-steps {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 2.5rem;
          border-top: 1px solid #e5e7eb;
          padding-top: 2rem;
        }
        .crt-dsk-step-heading {
          font-size: 0.875rem;
          font-weight: 700;
          color: #374151;
          margin: 0 0 1.25rem;
        }
        .crt-dsk-step-list {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 1.125rem;
        }
        .crt-dsk-step-list li {
          display: flex;
          align-items: center;
          gap: 0.875rem;
          font-size: 0.8125rem;
          color: #4b5563;
          line-height: 1.5;
        }
        .crt-dsk-step-icon {
          width: 2.25rem;
          height: 2.25rem;
          border-radius: 999px;
          background: #eef6fc;
          color: #1a9be8;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .crt-dsk-tips {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        .crt-dsk-tips li {
          font-size: 0.8125rem;
          color: #6b7280;
          line-height: 1.6;
          padding-left: 0.875rem;
          position: relative;
        }
        .crt-dsk-tips li::before {
          content: "·";
          position: absolute;
          left: 0;
          color: #1a9be8;
          font-weight: 900;
        }

        /* ─── datetime drawer ─────────────────────── */
        .crt-drawer-overlay {
          position: fixed;
          inset: 0;
          z-index: 100;
          background: rgba(15, 23, 42, 0.5);
          display: flex;
          align-items: flex-end;
        }
        .crt-drawer {
          width: 100%;
          background: #fff;
          border-radius: 1.5rem 1.5rem 0 0;
          padding: 1.25rem 1.25rem
            calc(1.25rem + env(safe-area-inset-bottom, 0px));
        }
        .crt-drawer-handle {
          width: 3rem;
          height: 0.25rem;
          background: #e2e8f0;
          border-radius: 999px;
          margin: 0 auto 1.25rem;
        }
        .crt-drawer-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 1.25rem;
        }
        .crt-drawer-title {
          font-size: 1.0625rem;
          font-weight: 800;
          color: #0f172a;
        }
        .crt-drawer-close {
          width: 2rem;
          height: 2rem;
          border-radius: 999px;
          background: #f1f5f9;
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: #475569;
        }
        .crt-dt-input {
          width: 100%;
          background: #f8fafc;
          border: 1.5px solid #e8edf3;
          border-radius: 1rem;
          padding: 0.875rem 1rem;
          font-size: 1rem;
          color: #0f172a;
          outline: none;
          margin-bottom: 1rem;
        }
        .crt-dt-input:focus {
          border-color: #005caf;
        }
        .crt-drawer-confirm {
          width: 100%;
          padding: 0.9375rem;
          border-radius: 999px;
          background: linear-gradient(135deg, #005caf, #1a3a8a);
          color: #fff;
          font-size: 1rem;
          font-weight: 800;
          border: none;
          cursor: pointer;
          box-shadow: 0 6px 20px rgba(0, 92, 175, 0.35);
        }
      `}</style>
    </>
  );
}
