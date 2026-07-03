import { getSiteUrl } from "@/lib/siteUrl";
import {
  SKILL_LABELS,
  PAYMENT_LABELS,
  formatSessionDate,
  formatSessionRange,
  formatFee,
  buildGoogleMapsLink,
  enrichPaymentFields,
} from "@/lib/playUtils";

const BRAND_BLUE = "#1a9be8";
const BRAND_DARK = "#005caf";
const BORDER_BLUE = "#b8d4f0";
const MUTED = "#6b7280";
const TEXT = "#1a1a1a";

function escHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function getSiteUrlForReminder() {
  return getSiteUrl();
}

/** 依 remind_at 與 starts_at 判斷是 1 天前或 2 小時前 */
export function getReminderTimingLabel(remindAt, startsAt) {
  if (!remindAt || !startsAt) return "活動提醒";
  const diffMs = new Date(startsAt).getTime() - new Date(remindAt).getTime();
  const hours = diffMs / (60 * 60 * 1000);
  if (hours >= 20) return "活動前 1 天";
  return "活動前 2 小時";
}

export function buildReminderContext(session, reminder = null) {
  const s = enrichPaymentFields(session);
  const siteUrl = getSiteUrlForReminder();
  const mapsUrl =
    buildGoogleMapsLink(s.location_name, s.location_address) || null;
  const detailUrl = `${siteUrl}/play/${s.id}`;
  const fee = s.fee_per_person ?? 0;
  const paymentLabel =
    fee > 0 && s.payment_method
      ? PAYMENT_LABELS[s.payment_method] || s.payment_method
      : null;

  return {
    title: s.title || "揪團活動",
    description: s.description?.trim() || "",
    timingLabel: getReminderTimingLabel(reminder?.remind_at, s.starts_at),
    dateLabel: formatSessionDate(s.starts_at),
    timeRange: formatSessionRange(s.starts_at, s.ends_at),
    locationName: s.location_name || "未指定球場",
    locationAddress: s.location_address?.trim() || "",
    mapsUrl,
    detailUrl,
    skillLabel: SKILL_LABELS[s.skill_level] || SKILL_LABELS.all,
    maxPlayers: s.max_players ?? 4,
    hostName: s.host_name || "團主",
    feeText: formatFee(fee, s.payment_method),
    paymentLabel,
    paymentNote: fee > 0 ? s.payment_note?.trim() || "" : "",
    altText: `PikFun 揪團提醒：${s.title || "活動"} ${getReminderTimingLabel(reminder?.remind_at, s.starts_at)}`,
  };
}

function flexInfoRow(label, value) {
  if (!value) return null;
  return {
    type: "box",
    layout: "vertical",
    spacing: "xs",
    margin: "lg",
    contents: [
      {
        type: "text",
        text: label,
        size: "xs",
        color: MUTED,
        weight: "bold",
      },
      {
        type: "text",
        text: value,
        size: "sm",
        color: TEXT,
        wrap: true,
      },
    ],
  };
}

function truncate(text, max = 280) {
  const s = String(text || "").trim();
  if (s.length <= max) return s;
  return `${s.slice(0, max - 1)}…`;
}

function flexSeparator() {
  return {
    type: "separator",
    margin: "xl",
    color: BORDER_BLUE,
  };
}

/** LINE Flex Message（THEO 簡潔風格，無 emoji） */
export function buildLineFlexMessage(ctx) {
  const bodyRows = [
    flexInfoRow("日期", ctx.dateLabel),
    flexInfoRow("時間", ctx.timeRange),
    flexInfoRow("球場", ctx.locationName),
    ctx.locationAddress ? flexInfoRow("地址", ctx.locationAddress) : null,
    flexInfoRow("程度建議", ctx.skillLabel),
    flexInfoRow("人數上限", `${ctx.maxPlayers} 人`),
    flexInfoRow("費用", ctx.feeText),
    ctx.paymentLabel ? flexInfoRow("付款方式", ctx.paymentLabel) : null,
    ctx.paymentNote ? flexInfoRow("付款說明", ctx.paymentNote) : null,
    flexInfoRow("團主", ctx.hostName),
    ctx.description
      ? flexInfoRow("揪團說明", truncate(ctx.description))
      : null,
  ].filter(Boolean);

  const footerButtons = [];

  if (ctx.mapsUrl) {
    footerButtons.push({
      type: "button",
      style: "secondary",
      color: BRAND_BLUE,
      height: "sm",
      action: {
        type: "uri",
        label: "Google 地圖導航",
        uri: ctx.mapsUrl,
      },
    });
  }

  footerButtons.push({
    type: "button",
    style: "primary",
    color: BRAND_DARK,
    height: "sm",
    action: {
      type: "uri",
      label: "查看揪團詳情",
      uri: ctx.detailUrl,
    },
  });

  return {
    type: "flex",
    altText: ctx.altText,
    contents: {
      type: "bubble",
      size: "mega",
      styles: {
        body: { backgroundColor: "#ffffff" },
        footer: { backgroundColor: "#f8fafc" },
      },
      header: {
        type: "box",
        layout: "vertical",
        backgroundColor: "#ffffff",
        paddingAll: "20px",
        contents: [
          {
            type: "text",
            text: "PikFun",
            color: BRAND_BLUE,
            size: "lg",
            weight: "bold",
          },
          {
            type: "text",
            text: "揪團活動提醒",
            color: TEXT,
            size: "md",
            weight: "bold",
            margin: "md",
          },
          {
            type: "box",
            layout: "vertical",
            backgroundColor: "#fef9c3",
            cornerRadius: "md",
            paddingAll: "10px",
            margin: "lg",
            contents: [
              {
                type: "text",
                text: ctx.timingLabel,
                color: BRAND_DARK,
                size: "sm",
                weight: "bold",
                align: "center",
              },
            ],
          },
        ],
      },
      body: {
        type: "box",
        layout: "vertical",
        paddingAll: "20px",
        paddingTop: "8px",
        contents: [
          {
            type: "text",
            text: ctx.title,
            weight: "bold",
            size: "xl",
            color: TEXT,
            wrap: true,
          },
          flexSeparator(),
          ...bodyRows,
        ],
      },
      footer: {
        type: "box",
        layout: "vertical",
        spacing: "sm",
        paddingAll: "16px",
        contents: footerButtons,
      },
    },
  };
}

