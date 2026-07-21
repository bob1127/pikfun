"use client";

import { useCallback, useEffect, useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { Loader2, Check, X, ChevronRight } from "lucide-react";
import { useUser } from "@/components/context/UserContext";
import { APPLY_TYPE_LABEL } from "@/lib/partnerApplications";
import {
  BlueArrowLink,
  BluePillButton,
  BluePillTabs,
} from "@/components/ui/BlueCta";

const STATUS_LABEL = {
  pending: "待審核",
  approved: "已核准",
  rejected: "已退回",
};

function formatDotDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}

export default function AdminPartnerApplicationsPage() {
  const router = useRouter();
  const { userInfo, loading: userLoading } = useUser();
  const [status, setStatus] = useState("pending");
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminChecked, setAdminChecked] = useState(false);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    if (userLoading) return;
    if (!userInfo?.email) {
      router.replace("/login?redirect=/admin/partner-applications");
      return;
    }
    fetch(`/api/admin/check?email=${encodeURIComponent(userInfo.email)}`)
      .then((res) => res.json())
      .then((data) => {
        setIsAdmin(!!data.isAdmin);
        setAdminChecked(true);
        if (!data.isAdmin) router.replace("/news");
      });
  }, [userLoading, userInfo, router]);

  const fetchApps = useCallback(async () => {
    if (!userInfo?.email || !isAdmin) return;
    setLoading(true);
    try {
      const res = await fetch(
        `/api/admin/partner-applications?status=${status}&admin_email=${encodeURIComponent(userInfo.email)}`,
      );
      const data = await res.json();
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
    const admin_note =
      action === "reject" ? prompt("退回原因（選填）") || "" : "";
    setActing(id);
    try {
      const res = await fetch(`/api/admin/partner-applications/${id}`, {
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
      if (action === "approve" && data.granted_posting) {
        alert("已核准，並開通投稿權限");
      } else if (action === "approve") {
        alert("已核准（廠商合作申請，無自動開通投稿）");
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
        <title>進駐申請審核 | PikFun Admin</title>
      </Head>

      <main className="bg-white min-h-screen pt-24 pb-20">
        <div className="max-w-[920px] mx-auto px-6">
          <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
            <div>
              <h1 className="text-2xl font-black">進駐申請審核</h1>
              <p className="text-sm text-gray-500 mt-1">
                廠商／球場主／揪團主（教練請至教練進駐審核）
              </p>
            </div>
            <div className="flex flex-wrap gap-5">
              <BlueArrowLink href="/admin/coach-applications">
                教練進駐審核
              </BlueArrowLink>
              <BlueArrowLink href="/admin/community-posts">
                投稿審核
              </BlueArrowLink>
            </div>
          </div>

          <div className="mb-8">
            <BluePillTabs
              value={status}
              onChange={setStatus}
              tabs={[
                { value: "pending", label: "待審核" },
                { value: "approved", label: "已核准" },
                { value: "rejected", label: "已退回" },
                { value: "all", label: "全部" },
              ]}
            />
          </div>

          {loading ? (
            <p className="text-gray-400">載入中...</p>
          ) : applications.length === 0 ? (
            <p className="text-gray-500 py-16 text-center border-t border-b border-gray-100">
              沒有資料
            </p>
          ) : (
            <div className="border-t border-gray-100">
              {applications.map((app) => (
                <div
                  key={app.id}
                  className="py-6 border-b border-gray-100"
                >
                  <button
                    type="button"
                    onClick={() =>
                      setExpanded(expanded === app.id ? null : app.id)
                    }
                    className="w-full flex items-center gap-4 text-left group"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className="text-xs text-gray-400 font-mono">
                          {formatDotDate(app.created_at)}
                        </span>
                        <span className="text-[11px] font-bold px-2 py-0.5 border border-[#005caf] text-[#005caf] rounded-sm">
                          {STATUS_LABEL[app.status]}
                        </span>
                        <span className="text-[11px] font-bold px-2 py-0.5 border border-[#005caf]/40 text-[#005caf] rounded-sm">
                          {APPLY_TYPE_LABEL[app.apply_type] || app.apply_type}
                        </span>
                      </div>
                      <h2 className="text-base font-bold text-gray-900">
                        {app.company || app.applicant_name}
                      </h2>
                      <p className="text-xs text-gray-400 mt-1">
                        {app.applicant_name} · {app.applicant_email}
                      </p>
                    </div>
                    <span className="shrink-0 inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#005caf] text-white">
                      <ChevronRight
                        size={16}
                        strokeWidth={3}
                        className={`transition-transform ${expanded === app.id ? "rotate-90" : ""}`}
                      />
                    </span>
                  </button>

                  {expanded === app.id && (
                    <div className="mt-4 pl-1 space-y-3">
                      <p className="text-sm text-gray-700 whitespace-pre-wrap bg-[#f7f9fc] rounded-lg p-4">
                        {app.message}
                      </p>
                      <div className="text-xs text-gray-500 space-y-1">
                        {app.phone && <p>電話：{app.phone}</p>}
                        {app.city && <p>地區：{app.city}</p>}
                        {app.website && <p>網站：{app.website}</p>}
                        {app.instagram && <p>IG：{app.instagram}</p>}
                        {app.line_url && <p>LINE：{app.line_url}</p>}
                        {app.instagram_url && (
                          <p>Instagram：{app.instagram_url}</p>
                        )}
                        {app.facebook_url && (
                          <p>Facebook：{app.facebook_url}</p>
                        )}
                      </div>
                      {app.status === "pending" && (
                        <div className="flex gap-2 pt-2">
                          <BluePillButton
                            onClick={() => patch(app.id, "approve")}
                            loading={acting === app.id}
                            disabled={acting === app.id}
                          >
                            <Check size={14} /> 核准
                          </BluePillButton>
                          <BluePillButton
                            variant="outline"
                            onClick={() => patch(app.id, "reject")}
                            disabled={acting === app.id}
                            className="!border-red-400 !text-red-600"
                          >
                            <X size={14} /> 退回
                          </BluePillButton>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
