import nodemailer from "nodemailer";
import { DEFAULT_CONTACT_EMAIL } from "@/lib/siteUrl";

const TYPE_LABELS = {
  general: "一般聯絡",
  consignment: "寄賣／銷售合作",
  marketing: "球場・教練行銷",
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const {
    type = "general",
    name,
    email,
    phone,
    company,
    service,
    message,
    metadata,
  } = req.body || {};

  if (!name?.trim() || !email?.trim() || !message?.trim()) {
    return res.status(400).json({ error: "請填寫姓名、Email 與訊息內容" });
  }

  const typeLabel = TYPE_LABELS[type] || type;
  const subjectLine = `【PikFun ${typeLabel}】${service || "新詢問"} — ${name}`;

  const metaLines =
    metadata && typeof metadata === "object"
      ? Object.entries(metadata)
          .filter(([, v]) => v != null && v !== "")
          .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : v}`)
          .join("\n")
      : "";

  const textBody = `
類型: ${typeLabel}
姓名: ${name}
信箱: ${email}
電話: ${phone || "—"}
單位: ${company || "—"}
需求: ${service || "—"}

訊息內容:
${message}

${metaLines ? `補充資料:\n${metaLines}` : ""}
`.trim();

  const htmlBody = `
    <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; max-width: 640px;">
      <h2 style="color:#005caf;margin:0 0 12px;">PikFun 官網聯絡表單</h2>
      <p><strong>類型：</strong>${typeLabel}</p>
      <p><strong>姓名：</strong>${name}</p>
      <p><strong>信箱：</strong>${email}</p>
      <p><strong>電話：</strong>${phone || "—"}</p>
      <p><strong>單位：</strong>${company || "—"}</p>
      <p><strong>需求：</strong>${service || "—"}</p>
      <hr style="border:none;border-top:1px solid #eee;margin:16px 0;" />
      <p><strong>訊息內容：</strong></p>
      <p style="white-space: pre-wrap;">${String(message).replace(/</g, "&lt;")}</p>
      ${
        metaLines
          ? `<hr style="border:none;border-top:1px solid #eee;margin:16px 0;" /><pre style="font-size:12px;color:#555;white-space:pre-wrap;">${metaLines.replace(/</g, "&lt;")}</pre>`
          : ""
      }
    </div>
  `;

  // 開發／未設定 Gmail 時仍回成功，避免表單卡住
  if (!process.env.GMAIL_USER || !process.env.GMAIL_PASS) {
    console.warn("[contact] GMAIL_USER/PASS missing — logging inquiry only");
    console.info(textBody);
    return res.status(200).json({ success: true, queued: false, logged: true });
  }

  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: process.env.GMAIL_USER,
      to: process.env.CONTACT_TO_EMAIL || DEFAULT_CONTACT_EMAIL,
      replyTo: email,
      subject: subjectLine,
      text: textBody,
      html: htmlBody,
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Email error:", error);
    return res.status(500).json({ success: false, error: "Failed to send email" });
  }
}
