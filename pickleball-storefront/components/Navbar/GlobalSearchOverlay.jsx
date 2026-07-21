"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowUpRight,
  CalendarDays,
  GraduationCap,
  Loader2,
  MapPin,
  Newspaper,
  Package,
  Search,
  UserRound,
  Users,
  X,
} from "lucide-react";
import { useRouter } from "next/router";

const COPY = {
  "zh-TW": {
    title: "搜尋整個 PikFun",
    subtitle: "商品、人物、球場、揪團、課程與文章，一次找到",
    placeholder: "輸入商品、教練、地區、活動或文章關鍵字…",
    min: "輸入至少 2 個字開始搜尋",
    empty: "找不到相關結果，試試地區、姓名或活動名稱",
    close: "關閉搜尋",
    results: "筆結果",
    reasonPrefix: "搜尋依據",
    categories: {
      all: "全部",
      product: "商品",
      people: "人物",
      activity: "活動與課程",
      court: "球場",
      news: "文章",
    },
    suggestionsTitle: "熱門搜尋",
    suggestions: ["台北新手", "台中匹克球", "週末揪團", "匹克球教練", "球拍"],
  },
  en: {
    title: "Search all of PikFun",
    subtitle: "Products, people, courts, sessions, classes and articles",
    placeholder: "Search products, coaches, places, events or articles…",
    min: "Type at least 2 characters to search",
    empty: "No matching results. Try a place, name, or event.",
    close: "Close search",
    results: "results",
    reasonPrefix: "Matched by",
    categories: {
      all: "All",
      product: "Products",
      people: "People",
      activity: "Sessions & Classes",
      court: "Courts",
      news: "Articles",
    },
    suggestionsTitle: "Popular searches",
    suggestions: ["Taipei beginner", "Taichung", "Weekend play", "Coach", "Paddle"],
  },
};

const CATEGORY_TYPES = {
  all: null,
  product: new Set(["product"]),
  people: new Set(["coach", "organizer", "court_owner", "individual"]),
  activity: new Set(["play_session", "coaching_class"]),
  court: new Set(["court"]),
  news: new Set(["news"]),
};

const TYPE_ICONS = {
  product: Package,
  coach: GraduationCap,
  organizer: Users,
  court_owner: UserRound,
  individual: UserRound,
  play_session: CalendarDays,
  coaching_class: GraduationCap,
  court: MapPin,
  news: Newspaper,
};

function SearchResultCard({ item, onSelect, reasonPrefix }) {
  const Icon = TYPE_ICONS[item.type] || Search;
  return (
    <Link
      href={item.url}
      onClick={onSelect}
      className="group grid min-h-[108px] grid-cols-[76px_1fr_auto] items-center gap-4 border-b border-gray-100 py-4 transition-colors hover:bg-[#f7f9fc] md:min-h-[124px] md:grid-cols-[92px_1fr_auto] md:px-3"
    >
      <div className="relative h-[76px] w-[76px] overflow-hidden rounded-lg bg-gray-100 md:h-[92px] md:w-[92px]">
        <Image
          src={item.image || "/images/placeholder.jpg"}
          alt=""
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          unoptimized
        />
      </div>
      <div className="min-w-0">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#edf3fb] px-2.5 py-1 text-[10px] font-bold text-[#005caf]">
            <Icon size={11} />
            {item.badge}
          </span>
          {item.subtitle && (
            <span className="truncate text-[11px] text-gray-400">
              {item.subtitle}
            </span>
          )}
        </div>
        <h3 className="line-clamp-1 text-sm font-black text-gray-900 md:text-base">
          {item.title}
        </h3>
        {item.excerpt && (
          <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-gray-500">
            {item.excerpt}
          </p>
        )}
        {item.match_reason && (
          <p className="mt-1.5 line-clamp-1 text-[10px] font-bold text-[#d83939]">
            {reasonPrefix}：{item.match_reason}
          </p>
        )}
      </div>
      <ArrowUpRight
        size={18}
        className="mr-1 text-gray-300 transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-[#005caf]"
      />
    </Link>
  );
}

