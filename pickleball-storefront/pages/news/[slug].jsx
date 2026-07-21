import React from "react";
import Head from "next/head";
import { getSiteUrl } from "@/lib/siteUrl";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import {
  fetchPostBySlug,
  fetchNewsPosts,
  mapPostToBase,
} from "@/lib/wordpress";
import {
  fetchCommunityPostBySlug,
  mapCommunityPostToDetail,
  fetchAuthorProfile,
} from "@/lib/communityPosts";
import { fetchMergedNewsFeed } from "@/lib/newsFeed";
import CommunityArticleLayout from "@/components/news/CommunityArticleLayout";
import WordpressArticleLayout from "@/components/news/WordpressArticleLayout";

export default function NewsDetail({
  post,
  recentPosts = [],
  authorProfile = null,
  prevPost = null,
  nextPost = null,
}) {
  const router = useRouter();
  const { t } = useTranslation("news");

  if (router.isFallback) {
    return (
      <div className="min-h-screen flex items-center justify-center tracking-widest uppercase text-gray-500">
        {t("detail.loading")}
      </div>
    );
  }

  if (!post) return null;

  const siteUrl = getSiteUrl();
  const postUrl = `${siteUrl}/news/${post.slug}`;
  const metaDesc = post.seo_description || post.excerpt || "";
  const category = post.categories?.[0] || t("card.defaultCategory");

  const schemaBreadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: t("detail.breadcrumbHome"),
        item: siteUrl,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: t("detail.breadcrumbNews"),
        item: `${siteUrl}/news`,
      },
      { "@type": "ListItem", position: 3, name: post.title, item: postUrl },
    ],
  };

  // 社群投稿：三種分類共用藍色系雜誌風內頁
  if (post.source === "community") {
    return (
      <>
        <Head>
          <title>{post.seo_title || `${post.title} | PikFun`}</title>
          <meta name="description" content={metaDesc} />
          <meta property="og:title" content={post.seo_title || post.title} />
          <meta property="og:description" content={metaDesc} />
          <meta property="og:image" content={post.image} />
          <meta property="og:url" content={postUrl} />
          <meta property="og:type" content="article" />
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify(schemaBreadcrumb),
            }}
          />
        </Head>
        <CommunityArticleLayout
          post={post}
          recentPosts={recentPosts}
          authorProfile={authorProfile}
        />
      </>
    );
  }

  return (
    <>
      <Head>
        <title>{post.seo_title || `${post.title} | PikFun`}</title>
        <meta name="description" content={metaDesc} />
        {post.seo_keywords ? (
          <meta name="keywords" content={post.seo_keywords} />
        ) : null}

        <meta property="og:title" content={post.seo_title || post.title} />
        <meta property="og:description" content={metaDesc} />
        <meta property="og:image" content={post.image} />
        <meta property="og:url" content={postUrl} />
        <meta property="og:type" content="article" />

        {post.structured_data ? (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: post.structured_data }}
          />
        ) : null}

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaBreadcrumb) }}
        />
      </Head>

      <WordpressArticleLayout
        post={post}
        recentPosts={recentPosts}
        prevPost={prevPost}
        nextPost={nextPost}
        t={t}
      />
    </>
  );
}

export async function getStaticPaths() {
  try {
    const posts = await fetchNewsPosts({ perPage: 50 });
    const paths = posts.map((post) => ({ params: { slug: post.slug } }));
    return { paths, fallback: "blocking" };
  } catch {
    return { paths: [], fallback: "blocking" };
  }
}

export async function getStaticProps({ locale, params }) {
  const i18n = await serverSideTranslations(locale ?? "zh-TW", ["news", "common"]);
  const slug = params.slug;

  try {
    // 社群投稿統一以 c- 開頭，避免與 WordPress slug 衝突
    let formattedPost = null;

    if (slug.startsWith("c-")) {
      const communityPost = await fetchCommunityPostBySlug(slug);
      if (communityPost) {
        const detail = mapCommunityPostToDetail(communityPost, locale ?? "zh-TW");
        formattedPost = {
          ...detail,
          seo_title: detail.title,
          seo_description: detail.excerpt,
          seo_keywords: "",
          structured_data: "",
        };
      }
    } else {
      const wpPost = await fetchPostBySlug(slug);
      if (wpPost) {
        const base = mapPostToBase(wpPost);
        formattedPost = {
          id: base.id,
          source: "wordpress",
          slug: base.slug,
          title: base.title,
          content: base.content,
          excerpt: base.excerpt,
          seo_title: base.title,
          seo_description: base.excerpt,
          seo_keywords: "",
          structured_data: "",
          date: base.dateFormatted,
          raw_created_at: base.date,
          raw_updated_at: wpPost.modified || base.date,
          image: base.image,
          categories: base.categories,
        };
      }
    }

    if (!formattedPost) return { notFound: true };

    let authorProfile = null;
    if (formattedPost.source === "community" && formattedPost.authorEmail) {
      authorProfile = await fetchAuthorProfile(formattedPost.authorEmail);
    }

    const merged = await fetchMergedNewsFeed({
      perPage: 24,
      locale: locale ?? "zh-TW",
    });
    const recentPosts = merged.filter((p) => p.slug !== slug).slice(0, 4);

    // WordPress 文章：依日期順序取前後篇（merged 為日期新到舊排序）
    let prevPost = null;
    let nextPost = null;
    if (formattedPost.source === "wordpress") {
      const wpFeed = merged.filter((p) => p.source === "wordpress");
      const index = wpFeed.findIndex((p) => p.slug === slug);
      if (index !== -1) {
        nextPost = wpFeed[index - 1] || null;
        prevPost = wpFeed[index + 1] || null;
      }
    }

    return {
      props: {
        ...i18n,
        post: formattedPost,
        recentPosts,
        authorProfile,
        prevPost,
        nextPost,
      },
      revalidate: 60,
    };
  } catch (error) {
    console.error("Post detail error:", error);
    return { notFound: true };
  }
}
