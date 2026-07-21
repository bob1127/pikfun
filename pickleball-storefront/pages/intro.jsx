import Head from "next/head";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { getSiteUrl } from "@/lib/siteUrl";
import { useEffect, useRef, useState } from "react";

const COOPERATION_OPTIONS = [
  {
    key: "行銷",
    image: "/images/intro/d631d850-a0cd-44fb-b148-4efe771c2544.png",
    alt: "PikFun 匹克球社群行銷合作",
    badge: "品牌曝光",
    title: "匹克球精準行銷",
    description:
      "透過 PikFun 的球友社群、內容專區與活動曝光，讓品牌、球館、教練及賽事資訊接觸真正對匹克球有興趣的受眾。",
    cta: "洽談行銷合作 →",
  },
  {
    key: "SEO",
    image: "/images/pik04.jpg",
    alt: "匹克球品牌 SEO 搜尋曝光",
    badge: "搜尋曝光",
    title: "SEO 內容與在地搜尋佈局",
    description:
      "規劃關鍵字、場館頁面與專題文章，強化 Google 搜尋及 AI 搜尋能見度，持續累積品牌的自然流量與可信度。",
    cta: "了解 SEO 合作 →",
  },
  {
    key: "一頁式功能頁",
    image: "/images/pik06.jpg",
    alt: "匹克球活動一頁式功能頁",
    badge: "快速上線",
    title: "一頁式活動功能頁",
    description:
      "為課程、賽事、球館或新品打造專屬頁面，整合品牌介紹、活動資訊、表單、導流與行動按鈕，讓使用者一次完成了解與轉換。",
    cta: "規劃一頁式頁面 →",
  },
  {
    key: "分潤合作",
    image: "/images/夥伴召集中.png",
    alt: "PikFun 匹克球品牌分潤合作",
    badge: "共同成長",
    title: "品牌與商品分潤合作",
    description:
      "串聯匹克球裝備、課程、場館與活動資源，以內容導購、專屬優惠或合作方案創造可追蹤的轉換與長期收益。",
    cta: "提出分潤合作 →",
  },
];

const HERO_TILES = [
  {
    src: "/images/intro/d631d850-a0cd-44fb-b148-4efe771c2544.png",
    title: "揪團打球",
    body: "找到程度相近的球友，週末臨打與固定團都能輕鬆加入。",
  },
  {
    src: "/images/pik05.jpg",
    title: "教練開課",
    body: "從入門到進階，一對一與團體課程，幫你更快上手。",
  },
  {
    src: "/images/pik06.jpg",
    title: "球場曝光",
    body: "球場主進駐平台，讓更多球友看見你的場地與時段。",
  },
  {
    src: "/images/pik07.jpg",
    title: "活動宣傳",
    body: "賽事、體驗課與社群活動，一次觸及對的受眾。",
  },
];

const CAMPAIGN_SLIDES = [
  {
    src: "/images/intro/campaign-left.png",
    alt: "匹克球活動宣傳",
    label: "免費匹克球相關活動投稿",
    title: "匹克球活動宣傳 ！",
    desc: "只要您投稿相關匹克球相關資訊，讓我們幫您宣傳！",
    cta: "立即投稿",
    href: "#campaign",
  },
  {
    src: "/images/intro/register-scene.png",
    alt: "PikFun 球場與社群",
    label: "球場主・教練・業者",
    title: "讓 PikFun 幫你曝光",
    desc: "活動、課程與揪團資訊一次集中，找到對的球友與合作夥伴。",
    cta: "了解更多",
    href: "#signup",
  },
];

const TUTORIAL_CARDS = [
  {
    step: "STEP 01",
    src: "/images/intro/d631d850-a0cd-44fb-b148-4efe771c2544.png",
    alt: "登入 PikFun 並建立匹克球揪團",
    title: "登入並建立揪團",
    summary: "登入會員後，從揪團頁面開始建立新的匹克球場次。",
    steps: [
      "登入 PikFun 會員帳號；尚未加入的球友可先免費註冊。",
      "進入「揪團打球」頁面，點擊「我要開團」。",
      "確認開團人資料與聯絡方式，接著進入活動設定。",
    ],
    tip: "若尚未登入，系統會先引導至登入頁，完成後即可回到開團流程。",
  },
  {
    step: "STEP 02",
    src: "/images/pik04.jpg",
    alt: "填寫匹克球揪團與球場資訊",
    title: "填寫活動與球場資訊",
    summary: "設定日期、程度、名額及球場，讓球友快速判斷是否適合參加。",
    steps: [
      "輸入揪團標題、活動日期、開始與結束時間。",
      "選擇程度、活動類型、人數上限及每人費用。",
      "使用球場搜尋選取正確場地，並補充集合方式與注意事項。",
    ],
    tip: "請從搜尋結果選擇球場，不要只輸入文字地址，地圖與活動才會正確連結。",
  },
  {
    step: "STEP 03",
    src: "/images/pik06.jpg",
    alt: "發布匹克球揪團並管理報名",
    title: "確認發布與管理報名",
    summary: "送出前再次確認資料，發布後即可分享並管理參加名單。",
    steps: [
      "檢查時間、地點、費用及名額，確認無誤後發布。",
      "複製活動連結，分享到 LINE、Facebook 或球友群組。",
      "至會員中心查看報名名單；如有變動，請及早更新或通知球友。",
    ],
    tip: "活動額滿後系統會顯示名額狀態；若取消活動，務必同步通知已報名球友。",
  },
];

const DARK_FEATURES = [
  {
    title: "はやい決済と入金",
    body: (
      <>
        クレジットカードや
        <a href="#qr">QRコード決済</a>
        など、主要な支払い方法に対応。売上は
        <a href="#payout">最短翌営業日入金</a>
        で、キャッシュフローをスムーズに。
      </>
    ),
  },
  {
    title: "どこでも、これ1台で",
    body: (
      <>
        長時間バッテリーと内蔵プリンター搭載。
        <a href="#anywhere">どこでも</a>
        持ち運んで注文受付からレシート発行まで完結できます。
      </>
    ),
  },
  {
    title: "無料POSレジ",
    body: (
      <>
        在庫・顧客管理などの
        <a href="#pos">POS機能</a>
        が無料。
        <a href="#signup">アカウントの登録</a>
        だけで、すぐに使い始められます。
      </>
    ),
  },
];

