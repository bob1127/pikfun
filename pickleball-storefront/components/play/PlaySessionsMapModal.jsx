"use client";

import { useEffect } from "react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "next-i18next";
import { X, Map } from "lucide-react";

const PlaySessionsMap = dynamic(
  () => import("@/components/play/PlaySessionsMap"),
  {
    ssr: false,
    loading: () => (
      <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-sm">
        載入地圖中…
      </div>
    ),
  }
);

export default function PlaySessionsMapModal({
  open,
  onClose,
  sessions = [],
  courts = [],
  tab = "upcoming",
  onSwitchTab,
  loading = false,
}) {
  const { t } = useTranslation("play");
  useEffect(() => {
    if (!open) return;

    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };

    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[3000] flex flex-col bg-white"
          role="dialog"
          aria-modal="true"
          aria-label={t("map.modal.aria_label")}
        >
          <header className="flex items-center justify-between gap-4 px-4 md:px-6 py-3 border-b border-gray-200 bg-white shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <span className="w-9 h-9 rounded-full bg-[#005caf]/10 flex items-center justify-center shrink-0">
                <Map size={18} className="text-[#005caf]" />
              </span>
              <div className="min-w-0">
                <h2 className="text-base md:text-lg font-black text-gray-900">
                  {t("map.modal.title")}
                </h2>
                <p className="text-xs text-gray-500 truncate">
                  {t("map.modal.subtitle")}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label={t("map.modal.close_aria")}
              className="w-10 h-10 flex items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors shrink-0"
            >
              <X size={20} strokeWidth={2.5} />
            </button>
          </header>

          <div className="flex-1 min-h-0 relative">
            {loading ? (
              <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-sm">
                {t("map.modal.loading_data")}
              </div>
            ) : (
              <PlaySessionsMap
                fullscreen
                sessions={sessions}
                courts={courts}
                tab={tab}
                onSwitchTab={onSwitchTab}
              />
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
