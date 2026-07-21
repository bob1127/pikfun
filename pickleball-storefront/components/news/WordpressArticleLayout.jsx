"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/router";
import {
  Search,
  Instagram,
  Facebook,
  Youtube,
  Twitter,
} from "lucide-react";

const SIDEBAR_NAV = [
  { en: "HOME", zh: "首頁", href: "/" },
  { en: "ABOUT", zh: "關於本站", href: "/intro" },
  { en: "ARTICLE", zh: "最新消息", href: "/news" },
  { en: "SHOP", zh: "商城", href: "/category" },
];

const SOCIAL_LINKS = [
  { label: "Instagram", href: "#", Icon: Instagram },
  { label: "X", href: "#", Icon: Twitter },
  { label: "YouTube", href: "#", Icon: Youtube },
];

function FollowUsRow({ className = "" }) {
  return (
    <div className={`flex items-center gap-4 ${className}`}>
      <span className="text-[10px] font-bold tracking-[0.25em] text-[#1a1a1a]">
        FOLLOW US
      </span>
      <div className="flex items-center gap-3">
        {SOCIAL_LINKS.map(({ label, href, Icon }) => (
          <a
            key={label}
            href={href}
            aria-label={label}
            className="text-[#1a1a1a] transition-opacity hover:opacity-60"
          >
            <Icon size={15} strokeWidth={1.8} />
          </a>
        ))}
      </div>
    </div>
  );
}

function SidebarArticleCard({ post }) {
  return (
    <Link href={`/news/${post.slug}`} className="group block">
      <div className="relative mb-2 aspect-[4/3] w-full overflow-hidden bg-gray-100">
        <Image
          src={post.image}
          alt={post.title}
          fill
          className="object-cover transition-transform duration-700 group-hover:scale-105"
          unoptimized
        />
      </div>
      <h4 className="text-[12px] font-medium leading-[1.7] text-[#1a1a1a] line-clamp-3 group-hover:opacity-60 transition-opacity">
        {post.title}
      </h4>
      <p className="mt-1.5 text-[10px] tracking-wider text-gray-400">
        {post.date}
        {post.categories?.[0] ? (
          <span className="ml-2">{post.categories[0]}</span>
        ) : null}
      </p>
    </Link>
  );
}

function Sidebar({ recentPosts, t }) {
  const router = useRouter();
  const otherLocale = router.locale === "en" ? "zh-TW" : "en";

  return (
    <aside className="w-full shrink-0 bg-[#f6f5ef] lg:sticky lg:top-0 lg:flex lg:h-screen lg:w-[300px] lg:flex-col">
      <div className="flex-1 overflow-y-auto px-6 pb-6 pt-6 lg:px-7 lg:pt-8">
        {/* 選單四格 */}
        <nav className="grid grid-cols-2 gap-2">
          {SIDEBAR_NAV.map((item) => (
            <Link
              key={item.en}
              href={item.href}
              className="flex flex-col items-center justify-center gap-0.5 border border-[#e5e3da] bg-white px-3 py-3.5 transition-colors hover:border-[#1a1a1a]"
            >
              <span className="text-[11px] font-bold tracking-[0.2em] text-[#1a1a1a]">
                {item.en}
              </span>
              <span className="text-[9px] tracking-widest text-gray-400">
                {item.zh}
              </span>
            </Link>
          ))}
        </nav>

        {/* 搜尋 */}
        <form
          className="mt-6 flex items-center justify-center gap-2 border-b border-[#d9d7cd] pb-2"
          onSubmit={(e) => {
            e.preventDefault();
            router.push("/news");
          }}
        >
          <Search size={13} strokeWidth={2} className="text-[#1a1a1a]" />
          <input
            type="text"
            placeholder={t("magazine.searchPlaceholder")}
            className="w-32 bg-transparent text-center text-[11px] tracking-widest text-[#1a1a1a] placeholder:text-[#1a1a1a] focus:outline-none"
          />
        </form>

        <FollowUsRow className="mt-7 justify-center" />

        {/* 熱門文章 */}
        {recentPosts.length > 0 && (
          <div className="mt-10">
            <div className="mb-5 flex flex-col items-center">
              <p className="text-[11px] font-bold tracking-[0.25em] text-[#1a1a1a]">
                <span className="mr-1 inline-block bg-[#1a1a1a] px-1 py-0.5 text-[9px] text-white">
                  POPULAR
                </span>
                ARTICLES
              </p>
              <p className="mt-1 text-[10px] tracking-[0.3em] text-gray-400">
                {t("magazine.popularTitle")}
              </p>
            </div>
            <div className="space-y-7">
              {recentPosts.slice(0, 3).map((post) => (
                <SidebarArticleCard key={post.id} post={post} />
              ))}
            </div>
          </div>
        )}

        {/* 推薦商品 */}
        <div className="mt-10 flex flex-col items-center border-t border-[#e0ded4] pt-8">
          <p className="text-[11px] font-bold tracking-[0.25em] text-[#1a1a1a]">
            PICK UP ITEMS
          </p>
          <p className="mt-1 text-[10px] tracking-[0.3em] text-gray-400">
            {t("magazine.pickupTitle")}
          </p>
          <Link
            href="/category"
            className="mt-4 border-b border-[#1a1a1a] pb-0.5 text-[11px] tracking-widest text-[#1a1a1a] hover:opacity-60"
          >
            {t("magazine.pickupLink")}
          </Link>
        </div>
      </div>

      {/* 語言切換 */}
      <div className="flex items-center gap-5 border-t border-[#e0ded4] px-7 py-4">
        <span className="border-b border-[#1a1a1a] pb-0.5 text-[11px] font-bold text-[#1a1a1a]">
          {router.locale === "en" ? "English" : "中文"}
        </span>
        <Link
          href={router.asPath}
          locale={otherLocale}
          className="text-[11px] text-gray-400 hover:text-[#1a1a1a]"
        >
          {otherLocale === "en" ? "English" : "中文"}
        </Link>
      </div>
    </aside>
  );
}

