"use client";

import { useState, useEffect, useCallback } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { motion } from "framer-motion";
import {
  MapPin,
  Mail,
  ChevronRight,
  Loader2,
  CalendarDays,
  Users,
} from "lucide-react";
import { FaFacebookF, FaInstagram, FaLine } from "react-icons/fa";
import CoachEditableSection from "@/components/coaching/CoachEditableSection";
import TagPickerField from "@/components/coaching/TagPickerField";
import { useUser } from "@/components/context/UserContext";

// webstaff.jp/lp/interview 版型 × 藍色系（與教練介紹頁一致）
const BLUE = "#3157B5";
const CYAN = "#0E9BB5";
const CARD_BG = "#F6F6F4";
const DEFAULT_HERO_IMAGE = "/images/3d96081d-fdbe-49fc-8b9a-f117eedc68a8.png";

const SPECIALTY_PRESET_VALUES = [
  "新手友善",
  "固定週開團",
  "室內場地",
  "室外場地",
  "夜間場次",
  "週末場次",
  "分級開打",
  "含教學指導",
  "自備球拍",
  "提供球拍",
];

const TAG_PRESET_VALUES = [
  "新手團",
  "進階團",
  "混合團",
  "雙打",
  "台北",
  "台中",
  "高雄",
  "早鳥團",
  "夜貓團",
  "週末團",
];

function getLocalizedHostPresets(values, group, t) {
  return values.map((value, index) => ({
    // 保留既有資料值；英文介面只翻譯可選標籤。
    value,
    label: t(`host_profile.presets.${group}.${index}`, {
      defaultValue: value,
    }),
  }));
}

function getLocalizedHostPresetLabel(value, values, group, t) {
  const index = values.indexOf(value);
  if (index < 0) return value;
  return t(`host_profile.presets.${group}.${index}`, {
    defaultValue: value,
  });
}

export async function getStaticProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale || "zh-TW", [
        "play",
        "coaching",
        "common",
      ])),
    },
  };
}

export async function getStaticPaths() {
  return { paths: [], fallback: "blocking" };
}

function fieldClass() {
  return "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#3157B5]";
}

function formatJoinedDate(iso) {
  if (!iso) return "";
  return String(iso).slice(0, 10).replace(/-/g, ".");
}

/* webstaff 式藍點連結：● 文字 */
function DotLink({ href, children }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-2 text-xs font-bold hover:underline"
      style={{ color: BLUE }}
    >
      <span
        className="w-2 h-2 rounded-full shrink-0"
        style={{ backgroundColor: BLUE }}
      />
      {children}
    </Link>
  );
}

/* webstaff 式章節標題：英文小標（藍）+ 黑色大標 */
function SectionHeading({ id, label, children }) {
  return (
    <div id={id} className="scroll-mt-28 mb-6">
      <p
        className="text-[11px] font-black tracking-[0.15em] uppercase mb-2"
        style={{ color: BLUE }}
      >
        {label}
      </p>
      <h2 className="text-xl md:text-2xl font-black text-[#222] leading-snug">
        {children}
      </h2>
    </div>
  );
}

/* 揪團場次卡片列表 */
function SessionList({ sessions, empty, viewLabel, locale }) {
  if (!sessions?.length) {
    return <p className="text-sm text-gray-400 italic">{empty}</p>;
  }
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
      {sessions.slice(0, 8).map((session) => {
        const date = new Intl.DateTimeFormat(locale, {
          year: "numeric",
          month: "short",
          day: "numeric",
          weekday: "short",
        }).format(new Date(session.starts_at));
        return (
          <Link
            key={session.id}
            href={`/play/${session.id}`}
            className="group rounded-lg border border-gray-200 bg-white p-5 hover:border-[#3157B5]/50 hover:shadow-md transition-all"
          >
            <p
              className="text-[11px] font-black tracking-wider mb-2"
              style={{ color: BLUE }}
            >
              {date}
            </p>
            <h3 className="text-sm font-black text-[#222] leading-snug mb-3 group-hover:text-[#3157B5] transition-colors">
              {session.title}
            </h3>
            <p className="flex items-center gap-1.5 text-xs text-gray-500 mb-4">
              <MapPin size={13} className="shrink-0 text-gray-400" />
              <span className="truncate">{session.location_name}</span>
            </p>
            <span
              className="inline-flex items-center gap-2 text-xs font-bold"
              style={{ color: BLUE }}
            >
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: BLUE }}
              />
              {viewLabel}
              <ChevronRight
                size={13}
                className="group-hover:translate-x-0.5 transition-transform"
              />
            </span>
          </Link>
        );
      })}
    </div>
  );
}

