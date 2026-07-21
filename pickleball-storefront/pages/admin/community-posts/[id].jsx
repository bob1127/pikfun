"use client";

import { useState, useEffect } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { Loader2, Check, X, Instagram } from "lucide-react";
import { useUser } from "@/components/context/UserContext";
import { AUTHOR_ROLE_LABEL, categoryLabel } from "@/lib/communityPosts";
import { BlueArrowLink, BluePillButton } from "@/components/ui/BlueCta";
import CommunityInstagramPosts from "@/components/news/CommunityInstagramPosts";

export default function AdminCommunityPostDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const { userInfo, loading: userLoading } = useUser();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (userLoading) return;
    if (!userInfo?.email) {
      router.replace(`/login?redirect=/admin/community-posts/${id}`);
      return;
    }
    fetch(`/api/admin/check?email=${encodeURIComponent(userInfo.email)}`)
      .then((res) => res.json())
      .then((data) => {
        setIsAdmin(!!data.isAdmin);
        if (!data.isAdmin) router.replace("/news");
      });
  }, [userLoading, userInfo, router, id]);

  useEffect(() => {
    if (!id || !isAdmin || !userInfo?.email) return;
    setLoading(true);
    fetch(
      `/api/admin/community-posts/${id}?admin_email=${encodeURIComponent(userInfo.email)}`,
    )
      .then((res) => res.json())
      .then((data) => setPost(data.post || null))
      .finally(() => setLoading(false));
  }, [id, isAdmin, userInfo?.email]);

  const patch = async (action) => {
    if (!userInfo?.email) return;
    const admin_note =
      action === "reject" ? prompt("退回原因（選填）") || "" : "";

    setActing(true);
    try {
      const res = await fetch(`/api/admin/community-posts/${id}`, {
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
        alert("已核准！文章已上架。");
        router.push(`/news/${data.slug}`);
        return;
      }
      router.push("/admin/community-posts");
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

  if (!post) {
    return (
      <main className="min-h-screen pt-24 text-center">
        <p className="text-gray-500 mb-4">找不到文章</p>
        <Link href="/admin/community-posts" className="underline font-bold">
          返回列表
        </Link>
      </main>
    );
  }

  return (
    <>
      <Head>
        <title>審核：{post.title} | PikFun Admin</title>
      </Head>

      <main className="bg-[#F8FAFC] min-h-screen pt-24 pb-20">
        <div className="max-w-[820px] mx-auto px-6">
          <BlueArrowLink href="/admin/community-posts" className="mb-6">
            返回審核列表
          </BlueArrowLink>

          {post.status === "pending" && (
            <div className="bg-[#FFD43A] text-black text-sm font-bold px-4 py-3 rounded-lg mb-6">
              審核預覽 — 此文章尚未公開，核准後才會出現在 /news
            </div>
          )}

          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-6">
            {post.cover_image && (
              <img
                src={post.cover_image}
                alt=""
                className="w-full max-h-72 object-cover"
              />
            )}
            <div className="p-6 md:p-8">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100">
                  {post.status}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#005caf]/10 text-[#005caf]">
                  {categoryLabel(post.category)}
                </span>
              </div>
              <h1 className="text-2xl font-black mb-2">{post.title}</h1>
              <p className="text-sm text-gray-500 mb-6">
                {AUTHOR_ROLE_LABEL[post.author_role] || post.author_role} ·{" "}
                {post.author_name} · {post.author_email}
                {post.author_member_id && ` · ID: ${post.author_member_id}`}
              </p>

              <article
                className="prose prose-sm max-w-none prose-img:rounded-lg prose-a:text-[#005caf]"
                dangerouslySetInnerHTML={{ __html: post.content_html }}
              />

              {Array.isArray(post.instagram_urls) &&
              post.instagram_urls.length > 0 ? (
                <>
                  <div className="mt-8 rounded-lg border border-[#005caf]/15 bg-[#f3f7fc] p-4">
                    <div className="mb-3 flex items-center gap-2">
                      <Instagram size={15} className="text-[#005caf]" />
                      <p className="text-xs font-black text-gray-800">
                        附加 Instagram 貼文（{post.instagram_urls.length}）
                      </p>
                    </div>
                    <ul className="space-y-1.5">
                      {post.instagram_urls.map((url) => (
                        <li key={url}>
                          <a
                            href={url}
                            target="_blank"
                            rel="noreferrer"
                            className="break-all text-[11px] font-medium text-[#005caf] hover:underline"
                          >
                            {url}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <CommunityInstagramPosts
                    urls={post.instagram_urls}
                    className="mt-8 border-t border-gray-100 pt-8"
                  />
                </>
              ) : (
                <p className="mt-8 text-xs text-gray-400">
                  此投稿未附加 Instagram 貼文
                </p>
              )}

              <p className="text-xs text-gray-400 mt-8">
                投稿時間：
                {post.created_at
                  ? new Date(post.created_at).toLocaleString("zh-TW")
                  : ""}
              </p>
              {post.reviewed_by && (
                <p className="text-xs text-gray-400">
                  審核者：{post.reviewed_by} ·{" "}
                  {post.reviewed_at
                    ? new Date(post.reviewed_at).toLocaleString("zh-TW")
                    : ""}
                </p>
              )}
            </div>
          </div>

          {post.status === "pending" && (
            <div className="flex flex-wrap gap-3">
              <BluePillButton
                onClick={() => patch("approve")}
                disabled={acting}
                loading={acting}
                className="flex-1 min-w-[140px]"
              >
                <Check size={16} /> 核准上架
              </BluePillButton>
              <BluePillButton
                variant="outline"
                onClick={() => patch("reject")}
                disabled={acting}
                className="!border-red-400 !text-red-600"
              >
                <X size={16} /> 退回
              </BluePillButton>
            </div>
          )}

          {post.status === "approved" && (
            <BlueArrowLink href={`/news/${post.slug}`}>
              查看正式文章頁
            </BlueArrowLink>
          )}
        </div>
      </main>
    </>
  );
}
