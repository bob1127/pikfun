"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import { ChevronLeft, ChevronRight, ExternalLink, Play } from "lucide-react";
import { getMedusaConfig } from "@/lib/medusa";

/* 參考圖色票 */
const C = {
  label: "#2369ab",
  border: "#1a3a8a",
  progress: "#1a3a8a",
  track: "#d1d5db",
  navBtn: "#3d4450",
};

const CLONE_MAX = 3;
const GAP_PX = 20;
const AUTO_MS = 4500;
const DRAG_THRESHOLD = 50;

function buildExtendedTopics(topics) {
  if (!topics.length) return [];
  const clone = Math.min(CLONE_MAX, topics.length);
  return [...topics.slice(-clone), ...topics, ...topics.slice(0, clone)];
}

function TopicCard({ topic, suppressClick }) {
  const Icon = topic.icon === "play" ? Play : ExternalLink;

  return (
    <Link
      href={topic.href}
      className="topics-card-wrap topics-slide-item group block flex-shrink-0"
      onClick={(e) => {
        if (suppressClick) {
          e.preventDefault();
        }
      }}
      draggable={false}
    >
      <span className="topics-cat-label">{topic.category}</span>
      <div className="topics-card">
        <div className="topics-card-inner">
          <Image
            src={topic.image}
            alt={topic.title}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-105 pointer-events-none"
            unoptimized
            sizes="(max-width:768px) 85vw, 320px"
          />
          <span className="topics-card-action" aria-hidden>
            <Icon size={14} strokeWidth={2.5} color="#fff" />
          </span>
        </div>
      </div>
      <div className="topics-card-caption">
        <p className="topics-card-title">{topic.title}</p>
        <p className="topics-card-desc">{topic.desc}</p>
      </div>
    </Link>
  );
}

