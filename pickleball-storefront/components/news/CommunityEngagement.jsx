"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslation } from "next-i18next";
import {
  Heart,
  MessageCircle,
  Pencil,
  Trash2,
  User,
  X,
  Upload,
  ChevronLeft,
  ChevronRight,
  ImageIcon,
} from "lucide-react";
import { useUser } from "@/components/context/UserContext";
import ConfettiButton from "@/components/ui/ConfettiButton";
import { BlueArrowLink, BluePillButton, BluePillTabs } from "@/components/ui/BlueCta";

function highlightBio(text, highlight) {
  if (!text) return null;
  if (!highlight?.trim()) {
    return text.split("\n").map((p, i) => (
      <p key={i} className="mb-3 last:mb-0">
        {p}
      </p>
    ));
  }
  const words = highlight
    .split(/[,|，、]/)
    .map((w) => w.trim())
    .filter(Boolean);
  return text.split("\n").map((para, i) => {
    let parts = [para];
    words.forEach((word) => {
      parts = parts.flatMap((chunk) => {
        if (typeof chunk !== "string") return [chunk];
        const idx = chunk.indexOf(word);
        if (idx === -1) return [chunk];
        return [
          chunk.slice(0, idx),
          <span key={`${i}-${word}`} className="font-bold text-[#005caf]">
            {word}
          </span>,
          chunk.slice(idx + word.length),
        ];
      });
    });
    return (
      <p key={i} className="mb-3 last:mb-0">
        {parts}
      </p>
    );
  });
}

