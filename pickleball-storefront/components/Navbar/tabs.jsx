"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/router";
import { motion, AnimatePresence } from "framer-motion";
import {
  Menu,
  User,
  ShoppingBag,
  Search,
  ChevronDown,
  ChevronRight,
  Loader2,
  X,
  Home,
  TrendingUp,
  Package,
  Users,
  GraduationCap,
  Newspaper,
  CircleArrowRight,
  Truck,
  Globe,
  ShieldCheck,
  MapPin,
  BookOpen,
  Store,
} from "lucide-react";

import { useCart } from "../../components/context/CartContext";
import { useUser } from "../../components/context/UserContext";
import GlobalSearchOverlay from "@/components/Navbar/GlobalSearchOverlay";

const COLORS = {
  blue: "#005caf",
  blueDark: "#1a3a8a",
  pink: "#ef4023",
  yellow: "#FFD43A",
  grayBtn: "#F2F4F7",
  loginDark: "#3d4450",
  menuBg: "#eef5fb",
};

/**
 * 導覽列雙語字典：直接依 router.locale 取字，
 * 不走 next-i18next namespace，避免個別頁面沒載入翻譯檔時顯示 key。
 */
const NAV_TEXT = {
  "zh-TW": {
    announcements: [
      "全場球拍九折活動開跑！",
      "免運優惠進行中｜滿 NT$3,000 即可享有",
      "優惠碼 PIKFUN2026 限時使用",
      "新會員首購再享額外折扣",
    ],
    tagline: "匹克球｜活動｜教練｜開課 | 各項運動",
    taglineMobile: "匹克球裝備・活動・教練平台",
    nav: {
      home: "首頁",
      categories: "匹克趨勢",
      brand: "相關產品",
      play: "揪團打球",
      coaching: "教練開課",
      news: "最新消息",
      admin: "審核管理",
      courts: "全台球場地圖",
      blog: "裝備攻略",
      shop: "商城",
    },
    tickerPrefix: { play: "揪團", class: "教練課", post: "投稿" },
    megaCategories: "產品類別",
    megaBrands: "精選品牌",
    searchPlaceholder: "輸入關鍵字…",
    searchPlaceholderMobile: "搜尋商品…",
    searchNoResult: "找不到相關結果",
    searchMinChars: "輸入至少 2 個字元開始搜尋",
    login: "登入",
    pickByStyle: "依打法挑選球拍",
    playTitle1: "想找人打球？",
    playTitle2: "馬上加入場次",
    playBtn: "揪團",
    shopTitle1: "熱銷球拍裝備",
    shopTitle2: "立即選購！",
    shopBtn: "商城",
  },
  en: {
    announcements: [
      "10% off all paddles — now on!",
      "Free shipping on orders over NT$3,000",
      "Limited-time promo code: PIKFUN2026",
      "Extra discount on your first order",
    ],
    tagline: "Paddles | Events | Coaching | Classes",
    taglineMobile: "Pickleball Gear · Events · Coaching",
    nav: {
      home: "Home",
      categories: "Trends",
      brand: "Products",
      play: "Open Play",
      coaching: "Coaching",
      news: "News",
      admin: "Review",
      courts: "Court Map",
      blog: "Gear Guide",
      shop: "Shop",
    },
    tickerPrefix: { play: "Open Play", class: "Class", post: "Post" },
    megaCategories: "Categories",
    megaBrands: "Featured Brands",
    searchPlaceholder: "Type a keyword…",
    searchPlaceholderMobile: "Search products…",
    searchNoResult: "No results found",
    searchMinChars: "Type at least 2 characters to search",
    login: "Log In",
    pickByStyle: "Pick a Paddle by Play Style",
    playTitle1: "Looking for a game?",
    playTitle2: "Join a session now",
    playBtn: "Open Play",
    shopTitle1: "Best-Selling Gear",
    shopTitle2: "Shop Now!",
    shopBtn: "Shop",
  },
};

