import React, { useEffect, useRef, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { useUser } from "@/components/context/UserContext";
import { fireCelebrationConfettiFromElement } from "@/lib/fireCelebrationConfetti";

// ─── 填入官方帳號加好友連結（留空，之後在 .env.local 設定）──────────────
// LINE_OA_FRIEND_URL 範例：https://line.me/R/ti/p/@你的OA帳號ID
const LINE_OA_FRIEND_URL = process.env.NEXT_PUBLIC_LINE_OA_FRIEND_URL || "";
// ──────────────────────────────────────────────────────────────────────────

type Status = "processing" | "done" | "error";

export default function LineBindCallback() {
  const router = useRouter();
  const { userInfo, loading: userLoading } = useUser();
  const bindStartedRef = useRef(false);
  const successCardRef = useRef<HTMLDivElement>(null);
  const confettiFiredRef = useRef(false);

  const [status, setStatus] = useState<Status>("processing");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (!router.isReady) return;

    const { code, state, error } = router.query as Record<string, string>;

    if (error) {
      setStatus("error");
      setErrorMsg("LINE 授權被拒絕，請重試");
      return;
    }

    if (!code) {
      setStatus("error");
      setErrorMsg("缺少授權碼，請重新操作");
      return;
    }

    // state 格式：sessionId（可為空字串，純綁定模式）
    const sid = state && state !== "bind" ? state : null;
    setSessionId(sid);

    // 等 Google / Email / LINE 登入狀態從 localStorage 載入完，避免誤判未登入
    if (userLoading) return;

    const customerEmail = userInfo?.email;
    if (!customerEmail) {
      setStatus("error");
      setErrorMsg("尚未登入，請先登入後再操作");
      return;
    }

    if (bindStartedRef.current) return;
    bindStartedRef.current = true;

    (async () => {
      try {
        const res = await fetch("/api/line/bind", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            code,
            session_id: sid,
            customer_email: customerEmail,
          }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "綁定失敗");
        setStatus("done");
      } catch (e: any) {
        setStatus("error");
        setErrorMsg(e.message || "發生錯誤，請重試");
      }
    })();
  }, [router.isReady, router.query, userInfo?.email, userLoading]);

  useEffect(() => {
    if (status !== "done" || confettiFiredRef.current) return;
    confettiFiredRef.current = true;
    requestAnimationFrame(() => {
      fireCelebrationConfettiFromElement(successCardRef.current);
    });
  }, [status]);

  const backHref = sessionId ? `/play/${sessionId}` : "/member";

  return (
    <>
      <Head>
        <title>LINE 提醒設定 | PikFun</title>
      </Head>

      <main className="min-h-screen bg-[#F8FAFC] flex items-center justify-center px-4 py-20">
        <div
          ref={successCardRef}
          className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
        >
          {/* 彩色頂條 */}
          <div className="h-1.5 bg-gradient-to-r from-[#005caf] via-[#06C755] to-[#005caf]" />

          <div className="p-8 text-center">
            {status === "processing" && (
              <>
                <Loader2
                  className="animate-spin text-[#005caf] mx-auto mb-4"
                  size={40}
                />
                <p className="font-bold text-gray-800 text-lg">設定中…</p>
                <p className="text-sm text-gray-500 mt-2">
                  {userLoading ? "正在確認登入狀態…" : "正在綁定你的 LINE 帳號"}
                </p>
              </>
            )}

            {status === "done" && (
              <>
                <CheckCircle2
                  className="text-[#06C755] mx-auto mb-4"
                  size={48}
                />
                <p className="font-black text-gray-900 text-xl mb-1">
                  LINE 提醒已開啟 ✅
                </p>
                <p className="text-sm text-gray-500 leading-relaxed mb-6">
                  活動前 1 天與 2 小時
                  <br />
                  會透過 LINE 提醒你
                </p>

                {/* 加好友 CTA（最重要的一步） */}
                {LINE_OA_FRIEND_URL ? (
                  <a
                    href={LINE_OA_FRIEND_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full py-4 rounded-full text-white font-bold text-sm mb-3 hover:opacity-90 transition-opacity"
                    style={{ backgroundColor: "#06C755" }}
                  >
                    📱 加入 PikPie 官方 LINE 好友
                    <br />
                    <span className="text-xs font-normal opacity-90">
                      （加入後才能收到提醒）
                    </span>
                  </a>
                ) : (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 mb-4 text-xs text-yellow-700">
                    請設定 <code>NEXT_PUBLIC_LINE_OA_FRIEND_URL</code> 環境變數
                  </div>
                )}

                <Link
                  href={backHref}
                  className="block text-sm text-[#005caf] font-bold hover:underline"
                >
                  返回活動頁
                </Link>
              </>
            )}

            {status === "error" && (
              <>
                <XCircle className="text-red-500 mx-auto mb-4" size={48} />
                <p className="font-bold text-gray-900 text-lg mb-1">
                  設定失敗
                </p>
                <p className="text-sm text-red-500 mb-6">{errorMsg}</p>
                <Link
                  href={backHref}
                  className="block w-full py-3.5 rounded-full bg-[#005caf] text-white font-bold text-sm hover:opacity-90 transition-opacity"
                >
                  返回重試
                </Link>
              </>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
