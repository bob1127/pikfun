"use client";

import { useState } from "react";
import { Loader2, Upload, X, AlertCircle } from "lucide-react";
import PostEditor from "@/components/member/PostEditor";
import { CATEGORY_OPTIONS, AUTHOR_ROLE_LABEL } from "@/lib/communityPosts";
import { BluePillButton, BluePillTabs } from "@/components/ui/BlueCta";

async function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function uploadCommunityImage(file) {
  if (file.size > 4 * 1024 * 1024) {
    throw new Error("圖片超過 4MB 限制");
  }
  const base64 = await fileToBase64(file);
  const res = await fetch("/api/community-posts/upload-image", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      imageBase64: base64,
      fileName: file.name,
      contentType: file.type,
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "圖片上傳失敗");
  return data.url;
}

function SidebarCard({ title, children }) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      {title && (
        <div className="px-4 py-3 border-b border-gray-100">
          <h3 className="text-sm font-bold text-gray-900">{title}</h3>
        </div>
      )}
      <div className="p-4 space-y-3">{children}</div>
    </div>
  );
}

export default function CommunityPostForm({
  initialValues,
  role,
  submitting,
  submitLabel = "送出審核",
  rejectedNote,
  onSubmit,
  onCancel,
}) {
  const [title, setTitle] = useState(initialValues?.title || "");
  const [excerpt, setExcerpt] = useState(initialValues?.excerpt || "");
  const [category, setCategory] = useState(
    initialValues?.category || CATEGORY_OPTIONS[0].value,
  );
  const [coverImage, setCoverImage] = useState(
    initialValues?.cover_image || "",
  );
  const [contentHtml, setContentHtml] = useState(
    initialValues?.content_html || "",
  );
  const [uploadingCover, setUploadingCover] = useState(false);
  const [error, setError] = useState("");

  const handleCoverChange = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("請上傳圖片格式（JPG、PNG、WebP、GIF）");
      return;
    }
    setUploadingCover(true);
    setError("");
    try {
      const url = await uploadCommunityImage(file);
      setCoverImage(url);
    } catch (err) {
      setError(err.message || "封面上傳失敗");
    } finally {
      setUploadingCover(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    if (!title.trim()) {
      setError("請填寫標題");
      return;
    }
    const plainLength = contentHtml.replace(/<[^>]+>/g, "").trim().length;
    if (plainLength < 10) {
      setError("內文請至少填寫 10 個字");
      return;
    }

    onSubmit?.({
      title: title.trim(),
      excerpt: excerpt.trim(),
      category,
      cover_image: coverImage || null,
      content_html: contentHtml,
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 items-start"
    >
      {/* 主欄：標題 + 內容編輯器 */}
      <div className="space-y-6 min-w-0">
        <div className="bg-white border border-gray-200 rounded-lg p-5">
          <label className="block text-xs font-bold text-gray-500 mb-2">
            標題
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={80}
            placeholder="例：週末新莊球場開放揪團，歡迎新手加入！"
            className="w-full border border-gray-300 rounded-md px-3 py-2.5 text-base font-medium focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900"
          />
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-5">
          <label className="block text-xs font-bold text-gray-500 mb-2">
            內容
          </label>
          <PostEditor
            content={contentHtml}
            onChange={setContentHtml}
            uploadImage={uploadCommunityImage}
          />
        </div>

        {error && <p className="text-sm text-red-600 font-bold">{error}</p>}
      </div>

      {/* 側欄：發布資訊、分類、摘要、封面圖 */}
      <div className="space-y-4 lg:sticky lg:top-24">
        <SidebarCard title="送出審核">
          {rejectedNote && (
            <div className="flex gap-2 p-3 border border-red-200 bg-red-50 rounded-md">
              <AlertCircle className="text-red-600 shrink-0" size={16} />
              <div>
                <p className="text-xs font-bold text-red-800">上次審核未通過</p>
                <p className="text-[11px] text-red-700 mt-0.5">{rejectedNote}</p>
              </div>
            </div>
          )}
          {role && (
            <p className="text-xs text-gray-500">
              發文身分：
              <span className="ml-1 font-bold text-[#005caf]">
                {AUTHOR_ROLE_LABEL[role] || role}
              </span>
            </p>
          )}
          <p className="text-[11px] text-gray-400 leading-relaxed">
            送出後將進入 PikFun 團隊審核，通過後才會顯示於最新消息。
          </p>
          <div className="flex flex-col gap-3 pt-1">
            <BluePillButton type="submit" loading={submitting} className="w-full">
              {submitLabel}
            </BluePillButton>
            {onCancel && (
              <BluePillButton
                type="button"
                variant="ghost"
                onClick={onCancel}
                className="w-full"
              >
                取消
              </BluePillButton>
            )}
          </div>
        </SidebarCard>

        <SidebarCard title="分類">
          <BluePillTabs
            value={category}
            onChange={setCategory}
            tabs={CATEGORY_OPTIONS.map((opt) => ({
              value: opt.value,
              label: opt.label,
            }))}
          />
        </SidebarCard>

        <SidebarCard title="摘要">
          <textarea
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            maxLength={120}
            rows={3}
            placeholder="顯示在文章列表卡片上的簡短說明（選填，未填將自動擷取內文）"
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 resize-none"
          />
        </SidebarCard>

        <SidebarCard title="封面圖">
          {coverImage ? (
            <div className="relative w-full aspect-[16/9] rounded-md overflow-hidden bg-gray-100 border border-gray-200">
              <img
                src={coverImage}
                alt=""
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => setCoverImage("")}
                className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black"
              >
                <X size={13} />
              </button>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center gap-1.5 w-full aspect-[16/9] rounded-md border-2 border-dashed border-gray-200 cursor-pointer hover:border-[#005caf] transition-colors text-gray-400">
              {uploadingCover ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <>
                  <Upload size={20} />
                  <span className="text-[11px] font-bold">上傳封面圖（16:9）</span>
                </>
              )}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleCoverChange}
                disabled={uploadingCover}
              />
            </label>
          )}
        </SidebarCard>
      </div>
    </form>
  );
}
