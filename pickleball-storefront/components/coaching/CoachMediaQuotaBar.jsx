import { COACH_MEDIA_LIMITS, formatBytes } from "@/lib/coachMediaLimits";

export default function CoachMediaQuotaBar({ usage }) {
  const items = [
    { key: "image", ...COACH_MEDIA_LIMITS.image },
    { key: "video", ...COACH_MEDIA_LIMITS.video },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 bg-white border border-gray-200 rounded-lg">
      <p className="sm:col-span-2 text-xs font-bold text-gray-500">
        媒體上傳配額（富文本內嵌圖片／影片）
      </p>
      {items.map(({ key, label, maxCount, maxFileBytes }) => {
        const used = usage?.[key]?.count ?? 0;
        const pct = Math.min(100, Math.round((used / maxCount) * 100));
        return (
          <div key={key}>
            <div className="flex justify-between text-xs mb-1">
              <span className="font-bold text-gray-700">{label}</span>
              <span className="text-gray-500">
                {used} / {maxCount}（單檔 ≤ {formatBytes(maxFileBytes)}）
              </span>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  pct >= 100 ? "bg-[#F4596A]" : "bg-[#3157B5]"
                }`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