export default function GlobalSearchOverlay({ open, onClose }) {
  const router = useRouter();
  const locale = router.locale === "en" ? "en" : "zh-TW";
  const text = COPY[locale];
  const inputRef = useRef(null);
  const requestRef = useRef(0);
  const [query, setQuery] = useState("");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [category, setCategory] = useState("all");
  const [partial, setPartial] = useState(false);

  useEffect(() => {
    if (!open) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const timer = window.setTimeout(() => inputRef.current?.focus(), 120);
    const closeOnEscape = (event) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      window.clearTimeout(timer);
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [open, onClose]);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setItems([]);
      setLoading(false);
      setPartial(false);
      return undefined;
    }

    const requestId = requestRef.current + 1;
    requestRef.current = requestId;
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `/api/search?q=${encodeURIComponent(trimmed)}&locale=${locale}&limit=6`,
          { signal: controller.signal },
        );
        const payload = await response.json();
        if (requestRef.current !== requestId) return;
        setItems(response.ok ? payload.items || [] : []);
        setPartial(!!payload.partial);
      } catch (error) {
        if (error.name !== "AbortError" && requestRef.current === requestId) {
          setItems([]);
          setPartial(true);
        }
      } finally {
        if (requestRef.current === requestId) setLoading(false);
      }
    }, 320);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query, locale]);

  useEffect(() => {
    setCategory("all");
  }, [query]);

  const filteredItems = useMemo(() => {
    const allowed = CATEGORY_TYPES[category];
    return allowed ? items.filter((item) => allowed.has(item.type)) : items;
  }, [category, items]);

  const categoryCount = (key) => {
    const allowed = CATEGORY_TYPES[key];
    return allowed ? items.filter((item) => allowed.has(item.type)).length : items.length;
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[5000] flex flex-col bg-white"
          role="dialog"
          aria-modal="true"
          aria-label={text.title}
        >
          <div className="shrink-0 border-b border-gray-100 bg-white">
            <div className="mx-auto flex h-16 max-w-[1500px] items-center justify-between px-5 md:h-20 md:px-10">
              <Link
                href="/"
                onClick={onClose}
                className="text-base font-black tracking-[0.18em] text-[#005caf] md:text-xl"
              >
                PIKFUN
              </Link>
              <button
                type="button"
                onClick={onClose}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 text-gray-700 transition-colors hover:border-gray-900 hover:bg-gray-50"
                aria-label={text.close}
              >
                <X size={20} />
              </button>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">
            <div className="mx-auto max-w-[1380px] px-5 pb-20 pt-8 md:px-10 md:pt-14">
              <div className="mx-auto max-w-[1000px] text-center">
                <h2 className="text-2xl font-black tracking-tight text-gray-950 md:text-4xl">
                  {text.title}
                </h2>
                <p className="mt-3 text-sm text-gray-500">{text.subtitle}</p>

                <div className="mt-7 flex items-center gap-3 border-b-2 border-gray-900 px-1 pb-3 md:mt-10 md:gap-5 md:pb-4">
                  {loading ? (
                    <Loader2
                      size={24}
                      className="shrink-0 animate-spin text-[#005caf]"
                    />
                  ) : (
                    <Search size={24} className="shrink-0 text-gray-700" />
                  )}
                  <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder={text.placeholder}
                    className="min-w-0 flex-1 appearance-none border-0 bg-transparent text-base font-medium text-gray-900 outline-none ring-0 placeholder:font-normal placeholder:text-gray-400 focus:border-0 focus:outline-none focus:ring-0 focus-visible:outline-none md:text-2xl"
                  />
                  {query && (
                    <button
                      type="button"
                      onClick={() => setQuery("")}
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-900"
                      aria-label="清除搜尋文字"
                    >
                      <X size={16} strokeWidth={1.5} />
                    </button>
                  )}
                </div>
              </div>

              {query.trim().length < 2 ? (
                <div className="mx-auto mt-12 max-w-[1000px] text-center">
                  <p className="text-sm text-gray-400">{text.min}</p>
                  <p className="mt-10 text-xs font-bold tracking-[0.2em] text-gray-900">
                    {text.suggestionsTitle}
                  </p>
                  <div className="mt-4 flex flex-wrap justify-center gap-2">
                    {text.suggestions.map((suggestion) => (
                      <button
                        key={suggestion}
                        type="button"
                        onClick={() => setQuery(suggestion)}
                        className="rounded-full border border-gray-200 px-4 py-2 text-xs font-bold text-gray-600 transition-colors hover:border-[#005caf] hover:text-[#005caf]"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <>
                  <div className="mt-10 flex gap-2 overflow-x-auto pb-2 md:mt-14 md:justify-center">
                    {Object.entries(text.categories).map(([key, label]) => {
                      const active = category === key;
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setCategory(key)}
                          className={`shrink-0 rounded-full border px-4 py-2.5 text-xs font-bold transition-colors ${
                            active
                              ? "border-[#005caf] bg-[#005caf] text-white"
                              : "border-gray-200 bg-white text-gray-600 hover:border-[#005caf] hover:text-[#005caf]"
                          }`}
                        >
                          {label}
                          <span className="ml-2 opacity-70">
                            {categoryCount(key)}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  <div className="mx-auto mt-6 max-w-[1100px]">
                    <div className="mb-2 flex items-center justify-between">
                      <p className="text-xs font-bold tracking-widest text-gray-500">
                        “{query.trim()}”
                      </p>
                      <p className="text-xs text-gray-400">
                        {filteredItems.length} {text.results}
                        {partial ? " · Partial" : ""}
                      </p>
                    </div>

                    {!loading && filteredItems.length === 0 ? (
                      <div className="py-20 text-center text-sm text-gray-400">
                        {text.empty}
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-x-10 md:grid-cols-2">
                        {filteredItems.map((item) => (
                          <SearchResultCard
                            key={item.id}
                            item={item}
                            onSelect={onClose}
                            reasonPrefix={text.reasonPrefix}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
