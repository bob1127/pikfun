import React, { useState, useRef } from "react";
import Link from "next/link";
import Head from "next/head";
import { useRouter } from "next/router";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, ArrowLeft } from "lucide-react";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import ConfettiButton from "@/components/ui/ConfettiButton";

const SITE = {
  accent: "#005caf",
  accentDark: "#1a3a8a",
  accentWarm: "#ef4023",
  border: "#d8d8d8",
  muted: "#555555",
};

// 🔵 Google 圖示組件
const GoogleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24">
    <path
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      fill="#4285F4"
    />
    <path
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      fill="#34A853"
    />
    <path
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      fill="#FBBC05"
    />
    <path
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      fill="#EA4335"
    />
  </svg>
);

// 🟢 LINE 圖示組件
const LineIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#06C755">
    <path d="M24 10.304c0-5.369-5.383-9.738-12-9.738-6.616 0-12 4.369-12 9.738 0 4.814 4.269 8.846 10.036 9.608.391.084.922.258 1.057.592.122.298.079.76.038 1.057l-.239 1.442c-.063.385-.296 1.442 1.265.783 1.562-.659 8.438-4.966 10.87-8.006 1.139-1.42 1.745-2.834 1.745-4.436z" />
    <path
      fill="#FFF"
      d="M5.385 13.06h-1.57A.428.428 0 013.4 12.63V7.936a.428.428 0 01.415-.428h1.57c.236 0 .428.192.428.428v4.268h2.083c.236 0 .428.192.428.428v.428a.428.428 0 01-.428.428zM10.426 13.06h-1.57a.428.428 0 01-.428-.428V7.936a.428.428 0 01.428-.428h1.57c.236 0 .428.192.428.428v4.696a.428.428 0 01-.428.428zM16.666 13.06h-1.57a.428.428 0 01-.428-.428V9.736l-2.028 2.927a.428.428 0 01-.352.185h-1.129a.428.428 0 01-.428-.428V7.936a.428.428 0 01.428-.428h1.57c.236 0 .428.192.428.428v2.896l2.028-2.927a.428.428 0 01.352-.185h1.129c.236 0 .428.192.428.428v4.696a.428.428 0 01-.428.428zM20.6 8.364h-2.083v1.285h2.083c.236 0 .428.192.428.428v.428a.428.428 0 01-.428.428H18.51v1.285H20.6c.236 0 .428.192.428.428v.428a.428.428 0 01-.428.428h-2.511a.428.428 0 01-.428-.428V7.936a.428.428 0 01.428-.428H20.6c.236 0 .428.192.428.428v.428a.428.428 0 01-.428.428z"
    />
  </svg>
);

// 🔵 Facebook 圖示組件
const FacebookIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#1877F2">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
);

const Spinner = ({ colorClass = "border-gray-400" }) => (
  <span
    className={`w-5 h-5 border-2 ${colorClass} border-t-transparent rounded-full animate-spin`}
  ></span>
);

