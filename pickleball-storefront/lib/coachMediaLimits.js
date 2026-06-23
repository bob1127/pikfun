/** 教練內頁媒體上傳配額（單檔 + 總數） */
export const COACH_MEDIA_LIMITS = {
  image: {
    maxFileBytes: 2 * 1024 * 1024, // 2MB
    maxCount: 12,
    allowedTypes: ["image/jpeg", "image/png", "image/webp", "image/gif"],
    label: "圖片",
  },
  video: {
    maxFileBytes: 30 * 1024 * 1024, // 30MB
    maxCount: 3,
    allowedTypes: ["video/mp4", "video/webm", "video/quicktime"],
    label: "影片",
  },
};

export const COACH_MEDIA_BUCKET = "coach-media";

export function formatBytes(bytes) {
  if (!bytes) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