function TopicsInfiniteCarousel({ topics }) {
  const cloneCount = Math.min(CLONE_MAX, topics.length || 1);
  const extendedTopics = useMemo(() => buildExtendedTopics(topics), [topics]);

  const viewportRef = useRef(null);
  const sliderRef = useRef(null);
  const timerRef = useRef(null);
  const lenRef = useRef(topics.length);
  const cloneRef = useRef(cloneCount);
  const dragMovedRef = useRef(false);

  const [currentIndex, setCurrentIndex] = useState(cloneCount);
  const [isTransitioning, setIsTransitioning] = useState(true);
  const [stepPx, setStepPx] = useState(300);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const [suppressClick, setSuppressClick] = useState(false);

  useEffect(() => {
    lenRef.current = topics.length;
    cloneRef.current = Math.min(CLONE_MAX, topics.length || 1);
    setCurrentIndex(Math.min(CLONE_MAX, topics.length || 1));
  }, [topics.length]);

  const measureStep = useCallback(() => {
    const card = sliderRef.current?.querySelector(".topics-slide-item");
    if (card) setStepPx(card.offsetWidth + GAP_PX);
  }, []);

  useEffect(() => {
    measureStep();
    window.addEventListener("resize", measureStep);
    return () => window.removeEventListener("resize", measureStep);
  }, [measureStep, extendedTopics.length]);

  const realIndex =
    topics.length > 0
      ? (((currentIndex - cloneCount) % topics.length) + topics.length) %
        topics.length
      : 0;

  const stopTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  const handleNext = useCallback(() => {
    setIsTransitioning(true);
    setCurrentIndex((prev) => prev + 1);
  }, []);

  const handlePrev = useCallback(() => {
    setIsTransitioning(true);
    setCurrentIndex((prev) => prev - 1);
  }, []);

  const startTimer = useCallback(() => {
    stopTimer();
    if (topics.length < 2) return;
    timerRef.current = setInterval(handleNext, AUTO_MS);
  }, [topics.length, stopTimer, handleNext]);

  useEffect(() => {
    startTimer();
    return () => stopTimer();
  }, [startTimer, stopTimer]);

  const handleTransitionEnd = () => {
    const len = lenRef.current;
    const clone = cloneRef.current;
    if (len === 0) return;

    if (currentIndex >= len + clone) {
      setIsTransitioning(false);
      setCurrentIndex(clone);
    } else if (currentIndex < clone) {
      setIsTransitioning(false);
      setCurrentIndex(len + clone - 1);
    }
  };

  const handleDragStart = (e) => {
    if (e.type === "mousedown" && e.button !== 0) return;
    stopTimer();
    dragMovedRef.current = false;
    setIsDragging(true);
    setIsTransitioning(false);
    const clientX = e.type.includes("mouse") ? e.clientX : e.touches[0].clientX;
    setDragStartX(clientX);
  };

  const handleDragMove = (e) => {
    if (!isDragging) return;
    const clientX = e.type.includes("mouse") ? e.clientX : e.touches[0].clientX;
    const offset = clientX - dragStartX;
    if (Math.abs(offset) > 5) dragMovedRef.current = true;
    setDragOffset(offset);
  };

  const handleDragEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);
    setIsTransitioning(true);

    if (dragOffset > DRAG_THRESHOLD) {
      handlePrev();
    } else if (dragOffset < -DRAG_THRESHOLD) {
      handleNext();
    }

    if (dragMovedRef.current) {
      setSuppressClick(true);
      setTimeout(() => setSuppressClick(false), 80);
    }

    setDragOffset(0);
    startTimer();
  };

  const progressPct =
    topics.length <= 1 ? 100 : (realIndex / (topics.length - 1)) * 100;

  return (
    <>
      <div
        ref={viewportRef}
        className="topics-carousel-viewport"
        onMouseEnter={stopTimer}
        onMouseLeave={() => {
          handleDragEnd();
          startTimer();
        }}
        onMouseDown={handleDragStart}
        onMouseMove={handleDragMove}
        onMouseUp={handleDragEnd}
        onTouchStart={handleDragStart}
        onTouchMove={handleDragMove}
        onTouchEnd={handleDragEnd}
      >
        <div
          ref={sliderRef}
          className={`topics-carousel-slider ${isTransitioning ? "is-transitioning" : ""}`}
          style={{
            transform: `translateX(calc(-${currentIndex * stepPx}px + ${dragOffset}px))`,
          }}
          onTransitionEnd={handleTransitionEnd}
        >
          {extendedTopics.map((topic, index) => (
            <TopicCard
              key={`${topic.id}-${index}`}
              topic={topic}
              suppressClick={suppressClick}
            />
          ))}
        </div>
      </div>

      <div className="topics-nav mt-8 md:mt-10">
        <div className="topics-progress-wrap">
          <div className="topics-progress-track">
            <div
              className="topics-progress-fill"
              style={{ width: `${Math.max(8, progressPct)}%` }}
            />
            {topics.map((_, i) => (
              <span
                key={i}
                className={`topics-progress-dot ${i <= realIndex ? "is-active" : ""}`}
                style={{
                  left:
                    topics.length <= 1
                      ? "100%"
                      : `${(i / (topics.length - 1)) * 100}%`,
                }}
              />
            ))}
          </div>
        </div>

        <div className="topics-controls">
          <span className="topics-page-num">
            {realIndex + 1} <span className="topics-page-sep">|</span>{" "}
            {topics.length}
          </span>
          <button
            type="button"
            className="topics-arrow-btn"
            onClick={() => {
              handlePrev();
              stopTimer();
              startTimer();
            }}
            aria-label="上一則"
          >
            <ChevronLeft size={18} strokeWidth={2} color="#fff" />
          </button>
          <button
            type="button"
            className="topics-arrow-btn"
            onClick={() => {
              handleNext();
              stopTimer();
              startTimer();
            }}
            aria-label="下一則"
          >
            <ChevronRight size={18} strokeWidth={2} color="#fff" />
          </button>
        </div>
      </div>
    </>
  );
}

