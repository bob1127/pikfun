"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Bookmark, MapPin, Calendar, Users, X, Plus } from "lucide-react";
import { getSavedRaw, toggleSavedSession } from "@/lib/savedSessions";
import { formatFee, formatSessionDate, formatSessionRange, getSkillLevelLabel } from "@/lib/playUtils";

function formatLocation(s) {
  return s.location_name || s.location_address || "地點待定";
}

export default function SavedSessionsPanel() {
  const [saved, setSaved] = useState([]);

  const reload = () => setSaved(getSavedRaw());

  useEffect(() => {
    reload();
    const handler = () => reload();
    window.addEventListener("savedSessionsChanged", handler);
    return () => window.removeEventListener("savedSessionsChanged", handler);
  }, []);

  const handleRemove = (session, e) => {
    e.preventDefault();
    toggleSavedSession(session);
    reload();
  };

  if (saved.length === 0) {
    return (
      <div className="text-center py-24 border border-dashed border-gray-200 rounded-2xl">
        <Bookmark size={40} className="text-gray-200 mx-auto mb-4" />
        <p className="text-gray-500 text-sm mb-2">尚無收藏的揪團</p>
        <p className="text-gray-400 text-xs mb-6">在揪團列表點擊「收藏」即可儲存到這裡</p>
        <Link
          href="/play"
          className="inline-flex items-center gap-2 bg-gray-900 text-white text-xs font-bold px-5 py-2.5 tracking-widest uppercase hover:bg-gray-800 transition-colors"
        >
          <Plus size={14} /> 瀏覽揪團
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-sm font-bold tracking-widest uppercase text-black">
          已收藏揪團
          <span className="ml-2 text-gray-400 font-medium">({saved.length})</span>
        </h3>
        <Link
          href="/play"
          className="text-xs text-gray-400 underline hover:text-gray-700 transition-colors"
        >
          瀏覽更多揪團
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <AnimatePresence>
          {saved.map((s, i) => (
            <motion.div
              key={s.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.25, delay: i * 0.04 }}
              layout
              className="relative group"
            >
              <Link
                href={`/play/${s.id}`}
                className="flex flex-col bg-white border border-gray-100 rounded-2xl p-5 hover:border-gray-300 hover:shadow-md transition-all duration-200"
              >
                {/* Remove button */}
                <button
                  type="button"
                  onClick={(e) => handleRemove(s, e)}
                  className="absolute top-4 right-4 z-10 w-7 h-7 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-gray-200 hover:text-gray-700 transition-all"
                  aria-label="移除收藏"
                >
                  <X size={13} />
                </button>

                {/* Status badge */}
                {s.display_status === "cancelled" ? (
                  <span className="inline-flex self-start mb-3 px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-500 text-[10px] font-bold">已取消</span>
                ) : s.is_full ? (
                  <span className="inline-flex self-start mb-3 px-2.5 py-0.5 rounded-full bg-orange-100 text-orange-700 text-[10px] font-bold">已額滿</span>
                ) : (
                  <span className="inline-flex self-start mb-3 px-2.5 py-0.5 rounded-full bg-green-100 text-green-700 text-[10px] font-bold">招募中</span>
                )}

                <h4 className="font-bold text-gray-900 text-base leading-snug line-clamp-2 mb-3 group-hover:text-gray-700 transition-colors">
                  {s.title}
                </h4>

                <div className="space-y-1.5 text-xs text-gray-500 mb-4">
                  <div className="flex items-center gap-2">
                    <Calendar size={12} className="shrink-0 text-gray-400" />
                    <span>{formatSessionDate(s.starts_at)}</span>
                    {s.ends_at && <span className="text-gray-400">{formatSessionRange(s.starts_at, s.ends_at)}</span>}
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin size={12} className="shrink-0 text-gray-400" />
                    <span className="truncate">{formatLocation(s)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users size={12} className="shrink-0 text-gray-400" />
                    <span>{s.joined_count || 0} / {s.max_players} 人 · {getSkillLevelLabel(s.skill_level)}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-100">
                  <span className="font-bold text-gray-900 text-sm">
                    {formatFee(s.fee_per_person, s.payment_method)}
                  </span>
                  <span className="text-[10px] text-gray-400">
                    收藏於 {s.savedAt ? new Date(s.savedAt).toLocaleDateString("zh-TW") : "—"}
                  </span>
                </div>
              </Link>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
