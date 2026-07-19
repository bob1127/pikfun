// components/Layout.js
import { useEffect } from "react";
import { useRouter } from "next/router";
import AOS from "aos";
import "aos/dist/aos.css";
import Navbar from "@/components/Navbar/Navbar.jsx"; 
import Banner from "@/components/banner";
import Footer from "@/components/ui/footer.jsx";
import Head from "next/head";
import { getSiteUrl } from "@/lib/siteUrl";
import CartSidebar from "@/components/CartSidebar"; 
import PwaSetupPrompt from "@/components/PwaSetupPrompt";

export default function Layout({ children }) {
  const router = useRouter();
  const isStandalonePage = router.pathname === "/about-pikfun";

  useEffect(() => {
    AOS.init({
      once: true,
      disable: "phone",
      duration: 700,
      easing: "ease-out-cubic",
    });
  }, []);

  // === SEO & 結構化資料設定（依語系切換） ===
  const siteUrl = getSiteUrl();
  const isEn = router.locale === "en";
  const siteName = isEn ? "PikFun" : "PikFun 匹克方";
  const siteTitle = isEn
    ? "PikFun | Pickleball Community, Shop, Courts & Coaching"
    : "PikFun 匹克方｜匹克球社群、商城、球場資訊、教練課程";
  const siteDescription = isEn
    ? "Taiwan's largest pickleball community and information platform. Search courts, join group play, shop gear, connect with coaches, and chat with fellow players."
    : "全台最大的匹克球社群與資訊平台。提供球場搜尋、揪團臨打、裝備選購、教練媒合與球友討論交流等全方位服務。";
  const siteImage = `${siteUrl}/images/logo/logo.png`;
  const ogLocale = isEn ? "en_US" : "zh_TW";

  const orgJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: siteName,
    url: siteUrl,
    logo: siteImage,
    description: siteDescription,
  };

  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteName,
    url: siteUrl,
    potentialAction: {
      "@type": "SearchAction",
      target: `${siteUrl}/search?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };

  const faviconVersion = "PikFun-20260719-pwa";

  return (
    <>
     <Head>
        <title>{siteTitle}</title>
        <meta name="description" content={siteDescription} />
        <meta
          name="keywords"
          content={
            isEn
              ? "PikFun, Pickleball, Taiwan pickleball, courts, open play, coaching, gear"
              : "PikFun, 匹克方, 匹克球, Pickleball, 匹克球場, 匹克球拍, 匹克球教練, 揪團, 匹克球課程"
          }
        />
        <meta name="author" content={siteName} />

        {/* PikFun favicon — PNG 優先，避免舊 KESH ico 快取 */}
        <link rel="icon" type="image/png" sizes="32x32" href={`/icon-32.png?v=${faviconVersion}`} key="icon32" />
        <link rel="icon" type="image/png" sizes="192x192" href={`/icon.png?v=${faviconVersion}`} key="icon192" />
        <link rel="shortcut icon" href={`/favicon.ico?v=${faviconVersion}`} key="shortcut" />
        <link rel="apple-touch-icon" href={`/images/pikfun-logo-pwa.png?v=${faviconVersion}`} key="apple" />

        {/* PWA：可加入主畫面 + 推播 */}
        <link rel="manifest" href="/manifest.json" key="manifest" />
        <meta name="theme-color" content="#005caf" key="themecolor" />
        <meta name="mobile-web-app-capable" content="yes" key="mwac" />
        <meta name="apple-mobile-web-app-capable" content="yes" key="amwac" />
        <meta name="apple-mobile-web-app-title" content="PikFun" key="amwat" />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="default"
          key="amwasbs"
        />

        <link rel="canonical" href={siteUrl} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;700&family=Noto+Sans+TC:wght@300;400;500;700&family=Playfair+Display:wght@400;500;600&display=swap"
          rel="stylesheet"
        />

        {/* 加入了 key 的 OG Tags，確保商品頁能正確覆蓋 */}
        <meta property="og:locale" content={ogLocale} />
        <meta property="og:type" content="website" key="ogtype" />
        <meta property="og:title" content={siteTitle} key="ogtitle" />
        <meta property="og:description" content={siteDescription} key="ogdesc" />
        <meta property="og:url" content={siteUrl} key="ogurl" />
        <meta property="og:site_name" content={siteName} />
        <meta property="og:image" content={siteImage} key="ogimage" />
        <meta property="og:image:secure_url" content={siteImage} key="ogimagesecure" />

        <meta name="twitter:card" content="summary_large_image" key="twcard" />
        <meta name="twitter:title" content={siteTitle} key="twtitle" />
        <meta name="twitter:description" content={siteDescription} key="twdesc" />
        <meta name="twitter:image" content={siteImage} key="twimage" />

        {/* 渲染結構化資料 */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
      </Head>

      {!isStandalonePage && <Navbar />}
      <CartSidebar />
      <PwaSetupPrompt />

      <div className={isStandalonePage ? "" : "flex flex-col justify-between"}>
        <main>{children}</main>
        {!isStandalonePage && (
          <div>
            <Banner />
            <Footer />
          </div>
        )}
      </div>
    </>
  );
}
