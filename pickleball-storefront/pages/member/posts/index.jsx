"use client";

import { useCallback, useEffect, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { Loader2, Trash2 } from "lucide-react";
import { useUser } from "@/components/context/UserContext";
import { categoryLabel } from "@/lib/communityPosts";
import { BlueArrowLink } from "@/components/ui/BlueCta";

function StatusBadge({ status }) {
  const map = {
    pending: { label: "審核中", className: "bg-[#FFD43A]/30 text-black" },
    approved: { label: "已上架", className: "bg-green-100 text-green-800" },
    rejected: { label: "未通過", className: "bg-red-100 text-red-700" },
  };
  const s = map[status] || map.pending;
  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${s.className}`}>
      {s.label}
    </span>
  );
}

export default function MemberPostsPage() {
  const router = useRouter();
  const { userInfo, loading: userLoading } = useUser();
  const [eligibility, setEligibility] = useState(null);
  const [checking, setChecking] = useState(true);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    if (!userLoading && !userInfo) {
      router.push("/login?redirect=/member/posts");
    }
  }, [userLoading, userInfo, router]);

  useEffect(() => {
    if (userLoading || !userInfo?.email) return;
    fetch(`/api/community-posts/eligibility?email=${encodeURIComponent(userInfo.email)}`)
      .then((r) => r.json())
      .then(setEligibility)
      .catch(() => setEligibility({ eligible: false }))
      .finally(() => setChecking(false));
  }, [userLoading, userInfo]);

  const fetchPosts = useCallback(async () => {
    if (!userInfo?.email) return;
    setLoading(true);
    try {
      const res = await fetch(
        `/api/community-posts?email=${encodeURIComponent(userInfo.email)}`,
      );
      const data = await res.json();
      setPosts(data.posts || []);
    } catch {
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, [userInfo?.email]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const handleDelete = async (post) => {
    if (!confirm(`確定要刪除「${post.title}」嗎？`)) return;
    setDeletingId(post.id);
    try {
      const res = await fetch(`/api/community-posts/${post.id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: userInfo.email }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "刪除失敗");
        return;
      }
      await fetchPosts();
    } finally {
      setDeletingId(null);
    }
  };

  if (userLoading || checking) {
    return (
      <main className="min-h-screen pt-24 flex items-center justify-center text-gray-500">
        <Loader2 className="animate-spin mr-2" size={20} /> 載入中...
      </main>
    );
  }

  return (
    <>
      <Head>
        <title>我的投稿 | PikFun 匹克方</title>
      </Head>

      <main className="bg-[#F8FAFC] min-h-screen pt-24 pb-20">
        <div className="max-w-[900px] mx-auto px-6">
          <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
            <div>
              <h1 className="text-2xl font-black">我的投稿</h1>
              <p className="text-sm text-gray-500 mt-1">
                通過審核的文章將顯示於{" "}
                <Link href="/news" className="text-[#005caf] underline">
                  最新消息
                </Link>
              </p>
            </div>
            {eligibility?.eligible ? (
              <BlueArrowLink href="/member/posts/new">新增投稿</BlueArrowLink>
            ) : null}
          </div>

          {!eligibility?.eligible && (
            <div className="p-6 border border-dashed border-gray-300 bg-white rounded-xl text-center mb-8">
              <p className="font-bold text-black mb-1">尚未開通投稿權限</p>
              <p className="text-sm text-gray-500 max-w-md mx-auto">
                通過「申請進駐」審核（教練、球場主或揪團主）後，即可在此發表文章並顯示於最新消息。
              </p>
              <div className="flex flex-wrap justify-center gap-5 mt-5">
                <BlueArrowLink href="/member/apply">申請進駐</BlueArrowLink>
                <BlueArrowLink href="/contact">聯繫合作洽談</BlueArrowLink>
              </div>
            </div>
          )}

          {loading ? (
            <p className="text-gray-400">載入中...</p>
          ) : posts.length === 0 ? (
            eligibility?.eligible && (
              <div className="p-10 text-center text-gray-500 bg-white rounded-xl border border-gray-200">
                還沒有投稿，點擊「新增投稿」開始撰寫第一篇文章吧！
              </div>
            )
          ) : (
            <div className="space-y-4">
              {posts.map((post) => (
                <div
                  key={post.id}
                  className="bg-white rounded-xl border border-gray-200 p-5 flex gap-4"
                >
                  <div className="w-20 h-20 shrink-0 rounded-lg overflow-hidden bg-gray-100">
                    {post.cover_image ? (
                      <img
                        src={post.cover_image}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[10px] text-gray-400">
                        無封面
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h2 className="font-bold text-sm text-black truncate">
                        {post.title}
                      </h2>
                      <StatusBadge status={post.status} />
                    </div>
                    <p className="text-xs text-gray-400 mb-2">
                      {categoryLabel(post.category)} ·{" "}
                      {new Date(post.created_at).toLocaleDateString("zh-TW")}
                    </p>
                    {post.status === "rejected" && post.admin_note && (
                      <p className="text-xs text-red-600 mb-2">
                        退回原因：{post.admin_note}
                      </p>
                    )}
                    <div className="flex flex-wrap items-center gap-4 mt-1">
                      {post.status !== "approved" && (
                        <BlueArrowLink href={`/member/posts/${post.id}/edit`}>
                          編輯
                        </BlueArrowLink>
                      )}
                      {post.status === "approved" && (
                        <BlueArrowLink href={`/news/${post.slug}`}>
                          查看文章
                        </BlueArrowLink>
                      )}
                      {post.status !== "approved" && (
                        <button
                          onClick={() => handleDelete(post)}
                          disabled={deletingId === post.id}
                          className="inline-flex items-center gap-1 text-xs font-bold text-gray-400 hover:text-red-600 disabled:opacity-50"
                        >
                          <Trash2 size={12} /> 刪除
                        </button>
                      )}
                    </div>
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
