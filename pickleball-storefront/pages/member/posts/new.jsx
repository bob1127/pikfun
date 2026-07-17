"use client";

import { useEffect, useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { Loader2 } from "lucide-react";
import { useUser } from "@/components/context/UserContext";
import CommunityPostForm from "@/components/member/CommunityPostForm";
import { BlueArrowLink } from "@/components/ui/BlueCta";

export default function NewCommunityPostPage() {
  const router = useRouter();
  const { userInfo, loading: userLoading } = useUser();
  const [eligibility, setEligibility] = useState(null);
  const [checking, setChecking] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!userLoading && !userInfo) {
      router.push("/login?redirect=/member/posts/new");
    }
  }, [userLoading, userInfo, router]);

  useEffect(() => {
    if (userLoading || !userInfo?.email) return;
    fetch(`/api/community-posts/eligibility?email=${encodeURIComponent(userInfo.email)}`)
      .then((r) => r.json())
      .then((data) => {
        setEligibility(data);
        if (!data.eligible) router.replace("/member/posts");
      })
      .catch(() => router.replace("/member/posts"))
      .finally(() => setChecking(false));
  }, [userLoading, userInfo, router]);

  const handleSubmit = async (values) => {
    if (!userInfo?.email) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/community-posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          author_member_id: userInfo.id,
          author_email: userInfo.email,
          author_name: userInfo.name,
          author_avatar: userInfo.avatar,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "送出失敗");
        return;
      }
      alert("已送出審核，通過後將顯示於最新消息");
      router.push("/member/posts");
    } finally {
      setSubmitting(false);
    }
  };

  if (userLoading || checking || !eligibility?.eligible) {
    return (
      <main className="min-h-screen pt-24 flex items-center justify-center text-gray-500">
        <Loader2 className="animate-spin mr-2" size={20} /> 載入中...
      </main>
    );
  }

  return (
    <>
      <Head>
        <title>新增投稿 | PikFun 匹克方</title>
      </Head>

      <main className="bg-[#F8FAFC] min-h-screen pt-24 pb-20">
        <div className="max-w-[1180px] mx-auto px-6">
          <BlueArrowLink href="/member/posts" className="mb-6">
            返回我的投稿
          </BlueArrowLink>

          <h1 className="text-2xl font-black mb-8">新增投稿</h1>

          <CommunityPostForm
            role={eligibility.role}
            submitting={submitting}
            submitLabel="送出審核"
            onSubmit={handleSubmit}
            onCancel={() => router.push("/member/posts")}
          />
        </div>
      </main>
    </>
  );
}
