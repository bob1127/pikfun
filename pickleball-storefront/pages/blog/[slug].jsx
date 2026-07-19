import React, { useEffect, useRef, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import Image from "next/image";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import {
  ChevronRight,
  CalendarDays,
  MapPin,
  Clock,
  List,
  Link2,
  Check,
} from "lucide-react";
import {
  fetchPostBySlug,
  fetchPostsByCategorySlug,
  mapPostToBase,
  stripHtml,
  formatWpDate,
  WP_CATEGORY,
} from "@/lib/wordpress";
import { getSiteUrl } from "@/lib/siteUrl";
import BlogPostFooter from "@/components/blog/BlogPostFooter";

const BLUE = "#005caf";

/** 側欄用的部落格主分類 */
const BLOG_SIDEBAR_CATEGORIES = ["active", "knowledge", "racketsEquipment"];

function categoryKeyFromNames(names = []) {
  if (names.some((n) => n.includes("球拍") || n.includes("裝備")))
    return "racketsEquipment";
  if (names.some((n) => n.includes("運動知識"))) return "knowledge";
  if (names.some((n) => n.includes("球場") || n.includes("活動")))
    return "active";
  return "active";
}

function BlueTag({ children }) {
  return (
    <span className="inline-flex items-center text-[11px] font-bold px-2.5 py-1 border border-[#005caf] text-[#005caf] rounded-sm bg-white">
      {children}
    </span>
  );
}

function SidebarPostItem({ post }) {
  const base = mapPostToBase(post);
  return (
    <Link
      href={`/blog/${base.slug}`}
      className="flex gap-3 group py-3 border-b border-gray-100 last:border-0"
    >
      <div className="relative w-16 h-16 shrink-0 rounded overflow-hidden bg-gray-100">
        <Image
          src={base.image}
          alt=""
          fill
          className="object-cover"
          unoptimized
        />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-bold text-[#005caf] mb-0.5">
          {base.categories?.[0] || "PikFun"}
        </p>
        <p className="text-xs font-bold text-gray-900 leading-snug line-clamp-2 group-hover:text-[#005caf] transition-colors">
          {base.title}
        </p>
      </div>
    </Link>
  );
}

export default function BlogPost({
  post,
  latestPosts,
  recommendedPosts,
  categoryKey,
}) {
  const { t } = useTranslation("blog");
  const contentRef = useRef(null);
  const [headings, setHeadings] = useState([]);
  const [copied, setCopied] = useState(false);

  // 文章地圖：掃描內文各段標題（h2/h3），加上錨點 id
  useEffect(() => {
    if (!contentRef.current) return;
    const els = Array.from(contentRef.current.querySelectorAll("h2, h3"));
    setHeadings(
      els.map((el, i) => {
        const id = `section-${i}`;
        el.id = id;
        return { id, text: el.innerText, level: el.tagName === "H3" ? 3 : 2 };
      }),
    );
  }, [post]);

  const scrollToHeading = (e, id) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (!el) return;
    const y = el.getBoundingClientRect().top + window.scrollY - 100;
    window.scrollTo({ top: y, behavior: "smooth" });
  };

  if (!post) {
    return (
      <main className="bg-white min-h-screen pt-32 pb-20">
        <div className="max-w-[1180px] mx-auto px-6 text-center py-20">
          <p className="text-gray-500">{t("notFound")}</p>
          <Link
            href="/"
            className="inline-block mt-8 text-sm font-bold text-[#005caf] hover:underline"
          >
            {t("backToHome")}
          </Link>
        </div>
      </main>
    );
  }

  const title = stripHtml(post.title?.rendered || "");
  const date = formatWpDate(post.date);
  const base = mapPostToBase(post);
  const excerpt = base.excerpt;
  const category = base.categories[0] || t("topics.default");
  const meta = WP_CATEGORY[categoryKey];
  const categoryLabel = meta?.label || category;
  const listHref = `/blog?category=${meta?.slug || "active"}`;
  const postUrl = `${getSiteUrl()}/blog/${base.slug}`;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(postUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  const shareLinks = [
    {
      name: "Facebook",
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(postUrl)}`,
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      ),
    },
    {
      name: "LINE",
      href: `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(postUrl)}`,
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
          <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
        </svg>
      ),
    },
    {
      name: "X",
      href: `https://twitter.com/intent/tweet?url=${encodeURIComponent(postUrl)}&text=${encodeURIComponent(title)}`,
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      ),
    },
  ];

  return (
    <>
      <Head>
        <title>{title} | PikFun</title>
        <meta name="description" content={excerpt} />
      </Head>

      <main className="bg-white min-h-screen pt-24 pb-20 font-sans text-[#1a1a1a]">
        {/* Hero：左文右圖 */}
        <section className="bg-[#f7f9fc] border-b border-gray-100">
          <div className="max-w-[1180px] mx-auto px-6 py-10 md:py-14 grid md:grid-cols-2 gap-10 items-center">
            <div>
              <h1 className="text-3xl md:text-[2.35rem] font-black leading-tight text-gray-900 mb-3">
                {title}
              </h1>

              {excerpt && (
                <p className="text-sm text-gray-600 leading-relaxed mb-6 max-w-md">
                  {excerpt}
                </p>
              )}
              <div className="flex flex-wrap items-center gap-2 mb-6">
                <BlueTag>{categoryLabel}</BlueTag>
                <span className="text-xs text-gray-400">{date}</span>
              </div>
              <Link
                href={listHref}
                className="inline-flex items-center gap-3 bg-[#005caf] text-white text-sm font-bold px-6 py-3 rounded-md hover:opacity-90 transition-opacity"
              >
                {t("detail.ctaMore")}
                <ChevronRight size={16} strokeWidth={3} />
              </Link>
            </div>
            {base.image && (
              <div className="relative w-full aspect-[4/3] md:aspect-[5/4] rounded-lg overflow-hidden bg-gray-200 shadow-sm">
                <Image
                  src={base.image}
                  alt={title}
                  fill
                  className="object-cover"
                  priority
                  unoptimized
                />
              </div>
            )}
          </div>
        </section>

        {/* 麵包屑膠囊列 */}
        <div className="max-w-[1180px] mx-auto px-6 mt-8">
          <nav
            className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-full bg-gray-100 px-5 py-2.5 text-xs font-bold"
            aria-label={t("breadcrumbAria")}
          >
            <Link href="/" className="text-[#005caf] hover:underline">
              {t("breadcrumbHome")}
            </Link>
            <span className="text-gray-300">/</span>
            <Link href="/blog" className="text-[#005caf] hover:underline">
              {t("detail.breadcrumbBlog")}
            </Link>
            <span className="text-gray-300">/</span>
            <Link href={listHref} className="text-[#005caf] hover:underline">
              {categoryLabel}
            </Link>
            <span className="text-gray-300">/</span>
            <span className="text-gray-500 truncate max-w-[200px] md:max-w-xs">
              {title}
            </span>
          </nav>
        </div>

        {/* 主文 + 側欄 */}
        <div className="max-w-[1180px] mx-auto px-6 mt-10 grid lg:grid-cols-[1fr_280px] gap-12 items-start">
          <article className="min-w-0">
            {base.image && (
              <div className="relative w-full aspect-[16/9] rounded-lg overflow-hidden bg-gray-100 mb-10">
                <Image
                  src={base.image}
                  alt={title}
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
            )}

            {/* 重點資訊：求人列表式設計（藍色系、淺灰底） */}
            <div className="bg-[#f5f7fa] rounded-lg p-6 md:p-8 mb-12">
              <div className="flex items-center justify-between gap-4 mb-6">
                <div
                  className="w-16 h-[3px]"
                  style={{ backgroundColor: BLUE }}
                />

                {/* 社群分享 icon */}
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-bold text-gray-400 mr-1">
                    {t("detail.shareLabel")}
                  </span>
                  {shareLinks.map((s) => (
                    <a
                      key={s.name}
                      href={s.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={s.name}
                      title={s.name}
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white hover:opacity-85 transition-opacity"
                      style={{ backgroundColor: BLUE }}
                    >
                      {s.icon}
                    </a>
                  ))}
                  <button
                    type="button"
                    onClick={copyLink}
                    aria-label={t("detail.copyLink")}
                    title={copied ? t("detail.copied") : t("detail.copyLink")}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white hover:opacity-85 transition-opacity"
                    style={{ backgroundColor: copied ? "#16a34a" : BLUE }}
                  >
                    {copied ? <Check size={15} /> : <Link2 size={15} />}
                  </button>
                </div>
              </div>

              <p className="text-xs font-bold text-gray-500 mb-2">
                {t(
                  `topics.${categoryKey === "racketsEquipment" ? "default" : categoryKey}`,
                )}
              </p>
              <h2 className="text-lg md:text-xl font-black text-gray-900 leading-snug mb-4">
                【{categoryLabel}】{title}
              </h2>

              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-gray-600 mb-4">
                <span className="flex items-center gap-1.5">
                  <CalendarDays size={15} className="text-gray-400 shrink-0" />
                  {date}
                </span>
                <span className="flex items-center gap-1.5">
                  <MapPin size={15} className="text-gray-400 shrink-0" />
                  {categoryLabel}
                </span>
              </div>

              {excerpt && (
                <p className="flex items-start gap-1.5 text-sm text-gray-600 leading-relaxed mb-5">
                  <Clock size={15} className="text-gray-400 shrink-0 mt-1" />
                  <span className="line-clamp-2">{excerpt}</span>
                </p>
              )}

              <div className="flex flex-wrap gap-2">
                {[
                  categoryLabel,
                  t(
                    `topics.${categoryKey === "racketsEquipment" ? "default" : categoryKey}`,
                  ),
                  ...(base.tags || []),
                  t("detail.tagPikfun"),
                  t("detail.tagPickleball"),
                ]
                  .filter((v, i, arr) => v && arr.indexOf(v) === i)
                  .map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center text-xs font-bold px-3 py-1.5 border border-[#005caf] text-[#005caf] rounded-sm bg-white"
                    >
                      {tag}
                    </span>
                  ))}
              </div>

              {/* 文章地圖：內文各段標題錨點 */}
              {headings.length > 0 && (
                <div className="mt-6 pt-5 border-t border-gray-200">
                  <p className="flex items-center gap-1.5 text-sm font-black text-gray-900 mb-3">
                    <List size={15} className="text-[#005caf]" />
                    {t("detail.tocTitle")}
                  </p>
                  <ol className="space-y-2">
                    {headings.map((h) => (
                      <li key={h.id} className={h.level === 3 ? "pl-5" : ""}>
                        <a
                          href={`#${h.id}`}
                          onClick={(e) => scrollToHeading(e, h.id)}
                          className="flex items-start gap-1.5 text-sm font-bold text-gray-700 hover:text-[#005caf] transition-colors leading-relaxed"
                        >
                          <ChevronRight
                            size={14}
                            strokeWidth={3}
                            className="text-[#005caf] mt-1 shrink-0"
                          />
                          {h.text}
                        </a>
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </div>

            <div
              ref={contentRef}
              className="ca-prose prose max-w-none prose-p:text-[15px] prose-p:leading-[1.9] prose-p:text-stone-800 prose-headings:font-bold prose-headings:text-gray-900 prose-h2:text-2xl prose-h2:mt-12 prose-h2:mb-4 prose-h2:pb-3 prose-h2:border-b prose-h2:border-gray-100 prose-a:text-[#005caf] prose-img:rounded-lg prose-strong:text-black"
              dangerouslySetInnerHTML={{
                __html: post.content?.rendered || "",
              }}
            />
          </article>

          {/* 側欄 */}
          <aside className="lg:sticky lg:top-28 space-y-8">
            <div className="bg-[#f7f9fc] rounded-lg p-5">
              <h3 className="text-sm font-black text-[#005caf] mb-3 pb-2 border-b border-[#005caf]/20">
                {t("detail.sidebarCategoriesTitle")}
              </h3>
              <ul className="space-y-2.5">
                {BLOG_SIDEBAR_CATEGORIES.map((key) => (
                  <li key={key}>
                    <Link
                      href={`/blog?category=${WP_CATEGORY[key].slug}`}
                      className={`flex items-center gap-1.5 text-sm font-bold transition-colors ${
                        key === categoryKey
                          ? "text-[#005caf]"
                          : "text-gray-700 hover:text-[#005caf]"
                      }`}
                    >
                      <ChevronRight
                        size={14}
                        strokeWidth={3}
                        className="text-[#005caf]"
                      />
                      {WP_CATEGORY[key].label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {latestPosts.length > 0 && (
              <div className="bg-[#f7f9fc] rounded-lg p-5">
                <h3 className="text-sm font-black text-[#005caf] mb-3 pb-2 border-b border-[#005caf]/20">
                  {t("detail.sidebarPopularTitle")}
                </h3>
                <div>
                  {latestPosts.slice(0, 4).map((item, i) => (
                    <div key={item.id} className="relative">
                      <span className="absolute -left-1 top-3 z-10 inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#005caf] text-[10px] font-bold text-white">
                        {i + 1}
                      </span>
                      <div className="pl-5">
                        <SidebarPostItem post={item} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-[#f7f9fc] rounded-lg p-5">
              <h3 className="text-sm font-black text-[#005caf] mb-3 pb-2 border-b border-[#005caf]/20">
                {t("detail.sidebarTagsTitle")}
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {BLOG_SIDEBAR_CATEGORIES.map((key) => (
                  <BlueTag key={key}>#{WP_CATEGORY[key].label}</BlueTag>
                ))}
                <BlueTag>{t("detail.tagPikfun")}</BlueTag>
                <BlueTag>{t("detail.tagPickleball")}</BlueTag>
              </div>
            </div>
          </aside>
        </div>

        {/* 下方設計保留：文章資訊、CTA、圖片、站點概要、輪播 */}
        <div className="mt-20 pt-4 border-t border-gray-100">
          <BlogPostFooter
            post={post}
            base={base}
            categoryKey={categoryKey}
            categoryLabel={categoryLabel}
            listHref={listHref}
            latestPosts={latestPosts}
            recommendedPosts={recommendedPosts}
          />
        </div>
      </main>
    </>
  );
}

export async function getStaticPaths() {
  return { paths: [], fallback: "blocking" };
}

export async function getStaticProps({ locale, params }) {
  const i18n = await serverSideTranslations(locale ?? "zh-TW", [
    "blog",
    "common",
  ]);

  try {
    const post = await fetchPostBySlug(params.slug);
    if (!post) {
      return { notFound: true };
    }

    const base = mapPostToBase(post);
    const categoryKey = categoryKeyFromNames(base.categories);
    const meta = WP_CATEGORY[categoryKey];

    const otherKey =
      categoryKey === "knowledge"
        ? "active"
        : categoryKey === "racketsEquipment"
          ? "knowledge"
          : "knowledge";
    const otherMeta = WP_CATEGORY[otherKey];

    let latestPosts = [];
    let recommendedPosts = [];
    try {
      const [sameCat, otherCat] = await Promise.all([
        fetchPostsByCategorySlug(meta.slug, { perPage: 10 }),
        fetchPostsByCategorySlug(otherMeta.slug, { perPage: 10 }),
      ]);
      latestPosts = sameCat.filter((p) => p.slug !== params.slug);
      recommendedPosts = otherCat.filter((p) => p.slug !== params.slug);
    } catch {
      /* ignore */
    }

    return {
      props: {
        ...i18n,
        post,
        latestPosts,
        recommendedPosts,
        categoryKey,
      },
      revalidate: 60,
    };
  } catch {
    return { notFound: true };
  }
}
