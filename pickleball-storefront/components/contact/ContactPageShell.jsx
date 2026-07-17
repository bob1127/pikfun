import Link from "next/link";
import { Home, ChevronRight, Mail, MessageCircle, ArrowLeft } from "lucide-react";
import { CONTACT_UI, CONTACT_TABS, CONTACT_INFO } from "@/lib/contactUi";

const TAB_HINTS = {
  general:
    "商品、訂單、揪團或一般問題，請填寫以下表單。帶有「必須」標記的欄位為必填。",
  consignment:
    "球拍、運動用品寄賣或經銷／品牌銷售合作，請說明商品與合作方式，我們將於 1～3 個工作天內回覆。",
  marketing:
    "球場主、教練的網站建置、個人頁面，或於 PikFun 放置行銷素材／聯合宣傳，請選擇需求並留下聯絡方式。",
};

export default function ContactPageShell({ activeTab, onTabChange, children }) {
  return (
    <div
      className="min-h-screen font-sans pt-28 mt-4 md:pt-32 pb-16 overflow-x-hidden"
      style={{ backgroundColor: CONTACT_UI.bg }}
    >
      <div
        className="w-full max-w-5xl mx-auto px-4 sm:px-6 box-border"
        style={{ maxWidth: `${CONTACT_UI.contentMaxPx}px` }}
      >
        <nav className="flex items-center gap-1.5 text-xs text-slate-400 mb-6">
          <Link
            href="/"
            className="hover:text-[#005caf] flex items-center gap-1"
          >
            <Home size={14} />
            首頁
          </Link>
          <ChevronRight size={14} />
          <span className="font-bold" style={{ color: CONTACT_UI.primary }}>
            聯絡我們
          </span>
        </nav>

        <div className="mb-6">
          <h1
            className="text-2xl sm:text-3xl font-black tracking-tight"
            style={{ color: CONTACT_UI.text }}
          >
            聯絡我們
          </h1>
          <p className="text-sm text-slate-500 mt-2 leading-relaxed max-w-xl">
            一般諮詢、球拍／運動用品寄賣與銷售合作、球場主與教練行銷合作，請選擇下方分類填寫表單，我們將於
            1～3 個工作天內回覆。
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
          <a
            href={`mailto:${CONTACT_INFO.email}`}
            className="flex items-center gap-3 p-4 bg-white border border-slate-200 rounded-xl hover:border-[#005caf] hover:shadow-sm transition"
          >
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
              style={{ backgroundColor: `${CONTACT_UI.primary}1a` }}
            >
              <Mail size={22} style={{ color: CONTACT_UI.primary }} />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Email
              </p>
              <p
                className="text-sm sm:text-base font-black truncate"
                style={{ color: CONTACT_UI.text }}
              >
                {CONTACT_INFO.email}
              </p>
            </div>
          </a>
          <a
            href={CONTACT_INFO.lineUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-4 bg-white border border-slate-200 rounded-xl hover:border-[#005caf] hover:shadow-sm transition"
          >
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
              style={{ backgroundColor: `${CONTACT_UI.primary}1a` }}
            >
              <MessageCircle size={22} style={{ color: CONTACT_UI.primary }} />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                LINE
              </p>
              <p
                className="text-sm sm:text-base font-black"
                style={{ color: CONTACT_UI.text }}
              >
                {CONTACT_INFO.lineLabel}
              </p>
            </div>
          </a>
        </div>

        <div className="flex flex-col sm:flex-row border-b-2 border-slate-200 mb-0 w-full min-w-0">
          {CONTACT_TABS.map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onTabChange(tab.id)}
                className={`flex-1 min-w-[140px] text-left sm:text-center px-4 py-4 border-b-2 -mb-[2px] transition ${
                  active
                    ? "border-[#005caf] text-[#005caf]"
                    : "border-transparent text-slate-400 hover:text-slate-600"
                }`}
              >
                <span className="text-[10px] font-bold tracking-wider block mb-0.5 opacity-70">
                  {tab.step}
                </span>
                <span
                  className={`text-sm ${active ? "font-black" : "font-medium"}`}
                >
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>

        <div
          className="border border-slate-200 border-t-0 rounded-b-sm shadow-sm overflow-hidden w-full min-w-0 max-w-full"
          style={{ backgroundColor: CONTACT_UI.formBg }}
        >
          <div className="px-4 sm:px-6 py-5 border-b border-slate-200 bg-white/60">
            <p className="text-sm text-slate-600 leading-relaxed">
              {TAB_HINTS[activeTab]}
            </p>
          </div>
          {children}
        </div>

        <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            {
              icon: Mail,
              label: "客服信箱",
              val: CONTACT_INFO.email,
              href: `mailto:${CONTACT_INFO.email}`,
            },
            {
              icon: Mail,
              label: "服務信箱",
              val: CONTACT_INFO.serviceEmail,
              href: `mailto:${CONTACT_INFO.serviceEmail}`,
            },
            {
              icon: MessageCircle,
              label: "LINE",
              val: "線上即時諮詢",
              href: CONTACT_INFO.lineUrl,
            },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <a
                key={item.label}
                href={item.href}
                target={item.href.startsWith("http") ? "_blank" : undefined}
                rel={
                  item.href.startsWith("http")
                    ? "noopener noreferrer"
                    : undefined
                }
                className="flex items-center gap-3 p-4 bg-white border border-slate-200 rounded-sm hover:border-[#005caf] hover:shadow-sm transition"
              >
                <div
                  className="w-10 h-10 rounded-sm flex items-center justify-center shrink-0"
                  style={{ backgroundColor: `${CONTACT_UI.primary}1a` }}
                >
                  <Icon size={20} style={{ color: CONTACT_UI.primary }} />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-bold text-slate-400 uppercase">
                    {item.label}
                  </p>
                  <p
                    className="text-sm font-bold truncate"
                    style={{ color: CONTACT_UI.text }}
                  >
                    {item.val}
                  </p>
                </div>
              </a>
            );
          })}
        </div>

        <p className="text-center text-[11px] text-slate-400 mt-8">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 hover:text-[#005caf]"
          >
            <ArrowLeft size={14} />
            返回 PikFun 首頁
          </Link>
        </p>
      </div>
    </div>
  );
}
