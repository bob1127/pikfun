"use client";

import { useState, useEffect, useCallback } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  MapPin,
  Mail,
  Instagram,
  ChevronRight,
  Loader2,
  BookOpen,
  GraduationCap,
  Users,
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
  CREDENTIAL_PRESETS,
  SPECIALTY_PRESETS,
  TAG_PRESETS,
} from "@/lib/coachProfileFields";

function formatPublishedDate(iso) {
  if (!iso) return "";
  return iso.replace(/-/g, ".");
}

function fieldClass() {
  return "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm";
}

function CoachProfileSidebar({ coach, related, allTags, isOwner, editProps }) {
  const navItems = [
    { icon: BookOpen, label: "教練開課列表", href: "/coaching" },
    { icon: GraduationCap, label: "我要開課", href: "/coaching/create" },
    { icon: Users, label: "揪團打球", href: "/play" },
  ];

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
    <aside className="lg:border-l lg:border-dashed lg:border-gray-300 lg:pl-8 space-y-10">
      <nav>
        <ul className="divide-y divide-gray-200">
          {navItems.map(({ icon: Icon, label, href }) => (
            <li key={href}>
              <Link
                href={href}
                className="flex items-center gap-3 py-3.5 text-sm font-bold text-gray-600 hover:text-black transition-colors group"
              >
                <Icon size={16} className="opacity-60 shrink-0" />
                <span className="flex-1">{label}</span>
                <ChevronRight
                  size={14}
                  className="text-gray-300 group-hover:translate-x-0.5 transition-transform"
                />
              </Link>
            </li>
          ))}
        </ul>
      </nav>

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
        label="編輯聯絡方式"
        alwaysShow
        editPanel={
          <div className="space-y-3">
            {error && activeSection === "contact" && (
              <p className="text-xs text-red-600">{error}</p>
            )}
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">
                城市
              </label>
              <input
                value={draft.city || ""}
                onChange={(e) => setDraft({ ...draft, city: e.target.value })}
                className={fieldClass()}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">
                區域
              </label>
              <select
                value={draft.region || "北部"}
                onChange={(e) => setDraft({ ...draft, region: e.target.value })}
                className={fieldClass()}
              >
                {COACH_REGIONS.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">
                Email
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
                Instagram
              </label>
              <input
                value={draft.instagram || ""}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    instagram: e.target.value.replace("@", ""),
                  })
                }
                placeholder="帳號不含 @"
                className={fieldClass()}
              />
            </div>
          </div>
        }
      >
        <div>
          <p className="text-[10px] font-black tracking-widest text-gray-400 uppercase mb-3">
            聯絡教練
          </p>
          <div className="space-y-2 text-sm">
            {coach.city && (
              <div className="flex items-center gap-2 text-gray-600">
                <MapPin size={15} className="shrink-0" />
                <span>{coach.city}</span>
              </div>
            )}
            {coach.email && (
              <a
                href={`mailto:${coach.email}`}
                className="flex items-center gap-2 text-gray-600 hover:text-[#3157B5]"
              >
                <Mail size={15} className="shrink-0" />
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
                <Instagram size={15} className="shrink-0" />
                <span>@{coach.instagram.replace("@", "")}</span>
              </a>
            )}
            {!coach.city && !coach.email && !coach.instagram && isOwner && (
              <p className="text-xs text-gray-400">尚未填寫聯絡方式</p>
            )}
          </div>
          <Link
            href={`/coaching?${new URLSearchParams({ q: coach.name }).toString()}`}
            className="mt-4 flex items-center justify-center gap-2 w-full bg-black text-white text-xs font-bold py-3 rounded-md hover:bg-gray-800 transition-colors"
          >
            查看 {coach.name} 的開課
            <ChevronRight size={14} />
          </Link>
        </div>
      </CoachEditableSection>

      {allTags.length > 0 && (
        <div>
          <p className="text-[10px] font-black tracking-widest text-gray-400 uppercase mb-3">
            注目タグ
          </p>
          <div className="flex flex-wrap gap-1.5">
            {allTags.map((tag) => (
              <Link
                key={tag}
                href="/coaching#featured-coaches"
                className="text-[10px] font-bold px-2.5 py-1 rounded-full border border-gray-300 text-gray-600 hover:border-black hover:text-black transition-colors"
              >
                {tag}
              </Link>
            ))}
          </div>
        </div>
      )}

      {related.length > 0 && (
        <div>
          <p className="text-sm font-black text-black mb-1">
            おすすめのコンテンツ 👍
          </p>
          <p className="text-[10px] text-gray-400 mb-3">其他進駐教練</p>
          {related.map((c) => (
            <FeaturedCoachCard key={c.slug} coach={c} variant="sidebar" />
          ))}
        </div>
      )}
    </aside>
  );
}