/* 右側固定側欄：目次 + 聯絡策辦人 + 揪團數據 + 熱門標籤 */
function HostProfileSidebar({ profile, stats, isOwner, editProps, tocItems }) {
  const { t } = useTranslation("play");
  const { activeSection, draft, setDraft, saving, error, startEdit, cancelEdit, saveSection } =
    editProps;

  return (
    <aside className="space-y-6 lg:sticky lg:top-24">
      {/* 目次 */}
      <div className="rounded-lg p-5" style={{ backgroundColor: CARD_BG }}>
        <p className="text-sm font-black mb-4" style={{ color: BLUE }}>
          {t("host_profile.toc_title")}
        </p>
        <ul className="space-y-3">
          {tocItems.map(({ id, label }, i) => (
            <li key={id}>
              <a
                href={`#${id}`}
                className="flex items-start gap-2.5 text-xs font-bold leading-relaxed transition-colors"
                style={{ color: i === 0 ? BLUE : "#333" }}
              >
                <span
                  className="mt-[3px] w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: BLUE }}
                />
                {label}
              </a>
            </li>
          ))}
        </ul>
      </div>

      {/* 聯絡策辦人 */}
      <div className="rounded-lg p-5" style={{ backgroundColor: CARD_BG }}>
        <CoachEditableSection
          isOwner={isOwner}
          sectionId="contact"
          activeSection={activeSection}
          onEdit={() =>
            startEdit("contact", {
              city: profile.city || "",
              contact_email: profile.contact_email || "",
              line_url: profile.line_url || "",
              instagram_url: profile.instagram_url || "",
              facebook_url: profile.facebook_url || "",
            })
          }
          onCancel={cancelEdit}
          onSave={() => saveSection("contact")}
          saving={saving}
          label={t("host_profile.edit_contact_label")}
          alwaysShow
          editPanel={
            <div className="space-y-3">
              {error && activeSection === "contact" && (
                <p className="text-xs text-red-600">{error}</p>
              )}
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">
                  {t("host_profile.fields.city")}
                </label>
                <input
                  value={draft.city || ""}
                  onChange={(e) => setDraft({ ...draft, city: e.target.value })}
                  className={fieldClass()}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">
                  {t("host_profile.fields.contact_email")}
                </label>
                <input
                  type="email"
                  value={draft.contact_email || ""}
                  onChange={(e) =>
                    setDraft({ ...draft, contact_email: e.target.value })
                  }
                  className={fieldClass()}
                />
              </div>
              {[
                {
                  key: "line_url",
                  label: t("host_profile.fields.line_url"),
                  placeholder: "https://line.me/ti/p/...",
                },
                {
                  key: "instagram_url",
                  label: t("host_profile.fields.instagram_url"),
                  placeholder: "https://www.instagram.com/...",
                },
                {
                  key: "facebook_url",
                  label: t("host_profile.fields.facebook_url"),
                  placeholder: "https://www.facebook.com/...",
                },
              ].map((field) => (
                <div key={field.key}>
                  <label className="block text-xs font-bold text-gray-500 mb-1">
                    {field.label}
                  </label>
                  <input
                    type="url"
                    value={draft[field.key] || ""}
                    onChange={(e) =>
                      setDraft({ ...draft, [field.key]: e.target.value })
                    }
                    placeholder={field.placeholder}
                    className={fieldClass()}
                  />
                </div>
              ))}
            </div>
          }
        >
          <div>
            <p className="text-sm font-black mb-4" style={{ color: BLUE }}>
              {t("host_profile.contact_title")}
            </p>
            <div className="space-y-2.5 text-sm">
              {profile.city && (
                <div className="flex items-center gap-2 text-gray-600">
                  <MapPin size={15} className="shrink-0 text-gray-400" />
                  <span>{profile.city}</span>
                </div>
              )}
              {profile.contact_email && (
                <a
                  href={`mailto:${profile.contact_email}`}
                  className="flex items-center gap-2 text-gray-600 hover:text-[#3157B5]"
                >
                  <Mail size={15} className="shrink-0 text-gray-400" />
                  <span className="truncate">{profile.contact_email}</span>
                </a>
              )}
              {(profile.line_url ||
                profile.instagram_url ||
                profile.facebook_url) && (
                <div className="flex items-center gap-2 pt-1">
                  {[
                    {
                      href: profile.line_url,
                      label: "LINE",
                      Icon: FaLine,
                    },
                    {
                      href: profile.instagram_url,
                      label: "Instagram",
                      Icon: FaInstagram,
                    },
                    {
                      href: profile.facebook_url,
                      label: "Facebook",
                      Icon: FaFacebookF,
                    },
                  ]
                    .filter((item) => item.href)
                    .map(({ href, label, Icon }) => (
                      <a
                        key={label}
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={label}
                        title={label}
                        className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 transition-all hover:-translate-y-0.5 hover:border-[#3157B5] hover:text-[#3157B5]"
                      >
                        <Icon size={16} />
                      </a>
                    ))}
                </div>
              )}
              {!profile.city &&
                !profile.contact_email &&
                !profile.line_url &&
                !profile.instagram_url &&
                !profile.facebook_url &&
                isOwner && (
                  <p className="text-xs text-gray-400">
                    {t("host_profile.contact_empty")}
                  </p>
                )}
            </div>
            <Link
              href={`/play?q=${encodeURIComponent(profile.display_name)}`}
              className="mt-5 flex items-center justify-center gap-2 w-full text-white text-xs font-bold py-3.5 rounded-full hover:opacity-90 transition-opacity"
              style={{ backgroundColor: BLUE }}
            >
              {t("host_profile.contact_cta", { name: profile.display_name })}
              <ChevronRight size={14} />
            </Link>
          </div>
        </CoachEditableSection>
      </div>

      {/* 揪團數據 */}
      <div className="rounded-lg p-5" style={{ backgroundColor: CARD_BG }}>
        <p className="text-sm font-black mb-4" style={{ color: BLUE }}>
          {t("host_profile.stats_title")}
        </p>
        <div className="space-y-3 text-sm text-gray-700">
          <p className="flex items-center gap-2.5 font-bold">
            <Users size={15} className="shrink-0" style={{ color: BLUE }} />
            {t("host_profile.hosted_count", { count: stats.total_sessions })}
          </p>
          <p className="flex items-center gap-2.5 font-bold">
            <CalendarDays
              size={15}
              className="shrink-0"
              style={{ color: BLUE }}
            />
            {t("host_profile.upcoming_count", {
              count: stats.upcoming_sessions,
            })}
          </p>
        </div>
      </div>

      {/* 熱門標籤 */}
      {(profile.tags || []).length > 0 && (
        <div className="rounded-lg p-5" style={{ backgroundColor: CARD_BG }}>
          <p className="text-sm font-black mb-3" style={{ color: BLUE }}>
            {t("host_profile.popular_tags_title")}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {profile.tags.map((tag) => (
              <Link
                key={tag}
                href={`/play?q=${encodeURIComponent(tag)}`}
                className="text-[10px] font-bold px-2 py-[3px] rounded-[3px] border bg-white text-[#3157B5] border-[#3157B5]/60 hover:bg-[#EFF4FC] transition-colors"
              >
                {getLocalizedHostPresetLabel(
                  tag,
                  TAG_PRESET_VALUES,
                  "tags",
                  t,
                )}
              </Link>
            ))}
          </div>
        </div>
      )}
    </aside>
  );
}

export default function OrganizerProfilePage() {
  const { t, i18n } = useTranslation("play");
  const specialtyPresets = getLocalizedHostPresets(
    SPECIALTY_PRESET_VALUES,
    "specialties",
    t,
  );
  const tagPresets = getLocalizedHostPresets(TAG_PRESET_VALUES, "tags", t);
  const router = useRouter();
  const { slug } = router.query;
  const { userInfo } = useUser();
  const locale = i18n.language || "zh-TW";

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState("");

  // ── 就地編輯狀態（與教練頁相同互動） ──
  const [activeSection, setActiveSection] = useState(null);
  const [draft, setDraft] = useState({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const startEdit = (sectionId, initial) => {
    setActiveSection(sectionId);
    setDraft(initial);
    setError("");
  };
  const cancelEdit = () => {
    setActiveSection(null);
    setDraft({});
    setError("");
  };

  const saveSection = async () => {
    setSaving(true);
    setError("");
    try {
      const token = localStorage.getItem("medusa_auth_token");
      const res = await fetch(`/api/organizer-profiles/${slug}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(draft),
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error);
      setData((current) => ({ ...current, profile: payload.profile }));
      setActiveSection(null);
      setDraft({});
      setToast(t("host_profile.saved"));
      setTimeout(() => setToast(""), 2500);
    } catch (err) {
      setError(err.message || t("errors.actionFailed"));
    } finally {
      setSaving(false);
    }
  };

  const editProps = {
    activeSection,
    draft,
    setDraft,
    saving,
    error,
    startEdit,
    cancelEdit,
    saveSection,
  };

  const loadProfile = useCallback(() => {
    if (!slug) return;
    setLoading(true);
    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("medusa_auth_token")
        : "";
    fetch(`/api/organizer-profiles/${slug}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((payload) => setData(payload?.profile ? payload : null))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [slug, userInfo?.id]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  if (loading) {
    return (
      <main className="min-h-screen pt-24 flex items-center justify-center text-gray-500 bg-white">
        <Loader2 className="animate-spin mr-2" size={20} />{" "}
        {t("detail.loading")}
      </main>
    );
  }

  if (!data?.profile) {
    return (
      <main className="min-h-screen pt-24 text-center bg-white">
        <p className="text-gray-600 mb-4">{t("host_profile.load_error")}</p>
        <Link
          href="/play"
          className="font-bold underline"
          style={{ color: BLUE }}
        >
          {t("host_profile.back")}
        </Link>
      </main>
    );
  }

  const { profile, upcoming, past, stats, isOwner } = data;
  const title = profile.title || t("host_profile.fallback_title");
  const excerpt = profile.excerpt || t("host_profile.fallback_excerpt");
  const heroImage = profile.cover_image || DEFAULT_HERO_IMAGE;
  const showBio = Boolean(profile.bio) || isOwner;
  const showStory = Boolean(profile.story) || isOwner;
  const showFeatures =
    isOwner ||
    (profile.specialties || []).length > 0 ||
    (profile.tags || []).length > 0;

  const tocItems = [
    { id: "profile", label: t("host_profile.toc_profile"), show: true },
    { id: "bio", label: t("host_profile.toc_bio"), show: showBio },
    { id: "story", label: t("host_profile.toc_story"), show: showStory },
    { id: "features", label: t("host_profile.toc_features"), show: showFeatures },
    { id: "sessions", label: t("host_profile.toc_sessions"), show: true },
  ].filter((item) => item.show);

  return (
    <>
      <Head>
        <title>{t("host_profile.seo_title", { name: profile.display_name })}</title>
        <meta
          name="description"
          content={t("host_profile.seo_description", {
            name: profile.display_name,
          })}
        />
      </Head>

      <main className="bg-white min-h-screen pb-24">
        {/* 頂部藍色飾條 */}
        <div
          className="fixed top-0 left-0 right-0 h-1 z-50"
          style={{ backgroundColor: BLUE }}
        />

        {toast && (
          <div
            className="fixed top-24 right-6 z-50 text-white text-sm font-bold px-4 py-2 rounded-md shadow-lg"
            style={{ backgroundColor: BLUE }}
          >
            {toast}
          </div>
        )}

        {isOwner && (
          <div className="max-w-[1200px] mx-auto px-6 md:px-10 pt-4 mb-4">
            <div className="p-4 bg-white border rounded-xl border-[#3157B5]/25">
              <p className="text-sm font-bold" style={{ color: BLUE }}>
                {t("host_profile.owner_banner")}
              </p>
            </div>
          </div>
        )}

        {/* ── 全幅 Hero ── */}
        <CoachEditableSection
          isOwner={isOwner}
          sectionId="hero"
          activeSection={activeSection}
          onEdit={() =>
            startEdit("hero", { cover_image: profile.cover_image || "" })
          }
          onCancel={cancelEdit}
          onSave={saveSection}
          saving={saving}
          label={t("host_profile.edit_hero_label")}
          alwaysShow
          editPanel={
            <div className="max-w-[1200px] mx-auto px-6 md:px-10 space-y-3 py-4">
              {error && activeSection === "hero" && (
                <p className="text-xs text-red-600">{error}</p>
              )}
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">
                  {t("host_profile.cover_url_label")}
                </label>
                <input
                  value={draft.cover_image || ""}
                  onChange={(e) =>
                    setDraft({ ...draft, cover_image: e.target.value })
                  }
                  className={fieldClass()}
                />
              </div>
            </div>
          }
        >
          <div className="relative w-full h-[320px] md:h-[440px] overflow-hidden bg-[#E9E9E5]">
            {heroImage && (
              <img
                src={heroImage}
                alt={profile.display_name}
                className="absolute inset-0 w-full h-full object-cover"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-r from-white/90 via-white/40 to-transparent" />
            <div className="relative max-w-[1200px] mx-auto px-6 md:px-10 h-full flex flex-col justify-center">
              {t("host_profile.eyebrow") ? (
                <p
                className="text-[11px] md:text-xs font-black tracking-[0.25em] uppercase mb-3"
                style={{ color: BLUE }}
              >
                {t("host_profile.eyebrow")}
              </p>
              ) : null}
              <h1 className="text-3xl md:text-5xl font-black text-[#1A1A1A] leading-tight">
                {title} {profile.display_name}
              </h1>
              <p className="mt-4 text-sm font-bold text-[#333]">{excerpt}</p>
            </div>
          </div>
        </CoachEditableSection>

        {/* 麵包屑（膠囊列） */}
        <div className="max-w-[1200px] mx-auto px-6 md:px-10 mt-6">
          <div
            className="flex items-center gap-2 rounded-full px-5 py-3 text-[11px] text-gray-500"
            style={{ backgroundColor: CARD_BG }}
          >
            <Link
              href="/play"
              className="underline hover:no-underline shrink-0"
              style={{ color: BLUE }}
            >
              {t("host_profile.breadcrumb_home")}
            </Link>
            <span className="text-gray-400">›</span>
            <span className="truncate">
              {profile.excerpt ||
                t("host_profile.breadcrumb_fallback", {
                  name: profile.display_name,
                })}
              ｜{title} {profile.display_name}
            </span>
          </div>
        </div>

        {/* 頁面大標 */}
        <div className="max-w-[1200px] mx-auto px-6 md:px-10 mt-10 mb-8">
          <h2 className="text-2xl md:text-[28px] font-black text-[#222] leading-snug">
            {profile.excerpt ||
              t("host_profile.header_title_fallback", {
                name: profile.display_name,
              })}
          </h2>
        </div>

        {/* ── 主要內容 + 側欄 ── */}
        <div className="max-w-[1200px] mx-auto px-6 md:px-10">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-10 lg:gap-14 items-start">
            <motion.article
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {/* 策辦人檔案卡（灰底人物介紹卡） */}
              <CoachEditableSection
                isOwner={isOwner}
                sectionId="header"
                activeSection={activeSection}
                onEdit={() =>
                  startEdit("header", {
                    display_name: profile.display_name || "",
                    title: profile.title || "",
                    excerpt: profile.excerpt || "",
                    avatar: profile.avatar || "",
                  })
                }
                onCancel={cancelEdit}
                onSave={saveSection}
                saving={saving}
                label={t("host_profile.edit_header_label")}
                alwaysShow
                editPanel={
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {error && activeSection === "header" && (
                      <p className="sm:col-span-2 text-xs text-red-600">
                        {error}
                      </p>
                    )}
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1">
                        {t("host_profile.fields.display_name")}
                      </label>
                      <input
                        value={draft.display_name || ""}
                        onChange={(e) =>
                          setDraft({ ...draft, display_name: e.target.value })
                        }
                        className={fieldClass()}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1">
                        {t("host_profile.fields.title")}
                      </label>
                      <input
                        value={draft.title || ""}
                        onChange={(e) =>
                          setDraft({ ...draft, title: e.target.value })
                        }
                        className={fieldClass()}
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-gray-500 mb-1">
                        {t("host_profile.fields.excerpt")}
                      </label>
                      <input
                        value={draft.excerpt || ""}
                        onChange={(e) =>
                          setDraft({ ...draft, excerpt: e.target.value })
                        }
                        className={fieldClass()}
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-gray-500 mb-1">
                        {t("host_profile.fields.avatar")}
                      </label>
                      <input
                        value={draft.avatar || ""}
                        onChange={(e) =>
                          setDraft({ ...draft, avatar: e.target.value })
                        }
                        className={fieldClass()}
                      />
                    </div>
                  </div>
                }
              >
                <div
                  id="profile"
                  className="scroll-mt-28 rounded-xl p-6 md:p-10"
                  style={{ backgroundColor: CARD_BG }}
                >
                  <div className="grid grid-cols-1 md:grid-cols-[1fr_280px] gap-8 items-start">
                    <div>
                      <p className="text-xs text-gray-500 mb-1.5">
                        {title}
                        {profile.city ? `｜${profile.city}` : ""}
                      </p>
                      <h3 className="text-xl md:text-2xl font-black text-[#222] mb-4">
                        {profile.display_name}
                        {profile.created_at && (
                          <span className="ml-3 text-[11px] text-gray-400 font-bold align-middle">
                            {formatJoinedDate(profile.created_at)}
                            {t("host_profile.joined_suffix")}
                          </span>
                        )}
                      </h3>
                      <p
                        className="text-xs font-black leading-relaxed mb-3 pb-3 border-b border-gray-300/60"
                        style={{ color: BLUE }}
                      >
                        {t("host_profile.hosted_count", {
                          count: stats.total_sessions,
                        })}
                        ｜
                        {t("host_profile.upcoming_count", {
                          count: stats.upcoming_sessions,
                        })}
                      </p>
                      <p className="text-sm text-[#333] leading-loose">
                        {profile.bio ||
                          profile.excerpt ||
                          (isOwner ? t("host_profile.bio_placeholder") : "")}
                      </p>
                    </div>
                    <div>
                      {profile.avatar ? (
                        <img
                          src={profile.avatar}
                          alt={profile.display_name}
                          className="w-full aspect-square object-cover rounded-lg shadow-md"
                        />
                      ) : (
                        <div
                          className="w-full aspect-square rounded-lg shadow-md flex items-center justify-center text-6xl font-black text-white"
                          style={{ backgroundColor: BLUE }}
                        >
                          {profile.display_name?.charAt(0) || "P"}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CoachEditableSection>

              {/* 關於策辦人 */}
              {showBio && (
                <div className="mt-14">
                  <SectionHeading id="bio" label="ABOUT">
                    {t("host_profile.about")}
                  </SectionHeading>
                  <CoachEditableSection
                    isOwner={isOwner}
                    sectionId="bio"
                    activeSection={activeSection}
                    onEdit={() => startEdit("bio", { bio: profile.bio || "" })}
                    onCancel={cancelEdit}
                    onSave={saveSection}
                    saving={saving}
                    label={t("host_profile.edit_bio_label")}
                    alwaysShow={isOwner}
                    editPanel={
                      <div>
                        {error && activeSection === "bio" && (
                          <p className="text-xs text-red-600 mb-2">{error}</p>
                        )}
                        <textarea
                          rows={8}
                          value={draft.bio || ""}
                          onChange={(e) =>
                            setDraft({ ...draft, bio: e.target.value })
                          }
                          className={fieldClass()}
                        />
                      </div>
                    }
                  >
                    {profile.bio ? (
                      <p className="text-sm text-[#333] leading-loose whitespace-pre-line">
                        {profile.bio}
                      </p>
                    ) : (
                      <p className="text-sm text-gray-400 italic">
                        {t("host_profile.bio_empty")}
                      </p>
                    )}
                  </CoachEditableSection>
                </div>
              )}

              {/* 揪團故事 */}
              {showStory && (
                <div className="mt-14">
                  <SectionHeading id="story" label="STORY">
                    {t("host_profile.story")}
                  </SectionHeading>
                  <CoachEditableSection
                    isOwner={isOwner}
                    sectionId="story"
                    activeSection={activeSection}
                    onEdit={() =>
                      startEdit("story", { story: profile.story || "" })
                    }
                    onCancel={cancelEdit}
                    onSave={saveSection}
                    saving={saving}
                    label={t("host_profile.edit_story_label")}
                    alwaysShow={isOwner}
                    editPanel={
                      <div>
                        {error && activeSection === "story" && (
                          <p className="text-xs text-red-600 mb-2">{error}</p>
                        )}
                        <textarea
                          rows={10}
                          value={draft.story || ""}
                          onChange={(e) =>
                            setDraft({ ...draft, story: e.target.value })
                          }
                          className={fieldClass()}
                        />
                      </div>
                    }
                  >
                    {profile.story ? (
                      <p className="text-sm text-[#333] leading-loose whitespace-pre-line">
                        {profile.story}
                      </p>
                    ) : (
                      <p className="text-sm text-gray-400 italic">
                        {t("host_profile.story_empty")}
                      </p>
                    )}
                  </CoachEditableSection>
                </div>
              )}

              {/* 文中 CTA */}
              <div
                className="mt-14 rounded-lg p-6 md:p-8 flex flex-col sm:flex-row gap-6 items-center"
                style={{ backgroundColor: CARD_BG }}
              >
                {profile.avatar ? (
                  <img
                    src={profile.avatar}
                    alt={profile.display_name}
                    className="w-28 h-28 rounded-lg object-cover shrink-0 shadow-sm"
                  />
                ) : (
                  <div
                    className="w-28 h-28 rounded-lg shrink-0 shadow-sm flex items-center justify-center text-4xl font-black text-white"
                    style={{ backgroundColor: BLUE }}
                  >
                    {profile.display_name?.charAt(0) || "P"}
                  </div>
                )}
                <div className="flex-1">
                  <p
                    className="text-sm font-black mb-2 leading-snug"
                    style={{ color: BLUE }}
                  >
                    {t("host_profile.mid_cta_title", {
                      name: profile.display_name,
                    })}
                  </p>
                  <p className="text-xs text-gray-600 leading-relaxed mb-3">
                    {t("host_profile.mid_cta_desc", {
                      name: profile.display_name,
                    })}
                  </p>
                  <DotLink
                    href={`/play?q=${encodeURIComponent(profile.display_name)}`}
                  >
                    {t("host_profile.mid_cta_link", {
                      name: profile.display_name,
                    })}
                  </DotLink>
                </div>
              </div>

              {/* 活動特色 + 標籤 */}
              {showFeatures && (
                <div className="mt-14">
                  <SectionHeading id="features" label="FEATURES">
                    {t("host_profile.specialties")}
                  </SectionHeading>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                    <CoachEditableSection
                      isOwner={isOwner}
                      sectionId="specialties"
                      activeSection={activeSection}
                      onEdit={() =>
                        startEdit("specialties", {
                          specialties: (profile.specialties || []).join("、"),
                        })
                      }
                      onCancel={cancelEdit}
                      onSave={saveSection}
                      saving={saving}
                      label={t("host_profile.edit_features_label")}
                      alwaysShow={
                        isOwner || (profile.specialties || []).length > 0
                      }
                      editPanel={
                        <div>
                          {error && activeSection === "specialties" && (
                            <p className="text-xs text-red-600 mb-2">{error}</p>
                          )}
                          <TagPickerField
                            label={t("host_profile.specialties")}
                            value={draft.specialties || ""}
                            onChange={(v) =>
                              setDraft({ ...draft, specialties: v })
                            }
                            presets={specialtyPresets}
                            mode="comma"
                          />
                        </div>
                      }
                    >
                      <div>
                        <p className="text-sm font-black text-[#222] mb-4">
                          {t("host_profile.specialties")}
                        </p>
                        {(profile.specialties || []).length > 0 ? (
                          <div className="flex flex-wrap gap-1.5">
                            {profile.specialties.map((s) => (
                              <span
                                key={s}
                                className="text-[11px] font-bold px-2.5 py-1 rounded-[3px] border bg-white"
                                style={{ color: CYAN, borderColor: CYAN }}
                              >
                                {getLocalizedHostPresetLabel(
                                  s,
                                  SPECIALTY_PRESET_VALUES,
                                  "specialties",
                                  t,
                                )}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-400 italic">
                            {t("host_profile.specialties_empty")}
                          </p>
                        )}
                      </div>
                    </CoachEditableSection>

                    <CoachEditableSection
                      isOwner={isOwner}
                      sectionId="tags"
                      activeSection={activeSection}
                      onEdit={() =>
                        startEdit("tags", {
                          tags: (profile.tags || []).join("、"),
                        })
                      }
                      onCancel={cancelEdit}
                      onSave={saveSection}
                      saving={saving}
                      label={t("host_profile.edit_tags_label")}
                      alwaysShow={isOwner || (profile.tags || []).length > 0}
                      editPanel={
                        <div>
                          {error && activeSection === "tags" && (
                            <p className="text-xs text-red-600 mb-2">{error}</p>
                          )}
                          <TagPickerField
                            label={t("host_profile.tags_label")}
                            value={draft.tags || ""}
                            onChange={(v) => setDraft({ ...draft, tags: v })}
                            presets={tagPresets}
                            mode="comma"
                          />
                        </div>
                      }
                    >
                      <div>
                        <p className="text-sm font-black text-[#222] mb-4">
                          {t("host_profile.tags_label")}
                        </p>
                        {(profile.tags || []).length > 0 ? (
                          <div className="flex flex-wrap gap-1.5">
                            {profile.tags.map((tag) => (
                              <span
                                key={tag}
                                className="text-[10px] font-bold px-2 py-[3px] rounded-[3px] border text-[#3157B5] border-[#3157B5]/60 bg-white"
                              >
                                {getLocalizedHostPresetLabel(
                                  tag,
                                  TAG_PRESET_VALUES,
                                  "tags",
                                  t,
                                )}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-400 italic">
                            {t("host_profile.tags_empty")}
                          </p>
                        )}
                      </div>
                    </CoachEditableSection>
                  </div>
                </div>
              )}

              {/* 揪團場次 */}
              <div id="sessions" className="scroll-mt-28 mt-16 pt-10 border-t border-gray-200">
                <SectionHeading id="upcoming" label="UPCOMING">
                  {t("host_profile.upcoming")}
                </SectionHeading>
                <SessionList
                  sessions={upcoming}
                  empty={t("host_profile.no_upcoming")}
                  viewLabel={t("host_profile.view_session")}
                  locale={locale}
                />

                <div className="mt-14">
                  <SectionHeading id="past" label="ARCHIVE">
                    {t("host_profile.past")}
                  </SectionHeading>
                  <SessionList
                    sessions={past}
                    empty={t("host_profile.no_past")}
                    viewLabel={t("host_profile.view_session")}
                    locale={locale}
                  />
                </div>
              </div>
            </motion.article>

            <HostProfileSidebar
              profile={profile}
              stats={stats}
              isOwner={isOwner}
              editProps={editProps}
              tocItems={tocItems}
            />
          </div>
        </div>
      </main>
    </>
  );
}
