import { useState } from "react";
import Link from "next/link";
import {
  Package,
  Store,
  Handshake,
  BadgePercent,
  Headphones,
  CheckCircle2,
  BadgeCheck,
} from "lucide-react";
import ContactFormRow, {
  inputClass,
  selectClass,
  textareaClass,
} from "./ContactFormRow";
import { CONSIGNMENT_TYPES, CONTACT_UI } from "@/lib/contactUi";

const BENEFITS = [
  { icon: Package, title: "寄賣上架", desc: "球拍／裝備於 PikFun 商城露出" },
  { icon: Store, title: "銷售通路", desc: "接觸全台匹克球迷與球友" },
  { icon: Handshake, title: "經銷合作", desc: "批發、品牌入駐彈性談" },
  { icon: BadgePercent, title: "分潤機制", desc: "依合作模式談定條件" },
  { icon: Headphones, title: "專人對接", desc: "1～3 工作天內回覆" },
];

export default function ConsignmentTab() {
  const [form, setForm] = useState({
    consignType: "",
    name: "",
    email: "",
    phone: "",
    company: "",
    productLine: "",
    message: "",
  });
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.consignType) return setError("請選擇合作類型");
    if (!form.name.trim()) return setError("請填寫聯絡人姓名");
    if (!form.email.trim()) return setError("請填寫 Email");
    if (!form.phone.trim()) return setError("請填寫聯絡電話");
    if (!form.company.trim()) return setError("請填寫品牌／店名／公司名稱");
    if (form.message.trim().length < 10)
      return setError("請說明商品與合作想法（至少 10 字）");
    if (!agreed) return setError("請同意隱私權政策");

    const typeLabel =
      CONSIGNMENT_TYPES.find((t) => t.value === form.consignType)?.label ||
      form.consignType;

    setSubmitting(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "consignment",
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          company: form.company.trim(),
          service: `寄賣／銷售合作 — ${typeLabel}`,
          message: form.message.trim(),
          metadata: {
            consign_type: form.consignType,
            consign_type_label: typeLabel,
            product_line: form.productLine.trim() || null,
          },
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "提交失敗");
      setDone(true);
    } catch (err) {
      setError(err.message || "提交失敗，請稍後再試");
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="p-8 sm:p-12 text-center bg-white">
        <BadgeCheck
          size={48}
          className="mx-auto mb-4"
          style={{ color: CONTACT_UI.primary }}
        />
        <h2
          className="text-xl font-black mb-2"
          style={{ color: CONTACT_UI.text }}
        >
          洽詢已送出
        </h2>
        <p className="text-sm text-slate-500 mb-2 max-w-md mx-auto">
          我們已收到您的寄賣／銷售合作意向，商城對接人員將與您聯繫。
        </p>
        <button
          type="button"
          onClick={() => {
            setDone(false);
            setForm({
              consignType: "",
              name: "",
              email: "",
              phone: "",
              company: "",
              productLine: "",
              message: "",
            });
            setAgreed(false);
          }}
          className="mt-4 text-sm font-bold text-[#005caf] hover:underline"
        >
          再送一則洽詢
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 border-b border-slate-200">
        <div className="p-6 sm:p-8 bg-white border-b lg:border-b-0 lg:border-r border-slate-200">
          <h2
            className="text-lg font-black mb-2"
            style={{ color: CONTACT_UI.text }}
          >
            球拍／運動用品寄賣與銷售合作
          </h2>
          <p className="text-sm text-slate-500 leading-relaxed mb-6">
            無論是個人寄賣球拍、品牌經銷，或希望透過 PikFun
            通路接觸匹克球愛好者，都歡迎留下資料，我們會依商品與合作模式回覆可行方案。
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 gap-3 mb-2">
            {BENEFITS.map((b) => {
              const Icon = b.icon;
              return (
                <div
                  key={b.title}
                  className="text-center p-3 border border-slate-100 rounded-sm bg-slate-50/50"
                >
                  <Icon
                    size={24}
                    className="mx-auto mb-1.5"
                    style={{ color: CONTACT_UI.primary }}
                  />
                  <p
                    className="text-xs font-bold"
                    style={{ color: CONTACT_UI.text }}
                  >
                    {b.title}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5 leading-snug">
                    {b.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="p-6 sm:p-8 bg-white">
          <h3
            className="text-sm font-black mb-1"
            style={{ color: CONTACT_UI.text }}
          >
            適合誰來談？
          </h3>
          <p className="text-xs text-slate-500 mb-4">
            填寫右側表單即可，無需先建立帳號。
          </p>
          <ul className="space-y-2 text-xs text-slate-600">
            {[
              "個人／工作室寄賣球拍、球鞋、裝備",
              "品牌方尋求線上／線下銷售合作",
              "經銷商、通路希望導入匹克球商品",
            ].map((t) => (
              <li key={t} className="flex items-start gap-2">
                <CheckCircle2
                  size={16}
                  className="text-[#005caf] shrink-0 mt-0.5"
                />
                {t}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="border-b border-slate-200 overflow-hidden">
          <ContactFormRow label="合作類型" required>
            <select
              value={form.consignType}
              onChange={(e) => set("consignType", e.target.value)}
              className={selectClass}
            >
              <option value="">請選擇最符合的類別</option>
              {CONSIGNMENT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </ContactFormRow>

          <ContactFormRow label="品牌／店名／公司" required>
            <input
              type="text"
              value={form.company}
              onChange={(e) => set("company", e.target.value)}
              placeholder="例）○○球拍工作室、品牌名稱"
              className={inputClass}
            />
          </ContactFormRow>

          <ContactFormRow label="主要品項" optional hint="例：球拍、球、鞋、服裝">
            <input
              type="text"
              value={form.productLine}
              onChange={(e) => set("productLine", e.target.value)}
              placeholder="例）碳纖維球拍、入門組"
              className={inputClass}
            />
          </ContactFormRow>

          <ContactFormRow label="聯絡人姓名" required>
            <input
              type="text"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="例）王小明"
              className={inputClass}
            />
          </ContactFormRow>

          <ContactFormRow label="Email" required>
            <input
              type="email"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
              placeholder="回覆將寄至此信箱"
              className={inputClass}
            />
          </ContactFormRow>

          <ContactFormRow label="聯絡電話" required>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => set("phone", e.target.value)}
              placeholder="例）0912345678"
              className={inputClass}
            />
          </ContactFormRow>

          <ContactFormRow
            label="商品與合作說明"
            required
            hint="品項、數量、期望寄賣／經銷條件等"
          >
            <textarea
              value={form.message}
              onChange={(e) => set("message", e.target.value)}
              rows={5}
              placeholder="例）希望寄賣 5 支中階球拍，可提供實拍圖與建議售價…"
              className={textareaClass}
            />
          </ContactFormRow>
        </div>

        <div className="px-4 sm:px-6 py-5 bg-white space-y-4">
          <label className="flex items-start gap-2 text-sm text-slate-600 cursor-pointer">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-0.5 accent-[#005caf]"
            />
            <span>
              我已閱讀並同意{" "}
              <Link
                href="/privacy"
                target="_blank"
                className="text-[#005caf] font-bold hover:underline"
              >
                隱私權政策
              </Link>
              ，並確認所填資料真實有效。
            </span>
          </label>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-sm px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full sm:w-auto min-w-[240px] flex items-center justify-center gap-2 px-8 py-3.5 text-white text-sm font-bold rounded-sm disabled:opacity-50 hover:bg-[#1a3a8a]"
            style={{ backgroundColor: CONTACT_UI.primary }}
          >
            {submitting ? "送出中…" : "送出寄賣／銷售洽詢"}
          </button>
        </div>
      </form>
    </div>
  );
}
