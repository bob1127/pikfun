import { useState, useEffect } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { getSiteUrl, DEFAULT_CONTACT_EMAIL } from "@/lib/siteUrl";
import ContactPageShell from "@/components/contact/ContactPageShell";
import GeneralInquiryTab from "@/components/contact/GeneralInquiryTab";
import ConsignmentTab from "@/components/contact/ConsignmentTab";
import MarketingPartnerTab from "@/components/contact/MarketingPartnerTab";

const TAB_MAP = {
  general: GeneralInquiryTab,
  consignment: ConsignmentTab,
  marketing: MarketingPartnerTab,
};

const VALID_TABS = Object.keys(TAB_MAP);

export default function ContactPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("general");
  const siteUrl = getSiteUrl();

  const title = "聯絡我們｜PikFun 寄賣合作・球場教練行銷";
  const description =
    "一般諮詢、球拍／運動用品寄賣與銷售合作、球場主與教練行銷／網站建置洽詢。PikFun 將於 1～3 個工作天內回覆。";

  useEffect(() => {
    const q = router.query.tab;
    if (typeof q === "string" && VALID_TABS.includes(q)) {
      setActiveTab(q);
    }
  }, [router.query.tab]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    router.replace(
      {
        pathname: "/contact",
        query: tab === "general" ? {} : { tab },
      },
      undefined,
      { shallow: true },
    );
  };

  const TabContent = TAB_MAP[activeTab] || GeneralInquiryTab;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    name: "聯絡我們｜PikFun",
    description,
    url: `${siteUrl}/contact`,
    mainEntity: {
      "@type": "Organization",
      name: "PikFun 匹克方",
      url: siteUrl,
      email: DEFAULT_CONTACT_EMAIL,
      contactPoint: [
        {
          "@type": "ContactPoint",
          contactType: "customer service",
          email: DEFAULT_CONTACT_EMAIL,
          areaServed: "TW",
          availableLanguage: ["Chinese"],
        },
      ],
    },
  };

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:url" content={`${siteUrl}/contact`} />
        <meta property="og:type" content="website" />
        <link rel="canonical" href={`${siteUrl}/contact`} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </Head>

      <ContactPageShell activeTab={activeTab} onTabChange={handleTabChange}>
        <TabContent />
      </ContactPageShell>
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
