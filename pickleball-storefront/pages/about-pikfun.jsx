import Head from "next/head";
import { getSiteUrl } from "@/lib/siteUrl";
import AboutPikfunPage from "@/components/about-pikfun/AboutPikfunPage";

export default function AboutPikfunRoute() {
  const siteUrl = getSiteUrl();
  const title = "PikFun 匹克方 | 關於我們 — 匹克球運動，讓心動起來";
  const description =
    "PikFun 匹克方是台灣匹克球整合平台，提供裝備商城、揪團打球、教練開課、球場地圖與學習資源，陪你從入門到熱愛。";

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta name="theme-color" content="#eed4d4" />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`${siteUrl}/about-pikfun`} />
        <meta property="og:image" content={`${siteUrl}/images/pik01.png`} />
        <link rel="canonical" href={`${siteUrl}/about-pikfun`} />
      </Head>
      <AboutPikfunPage />
    </>
  );
}
