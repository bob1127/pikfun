import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

/**
 * Cloudflare R2（S3 相容）上傳工具。
 * 環境變數見 .env.example / DEPLOYMENT.md「R2」段落。
 */

function requiredEnv(name) {
  const v = process.env[name]?.trim();
  if (!v) {
    throw new Error(
      `缺少 ${name}：請先完成 Cloudflare R2 設定（見 DEPLOYMENT.md）`,
    );
  }
  return v;
}

export function isR2Configured() {
  return Boolean(
    process.env.R2_ACCOUNT_ID &&
      process.env.R2_ACCESS_KEY_ID &&
      process.env.R2_SECRET_ACCESS_KEY &&
      process.env.R2_BUCKET &&
      process.env.R2_PUBLIC_URL,
  );
}

export function getR2PublicBaseUrl() {
  return requiredEnv("R2_PUBLIC_URL").replace(/\/$/, "");
}

let cachedClient = null;

export function getR2Client() {
  if (cachedClient) return cachedClient;

  const accountId = requiredEnv("R2_ACCOUNT_ID");
  cachedClient = new S3Client({
    region: process.env.R2_REGION || "auto",
    endpoint:
      process.env.R2_ENDPOINT ||
      `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: requiredEnv("R2_ACCESS_KEY_ID"),
      secretAccessKey: requiredEnv("R2_SECRET_ACCESS_KEY"),
    },
    forcePathStyle: true,
  });
  return cachedClient;
}

/**
 * @param {{ key: string, body: Buffer|Uint8Array, contentType?: string, cacheControl?: string }} opts
 * @returns {Promise<{ url: string, key: string }>}
 */
export async function uploadToR2({
  key,
  body,
  contentType = "application/octet-stream",
  cacheControl = "public, max-age=31536000",
}) {
  const bucket = requiredEnv("R2_BUCKET");
  const client = getR2Client();
  const safeKey = String(key).replace(/^\/+/, "");

  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: safeKey,
      Body: body,
      ContentType: contentType,
      CacheControl: cacheControl,
    }),
  );

  return {
    key: safeKey,
    url: `${getR2PublicBaseUrl()}/${safeKey
      .split("/")
      .map(encodeURIComponent)
      .join("/")}`,
  };
}

/** 從 data URL 或純 base64 取出 Buffer */
export function bufferFromBase64(input) {
  const raw = String(input || "");
  const base64 = raw.includes(",")
    ? raw.slice(raw.indexOf(",") + 1)
    : raw.replace(/^data:[^;]+;base64,/, "");
  return Buffer.from(base64, "base64");
}

export function buildObjectKey(folder, fileName, fallbackExt = "bin") {
  const ext = (fileName?.split(".").pop() || fallbackExt)
    .replace(/[^a-z0-9]/gi, "")
    .toLowerCase() || fallbackExt;
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  const prefix = String(folder || "uploads")
    .replace(/^\/+|\/+$/g, "")
    .replace(/\.\./g, "");
  return `${prefix}/${id}.${ext}`;
}
