"use client";

import { useState } from "react";
import { useTranslation } from "next-i18next";
import {
  AlertCircle,
  ExternalLink,
  Instagram,
  Loader2,
  Plus,
  Upload,
  X,
} from "lucide-react";
import PostEditor from "@/components/member/PostEditor";
import {
  CATEGORY_OPTIONS,
  getAuthorRoleLabel,
  getCategoryOptions,
  getNewsSubmissionTypes,
  getNewsSubmissionType,
  parseInstagramPostUrl,
} from "@/lib/communityPosts";
import { BluePillButton } from "@/components/ui/BlueCta";

async function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function uploadCommunityImage(file, t) {
  if (file.size > 4 * 1024 * 1024) {
    throw new Error(t("community.submissionForm.errors.imageTooLarge"));
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
  if (!res.ok) {
    throw new Error(
      data.error || t("community.submissionForm.errors.imageUploadFailed"),
    );
  }
  return data.url;
}

async function uploadCommunityVideo(file, t) {
  const maxBytes = 25 * 1024 * 1024;
  if (file.size > maxBytes) {
    throw new Error(t("community.submissionForm.errors.videoTooLarge"));
  }
  if (!["video/mp4", "video/webm", "video/quicktime"].includes(file.type)) {
    throw new Error(t("community.submissionForm.errors.videoTypeInvalid"));
  }

  const base64 = await fileToBase64(file);
  const res = await fetch("/api/community-posts/upload-video", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      videoBase64: base64,
      fileName: file.name,
      contentType: file.type,
    }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(
      data.error || t("community.submissionForm.errors.videoUploadFailed"),
    );
  }
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
  submitLabel,
  rejectedNote,
  onSubmit,
  onCancel,
}) {
  const { t, i18n } = useTranslation("news");
  const locale = i18n.language === "en" ? "en" : "zh-TW";
  const categoryOptions = getCategoryOptions(locale);
  const submissionTypes = getNewsSubmissionTypes(locale);
  const resolvedSubmitLabel =
    submitLabel || t("community.submissionForm.reviewTitle");

  const instagramReason = (parsed) => {
    if (!parsed?.code) return parsed?.reason || "";
    const key = `community.submissionForm.errors.instagram${parsed.code
      .charAt(0)
      .toUpperCase()}${parsed.code.slice(1)}`;
    const translated = t(key);
    return translated === key ? parsed.reason : translated;
  };
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
  const [instagramUrls, setInstagramUrls] = useState(
    Array.isArray(initialValues?.instagram_urls)
      ? initialValues.instagram_urls
      : [],
  );
  const [instagramError, setInstagramError] = useState("");
  const [instagramInput, setInstagramInput] = useState("");
  const [uploadingCover, setUploadingCover] = useState(false);
  const [error, setError] = useState("");
  const verifiedSubmissionType =
    role === "coach"
      ? "coach"
      : role === "court_owner"
        ? "court_owner"
        : "individual";
  const selectedSubmissionType = getNewsSubmissionType(category, role);

  const addInstagramUrl = () => {
    const parsed = parseInstagramPostUrl(instagramInput);
    if (!parsed.ok) {
      setInstagramError(instagramReason(parsed));
      return;
    }
    if (instagramUrls.includes(parsed.url)) {
      setInstagramError(t("community.submissionForm.errors.instagramDuplicate"));
      return;
    }
    if (instagramUrls.length >= 6) {
      setInstagramError(t("community.submissionForm.errors.instagramMax"));
      return;
    }
    setInstagramUrls((current) => [...current, parsed.url]);
    setInstagramInput("");
    setInstagramError("");
    setError("");
  };

  const selectSubmissionType = (type) => {
    if (type === "event") {
      setCategory("event");
      return;
    }
    if (type === verifiedSubmissionType && category === "event") {
      setCategory("active");
    }
  };

  const handleCoverChange = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError(t("community.submissionForm.errors.coverTypeInvalid"));
      return;
    }
    setUploadingCover(true);
    setError("");
    try {
      const url = await uploadCommunityImage(file, t);
      setCoverImage(url);
    } catch (err) {
      setError(
        err.message || t("community.submissionForm.errors.coverUploadFailed"),
      );
    } finally {
      setUploadingCover(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    if (!title.trim()) {
      setError(t("community.submissionForm.errors.titleRequired"));
      return;
    }
    const plainLength = contentHtml.replace(/<[^>]+>/g, "").trim().length;
    if (plainLength < 10) {
      setError(t("community.submissionForm.errors.contentTooShort"));
      return;
    }

    let finalInstagramUrls = instagramUrls;
    if (instagramInput.trim()) {
      const parsed = parseInstagramPostUrl(instagramInput);
      if (!parsed.ok) {
        const message = instagramReason(parsed);
        setInstagramError(message);
        setError(message);
        return;
      }
      if (instagramUrls.includes(parsed.url)) {
        const message = t(
          "community.submissionForm.errors.instagramDuplicate",
        );
        setInstagramError(message);
        setError(message);
        return;
      }
      if (instagramUrls.length >= 6) {
        const message = t("community.submissionForm.errors.instagramMax");
        setInstagramError(message);
        setError(message);
        return;
      }
      finalInstagramUrls = [...instagramUrls, parsed.url];
    }

    setInstagramError("");
    onSubmit?.({
      title: title.trim(),
      excerpt: excerpt.trim(),
      category,
      cover_image: coverImage || null,
      content_html: contentHtml,
      instagram_urls: finalInstagramUrls,
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
            {t("community.submissionForm.title")}
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={80}
            placeholder={t("community.submissionForm.titlePlaceholder")}
            className="w-full border border-gray-300 rounded-md px-3 py-2.5 text-base font-medium focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900"
          />
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-5">
          <label className="block text-xs font-bold text-gray-500 mb-2">
            {t("community.submissionForm.content")}
          </label>
          <PostEditor
            content={contentHtml}
            onChange={setContentHtml}
            uploadImage={(file) => uploadCommunityImage(file, t)}
            uploadVideo={(file) => uploadCommunityVideo(file, t)}
            placeholderText={t("community.submissionForm.editorPlaceholder")}
          />
        </div>

        {/* 放在主欄底部，避免 sticky 側欄造成破版 */}
        <section className="min-w-0 overflow-hidden rounded-lg border border-gray-200 bg-white p-5 md:p-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <Instagram size={18} className="shrink-0 text-[#005caf]" />
                <h2 className="text-sm font-black text-gray-900">
                  {t("community.submissionForm.instagramTitle")}
                </h2>
              </div>
              <p className="mt-1.5 text-xs leading-relaxed text-gray-400">
                {t("community.submissionForm.instagramDescription")}
              </p>
            </div>
            <span className="shrink-0 text-[11px] font-bold text-gray-400">
              {instagramUrls.length} / 6
            </span>
          </div>

          <div className="mt-5 flex min-w-0 flex-col gap-2 sm:flex-row">
            <div className="relative min-w-0 flex-1">
              <Instagram
                size={15}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="url"
                value={instagramInput}
                onChange={(event) => {
                  setInstagramInput(event.target.value);
                  if (instagramError) setInstagramError("");
                }}
                onBlur={() => {
                  if (!instagramInput.trim()) {
                    setInstagramError("");
                    return;
                  }
                  const parsed = parseInstagramPostUrl(instagramInput);
                  if (!parsed.ok) setInstagramError(instagramReason(parsed));
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    addInstagramUrl();
                  }
                }}
                placeholder={t(
                  "community.submissionForm.instagramPlaceholder",
                )}
                className={`w-full min-w-0 rounded-md border py-3 pl-10 pr-3 text-sm outline-none transition-colors ${
                  instagramError
                    ? "border-red-400 focus:border-red-500"
                    : "border-gray-200 focus:border-[#005caf]"
                }`}
              />
            </div>
            <button
              type="button"
              onClick={addInstagramUrl}
              disabled={instagramUrls.length >= 6}
              className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-md bg-[#005caf] px-5 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Plus size={16} />
              {t("community.submissionForm.instagramAdd")}
            </button>
          </div>

          {instagramError && (
            <p className="mt-2 text-xs font-bold leading-relaxed text-red-600">
              {instagramError}
            </p>
          )}

          {instagramUrls.length > 0 && (
            <div className="mt-4 grid min-w-0 gap-2 sm:grid-cols-2">
              {instagramUrls.map((url, index) => (
                <div
                  key={url}
                  className="flex min-w-0 items-center gap-3 rounded-md border border-gray-100 bg-[#f8fafc] p-3"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-[#005caf]">
                    <Instagram size={15} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-bold text-gray-700">
                      {t("community.submissionForm.instagramItem", {
                        index: index + 1,
                      })}
                    </p>
                    <a
                      href={url}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-0.5 flex min-w-0 items-center gap-1 text-[10px] text-gray-400 hover:text-[#005caf]"
                    >
                      <span className="truncate">{url}</span>
                      <ExternalLink size={10} className="shrink-0" />
                    </a>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setInstagramUrls((current) =>
                        current.filter((item) => item !== url),
                      )
                    }
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-gray-400 hover:bg-white hover:text-red-500"
                    aria-label={t(
                      "community.submissionForm.instagramDelete",
                      { index: index + 1 },
                    )}
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {error && <p className="text-sm text-red-600 font-bold">{error}</p>}
      </div>

      {/* 側欄：發布資訊、分類、摘要、封面圖 */}
      <div className="space-y-4 lg:sticky lg:top-24">
        <SidebarCard title={t("community.submissionForm.reviewTitle")}>
          {rejectedNote && (
            <div className="flex gap-2 p-3 border border-red-200 bg-red-50 rounded-md">
              <AlertCircle className="text-red-600 shrink-0" size={16} />
              <div>
                <p className="text-xs font-bold text-red-800">
                  {t("community.submissionForm.rejectedTitle")}
                </p>
                <p className="text-[11px] text-red-700 mt-0.5">{rejectedNote}</p>
              </div>
            </div>
          )}
          {role && (
            <p className="text-xs text-gray-500">
              {t("community.submissionForm.authorRole")}
              <span className="ml-1 font-bold text-[#005caf]">
                {getAuthorRoleLabel(role, locale)}
              </span>
            </p>
          )}
          <p className="text-[11px] text-gray-400 leading-relaxed">
            {t("community.submissionForm.reviewDescription")}
          </p>
          <div className="flex flex-col gap-3 pt-1">
            <BluePillButton type="submit" loading={submitting} className="w-full">
              {resolvedSubmitLabel}
            </BluePillButton>
            {onCancel && (
              <BluePillButton
                type="button"
                variant="ghost"
                onClick={onCancel}
                className="w-full"
              >
                {t("community.submissionForm.cancel")}
              </BluePillButton>
            )}
          </div>
        </SidebarCard>

        <SidebarCard title={t("community.submissionForm.category")}>
          <div className="grid grid-cols-2 gap-2">
            {categoryOptions.map((opt) => {
              const selected = category === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => setCategory(opt.value)}
                  className={`rounded-md border px-3 py-2.5 text-xs font-bold transition-colors ${
                    selected
                      ? "border-[#005caf] bg-[#005caf] text-white"
                      : "border-gray-200 bg-white text-gray-600 hover:border-[#005caf] hover:text-[#005caf]"
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </SidebarCard>

        <SidebarCard title={t("community.submissionForm.postType")}>
          <div className="grid grid-cols-2 gap-2">
            {submissionTypes.map((type) => {
              const allowed =
                type.value === "event" ||
                type.value === verifiedSubmissionType;
              const selected = selectedSubmissionType === type.value;
              return (
                <button
                  key={type.value}
                  type="button"
                  disabled={!allowed}
                  onClick={() => selectSubmissionType(type.value)}
                  className={`rounded-md border px-3 py-2 text-xs font-bold transition-colors ${
                    selected
                      ? "border-[#005caf] bg-[#005caf] text-white"
                      : allowed
                        ? "border-gray-200 bg-white text-gray-600 hover:border-[#005caf]"
                        : "cursor-not-allowed border-gray-100 bg-gray-50 text-gray-300"
                  }`}
                >
                  {type.label}
                </button>
              );
            })}
          </div>
          <p className="text-[11px] leading-relaxed text-gray-400">
            {t("community.submissionForm.postTypeHelp")}
          </p>
        </SidebarCard>

        <SidebarCard title={t("community.submissionForm.excerpt")}>
          <textarea
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            maxLength={120}
            rows={3}
            placeholder={t("community.submissionForm.excerptPlaceholder")}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 resize-none"
          />
        </SidebarCard>

        <SidebarCard title={t("community.submissionForm.cover")}>
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
                  <span className="text-[11px] font-bold">
                    {t("community.submissionForm.uploadCover")}
                  </span>
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
