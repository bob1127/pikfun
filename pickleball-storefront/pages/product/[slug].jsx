import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);

import { Swiper, SwiperSlide } from "swiper/react";
import { FreeMode, Navigation, Thumbs, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/free-mode";
import "swiper/css/navigation";
import "swiper/css/thumbs";
import "swiper/css/pagination";

import { useCart } from "@/components/context/CartContext";
import { useUser } from "@/components/context/UserContext";
import {
  Star,
  ChevronDown,
  Plus,
  Minus,
  CheckCircle2,
  ShieldCheck,
  Truck,
  RefreshCcw,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  UploadCloud,
  PlayCircle,
  Trash2,
  X,
  Filter,
  Sparkles,
  Pencil,
  Search,
  ZoomIn,
  ZoomOut,
  User,
} from "lucide-react";

// ─── 通用摺疊元件 ────────────────────────────────────────────
const GenericAccordion = ({
  title,
  children,
  icon: Icon,
  isOpenDefault = false,
}) => {
  const [isOpen, setIsOpen] = useState(isOpenDefault);
  if (!children) return null;
  return (
    <div className="border-b border-gray-200 py-5 last:border-b-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center text-left group focus:outline-none"
      >
        <h3 className="text-[13px] font-bold uppercase tracking-widest flex items-center gap-2 group-hover:text-[#e31837] transition-colors">
          {Icon && <Icon size={16} className="text-[#e31837]" />}
          {title}
        </h3>
        <motion.div animate={{ rotate: isOpen ? 180 : 0 }}>
          <ChevronDown size={14} className="text-gray-400" />
        </motion.div>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="pt-4 text-[14.5px] text-stone-700 tracking-wide leading-[25px] font-medium whitespace-pre-wrap">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ─── 星級選擇器 ───────────────────────────────────────────────
const StarSelector = ({ value, onChange }) => (
  <div className="flex gap-1">
    {[1, 2, 3, 4, 5].map((n) => (
      <button key={n} type="button" onClick={() => onChange(n)}>
        <Star
          size={24}
          className={n <= value ? "text-[#e31837]" : "text-gray-300"}
          fill={n <= value ? "currentColor" : "none"}
        />
      </button>
    ))}
  </div>
);

// ─── 評論工具函式 ───────────────────────────────────────────────
const REVIEW_KEYWORDS = [
  "力量",
  "控制",
  "旋球",
  "手感",
  "重量",
  "設計",
  "性價比",
];

const formatTimeAgo = (dateStr) => {
  const diff = Date.now() - new Date(dateStr || Date.now()).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "今天";
  if (days < 7) return `${days} 天前`;
  if (days < 30) return `${Math.floor(days / 7)} 週前`;
  if (days < 365) return `${Math.floor(days / 30)} 個月前`;
  return `${Math.floor(days / 365)} 年前`;
};

const buildReviewSummary = (reviews) => {
  if (!reviews.length) return "";
  const recommendCount = reviews.filter((r) => r.recommend).length;
  const avg = (
    reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
  ).toFixed(1);
  const withMedia = reviews.filter((r) => r.media?.length).length;
  return `球友對這款商品平均評分 ${avg} 星，其中 ${recommendCount} 位推薦此商品。${withMedia ? `共有 ${withMedia} 則評論附上照片或影片，` : ""}多數使用者提到球拍在實戰中的表現穩定，適合想提升比賽表現的球友參考。`;
};

// ─── 評論者大頭貼 ───────────────────────────────────────────────
const ReviewAvatar = ({ avatar, name, size = 44 }) => {
  const cls =
    "rounded-full shrink-0 overflow-hidden bg-gray-100 border border-gray-200 flex items-center justify-center";
  if (avatar) {
    return (
      <div className={cls} style={{ width: size, height: size }}>
        <Image
          src={avatar}
          alt={name || "會員"}
          width={size}
          height={size}
          className="object-cover w-full h-full"
          unoptimized
        />
      </div>
    );
  }
  return (
    <div
      className={`${cls} text-gray-400`}
      style={{ width: size, height: size }}
    >
      <User size={Math.round(size * 0.48)} strokeWidth={1.75} />
    </div>
  );
};

// ─── 讚／倒讚按鈕（每人每則只能投一票，互斥，已投填色）────────
const VoteButtons = ({
  reviewId,
  helpfulCount,
  unhelpfulCount,
  myVote,
  onVote,
  size = 14,
}) => {
  const upActive = myVote === "up";
  const downActive = myVote === "down";

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={() => reviewId && onVote(reviewId, "up")}
        className={`flex items-center gap-1 transition-colors ${
          upActive
            ? "text-[#e31837] font-bold"
            : "text-gray-500 hover:text-black"
        }`}
      >
        <ThumbsUp size={size} fill={upActive ? "currentColor" : "none"} />
        {helpfulCount || 0}
      </button>
      <button
        type="button"
        onClick={() => reviewId && onVote(reviewId, "down")}
        className={`flex items-center gap-1 transition-colors ${
          downActive
            ? "text-gray-800 font-bold"
            : "text-gray-500 hover:text-black"
        }`}
      >
        <ThumbsDown size={size} fill={downActive ? "currentColor" : "none"} />
        {unhelpfulCount || 0}
      </button>
    </div>
  );
};

// ─── 單筆評論卡片（Selkirk 風格）────────────────────────────────
const ReviewCard = ({
  review,
  productTitle,
  productThumbnail,
  onVote,
  onOpenModal,
  isOwner,
  onEdit,
  isAdmin,
  onDelete,
}) => {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const timeAgo = formatTimeAgo(review.created_at);
  const isVerified = !!review.author_email;

  return (
    <div className="flex flex-col lg:flex-row gap-6 lg:gap-10 border-t border-gray-200 py-10">
      <div className="w-full lg:w-[28%] shrink-0">
        <div className="flex items-start gap-3 mb-4">
          <ReviewAvatar
            avatar={review.author_avatar}
            name={review.author_name}
            size={44}
          />
          <div>
            <div className="font-bold text-sm text-black leading-tight">
              {review.author_name}
            </div>
            {isVerified && (
              <div className="flex items-center gap-1 text-[11px] text-[#e31837] font-bold mt-1">
                <CheckCircle2 size={12} /> 已驗證會員
              </div>
            )}
          </div>
        </div>

        <div className="mb-4">
          <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-2">
            評論商品
          </div>
          <div className="flex items-center gap-2">
            {productThumbnail && (
              <div className="w-10 h-10 relative rounded border border-gray-200 overflow-hidden shrink-0 bg-white">
                <Image
                  src={productThumbnail}
                  alt={productTitle}
                  fill
                  className="object-contain p-0.5"
                  unoptimized
                />
              </div>
            )}
            <span className="text-xs font-bold text-black leading-snug line-clamp-2">
              {productTitle}
            </span>
          </div>
        </div>

        <div className="space-y-1.5 text-xs">
          <div className="flex items-center gap-1.5 text-[#e31837] font-bold">
            <ThumbsUp size={13} fill="currentColor" />
            {review.helpful_count || 0}人覺得這則評論很讚
          </div>
          <div className="flex items-center gap-1.5 text-gray-600 font-bold">
            <ThumbsDown size={13} />
            {review.unhelpful_count || 0}人不喜歡這則評論
          </div>
        </div>
      </div>

      <div className="w-full lg:flex-1 min-w-0">
        <div className="flex items-start justify-between mb-3">
          <div className="flex gap-0.5 items-center flex-wrap">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                size={18}
                fill={i < review.rating ? "#f5a623" : "none"}
                className={
                  i < review.rating ? "text-[#f5a623]" : "text-gray-200"
                }
              />
            ))}
            {review.is_edited && (
              <span className="ml-2 text-[10px] text-gray-400 border border-gray-200 rounded px-2 py-0.5">
                已編輯
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0 ml-4">
            <span className="text-xs text-gray-400 whitespace-nowrap">
              {timeAgo}
            </span>
            {isOwner && !review._optimistic && (
              <button
                onClick={() => onEdit(review)}
                className="text-xs text-gray-400 hover:text-[#e31837] underline transition-colors"
              >
                編輯
              </button>
            )}
            {isAdmin &&
              !review._optimistic &&
              (confirmDelete ? (
                <span className="flex items-center gap-1">
                  <span className="text-xs text-gray-500">確定刪除？</span>
                  <button
                    onClick={() => {
                      onDelete(review.id);
                      setConfirmDelete(false);
                    }}
                    className="text-xs font-bold text-white bg-red-600 hover:bg-red-700 px-2 py-0.5 rounded transition-colors"
                  >
                    確定
                  </button>
                  <button
                    onClick={() => setConfirmDelete(false)}
                    className="text-xs text-gray-400 hover:text-gray-600 px-1"
                  >
                    取消
                  </button>
                </span>
              ) : (
                <button
                  onClick={() => setConfirmDelete(true)}
                  title="管理員刪除"
                  className="flex items-center gap-0.5 text-xs text-gray-300 hover:text-red-600 transition-colors"
                >
                  <Trash2 size={13} />
                </button>
              ))}
          </div>
        </div>

        {review.title && (
          <h4 className="font-bold text-base mb-3 text-black">
            {review.title}
          </h4>
        )}
        <p className="text-sm text-gray-700 leading-relaxed mb-5 whitespace-pre-wrap">
          {review.content}
        </p>

        {review.media && review.media.length > 0 && (
          <div className="flex gap-2 mb-6 overflow-x-auto scrollbar-hide pb-1">
            {review.media.map((item, idx) => (
              <div
                key={idx}
                onClick={() => onOpenModal && onOpenModal(review, idx)}
                className="w-[88px] h-[88px] shrink-0 bg-gray-100 rounded overflow-hidden relative cursor-zoom-in hover:opacity-80 transition-opacity border border-gray-200"
              >
                {item.type && item.type.includes("video") ? (
                  <>
                    <video
                      src={item.url}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                      <PlayCircle size={22} className="text-white" />
                    </div>
                  </>
                ) : (
                  <Image
                    src={item.url}
                    alt="Review media"
                    fill
                    className="object-cover"
                    unoptimized
                  />
                )}
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center justify-end gap-4 text-xs text-gray-500 pt-4 border-t border-gray-100">
          <span>這篇評論有幫助嗎？</span>
          <VoteButtons
            reviewId={review.id}
            helpfulCount={review.helpful_count}
            unhelpfulCount={review.unhelpful_count}
            myVote={review.my_vote}
            onVote={onVote}
            size={14}
          />
        </div>
      </div>
    </div>
  );
};

// ─── 媒體彈出視窗 (Modal) ─────────────────────────────────────
const ReviewModal = ({ review, initialMediaIndex, onClose, onVote }) => {
  if (!review) return null;
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-0 md:p-10 backdrop-blur-sm"
      onClick={onClose}
    >
      <button
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
        {/* 左側：媒體播放 */}
        <div
          className="w-full h-[50vh] md:h-full md:w-[60%] relative flex items-center justify-center"
          style={{ backgroundColor: "#111" }}
        >
          {review.media && review.media.length > 0 ? (
            <Swiper
              initialSlide={initialMediaIndex}
              navigation={true}
              pagination={{ type: "fraction" }}
              modules={[Navigation, Pagination]}
              className="w-full h-full lightbox-swiper"
            >
              {review.media.map((item, idx) => (
                <SwiperSlide
                  key={idx}
                  className="flex items-center justify-center"
                >
                  {item.type && item.type.includes("video") ? (
                    <video
                      src={item.url}
                      controls
                      autoPlay
                      className="max-w-full max-h-full object-contain"
                    />
                  ) : (
                    <div
                      className="relative w-full h-full"
                      style={{
                        backgroundColor: item.url.toLowerCase().endsWith(".png")
                          ? "#fff"
                          : "transparent",
                      }}
                    >
                      <Image
                        src={item.url}
                        alt="Review Photo"
                        fill
                        className="object-contain"
                        unoptimized
                      />
                    </div>
                  )}
                </SwiperSlide>
              ))}
            </Swiper>
          ) : (
            <div className="text-gray-500 text-sm">無媒體內容</div>
          )}
        </div>

        {/* 右側：評論詳情 */}
        <div className="w-full h-[50vh] md:h-full md:w-[40%] bg-white p-6 md:p-8 flex flex-col overflow-y-auto">
          <div className="flex items-center gap-3 mb-6 pb-6 border-b border-gray-100">
            <ReviewAvatar
              avatar={review.author_avatar}
              name={review.author_name}
              size={48}
            />
            <div>
              <div className="font-bold text-base text-black">
                {review.author_name}
              </div>
              <div className="flex gap-0.5 mt-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    size={14}
                    fill={i < review.rating ? "#f5a623" : "none"}
                    className={
                      i < review.rating ? "text-[#f5a623]" : "text-gray-200"
                    }
                  />
                ))}
              </div>
            </div>
          </div>
          <div className="flex-1">
            {review.title && (
              <h3 className="font-bold text-lg mb-3">{review.title}</h3>
            )}
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
              {review.content}
            </p>
          </div>
          <div className="mt-8 pt-6 border-t border-gray-100 flex items-center justify-between text-sm text-gray-500">
            <span>這篇評論有幫助嗎？</span>
            <VoteButtons
              reviewId={review.id}
              helpfulCount={review.helpful_count}
              unhelpfulCount={review.unhelpful_count}
              myVote={review.my_vote}
              onVote={onVote}
              size={16}
            />
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

// ─── 評論區主元件 ─────────────────────────────────────────────
const ADMIN_EMAILS_CLIENT = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

const ProductReviews = ({ productId, productTitle, productThumbnail }) => {
  const router = useRouter();
  const { userInfo, loading: userLoading } = useUser();

  const isAdmin =
    !!userInfo?.email &&
    ADMIN_EMAILS_CLIENT.includes(userInfo.email.trim().toLowerCase());

  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitDone, setSubmitDone] = useState(false);
  const [modalReview, setModalReview] = useState(null);
  const [modalMediaIndex, setModalMediaIndex] = useState(0);

  // 編輯狀態
  const [editingReview, setEditingReview] = useState(null);
  const [editForm, setEditForm] = useState({
    rating: 5,
    title: "",
    content: "",
    recommend: true,
  });
  const [editSubmitting, setEditSubmitting] = useState(false);

  const [form, setForm] = useState({
    author_name: "",
    rating: 5,
    title: "",
    content: "",
    recommend: true,
  });
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [activeTab, setActiveTab] = useState("reviews");
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState("newest");
  const [filterRating, setFilterRating] = useState(null);
  const [filterMediaOnly, setFilterMediaOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeKeyword, setActiveKeyword] = useState(null);

  const fetchReviews = async (email, { silent = false } = {}) => {
    if (!silent) setLoading(true);
    try {
      const params = new URLSearchParams({ product_id: productId });
      if (email) params.set("voter_email", email);
      const res = await fetch(`/api/reviews?${params}`);
      const data = await res.json();
      setReviews(data.reviews || []);
    } catch {
      if (!silent) setReviews([]);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    if (productId) fetchReviews(userInfo?.email);
  }, [productId, userInfo?.email]);

  const avgRating =
    reviews.length > 0
      ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
      : 0;

  const starCounts = [5, 4, 3, 2, 1].map((s) => ({
    star: s,
    count: reviews.filter((r) => r.rating === s).length,
  }));

  const allMediaItems = reviews.flatMap((r) =>
    (r.media || []).map((m, idx) => ({ ...m, review: r, mediaIndex: idx })),
  );

  const reviewSummary = buildReviewSummary(reviews);

  const filteredReviews = reviews
    .filter((r) => {
      if (filterRating && r.rating !== filterRating) return false;
      if (filterMediaOnly && !(r.media?.length > 0)) return false;
      if (activeKeyword) {
        const text = `${r.title || ""} ${r.content || ""}`.toLowerCase();
        if (!text.includes(activeKeyword.toLowerCase())) return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const text =
          `${r.author_name} ${r.title || ""} ${r.content || ""}`.toLowerCase();
        if (!text.includes(q)) return false;
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "oldest")
        return new Date(a.created_at) - new Date(b.created_at);
      if (sortBy === "highest") return b.rating - a.rating;
      if (sortBy === "lowest") return a.rating - b.rating;
      if (sortBy === "helpful")
        return (b.helpful_count || 0) - (a.helpful_count || 0);
      return new Date(b.created_at) - new Date(a.created_at);
    });

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    const newFiles = [];
    files.forEach((file) => {
      if (file.type.startsWith("image/") && file.size > 1048576) {
        alert(`圖片「${file.name}」超過 1MB 限制！`);
        return;
      }
      if (file.type.startsWith("video/") && file.size > 15728640) {
        alert(`影片「${file.name}」超過 15MB 限制！`);
        return;
      }
      if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) {
        alert("僅支援圖片與影片格式！");
        return;
      }
      newFiles.push({ file, url: URL.createObjectURL(file), type: file.type });
    });
    setSelectedFiles((prev) => [...prev, ...newFiles]);
    e.target.value = "";
  };

  const removeFile = (idx) =>
    setSelectedFiles((prev) => prev.filter((_, i) => i !== idx));

  const uploadFilesToStorage = async (files) => {
    const urls = [];
    for (const f of files) {
      const ext = f.file.name.split(".").pop();
      const path = `${productId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage
        .from("review-media")
        .upload(path, f.file, { contentType: f.type, upsert: false });
      if (error) {
        console.error("上傳失敗:", error.message);
        continue;
      }
      const { data } = supabase.storage.from("review-media").getPublicUrl(path);
      if (data?.publicUrl) urls.push(data.publicUrl);
    }
    return urls;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.author_name || !form.content) return;
    setSubmitting(true);

    // 立即顯示（樂觀更新，使用本地預覽）
    const authorAvatar = userInfo?.avatar || null;

    const optimisticReview = {
      id: `opt-${Math.random()}`,
      product_id: productId,
      ...form,
      author_email: userInfo?.email || null,
      author_avatar: authorAvatar,
      helpful_count: 0,
      created_at: new Date().toISOString(),
      media: selectedFiles.map((f) => ({ type: f.type, url: f.url })),
      _optimistic: true,
    };
    setReviews((prev) => [optimisticReview, ...prev]);
    setShowForm(false);
    const savedForm = { ...form };
    const savedFiles = [...selectedFiles];
    setForm({
      author_name: "",
      rating: 5,
      title: "",
      content: "",
      recommend: true,
    });
    setSelectedFiles([]);

    try {
      // 上傳媒體到 Supabase Storage
      const mediaUrls =
        selectedFiles.length > 0 ? await uploadFilesToStorage(savedFiles) : [];

      const res = await fetch(`/api/reviews?product_id=${productId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...savedForm,
          author_email: userInfo?.email || null,
          author_avatar: authorAvatar,
          media_urls: mediaUrls,
        }),
      });
      if (res.ok) {
        setSubmitDone(true);
        await fetchReviews(userInfo?.email);
      } else {
        const err = await res.json();
        alert(
          `提交失敗：${err.error || "請確認 Supabase reviews 資料表已建立"}`,
        );
        setReviews((prev) => prev.filter((r) => !r._optimistic));
        setForm(savedForm);
        setSelectedFiles(savedFiles);
        setShowForm(true);
      }
    } catch {
      alert("網路錯誤，請稍後再試。");
      setReviews((prev) => prev.filter((r) => !r._optimistic));
      setForm(savedForm);
      setSelectedFiles(savedFiles);
      setShowForm(true);
    } finally {
      setSubmitting(false);
    }
  };

  const handleVote = async (id, action) => {
    if (userLoading) return;
    if (!userInfo?.email) {
      setShowLoginPrompt(true);
      return;
    }

    const target = reviews.find((r) => r.id === id);
    if (!target) return;

    const prevVote = target.my_vote;
    const isToggleOff = prevVote === action;
    let helpful = target.helpful_count || 0;
    let unhelpful = target.unhelpful_count || 0;

    if (isToggleOff) {
      if (action === "up") helpful = Math.max(0, helpful - 1);
      else unhelpful = Math.max(0, unhelpful - 1);
    } else {
      if (prevVote === "up") helpful = Math.max(0, helpful - 1);
      else if (prevVote === "down") unhelpful = Math.max(0, unhelpful - 1);
      if (action === "up") helpful += 1;
      else unhelpful += 1;
    }

    const nextVote = isToggleOff ? null : action;

    const snapshot = {
      helpful_count: target.helpful_count || 0,
      unhelpful_count: target.unhelpful_count || 0,
      my_vote: target.my_vote || null,
    };

    setReviews((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              helpful_count: helpful,
              unhelpful_count: unhelpful,
              my_vote: nextVote,
            }
          : r,
      ),
    );
    if (modalReview?.id === id) {
      setModalReview((prev) =>
        prev
          ? {
              ...prev,
              helpful_count: helpful,
              unhelpful_count: unhelpful,
              my_vote: nextVote,
            }
          : prev,
      );
    }

    try {
      const res = await fetch(`/api/reviews?product_id=${productId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          action,
          voter_email: userInfo.email,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        setReviews((prev) =>
          prev.map((r) => (r.id === id ? { ...r, ...snapshot } : r)),
        );
        if (modalReview?.id === id) {
          setModalReview((prev) => (prev ? { ...prev, ...snapshot } : prev));
        }
        alert(err.error || "投票失敗");
      } else {
        const data = await res.json();
        setReviews((prev) =>
          prev.map((r) =>
            r.id === id
              ? {
                  ...r,
                  helpful_count: data.helpful_count,
                  unhelpful_count: data.unhelpful_count,
                  my_vote: data.my_vote,
                }
              : r,
          ),
        );
        if (modalReview?.id === id) {
          setModalReview((prev) =>
            prev
              ? {
                  ...prev,
                  helpful_count: data.helpful_count,
                  unhelpful_count: data.unhelpful_count,
                  my_vote: data.my_vote,
                }
              : prev,
          );
        }
      }
    } catch {
      setReviews((prev) =>
        prev.map((r) => (r.id === id ? { ...r, ...snapshot } : r)),
      );
      if (modalReview?.id === id) {
        setModalReview((prev) => (prev ? { ...prev, ...snapshot } : prev));
      }
      alert("網路錯誤，請稍後再試。");
    }
  };

  // 開始編輯
  const handleEditStart = (review) => {
    setEditingReview(review);
    setEditForm({
      rating: review.rating,
      title: review.title || "",
      content: review.content,
      recommend: review.recommend,
    });
  };

  // 送出編輯
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editingReview || !userInfo?.email) return;
    setEditSubmitting(true);
    try {
      const res = await fetch(`/api/reviews?product_id=${productId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingReview.id,
          author_email: userInfo.email,
          ...editForm,
        }),
      });
      if (res.ok) {
        setEditingReview(null);
        await fetchReviews(userInfo?.email);
      } else {
        const err = await res.json();
        alert(`編輯失敗：${err.error}`);
      }
    } finally {
      setEditSubmitting(false);
    }
  };

  // 管理員刪除評論
  const handleDelete = async (id) => {
    if (!userInfo?.email) return;
    try {
      const res = await fetch(`/api/reviews?product_id=${productId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, admin_email: userInfo.email }),
      });
      if (res.ok) {
        setReviews((prev) => prev.filter((r) => r.id !== id));
      } else {
        const err = await res.json();
        alert(`刪除失敗：${err.error}`);
      }
    } catch {
      alert("網路錯誤，請稍後再試。");
    }
  };

  // 撰寫評論前先確認是否已登入
  const handleWriteReviewClick = () => {
    if (userLoading) return;
    if (!userInfo) {
      setShowLoginPrompt(true);
      return;
    }
    setForm((prev) => ({
      ...prev,
      author_name: prev.author_name || userInfo.name || "",
    }));
    setShowForm((v) => !v);
  };

  const goToLogin = () => {
    setShowLoginPrompt(false);
    router.push(`/login?redirect=${encodeURIComponent(router.asPath)}`);
  };

  const goToRegister = () => {
    setShowLoginPrompt(false);
    router.push(`/register?redirect=${encodeURIComponent(router.asPath)}`);
  };

  return (
    <div className="mt-20 border-t border-gray-200 pt-16 w-full relative">
      {/* 未登入提示 Popup */}
      <AnimatePresence>
        {showLoginPrompt && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm"
            onClick={() => setShowLoginPrompt(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white w-full max-w-md   p-8 shadow-2xl text-center"
            >
              <h3 className="text-xl font-bold text-black mb-2">
                尚未註冊或登入會員嗎？
              </h3>

              <p className="text-gray-400 text-xs mb-7">
                登入後即可分享你的使用心得
              </p>
              <div className="flex flex-col gap-3">
                <button
                  onClick={goToLogin}
                  className="w-full bg-[#3375d9] text-white py-3 rounded-full text-sm font-bold hover:bg-black transition-colors"
                >
                  登入會員
                </button>
                <button
                  onClick={goToRegister}
                  className="w-full border border-gray-300 text-gray-700 py-3 rounded-full text-sm font-bold hover:border-black hover:text-black transition-colors"
                >
                  立即註冊
                </button>
                <button
                  onClick={() => setShowLoginPrompt(false)}
                  className="text-sm text-gray-400 hover:text-gray-600 transition-colors py-1"
                >
                  稍後再說
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 媒體 Popup */}
      <AnimatePresence>
        {modalReview && (
          <ReviewModal
            review={modalReview}
            initialMediaIndex={modalMediaIndex}
            onClose={() => setModalReview(null)}
            onVote={handleVote}
          />
        )}
      </AnimatePresence>

      {/* ── 評分總覽 Header ── */}
      <div className="flex flex-col lg:flex-row gap-10 lg:gap-14 mb-10">
        {/* 左：星級統計 */}
        <div className="w-full lg:w-[28%]">
          <div className="flex items-center gap-3 mb-5">
            <span className="text-[42px] font-bold leading-none">
              {avgRating}
            </span>
            <div className="flex text-[#f5a623]">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  size={20}
                  fill={i < Math.round(avgRating) ? "#f5a623" : "none"}
                  className={
                    i < Math.round(avgRating)
                      ? "text-[#f5a623]"
                      : "text-gray-200"
                  }
                />
              ))}
            </div>
          </div>
          <div className="space-y-1.5">
            {starCounts.map(({ star, count }) => (
              <div
                key={star}
                className="flex items-center gap-2 text-sm text-gray-600"
              >
                <span className="w-3 text-right text-xs">{star}</span>
                <Star
                  size={10}
                  fill="#9ca3af"
                  className="text-gray-400 shrink-0"
                />
                <div className="flex-1 h-[6px] bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gray-500 rounded-full transition-all"
                    style={{
                      width: reviews.length
                        ? `${(count / reviews.length) * 100}%`
                        : "0%",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 中：關鍵字標籤 */}
        <div className="w-full lg:w-[32%]">
          <h4 className="text-sm font-bold text-black mb-3">球友最常提到</h4>
          <div className="flex flex-wrap gap-2">
            {REVIEW_KEYWORDS.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() =>
                  setActiveKeyword(activeKeyword === tag ? null : tag)
                }
                className={`px-4 py-1.5 border rounded-full text-xs font-bold transition-colors ${activeKeyword === tag ? "border-black bg-black text-white" : "border-gray-200 text-gray-600 hover:border-black"}`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* 右：使用者照片牆 */}
        <div className="w-full lg:flex-1">
          {allMediaItems.length > 0 && (
            <>
              <h4 className="text-sm font-bold text-black mb-3">球友實拍</h4>
              <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
                {allMediaItems.slice(0, 8).map((item, idx) => (
                  <div
                    key={idx}
                    onClick={() => {
                      setModalReview(item.review);
                      setModalMediaIndex(item.mediaIndex);
                    }}
                    className="w-[88px] h-[88px] shrink-0 bg-gray-100 rounded overflow-hidden relative cursor-pointer hover:opacity-80 transition-opacity border border-gray-200"
                  >
                    {item.type?.includes("video") ? (
                      <>
                        <video
                          src={item.url}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                          <PlayCircle size={20} className="text-white" />
                        </div>
                      </>
                    ) : (
                      <Image
                        src={item.url}
                        alt="User photo"
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── 評論摘要 ── */}
      {reviewSummary && (
        <div className="mb-10">
          <h4 className="text-sm font-bold flex items-center gap-2 mb-2 text-black">
            <Sparkles size={15} className="text-[#e31837]" /> 評論摘要
          </h4>
          <p className="text-sm text-gray-600 leading-relaxed max-w-5xl">
            {reviewSummary}
          </p>
        </div>
      )}

      {submitDone && (
        <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-4 py-3 mb-6">
          <CheckCircle2 size={16} /> 感謝你的評論，已成功提交！
        </div>
      )}

      {/* ── Tabs ── */}
      <div className="border-b border-gray-200 mb-6">
        <div className="flex gap-8">
          <button
            type="button"
            onClick={() => setActiveTab("reviews")}
            className={`pb-4 text-sm font-bold relative transition-colors ${activeTab === "reviews" ? "text-black" : "text-gray-400 hover:text-black"}`}
          >
            評論 ({reviews.length})
            {activeTab === "reviews" && (
              <span className="absolute bottom-0 left-0 w-full h-[2px] bg-black" />
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("questions")}
            className={`pb-4 text-sm font-bold relative transition-colors ${activeTab === "questions" ? "text-black" : "text-gray-400 hover:text-black"}`}
          >
            問題 (0)
            {activeTab === "questions" && (
              <span className="absolute bottom-0 left-0 w-full h-[2px] bg-black" />
            )}
          </button>
        </div>
      </div>

      {activeTab === "reviews" && (
        <>
          {/* ── 操作列 ── */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className="inline-flex items-center gap-2 bg-[#e31837] text-white px-5 py-2.5 text-sm font-bold hover:bg-black transition-colors w-fit"
            >
              <Filter size={15} /> 篩選
            </button>
            <button
              type="button"
              onClick={handleWriteReviewClick}
              className="inline-flex items-center gap-2 bg-[#e31837] text-white px-5 py-2.5 text-sm font-bold hover:bg-black transition-colors w-fit sm:ml-auto"
            >
              <Pencil size={15} /> 撰寫評論
            </button>
          </div>

          {/* ── 排序列 ── */}
          <div className="flex flex-wrap items-center gap-6 mb-6 text-sm font-bold text-gray-600">
            <div className="flex items-center gap-2">
              <span>排序</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="border border-gray-200 rounded px-2 py-1 text-sm font-medium outline-none focus:border-black bg-white"
              >
                <option value="newest">最新</option>
                <option value="oldest">最舊</option>
                <option value="highest">評分最高</option>
                <option value="lowest">評分最低</option>
                <option value="helpful">最有幫助</option>
              </select>
              <ChevronDown
                size={14}
                className="text-gray-400 -ml-5 pointer-events-none"
              />
            </div>
            <button
              type="button"
              onClick={() => setFilterMediaOnly(!filterMediaOnly)}
              className={`flex items-center gap-1 transition-colors ${filterMediaOnly ? "text-black" : "hover:text-black"}`}
            >
              照片與影片
              <ChevronDown
                size={14}
                className={`transition-transform ${filterMediaOnly ? "rotate-180" : ""}`}
              />
            </button>
          </div>

          {/* ── 篩選面板 ── */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden mb-8"
              >
                <div className="border border-gray-200 rounded-lg p-5 space-y-5 bg-[#fafafa]">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-2">
                      搜尋
                    </label>
                    <div className="relative">
                      <Search
                        size={16}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                      />
                      <input
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="搜尋評論內容..."
                        className="w-full border border-gray-300 rounded-lg pl-9 pr-4 py-2 text-sm outline-none focus:border-[#e31837] bg-white"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-2">
                      關鍵字
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {REVIEW_KEYWORDS.map((tag) => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() =>
                            setActiveKeyword(activeKeyword === tag ? null : tag)
                          }
                          className={`px-3 py-1 border rounded-full text-xs font-bold transition-colors ${activeKeyword === tag ? "border-black bg-black text-white" : "border-gray-300 text-gray-600 hover:border-black bg-white"}`}
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-2">
                      評分
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {[5, 4, 3, 2, 1].map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() =>
                            setFilterRating(filterRating === s ? null : s)
                          }
                          className={`flex items-center gap-1 px-3 py-1 border rounded-full text-xs font-bold transition-colors ${filterRating === s ? "border-black bg-black text-white" : "border-gray-300 text-gray-600 hover:border-black bg-white"}`}
                        >
                          {[...Array(s)].map((_, i) => (
                            <Star
                              key={i}
                              size={10}
                              fill={filterRating === s ? "#fff" : "#f5a623"}
                              className={
                                filterRating === s
                                  ? "text-white"
                                  : "text-[#f5a623]"
                              }
                            />
                          ))}
                        </button>
                      ))}
                    </div>
                  </div>
                  {(searchQuery ||
                    activeKeyword ||
                    filterRating ||
                    filterMediaOnly) && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery("");
                        setActiveKeyword(null);
                        setFilterRating(null);
                        setFilterMediaOnly(false);
                      }}
                      className="text-xs text-[#e31837] font-bold hover:underline"
                    >
                      清除所有篩選
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
      {/* 撰寫表單 */}
      <AnimatePresence>
        {showForm && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
            onSubmit={handleSubmit}
          >
            <div className="bg-[#fafafa] border border-gray-200 rounded-2xl p-6 md:p-8 mb-12 space-y-5">
              <h3 className="text-lg font-bold text-black">撰寫評論</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    暱稱 <span className="text-red-500">*</span>
                  </label>
                  {userInfo ? (
                    <div className="flex items-center gap-3 border border-gray-300 rounded-lg px-4 py-2.5 bg-white">
                      <ReviewAvatar
                        avatar={userInfo.avatar}
                        name={userInfo.name}
                        size={36}
                      />
                      <span className="text-sm font-medium text-black">
                        {form.author_name || userInfo.name}
                      </span>
                    </div>
                  ) : (
                    <input
                      required
                      value={form.author_name}
                      onChange={(e) =>
                        setForm({ ...form, author_name: e.target.value })
                      }
                      placeholder="請輸入你的暱稱"
                      className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-[#e31837] transition-colors"
                    />
                  )}
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    評分 <span className="text-red-500">*</span>
                  </label>
                  <StarSelector
                    value={form.rating}
                    onChange={(v) => setForm({ ...form, rating: v })}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  標題（選填）
                </label>
                <input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="用一句話總結你的體驗"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-[#e31837] transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  評論內容 <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={4}
                  value={form.content}
                  onChange={(e) =>
                    setForm({ ...form, content: e.target.value })
                  }
                  placeholder="分享你的使用心得、優缺點..."
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-[#e31837] transition-colors resize-none"
                />
              </div>

              {/* 媒體上傳 */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-2">
                  上傳照片／影片（圖片上限 1MB，影片上限 15MB）
                </label>
                <div className="flex flex-wrap gap-3">
                  {selectedFiles.map((f, idx) => (
                    <div
                      key={idx}
                      className="w-20 h-20 relative rounded-md overflow-hidden border border-gray-200 group"
                    >
                      {f.type.startsWith("video/") ? (
                        <div className="w-full h-full bg-black flex items-center justify-center">
                          <PlayCircle size={28} className="text-white" />
                        </div>
                      ) : (
                        <Image
                          src={f.url}
                          alt="preview"
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      )}
                      <button
                        type="button"
                        onClick={() => removeFile(idx)}
                        className="absolute top-0.5 right-0.5 bg-black/60 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                  {selectedFiles.length < 6 && (
                    <label className="w-20 h-20 border-2 border-dashed border-gray-300 hover:border-[#e31837] rounded-md flex flex-col items-center justify-center text-gray-400 hover:text-[#e31837] cursor-pointer transition-colors">
                      <UploadCloud size={22} />
                      <span className="text-[10px] font-bold mt-1">上傳</span>
                      <input
                        type="file"
                        accept="image/*,video/*"
                        multiple
                        className="hidden"
                        onChange={handleFileChange}
                      />
                    </label>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="recommend"
                  checked={form.recommend}
                  onChange={(e) =>
                    setForm({ ...form, recommend: e.target.checked })
                  }
                  className="w-4 h-4 accent-[#e31837]"
                />
                <label
                  htmlFor="recommend"
                  className="text-sm text-gray-700 font-medium cursor-pointer"
                >
                  我推薦這個商品
                </label>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="bg-[#e31837] text-white px-8 py-3 rounded-full text-sm font-bold hover:bg-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? "處理中..." : "送出評論"}
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* 編輯評論 Modal */}
      <AnimatePresence>
        {editingReview && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm"
            onClick={() => setEditingReview(null)}
          >
            <motion.form
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              onSubmit={handleEditSubmit}
              className="bg-white w-full max-w-lg  p-7 shadow-2xl space-y-5"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-black">編輯評論</h3>
                <button type="button" onClick={() => setEditingReview(null)}>
                  <X size={22} className="text-gray-400 hover:text-black" />
                </button>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  評分
                </label>
                <StarSelector
                  value={editForm.rating}
                  onChange={(v) => setEditForm({ ...editForm, rating: v })}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  標題（選填）
                </label>
                <input
                  value={editForm.title}
                  onChange={(e) =>
                    setEditForm({ ...editForm, title: e.target.value })
                  }
                  placeholder="用一句話總結你的體驗"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-[#e31837] transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  評論內容 <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={4}
                  value={editForm.content}
                  onChange={(e) =>
                    setEditForm({ ...editForm, content: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-[#e31837] transition-colors resize-none"
                />
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="edit-recommend"
                  checked={editForm.recommend}
                  onChange={(e) =>
                    setEditForm({ ...editForm, recommend: e.target.checked })
                  }
                  className="w-4 h-4 accent-[#e31837]"
                />
                <label
                  htmlFor="edit-recommend"
                  className="text-sm text-gray-700 font-medium cursor-pointer"
                >
                  我推薦這個商品
                </label>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingReview(null)}
                  className="flex-1 border border-gray-300 text-gray-600 py-3 rounded-full text-sm font-bold hover:bg-gray-50 transition-colors"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={editSubmitting}
                  className="flex-1 bg-[#187ee3] text-white py-3 rounded-full text-sm font-bold hover:bg-black transition-colors disabled:opacity-50"
                >
                  {editSubmitting ? "更新中..." : "儲存變更"}
                </button>
              </div>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 評論列表 */}
      {activeTab === "questions" ? (
        <div className="text-center py-16 border border-dashed border-gray-200 rounded-lg">
          <MessageSquare size={32} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 font-medium">目前還沒有問題</p>
          <p className="text-sm text-gray-400 mt-1">
            對商品有疑問？歡迎先登入後提問。
          </p>
        </div>
      ) : loading ? (
        <div className="text-center py-16 text-gray-400 text-sm">
          載入評論中...
        </div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-gray-200 rounded-lg">
          <MessageSquare size={32} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 font-medium">目前還沒有評論</p>
          <p className="text-sm text-gray-400 mt-1">成為第一個分享心得的人！</p>
        </div>
      ) : filteredReviews.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-gray-200 rounded-lg">
          <Filter size={32} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 font-medium">沒有符合篩選條件的評論</p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery("");
              setActiveKeyword(null);
              setFilterRating(null);
              setFilterMediaOnly(false);
            }}
            className="text-sm text-[#e31837] font-bold mt-2 hover:underline"
          >
            清除篩選
          </button>
        </div>
      ) : (
        <div>
          {filteredReviews.map((r) => (
            <ReviewCard
              key={r.id}
              review={r}
              productTitle={productTitle}
              productThumbnail={productThumbnail}
              onVote={handleVote}
              isOwner={!!(userInfo?.email && r.author_email === userInfo.email)}
              onEdit={handleEditStart}
              onOpenModal={(review, index) => {
                setModalReview(review);
                setModalMediaIndex(index);
              }}
              isAdmin={isAdmin}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// ─── 主頁面元件 ───────────────────────────────────────────────
export default function ProductDetail({ product }) {
  const router = useRouter();
  const { addToCart } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [thumbsSwiper, setThumbsSwiper] = useState(null);
  const [isZoomEnabled, setIsZoomEnabled] = useState(false);
  const [cursorPos, setCursorPos] = useState({ x: 50, y: 50 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e) => {
    if (!isZoomEnabled) return;
    const { left, top, width, height } =
      e.currentTarget.getBoundingClientRect();
    setCursorPos({
      x: ((e.clientX - left) / width) * 100,
      y: ((e.clientY - top) / height) * 100,
    });
  };

  if (router.isFallback || !product) {
    return (
      <div className="min-h-screen flex items-center justify-center font-bold tracking-widest uppercase text-gray-500">
        載入中...
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>{product.title} | PikFun</title>
        <meta
          name="description"
          content={product.description?.substring(0, 160) || product.title}
        />
      </Head>

      <main className="bg-white text-black min-h-screen product-detail-page">
        <div className="max-w-[1440px] mx-auto">
          <div className="flex flex-col lg:flex-row lg:items-start">
            {/* 左側：圖片區 — sticky、主圖高度 = 視窗 - navbar */}
            <div className="product-gallery-sticky w-full lg:w-[58%] shrink-0">
              <div className="product-gallery-inner flex gap-2 md:gap-3 w-full min-h-[50vh] lg:min-h-0">
                {/* 小圖：主圖左側直向排列 */}
                <Swiper
                  onSwiper={setThumbsSwiper}
                  direction="vertical"
                  spaceBetween={8}
                  slidesPerView={4}
                  freeMode={true}
                  watchSlidesProgress={true}
                  modules={[FreeMode, Thumbs]}
                  className="w-24 sm:w-28 md:w-32 lg:w-36 h-full shrink-0 product-thumb-swiper-vertical"
                >
                  {product.images?.map((img, idx) => (
                    <SwiperSlide
                      key={idx}
                      className="cursor-pointer opacity-50 [&.swiper-slide-thumb-active]:opacity-100 rounded-sm overflow-hidden"
                    >
                      <div className="relative w-full h-full bg-gray-50">
                        <Image
                          src={img}
                          alt={`${product.title} 縮圖 ${idx + 1}`}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      </div>
                    </SwiperSlide>
                  ))}
                </Swiper>

                {/* 主圖 */}
                <div className="flex-1 min-w-0 h-full relative">
                  <button
                    onClick={() => setIsZoomEnabled(!isZoomEnabled)}
                    className={`absolute top-4 right-4 z-20 p-2.5 rounded-full shadow-md transition-all duration-300 ${isZoomEnabled ? "bg-[#e31837] text-white" : "bg-white/90 backdrop-blur-sm text-gray-700 hover:bg-white"}`}
                    title={isZoomEnabled ? "關閉放大鏡" : "開啟放大鏡"}
                  >
                    {isZoomEnabled ? (
                      <ZoomOut size={20} />
                    ) : (
                      <ZoomIn size={20} />
                    )}
                  </button>

                  <Swiper
                    spaceBetween={10}
                    navigation={true}
                    thumbs={{
                      swiper:
                        thumbsSwiper && !thumbsSwiper.destroyed
                          ? thumbsSwiper
                          : null,
                    }}
                    modules={[FreeMode, Navigation, Thumbs]}
                    className="w-full h-full bg-gray-50"
                  >
                    {product.images?.map((img, idx) => (
                      <SwiperSlide key={idx}>
                        <div
                          className={`relative w-full h-full overflow-hidden ${isZoomEnabled ? "cursor-crosshair" : "cursor-default"}`}
                          onMouseEnter={() =>
                            isZoomEnabled && setIsHovered(true)
                          }
                          onMouseLeave={() => {
                            setIsHovered(false);
                            setCursorPos({ x: 50, y: 50 });
                          }}
                          onMouseMove={handleMouseMove}
                        >
                          <Image
                            src={img}
                            alt={product.title}
                            fill
                            className="object-cover transition-transform duration-200 ease-out"
                            style={{
                              transform:
                                isHovered && isZoomEnabled
                                  ? "scale(2.5)"
                                  : "scale(1)",
                              transformOrigin: `${cursorPos.x}% ${cursorPos.y}%`,
                            }}
                            priority={idx === 0}
                            unoptimized
                          />
                        </div>
                      </SwiperSlide>
                    ))}
                  </Swiper>
                </div>
              </div>

              {/* 麵包屑（手機：圖下方） */}
              <nav
                className="lg:hidden px-6 py-4 border-t border-gray-100 text-[12px] text-gray-400 tracking-wide flex flex-wrap items-center gap-x-1.5 gap-y-1"
                aria-label="麵包屑"
              >
                <Link href="/" className="hover:text-black transition-colors">
                  首頁
                </Link>
                <span className="text-gray-300" aria-hidden>
                  /
                </span>
                <Link
                  href="/category/all"
                  className="hover:text-black transition-colors"
                >
                  商品
                </Link>
                {product.collectionHandle && product.brand && (
                  <>
                    <span className="text-gray-300" aria-hidden>
                      /
                    </span>
                    <Link
                      href={`/category/${product.collectionHandle}`}
                      className="hover:text-black transition-colors"
                    >
                      {product.brand}
                    </Link>
                  </>
                )}
                <span className="text-gray-300" aria-hidden>
                  /
                </span>
                <span className="text-gray-600 line-clamp-1">
                  {product.title}
                </span>
              </nav>
            </div>

            {/* 右側：商品資訊（可捲動） */}
            <div className="w-full lg:w-[42%] lg:flex-1 px-6 md:px-8 lg:px-10 py-8 lg:py-10 pb-10 min-w-0">
              {/* 麵包屑（桌面：右欄上方） */}
              <nav
                className="hidden lg:flex mb-6 pb-4 border-b border-gray-100 text-[13px] text-gray-400 tracking-wide flex-wrap items-center gap-x-1.5 gap-y-1"
                aria-label="麵包屑"
              >
                <Link href="/" className="hover:text-black transition-colors">
                  首頁
                </Link>
                <span className="text-gray-300" aria-hidden>
                  /
                </span>
                <Link
                  href="/category/all"
                  className="hover:text-black transition-colors"
                >
                  商品
                </Link>
                {product.collectionHandle && product.brand && (
                  <>
                    <span className="text-gray-300" aria-hidden>
                      /
                    </span>
                    <Link
                      href={`/category/${product.collectionHandle}`}
                      className="hover:text-black transition-colors"
                    >
                      {product.brand}
                    </Link>
                  </>
                )}
                <span className="text-gray-300" aria-hidden>
                  /
                </span>
                <span className="text-gray-600 line-clamp-1">
                  {product.title}
                </span>
              </nav>
              <div className="mb-6 border-b border-gray-100 pb-6">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                  {product.brand}
                </span>
                <h1 className="text-2xl lg:text-3xl leading-[1.3] tracking-wide font-medium mt-1 mb-3">
                  {product.title}
                </h1>
                <p className="text-2xl font-bold tracking-tight text-black">
                  {product.price}
                </p>
                {product.weight > 0 && (
                  <p className="text-xs text-gray-400 mt-2">
                    重量：{product.weight}g
                  </p>
                )}
              </div>

              {/* 數量 + 加入購物車 */}
              <div className="mb-8 space-y-4">
                <div className="flex gap-4">
                  <div className="flex border border-gray-300 w-28 justify-between items-center px-3">
                    <button
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      className="py-3 px-2 text-gray-400"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="text-sm font-bold">{quantity}</span>
                    <button
                      onClick={() => setQuantity((q) => q + 1)}
                      className="py-3 px-2 text-gray-400"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                  <button
                    onClick={() => addToCart(product, quantity)}
                    className="flex-1 bg-[#e31837] text-white py-4 text-xs font-bold uppercase tracking-[0.2em] hover:bg-black transition-all active:scale-95"
                  >
                    加入購物車
                  </button>
                </div>
              </div>

              <div className="border-t border-gray-200">
                <GenericAccordion
                  title="商品詳情"
                  icon={ShieldCheck}
                  isOpenDefault={true}
                >
                  {product.description}
                </GenericAccordion>
                <GenericAccordion title="付款方式" icon={CheckCircle2}>
                  {product.paymentInfo}
                </GenericAccordion>
                <GenericAccordion title="配送說明" icon={Truck}>
                  {product.shippingInfo}
                </GenericAccordion>
                <GenericAccordion title="常見問題" icon={RefreshCcw}>
                  {product.faqInfo}
                </GenericAccordion>
              </div>
            </div>
          </div>

          {/* 評論區 */}
          <div className="px-6 md:px-8 lg:px-10">
            <ProductReviews
              productId={product.id}
              productTitle={product.title}
              productThumbnail={product.thumbnail}
            />
          </div>
        </div>
      </main>
    </>
  );
}

// ─── getStaticPaths ───────────────────────────────────────────
const BACKEND_URL =
  process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000";
const API_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || "";

export async function getStaticPaths() {
  try {
    const res = await fetch(
      `${BACKEND_URL}/store/products?limit=200&fields=handle`,
      {
        headers: { "x-publishable-api-key": API_KEY },
      },
    );
    const data = await res.json();
    const paths = (data.products || []).map((p) => ({
      params: { slug: p.handle },
    }));
    return { paths, fallback: "blocking" };
  } catch {
    return { paths: [], fallback: "blocking" };
  }
}

// ─── getStaticProps ───────────────────────────────────────────
export async function getStaticProps({ params }) {
  const { slug } = params;

  try {
    const res = await fetch(
      `${BACKEND_URL}/store/products?handle=${slug}&fields=id,handle,title,description,thumbnail,weight,metadata,*images,*collection,*variants,*variants.prices`,
      {
        headers: {
          "x-publishable-api-key": API_KEY,
          "Content-Type": "application/json",
        },
        cache: "no-store",
      },
    );
    const data = await res.json();
    const raw = data.products?.[0];
    if (!raw) return { notFound: true };

    const variantPrices = raw.variants?.[0]?.prices || [];
    const priceObj =
      variantPrices.find((p) => p.currency_code?.toLowerCase() === "twd") ||
      variantPrices[0];
    let amount = priceObj
      ? priceObj.amount > 1000000
        ? priceObj.amount / 100
        : priceObj.amount
      : 0;

    const product = {
      id: raw.id || "",
      slug: raw.handle || slug,
      title: raw.metadata?.title_zh || raw.title || "",
      description: raw.metadata?.desc_zh || raw.description || "",
      price: `NT$ ${Math.round(amount).toLocaleString()}`,
      rawPrice: amount,
      currency: "TWD",
      sku: raw.variants?.[0]?.sku || "",
      variantId: raw.variants?.[0]?.id || null,
      brand: raw.collection?.title || "PikFun",
      collectionHandle: raw.collection?.handle || null,
      weight: raw.variants?.[0]?.weight || raw.weight || 0,
      thumbnail: raw.thumbnail || raw.images?.[0]?.url || "",
      images:
        raw.images?.map((img) => img.url || img) ||
        [raw.thumbnail].filter(Boolean),
      inStock: raw.variants?.some((v) => v.inventory_quantity > 0) ?? true,
      paymentInfo: raw.metadata?.payment_zh || "",
      shippingInfo: raw.metadata?.shipping_zh || "",
      faqInfo: raw.metadata?.faq_zh || "",
      specs: { rank: raw.metadata?.rank || "" },
    };

    return { props: { product }, revalidate: 60 };
  } catch (e) {
    console.error("getStaticProps error:", e);
    return { notFound: true };
  }
}
