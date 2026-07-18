import React, { useRef, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next";
import { ChevronRight } from "lucide-react";
import { mapPostToBase } from "@/lib/wordpress";
import {
  getBlogTopicLabel,
  getSiteProfile,
  extractImagesFromHtml,
  formatWpDateLong,
} from "@/lib/blogMeta";

/* —— 橫向輪播 —— */
function RelatedCarousel({ title, moreHref, posts, variant = "compact" }) {
  const { t } = useTranslation("blog");
  const router = useRouter();
  const locale = router.locale || "zh-TW";
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
            {t("footer.carousel.viewMore")}
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
            const dateLong = formatWpDateLong(post.date, locale);

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
            aria-label={t("footer.carousel.nextAria")}
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
  const { t } = useTranslation("blog");
  const router = useRouter();
  const locale = router.locale || "zh-TW";
  const title = base.title;
  const topicLabel = getBlogTopicLabel(categoryKey, locale);
  const tags = base.tags?.length ? base.tags : [categoryLabel];
  const contentHtml = post.content?.rendered || "";
  const siteProfile = getSiteProfile(locale);

  const contentImages = extractImagesFromHtml(contentHtml);
  const galleryImages = [
    ...(base.image && !contentImages.includes(base.image) ? [base.image] : []),
    ...contentImages,
  ].slice(0, 8);

  const metaRows = [
    {
      label: t("footer.meta.category"),
      content: (
        <span className={`pr-pill pr-pill--${categoryKey}`}>
          {categoryLabel}
        </span>
      ),
    },
    {
      label: t("footer.meta.topic"),
      content: <span className="pr-pill pr-pill--topic">{topicLabel}</span>,
    },
    {
      label: t("footer.meta.keywords"),
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
      label: t("footer.meta.relatedLink"),
      content: (
        <Link href={listHref} className="pr-meta-link">
          {categoryLabel}{t("footer.meta.relatedLinkSuffix")}
        </Link>
      ),
    },
    {
      label: t("footer.meta.originalLink"),
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
    {
      label: t("footer.profile.labels.url"),
      value: siteProfile.url,
      href: siteProfile.url,
    },
    { label: t("footer.profile.labels.industry"), value: siteProfile.industry },
    { label: t("footer.profile.labels.region"), value: siteProfile.region },
    {
      label: t("footer.profile.labels.contact"),
      value: siteProfile.contact,
      href: `mailto:${siteProfile.contact}`,
    },
    {
      label: t("footer.profile.labels.representative"),
      value: siteProfile.representative,
    },
    { label: t("footer.profile.labels.established"), value: siteProfile.established },
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
          <p className="pr-cta-heading">{t("footer.cta.heading")}</p>
          <div className="pr-cta-buttons">
            <div className="pr-cta-btn-wrap">
              <Link
                href={`/login?redirect=${encodeURIComponent(`/blog/${base.slug}`)}`}
                className="pr-cta-btn pr-cta-btn--dark"
              >
                {t("footer.cta.loginBtn")}
              </Link>
              <p className="pr-cta-sub">{t("footer.cta.loginSub")}</p>
            </div>
            <div className="pr-cta-btn-wrap">
              <Link
                href={`/register?redirect=${encodeURIComponent(`/blog/${base.slug}`)}`}
                className="pr-cta-btn pr-cta-btn--blue"
              >
                {t("footer.cta.registerBtn")}
              </Link>
              <p className="pr-cta-sub">{t("footer.cta.registerSub")}</p>
            </div>
          </div>
          <p className="pr-cta-note">
            {t("footer.cta.note")}
            <br />
            {t("footer.cta.noteSub")}
          </p>
        </div>
      </section>

      {/* ③ 文章圖片 */}
      {galleryImages.length > 0 && (
        <section className="pr-gallery-section editorial-container">
          <h3 className="pr-gallery-title">{t("footer.gallery.title")}</h3>
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
                  alt={t("footer.gallery.altTemplate", { title, index: i + 1 })}
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
        <h3 className="pr-profile-heading">{t("footer.profile.heading")}</h3>
        <div className="pr-profile-grid">
          <div className="pr-profile-brand">
            <div className="pr-profile-logo">
              <Image
                src={siteProfile.logo}
                alt={siteProfile.name}
                width={120}
                height={48}
                className="object-contain max-h-12"
                unoptimized
              />
            </div>
            <p className="pr-profile-name">{siteProfile.name}</p>
            <p className="pr-profile-followers">
              {siteProfile.followers} {t("footer.profile.followersSuffix")}
            </p>
            <Link href="/register" className="pr-follow-btn">
              {t("footer.profile.follow")}
            </Link>
            <Link href="/" className="pr-rss-link">
              {t("footer.profile.backHome")}
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
          title={t("footer.carousel.latest")}
          moreHref={listHref}
          posts={latestPosts.slice(0, 8)}
          variant="compact"
        />
      </div>

      {/* ⑥ 推薦閱讀（跨分類・ストーリー風） */}
      <div className="editorial-container">
        <RelatedCarousel
          title={t("footer.carousel.recommended")}
          moreHref={otherListHref}
          posts={recommendedPosts.slice(0, 8)}
          variant="story"
        />
      </div>

      {/* ⑦ 底部麵包屑 */}
      <nav className="pr-bottom-crumb editorial-container" aria-label={t("breadcrumbAria")}>
        <Link href="/">{t("footer.bottomCrumb.home")}</Link>
        <span aria-hidden> &gt; </span>
        <Link href={listHref}>{categoryLabel}</Link>
        <span aria-hidden> &gt; </span>
        <span>{title}</span>
      </nav>
    </div>
  );
}

export { RelatedCarousel };
