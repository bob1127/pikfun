import React, { useRef, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronRight } from "lucide-react";
import { mapPostToBase } from "@/lib/wordpress";
import {
  BLOG_TOPIC_LABEL,
  SITE_PROFILE,
  extractImagesFromHtml,
  formatWpDateLong,
} from "@/lib/blogMeta";

/* —— 橫向輪播 —— */
function RelatedCarousel({ title, moreHref, posts, variant = "compact" }) {
  const trackRef = useRef(null);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 8);
  }, []);

  const scrollNext = () => {
    const el = trackRef.current;
    if (!el) return;
    el.scrollBy({ left: el.clientWidth * 0.85, behavior: "smooth" });
    setTimeout(checkScroll, 400);
  };

  if (!posts?.length) return null;

  return (
    <section className="pr-section">
      <div className="pr-section-head">
        <h3 className="pr-section-title">{title}</h3>
        {moreHref && (
          <Link href={moreHref} className="pr-section-more">
            查看更多
          </Link>
        )}
      </div>

      <div className="pr-carousel-wrap">
        <div
          ref={trackRef}
          className="pr-carousel-track"
          onScroll={checkScroll}
        >
          {posts.map((post) => {
            const base = mapPostToBase(post);
            const dateLong = formatWpDateLong(post.date);

            if (variant === "story") {
              return (
                <Link
                  key={post.id}
                  href={`/blog/${base.slug}`}
                  className="pr-card pr-card--story"
                >
                  <div className="pr-card-story-img">
                    <Image
                      src={base.image}
                      alt={base.title}
                      fill
                      className="object-cover"
                      unoptimized
                      sizes="220px"
                    />
                  </div>
                  <p className="pr-card-title">{base.title}</p>
                  <time className="pr-card-date">{dateLong}</time>
                </Link>
              );
            }

            return (
              <Link
                key={post.id}
                href={`/blog/${base.slug}`}
                className="pr-card pr-card--compact"
              >
                <div className="pr-card-logo">
                  <Image
                    src={base.image}
                    alt=""
                    width={72}
                    height={48}
                    className="object-cover w-full h-full"
                    unoptimized
                  />
                </div>
                <p className="pr-card-title">{base.title}</p>
                <time className="pr-card-date">{dateLong}</time>
              </Link>
            );
          })}
        </div>

        {canScrollRight && posts.length > 3 && (
          <button
            type="button"
            className="pr-carousel-arrow"
            onClick={scrollNext}
            aria-label="下一頁"
          >
            <ChevronRight size={22} strokeWidth={1.5} />
          </button>
        )}
      </div>
    </section>
  );
}

