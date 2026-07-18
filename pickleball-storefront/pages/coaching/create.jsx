"use client";

import { useState, useEffect, useRef } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { motion } from "framer-motion";
import Image from "next/image";
import {
  ArrowLeft,
  Loader2,
  ChevronRight,
  Upload,
  X,
  Bell,
  FileText,
  MapPin,
  Calendar,
  Users,
  DollarSign,
  ImageIcon,
  GraduationCap,
  Mail,
  UserCheck,
  Wallet,
  Minus,
  Plus,
} from "lucide-react";
import { useUser } from "@/components/context/UserContext";
import {
  getClassTypeOptions,
  getSkillOptions,
  getPaymentOptions,
  getClassTypeLabel,
  getSkillLabel,
} from "@/lib/coachUtils";
import CourtPicker from "@/components/play/CourtPicker";
import ConfettiButton from "@/components/ui/ConfettiButton";
import CreatePageStyles from "@/components/play/CreatePageStyles";
import LiquidNeonBg from "@/components/play/LiquidNeonBg";

export async function getStaticProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ["coaching", "play", "common"])),
    },
  };
}

const STUDENT_OPTIONS = [1, 2, 4, 6, 8, 10, 12, 16];

function toLocalDatetimeValue(date) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function pad(n) {
  return String(n).padStart(2, "0");
}
function fmtDate(iso, weekdays) {
  if (!iso) return "—";
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()} (${weekdays[d.getDay()]})`;
}
function fmtTime(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/* ─── Section row header（同揪團頁） ─────────────────── */
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

export default function CreateCoachingPage() {
  const { t } = useTranslation("coaching");
  const CLASS_TYPE_OPTIONS = getClassTypeOptions(t);
  const SKILL_OPTIONS = getSkillOptions(t);
  const PAYMENT_OPTIONS = getPaymentOptions(t);
  const weekdays = t("common.weekdays", { returnObjects: true });
  const router = useRouter();
  const { userInfo, loading: userLoading } = useUser();
  const formRef = useRef(null);
  const pendingIdRef = useRef(null);
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState("");
  const [uploadingCover, setUploadingCover] = useState(false);
  const [coachCheckLoading, setCoachCheckLoading] = useState(true);
  const [isApprovedCoach, setIsApprovedCoach] = useState(false);

  const defaultStart = new Date();
  defaultStart.setHours(defaultStart.getHours() + 24, 0, 0, 0);

  const defaultEnd = new Date(defaultStart);
  defaultEnd.setHours(defaultEnd.getHours() + 2);

  const [form, setForm] = useState({
    title: "",
    description: "",
    curriculum: "",
    class_type: "group",
    skill_level: "all",
    location_name: "",
    location_address: "",
    latitude: null,
    longitude: null,
    court_id: null,
    starts_at: toLocalDatetimeValue(defaultStart),
    ends_at: toLocalDatetimeValue(defaultEnd),
    max_students: 4,
    price_per_person: 0,
    payment_method: "free",
    payment_note: "",
    coach_bio: "",
  });

  useEffect(() => {
    if (!userLoading && !userInfo) {
      router.push("/login?redirect=/coaching/create");
    }
  }, [userLoading, userInfo, router]);

  useEffect(() => {
    if (userLoading || !userInfo?.email) return;
    const params = new URLSearchParams({ email: userInfo.email });
    if (userInfo.id) params.set("member_id", userInfo.id);
    fetch(`/api/member/coaching?${params}`)
      .then((r) => r.json())
      .then((d) => {
        const approved =
          d.application?.status === "approved" || d.isFeaturedCoach;
        setIsApprovedCoach(approved);
      })
      .catch(() => setIsApprovedCoach(false))
      .finally(() => setCoachCheckLoading(false));
  }, [userLoading, userInfo]);

  const set = (name, value) => setForm((prev) => ({ ...prev, [name]: value }));

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => {
      const next = { ...prev, [name]: value };
      if (name === "price_per_person") {
        const price = Number(value) || 0;
        if (price === 0) next.payment_method = "free";
        else if (prev.payment_method === "free") next.payment_method = "cash";
      }
      if (name === "payment_method" && value === "free") {
        next.price_per_person = 0;
      }
      // 手動改動場地名稱／地址時，清除先前對應到的球場，避免地圖誤標
      if (name === "location_name" || name === "location_address") {
        next.court_id = null;
        next.latitude = null;
        next.longitude = null;
      }
      return next;
    });
  };

  const stepStudents = (dir) => {
    const idx = STUDENT_OPTIONS.indexOf(Number(form.max_students));
    const nextIdx = Math.min(
      STUDENT_OPTIONS.length - 1,
      Math.max(0, (idx === -1 ? 2 : idx) + dir),
    );
    set("max_students", STUDENT_OPTIONS[nextIdx]);
  };

  const stepPrice = (dir) => {
    const next = Math.max(0, Number(form.price_per_person) + dir * 50);
    setForm((prev) => ({
      ...prev,
      price_per_person: next,
      payment_method:
        next === 0
          ? "free"
          : prev.payment_method === "free"
            ? "cash"
            : prev.payment_method,
    }));
  };

  const showPaymentDetail = Number(form.price_per_person) > 0;
  const showPaymentNote = ["transfer", "line_pay", "other"].includes(
    form.payment_method,
  );

  const handleCoverChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert(t("create.errors.image_type"));
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      alert(t("create.errors.image_size"));
      return;
    }

    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
    e.target.value = "";
  };

  const removeCover = () => {
    setCoverFile(null);
    if (coverPreview) URL.revokeObjectURL(coverPreview);
    setCoverPreview("");
  };

  const uploadCover = async (file) => {
    const base64 = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    const res = await fetch("/api/coach-classes/upload-cover", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        imageBase64: base64,
        fileName: file.name,
        contentType: file.type,
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || t("create.errors.cover_upload_failed"));
    return data.url;
  };

  const doSubmit = async () => {
    let coverImageUrl = null;
    if (coverFile) {
      setUploadingCover(true);
      try {
        coverImageUrl = await uploadCover(coverFile);
      } finally {
        setUploadingCover(false);
      }
    }

    const res = await fetch("/api/coach-classes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        starts_at: new Date(form.starts_at).toISOString(),
        ends_at: form.ends_at ? new Date(form.ends_at).toISOString() : null,
        max_students: Number(form.max_students),
        price_per_person: Number(form.price_per_person) || 0,
        payment_method: form.payment_method,
        payment_note: form.payment_note || null,
        cover_image: coverImageUrl,
        coach_email: userInfo.email,
        coach_name: userInfo.name || t("card.coach_fallback"),
        coach_avatar: userInfo.avatar || null,
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || t("create.errors.submit_failed"));
    pendingIdRef.current = data.class.id;
  };

  // ConfettiButton 觸發：成功後放彩帶，再導向課程頁
  const handleSubmitClick = async () => {
    if (!userInfo?.email) throw new Error(t("create.errors.login_required"));

    if (formRef.current && !formRef.current.reportValidity()) {
      throw new Error(t("create.errors.validation"));
    }
    if (!form.location_name?.trim() || !form.location_address?.trim()) {
      alert(t("create.errors.location_required"));
      throw new Error(t("create.errors.location_required"));
    }

    try {
      await doSubmit();
      setTimeout(() => router.push(`/coaching/${pendingIdRef.current}`), 1400);
    } catch (err) {
      alert(err.message || t("create.errors.network"));
      throw err;
    }
  };

  const handleSubmit = (e) => {
    if (e?.preventDefault) e.preventDefault();
  };

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 6) return t("create.greeting.dawn");
    if (h < 12) return t("create.greeting.morning");
    if (h < 18) return t("create.greeting.afternoon");
    return t("create.greeting.evening");
  })();

  const todayStr = (() => {
    const d = new Date();
    return t("create.today_date", { month: d.getMonth() + 1, day: d.getDate() });
  })();

  const classTypeLabel = getClassTypeLabel(form.class_type, t) || t("enums.class_type.fallback");
  const skillLabel = getSkillLabel(form.skill_level, t) || t("enums.skill.all");

  if (userLoading || !userInfo || coachCheckLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-[#94a3b8] bg-[#f0f4f8]">
        <Loader2 className="animate-spin mr-2" size={20} /> {t("create.loading")}
      </div>
    );
  }

  if (!isApprovedCoach) {
    return (
      <>
        <Head>
          <title>{t("seo.create_title")}</title>
        </Head>
        <main className="min-h-screen pt-24 pb-20 bg-[#f0f4f8] flex items-center justify-center px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl border border-gray-200 p-8 max-w-md w-full text-center shadow-sm"
          >
            <div className="w-16 h-16 bg-[#eef5fb] rounded-full flex items-center justify-center mx-auto mb-5">
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#005caf"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>
            <h2 className="text-xl font-black text-black mb-2">
              {t("create.gate.title")}
            </h2>
            <p className="text-gray-500 text-sm leading-relaxed mb-6">
              {t("create.gate.desc_line1")}
              <br />
              {t("create.gate.desc_line2")}
            </p>
            <div className="space-y-3">
              <Link
                href="/coaching/apply"
                className="block w-full bg-[#005caf] hover:bg-[#1a3a8a] text-white font-bold py-3 px-6 rounded-xl transition-colors text-sm"
              >
                {t("create.gate.apply_btn")}
              </Link>
              <Link
                href="/coaching"
                className="block w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 px-6 rounded-xl transition-colors text-sm"
              >
                {t("create.gate.browse_btn")}
              </Link>
            </div>
          </motion.div>
        </main>
      </>
    );
  }

  const formSections = (
    <>
      {/* ① 課程資訊 */}
      <section className="crt-section">
        <SectionTitle
          icon={FileText}
          label={t("create.sections.info")}
          iconBg="#eef5fb"
          iconColor="#005caf"
        />
        <input
          name="title"
          value={form.title}
          onChange={handleChange}
          required
          placeholder={t("create.fields.title_placeholder")}
          className="crt-input"
        />
        <textarea
          name="description"
          value={form.description}
          onChange={handleChange}
          rows={2}
          placeholder={t("create.fields.description_placeholder")}
          className="crt-input crt-textarea"
        />
        <textarea
          name="curriculum"
          value={form.curriculum}
          onChange={handleChange}
          rows={3}
          placeholder={t("create.fields.curriculum_placeholder")}
          className="crt-input crt-textarea"
        />
        <textarea
          name="coach_bio"
          value={form.coach_bio}
          onChange={handleChange}
          rows={2}
          placeholder={t("create.fields.coach_bio_placeholder")}
          className="crt-input crt-textarea"
        />
      </section>

      {/* ② 類型與程度 */}
      <section className="crt-section">
        <SectionTitle
          icon={Users}
          label={t("create.sections.type_level")}
          iconBg="#f3eeff"
          iconColor="#7c3aed"
        />

        <div className="crt-field-label">{t("create.fields.class_type_label")}</div>
        <div className="crt-skill-grid">
          {CLASS_TYPE_OPTIONS.map((o) => (
            <button
              key={o.value}
              type="button"
              onClick={() => set("class_type", o.value)}
              className={`crt-skill-card ${
                form.class_type === o.value ? "active" : ""
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>

        <div className="crt-field-label crt-field-label-spaced">{t("create.fields.skill_level_label")}</div>
        <div className="crt-skill-grid">
          {SKILL_OPTIONS.map((o) => (
            <button
              key={o.value}
              type="button"
              onClick={() => set("skill_level", o.value)}
              className={`crt-skill-card ${
                form.skill_level === o.value ? "active" : ""
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
      </section>

      {/* ③ 球場 */}
      <section className="crt-section">
        <SectionTitle
          icon={MapPin}
          label={t("create.sections.court")}
          iconBg="#e8f8ef"
          iconColor="#16a34a"
        />
        <CourtPicker
          variant="modern"
          locationName={form.location_name}
          locationAddress={form.location_address}
          courtId={form.court_id}
          onSelect={({
            location_name,
            location_address,
            latitude,
            longitude,
            court_id,
          }) =>
            setForm((prev) => ({
              ...prev,
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

      {/* ④ 時間 */}
      <section className="crt-section">
        <SectionTitle
          icon={Calendar}
          label={t("create.sections.time")}
          iconBg="#fff8e6"
          iconColor="#d97706"
        />
        <label className="crt-dsk-fl">
          <span className="crt-dsk-fl-label">{t("create.fields.starts_at_label")}</span>
          <input
            type="datetime-local"
            name="starts_at"
            value={form.starts_at}
            onChange={handleChange}
            required
            className="crt-input"
          />
        </label>
        <label className="crt-dsk-fl">
          <span className="crt-dsk-fl-label">{t("create.fields.ends_at_label")}</span>
          <input
            type="datetime-local"
            name="ends_at"
            value={form.ends_at}
            onChange={handleChange}
            className="crt-input"
          />
        </label>
      </section>

      {/* ⑤ 名額與費用 */}
      <section className="crt-section">
        <SectionTitle
          icon={DollarSign}
          label={t("create.sections.capacity_fee")}
          iconBg="#fef2f2"
          iconColor="#dc2626"
        />

        <div className="crt-field-label">{t("create.fields.capacity_label")}</div>
        <div className="crt-stepper">
          <button
            type="button"
            onClick={() => stepStudents(-1)}
            className="crt-stepper-btn"
          >
            <Minus size={18} />
          </button>
          <div className="crt-stepper-display">
            <span className="crt-stepper-num">{form.max_students}</span>
            <span className="crt-stepper-unit">
              {Number(form.max_students) === 1
                ? t("create.fields.capacity_unit_private")
                : t("create.fields.capacity_unit")}
            </span>
          </div>
          <button
            type="button"
            onClick={() => stepStudents(1)}
            className="crt-stepper-btn"
          >
            <Plus size={18} />
          </button>
        </div>

        <div className="crt-fee-row" style={{ marginTop: "1rem" }}>
          <span className="crt-fee-label">{t("create.fields.fee_label")}</span>
          <div className="crt-fee-stepper">
            <button
              type="button"
              onClick={() => stepPrice(-1)}
              className="crt-stepper-btn crt-stepper-btn-sm"
            >
              <Minus size={14} />
            </button>
            <span className="crt-fee-value">
              NT${" "}
              {Number(form.price_per_person) === 0
                ? t("create.fields.fee_free")
                : form.price_per_person}
            </span>
            <button
              type="button"
              onClick={() => stepPrice(1)}
              className="crt-stepper-btn crt-stepper-btn-sm"
            >
              <Plus size={14} />
            </button>
          </div>
        </div>

        {showPaymentDetail && (
          <div className="crt-fee-detail">
            <select
              name="payment_method"
              value={form.payment_method}
              onChange={handleChange}
              className="crt-input crt-select"
            >
              {PAYMENT_OPTIONS.filter((m) => m.value !== "free").map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
            {showPaymentNote && (
              <textarea
                name="payment_note"
                value={form.payment_note}
                onChange={handleChange}
                rows={2}
                placeholder={t("create.fields.payment_note_placeholder")}
                className="crt-input crt-textarea"
              />
            )}
          </div>
        )}
      </section>

      {/* ⑥ 封面 */}
      <section className="crt-section crt-section-last">
        <SectionTitle
          icon={ImageIcon}
          label={t("create.sections.cover")}
          iconBg="#eef5fb"
          iconColor="#005caf"
        />
        {coverPreview ? (
          <div className="relative w-full max-w-xs aspect-[4/3] rounded-2xl overflow-hidden border border-[#e8edf3] group">
            <Image
              src={coverPreview}
              alt={t("create.cover.preview_alt")}
              fill
              className="object-cover"
              unoptimized
            />
            <button
              type="button"
              onClick={removeCover}
              className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X size={14} />
            </button>
          </div>
        ) : (
          <label className="w-full max-w-xs aspect-[4/3] border-2 border-dashed border-[#cbd5e1] hover:border-[#005caf] rounded-2xl flex flex-col items-center justify-center text-[#94a3b8] hover:text-[#005caf] cursor-pointer transition-colors bg-[#f8fafc]">
            <Upload size={28} className="mb-2" />
            <span className="text-xs font-bold">{t("create.cover.upload_label")}</span>
            <span className="text-[10px] mt-1">{t("create.cover.upload_hint")}</span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={handleCoverChange}
              className="hidden"
            />
          </label>
        )}
      </section>
    </>
  );

  return (
    <>
      <Head>
        <title>{t("seo.create_title")}</title>
      </Head>

      <div className="crt-page">
        {/* ── MOBILE HERO ─────────────────────────────── */}
        <div className="crt-hero crt-mobile-only">
          <LiquidNeonBg />
          <div className="crt-hero-topbar">
            <Link href="/coaching" className="crt-hero-back">
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
                  {userInfo.name?.charAt(0) || t("card.coach_fallback")}
                </span>
              )}
              <div>
                <p className="crt-hero-hi">{greeting}，</p>
                <p className="crt-hero-name">{userInfo.name || t("card.coach_fallback")}</p>
              </div>
            </div>

            <div className="crt-hero-main">
              <p className="crt-hero-date">{todayStr}</p>
              <h1 className="crt-hero-title">{t("create.hero.title")}</h1>
              <p className="crt-hero-sub">{t("create.hero.subtitle")}</p>
            </div>

            <div className="crt-hero-tags">
              {CLASS_TYPE_OPTIONS.slice(0, 3).map((o) => (
                <span key={o.value} className="crt-hero-tag">
                  {o.label}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* ── DESKTOP HEADER ──────────────────────────── */}
        <div className="crt-dsk-brand crt-desktop-only">
          <span className="crt-dsk-logo">PikFun</span>
          <div className="crt-dsk-icon" aria-hidden>
            <GraduationCap size={36} strokeWidth={1.25} />
          </div>
          <h1 className="crt-dsk-title">{t("create.hero.title")}</h1>
          <p className="crt-dsk-sub">
            {t("create.desktop_header.subtitle", {
              greeting,
              name: userInfo.name || t("card.coach_fallback"),
            })}
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
            {t("create.actions.submit_note")}
          </p>
          <ConfettiButton
            onClick={handleSubmitClick}
            successLabel={t("create.actions.submit_success")}
            disabled={uploadingCover}
            className="crt-btn-submit crt-btn-submit-dsk"
          >
            {t("create.actions.submit_btn")}
          </ConfettiButton>
          <Link href="/coaching" className="crt-dsk-footlink">
            {t("create.actions.back_link")}
          </Link>
        </div>

        <div className="crt-dsk-panel crt-desktop-only">
          <div className="crt-dsk-panel-inner">
            <h2 className="crt-dsk-panel-title">{t("create.panel.title")}</h2>
            <p className="crt-dsk-panel-lead">
              {t("create.panel.lead")}
            </p>

            <div className="crt-dsk-panel-grid">
              <div className="crt-dsk-panel-box">
                <p className="crt-dsk-panel-box-label">{t("create.panel.preview_label")}</p>
                <p className="crt-dsk-panel-highlight">
                  <em>{form.max_students} {t("create.fields.capacity_unit")}</em>
                  <span className="crt-dsk-panel-sep">·</span>
                  <em>{classTypeLabel}</em>
                  <span className="crt-dsk-panel-sep">·</span>
                  <em>{skillLabel}</em>
                </p>
                <p className="crt-dsk-panel-meta">
                  {fmtDate(form.starts_at, weekdays)} {fmtTime(form.starts_at)}–
                  {fmtTime(form.ends_at)}
                </p>
                {form.location_name ? (
                  <p className="crt-dsk-panel-meta">{form.location_name}</p>
                ) : (
                  <p className="crt-dsk-panel-meta crt-dsk-panel-meta--muted">
                    {t("create.panel.unselected_court")}
                  </p>
                )}
              </div>
              <div className="crt-dsk-panel-box">
                <p className="crt-dsk-panel-box-label">{t("create.panel.fee_label")}</p>
                <p className="crt-dsk-panel-fee">
                  {Number(form.price_per_person) === 0 ? (
                    <em>{t("create.fields.fee_free")}</em>
                  ) : (
                    <>
                      NT$ <em>{form.price_per_person}</em>
                    </>
                  )}
                </p>
                <p className="crt-dsk-panel-meta">{t("create.panel.fee_edit_hint")}</p>
              </div>
            </div>

            <div className="crt-dsk-steps">
              <div className="crt-dsk-step-col">
                <h3 className="crt-dsk-step-heading">{t("create.panel.steps_title")}</h3>
                <ol className="crt-dsk-step-list">
                  <li>
                    <span className="crt-dsk-step-icon">
                      <Mail size={18} strokeWidth={1.5} />
                    </span>
                    {t("create.panel.step1")}
                  </li>
                  <li>
                    <span className="crt-dsk-step-icon">
                      <UserCheck size={18} strokeWidth={1.5} />
                    </span>
                    {t("create.panel.step2")}
                  </li>
                  <li>
                    <span className="crt-dsk-step-icon">
                      <Wallet size={18} strokeWidth={1.5} />
                    </span>
                    {t("create.panel.step3")}
                  </li>
                </ol>
              </div>
              <div className="crt-dsk-step-col">
                <h3 className="crt-dsk-step-heading">{t("create.panel.tips_title")}</h3>
                <ul className="crt-dsk-tips">
                  <li>{t("create.panel.tip1")}</li>
                  <li>{t("create.panel.tip2")}</li>
                  <li>{t("create.panel.tip3")}</li>
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
                <span className="crt-sticky-count">
                  {form.max_students} {t("create.fields.capacity_unit")}
                </span>
                <span className="crt-sticky-sep">·</span>
                <span className="crt-sticky-skill crt-skill-badge-active">
                  {classTypeLabel}
                </span>
              </div>
              <div className="crt-sticky-line crt-sticky-line-sub">
                {fmtDate(form.starts_at, weekdays)} {fmtTime(form.starts_at)}
              </div>
            </div>
            <ConfettiButton
              onClick={handleSubmitClick}
              successLabel={t("create.actions.submit_success_mobile")}
              disabled={uploadingCover}
              className="crt-btn-submit crt-btn-submit-sm crt-btn-submit-sticky"
            >
              {t("create.actions.submit_btn")} <ChevronRight size={18} />
            </ConfettiButton>
          </div>
        </div>

        <div className="crt-mobile-spacer crt-mobile-only" aria-hidden />
      </div>

      <CreatePageStyles />
    </>
  );
}