/** 語系切換鈕（zh-TW ↔ en），沿用目前路徑切換 */
function LanguageSwitcher({ compact = false, onSwitched }) {
  const router = useRouter();
  const current = router.locale === "en" ? "en" : "zh-TW";

  const switchTo = (locale) => {
    if (locale === current) return;
    router.push(router.asPath, router.asPath, { locale, scroll: false });
    onSwitched?.();
  };

  return (
    <div
      className={`flex items-center gap-1 ${compact ? "" : "pl-1"}`}
      aria-label="切換語言 / Switch language"
    >
      <Globe
        size={compact ? 18 : 16}
        strokeWidth={1.5}
        className="text-gray-500 shrink-0"
      />
      <button
        type="button"
        onClick={() => switchTo("zh-TW")}
        className={`px-1.5 py-0.5 text-[12px] font-bold rounded transition-colors ${
          current === "zh-TW"
            ? "text-[#005caf]"
            : "text-gray-400 hover:text-gray-700"
        }`}
      >
        中
      </button>
      <span className="text-gray-300 text-[11px]">/</span>
      <button
        type="button"
        onClick={() => switchTo("en")}
        className={`px-1.5 py-0.5 text-[12px] font-bold rounded transition-colors ${
          current === "en"
            ? "text-[#005caf]"
            : "text-gray-400 hover:text-gray-700"
        }`}
      >
        EN
      </button>
    </div>
  );
}

const NAV_ICONS = {
  home: Home,
  categories: TrendingUp,
  brand: Package,
  play: Users,
  coaching: GraduationCap,
  news: Newspaper,
  admin: ShieldCheck,
  courts: MapPin,
  blog: BookOpen,
  shop: Store,
};

function MenuLogo() {
  return (
    <Link href="/" className="flex items-center gap-2.5">
      <div className="flex -space-x-1.5">
        <div
          className="w-5 h-5 rounded-full border-[2.5px]"
          style={{ borderColor: COLORS.blue }}
        />
        <div
          className="w-5 h-5 rounded-full border-[2.5px]"
          style={{ borderColor: COLORS.yellow }}
        />
      </div>
      <div className="leading-tight">
        <span
          className="text-lg font-black tracking-widest block"
          style={{ color: COLORS.blue }}
        >
          PikFun
        </span>
        <span className="text-[9px] text-gray-500 tracking-wide">
          匹克球裝備・活動・教練
        </span>
      </div>
    </Link>
  );
}

