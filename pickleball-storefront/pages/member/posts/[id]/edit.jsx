"use client";

import { useEffect, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { Loader2 } from "lucide-react";
import { useUser } from "@/components/context/UserContext";
import CommunityPostForm from "@/components/member/CommunityPostForm";
import { BlueArrowLink } from "@/components/ui/BlueCta";

export default function EditCommunityPostPage() {
  const router = useRouter();
  const { id } = router.query;
  const { userInfo, loading: userLoading } = useUser();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!userLoading && !userInfo) {
      router.push(`/login?redirect=/member/posts/${id}/edit`);
    }
  }, [userLoading, userInfo, router, id]);

  useEffect(() => {
    if (!id || !userInfo?.email) return;
    setLoading(true);
    fetch(`/api/community-posts/${id}?email=${encodeURIComponent(userInfo.email)}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "找不到文章");
        setPost(data.post);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id, userInfo?.email]);

  const handleSubmit = async (values) => {
    if (!userInfo?.email) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/community-posts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, email: userInfo.email }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "更新失敗");
        return;
      }
      alert("已重新送出審核");
      router.push("/member/posts");
    } finally {
      setSubmitting(false);
    }
  };

  if (userLoading || loading) {
    return (
      <main className="min-h-screen pt-24 flex items-center justify-center text-gray-500">
        <Loader2 className="animate-spin mr-2" size={20} /> 載入中...
      </main>
    );
  }

  if (error || !post) {
    return (
      <main className="min-h-screen pt-24 text-center">
        <p className="text-gray-500 mb-4">{error || "找不到文章"}</p>
        <Link href="/member/posts" className="underline font-bold">
          返回我的投稿
        </Link>
      </main>
    );
  }

  return (
    <>
      <Head>
        <title>編輯投稿 | PikFun 匹克方</title>
      </Head>

      <main className="bg-[#F8FAFC] min-h-screen pt-24 pb-20">
        <div className="max-w-[1180px] mx-auto px-6">
          <BlueArrowLink href="/member/posts" className="mb-6">
            返回我的投稿
          </BlueArrowLink>

          <h1 className="text-2xl font-black mb-8">編輯投稿</h1>

          {post.status === "approved" && (
            <p className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              此文章目前已上架。送出修改後會重新進入審核，通過後才會再次公開。
            </p>
          )}

          <CommunityPostForm
            initialValues={post}
            role={post.author_role}
            submitting={submitting}
            submitLabel="重新送出審核"
            rejectedNote={post.status === "rejected" ? post.admin_note : ""}
            onSubmit={handleSubmit}
            onCancel={() => router.push("/member/posts")}
          />
        </div>
      </main>
    </>
  );
}