export function AuthorInfoCard({ post, profile }) {
  const { t } = useTranslation("news");
  const displayName =
    profile?.display_name || post.authorName || t("author.defaultName");
  const title = profile?.title || post.authorRole || t("author.defaultTitle");
  const credentials = profile?.credentials || post.authorRole;
  const bio =
    profile?.bio ||
    t("author.defaultBioTemplate", {
      name: displayName,
      role: post.authorRole || t("author.defaultRole"),
    });
  const avatar = profile?.avatar_url || post.authorAvatar || null;

  return (
    <section className="mt-14 bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
      <div className="grid md:grid-cols-[1fr_240px] gap-0">
        <div className="p-6 md:p-8">
          <p className="text-xs text-gray-500 mb-1">{title}</p>
          <h2 className="text-2xl md:text-3xl font-black text-gray-900 mb-4">
            {displayName}
          </h2>
          <div className="h-px bg-gray-200 mb-4" />
          {credentials && (
            <p className="text-sm text-gray-700 mb-4 leading-relaxed">
              {String(credentials)
                .split(/[|｜]/)
                .map((c) => c.trim())
                .filter(Boolean)
                .join(" ｜ ")}
            </p>
          )}
          <div className="text-sm text-gray-600 leading-[1.85]">
            {highlightBio(bio, profile?.highlight)}
          </div>
        </div>
        <div className="relative min-h-[220px] bg-[#e8eef8] flex items-center justify-center p-6">
          <div className="relative w-full max-w-[200px] aspect-square rounded-lg overflow-hidden bg-white border border-gray-200 shadow-sm">
            {avatar ? (
              <Image
                src={avatar}
                alt={displayName}
                fill
                className="object-cover"
                unoptimized
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-[#005caf]">
                <User size={48} strokeWidth={1.25} />
                <span className="text-xs font-bold mt-2">{displayName}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

export function PostLikeBar({ postId }) {
  const { t } = useTranslation("news");
  const { userInfo } = useUser();
  const [count, setCount] = useState(0);
  const [liked, setLiked] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!postId) return;
    const q = userInfo?.email
      ? `?email=${encodeURIComponent(userInfo.email)}`
      : "";
    fetch(`/api/community-posts/${postId}/likes${q}`)
      .then((r) => r.json())
      .then((d) => {
        setCount(d.count || 0);
        setLiked(!!d.liked);
      })
      .catch(() => {});
  }, [postId, userInfo?.email]);

  const toggle = async () => {
    if (!userInfo?.email) {
      window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`;
      return;
    }
    setLoading(true);
    const next = !liked;
    setLiked(next);
    setCount((c) => c + (next ? 1 : -1));
    try {
      const res = await fetch(`/api/community-posts/${postId}/likes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: userInfo.email,
          action: next ? "like" : "unlike",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setCount(data.count || 0);
      setLiked(!!data.liked);
    } catch {
      setLiked(!next);
      setCount((c) => c + (next ? -1 : 1));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-8 flex items-center justify-between gap-4 py-5 border-y border-gray-100">
      <div>
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">
          {t("like.eyebrow")}
        </p>
        <p className="text-sm text-gray-600">{t("like.prompt")}</p>
      </div>
      <BluePillButton
        onClick={toggle}
        disabled={loading}
        variant={liked ? "solid" : "outline"}
        className={liked ? "" : ""}
      >
        <Heart size={16} fill={liked ? "currentColor" : "none"} />
        {liked ? t("like.liked") : t("like.notLiked")}
        <span className="tabular-nums">{count}</span>
      </BluePillButton>
    </div>
  );
}

function formatTimeAgo(dateStr, t, locale = "zh-TW") {
  const diff = Date.now() - new Date(dateStr || Date.now()).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return t("comments.timeToday");
  if (days < 7) return t("comments.timeDaysAgo", { count: days });
  if (days < 30) return t("comments.timeWeeksAgo", { count: Math.floor(days / 7) });
  return new Date(dateStr).toLocaleDateString(locale);
}

async function uploadCommentImage(file, t) {
  if (file.size > 4 * 1024 * 1024) {
    throw new Error(t("comments.errUploadSize"));
  }
  const base64 = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
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
  if (!res.ok) throw new Error(data.error || t("comments.errUpload"));
  return { url: data.url, type: file.type || "image/jpeg" };
}

/** 產品內頁同款 lightbox，藍色系 */
function CommentMediaModal({ comment, initialIndex = 0, onClose }) {
  const { t, i18n } = useTranslation("news");
  const media = comment?.media || [];
  const [index, setIndex] = useState(initialIndex);

  useEffect(() => {
    setIndex(initialIndex);
  }, [initialIndex, comment?.id]);

  if (!comment || !media.length) return null;

  const current = media[index];
  const prev = () => setIndex((i) => (i - 1 + media.length) % media.length);
  const next = () => setIndex((i) => (i + 1) % media.length);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-0 md:p-10 backdrop-blur-sm"
      onClick={onClose}
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute top-4 right-4 md:top-6 md:right-6 text-white hover:text-gray-300 z-50 p-2"
      >
        <X size={32} />
      </button>

      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white w-full h-full md:h-[85vh] md:max-w-6xl md:rounded-xl overflow-hidden flex flex-col md:flex-row relative shadow-2xl"
      >
        <div className="w-full h-[50vh] md:h-full md:w-[60%] relative flex items-center justify-center bg-[#111]">
          {media.length > 1 && (
            <>
              <button
                type="button"
                onClick={prev}
                className="absolute left-3 z-10 w-10 h-10 rounded-full bg-[#005caf] text-white flex items-center justify-center hover:opacity-90"
              >
                <ChevronLeft size={22} />
              </button>
              <button
                type="button"
                onClick={next}
                className="absolute right-3 z-10 w-10 h-10 rounded-full bg-[#005caf] text-white flex items-center justify-center hover:opacity-90"
              >
                <ChevronRight size={22} />
              </button>
            </>
          )}
          <div className="relative w-full h-full">
            <Image
              src={current.url}
              alt={t("comments.mediaAlt")}
              fill
              className="object-contain"
              unoptimized
            />
          </div>
          <span className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white text-xs font-mono bg-black/50 px-3 py-1 rounded-full">
            {index + 1} / {media.length}
          </span>
        </div>

        <div className="w-full md:w-[40%] p-6 md:p-8 overflow-y-auto flex flex-col">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-11 h-11 rounded-full overflow-hidden bg-gray-100 border border-gray-200 flex items-center justify-center shrink-0">
              {comment.author_avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={comment.author_avatar}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : (
                <User size={20} className="text-gray-400" />
              )}
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">
                {comment.author_name}
              </p>
              <p className="text-xs text-gray-400">
                {formatTimeAgo(comment.created_at, t, i18n.language)}
              </p>
            </div>
          </div>
          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap flex-1">
            {comment.content}
          </p>
          {media.length > 1 && (
            <div className="flex gap-2 mt-6 overflow-x-auto pt-4 border-t border-gray-100">
              {media.map((m, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setIndex(i)}
                  className={`relative w-16 h-16 shrink-0 rounded overflow-hidden border-2 ${
                    i === index ? "border-[#005caf]" : "border-transparent"
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={m.url}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

export function PostCommentsBoard({ postId }) {
  const { t, i18n } = useTranslation("news");
  const { userInfo } = useUser();
  const fileRef = useRef(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [modal, setModal] = useState(null);

  const fetchComments = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/community-posts/${postId}/comments`);
      const data = await res.json();
      setComments(data.comments || []);
    } catch {
      setComments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (postId) fetchComments();
  }, [postId]);

  const filtered =
    filter === "media"
      ? comments.filter((c) => (c.media || []).length > 0)
      : comments;

  const handleWriteClick = () => {
    if (!userInfo?.email) {
      window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`;
      return;
    }
    setShowForm(true);
  };

  const handlePickFiles = async (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    if (!files.length) return;
    if (selectedFiles.length + files.length > 6) {
      setError(t("comments.errUploadMax"));
      return;
    }
    setUploading(true);
    setError("");
    try {
      const uploaded = [];
      for (const file of files) {
        if (!file.type.startsWith("image/")) continue;
        const preview = URL.createObjectURL(file);
        const remote = await uploadCommentImage(file, t);
        uploaded.push({ ...remote, preview });
      }
      setSelectedFiles((prev) => [...prev, ...uploaded]);
    } catch (err) {
      setError(err.message || t("comments.errUpload"));
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    setError("");
    if (!content.trim()) {
      setError(t("comments.errRequired"));
      throw new Error(t("comments.errRequired"));
    }
    const res = await fetch(`/api/community-posts/${postId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        author_email: userInfo.email,
        author_name: userInfo.name,
        author_avatar: userInfo.avatar,
        content,
        media: selectedFiles.map((f) => ({ url: f.url, type: f.type })),
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || t("comments.errSubmit"));
      throw new Error(data.error || t("comments.errSubmit"));
    }
    setContent("");
    setSelectedFiles([]);
    setShowForm(false);
    await fetchComments();
  };

  const handleDelete = async (commentId) => {
    if (!confirm(t("comments.confirmDelete"))) return;
    await fetch(`/api/community-posts/${postId}/comments`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ comment_id: commentId, email: userInfo.email }),
    });
    await fetchComments();
  };

  return (
    <section className="mt-14 border-t border-gray-200 pt-12">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
        <div>
          <p className="text-xs font-bold tracking-widest uppercase text-[#005caf] mb-1">
            {t("comments.eyebrow")}
          </p>
          <h2 className="text-2xl font-black text-gray-900">
            {t("comments.title")}
            <span className="ml-2 text-base font-bold text-gray-400">
              ({comments.length})
            </span>
          </h2>
        </div>
        <BluePillButton onClick={handleWriteClick}>
          <Pencil size={15} /> {t("comments.writeComment")}
        </BluePillButton>
      </div>

      <div className="grid md:grid-cols-2 gap-8 mb-8 p-6 bg-[#f7f9fc] rounded-xl">
        <div>
          <div className="flex items-center gap-3 mb-3">
            <span className="text-4xl font-black text-gray-900">
              {comments.length}
            </span>
            <div>
              <p className="text-sm font-bold text-gray-800">
                {t("comments.statsUnit")}
              </p>
              <p className="text-xs text-gray-500">{t("comments.statsDesc")}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-[#005caf]">
            <MessageCircle size={18} />
            <span className="text-xs font-bold">{t("comments.invite")}</span>
          </div>
        </div>
        <div>
          <p className="text-sm font-bold text-gray-900 mb-3">
            {t("comments.commonTagsTitle")}
          </p>
          <div className="flex flex-wrap gap-2">
            {(t("comments.tags", { returnObjects: true }) || []).map((tag) => (
              <span
                key={tag}
                className="text-xs font-bold px-3 py-1.5 rounded-full bg-white border border-[#005caf]/30 text-[#005caf]"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <BluePillTabs
          value={filter}
          onChange={setFilter}
          tabs={[
            { value: "all", label: `${t("comments.filterAll")} (${comments.length})` },
            {
              value: "media",
              label: `${t("comments.filterMedia")} (${comments.filter((c) => (c.media || []).length).length})`,
            },
          ]}
        />
        <BlueArrowLink
          onClick={handleWriteClick}
          type="button"
        >
          {t("comments.writeComment")}
        </BlueArrowLink>
      </div>

      {showForm && (
        <div className="mb-8 border border-gray-200 rounded-xl p-5 bg-white">
          <p className="text-sm font-bold mb-3">{t("comments.formTitle")}</p>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={4}
            placeholder={t("comments.placeholder")}
            className="w-full border border-gray-200 rounded-md px-3 py-2.5 text-sm focus:outline-none focus:border-[#005caf] resize-y mb-3"
          />

          <div className="mb-4">
            <p className="text-xs font-bold text-gray-500 mb-2">
              {t("comments.uploadLabel")}
            </p>
            <div className="flex flex-wrap gap-2">
              {selectedFiles.map((f, i) => (
                <div
                  key={i}
                  className="relative w-20 h-20 rounded-md overflow-hidden border border-gray-200"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={f.preview || f.url}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setSelectedFiles((prev) => prev.filter((_, j) => j !== i))
                    }
                    className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
              {selectedFiles.length < 6 && (
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                  className="w-20 h-20 rounded-md border-2 border-dashed border-[#005caf]/40 text-[#005caf] flex flex-col items-center justify-center gap-1 hover:bg-[#005caf]/5 disabled:opacity-50"
                >
                  {uploading ? (
                    <span className="text-[10px] font-bold">
                      {t("comments.uploading")}
                    </span>
                  ) : (
                    <>
                      <Upload size={18} />
                      <span className="text-[10px] font-bold">
                        {t("comments.addImage")}
                      </span>
                    </>
                  )}
                </button>
              )}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handlePickFiles}
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 font-bold mb-2">{error}</p>
          )}
          <div className="flex flex-wrap items-center gap-4">
            <ConfettiButton
              onClick={handleSubmit}
              successLabel={t("comments.submitSuccess")}
              className="rounded-full bg-[#005caf] px-5 py-2.5 text-sm font-bold text-white"
            >
              {t("comments.submit")}
            </ConfettiButton>
            <BlueArrowLink
              type="button"
              onClick={() => {
                setShowForm(false);
                setSelectedFiles([]);
                setError("");
              }}
            >
              {t("comments.cancel")}
            </BlueArrowLink>
          </div>
        </div>
      )}

      {loading ? (
        <p className="text-gray-400 py-10 text-center">{t("comments.loading")}</p>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center border border-dashed border-gray-200 rounded-xl">
          <ImageIcon size={40} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 font-medium">
            {filter === "media" ? t("comments.emptyMedia") : t("comments.empty")}
          </p>
          <p className="text-sm text-gray-400 mt-1">{t("comments.emptyPrompt")}</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-100">
          {filtered.map((c) => (
            <div key={c.id} className="py-6 flex gap-4">
              <div className="w-11 h-11 rounded-full overflow-hidden bg-gray-100 border border-gray-200 shrink-0 flex items-center justify-center">
                {c.author_avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={c.author_avatar}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User size={20} className="text-gray-400" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <p className="text-sm font-bold text-gray-900">
                    {c.author_name}
                  </p>
                  <span className="text-xs text-gray-400">
                    {formatTimeAgo(c.created_at, t, i18n.language)}
                  </span>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap mb-3">
                  {c.content}
                </p>
                {(c.media || []).length > 0 && (
                  <div className="flex gap-2 mb-3 overflow-x-auto pb-1">
                    {c.media.map((m, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setModal({ comment: c, index: idx })}
                        className="relative w-[88px] h-[88px] shrink-0 bg-gray-100 rounded overflow-hidden cursor-zoom-in hover:opacity-80 border border-gray-200"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={m.url}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
                {userInfo?.email &&
                  userInfo.email.toLowerCase() ===
                    c.author_email?.toLowerCase() && (
                    <button
                      type="button"
                      onClick={() => handleDelete(c.id)}
                      className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-red-600"
                    >
                      <Trash2 size={12} /> {t("comments.delete")}
                    </button>
                  )}
              </div>
            </div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {modal && (
          <CommentMediaModal
            comment={modal.comment}
            initialIndex={modal.index}
            onClose={() => setModal(null)}
          />
        )}
      </AnimatePresence>
    </section>
  );
}
