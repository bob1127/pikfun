import Link from "next/link";
import { useTranslation } from "next-i18next";
import { Search, ChevronRight, BookOpen, Users, GraduationCap, Sparkles, X } from "lucide-react";
import { SKILL_LABELS, getSkillLabel } from "@/lib/coachUtils";
import ClassCard from "./ClassCard";

const NAV_ITEMS = [
  { key: "all", icon: BookOpen },
  { key: "group", icon: Users },
  { key: "private", icon: GraduationCap },
  { key: "clinic", icon: Sparkles },
  { key: "beginner", icon: BookOpen },
];

function MenuLink({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-center gap-2 py-2.5 text-left text-sm transition-colors group ${
        active ? "text-[#3366CC] font-bold" : "text-gray-600 hover:text-[#1a2d4a]"
      }`}
    >
      <span className={`text-[#3366CC] text-xs ${active ? "opacity-100" : "opacity-50 group-hover:opacity-80"}`}>
        →
      </span>
      <span className="flex-1">{children}</span>
    </button>
  );
}

export default function CoachingSidebar({
  searchQuery,
  onSearchChange,
  onSearchSubmit,
  onClearSearch,
  onQuickTag,
  cityTags = [],
  extraTags = [],
  appliedSearch,
  classType,
  onClassTypeChange,
  skillLevel,
  onSkillLevelChange,
  featuredClasses = [],
}) {
  const { t } = useTranslation("coaching");
  const skillTags = Object.keys(SKILL_LABELS).filter((k) => k !== "all");

  return (
    <aside className="lg:w-[260px] xl:w-[280px] shrink-0 lg:border-r lg:border-gray-200 lg:pr-8 lg:mr-8">
      {/* 左側選單 */}
      <nav className="mb-10">
        <ul className="space-y-0.5">
          {NAV_ITEMS.map(({ key }) => (
            <li key={key}>
              <MenuLink active={classType === key} onClick={() => onClassTypeChange(key)}>
                {t(`sidebar.nav.${key}`)}
              </MenuLink>
            </li>
          ))}
          <li>
            <Link
              href="/coaching/apply"
              className="w-full flex items-center gap-2 py-2.5 text-left text-sm text-gray-600 hover:text-[#3366CC] transition-colors group"
            >
              <span className="text-[#3366CC] text-xs opacity-50 group-hover:opacity-80">→</span>
              <span>{t("sidebar.apply_link")}</span>
            </Link>
          </li>
        </ul>
      </nav>

      {/* 搜尋 */}
      <div className="mb-8 pb-8 border-b border-gray-200">
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onSearchSubmit?.()}
            placeholder={t("sidebar.search_placeholder")}
            className="w-full border border-gray-200 rounded-lg px-4 py-2.5 pr-16 text-sm focus:outline-none focus:border-[#3366CC] transition-colors bg-white"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={onClearSearch}
              className="absolute right-9 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black"
              aria-label={t("sidebar.clear_search_aria")}
            >
              <X size={14} />
            </button>
          )}
          <button
            type="button"
            onClick={onSearchSubmit}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#3366CC]"
            aria-label={t("sidebar.search_aria")}
          >
            <Search size={16} />
          </button>
        </div>

        {cityTags.length > 0 && (
          <div className="mt-4">
            <p className="text-[10px] font-bold tracking-[0.15em] text-gray-400 uppercase mb-2">
              {t("sidebar.city_label")}
            </p>
            <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto">
              {cityTags.map(({ full, label, search }) => (
                <button
                  key={full}
                  type="button"
                  onClick={() => onQuickTag?.(search)}
                  title={full}
                  className={`text-[10px] font-bold px-2 py-1 rounded-md border transition-colors ${
                    appliedSearch === search
                      ? "bg-[#3366CC] text-white border-[#3366CC]"
                      : "border-gray-200 text-gray-600 hover:border-[#3366CC] hover:text-[#3366CC] bg-white"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}

        {extraTags.length > 0 && (
          <div className="mt-3">
            <p className="text-[10px] font-bold tracking-[0.15em] text-gray-400 uppercase mb-2">
              {t("sidebar.quick_filter_label")}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {extraTags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => onQuickTag?.(tag)}
                  className={`text-[10px] font-bold px-2 py-1 rounded-md border transition-colors ${
                    appliedSearch === tag
                      ? "bg-[#3366CC] text-white border-[#3366CC]"
                      : "border-gray-200 text-gray-600 hover:border-[#3366CC] hover:text-[#3366CC] bg-white"
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 程度 */}
      <div className="mb-8">
        <p className="text-[10px] font-bold tracking-[0.2em] text-gray-400 uppercase mb-3">
          {t("sidebar.skill_filter_label")}
        </p>
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => onSkillLevelChange("all")}
            className={`text-xs font-bold px-3 py-1.5 rounded-full border transition-colors ${
              skillLevel === "all"
                ? "bg-[#1a2d4a] text-white border-[#1a2d4a]"
                : "border-gray-200 text-gray-600 hover:border-[#3366CC] hover:text-[#3366CC] bg-white"
            }`}
          >
            {t("sidebar.skill_all_btn")}
          </button>
          {skillTags.map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => onSkillLevelChange(key)}
              className={`text-xs font-bold px-3 py-1.5 rounded-full border transition-colors ${
                skillLevel === key
                  ? "bg-[#1a2d4a] text-white border-[#1a2d4a]"
                  : "border-gray-200 text-gray-600 hover:border-[#3366CC] hover:text-[#3366CC] bg-white"
              }`}
            >
              {getSkillLabel(key, t)}
            </button>
          ))}
        </div>
      </div>

      {/* 推薦課程 */}
      {featuredClasses.length > 0 && (
        <div>
          <p className="text-[10px] font-bold tracking-[0.2em] text-gray-400 uppercase mb-3">
            {t("sidebar.recommended_label")}
          </p>
          <div className="border border-gray-200 rounded-lg px-3 bg-white">
            {featuredClasses.slice(0, 4).map((cls) => (
              <ClassCard key={cls.id} cls={cls} compact />
            ))}
          </div>
        </div>
      )}
    </aside>
  );
}
