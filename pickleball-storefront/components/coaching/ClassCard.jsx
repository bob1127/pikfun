import Link from "next/link";
import { motion } from "framer-motion";
import { useTranslation } from "next-i18next";
import { ThumbsUp, ChevronRight, Plus } from "lucide-react";
import {
  CLASS_TYPE_COLORS,
  getClassTypeLabel,
  getSkillLabel,
  formatClassDate,
  formatClassRange,
  formatPrice,
} from "@/lib/coachUtils";

const GRADIENTS = [
  "from-[#3D85C6] to-[#1a4a8a]",
  "from-[#3366CC] to-[#1a3a7a]",
  "from-[#5BACE8] to-[#3D85C6]",
  "from-[#3D85C6] via-[#5BACE8] to-[#3366CC]",
];

function hashGradient(id) {
  if (!id) return GRADIENTS[0];
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h + id.charCodeAt(i)) % GRADIENTS.length;
  return GRADIENTS[h];
}

function StatusBadges({ cls, isCancelled, isFull, showPopular }) {
  const { t } = useTranslation("coaching");
  return (
    <>
      {showPopular && (
        <span className="absolute top-3 left-3 flex items-center gap-1 bg-[#3366CC] text-white text-[10px] font-bold px-2.5 py-1 rounded-full">
          <ThumbsUp size={11} /> {t("card.popular_badge")}
        </span>
      )}
      {isFull && !isCancelled && (
        <span className="absolute top-3 left-3 bg-[#1a2d4a]/90 text-white text-[10px] font-bold px-2.5 py-1 rounded-full">
          {t("card.full_badge")}
        </span>
      )}
      {cls.my_status === "enrolled" && (
        <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-[#3366CC]/10 text-[#3366CC] border border-[#3366CC]/20">
          {t("card.enrolled_badge")}
        </span>
      )}
      {cls.my_status === "waitlist" && (
        <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
          {t("card.waitlist_badge")}
        </span>
      )}
    </>
  );
}

function MetaTags({ cls }) {
  const { t } = useTranslation("coaching");
  return (
    <div className="flex flex-wrap gap-2 mt-3">
      <span className="text-[11px] font-medium px-2.5 py-1 rounded-full border border-gray-200 text-gray-600 bg-white">
        {formatClassDate(cls.starts_at)}
      </span>
      <span className="text-[11px] font-medium px-2.5 py-1 rounded-full border border-gray-200 text-gray-600 bg-white">
        {formatClassRange(cls.starts_at, cls.ends_at)}
      </span>
      <span
        className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${CLASS_TYPE_COLORS[cls.class_type] || "bg-gray-100 text-gray-600"}`}
      >
        {getClassTypeLabel(cls.class_type, t) || cls.class_type}
      </span>
      <span className="text-[11px] font-medium px-2.5 py-1 rounded-full border border-gray-200 text-gray-600 bg-white">
        {getSkillLabel(cls.skill_level, t) || t("enums.skill.all")}
      </span>
      <span className="text-[11px] font-bold text-[#3366CC]">
        {formatPrice(cls.price_per_person, t)}
      </span>
    </div>
  );
}

/** 圖1 TOBILA 風格：橫向大卡片 */
function HorizontalCard({ cls, index, isCancelled, isFull, showPopular, gradient }) {
  const { t } = useTranslation("coaching");
  const href = `/coaching/${cls.id}`;
  const excerpt =
    cls.description?.replace(/\s+/g, " ").trim().slice(0, 120) ||
    t("card.fallback_excerpt", {
      coach: cls.coach_name || t("card.coach_fallback", { defaultValue: "教練" }),
      type: getClassTypeLabel(cls.class_type, t) || t("card.fallback_type"),
    });

  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: index * 0.07 }}
      className={`group ${isCancelled ? "opacity-60" : ""}`}
    >
      <div className="flex flex-col md:flex-row gap-0 bg-white border border-gray-200 rounded-xl overflow-hidden hover:border-[#3D85C6]/50 hover:shadow-sm transition-all duration-300">
        {/* 左：直式照片 */}
        <Link
          href={href}
          className="relative md:w-[200px] lg:w-[220px] shrink-0 aspect-[4/3] md:aspect-auto md:min-h-[220px] overflow-hidden m-0 md:m-4 md:mr-0 rounded-none md:rounded-lg"
        >
          {cls.cover_image ? (
            <img
              src={cls.cover_image}
              alt={cls.title}
              className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
            />
          ) : (
            <div
              className={`w-full h-full min-h-[180px] bg-gradient-to-br ${gradient} flex items-center justify-center`}
            >
              <span className="text-white/90 font-bold text-5xl">
                {cls.coach_name?.charAt(0) || "C"}
              </span>
            </div>
          )}
          <StatusBadges cls={cls} isCancelled={isCancelled} isFull={isFull} showPopular={showPopular} />
        </Link>

        {/* 右：資訊 + 按鈕 */}
        <div className="flex flex-1 flex-col justify-between p-6 md:p-8 md:pl-6 min-w-0">
          <div>
            <p className="text-[10px] font-bold tracking-[0.25em] text-[#3366CC] uppercase mb-2">
              {getClassTypeLabel(cls.class_type, t) || "Course"}
            </p>
            <Link href={href}>
              <h3 className="text-xl md:text-2xl font-bold text-[#1a2d4a] leading-snug tracking-tight group-hover:text-[#3366CC] transition-colors">
                {cls.title}
              </h3>
            </Link>
            <p className="text-sm text-gray-500 mt-2 font-medium">
              {cls.coach_name}
              {cls.location_name && <> · {cls.location_name}</>}
            </p>
            <p className="text-sm text-gray-600 mt-3 leading-relaxed line-clamp-2">
              {excerpt}
              {cls.description && cls.description.length > 120 ? "…" : ""}
            </p>
            <MetaTags cls={cls} />
          </div>

          <div className="flex flex-wrap items-center gap-3 mt-6 md:justify-end">
            <Link
              href={href}
              className="inline-flex items-center gap-2 bg-[#1a2d4a] hover:bg-[#0f1f35] text-white text-sm font-bold px-5 py-2.5 rounded-full transition-colors"
            >
              {t("card.detail_btn")}
              <ChevronRight size={15} />
            </Link>
            <Link
              href={href}
              className="inline-flex items-center gap-2 bg-[#3366CC] hover:bg-[#2855aa] text-white text-sm font-bold px-5 py-2.5 rounded-full transition-colors"
            >
              {t("card.enroll_btn")}
              <Plus size={15} />
            </Link>
          </div>
        </div>
      </div>
    </motion.article>
  );
}

export default function ClassCard({ cls, index = 0, compact = false, layout = "horizontal" }) {
  const { t } = useTranslation("coaching");
  const isCancelled = cls.display_status === "cancelled";
  const isFull = cls.is_full && !isCancelled;
  const spotsLeft = cls.spots_left ?? 0;
  const gradient = hashGradient(cls.id);
  const showPopular = !isCancelled && !isFull && spotsLeft <= 2 && spotsLeft > 0;

  if (compact) {
    return (
      <Link
        href={`/coaching/${cls.id}`}
        className="flex gap-3 py-4 border-b border-gray-200 last:border-0 group"
      >
        <div
          className={`w-16 h-20 shrink-0 rounded-lg overflow-hidden bg-gradient-to-br ${gradient} flex items-center justify-center`}
        >
          {cls.cover_image ? (
            <img src={cls.cover_image} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className="text-white font-bold text-lg">
              {cls.coach_name?.charAt(0) || "C"}
            </span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-bold text-sm text-[#1a2d4a] leading-snug line-clamp-2 group-hover:text-[#3366CC] transition-colors">
            {cls.title}
          </h4>
          <p className="text-xs text-gray-500 mt-1">{cls.coach_name}</p>
        </div>
        <ChevronRight size={14} className="shrink-0 text-gray-300 group-hover:text-[#3366CC] mt-1" />
      </Link>
    );
  }

  if (layout === "horizontal") {
    return (
      <HorizontalCard
        cls={cls}
        index={index}
        isCancelled={isCancelled}
        isFull={isFull}
        showPopular={showPopular}
        gradient={gradient}
      />
    );
  }

  /* grid 版型保留給相關課程等小區塊 */
  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.06 }}
      className={`group ${isCancelled ? "opacity-60" : ""}`}
    >
      <Link href={`/coaching/${cls.id}`} className="block">
        <div className="relative aspect-[4/3] rounded-xl overflow-hidden mb-4 border border-gray-100">
          {cls.cover_image ? (
            <img
              src={cls.cover_image}
              alt={cls.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div
              className={`w-full h-full bg-gradient-to-br ${gradient} flex items-center justify-center`}
            >
              <span className="text-white/90 font-black text-5xl">
                {cls.coach_name?.charAt(0) || "C"}
              </span>
            </div>
          )}
          <StatusBadges cls={cls} isCancelled={isCancelled} isFull={isFull} showPopular={showPopular} />
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-4 py-3">
            <span className="text-white font-bold text-sm tracking-wide">
              {formatPrice(cls.price_per_person, t)}
            </span>
          </div>
        </div>
        <h3 className="font-bold text-base md:text-lg text-[#1a2d4a] leading-snug mb-2 line-clamp-2 group-hover:text-[#3366CC] transition-colors">
          {cls.title}
        </h3>
        <p className="text-xs text-gray-500 mb-3">
          {cls.coach_name}
          {cls.location_name && <> · {cls.location_name}</>}
        </p>
        <MetaTags cls={cls} />
      </Link>
    </motion.article>
  );
}
