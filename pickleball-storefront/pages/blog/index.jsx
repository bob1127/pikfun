import React from "react";
import Head from "next/head";
import Link from "next/link";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { fetchPostsByCategorySlug, WP_CATEGORY } from "@/lib/wordpress";
import { FontSizeToolbar } from "@/components/blog/FontSizeContext";
import BlogList from "@/components/blog/BlogList";

function resolveCategoryKey(queryCategory) {
  if (!queryCategory) return "active";
  const entry = Object.entries(WP_CATEGORY).find(
    ([, meta]) => meta.slug === queryCategory,
  );
  return entry?.[0] || "active";
}

export default function BlogIndex({ posts, categoryKey, title }) {
  const { t } = useTranslation("blog");
  const otherEntries = Object.entries(WP_CATEGORY).filter(
    ([key]) => key !== categoryKey,
  );
  const otherKey = otherEntries[0]?.[0] || "knowledge";
  const otherMeta = WP_CATEGORY[otherKey];

  return (
    <>
      <Head>
        <title>{title} | PikFun</title>
      </Head>

      <FontSizeToolbar />

      <main className="editorial-page">
        <div className="editorial-container">
          <nav className="editorial-breadcrumb" aria-label={t("breadcrumbAria")}>
            <Link href="/">{t("breadcrumbHome")}</Link>
            <span aria-hidden> &gt; </span>
            <span>{title}</span>
          </nav>

          <h1 className="editorial-page-title">{title}</h1>

          <BlogList
            posts={posts}
            categoryKey={categoryKey}
            categoryLabel={title}
            listBackHref="/"
          />

          <p className="text-center mt-12 text-sm text-[var(--color-text-muted)]">
            {t("browseOtherCategory")}
            <Link
              href={`/blog?category=${otherMeta.slug}`}
              className="ml-2 text-[var(--color-accent-blue)] underline underline-offset-4"
            >
              {otherMeta.label}
            </Link>
          </p>
        </div>
      </main>
    </>
  );
}

export async function getServerSideProps({ locale, query }) {
  const i18n = await serverSideTranslations(locale ?? "zh-TW", ["blog", "common"]);
  const categoryKey = resolveCategoryKey(query.category);
  const meta = WP_CATEGORY[categoryKey];

  try {
    const posts = await fetchPostsByCategorySlug(meta.slug, {
      perPage: 20,
    });
    return {
      props: {
        ...i18n,
        posts,
        categoryKey,
        title: meta.label,
      },
    };
  } catch {
    return {
      props: {
        ...i18n,
        posts: [],
        categoryKey,
        title: meta.label,
      },
    };
  }
}
