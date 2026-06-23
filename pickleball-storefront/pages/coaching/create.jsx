"use client";

import { useState, useEffect } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { motion } from "framer-motion";
import Image from "next/image";
import { ArrowLeft, Loader2, ChevronRight, Upload, X } from "lucide-react";
import { useUser } from "@/components/context/UserContext";
import {
  SKILL_LABELS,
  CLASS_TYPE_LABELS,
  PAYMENT_METHODS,
} from "@/lib/coachUtils";
import CourtPicker from "@/components/play/CourtPicker";

const CLASS_TYPE_OPTIONS = Object.entries(CLASS_TYPE_LABELS).map(
  ([value, label]) => ({ value, label }),
);

const SKILL_OPTIONS = Object.entries(SKILL_LABELS).map(([value, label]) => ({
  value,
  label,
}));

const STUDENT_OPTIONS = [1, 2, 4, 6, 8, 10, 12, 16];

function toLocalDatetimeValue(date) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export default function CreateCoachingPage() {
  const router = useRouter();
  const { userInfo, loading: userLoading } = useUser();
  const [submitting, setSubmitting] = useState(false);
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState("");
  const [uploadingCover, setUploadingCover] = useState(false);
  const [coachCheckLoading, setCoachCheckLoading] = useState(true);
  const [isApprovedCoach, setIsApprovedCoach] = useState(false);

  const defaultStart = new Date();
  defaultStart.setHours(defaultStart.getHours() + 24, 0, 0, 0);

  const defaultEnd = new Date(defaultStart);
  defaultEnd.setHours(defaultEnd.getHours() + 2);

  const [form, setForm] = useState({
    title: "",
    description: "",
    curriculum: "",
    class_type: "group",
    skill_level: "all",
    location_name: "",
    location_address: "",
    starts_at: toLocalDatetimeValue(defaultStart),
    ends_at: toLocalDatetimeValue(defaultEnd),
    max_students: 4,
    price_per_person: 0,
    payment_method: "free",
    payment_note: "",
    coach_bio: "",
  });

  useEffect(() => {
    if (!userLoading && !userInfo) {
      router.push("/login?redirect=/coaching/create");
    }
  }, [userLoading, userInfo, router]);

  useEffect(() => {
    if (userLoading || !userInfo?.email) return;
    const params = new URLSearchParams({ email: userInfo.email });
    if (userInfo.id) params.set("member_id", userInfo.id);
    fetch(`/api/member/coaching?${params}`)
      .then((r) => r.json())
      .then((d) => {
        const approved =
          d.application?.status === "approved" || d.isFeaturedCoach;
        setIsApprovedCoach(approved);
      })
      .catch(() => setIsApprovedCoach(false))
      .finally(() => setCoachCheckLoading(false));
  }, [userLoading, userInfo]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => {
      const next = { ...prev, [name]: value };
      if (name === "price_per_person") {
        const price = Number(value) || 0;
        if (price === 0) next.payment_method = "free";
        else if (prev.payment_method === "free") next.payment_method = "cash";
      }
      if (name === "payment_method" && value === "free") {
        next.price_per_person = 0;
      }
      return next;
    });
  };

  const showPaymentNote = ["transfer", "line_pay", "other"].includes(
    form.payment_method,
  );

  const handleCoverChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("請上傳圖片格式（JPG、PNG、WebP、GIF）");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      alert("圖片超過 2MB 限制");
      return;
    }

    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
    e.target.value = "";
  };

  const removeCover = () => {
    setCoverFile(null);
    if (coverPreview) URL.revokeObjectURL(coverPreview);
    setCoverPreview("");
  };

  const uploadCover = async (file) => {
    const base64 = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    const res = await fetch("/api/coach-classes/upload-cover", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        imageBase64: base64,
        fileName: file.name,
        contentType: file.type,
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "封面上傳失敗");
    return data.url;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!userInfo?.email) return;

    if (!form.location_name?.trim() || !form.location_address?.trim()) {
      alert("請選擇球場或填寫完整地址");
      return;
    }

    setSubmitting(true);
    try {
      let coverImageUrl = null;
      if (coverFile) {
        setUploadingCover(true);
        try {
          coverImageUrl = await uploadCover(coverFile);
        } finally {
          setUploadingCover(false);
        }
      }

      const res = await fetch("/api/coach-classes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          starts_at: new Date(form.starts_at).toISOString(),
          ends_at: form.ends_at ? new Date(form.ends_at).toISOString() : null,
          max_students: Number(form.max_students),
          price_per_person: Number(form.price_per_person) || 0,
          payment_method: form.payment_method,
          payment_note: form.payment_note || null,
          cover_image: coverImageUrl,
          coach_email: userInfo.email,
          coach_name: userInfo.name || "教練",
          coach_avatar: userInfo.avatar || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "開課失敗");
        return;
      }
      router.push(`/coaching/${data.class.id}`);
    } catch (err) {
      alert(err.message || "網路錯誤，請稍後再試");
    } finally {
      setSubmitting(false);
    }
  };

  if (userLoading || !userInfo || coachCheckLoading) {
    return (
      <main className="min-h-screen pt-24 flex items-center justify-center text-gray-500 bg-[#E8E8E3]">
        <Loader2 className="animate-spin mr-2" size={20} /> 載入中...
      </main>
    );
  }

  if (!isApprovedCoach) {
    return (
      <>
        <Head>
          <title>我要開課 | PikFun</title>
        </Head>
        <main className="min-h-screen pt-24 pb-20 bg-[#E8E8E3] flex items-center justify-center px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl border border-gray-200 p-8 max-w-md w-full text-center shadow-sm"
          >
            <div className="w-16 h-16 bg-[#eef5fb] rounded-full flex items-center justify-center mx-auto mb-5">
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#005caf"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>
            <h2 className="text-xl font-black text-black mb-2">
              需要先通過進駐審核
            </h2>
            <p className="text-gray-500 text-sm leading-relaxed mb-6">
              開課功能僅限已通過進駐審核的教練使用。
              <br />
              請先申請成為著場教練，審核通過後即可開課。
            </p>
            <div className="space-y-3">
              <Link
                href="/coaching/apply"
                className="block w-full bg-[#005caf] hover:bg-[#1a3a8a] text-white font-bold py-3 px-6 rounded-xl transition-colors text-sm"
              >
                申請進駐教練
              </Link>
              <Link
                href="/coaching"
                className="block w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 px-6 rounded-xl transition-colors text-sm"
              >
                瀏覽課程列表
              </Link>
            </div>
          </motion.div>
        </main>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>我要開課 | PikFun</title>
      </Head>

      <main className="bg-[#E8E8E3] min-h-screen pt-24 pb-20">
        <div className="max-w-[680px] mx-auto px-6 md:px-10">
          <Link
            href="/coaching"
            className="inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-black mb-8 transition-colors"
          >
            <ArrowLeft size={16} /> 返回課程列表
          </Link>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <p className="text-[10px] font-black tracking-widest text-gray-500 uppercase mb-2">
              Open a Class
            </p>
            <h1 className="text-3xl font-black text-black mb-2">我要開課</h1>
            <p className="text-gray-600 text-sm mb-8">
              參考 Pickleheads Clinics
              與國內教練開課模式，設定課程內容、時間與費用，讓學員輕鬆找到你。
            </p>

            <form
              onSubmit={handleSubmit}
              className="bg-white rounded-lg border border-gray-200 p-6 md:p-8 space-y-5"
            >
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1.5">
                  課程名稱 *
                </label>
                <input
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  required
                  placeholder="例：週末初學者雙打入門班"
                  className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-black transition-colors"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1.5">
                    課程類型 *
                  </label>
                  <select
                    name="class_type"
                    value={form.class_type}
                    onChange={handleChange}
                    className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-black bg-white"
                  >
                    {CLASS_TYPE_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1.5">
                    適合程度
                  </label>
                  <select
                    name="skill_level"
                    value={form.skill_level}
                    onChange={handleChange}
                    className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-black bg-white"
                  >
                    {SKILL_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1.5">
                  課程介紹
                </label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  rows={3}
                  placeholder="課程目標、適合對象、注意事項..."
                  className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-black resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1.5">
                  課程內容 / 教學大綱
                </label>
                <textarea
                  name="curriculum"
                  value={form.curriculum}
                  onChange={handleChange}
                  rows={4}
                  placeholder="例：暖身 → 握拍與站位 → 正手練習 → 對打..."
                  className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-black resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1.5">
                  教練簡介
                </label>
                <textarea
                  name="coach_bio"
                  value={form.coach_bio}
                  onChange={handleChange}
                  rows={2}
                  placeholder="教學經歷、證照、專長..."
                  className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-black resize-none"
                />
              </div>

              <CourtPicker
                locationName={form.location_name}
                locationAddress={form.location_address}
                onSelect={({ location_name, location_address }) =>
                  setForm((prev) => ({
                    ...prev,
                    location_name,
                    location_address,
                  }))
                }
                onManualChange={handleChange}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1.5">
                    開始時間 *
                  </label>
                  <input
                    type="datetime-local"
                    name="starts_at"
                    value={form.starts_at}
                    onChange={handleChange}
                    required
                    className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-black"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1.5">
                    結束時間
                  </label>
                  <input
                    type="datetime-local"
                    name="ends_at"
                    value={form.ends_at}
                    onChange={handleChange}
                    className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-black"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1.5">
                    名額上限
                  </label>
                  <select
                    name="max_students"
                    value={form.max_students}
                    onChange={handleChange}
                    className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-black bg-white"
                  >
                    {STUDENT_OPTIONS.map((n) => (
                      <option key={n} value={n}>
                        {n} 人{n === 1 ? "（私人課）" : ""}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1.5">
                    每人費用 (NT$)
                  </label>
                  <input
                    type="number"
                    name="price_per_person"
                    value={form.price_per_person}
                    onChange={handleChange}
                    min={0}
                    step={50}
                    className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-black"
                  />
                </div>
              </div>

              {Number(form.price_per_person) > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1.5">
                      付款方式
                    </label>
                    <select
                      name="payment_method"
                      value={form.payment_method}
                      onChange={handleChange}
                      className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-black bg-white"
                    >
                      {PAYMENT_METHODS.filter((m) => m.value !== "free").map(
                        (m) => (
                          <option key={m.value} value={m.value}>
                            {m.label}
                          </option>
                        ),
                      )}
                    </select>
                  </div>
                  {showPaymentNote && (
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1.5">
                        付款說明
                      </label>
                      <input
                        name="payment_note"
                        value={form.payment_note}
                        onChange={handleChange}
                        placeholder="帳號末四碼、LINE ID 等"
                        className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-black"
                      />
                    </div>
                  )}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1.5">
                  封面圖片（選填，上限 2MB）
                </label>
                <div className="flex flex-wrap gap-3">
                  {coverPreview ? (
                    <div className="relative w-full max-w-xs aspect-[4/3] rounded-lg overflow-hidden border border-gray-200 group">
                      <Image
                        src={coverPreview}
                        alt="封面預覽"
                        fill
                        className="object-cover"
                        unoptimized
                      />
                      <button
                        type="button"
                        onClick={removeCover}
                        className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <label className="w-full max-w-xs aspect-[4/3] border-2 border-dashed border-gray-300 hover:border-black rounded-lg flex flex-col items-center justify-center text-gray-400 hover:text-black cursor-pointer transition-colors">
                      <Upload size={28} className="mb-2" />
                      <span className="text-xs font-bold">點擊上傳封面</span>
                      <span className="text-[10px] mt-1 text-gray-400">
                        JPG / PNG / WebP / GIF
                      </span>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        onChange={handleCoverChange}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting || uploadingCover}
                className="w-full flex items-center justify-center gap-2 bg-black hover:bg-gray-800 text-white font-black py-4 rounded-md transition-colors disabled:opacity-50 mt-2"
              >
                {submitting || uploadingCover ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    {uploadingCover ? "上傳封面中..." : "發布中..."}
                  </>
                ) : (
                  <>
                    發布課程
                    <ChevronRight size={18} />
                  </>
                )}
              </button>
            </form>
          </motion.div>
        </div>
      </main>
    </>
  );
}
