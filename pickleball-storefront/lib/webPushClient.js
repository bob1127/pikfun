/**
 * 瀏覽器端 Web Push 訂閱工具（PWA 彈窗／會員中心共用）
 */

export function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

export function isPushSupported() {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

function withTimeout(promise, ms, label) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`${label} 逾時`)), ms),
    ),
  ]);
}

export async function postPushSubscription(subscription) {
  const token =
    typeof localStorage !== "undefined"
      ? localStorage.getItem("medusa_auth_token")
      : null;
  const res = await fetch("/api/push/subscribe", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ subscription: subscription.toJSON() }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `訂閱儲存失敗 (${res.status})`);
  }
  return res;
}

/**
 * 請求權限並訂閱推播。
 * @param {{ forceRenew?: boolean }} [opts] forceRenew=true 時先取消舊訂閱再建新的
 * @returns {'done' | 'blocked' | 'denied' | 'unsupported'}
 */
export async function enableWebPush(opts = {}) {
  const { forceRenew = false } = opts;
  const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  if (!vapidKey || !isPushSupported()) {
    return "unsupported";
  }

  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    return permission === "denied" ? "blocked" : "denied";
  }

  let reg = await navigator.serviceWorker.getRegistration();
  if (!reg) {
    reg = await withTimeout(
      navigator.serviceWorker.register("/sw.js"),
      10000,
      "Service Worker 註冊",
    );
  }
  await withTimeout(navigator.serviceWorker.ready, 10000, "Service Worker 啟動");

  let sub = await reg.pushManager.getSubscription();
  if (forceRenew && sub) {
    try {
      await sub.unsubscribe();
    } catch {
      /* ignore */
    }
    sub = null;
  }

  if (!sub) {
    sub = await withTimeout(
      reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      }),
      15000,
      "推播訂閱",
    );
  }
  await withTimeout(postPushSubscription(sub), 10000, "訂閱儲存");
  return "done";
}

export async function getPushStatus() {
  if (!isPushSupported()) {
    return { supported: false, permission: "unsupported", subscribed: false };
  }
  const permission = Notification.permission;
  let subscribed = false;
  try {
    const reg = await navigator.serviceWorker.getRegistration();
    if (reg) {
      const sub = await reg.pushManager.getSubscription();
      subscribed = Boolean(sub);
    }
  } catch {
    /* ignore */
  }
  return { supported: true, permission, subscribed };
}
