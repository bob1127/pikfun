"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next";
import { ChevronRight, ChevronLeft, X } from "lucide-react";
import { getCategoryOptions } from "@/lib/communityPosts";
import { BlueArrowLink } from "@/components/ui/BlueCta";
import {
  AuthorInfoCard,
  PostLikeBar,
  PostCommentsBoard,
} from "@/components/news/CommunityEngagement";
import CommunityInstagramPosts from "@/components/news/CommunityInstagramPosts";

const BLUE = "#005caf";

function BlueTag({ children }) {
  return (
    <span className="inline-flex items-center text-[11px] font-bold px-2.5 py-1 border border-[#005caf] text-[#005caf] rounded-sm bg-white">
      {children}
    </span>
  );
}

function CircleArrow({ size = 24 }) {
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-full text-white"
      style={{
        width: size,
        height: size,
        backgroundColor: BLUE,
      }}
    >
      <ChevronRight size={size * 0.55} strokeWidth={3} />
    </span>
  );
}

function RelatedCard({ post }) {
  return (
    <Link href={`/news/${post.slug}`} className="group block">
      <div className="relative w-full aspect-[4/3] overflow-hidden rounded-md bg-gray-100 mb-3">
        <Image
          src={post.image}
          alt={post.title}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          unoptimized
        />
      </div>
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="text-sm font-bold text-gray-900 leading-snug line-clamp-2 group-hover:text-[#005caf] transition-colors">
          {post.title}
        </h3>
        <CircleArrow size={22} />
      </div>
      <p className="text-xs text-gray-500 leading-relaxed line-clamp-2 mb-3">
        {post.excerpt}
      </p>
      <div className="flex flex-wrap gap-1.5">
        {(post.categories || []).slice(0, 2).map((c) => (
          <BlueTag key={c}>{c}</BlueTag>
        ))}
      </div>
    </Link>
  );
}

function SidebarRelatedItem({ post }) {
  const { t } = useTranslation("news");
  return (
    <Link
      href={`/news/${post.slug}`}
      className="flex gap-3 group py-3 border-b border-gray-100 last:border-0"
    >
      <div className="relative w-16 h-16 shrink-0 rounded overflow-hidden bg-gray-100">
        <Image
          src={post.image}
          alt=""
          fill
          className="object-cover"
          unoptimized
        />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-bold text-[#005caf] mb-0.5">
          {post.categories?.[0] || t("hero.badgeCommunity")}
        </p>
        <p className="text-xs font-bold text-gray-900 leading-snug line-clamp-2 group-hover:text-[#005caf] transition-colors">
          {post.title}
        </p>
        {post.date && (
          <p className="mt-1 text-[10px] text-gray-400">{post.date}</p>
        )}
      </div>
    </Link>
  );
}

/* 圖片牆幻燈片 Lightbox：點擊 .pe-gallery 內圖片開啟 */
function GalleryLightbox({ images, index, onClose, onNavigate }) {
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") onNavigate(-1);
      if (e.key === "ArrowRight") onNavigate(1);
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose, onNavigate]);

  if (typeof document === "undefined" || !images.length) return null;

  return createPortal(
    <div
      className="fixed inset-0 flex items-center justify-center"
      style={{ zIndex: 999999999 }}
    >
      <div
        className="absolute inset-0 bg-black/85"
        onClick={onClose}
        aria-hidden
      />

      <button
        type="button"
        aria-label="關閉"
        onClick={onClose}
        className="absolute top-4 right-4 z-20 w-9 h-9 rounded-full flex items-center justify-center text-white transition-transform hover:scale-110"
        style={{ background: BLUE }}
      >
        <X size={18} />
      </button>

      {images.length > 1 && (
        <>
          <button
            type="button"
            aria-label="上一張"
            onClick={() => onNavigate(-1)}
            className="absolute left-3 md:left-6 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full flex items-center justify-center text-white shadow-md transition-transform hover:scale-110"
            style={{ background: BLUE }}
          >
            <ChevronLeft size={20} />
          </button>
          <button
            type="button"
            aria-label="下一張"
            onClick={() => onNavigate(1)}
            className="absolute right-3 md:right-6 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full flex items-center justify-center text-white shadow-md transition-transform hover:scale-110"
            style={{ background: BLUE }}
          >
            <ChevronRight size={20} />
          </button>
        </>
      )}

      <figure className="relative z-10 max-w-[92vw] max-h-[86vh] flex flex-col items-center pointer-events-none">
        <img
          key={images[index]}
          src={images[index]}
          alt=""
          className="max-w-full max-h-[80vh] object-contain select-none pointer-events-auto"
        />
        <figcaption className="mt-3 text-xs font-bold tracking-widest text-white/80">
          {index + 1} / {images.length}
        </figcaption>
      </figure>
    </div>,
    document.body,
  );
}

