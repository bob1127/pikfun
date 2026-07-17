import React, { useEffect, useState, useRef } from "react";
import Head from "next/head";
import { getSiteUrl } from "@/lib/siteUrl";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/router";
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

function RecentJournalCard({ post }) {
  return (
    <Link href={`/news/${post.slug}`} className="block group">
      <div className="relative w-full aspect-[4/3] bg-gray-100 mb-4 overflow-hidden">
        <Image
          src={post.image}
          alt={post.title}
          fill
          className="object-cover transition-transform duration-700 group-hover:scale-105"
          unoptimized
        />
      </div>
      <div className="flex justify-between items-center text-[10px] text-gray-500 mb-2 uppercase tracking-wider">
        <span className="border-b border-gray-300 pb-0.5">
          {post.categories?.[0] || "最新消息"}
        </span>
        <span>{post.date}</span>
      </div>
      <h3 className="text-sm font-bold leading-snug mb-2 group-hover:text-[#005caf] transition-colors line-clamp-2">
        {post.title}
      </h3>
      <p className="text-xs text-gray-400 line-clamp-3 leading-relaxed">
        {post.excerpt}
      </p>
    </Link>
  );
}

export default function NewsDetail({
  post,
  recentPosts = [],
  authorProfile = null,
}) {
  const router = useRouter();
  const [headings, setHeadings] = useState([]);
  const contentRef = useRef(null);

  useEffect(() => {
    if (!contentRef.current) return;
    const h2Elements = Array.from(contentRef.current.querySelectorAll("h2"));
    const nextHeadings = h2Elements.map((h2, index) => {
      const id = `heading-${index}`;
      h2.id = id;
      return { id, text: h2.innerText };
    });
    setHeadings(nextHeadings);
  }, [post]);

  const scrollToHeading = (e, id) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (!element) return;
    const y = element.getBoundingClientRect().top + window.scrollY - 100;
    window.scrollTo({ top: y, behavior: "smooth" });
  };

  if (router.isFallback) {
    return (
      <div className="min-h-screen flex items-center justify-center tracking-widest uppercase text-gray-500">
        Loading...
      </div>
    );
  }

  if (!post) return null;

  const siteUrl = getSiteUrl();
  const postUrl = `${siteUrl}/news/${post.slug}`;
  const metaDesc = post.seo_description || post.excerpt || "";
  const category = post.categories?.[0] || "最新消息";

  const schemaBreadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "首頁", item: siteUrl },
      {
        "@type": "ListItem",
        position: 2,
        name: "最新消息",
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

      <main className="bg-white min-h-screen pt-24 pb-20 font-sans text-[#1a1a1a]">
        <div className="w-full max-w-[1400px] mx-auto px-0 md:px-6 mb-12">
          <div className="relative w-full aspect-[16/9] md:aspect-[2/1] max-h-[560px] bg-[#0f172a] overflow-hidden">
            <Image
              src={post.image}
              alt={post.title}
              fill
              className="object-cover object-center"
              priority
              sizes="(max-width: 1400px) 100vw, 1400px"
              quality={90}
              unoptimized
            />
          </div>
        </div>

        <div className="max-w-[1400px] mx-auto px-6 mb-16 border-b border-gray-200 pb-10">
          <div className="flex flex-col md:flex-row justify-between items-start gap-8">
            <div className="flex-1">
              <span className="inline-block border-b border-black text-xs font-bold uppercase tracking-widest mb-4">
                {category}
              </span>
              <h1 className="text-3xl md:text-4xl font-bold leading-tight mb-2 tracking-wide">
                {post.title}
              </h1>
              <p className="text-sm text-gray-400 tracking-widest font-light">
                {post.source === "community" && post.authorName
                  ? `${post.authorRole} · ${post.authorName}`
                  : "PikFun News"}
              </p>
              <p className="text-xs font-mono mt-4 text-gray-500">{post.date}</p>
            </div>
            <div className="w-full md:w-[280px] text-xs text-gray-500 space-y-4 pt-2">
              <div className="space-y-1 border-l-2 border-gray-100 pl-4">
                <p className="font-bold text-gray-900">分類</p>
                <p>{category}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-[1400px] mx-auto px-6 mb-24 flex flex-col lg:flex-row gap-16 items-start">
          <aside className="hidden lg:block w-48 sticky top-32 shrink-0">
            <h3 className="text-xs font-bold uppercase tracking-widest mb-6 border-b border-gray-200 pb-3">
              文章目錄
            </h3>
            {headings.length > 0 ? (
              <ul className="space-y-5 border-l-2 border-gray-100 pl-4">
                {headings.map((heading) => (
                  <li key={heading.id}>
                    <a
                      href={`#${heading.id}`}
                      onClick={(e) => scrollToHeading(e, heading.id)}
                      className="text-[13px] text-gray-500 hover:text-[#005caf] transition-colors line-clamp-2 leading-[1.7] font-medium block"
                    >
                      {heading.text}
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-gray-400">暫無大綱</p>
            )}
          </aside>

          <div className="flex-1 w-full max-w-[700px]">
            <article
              ref={contentRef}
              className="prose prose-stone max-w-none prose-p:text-[15px] prose-p:leading-[1.9] prose-p:tracking-[0.06em] prose-p:mb-6 prose-p:text-stone-800 prose-li:leading-[1.85] prose-li:my-1.5 prose-td:leading-[1.7] prose-td:py-3 prose-th:leading-[1.6] prose-h2:text-2xl prose-h2:font-bold prose-h2:mt-12 prose-h2:mb-5 prose-h2:tracking-wider prose-h2:text-gray-900 prose-h2:pb-4 prose-h2:leading-snug prose-strong:font-bold prose-strong:text-black prose-strong:tracking-wide [&>p>b]:font-bold [&>p>b]:text-black [&>p>b]:tracking-wide prose-img:w-full prose-img:aspect-[4/3] prose-img:object-cover prose-img:my-12 prose-img:bg-gray-50 prose-img:rounded-md prose-a:text-[#005caf] prose-a:no-underline hover:prose-a:underline"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />
            <div className="flex justify-end mt-16">
              <button
                type="button"
                onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                className="w-10 h-10 bg-black rounded-full flex items-center justify-center text-white cursor-pointer hover:bg-[#005caf] transition-colors"
                aria-label="回到頂部"
              >
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
                  <path d="M18 15l-6-6-6 6" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-[1200px] mx-auto px-6 pb-20 border-t border-gray-200 pt-16">
          <div className="flex justify-center mb-16">
            <Link
              href="/news"
              className="px-8 py-3 border border-gray-300 rounded-full text-xs font-bold tracking-widest hover:bg-black hover:text-white transition-all"
            >
              返回最新消息
            </Link>
          </div>
          <div className="flex items-center gap-4 mb-10">
            <h2 className="text-2xl font-normal tracking-wide">推薦閱讀</h2>
            <span className="bg-[#1c1c1c] text-white text-[10px] rounded-full px-3 py-1 font-bold">
              News
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            {recentPosts.map((item) => (
              <RecentJournalCard key={item.id} post={item} />
            ))}
          </div>
        </div>
      </main>
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

export async function getStaticProps({ params }) {
  const slug = params.slug;

  try {
    // 社群投稿統一以 c- 開頭，避免與 WordPress slug 衝突
    let formattedPost = null;

    if (slug.startsWith("c-")) {
      const communityPost = await fetchCommunityPostBySlug(slug);
      if (communityPost) {
        const detail = mapCommunityPostToDetail(communityPost);
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

    const merged = await fetchMergedNewsFeed({ perPage: 24 });
    const recentPosts = merged
      .filter((p) => p.slug !== slug)
      .slice(0, 4);

    return {
      props: {
        post: formattedPost,
        recentPosts,
        authorProfile,
      },
      revalidate: 60,
    };
  } catch (error) {
    console.error("Post detail error:", error);
    return { notFound: true };
  }
}
