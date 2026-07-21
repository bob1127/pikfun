# PWA 與 Web Push 實作指南：流程、跨平台差異與踩坑紀錄

這份文件整理 PikFun 實作 PWA 安裝與 Web Push 時遇到的問題，可直接帶到其他 Next.js 專案作為實作與驗收清單。

## 1. 最終架構

```text
網站／PWA
  ├─ manifest.json：App 名稱、啟動網址、icon
  ├─ sw.js：接收 push、顯示通知、處理通知點擊
  ├─ 安裝／通知引導 UI
  └─ PushManager.subscribe()
          ↓
POST /api/push/subscribe
          ↓
push_subscriptions 資料表
          ↓
後端使用 web-push + VAPID 發送
          ↓
Apple Web Push／FCM／瀏覽器推播服務
          ↓
使用者裝置通知
```

必要環境變數：

```env
NEXT_PUBLIC_VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
VAPID_SUBJECT=mailto:service@example.com
SUPABASE_SERVICE_ROLE_KEY=
ADMIN_EMAILS=admin@example.com
```

注意：

- `NEXT_PUBLIC_VAPID_PUBLIC_KEY` 可出現在前端。
- `VAPID_PRIVATE_KEY`、`SUPABASE_SERVICE_ROLE_KEY` 絕對不能送到前端或提交到 Git。
- 不同網站建議使用不同的 VAPID 金鑰。
- 修改 `NEXT_PUBLIC_*` 後必須重新 build／deploy。

產生 VAPID 金鑰：

```bash
npx web-push generate-vapid-keys
```

## 2. 基本檔案

### `public/manifest.json`

至少包含：

```json
{
  "name": "Your App",
  "short_name": "Your App",
  "start_url": "/",
  "scope": "/",
  "display": "standalone",
  "theme_color": "#ffffff",
  "background_color": "#ffffff",
  "icons": [
    {
      "src": "/pwa-icon-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/pwa-icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any"
    }
  ]
}
```

icon 建議：

- 使用真正的正方形 PNG。
- 準備 192×192、512×512、180×180 Apple touch icon。
- 圖案四周保留安全留白，避免 macOS／Android 自動裁切。
- `purpose: "any maskable"` 不一定適合所有原圖；最好另外製作 maskable icon。

### `public/sw.js`

```js
self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { body: event.data?.text() || "" };
  }

  event.waitUntil(
    self.registration.showNotification(data.title || "網站通知", {
      body: data.body || "",
      icon: data.icon || "/pwa-icon-512.png",
      badge: data.badge || "/pwa-icon-192.png",
      tag: data.tag,
      data: { url: data.url || "/" },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/";

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clients) => {
        const existing = clients.find((client) =>
          client.url.startsWith(self.location.origin),
        );
        if (existing) {
          existing.navigate(url);
          return existing.focus();
        }
        return self.clients.openWindow(url);
      }),
  );
});
```

### 註冊 Service Worker

只能在瀏覽器執行：

```js
useEffect(() => {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("/sw.js").catch(console.error);
  }
}, []);
```

## 3. 訂閱流程必須這樣做

只顯示「通知權限已允許」不代表裝置已訂閱。必須同時確認：

1. `Notification.permission === "granted"`
2. Service Worker 已 ready
3. `pushManager.getSubscription()` 有回傳訂閱
4. 訂閱已成功存到後端資料庫

核心流程：

```js
const permission = await Notification.requestPermission();
if (permission !== "granted") return;

let registration = await navigator.serviceWorker.getRegistration();
if (!registration) {
  registration = await navigator.serviceWorker.register("/sw.js");
}

await navigator.serviceWorker.ready;

let subscription = await registration.pushManager.getSubscription();
if (!subscription) {
  subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
  });
}

await fetch("/api/push/subscribe", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ subscription: subscription.toJSON() }),
});
```

## 4. 最重要的踩坑

### 坑 1：永遠卡在「設定中…」

原因通常是：

- `navigator.serviceWorker.ready` 永遠 pending。
- Service Worker 註冊失敗。
- `pushManager.subscribe()` 等外部推播服務時卡住。
- 儲存訂閱的 API 沒有回應。

解法：每一步都加 timeout，不能無限等待。

