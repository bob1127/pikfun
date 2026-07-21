"use client";

import { useEffect, useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { Loader2 } from "lucide-react";
import { useUser } from "@/components/context/UserContext";
import {
  APPLY_TYPES,
  APPLY_TYPE_LABEL,
} from "@/lib/partnerApplications";
import { BlueArrowLink } from "@/components/ui/BlueCta";
import ConfettiButton from "@/components/ui/ConfettiButton";

const VALID_TYPES = ["vendor", "court_owner", "organizer"];

const PLACEHOLDERS = {
  vendor: {
    company: "品牌／公司名稱",
    message:
      "請簡述想曝光的商品或服務、預算區間、希望放置的版位或活動合作構想…",
  },
  court_owner: {
    company: "球場／場地名稱",
    message: "請簡述球場位置、開放時段、希望宣傳的內容，以及聯絡方式…",
  },
  organizer: {
    company: "社團／活動名稱（選填）",
    message: "請簡述常辦的揪團或活動類型、地區，以及希望 PikFun 協助曝光的方式…",
  },
};

export default function PartnerApplyFormPage() {
  const router = useRouter();
  const { type } = router.query;
  const { userInfo, loading: userLoading } = useUser();
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    company: "",
    phone: "",
    city: "",
    website: "",
    line_url: "",
    instagram_url: "",
    facebook_url: "",
    message: "",
  });

  useEffect(() => {
    if (!userLoading && !userInfo) {
      router.push(`/login?redirect=/member/apply/${type || ""}`);
    }
  }, [userLoading, userInfo, router, type]);

  useEffect(() => {
    if (!type) return;
    if (type === "coach") {
      router.replace("/coaching/apply");
      return;
    }
    if (!VALID_TYPES.includes(type)) {
      router.replace("/member/apply");
    }
  }, [type, router]);

  if (userLoading || !userInfo || !type || !VALID_TYPES.includes(type)) {
    return (
      <main className="min-h-screen pt-24 flex items-center justify-center text-gray-500">
        <Loader2 className="animate-spin mr-2" size={20} /> 載入中...
      </main>
    );
  }

  const meta = APPLY_TYPES[type];
  const ph = PLACEHOLDERS[type];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmitClick = async () => {
    setError("");
    if (!form.message?.trim()) {
      setError("請填寫申請說明");
      throw new Error("請填寫申請說明");
    }
    if (type !== "organizer" && !form.company?.trim()) {
      setError("請填寫名稱");
      throw new Error("請填寫名稱");
    }

    const res = await fetch("/api/partner-applications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        apply_type: type,
        member_id: userInfo.id,
        applicant_email: userInfo.email,
        applicant_name: userInfo.name,
        applicant_avatar: userInfo.avatar,
        ...form,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "送出失敗");
      throw new Error(data.error || "送出失敗");
    }
    setTimeout(() => setDone(true), 1200);
  };

  if (done) {
    return (
      <>
        <Head>
          <title>申請已送出 | PikFun</title>
        </Head>
        <main className="bg-white min-h-screen pt-24 pb-20">
          <div className="max-w-[560px] mx-auto px-6 text-center">
            <p className="text-xs font-bold tracking-widest uppercase text-[#005caf] mb-2">
              Submitted
            </p>
            <h1 className="text-2xl font-black mb-3">申請已送出審核</h1>
            <p className="text-sm text-gray-500 mb-8">
              我們已收到您的「{APPLY_TYPE_LABEL[type]}」申請，通過後會以 Email
              通知，並開通對應權限。
            </p>
            <div className="flex flex-wrap justify-center gap-5">
              <BlueArrowLink href="/member/posts">返回我的投稿</BlueArrowLink>
              <BlueArrowLink href="/member/apply">繼續申請其他身分</BlueArrowLink>
            </div>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>{meta.label}申請 | PikFun</title>
      </Head>

      <main className="bg-[#F8FAFC] min-h-screen pt-24 pb-20">
        <div className="max-w-[640px] mx-auto px-6">
          <BlueArrowLink href="/member/apply" className="mb-6">
            返回申請進駐
          </BlueArrowLink>

          <p className="text-xs font-bold tracking-[0.2em] uppercase text-[#005caf] mb-2">
            {meta.badge}
          </p>
          <h1 className="text-2xl font-black mb-2">{meta.label}申請</h1>
          <div className="w-14 h-1 bg-[#005caf] mb-3" />
          <p className="text-sm text-gray-500 mb-8">{meta.desc}</p>

          <form
            onSubmit={(e) => e.preventDefault()}
            className="bg-white border border-gray-200 rounded-xl p-6 md:p-8 space-y-5"
          >
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1.5">
                  申請人
                </label>
                <input
                  disabled
                  value={userInfo.name}
                  className="w-full border border-gray-200 rounded-md px-3 py-2.5 text-sm bg-gray-50 text-gray-600"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1.5">
                  Email
                </label>
                <input
                  disabled
                  value={userInfo.email}
                  className="w-full border border-gray-200 rounded-md px-3 py-2.5 text-sm bg-gray-50 text-gray-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1.5">
                {ph.company.includes("選填") ? ph.company : `${ph.company} *`}
              </label>
              <input
                name="company"
                value={form.company}
                onChange={handleChange}
                required={type !== "organizer"}
                className="w-full border border-gray-200 rounded-md px-3 py-2.5 text-sm focus:outline-none focus:border-[#005caf]"
                placeholder={ph.company}
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1.5">
                  聯絡電話
                </label>
                <input
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  className="w-full border border-gray-200 rounded-md px-3 py-2.5 text-sm focus:outline-none focus:border-[#005caf]"
                  placeholder="09xxxxxxxx"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1.5">
                  縣市／地區
                </label>
                <input
                  name="city"
                  value={form.city}
                  onChange={handleChange}
                  className="w-full border border-gray-200 rounded-md px-3 py-2.5 text-sm focus:outline-none focus:border-[#005caf]"
                  placeholder="例：新北市"
                />
              </div>
            </div>

            <div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1.5">
                  網站／粉專
                </label>
                <input
                  name="website"
                  value={form.website}
                  onChange={handleChange}
                  className="w-full border border-gray-200 rounded-md px-3 py-2.5 text-sm focus:outline-none focus:border-[#005caf]"
                  placeholder="https://"
                />
              </div>
            </div>

            <div>
              <p className="mb-3 text-xs font-bold text-gray-500">
                社群連結（選填）
              </p>
              <div className="grid gap-4 sm:grid-cols-3">
                {[
                  {
                    name: "line_url",
                    label: "LINE",
                    placeholder: "https://line.me/...",
                  },
                  {
                    name: "instagram_url",
                    label: "Instagram",
                    placeholder: "https://instagram.com/...",
                  },
                  {
                    name: "facebook_url",
                    label: "Facebook",
                    placeholder: "https://facebook.com/...",
                  },
                ].map((field) => (
                  <div key={field.name}>
                    <label className="block text-xs font-bold text-gray-500 mb-1.5">
                      {field.label}
                    </label>
                    <input
                      type="url"
                      name={field.name}
                      value={form[field.name]}
                      onChange={handleChange}
                      className="w-full border border-gray-200 rounded-md px-3 py-2.5 text-sm focus:outline-none focus:border-[#005caf]"
                      placeholder={field.placeholder}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1.5">
                申請說明 *
              </label>
              <textarea
                name="message"
                value={form.message}
                onChange={handleChange}
                required
                rows={5}
                className="w-full border border-gray-200 rounded-md px-3 py-2.5 text-sm focus:outline-none focus:border-[#005caf] resize-y"
                placeholder={ph.message}
              />
            </div>

            {error && (
              <p className="text-sm font-bold text-red-600">{error}</p>
            )}

            <ConfettiButton
              onClick={handleSubmitClick}
              successLabel="成功送出申請"
              className="w-full rounded-full bg-[#005caf] px-5 py-2.5 text-sm font-bold text-white hover:opacity-90"
            >
              送出申請
            </ConfettiButton>
          </form>
        </div>
      </main>
    </>
  );
}
