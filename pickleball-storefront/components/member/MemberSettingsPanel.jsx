"use client";

import { useState, useEffect } from "react";
import { Mail, Shield, User, LogOut } from "lucide-react";
import { useUser } from "@/components/context/UserContext";

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
        <p className="text-xs text-gray-400 mt-1">管理個人資料與登入方式</p>
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

      <div className="border border-gray-100 bg-[#f8fafc] p-5 mb-6">
        <p className="text-xs font-bold text-[#1e4976] uppercase tracking-widest mb-2">
          帳號安全
        </p>
        {isSocial ? (
          <p className="text-sm text-gray-600 leading-relaxed">
            您目前使用 <strong>{provider}</strong> 快速登入。頭像與名稱會同步自 {provider} 帳號；若要更換帳號，請先登出後以其他方式登入。
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