export default function Register() {
  const router = useRouter();

  const [step, setStep] = useState(1); // 1: 填資料, 2: 填驗證碼
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const isProcessing = useRef(false);
  const step2FormRef = useRef(null);

  // 表單資料
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
  });

  // 驗證碼相關狀態
  const [otpCode, setOtpCode] = useState("");
  const [otpHash, setOtpHash] = useState("");
  const [otpExpires, setOtpExpires] = useState("");

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (value.length > 255) return;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleLineLogin = () => {
    if (isProcessing.current) return;
    const LINE_CLIENT_ID = process.env.NEXT_PUBLIC_LINE_CHANNEL_ID;
    if (!LINE_CLIENT_ID)
      return setErrorMsg("系統設定異常：找不到 LINE Channel ID");
    const currentOrigin = window.location.origin;
    const REDIRECT_URI = encodeURIComponent(
      `${currentOrigin}/auth/line/callback`,
    );
    const STATE = Math.random().toString(36).substring(7);
    localStorage.setItem("line_oauth_state", STATE);
    window.location.href = `https://access.line.me/oauth2/v2.1/authorize?response_type=code&client_id=${LINE_CLIENT_ID}&redirect_uri=${REDIRECT_URI}&state=${STATE}&scope=profile%20openid%20email`;
  };

  const handleGoogleLogin = () => {
    if (isProcessing.current) return;
    const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!GOOGLE_CLIENT_ID)
      return setErrorMsg("系統設定異常：找不到 Google Client ID");
    const currentOrigin = window.location.origin;
    const REDIRECT_URI = encodeURIComponent(`${currentOrigin}/auth/callback`);
    const STATE = Math.random().toString(36).substring(7);
    localStorage.setItem("google_oauth_state", STATE);
    window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?response_type=code&client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${REDIRECT_URI}&state=${STATE}&scope=openid%20email%20profile&prompt=select_account`;
  };

  const handleFacebookLogin = () => {
    if (isProcessing.current) return;
    const FB_CLIENT_ID = process.env.NEXT_PUBLIC_FACEBOOK_CLIENT_ID;
    if (!FB_CLIENT_ID) return setErrorMsg("系統設定異常：找不到 FB Client ID");
    const currentOrigin = window.location.origin;
    const REDIRECT_URI = encodeURIComponent(
      `${currentOrigin}/auth/facebook/callback`,
    );
    const STATE = Math.random().toString(36).substring(7);
    localStorage.setItem("facebook_oauth_state", STATE);
    window.location.href = `https://www.facebook.com/v19.0/dialog/oauth?client_id=${FB_CLIENT_ID}&redirect_uri=${REDIRECT_URI}&state=${STATE}&scope=email,public_profile`;
  };

  const handleSendOTP = async (e) => {
    e.preventDefault();
    if (isProcessing.current) return;

    const cleanUsername = formData.username.trim();
    const cleanEmail = formData.email.trim().toLowerCase();
    const cleanPassword = formData.password.trim();

    if (!cleanUsername || !cleanEmail || !cleanPassword)
      return setErrorMsg("請完整填寫所有欄位");
    if (cleanPassword.length < 6) return setErrorMsg("密碼長度需至少 6 個字元");

    setErrorMsg("");
    setLoading(true);
    isProcessing.current = true;

    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanEmail }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "發送失敗");

      setOtpHash(data.hash);
      setOtpExpires(data.expires);
      setStep(2);
    } catch (error) {
      setErrorMsg(error.message);
    } finally {
      setLoading(false);
      isProcessing.current = false;
    }
  };

  const doRegister = async () => {
    if (isProcessing.current) {
      throw new Error("正在處理中，請稍候");
    }
    if (otpCode.length !== 6) {
      throw new Error("請輸入完整的 6 位數驗證碼");
    }

    setErrorMsg("");
    isProcessing.current = true;

    // 1. 自建 API 核對驗證碼
    const verifyRes = await fetch("/api/auth/verify-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: formData.email.toLowerCase(),
        otp: otpCode,
        hash: otpHash,
        expires: otpExpires,
      }),
    });

    if (!verifyRes.ok) {
      const vData = await verifyRes.json();
      throw new Error(vData.error || "驗證碼錯誤");
    }

    // 2. 呼叫 Medusa 註冊 Auth Identity
    const BACKEND_URL =
      process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000";
    const API_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY;

    const authRes = await fetch(
      `${BACKEND_URL}/auth/customer/emailpass/register`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-publishable-api-key": API_KEY,
        },
        body: JSON.stringify({
          email: formData.email.toLowerCase(),
          password: formData.password,
        }),
      },
    );

    const authData = await authRes.json();
    if (!authRes.ok) throw new Error("註冊失敗，該信箱可能已被註冊");

    const registerToken = authData.token;

    // 3. 建立顧客檔案 (綁定名字)
    await fetch(`${BACKEND_URL}/store/customers`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-publishable-api-key": API_KEY,
        Authorization: `Bearer ${registerToken}`,
      },
      body: JSON.stringify({
        email: formData.email.toLowerCase(),
        first_name: formData.username.trim(),
      }),
    });

    // 4. 自動重新登入以取得完整 Token
    const finalLoginRes = await fetch(
      `${BACKEND_URL}/auth/customer/emailpass`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-publishable-api-key": API_KEY,
        },
        body: JSON.stringify({
          email: formData.email.toLowerCase(),
          password: formData.password,
        }),
      },
    );

    if (!finalLoginRes.ok) throw new Error("同步登入狀態失敗，請手動登入");
    const finalLoginData = await finalLoginRes.json();
    const finalToken = finalLoginData.token;

    // 5. 清除標記並寫入最終 Token
    localStorage.removeItem("is_google_login");
    localStorage.removeItem("is_facebook_login");
    localStorage.removeItem("is_line_login");
    localStorage.removeItem("google_avatar");
    localStorage.removeItem("google_name");
    localStorage.removeItem("facebook_avatar");
    localStorage.removeItem("facebook_name");
    localStorage.removeItem("line_oauth_state");
    localStorage.removeItem("google_oauth_state");
    localStorage.removeItem("facebook_oauth_state");

    localStorage.setItem("medusa_auth_token", finalToken);
  };

  const handleRegisterClick = async () => {
    if (step2FormRef.current && !step2FormRef.current.reportValidity()) {
      throw new Error("VALIDATION");
    }
    try {
      await doRegister();
      setTimeout(() => {
        window.location.href =
          router.locale === "zh-TW" || !router.locale
            ? "/"
            : `/${router.locale}`;
      }, 1400);
    } catch (error) {
      isProcessing.current = false;
      if (error.message !== "VALIDATION") {
        setErrorMsg(error.message);
      }
      throw error;
    }
  };

  const handleStep2Submit = (e) => {
    e.preventDefault();
  };

  return (
    <>
      <Head>
        <title>會員註冊 | PikFun</title>
      </Head>
      <main className="min-h-screen bg-white flex flex-col justify-center items-center pt-24 pb-24 px-6 overflow-hidden">
        <div className="w-full max-w-[480px] relative">
          <AnimatePresence mode="wait">
            {/* 步驟 1：填寫資料 */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <div className="text-center mb-10">
                  <h1
                    className="text-3xl font-bold tracking-wide mb-3"
                    style={{ color: SITE.accentDark }}
                  >
                    會員註冊
                  </h1>
                  <p className="text-sm" style={{ color: SITE.muted }}>
                    加入 PikFun，探索匹克球裝備與最新資訊
                  </p>
                </div>

                <div className="flex flex-col gap-3 mb-8">
                  <button
                    type="button"
                    onClick={handleLineLogin}
                    disabled={loading}
                    className="flex items-center justify-center py-3.5 border border-[#06C755] bg-[#06C755] hover:bg-[#05b34c] transition-all rounded-md group relative disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="absolute left-6">
                      <LineIcon />
                    </div>
                    <span className="text-sm font-bold text-white tracking-wide">
                      使用 LINE 註冊
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={handleGoogleLogin}
                    disabled={loading}
                    className="flex items-center justify-center py-3.5 border transition-all rounded-md group relative disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#f5f9fd]"
                    style={{ borderColor: SITE.border }}
                  >
                    <div className="absolute left-6">
                      <GoogleIcon />
                    </div>
                    <span
                      className="text-sm font-bold tracking-wide group-hover:text-[#005caf]"
                      style={{ color: SITE.muted }}
                    >
                      使用 Google 註冊
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={handleFacebookLogin}
                    disabled={loading}
                    className="flex items-center justify-center py-3.5 border border-[#1877F2] bg-white hover:bg-blue-50 transition-all rounded-md group relative disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="absolute left-6">
                      <FacebookIcon />
                    </div>
                    <span className="text-sm font-bold text-[#1877F2] tracking-wide">
                      使用 Facebook 註冊
                    </span>
                  </button>
                </div>

                <div className="relative mb-8">
                  <div className="absolute inset-0 flex items-center">
                    <div
                      className="w-full border-t"
                      style={{ borderColor: SITE.border }}
                    />
                  </div>
                  <div className="relative flex justify-center text-xs tracking-widest">
                    <span
                      className="bg-white px-4"
                      style={{ color: SITE.muted }}
                    >
                      或使用電子郵件
                    </span>
                  </div>
                </div>

                <form onSubmit={handleSendOTP} className="space-y-6">
                  {errorMsg && (
                    <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-xs text-center rounded-md">
                      {errorMsg}
                    </div>
                  )}

                  <div>
                    <label
                      className="block text-xs font-bold tracking-wider mb-1.5"
                      style={{ color: SITE.muted }}
                    >
                      姓名
                    </label>
                    <input
                      type="text"
                      name="username"
                      required
                      value={formData.username}
                      onChange={handleInputChange}
                      className="w-full border border-[#d8d8d8] px-4 py-3 text-sm outline-none transition-colors rounded-md focus:border-[#005caf] focus:ring-2 focus:ring-[#005caf]/20"
                      placeholder="請輸入您的姓名"
                    />
                  </div>

                  <div>
                    <label
                      className="block text-xs font-bold tracking-wider mb-1.5"
                      style={{ color: SITE.muted }}
                    >
                      電子郵件
                    </label>
                    <input
                      type="email"
                      name="email"
                      required
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full border border-[#d8d8d8] px-4 py-3 text-sm outline-none transition-colors rounded-md focus:border-[#005caf] focus:ring-2 focus:ring-[#005caf]/20"
                      placeholder="name@example.com"
                    />
                  </div>

                  <div>
                    <label
                      className="block text-xs font-bold tracking-wider mb-1.5"
                      style={{ color: SITE.muted }}
                    >
                      密碼
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        required
                        minLength={6}
                        value={formData.password}
                        onChange={handleInputChange}
                        className="w-full border border-[#d8d8d8] px-4 py-3 text-sm outline-none transition-colors rounded-md pr-12 focus:border-[#005caf] focus:ring-2 focus:ring-[#005caf]/20"
                        placeholder="至少 6 個字元"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 transition-colors hover:text-[#005caf]"
                        style={{ color: SITE.muted }}
                        aria-label={showPassword ? "隱藏密碼" : "顯示密碼"}
                      >
                        {showPassword ? (
                          <EyeOff size={18} />
                        ) : (
                          <Eye size={18} />
                        )}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[#005caf] hover:bg-[#1a3a8a] text-white font-bold tracking-widest py-4 mt-8 rounded-md transition-colors flex justify-center items-center disabled:opacity-60"
                  >
                    {loading ? (
                      <Spinner colorClass="border-white" />
                    ) : (
                      "下一步：驗證電子郵件"
                    )}
                  </button>
                </form>

                <div
                  className="mt-8 text-center text-sm"
                  style={{ color: SITE.muted }}
                >
                  已經有帳號了？{" "}
                  <Link
                    href="/login"
                    className="font-bold underline underline-offset-4 transition-colors hover:text-[#ef4023]"
                    style={{ color: SITE.accent }}
                  >
                    立即登入
                  </Link>
                </div>
              </motion.div>
            )}

            {/* 步驟 2：填寫驗證碼 */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                <button
                  onClick={() => setStep(1)}
                  className="flex items-center text-sm transition-colors mb-6 group hover:text-[#005caf]"
                  style={{ color: SITE.muted }}
                >
                  <ArrowLeft
                    size={16}
                    className="mr-2 group-hover:-translate-x-1 transition-transform"
                  />
                  返回上一步
                </button>

                <div className="text-center mb-10">
                  <p
                    className="text-xs font-bold tracking-[0.2em] mb-2"
                    style={{ color: SITE.accent }}
                  >
                    VERIFY
                  </p>
                  <h1
                    className="text-3xl font-bold tracking-wide mb-3"
                    style={{ color: SITE.accentDark }}
                  >
                    驗證電子郵件
                  </h1>
                  <p
                    className="text-sm leading-relaxed"
                    style={{ color: SITE.muted }}
                  >
                    我們已寄送 6 位數驗證碼至
                    <br />
                    <span className="font-bold text-black">
                      {formData.email}
                    </span>
                  </p>
                </div>

                <form
                  ref={step2FormRef}
                  onSubmit={handleStep2Submit}
                  className="space-y-6"
                >
                  {errorMsg && (
                    <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-xs text-center rounded-md">
                      {errorMsg}
                    </div>
                  )}

                  <div>
                    <label
                      className="block text-xs font-bold tracking-wider mb-1.5 text-center"
                      style={{ color: SITE.muted }}
                    >
                      請輸入驗證碼
                    </label>
                    <input
                      type="text"
                      maxLength="6"
                      required
                      value={otpCode}
                      onChange={(e) =>
                        setOtpCode(e.target.value.replace(/\D/g, ""))
                      }
                      className="w-full border border-[#d8d8d8] px-4 py-4 text-center text-2xl tracking-[1em] font-bold outline-none transition-colors rounded-md focus:border-[#005caf] focus:ring-2 focus:ring-[#005caf]/20"
                      placeholder="------"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                    />
                  </div>

                  <ConfettiButton
                    onClick={handleRegisterClick}
                    successLabel="歡迎加入 PikFun！🎉"
                    className="w-full bg-[#1a3a8a] hover:bg-[#ef4023] text-white font-bold tracking-widest py-4 mt-8 rounded-md transition-colors disabled:opacity-60"
                  >
                    驗證並完成註冊
                  </ConfettiButton>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </>
  );
}

export async function getStaticProps({ locale }) {
  return {
    props: { ...(await serverSideTranslations(locale || "zh-TW", ["common"])) },
  };
}