function ArticleNavCard({ post, label, align = "left" }) {
  if (!post) return null;
  const alignClass = align === "right" ? "items-end text-right" : "items-start";
  return (
    <Link
      href={`/news/${post.slug}`}
      className={`group flex flex-col ${alignClass}`}
    >
      <p className="mb-4 text-[12px] font-medium tracking-[0.2em] text-[#1a1a1a]">
        {label}
      </p>
      <div className="relative mb-4 aspect-[3/2] w-full max-w-[280px] overflow-hidden bg-gray-100">
        <Image
          src={post.image}
          alt={post.title}
          fill
          className="object-cover transition-transform duration-700 group-hover:scale-105"
          unoptimized
        />
      </div>
      <h4 className="max-w-[280px] text-[13px] font-medium leading-[1.8] text-[#1a1a1a] line-clamp-2 group-hover:opacity-60 transition-opacity">
        {post.title}
      </h4>
      <p className="mt-2 text-[10px] tracking-wider text-gray-400">
        {post.date}
        {post.categories?.[0] ? (
          <span className="ml-2">{post.categories[0]}</span>
        ) : null}
      </p>
    </Link>
  );
}

function RelatedArticleCard({ post }) {
  return (
    <Link href={`/news/${post.slug}`} className="group block">
      <div className="relative mb-4 aspect-[3/2] w-full overflow-hidden bg-gray-100">
        <Image
          src={post.image}
          alt={post.title}
          fill
          className="object-cover transition-transform duration-700 group-hover:scale-105"
          unoptimized
        />
      </div>
      <h4 className="text-[13px] font-medium leading-[1.8] text-[#1a1a1a] line-clamp-2 group-hover:opacity-60 transition-opacity">
        {post.title}
      </h4>
      <p className="mt-2 text-[10px] tracking-wider text-gray-400">
        {post.date}
        {post.categories?.[0] ? (
          <span className="ml-2">{post.categories[0]}</span>
        ) : null}
      </p>
    </Link>
  );
}

