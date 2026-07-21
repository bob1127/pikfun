import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { ArrowRight, Home, Newspaper, Users, GraduationCap } from "lucide-react";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";

const CONTENT = {
  "zh-TW": {
    title: "找不到這個頁面｜PikFun 匹克方",
    eyebrow: "PAGE NOT FOUND",
    heading: "這球，出界了！",
    description:
      "你尋找的頁面可能已被移動、刪除，或網址輸入有誤。別擔心，回到場內繼續探索吧。",
    home: "回到首頁",
    explore: "或從這裡繼續",
    links: [
      { label: "最新消息", description: "球界動態與社群文章", href: "/news", icon: Newspaper },
      { label: "揪團打球", description: "找到附近球友與活動", href: "/play", icon: Users },
      { label: "教練開課", description: "探索課程與專業教練", href: "/coaching", icon: GraduationCap },
    ],
  },
  en: {
    title: "Page Not Found | PikFun",
    eyebrow: "PAGE NOT FOUND",
    heading: "That shot was out!",
    description:
      "The page may have moved, been removed, or the address may be incorrect. No worries — step back onto the court and keep exploring.",
    home: "Back to Home",
    explore: "Or keep exploring",
    links: [
      { label: "Latest News", description: "Updates and community stories", href: "/news", icon: Newspaper },
      { label: "Open Play", description: "Find players and events nearby", href: "/play", icon: Users },
      { label: "Coaching", description: "Discover coaches and courses", href: "/coaching", icon: GraduationCap },
    ],
  },
};

export default function Custom404() {
  const router = useRouter();
  const T = CONTENT[router.locale === "en" ? "en" : "zh-TW"];

  return (
    <>
      <Head>
        <title>{T.title}</title>
        <meta name="robots" content="noindex,follow" />
      </Head>

      <main className="relative min-h-[760px] overflow-hidden bg-[#f5f8fb] pt-24 text-gray-900 md:pt-28">
        {/* Pickleball-court inspired background */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
          <div className="absolute -right-28 top-12 h-[520px] w-[520px] rounded-full border-[90px] border-white/70" />
          <div className="absolute -left-24 bottom-8 h-64 w-64 rounded-full border-[55px] border-[#005caf]/[0.04]" />
          <div className="absolute left-1/2 top-0 h-full w-px bg-[#005caf]/[0.05]" />
          <div className="absolute left-0 top-[44%] h-px w-full bg-[#005caf]/[0.05]" />
        </div>

        <div className="relative mx-auto flex max-w-[1100px] flex-col items-center px-5 pb-20 pt-14 text-center md:px-8 md:pt-20">
          <p className="mb-5 text-[11px] font-black tracking-[0.28em] text-[#005caf]">
            {T.eyebrow}
          </p>

          <div className="relative mb-7 select-none">
            <span className="text-[120px] font-black leading-none tracking-[-0.09em] text-[#005caf] sm:text-[170px] md:text-[210px]">
              4
            </span>
            <span className="relative mx-1 inline-flex h-[88px] w-[88px] translate-y-[-5px] items-center justify-center rounded-full bg-[#f4cf32] shadow-[inset_-10px_-12px_0_rgba(0,0,0,0.05)] sm:h-[126px] sm:w-[126px] md:h-[154px] md:w-[154px]">
              <span className="absolute inset-[22%] rounded-full border-2 border-dashed border-white/70" />
              <span className="h-2 w-2 rounded-full bg-white/80 md:h-3 md:w-3" />
            </span>
            <span className="text-[120px] font-black leading-none tracking-[-0.09em] text-[#005caf] sm:text-[170px] md:text-[210px]">
              4
            </span>
          </div>

          <h1 className="mb-4 text-2xl font-black tracking-wide md:text-4xl">
            {T.heading}
          </h1>
          <p className="max-w-xl text-sm leading-7 text-gray-600 md:text-base">
            {T.description}
          </p>

          <Link
            href="/"
            className="mt-8 inline-flex min-h-12 items-center gap-2 bg-[#005caf] px-7 text-sm font-bold text-white transition-colors hover:bg-[#004b91]"
          >
            <Home size={16} />
            {T.home}
            <ArrowRight size={15} />
          </Link>

          <div className="mt-16 w-full border-t border-gray-200 pt-9">
            <p className="mb-5 text-xs font-bold tracking-widest text-gray-400">
              {T.explore}
            </p>
            <div className="mx-auto grid max-w-3xl gap-3 text-left sm:grid-cols-3">
              {T.links.map(({ label, description, href, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className="group flex items-center gap-3 border border-gray-200 bg-white p-4 transition-all hover:-translate-y-0.5 hover:border-[#005caf]"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center bg-[#eef5fb] text-[#005caf]">
                    <Icon size={17} />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-xs font-black text-gray-800 group-hover:text-[#005caf]">
                      {label}
                    </span>
                    <span className="mt-1 block text-[10px] leading-4 text-gray-400">
                      {description}
                    </span>
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}

export async function getStaticProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale || "zh-TW", ["common"])),
    },
  };
}
