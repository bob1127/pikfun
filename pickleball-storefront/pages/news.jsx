import React, { useState } from "react";
import Head from "next/head";
import { getSiteUrl } from "@/lib/siteUrl";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { fetchMergedNewsFeed } from "@/lib/newsFeed";

const NEWS_TYPE_KEYS = {
  event: "eventTab",
  coach: "coachTab",
  court_owner: "courtOwnerTab",
  individual: "individualTab",
};

function getPostTypeLabel(post, t) {
  if (post.source === "wordpress") return t("list.officialTab");
  return t(`list.${NEWS_TYPE_KEYS[post.newsType] || "individualTab"}`);
}

const HeroPost = ({ post, t }) => {
  if (!post) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="w-full mb-16 md:mb-24 group cursor-pointer relative"
    >
      <Link
        href={`/news/${post.slug}`}
        className="block relative w-full aspect-[16/9] md:aspect-[21/9] overflow-hidden bg-gray-100"
      >
        <div className="absolute inset-0 w-full h-full">
          <Image
            src={post.image}
            alt={post.title}
            fill
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
            priority
            unoptimized
          />
          <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors duration-500" />
        </div>
        <div className="absolute bottom-0 left-0 md:left-auto md:right-[10%] md:bottom-[10%] w-full md:w-[500px] bg-[#005caf]/90 text-white p-8 md:p-12 backdrop-blur-sm transition-all duration-300">
          <div className="flex justify-between items-start mb-4 border-b border-white/30 pb-4">
            <span className="text-xs font-bold tracking-[0.2em] uppercase">
              {post.source === "community"
                ? getPostTypeLabel(post, t)
                : t("hero.badgeLatest")}
            </span>
            <span className="text-sm font-mono">{post.date}</span>
          </div>
          <h2 className="text-2xl md:text-4xl font-bold leading-tight mb-4 line-clamp-2">
            {post.title}
          </h2>
          <p className="text-sm md:text-base font-light opacity-90 line-clamp-2 leading-relaxed">
            {post.excerpt}
          </p>
          <div className="mt-6 flex items-center gap-2 text-xs font-bold tracking-widest uppercase">
            {t("hero.readMore")}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

const NewsCard = ({ post, index, t }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="group flex flex-col"
    >
      <Link href={`/news/${post.slug}`} className="h-full flex flex-col">
        <div className="relative w-full aspect-[4/3] overflow-hidden bg-gray-100 mb-5">
          <Image
            src={post.image}
            alt={post.title}
            fill
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
            unoptimized
          />
          <div className="absolute top-0 right-0 bg-white px-3 py-1 text-xs font-mono font-medium text-black">
            {post.date}
          </div>
        </div>
        <div className="flex flex-col flex-grow border-t border-gray-200 pt-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-[10px] font-bold text-[#005caf] uppercase tracking-widest">
              {post.categories?.[0] || t("card.defaultCategory")}
            </span>
            <span
              className={`text-[10px] font-bold px-2 py-1 ${
                post.source === "community"
                  ? "bg-[#edf8f2] text-[#237a57]"
                  : "bg-[#eef4fb] text-[#005caf]"
              }`}
            >
              {getPostTypeLabel(post, t)}
            </span>
          </div>
          <h3 className="text-lg font-bold text-gray-900 leading-snug mb-3 group-hover:text-[#005caf] transition-colors line-clamp-2">
            {post.title}
          </h3>
          <p className="text-xs text-gray-500 leading-relaxed line-clamp-3 mb-4 flex-grow">
            {post.excerpt}
          </p>
          <div className="mt-auto flex items-center justify-between">
            <span className="inline-block border-b border-black pb-0.5 text-[10px] font-bold tracking-widest uppercase group-hover:border-[#005caf] group-hover:text-[#005caf] transition-colors">
              {t("card.viewDetails")}
            </span>
            {post.source === "community" && post.authorName && (
              <span className="text-[10px] text-gray-400">
                {post.authorRole} · {post.authorName}
              </span>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

export default function NewsPage({ posts = [] }) {
  const { t } = useTranslation("news");
  const [activeSource, setActiveSource] = useState("all");
  const filteredPosts =
    activeSource === "all"
      ? posts
      : posts.filter((post) => {
          if (activeSource === "official") {
            return post.source === "wordpress";
          }
          if (activeSource === "community") {
            return post.source === "community";
          }
          return (
            post.source === "community" && post.newsType === activeSource
          );
        });
  const heroPost = filteredPosts.length > 0 ? filteredPosts[0] : null;
  const gridPosts = filteredPosts.length > 1 ? filteredPosts.slice(1) : [];
  const siteUrl = getSiteUrl();
  const sourceTabs = [
    { key: "all", label: t("list.allTab"), count: posts.length },
    {
      key: "official",
      label: t("list.officialTab"),
      count: posts.filter((post) => post.source === "wordpress").length,
    },
    {
      key: "community",
      label: t("list.communityTab"),
      count: posts.filter((post) => post.source === "community").length,
    },
  ];
  const submissionTabs = Object.entries(NEWS_TYPE_KEYS).map(
    ([key, translationKey]) => ({
      key,
      label: t(`list.${translationKey}`),
      count: posts.filter(
        (post) => post.source === "community" && post.newsType === key,
      ).length,
    }),
  );

  const schemaItemList = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: posts.map((post, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: `${siteUrl}/news/${post.slug}`,
      name: post.title,
    })),
  };

  return (
    <>
      <Head>
        <title>{t("meta.title")}</title>
        <meta name="description" content={t("meta.description")} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaItemList) }}
        />
      </Head>

      <main className="bg-white min-h-screen pt-24 pb-20">
        <div className="max-w-[1440px] mx-auto px-6 md:px-10 mb-12 flex flex-col md:flex-row md:items-end justify-between border-b border-gray-200 pb-6">
          <div>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tighter mb-2">
              {t("list.pageTitle")}
            </h1>
            <p className="text-sm text-gray-500 tracking-widest">
              {t("list.pageSubtitle")}
            </p>
          </div>
          <div className="hidden md:block text-right">
            <p className="text-xs font-mono text-gray-400">
              {t("list.updatedAt")} {new Date().toLocaleDateString("zh-TW")}
            </p>
          </div>
        </div>

        <div className="max-w-[1440px] mx-auto px-6 md:px-10">
          {posts.length > 0 && (
            <div
              className="mb-12 rounded-xl bg-[#f7f7f7] p-5 md:p-8"
              role="tablist"
              aria-label={t("list.filterLabel")}
            >
              <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                <h2 className="text-xl font-black tracking-tight text-gray-900 md:text-2xl">
                  {t("list.filterTitle")}
                </h2>
                <div className="flex max-w-full gap-1 overflow-x-auto rounded-full bg-white p-1">
                  {sourceTabs.map((tab) => {
                    const active = activeSource === tab.key;
                    return (
                      <button
                        key={tab.key}
                        type="button"
                        role="tab"
                        aria-selected={active}
                        onClick={() => setActiveSource(tab.key)}
                        className={`shrink-0 rounded-full px-4 py-2 text-xs font-bold transition-colors md:px-5 ${
                          active
                            ? "bg-[#e90064] text-white"
                            : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                        }`}
                      >
                        {tab.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-2 md:grid-cols-4">
                {submissionTabs.map((tab) => {
                  const active = activeSource === tab.key;
                  return (
                    <button
                      key={tab.key}
                      type="button"
                      role="tab"
                      aria-selected={active}
                      onClick={() => setActiveSource(tab.key)}
                      className={`min-h-12 border px-3 py-3 text-sm font-medium transition-colors ${
                        active
                          ? "border-[#e90064] bg-[#fff0f6] font-bold text-[#e90064]"
                          : "border-gray-200 bg-white text-gray-700 hover:border-gray-400"
                      }`}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {filteredPosts.length === 0 ? (
            <div className="text-center py-20 text-gray-500">
              {posts.length === 0
                ? t("list.empty")
                : t("list.emptyFiltered")}
            </div>
          ) : (
            <motion.div
              key={activeSource}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <HeroPost post={heroPost} t={t} />
              {gridPosts.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-16">
                  {gridPosts.map((post, index) => (
                    <NewsCard key={post.id} post={post} index={index} t={t} />
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </div>

        <div className="max-w-[1440px] mx-auto px-6 md:px-10 mt-24">
          <div className="w-full h-[1px] bg-gray-200" />
          <div className="flex justify-between items-center py-6">
            <span className="text-[10px] text-gray-400 uppercase tracking-widest">
              {t("list.officialLabel")}
            </span>
            <Link
              href="/category"
              className="text-[10px] font-bold uppercase tracking-widest hover:text-[#005caf]"
            >
              {t("list.goToShop")}
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}

export async function getStaticProps({ locale }) {
  const i18n = await serverSideTranslations(locale ?? "zh-TW", ["news", "common"]);

  try {
    const posts = await fetchMergedNewsFeed({ perPage: 24, locale: locale ?? "zh-TW" });

    return {
      props: { ...i18n, posts },
      revalidate: 60,
    };
  } catch (error) {
    console.error("News list fetch error:", error);
    return {
      props: { ...i18n, posts: [] },
      revalidate: 60,
    };
  }
}