function ProductShopGrid({ metaLang, targetCurrency, symbol }) {
  const [collections, setCollections] = useState([]);
  const [activeTab, setActiveTab] = useState("all");
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const limit = 8;

  useEffect(() => {
    let cancelled = false;

    const loadCollections = async () => {
      const { BACKEND_URL, headers } = getMedusaConfig();
      try {
        const res = await fetch(`${BACKEND_URL}/store/collections?limit=100`, {
          headers,
        });
        if (!res.ok || cancelled) return;
        const data = await res.json();

        const valid = [];
        await Promise.all(
          (data.collections || []).map(async (col) => {
            const countRes = await fetch(
              `${BACKEND_URL}/store/products?collection_id[]=${col.id}&limit=1`,
              { headers },
            );
            if (!countRes.ok || cancelled) return;
            const countData = await countRes.json();
            if (countData.count > 0) {
              valid.push({
                id: col.id,
                title: col.metadata?.[`title_${metaLang}`] || col.title,
              });
            }
          }),
        );

        if (!cancelled) {
          setCollections([{ id: "all", title: "全部球拍" }, ...valid]);
        }
      } catch (err) {
        if (!cancelled) console.error("載入分類失敗:", err);
      }
    };

    loadCollections();
    return () => {
      cancelled = true;
    };
  }, [metaLang]);

  const fetchProducts = useCallback(
    async (currentOffset, tabId, isLoadMore = false) => {
      const { BACKEND_URL, headers } = getMedusaConfig();
      try {
        if (isLoadMore) setIsLoadingMore(true);
        else setIsLoading(true);

        let url = `${BACKEND_URL}/store/products?limit=${limit}&offset=${currentOffset}&fields=id,title,handle,thumbnail,metadata,*variants,*variants.prices`;
        if (tabId !== "all") url += `&collection_id[]=${tabId}`;

        const res = await fetch(url, { headers });
        if (!res.ok) throw new Error("API 請求失敗");
        const data = await res.json();

        const formatted = (data.products || []).map((p) => {
          const variantPrices = p.variants?.[0]?.prices || [];
          const priceObj =
            variantPrices.find(
              (pr) => pr.currency_code?.toLowerCase() === targetCurrency,
            ) || variantPrices[0];
          const amount = priceObj
            ? priceObj.amount > 1000000
              ? priceObj.amount / 100
              : priceObj.amount
            : 0;

          return {
            id: p.id,
            title: p.metadata?.[`title_${metaLang}`] || p.title,
            slug: p.handle,
            price: `${symbol}${Math.round(amount).toLocaleString()}`,
            image: p.thumbnail || "/images/placeholder.jpg",
          };
        });

        if (isLoadMore) {
          setProducts((prev) => [...prev, ...formatted]);
        } else {
          setProducts(formatted);
        }

        setHasMore(data.count > currentOffset + limit);
        setOffset(currentOffset + limit);
      } catch (err) {
        console.error("載入商品失敗:", err);
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [metaLang, targetCurrency, symbol],
  );

  useEffect(() => {
    fetchProducts(0, activeTab, false);
  }, [activeTab, fetchProducts]);

  return (
    <div className="shop-section">
      <header className="shop-header">
        <h3 className="shop-title">PICKLEBALL PADDLES</h3>
        <p className="topics-lead max-w-xl mx-auto mt-4">熱銷精選球拍/裝備</p>
      </header>

      {collections.length > 1 && (
        <div className="shop-tabs">
          {collections.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`shop-tab ${activeTab === tab.id ? "is-active" : ""}`}
            >
              {tab.title}
            </button>
          ))}
        </div>
      )}

      {isLoading ? (
        <div className="shop-loading">載入中…</div>
      ) : products.length > 0 ? (
        <>
          <div className="shop-grid">
            {products.map((product) => (
              <Link
                key={product.id}
                href={`/product/${product.slug}`}
                className="shop-card group"
              >
                <div className="shop-card-img">
                  <Image
                    src={product.image}
                    alt={product.title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    unoptimized
                    sizes="(max-width:640px) 50vw, 25vw"
                  />
                </div>
                <h4 className="shop-card-title">{product.title}</h4>
                <p className="shop-card-price">{product.price}</p>
                <span className="shop-card-btn">立即購買</span>
              </Link>
            ))}
          </div>

          {hasMore && (
            <div className="shop-more-wrap">
              <button
                type="button"
                onClick={() => fetchProducts(offset, activeTab, true)}
                disabled={isLoadingMore}
                className="shop-more-btn"
              >
                {isLoadingMore ? "載入中…" : "載入更多球拍"}
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="shop-empty">此分類目前沒有商品</div>
      )}
    </div>
  );
}

export default function ProductGridShowcase({ topicPosts = [] }) {
  const router = useRouter();
  const locale = router.locale || "zh-TW";
  const metaLang = locale === "zh-TW" ? "zh" : locale;
  const targetCurrency =
    locale === "en" ? "usd" : locale === "ko" ? "krw" : "twd";
  const symbol =
    targetCurrency === "usd" ? "$ " : targetCurrency === "krw" ? "₩ " : "NT$ ";
  const topics = topicPosts;

  return (
    <section className="topics-section w-full bg-white py-16 md:py-20 px-4 md:px-8 font-sans">
      <div className="max-w-[1280px] mx-auto">
        {/* Header */}
        <header className="text-center mb-10 md:mb-14">
          <h2 className="topics-title">球拍挑選與裝備推薦</h2>
          <p className="topics-lead max-w-2xl mx-auto mt-6">
            第一次買匹克球拍不知道怎麼選？<br></br>{" "}
            玻璃纖維、碳纖維、球拍重量、核心厚度、手柄長度與不同運動背景的挑選建議
            <br></br>幫你找到最適合自己的第一支匹克球拍。
          </p>
        </header>

        {/* Carousel：WordPress 球拍-裝備 / 新手球拍 / 進階球拍 */}
        {topics.length > 0 ? (
          <TopicsInfiniteCarousel topics={topics} />
        ) : (
          <div className="shop-loading">暫無球拍文章，請至 WordPress「球拍-裝備」分類發布</div>
        )}

        {/* Navigation 已整合在 TopicsInfiniteCarousel */}

        {/* CTA strip */}
        <div className="topics-cta-row mt-12 md:mt-16 flex flex-wrap justify-center gap-4">
          <Link href="/category" className="topics-cta-primary">
            依打法挑選球拍
          </Link>
          <Link
            href="/blog?category=rackets-equipment"
            className="topics-cta-secondary"
          >
            閱讀完整裝備攻略
          </Link>
        </div>

        {/* 商品網格：可點擊進產品頁購買 */}
        <ProductShopGrid
          metaLang={metaLang}
          targetCurrency={targetCurrency}
          symbol={symbol}
        />
      </div>

      <style jsx global>{`
        .topics-subtitle {
          color: ${C.label};
          font-size: 0.8125rem;
          font-weight: 700;
          letter-spacing: 0.12em;
          margin-bottom: 0.35rem;
        }
        .topics-title {
          font-size: clamp(2.5rem, 6vw, 3.75rem);
          font-weight: 800;
          letter-spacing: 0.06em;
          color: #000;
          line-height: 1;
        }
        .topics-lead {
          font-size: 0.875rem;
          line-height: 2;
          color: #444;
          letter-spacing: 0.04em;
        }
        .topics-carousel-viewport {
          overflow: hidden;
          cursor: grab;
          user-select: none;
          -webkit-user-select: none;
          touch-action: pan-y;
        }
        .topics-carousel-viewport:active {
          cursor: grabbing;
        }
        .topics-carousel-slider {
          display: flex;
          gap: ${GAP_PX}px;
          align-items: flex-start;
          will-change: transform;
        }
        .topics-carousel-slider.is-transitioning {
          transition: transform 0.5s ease-out;
        }
        .topics-track {
          display: none;
        }
        .topics-card-wrap {
          width: min(320px, 78vw);
          scroll-snap-align: start;
          text-decoration: none;
          color: inherit;
        }
        @media (min-width: 1024px) {
          .topics-card-wrap {
            width: calc((100% - 60px) / 4);
            min-width: 240px;
          }
        }
        .topics-cat-label {
          display: block;
          color: ${C.label};
          font-size: 0.6875rem;
          font-weight: 800;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          margin-bottom: 0.5rem;
        }
        .topics-card {
          display: block;
          border: 4px solid ${C.border};
          border-radius: 14px;
          overflow: hidden;
          background: #fff;
        }
        .topics-card-inner {
          position: relative;
          aspect-ratio: 16 / 9;
          overflow: hidden;
        }
        .topics-card-caption {
          margin-top: 0.75rem;
          padding-right: 0.25rem;
        }
        .topics-card-title {
          color: #111;
          font-size: 0.9375rem;
          font-weight: 800;
          line-height: 1.5;
          margin: 0 0 0.35rem;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          transition: color 0.2s;
        }
        .topics-card-wrap:hover .topics-card-title {
          color: ${C.label};
        }
        .topics-card-desc {
          color: #666;
          font-size: 0.75rem;
          line-height: 1.65;
          margin: 0;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .topics-card-action {
          position: absolute;
          right: 0.75rem;
          bottom: 0.75rem;
          width: 2rem;
          height: 2rem;
          border-radius: 50%;
          background: ${C.label};
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 3;
          transition:
            transform 0.2s,
            background 0.2s;
        }
        .topics-card:hover .topics-card-action {
          transform: scale(1.08);
          background: ${C.border};
        }
        .topics-nav {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1.5rem;
        }
        .topics-progress-wrap {
          flex: 1;
          max-width: 520px;
        }
        .topics-progress-track {
          position: relative;
          height: 3px;
          background: ${C.track};
          border-radius: 999px;
        }
        .topics-progress-fill {
          position: absolute;
          left: 0;
          top: 0;
          height: 100%;
          background: ${C.progress};
          border-radius: 999px;
          transition: width 0.35s ease;
        }
        .topics-progress-dot {
          position: absolute;
          top: 50%;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: ${C.track};
          transform: translate(-50%, -50%);
          transition:
            background 0.3s,
            transform 0.3s;
        }
        .topics-progress-dot.is-active {
          background: ${C.progress};
          width: 10px;
          height: 10px;
        }
        .topics-controls {
          display: flex;
          align-items: center;
          gap: 0.65rem;
          flex-shrink: 0;
        }
        .topics-page-num {
          font-size: 0.9375rem;
          font-weight: 700;
          color: ${C.border};
          letter-spacing: 0.05em;
          margin-right: 0.25rem;
        }
        .topics-page-sep {
          font-weight: 400;
          color: #999;
          margin: 0 0.15rem;
        }
        .topics-arrow-btn {
          width: 2.5rem;
          height: 2.5rem;
          border-radius: 50%;
          background: ${C.navBtn};
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition:
            opacity 0.2s,
            background 0.2s;
        }
        .topics-arrow-btn:hover:not(:disabled) {
          background: #2a3140;
        }
        .topics-arrow-btn:disabled {
          opacity: 0.35;
          cursor: not-allowed;
        }
        .topics-cta-primary {
          display: inline-block;
          padding: 0.85rem 2rem;
          background: ${C.border};
          color: #fff;
          font-size: 0.8125rem;
          font-weight: 700;
          letter-spacing: 0.1em;
          border-radius: 999px;
          text-decoration: none;
          transition: opacity 0.2s;
        }
        .topics-cta-primary:hover {
          opacity: 0.9;
        }
        .topics-cta-secondary {
          display: inline-block;
          padding: 0.85rem 2rem;
          border: 2px solid ${C.border};
          color: ${C.border};
          font-size: 0.8125rem;
          font-weight: 700;
          letter-spacing: 0.1em;
          border-radius: 999px;
          text-decoration: none;
          transition:
            background 0.2s,
            color 0.2s;
        }
        .topics-cta-secondary:hover {
          background: ${C.border};
          color: #fff;
        }
        .shop-section {
          margin-top: 5rem;
          padding-top: 3.5rem;
          border-top: 1px solid #e5e7eb;
        }
        .shop-header {
          text-align: center;
          margin-bottom: 2rem;
        }
        .shop-title {
          font-size: clamp(1.75rem, 4vw, 2.5rem);
          font-weight: 800;
          letter-spacing: 0.06em;
          color: #000;
        }
        .shop-tabs {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 0.5rem 1.25rem;
          margin-bottom: 2rem;
          padding-bottom: 1rem;
          border-bottom: 1px solid #e5e7eb;
        }
        .shop-tab {
          font-size: 0.75rem;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #999;
          background: none;
          border: none;
          cursor: pointer;
          padding: 0.25rem 0;
          border-bottom: 2px solid transparent;
          transition:
            color 0.2s,
            border-color 0.2s;
        }
        .shop-tab:hover {
          color: ${C.border};
        }
        .shop-tab.is-active {
          color: ${C.border};
          border-bottom-color: ${C.border};
        }
        .shop-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1.25rem 1rem;
        }
        @media (min-width: 768px) {
          .shop-grid {
            grid-template-columns: repeat(3, 1fr);
            gap: 1.5rem;
          }
        }
        @media (min-width: 1024px) {
          .shop-grid {
            grid-template-columns: repeat(4, 1fr);
            gap: 1.75rem;
          }
        }
        .shop-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          text-decoration: none;
          color: inherit;
        }
        .shop-card-img {
          position: relative;
          width: 100%;
          aspect-ratio: 4 / 5;
          background: #f5f5f5;
          border: 2px solid ${C.border};
          border-radius: 12px;
          overflow: hidden;
          margin-bottom: 0.75rem;
        }
        .shop-card-title {
          font-size: 0.8125rem;
          font-weight: 700;
          color: #111;
          line-height: 1.4;
          margin: 0 0 0.35rem;
          width: 100%;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .shop-card-price {
          font-size: 0.75rem;
          font-weight: 700;
          color: ${C.label};
          letter-spacing: 0.08em;
          margin: 0 0 0.65rem;
        }
        .shop-card-btn {
          display: block;
          width: 100%;
          padding: 0.65rem;
          background: ${C.border};
          color: #fff;
          font-size: 0.6875rem;
          font-weight: 800;
          letter-spacing: 0.12em;
          border-radius: 6px;
          transition: background 0.2s;
        }
        .shop-card:hover .shop-card-btn {
          background: ${C.label};
        }
        .shop-loading,
        .shop-empty {
          text-align: center;
          padding: 3rem 0;
          color: #999;
          font-size: 0.875rem;
          letter-spacing: 0.08em;
        }
        .shop-more-wrap {
          display: flex;
          justify-content: center;
          margin-top: 2.5rem;
        }
        .shop-more-btn {
          padding: 0.85rem 2.5rem;
          border: 2px solid ${C.border};
          background: #fff;
          color: ${C.border};
          font-size: 0.75rem;
          font-weight: 700;
          letter-spacing: 0.1em;
          border-radius: 999px;
          cursor: pointer;
          transition:
            background 0.2s,
            color 0.2s;
        }
        .shop-more-btn:hover:not(:disabled) {
          background: ${C.border};
          color: #fff;
        }
        .shop-more-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      `}</style>
    </section>
  );
}
