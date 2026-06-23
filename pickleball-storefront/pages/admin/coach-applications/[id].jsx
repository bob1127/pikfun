"use client";

import { useState, useEffect } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { Loader2, Check, X, ArrowLeft } from "lucide-react";
import { useUser } from "@/components/context/UserContext";

function Field({ label, children }) {
  if (!children && children !== 0) return null;
  return (
    <div className="py-3 border-b border-gray-100 last:border-0">
      <p className="text-[10px] font-black tracking-widest text-gray-400 uppercase mb-1">
        {label}
      </p>
      <div className="text-sm text-gray-800 whitespace-pre-wrap">{children}</div>
    </div>
  );
}

function TagList({ items }) {
  if (!items?.length) return null;
  return (
    <div className="flex flex-wrap gap-1.5 mt-1">
      {items.map((t) => (
        <span
          key={t}
          className="text-[10px] font-bold px-2 py-0.5 rounded-full border border-gray-300"
        >
          {t}
        </span>
      ))}
    </div>
  );
}

export default function AdminCoachApplicationDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const { userInfo, loading: userLoading } = useUser();
  const [app, setApp] = useState(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (userLoading) return;
    if (!userInfo?.email) {
      router.replace(`/login?redirect=/admin/coach-applications/${id}`);
      return;
    }
    fetch(`/api/admin/check?email=${encodeURIComponent(userInfo.email)}`)
      .then((res) => res.json())
      .then((data) => {
        setIsAdmin(!!data.isAdmin);
        if (!data.isAdmin) router.replace("/coaching");
      });
  }, [userLoading, userInfo, router, id]);

  useEffect(() => {
    if (!id || !isAdmin || !userInfo?.email) return;
    setLoading(true);
    fetch(
      `/api/admin/coach-applications/${id}?admin_email=${encodeURIComponent(userInfo.email)}`
    )
      .then((res) => res.json())
      .then((data) => setApp(data.application || null))
      .finally(() => setLoading(false));
  }, [id, isAdmin, userInfo?.email]);

  const patch = async (action) => {
    if (!userInfo?.email) return;
    const admin_note =
      action === "reject"
        ? prompt("拒絕原因（選填）") || ""
        : "";

    setActing(true);
    try {
      const res = await fetch(`/api/admin/coach-applications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          admin_note,
          admin_email: userInfo.email,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "操作失敗");
        return;
      }
      if (action === "approve") {
        alert("已核准！教練頁已上架。");
        router.push(`/coaching/coach/${data.slug}`);
        return;
      }
      router.push("/admin/coach-applications");
    } finally {
      setActing(false);
    }
  };

  if (userLoading || loading || !isAdmin) {
    return (
      <main className="min-h-screen pt-24 flex items-center justify-center text-gray-500">
        <Loader2 className="animate-spin mr-2" size={20} /> 載入中...
      </main>
    );
  }

  if (!app) {
    return (
      <main className="min-h-screen pt-24 text-center">
        <p className="text-gray-500 mb-4">找不到申請</p>
        <Link href="/admin/coach-applications" className="underline font-bold">
          返回列表
        </Link>
      </main>
    );
  }

  const storyParagraphs = (app.story || "").split("\n\n").filter(Boolean);

  return (
    <>
      <Head>
        <title>審核：{app.name} | PikPie Admin</title>
      </Head>

      <main className="bg-[#F8FAFC] min-h-screen pt-24 pb-20">
        <div className="max-w-[900px] mx-auto px-6">
          <Link
            href="/admin/coach-applications"
            className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-black mb-6"
          >
            <ArrowLeft size={16} /> 返回審核列表
          </Link>

          {app.status === "pending" && (
            <div className="bg-[#FFD43A] text-black text-sm font-bold px-4 py-3 rounded-lg mb-6">
              審核預覽 — 此教練頁尚未公開，核准後才會出現在前台
            </div>
          )}

          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-6">
            {app.cover_image && (
              <img
                src={app.cover_image}
                alt=""
                className="w-full max-h-64 object-cover"
              />
            )}
            <div className="p-6 md:p-8">
              <div className="flex items-start gap-4 mb-6">
                {app.avatar && (
                  <img
                    src={app.avatar}
                    alt=""
                    className="w-16 h-16 rounded-full object-cover"
                  />
                )}
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h1 className="text-2xl font-black">{app.name}</h1>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100">
                      {app.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{app.title}</p>
                  {app.subtitle && (
                    <p className="text-xs text-gray-400">{app.subtitle}</p>
                  )}
                </div>
              </div>

              <Field label="會員帳號">
                {app.applicant_name} · {app.applicant_email}
                {app.member_id && ` · ID: ${app.member_id}`}
              </Field>
              <Field label="網址代稱">/coaching/coach/{app.slug}</Field>
              <Field label="一句話摘要">{app.excerpt}</Field>
              <Field label="教練簡介">{app.bio}</Field>

              {storyParagraphs.length > 0 && (
                <Field label="教練故事">
                  {storyParagraphs.map((p, i) => (
                    <p key={i} className="mb-3 last:mb-0">
                      {p}
                    </p>
                  ))}
                </Field>
              )}

              <Field label="縣市 / 區域">
                {[app.city, app.region].filter(Boolean).join(" · ")}
              </Field>

              <Field label="經歷認證">
                <TagList items={app.credentials} />
              </Field>
              <Field label="教學專長">
                <TagList items={app.specialties} />
              </Field>
              <Field label="標籤">
                <TagList items={app.tags} />
              </Field>

              <Field label="聯絡 Email">{app.contact_email}</Field>
              <Field label="Instagram">
                {app.instagram ? `@${app.instagram.replace("@", "")}` : null}
              </Field>
              <Field label="徽章文字">{app.featured_label}</Field>

              {app.video_url && (
                <div className="pt-4">
                  <p className="text-[10px] font-black tracking-widest text-gray-400 uppercase mb-2">
                    介紹影片
                  </p>
                  <div className="aspect-video rounded-lg overflow-hidden bg-black">
                    <iframe
                      src={app.video_url}
                      title="preview"
                      className="w-full h-full"
                      allowFullScreen
                    />
                  </div>
                </div>
              )}

              <Field label="申請時間">
                {app.created_at
                  ? new Date(app.created_at).toLocaleString("zh-TW")
                  : null}
              </Field>
            </div>
          </div>

          {app.status === "pending" && (
            <div className="flex gap-3">
              <button
                onClick={() => patch("approve")}
                disabled={acting}
                className="flex-1 flex items-center justify-center gap-2 bg-green-600 text-white font-bold py-3 rounded-md disabled:opacity-50"
              >
                <Check size={18} /> 核准上架
              </button>
              <button
                onClick={() => patch("reject")}
                disabled={acting}
                className="flex items-center justify-center gap-2 border border-red-300 text-red-600 font-bold px-6 py-3 rounded-md disabled:opacity-50"
              >
                <X size={18} /> 拒絕
              </button>
            </div>
          )}

          {app.status === "approved" && (
            <Link
              href={`/coaching/coach/${app.slug}`}
              className="block text-center bg-black text-white font-bold py-3 rounded-md"
            >
              查看正式教練頁
            </Link>
          )}
        </div>
      </main>
    </>
  );
}
