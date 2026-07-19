"use client";

import { useState, useEffect, useCallback } from "react";
import { Mail, Shield, User, LogOut, Bell, CheckCircle2, RefreshCw } from "lucide-react";
import { useUser } from "@/components/context/UserContext";
import { enableWebPush, getPushStatus, isPushSupported } from "@/lib/webPushClient";

function loginProviderLabel() {
  if (typeof window === "undefined") return "—";
  if (localStorage.getItem("is_google_login") === "true") return "Google";
  if (localStorage.getItem("is_line_login") === "true") return "LINE";
  if (localStorage.getItem("is_facebook_login") === "true") return "Facebook";
  return "Email 密碼";
}

function MemberAvatarLarge({ userInfo }) {
  const initial = userInfo?.name?.charAt(0)?.toUpperCase() || "U";
  if (userInfo?.avatar) {
    return (
      <img
        src={userInfo.avatar}
        alt=""
        className="w-16 h-16 rounded-full object-cover border border-gray-300 bg-gray-50"
      />
    );
  }
  return (
    <span className="w-16 h-16 rounded-full border border-gray-300 bg-gray-100 flex items-center justify-center text-xl font-bold text-gray-500">
      {initial}
    </span>
  );
}

function InfoBlock({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-gray-100 last:border-0">
      <Icon size={16} className="text-[#2563eb] mt-0.5 shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">
          {label}
        </p>
        <p className="text-sm font-semibold text-gray-900 break-all">{value || "—"}</p>
      </div>
    </div>
  );
}

function PushNotifySection() {
  const [status, setStatus] = useState(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(null);

  const refresh = useCallback(async () => {
    if (!isPushSupported()) {
      setStatus({ supported: false, permission: "unsupported", subscribed: false });
      return;
    }
    const s = await getPushStatus();
    setStatus(s);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const onEnable = async () => {
    setBusy(true);
    setMessage(null);
    try {
      const result = await enableWebPush({ forceRenew: true });
      if (result === "done") {
        setMessage({ type: "ok", text: "推播已重新開啟，此裝置可以收到通知了。" });
        await refresh();
      } else if (result === "blocked") {
        setMessage({
          type: "hint",
          text: "通知權限已被封鎖。Chrome／Edge：點網址列左側鎖頭 → 通知改為允許；Safari：Safari → 設定 → 網站 → 通知，把 pikfun.com.tw 改為允許後再按一次。",
        });
        await refresh();
      } else if (result === "unsupported") {
        setMessage({
          type: "err",
          text: "此瀏覽器暫不支援推播（iPhone 請先加入主畫面，再從主畫面開啟）。",
        });
      } else {
        setMessage({ type: "hint", text: "尚未允許通知，請再試一次並按「允許」。" });
      }
    } catch (e) {
      console.error("[push] re-enable failed:", e);
      setMessage({
        type: "err",
        text: e.message || "設定失敗，請稍後再試。",
      });
    } finally {
      setBusy(false);
    }
  };

  if (!status) return null;

  const statusLabel = !status.supported
    ? "此裝置不支援"
    : status.permission === "denied"
      ? "已封鎖"
      : status.subscribed
        ? "已開啟"
        : status.permission === "granted"
          ? "權限已允許（尚未綁定）"
          : "尚未設定";

  const statusColor = status.subscribed
    ? "text-[#16a34a]"
    : status.permission === "denied"
      ? "text-[#dc2626]"
      : "text-gray-500";

  return (
    <div className="border border-gray-100 bg-white p-6 mb-6">
      <div className="flex items-start gap-3 mb-4">
        <Bell size={18} className="text-[#2563eb] mt-0.5 shrink-0" />
        <div className="min-w-0 flex-1">
          <h4 className="text-sm font-bold text-gray-900">推播通知</h4>
          <p className="text-xs text-gray-500 mt-1 leading-relaxed">
            揪團提醒、最新消息會透過系統通知送到這台裝置。若收不到，可在此重新開啟。
          </p>
          <p className={`text-xs font-semibold mt-2 ${statusColor}`}>
            目前狀態：{statusLabel}
          </p>
        </div>
      </div>

      {status.subscribed ? (
        <div className="flex items-center gap-2 text-[#16a34a] text-sm font-bold mb-3">
          <CheckCircle2 size={16} />
          此裝置已訂閱推播
        </div>
      ) : null}

      <button
        type="button"
        onClick={onEnable}
        disabled={busy || !status.supported}
        className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold tracking-widest bg-[#005caf] text-white hover:bg-[#004a8f] transition-colors disabled:opacity-50"
      >
        <RefreshCw size={14} className={busy ? "animate-spin" : ""} />
        {busy ? "設定中…" : status.subscribed ? "重新開啟推播" : "開啟推播通知"}
      </button>

      {message && (
        <p
          className={`text-xs mt-3 leading-relaxed ${
            message.type === "ok"
              ? "text-[#16a34a]"
              : message.type === "err"
                ? "text-[#dc2626]"
                : "text-gray-600"
          }`}
        >
          {message.text}
        </p>
      )}
    </div>
  );
}

export default function MemberSettingsPanel() {
  const { userInfo, logout } = useUser();
  const [provider, setProvider] = useState("—");

  useEffect(() => {
    setProvider(loginProviderLabel());
  }, []);
  const isSocial =
    provider === "Google" || provider === "LINE" || provider === "Facebook";

  if (!userInfo) return null;

  return (
    <div>
      <div className="mb-8">
        <h3 className="text-sm font-bold tracking-widest uppercase text-black">
          帳號設定
        </h3>
        <p className="text-xs text-gray-400 mt-1">管理個人資料、推播與登入方式</p>
      </div>

      <div className="border border-gray-100 bg-white p-6 mb-6">
        <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-100">
          <MemberAvatarLarge userInfo={userInfo} />
          <div>
            <p className="text-lg font-bold text-gray-900">
              Hi，{userInfo.name || "會員"}
            </p>
            <p className="text-sm text-gray-500 mt-0.5">{userInfo.email}</p>
          </div>
        </div>

        <InfoBlock icon={User} label="顯示名稱" value={userInfo.name} />
        <InfoBlock icon={Mail} label="Email" value={userInfo.email} />
        <InfoBlock icon={Shield} label="登入方式" value={provider} />
      </div>

      <PushNotifySection />

      <div className="border border-gray-100 bg-[#f8fafc] p-5 mb-6">
        <p className="text-xs font-bold text-[#1e4976] uppercase tracking-widest mb-2">
          帳號安全
        </p>
        {isSocial ? (
          <p className="text-sm text-gray-600 leading-relaxed">
            您目前使用 <strong>{provider}</strong> 快速登入。頭像與名稱會同步自 {provider}{" "}
            帳號；若要更換帳號，請先登出後以其他方式登入。
          </p>
        ) : (
          <p className="text-sm text-gray-600 leading-relaxed">
            您使用 Email 密碼登入。若需重設密碼，請至登入頁使用「忘記密碼」功能。
          </p>
        )}
      </div>

      <button
        type="button"
        onClick={() => logout()}
        className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-red-600 hover:bg-red-50 transition-colors"
      >
        <LogOut size={14} />
        登出帳號
      </button>
    </div>
  );
}
