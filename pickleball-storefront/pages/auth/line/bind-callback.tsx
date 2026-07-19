import React, { useEffect, useRef, useState } from "react";
import Head from "next/head";
import { Loader2, XCircle, BellRing } from "lucide-react";
import { useRouter } from "next/router";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useUser } from "@/components/context/UserContext";
import { fireCelebrationConfettiFromElement } from "@/lib/fireCelebrationConfetti";
import LineFriendRequiredModal, {
  LINE_OA_FRIEND_URL,
} from "@/components/line/LineFriendRequiredModal";
import JoinedSessionSummary from "@/components/play/JoinedSessionSummary";
import {
  StatusNotificationLayout,
  StatusStepsBand,
  StatusActionCard,
  StatusPanel,
} from "@/components/notifications/StatusNotificationLayout";

type Status = "processing" | "done" | "error";

const SUCCESS_STEPS = [
  {
    icon: "✓",
    label: "LINE 帳號綁定完成",
    desc: "你的 PikFun 會員已與 LINE 連結",
  },
  {
    icon: "＋",
    label: "加入官方好友",
    desc: "加入後才能收到推播提醒",
  },
  {
    icon: "🔔",
    label: "活動前自動提醒",
    desc: "前 1 天與 2 小時通知你",
  },
];

export default function LineBindCallback() {
  const router = useRouter();
  const { userInfo, loading: userLoading } = useUser();
  const bindStartedRef = useRef(false);
  const successCardRef = useRef<HTMLDivElement>(null);
  const confettiFiredRef = useRef(false);

  const [status, setStatus] = useState<Status>("processing");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [friendVerified, setFriendVerified] = useState(false);
  const [showFriendModal, setShowFriendModal] = useState(false);
  const [session, setSession] = useState<Record<string, unknown> | null>(null);

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

    const sid = state && state !== "bind" ? state : null;
    setSessionId(sid);

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

  useEffect(() => {
    if (status !== "done" || !userInfo?.email) return;

    (async () => {
      try {
        const params = new URLSearchParams({ email: userInfo.email! });
        const res = await fetch(`/api/line/friend-status?${params}`);
        if (!res.ok) return;
        const data = await res.json();
        if (data.friend_added) {
          setFriendVerified(true);
          setShowFriendModal(false);
        } else if (LINE_OA_FRIEND_URL) {
          setShowFriendModal(true);
        }
      } catch {
        if (LINE_OA_FRIEND_URL) setShowFriendModal(true);
      }
    })();
  }, [status, userInfo?.email]);

  useEffect(() => {
    if (!sessionId) return;

    (async () => {
      try {
        const params = new URLSearchParams();
        if (userInfo?.email) params.set("email", userInfo.email);
        const res = await fetch(`/api/play-sessions/${sessionId}?${params}`);
        if (!res.ok) return;
        const data = await res.json();
        setSession(data.session || null);
      } catch {
        setSession(null);
      }
    })();
  }, [sessionId, userInfo?.email]);

  const backHref = sessionId ? `/play/${sessionId}` : "/member";

  if (status === "processing") {
    return (
      <>
        <Head>
          <title>LINE 提醒設定 | PikFun</title>
        </Head>
        <StatusNotificationLayout
          watermark="SETTING"
          eyebrow="STATUS"
          title="設定中…"
          subtitle={
            userLoading
              ? "正在確認登入狀態，請稍候。"
              : "正在綁定你的 LINE 帳號，完成後即可接收活動提醒。"
          }
        >
          {session && (
            <div className="mb-6">
              <JoinedSessionSummary session={session} />
            </div>
          )}
          <StatusPanel variant="loading">
            <div className="flex items-center gap-4">
              <Loader2 className="animate-spin text-white/80" size={28} />
              <div>
                <p className="text-sm font-bold">處理中</p>
                <p className="mt-1 text-xs text-white/60">
                  {userLoading ? "確認會員登入…" : "連結 LINE OAuth…"}
                </p>
              </div>
            </div>
          </StatusPanel>
        </StatusNotificationLayout>
      </>
    );
  }

  if (status === "error") {
    return (
      <>
        <Head>
          <title>設定失敗 | PikFun</title>
        </Head>
        <StatusNotificationLayout
          watermark="ERROR"
          eyebrow="STATUS"
          title="設定失敗"
          subtitle={errorMsg}
        >
          <StatusPanel variant="error">
            <div className="flex items-start gap-4">
              <XCircle className="shrink-0 text-red-400" size={28} />
              <div>
                <p className="text-sm font-bold text-red-200">無法完成綁定</p>
                <p className="mt-2 text-xs leading-relaxed text-white/65">
                  請確認已登入 PikFun 會員，並重新從活動頁開啟 LINE 授權。
                </p>
              </div>
            </div>
          </StatusPanel>

          <div className="mt-6">
            <StatusActionCard
              href={backHref}
              icon={<XCircle size={18} className="text-red-300" />}
              title="返回重試"
              subtitle="回到活動頁重新設定 LINE 提醒"
              accent="#ef4444"
            />
          </div>
        </StatusNotificationLayout>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>LINE 提醒已開啟 | PikFun</title>
      </Head>

      <div ref={successCardRef}>
        <StatusNotificationLayout
          watermark="REMIND"
          eyebrow="SUCCESS"
          title="LINE 提醒已開啟 ✅"
          subtitle="活動前 1 天與 2 小時，PikFun 會透過 LINE 提醒你。"
        >
          {session && (
            <div className="mb-6">
              <JoinedSessionSummary session={session} />
            </div>
          )}

          <StatusStepsBand steps={SUCCESS_STEPS} />

          <div className="mt-6 space-y-3">
            {!friendVerified && LINE_OA_FRIEND_URL && (
              <StatusPanel>
                <p className="text-sm font-bold text-[#06C755]">
                  請完成加入官方 LINE 好友
                </p>
                <p className="mt-1 text-xs text-white/60">
                  彈出視窗會引導你完成，加入後才能收到 LINE 推播提醒。
                </p>
              </StatusPanel>
            )}

            <StatusPanel>
              <div className="flex items-start gap-3">
                <BellRing size={18} className="mt-0.5 shrink-0 text-[#3D8FD9]" />
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/50">
                    Email 備援
                  </p>
                  <p className="mt-1 text-sm text-white/75">
                    Email 提醒也已排程，雙重通知更安心。
                  </p>
                </div>
              </div>
            </StatusPanel>
          </div>
        </StatusNotificationLayout>
      </div>

      <LineFriendRequiredModal
        open={showFriendModal && !friendVerified}
        userEmail={userInfo?.email || ""}
        backHref={backHref}
        onVerified={() => {
          setFriendVerified(true);
          setShowFriendModal(false);
        }}
      />
    </>
  );
}

export async function getServerSideProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale || "zh-TW", ["common", "play"])),
    },
  };
}
