"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { Check, ChevronDown, ShieldCheck, X } from "lucide-react";

const COOKIE_NAME = "pikfun_cookie_consent";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 180;
const DEFAULT_PREFERENCES = {
  necessary: true,
  analytics: false,
  marketing: false,
};

const TEXT = {
  "zh-TW": {
    title: "Cookie 使用說明",
    description:
      "我們使用必要 Cookie 維持登入、購物車與網站安全；經你同意後，才會使用分析及行銷 Cookie 改善服務與內容。",
    privacy: "隱私權政策",
    reject: "僅使用必要 Cookie",
    settings: "Cookie 設定",
    accept: "全部接受",
    save: "儲存設定",
    close: "關閉 Cookie 設定",
    necessaryTitle: "必要 Cookie",
    necessaryDesc: "用於登入、購物車、安全性及儲存 Cookie 偏好，無法關閉。",
    analyticsTitle: "分析 Cookie",
    analyticsDesc: "協助了解網站使用情況與改善功能。",
    marketingTitle: "行銷 Cookie",
    marketingDesc: "用於衡量活動成效及提供相關內容。",
    alwaysOn: "固定開啟",
  },
  en: {
    title: "Cookie Notice",
    description:
      "We use necessary cookies for sign-in, cart functionality, and security. Analytics and marketing cookies are used only with your consent.",
    privacy: "Privacy Policy",
    reject: "Necessary Only",
    settings: "Cookie Settings",
    accept: "Accept All",
    save: "Save Preferences",
    close: "Close Cookie settings",
    necessaryTitle: "Necessary Cookies",
    necessaryDesc:
      "Required for sign-in, cart functionality, security, and storing your cookie preferences.",
    analyticsTitle: "Analytics Cookies",
    analyticsDesc: "Help us understand usage and improve the website.",
    marketingTitle: "Marketing Cookies",
    marketingDesc:
      "Used to measure campaigns and provide more relevant content.",
    alwaysOn: "Always On",
  },
};

function readPreferences() {
  if (typeof document === "undefined") return null;
  const prefix = `${COOKIE_NAME}=`;
  const value = document.cookie
    .split(";")
    .map((item) => item.trim())
    .find((item) => item.startsWith(prefix));
  if (!value) return null;

  try {
    const parsed = JSON.parse(decodeURIComponent(value.slice(prefix.length)));
    return {
      necessary: true,
      analytics: Boolean(parsed.analytics),
      marketing: Boolean(parsed.marketing),
    };
  } catch {
    return null;
  }
}

function persistPreferences(preferences) {
  const payload = {
    ...preferences,
    necessary: true,
    version: 1,
    updatedAt: new Date().toISOString(),
  };
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${COOKIE_NAME}=${encodeURIComponent(
    JSON.stringify(payload),
  )}; Max-Age=${COOKIE_MAX_AGE}; Path=/; SameSite=Lax${secure}`;
  window.dispatchEvent(
    new CustomEvent("pikfun:cookie-consent-changed", { detail: payload }),
  );
}

function PreferenceToggle({ checked, onChange, disabled, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
        checked ? "bg-[#005caf]" : "bg-gray-300"
      } disabled:cursor-not-allowed disabled:opacity-70`}
    >
      <span
        className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-transform ${
          checked ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );
}

