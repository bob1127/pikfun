"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { motion } from "framer-motion";
import {
  MapPin,
  Mail,
  Instagram,
  ChevronRight,
  ChevronLeft,
  Loader2,
} from "lucide-react";
import FeaturedCoachCard from "@/components/coaching/FeaturedCoachCard";
import CoachRichContent from "@/components/coaching/CoachRichContent";
import InstagramFeedSection from "@/components/coaching/InstagramFeedSection";
import CoachEditableSection from "@/components/coaching/CoachEditableSection";
import CoachRichEditor from "@/components/coaching/CoachRichEditor";
import CoachMediaQuotaBar from "@/components/coaching/CoachMediaQuotaBar";
import InstagramEmbedUrlsField from "@/components/coaching/InstagramEmbedUrlsField";
import TagPickerField from "@/components/coaching/TagPickerField";
import {
  useCoachSectionEdit,
  buildBioHtml,
  buildStoryHtml,
  preparePatchFields,
} from "@/components/coaching/useCoachSectionEdit";
import { useUser } from "@/components/context/UserContext";
import {
  COACH_REGIONS,
  getCredentialPresets,
  getSpecialtyPresets,
  getTagPresets,
  getCoachPresetLabel,
  getRegionLabel,
} from "@/lib/coachProfileFields";

// webstaff.jp/lp/interview 版型 × 藍色系
const BLUE = "#3157B5";
const CYAN = "#0E9BB5";
const CARD_BG = "#F6F6F4";
const DEFAULT_HERO_IMAGE = "/images/3d96081d-fdbe-49fc-8b9a-f117eedc68a8.png";

// 教練投稿文章（暫用假資料骨架，文案走 i18n）
const FAKE_ARTICLE_META = [
  { id: 1, date: "2026.07.02", image: "https://picsum.photos/seed/pikfun-a1/640/400" },
  { id: 2, date: "2026.06.18", image: "https://picsum.photos/seed/pikfun-a2/640/400" },
  { id: 3, date: "2026.06.05", image: "https://picsum.photos/seed/pikfun-a3/640/400" },
  { id: 4, date: "2026.05.22", image: "https://picsum.photos/seed/pikfun-a4/640/400" },
  { id: 5, date: "2026.05.09", image: "https://picsum.photos/seed/pikfun-a5/640/400" },
];

export async function getServerSideProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ["coaching", "common"])),
    },
  };
}

function formatPublishedDate(iso) {
  if (!iso) return "";
  return iso.replace(/-/g, ".");
}

function fieldClass() {
  return "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#3157B5]";
}

/* webstaff 式藍點連結：● 文字 */
function DotLink({ href, children, external }) {
  const cls =
    "inline-flex items-center gap-2 text-xs font-bold hover:underline";
  const dot = (
    <span
      className="w-2 h-2 rounded-full shrink-0"
      style={{ backgroundColor: BLUE }}
    />
  );
  if (external) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={cls}
        style={{ color: BLUE }}
      >
        {dot}
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={cls} style={{ color: BLUE }}>
      {dot}
      {children}
    </Link>
  );
}

/* webstaff 式章節標題：英文小標（藍）+ 黑色大標 */
function SectionHeading({ id, label, children }) {
  return (
    <div id={id} className="scroll-mt-28 mb-6">
      {label ? (
        <p
          className="text-[11px] font-black tracking-[0.15em] uppercase mb-2"
          style={{ color: BLUE }}
        >
          {label}
        </p>
      ) : null}
      <h2 className="text-xl md:text-2xl font-black text-[#222] leading-snug">
        {children}
      </h2>
    </div>
  );
}

