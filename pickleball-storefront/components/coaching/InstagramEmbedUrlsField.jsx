import { Plus, X } from "lucide-react";
import { MAX_INSTAGRAM_EMBEDS } from "@/lib/instagramEmbed";

export default function InstagramEmbedUrlsField({ urls = [], onChange, username, onUsernameChange }) {
  const list = urls.length > 0 ? urls : [""];

  const updateUrl = (index, value) => {
    const next = [...list];
    next[index] = value;
    onChange(next);
  };

  const addRow = () => {
    if (list.filter(Boolean).length >= MAX_INSTAGRAM_EMBEDS) return;
    onChange([...list, ""]);
  };

  const removeRow = (index) => {
    const next = list.filter((_, i) => i !== index);
    onChange(next.length ? next : [""]);
  };

  return (
    <div className="p-5 bg-white border border-gray-200 rounded-lg space-y-4">
      <div>
        <h2 className="text-sm font-black mb-1">Instagram 展示</h2>
        <p className="text-xs text-gray-500 leading-relaxed">
          在 Instagram 開啟貼文 → 右上角「…」→「複製連結」，貼到下方（最多 {MAX_INSTAGRAM_EMBEDS}{" "}
          則）。儲存後會自動嵌入顯示在教練頁。
        </p>
      </div>

      <div>
        <label className="block text-xs font-bold text-gray-500 mb-1.5">
          Instagram 帳號（選填，顯示 @ 與個人頁連結）
        </label>
        <input
          value={username || ""}
          onChange={(e) => onUsernameChange(e.target.value.replace("@", ""))}
          placeholder="帳號不含 @"
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
        />
      </div>

      <div className="space-y-2">
        <label className="block text-xs font-bold text-gray-500">
          貼文／Reels 網址
        </label>
        {list.map((url, index) => (
          <div key={index} className="flex gap-2">
            <input
              value={url}
              onChange={(e) => updateUrl(index, e.target.value)}
              placeholder="https://www.instagram.com/p/… 或 /reel/…"
              className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm"
            />
            {list.length > 1 && (
              <button
                type="button"
                onClick={() => removeRow(index)}
                className="p-2 text-gray-400 hover:text-red-500"
                aria-label="移除"
              >
                <X size={16} />
              </button>
            )}
          </div>
        ))}
        {list.filter(Boolean).length < MAX_INSTAGRAM_EMBEDS && (
          <button
            type="button"
            onClick={addRow}
            className="inline-flex items-center gap-1 text-xs font-bold text-[#3157B5] hover:underline"
          >
            <Plus size={14} /> 新增一則
          </button>
        )}
      </div>
    </div>
  );
}