export default function CommunityArticleLayout({
  post,
  recentPosts = [],
  authorProfile = null,
}) {
  const { t } = useTranslation("news");
  const router = useRouter();
  const locale = router.locale || "zh-TW";
  const categoryKey = post.categoryKey || "active";
  const metaCategoryKey = ["active", "event", "course", "knowledge"].includes(
    categoryKey,
  )
    ? categoryKey
    : "active";
  const meta = {
    eyebrow: t(`community.categoryMeta.${metaCategoryKey}.eyebrow`),
    relatedLabel: t(`community.categoryMeta.${metaCategoryKey}.relatedLabel`),
    relatedTitle: t(`community.categoryMeta.${metaCategoryKey}.relatedTitle`),
    sidebarTitle: t(`community.categoryMeta.${metaCategoryKey}.sidebarTitle`),
    cta: t(`community.categoryMeta.${metaCategoryKey}.cta`),
    heroLead: t(`community.categoryMeta.${metaCategoryKey}.heroLead`),
  };
  const categoryLabelText = post.categories?.[0] || t("community.defaultCategory");
  const categoryOptions = getCategoryOptions(locale);

  // 圖片牆 lightbox：對文章內容做事件委派，點 .pe-gallery 的圖開啟幻燈片
  const proseRef = useRef(null);
  const [lightbox, setLightbox] = useState(null); // { images: [], index }

  useEffect(() => {
    const el = proseRef.current;
    if (!el) return;
    const onClick = (e) => {
      const img = e.target.closest(".pe-gallery img");
      if (!img) return;
      const gallery = img.closest(".pe-gallery");
      const imgs = Array.from(gallery.querySelectorAll("img"));
      setLightbox({
        images: imgs.map((i) => i.src),
        index: Math.max(0, imgs.indexOf(img)),
      });
    };
    el.addEventListener("click", onClick);
    return () => el.removeEventListener("click", onClick);
  }, [post.content]);

  const navigateLightbox = useCallback((dir) => {
    setLightbox((prev) => {
      if (!prev) return prev;
      const len = prev.images.length;
      return { ...prev, index: (prev.index + dir + len) % len };
    });
  }, []);

  return (
    <main className="bg-white min-h-screen pt-24 pb-20 font-sans text-[#1a1a1a]">
      {/* Hero：左文右圖 */}
      <section className="bg-[#f7f9fc] border-b border-gray-100">
        <div className="max-w-[1180px] mx-auto px-6 py-10 md:py-14 grid md:grid-cols-2 gap-10 items-center">
          <div>
            {meta.eyebrow ? (
              <p className="text-xs font-bold tracking-[0.2em] uppercase text-[#005caf] mb-3">
                {meta.eyebrow}
              </p>
            ) : null}
            <h1 className="text-3xl md:text-[2.35rem] font-black leading-tight text-gray-900 mb-3">
              {post.title}
            </h1>
            <div
              className="w-14 h-1 mb-5"
              style={{ backgroundColor: BLUE }}
            />
            <p className="text-sm font-bold text-gray-800 mb-2">
              {meta.heroLead}
            </p>
            <p className="text-sm text-gray-600 leading-relaxed mb-6 max-w-md">
              {post.excerpt}
            </p>
            <div className="flex flex-wrap items-center gap-2 mb-6">
              <BlueTag>{categoryLabelText}</BlueTag>
              {post.authorRole && <BlueTag>{post.authorRole}</BlueTag>}
              {post.authorName && (
                <span className="text-xs text-gray-400">
                  {post.authorName} · {post.date}
                </span>
              )}
            </div>
            <Link
              href="/member/posts/new"
              className="inline-flex items-center gap-3 bg-[#005caf] text-white text-sm font-bold px-6 py-3 rounded-md hover:opacity-90 transition-opacity"
            >
              {meta.cta}
              <ChevronRight size={16} strokeWidth={3} />
            </Link>
          </div>
          <div className="relative w-full aspect-[4/3] md:aspect-[5/4] rounded-lg overflow-hidden bg-gray-200 shadow-sm">
            <Image
              src={post.image}
              alt={post.title}
              fill
              className="object-cover"
              priority
              unoptimized
            />
          </div>
        </div>
      </section>

      {/* 麵包屑膠囊列 */}
      <div className="max-w-[1180px] mx-auto px-6 mt-8">
        <nav className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-full bg-gray-100 px-5 py-2.5 text-xs font-bold">
          <Link href="/" className="text-[#005caf] hover:underline">
            {t("community.breadcrumbHome")}
          </Link>
          <span className="text-gray-300">/</span>
          <Link href="/news" className="text-[#005caf] hover:underline">
            {t("community.breadcrumbNews")}
          </Link>
          <span className="text-gray-300">/</span>
          <span className="text-[#005caf]">{categoryLabelText}</span>
          <span className="text-gray-300">/</span>
          <span className="text-gray-500 truncate max-w-[200px] md:max-w-xs">
            {post.title}
          </span>
        </nav>
      </div>

      {/* 主文 + 側欄 */}
      <div className="max-w-[1180px] mx-auto px-6 mt-10 grid lg:grid-cols-[1fr_280px] gap-12 items-start">
        <article>
          <div className="relative w-full aspect-[16/9] rounded-lg overflow-hidden bg-gray-100 mb-10">
            <Image
              src={post.image}
              alt={post.title}
              fill
              className="object-cover"
              unoptimized
            />
          </div>

          {/* 重點資訊框 */}
          <div className="border-2 border-[#005caf] rounded-md p-5 mb-10">
            <p className="text-sm font-black text-gray-900 mb-3">
              {t("community.highlightsTitle")}
            </p>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex gap-2">
                <span className="text-[#005caf] font-bold">✓</span>
                {t("community.highlightsCategory")}
                {categoryLabelText}
              </li>
              <li className="flex gap-2">
                <span className="text-[#005caf] font-bold">✓</span>
                {t("community.highlightsDate")}
                {post.date}
              </li>
              {post.authorName && (
                <li className="flex gap-2">
                  <span className="text-[#005caf] font-bold">✓</span>
                  {t("community.highlightsAuthor")}
                  {post.authorRole} · {post.authorName}
                </li>
              )}
            </ul>
          </div>

          <div
            ref={proseRef}
            className="ca-prose prose max-w-none prose-p:text-[15px] prose-p:leading-[1.9] prose-p:text-stone-800 prose-headings:font-bold prose-headings:text-gray-900 prose-h2:text-2xl prose-h2:mt-12 prose-h2:mb-4 prose-h2:pb-3 prose-h2:border-b prose-h2:border-gray-100 prose-a:text-[#005caf] prose-img:rounded-lg prose-strong:text-black"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />

          <CommunityInstagramPosts urls={post.instagram_urls} />

          {lightbox && (
            <GalleryLightbox
              images={lightbox.images}
              index={lightbox.index}
              onClose={() => setLightbox(null)}
              onNavigate={navigateLightbox}
            />
          )}

          {post.postId && <PostLikeBar postId={post.postId} />}

          <AuthorInfoCard post={post} profile={authorProfile} />

          {post.postId && <PostCommentsBoard postId={post.postId} />}

          <div className="mt-14 pt-8 border-t border-gray-100">
            <BlueArrowLink href="/news">{t("community.backToListLabel")}</BlueArrowLink>
          </div>
        </article>

        {/* 側欄 */}
        <aside className="lg:sticky lg:top-28 space-y-8">
          <div className="bg-[#f7f9fc] rounded-lg p-5">
            <h3 className="text-sm font-black text-[#005caf] mb-3 pb-2 border-b border-[#005caf]/20">
              {meta.sidebarTitle}
            </h3>
            <ul className="space-y-2.5">
              {categoryOptions.map((opt) => (
                <li key={opt.value}>
                  <Link
                    href={`/news?cat=${opt.value}`}
                    className={`flex items-center gap-1.5 text-sm font-bold transition-colors ${
                      opt.value === categoryKey
                        ? "text-[#005caf]"
                        : "text-gray-700 hover:text-[#005caf]"
                    }`}
                  >
                    <ChevronRight
                      size={14}
                      strokeWidth={3}
                      className="text-[#005caf]"
                    />
                    {opt.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {recentPosts.length > 0 && (
            <div className="bg-[#f7f9fc] rounded-lg p-5">
              <h3 className="text-sm font-black text-[#005caf] mb-3 pb-2 border-b border-[#005caf]/20">
                {t("community.sidebarPopularTitle")}
              </h3>
              <div>
                {recentPosts.slice(0, 4).map((item) => (
                  <SidebarRelatedItem key={item.id} post={item} />
                ))}
              </div>
            </div>
          )}

          <div className="bg-[#f7f9fc] rounded-lg p-5">
            <h3 className="text-sm font-black text-[#005caf] mb-3 pb-2 border-b border-[#005caf]/20">
              {t("community.sidebarTagsTitle")}
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {categoryOptions.map((opt) => (
                <BlueTag key={opt.value}>#{opt.label}</BlueTag>
              ))}
              <BlueTag>{t("community.tagPikfun")}</BlueTag>
              <BlueTag>{t("community.tagPickleball")}</BlueTag>
            </div>
          </div>
        </aside>
      </div>

      {/* 相關文章 */}
      {recentPosts.length > 0 && (
        <section className="max-w-[1180px] mx-auto px-6 mt-20 pt-12 border-t border-gray-100">
          <div className="flex items-end justify-between mb-8 gap-4">
            <div>
              {meta.relatedLabel ? (
                <p className="text-xs font-bold tracking-widest uppercase text-[#005caf] mb-1">
                  {meta.relatedLabel}
                </p>
              ) : null}
              <h2 className="text-2xl font-black text-gray-900">
                {meta.relatedTitle}
              </h2>
            </div>
            <BlueArrowLink href="/news">{t("community.viewMore")}</BlueArrowLink>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {recentPosts.slice(0, 4).map((item) => (
              <RelatedCard key={item.id} post={item} />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
