# PikFun

匹克球電商與社群平台（Next.js storefront + Medusa backend）。

## 專案結構

- `pickleball-storefront/` — Next.js 前端（本 repo）
- 後端 Medusa — 獨立 repo：[pikfun-backend](https://github.com/bob1127/pikfun-backend)

## 本地開發

```bash
# 後端
cd pickleball-backend
npm install
npm run dev

# 前端（另開 terminal）
cd pickleball-storefront
npm install
npm run dev
```

請各自建立 `.env` / `.env.local`（勿提交至 git）。

## Vercel 部署（前端）

此 repo 是 monorepo，**必須**在 Vercel 設定 Root Directory：

1. Vercel → **pikfun** → **Settings** → **General**
2. **Root Directory** → 填 `pickleball-storefront` → Save
3. **Settings** → **Environment Variables** → 貼上 `.env.local` 內所有變數
4. 將下列改為正式網址（不要用 localhost）：
   - `NEXT_PUBLIC_SITE_URL` → `https://www.pikfun.com.tw`（或自訂網域）
   - `NEXTAUTH_URL` → 同上
   - `NEXT_PUBLIC_MEDUSA_BACKEND_URL` → 正式 Medusa 後端 URL
5. **Deployments** → 最新部署 → **Redeploy**

若 Root Directory 留空，Vercel 會從 repo 根目錄建置（沒有 Next.js），畫面會顯示 **404 NOT FOUND**。

## Git 雙遠端（省 Vercel 建置費）

日常開發推 **staging**（`kejiweibai17-source`），要上架正式再推 **production**（`bob1127`）：

```bash
# 日常（預設 origin = staging）
git push origin main

# 偶爾同步到正式 repo（觸發 bob1127 的 Vercel）
git push production main
```

| Remote | 帳號 | 用途 |
|--------|------|------|
| `origin` | kejiweibai17-source | 開發／頻繁推送 |
| `production` | bob1127 | 正式上線 |

後端同理：`cd pickleball-backend` 後 `git push origin main` / `git push production main`。

**Vercel 建議**：正式專案（bob1127）可關閉自動部署，改為只在 `git push production` 後於 Vercel 手動 Redeploy，或只連 `production` remote 的 repo。
