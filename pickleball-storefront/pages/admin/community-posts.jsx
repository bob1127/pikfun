"use client";

import { useState, useEffect, useCallback } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { Loader2, ChevronRight } from "lucide-react";
import { useUser } from "@/components/context/UserContext";
import { AUTHOR_ROLE_LABEL, categoryLabel } from "@/lib/communityPosts";
import { BlueArrowLink, BluePillTabs } from "@/components/ui/BlueCta";

const STATUS_LABEL = {
  pending: "待審核",
  approved: "已上架",
  rejected: "已退回",
};

function formatDotDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}.${m}.${day}`;
}

export default function AdminCommunityPostsPage() {
  const router = useRouter();
  const { userInfo, loading: userLoading } = useUser();
  const [status, setStatus] = useState("pending");
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminChecked, setAdminChecked] = useState(false);

  useEffect(() => {
    if (userLoading) return;
    if (!userInfo?.email) {
      router.replace("/login?redirect=/admin/community-posts");
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

  const fetchPosts = useCallback(async () => {
    if (!userInfo?.email || !isAdmin) return;
    setLoading(true);
    try {
      const res = await fetch(
        `/api/admin/community-posts?status=${status}&admin_email=${encodeURIComponent(userInfo.email)}`,
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setPosts(data.posts || []);
    } catch {
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, [status, userInfo?.email, isAdmin]);

  useEffect(() => {
    if (!userLoading && isAdmin) fetchPosts();
  }, [fetchPosts, userLoading, isAdmin]);

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
        <title>社群投稿審核 | PikFun Admin</title>
      </Head>

      <main className="bg-white min-h-screen pt-24 pb-20">
        <div className="max-w-[920px] mx-auto px-6">
          <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
            <div>
              <h1 className="text-2xl font-black">社群投稿審核</h1>
              <p className="text-sm text-gray-500 mt-1">
                管理員：{userInfo.email}
              </p>
            </div>
            <div className="flex flex-wrap gap-5">
              <BlueArrowLink href="/admin/push">
                推播通知中心
              </BlueArrowLink>
              <BlueArrowLink href="/admin/partner-applications">
                進駐申請審核
              </BlueArrowLink>
              <BlueArrowLink href="/admin/community-authors">
                管理供稿白名單
              </BlueArrowLink>
              <BlueArrowLink href="/news">返回前台</BlueArrowLink>
            </div>
          </div>

          <div className="mb-8">
            <BluePillTabs
              value={status}
              onChange={setStatus}
              tabs={[
                { value: "pending", label: "待審核" },
                { value: "approved", label: "已上架" },
                { value: "rejected", label: "已退回" },
                { value: "all", label: "全部" },
              ]}
            />
          </div>

          {loading ? (
            <p className="text-gray-400 py-10">載入中...</p>
          ) : posts.length === 0 ? (
            <p className="text-gray-500 py-16 text-center border-t border-b border-gray-100">
              沒有資料
            </p>
          ) : (
            <div className="border-t border-gray-100">
              {posts.map((post) => (
                <Link
                  key={post.id}
                  href={`/admin/community-posts/${post.id}`}
                  className="group flex items-center gap-4 py-7 border-b border-gray-100 hover:bg-[#f8fbff] transition-colors -mx-2 px-2"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className="text-xs text-gray-400 font-mono">
                        {formatDotDate(post.created_at)}
                      </span>
                      <span className="inline-flex items-center text-[11px] font-bold px-2 py-0.5 border border-[#005caf] text-[#005caf] rounded-sm">
                        {STATUS_LABEL[post.status] || post.status}
                      </span>
                      <span className="inline-flex items-center text-[11px] font-bold px-2 py-0.5 border border-[#005caf]/40 text-[#005caf] rounded-sm">
                        {categoryLabel(post.category)}
                      </span>
                    </div>
                    <h2 className="text-base md:text-lg font-bold text-gray-900 leading-snug group-hover:text-[#005caf] transition-colors">
                      {post.title}
                    </h2>
                    <p className="text-xs text-gray-400 mt-1.5 truncate">
                      {AUTHOR_ROLE_LABEL[post.author_role] || post.author_role}{" "}
                      · {post.author_name}
                    </p>
                  </div>
                  <span className="shrink-0 inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#005caf] text-white group-hover:scale-110 transition-transform">
                    <ChevronRight size={16} strokeWidth={3} />
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
