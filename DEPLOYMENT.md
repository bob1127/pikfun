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

# Supabase Storage（商品圖）── 建議改 Cloudflare R2（見下方）
# S3_BUCKET=medusa-images
# S3_REGION=ap-northeast-1
# S3_ENDPOINT=https://你的專案.storage.supabase.co/storage/v1/s3
# S3_FILE_URL=https://你的專案.supabase.co/storage/v1/object/public/medusa-images

# Cloudflare R2（商品圖／影片）—— 與既有 S3_* 變數相容，只需改值
S3_BUCKET=pikfun-medusa
S3_REGION=auto
S3_ENDPOINT=https://你的ACCOUNT_ID.r2.cloudflarestorage.com
S3_FILE_URL=https://media.pikfun.com.tw
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

## 三點五、Cloudflare R2（媒體檔：商品圖／評論／社群／教練）

還沒上線建議一次切完。資料庫仍用 Supabase；**只有檔案**改放 R2。

### A. Cloudflare 後台（先做這步）

1. [dash.cloudflare.com](https://dash.cloudflare.com) → **R2** → 開通
2. **Create bucket**（建議兩個）  
   - `pikfun-media` → 給 storefront（留言、評論、頭像、教練）  
   - `pikfun-medusa` → 給 Medusa 商品圖／影片  
3. 進入 bucket → **Settings** → **Public access**  
   - 建議接 **Custom Domain**（例如 `media.pikfun.com.tw`）  
   - 或暫時用 **R2.dev subdomain**
4. **R2 → Manage R2 API Tokens** → Create  
   - Permission：Object Read & Write（涵蓋上述 buckets）  
   - 記下：`Access Key ID`、`Secret Access Key`、`Account ID`

### B. Storefront `.env.local`（＋ Vercel）

```env
R2_ACCOUNT_ID=你的_account_id
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET=pikfun-media
R2_PUBLIC_URL=https://media.pikfun.com.tw
# 可選；預設會用 https://ACCOUNT_ID.r2.cloudflarestorage.com
# R2_ENDPOINT=
# R2_REGION=auto
```

上傳 API 已改走 `lib/r2.js`（社群圖、評論媒體、頭像、教練封面／媒體）。

### C. Medusa `.env`（＋ Railway）

沿用既有 `S3_*`，只改成 R2 值（程式不用改）：

```env
S3_BUCKET=pikfun-medusa
S3_REGION=auto
S3_ENDPOINT=https://ACCOUNT_ID.r2.cloudflarestorage.com
S3_FILE_URL=https://media.pikfun.com.tw
S3_ACCESS_KEY_ID=
S3_SECRET_ACCESS_KEY=
```

若商品與前台共用同一個公開網域，可把 Medusa 檔案放到子路徑，例如 `S3_FILE_URL=https://media.pikfun.com.tw` 且 bucket 內用 prefix；最簡單是**兩個 bucket、兩個 custom domain**，或一個 domain 對應一個 bucket。

### D. 驗證

1. 重啟 storefront / Medusa  
2. Medusa Admin 上傳一張商品圖 → 網址應是 `S3_FILE_URL/...`  
3. 前台留言或評論上傳圖片 → 網址應是 `R2_PUBLIC_URL/...`

---

## 四、檢查清單

- [ ] Supabase 專案已 Resume，DATABASE_URL 正確
- [ ] Railway 有 Redis，`REDIS_URL` 已連上
- [ ] Railway 網域可開：`https://xxx.up.railway.app/health` 回 200
- [ ] Vercel 後台可登入：`https://pikfun-admin.vercel.app`
- [ ] 前台商品頁能載入（代表 Publishable Key + CORS 正確）
- [ ] R2 buckets + API Token 已建立，`R2_*` / `S3_*` 已填
- [ ] Medusa 上傳商品圖成功；前台上傳評論／留言圖成功

---

## 常見問題

**Q: 為什麼 Admin 不放在 Railway？**  
`medusa-config.ts` 在 `NODE_ENV=production` 且非 Vercel 時會關閉內建 Admin，與 KESH 相同：API 在 Railway，Admin 靜態檔在 Vercel。

**Q: Railway 連不上資料庫？**  
用 Supabase **Session pooler (port 5432)**，並確認專案未 Paused。

**Q: 後台登入後 API 錯誤？**  
檢查 `vercel.json` 的 Railway 網址是否正確，以及 `MEDUSA_BACKEND_URL` 是否一致。

**Q: R2 上傳成功但圖片 404？**  
代表 bucket 尚未公開：請綁 Custom Domain，或啟用 r2.dev 公開網址，並確認 `R2_PUBLIC_URL` / `S3_FILE_URL` 與此一致（不要用 `*.r2.cloudflarestorage.com` 當公開網址）。
