"use client";

import { useState } from "react";
import { ArrowUp, Check, Share2 } from "lucide-react";
import { FaFacebookF, FaInstagram, FaLine } from "react-icons/fa";

const shareWindowFeatures =
  "width=720,height=620,noopener,noreferrer,menubar=no,toolbar=no";

export default function GlobalSocialShare() {
  const [copied, setCopied] = useState(false);

  const getShareData = () => ({
    title: document.title,
    text: document.title,
    url: window.location.href,
  });

  const openShareWindow = (url) => {
    window.open(url, "_blank", shareWindowFeatures);
  };

  const shareToFacebook = () => {
    const { url } = getShareData();
    openShareWindow(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
    );
  };

  const shareToLine = () => {
    const { url } = getShareData();
    openShareWindow(
      `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(url)}`,
    );
  };

  const shareToInstagram = async () => {
    const data = getShareData();
    if (navigator.share) {
      try {
        await navigator.share(data);
        return;
      } catch (error) {
        if (error?.name === "AbortError") return;
      }
    }

    try {
      await navigator.clipboard.writeText(data.url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      window.prompt("複製此頁網址後分享到 Instagram：", data.url);
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const shareButtons = [
    {
      label: "IG",
      ariaLabel: "分享到 Instagram",
      icon: FaInstagram,
      onClick: shareToInstagram,
    },
    {
      label: "FB",
      ariaLabel: "分享到 Facebook",
      icon: FaFacebookF,
      onClick: shareToFacebook,
    },
    {
      label: "LINE",
      ariaLabel: "分享到 LINE",
      icon: FaLine,
      onClick: shareToLine,
    },
  ];

  return (
    <aside
      className="group/share fixed bottom-[max(18px,env(safe-area-inset-bottom))] right-3 z-[900] flex flex-col items-end gap-2 md:right-4"
      aria-label="社群分享與返回頂部"
    >
      <div className="grid grid-rows-[0fr] opacity-0 transition-all duration-300 group-hover/share:grid-rows-[1fr] group-hover/share:opacity-100">
        <div className="flex -translate-y-2 flex-col items-end gap-2 overflow-hidden transition-transform duration-300 group-hover/share:translate-y-0">
          {shareButtons.map(({ label, ariaLabel, icon: Icon, onClick }) => (
            <button
              key={label}
              type="button"
              onClick={onClick}
              aria-label={ariaLabel}
              title={ariaLabel}
              className="group flex h-7 min-w-[42px] items-center justify-center gap-1.5 rounded-full border border-gray-200 bg-white px-2.5 text-[9px] font-medium tracking-[0.04em] text-gray-600 shadow-[0_3px_12px_rgba(15,23,42,0.08)] transition-all duration-200 hover:-translate-x-1 hover:border-[#005caf]/30 hover:text-[#005caf]"
            >
              <Icon
                size={label === "LINE" ? 12 : 11}
                className="shrink-0 transition-transform duration-200 group-hover:scale-110"
              />
              <span>{label}</span>
            </button>
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={scrollToTop}
        aria-label="返回頁面頂端"
        title="返回頁面頂端"
        className="group flex h-8 w-[58px] items-center justify-center overflow-hidden rounded-full border border-[#2878d0] bg-[#2878d0] text-white shadow-[0_4px_14px_rgba(0,92,175,0.22)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#005caf]"
      >
        <span className="flex items-center gap-1 text-[9px] font-semibold tracking-wide">
          <ArrowUp
            size={11}
            strokeWidth={2}
            className="transition-transform duration-200 group-hover:-translate-y-0.5"
          />
          <span>Top</span>
        </span>
      </button>

      <div
        className={`pointer-events-none absolute bottom-10 right-0 flex items-center gap-1.5 whitespace-nowrap rounded-full bg-gray-900 px-3 py-2 text-[10px] font-medium text-white transition-all duration-200 ${
          copied
            ? "translate-y-0 opacity-100"
            : "translate-y-1 opacity-0"
        }`}
        role="status"
        aria-live="polite"
      >
        {copied ? <Check size={12} /> : <Share2 size={12} />}
        已複製網址，可貼至 Instagram
      </div>
    </aside>
  );
}