```js
function withTimeout(promise, ms, label) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timeout`)), ms),
    ),
  ]);
}
```

建議時限：

- SW 註冊：10 秒
- SW ready：10 秒
- Push subscribe：15 秒
- 後端儲存：10 秒

失敗後 UI 應顯示「再試一次」，不要只顯示不明確的「不支援」。

### 坑 2：權限已允許，但資料庫沒有新增裝置

`Notification.permission === "granted"` 只是 OS／瀏覽器允許通知，不代表已產生 PushSubscription。

進入頁面時應靜默檢查：

```js
if (Notification.permission === "granted") {
  const registration = await navigator.serviceWorker.ready;
  let subscription = await registration.pushManager.getSubscription();

  if (!subscription && isStandalonePwa()) {
    subscription = await registration.pushManager.subscribe(...);
  }

  if (subscription) {
    await saveSubscription(subscription);
  }
}
```

這對 Safari「加入 Dock」的 macOS Web App 特別重要。

### 坑 3：Safari 加入 Dock 後，App 沿用舊的拒絕／冷卻狀態

macOS Safari 建立 Web App 時，可能帶入原網站的部分網站資料與權限狀態，例如：

- `localStorage` 裡的「7 天內不再提示」
- 既有通知設定
- 既有 Service Worker／subscription 狀態

因此：

- PWA standalone 模式下，若通知還沒設定，不應被一般瀏覽器的 snooze 擋住。
- 即使權限已允許，也要確認該 App context 有自己的 PushSubscription。
- 提供會員中心「重新開啟推播」入口，不能只靠首次 popup。

### 坑 4：Safari／PWA icon 顯示和預期不同

通知 icon 由作業系統、瀏覽器與通知來源共同決定。

macOS 常見結果：

| 來源 | 通知歸屬／icon |
|---|---|
| Chrome 網頁訂閱 | Chrome |
| Safari 網頁訂閱 | Safari |
| Safari「加入 Dock」Web App | 獨立 App 名稱與 icon |
| iPhone 原生 App 同步到 Mac | iPhone App icon |

因此，使用 Chrome 後台按「發送」不代表通知由 Chrome 顯示。後台只是觸發廣播；通知會送到資料庫裡的所有訂閱，每一筆由它原本的 App／瀏覽器顯示。

若管理頁顯示「成功 3 台」，可能同時收到：

- Mac Safari 一則
- macOS Web App 一則
- iPhone 一則

### 坑 5：同一使用者收到重複通知

一個人可能有多個 endpoint：

- Chrome
- Safari
- macOS Web App
- iPhone／Android

這是正常的「多裝置訂閱」，但同一台 Mac 可能因此看見 Safari + App 重複通知。

建議：

- 管理後台顯示裝置數與會員數。
- 儲存 `user_agent`、`created_at`、`updated_at` 方便診斷。
- 提供使用者取消／重新訂閱功能。
- API 遇到推播服務回傳 404／410 時，自動刪除失效 endpoint。
- 進階版本可加 `device_name`、`platform`、`last_seen_at` 與裝置管理頁。

### 坑 6：使用者按過「拒絕」後，網站不能再次跳系統詢問

這是瀏覽器安全限制。`Notification.requestPermission()` 不會繞過已封鎖狀態。

UI 必須明確引導：

- Chrome／Edge：網址列左側網站設定 → 通知 → 允許
- Safari：Safari → 設定 → 網站 → 通知 → 將網站改為允許或移除
- macOS Web App：App／系統通知設定需同時允許；必要時清除該 Web App 網站資料後重試
- iPhone／iPad：先加入主畫面，再從主畫面開啟 Web App 設定推播

### 坑 7：`fetch()` 沒檢查 `response.ok`

如果 `/api/push/subscribe` 回 500，但前端沒有檢查 `res.ok`，UI 仍可能錯誤顯示「推播已開啟」。

正確做法：

```js
const response = await fetch("/api/push/subscribe", options);
if (!response.ok) {
  const data = await response.json().catch(() => ({}));
  throw new Error(data.error || `Subscribe failed (${response.status})`);
}
```

## 5. 資料表建議

```sql
create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  customer_email text,
  user_agent text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists push_subs_email_idx
  on public.push_subscriptions(customer_email);
