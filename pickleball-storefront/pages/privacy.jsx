import React from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { ShieldCheck, Mail, Cookie } from "lucide-react";
import { DEFAULT_CONTACT_EMAIL } from "@/lib/siteUrl";

const LAST_UPDATED = { "zh-TW": "2026 年 7 月 21 日", en: "July 21, 2026" };

const TEXT = {
  "zh-TW": {
    seoTitle: "隱私權政策｜PikFun 匹克方",
    seoDesc:
      "了解 PikFun 匹克方如何收集、使用與保護您的個人資料，包括會員帳號、社群投稿、揪團與教練媒合、商城購物及 Cookie 的使用方式。",
    badge: "PRIVACY POLICY",
    title: "隱私權政策",
    intro:
      "PikFun 匹克方（以下簡稱「本平台」）由藍鏈數位企業社經營，我們重視每一位球友的隱私。本政策說明當您使用本平台的社群、揪團、教練媒合與商城服務時，我們如何收集、使用、分享及保護您的個人資料。",
    lastUpdated: "最後更新日期：",
    tocTitle: "目錄",
    contactTitle: "聯絡我們",
    contactDesc:
      "若您對本政策或個人資料的處理有任何疑問，或希望行使您的權利，歡迎與我們聯繫：",
    companyLabel: "經營者",
    companyName: "藍鏈數位企業社（統一編號 60982396）",
    emailLabel: "Email",
    cookieBtn: "開啟 Cookie 設定",
    sections: [
      {
        id: "scope",
        title: "1. 適用範圍",
        paragraphs: [
          "本政策適用於您透過 PikFun 網站（含手機版）使用之所有服務，包括會員註冊與登入、社群文章投稿與留言、揪團打球、教練開課與課程報名、球場資訊查詢，以及線上商城購物。",
          "本平台可能包含連往第三方網站的連結（如 Instagram、Facebook、LINE 或合作品牌網站），該等網站的隱私保護作法請參閱各網站自身的隱私權政策，不在本政策適用範圍內。",
        ],
      },
      {
        id: "collect",
        title: "2. 我們收集的資料",
        paragraphs: ["依您使用的功能不同，我們可能收集以下資料："],
        list: [
          "帳號資料：姓名或暱稱、電子郵件、密碼（加密儲存）、大頭貼；若使用 Google 等第三方登入，將取得該服務提供的基本公開資料。",
          "社群內容：您發布的投稿文章、留言、按讚紀錄，以及您主動附上的 Instagram 貼文連結等社群資訊。",
          "揪團與課程資料：報名揪團或課程時填寫的聯絡方式、程度分級與備註；申請成為教練、主揪或合作夥伴時提交的個人簡介、經歷與社群連結。",
          "交易資料：商城訂單內容、收件人姓名、電話、配送地址與付款方式。信用卡資訊由金流服務商直接處理，本平台不儲存完整卡號。",
          "技術資料：IP 位址、瀏覽器與裝置資訊、瀏覽紀錄，以及 Cookie 或類似技術所產生的識別資料。",
        ],
      },
      {
        id: "purpose",
        title: "3. 資料使用目的",
        paragraphs: ["我們基於以下目的使用您的資料："],
        list: [
          "提供並維運會員、社群、揪團、教練媒合與商城等核心服務。",
          "處理訂單、金流、配送及退換貨事宜。",
          "審核教練、主揪與合作夥伴申請，並於平台上展示您同意公開的資訊。",
          "回覆您的詢問並提供客戶服務。",
          "在您同意的範圍內，寄送活動通知、優惠訊息或電子報（可隨時取消訂閱）。",
          "分析網站使用情況以改善功能與內容，並防範濫用、詐欺與安全風險。",
        ],
      },
      {
        id: "sharing",
        title: "4. 資料分享與第三方服務",
        paragraphs: [
          "我們不會販售您的個人資料。僅在提供服務所必要的範圍內，與下列類型的第三方分享部分資料，且該等服務商均負有保密義務：",
        ],
        list: [
          "雲端與資料庫服務：本平台使用 Supabase 等雲端服務儲存會員與社群資料。",
          "金流服務商：處理信用卡或其他線上付款。",
          "物流業者：為配送商品提供收件人姓名、電話與地址。",
          "第三方登入服務：如 Google，僅於您選擇使用該登入方式時。",
          "法律要求：於法令規定或司法、主管機關依法要求時，提供必要資料。",
        ],
      },
      {
        id: "public",
        title: "5. 公開顯示的內容",
        paragraphs: [
          "您在社群發布的投稿、留言，以及經審核通過的教練、主揪個人頁面（含您提供的簡介、照片與社群連結），將公開顯示於本平台，任何造訪者皆可瀏覽。發布前請確認內容不含您不願公開的個人資訊。",
          "若您希望下架或修改已公開的內容，可透過會員中心自行編輯，或聯絡我們協助處理。",
        ],
      },
      {
        id: "cookies",
        title: "6. Cookie 與類似技術",
        paragraphs: [
          "本平台使用必要 Cookie 維持登入狀態、購物車與網站安全；分析與行銷 Cookie 僅在取得您的同意後才會使用。您可以隨時透過頁尾或本頁的「Cookie 設定」調整偏好，也可以透過瀏覽器設定拒絕 Cookie，惟部分功能（如維持登入）可能因此無法正常運作。",
        ],
      },
      {
        id: "security",
        title: "7. 資料安全與保存期間",
        paragraphs: [
          "本平台全站採用 HTTPS 加密傳輸，密碼以雜湊方式儲存，並對資料庫存取設有權限控管。儘管我們採取合理的安全措施，網際網路傳輸仍無法保證絕對安全，請妥善保管您的帳號密碼。",
          "您的資料將於達成收集目的所需期間內保存；帳號刪除後，除法令要求保存的交易紀錄外，我們將於合理期間內刪除或去識別化您的個人資料。",
        ],
      },
      {
        id: "rights",
        title: "8. 您的權利",
        paragraphs: [
          "依據個人資料保護法，您可以就您的個人資料行使以下權利：查詢或請求閱覽、請求製給複製本、請求補充或更正、請求停止收集處理或利用，以及請求刪除。您可透過會員中心管理多數資料，或以下方聯絡方式向我們提出請求，我們將於合理期間內處理。",
        ],
      },
      {
        id: "minors",
        title: "9. 未成年人保護",
        paragraphs: [
          "若您未滿十八歲，請於法定代理人閱讀並同意本政策後，方可註冊會員及使用本平台服務。",
        ],
      },
      {
        id: "changes",
        title: "10. 政策修訂",
        paragraphs: [
          "我們可能因服務調整或法令變更修訂本政策，修訂後將公布於本頁面並更新「最後更新日期」。重大變更時，我們將以網站公告或電子郵件通知您。建議您定期查閱本頁面以了解最新內容。",
        ],
      },
    ],
  },
  en: {
    seoTitle: "Privacy Policy | PikFun",
    seoDesc:
      "Learn how PikFun collects, uses, and protects your personal data across membership, community posts, open play, coaching, shop orders, and cookies.",
    badge: "PRIVACY POLICY",
    title: "Privacy Policy",
    intro:
      "PikFun (the “Platform”), operated by Blue Chain Digital Enterprise, values the privacy of every player. This policy explains how we collect, use, share, and protect your personal data when you use our community, open play, coaching, and shop services.",
    lastUpdated: "Last updated: ",
    tocTitle: "Contents",
    contactTitle: "Contact Us",
    contactDesc:
      "If you have any questions about this policy or how your data is handled, or wish to exercise your rights, please contact us:",
    companyLabel: "Operator",
    companyName: "Blue Chain Digital Enterprise (Tax ID 60982396)",
    emailLabel: "Email",
    cookieBtn: "Open Cookie Settings",
    sections: [
      {
        id: "scope",
        title: "1. Scope",
        paragraphs: [
          "This policy applies to all services you use on the PikFun website (including mobile), such as member registration and sign-in, community posts and comments, open play sessions, coaching and course enrollment, court information, and the online shop.",
          "The Platform may contain links to third-party sites (e.g., Instagram, Facebook, LINE, or partner brands). Their privacy practices are governed by their own policies and are outside the scope of this one.",
        ],
      },
      {
        id: "collect",
        title: "2. Data We Collect",
        paragraphs: [
          "Depending on the features you use, we may collect the following:",
        ],
        list: [
          "Account data: name or nickname, email, password (stored encrypted), avatar; if you sign in via Google or other third parties, we receive the basic public profile they provide.",
          "Community content: posts, comments, likes, and any social links you attach, such as Instagram post URLs.",
          "Open play and course data: contact details, skill level, and notes you submit when joining sessions or courses; profiles, experience, and social links submitted when applying as a coach, host, or partner.",
          "Transaction data: shop orders, recipient name, phone, shipping address, and payment method. Card details are processed directly by our payment provider; we do not store full card numbers.",
          "Technical data: IP address, browser and device information, browsing activity, and identifiers generated by cookies or similar technologies.",
        ],
      },
      {
        id: "purpose",
        title: "3. How We Use Your Data",
        paragraphs: ["We use your data to:"],
        list: [
          "Provide and operate our core services: membership, community, open play, coaching, and the shop.",
          "Process orders, payments, shipping, and returns.",
          "Review coach, host, and partner applications, and display the information you agree to make public.",
          "Respond to inquiries and provide customer support.",
          "Send event updates, offers, or newsletters with your consent (you may unsubscribe anytime).",
          "Analyze usage to improve features and content, and prevent abuse, fraud, and security risks.",
        ],
      },
      {
        id: "sharing",
        title: "4. Sharing & Third-Party Services",
        paragraphs: [
          "We never sell your personal data. We share limited data only as necessary to provide our services, with providers bound by confidentiality obligations:",
        ],
        list: [
          "Cloud and database services: we use services such as Supabase to store member and community data.",
          "Payment providers: to process credit card and other online payments.",
          "Logistics partners: recipient name, phone, and address for product delivery.",
          "Third-party sign-in services, such as Google, only when you choose to use them.",
          "Legal requirements: where disclosure is required by law or by judicial or regulatory authorities.",
        ],
      },
      {
        id: "public",
        title: "5. Publicly Visible Content",
        paragraphs: [
          "Posts and comments you publish, and approved coach or host profile pages (including the bio, photos, and social links you provide), are publicly visible to all visitors. Please make sure your content does not include personal information you do not wish to share.",
          "To edit or remove published content, use your member dashboard or contact us for assistance.",
        ],
      },
      {
        id: "cookies",
        title: "6. Cookies & Similar Technologies",
        paragraphs: [
          "We use necessary cookies for sign-in, cart functionality, and security. Analytics and marketing cookies are used only with your consent. You can adjust your preferences anytime via “Cookie Settings” in the footer or on this page, or block cookies in your browser — though some features (such as staying signed in) may stop working.",
        ],
      },
      {
        id: "security",
        title: "7. Security & Retention",
        paragraphs: [
          "The entire site is served over HTTPS, passwords are stored hashed, and database access is permission-controlled. While we take reasonable measures, no internet transmission is completely secure, so please keep your credentials safe.",
          "We retain data only as long as needed for the purposes described. After account deletion, we delete or anonymize your personal data within a reasonable period, except for transaction records we must keep by law.",
        ],
      },
      {
        id: "rights",
        title: "8. Your Rights",
        paragraphs: [
          "Under Taiwan's Personal Data Protection Act, you may request access to, copies of, correction of, or deletion of your personal data, and may ask us to stop collecting, processing, or using it. You can manage most data in your member dashboard, or contact us below and we will respond within a reasonable time.",
        ],
      },
      {
        id: "minors",
        title: "9. Minors",
        paragraphs: [
          "If you are under 18, please register and use the Platform only after your legal guardian has read and agreed to this policy.",
        ],
      },
      {
        id: "changes",
        title: "10. Changes to This Policy",
        paragraphs: [
          "We may update this policy to reflect service or legal changes. Updates will be posted on this page with a revised “Last updated” date, and we will notify you of material changes via site announcement or email. Please review this page periodically.",
        ],
      },
    ],
  },
};

