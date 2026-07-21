"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Instagram } from "lucide-react";

/**
 * 社群投稿附加的 Instagram 貼文／Reels 嵌入區塊
 * 用於正式文章頁與審核預覽。
 * 桌機一屏顯示 2 則，超過 2 則時以左右箭頭切換。
 */
export default function CommunityInstagramPosts({
  urls = [],
  className = "mt-16 border-t border-gray-100 pt-10",
}) {
  const [page, setPage] = useState(0);

  const embeds = (Array.isArray(urls) ? urls : [])
    .map((value) => {
      try {
        const url = new URL(value);
        const match = url.pathname.match(/^\/(p|reel|reels|tv)\/([^/?#]+)/i);
        if (!match) return null;
        const type =
          match[1].toLowerCase() === "reels"
            ? "reel"
            : match[1].toLowerCase();
        return {
          source: value,
          embed: `https://www.instagram.com/${type}/${match[2]}/embed`,
        };
      } catch {
        return null;
      }
    })
    .filter(Boolean);

  if (!embeds.length) return null;

  const perPage = 2;
  const pageCount = Math.ceil(embeds.length / perPage);
  const canNavigate = pageCount > 1;
  const clampedPage = Math.min(page, pageCount - 1);

  const goPrev = () => setPage((p) => Math.max(0, p - 1));
  const goNext = () => setPage((p) => Math.min(pageCount - 1, p + 1));

  return (
    <section className={className}>
      <div className="mb-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Instagram size={18} className="text-[#005caf]" />
          <h2 className="text-lg font-black text-gray-900">
            Instagram 貼文
            <span className="ml-2 text-xs font-bold text-gray-400">
              {embeds.length} 則
            </span>
          </h2>
        </div>

        {canNavigate && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={goPrev}
              disabled={clampedPage === 0}
              aria-label="上一組 Instagram 貼文"
              className="flex h-7 w-7 items-center justify-center rounded-full bg-[#005caf] text-white transition-opacity hover:opacity-85 disabled:cursor-not-allowed disabled:opacity-30"
            >
              <ChevronLeft size={14} strokeWidth={2.5} />
            </button>
            <span className="text-[11px] font-bold tabular-nums text-gray-400">
              {clampedPage + 1} / {pageCount}
            </span>
            <button
              type="button"
              onClick={goNext}
              disabled={clampedPage >= pageCount - 1}
              aria-label="下一組 Instagram 貼文"
              className="flex h-7 w-7 items-center justify-center rounded-full bg-[#005caf] text-white transition-opacity hover:opacity-85 disabled:cursor-not-allowed disabled:opacity-30"
            >
              <ChevronRight size={14} strokeWidth={2.5} />
            </button>
          </div>
        )}
      </div>

      <div className="overflow-hidden">
        <div
          className="flex transition-transform duration-300 ease-out"
          style={{ transform: `translateX(-${clampedPage * 100}%)` }}
        >
          {Array.from({ length: pageCount }, (_, pageIndex) => (
            <div
              key={pageIndex}
              className="grid w-full shrink-0 grid-cols-1 gap-5 md:grid-cols-2"
            >
              {embeds
                .slice(pageIndex * perPage, pageIndex * perPage + perPage)
                .map((item, index) => (
                  <div
                    key={`${item.embed}-${index}`}
                    className="overflow-hidden border border-gray-400/60 bg-white"
                  >
                    <iframe
                      src={item.embed}
                      title={`Instagram 貼文 ${pageIndex * perPage + index + 1}`}
                      loading="lazy"
                      allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
                      className="block h-[620px] w-full border-0"
                    />
                    <a
                      href={item.source}
                      target="_blank"
                      rel="noreferrer"
                      className="block border-t border-gray-400/60 px-4 py-3 text-center text-xs font-bold text-[#005caf] hover:bg-gray-50"
                    >
                      在 Instagram 查看
                    </a>
                  </div>
                ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