export default function CoachProfilePage() {
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
    setToast("已儲存");
    setTimeout(() => setToast(""), 2500);
  }, []);

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
      <main className="min-h-screen pt-24 flex items-center justify-center text-gray-500 bg-[#E8E8E3]">
        <Loader2 className="animate-spin mr-2" size={20} /> 載入中...
      </main>
    );
  }

  if (!coach) {
    return (
      <main className="min-h-screen pt-24 text-center bg-[#E8E8E3]">
        <p className="text-gray-600 mb-4">找不到此教練</p>
        <Link href="/coaching" className="text-black font-bold underline">
          返回教練開課
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

  return (
    <>
      <Head>
        <title>
          {coach.name} | {coach.title} | PikFun
        </title>
        <meta name="description" content={coach.excerpt || coach.bio} />
      </Head>

      <main className="bg-[#E8E8E3] min-h-screen pt-24 pb-20">
        <div className="max-w-[1200px] mx-auto px-6 md:px-10">
          <Link
            href="/coaching"
            className="inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-black mb-8 transition-colors"
          >
            <ArrowLeft size={16} /> 返回教練開課
          </Link>

          {isOwner && (
            <div className="mb-6 p-4 bg-white/70 border border-[#3157B5]/20 rounded-lg">
              <p className="text-sm font-bold text-[#3157B5] mb-2">
                這是你的教練頁 — 點各區塊的「編輯」即可直接修改
              </p>
              <CoachMediaQuotaBar usage={usage} />
            </div>
          )}

          {toast && (
            <div className="fixed top-24 right-6 z-50 bg-black text-white text-sm font-bold px-4 py-2 rounded-md shadow-lg">
              {toast}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-10 lg:gap-16">
            <motion.article
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {/* Hero */}
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
                label="編輯封面"
                className="mb-8"
                alwaysShow
                editPanel={
                  <div className="space-y-3">
                    {error && activeSection === "hero" && (
                      <p className="text-xs text-red-600">{error}</p>
                    )}
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1">
                        YouTube / Vimeo 嵌入網址
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
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1">
                        封面圖片網址（無影片時顯示）
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
                <div className="relative rounded-lg overflow-hidden bg-black aspect-video">
                  {coach.video_url ? (
                    <iframe
                      title={`${coach.name} 介紹影片`}
                      src={coach.video_url}
                      className="absolute inset-0 w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  ) : (
                    <img
                      src={coach.cover_image || coach.avatar}
                      alt={coach.name}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
              </CoachEditableSection>

              {/* Header */}
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
                label="編輯標題"
                className="mb-8 pb-8 border-b border-dashed border-gray-400/60"
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
                        姓名
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
                        職稱
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
                        標題／一句話
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
                        精選標籤
                      </label>
                      <input
                        value={draft.featured_label || ""}
                        onChange={(e) =>
                          setDraft({ ...draft, featured_label: e.target.value })
                        }
                        className={fieldClass()}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1">
                        頭像網址
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
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div className="flex-1">
                    {coach.featured_label && (
                      <span className="inline-block bg-[#FFD43A] text-black text-[10px] font-black px-2.5 py-1 rounded-full mb-3">
                        {coach.featured_label}
                      </span>
                    )}
                    <h1 className="text-2xl md:text-3xl font-black text-black leading-tight mb-4">
                      {coach.excerpt || (isOwner ? "（尚未填寫標題）" : "")}
                    </h1>
                    <div className="flex items-center gap-3">
                      <img
                        src={coach.avatar}
                        alt={coach.name}
                        className="w-12 h-12 rounded-full object-cover border-2 border-white shadow"
                      />
                      <div>
                        <p className="font-black text-black">{coach.name}</p>
                        <p className="text-sm text-gray-500">{coach.title}</p>
                      </div>
                    </div>
                  </div>
                  {coach.published_at && (
                    <time className="text-sm text-gray-400 shrink-0">
                      {formatPublishedDate(coach.published_at)}
                    </time>
                  )}
                </div>
              </CoachEditableSection>

              {/* Bio */}
              {showBio && (
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
                  label="編輯簡介"
                  className="mb-10"
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
                      尚未撰寫教練簡介
                    </p>
                  )}
                </CoachEditableSection>
              )}

              {/* Story */}
              {showStory && (
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
                  label="編輯故事"
                  className="mb-10"
                  alwaysShow={isOwner}
                  editPanel={
                    <div>
                      {error && activeSection === "story" && (
                        <p className="text-xs text-red-600 mb-2">{error}</p>
                      )}
                      <CoachRichEditor
                        value={draft.story_html || ""}
                        onChange={(v) => setDraft({ ...draft, story_html: v })}
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
                      尚未撰寫教練故事
                    </p>
                  )}
                </CoachEditableSection>
              )}

              {/* Instagram */}
              <CoachEditableSection
                isOwner={isOwner}
                sectionId="instagram"
                activeSection={activeSection}
                onEdit={() =>
                  startEdit("instagram", {
                    instagram: coach.instagram || "",
                    instagram_embed_urls: coach.instagram_embed_urls?.length
                      ? coach.instagram_embed_urls
                      : [""],
                  })
                }
                onCancel={cancelEdit}
                onSave={() => saveSection("instagram")}
                saving={saving}
                label="編輯 Instagram"
                className="mb-10"
                alwaysShow={
                  isOwner ||
                  coach.instagram ||
                  coach.instagram_embed_urls?.length > 0
                }
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
                        setDraft({ ...draft, instagram_embed_urls: urls })
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

              {/* Credentials & specialties */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 pt-8 border-t border-dashed border-gray-400/60">
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
                  label="編輯"
                  alwaysShow={isOwner || (coach.credentials || []).length > 0}
                  editPanel={
                    <div>
                      {error && activeSection === "credentials" && (
                        <p className="text-xs text-red-600 mb-2">{error}</p>
                      )}
                      <TagPickerField
                        label="經歷與認證"
                        value={draft.credentials || ""}
                        onChange={(v) => setDraft({ ...draft, credentials: v })}
                        presets={CREDENTIAL_PRESETS}
                        mode="lines"
                      />
                    </div>
                  }
                >
                  <div>
                    <h2 className="text-xs font-black tracking-widest uppercase text-gray-500 mb-4">
                      經歷與認證
                    </h2>
                    {(coach.credentials || []).length > 0 ? (
                      <ul className="space-y-2">
                        {coach.credentials.map((item) => (
                          <li
                            key={item}
                            className="text-sm text-gray-700 flex items-start gap-2"
                          >
                            <span className="text-[#FFD43A] font-bold">·</span>
                            {item}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-gray-400 italic">尚未填寫</p>
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
                  label="編輯"
                  alwaysShow={isOwner || (coach.specialties || []).length > 0}
                  editPanel={
                    <div>
                      {error && activeSection === "specialties" && (
                        <p className="text-xs text-red-600 mb-2">{error}</p>
                      )}
                      <TagPickerField
                        label="教學專長"
                        value={draft.specialties || ""}
                        onChange={(v) => setDraft({ ...draft, specialties: v })}
                        presets={SPECIALTY_PRESETS}
                        mode="comma"
                      />
                    </div>
                  }
                >
                  <div>
                    <h2 className="text-xs font-black tracking-widest uppercase text-gray-500 mb-4">
                      教學專長
                    </h2>
                    {(coach.specialties || []).length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {coach.specialties.map((s) => (
                          <span
                            key={s}
                            className="text-xs font-bold px-3 py-1.5 rounded-full border border-gray-300 text-gray-700 bg-white"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-400 italic">尚未填寫</p>
                    )}
                  </div>
                </CoachEditableSection>
              </div>

              {/* Tags */}
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
                label="編輯標籤"
                className="mt-8 pt-8 border-t border-dashed border-gray-400/60"
                alwaysShow={isOwner || (coach.tags || []).length > 0}
                editPanel={
                  <div>
                    {error && activeSection === "tags" && (
                      <p className="text-xs text-red-600 mb-2">{error}</p>
                    )}
                    <TagPickerField
                      label="標籤"
                      value={draft.tags || ""}
                      onChange={(v) => setDraft({ ...draft, tags: v })}
                      presets={TAG_PRESETS}
                      mode="comma"
                    />
                  </div>
                }
              >
                {(coach.tags || []).length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {coach.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-xs font-bold px-3 py-1.5 rounded-full bg-white border border-gray-300 text-gray-600"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 italic">尚未填寫標籤</p>
                )}
              </CoachEditableSection>
            </motion.article>

            <CoachProfileSidebar
              coach={coach}
              related={related}
              allTags={allTags}
              isOwner={isOwner}
              editProps={editProps}
            />
          </div>
        </div>
      </main>
    </>
  );
}
