"use client";

import { useState, useEffect, useCallback } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { Loader2, Check, X, ExternalLink } from "lucide-react";
import { useUser } from "@/components/context/UserContext";

export default function AdminCoachApplicationsPage() {
  const router = useRouter();
  const { userInfo, loading: userLoading } = useUser();
  const [status, setStatus] = useState("pending");
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminChecked, setAdminChecked] = useState(false);

  useEffect(() => {
    if (userLoading) return;
    if (!userInfo?.email) {
      router.replace("/login?redirect=/admin/coach-applications");
      return;
    }
    fetch(`/api/admin/check?email=${encodeURIComponent(userInfo.email)}`)
      .then((res) => res.json())
      .then((data) => {
        setIsAdmin(!!data.isAdmin);
        setAdminChecked(true);
        if (!data.isAdmin) router.replace("/coaching");
      });
  }, [userLoading, userInfo, router]);

  const fetchApps = useCallback(async () => {
    if (!userInfo?.email || !isAdmin) return;
    setLoading(true);
    try {
      const res = await fetch(
        `/api/admin/coach-applications?status=${status}&admin_email=${encodeURIComponent(userInfo.email)}`
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setApplications(data.applications || []);
    } catch {
      setApplications([]);
    } finally {
      setLoading(false);
    }
  }, [status, userInfo?.email, isAdmin]);

  useEffect(() => {
    if (!userLoading && isAdmin) fetchApps();
  }, [fetchApps, userLoading, isAdmin]);

  const patch = async (id, action) => {
    if (!userInfo?.email) return;
    const admin_note =
      action === "reject"
        ? prompt("拒絕原因（選填，會留存紀錄）") || ""
        : "";

    setActing(id);
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
        alert(`已核准！教練頁：${data.profile_url}`);
      }
      await fetchApps();
    } finally {
      setActing(null);
    }
  };

  if (userLoading || !adminChecked || !isAdmin) {
    return (
      <main className="min-h-screen pt-24 flex items-center justify-center text-gray-500">
        <Loader2 className="animate-spin mr-2" size={20} />
        {userLoading || !adminChecked ? "載入中..." : "無權限"}
      </main>
    );
  }

  return (
    <>
      <Head>
        <title>教練進駐審核 | PikPie Admin</title>
      </Head>

      <main className="bg-[#F8FAFC] min-h-screen pt-24 pb-20">
        <div className="max-w-[1000px] mx-auto px-6">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-black">教練進駐審核</h1>
              <p className="text-sm text-gray-500">管理員：{userInfo.email}</p>
            </div>
            <Link href="/coaching" className="text-sm font-bold text-[#3157B5] underline">
              返回前台
            </Link>
          </div>

          <div className="flex gap-2 mb-6">
            {["pending", "approved", "rejected", "all"].map((s) => (
              <button
                key={s}
                onClick={() => setStatus(s)}
                className={`px-4 py-2 rounded-full text-xs font-bold ${
                  status === s ? "bg-black text-white" : "bg-white border border-gray-200"
                }`}
              >
                {s === "pending" ? "待審核" : s === "approved" ? "已核准" : s === "rejected" ? "已拒絕" : "全部"}
              </button>
            ))}
          </div>

          {loading ? (
            <p className="text-gray-400">載入中...</p>
          ) : applications.length === 0 ? (
            <p className="text-gray-500 bg-white rounded-xl p-10 text-center border">沒有資料</p>
          ) : (
            <div className="space-y-4">
              {applications.map((app) => (
                <div key={app.id} className="bg-white rounded-xl border border-gray-200 p-6">
                  <div className="flex flex-col md:flex-row md:items-start gap-4">
                    {app.avatar && (
                      <img src={app.avatar} alt="" className="w-16 h-16 rounded-full object-cover" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <h2 className="font-black text-lg">{app.name}</h2>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          app.status === "pending" ? "bg-yellow-100 text-yellow-800" :
                          app.status === "approved" ? "bg-green-100 text-green-800" :
                          "bg-gray-100 text-gray-600"
                        }`}>
                          {app.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-1">{app.title}</p>
                      <p className="text-xs text-gray-400 mb-3">
                        會員 {app.applicant_name} · {app.applicant_email} · {app.city}
                      </p>
                      <p className="text-sm text-gray-700 line-clamp-2 mb-3">{app.excerpt}</p>
                      <Link
                        href={`/admin/coach-applications/${app.id}`}
                        className="text-xs text-[#3157B5] font-bold inline-flex items-center gap-1 hover:underline"
                      >
                        查看完整申請資料（slug：{app.slug}） <ExternalLink size={12} />
                      </Link>
                      {app.status === "approved" && (
                        <Link
                          href={`/coaching/coach/${app.slug}`}
                          target="_blank"
                          className="block text-xs text-gray-500 mt-1 hover:text-black"
                        >
                          正式教練頁 →
                        </Link>
                      )}
                    </div>
                    {app.status === "pending" && (
                      <div className="flex gap-2 shrink-0">
                        <button
                          onClick={() => patch(app.id, "approve")}
                          disabled={acting === app.id}
                          className="flex items-center gap-1 bg-green-600 text-white text-xs font-bold px-4 py-2 rounded-md disabled:opacity-50"
                        >
                          <Check size={14} /> 核准
                        </button>
                        <button
                          onClick={() => patch(app.id, "reject")}
                          disabled={acting === app.id}
                          className="flex items-center gap-1 border border-red-300 text-red-600 text-xs font-bold px-4 py-2 rounded-md disabled:opacity-50"
                        >
                          <X size={14} /> 拒絕
                        </button>
                      </div>
                    )}
                    {app.status === "approved" && (
                      <Link
                        href={`/coaching/coach/${app.slug}`}
                        className="text-xs font-bold bg-black text-white px-4 py-2 rounded-md"
                      >
                        查看教練頁
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
