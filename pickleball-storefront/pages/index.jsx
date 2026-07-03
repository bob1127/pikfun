// pages/index.js
import React, { useRef, useState, useCallback, useEffect } from "react";
import Head from "next/head";
import { getSiteUrl } from "@/lib/siteUrl";
import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import Marquee from "react-marquee-slider";
import useEmblaCarousel from "embla-carousel-react";
import ScrollServiceSection from "../components/ScrollServiceSection";
import Store from "../components/Store";
import AutoCarousel from "../components/AutoCarousel";
// 移除 next-i18next 的引入
// import { serverSideTranslations } from "next-i18next/serverSideTranslations";
// import { useTranslation } from "next-i18next";
import Image from "next/image";
// 元件引入
import CollectionShowcase from "@/components/ProductGridShowcase";
import HeroSlider from "../components/Slider/Slider";
import ParallaxImage from "../components/ParallaxImage";
import Gallery from "../components/ImageTextSlider";
import FullSlider from "../components/HeroSlideContact/page";
import Scroll from "../components/Scroll";
import HeroCarousel from "../components/HeroCarousel";
import { ParallaxProvider, Parallax } from "react-scroll-parallax";

// 🔥 引入剛剛設計的進駐夥伴元件
import PartnersSection from "../components/PartnersSection"; // 假設您將它放在 components 目錄下
import { fetchHomeWpPosts } from "@/lib/wordpress";