const STORE_PRODUCTS = [
  {
    src: "/images/intro/hw1.png",
    title: "Square レジスター (第2世代)",
    desc: "2つのタッチスクリーンとカードリーダー内蔵の一体型POSレジ",
    price: "¥99,980",
    installment: "または ¥4,166 /月の24回払い¹",
  },
  {
    src: "/images/intro/hw2.png",
    title: "Square ハンディ",
    desc: "決済・注文受付、バーコードスキャナーまで対応したポケットPOSレジ",
    price: "¥44,980",
    installment: "または ¥3,749 /月の12回払い¹",
  },
  {
    src: "/images/intro/hw3.png",
    title: "Square ターミナル",
    desc: "決済受付からレシート印刷まで対応のオールインワン端末",
    price: "¥39,980",
    installment: "または ¥3,332 /月の12回払い¹",
  },
  {
    src: "/images/intro/hw4.png",
    title: "Square スタンド",
    desc: "iPadが高機能POSレジに。直感操作で会計がスムーズに",
    price: "¥29,980",
    installment: "または ¥2,499 /月の12回払い¹",
  },
  {
    src: "/images/intro/hw5.png",
    title: "Square リーダー",
    desc: "ICカードやApple Pay対応のシンプルな決済端末",
    price: "¥4,980",
    installment: "または ¥415 /月の12回払い¹",
  },
];

/* 合作 Partner：第一張為正式夥伴，其餘為招募佔位卡 */
const PARTNER_ITEMS = [
  {
    key: "taichung-pickleball",
    name: "台中匹克領域",
    logo: "/images/cooperation/132774c0-28a9-431d-b407-13c3b8e280c2.png",
    line1: "PikFun 合作球場夥伴",
    line2: "台中市・室內匹克球場",
  },
  ...Array.from({ length: 7 }, (_, i) => ({
    key: `open-slot-${i + 1}`,
    placeholder: true,
    name: "等你來加入",
    line1: "成為 PikFun 合作夥伴",
  })),
];

function scrollByCard(scroller, dir) {
  if (!scroller) return;
  const card = scroller.querySelector("[data-card]");
  const step = card
    ? card.getBoundingClientRect().width + 24
    : scroller.clientWidth * 0.8;
  scroller.scrollBy({ left: dir * step, behavior: "smooth" });
}

