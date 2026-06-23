import parse from "html-react-parser";
import { sanitizeCoachHtml } from "@/lib/sanitizeCoachHtml";

export default function CoachRichContent({ html, fallbackText, className = "" }) {
  if (html) {
    const safe = sanitizeCoachHtml(html);
    if (safe) {
      return (
        <div
          className={`prose prose-sm max-w-none coach-rich-content [&_img]:rounded-lg [&_video]:w-full [&_video]:max-w-full [&_video]:rounded-lg ${className}`}
        >
          {parse(safe)}
        </div>
      );
    }
  }

  if (!fallbackText) return null;

  const paragraphs = String(fallbackText)
    .split("\n\n")
    .filter(Boolean);

  return (
    <div className={`space-y-6 ${className}`}>
      {paragraphs.map((para, i) => (
        <p key={i} className="text-gray-700 leading-[1.9] text-[15px]">
          {para}
        </p>
      ))}
    </div>
  );
}