export default function Home({
  featuredProducts,
  activePosts = [],
  knowledgePosts = [],
  topicPosts = [],
}) {
  // 移除 { t } 的使用
  // const { t } = useTranslation("common");

  // --- 1. 頁面滾動特效 ---
  const scrollRef = useRef(null);
  const { scrollY } = useScroll({
    target: scrollRef,
    offset: ["start start", "end end"],
  });
  const y1 = useTransform(scrollY, [0, 1000], [0, 100]);
  const fadeUpProps = {
    initial: { opacity: 0, y: 40 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: "-100px" },
    transition: { duration: 0.8, ease: "easeOut" },
  };
  // --- 2. 輪播設定 (調整為更流暢的滑動) ---
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,
    align: "start",
    slidesToScroll: 1,
    containScroll: "trimSnaps",
  });

  const [prevBtnDisabled, setPrevBtnDisabled] = useState(true);
  const [nextBtnDisabled, setNextBtnDisabled] = useState(true);

  const scrollPrev = useCallback(
    () => emblaApi && emblaApi.scrollPrev(),
    [emblaApi],
  );
  const scrollNext = useCallback(
    () => emblaApi && emblaApi.scrollNext(),
    [emblaApi],
  );

  const onSelect = useCallback((api) => {
    setPrevBtnDisabled(!api.canScrollPrev());
    setNextBtnDisabled(!api.canScrollNext());
  }, []);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect(emblaApi);
    emblaApi.on("reInit", onSelect);
    emblaApi.on("select", onSelect);
  }, [emblaApi, onSelect]);

  // --- 3. 字數限制小工具 (限制 15 字) ---
  const truncateTitle = (str, limit = 15) => {
    if (!str) return "";
    return str.length > limit ? str.substring(0, limit) + "..." : str;
  };

  // --- SEO 設定 (為 PikFun 調整) ---
  const siteUrl = getSiteUrl();
  const siteTitle =
    "PikFun 匹克方 | 匹克球社群、商城、球場資訊、相關資訊｜致力於打造匹克球相關聚落";
  const siteDescription =
    "全台最大的匹克球社群與資訊平台。提供球場預約、裝備選購、教練媒合與球友討論交流等全方位服務。";

  // 社群預覽圖
  const ogImage = `${siteUrl}/images/logo/logo.png`; // 請確保圖片存在

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        url: siteUrl,
        name: "PikFun 匹克方",
        logo: {
          "@type": "ImageObject",
          url: ogImage,
        },
        description: siteDescription,
      },
    ],
  };

  return (
    <>
      <Head>
        <title>{siteTitle}</title>
        <meta name="description" content={siteDescription} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />

        {/* Open Graph (FB, LINE) */}
        <meta property="og:title" content={siteTitle} />
        <meta property="og:description" content={siteDescription} />
        <meta property="og:url" content={siteUrl} />
        <meta property="og:type" content="website" />
        <meta property="og:image" content={ogImage} />

        {/* Twitter Card (X) */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={siteTitle} />
        <meta name="twitter:description" content={siteDescription} />
        <meta name="twitter:image" content={ogImage} />

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </Head>

      <HeroCarousel />

      {/* 🔥 插入 TSUNORU 風格的進駐商萬元件 */}
      <PartnersSection />
      <AutoCarousel items={knowledgePosts} />
      <CollectionShowcase topicPosts={topicPosts} />
      <ParallaxProvider>
        <section className="flex relative gap-4 "></section>
      </ParallaxProvider>

      {/* =======================================================
          🔥 極簡雜誌風格輪播 (精選商品)
      ======================================================= */}
      <section className="pt-10 relative container mx-auto px-6 md:px-12">
        {/* 標題與控制按鈕區 */}
        <div className="flex justify-between items-end mb-10 px-2">
          <h2 className="text-2xl md:text-3xl lg:mt-10 font-black tracking-widest uppercase text-gray-900">
            熱門裝備推薦
          </h2>
          {/* 極簡箭頭 */}
          <div className="hidden md:flex gap-6">
            <button
              onClick={scrollPrev}
              disabled={prevBtnDisabled}
              className="text-gray-400 hover:text-black transition-colors disabled:opacity-20"
            >
              <span className="text-2xl">←</span>
            </button>
            <button
              onClick={scrollNext}
              disabled={nextBtnDisabled}
              className="text-gray-400 hover:text-black transition-colors disabled:opacity-20"
            >
              <span className="text-2xl">→</span>
            </button>
          </div>
        </div>

        {/* Embla Viewport */}
        <div className="overflow-hidden" ref={emblaRef}>
          <div className="flex touch-pan-y -ml-6 md:-ml-8">
            {featuredProducts &&
              featuredProducts.map((slide, index) => (
                <div
                  className="flex-[0_0_85%] md:flex-[0_0_45%] lg:flex-[0_0_30%] min-w-0 pl-6 md:pl-8 relative"
                  key={slide.id || index}
                >
                  <Link
                    href={`/product/${slide.slug}`}
                    className="group block w-full"
                  >
                    <div className="relative w-full aspect-[4/5] overflow-hidden bg-gray-50 mb-5 rounded-md">
                      <img
                        src={slide.image}
                        className="w-full h-full object-cover object-center transition-transform duration-1000 ease-out group-hover:scale-105"
                        alt={slide.titleZh}
                      />
                    </div>
                    <div className="flex flex-col items-start space-y-1">
                      <span className="text-[11px] md:text-[12px] text-gray-500 uppercase tracking-widest font-medium">
                        {slide.price}
                      </span>
                      <h3 className="text-[15px] md:text-[16px] text-gray-900 font-bold tracking-wide leading-relaxed group-hover:text-blue-600 transition-colors">
                        {truncateTitle(slide.titleZh, 15)}
                      </h3>
                    </div>
                  </Link>
                </div>
              ))}
          </div>
        </div>
      </section>
      <ScrollServiceSection />
      {/* ======================================================= */}
      <div className="bg-white text-gray-900 font-sans overflow-hidden">
        {/* =========================================
          Section 1: 巨大文字與 Service 介紹
          ========================================= */}
        <section className="relative pt-20 pb-32">
          {/* 背景巨大裝飾文字 (跨出螢幕) */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            className="whitespace-nowrap text-[#807977] font-bold text-[13vw] leading-[0.8] tracking-tighter opacity-95 -ml-[3vw] select-none pointer-events-none"
          >
            ing the Joy of Pickleball
          </motion.div>

          <div className="max-w-[1440px] mx-auto px-6 md:px-16 mt-24 md:mt-40 flex flex-col lg:flex-row justify-between items-start gap-12 lg:gap-0">
            {/* 垂直標籤 (僅在桌面版顯示) */}
            <div
              className="hidden lg:flex flex-col items-center gap-6 text-[11px] font-bold tracking-[0.3em] text-gray-800 uppercase"
              style={{ writingMode: "vertical-rl" }}
            >
              <span>02</span>
              <div className="w-[1px] h-16 bg-gray-900"></div>
              <span>Service</span>
            </div>

            {/* 標題區塊 */}
            <motion.div {...fadeUpProps} className="w-full lg:w-[45%] lg:pl-10">
              <h2 className="text-2xl md:text-3xl lg:text-[32px] font-bold text-gray-900 leading-[1.6] tracking-wide">
                從球場出發，
                <br className="hidden md:block" />
                打造完整的匹克球生活圈
              </h2>
            </motion.div>

            {/* 內文與按鈕區塊 */}
            <motion.div
              {...fadeUpProps}
              transition={{ delay: 0.2, duration: 0.8 }}
              className="w-full lg:w-[45%]"
            >
              <p className="text-gray-600 leading-[2.2] text-[14px] md:text-[15px] mb-12 text-justify">
                我們整合購物、揪團、教練與學習內容，讓你一站搞定匹克球所需的一切。精選球拍與配件、快速找到球友與場次、專業教練一對一指導，還有規則教學與趣味小遊戲幫你輕鬆入門。不只是買裝備，更是加入一個持續成長的運動社群。PikFun
                持續拓展服務，讓每位球友都能更輕鬆享受這項人人皆可上手的運動。
              </p>
              <button className="bg-[#0f43e7] text-white px-12 py-4 rounded-full text-sm font-medium tracking-wider hover:bg-[#0c36b8] hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
                全部服務
              </button>
            </motion.div>
          </div>
        </section>

        {/* =========================================
          Section 2: About Us 與 圖片排版
          ========================================= */}
        <section className="relative py-24 bg-white">
          <div className="max-w-[1440px] mx-auto px-6 md:px-16 flex flex-col-reverse lg:flex-row items-center gap-16 lg:gap-24 relative">
            {/* 左側圖片區塊 */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="w-full lg:w-[45%]"
            >
              <div className="relative aspect-[4/5] w-full max-w-[500px] mx-auto lg:mr-auto overflow-hidden rounded-sm bg-gray-100">
                {/* 請替換為你實際的圖片路徑 */}
                <Image
                  src="/images/c7a236bf6914a2675b66bada6c4bcbf4.jpg"
                  alt="匹克球場上揮拍"
                  fill
                  className="object-cover hover:scale-105 transition-transform duration-[2s] ease-out"
                  unoptimized
                />
              </div>
            </motion.div>

            {/* 右側文字內容區塊 */}
            <div className="w-full lg:w-[50%] relative">
              {/* 桌面版右側垂直標籤 (絕對定位) */}
              <div
                className="hidden lg:flex absolute top-0 -right-12 flex-col items-center gap-6 text-[11px] font-bold tracking-[0.3em] text-gray-800 uppercase"
                style={{ writingMode: "vertical-rl" }}
              >
                <span>01</span>
                <div className="w-[1px] h-16 bg-gray-900"></div>
                <span>About us</span>
              </div>

              <motion.div {...fadeUpProps}>
                <h2 className="text-2xl md:text-3xl lg:text-[32px] font-bold text-gray-900 leading-[1.6] tracking-wide mb-10">
                  「先上場再說」的運動精神，
                  <br className="hidden md:block" />
                  與每一位球友並肩同行。
                </h2>
              </motion.div>

              <motion.div
                {...fadeUpProps}
                transition={{ delay: 0.2, duration: 0.8 }}
              >
                <p className="text-gray-600 leading-[2.2] text-[14px] md:text-[15px] mb-12 text-justify">
                  PikFun
                  相信，匹克球不只是一項運動，更是連結人與人的起點。從第一次握拍、第一次上手，到找到固定球友、定期開團，我們希望降低入門門檻，讓更多人在球場上相遇。無論你是剛接觸的新手，還是想找固定場次的老手，都能在這裡找到屬於自己的節奏。我們提供裝備選購、揪團開打、教練課程與學習資源，陪你從好奇到熱愛，一起在場上揮灑汗水、享受每一次擊球。
                </p>
                <button className="bg-[#0f43e7] text-white px-12 py-4 rounded-full text-sm font-medium tracking-wider hover:bg-[#0c36b8] hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
                  關於我們
                </button>
              </motion.div>
            </div>
          </div>
        </section>
        <section className="flex relative gap-4 ">
          <Store posts={activePosts} />
        </section>
      </div>
    </>
  );
}

// --- SSG: 服務端抓取資料 (移除多語系處理) ---
export async function getStaticProps() {
  const wpPromise = fetchHomeWpPosts();

  const WC_URL = process.env.WC_SITE_URL;
  const CK = process.env.WC_CONSUMER_KEY;
  const CS = process.env.WC_CONSUMER_SECRET;

  if (!WC_URL || !CK || !CS) {
    console.error("❌ 環境變數缺失！請檢查 Vercel 後台設定。");
    const wp = await wpPromise;
    return {
      props: {
        featuredProducts: [],
        activePosts: wp.activePosts,
        knowledgePosts: wp.knowledgePosts,
        topicPosts: wp.topicPosts,
      },
      revalidate: 60,
    };
  }

  const https = require("https");
  const agent = new https.Agent({ rejectUnauthorized: false });
  const auth = Buffer.from(`${CK}:${CS}`).toString("base64");
  const headers = {
    "User-Agent": "Mozilla/5.0 (Next.js)",
    Authorization: `Basic ${auth}`,
  };

  try {
    console.log(`🌐 正在向 WooCommerce 請求商品資料...`);
    const res = await fetch(
      `${WC_URL}/wp-json/wc/v3/products?status=publish&per_page=10`,
      { agent, headers },
    );

    if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);

    const products = await res.json();
    console.log(`✅ 成功抓取到 ${products.length} 筆商品`);

    const formattedSlides = products.map((p) => {
      let imageUrl = "/images/placeholder.jpg";
      if (p.images && p.images.length > 0) {
        let src = p.images[0].src;
        if (src.startsWith("http://")) {
          src = src.replace("http://", "https://");
        }
        imageUrl = src;
      }

      const price = `NT$ ${parseInt(p.price || 0).toLocaleString()}`;
      const cleanDesc = (p.short_description || "")
        .replace(/<[^>]+>/g, "")
        .trim();
      const titleZh = cleanDesc || p.name;

      return {
        id: p.id,
        slug: p.slug,
        titleZh: titleZh,
        price: price,
        image: imageUrl,
      };
    });

    const wp = await wpPromise;

    return {
      props: {
        featuredProducts: formattedSlides,
        activePosts: wp.activePosts,
        knowledgePosts: wp.knowledgePosts,
        topicPosts: wp.topicPosts,
      },
      revalidate: 60,
    };
  } catch (error) {
    console.error("❌ WooCommerce API 抓取失敗:", error.message);
    const wp = await wpPromise;
    return {
      props: {
        featuredProducts: [],
        activePosts: wp.activePosts,
        knowledgePosts: wp.knowledgePosts,
        topicPosts: wp.topicPosts,
      },
      revalidate: 60,
    };
  }
}
