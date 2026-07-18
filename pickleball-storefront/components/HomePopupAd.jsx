"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

const AD_IMAGE = "/images/夥伴召集中.png";
const DELAY_MS = 15000;
const SESSION_KEY = "pf-home-ad-shown";

/** 首頁彈出廣告：進站約 15 秒後從右下角滑入，每個瀏覽器分頁工作階段只出現一次 */
export default function HomePopupAd() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      if (sessionStorage.getItem(SESSION_KEY)) return;
    } catch {
      /* Safari 無痕模式可能擋 storage，直接照常顯示 */
    }
    const timer = setTimeout(() => {
      setOpen(true);
      try {
        sessionStorage.setItem(SESSION_KEY, "1");
      } catch {}
    }, DELAY_MS);
    return () => clearTimeout(timer);
  }, []);

  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, x: 60, y: 20 }}
          animate={{ opacity: 1, x: 0, y: 0 }}
          exit={{ opacity: 0, x: 60, y: 20 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="fixed bottom-4 right-4 w-[min(320px,calc(100vw-32px))]"
          style={{ zIndex: 999999999 }}
        >
          <button
            type="button"
            aria-label="關閉廣告"
            onClick={() => setOpen(false)}
            className="absolute top-2 right-2 z-10 w-8 h-8 bg-black/60 text-white flex items-center justify-center transition-colors hover:bg-black"
          >
            <X size={16} />
          </button>
          <img
            src={AD_IMAGE}
            alt="PikFun 夥伴召集中"
            className="w-full h-auto shadow-2xl select-none block"
          />
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