function IntroContent() {
  const [cooperationKey, setCooperationKey] = useState(
    COOPERATION_OPTIONS[0].key,
  );
  const cooperation =
    COOPERATION_OPTIONS.find((item) => item.key === cooperationKey) ||
    COOPERATION_OPTIONS[0];
  const [activeTutorial, setActiveTutorial] = useState(null);
  const [campaignIndex, setCampaignIndex] = useState(0);
  const campaign = CAMPAIGN_SLIDES[campaignIndex];

  const nextCampaign = () => {
    setCampaignIndex((i) => (i + 1) % CAMPAIGN_SLIDES.length);
  };

  const storeRef = useRef(null);
  const [storePrevOff, setStorePrevOff] = useState(true);
  const [storeNextOff, setStoreNextOff] = useState(false);
  const partnerRef = useRef(null);
  const partnerDragRef = useRef({
    active: false,
    startX: 0,
    startScrollLeft: 0,
  });
  const [partnerDragging, setPartnerDragging] = useState(false);

  const updateStoreNav = () => {
    const el = storeRef.current;
    if (!el) return;
    setStorePrevOff(el.scrollLeft <= 4);
    setStoreNextOff(el.scrollLeft + el.clientWidth >= el.scrollWidth - 4);
  };

  useEffect(() => {
    const el = storeRef.current;
    if (!el) return;
    updateStoreNav();
    el.addEventListener("scroll", updateStoreNav, { passive: true });
    window.addEventListener("resize", updateStoreNav);
    return () => {
      el.removeEventListener("scroll", updateStoreNav);
      window.removeEventListener("resize", updateStoreNav);
    };
  }, []);

  useEffect(() => {
    const el = partnerRef.current;
    if (!el) return undefined;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return undefined;
    }

    let animationFrame;
    let previousTime = performance.now();

    const animate = (time) => {
      const elapsed = Math.min(time - previousTime, 50);
      previousTime = time;

      if (!partnerDragRef.current.active) {
        el.scrollLeft += elapsed * 0.035;
        const loopWidth = el.scrollWidth / 2;
        if (loopWidth > 0 && el.scrollLeft >= loopWidth) {
          el.scrollLeft -= loopWidth;
        }
      }

      animationFrame = requestAnimationFrame(animate);
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, []);

  const startPartnerDrag = (event) => {
    const el = partnerRef.current;
    if (!el) return;
    partnerDragRef.current = {
      active: true,
      startX: event.clientX,
      startScrollLeft: el.scrollLeft,
    };
    setPartnerDragging(true);
    el.setPointerCapture?.(event.pointerId);
  };

  const movePartnerDrag = (event) => {
    const el = partnerRef.current;
    const drag = partnerDragRef.current;
    if (!el || !drag.active) return;

    event.preventDefault();
    const loopWidth = el.scrollWidth / 2;
    let nextScroll = drag.startScrollLeft - (event.clientX - drag.startX);

    if (loopWidth > 0) {
      nextScroll = ((nextScroll % loopWidth) + loopWidth) % loopWidth;
    }
    el.scrollLeft = nextScroll;
  };

  const endPartnerDrag = (event) => {
    if (!partnerDragRef.current.active) return;
    partnerDragRef.current.active = false;
    setPartnerDragging(false);
    const el = partnerRef.current;
    if (el?.hasPointerCapture?.(event.pointerId)) {
      el.releasePointerCapture(event.pointerId);
    }
  };

  useEffect(() => {
    if (!activeTutorial) return undefined;

    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event) => {
      if (event.key === "Escape") setActiveTutorial(null);
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", closeOnEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [activeTutorial]);

  return (
    <main className="sq-page">
      {/* ── Section 1: Hero ── */}
      <section className="sq-hero">
        <div className="sq-hero-copy">
          <h1 className="sq-headline">讓PIKFUN成為您的，夥伴。</h1>
          <p className="sq-sub">
            提供揪團、臨打、開課、活動最新資訊｜球場主、相關業者、教練進駐，
            <sup>*</sup>
            匹克方可以成為您強而有力的行銷夥伴
          </p>

          <div className="sq-cta-row">
            <div className="sq-cta-item">
              <span className="sq-bubble">教練/揪團/課程/球場主</span>
              <a href="#signup" className="sq-btn sq-btn--primary">
                免費召集中！
              </a>
            </div>
            <div className="sq-cta-item">
              <span className="sq-bubble">行銷/宣傳/seo/分潤</span>
              <a href="#contact" className="sq-btn sq-btn--outline">
                合作吧！
              </a>
            </div>
          </div>
        </div>

        <div className="sq-media" aria-label="PikFun 服務亮點">
          {HERO_TILES.map((tile) => (
            <article key={tile.title} className="sq-tile">
              <img src={tile.src} alt="" className="sq-tile-img" />
              <div className="sq-tile-overlay">
                <h3 className="sq-tile-title">{tile.title}</h3>
                <p className="sq-tile-body">{tile.body}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* ── Section 2: Campaign banner ── */}
      <section className="sq-campaign-sec" aria-labelledby="sq-campaign-title">
        <div className="sq-campaign">
          <div className="sq-campaign-visual">
            <img
              src={CAMPAIGN_SLIDES[0].src}
              alt={CAMPAIGN_SLIDES[0].alt}
              className="sq-campaign-img"
            />
          </div>
          <div className="sq-campaign-copy">
            <div key={campaignIndex} className="sq-campaign-copy-body">
              <p className="sq-campaign-label">{campaign.label}</p>
              <h2 id="sq-campaign-title" className="sq-campaign-heading">
                {campaign.title}
              </h2>
              <p className="sq-campaign-desc">{campaign.desc}</p>
              <a href={campaign.href} className="sq-campaign-btn">
                {campaign.cta}
                <span aria-hidden>›</span>
              </a>
            </div>
            <button
              type="button"
              className="sq-campaign-next"
              onClick={nextCampaign}
              aria-label="下一則宣傳"
            >
              ›
            </button>
          </div>
        </div>
      </section>

      {/* ── Section 3: Product showcase ── */}
      <section className="sq-product-sec" aria-labelledby="sq-product-title">
        <div className="sq-product">
          <div className="sq-product-main" key={cooperation.key}>
            <div className="sq-product-media">
              <img src={cooperation.image} alt={cooperation.alt} />
            </div>
            <div className="sq-product-copy">
              <span className="sq-product-badge">{cooperation.badge}</span>
              <h2 id="sq-product-title" className="sq-product-heading">
                {cooperation.title}
              </h2>
              <p className="sq-product-desc">{cooperation.description}</p>
              <a href="#contact" className="sq-product-link">
                {cooperation.cta}
              </a>
            </div>
          </div>

          <div className="sq-filters">
            <span className="sq-filters-label">合作方式 →</span>
            <div
              className="sq-filters-pills"
              role="tablist"
              aria-label="合作方式"
            >
              {COOPERATION_OPTIONS.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  role="tab"
                  aria-selected={cooperationKey === item.key}
                  className={
                    cooperationKey === item.key
                      ? "sq-pill sq-pill--active"
                      : "sq-pill"
                  }
                  onClick={() => setCooperationKey(item.key)}
                >
                  {item.key}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Section 4: POS features (static wide grid, no carousel) ── */}
      <section className="sq-pos-sec" aria-labelledby="sq-pos-title">
        <div className="sq-pos-inner">
          <h2 id="sq-pos-title" className="sq-pos-heading">
            A . 揪團發布
            <br />
            發布最新揪團資訊，邀請共同歡樂打球。
          </h2>
          <button
            type="button"
            className="sq-pos-demo-link"
            onClick={() => setActiveTutorial(TUTORIAL_CARDS[0])}
          >
            操作步驟→
          </button>

          <div className="sq-pos-grid">
            {TUTORIAL_CARDS.map((tutorial) => (
              <button
                type="button"
                className="sq-pos-card"
                key={tutorial.step}
                onClick={() => setActiveTutorial(tutorial)}
                aria-label={`查看${tutorial.title}操作步驟`}
              >
                <div className="sq-pos-media">
                  <img src={tutorial.src} alt={tutorial.alt} />
                  <span className="sq-pos-step">{tutorial.step}</span>
                  <span className="sq-pos-open" aria-hidden>
                    ＋
                  </span>
                </div>
                <span className="sq-pos-caption">
                  <span className="sq-pos-caption-link">{tutorial.title}</span>
                  {tutorial.summary}
                </span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {activeTutorial && (
        <div
          className="sq-tutorial-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="sq-tutorial-title"
        >
          <button
            type="button"
            className="sq-tutorial-backdrop"
            aria-label="關閉操作教學"
            onClick={() => setActiveTutorial(null)}
          />
          <div className="sq-tutorial-dialog">
            <button
              type="button"
              className="sq-tutorial-close"
              aria-label="關閉"
              onClick={() => setActiveTutorial(null)}
            >
              ×
            </button>
            <div className="sq-tutorial-image">
              <img src={activeTutorial.src} alt={activeTutorial.alt} />
              <span>{activeTutorial.step}</span>
            </div>
            <div className="sq-tutorial-content">
              <p className="sq-tutorial-kicker">揪團發布操作教學</p>
              <h3 id="sq-tutorial-title">{activeTutorial.title}</h3>
              <p className="sq-tutorial-summary">{activeTutorial.summary}</p>
              <ol className="sq-tutorial-steps">
                {activeTutorial.steps.map((step, index) => (
                  <li key={step}>
                    <span>{String(index + 1).padStart(2, "0")}</span>
                    <p>{step}</p>
                  </li>
                ))}
              </ol>
              <p className="sq-tutorial-tip">
                <strong>提醒</strong>
                {activeTutorial.tip}
              </p>
              <a href="/play/create" className="sq-tutorial-cta">
                立即建立揪團 →
              </a>
            </div>
          </div>
        </div>
      )}

      {/* ── Section 5: Dark Terminal feature ── */}
      <section className="sq-dark-sec" aria-labelledby="sq-dark-title">
        <div className="sq-dark-inner">
          <div className="sq-dark-copy">
            <h2 id="sq-dark-title" className="sq-dark-heading">
              決済に必要なすべてがそろった
              <br />
              オールインワン Square ターミナル
            </h2>
            <ul className="sq-dark-features">
              {DARK_FEATURES.map((f) => (
                <li key={f.title} className="sq-dark-feature">
                  <h3 className="sq-dark-feature-title">{f.title}</h3>
                  <p className="sq-dark-feature-body">{f.body}</p>
                </li>
              ))}
            </ul>
          </div>

          <div className="sq-dark-visual">
            <div className="sq-dark-glow" aria-hidden />
            <img
              className="sq-dark-device"
              src="/images/intro/dark-terminal.jpg"
              alt="Square ターミナル"
            />
            <div className="sq-dark-badge">
              <span className="sq-dark-badge-label">最短翌営業日入金</span>
              <span className="sq-dark-badge-value">
                ¥424,300
                <span aria-hidden>↗</span>
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Section 6: Store hardware carousel ── */}
      <section className="sq-store-sec" aria-labelledby="sq-store-title">
        <div className="sq-store-inner">
          <h2 id="sq-store-title" className="sq-store-heading">
            Squareの店舗向け決済サービス
          </h2>

          <div className="sq-store-wrap">
            <button
              type="button"
              className="sq-store-nav sq-store-nav--prev"
              aria-label="前へ"
              disabled={storePrevOff}
              onClick={() => scrollByCard(storeRef.current, -1)}
            >
              ‹
            </button>
            <button
              type="button"
              className="sq-store-nav sq-store-nav--next"
              aria-label="次へ"
              disabled={storeNextOff}
              onClick={() => scrollByCard(storeRef.current, 1)}
            >
              ›
            </button>

            <div className="sq-store-viewport" ref={storeRef}>
              <div className="sq-store-track">
                {STORE_PRODUCTS.map((item) => (
                  <article className="sq-store-card" data-card key={item.title}>
                    <div className="sq-store-img">
                      <img src={item.src} alt={item.title} />
                    </div>
                    <h3 className="sq-store-name">{item.title}</h3>
                    <p className="sq-store-desc">{item.desc}</p>
                    <p className="sq-store-price">{item.price}</p>
                    <p className="sq-store-install">{item.installment}</p>
                    <div className="sq-store-actions">
                      <a href="#detail" className="sq-store-more">
                        さらに詳しく
                      </a>
                      <a href="#buy" className="sq-store-buy">
                        購入する →
                      </a>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Section 7: 合作 Partner ── */}
      <section className="sq-partner-sec" aria-labelledby="sq-partner-title">
        <header className="sq-partner-head">
          <h2 id="sq-partner-title" className="sq-partner-heading">
            PARTNER
          </h2>
          <p className="sq-partner-sub">與 PikFun 一起推廣匹克球的合作夥伴</p>
        </header>

        <div className="sq-partner-wrap">
          <div
            ref={partnerRef}
            className={`sq-partner-marquee${
              partnerDragging ? " is-dragging" : ""
            }`}
            onPointerDown={startPartnerDrag}
            onPointerMove={movePartnerDrag}
            onPointerUp={endPartnerDrag}
            onPointerCancel={endPartnerDrag}
          >
            <div className="sq-partner-track">
              {[0, 1].map((copy) => (
                <div
                  className="sq-partner-group"
                  key={copy}
                  aria-hidden={copy === 1 || undefined}
                >
                  {PARTNER_ITEMS.map((item) => (
                    <article
                      className={`sq-partner-card${
                        item.placeholder ? " sq-partner-card--open" : ""
                      }`}
                      key={`${copy}-${item.key}`}
                    >
                      <div className="sq-partner-logo">
                        {item.placeholder ? (
                          <span className="sq-partner-logo-open" aria-hidden>
                            ＋
                          </span>
                        ) : (
                          <img
                            src={item.logo}
                            alt={item.name}
                            loading="lazy"
                            draggable="false"
                          />
                        )}
                      </div>
                      <h3 className="sq-partner-name">{item.name}</h3>
                      <p className="sq-partner-meta">
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          aria-hidden
                        >
                          <path d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-4h6v4" />
                        </svg>
                        <span>{item.line1}</span>
                      </p>
                      {item.line2 && (
                        <p className="sq-partner-meta">
                          <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            aria-hidden
                          >
                            <path d="M12 21s-7-5.5-7-11a7 7 0 1 1 14 0c0 5.5-7 11-7 11z" />
                            <circle cx="12" cy="10" r="2.5" />
                          </svg>
                          <span>{item.line2}</span>
                        </p>
                      )}
                    </article>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="sq-partner-cta-row">
          <a href="/coaching" className="sq-partner-cta">
            合作教練一覽 <span aria-hidden>↗</span>
          </a>
        </div>
      </section>

      <style jsx>{`
        .sq-page {
          background: #ffffff;
          font-family:
            "Noto Sans JP", "Hiragino Sans", "Hiragino Kaku Gothic ProN",
            Meiryo, sans-serif;
          color: #000;
        }

        /* ── Hero ── */
        .sq-hero {
          background: #ffffff;
        }

        .sq-hero-copy {
          max-width: 880px;
          margin: 0 auto;
          padding: 80px 24px 56px;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .sq-headline {
          margin: 0;
          color: #000000;
          font-size: clamp(26px, 3.8vw, 40px);
          font-weight: 700;
          line-height: 1.5;
          letter-spacing: 0.02em;
          max-width: 16.5em;
        }

        .sq-sub {
          margin: 28px 0 0;
          max-width: 38em;
          color: #1a1a1a;
          font-size: clamp(14px, 1.45vw, 16px);
          font-weight: 400;
          line-height: 1.9;
          letter-spacing: 0.02em;
        }

        .sq-sub :global(sup) {
          font-size: 0.65em;
          vertical-align: super;
        }

        .sq-cta-row {
          margin-top: 44px;
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 18px 22px;
        }

        .sq-cta-item {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding-top: 18px;
        }

        .sq-bubble {
          position: absolute;
          top: 0;
          left: 50%;
          transform: translateX(-50%);
          white-space: nowrap;
          font-size: 12px;
          font-weight: 700;
          line-height: 1;
          padding: 6px 14px;
          border-radius: 999px;
          background: #ffffff;
          color: #006aff;
          border: 1.5px solid #006aff;
          z-index: 2;
        }

        .sq-bubble::after {
          content: "";
          position: absolute;
          left: 50%;
          bottom: -5px;
          transform: translateX(-50%);
          width: 0;
          height: 0;
          border-left: 5px solid transparent;
          border-right: 5px solid transparent;
          border-top: 5px solid #006aff;
        }

        .sq-bubble::before {
          content: "";
          position: absolute;
          left: 50%;
          bottom: -3.5px;
          transform: translateX(-50%);
          width: 0;
          height: 0;
          border-left: 4px solid transparent;
          border-right: 4px solid transparent;
          border-top: 4px solid #ffffff;
          z-index: 1;
        }

        .sq-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 220px;
          height: 52px;
          padding: 0 32px;
          border-radius: 4px;
          font-size: 15px;
          font-weight: 700;
          letter-spacing: 0.04em;
          text-decoration: none;
          transition: opacity 0.2s ease;
        }

        .sq-btn:hover {
          opacity: 0.88;
        }

        .sq-btn--primary {
          background: #006aff;
          color: #ffffff;
          border: 1.5px solid #006aff;
        }

        .sq-btn--outline {
          background: #ffffff;
          color: #006aff;
          border: 1.5px solid #006aff;
        }

        .sq-media {
          width: 100%;
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 0;
          background: #111;
        }

        .sq-tile {
          position: relative;
          width: 100%;
          aspect-ratio: 1 / 1;
          overflow: hidden;
          margin: 0;
          background: #1a1a1a;
        }

        .sq-tile-img {
          display: block;
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center;
          transition:
            transform 0.55s ease,
            filter 0.35s ease;
        }

        .sq-tile-overlay {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
          align-items: flex-start;
          padding: 22px 20px 24px;
          background: linear-gradient(
            to top,
            rgba(0, 0, 0, 0.72) 0%,
            rgba(0, 0, 0, 0.28) 48%,
            rgba(0, 0, 0, 0) 100%
          );
          opacity: 0;
          transition: opacity 0.35s ease;
          pointer-events: none;
        }

        .sq-tile-title {
          margin: 0;
          color: #fff;
          font-size: clamp(18px, 1.6vw, 24px);
          font-weight: 700;
          line-height: 1.3;
          letter-spacing: 0.02em;
          transform: translateY(10px);
          transition: transform 0.4s cubic-bezier(0.22, 1, 0.36, 1);
        }

        .sq-tile-body {
          margin: 8px 0 0;
          color: rgba(255, 255, 255, 0.88);
          font-size: clamp(12px, 1.05vw, 14px);
          line-height: 1.65;
          max-width: 18em;
          transform: translateY(12px);
          transition: transform 0.45s cubic-bezier(0.22, 1, 0.36, 1) 0.04s;
        }

        .sq-tile:hover .sq-tile-overlay,
        .sq-tile:focus-within .sq-tile-overlay {
          opacity: 1;
        }

        .sq-tile:hover .sq-tile-img,
        .sq-tile:focus-within .sq-tile-img {
          transform: scale(1.06);
          filter: brightness(0.92);
        }

        .sq-tile:hover .sq-tile-title,
        .sq-tile:hover .sq-tile-body,
        .sq-tile:focus-within .sq-tile-title,
        .sq-tile:focus-within .sq-tile-body {
          transform: translateY(0);
        }

        .sr-only {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          white-space: nowrap;
          border: 0;
        }

        @media (prefers-reduced-motion: reduce) {
          .sq-tile-img,
          .sq-tile-overlay,
          .sq-tile-title,
          .sq-tile-body {
            transition: none;
          }
        }

        /* ── Campaign ── */
        .sq-campaign-sec {
          padding: 48px 24px 24px;
          background: #fff;
        }

        .sq-campaign {
          max-width: 1120px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 1.15fr 0.85fr;
          border-radius: 28px;
          overflow: hidden;
          min-height: 320px;
          background: #f2f2f2;
          align-items: stretch;
        }

        .sq-campaign-visual {
          position: relative;
          min-height: 320px;
          height: 100%;
          align-self: stretch;
          background: #0039a6;
          overflow: hidden;
        }

        /* 左側滿版背景圖：貼齊外層圓角容器 */
        .sq-campaign-img {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center;
          display: block;
          pointer-events: none;
        }

        .sq-campaign-copy {
          position: relative;
          background: #f2f2f2;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: flex-start;
          padding: 40px 56px 48px 48px;
          text-align: left;
          min-height: 300px;
        }

        .sq-campaign-copy-body {
          width: 100%;
        }

        .sq-campaign-copy-body > * {
          animation: sq-copy-in 0.5s cubic-bezier(0.22, 1, 0.36, 1) both;
        }

        .sq-campaign-copy-body > *:nth-child(1) {
          animation-delay: 0.02s;
        }

        .sq-campaign-copy-body > *:nth-child(2) {
          animation-delay: 0.08s;
        }

        .sq-campaign-copy-body > *:nth-child(3) {
          animation-delay: 0.14s;
        }

        .sq-campaign-copy-body > *:nth-child(4) {
          animation-delay: 0.2s;
        }

        @keyframes sq-copy-in {
          from {
            opacity: 0;
            transform: translateX(22px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .sq-campaign-copy-body > * {
            animation: none;
          }
        }

        .sq-campaign-label {
          margin: 0;
          font-size: 13px;
          font-weight: 400;
          color: #111;
          letter-spacing: 0.02em;
        }

        .sq-campaign-heading {
          margin: 14px 0 0;
          font-size: clamp(22px, 2.4vw, 28px);
          font-weight: 700;
          line-height: 1.4;
          color: #111;
          letter-spacing: 0.02em;
        }

        .sq-campaign-desc {
          margin: 16px 0 0;
          font-size: 14px;
          line-height: 1.7;
          color: #222;
          max-width: 22em;
        }

        .sq-campaign-btn {
          margin-top: 28px;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          height: 44px;
          padding: 0 22px;
          border-radius: 4px;
          border: 1.5px solid #006aff;
          background: #fff;
          color: #006aff;
          font-size: 14px;
          font-weight: 700;
          text-decoration: none;
          letter-spacing: 0.02em;
          transition: opacity 0.2s ease;
        }

        .sq-campaign-btn:hover {
          opacity: 0.85;
        }

        .sq-campaign-btn span {
          font-size: 18px;
          line-height: 1;
          font-weight: 400;
        }

        .sq-campaign-next {
          position: absolute;
          right: 18px;
          bottom: 18px;
          width: 40px;
          height: 40px;
          border: none;
          border-radius: 50%;
          background: #fff;
          color: #006aff;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.12);
          font-size: 28px;
          line-height: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          padding: 0 0 3px;
          transition:
            transform 0.15s ease,
            opacity 0.15s ease;
        }

        .sq-campaign-next:hover {
          transform: scale(1.06);
          opacity: 0.92;
        }

        /* ── Product ── */
        .sq-product-sec {
          padding: 56px 24px 48px;
          background: #fff;
        }

        .sq-product {
          max-width: 1120px;
          margin: 0 auto;
        }

        .sq-product-main {
          display: grid;
          grid-template-columns: 1.15fr 0.85fr;
          gap: 48px 56px;
          align-items: center;
        }

        /* 切換合作方式時的過渡動畫（sq-product-main 以 key 重新掛載觸發） */
        .sq-product-main .sq-product-media {
          animation: sq-coop-media-in 0.55s cubic-bezier(0.22, 1, 0.36, 1) both;
        }

        .sq-product-main .sq-product-copy > * {
          animation: sq-copy-in 0.5s cubic-bezier(0.22, 1, 0.36, 1) both;
        }

        .sq-product-main .sq-product-copy > *:nth-child(1) {
          animation-delay: 0.06s;
        }

        .sq-product-main .sq-product-copy > *:nth-child(2) {
          animation-delay: 0.12s;
        }

        .sq-product-main .sq-product-copy > *:nth-child(3) {
          animation-delay: 0.18s;
        }

        .sq-product-main .sq-product-copy > *:nth-child(4) {
          animation-delay: 0.24s;
        }

        @keyframes sq-coop-media-in {
          from {
            opacity: 0;
            transform: translateY(14px) scale(0.985);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .sq-product-main .sq-product-media,
          .sq-product-main .sq-product-copy > * {
            animation: none;
          }
        }

        /* 右上、左下 50px 圓角，另外兩角直角 */
        .sq-product-media {
          border-radius: 0 50px 0 50px;
          overflow: hidden;
          line-height: 0;
          background: #eee;
        }

        .sq-product-media img {
          display: block;
          width: 100%;
          height: auto;
          aspect-ratio: 4 / 3;
          object-fit: cover;
          object-position: center;
        }

        .sq-product-copy {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          max-width: 28em;
        }

        .sq-product-badge {
          display: inline-block;
          background: #000;
          color: #fff;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.06em;
          padding: 5px 10px;
          line-height: 1;
        }

        .sq-product-heading {
          margin: 18px 0 0;
          font-size: clamp(24px, 2.8vw, 32px);
          font-weight: 700;
          line-height: 1.35;
          color: #000;
          letter-spacing: 0.01em;
        }

        .sq-product-desc {
          margin: 18px 0 0;
          font-size: 15px;
          line-height: 1.85;
          color: #111;
          font-weight: 400;
        }

        .sq-product-link {
          margin-top: 22px;
          color: #006aff;
          font-size: 15px;
          font-weight: 500;
          text-decoration: none;
          letter-spacing: 0.02em;
        }

        .sq-product-link:hover {
          text-decoration: underline;
        }

        .sq-filters {
          margin-top: 36px;
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 14px 18px;
        }

        .sq-filters-label {
          font-size: 13px;
          font-weight: 500;
          color: #000;
          white-space: nowrap;
        }

        .sq-filters-pills {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }

        .sq-pill {
          appearance: none;
          border: 1px solid #d0d0d0;
          background: #fff;
          color: #000;
          font-family: inherit;
          font-size: 13px;
          font-weight: 500;
          line-height: 1;
          padding: 10px 20px;
          border-radius: 999px;
          cursor: pointer;
          transition:
            background 0.15s ease,
            color 0.15s ease,
            border-color 0.15s ease;
        }

        .sq-pill:hover {
          border-color: #000;
        }

        .sq-pill--active {
          background: #000;
          color: #fff;
          border-color: #000;
        }

        /* ── POS features (static wide grid) ── */
        .sq-pos-sec {
          padding: 56px 0 72px;
          background: #fff;
        }

        .sq-pos-inner {
          max-width: 1440px;
          margin: 0 auto;
          padding: 0 clamp(20px, 4vw, 48px);
        }

        .sq-pos-heading {
          margin: 0;
          font-size: clamp(26px, 3.2vw, 38px);
          font-weight: 700;
          line-height: 1.45;
          color: #000;
          letter-spacing: 0.01em;
        }

        .sq-pos-demo-link {
          display: inline-block;
          margin-top: 16px;
          color: #006aff;
          font-size: 15px;
          font-weight: 500;
          text-decoration: none;
          border: 0;
          padding: 0;
          background: transparent;
          cursor: pointer;
        }

        .sq-pos-demo-link:hover {
          text-decoration: underline;
        }

        .sq-pos-grid {
          margin-top: 40px;
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 32px 28px;
        }

        .sq-pos-card {
          min-width: 0;
          padding: 0;
          border: 0;
          background: transparent;
          text-align: left;
          font: inherit;
          color: inherit;
          cursor: pointer;
        }

        .sq-pos-card:hover .sq-pos-media img,
        .sq-pos-card:focus-visible .sq-pos-media img {
          transform: scale(1.035);
        }

        .sq-pos-card:focus-visible {
          outline: 2px solid #006aff;
          outline-offset: 5px;
          border-radius: 14px;
        }

        .sq-pos-media {
          position: relative;
          border-radius: 14px;
          overflow: hidden;
          background: #f3f3f3;
          aspect-ratio: 16 / 11;
          line-height: 0;
        }

        .sq-pos-media img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
          transition: transform 0.45s cubic-bezier(0.22, 1, 0.36, 1);
        }

        .sq-pos-step {
          position: absolute;
          left: 12px;
          top: 12px;
          padding: 6px 9px;
          border-radius: 999px;
          background: rgba(0, 0, 0, 0.76);
          color: #fff;
          font-size: 10px;
          font-weight: 700;
          line-height: 1;
          letter-spacing: 0.12em;
        }

        .sq-pos-open {
          position: absolute;
          right: 12px;
          bottom: 12px;
          width: 34px;
          height: 34px;
          border-radius: 50%;
          background: #fff;
          color: #111;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 5px 18px rgba(0, 0, 0, 0.18);
          font-size: 18px;
          line-height: 1;
          transition: transform 0.25s ease;
        }

        .sq-pos-card:hover .sq-pos-open {
          transform: rotate(90deg);
        }

        .sq-pos-caption {
          margin: 16px 0 0;
          display: block;
          font-size: 15px;
          line-height: 1.8;
          color: #333;
        }

        .sq-pos-caption-link {
          display: block;
          color: #006aff;
        }

        .sq-pos-card:hover .sq-pos-caption-link {
          text-decoration: underline;
        }

        /* ── 操作教學 Popup ── */
        .sq-tutorial-modal {
          position: fixed;
          inset: 0;
          z-index: 999999;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }

        .sq-tutorial-backdrop {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          border: 0;
          background: rgba(0, 0, 0, 0.62);
          backdrop-filter: blur(5px);
          cursor: pointer;
          animation: sq-modal-fade 0.25s ease both;
        }

        .sq-tutorial-dialog {
          position: relative;
          z-index: 1;
          width: min(900px, 100%);
          max-height: min(760px, calc(100vh - 40px));
          display: grid;
          grid-template-columns: 0.9fr 1.1fr;
          overflow: auto;
          border-radius: 0 50px 0 50px;
          background: #fff;
          box-shadow: 0 28px 80px rgba(0, 0, 0, 0.28);
          animation: sq-modal-in 0.42s cubic-bezier(0.22, 1, 0.36, 1) both;
        }

        .sq-tutorial-close {
          position: absolute;
          top: 16px;
          right: 16px;
          z-index: 3;
          width: 38px;
          height: 38px;
          border: 0;
          border-radius: 50%;
          background: #fff;
          color: #111;
          box-shadow: 0 4px 18px rgba(0, 0, 0, 0.14);
          font-size: 26px;
          line-height: 1;
          cursor: pointer;
        }

        .sq-tutorial-image {
          position: relative;
          min-height: 540px;
          overflow: hidden;
          background: #e9eef5;
        }

        .sq-tutorial-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .sq-tutorial-image > span {
          position: absolute;
          left: 20px;
          top: 20px;
          padding: 7px 11px;
          border-radius: 999px;
          background: #111;
          color: #fff;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.12em;
        }

        .sq-tutorial-content {
          padding: 54px 52px 46px;
        }

        .sq-tutorial-kicker {
          margin: 0;
          color: #006aff;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.12em;
        }

        .sq-tutorial-content h3 {
          margin: 12px 0 0;
          color: #111;
          font-size: clamp(26px, 3vw, 34px);
          line-height: 1.35;
        }

        .sq-tutorial-summary {
          margin: 14px 0 0;
          color: #555;
          font-size: 14px;
          line-height: 1.8;
        }

        .sq-tutorial-steps {
          margin: 28px 0 0;
          padding: 0;
          list-style: none;
          border-top: 1px solid #e6e6e6;
        }

        .sq-tutorial-steps li {
          display: grid;
          grid-template-columns: 36px 1fr;
          gap: 12px;
          padding: 16px 0;
          border-bottom: 1px solid #e6e6e6;
        }

        .sq-tutorial-steps li > span {
          color: #006aff;
          font-size: 12px;
          font-weight: 700;
          padding-top: 2px;
        }

        .sq-tutorial-steps li p {
          margin: 0;
          color: #222;
          font-size: 14px;
          line-height: 1.7;
        }

        .sq-tutorial-tip {
          margin: 22px 0 0;
          padding: 14px 16px;
          border-radius: 10px;
          background: #f1f5fb;
          color: #4a5565;
          font-size: 12px;
          line-height: 1.7;
        }

        .sq-tutorial-tip strong {
          display: block;
          margin-bottom: 3px;
          color: #111;
        }

        .sq-tutorial-cta {
          margin-top: 24px;
          display: inline-flex;
          align-items: center;
          min-height: 44px;
          padding: 0 20px;
          border-radius: 4px;
          background: #006aff;
          color: #fff;
          font-size: 14px;
          font-weight: 700;
          text-decoration: none;
        }

        @keyframes sq-modal-fade {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes sq-modal-in {
          from {
            opacity: 0;
            transform: translateY(24px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        /* ── Dark Terminal ── */
        .sq-dark-sec {
          background: #000;
          color: #fff;
          padding: 72px 0 80px;
          overflow: hidden;
        }

        .sq-dark-inner {
          max-width: 1280px;
          margin: 0 auto;
          padding: 0 28px;
          display: grid;
          grid-template-columns: 1fr 1.05fr;
          gap: 48px 56px;
          align-items: center;
        }

        .sq-dark-heading {
          margin: 0 0 36px;
          font-size: clamp(24px, 2.8vw, 34px);
          font-weight: 700;
          line-height: 1.45;
          letter-spacing: 0.02em;
          color: #fff;
        }

        .sq-dark-features {
          list-style: none;
          margin: 0;
          padding: 0;
        }

        .sq-dark-feature {
          padding: 22px 0;
          border-bottom: 1px solid rgba(255, 255, 255, 0.12);
        }

        .sq-dark-feature:first-child {
          border-top: 1px solid rgba(255, 255, 255, 0.12);
        }

        .sq-dark-feature-title {
          margin: 0;
          font-size: 16px;
          font-weight: 700;
          color: #fff;
        }

        .sq-dark-feature-body {
          margin: 10px 0 0;
          font-size: 14px;
          line-height: 1.85;
          color: rgba(255, 255, 255, 0.78);
        }

        .sq-dark-feature-body :global(a) {
          color: #4da3ff;
          text-decoration: none;
        }

        .sq-dark-feature-body :global(a):hover {
          text-decoration: underline;
        }

        .sq-dark-visual {
          position: relative;
          min-height: 420px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .sq-dark-glow {
          position: absolute;
          width: 70%;
          height: 70%;
          right: 5%;
          top: 10%;
          border-radius: 50%;
          background: radial-gradient(
            circle,
            rgba(0, 92, 175, 0.55) 0%,
            rgba(0, 106, 255, 0.22) 42%,
            transparent 70%
          );
          pointer-events: none;
        }

        .sq-dark-device {
          position: relative;
          z-index: 1;
          width: min(100%, 480px);
          height: auto;
          display: block;
          border-radius: 8px;
        }

        .sq-dark-badge {
          position: absolute;
          z-index: 2;
          top: 14%;
          right: 4%;
          min-width: 168px;
          padding: 14px 16px;
          border-radius: 12px;
          background: rgba(28, 28, 30, 0.82);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          box-shadow: 0 8px 28px rgba(0, 0, 0, 0.35);
        }

        .sq-dark-badge-label {
          display: block;
          font-size: 11px;
          color: rgba(255, 255, 255, 0.75);
          margin-bottom: 6px;
        }

        .sq-dark-badge-value {
          display: inline-flex;
          align-items: baseline;
          gap: 6px;
          font-size: 26px;
          font-weight: 700;
          letter-spacing: 0.01em;
          color: #fff;
        }

        .sq-dark-badge-value span {
          font-size: 16px;
          font-weight: 500;
        }

        /* ── Store hardware carousel ── */
        .sq-store-sec {
          padding: 24px 0 96px;
          background: #fff;
        }

        .sq-store-inner {
          max-width: 1120px;
          margin: 0 auto;
          padding: 0 24px;
        }

        .sq-store-heading {
          margin: 0 0 28px;
          text-align: center;
          font-size: clamp(22px, 2.6vw, 28px);
          font-weight: 700;
          color: #000;
        }

        .sq-store-wrap {
          position: relative;
        }

        .sq-store-viewport {
          overflow-x: auto;
          overflow-y: hidden;
          scroll-snap-type: x mandatory;
          scroll-behavior: smooth;
          -webkit-overflow-scrolling: touch;
          padding: 4px 2px 8px;
          scrollbar-width: none;
        }

        .sq-store-viewport::-webkit-scrollbar {
          display: none;
        }

        .sq-store-track {
          display: flex;
          gap: 18px;
        }

        .sq-store-card {
          flex: 0 0 calc((100% - 54px) / 4);
          min-width: 220px;
          background: #f5f5f7;
          border-radius: 20px;
          padding: 22px 20px 24px;
          display: flex;
          flex-direction: column;
          scroll-snap-align: start;
        }

        .sq-store-img {
          background: #fff;
          border-radius: 12px;
          aspect-ratio: 1.15 / 1;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          margin-bottom: 18px;
          line-height: 0;
        }

        .sq-store-img img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .sq-store-name {
          margin: 0;
          color: #006aff;
          font-size: 17px;
          font-weight: 700;
          line-height: 1.35;
        }

        .sq-store-desc {
          margin: 10px 0 0;
          font-size: 13px;
          line-height: 1.65;
          color: #555;
          flex: 1;
        }

        .sq-store-price {
          margin: 16px 0 0;
          font-size: 18px;
          font-weight: 700;
          color: #000;
        }

        .sq-store-install {
          margin: 4px 0 0;
          font-size: 12px;
          color: #777;
          line-height: 1.5;
        }

        .sq-store-actions {
          margin-top: 18px;
          display: flex;
          align-items: center;
          gap: 14px;
          flex-wrap: wrap;
        }

        .sq-store-more {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          height: 36px;
          padding: 0 16px;
          border-radius: 6px;
          background: #006aff;
          color: #fff;
          font-size: 13px;
          font-weight: 700;
          text-decoration: none;
        }

        .sq-store-more:hover {
          opacity: 0.9;
        }

        .sq-store-buy {
          color: #006aff;
          font-size: 13px;
          font-weight: 600;
          text-decoration: none;
          white-space: nowrap;
        }

        .sq-store-buy:hover {
          text-decoration: underline;
        }

        .sq-store-nav {
          position: absolute;
          top: 42%;
          z-index: 3;
          width: 44px;
          height: 44px;
          border-radius: 50%;
          border: none;
          background: #fff;
          box-shadow: 0 2px 12px rgba(0, 0, 0, 0.14);
          color: #222;
          font-size: 28px;
          line-height: 1;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0 0 2px;
        }

        .sq-store-nav:disabled {
          opacity: 0.35;
          cursor: default;
        }

        .sq-store-nav--prev {
          left: -8px;
        }

        .sq-store-nav--next {
          right: -8px;
        }

        /* ── 合作 Partner ── */
        .sq-partner-sec {
          background: #dfdcd4;
          padding: 76px 0 64px;
          overflow: hidden;
        }

        .sq-partner-head {
          text-align: center;
          padding: 0 24px;
        }

        .sq-partner-heading {
          margin: 0;
          font-size: clamp(30px, 3.4vw, 42px);
          font-weight: 900;
          letter-spacing: 0.14em;
          color: #111;
          line-height: 1.2;
        }

        .sq-partner-sub {
          margin: 12px 0 0;
          font-size: 13px;
          font-weight: 600;
          letter-spacing: 0.08em;
          color: #333;
        }

        .sq-partner-wrap {
          position: relative;
          margin-top: 40px;
        }

        .sq-partner-marquee {
          overflow: hidden;
          padding: 16px 0 24px;
          cursor: grab;
          touch-action: pan-y;
          user-select: none;
          -webkit-user-select: none;
        }

        .sq-partner-marquee.is-dragging {
          cursor: grabbing;
        }

        .sq-partner-track {
          display: flex;
          width: max-content;
        }

        .sq-partner-group {
          display: flex;
          gap: 20px;
          padding-right: 20px;
        }

        .sq-partner-card {
          flex: 0 0 250px;
          background: #ffffff;
          padding: 34px 22px 30px;
          text-align: left;
          transition: transform 0.35s ease;
        }

        .sq-partner-card:hover {
          transform: translateY(-12px);
        }

        .sq-partner-logo {
          height: 110px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 26px;
        }

        .sq-partner-logo img {
          max-height: 100%;
          max-width: 140px;
          object-fit: contain;
        }

        .sq-partner-logo-open {
          width: 64px;
          height: 64px;
          border-radius: 50%;
          border: 2px dashed #b9b5ab;
          color: #b9b5ab;
          font-size: 28px;
          line-height: 1;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .sq-partner-card--open {
          background: #f7f6f2;
          border: 1.5px dashed #c9c5bb;
        }

        .sq-partner-card--open .sq-partner-name,
        .sq-partner-card--open .sq-partner-meta,
        .sq-partner-card--open .sq-partner-meta svg {
          color: #8d897f;
        }

        .sq-partner-name {
          margin: 0 0 12px;
          font-size: 14px;
          font-weight: 700;
          line-height: 1.6;
          color: #111;
          min-height: 3.2em;
        }

        .sq-partner-meta {
          margin: 0 0 7px;
          display: flex;
          align-items: flex-start;
          gap: 6px;
          font-size: 11px;
          line-height: 1.6;
          color: #555;
        }

        .sq-partner-meta svg {
          flex: 0 0 13px;
          width: 13px;
          height: 13px;
          margin-top: 2px;
          color: #111;
        }

        .sq-partner-cta-row {
          margin-top: 30px;
          display: flex;
          justify-content: center;
        }

        .sq-partner-cta {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          min-height: 46px;
          padding: 0 34px;
          border-radius: 999px;
          background: #111;
          color: #fff;
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 0.06em;
          text-decoration: none;
          transition:
            transform 0.25s ease,
            background 0.25s ease;
        }

        .sq-partner-cta:hover {
          transform: translateY(-3px);
          background: #000;
        }

        @media (max-width: 900px) {
          .sq-campaign {
            grid-template-columns: 1fr;
            border-radius: 20px;
          }

          .sq-campaign-visual {
            min-height: 220px;
            aspect-ratio: 16 / 10;
          }

          .sq-campaign-copy {
            padding: 32px 24px 56px;
            min-height: 0;
          }

          .sq-product-main {
            grid-template-columns: 1fr;
            gap: 28px;
          }

          .sq-product-copy {
            max-width: none;
          }

          .sq-product-media {
            border-radius: 0 36px 0 36px;
          }

          .sq-pos-grid {
            grid-template-columns: 1fr;
            gap: 28px;
          }

          .sq-tutorial-dialog {
            grid-template-columns: 1fr;
            border-radius: 0 36px 0 36px;
          }

          .sq-tutorial-image {
            min-height: 230px;
            max-height: 280px;
          }

          .sq-tutorial-content {
            padding: 34px 24px 30px;
          }

          .sq-dark-inner {
            grid-template-columns: 1fr;
            gap: 36px;
          }

          .sq-dark-visual {
            min-height: 300px;
            order: -1;
          }

          .sq-dark-badge {
            right: 8%;
            top: 8%;
          }

          .sq-store-card {
            flex: 0 0 70%;
          }

          .sq-store-nav--prev {
            left: 0;
          }

          .sq-store-nav--next {
            right: 0;
          }

          .sq-partner-card {
            flex: 0 0 220px;
          }
        }

        @media (max-width: 768px) {
          .sq-hero-copy {
            padding: 48px 20px 40px;
          }

          .sq-headline {
            font-size: 22px;
            max-width: none;
          }

          .sq-sub {
            margin-top: 20px;
            font-size: 14px;
            text-align: left;
          }

          .sq-cta-row {
            flex-direction: column;
            width: 100%;
            max-width: 280px;
            margin-top: 36px;
            gap: 20px;
          }

          .sq-btn {
            width: 100%;
            min-width: 0;
            height: 48px;
          }

          .sq-media {
            grid-template-columns: repeat(2, 1fr);
          }

          .sq-tile-overlay {
            opacity: 1;
            padding: 14px 12px 16px;
            background: linear-gradient(
              to top,
              rgba(0, 0, 0, 0.7) 0%,
              rgba(0, 0, 0, 0.15) 55%,
              rgba(0, 0, 0, 0) 100%
            );
          }

          .sq-tile-title,
          .sq-tile-body {
            transform: none;
          }

          .sq-tile-body {
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
          }

          .sq-campaign-sec {
            padding: 32px 16px 16px;
          }

          .sq-product-sec {
            padding: 40px 16px 40px;
          }

          .sq-pos-sec {
            padding: 32px 0 48px;
          }

          .sq-pos-inner,
          .sq-store-inner,
          .sq-dark-inner {
            padding: 0 16px;
          }

          .sq-dark-sec {
            padding: 48px 0 56px;
          }

          .sq-dark-heading {
            margin-bottom: 24px;
            font-size: 22px;
          }

          .sq-filters {
            margin-top: 28px;
          }
        }
      `}</style>
    </main>
  );
}

export default function IntroRoute() {
  const siteUrl = getSiteUrl();
  const title = "讓PIKFUN成為您的。夥伴";
  const description =
    "提供揪團、臨打、開課、活動最新資訊｜球場主、相關業者、教練進駐，匹克方可以成為您強而有力的行銷夥伴";

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta name="theme-color" content="#006AFF" />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`${siteUrl}/intro`} />
        <link rel="canonical" href={`${siteUrl}/intro`} />
      </Head>
      <IntroContent />
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
