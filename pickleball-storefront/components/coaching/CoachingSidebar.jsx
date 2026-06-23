import Link from "next/link";
import { Search, ChevronRight, BookOpen, Users, GraduationCap, Sparkles, X } from "lucide-react";
import { CLASS_TYPE_LABELS, SKILL_LABELS } from "@/lib/coachUtils";
import ClassCard from "./ClassCard";

const NAV_ITEMS = [
  { key: "all", label: "全部課程", icon: BookOpen },
  { key: "group", label: "團體班", icon: Users },
  { key: "private", label: "私人課", icon: GraduationCap },
  { key: "clinic", label: "主題班", icon: Sparkles },
  { key: "beginner", label: "新手班", icon: BookOpen },
];

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
  const skillTags = Object.entries(SKILL_LABELS);

  return (
    <aside className="lg:border-l lg:border-dashed lg:border-gray-300 lg:pl-8">
      {/* Search */}
      <div className="mb-8">
        <p className="text-[10px] font-black tracking-widest text-gray-400 uppercase mb-3">
          Keyword
        </p>
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onSearchSubmit?.()}
            placeholder="課程、教練、球場、地址、城市..."
            className="w-full border border-gray-300 rounded-full px-4 py-2.5 pr-16 text-sm focus:outline-none focus:border-black transition-colors bg-white"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={onClearSearch}
              className="absolute right-9 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black"
              aria-label="清除搜尋"
            >
              <X size={14} />
            </button>
          )}
          <button
            type="button"
            onClick={onSearchSubmit}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black"
            aria-label="搜尋"
          >
            <Search size={16} />
          </button>
        </div>
        <p className="text-[10px] text-gray-400 mt-2">
          輸入即時搜尋 · 支援城市簡稱（如台中、台北）
        </p>

        {cityTags.length > 0 && (
          <div className="mt-4">
            <p className="text-[10px] font-black tracking-widest text-gray-400 uppercase mb-2">
              依縣市（{cityTags.length}）
            </p>
            <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto pr-1">
              {cityTags.map(({ full, label, search }) => (
                <button
                  key={full}
                  type="button"
                  onClick={() => onQuickTag?.(search)}
                  title={full}
                  className={`text-[10px] font-bold px-2.5 py-1 rounded-full border transition-colors ${
                    appliedSearch === search
                      ? "bg-black text-white border-black"
                      : "border-gray-300 text-gray-600 hover:border-black hover:text-black bg-white"
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
            <p className="text-[10px] font-black tracking-widest text-gray-400 uppercase mb-2">
              快速篩選
            </p>
            <div className="flex flex-wrap gap-1.5">
              {extraTags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => onQuickTag?.(tag)}
                  className={`text-[10px] font-bold px-2.5 py-1 rounded-full border transition-colors ${
                    appliedSearch === tag
                      ? "bg-[#3157B5] text-white border-[#3157B5]"
                      : "border-gray-300 text-gray-600 hover:border-[#3157B5] hover:text-[#3157B5] bg-white"
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="mb-8">
        <p className="text-[10px] font-black tracking-widest text-gray-400 uppercase mb-3">
          課程類型
        </p>
        <ul className="divide-y divide-gray-200">
          {NAV_ITEMS.map(({ key, label, icon: Icon }) => (
            <li key={key}>
              <button
                type="button"
                onClick={() => onClassTypeChange(key)}
                className={`w-full flex items-center gap-3 py-3.5 text-left text-sm font-bold transition-colors group ${
                  classType === key ? "text-black" : "text-gray-600 hover:text-black"
                }`}
              >
                <Icon size={16} className="shrink-0 opacity-60" />
                <span className="flex-1">{label}</span>
                <ChevronRight
                  size={14}
                  className={`shrink-0 transition-transform ${
                    classType === key ? "text-black" : "text-gray-300 group-hover:translate-x-0.5"
                  }`}
                />
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* Tags */}
      <div className="mb-8">
        <p className="text-[10px] font-black tracking-widest text-gray-400 uppercase mb-3">
          程度篩選
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => onSkillLevelChange("all")}
            className={`text-xs font-bold px-3 py-1.5 rounded-full border transition-colors ${
              skillLevel === "all"
                ? "bg-black text-white border-black"
                : "border-gray-300 text-gray-600 hover:border-black hover:text-black"
            }`}
          >
            全部
          </button>
          {skillTags.map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => onSkillLevelChange(key)}
              className={`text-xs font-bold px-3 py-1.5 rounded-full border transition-colors ${
                skillLevel === key
                  ? "bg-black text-white border-black"
                  : "border-gray-300 text-gray-600 hover:border-black hover:text-black"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Featured */}
      {featuredClasses.length > 0 && (
        <div>
          <p className="text-[10px] font-black tracking-widest text-gray-400 uppercase mb-1">
            推薦課程 👍
          </p>
          <div>
            {featuredClasses.slice(0, 4).map((cls) => (
              <ClassCard key={cls.id} cls={cls} compact />
            ))}
          </div>
          <Link
            href="/coaching/create"
            className="mt-4 flex items-center justify-center gap-2 w-full bg-black text-white text-xs font-bold py-3 rounded-md hover:bg-gray-800 transition-colors"
          >
            我要開課
            <ChevronRight size={14} />
          </Link>
        </div>
      )}
    </aside>
  );
}
