"use client";

import { useEffect, useState } from "react";
import { Loader2, User } from "lucide-react";
import { useUser } from "@/components/context/UserContext";
import { BluePillButton } from "@/components/ui/BlueCta";
import Link from "next/link";

export default function MemberAuthorProfilePanel() {
  const { userInfo } = useUser();
  const [eligible, setEligible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({
    display_name: "",
    title: "",
    credentials: "",
    bio: "",
    avatar_url: "",
    highlight: "",
  });

  useEffect(() => {
    if (!userInfo?.email) return;
    let cancelled = false;

    (async () => {
      setLoading(true);
      try {
        const [eligRes, profileRes] = await Promise.all([
          fetch(
            `/api/community-posts/eligibility?email=${encodeURIComponent(userInfo.email)}`,
          ),
          fetch(
            `/api/member/author-profile?email=${encodeURIComponent(userInfo.email)}`,
          ),
        ]);
        const elig = await eligRes.json();
        const profileData = await profileRes.json();
        if (cancelled) return;

        setEligible(!!elig.eligible);
        const p = profileData.profile;
        setForm({
          display_name: p?.display_name || userInfo.name || "",
          title: p?.title || "",
          credentials: p?.credentials || "",
          bio: p?.bio || "",
          avatar_url: p?.avatar_url || userInfo.avatar || "",
          highlight: p?.highlight || "",
        });
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [userInfo]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!userInfo?.email) return;
    setSaving(true);
    setMessage("");
    try {
      const res = await fetch("/api/member/author-profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: userInfo.email,
          member_id: userInfo.id,
          ...form,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.error || "儲存失敗");
        return;
      }
      setMessage("已儲存作者資訊，將顯示於你的投稿文章內頁");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="py-12 flex items-center justify-center text-gray-400 text-sm">
        <Loader2 className="animate-spin mr-2" size={18} /> 載入作者資訊…
      </div>
    );
  }

  if (!eligible) {
    return (
      <div className="p-8 border border-dashed border-gray-200 text-center bg-gray-50">
        <User size={28} className="mx-auto text-gray-400 mb-3" />
        <p className="font-bold text-black mb-1">尚未開通作者資訊</p>
        <p className="text-xs text-gray-500 mb-4 max-w-sm mx-auto">
          通過進駐審核後，即可在此編輯文章內頁顯示的作者介紹欄。
        </p>
        <Link
          href="/member/apply"
          className="text-xs font-bold text-[#005caf] underline"
        >
          前往申請進駐
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h3 className="text-sm font-bold tracking-widest uppercase text-black">
          作者資訊
        </h3>
        <p className="text-xs text-gray-400 mt-1">
          顯示於你投稿文章內頁的作者欄，可隨時更新
        </p>
      </div>

      <form
        onSubmit={handleSave}
        className="border border-gray-100 bg-white p-6 space-y-4"
      >
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1.5">
              顯示名稱
            </label>
            <input
              name="display_name"
              value={form.display_name}
              onChange={handleChange}
              className="w-full border border-gray-200 rounded-md px-3 py-2.5 text-sm focus:outline-none focus:border-[#005caf]"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1.5">
              職稱／身分
            </label>
            <input
              name="title"
              value={form.title}
              onChange={handleChange}
              placeholder="例：進駐教練 · 活動主揪"
              className="w-full border border-gray-200 rounded-md px-3 py-2.5 text-sm focus:outline-none focus:border-[#005caf]"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-500 mb-1.5">
            經歷／認證（可用 ｜ 分隔）
          </label>
          <input
            name="credentials"
            value={form.credentials}
            onChange={handleChange}
            placeholder="例：PikFun 認證教練 ｜ 新莊地區主揪"
            className="w-full border border-gray-200 rounded-md px-3 py-2.5 text-sm focus:outline-none focus:border-[#005caf]"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-500 mb-1.5">
            作者介紹
          </label>
          <textarea
            name="bio"
            value={form.bio}
            onChange={handleChange}
            rows={5}
            placeholder="介紹你自己、教學風格或辦活動理念…"
            className="w-full border border-gray-200 rounded-md px-3 py-2.5 text-sm focus:outline-none focus:border-[#005caf] resize-y"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-500 mb-1.5">
            頭像網址
          </label>
          <input
            name="avatar_url"
            value={form.avatar_url}
            onChange={handleChange}
            placeholder="https://"
            className="w-full border border-gray-200 rounded-md px-3 py-2.5 text-sm focus:outline-none focus:border-[#005caf]"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-500 mb-1.5">
            重點詞（會以藍色標示，逗號分隔）
          </label>
          <input
            name="highlight"
            value={form.highlight}
            onChange={handleChange}
            placeholder="例：新手友善, 一對一"
            className="w-full border border-gray-200 rounded-md px-3 py-2.5 text-sm focus:outline-none focus:border-[#005caf]"
          />
        </div>

        {message && (
          <p
            className={`text-sm font-bold ${
              message.includes("失敗") ? "text-red-600" : "text-[#005caf]"
            }`}
          >
            {message}
          </p>
        )}

        <BluePillButton type="submit" loading={saving}>
          儲存作者資訊
        </BluePillButton>
      </form>
    </div>
  );
}
