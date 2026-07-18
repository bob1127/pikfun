import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useTranslation } from "next-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, X, Landmark } from "lucide-react";

const BLUE = "#3157B5";
const BLUE_SOFT = "#EDF3FC";

const toList = (v) =>
  Array.isArray(v)
    ? v.filter(Boolean)
    : typeof v === "string" && v.trim()
      ? v
          .split(/[,、，]/)
          .map((s) => s.trim())
          .filter(Boolean)
      : [];

function normalizeCoach(c, t) {
  return {
    key: `coach-${c.slug}`,
    name: c.name,
    role: c.title || t("people.roles.coach"),
    photo: c.avatar || c.cover_image || "",
    catch: c.excerpt || c.featured_label || "",
    href: `/coaching/coach/${c.slug}`,
    fields: [
      { label: t("people.fields.credentials"), list: toList(c.credentials) },
      { label: t("people.fields.bio"), text: c.bio },
      { label: t("people.fields.specialties"), list: toList(c.specialties) },
      { label: t("people.fields.tags"), chips: toList(c.tags) },
      { label: t("people.fields.city"), text: c.city },
    ],
  };
}

function normalizeHost(p, t) {
  return {
    key: `host-${p.slug}`,
    name: p.display_name,
    role: p.title || t("people.roles.host"),
    photo: p.avatar || p.cover_image || "",
    catch: p.excerpt || "",
    href: `/play/host/${p.slug}`,
    fields: [
      { label: t("people.fields.bio"), text: p.bio },
      { label: t("people.fields.story"), text: p.story },
      { label: t("people.fields.highlights"), list: toList(p.specialties) },
      { label: t("people.fields.tags"), chips: toList(p.tags) },
      { label: t("people.fields.city"), text: p.city },
    ],
  };
}

function PersonPhoto({ person, className }) {
  if (person.photo) {
    return (
      <img
        src={person.photo}
        alt={person.name}
        className={`${className} object-cover object-top`}
        loading="lazy"
      />
    );
  }
  return (
    <div
      className={`${className} flex items-center justify-center`}
      style={{ background: BLUE_SOFT }}
    >
      <span className="text-4xl font-black" style={{ color: BLUE }}>
        {(person.name || "?").slice(0, 1)}
      </span>
    </div>
  );
}

