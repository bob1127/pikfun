"use client";

import { useEffect } from "react";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { Loader2 } from "lucide-react";

export async function getServerSideProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ["coaching", "common"])),
    },
  };
}

/** 舊編輯頁網址導回教練頁（就地編輯） */
export default function CoachEditRedirectPage() {
  const { t } = useTranslation("coaching");
  const router = useRouter();
  const { slug } = router.query;

  useEffect(() => {
    if (slug) {
      router.replace(`/coaching/coach/${slug}`);
    }
  }, [slug, router]);

  return (
    <main className="min-h-screen pt-24 flex items-center justify-center bg-[#E8E8E3]">
      <Loader2 className="animate-spin mr-2" size={20} /> {t("edit.redirecting")}
    </main>
  );
}
