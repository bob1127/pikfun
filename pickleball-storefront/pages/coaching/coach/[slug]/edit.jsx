"use client";

import { useEffect } from "react";
import { useRouter } from "next/router";
import { Loader2 } from "lucide-react";

/** 舊編輯頁網址導回教練頁（就地編輯） */
export default function CoachEditRedirectPage() {
  const router = useRouter();
  const { slug } = router.query;

  useEffect(() => {
    if (slug) {
      router.replace(`/coaching/coach/${slug}`);
    }
  }, [slug, router]);

  return (
    <main className="min-h-screen pt-24 flex items-center justify-center bg-[#E8E8E3]">
      <Loader2 className="animate-spin mr-2" size={20} /> 導向教練頁…
    </main>
  );
}
