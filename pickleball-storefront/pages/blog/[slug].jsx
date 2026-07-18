import React from "react";
import Head from "next/head";
import Link from "next/link";
import Image from "next/image";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import {
  fetchPostBySlug,
  fetchPostsByCategorySlug,
  mapPostToBase,
  stripHtml,
  formatWpDate,
  WP_CATEGORY,
} from "@/lib/wordpress";
import { FontSizeToolbar } from "@/components/blog/FontSizeContext";
import BlogPostFooter from "@/components/blog/BlogPostFooter";

function categoryKeyFromNames(names = []) {
  if (names.some((n) => n.includes("球拍") || n.includes("裝備")))
    return "racketsEquipment";
  if (names.some((n) => n.includes("運動知識"))) return "knowledge";
  if (names.some((n) => n.includes("球場") || n.includes("活動")))
    return "active";
  return "active";
}

export default function BlogPost({
  post,
  latestPosts,
  recommendedPosts,
  categoryKey,
}) {
  const { t } = useTranslation("blog");

  if (!post) {
    return (
      <main className="editorial-page">
        <div className="editorial-container text-center py-20">
          <p className="text-[var(--color-text-muted)]">{t("notFound")}</p>
          <Link href="/" className="editorial-cta-link mt-8">
            {t("backToHome")}
          </Link>
        </div>
      </main>
    );
  }

  const title = stripHtml(post.title?.rendered || "");
  const date = formatWpDate(post.date);
  const base = mapPostToBase(post);
  const category = base.categories[0] || t("topics.default");
  const meta = WP_CATEGORY[categoryKey];
  const listHref = `/blog?category=${meta?.slug || "active"}`;

  return (
    <>
      <Head>
        <title>{title} | PikFun</title>
        <meta name="description" content={base.excerpt} />
      </Head>

      <FontSizeToolbar />

      <main className="editorial-page">
        <article className="editorial-container">
          <nav className="editorial-breadcrumb" aria-label={t("breadcrumbAria")}>
            <Link href="/">{t("breadcrumbHome")}</Link>
            <span aria-hidden> &gt; </span>
            <Link href={listHref}>{meta?.label || category}</Link>
            <span aria-hidden> &gt; </span>
            <span>{title}</span>
          </nav>

          <header className="editorial-article-header">
            <div className="editorial-article-meta">
              <span className={`editorial-tag editorial-tag--${categoryKey}`}>
                {category}
              </span>
              <time dateTime={post.date}>{date}</time>
            </div>
            <h1 className="editorial-article-title">【 {title} 】</h1>
            {base.excerpt && (
              <p className="editorial-article-lead">{base.excerpt}</p>
            )}
            <hr className="editorial-divider" />
          </header>

          {base.image && (
            <figure className="editorial-hero">
              <Image
                src={base.image}
                alt={title}
                fill
                className="object-cover"
                unoptimized
                sizes="(max-width: 1146px) 100vw, 1146px"
                priority
              />
            </figure>
          )}

          <div
            className="editorial-article__body"
            dangerouslySetInnerHTML={{
              __html: post.content?.rendered || "",
            }}
          />

          <BlogPostFooter
            post={post}
            base={base}
            categoryKey={categoryKey}
            categoryLabel={meta?.label || category}
            listHref={listHref}
            latestPosts={latestPosts}
            recommendedPosts={recommendedPosts}
          />
        </article>
      </main>
    </>
  );
}

export async function getStaticPaths() {
  return { paths: [], fallback: "blocking" };
}

export async function getStaticProps({ locale, params }) {
  const i18n = await serverSideTranslations(locale ?? "zh-TW", ["blog", "common"]);

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