function PillArrowButton({
  href,
  onClick,
  label,
  variant = "solid",
  arrowClass = "",
  style,
  leading,
}) {
  const isOutline = variant === "outline";
  const inner = (
    <>
      <span className="flex items-center gap-3 min-w-0">
        {leading}
        <span className="text-sm font-bold tracking-wide">{label}</span>
      </span>
      <span
        className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${arrowClass}`}
      >
        <ChevronRight size={16} strokeWidth={2.5} />
      </span>
    </>
  );
  const className = `w-full flex items-center justify-between gap-3 px-5 py-3.5 rounded-full transition-opacity hover:opacity-90 ${
    isOutline ? "bg-white border-2" : "text-white"
  }`;

  const btnStyle = isOutline
    ? { borderColor: COLORS.blue, color: COLORS.blue, ...style }
    : style;

  if (href) {
    return (
      <Link
        href={href}
        onClick={onClick}
        className={className}
        style={btnStyle}
      >
        {inner}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={className}
      style={btnStyle}
    >
      {inner}
    </button>
  );
}

function MemberAvatar({ userInfo, size = 22, bordered = true }) {
  const ring = bordered ? " border border-gray-300 bg-gray-50" : "";
  if (userInfo?.avatar) {
    return (
      <img
        src={userInfo.avatar}
        alt=""
        className={`rounded-full object-cover shrink-0${ring}`}
        style={{ width: size, height: size }}
      />
    );
  }
  const initial = userInfo?.name?.charAt(0)?.toUpperCase() || "U";
  return (
    <span
      className={`rounded-full flex items-center justify-center font-bold text-gray-500 shrink-0${ring}`}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.42) }}
      aria-hidden
    >
      {initial}
    </span>
  );
}

function MemberNavGreeting({ userInfo, avatarSize = 32 }) {
  const displayName = userInfo?.name?.trim() || "會員";
  return (
    <span className="inline-flex items-center gap-2.5 max-w-[160px]">
      <MemberAvatar userInfo={userInfo} size={avatarSize} />
      <span className="text-[13px] font-semibold text-gray-800 truncate leading-tight">
        Hi，{displayName}
      </span>
    </span>
  );
}

export const SlideTabsExample = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [openMega, setOpenMega] = useState("none");
  const [openMobileNav, setOpenMobileNav] = useState(null);
  const [mounted, setMounted] = useState(false);

  const [showGlobalSearch, setShowGlobalSearch] = useState(false);

  const { totalQty, setIsCartOpen } = useCart();
  const { userInfo, loading: userLoading } = useUser();

  const [categoriesChildren, setCategoriesChildren] = useState([]);
  const [brandChildren, setBrandChildren] = useState([]);
  const [loadingCats, setLoadingCats] = useState(true);
  const [showAnnouncement, setShowAnnouncement] = useState(true);
  const [announceIndex, setAnnounceIndex] = useState(0);
  const [tickerItems, setTickerItems] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);

  const router = useRouter();
  const T = NAV_TEXT[router.locale === "en" ? "en" : "zh-TW"];
  // 有站內最新動態時優先輪播（揪團／教練課／投稿），否則退回靜態公告
  const announcements = tickerItems.length
    ? tickerItems.map((item) => ({
        text: `【${T.tickerPrefix[item.type] || ""}】${item.title}`,
        href: item.href,
      }))
    : T.announcements.map((text) => ({ text, href: null }));

  // 抓站內最新動態標題（揪團／教練課／投稿 前 5 則）
  useEffect(() => {
    if (!mounted) return;
    let alive = true;
    fetch("/api/site-ticker")
      .then((r) => (r.ok ? r.json() : { items: [] }))
      .then((d) => {
        if (alive) setTickerItems(d.items || []);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [mounted]);

  // 最高權限管理者：導覽列顯示「審核管理」
  useEffect(() => {
    if (!mounted || !userInfo?.email) {
      setIsAdmin(false);
      return;
    }
    let alive = true;
    fetch(`/api/admin/check?email=${encodeURIComponent(userInfo.email)}`)
      .then((r) => (r.ok ? r.json() : { isAdmin: false }))
      .then((d) => {
        if (alive) setIsAdmin(!!d.isAdmin);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [mounted, userInfo?.email]);

  useEffect(() => {
    if (!mounted || !showAnnouncement) return;
    const timer = setInterval(() => {
      setAnnounceIndex((i) => (i + 1) % announcements.length);
    }, 3500);
    return () => clearInterval(timer);
  }, [mounted, showAnnouncement, announcements.length]);

  useEffect(() => {
    if (!mounted) return;
    const desktopH = showAnnouncement ? 40 + 72 : 72;
    document.documentElement.style.setProperty(
      "--nav-offset-desktop",
      `${desktopH}px`,
    );
  }, [showAnnouncement, mounted]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    async function fetchMenuData() {
      try {
        setLoadingCats(true);
        const BACKEND_URL =
          process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000";
        const API_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY;
        const headers = { "Content-Type": "application/json" };
        if (API_KEY) headers["x-publishable-api-key"] = API_KEY;

        const [catsRes, colRes] = await Promise.all([
          fetch(
            `${BACKEND_URL}/store/product-categories?fields=id,name,handle,metadata&limit=100`,
            { headers },
          ).then((res) => res.json()),
          fetch(
            `${BACKEND_URL}/store/collections?fields=id,title,handle,metadata&limit=100`,
            { headers },
          ).then((res) => res.json()),
        ]);

        setCategoriesChildren(
          (catsRes.product_categories || []).map((cat) => ({
            id: cat.id,
            name: cat.name,
            slug: cat.handle,
            image: cat.metadata?.image_url || null,
          })),
        );

        setBrandChildren(
          (colRes.collections || []).map((col) => ({
            id: col.id,
            name: col.title,
            slug: col.handle,
            image: col.metadata?.image_url || null,
          })),
        );
      } catch (error) {
        console.error("Medusa 資料抓取失敗:", error);
      } finally {
        setLoadingCats(false);
      }
    }
    if (mounted) fetchMenuData();
  }, [mounted]);

  const navLinks = [
    { key: "home", label: T.nav.home, href: "/" },
    {
      key: "categories",
      label: T.nav.categories,
      href: "/category",
      hasMega: true,
    },
    { key: "brand", label: T.nav.brand, href: "/category", hasMega: true },
    {
      key: "play",
      label: T.nav.play,
      href: "/play",
      hasDropdown: true,
    },
    {
      key: "coaching",
      label: T.nav.coaching,
      href: "/coaching",
      hasDropdown: true,
    },
    { key: "news", label: T.nav.news, href: "/news" },
    ...(isAdmin
      ? [
          {
            key: "admin",
            label: T.nav.admin,
            href: "/admin/community-posts",
            isAdminLink: true,
          },
        ]
      : []),
  ];

  const coachingDropdownGroups =
    router.locale === "en"
      ? [
          {
            title: "COACH",
            links: [
              {
                label: "Find a Coach",
                desc: "Browse coach profiles and classes",
                href: "/coaching",
                Icon: GraduationCap,
              },
              {
                label: "Apply as a Coach",
                desc: "Create your profile and offer classes",
                href: "/coaching/apply",
                Icon: User,
              },
              {
                label: "Create a Class",
                desc: "Publish a new coaching class",
                href: "/coaching/create",
                Icon: CircleArrowRight,
              },
            ],
          },
          {
            title: "COURT & CONTENT",
            links: [
              {
                label: "Court Owner Application",
                desc: "Promote your court on PikFun",
                href: "/member/apply/court_owner",
                Icon: Store,
              },
              {
                label: "Court Map",
                desc: "Explore pickleball courts",
                href: "/courts",
                Icon: MapPin,
              },
              {
                label: "Submit an Article",
                desc: "Share events, tips and updates",
                href: "/member/posts/new",
                Icon: Newspaper,
              },
            ],
          },
        ]
      : [
          {
            title: "教練功能",
            links: [
              {
                label: "尋找教練與課程",
                desc: "查看教練介紹與目前開課",
                href: "/coaching",
                Icon: GraduationCap,
              },
              {
                label: "申請成為教練",
                desc: "建立教練頁、開課與招生",
                href: "/coaching/apply",
                Icon: User,
              },
              {
                label: "建立教練課程",
                desc: "發布新的匹克球課程",
                href: "/coaching/create",
                Icon: CircleArrowRight,
              },
            ],
          },
          {
            title: "球場主與內容",
            links: [
              {
                label: "球場主進駐申請",
                desc: "讓更多球友找到你的球場",
                href: "/member/apply/court_owner",
                Icon: Store,
              },
              {
                label: "全台球場地圖",
                desc: "查看與搜尋匹克球場地",
                href: "/courts",
                Icon: MapPin,
              },
              {
                label: "撰寫投稿文章",
                desc: "分享活動、知識與最新消息",
                href: "/member/posts/new",
                Icon: Newspaper,
              },
            ],
          },
        ];

  const playDropdownGroups =
    router.locale === "en"
      ? [
          {
            title: "OPEN PLAY",
            links: [
              {
                label: "Browse Sessions",
                desc: "Find an upcoming game near you",
                href: "/play#play-sessions-list",
              },
              {
                label: "Host a Session",
                desc: "Create a game and invite players",
                href: "/play/create",
              },
              {
                label: "Court Map",
                desc: "Explore pickleball courts",
                href: "/courts",
              },
            ],
          },
          {
            title: "COMMUNITY",
            links: [
              {
                label: "Meet the Hosts",
                desc: "Discover active community organizers",
                href: "/play",
              },
              {
                label: "Submit an Article",
                desc: "Share events and community updates",
                href: "/member/posts/new",
              },
              {
                label: "Court Owner Application",
                desc: "Promote your court on PikFun",
                href: "/member/apply/court_owner",
              },
            ],
          },
        ]
      : [
          {
            title: "揪團功能",
            links: [
              {
                label: "瀏覽揪團場次",
                desc: "尋找附近即將開始的球局",
                href: "/play#play-sessions-list",
              },
              {
                label: "發起揪團",
                desc: "建立場次並邀請球友參加",
                href: "/play/create",
              },
              {
                label: "查看全台球場",
                desc: "搜尋附近的匹克球場地",
                href: "/courts",
              },
            ],
          },
          {
            title: "主揪與社群",
            links: [
              {
                label: "認識熱門主揪",
                desc: "探索活躍的球局發起人",
                href: "/play",
              },
              {
                label: "撰寫活動文章",
                desc: "分享活動與球友最新消息",
                href: "/member/posts/new",
              },
              {
                label: "球場主進駐申請",
                desc: "讓更多球友找到你的球場",
                href: "/member/apply/court_owner",
              },
            ],
          },
        ];

  if (!mounted) return null;

  return (
    <>
      <header className="fixed top-0 left-0 w-full z-[1000] bg-white">
        {/* ── 電腦版：公告列 + 單列白底導覽（參考 SANNO SPORTS 版型） ── */}
        <div
          className="hidden lg:block"
          onMouseLeave={() => setOpenMega("none")}
        >
          {showAnnouncement && (
            <div style={{ backgroundColor: COLORS.blue }}>
              <div className="mx-auto max-w-[1400px] px-8 h-10 flex items-center justify-center relative">
                <button
                  type="button"
                  onClick={() => setShowAnnouncement(false)}
                  className="absolute left-6 top-1/2 -translate-y-1/2 p-1 text-white/80 hover:text-white transition-colors z-10"
                  aria-label="關閉公告"
                >
                  <X size={14} strokeWidth={1.5} />
                </button>
                <div className="flex items-center justify-center gap-2 px-10 w-full max-w-2xl">
                  <Truck
                    size={14}
                    strokeWidth={1.5}
                    className="shrink-0 text-white"
                  />
                  <div className="h-5 overflow-hidden relative flex-1">
                    <AnimatePresence mode="wait">
                      <motion.p
                        key={announceIndex}
                        initial={{ y: 14, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -14, opacity: 0 }}
                        transition={{ duration: 0.4, ease: "easeInOut" }}
                        className="text-[11px] leading-5 font-normal tracking-wide text-white text-center whitespace-nowrap"
                      >
                        {(() => {
                          const item =
                            announcements[announceIndex % announcements.length];
                          return item.href ? (
                            <Link
                              href={item.href}
                              className="hover:underline underline-offset-2"
                            >
                              {item.text}
                            </Link>
                          ) : (
                            item.text
                          );
                        })()}
                      </motion.p>
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="border-b border-gray-200 bg-white relative">
            <div className="mx-auto max-w-[1400px] px-8 h-[72px] flex items-center justify-between">
              {/* Logo */}
              <Link href="/" className="flex items-center gap-3 shrink-0">
                <img
                  src="/images/logo/pikfun-logo.png"
                  className="w-[42px] h-[42px] object-contain"
                  alt="PikFun"
                />
                <div className="leading-none">
                  <span className="block text-[10px] font-bold tracking-[0.14em] uppercase text-gray-900">
                    {T.tagline}
                  </span>
                  <span className="block text-[15px] font-bold tracking-[0.06em] uppercase text-gray-900 mt-1">
                    PikFun
                  </span>
                </div>
              </Link>

              {/* 選單 + 圖示 */}
              <div className="flex items-center">
                <nav className="flex items-center gap-8 mr-8">
                  {navLinks.map((link) => {
                    const isActive =
                      router.pathname === link.href ||
                      (link.href !== "/" &&
                        router.pathname.startsWith(link.href));
                    const dropdownGroups =
                      link.key === "play"
                        ? playDropdownGroups
                        : coachingDropdownGroups;

                    return (
                      <div
                        key={link.key}
                        className="relative"
                        onMouseEnter={() =>
                          setOpenMega(
                            link.hasMega || link.hasDropdown
                              ? link.key
                              : "none",
                          )
                        }
                      >
                        <Link
                          href={link.href}
                          className={
                            link.isAdminLink
                              ? "inline-flex items-center gap-1.5 text-[13px] font-bold tracking-[0.06em] whitespace-nowrap px-3 py-1.5 rounded-full text-white hover:opacity-90 transition-opacity"
                              : `inline-flex items-center gap-1 text-[13px] font-normal tracking-[0.06em] transition-colors whitespace-nowrap ${
                                  isActive
                                    ? "text-[#005caf]"
                                    : "text-gray-900 hover:text-[#005caf]"
                                }`
                          }
                          style={
                            link.isAdminLink
                              ? { backgroundColor: COLORS.blue }
                              : undefined
                          }
                        >
                          {link.isAdminLink && <ShieldCheck size={14} />}
                          {link.label}
                          {link.hasDropdown && (
                            <ChevronDown
                              size={13}
                              strokeWidth={2}
                              className={`transition-transform duration-200 ${
                                openMega === link.key ? "rotate-180" : ""
                              }`}
                            />
                          )}
                        </Link>

                        <AnimatePresence>
                          {link.hasDropdown && openMega === link.key && (
                            <motion.div
                              initial={{ opacity: 0, y: 8 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: 8 }}
                              transition={{ duration: 0.18 }}
                              className="absolute top-full z-50 mt-5 w-[520px] border border-gray-200 bg-white p-5"
                              style={{ left: "-190px" }}
                            >
                              <div className="grid grid-cols-2 gap-5">
                                {dropdownGroups.map((group) => (
                                  <div key={group.title}>
                                    <p className="mb-3 border-b border-gray-100 pb-2 text-[10px] font-black tracking-[0.18em] text-gray-400">
                                      {group.title}
                                    </p>
                                    <div className="space-y-1">
                                      {group.links.map((item) => {
                                        return (
                                          <Link
                                            key={item.href}
                                            href={item.href}
                                            onClick={() =>
                                              setOpenMega("none")
                                            }
                                            className="group flex items-start gap-3 p-3 transition-colors duration-200 hover:bg-[#f3f7fc]"
                                          >
                                            <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rotate-45 bg-[#005caf] transition-transform duration-200 group-hover:scale-125" />
                                            <span className="min-w-0">
                                              <span className="block text-xs font-black text-gray-900 group-hover:text-[#005caf]">
                                                {item.label}
                                              </span>
                                              <span className="mt-1 block text-[10px] leading-relaxed text-gray-400">
                                                {item.desc}
                                              </span>
                                            </span>
                                          </Link>
                                        );
                                      })}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </nav>

                <div
                  className="flex items-center gap-5 pl-8 border-l border-gray-200"
                  onMouseEnter={() => setOpenMega("none")}
                >
                  {!userLoading && (
                    <Link
                      href={userInfo ? "/member" : "/login"}
                      className="inline-flex items-center text-gray-900 hover:text-[#005caf] transition-colors"
                      aria-label={userInfo ? "會員中心" : "登入"}
                    >
                      {userInfo ? (
                        <MemberNavGreeting
                          userInfo={userInfo}
                          avatarSize={32}
                        />
                      ) : (
                        <User size={20} strokeWidth={1.5} />
                      )}
                    </Link>
                  )}

                  <button
                    type="button"
                    onClick={() => setShowGlobalSearch(true)}
                    className="p-1 text-gray-900 hover:text-[#005caf] transition-colors"
                    aria-label="全站搜尋"
                  >
                    <Search size={20} strokeWidth={1.5} />
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsCartOpen(true)}
                    className="relative p-1 text-gray-900 hover:text-[#005caf] transition-colors"
                    aria-label="購物車"
                  >
                    <ShoppingBag size={20} strokeWidth={1.5} />
                    {totalQty > 0 && (
                      <span
                        className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full text-[9px] font-bold text-white flex items-center justify-center"
                        style={{ backgroundColor: COLORS.pink }}
                      >
                        {totalQty > 99 ? "99+" : totalQty}
                      </span>
                    )}
                  </button>

                  <LanguageSwitcher />
                </div>
              </div>
            </div>

            {/* Mega Menu */}
            <AnimatePresence>
              {(openMega === "categories" || openMega === "brand") && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="absolute top-full left-0 w-full bg-white border border-gray-200 overflow-hidden z-40"
                >
                  <div className="px-8 py-8 max-w-[1200px] mx-auto">
                    {loadingCats ? (
                      <div className="flex justify-center py-10">
                        <Loader2 className="animate-spin text-gray-300" />
                      </div>
                    ) : (
                      <>
                        {openMega === "categories" && (
                          <>
                            <div className="text-xs font-bold text-gray-400 mb-6 uppercase tracking-widest border-b pb-2">
                              {T.megaCategories}
                            </div>
                            <ul className="flex flex-wrap gap-8">
                              {categoriesChildren.map((cat) => (
                                <li key={cat.id} className="group">
                                  <Link
                                    href={`/category/${cat.slug}`}
                                    className="flex flex-col items-center gap-3"
                                  >
                                    <div className="w-[80px] h-[80px] rounded-full bg-gray-50 border border-gray-100 overflow-hidden relative group-hover:border-[#005caf] transition-colors">
                                      {cat.image && (
                                        <Image
                                          src={cat.image}
                                          alt={cat.name}
                                          fill
                                          className="object-cover"
                                          unoptimized
                                        />
                                      )}
                                    </div>
                                    <span className="text-sm font-bold text-gray-700 group-hover:text-[#005caf]">
                                      {cat.name}
                                    </span>
                                  </Link>
                                </li>
                              ))}
                            </ul>
                          </>
                        )}
                        {openMega === "brand" && (
                          <>
                            <div className="text-xs font-bold text-gray-400 mb-6 uppercase tracking-widest border-b pb-2">
                              {T.megaBrands}
                            </div>
                            <ul className="flex flex-wrap gap-8">
                              {brandChildren.map((brand) => (
                                <li key={brand.id} className="group">
                                  <Link
                                    href={`/category/${brand.slug}`}
                                    className="flex flex-col items-center gap-3"
                                  >
                                    <div className="w-[80px] h-[80px] rounded-full bg-gray-50 border border-gray-100 overflow-hidden relative group-hover:border-[#005caf] transition-colors">
                                      {brand.image && (
                                        <Image
                                          src={brand.image}
                                          alt={brand.name}
                                          fill
                                          className="object-cover"
                                          unoptimized
                                        />
                                      )}
                                    </div>
                                    <span className="text-sm font-bold text-gray-700 group-hover:text-[#005caf]">
                                      {brand.name}
                                    </span>
                                  </Link>
                                </li>
                              ))}
                            </ul>
                          </>
                        )}
                      </>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* ── 手機版：維持原設計 ── */}
        <div
          className="lg:hidden border-b border-gray-100"
          onMouseLeave={() => setOpenMega("none")}
        >
          <div className="mx-auto max-w-[1400px] px-4 md:px-6 h-14 flex items-center justify-between gap-4">
            <Link href="/" className="flex items-center gap-3 shrink-0">
              <div className="flex -space-x-2">
                <img
                  src="/images/logo/pikfun-logo.png"
                  className="max-w-[45px]"
                  alt=""
                />
              </div>
              <div className="leading-tight">
                <span className="text-lg font-black tracking-widest text-gray-900 block">
                  PikFun
                </span>
                <span className="hidden sm:block text-[10px] text-gray-500 tracking-wide">
                  {T.taglineMobile}
                </span>
              </div>
            </Link>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setShowGlobalSearch(true)}
                className="p-2 rounded-full text-gray-600 hover:bg-gray-100"
                aria-label="全站搜尋"
              >
                <Search size={20} />
              </button>
              <button
                type="button"
                onClick={() => setIsCartOpen(true)}
                className="relative p-2 rounded-full text-gray-600 hover:bg-gray-100"
                aria-label="購物車"
              >
                <ShoppingBag size={20} />
                {totalQty > 0 && (
                  <span
                    className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full text-[9px] font-bold text-white flex items-center justify-center"
                    style={{ backgroundColor: COLORS.pink }}
                  >
                    {totalQty > 99 ? "99+" : totalQty}
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  setOpenMobileNav(
                    router.pathname.startsWith("/play")
                      ? "play"
                      : router.pathname.startsWith("/coaching")
                        ? "coaching"
                        : null,
                  );
                  setIsMenuOpen(true);
                }}
                className="p-2 rounded-full text-gray-600 hover:bg-gray-100"
                aria-label="開啟選單"
              >
                <Menu size={22} strokeWidth={2.5} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* 固定導覽列佔位 */}
      <div className="h-14 lg:h-[var(--nav-offset-desktop)]" aria-hidden />

      <GlobalSearchOverlay
        open={showGlobalSearch}
        onClose={() => setShowGlobalSearch(false)}
      />

      {/* 全螢幕手機選單（THEO 風格 + fade） */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.28, ease: "easeInOut" }}
            className="fixed inset-0 z-[2000] lg:hidden flex flex-col overflow-hidden"
            style={{ backgroundColor: COLORS.menuBg }}
          >
            {/* Header：Logo + 關閉 */}
            <div className="shrink-0 px-5 pt-4 pb-3 flex items-start justify-between bg-white/60 backdrop-blur-sm border-b border-white/80">
              <div onClick={() => setIsMenuOpen(false)}>
                <MenuLogo />
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsMenuOpen(false);
                  setOpenMobileNav(null);
                }}
                className="flex flex-col items-center gap-0.5 pt-1"
                aria-label="關閉選單"
              >
                <X size={28} strokeWidth={2} style={{ color: COLORS.blue }} />
                <span
                  className="text-[10px] font-bold tracking-[0.2em]"
                  style={{ color: COLORS.blue }}
                >
                  MENU
                </span>
              </button>
            </div>

            {/* 主選單捲動區 */}
            <div className="flex-1 overflow-y-auto px-5 py-6 pb-44">
              <nav className="block space-y-5" aria-label="主要導覽">
                {navLinks.map((link) => {
                  const isActive =
                    router.pathname === link.href ||
                    (link.href !== "/" &&
                      router.pathname.startsWith(link.href));
                  const dropdownGroups =
                    link.key === "play"
                      ? playDropdownGroups
                      : coachingDropdownGroups;
                  const isMobileDropdownOpen =
                    openMobileNav === link.key;

                  if (!link.hasDropdown) {
                    return (
                      <Link
                        key={link.key}
                        href={link.href}
                        onClick={() => {
                          setIsMenuOpen(false);
                          setOpenMobileNav(null);
                        }}
                        className={`block text-base text-gray-900 ${
                          isActive ? "underline underline-offset-4" : ""
                        }`}
                      >
                        {link.label}
                      </Link>
                    );
                  }

                  return (
                    <div key={link.key}>
                      <button
                        type="button"
                        onClick={() =>
                          setOpenMobileNav((current) =>
                            current === link.key ? null : link.key,
                          )
                        }
                        className={`flex w-full items-center justify-between text-left text-base text-gray-900 ${
                          isActive ? "text-[#005caf]" : ""
                        }`}
                        aria-expanded={isMobileDropdownOpen}
                        aria-controls={`mobile-${link.key}-dropdown`}
                      >
                        <span>{link.label}</span>
                        <span className="flex h-7 w-7 items-center justify-center border border-[#005caf]/20 text-[#005caf]">
                          <ChevronDown
                            size={14}
                            strokeWidth={2}
                            className={`transition-transform duration-200 ${
                              isMobileDropdownOpen ? "rotate-180" : ""
                            }`}
                          />
                        </span>
                      </button>

                      <AnimatePresence initial={false}>
                        {isMobileDropdownOpen && (
                          <motion.div
                            id={`mobile-${link.key}-dropdown`}
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.22, ease: "easeInOut" }}
                            className="overflow-hidden"
                          >
                            <div className="mt-4 grid gap-5 border-l border-[#005caf]/20 pl-4 sm:grid-cols-2">
                              {dropdownGroups.map((group) => (
                                <div key={group.title}>
                                  <p className="mb-2 text-[9px] font-black tracking-[0.18em] text-gray-400">
                                    {group.title}
                                  </p>
                                  <div className="space-y-0.5">
                                    {group.links.map((item) => (
                                      <Link
                                        key={item.href}
                                        href={item.href}
                                        onClick={() => {
                                          setIsMenuOpen(false);
                                          setOpenMobileNav(null);
                                        }}
                                        className="group flex items-start gap-3 py-2.5"
                                      >
                                        <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rotate-45 bg-[#005caf] transition-transform duration-200 group-active:scale-125" />
                                        <span className="min-w-0">
                                          <span className="block text-xs font-black text-gray-900">
                                            {item.label}
                                          </span>
                                          <span className="mt-0.5 block text-[10px] leading-relaxed text-gray-500">
                                            {item.desc}
                                          </span>
                                        </span>
                                      </Link>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </nav>

              {/* 登入主按鈕 */}
              <div className="mt-10 space-y-5">
                {!userLoading && (
                  <Link
                    href={userInfo ? "/member" : "/login"}
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center gap-3 text-lg font-bold tracking-wide"
                    style={{ color: COLORS.blue }}
                  >
                    {userInfo ? (
                      <MemberNavGreeting userInfo={userInfo} avatarSize={36} />
                    ) : (
                      <>
                        <User size={22} style={{ color: COLORS.blue }} />
                        {T.login}
                      </>
                    )}
                  </Link>
                )}

                <LanguageSwitcher
                  compact
                  onSwitched={() => setIsMenuOpen(false)}
                />

                <Link
                  href="/category"
                  onClick={() => setIsMenuOpen(false)}
                  className="inline-flex items-center gap-2 text-sm font-bold"
                  style={{ color: COLORS.blue }}
                >
                  <span
                    className="w-6 h-6 rounded-full flex items-center justify-center text-white"
                    style={{ backgroundColor: COLORS.blue }}
                  >
                    <CircleArrowRight size={14} />
                  </span>
                  {T.pickByStyle}
                </Link>
              </div>
            </div>

            {/* 底部固定 CTA 區 */}
            <div className="shrink-0 absolute bottom-0 left-0 right-0 px-3 pb-4 pt-2">
              <div className="bg-white rounded-2xl shadow-[0_-4px_24px_rgba(0,0,0,0.08)] overflow-hidden">
                <div className="grid grid-cols-2 divide-x divide-gray-200">
                  {/* 左：揪團 */}
                  <div className="p-4 flex flex-col gap-3">
                    <p className="text-xs font-bold text-gray-800 leading-snug">
                      {T.playTitle1}
                      <br />
                      {T.playTitle2}
                    </p>
                    <PillArrowButton
                      href="/play"
                      onClick={() => setIsMenuOpen(false)}
                      label={T.playBtn}
                      variant="outline"
                      arrowClass="bg-[#eef5fb] text-[#005caf]"
                    />
                  </div>

                  {/* 右：商城 */}
                  <div className="p-4 flex flex-col gap-3">
                    <p className="text-xs font-bold text-gray-800 leading-snug">
                      {T.shopTitle1}
                      <br />
                      <span
                        className="inline-block mt-0.5 px-1"
                        style={{
                          background: `linear-gradient(transparent 60%, ${COLORS.yellow} 60%)`,
                        }}
                      >
                        {T.shopTitle2}
                      </span>
                    </p>
                    <Link
                      href="/products"
                      onClick={() => setIsMenuOpen(false)}
                      className="w-full flex items-center justify-between gap-2 px-5 py-3.5 rounded-full text-white text-sm font-bold hover:opacity-90 transition-opacity"
                      style={{ backgroundColor: COLORS.blue }}
                    >
                      <span>{T.shopBtn}</span>
                      <span className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                        <ChevronRight size={16} strokeWidth={2.5} />
                      </span>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default SlideTabsExample;
