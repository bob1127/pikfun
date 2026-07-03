# PikFun 部署架構（與 KESH 相同）

```
顧客網站 (Vercel)          後台 Admin (Vercel)          API (Railway)
www.pikfun.com.tw    →     admin.xxx.vercel.app   →     xxx.up.railway.app
     │                            │                           │
     └──── NEXT_PUBLIC_MEDUSA_BACKEND_URL ────────────────────┘
                                  └─ vercel.json 轉發 API ────┘
```

| 服務 | 平台 | 用途 |
|------|------|------|
| `pickleball-storefront` | Vercel | 顧客前台 |
| `pickleball-backend` Admin | Vercel（第二個專案） | Medusa 後台 UI |
| `pickleball-backend` API | Railway | Medusa API + 資料庫連線 |

---

## 一、Railway：Medusa API 後端

### 1. 建立專案

1. [railway.app](https://railway.app) → **New Project** → **Deploy from GitHub repo**
2. 選 `bob1127/pikfun`（前端）或 `bob1127/pikfun-backend`（後端 API）
3. **Settings → Root Directory** → `pickleball-backend`
4. **New** → **Database** → **Add Redis**（Medusa 需要 Redis）

### 2. 環境變數（Railway → Variables）

從本地 `pickleball-backend/.env` 複製，並改成正式網址：

```env
NODE_ENV=production
DATABASE_URL=postgresql://postgres.xxx:密碼@aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres
REDIS_URL=${{Redis.REDIS_URL}}

JWT_SECRET=（長隨機字串）
COOKIE_SECRET=（長隨機字串）

STORE_CORS=https://www.pikfun.com.tw,https://pikfun.vercel.app
ADMIN_CORS=https://pikfun-admin.vercel.app,https://你的後台網域
AUTH_CORS=https://www.pikfun.com.tw,https://pikfun-admin.vercel.app

MEDUSA_BACKEND_URL=https://你的服務.up.railway.app

# Supabase Storage（商品圖）
S3_BUCKET=medusa-images
S3_REGION=ap-northeast-1
S3_ENDPOINT=https://你的專案.storage.supabase.co/storage/v1/s3
S3_FILE_URL=https://你的專案.supabase.co/storage/v1/object/public/medusa-images
S3_ACCESS_KEY_ID=
S3_SECRET_ACCESS_KEY=

# 其餘：TapPay、Google OAuth、SMTP 等照 .env 填
```

**不要**在 Railway 設 `VERCEL=1`（那是給 Vercel 後台用的）。

### 3. 部署後

1. **Settings → Networking → Generate Domain**，得到例如：  
   `pikfun-backend-production.up.railway.app`
2. 第一次部署後在本地或 Railway Shell 跑 migration：

```bash
cd pickleball-backend
npx medusa db:migrate
```

3. 建立管理員（若還沒有）：

```bash
npx medusa user -e admin@pickleball.com -p 你的密碼
```

4. 到 `https://你的-railway網域/app` 可能**無法開**（正式環境 Admin 在 Railway 上被關閉），這是正常的，後台走 Vercel。

---

## 二、Vercel：Medusa 後台（第二個專案）

### 1. 建立專案

1. Vercel → **Add New** → **Project** → 同一個 GitHub repo `pikfun`
2. 專案名稱建議：`pikfun-admin`
3. **Root Directory** → `pickleball-backend`
4. **Framework Preset** → Other

### 2. Build 設定

| 欄位 | 值 |
|------|-----|
| Build Command | `npm run build` |
| Output Directory | `.medusa/server/public/admin` |
| Install Command | `npm install` |

### 3. 環境變數

```env
VERCEL=1
MEDUSA_BACKEND_URL=https://你的服務.up.railway.app
```

### 4. 更新 vercel.json

把 `pickleball-backend/vercel.json` 裡的 `REPLACE_WITH_RAILWAY_URL`  
改成你的 Railway 網域（不要 `https://`，只填 hostname），例如：

```
pikfun-backend-production.up.railway.app
```

commit push 後 Redeploy。

### 5. 自訂網域（選用）

Vercel → pikfun-admin → **Settings → Domains**  
例如：`admin.pikfun.tw`

記得把此網域加進 Railway 的 `ADMIN_CORS` 和 `AUTH_CORS`。

---

## 三、Vercel：顧客前台（已有 pikfun）

在 **pikfun** 專案的 Environment Variables 更新：

```env
NEXT_PUBLIC_MEDUSA_BACKEND_URL=https://你的服務.up.railway.app
NEXT_PUBLIC_SITE_URL=https://www.pikfun.com.tw
NEXTAUTH_URL=https://www.pikfun.com.tw
```

其餘 Supabase、LINE、Google 等變數照 `.env.local` 填。

Redeploy 前台。

---

## 四、檢查清單

- [ ] Supabase 專案已 Resume，DATABASE_URL 正確
- [ ] Railway 有 Redis，`REDIS_URL` 已連上
- [ ] Railway 網域可開：`https://xxx.up.railway.app/health` 回 200
- [ ] Vercel 後台可登入：`https://pikfun-admin.vercel.app`
- [ ] 前台商品頁能載入（代表 Publishable Key + CORS 正確）

---

## 常見問題

**Q: 為什麼 Admin 不放在 Railway？**  
`medusa-config.ts` 在 `NODE_ENV=production` 且非 Vercel 時會關閉內建 Admin，與 KESH 相同：API 在 Railway，Admin 靜態檔在 Vercel。

**Q: Railway 連不上資料庫？**  
用 Supabase **Session pooler (port 5432)**，並確認專案未 Paused。

**Q: 後台登入後 API 錯誤？**  
檢查 `vercel.json` 的 Railway 網址是否正確，以及 `MEDUSA_BACKEND_URL` 是否一致。