export default function WordpressArticleLayout({
  post,
  recentPosts = [],
  prevPost = null,
  nextPost = null,
  t,
}) {
  const category = post.categories?.[0] || t("card.defaultCategory");
  const shareUrl = encodeURIComponent(
    typeof window === "undefined" ? "" : window.location.href,
  );

  return (
    <main className="bg-white pt-20 font-sans text-[#1a1a1a]">
      <div className="mx-auto max-w-[1300px] lg:flex lg:items-stretch">
      {/* ── 主欄 ── */}
      <div className="min-w-0 flex-1">
        {/* Logo + 標語 + 麵包屑 */}
        <div className="px-6 pt-10 md:px-14">
          <div className="flex flex-wrap items-baseline gap-x-5 gap-y-2">
            <Link
              href="/news"
              className="text-2xl font-black tracking-[0.18em] text-[#1a1a1a]"
            >
              PIKFUN<span className="mx-1 text-xs align-middle">匹克</span>NEWS
            </Link>
            <span className="hidden h-px w-16 bg-[#1a1a1a] md:block" aria-hidden />
            <p className="text-[11px] tracking-[0.2em] text-gray-500">
              {t("magazine.tagline")}
            </p>
          </div>
          <nav className="mt-5 flex items-center gap-2 text-[10px] tracking-[0.2em] text-gray-400">
            <Link href="/" className="hover:text-[#1a1a1a]">
              HOME
            </Link>
            <span aria-hidden>/</span>
            <Link href="/news" className="hover:text-[#1a1a1a]">
              ARTICLE
            </Link>
            <span aria-hidden>/</span>
            <span className="text-gray-500">{category}</span>
          </nav>
        </div>

        {/* Hero：標題壓圖 */}
        <div className="relative mt-6 aspect-[16/10] max-h-[620px] w-full overflow-hidden bg-[#111] md:aspect-[16/9]">
          <Image
            src={post.image}
            alt={post.title}
            fill
            className="object-cover object-center"
            priority
            sizes="(max-width: 1100px) 100vw, 1100px"
            quality={90}
            unoptimized
          />
          <div
            className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent"
            aria-hidden
          />
          <div className="absolute bottom-0 left-0 max-w-[80%] p-6 text-white md:p-10">
            <p className="mb-3 text-[11px] tracking-[0.25em]">
              {post.date}
              <span className="ml-4">{category}</span>
            </p>
            <h1 className="text-xl font-bold leading-[1.7] tracking-wider md:text-3xl">
              {post.title}
            </h1>
            <p className="mt-4 text-[11px] tracking-[0.2em] opacity-80">
              {t("detail.officialAuthor")}
            </p>
          </div>
          {/* 右緣直式文字 */}
          <p
            className="absolute bottom-8 right-4 hidden text-[10px] tracking-[0.4em] text-white/80 md:block"
            style={{ writingMode: "vertical-rl" }}
          >
            {post.date}
          </p>
        </div>

        {/* 內文 */}
        <div className="mx-auto max-w-[660px] px-6 pb-4 pt-14 md:pt-20">
          <article
            className="prose prose-stone max-w-none prose-p:text-[15px] prose-p:leading-[2.2] prose-p:tracking-[0.08em] prose-p:mb-8 prose-p:text-[#333] prose-li:leading-[2] prose-li:my-1.5 prose-td:leading-[1.7] prose-td:py-3 prose-th:leading-[1.6] prose-h2:text-xl prose-h2:font-bold prose-h2:mt-14 prose-h2:mb-6 prose-h2:tracking-[0.12em] prose-h2:leading-[1.8] prose-h2:text-[#1a1a1a] prose-h3:tracking-[0.1em] prose-strong:font-bold prose-strong:text-black prose-img:w-full prose-img:object-cover prose-img:my-12 prose-img:bg-gray-50 prose-a:text-[#3a7d5c] prose-a:underline prose-a:underline-offset-4 hover:prose-a:opacity-70 prose-blockquote:border-l-0 prose-blockquote:bg-[#f2f5ee] prose-blockquote:px-8 prose-blockquote:py-6 prose-blockquote:not-italic"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />

          {/* SHARE + 標籤 */}
          <div className="mt-16 border-t border-gray-200 pt-8">
            <div className="flex items-center gap-5">
              <span className="text-[11px] font-bold tracking-[0.3em]">
                SHARE
              </span>
              <div className="flex items-center gap-3">
                <a
                  href={`https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Facebook"
                  className="flex h-7 w-7 items-center justify-center rounded-full border border-gray-300 text-[#1a1a1a] hover:border-[#1a1a1a]"
                >
                  <Facebook size={12} strokeWidth={1.8} />
                </a>
                <a
                  href={`https://twitter.com/intent/tweet?url=${shareUrl}`}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="X"
                  className="flex h-7 w-7 items-center justify-center rounded-full border border-gray-300 text-[#1a1a1a] hover:border-[#1a1a1a]"
                >
                  <Twitter size={12} strokeWidth={1.8} />
                </a>
                <a
                  href="#"
                  aria-label="Instagram"
                  className="flex h-7 w-7 items-center justify-center rounded-full border border-gray-300 text-[#1a1a1a] hover:border-[#1a1a1a]"
                >
                  <Instagram size={12} strokeWidth={1.8} />
                </a>
              </div>
            </div>
            {post.categories?.length > 0 && (
              <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2">
                {post.categories.map((cat, i) => (
                  <Link
                    key={cat}
                    href="/news"
                    className={`text-[12px] tracking-widest text-[#1a1a1a] hover:opacity-60 ${
                      i === 0 ? "border-b border-[#1a1a1a] pb-0.5" : ""
                    }`}
                  >
                    {cat}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 上一篇／下一篇 */}
        {(nextPost || prevPost) && (
          <div className="mx-auto max-w-[900px] px-6 pt-16">
            <div className="grid grid-cols-1 gap-10 md:grid-cols-2 md:gap-0 md:divide-x md:divide-gray-200">
              <div className="md:pr-12">
                <ArticleNavCard
                  post={nextPost}
                  label={t("magazine.nextArticle")}
                />
              </div>
              <div className="flex md:justify-end md:pl-12">
                <ArticleNavCard
                  post={prevPost}
                  label={t("magazine.prevArticle")}
                  align="right"
                />
              </div>
            </div>
          </div>
        )}

        {/* 推薦文章 */}
        {recentPosts.length > 0 && (
          <div className="mx-auto max-w-[1000px] px-6 pt-24 md:px-14">
            <div className="mb-8">
              <h2 className="text-[15px] font-bold tracking-[0.3em]">
                RELATED ARTICLES
              </h2>
              <p className="mt-1 text-[11px] tracking-[0.2em] text-gray-400">
                {t("magazine.relatedLead")}
              </p>
            </div>
            <div className="grid grid-cols-1 gap-x-8 gap-y-12 sm:grid-cols-2 md:grid-cols-3">
              {recentPosts.slice(0, 3).map((item) => (
                <RelatedArticleCard key={item.id} post={item} />
              ))}
            </div>
          </div>
        )}

        {/* TOP PAGE */}
        <div className="flex justify-center pb-20 pt-20">
          <Link
            href="/news"
            className="border-b-2 border-[#1a1a1a] pb-1 text-[13px] font-bold tracking-[0.35em] text-[#1a1a1a] hover:opacity-60"
          >
            TOP PAGE
          </Link>
        </div>

        {/* 底部品牌橫幅 */}
        <div className="px-6 pb-16 md:px-14">
          <div className="relative flex min-h-[180px] flex-col items-center justify-center gap-6 overflow-hidden bg-[#123c2b] px-8 py-12 md:flex-row md:justify-between md:px-16">
            <Image
              src={post.image}
              alt=""
              fill
              className="object-cover opacity-40"
              unoptimized
              aria-hidden
            />
            <div className="relative flex flex-col items-center gap-2 md:items-start">
              <p className="text-xl font-black tracking-[0.2em] text-white">
                PIKFUN 匹克方
              </p>
              <Link
                href="/intro"
                className="border-b border-white/70 pb-0.5 text-[10px] tracking-[0.3em] text-white/90 hover:opacity-70"
              >
                {t("magazine.aboutLink")}
              </Link>
            </div>
            <div className="relative flex items-center gap-4">
              <span className="text-[10px] font-bold tracking-[0.25em] text-white">
                FOLLOW US
              </span>
              <div className="flex items-center gap-3">
                {SOCIAL_LINKS.map(({ label, href, Icon }) => (
                  <a
                    key={label}
                    href={href}
                    aria-label={label}
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-white/60 text-white hover:bg-white/10"
                  >
                    <Icon size={13} strokeWidth={1.8} />
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── 右側固定欄 ── */}
      <Sidebar recentPosts={recentPosts} t={t} />
      </div>
    </main>
  );
}
