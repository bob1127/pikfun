# PikFun

匹克球電商與社群平台（Next.js storefront + Medusa backend）。

## 專案結構

- `pickleball-storefront/` — Next.js 前端
- `pickleball-backend/` — Medusa 後端

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
   - `NEXT_PUBLIC_SITE_URL` → `https://pikfun.vercel.app`（或自訂網域）
   - `NEXTAUTH_URL` → 同上
   - `NEXT_PUBLIC_MEDUSA_BACKEND_URL` → 正式 Medusa 後端 URL
5. **Deployments** → 最新部署 → **Redeploy**

若 Root Directory 留空，Vercel 會從 repo 根目錄建置（沒有 Next.js），畫面會顯示 **404 NOT FOUND**。
