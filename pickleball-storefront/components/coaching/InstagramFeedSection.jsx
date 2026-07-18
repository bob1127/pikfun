"use client";

import { useTranslation } from "next-i18next";
import { Instagram, ExternalLink } from "lucide-react";

const BLUE = "#3157B5";

/**
 * IG 展示改為「連結卡片」：不載入 instagram.com/embed.js，
 * 由前端自行渲染卡片，點擊開新分頁到該則貼文。
 */
function PostLinkCard({ url, handle, index }) {
  const { t } = useTranslation("coaching");
  const isReel = /\/(reel|reels|tv)\//.test(url);
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="group block"
    >
      <div className="relative aspect-square rounded-lg overflow-hidden bg-[#F6F6F4] border border-gray-200 group-hover:border-[#3157B5] transition-colors flex flex-col items-center justify-center gap-3">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#F58529] via-[#DD2A7B] to-[#8134AF] flex items-center justify-center text-white shadow-sm">
          <Instagram size={22} />
        </div>
        <p className="text-[11px] font-bold text-gray-500 tracking-wide">
          {isReel ? t("instagram.feed.reel_label") : t("instagram.feed.post_label")} {index + 1}
        </p>
        <span className="inline-flex items-center gap-1 text-[10px] font-black tracking-widest uppercase text-white px-3 py-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity absolute bottom-3"
          style={{ backgroundColor: BLUE }}
        >
          {t("instagram.feed.view_post")} <ExternalLink size={10} />
        </span>
      </div>
      <div className="flex items-center justify-between mt-2 px-0.5">
        <p className="text-xs font-bold text-[#222] truncate">
          {handle ? `@${handle}` : "Instagram"}
        </p>
        <span
          className="w-1.5 h-1.5 rounded-full shrink-0"
          style={{ backgroundColor: BLUE }}
        />
      </div>
    </a>
  );
}

export default function InstagramFeedSection({ username, embedUrls = [] }) {
  const { t } = useTranslation("coaching");
  const handle = (username || "").replace("@", "");
  const urls = (embedUrls || []).filter(Boolean);

  if (!handle && urls.length === 0) return null;

  return (
    <section>
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#F58529] via-[#DD2A7B] to-[#8134AF] flex items-center justify-center text-white">
            <Instagram size={17} />
          </div>
          {handle && (
            <a
              href={`https://instagram.com/${handle}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-black text-[#222] hover:text-[#3157B5] inline-flex items-center gap-1"
            >
              @{handle}
              <ExternalLink size={12} />
            </a>
          )}
        </div>
        {handle && (
          <a
            href={`https://instagram.com/${handle}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline-flex items-center gap-1.5 text-xs font-bold hover:underline"
            style={{ color: BLUE }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: BLUE }}
            />
            {t("instagram.feed.visit_profile")}
          </a>
        )}
      </div>

      {urls.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {urls.map((url, i) => (
            <PostLinkCard key={url} url={url} handle={handle} index={i} />
          ))}
        </div>
      ) : handle ? (
        <div className="p-6 bg-[#F6F6F4] rounded-lg border border-gray-200 text-center">
          <p className="text-sm text-gray-600 mb-3">
            {t("instagram.feed.follow_prompt", { handle })}
          </p>
          <a
            href={`https://instagram.com/${handle}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-xs font-bold text-white px-5 py-2.5 rounded-full hover:opacity-90"
            style={{ backgroundColor: BLUE }}
          >
            <Instagram size={14} /> {t("instagram.feed.view_on_instagram")}
          </a>
        </div>
      ) : null}
    </section>
  );
}