```

安全原則：

- 前端不要直接用 service role 操作這張表。
- 透過自己的 API 驗證與 upsert。
- 後端發送時才使用 service role。
- 若允許未登入訪客訂閱，`customer_email` 可為 null；登入後再次上報同 endpoint 以補綁 email。

## 6. 後端訂閱 API 應做到

`POST /api/push/subscribe`：

1. 驗證 `endpoint`、`keys.p256dh`、`keys.auth`。
2. 取得登入會員 email；未登入可為 null。
3. 以 endpoint upsert，避免重複資料。
4. 更新 user agent、email、updated_at。
5. 回傳明確 JSON 與 HTTP 狀態。

`DELETE /api/push/subscribe`：

1. 接收 endpoint。
2. 刪除該 endpoint。
3. 前端同時呼叫 `subscription.unsubscribe()`。

## 7. 發送端應做到

- `web-push.setVapidDetails(subject, publicKey, privateKey)`
- 單一使用者：依 email 查所有 endpoint
- 廣播：分頁查詢、限制同時連線數
- 404／410：自動移除失效 endpoint
- 回傳 `{ total, sent, failed }`
- 管理員 API 必須驗證管理員身分
- 通知 URL 只允許站內相對路徑或可信任網域，避免 open redirect

## 8. 必須提供永久設定入口

不要只做「進站 6 秒後 popup」。首次 popup 可能因以下原因失效：

- 使用者按稍後提醒
- 使用者封鎖通知
- PWA 安裝後沿用舊資料
- Service Worker 當下尚未 ready
- 網路中斷

會員中心應提供：

- 目前狀態：不支援／未設定／已封鎖／權限已允許但未訂閱／已訂閱
- 「開啟推播通知」
- 「重新開啟推播」
- 平台對應的解除封鎖教學
- 可選：取消此裝置推播

重新開啟時，可選擇取消舊訂閱後再建立：

```js
const existing = await registration.pushManager.getSubscription();
if (existing) await existing.unsubscribe();

const fresh = await registration.pushManager.subscribe(...);
await saveSubscription(fresh);
```

注意：重新產生 endpoint 後，舊 endpoint 可能仍留在資料庫。可在 API 接受舊 endpoint 並刪除，或等下次發送收到 404／410 時清理。

## 9. 測試矩陣

每個新專案至少測以下情境：

| 平台 | 瀏覽器／模式 | 驗證 |
|---|---|---|
| macOS | Chrome 分頁 | 權限、訂閱、通知內容 |
| macOS | Safari 分頁 | 權限、Apple endpoint、通知 |
| macOS | Safari 加入 Dock | 獨立訂閱、App icon、點擊開頁 |
| Windows | Chrome／Edge | icon、badge、通知點擊 |
| Android | Chrome PWA | 安裝、icon、背景通知 |
| iPhone | Safari 加入主畫面 | Web App 內允許、通知、icon |

每個平台都要測：

1. 第一次允許
2. 第一次拒絕
3. 拒絕後重新開啟
4. 已允許但 subscription 不存在
5. API 500／網路斷線
6. Service Worker 更新
7. 同帳號多裝置
8. 點擊通知導向指定頁面
9. 登入前訂閱，登入後補綁 email

## 10. 快速除錯清單

### 前端 Console

```js
Notification.permission
```

```js
await navigator.serviceWorker.getRegistration()
```

```js
const reg = await navigator.serviceWorker.ready;
await reg.pushManager.getSubscription();
```

判讀：

- permission = `denied`：使用者／系統封鎖
- permission = `granted`、subscription = null：缺少實際訂閱
- subscription 有值、資料庫沒有：subscribe API 失敗
- 資料庫有值、發送 failed：VAPID、endpoint 或推播服務問題
- 發送成功但沒顯示：OS 通知設定、專注模式、App 通知設定或通知被分組

### 正式環境

- `https://your-domain/manifest.json` 回 200
- `https://your-domain/sw.js` 回 200
- 所有 icon URL 回 200 且 Content-Type 正確
- `/api/push/subscribe` 不應 404
- Vercel／正式環境已設定 VAPID 與 service role
- Supabase／資料庫已建立 push_subscriptions
- 部署後重新載入，確認線上 bundle 是最新版

## 11. 實作完成定義

只有以下全部成立才算完成：

- PWA 可安裝
- icon 在 manifest 與通知中都有設定
- 首次提示可開啟通知
- 所有 async 步驟有 timeout 與錯誤 UI
- 權限允許但無 subscription 時可自動修復
- 訂閱 API 檢查 `response.ok`
- 會員中心可重新開啟
- 失效 endpoint 自動清理
- 管理員可測試單一會員與廣播
- 已用 macOS Safari Web App、iPhone、Chrome 實機驗證

## 12. 從 PikFun 帶到新專案時優先複製

可參考以下模組拆分：

```text
public/manifest.json
public/sw.js
lib/webPushClient.js
lib/webPush.js
pages/api/push/subscribe.js
pages/api/push/test.js
pages/api/admin/push.js
components/PwaSetupPrompt.jsx
components/member/MemberSettingsPanel.jsx
supabase/push_subscriptions.sql
```

複製後務必更換：

- 網站名稱與 domain
- App icon
- VAPID 金鑰
- `VAPID_SUBJECT`
- 資料庫／Supabase 專案
- 登入驗證邏輯
- 管理員判斷方式
- 通知點擊 URL 白名單

不要把 PikFun 的 `.env.local` 或任何正式金鑰複製到新專案。