export default function CookieConsent() {
  const router = useRouter();
  const T = TEXT[router.locale === "en" ? "en" : "zh-TW"];
  const [visible, setVisible] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [preferences, setPreferences] = useState(DEFAULT_PREFERENCES);

  useEffect(() => {
    const saved = readPreferences();
    if (saved) {
      setPreferences(saved);
      window.dispatchEvent(
        new CustomEvent("pikfun:cookie-consent-changed", { detail: saved }),
      );
    } else {
      setVisible(true);
    }

    const openSettings = () => {
      setPreferences(readPreferences() || DEFAULT_PREFERENCES);
      setShowSettings(true);
      setVisible(true);
    };
    window.addEventListener("pikfun:open-cookie-settings", openSettings);
    return () =>
      window.removeEventListener("pikfun:open-cookie-settings", openSettings);
  }, []);

  const save = (nextPreferences) => {
    const normalized = { ...nextPreferences, necessary: true };
    persistPreferences(normalized);
    setPreferences(normalized);
    setShowSettings(false);
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-[3000] border-t border-gray-300 bg-white text-gray-900 shadow-[0_-8px_30px_rgba(15,23,42,0.10)]"
      role="dialog"
      aria-modal="false"
      aria-labelledby="cookie-consent-title"
    >
      <div className="mx-auto max-w-[1200px] px-5 py-5 md:px-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <div className="mb-2 flex items-center gap-2">
              <h2
                id="cookie-consent-title"
                className="!text-sm font-black tracking-wide"
              >
                {T.title}
              </h2>
            </div>
            <p className="text-xs leading-6 text-stone-900">
              {T.description}{" "}
              <Link
                href="/privacy"
                className="font-bold text-[#005caf] underline underline-offset-2"
              >
                {T.privacy}
              </Link>
            </p>
          </div>

          <div className="flex shrink-0 flex-wrap gap-2">
            <button
              type="button"
              onClick={() => save(DEFAULT_PREFERENCES)}
              className="min-h-10 border border-gray-300 px-4 text-xs font-bold text-gray-700 transition-colors hover:border-gray-500"
            >
              {T.reject}
            </button>
            <button
              type="button"
              onClick={() => setShowSettings((current) => !current)}
              aria-expanded={showSettings}
              className="flex min-h-10 items-center gap-2 border border-[#005caf] px-4 text-xs font-bold text-[#005caf] transition-colors hover:bg-[#f3f7fc]"
            >
              {T.settings}
              <ChevronDown
                size={14}
                className={`transition-transform ${
                  showSettings ? "rotate-180" : ""
                }`}
              />
            </button>
            <button
              type="button"
              onClick={() =>
                save({ necessary: true, analytics: true, marketing: true })
              }
              className="flex min-h-10 items-center gap-2 bg-[#005caf] px-5 text-xs font-bold text-white transition-colors hover:bg-[#004b91]"
            >
              <Check size={14} />
              {T.accept}
            </button>
          </div>
        </div>

        {showSettings && (
          <div className="relative mt-5 grid gap-3 border-t border-gray-200 pt-5 md:grid-cols-3">
            <button
              type="button"
              onClick={() => setShowSettings(false)}
              className="absolute right-0 top-3 p-1 text-gray-400 hover:text-gray-700"
              aria-label={T.close}
            >
              <X size={16} />
            </button>

            <div className="border border-gray-200 p-4">
              <div className="mb-2 flex items-center justify-between gap-3">
                <h3 className="text-xs font-black">{T.necessaryTitle}</h3>
                <PreferenceToggle
                  checked
                  disabled
                  onChange={() => {}}
                  label={T.necessaryTitle}
                />
              </div>
              <p className="text-[11px] leading-5 text-gray-500">
                {T.necessaryDesc}
              </p>
              <p className="mt-2 text-[10px] font-bold text-[#005caf]">
                {T.alwaysOn}
              </p>
            </div>

            <div className="border border-gray-200 p-4">
              <div className="mb-2 flex items-center justify-between gap-3">
                <h3 className="text-xs font-black">{T.analyticsTitle}</h3>
                <PreferenceToggle
                  checked={preferences.analytics}
                  onChange={(analytics) =>
                    setPreferences((current) => ({ ...current, analytics }))
                  }
                  label={T.analyticsTitle}
                />
              </div>
              <p className="text-[11px] leading-5 text-gray-500">
                {T.analyticsDesc}
              </p>
            </div>

            <div className="border border-gray-200 p-4">
              <div className="mb-2 flex items-center justify-between gap-3">
                <h3 className="text-xs font-black">{T.marketingTitle}</h3>
                <PreferenceToggle
                  checked={preferences.marketing}
                  onChange={(marketing) =>
                    setPreferences((current) => ({ ...current, marketing }))
                  }
                  label={T.marketingTitle}
                />
              </div>
              <p className="text-[11px] leading-5 text-gray-500">
                {T.marketingDesc}
              </p>
            </div>

            <div className="md:col-span-3 flex justify-end">
              <button
                type="button"
                onClick={() => save(preferences)}
                className="min-h-10 bg-[#005caf] px-6 text-xs font-bold text-white hover:bg-[#004b91]"
              >
                {T.save}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
