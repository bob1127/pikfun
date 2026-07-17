"use client";

import Link from "next/link";
import Image from "next/image";
import { ChevronRight } from "lucide-react";
import { CATEGORY_OPTIONS } from "@/lib/communityPosts";
import { BlueArrowLink } from "@/components/ui/BlueCta";
import {
  AuthorInfoCard,
  PostLikeBar,
  PostCommentsBoard,
} from "@/components/news/CommunityEngagement";

const BLUE = "#005caf";

const CATEGORY_META = {
  active: {
    eyebrow: "Group Play",
    relatedLabel: "Relevant Guides",
    relatedTitle: "相關揪團",
    sidebarTitle: "文章分類",
    cta: "想揪團？立即投稿",
    heroLead: "找到球場、球友與時段",
  },
  event: {
    eyebrow: "Tournament",
    relatedLabel: "Relevant Guides",
    relatedTitle: "相關賽事",
    sidebarTitle: "文章分類",
    cta: "主辦活動？立即投稿",
    heroLead: "賽事活動與報名資訊",
  },
  course: {
    eyebrow: "Coaching",
    relatedLabel: "Relevant Guides",
    relatedTitle: "相關課程",
    sidebarTitle: "文章分類",
    cta: "想開課？立即投稿",
    heroLead: "教練開課與課程資訊",
  },
  knowledge: {
    eyebrow: "Tips",
    relatedLabel: "Relevant Guides",
    relatedTitle: "相關攻略",
    sidebarTitle: "文章分類",
    cta: "分享知識？立即投稿",
    heroLead: "匹克球知識與技巧",
  },
};

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
          {post.categories?.[0] || "夥伴投稿"}
        </p>
        <p className="text-xs font-bold text-gray-900 leading-snug line-clamp-2 group-hover:text-[#005caf] transition-colors">
          {post.title}
        </p>
      </div>
    </Link>
  );
}

export default function CommunityArticleLayout({
  post,
  recentPosts = [],
  authorProfile = null,
}) {
  const categoryKey = post.categoryKey || "active";
  const meta = CATEGORY_META[categoryKey] || CATEGORY_META.active;
  const categoryLabelText = post.categories?.[0] || "最新消息";

  return (
    <main className="bg-white min-h-screen pt-24 pb-20 font-sans text-[#1a1a1a]">
      {/* Hero：左文右圖 */}
      <section className="bg-[#f7f9fc] border-b border-gray-100">
        <div className="max-w-[1180px] mx-auto px-6 py-10 md:py-14 grid md:grid-cols-2 gap-10 items-center">
          <div>
            <p className="text-xs font-bold tracking-[0.2em] uppercase text-[#005caf] mb-3">
              {meta.eyebrow}
            </p>
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
            首頁
          </Link>
          <span className="text-gray-300">/</span>
          <Link href="/news" className="text-[#005caf] hover:underline">
            最新消息
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
            <p className="text-sm font-black text-gray-900 mb-3">活動重點</p>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex gap-2">
                <span className="text-[#005caf] font-bold">✓</span>
                分類：{categoryLabelText}
              </li>
              <li className="flex gap-2">
                <span className="text-[#005caf] font-bold">✓</span>
                發布：{post.date}
              </li>
              {post.authorName && (
                <li className="flex gap-2">
                  <span className="text-[#005caf] font-bold">✓</span>
                  作者：{post.authorRole} · {post.authorName}
                </li>
              )}
            </ul>
          </div>

          <div
            className="ca-prose prose max-w-none prose-p:text-[15px] prose-p:leading-[1.9] prose-p:text-stone-800 prose-headings:font-bold prose-headings:text-gray-900 prose-h2:text-2xl prose-h2:mt-12 prose-h2:mb-4 prose-h2:pb-3 prose-h2:border-b prose-h2:border-gray-100 prose-a:text-[#005caf] prose-img:rounded-lg prose-strong:text-black"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />

          {post.postId && <PostLikeBar postId={post.postId} />}

          <AuthorInfoCard post={post} profile={authorProfile} />

          {post.postId && <PostCommentsBoard postId={post.postId} />}

          <div className="mt-14 pt-8 border-t border-gray-100">
            <BlueArrowLink href="/news">返回最新消息列表</BlueArrowLink>
          </div>
        </article>

        {/* 側欄 */}
        <aside className="lg:sticky lg:top-28 space-y-8">
          <div className="bg-[#f7f9fc] rounded-lg p-5">
            <h3 className="text-sm font-black text-[#005caf] mb-3 pb-2 border-b border-[#005caf]/20">
              {meta.sidebarTitle}
            </h3>
            <ul className="space-y-2.5">
              {CATEGORY_OPTIONS.map((opt) => (
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
                熱門投稿
              </h3>
              <div>
                {recentPosts.slice(0, 4).map((item, i) => (
                  <div key={item.id} className="relative">
                    <span className="absolute -left-1 top-3 z-10 inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#005caf] text-[10px] font-bold text-white">
                      {i + 1}
                    </span>
                    <div className="pl-5">
                      <SidebarRelatedItem post={item} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-[#f7f9fc] rounded-lg p-5">
            <h3 className="text-sm font-black text-[#005caf] mb-3 pb-2 border-b border-[#005caf]/20">
              熱門標籤
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {CATEGORY_OPTIONS.map((opt) => (
                <BlueTag key={opt.value}>#{opt.label}</BlueTag>
              ))}
              <BlueTag>#PikFun</BlueTag>
              <BlueTag>#匹克球</BlueTag>
            </div>
          </div>
        </aside>
      </div>

      {/* 相關文章 */}
      {recentPosts.length > 0 && (
        <section className="max-w-[1180px] mx-auto px-6 mt-20 pt-12 border-t border-gray-100">
          <div className="flex items-end justify-between mb-8 gap-4">
            <div>
              <p className="text-xs font-bold tracking-widest uppercase text-[#005caf] mb-1">
                {meta.relatedLabel}
              </p>
              <h2 className="text-2xl font-black text-gray-900">
                {meta.relatedTitle}
              </h2>
            </div>
            <BlueArrowLink href="/news">查看更多</BlueArrowLink>
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
