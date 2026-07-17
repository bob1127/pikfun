"use client";

import { useEffect } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import {
  GraduationCap,
  Megaphone,
  MapPin,
  Users,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { useUser } from "@/components/context/UserContext";
import { APPLY_TYPES } from "@/lib/partnerApplications";
import { BlueArrowLink } from "@/components/ui/BlueCta";

const ICONS = {
  coach: GraduationCap,
  vendor: Megaphone,
  court_owner: MapPin,
  organizer: Users,
};

const ORDER = ["coach", "vendor", "court_owner", "organizer"];

export default function MemberApplyHubPage() {
  const router = useRouter();
  const { userInfo, loading: userLoading } = useUser();

  useEffect(() => {
    if (!userLoading && !userInfo) {
      router.push("/login?redirect=/member/apply");
    }
  }, [userLoading, userInfo, router]);

  if (userLoading || !userInfo) {
    return (
      <main className="min-h-screen pt-24 flex items-center justify-center text-gray-500">
        <Loader2 className="animate-spin mr-2" size={20} /> 載入中...
      </main>
    );
  }

  return (
    <>
      <Head>
        <title>申請進駐 | PikFun 匹克方</title>
      </Head>

      <main className="bg-white min-h-screen pt-24 pb-20">
        <div className="max-w-[960px] mx-auto px-6">
          <BlueArrowLink href="/member/posts" className="mb-6">
            返回我的投稿
          </BlueArrowLink>

          <h1 className="text-3xl font-black text-gray-900 mb-2">申請進駐</h1>

          <p className="text-sm text-gray-500 mb-10 max-w-xl">
            請選擇您的身分。通過審核後，教練、球場主與揪團主可於會員中心投稿並顯示於最新消息；廠商則進入廣告／曝光合作洽談。
          </p>

          <div className="grid sm:grid-cols-2 gap-4">
            {ORDER.map((key) => {
              const item = APPLY_TYPES[key];
              const Icon = ICONS[key];
              return (
                <Link
                  key={key}
                  href={item.href}
                  className="group flex gap-4 p-5 border border-gray-200 rounded-xl hover:border-[#005caf] hover:bg-[#f8fbff] transition-colors"
                >
                  <span className="shrink-0 w-12 h-12 rounded-full bg-[#005caf]/10 text-[#005caf] flex items-center justify-center group-hover:bg-[#005caf] group-hover:text-white transition-colors">
                    <Icon size={22} />
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h2 className="font-black text-gray-900">{item.label}</h2>
                      <span className="text-[10px] font-bold px-2 py-0.5 border border-[#005caf] text-[#005caf] rounded-sm">
                        {item.badge}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                  <span className="shrink-0 self-center inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#005caf] text-white opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all">
                    <ChevronRight size={16} strokeWidth={3} />
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </main>
    </>
  );
}