function emailInfoRow(label, value) {
  if (!value) return "";
  return `
    <tr>
      <td style="padding:12px 0;border-bottom:1px solid #e8edf3;vertical-align:top;width:88px">
        <span style="font-size:12px;font-weight:600;color:${MUTED}">${escHtml(label)}</span>
      </td>
      <td style="padding:12px 0;border-bottom:1px solid #e8edf3;vertical-align:top;font-size:14px;color:${TEXT};line-height:1.6">
        ${escHtml(value).replace(/\n/g, "<br>")}
      </td>
    </tr>`;
}

/** Email HTML（THEO 簡潔風格，無 emoji） */
export function buildReminderEmailHtml(ctx) {
  const rows = [
    emailInfoRow("日期", ctx.dateLabel),
    emailInfoRow("時間", ctx.timeRange),
    emailInfoRow("球場", ctx.locationName),
    ctx.locationAddress ? emailInfoRow("地址", ctx.locationAddress) : "",
    emailInfoRow("程度建議", ctx.skillLabel),
    emailInfoRow("人數上限", `${ctx.maxPlayers} 人`),
    emailInfoRow("費用", ctx.feeText),
    ctx.paymentLabel ? emailInfoRow("付款方式", ctx.paymentLabel) : "",
    ctx.paymentNote ? emailInfoRow("付款說明", ctx.paymentNote) : "",
    emailInfoRow("團主", ctx.hostName),
    ctx.description ? emailInfoRow("揪團說明", ctx.description) : "",
  ].join("");

  const mapsBtn = ctx.mapsUrl
    ? `<a href="${escHtml(ctx.mapsUrl)}"
         style="display:inline-block;margin:0 8px 8px 0;padding:12px 28px;border:1.5px solid ${BRAND_BLUE};color:${BRAND_BLUE};border-radius:999px;text-decoration:none;font-size:14px;font-weight:700">
        Google 地圖導航
      </a>`
    : "";

  return `
<!DOCTYPE html>
<html lang="zh-TW">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:24px 16px;background:#f4f7fb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif">
  <div style="max-width:520px;margin:0 auto;background:#fff;border:1px solid ${BORDER_BLUE};border-radius:12px;overflow:hidden">
    <div style="padding:32px 28px 20px;text-align:center;border-bottom:1px solid #eef2f7">
      <div style="font-size:22px;font-weight:800;color:${BRAND_BLUE};letter-spacing:-0.02em">PikFun</div>
      <div style="font-size:18px;font-weight:700;color:${TEXT};margin-top:12px">揪團活動提醒</div>
      <div style="display:inline-block;margin-top:16px;padding:8px 20px;background:linear-gradient(transparent 55%,#fef08a 55%);font-size:14px;font-weight:700;color:${BRAND_DARK}">
        ${escHtml(ctx.timingLabel)}
      </div>
    </div>
    <div style="padding:24px 28px 8px">
      <h1 style="margin:0 0 20px;font-size:20px;font-weight:800;color:${TEXT};line-height:1.4">${escHtml(ctx.title)}</h1>
      <table style="width:100%;border-collapse:collapse">${rows}</table>
    </div>
    <div style="padding:8px 28px 28px;text-align:center">
      ${mapsBtn}
      <a href="${escHtml(ctx.detailUrl)}"
         style="display:inline-block;margin:0 8px 8px 0;padding:12px 28px;background:${BRAND_BLUE};color:#fff;border-radius:999px;text-decoration:none;font-size:14px;font-weight:700">
        查看揪團詳情
      </a>
    </div>
    <div style="padding:16px 28px;background:#f8fafc;border-top:1px solid #eef2f7;text-align:center">
      <p style="margin:0;font-size:11px;color:#9ca3af;line-height:1.6">
        你收到此信是因為已報名 PikFun 揪團活動。
      </p>
    </div>
  </div>
</body>
</html>`;
}

export function buildReminderEmailSubject(ctx) {
  return `PikFun 揪團提醒｜${ctx.timingLabel}｜${ctx.title}`;
}
