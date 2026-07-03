"use client";

import { useState, useEffect, useRef } from "react";
import Head from "next/head";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/router";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Loader2,
  ChevronRight,
  Upload,
  X,
  CheckCircle,
  Clock,
  ExternalLink,
  Pencil,
  Plus,
  GraduationCap,
  AlertCircle,
  BadgeCheck,
} from "lucide-react";
import { useUser } from "@/components/context/UserContext";
import {
  COACH_REGIONS,
  CREDENTIAL_PRESETS,
  SPECIALTY_PRESETS,
  TAG_PRESETS,
  slugify,
  sanitizeSlugInput,
  isValidSlug,
  isValidSlugDraft,
  slugifyFromName,
  linesToArray,
  commaToArray,
} from "@/lib/coachProfileFields";
import TagPickerField from "@/components/coaching/TagPickerField";
import ConfettiButton from "@/components/ui/ConfettiButton";

const emptyForm = {
  slug: "",
  name: "",
  title: "",
  subtitle: "",
  city: "",
  region: "北部",
  excerpt: "",
  bio: "",
  story: "",
  credentials: "",
  specialties: "",
  tags: "",
  video_url: "",
  featured_label: "",
  contact_email: "",
  instagram: "",
  avatar: "",
};

function formatReviewDate(iso) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString("zh-TW", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function ApprovedCoachView({ coachProfile, application, stats }) {
  const slug = coachProfile?.slug || application?.slug;
  const reviewedAt = application?.reviewed_at;

  return (
    <>
      <Head>
        <title>教練進駐已通過 | PikFun</title>
      </Head>
      <main className="bg-[#E8E8E3] min-h-screen pt-24 pb-20">
        <div className="max-w-[640px] mx-auto px-6 md:px-10">
          <Link
            href="/member?tab=coaching"
            className="inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-black mb-8"
          >
            <ArrowLeft size={16} /> 返回會員中心
          </Link>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm"
          >
            {/* 頂部狀態列 */}
            <div className="bg-gradient-to-r from-[#005caf] to-[#1a3a8a] px-6 py-5 text-white">
              <div className="flex items-center gap-2 mb-1">
                <BadgeCheck size={20} className="text-[#c8f542]" />
                <span className="text-xs font-bold tracking-widest uppercase text-white/80">
                  Approved Coach
                </span>
              </div>
              <h1 className="text-2xl font-black">教練進駐已審核通過</h1>
              <p className="text-sm text-white/75 mt-1">
                您的教練頁已上架 PikFun 官網，球友可以搜尋並報名您的課程。
              </p>
              {reviewedAt && (
                <p className="text-xs text-white/50 mt-2">
                  審核通過日期：{formatReviewDate(reviewedAt)}
                </p>
              )}
            </div>

            {/* 教練資訊 */}
            <div className="px-6 py-6 border-b border-gray-100">
              <div className="flex items-start gap-4">
                {coachProfile?.avatar ? (
                  <img
                    src={coachProfile.avatar}
                    alt={coachProfile.name}
                    className="w-16 h-16 rounded-full object-cover border-2 border-white shadow shrink-0"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-[#005caf]/10 text-[#005caf] flex items-center justify-center font-black text-xl shrink-0">
                    {coachProfile?.name?.charAt(0) || "教"}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-green-100 text-green-800 text-[10px] font-bold mb-2">
                    <CheckCircle size={11} /> 已通過審核
                  </span>
                  <h2 className="text-xl font-black text-black leading-tight">
                    {coachProfile?.name || application?.name}
                  </h2>
                  {coachProfile?.title && (
                    <p className="text-sm text-gray-500 mt-0.5">
                      {coachProfile.title}
                    </p>
                  )}
                  {coachProfile?.excerpt && (
                    <p className="text-xs text-gray-600 mt-2 line-clamp-2 leading-relaxed">
                      {coachProfile.excerpt}
                    </p>
                  )}
                  {slug && (
                    <p className="text-[10px] text-gray-400 mt-2 font-mono">
                      pikfun.com.tw/coaching/coach/{slug}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* 數據概覽 */}
            {stats && (
              <div className="grid grid-cols-3 divide-x divide-gray-100 border-b border-gray-100">
                {[
                  { label: "即將開課", value: stats.upcomingCount ?? 0 },
                  { label: "累計開課", value: stats.totalClasses ?? 0 },
                  { label: "報名人次", value: stats.totalEnrollments ?? 0 },
                ].map(({ label, value }) => (
                  <div key={label} className="py-4 text-center">
                    <p className="text-2xl font-black text-black">{value}</p>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">
                      {label}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* 操作按鈕 */}
            <div className="px-6 py-6 space-y-3">
              {slug && (
                <Link
                  href={`/coaching/coach/${slug}`}
                  className="w-full flex items-center justify-center gap-2 bg-black text-white font-bold py-3.5 rounded-xl hover:bg-gray-800 transition-colors"
                >
                  <ExternalLink size={16} />
                  查看我的教練頁
                </Link>
              )}
              <div className="grid grid-cols-2 gap-3">
                {slug && (
                  <Link
                    href={`/coaching/coach/${slug}/edit`}
                    className="flex items-center justify-center gap-2 border border-gray-200 text-gray-800 font-bold py-3 rounded-xl hover:border-gray-400 transition-colors text-sm"
                  >
                    <Pencil size={15} />
                    編輯教練頁
                  </Link>
                )}
                <Link
                  href="/coaching/create"
                  className="flex items-center justify-center gap-2 border border-[#005caf] text-[#005caf] font-bold py-3 rounded-xl hover:bg-[#005caf]/5 transition-colors text-sm"
                >
                  <Plus size={15} />
                  開新課程
                </Link>
              </div>
              <Link
                href="/member?tab=coaching"
                className="w-full flex items-center justify-center gap-2 text-sm text-gray-500 hover:text-gray-800 py-2 transition-colors"
              >
                <GraduationCap size={15} />
                前往教練中心
              </Link>
            </div>
          </motion.div>

          <p className="text-center text-xs text-gray-400 mt-6 leading-relaxed">
            如需修改教練資料，請至「編輯教練頁」更新。
            <br />
            如有問題請聯絡 PikFun 客服。
          </p>
        </div>
      </main>
    </>
  );
}

function applicationToForm(app) {
  if (!app) return emptyForm;
  return {
    slug: app.slug || "",
    name: app.name || "",
    title: app.title || "",
    subtitle: app.subtitle || "",
    city: app.city || "",
    region: app.region || "北部",
    excerpt: app.excerpt || "",
    bio: app.bio || "",
    story: app.story || "",
    credentials: Array.isArray(app.credentials)
      ? app.credentials.join("\n")
      : app.credentials || "",
    specialties: Array.isArray(app.specialties)
      ? app.specialties.join("\n")
      : app.specialties || "",
    tags: Array.isArray(app.tags) ? app.tags.join("、") : app.tags || "",
    video_url: app.video_url || "",
    featured_label: app.featured_label || "",
    contact_email: app.contact_email || "",
    instagram: app.instagram || "",
    avatar: app.avatar || "",
  };
}

function PendingApplicationView({ application, onEdit }) {
  return (
    <>
      <Head>
        <title>申請審核中 | PikFun</title>
      </Head>
      <main className="bg-[#E8E8E3] min-h-screen pt-24 pb-20">
        <div className="max-w-lg mx-auto px-6 text-center">
          <Clock size={48} className="text-[#FFD43A] mx-auto mb-4" />
          <h1 className="text-2xl font-black mb-2">申請審核中</h1>
          <p className="text-gray-600 text-sm mb-2 leading-relaxed">
            我們已收到您的進駐申請，將於 3–5 個工作天內完成審核。
            <br />
            核准後會出現在「進駐教練」區塊，並以 Email 通知您。
          </p>
          {application?.created_at && (
            <p className="text-xs text-gray-400 mb-6">
              申請時間：{formatReviewDate(application.created_at)}
            </p>
          )}
          <div className="bg-white rounded-2xl border border-gray-200 p-5 text-left mb-6">
            <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5 leading-relaxed">
              審核期間可編輯申請內容並重新提交。重新提交後，審核工作天數將從送出當日重新計算。
            </p>
            <button
              type="button"
              onClick={onEdit}
              className="mt-4 w-full inline-flex items-center justify-center gap-2 bg-black text-white font-bold px-6 py-3 rounded-xl hover:bg-gray-800 transition-colors"
            >
              <Pencil size={16} />
              編輯申請內容
            </button>
          </div>
          <Link
            href="/member?tab=coaching"
            className="text-[#3157B5] font-bold underline"
          >
            返回會員中心
          </Link>
        </div>
      </main>
    </>
  );
}

function RejectedApplicationView({ adminNote }) {
  return (
    <>
      <Head>
        <title>申請未通過 | PikFun</title>
      </Head>
      <main className="bg-[#E8E8E3] min-h-screen pt-24 pb-20">
        <div className="max-w-lg mx-auto px-6">
          <div className="bg-white rounded-2xl border border-red-200 p-8 text-center">
            <AlertCircle size={48} className="text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-black mb-2 text-red-800">
              申請未通過
            </h1>
            <p className="text-gray-600 text-sm mb-4 leading-relaxed">
              很抱歉，您的教練進駐申請此次未獲核准。
            </p>
            {adminNote && (
              <p className="text-sm text-red-700 bg-red-50 rounded-lg px-4 py-3 mb-6 text-left">
                審核備注：{adminNote}
              </p>
            )}
            <Link
              href="/coaching/apply"
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-2 bg-black text-white font-bold px-6 py-3 rounded-xl"
            >
              重新申請
              <ChevronRight size={16} />
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}

export default function CoachApplyPage() {
  const router = useRouter();
  const { userInfo, loading: userLoading } = useUser();
  const [form, setForm] = useState(emptyForm);
  const [coachingMeta, setCoachingMeta] = useState(null);
  const [checking, setChecking] = useState(true);
  const formRef = useRef(null);
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState("");
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState("");
  const slugTouchedRef = useRef(false);
  const [editLoading, setEditLoading] = useState(false);
  const isEditMode = router.query.edit === "1";

  useEffect(() => {
    if (!userLoading && !userInfo) {
      router.push("/login?redirect=/coaching/apply");
    }
  }, [userLoading, userInfo, router]);

  useEffect(() => {
    if (!userInfo?.email) return;
    setChecking(true);
    const params = new URLSearchParams({ email: userInfo.email });
    if (userInfo.id) params.set("member_id", userInfo.id);
    fetch(`/api/member/coaching?${params}`)
      .then((res) => res.json())
      .then(setCoachingMeta)
      .catch(() => setCoachingMeta(null))
      .finally(() => setChecking(false));
  }, [userInfo?.email, userInfo?.id]);

  useEffect(() => {
    if (!userInfo) return;
    if (isEditMode) return;
    const displayName = userInfo.name || "";
    setForm((prev) => {
      const name = prev.name || displayName;
      const next = {
        ...prev,
        name,
        contact_email: prev.contact_email || userInfo.email || "",
        avatar: prev.avatar || userInfo.avatar || "",
      };
      if (!slugTouchedRef.current) {
        next.slug = slugifyFromName(name);
      }
      return next;
    });
    if (userInfo.avatar && !avatarPreview) {
      setAvatarPreview(userInfo.avatar);
    }
  }, [userInfo, isEditMode]);

  useEffect(() => {
    if (!router.isReady || !isEditMode || !userInfo?.email) return;
    setEditLoading(true);
    fetch(`/api/coach-applications?email=${encodeURIComponent(userInfo.email)}`)
      .then((res) => res.json())
      .then(({ application }) => {
        if (application?.status !== "pending") {
          router.replace("/coaching/apply");
          return;
        }
        slugTouchedRef.current = true;
        setForm(applicationToForm(application));
        if (application.avatar) setAvatarPreview(application.avatar);
        if (application.cover_image) setCoverPreview(application.cover_image);
      })
      .catch(() => router.replace("/coaching/apply"))
      .finally(() => setEditLoading(false));
  }, [router.isReady, isEditMode, userInfo?.email, router]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => {
      const next = { ...prev, [name]: value };
      if (name === "name" && !slugTouchedRef.current) {
        next.slug = slugifyFromName(value);
      }
      if (name === "slug") {
        slugTouchedRef.current = true;
        next.slug = sanitizeSlugInput(value);
      }
      return next;
    });
  };

  const uploadImage = async (file) => {
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
    if (!res.ok) throw new Error(data.error || "上傳失敗");
    return data.url;
  };

  const handleImageChange = (e, type) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      alert("請上傳圖片");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      alert("圖片超過 2MB");
      return;
    }
    const url = URL.createObjectURL(file);
    if (type === "cover") {
      setCoverFile(file);
      setCoverPreview(url);
    } else {
      setAvatarFile(file);
      setAvatarPreview(url);
    }
    e.target.value = "";
  };

  const doSubmit = async () => {
    if (!userInfo?.email) throw new Error("請先登入");
    if (formRef.current && !formRef.current.reportValidity()) {
      throw new Error("VALIDATION");
    }

    const finalSlug = slugify(form.slug || form.name);
    if (!isValidSlug(finalSlug)) {
      throw new Error(
        "網址代稱僅可使用英文、數字、- 或 _（至少 2 個字元）。中文姓名會自動轉為拼音，請確認代稱是否正確。",
      );
    }

    let coverImageUrl = application?.cover_image || null;
    let avatarUrl = form.avatar || userInfo.avatar || null;

    if (coverFile) coverImageUrl = await uploadImage(coverFile);
    if (avatarFile) avatarUrl = await uploadImage(avatarFile);

    const payload = {
      member_id: userInfo.id,
      applicant_email: userInfo.email,
      applicant_name: userInfo.name,
      applicant_avatar: userInfo.avatar,
      ...form,
      slug: finalSlug,
      avatar: avatarUrl,
      cover_image: coverImageUrl,
      tags: commaToArray(form.tags),
      credentials: linesToArray(form.credentials),
      specialties: linesToArray(form.specialties),
    };

    const isResubmit = isEditMode && application?.status === "pending";
    const res = await fetch(
      isResubmit
        ? `/api/coach-applications/${application.id}`
        : "/api/coach-applications",
      {
        method: isResubmit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
    );
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "提交失敗");
    }

    return { data, isResubmit };
  };

  const handleSubmitClick = async () => {
    try {
      const { data, isResubmit } = await doSubmit();
      setTimeout(() => {
        setCoachingMeta((prev) => ({
          ...(prev || {}),
          application: data.application,
          isCoach: false,
          isFeaturedCoach: false,
        }));
        if (isResubmit) {
          router.replace("/coaching/apply");
        }
        window.scrollTo({ top: 0, behavior: "smooth" });
      }, 1400);
    } catch (err) {
      if (err.message !== "VALIDATION") {
        alert(err.message || "提交失敗");
      }
      throw err;
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
  };

  const application = coachingMeta?.application;
  const isApproved =
    coachingMeta?.isFeaturedCoach || application?.status === "approved";

  if (userLoading || !userInfo || checking || (isEditMode && editLoading)) {
    return (
      <main className="min-h-screen pt-24 flex items-center justify-center text-gray-500 bg-[#E8E8E3]">
        <Loader2 className="animate-spin mr-2" size={20} /> 載入中...
      </main>
    );
  }

  if (isApproved) {
    return (
      <ApprovedCoachView
        coachProfile={coachingMeta?.coachProfile}
        application={application}
        stats={coachingMeta?.stats}
      />
    );
  }

  if (application?.status === "pending" && !isEditMode) {
    return (
      <PendingApplicationView
        application={application}
        onEdit={() => router.push("/coaching/apply?edit=1")}
      />
    );
  }

  if (application?.status === "rejected") {
    return <RejectedApplicationView adminNote={application.admin_note} />;
  }

  return (
    <>
      <Head>
        <title>{isEditMode ? "編輯進駐申請" : "申請進駐教練"} | PikFun</title>
      </Head>

      <main className="bg-[#E8E8E3] min-h-screen pt-24 pb-20">
        <div className="max-w-[720px] mx-auto px-6 md:px-10">
          <Link
            href={isEditMode ? "/coaching/apply" : "/coaching"}
            className="inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-black mb-8"
          >
            <ArrowLeft size={16} />{" "}
            {isEditMode ? "返回審核狀態" : "返回教練開課"}
          </Link>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <p className="text-[10px] font-black tracking-widest text-gray-500 uppercase mb-2">
              {isEditMode ? "Edit Application" : "Apply as Coach"}
            </p>
            <h1 className="text-3xl font-black text-black mb-2">
              {isEditMode ? "編輯進駐申請" : "申請進駐 PikFun 官網"}
            </h1>
            <p className="text-sm text-gray-600 mb-2">
              已綁定會員：
              <span className="font-bold text-black">{userInfo.name}</span>（
              {userInfo.email}）
            </p>
            <p className="text-xs text-gray-400 mb-8">
              {isEditMode
                ? "修改後重新提交，審核工作天數將從送出當日重新計算。"
                : "送出後由 PikFun 團隊審核，核准後將顯示於「進駐教練」專區。"}
            </p>

            {isEditMode && (
              <div className="mb-6 p-4 border border-amber-200 bg-amber-50 rounded-xl flex gap-3">
                <AlertCircle
                  size={18}
                  className="text-amber-600 shrink-0 mt-0.5"
                />
                <div>
                  <p className="text-sm font-bold text-amber-900">
                    重新提交審核須知
                  </p>
                  <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                    您的申請目前審核中。編輯並重新提交後，審核工作天數將從送出當日重新計算（約
                    3–5 個工作天）。
                  </p>
                </div>
              </div>
            )}

            <form
              ref={formRef}
              onSubmit={handleFormSubmit}
              className="bg-white rounded-lg border border-gray-200 p-6 md:p-8 space-y-5"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1.5">
                    教練姓名 *
                  </label>
                  <input
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    required
                    className="field"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1.5">
                    網址代稱 *
                  </label>
                  <input
                    name="slug"
                    value={form.slug}
                    onChange={handleChange}
                    required
                    placeholder="例：ye-kun-zhi 或 bob_coach"
                    pattern="[a-z0-9]+([_-][a-z0-9]+)*"
                    className="field"
                  />
                  <p className="text-[10px] text-gray-400 mt-1">
                    /coaching/coach/{form.slug || "..."}
                  </p>
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    依姓名自動產生；中文轉拼音，僅限英文、數字、- 與 _
                  </p>
                  {form.slug && !isValidSlugDraft(form.slug) && (
                    <p className="text-[10px] text-red-500 mt-1">
                      請使用至少 2 個字元的英文或數字（可含 - 或 _）
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1.5">
                    職稱 *
                  </label>
                  <input
                    name="title"
                    value={form.title}
                    onChange={handleChange}
                    required
                    placeholder="PPR 認證教練 · 台中"
                    className="field"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1.5">
                    副標
                  </label>
                  <input
                    name="subtitle"
                    value={form.subtitle}
                    onChange={handleChange}
                    placeholder="協會特約教練"
                    className="field"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1.5">
                    主要縣市
                  </label>
                  <input
                    name="city"
                    value={form.city}
                    onChange={handleChange}
                    placeholder="台中市"
                    className="field"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1.5">
                    區域
                  </label>
                  <select
                    name="region"
                    value={form.region}
                    onChange={handleChange}
                    className="field"
                  >
                    {COACH_REGIONS.map((r) => (
                      <option key={r.value} value={r.value}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1.5">
                  一句話摘要（卡片標題）*
                </label>
                <textarea
                  name="excerpt"
                  value={form.excerpt}
                  onChange={handleChange}
                  required
                  rows={2}
                  className="field resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1.5">
                  教練簡介 *
                </label>
                <textarea
                  name="bio"
                  value={form.bio}
                  onChange={handleChange}
                  required
                  rows={3}
                  className="field resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1.5">
                  教練故事（內頁長文）
                </label>
                <textarea
                  name="story"
                  value={form.story}
                  onChange={handleChange}
                  rows={6}
                  placeholder="段落之間空一行"
                  className="field resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <TagPickerField
                  label="經歷認證（每行一項）"
                  value={form.credentials}
                  onChange={(v) =>
                    setForm((prev) => ({ ...prev, credentials: v }))
                  }
                  presets={CREDENTIAL_PRESETS}
                  mode="lines"
                  placeholder={"PPR 認證教練\n8 年教學經驗"}
                  rows={4}
                />
                <TagPickerField
                  label="教學專長（每行一項）"
                  value={form.specialties}
                  onChange={(v) =>
                    setForm((prev) => ({ ...prev, specialties: v }))
                  }
                  presets={SPECIALTY_PRESETS}
                  mode="lines"
                  placeholder={"新手入門\n雙打策略"}
                  rows={4}
                />
              </div>

              <TagPickerField
                label="標籤（逗號或頓號分隔）"
                value={form.tags}
                onChange={(v) => setForm((prev) => ({ ...prev, tags: v }))}
                presets={TAG_PRESETS}
                mode="comma"
                placeholder="初學入門、團體班、雙打"
                hint="點選常用標籤，或直接輸入自訂標籤（可用逗號、頓號分隔）"
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1.5">
                    YouTube 嵌入網址
                  </label>
                  <input
                    name="video_url"
                    value={form.video_url}
                    onChange={handleChange}
                    placeholder="https://www.youtube.com/embed/..."
                    className="field"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1.5">
                    徽章文字
                  </label>
                  <input
                    name="featured_label"
                    value={form.featured_label}
                    onChange={handleChange}
                    placeholder="大人氣"
                    className="field"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1.5">
                    聯絡 Email
                  </label>
                  <input
                    name="contact_email"
                    type="email"
                    value={form.contact_email}
                    onChange={handleChange}
                    className="field"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1.5">
                    Instagram
                  </label>
                  <input
                    name="instagram"
                    value={form.instagram}
                    onChange={handleChange}
                    placeholder="帳號不含 @"
                    className="field"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1.5">
                    頭像
                  </label>
                  <label className="block w-24 h-24 rounded-full overflow-hidden border border-dashed border-gray-300 cursor-pointer relative">
                    {avatarPreview ? (
                      <Image
                        src={avatarPreview}
                        alt=""
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    ) : (
                      <span className="flex items-center justify-center h-full text-gray-400">
                        <Upload size={20} />
                      </span>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleImageChange(e, "avatar")}
                    />
                  </label>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1.5">
                    封面圖
                  </label>
                  <label className="block w-full aspect-[4/3] rounded-lg overflow-hidden border border-dashed border-gray-300 cursor-pointer relative">
                    {coverPreview ? (
                      <>
                        <Image
                          src={coverPreview}
                          alt=""
                          fill
                          className="object-cover"
                          unoptimized
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setCoverFile(null);
                            setCoverPreview("");
                          }}
                          className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1"
                        >
                          <X size={12} />
                        </button>
                      </>
                    ) : (
                      <span className="flex flex-col items-center justify-center h-full text-gray-400 text-xs">
                        <Upload size={20} className="mb-1" />
                        上傳封面
                      </span>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleImageChange(e, "cover")}
                    />
                  </label>
                </div>
              </div>

              <ConfettiButton
                onClick={handleSubmitClick}
                successLabel={isEditMode ? "已重新提交！🎉" : "申請已送出！🎉"}
                className="w-full bg-black text-white font-black py-4 rounded-md hover:bg-gray-800 disabled:opacity-50"
              >
                {isEditMode ? "重新提交審核" : "提交進駐申請"}{" "}
                <ChevronRight size={18} />
              </ConfettiButton>
            </form>
          </motion.div>
        </div>
      </main>

      <style jsx global>{`
        .field {
          width: 100%;
          border: 1px solid #e5e7eb;
          border-radius: 0.5rem;
          padding: 0.75rem 1rem;
          font-size: 0.875rem;
          outline: none;
        }
        .field:focus {
          border-color: #000;
        }
      `}</style>
    </>
  );
}