export function PersonPhotoCarousel({ photos, name, fallback }) {
  const [idx, setIdx] = useState(0);
  const [broken, setBroken] = useState(() => new Set());

  const usable = photos.filter((src) => !broken.has(src));

  useEffect(() => {
    setIdx(0);
  }, [photos]);

  useEffect(() => {
    if (usable.length <= 1) return;
    const timer = setInterval(() => {
      setIdx((i) => (i + 1) % usable.length);
    }, 3500);
    return () => clearInterval(timer);
  }, [usable.length]);

  if (usable.length === 0) return fallback;

  const activeIdx = idx % usable.length;

  return (
    <div className="relative w-full h-full overflow-hidden">
      {usable.map((src, i) => (
        <img
          key={src}
          src={src}
          alt={name}
          loading={i === 0 ? "eager" : "lazy"}
          onError={() =>
            setBroken((prev) => {
              const next = new Set(prev);
              next.add(src);
              return next;
            })
          }
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${
            i === activeIdx ? "opacity-100" : "opacity-0"
          }`}
        />
      ))}
      {usable.length > 1 && (
        <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 flex gap-1.5">
          {usable.map((src, i) => (
            <span
              key={src}
              className={`w-1.5 h-1.5 rounded-full transition-colors ${
                i === activeIdx ? "bg-white" : "bg-white/45"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function PersonModal({ people, index, onClose, onNavigate, t }) {
  const person = people[index];

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") onNavigate(-1);
      if (e.key === "ArrowRight") onNavigate(1);
    };
    window.addEventListener("keydown", onKey);

    // 鎖定背景版面：以 position: fixed 固定 body，關閉時還原捲動位置
    const scrollY = window.scrollY;
    const { style } = document.body;
    const prev = {
      position: style.position,
      top: style.top,
      left: style.left,
      right: style.right,
      overflow: style.overflow,
      width: style.width,
    };
    style.position = "fixed";
    style.top = `-${scrollY}px`;
    style.left = "0";
    style.right = "0";
    style.width = "100%";
    style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", onKey);
      style.position = prev.position;
      style.top = prev.top;
      style.left = prev.left;
      style.right = prev.right;
      style.width = prev.width;
      style.overflow = prev.overflow;
      window.scrollTo(0, scrollY);
    };
  }, [onClose, onNavigate]);

  if (!person || typeof document === "undefined") return null;

  const visibleFields = person.fields.filter(
    (f) =>
      (f.text && f.text.trim()) ||
      (f.list && f.list.length > 0) ||
      (f.chips && f.chips.length > 0),
  );

  return createPortal(
    <motion.div
      className="fixed inset-0 flex items-center justify-center px-4 py-8"
      style={{ zIndex: 999999999 }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        aria-hidden
      />

      {/* 上一位 / 下一位 */}
      {people.length > 1 && (
        <>
          <button
            type="button"
            aria-label={t("people.prev_aria")}
            onClick={() => onNavigate(-1)}
            className="absolute left-2 md:left-[calc(50%-374px)] top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full flex items-center justify-center text-white shadow-md transition-transform hover:scale-110"
            style={{ background: BLUE }}
          >
            <ChevronLeft size={18} />
          </button>
          <button
            type="button"
            aria-label={t("people.next_aria")}
            onClick={() => onNavigate(1)}
            className="absolute right-2 md:right-[calc(50%-374px)] top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full flex items-center justify-center text-white shadow-md transition-transform hover:scale-110"
            style={{ background: BLUE }}
          >
            <ChevronRight size={18} />
          </button>
        </>
      )}

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 24 }}
        transition={{ duration: 0.25 }}
        data-lenis-prevent
        className="relative z-10 w-full max-w-[660px] max-h-[88vh] overflow-y-auto bg-white shadow-2xl rounded-tl-[60px] rounded-br-[60px] rounded-tr-none rounded-bl-none"
      >
        <button
          type="button"
          aria-label={t("people.close_aria")}
          onClick={onClose}
          className="absolute top-2.5 right-2.5 z-20 w-7 h-7 rounded-full flex items-center justify-center text-white"
          style={{ background: BLUE }}
        >
          <X size={14} />
        </button>

        {/* 上方形象區塊 */}
        {person.heroImageFull ? (
          // 滿版圖片（球場用）
          <div
            className="relative w-full h-[280px] md:h-[340px]"
            style={{ background: BLUE_SOFT }}
          >
            {person.photos?.length > 0 ? (
              <PersonPhotoCarousel
                photos={person.photos}
                name={person.name}
                fallback={
                  <PersonPhoto person={person} className="w-full h-full" />
                }
              />
            ) : (
              <PersonPhoto person={person} className="w-full h-full" />
            )}
            <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/70 via-black/20 to-transparent pointer-events-none" />
            <div className="absolute inset-x-0 bottom-0 p-6 md:p-8 pointer-events-none">
              <p className="text-2xl md:text-[32px] font-black leading-tight text-white break-words drop-shadow">
                {person.name}
              </p>
            </div>
          </div>
        ) : (
          // 左文右圖（教練／揪團主用）
          <div
            className="flex items-stretch min-h-[300px] md:min-h-[340px]"
            style={{ background: BLUE_SOFT }}
          >
            <div className="flex-1 min-w-0 flex flex-col justify-between p-7 md:p-9">
              <p
                className="text-[13px] md:text-sm font-bold leading-[2] whitespace-pre-line"
                style={{ color: BLUE }}
              >
                {person.catch || person.role}
              </p>
              <p
                className="mt-8 text-[34px] md:text-[42px] font-black leading-[1.15] break-words"
                style={{ color: BLUE }}
              >
                {person.name}
              </p>
            </div>
            <div className="w-[45%] shrink-0 self-stretch">
              {person.photos?.length > 0 ? (
                <PersonPhotoCarousel
                  photos={person.photos}
                  name={person.name}
                  fallback={
                    <PersonPhoto person={person} className="w-full h-full" />
                  }
                />
              ) : (
                <PersonPhoto person={person} className="w-full h-full" />
              )}
            </div>
          </div>
        )}

        {/* 內文 */}
        <div className="px-7 md:px-10 pt-8 pb-9">
          <div className="flex items-baseline gap-4">
            <h3 className="text-lg font-bold text-gray-900 tracking-wide">
              {person.name}
            </h3>
            <span className="text-[11px] text-gray-500">{person.role}</span>
          </div>

          <dl className="mt-9 space-y-8">
            {visibleFields.map((f) => (
              <div key={f.label} className="flex flex-col md:flex-row gap-2 md:gap-0">
                <dt className="md:w-[110px] shrink-0 text-[13px] font-bold text-gray-900 leading-loose">
                  {f.label}
                </dt>
                <dd className="flex-1 text-[13px] text-gray-700 leading-loose">
                  {f.text && (
                    <p className="whitespace-pre-line">{f.text}</p>
                  )}
                  {f.list && f.list.length > 0 && (
                    <ul>
                      {f.list.map((item) => (
                        <li key={item} className="flex gap-1">
                          <span className="shrink-0">・</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  )}
                  {f.chips && f.chips.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {f.chips.map((chip) => (
                        <span
                          key={chip}
                          className="px-3 py-1 rounded-full text-xs font-bold"
                          style={{ background: BLUE_SOFT, color: BLUE }}
                        >
                          #{chip}
                        </span>
                      ))}
                    </div>
                  )}
                </dd>
              </div>
            ))}
          </dl>

          {person.activities?.length > 0 && (
            <div className="mt-9">
              <p className="text-[13px] font-bold text-gray-900 mb-3 flex items-center gap-2">
                <span
                  className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[11px] font-black text-white"
                  style={{ background: BLUE }}
                >
                  {person.activities.length}
                </span>
                {person.activitiesLabel || t("courts_map.activities_title")}
              </p>
              <ul className="space-y-2.5">
                {person.activities.map((act) => (
                  <li key={act.key}>
                    <Link
                      href={act.href}
                      className="group flex items-center justify-between gap-3 rounded-xl px-4 py-3 transition-colors hover:bg-[#e2ecfa]"
                      style={{ background: BLUE_SOFT }}
                    >
                      <div className="min-w-0">
                        <p className="text-[13px] font-bold text-gray-900 truncate group-hover:text-[#3157B5]">
                          {act.title}
                        </p>
                        <p className="mt-0.5 text-[11px] text-gray-500 truncate">
                          {[act.typeLabel, act.time, act.meta]
                            .filter(Boolean)
                            .join("｜")}
                        </p>
                      </div>
                      <ChevronRight
                        size={16}
                        className="shrink-0"
                        style={{ color: BLUE }}
                      />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {person.note && (
            <p
              className="mt-8 text-[12px] leading-relaxed rounded-lg px-4 py-3"
              style={{ background: BLUE_SOFT, color: "#5a6270" }}
            >
              {person.note}
            </p>
          )}

          <div className="mt-12 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center gap-1.5 text-[13px] font-bold text-gray-800 hover:opacity-70"
            >
              <span
                className="w-2 h-2 rounded-full"
                style={{ background: BLUE }}
              />
              {t("people.back")}
            </button>
            {person.href && (
              <Link
                href={person.href}
                target={person.hrefExternal ? "_blank" : undefined}
                rel={person.hrefExternal ? "noopener noreferrer" : undefined}
                className="inline-flex items-center gap-1 text-[13px] font-bold hover:underline"
                style={{ color: BLUE }}
              >
                {person.hrefLabel || t("people.view_profile")}
                <ChevronRight size={14} />
              </Link>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>,
    document.body,
  );
}

export default function PeopleShowcaseSection() {
  const { t } = useTranslation("play");
  const [tab, setTab] = useState("coaches");
  const [coaches, setCoaches] = useState([]);
  const [hosts, setHosts] = useState([]);
  const [openIndex, setOpenIndex] = useState(null);

  useEffect(() => {
    let alive = true;
    fetch("/api/featured-coaches")
      .then((r) => (r.ok ? r.json() : { coaches: [] }))
      .then((data) => {
        if (alive) {
          setCoaches((data.coaches || []).map((c) => normalizeCoach(c, t)));
        }
      })
      .catch(() => {});
    fetch("/api/organizer-profiles?list=1")
      .then((r) => (r.ok ? r.json() : { profiles: [] }))
      .then((data) => {
        if (alive) {
          setHosts((data.profiles || []).map((p) => normalizeHost(p, t)));
        }
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const tabs = [
    { key: "coaches", label: t("people.tabs.coaches") },
    { key: "hosts", label: t("people.tabs.hosts") },
    { key: "courts", label: t("people.tabs.courts") },
  ];

  const roleLabel = {
    coaches: t("people.roles.coach"),
    hosts: t("people.roles.host"),
    courts: t("people.roles.court"),
  };

  const people = useMemo(
    () => (tab === "coaches" ? coaches : tab === "hosts" ? hosts : []),
    [tab, coaches, hosts],
  );

  const navigate = useCallback(
    (dir) => {
      setOpenIndex((prev) => {
        if (prev === null || people.length === 0) return prev;
        return (prev + dir + people.length) % people.length;
      });
    },
    [people.length],
  );

  return (
    <section className="max-w-[1400px] mx-auto px-6 md:px-10 mt-24 md:mt-32">
      <p
        className="text-xs font-black tracking-widest uppercase mb-3"
        style={{ color: BLUE }}
      >
        {t("people.eyebrow")}
      </p>

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5 mb-10">
        <h2 className="text-2xl md:text-4xl font-black text-gray-900">
          {t("people.title")}
        </h2>

        {/* Tab pills */}
        <div className="inline-flex items-center gap-1 bg-white rounded-full p-1.5 shadow-sm self-start md:self-auto">
          {tabs.map((tb) => (
            <button
              key={tb.key}
              type="button"
              onClick={() => {
                setTab(tb.key);
                setOpenIndex(null);
              }}
              className={`px-4 md:px-5 py-2 rounded-full text-xs md:text-[13px] font-bold transition-colors ${
                tab === tb.key
                  ? "text-white"
                  : "text-gray-500 hover:text-gray-800"
              }`}
              style={tab === tb.key ? { background: BLUE } : undefined}
            >
              {tb.label}
            </button>
          ))}
        </div>
      </div>

      {tab === "courts" ? (
        <div className="bg-white rounded-2xl border border-dashed border-gray-300 py-16 px-6 text-center">
          <Landmark size={44} className="mx-auto mb-4" style={{ color: BLUE }} />
          <p className="font-black text-gray-900 mb-2">
            {t("people.courts_coming_soon")}
          </p>
          <p className="text-sm text-gray-500">
            {t("people.courts_coming_desc")}
          </p>
        </div>
      ) : people.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-gray-300 py-16 text-center text-gray-400 text-sm">
          {t("people.empty")}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-x-5 gap-y-10">
          {people.map((person, i) => (
            <button
              key={person.key}
              type="button"
              onClick={() => setOpenIndex(i)}
              className="group text-left"
            >
              <div className="overflow-hidden rounded-md bg-white">
                <PersonPhoto
                  person={person}
                  className="w-full aspect-[3/4] transition-transform duration-300 group-hover:scale-[1.03]"
                />
              </div>
              <div className="mt-3 flex items-center justify-between gap-2">
                <span className="text-sm font-bold text-gray-900 truncate transition-colors group-hover:underline group-hover:text-[#3157B5]">
                  {person.name}
                </span>
                <span
                  className="w-1.5 h-1.5 rounded-full shrink-0"
                  style={{ background: BLUE }}
                />
              </div>
              <p className="mt-1 text-[11px] text-gray-400 truncate">
                {person.role !== person.name ? person.role : roleLabel[tab]}
              </p>
            </button>
          ))}
        </div>
      )}

      <AnimatePresence>
        {openIndex !== null && people[openIndex] && (
          <PersonModal
            people={people}
            index={openIndex}
            onClose={() => setOpenIndex(null)}
            onNavigate={navigate}
            t={t}
          />
        )}
      </AnimatePresence>
    </section>
  );
}
