import { useState } from "react";
import Link from "next/link";
import {
  Globe,
  UserRound,
  Megaphone,
  CalendarDays,
  LayoutTemplate,
  CheckCircle2,
  BadgeCheck,
} from "lucide-react";
import ContactFormRow, {
  inputClass,
  selectClass,
  textareaClass,
} from "./ContactFormRow";
import {
  MARKETING_ROLES,
  MARKETING_NEEDS,
  CONTACT_UI,
} from "@/lib/contactUi";

const BENEFITS = [
  {
    icon: Globe,
    title: "球場網站",
    desc: "場地介紹、預約與形象網站規劃",
  },
  {
    icon: UserRound,
    title: "教練個人頁",
    desc: "履歷、課表與報名導流頁面",
  },
  {
    icon: Megaphone,
    title: "站內宣傳",
    desc: "於 PikFun 放置行銷素材／曝光",
  },
  {
    icon: CalendarDays,
    title: "活動聯宣",
    desc: "賽事、體驗營、招生聯合宣傳",
  },
  {
    icon: LayoutTemplate,
    title: "素材製作",
    desc: "視覺、文案與投放建議討論",
  },
];

export default function MarketingPartnerTab() {
  const [form, setForm] = useState({
    role: "",
    needs: [],
    name: "",
    email: "",
    phone: "",
    orgName: "",
    city: "",
    message: "",
  });
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const toggleNeed = (value) => {
    setForm((p) => {
      const has = p.needs.includes(value);
      return {
        ...p,
        needs: has ? p.needs.filter((n) => n !== value) : [...p.needs, value],
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.role) return setError("請選擇您的身份");
    if (!form.needs.length) return setError("請至少選擇一項需求");
    if (!form.name.trim()) return setError("請填寫聯絡人姓名");
    if (!form.email.trim()) return setError("請填寫 Email");
    if (!form.phone.trim()) return setError("請填寫聯絡電話");
    if (!form.orgName.trim())
      return setError("請填寫球場／教練名稱或單位");
    if (form.message.trim().length < 10)
      return setError("請說明需求細節（至少 10 字）");
    if (!agreed) return setError("請同意隱私權政策");

    const roleLabel =
      MARKETING_ROLES.find((r) => r.value === form.role)?.label || form.role;
    const needLabels = form.needs.map(
      (v) => MARKETING_NEEDS.find((n) => n.value === v)?.label || v,
    );

    setSubmitting(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "marketing",
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          company: form.orgName.trim(),
          service: `球場・教練行銷 — ${roleLabel}`,
          message: form.message.trim(),
          metadata: {
            role: form.role,
            role_label: roleLabel,
            needs: form.needs,
            need_labels: needLabels,
            city: form.city.trim() || null,
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
          我們已收到您的行銷／建站需求，專人將與您聯繫討論可行方案與時程。
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center mt-6">
          <Link
            href="/coaching"
            className="inline-flex items-center justify-center gap-1 px-5 py-2.5 text-sm font-bold text-white rounded-sm hover:bg-[#1a3a8a]"
            style={{ backgroundColor: CONTACT_UI.primary }}
          >
            查看教練開課
          </Link>
          <button
            type="button"
            onClick={() => {
              setDone(false);
              setForm({
                role: "",
                needs: [],
                name: "",
                email: "",
                phone: "",
                orgName: "",
                city: "",
                message: "",
              });
              setAgreed(false);
            }}
            className="text-sm font-bold text-[#005caf] hover:underline px-5 py-2.5"
          >
            再送一則洽詢
          </button>
        </div>
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
            球場主・教練行銷合作
          </h2>
          <p className="text-sm text-slate-500 leading-relaxed mb-6">
            需要為球場製作網站／預約頁、為教練打造個人頁面，或希望把場地與課程素材放到
            PikFun 宣傳？告訴我們您的目標，我們一起規劃曝光與建置方案。
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 gap-3">
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
            常見合作情境
          </h3>
          <ul className="mt-4 space-y-2 text-xs text-slate-600">
            {[
              "球場主：官網、場地租借說明、線上預約入口",
              "教練：個人形象頁、課程介紹與報名導流",
              "雙方：Banner／貼文素材放到 PikFun 首頁或相關頻道",
              "賽事／體驗營：聯合宣傳與活動頁規劃",
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
          <p className="text-[11px] text-slate-400 mt-4">
            也可先至{" "}
            <Link href="/coaching" className="text-[#005caf] font-bold">
              教練開課
            </Link>{" "}
            了解現有教練頁面形式。
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="border-b border-slate-200 overflow-hidden">
          <ContactFormRow label="您的身份" required>
            <select
              value={form.role}
              onChange={(e) => set("role", e.target.value)}
              className={selectClass}
            >
              <option value="">請選擇</option>
              {MARKETING_ROLES.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </ContactFormRow>

          <ContactFormRow
            label="需求項目"
            required
            hint="可複選，越具體越容易評估"
          >
            <div className="flex flex-wrap gap-2">
              {MARKETING_NEEDS.map((n) => {
                const on = form.needs.includes(n.value);
                return (
                  <button
                    key={n.value}
                    type="button"
                    onClick={() => toggleNeed(n.value)}
                    className={`text-xs px-3 py-2 rounded-sm border transition ${
                      on
                        ? "border-[#005caf] bg-[#005caf]/10 text-[#005caf] font-bold"
                        : "border-slate-200 text-slate-600 hover:border-[#005caf]/40"
                    }`}
                  >
                    {n.label}
                  </button>
                );
              })}
            </div>
          </ContactFormRow>

          <ContactFormRow label="球場／教練／單位名稱" required>
            <input
              type="text"
              value={form.orgName}
              onChange={(e) => set("orgName", e.target.value)}
              placeholder="例）○○匹克球場、教練暱稱"
              className={inputClass}
            />
          </ContactFormRow>

          <ContactFormRow label="所在地區" optional>
            <input
              type="text"
              value={form.city}
              onChange={(e) => set("city", e.target.value)}
              placeholder="例）台北市內湖區"
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
            label="需求說明"
            required
            hint="現況、目標、預算範圍或希望上線時間等"
          >
            <textarea
              value={form.message}
              onChange={(e) => set("message", e.target.value)}
              rows={5}
              placeholder="例）球場希望做簡易預約網站，並在 PikFun 放一季 Banner 宣傳週末體驗營…"
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
            {submitting ? "送出中…" : "送出行銷／建站洽詢"}
          </button>
        </div>
      </form>
    </div>
  );
}
