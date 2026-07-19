"use client";

import { useEffect, useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import {
  BellRing,
  CheckCircle2,
  ExternalLink,
  Loader2,
  Mail,
  Send,
  Smartphone,
  Users,
} from "lucide-react";
import { useUser } from "@/components/context/UserContext";

const initialForm = {
  title: "",
  body: "",
  url: "/",
  audience: "all",
  target_email: "",
};

export default function AdminPushPage() {
  const router = useRouter();
  const { userInfo, loading: userLoading } = useUser();
  const [adminChecked, setAdminChecked] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [stats, setStats] = useState({ devices: 0, members: 0 });
  const [form, setForm] = useState(initialForm);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const authHeaders = () => {
    const token = localStorage.getItem("medusa_auth_token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  useEffect(() => {
    if (userLoading) return;
    if (!userInfo?.email) {
      router.replace("/login?redirect=/admin/push");
      return;
    }

    fetch(`/api/admin/check?email=${encodeURIComponent(userInfo.email)}`)
      .then((res) => res.json())
      .then((data) => {
        const allowed = !!data.isAdmin;
        setIsAdmin(allowed);
        setAdminChecked(true);
        if (!allowed) router.replace("/");
      })
      .catch(() => {
        setAdminChecked(true);
        router.replace("/");
      });
  }, [router, userInfo, userLoading]);

  useEffect(() => {
    if (!isAdmin) return;
    fetch("/api/admin/push", { headers: authHeaders() })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "讀取訂閱狀態失敗");
        setStats(data.stats || { devices: 0, members: 0 });
      })
      .catch((err) => setError(err.message));
  }, [isAdmin]);

  const update = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setResult(null);
    setError("");
  };

  const sendPush = async (event) => {
    event.preventDefault();
    if (form.audience === "all") {
      const confirmed = window.confirm(
        `確定要推播給全部已訂閱裝置嗎？目前約 ${stats.devices} 台裝置。`,
      );
      if (!confirmed) return;
    }

    setSending(true);
    setResult(null);
    setError("");
    try {
      const res = await fetch("/api/admin/push", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders(),
        },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "推播發送失敗");
      setResult(data.result);
      setStats((prev) => ({
        ...prev,
        devices:
          form.audience === "all" ? data.result.total : prev.devices,
      }));
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  if (userLoading || !adminChecked || !isAdmin) {
    return (
      <main className="flex min-h-screen items-center justify-center pt-24 text-gray-500">
        <Loader2 className="mr-2 animate-spin" size={20} />
        {userLoading || !adminChecked ? "驗證管理員權限中…" : "無權限"}
      </main>
    );
  }

  return (
    <>
      <Head>
        <title>推播通知中心 | PikFun Admin</title>
      </Head>

      <main className="min-h-screen bg-[#f4f7fb] px-5 pb-20 pt-28">
        <div className="mx-auto max-w-[1050px]">
          <div className="mb-8">
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-[#005caf]">
              PikFun Admin
            </p>
            <h1 className="flex items-center gap-3 text-3xl font-black text-[#132238]">
              <BellRing className="text-[#005caf]" />
              推播通知中心
            </h1>
            <p className="mt-2 text-sm text-[#64748b]">
              發送 PWA 系統通知給已開啟推播的會員裝置。
            </p>
          </div>

          <div className="mb-8 grid gap-4 sm:grid-cols-2">
            <div className="rounded-3xl border border-[#e1e8f0] bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#eaf4ff] text-[#005caf]">
                  <Smartphone size={20} />
                </span>
                <div>
                  <p className="text-xs font-bold text-[#64748b]">訂閱裝置</p>
                  <p className="text-2xl font-black text-[#132238]">
                    {stats.devices}
                  </p>
                </div>
              </div>
            </div>
            <div className="rounded-3xl border border-[#e1e8f0] bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#eefbea] text-[#268311]">
                  <Users size={20} />
                </span>
                <div>
                  <p className="text-xs font-bold text-[#64748b]">
                    已綁定會員
                  </p>
                  <p className="text-2xl font-black text-[#132238]">
                    {stats.members}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
            <form
              onSubmit={sendPush}
              className="rounded-3xl border border-[#e1e8f0] bg-white p-6 shadow-sm sm:p-8"
            >
              <h2 className="mb-6 text-lg font-black text-[#132238]">
                編輯推播內容
              </h2>

              <div className="mb-6 grid grid-cols-2 gap-2 rounded-2xl bg-[#f4f7fb] p-1.5">
                <button
                  type="button"
                  onClick={() => update("audience", "all")}
                  className={`rounded-xl px-4 py-3 text-sm font-bold transition ${
                    form.audience === "all"
                      ? "bg-white text-[#005caf] shadow-sm"
                      : "text-[#64748b]"
                  }`}
                >
                  全部訂閱者
                </button>
                <button
                  type="button"
                  onClick={() => update("audience", "email")}
                  className={`rounded-xl px-4 py-3 text-sm font-bold transition ${
                    form.audience === "email"
                      ? "bg-white text-[#005caf] shadow-sm"
                      : "text-[#64748b]"
                  }`}
                >
                  指定會員
                </button>
              </div>

              {form.audience === "email" && (
                <label className="mb-5 block">
                  <span className="mb-2 flex items-center gap-2 text-sm font-bold text-[#334155]">
                    <Mail size={15} /> 會員 Email
                  </span>
                  <input
                    type="email"
                    required
                    value={form.target_email}
                    onChange={(e) => update("target_email", e.target.value)}
                    placeholder="member@example.com"
                    className="w-full rounded-2xl border border-[#dbe3ec] px-4 py-3 text-sm outline-none focus:border-[#005caf] focus:ring-2 focus:ring-[#005caf]/10"
                  />
                </label>
              )}

              <label className="mb-5 block">
                <span className="mb-2 flex justify-between text-sm font-bold text-[#334155]">
                  <span>推播標題</span>
                  <span className="font-normal text-[#94a3b8]">
                    {form.title.length}/80
                  </span>
                </span>
                <input
                  required
                  maxLength={80}
                  value={form.title}
                  onChange={(e) => update("title", e.target.value)}
                  placeholder="例如：本週末台北新手友善揪團"
                  className="w-full rounded-2xl border border-[#dbe3ec] px-4 py-3 text-sm outline-none focus:border-[#005caf] focus:ring-2 focus:ring-[#005caf]/10"
                />
              </label>

              <label className="mb-5 block">
                <span className="mb-2 flex justify-between text-sm font-bold text-[#334155]">
                  <span>通知內容</span>
                  <span className="font-normal text-[#94a3b8]">
                    {form.body.length}/300
                  </span>
                </span>
                <textarea
                  required
                  maxLength={300}
                  rows={5}
                  value={form.body}
                  onChange={(e) => update("body", e.target.value)}
                  placeholder="輸入會顯示在系統通知中的內容…"
                  className="w-full resize-none rounded-2xl border border-[#dbe3ec] px-4 py-3 text-sm leading-relaxed outline-none focus:border-[#005caf] focus:ring-2 focus:ring-[#005caf]/10"
                />
              </label>

              <label className="mb-7 block">
                <span className="mb-2 flex items-center gap-2 text-sm font-bold text-[#334155]">
                  <ExternalLink size={15} /> 點擊後前往
                </span>
                <input
                  required
                  value={form.url}
                  onChange={(e) => update("url", e.target.value)}
                  placeholder="/play 或 /play/場次ID"
                  className="w-full rounded-2xl border border-[#dbe3ec] px-4 py-3 text-sm outline-none focus:border-[#005caf] focus:ring-2 focus:ring-[#005caf]/10"
                />
                <p className="mt-2 text-xs text-[#94a3b8]">
                  僅限本站路徑，例如 /play、/products、/blog/文章網址。
                </p>
              </label>

              {error && (
                <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                  {error}
                </div>
              )}
              {result && (
                <div className="mb-5 flex items-start gap-3 rounded-2xl border border-green-200 bg-green-50 p-4 text-sm text-green-800">
                  <CheckCircle2 className="mt-0.5 shrink-0" size={17} />
                  <span>
                    發送完成：成功 {result.sent} 台
                    {result.failed > 0 ? `，失敗 ${result.failed} 台` : ""}。
                  </span>
                </div>
              )}

              <button
                type="submit"
                disabled={sending}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#005caf] py-4 text-sm font-black text-white transition hover:bg-[#004a8f] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {sending ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : (
                  <Send size={18} />
                )}
                {sending ? "發送中…" : "發送推播"}
              </button>
            </form>

            <aside className="h-fit rounded-3xl border border-[#e1e8f0] bg-white p-6 shadow-sm lg:sticky lg:top-24">
              <p className="mb-4 text-xs font-black uppercase tracking-[0.15em] text-[#64748b]">
                通知預覽
              </p>
              <div className="rounded-2xl bg-[#eef2f7] p-4">
                <div className="rounded-2xl bg-white p-4 shadow-lg">
                  <div className="flex items-start gap-3">
                    <img
                      src="/images/pikfun-logo-pwa.png"
                      alt="PikFun"
                      className="h-10 w-10 rounded-xl object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="mb-0.5 text-[11px] font-bold text-[#94a3b8]">
                        PikFun 匹克方・現在
                      </p>
                      <p className="break-words text-sm font-black text-[#132238]">
                        {form.title || "推播標題預覽"}
                      </p>
                      <p className="mt-1 whitespace-pre-line break-words text-xs leading-relaxed text-[#64748b]">
                        {form.body || "輸入內容後會在這裡預覽系統通知。"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <p className="mt-4 text-xs leading-relaxed text-[#94a3b8]">
                實際外觀會依 iPhone、Android、Windows 或 macOS 系統略有不同。
              </p>
            </aside>
          </div>
        </div>
      </main>
    </>
  );
}
