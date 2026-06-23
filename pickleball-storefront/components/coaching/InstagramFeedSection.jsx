"use client";

import { useEffect } from "react";
import { Instagram, ExternalLink } from "lucide-react";

function loadInstagramEmbedScript() {
  if (typeof window === "undefined") return;
  if (window.instgrm) {
    window.instgrm.Embeds.process();
    return;
  }
  if (document.getElementById("instagram-embed-script")) return;

  const script = document.createElement("script");
  script.id = "instagram-embed-script";
  script.src = "https://www.instagram.com/embed.js";
  script.async = true;
  script.onload = () => window.instgrm?.Embeds.process();
  document.body.appendChild(script);
}

function EmbedCard({ url }) {
  return (
    <div className="instagram-embed-wrap min-w-0">
      <blockquote
        className="instagram-media"
        data-instgrm-captioned
        data-instgrm-permalink={url}
        data-instgrm-version="14"
        style={{
          background: "#FFF",
          border: 0,
          borderRadius: 3,
          boxShadow: "0 0 1px rgba(0,0,0,0.5), 0 1px 10px rgba(0,0,0,0.15)",
          margin: 1,
          maxWidth: 540,
          minWidth: 326,
          padding: 0,
          width: "99.375%",
        }}
      >
        <a href={url} target="_blank" rel="noopener noreferrer">
          在 Instagram 查看此貼文
        </a>
      </blockquote>
    </div>
  );
}

export default function InstagramFeedSection({ username, embedUrls = [] }) {
  const handle = (username || "").replace("@", "");
  const urls = (embedUrls || []).filter(Boolean);

  useEffect(() => {
    if (urls.length === 0) return;
    loadInstagramEmbedScript();
  }, [urls]);

  if (!handle && urls.length === 0) return null;

  return (
    <section className="mt-12 pt-10 border-t border-dashed border-gray-400/60">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#F58529] via-[#DD2A7B] to-[#8134AF] flex items-center justify-center text-white">
          <Instagram size={20} />
        </div>
        <div>
          <h2 className="text-sm font-black tracking-widest uppercase text-gray-500">
            Instagram
          </h2>
          {handle && (
            <a
              href={`https://instagram.com/${handle}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-bold text-black hover:text-[#3157B5] inline-flex items-center gap-1"
            >
              @{handle}
              <ExternalLink size={12} />
            </a>
          )}
        </div>
      </div>

      {urls.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {urls.map((url) => (
            <EmbedCard key={url} url={url} />
          ))}
        </div>
      ) : handle ? (
        <div className="p-6 bg-white rounded-lg border border-gray-200 text-center">
          <p className="text-sm text-gray-600 mb-3">追蹤 @{handle} 的最新動態</p>
          <a
            href={`https://instagram.com/${handle}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-xs font-bold bg-black text-white px-4 py-2.5 rounded-md hover:bg-gray-800"
          >
            <Instagram size={14} /> 在 Instagram 查看
          </a>
        </div>
      ) : null}
    </section>
  );
}