/* —— 主元件 —— */
export default function BlogPostFooter({
  post,
  base,
  categoryKey,
  categoryLabel,
  listHref,
  latestPosts = [],
  recommendedPosts = [],
}) {
  const title = base.title;
  const topicLabel = BLOG_TOPIC_LABEL[categoryKey] || "匹克球";
  const tags = base.tags?.length ? base.tags : [categoryLabel];
  const contentHtml = post.content?.rendered || "";

  const contentImages = extractImagesFromHtml(contentHtml);
  const galleryImages = [
    ...(base.image && !contentImages.includes(base.image) ? [base.image] : []),
    ...contentImages,
  ].slice(0, 8);

  const metaRows = [
    {
      label: "種類",
      content: (
        <span className={`pr-pill pr-pill--${categoryKey}`}>
          {categoryLabel}
        </span>
      ),
    },
    {
      label: "主題分類",
      content: <span className="pr-pill pr-pill--topic">{topicLabel}</span>,
    },
    {
      label: "關鍵字",
      content: (
        <div className="pr-pill-group">
          {tags.map((tag) => (
            <span key={tag} className="pr-pill">
              {tag}
            </span>
          ))}
        </div>
      ),
    },
    {
      label: "相關連結",
      content: (
        <Link href={listHref} className="pr-meta-link">
          {categoryLabel}文章列表
        </Link>
      ),
    },
    {
      label: "原文連結",
      content: base.link ? (
        <a
          href={base.link}
          target="_blank"
          rel="noopener noreferrer"
          className="pr-meta-link"
        >
          {base.link.replace(/^https?:\/\//, "").slice(0, 48)}…
        </a>
      ) : (
        <span className="pr-meta-muted">—</span>
      ),
    },
  ];

  const profileRows = [
    { label: "官方網站", value: SITE_PROFILE.url, href: SITE_PROFILE.url },
    { label: "業種", value: SITE_PROFILE.industry },
    { label: "服務地區", value: SITE_PROFILE.region },
    {
      label: "聯絡方式",
      value: SITE_PROFILE.contact,
      href: `mailto:${SITE_PROFILE.contact}`,
    },
    { label: "營運單位", value: SITE_PROFILE.representative },
    { label: "成立", value: SITE_PROFILE.established },
  ];

  const otherCategoryKey = categoryKey === "knowledge" ? "active" : "knowledge";
  const otherListHref = `/blog?category=${otherCategoryKey}`;

  return (
    <div className="pr-footer">
      {/* ① 文章資訊 */}
      <section className="pr-meta-section editorial-container">
        <dl className="pr-meta-list">
          {metaRows.map((row) => (
            <div key={row.label} className="pr-meta-row">
              <dt>{row.label}</dt>
              <dd>{row.content}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* ② 會員 CTA */}
      <section className="pr-cta-section editorial-container">
        <div className="pr-cta-box">
          <p className="pr-cta-heading">還未加入我們嗎？</p>
          <div className="pr-cta-buttons">
            <div className="pr-cta-btn-wrap">
              <Link
                href={`/login?redirect=${encodeURIComponent(`/blog/${base.slug}`)}`}
                className="pr-cta-btn pr-cta-btn--dark"
              >
                會員登入
              </Link>
              <p className="pr-cta-sub">已有帳號請點此</p>
            </div>
            <div className="pr-cta-btn-wrap">
              <Link
                href={`/register?redirect=${encodeURIComponent(`/blog/${base.slug}`)}`}
                className="pr-cta-btn pr-cta-btn--blue"
              >
                立即註冊
              </Link>
              <p className="pr-cta-sub">免費加入</p>
            </div>
          </div>
          <p className="pr-cta-note">
            註冊成為會員後，可查看更多教練聯繫方式、活動報名與專屬課程資訊。
            <br />※ 內容依文章類別而定，部分資訊需登入後瀏覽。
          </p>
        </div>
      </section>

      {/* ③ 文章圖片 */}
      {galleryImages.length > 0 && (
        <section className="pr-gallery-section editorial-container">
          <h3 className="pr-gallery-title">文章圖片</h3>
          <div className="pr-gallery-track">
            {galleryImages.map((src, i) => (
              <a
                key={src}
                href={src}
                target="_blank"
                rel="noopener noreferrer"
                className="pr-gallery-item"
              >
                <Image
                  src={src}
                  alt={`${title} 圖片 ${i + 1}`}
                  fill
                  className="object-cover"
                  unoptimized
                  sizes="200px"
                />
              </a>
            ))}
          </div>
        </section>
      )}

      {/* ④ 站點概要 */}
      <section className="pr-profile-section editorial-container">
        <h3 className="pr-profile-heading">站點概要</h3>
        <div className="pr-profile-grid">
          <div className="pr-profile-brand">
            <div className="pr-profile-logo">
              <Image
                src={SITE_PROFILE.logo}
                alt={SITE_PROFILE.name}
                width={120}
                height={48}
                className="object-contain max-h-12"
                unoptimized
              />
            </div>
            <p className="pr-profile-name">{SITE_PROFILE.name}</p>
            <p className="pr-profile-followers">
              {SITE_PROFILE.followers} 位球友追蹤
            </p>
            <Link href="/register" className="pr-follow-btn">
              追蹤
            </Link>
            <Link href="/" className="pr-rss-link">
              返回首頁
            </Link>
          </div>
          <dl className="pr-profile-details">
            {profileRows.map((row) => (
              <div key={row.label} className="pr-profile-row">
                <dt>{row.label}</dt>
                <dd>
                  {row.href ? (
                    <a
                      href={row.href}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {row.value}
                    </a>
                  ) : (
                    row.value
                  )}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* ⑤ 最新文章（同分類・プレスリリース風） */}
      <div className="editorial-container">
        <RelatedCarousel
          title="最新文章"
          moreHref={listHref}
          posts={latestPosts.slice(0, 8)}
          variant="compact"
        />
      </div>

      {/* ⑥ 推薦閱讀（跨分類・ストーリー風） */}
      <div className="editorial-container">
        <RelatedCarousel
          title="推薦閱讀"
          moreHref={otherListHref}
          posts={recommendedPosts.slice(0, 8)}
          variant="story"
        />
      </div>

      {/* ⑦ 底部麵包屑 */}
      <nav className="pr-bottom-crumb editorial-container" aria-label="麵包屑">
        <Link href="/">首頁</Link>
        <span aria-hidden> &gt; </span>
        <Link href={listHref}>{categoryLabel}</Link>
        <span aria-hidden> &gt; </span>
        <span>{title}</span>
      </nav>
    </div>
  );
}

export { RelatedCarousel };
