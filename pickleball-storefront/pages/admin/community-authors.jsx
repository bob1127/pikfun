"use client";

import { useCallback, useEffect, useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { Loader2, Trash2 } from "lucide-react";
import { useUser } from "@/components/context/UserContext";
import {
  BlueArrowLink,
  BluePillButton,
  BluePillTabs,
} from "@/components/ui/BlueCta";

export default function AdminCommunityAuthorsPage() {
  const router = useRouter();
  const { userInfo, loading: userLoading } = useUser();
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminChecked, setAdminChecked] = useState(false);
  const [authors, setAuthors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    email: "",
    name: "",
    role: "court_owner",
    note: "",
  });

  useEffect(() => {
    if (userLoading) return;
    if (!userInfo?.email) {
      router.replace("/login?redirect=/admin/community-authors");
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

  const fetchAuthors = useCallback(async () => {
    if (!userInfo?.email || !isAdmin) return;
    setLoading(true);
    try {
      const res = await fetch(
        `/api/admin/community-authors?admin_email=${encodeURIComponent(userInfo.email)}`,
      );
      const data = await res.json();
      setAuthors(data.authors || []);
    } finally {
      setLoading(false);
    }
  }, [userInfo?.email, isAdmin]);

  useEffect(() => {
    if (!userLoading && isAdmin) fetchAuthors();
  }, [fetchAuthors, userLoading, isAdmin]);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!form.email.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(
        `/api/admin/community-authors?admin_email=${encodeURIComponent(userInfo.email)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        },
      );
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "新增失敗");
        return;
      }
      setForm({ email: "", name: "", role: "court_owner", note: "" });
      await fetchAuthors();
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async (id) => {
    if (!confirm("確定移除此供稿資格？")) return;
    await fetch(
      `/api/admin/community-authors/${id}?admin_email=${encodeURIComponent(userInfo.email)}`,
      { method: "DELETE" },
    );
    await fetchAuthors();
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
        <title>供稿白名單 | PikFun Admin</title>
      </Head>

      <main className="bg-[#F8FAFC] min-h-screen pt-24 pb-20">
        <div className="max-w-[760px] mx-auto px-6">
          <BlueArrowLink href="/admin/community-posts" className="mb-6">
            返回投稿審核
          </BlueArrowLink>

          <h1 className="text-2xl font-black mb-2">供稿白名單</h1>
          <p className="text-sm text-gray-500 mb-8">
            教練通過進駐審核後自動具備投稿資格。球場主／活動主揪目前沒有正式申請流程，請於此手動加入 Email 後即可讓對方在會員中心投稿。
          </p>

          <form
            onSubmit={handleAdd}
            className="bg-white rounded-xl border border-gray-200 p-6 mb-8 space-y-4"
          >
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#005caf]"
                  placeholder="partner@example.com"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
                  姓名／單位
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#005caf]"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
                身分
              </label>
              <BluePillTabs
                value={form.role}
                onChange={(role) => setForm({ ...form, role })}
                tabs={[
                  { value: "court_owner", label: "球場主" },
                  { value: "organizer", label: "活動主揪" },
                ]}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
                備註
              </label>
              <input
                type="text"
                value={form.note}
                onChange={(e) => setForm({ ...form, note: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#005caf]"
                placeholder="例：新莊運動中心場地方，2026/07 洽談合作"
              />
            </div>
            <BluePillButton type="submit" loading={saving}>
              {saving ? "新增中..." : "加入白名單"}
            </BluePillButton>
          </form>

          {loading ? (
            <p className="text-gray-400">載入中...</p>
          ) : authors.length === 0 ? (
            <p className="text-gray-500 bg-white rounded-xl p-8 text-center border">
              目前沒有手動核可的供稿者
            </p>
          ) : (
            <div className="space-y-2">
              {authors.map((a) => (
                <div
                  key={a.id}
                  className="bg-white border border-gray-200 rounded-lg p-4 flex items-center justify-between gap-4"
                >
                  <div className="min-w-0">
                    <p className="font-bold text-sm truncate">
                      {a.name || a.email}{" "}
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 ml-1">
                        {a.role === "court_owner" ? "球場主" : "活動主揪"}
                      </span>
                    </p>
                    <p className="text-xs text-gray-400">{a.email}</p>
                    {a.note && (
                      <p className="text-xs text-gray-500 mt-1">{a.note}</p>
                    )}
                  </div>
                  <button
                    onClick={() => handleRemove(a.id)}
                    className="text-gray-400 hover:text-red-600 shrink-0"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