/* 教練專欄輪播（スキルアップに役立つ記事 風格，假資料） */
function CoachArticlesSection({ coachName, avatar }) {
  const { t } = useTranslation("coaching");
  const scrollRef = useRef(null);
  const articles = FAKE_ARTICLE_META.map((meta) => {
    const tags = t(`profile.fake_articles.${meta.id}.tags`, {
      returnObjects: true,
    });
    return {
      ...meta,
      title: t(`profile.fake_articles.${meta.id}.title`),
      tags: Array.isArray(tags) ? tags : [],
    };
  });

  const scrollBy = (dir) => {
    const el = scrollRef.current;
    if (!el) return;
    const card = el.querySelector("[data-article-card]");
    const step = card ? card.offsetWidth + 20 : 320;
    el.scrollBy({ left: dir * step, behavior: "smooth" });
  };

  return (
    <section className="max-w-[1200px] mx-auto px-6 md:px-10 mt-20">
      <div className="flex items-end justify-between gap-4 mb-8">
        <div>
          {t("profile.articles.eyebrow") ? (
            <p
            className="text-[11px] font-black tracking-[0.15em] uppercase mb-2"
            style={{ color: BLUE }}
          >
            {t("profile.articles.eyebrow")}
          </p>
          ) : null}
          <h2 className="text-xl md:text-2xl font-black text-[#222]">
            {t("profile.articles.title", { name: coachName })}
          </h2>
        </div>
        <div className="flex items-center gap-4 shrink-0">
          <span
            className="hidden sm:inline-flex items-center gap-2 text-xs font-bold"
            style={{ color: BLUE }}
          >
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: BLUE }}
            />
            {t("profile.articles.coming_soon")}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => scrollBy(-1)}
              className="w-9 h-9 rounded-full border border-gray-300 flex items-center justify-center text-gray-500 hover:border-[#3157B5] hover:text-[#3157B5] transition-colors"
              aria-label={t("profile.articles.prev_aria")}
            >
              <ChevronLeft size={16} />
            </button>
            <button
              type="button"
              onClick={() => scrollBy(1)}
              className="w-9 h-9 rounded-full border border-gray-300 flex items-center justify-center text-gray-500 hover:border-[#3157B5] hover:text-[#3157B5] transition-colors"
              aria-label={t("profile.articles.next_aria")}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex gap-5 overflow-x-auto pb-2 snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {articles.map((article) => (
          <article
            key={article.id}
            data-article-card
            className="snap-start shrink-0 w-[260px] sm:w-[300px] group cursor-pointer"
          >
            <div className="rounded overflow-hidden mb-4">
              <img
                src={article.image}
                alt={article.title}
                className="w-full aspect-[16/10] object-cover group-hover:scale-[1.03] transition-transform duration-300"
                loading="lazy"
              />
            </div>
            <div className="flex items-start gap-2">
              <h3 className="flex-1 text-sm font-black text-[#222] leading-snug group-hover:text-[#3157B5] transition-colors">
                {article.title}
              </h3>
              <span
                className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0"
                style={{ backgroundColor: BLUE }}
              />
            </div>
            <div className="flex items-center gap-2 mt-2.5">
              <img
                src={avatar}
                alt={coachName}
                className="w-5 h-5 rounded-full object-cover"
              />
              <p className="text-xs text-gray-500">{coachName}</p>
              <span className="text-[10px] text-gray-400 ml-auto">
                {article.date}
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5 mt-2.5">
              {article.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-[10px] font-bold px-2 py-[3px] rounded-[3px] border text-[#3157B5] border-[#3157B5]/60"
                >
                  {tag}
                </span>
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

/* 右側固定側欄：目次 + 聯絡教練 + 推薦教練 + 熱門標籤 */
function CoachProfileSidebar({
  coach,
  related,
  allTags,
  isOwner,
  editProps,
  tocItems,
}) {
  const { t } = useTranslation("coaching");
  const {
    activeSection,
    draft,
    setDraft,
    saving,
    error,
    startEdit,
    cancelEdit,
    patchCoach,
  } = editProps;

  const handleSaveContact = () =>
    patchCoach(preparePatchFields("contact", draft));

  return (
    <aside className="space-y-6 lg:sticky lg:top-24">
      {/* 目次 */}
      <div className="rounded-lg p-5" style={{ backgroundColor: CARD_BG }}>
        <p className="text-sm font-black mb-4" style={{ color: BLUE }}>
          {t("profile.toc.title")}
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

      {/* 聯絡教練 */}
      <div className="rounded-lg p-5" style={{ backgroundColor: CARD_BG }}>
        <CoachEditableSection
          isOwner={isOwner}
          sectionId="contact"
          activeSection={activeSection}
          onEdit={() =>
            startEdit("contact", {
              city: coach.city || "",
              region: coach.region || "北部",
              contact_email: coach.email || "",
              instagram: coach.instagram || "",
            })
          }
          onCancel={cancelEdit}
          onSave={handleSaveContact}
          saving={saving}
          label={t("profile.sidebar.edit_contact_label")}
          alwaysShow
          editPanel={
            <div className="space-y-3">
              {error && activeSection === "contact" && (
                <p className="text-xs text-red-600">{error}</p>
              )}
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">
                  {t("profile.sidebar.city_label")}
                </label>
                <input
                  value={draft.city || ""}
                  onChange={(e) => setDraft({ ...draft, city: e.target.value })}
                  className={fieldClass()}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">
                  {t("profile.sidebar.region_label")}
                </label>
                <select
                  value={draft.region || "北部"}
                  onChange={(e) =>
                    setDraft({ ...draft, region: e.target.value })
                  }
                  className={fieldClass()}
                >
                  {COACH_REGIONS.map((r) => (
                    <option key={r.value} value={r.value}>
                      {getRegionLabel(r.value, t)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">
                  {t("profile.sidebar.email_label")}
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
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">
                  {t("profile.sidebar.instagram_label")}
                </label>
                <input
                  value={draft.instagram || ""}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      instagram: e.target.value.replace("@", ""),
                    })
                  }
                  placeholder={t("profile.sidebar.instagram_placeholder")}
                  className={fieldClass()}
                />
              </div>
            </div>
          }
        >
          <div>
            <p className="text-sm font-black mb-4" style={{ color: BLUE }}>
              {t("profile.sidebar.contact_title")}
            </p>
            <div className="space-y-2.5 text-sm">
              {coach.city && (
                <div className="flex items-center gap-2 text-gray-600">
                  <MapPin size={15} className="shrink-0 text-gray-400" />
                  <span>{coach.city}</span>
                </div>
              )}
              {coach.email && (
                <a
                  href={`mailto:${coach.email}`}
                  className="flex items-center gap-2 text-gray-600 hover:text-[#3157B5]"
                >
                  <Mail size={15} className="shrink-0 text-gray-400" />
                  <span className="truncate">{coach.email}</span>
                </a>
              )}
              {coach.instagram && (
                <a
                  href={`https://instagram.com/${coach.instagram.replace("@", "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-gray-600 hover:text-[#3157B5]"
                >
                  <Instagram size={15} className="shrink-0 text-gray-400" />
                  <span>@{coach.instagram.replace("@", "")}</span>
                </a>
              )}
              {!coach.city && !coach.email && !coach.instagram && isOwner && (
                <p className="text-xs text-gray-400">{t("profile.sidebar.contact_empty")}</p>
              )}
            </div>
            <Link
              href={`/coaching?${new URLSearchParams({ q: coach.name }).toString()}`}
              className="mt-5 flex items-center justify-center gap-2 w-full text-white text-xs font-bold py-3.5 rounded-full hover:opacity-90 transition-opacity"
              style={{ backgroundColor: BLUE }}
            >
              {t("profile.sidebar.contact_cta", { name: coach.name })}
              <ChevronRight size={14} />
            </Link>
          </div>
        </CoachEditableSection>
      </div>

      {/* 推薦教練（Special Interview 卡風格） */}
      {related[0] && (
        <div className="rounded-lg p-5" style={{ backgroundColor: CARD_BG }}>
          <div className="relative rounded overflow-hidden mb-3">
            <img
              src={related[0].cover_image || related[0].avatar}
              alt={related[0].name}
              className="w-full aspect-[4/3] object-cover"
            />
            {(t("profile.sidebar.pickup_badge_line1") ||
              t("profile.sidebar.pickup_badge_line2")) && (
              <span className="absolute top-0 left-0 bg-white/90 text-[9px] font-black tracking-widest uppercase px-2.5 py-1.5 text-[#222]">
                {t("profile.sidebar.pickup_badge_line1")}
                <br />
                {t("profile.sidebar.pickup_badge_line2")}
              </span>
            )}
          </div>
          <Link
            href={`/coaching/coach/${related[0].slug}`}
            className="text-xs font-bold underline hover:no-underline"
            style={{ color: BLUE }}
          >
            {related[0].name}｜{related[0].title}
          </Link>
          {related[0].excerpt && (
            <p className="text-xs text-gray-600 leading-relaxed mt-2">
              {related[0].excerpt}
            </p>
          )}
        </div>
      )}

      {/* 熱門標籤 */}
      {allTags.length > 0 && (
        <div className="rounded-lg p-5" style={{ backgroundColor: CARD_BG }}>
          <p className="text-sm font-black mb-3" style={{ color: BLUE }}>
            {t("profile.sidebar.popular_tags_title")}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {allTags.map((tag) => (
              <Link
                key={tag}
                href={`/coaching?${new URLSearchParams({ q: tag }).toString()}`}
                className="text-[10px] font-bold px-2 py-[3px] rounded-[3px] border bg-white text-[#3157B5] border-[#3157B5]/60 hover:bg-[#EFF4FC] transition-colors"
              >
                {tag}
              </Link>
            ))}
          </div>
        </div>
      )}
    </aside>
  );
}

export default function CoachProfilePage() {
  const { t } = useTranslation("coaching");
  const router = useRouter();
  const { slug } = router.query;
  const { userInfo } = useUser();
  const [coach, setCoach] = useState(null);
  const [related, setRelated] = useState([]);
  const [allTags, setAllTags] = useState([]);
  const [isOwner, setIsOwner] = useState(false);
  const [loading, setLoading] = useState(true);
  const [usage, setUsage] = useState(null);
  const [toast, setToast] = useState("");

  const onCoachUpdate = useCallback((updated) => {
    setCoach(updated);
    setToast(t("profile.toast_saved"));
    setTimeout(() => setToast(""), 2500);
  }, [t]);

  const editProps = useCoachSectionEdit({
    slug,
    userInfo,
    onCoachUpdate,
  });

  const {
    activeSection,
    draft,
    setDraft,
    saving,
    error,
    startEdit,
    cancelEdit,
    patchCoach,
  } = editProps;

  const loadCoach = useCallback(() => {
    if (!slug) return;
    setLoading(true);
    const params = new URLSearchParams();
    if (userInfo?.email) {
      params.set("email", userInfo.email);
      if (userInfo.id) params.set("member_id", userInfo.id);
    }
    fetch(`/api/featured-coaches/${slug}?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.coach) {
          setCoach(data.coach);
          setRelated(data.related || []);
          setAllTags(data.allTags || []);
          setIsOwner(Boolean(data.isOwner));
        } else {
          setCoach(null);
        }
      })
      .catch(() => setCoach(null))
      .finally(() => setLoading(false));
  }, [slug, userInfo?.email, userInfo?.id]);

  useEffect(() => {
    loadCoach();
  }, [loadCoach]);

  useEffect(() => {
    if (!slug || !isOwner || !userInfo?.email) return;
    fetch(
      `/api/coach-media/usage?slug=${slug}&email=${encodeURIComponent(userInfo.email)}&member_id=${encodeURIComponent(userInfo.id || "")}`,
    )
      .then((r) => r.json())
      .then((data) => {
        if (data.usage) setUsage(data.usage);
      })
      .catch(() => {});
  }, [slug, isOwner, userInfo?.email, userInfo?.id]);

  const saveSection = (sectionId) =>
    patchCoach(preparePatchFields(sectionId, draft));

  if (loading) {
    return (
      <main className="min-h-screen pt-24 flex items-center justify-center text-gray-500 bg-white">
        <Loader2 className="animate-spin mr-2" size={20} /> {t("profile.loading")}
      </main>
    );
  }

  if (!coach) {
    return (
      <main className="min-h-screen pt-24 text-center bg-white">
        <p className="text-gray-600 mb-4">{t("profile.not_found")}</p>
        <Link
          href="/coaching"
          className="font-bold underline"
          style={{ color: BLUE }}
        >
          {t("profile.back_to_coaching")}
        </Link>
      </main>
    );
  }

  const storyParagraphs = (coach.story || "").split("\n\n").filter(Boolean);
  const hasRichBio = Boolean(coach.bio_html);
  const hasRichStory = Boolean(coach.story_html);
  const hasPlainBio = Boolean(coach.bio) && !hasRichBio;
  const hasPlainStory = storyParagraphs.length > 0 && !hasRichStory;
  const showBio = hasRichBio || hasPlainBio || isOwner;
  const showStory = hasRichStory || hasPlainStory || isOwner;
  const showInstagram =
    isOwner || coach.instagram || coach.instagram_embed_urls?.length > 0;
  const showSkills =
    isOwner ||
    (coach.credentials || []).length > 0 ||
    (coach.specialties || []).length > 0;

  const heroImage = coach.cover_image || DEFAULT_HERO_IMAGE;

  const tocItems = [
    { id: "profile", label: t("profile.toc.profile"), show: true },
    { id: "bio", label: t("profile.toc.bio"), show: showBio },
    { id: "story", label: t("profile.toc.story"), show: showStory },
    { id: "instagram", label: t("profile.toc.instagram"), show: showInstagram },
    { id: "skills", label: t("profile.toc.skills"), show: showSkills },
    { id: "articles", label: t("profile.toc.articles"), show: true },
  ].filter((item) => item.show);

  return (
    <>
      <Head>
        <title>
          {coach.name} | {coach.title} | PikFun
        </title>
        <meta name="description" content={coach.excerpt || coach.bio} />
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
              <p className="text-sm font-bold mb-2" style={{ color: BLUE }}>
                {t("profile.owner_banner")}
              </p>
              <CoachMediaQuotaBar usage={usage} />
            </div>
          </div>
        )}

        {/* ── 全幅 Hero（SPECIAL INTERVIEW 風格） ── */}
        <CoachEditableSection
          isOwner={isOwner}
          sectionId="hero"
          activeSection={activeSection}
          onEdit={() =>
            startEdit("hero", {
              video_url: coach.video_url || "",
              cover_image: coach.cover_image || "",
            })
          }
          onCancel={cancelEdit}
          onSave={() => saveSection("hero")}
          saving={saving}
          label={t("profile.hero.edit_label")}
          alwaysShow
          editPanel={
            <div className="max-w-[1200px] mx-auto px-6 md:px-10 space-y-3 py-4">
              {error && activeSection === "hero" && (
                <p className="text-xs text-red-600">{error}</p>
              )}
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">
                  {t("profile.hero.cover_url_label")}
                </label>
                <input
                  value={draft.cover_image || ""}
                  onChange={(e) =>
                    setDraft({ ...draft, cover_image: e.target.value })
                  }
                  className={fieldClass()}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">
                  {t("profile.hero.video_url_label")}
                </label>
                <input
                  value={draft.video_url || ""}
                  onChange={(e) =>
                    setDraft({ ...draft, video_url: e.target.value })
                  }
                  placeholder="https://www.youtube.com/embed/..."
                  className={fieldClass()}
                />
              </div>
            </div>
          }
        >
          <div className="relative w-full h-[320px] md:h-[440px] overflow-hidden bg-[#E9E9E5]">
            <img
              src={heroImage}
              alt={coach.name}
              className="absolute inset-0 w-full h-full object-cover"
            />
            {/* 左側淡白漸層，襯托文字 */}
            <div className="absolute inset-0 bg-gradient-to-r from-white/90 via-white/40 to-transparent" />
            <div className="relative max-w-[1200px] mx-auto px-6 md:px-10 h-full flex flex-col justify-center">
              {t("profile.hero.eyebrow") ? (
                <p
                className="text-[11px] md:text-xs font-black tracking-[0.25em] uppercase mb-3"
                style={{ color: BLUE }}
              >
                {t("profile.hero.eyebrow")}
              </p>
              ) : null}
              <h1 className="text-3xl md:text-5xl font-black text-[#1A1A1A] leading-tight">
                {coach.title} {coach.name}
              </h1>
              {coach.featured_label && (
                <p className="mt-4 text-sm font-bold text-[#333]">
                  {coach.featured_label}
                </p>
              )}
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
              href="/coaching"
              className="underline hover:no-underline shrink-0"
              style={{ color: BLUE }}
            >
              {t("profile.breadcrumb.home")}
            </Link>
            <span className="text-gray-400">›</span>
            <span className="truncate">
              {coach.excerpt || t("profile.breadcrumb.fallback", { name: coach.name })}｜{coach.title}{" "}
              {coach.name}
            </span>
          </div>
        </div>

        {/* 頁面大標 */}
        <div className="max-w-[1200px] mx-auto px-6 md:px-10 mt-10 mb-8">
          <h2 className="text-2xl md:text-[28px] font-black text-[#222] leading-snug">
            {coach.excerpt || t("profile.header.profile_title_fallback", { name: coach.name })}
          </h2>
        </div>

        {/* ── 主要內容 + 側欄 ── */}
        <div className="max-w-[1200px] mx-auto px-6 md:px-10">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-10 lg:gap-14 items-start">
            <motion.article
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {/* 教練檔案卡（灰底人物介紹卡） */}
              <CoachEditableSection
                isOwner={isOwner}
                sectionId="header"
                activeSection={activeSection}
                onEdit={() =>
                  startEdit("header", {
                    name: coach.name || "",
                    title: coach.title || "",
                    excerpt: coach.excerpt || "",
                    featured_label: coach.featured_label || "",
                    avatar: coach.avatar || "",
                  })
                }
                onCancel={cancelEdit}
                onSave={() => saveSection("header")}
                saving={saving}
                label={t("profile.header.edit_label")}
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
                        {t("profile.header.name_label")}
                      </label>
                      <input
                        value={draft.name || ""}
                        onChange={(e) =>
                          setDraft({ ...draft, name: e.target.value })
                        }
                        className={fieldClass()}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1">
                        {t("profile.header.title_label")}
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
                        {t("profile.header.excerpt_label")}
                      </label>
                      <input
                        value={draft.excerpt || ""}
                        onChange={(e) =>
                          setDraft({ ...draft, excerpt: e.target.value })
                        }
                        className={fieldClass()}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1">
                        {t("profile.header.featured_label_label")}
                      </label>
                      <input
                        value={draft.featured_label || ""}
                        onChange={(e) =>
                          setDraft({
                            ...draft,
                            featured_label: e.target.value,
                          })
                        }
                        className={fieldClass()}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1">
                        {t("profile.header.avatar_url_label")}
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
                        {coach.title}
                        {coach.city ? `｜${coach.city}` : ""}
                      </p>
                      <h3 className="text-xl md:text-2xl font-black text-[#222] mb-4">
                        {coach.name}
                        {coach.published_at && (
                          <span className="ml-3 text-[11px] text-gray-400 font-bold align-middle">
                            {formatPublishedDate(coach.published_at)}
                            {t("profile.header.joined_suffix")}
                          </span>
                        )}
                      </h3>
                      {coach.featured_label && (
                        <p className="text-xs text-gray-500 leading-relaxed mb-3 pb-3 border-b border-gray-300/60">
                          {coach.featured_label}
                        </p>
                      )}
                      {(coach.credentials || []).length > 0 && (
                        <p className="text-xs text-gray-500 leading-relaxed mb-4">
                          {coach.credentials.slice(0, 4).join("｜")}
                        </p>
                      )}
                      <p className="text-sm text-[#333] leading-loose">
                        {coach.bio ||
                          coach.excerpt ||
                          (isOwner ? t("profile.header.bio_placeholder") : "")}
                      </p>
                    </div>
                    <div>
                      {coach.video_url ? (
                        <div className="relative rounded-lg overflow-hidden bg-black aspect-video shadow-md">
                          <iframe
                            title={t("profile.header.video_title", { name: coach.name })}
                            src={coach.video_url}
                            className="absolute inset-0 w-full h-full"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          />
                        </div>
                      ) : (
                        <img
                          src={coach.avatar}
                          alt={coach.name}
                          className="w-full aspect-square object-cover rounded-lg shadow-md"
                        />
                      )}
                    </div>
                  </div>
                </div>
              </CoachEditableSection>

              {/* 教練簡介 */}
              {showBio && (
                <div className="mt-14">
                  <SectionHeading id="bio" label={t("profile.sections.bio_eyebrow")}>
                    {t("profile.sections.bio_title")}
                  </SectionHeading>
                  <CoachEditableSection
                    isOwner={isOwner}
                    sectionId="bio"
                    activeSection={activeSection}
                    onEdit={() =>
                      startEdit("bio", { bio_html: buildBioHtml(coach) })
                    }
                    onCancel={cancelEdit}
                    onSave={() => saveSection("bio")}
                    saving={saving}
                    label={t("profile.sections.bio_edit_label")}
                    alwaysShow={isOwner}
                    editPanel={
                      <div>
                        {error && activeSection === "bio" && (
                          <p className="text-xs text-red-600 mb-2">{error}</p>
                        )}
                        <CoachRichEditor
                          value={draft.bio_html || ""}
                          onChange={(v) => setDraft({ ...draft, bio_html: v })}
                          slug={slug}
                          email={userInfo?.email}
                          memberId={userInfo?.id}
                          usage={usage}
                          onUsageChange={setUsage}
                          minHeight={280}
                        />
                      </div>
                    }
                  >
                    {hasRichBio || hasPlainBio ? (
                      <CoachRichContent
                        html={coach.bio_html}
                        fallbackText={hasPlainBio ? coach.bio : ""}
                      />
                    ) : (
                      <p className="text-sm text-gray-400 italic">
                        {t("profile.sections.bio_empty")}
                      </p>
                    )}
                  </CoachEditableSection>
                </div>
              )}

              {/* 教練故事 */}
              {showStory && (
                <div className="mt-14">
                  <SectionHeading id="story" label={t("profile.sections.story_eyebrow")}>
                    {t("profile.sections.story_title")}
                  </SectionHeading>
                  <CoachEditableSection
                    isOwner={isOwner}
                    sectionId="story"
                    activeSection={activeSection}
                    onEdit={() =>
                      startEdit("story", { story_html: buildStoryHtml(coach) })
                    }
                    onCancel={cancelEdit}
                    onSave={() => saveSection("story")}
                    saving={saving}
                    label={t("profile.sections.story_edit_label")}
                    alwaysShow={isOwner}
                    editPanel={
                      <div>
                        {error && activeSection === "story" && (
                          <p className="text-xs text-red-600 mb-2">{error}</p>
                        )}
                        <CoachRichEditor
                          value={draft.story_html || ""}
                          onChange={(v) =>
                            setDraft({ ...draft, story_html: v })
                          }
                          slug={slug}
                          email={userInfo?.email}
                          memberId={userInfo?.id}
                          usage={usage}
                          onUsageChange={setUsage}
                          minHeight={360}
                        />
                      </div>
                    }
                  >
                    {hasRichStory || hasPlainStory ? (
                      <CoachRichContent
                        html={coach.story_html}
                        fallbackText={hasPlainStory ? coach.story : ""}
                      />
                    ) : (
                      <p className="text-sm text-gray-400 italic">
                        {t("profile.sections.story_empty")}
                      </p>
                    )}
                  </CoachEditableSection>
                </div>
              )}

              {/* 文中 CTA（キャリアカウンセラー相談 風格） */}
              <div
                className="mt-14 rounded-lg p-6 md:p-8 flex flex-col sm:flex-row gap-6 items-center"
                style={{ backgroundColor: CARD_BG }}
              >
                <img
                  src={coach.avatar}
                  alt={coach.name}
                  className="w-28 h-28 rounded-lg object-cover shrink-0 shadow-sm"
                />
                <div className="flex-1">
                  <p
                    className="text-sm font-black mb-2 leading-snug"
                    style={{ color: BLUE }}
                  >
                    {t("profile.mid_cta.title", { name: coach.name })}
                  </p>
                  <p className="text-xs text-gray-600 leading-relaxed mb-3">
                    {t("profile.mid_cta.desc", { name: coach.name })}
                  </p>
                  <DotLink
                    href={`/coaching?${new URLSearchParams({ q: coach.name }).toString()}`}
                  >
                    {t("profile.mid_cta.link", { name: coach.name })}
                  </DotLink>
                </div>
              </div>

              {/* 社群動態 */}
              {showInstagram && (
                <div className="mt-14">
                  <SectionHeading id="instagram" label={t("profile.sections.instagram_eyebrow")}>
                    {t("profile.sections.instagram_title")}
                  </SectionHeading>
                  <CoachEditableSection
                    isOwner={isOwner}
                    sectionId="instagram"
                    activeSection={activeSection}
                    onEdit={() =>
                      startEdit("instagram", {
                        instagram: coach.instagram || "",
                        instagram_embed_urls: coach.instagram_embed_urls
                          ?.length
                          ? coach.instagram_embed_urls
                          : [""],
                      })
                    }
                    onCancel={cancelEdit}
                    onSave={() => saveSection("instagram")}
                    saving={saving}
                    label={t("profile.sections.instagram_edit_label")}
                    alwaysShow
                    editPanel={
                      <div>
                        {error && activeSection === "instagram" && (
                          <p className="text-xs text-red-600 mb-2">{error}</p>
                        )}
                        <InstagramEmbedUrlsField
                          username={draft.instagram}
                          onUsernameChange={(v) =>
                            setDraft({ ...draft, instagram: v })
                          }
                          urls={draft.instagram_embed_urls || [""]}
                          onChange={(urls) =>
                            setDraft({
                              ...draft,
                              instagram_embed_urls: urls,
                            })
                          }
                        />
                      </div>
                    }
                  >
                    <InstagramFeedSection
                      username={coach.instagram}
                      embedUrls={coach.instagram_embed_urls}
                    />
                  </CoachEditableSection>
                </div>
              )}

              {/* 經歷與專長 */}
              {showSkills && (
                <div className="mt-14">
                  <SectionHeading id="skills" label={t("profile.sections.skills_eyebrow")}>
                    {t("profile.sections.skills_title")}
                  </SectionHeading>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                    <CoachEditableSection
                      isOwner={isOwner}
                      sectionId="credentials"
                      activeSection={activeSection}
                      onEdit={() =>
                        startEdit("credentials", {
                          credentials: (coach.credentials || []).join("\n"),
                        })
                      }
                      onCancel={cancelEdit}
                      onSave={() => saveSection("credentials")}
                      saving={saving}
                      label={t("profile.sections.edit_label")}
                      alwaysShow={
                        isOwner || (coach.credentials || []).length > 0
                      }
                      editPanel={
                        <div>
                          {error && activeSection === "credentials" && (
                            <p className="text-xs text-red-600 mb-2">
                              {error}
                            </p>
                          )}
                          <TagPickerField
                            label={t("profile.sections.credentials_title")}
                            value={draft.credentials || ""}
                            onChange={(v) =>
                              setDraft({ ...draft, credentials: v })
                            }
                            presets={getCredentialPresets(t)}
                            mode="lines"
                          />
                        </div>
                      }
                    >
                      <div>
                        <p className="text-sm font-black text-[#222] mb-4">
                          {t("profile.sections.credentials_title")}
                        </p>
                        {(coach.credentials || []).length > 0 ? (
                          <ul className="space-y-2.5">
                            {coach.credentials.map((item) => (
                              <li
                                key={item}
                                className="text-sm text-gray-700 flex items-start gap-2.5 leading-relaxed"
                              >
                                <span
                                  className="mt-[7px] inline-block w-1.5 h-1.5 rounded-full shrink-0"
                                  style={{ backgroundColor: BLUE }}
                                />
                                {getCoachPresetLabel(
                                  item,
                                  "credentials",
                                  t,
                                )}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-sm text-gray-400 italic">
                            {t("profile.sections.credentials_empty")}
                          </p>
                        )}
                      </div>
                    </CoachEditableSection>

                    <CoachEditableSection
                      isOwner={isOwner}
                      sectionId="specialties"
                      activeSection={activeSection}
                      onEdit={() =>
                        startEdit("specialties", {
                          specialties: (coach.specialties || []).join("、"),
                        })
                      }
                      onCancel={cancelEdit}
                      onSave={() => saveSection("specialties")}
                      saving={saving}
                      label={t("profile.sections.edit_label")}
                      alwaysShow={
                        isOwner || (coach.specialties || []).length > 0
                      }
                      editPanel={
                        <div>
                          {error && activeSection === "specialties" && (
                            <p className="text-xs text-red-600 mb-2">
                              {error}
                            </p>
                          )}
                          <TagPickerField
                            label={t("profile.sections.specialties_title")}
                            value={draft.specialties || ""}
                            onChange={(v) =>
                              setDraft({ ...draft, specialties: v })
                            }
                            presets={getSpecialtyPresets(t)}
                            mode="comma"
                          />
                        </div>
                      }
                    >
                      <div>
                        <p className="text-sm font-black text-[#222] mb-4">
                          {t("profile.sections.specialties_title")}
                        </p>
                        {(coach.specialties || []).length > 0 ? (
                          <div className="flex flex-wrap gap-1.5">
                            {coach.specialties.map((s) => (
                              <span
                                key={s}
                                className="text-[11px] font-bold px-2.5 py-1 rounded-[3px] border bg-white"
                                style={{ color: CYAN, borderColor: CYAN }}
                              >
                                {getCoachPresetLabel(s, "specialties", t)}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-400 italic">
                            {t("profile.sections.specialties_empty")}
                          </p>
                        )}
                      </div>
                    </CoachEditableSection>
                  </div>

                  {/* 標籤 */}
                  {(isOwner || (coach.tags || []).length > 0) && (
                    <div className="mt-8">
                      <CoachEditableSection
                        isOwner={isOwner}
                        sectionId="tags"
                        activeSection={activeSection}
                        onEdit={() =>
                          startEdit("tags", {
                            tags: (coach.tags || []).join("、"),
                          })
                        }
                        onCancel={cancelEdit}
                        onSave={() => saveSection("tags")}
                        saving={saving}
                        label={t("profile.sections.edit_tags_label")}
                        alwaysShow
                        editPanel={
                          <div>
                            {error && activeSection === "tags" && (
                              <p className="text-xs text-red-600 mb-2">
                                {error}
                              </p>
                            )}
                            <TagPickerField
                              label={t("profile.sections.tags_label")}
                              value={draft.tags || ""}
                              onChange={(v) =>
                                setDraft({ ...draft, tags: v })
                              }
                              presets={getTagPresets(t)}
                              mode="comma"
                            />
                          </div>
                        }
                      >
                        {(coach.tags || []).length > 0 ? (
                          <div className="flex flex-wrap gap-1.5">
                            {coach.tags.map((tag) => (
                              <span
                                key={tag}
                                className="text-[10px] font-bold px-2 py-[3px] rounded-[3px] border text-[#3157B5] border-[#3157B5]/60 bg-white"
                              >
                                {getCoachPresetLabel(tag, "tags", t)}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-400 italic">
                            {t("profile.sections.tags_empty")}
                          </p>
                        )}
                      </CoachEditableSection>
                    </div>
                  )}
                </div>
              )}

              {/* 推薦教練（SPECIAL INTERVIEW 第1弾 風格） */}
              {related[0] && (
                <div className="mt-16 pt-10 border-t border-gray-200">
                  {t("profile.recommended.eyebrow") ? (
                    <p
                    className="text-[11px] font-black tracking-[0.15em] uppercase mb-5"
                    style={{ color: BLUE }}
                  >
                    {t("profile.recommended.eyebrow")}
                  </p>
                  ) : null}
                  <div className="flex flex-col sm:flex-row gap-6">
                    <Link
                      href={`/coaching/coach/${related[0].slug}`}
                      className="shrink-0 block sm:w-60"
                    >
                      <div className="relative rounded overflow-hidden">
                        <img
                          src={related[0].cover_image || related[0].avatar}
                          alt={related[0].name}
                          className="w-full aspect-[4/3] object-cover hover:scale-[1.03] transition-transform duration-300"
                        />
                        {(t("profile.recommended.pickup_badge_line1") ||
                          t("profile.recommended.pickup_badge_line2")) && (
                          <span className="absolute top-0 left-0 bg-white/90 text-[9px] font-black tracking-widest uppercase px-2.5 py-1.5 text-[#222]">
                            {t("profile.recommended.pickup_badge_line1")}
                            <br />
                            {t("profile.recommended.pickup_badge_line2")}
                          </span>
                        )}
                      </div>
                    </Link>
                    <div className="flex-1">
                      <h3 className="text-base font-black text-[#222] mb-2 leading-snug">
                        {related[0].excerpt ||
                          t("profile.breadcrumb.fallback", { name: related[0].name })}
                      </h3>
                      <p className="text-xs text-gray-500 mb-1">
                        {related[0].title}｜{related[0].name}
                      </p>
                      {related[0].bio && (
                        <p className="text-xs text-gray-600 leading-relaxed mb-4 line-clamp-3">
                          {related[0].bio}
                        </p>
                      )}
                      <DotLink href={`/coaching/coach/${related[0].slug}`}>
                        {t("profile.recommended.view_coach_page")}
                      </DotLink>
                    </div>
                  </div>
                </div>
              )}
            </motion.article>

            <CoachProfileSidebar
              coach={coach}
              related={related}
              allTags={allTags}
              isOwner={isOwner}
              editProps={editProps}
              tocItems={tocItems}
            />
          </div>
        </div>

        {/* ── 教練專欄（スキルアップ記事 風格，滿版區塊） ── */}
        <div id="articles" className="scroll-mt-28">
          <CoachArticlesSection coachName={coach.name} avatar={coach.avatar} />
        </div>
      </main>
    </>
  );
}