export default function PrivacyPolicy() {
  const router = useRouter();
  const locale = router.locale === "en" ? "en" : "zh-TW";
  const T = TEXT[locale];

  return (
    <>
      <Head>
        <title>{T.seoTitle}</title>
        <meta name="description" content={T.seoDesc} />
      </Head>

      <div className="bg-white text-gray-900">
        {/* Hero */}
        <div className="border-b border-gray-200 bg-[#f5f8fb]">
          <div className="mx-auto max-w-[1100px] px-5 pb-14 pt-32 md:px-8 md:pt-40">
            <div className="mb-4 flex items-center gap-2 text-[#005caf]">
              <ShieldCheck size={18} />
              <span className="text-[11px] font-black tracking-[0.25em]">
                {T.badge}
              </span>
            </div>
            <h1 className="mb-4 text-3xl font-black tracking-wide md:text-4xl">
              {T.title}
            </h1>
            <p className="max-w-3xl text-sm leading-7 text-gray-600">
              {T.intro}
            </p>
            <p className="mt-4 text-xs text-gray-400">
              {T.lastUpdated}
              {LAST_UPDATED[locale]}
            </p>
          </div>
        </div>

        <div className="mx-auto max-w-[1100px] px-5 py-12 md:px-8 md:py-16">
          <div className="flex flex-col gap-12 lg:flex-row">
            {/* 目錄（桌機側欄） */}
            <aside className="hidden w-[240px] shrink-0 lg:block">
              <div className="sticky top-28">
                <p className="mb-4 text-[11px] font-black tracking-[0.2em] text-gray-400">
                  {T.tocTitle}
                </p>
                <ul className="space-y-2.5 border-l border-gray-200">
                  {T.sections.map((section) => (
                    <li key={section.id}>
                      <a
                        href={`#${section.id}`}
                        className="-ml-px block border-l-2 border-transparent pl-4 text-xs leading-5 text-gray-500 transition-colors hover:border-[#005caf] hover:text-[#005caf]"
                      >
                        {section.title}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </aside>

            {/* 內文 */}
            <div className="min-w-0 flex-1">
              <div className="space-y-12">
                {T.sections.map((section) => (
                  <section key={section.id} id={section.id} className="scroll-mt-28">
                    <h2 className="mb-4 border-l-4 border-[#005caf] pl-3 text-lg font-black tracking-wide">
                      {section.title}
                    </h2>
                    <div className="space-y-3 text-sm leading-7 text-gray-700">
                      {section.paragraphs.map((paragraph, index) => (
                        <p key={index}>{paragraph}</p>
                      ))}
                      {section.list && (
                        <ul className="space-y-2 pt-1">
                          {section.list.map((item, index) => (
                            <li key={index} className="flex gap-2.5">
                              <span className="mt-[11px] h-1.5 w-1.5 shrink-0 rotate-45 bg-[#005caf]" />
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                      {section.id === "cookies" && (
                        <button
                          type="button"
                          onClick={() =>
                            window.dispatchEvent(
                              new CustomEvent("pikfun:open-cookie-settings"),
                            )
                          }
                          className="mt-2 inline-flex min-h-10 items-center gap-2 border border-[#005caf] px-4 text-xs font-bold text-[#005caf] transition-colors hover:bg-[#f3f7fc]"
                        >
                          <Cookie size={14} />
                          {T.cookieBtn}
                        </button>
                      )}
                    </div>
                  </section>
                ))}

                {/* 聯絡資訊 */}
                <section className="border border-gray-200 bg-[#f5f8fb] p-6 md:p-8">
                  <h2 className="mb-3 text-lg font-black tracking-wide">
                    {T.contactTitle}
                  </h2>
                  <p className="mb-5 text-sm leading-7 text-gray-600">
                    {T.contactDesc}
                  </p>
                  <div className="space-y-2 text-sm text-gray-800">
                    <p>
                      <strong className="mr-2">{T.companyLabel}</strong>
                      {T.companyName}
                    </p>
                    <p className="flex items-center gap-2">
                      <strong>{T.emailLabel}</strong>
                      <Mail size={14} className="text-[#005caf]" />
                      <a
                        href={`mailto:${DEFAULT_CONTACT_EMAIL}`}
                        className="font-bold text-[#005caf] underline underline-offset-2"
                      >
                        {DEFAULT_CONTACT_EMAIL}
                      </a>
                    </p>
                  </div>
                  <div className="mt-6 border-t border-gray-200 pt-5 text-xs text-gray-500">
                    <Link
                      href="/contact"
                      className="font-bold text-[#005caf] hover:underline"
                    >
                      {locale === "en" ? "Contact form →" : "前往聯絡表單 →"}
                    </Link>
                  </div>
                </section>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export async function getStaticProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale || "zh-TW", ["common"])),
    },
  };
}
