import { useEffect, useRef } from "react";
import { useRouter } from "next/router";
import { persistSocialProfile } from "@/lib/socialProfile";

export default function LineCallback() {
  const router = useRouter();
  const isProcessing = useRef(false);

  useEffect(() => {
    // 1. 從網址列抓取 LINE 傳回來的 code 和 state
    const { code, state, error } = router.query;

    if (error) {
      alert("登入被取消或發生錯誤");
      router.push("/login");
      return;
    }

    if (code && state && !isProcessing.current) {
      isProcessing.current = true;
      const savedState = localStorage.getItem("line_oauth_state");

      // 2. 資安檢查：防止跨站請求偽造
      if (state !== savedState) {
        alert("資安驗證失敗：來源不符");
        router.push("/login");
        return;
      }

      // 3. 把 code 送去我們自己寫的 API 進行黑魔法交換
      fetch("/api/auth/line", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      })
        .then(async (res) => {
          const data = await res.json();
          if (data.token) {
            localStorage.setItem("medusa_auth_token", data.token);
            persistSocialProfile("line", {
              name: data.name,
              picture: data.picture,
              email: data.email,
            });

            localStorage.removeItem("is_google_login");
            localStorage.removeItem("is_facebook_login");
            localStorage.removeItem("google_name");
            localStorage.removeItem("google_avatar");
            localStorage.removeItem("facebook_name");
            localStorage.removeItem("facebook_avatar");

            window.location.href =
              router.locale === "zh-TW" || !router.locale
                ? "/"
                : `/${router.locale}`;
            return;
          }
          throw new Error(data.error || "登入失敗");
        })
        .catch((err) => {
          console.error(err);
          alert(err.message || "系統處理錯誤，請稍後再試");
          router.push("/login");
        });
    }
  }, [router.query, router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white">
      <div className="w-10 h-10 border-4 border-[#06C755] border-t-transparent rounded-full animate-spin"></div>
      <p className="mt-4 text-gray-500 text-sm tracking-widest uppercase font-bold">
        LINE 授權驗證中...
      </p>
    </div>
  );
}
