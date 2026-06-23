import Link from "next/link";
import { motion } from "framer-motion";
import { ThumbsUp } from "lucide-react";
import {
  CLASS_TYPE_LABELS,
  CLASS_TYPE_COLORS,
  SKILL_LABELS,
  formatClassDate,
  formatClassRange,
  formatPrice,
} from "@/lib/coachUtils";

const GRADIENTS = [
  "from-[#3157B5] to-[#1a3a8a]",
  "from-[#F4596A] to-[#c93d52]",
  "from-[#FFD43A] to-[#e6b800]",
  "from-[#3157B5] via-[#F4596A] to-[#FFD43A]",
];

function hashGradient(id) {
  if (!id) return GRADIENTS[0];
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h + id.charCodeAt(i)) % GRADIENTS.length;
  return GRADIENTS[h];
}

export default function ClassCard({ cls, index = 0, compact = false }) {
  const isCancelled = cls.display_status === "cancelled";
  const isFull = cls.is_full && !isCancelled;
  const spotsLeft = cls.spots_left ?? 0;
  const gradient = hashGradient(cls.id);

  const showPopular = !isCancelled && !isFull && spotsLeft <= 2 && spotsLeft > 0;

  if (compact) {
    return (
      <Link
        href={`/coaching/${cls.id}`}
        className="flex gap-3 py-4 border-b border-dashed border-gray-300 last:border-0 group"
      >
        <div
          className={`w-20 h-16 shrink-0 rounded-md overflow-hidden bg-gradient-to-br ${gradient} flex items-center justify-center`}
        >
          {cls.cover_image ? (
            <img src={cls.cover_image} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className="text-white font-black text-xl">
              {cls.coach_name?.charAt(0) || "C"}
            </span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-bold text-sm text-black leading-snug line-clamp-2 group-hover:text-[#3157B5] transition-colors">
            {cls.title}
          </h4>
          <p className="text-xs text-gray-500 mt-1">{cls.coach_name}</p>
        </div>
      </Link>
    );
  }

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.06 }}
      className={`group ${isCancelled ? "opacity-60" : ""}`}
    >
      <Link href={`/coaching/${cls.id}`} className="block">
        {/* Image */}
        <div className="relative aspect-[4/3] rounded-lg overflow-hidden mb-4">
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

          {showPopular && (
            <span className="absolute top-3 left-3 flex items-center gap-1 bg-[#FFD43A] text-black text-[10px] font-black px-2.5 py-1 rounded-full">
              <ThumbsUp size={11} /> 熱門
            </span>
          )}

          {isFull && !isCancelled && (
            <span className="absolute top-3 left-3 bg-black/80 text-white text-[10px] font-bold px-2.5 py-1 rounded-full">
              已額滿
            </span>
          )}

          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-4 py-3">
            <span className="text-white font-black text-sm tracking-wide">
              {formatPrice(cls.price_per_person)}
            </span>
          </div>
        </div>

        {/* Content */}
        <h3 className="font-black text-base md:text-lg text-black leading-snug mb-2 line-clamp-2 group-hover:text-[#3157B5] transition-colors">
          {cls.title}
        </h3>

        <p className="text-xs text-gray-500 mb-3">
          {cls.coach_name}
          {cls.location_name && (
            <>
              {" "}
              · {cls.location_name}
            </>
          )}
        </p>

        <div className="flex flex-wrap gap-1.5 mb-3">
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border border-gray-300 text-gray-600`}
          >
            {formatClassDate(cls.starts_at)}
          </span>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border border-gray-300 text-gray-600">
            {formatClassRange(cls.starts_at, cls.ends_at)}
          </span>
        </div>

        <div className="flex flex-wrap gap-1.5">
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${CLASS_TYPE_COLORS[cls.class_type] || "bg-gray-100 text-gray-600"}`}
          >
            {CLASS_TYPE_LABELS[cls.class_type] || cls.class_type}
          </span>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border border-gray-300 text-gray-600">
            {SKILL_LABELS[cls.skill_level] || "不限程度"}
          </span>
          {cls.my_status === "enrolled" && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#3157B5]/10 text-[#3157B5]">
              已報名
            </span>
          )}
          {cls.my_status === "waitlist" && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">
              候補中
            </span>
          )}
        </div>
      </Link>
    </motion.article>
  );
}
