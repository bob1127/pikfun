"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { X, Bell, Download, Share, CheckCircle2 } from "lucide-react";

const SNOOZE_KEY = "pikfun_pwa_prompt_snooze";
const SNOOZE_MS = 7 * 24 * 60 * 60 * 1000;
const SHOW_DELAY_MS = 6000;

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

function isStandalone() {
  return (
    window.matchMedia?.("(display-mode: standalone)")?.matches ||
    window.navigator.standalone === true
  );
}

function isIos() {
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
}

/** 避免 serviceWorker.ready / subscribe 永遠 pending 造成 UI 卡死 */
function withTimeout(promise, ms, label) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`${label} 逾時`)), ms),
    ),
  ]);
}

async function postSubscription(subscription) {
  const token = localStorage.getItem("medusa_auth_token");
  await fetch("/api/push/subscribe", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ subscription: subscription.toJSON() }),
  });
}

/**
 * PWA 安裝＋推播設定彈窗：進站數秒後自動跳出（手機與電腦皆同），
 * 關閉後 7 天內不再出現；已安裝且已設定推播就不顯示。
 */
export default function PwaSetupPrompt() {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const [pushState, setPushState] = useState("idle"); // idle | working | done | error | blocked | unsupported
  const [installed, setInstalled] = useState(false);
  const [showIosHint, setShowIosHint] = useState(false);
  const [canInstall, setCanInstall] = useState(false);
  const deferredInstall = useRef(null);

  useEffect(() => {
    setMounted(true);
    if (typeof window === "undefined") return;

    const supported =
      "serviceWorker" in navigator &&
      "PushManager" in window &&
      "Notification" in window;

    // 已訂閱：靜默同步 email 綁定（登入後補綁），不打擾使用者
    if (supported && Notification.permission === "granted") {
      navigator.serviceWorker.ready
        .then((reg) => reg.pushManager.getSubscription())
        .then((sub) => {
          if (sub) postSubscription(sub).catch(() => {});
        })
        .catch(() => {});
    }

    // Chrome / Edge / Android：攔下原生安裝事件，改由我們的按鈕觸發
    const onBeforeInstall = (e) => {
      e.preventDefault();
      deferredInstall.current = e;
      setCanInstall(true);
    };
    const onInstalled = () => setInstalled(true);
    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);

    const snoozedAt = Number(localStorage.getItem(SNOOZE_KEY) || 0);
    const snoozed = Date.now() - snoozedAt < SNOOZE_MS;
    const permissionHandled =
      !supported || Notification.permission !== "default";

    // 已是 App 模式且通知也處理過 → 沒有可設定的東西，不再跳出
    const nothingToOffer = permissionHandled && isStandalone();
    // App 模式但通知還沒設定 → 忽略瀏覽器帶進來的「下次再說」冷卻
    //（Safari 加入 Dock 會複製網站的 localStorage，冷卻會被一起帶進 App）
    const mustOffer = isStandalone() && !permissionHandled;
    const timer = setTimeout(() => {
      if ((!snoozed || mustOffer) && !nothingToOffer) setVisible(true);
    }, SHOW_DELAY_MS);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const dismiss = useCallback(() => {
    localStorage.setItem(SNOOZE_KEY, String(Date.now()));
    setVisible(false);
  }, []);

  const enablePush = useCallback(async () => {
    const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (
      !vapidKey ||
      !("serviceWorker" in navigator) ||
      !("PushManager" in window)
    ) {
      setPushState("unsupported");
      return;
    }

    setPushState("working");
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setPushState(permission === "denied" ? "blocked" : "idle");
        return;
      }
      // 確保 SW 已註冊：註冊失敗時 serviceWorker.ready 會永遠 pending，
      // 所以先主動補註冊，且各步驟都加逾時
      let reg = await navigator.serviceWorker.getRegistration();
      if (!reg) {
        reg = await withTimeout(
          navigator.serviceWorker.register("/sw.js"),
          10000,
          "Service Worker 註冊",
        );
      }
      await withTimeout(
        navigator.serviceWorker.ready,
        10000,
        "Service Worker 啟動",
      );
      const sub =
        (await reg.pushManager.getSubscription()) ||
        (await withTimeout(
          reg.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(vapidKey),
          }),
          15000,
          "推播訂閱",
        ));
      await withTimeout(postSubscription(sub), 10000, "訂閱儲存");
      setPushState("done");
    } catch (e) {
      console.error("[push] subscribe failed:", e);
      setPushState("error");
    }
  }, []);

  const install = useCallback(async () => {
    if (deferredInstall.current) {
      deferredInstall.current.prompt();
      const choice = await deferredInstall.current.userChoice.catch(() => null);
      deferredInstall.current = null;
      setCanInstall(false);
      if (choice?.outcome === "accepted") setInstalled(true);
      return;
    }
    // 沒有原生安裝事件（iOS / Safari / Firefox）→ 顯示手動加入教學
    setShowIosHint(true);
  }, []);

  if (!mounted) return null;

  const notifDefault =
    typeof Notification !== "undefined" &&
    Notification.permission === "default";
  const alreadyApp = typeof window !== "undefined" && isStandalone();

  return createPortal(
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed inset-0 z-[9990] flex items-end sm:items-center justify-center p-4 bg-black/45"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={dismiss}
        >
          <motion.div
            className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl p-6 pt-8"
            initial={{ opacity: 0, y: 32, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.96 }}
            transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={dismiss}
              aria-label="關閉"
              className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <X size={17} />
            </button>

            <div className="flex flex-col items-center text-center">
              <img
                src="/images/pikfun-logo-pwa.png"
                alt="PikFun"
                className="w-20 h-20 mb-4 drop-shadow-md"
              />
              <h3 className="text-lg font-bold text-[#0f172a]">
                安裝 PikFun App
              </h3>
              <p className="text-sm text-[#64748b] mt-1.5 leading-relaxed">
                把 PikFun 加到{isIos() || /android/i.test(navigator.userAgent) ? "主畫面" : "桌面"}
                ，開啟推播通知，揪團提醒與最新消息不漏接。
              </p>
            </div>

            <div className="flex flex-col gap-2.5 mt-5">
              {!alreadyApp &&
                (installed ? (
                  <div className="flex items-center justify-center gap-2 text-[#16a34a] text-sm font-bold py-2.5">
                    <CheckCircle2 size={16} />
                    已安裝，可從桌面／主畫面開啟
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={install}
                    className="w-full flex items-center justify-center gap-2 bg-[#005caf] text-white text-sm font-bold rounded-2xl py-3 hover:bg-[#004a8f] transition-colors"
                  >
                    <Download size={16} />
                    {canInstall ? "一鍵安裝" : "如何加入桌面／主畫面"}
                  </button>
                ))}

              {pushState === "done" ? (
                <div className="flex items-center justify-center gap-2 text-[#16a34a] text-sm font-bold py-2.5">
                  <CheckCircle2 size={16} />
                  推播已開啟
                </div>
              ) : (
                (notifDefault ||
                  pushState === "working" ||
                  pushState === "error") && (
                  <button
                    type="button"
                    onClick={enablePush}
                    disabled={pushState === "working"}
                    className="w-full flex items-center justify-center gap-2 border border-[#e8edf3] text-[#0f172a] text-sm font-bold rounded-2xl py-3 hover:bg-[#f8fafc] transition-colors disabled:opacity-60"
                  >
                    <Bell size={16} />
                    {pushState === "working"
                      ? "設定中…"
                      : pushState === "error"
                        ? "再試一次"
                        : "開啟推播通知"}
                  </button>
                )
              )}

              {pushState === "error" && (
                <p className="text-xs text-[#dc2626] text-center leading-relaxed">
                  推播設定沒有完成（連線逾時或被瀏覽器擋下），請再試一次。
                </p>
              )}

              {pushState === "blocked" && (
                <p className="text-xs text-[#94a3b8] text-center leading-relaxed">
                  通知權限已被封鎖：請點網址列左側的鎖頭圖示，把「通知」改為允許後再試。
                </p>
              )}

              {pushState === "unsupported" && (
                <p className="text-xs text-[#94a3b8] text-center leading-relaxed">
                  此瀏覽器暫不支援推播（iPhone 需先加入主畫面，再從主畫面開啟
                  PikFun 設定）。
                </p>
              )}

              {showIosHint && (
                <div className="flex items-start gap-2 text-xs text-[#64748b] leading-relaxed bg-[#f8fafc] rounded-2xl p-3.5 text-left">
                  <Share size={14} className="shrink-0 mt-0.5 text-[#005caf]" />
                  <span>
                    {isIos()
                      ? "iPhone／iPad：點 Safari 下方的「分享」按鈕，選「加入主畫面」。之後從主畫面開啟 PikFun 就能收推播。"
                      : "請使用瀏覽器選單中的「安裝」或「加入主畫面／Dock」功能（Chrome：網址列右側的安裝圖示；Safari：檔案 → 加入 Dock）。"}
                  </span>
                </div>
              )}

              <button
                type="button"
                onClick={dismiss}
                className="text-xs text-[#94a3b8] hover:text-[#64748b] py-1 transition-colors"
              >
                下次再說
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
