import Link from "next/link";
import { motion } from "framer-motion";
import { ThumbsUp } from "lucide-react";

export default function FeaturedCoachCard({
  coach,
  index = 0,
  variant = "grid",
}) {
  const href = `/coaching/coach/${coach.slug}`;

  if (variant === "sidebar") {
    return (
      <Link
        href={href}
        className="flex gap-3 py-4 border-b border-dashed border-gray-300 last:border-0 group"
      >
        <div className="w-20 h-16 shrink-0 rounded-md overflow-hidden bg-gray-200">
          <img
            src={coach.avatar || coach.cover_image}
            alt={coach.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-bold text-sm text-black leading-snug line-clamp-2 group-hover:text-[#3157B5] transition-colors">
            {coach.excerpt || coach.title}
          </h4>
          <p className="text-xs text-gray-500 mt-1">
            {coach.name}
            {coach.subtitle ? ` · ${coach.subtitle}` : ""}
          </p>
        </div>
      </Link>
    );
  }

  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      className="group h-full"
    >
      <Link href={href} className="block h-full">
        {/* 大圖在上 */}
        <div className="relative aspect-[3/3.4] rounded-lg overflow-hidden mb-4 bg-gray-200">
          <img
            src={coach.cover_image || coach.avatar}
            alt={coach.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          {coach.featured_label && (
            <span className="absolute top-3 left-3 flex items-center gap-1 bg-[#FFD43A] text-black text-[10px] font-black px-2.5 py-1 rounded-full shadow-sm">
              <ThumbsUp size={11} />
              {coach.featured_label}
            </span>
          )}
        </div>

        {/* 標題 */}
        <h3 className="font-black text-sm md:text-base text-black leading-snug mb-2 line-clamp-3 group-hover:text-[#3157B5] transition-colors min-h-[3.75rem]">
          {coach.excerpt}
        </h3>

        {/* 教練名 + 副標 */}
        <p className="text-xs text-gray-500 mb-3 line-clamp-2">
          <span className="font-bold text-black">{coach.name}</span>
          {coach.subtitle && (
            <span className="text-gray-400"> · {coach.subtitle}</span>
          )}
        </p>

        {/* 標籤 */}
        <div className="flex flex-wrap gap-1.5">
          {(coach.tags || []).slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="text-[10px] font-bold px-2 py-0.5 rounded-full border border-gray-300 text-gray-600 bg-white"
            >
              {tag}
            </span>
          ))}
        </div>
      </Link>
    </motion.article>
  );
}
