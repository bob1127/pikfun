import { useState, useEffect, useRef, useCallback } from "react";

/* ── Data ─────────────────────────────────────────────── */
const HERO_IMAGES = [
  "/images/about/hero-1.jpg",
  "/images/about/hero-2.jpg",
  "/images/about/hero-3.jpg",
  "/images/about/hero-4.jpg",
];

const MEMBERS = [
  {
    id: "kai",
    enFirst: "Kai",
    enLast: "Chen",
    jpName: "陳 凱 (Coach Kai)",
    phrase: ["用球帶人", "用心引路"],
    role: "首席教練 / 共同創辦人",
    story:
      `嗨，我是 Kai。\n\n我從美國帶著一顆 pickleball 回來台灣，那時候根本沒幾個人知道這個運動。第一次架場地是在停車場，第一批學員只有七個人。但打完第一場之後，所有人眼睛都亮了——那種亮光，讓我決定把這輩子都押在這裡。\n\nPikFun 不只是一個場地，更是一個相信「運動可以改變關係」的地方。我們想讓你的下午不再只有手機螢幕，讓你的朋友圈裡多一個一起流汗的人。`,
    links: [{ name: "Instagram", href: "https://instagram.com" }],
    img: "/images/about/member-kai.jpg",
  },
  {
    id: "mei",
    enFirst: "Mei",
    enLast: "Lin",
    jpName: "林 美 (Mei)",
    phrase: ["懂你的節奏", "讓球變簡單"],
    role: "教練 / 課程規劃",
    story:
      `大家好，我是 Mei。\n\n以前練羽球，受傷後被迫轉換。第一次接觸 pickleball 是被朋友「騙」來的，沒想到一打就停不下來。\n\n我最喜歡帶零基礎的學員，看著他們從「這顆球到底往哪飛」的茫然，到第一次打出一顆完美的 dink——那個笑容，比任何獎盃都值錢。PikFun 給了我一個舞台，讓我把這份快樂傳遞出去。`,
    links: [{ name: "Instagram", href: "https://instagram.com" }],
    img: "/images/about/member-mei.jpg",
  },
  {
    id: "ding",
    enFirst: "Ding",
    enLast: "Wei",
    jpName: "丁 威 (Ding)",
    phrase: ["揪團的靈魂", "讓每場都滿"],
    role: "社群經理 / 揪團主持",
    story:
      `我是 Ding，PikFun 的「揪團王」。\n\n我的任務是確保你來到這裡不只是打球，而是交到朋友。從場地佈置、分組配對，到賽後的飲料時光，每一個細節都是為了讓陌生人變成隊友，隊友變成朋友。\n\n台灣人很忙，但我相信大家都渴望那種「一起拼」的感覺。我的工作，就是替你們創造那個理由。`,
    links: [{ name: "Instagram", href: "https://instagram.com" }, { name: "Line", href: "https://line.me" }],
    img: "/images/about/member-ding.jpg",
  },
  {
    id: "jun",
    enFirst: "Jun",
    enLast: "Wu",
    jpName: "吳 俊 (Jun)",
    phrase: ["數據背後", "是每個人的成長"],
    role: "科技整合 / 共同創辦人",
    story:
      `我是 Jun，負責讓 PikFun 的「數位大腦」運作順暢。\n\n工程師出身，但打 pickleball 打到轉業。現在我把過去寫程式的執著，全部用在思考「如何讓訂課更快、讓比賽結果更透明、讓每個人都能追蹤自己的進步」。\n\n我深信技術的終點是人。所以 PikFun 的每一行程式碼，背後都有一個問題：「這樣用戶更快樂嗎？」`,
    links: [{ name: "GitHub", href: "https://github.com" }, { name: "Instagram", href: "https://instagram.com" }],
    img: "/images/about/member-jun.jpg",
  },
];

const TOPICS = [
  { date: "2026.07.01", title: "PikFun 第一屆「城市 Pickleball 聯賽」正式啟動，名額限量 64 組", href: "#" },
  { date: "2026.06.15", title: "零基礎也能上場——我們為什麼堅持開「入門體驗課」", href: "#" },
  { date: "2026.06.01", title: "Coach Kai 專訪：從停車場到球場，PikFun 的誕生故事", href: "#" },
  { date: "2026.05.20", title: "裝備選購指南：給台灣新手玩家的第一把球拍推薦", href: "#" },
  { date: "2026.05.05", title: "揪團打球為什麼讓人上癮？運動社群的心理學", href: "#" },
];

const VALUES = [
  {
    num: "1",
    title: ["讓入門", "變得自然。"],
    body: "我們相信每個人都有權利輕鬆踏入 pickleball 的世界。不論年齡、體力、背景，PikFun 的每堂課與每場揪團，都以「降低門檻、提升趣味」為核心設計。讓你第一次來就想再來第二次。",
    imgs: ["/images/about/value-1a.jpg", "/images/about/value-1b.jpg"],
  },
  {
    num: "2",
    title: ["把球場", "變成社群。"],
    body: "競技可以很激烈，但 pickleball 更應該是連結人的媒介。我們透過揪團、賽事、工作坊，把陌生人變成球友，把球友變成夥伴。這裡的每一場球，都在寫你自己的人際故事。",
    imgs: ["/images/about/value-2a.jpg", "/images/about/value-2b.jpg"],
  },
  {
    num: "3",
    title: ["讓運動", "成為生活。"],
    body: "週末不再只有追劇，午休不再只有滑手機。我們希望 pickleball 成為你生活節奏的一部分——有點緊張、有點流汗、有點歡笑。那就是 PikFun 想給你的，每一個「這樣就夠了」的當下。",
    imgs: ["/images/about/value-3a.jpg", "/images/about/value-3b.jpg"],
  },
];

const PROJECTS = [
  {
    num: "1",
    title: ["揪團", "打球"],
    body: "由 PikFun 媒合，每週多場開放式揪團。不論單打雙打、入門進階，揪就對了。幫你找到水平相近的球友，讓每場都精彩不冷場。",
    brand: { num: "01", name: "揪團平台", desc: "即時場次、快速報名、自動配對對手。PikFun 讓你五分鐘內找到今晚的球局。", href: "/play" },
    imgs: ["/images/about/proj-1a.jpg", "/images/about/proj-1b.jpg"],
  },
  {
    num: "2",
    title: ["教練", "開課"],
    body: "從個人精進課到團體工作坊，PikFun 招募最有熱情的教練。每位教練都經過審核，你只需要帶著球拍，我們負責其餘的一切。",
    brand: { num: "02", name: "教練平台", desc: "精選教練陣容、課程評分系統、彈性預約排程。輕鬆找到最適合你的老師。", href: "/coaching" },
    imgs: ["/images/about/proj-2a.jpg"],
  },
  {
    num: "3",
    title: ["會員", "社群"],
    body: "加入 PikFun 會員，解鎖優先訂課、會員專屬賽事、成績追蹤儀表板。我們把資料還給你，讓你看見自己每個月的成長軌跡。",
    brand: { num: "03", name: "PikFun Lab", desc: "私人社群、訓練記錄、球友配對引擎。用數據驅動你的進步。", href: "#" },
    imgs: ["/images/about/proj-3a.jpg", "/images/about/proj-3b.jpg"],
  },
  {
    num: "4",
    title: ["裝備", "商城"],
    body: "從球拍、球到護具，PikFun 嚴選最適合台灣氣候與球風的裝備。同時開放教練與玩家社群推薦評測，讓你每一分錢都花在刀口上。",
    brand: { num: "04", name: "PikFun Shop", desc: "線上商城、教練推薦清單、會員折扣。從裝備到球技，PikFun 都幫你備好。", href: "#" },
    imgs: ["/images/about/proj-4a.jpg", "/images/about/proj-4b.jpg"],
  },
];

/* ── Wave SVG ──────────────────────────────────────────── */
function WaveSvg() {
  return (
    <svg viewBox="0 0 120 16" fill="none" preserveAspectRatio="none">
      <path d="M0 8 C20 0, 40 16, 60 8 S100 0, 120 8" stroke="currentColor" strokeWidth="1.5" fill="none"/>
    </svg>
  );
}

/* ── Img fallback ──────────────────────────────────────── */
function PfImg({ src, className, style }) {
  const [err, setErr] = useState(false);
  if (err || !src) {
    return <div className={`pf-img ${className || ""}`} style={style} />;
  }
  return (
    <div className={`pf-img ${className || ""}`} style={style}>
      <img src={src} alt="" onError={() => setErr(true)} />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════ */
export default function AboutPikfunPage() {
  const [heroIdx, setHeroIdx]       = useState(0);
  const [navOpen, setNavOpen]       = useState(false);
  const [memberOpen, setMemberOpen] = useState(null);
  const [activeSection, setActive]  = useState(0); // 0-3: concept/about/members/topics
  const [sectionProgress, setProgress] = useState(0); // 0-1

  /* refs for horizontal scroll sections */
  const wrapperRefs = useRef([]);   // outer wrapper (needs height)
  const trackRefs   = useRef([]);   // inner track (translated)

  /* ── Hero auto-advance ── */
  useEffect(() => {
    const t = setInterval(() => setHeroIdx(i => (i + 1) % HERO_IMAGES.length), 3200);
    return () => clearInterval(t);
  }, []);

  /* ── Lock scroll when nav/modal open ── */
  useEffect(() => {
    document.body.style.overflow = (navOpen || memberOpen) ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [navOpen, memberOpen]);

  /* ── Horizontal scroll transform on vertical scroll ── */
  useEffect(() => {
    const SECTION_LABELS = ["Concept", "About", "Members", "Topics"];

    function onScroll() {
      wrapperRefs.current.forEach((wrapper, i) => {
        if (!wrapper) return;
        const track = trackRefs.current[i];
        if (!track) return;

        const rect = wrapper.getBoundingClientRect();
        const viewH = window.innerHeight;
        // stickyRange = total vertical scrollable distance within this wrapper
        const stickyRange = wrapper.offsetHeight - viewH;
        if (stickyRange <= 0) return;

        const scrolled = -rect.top; // px scrolled into this section
        const progress = Math.max(0, Math.min(1, scrolled / stickyRange));
        const totalShift = track.scrollWidth - window.innerWidth;
        track.style.transform = `translateX(${-progress * totalShift}px)`;

        if (scrolled >= 0 && scrolled < stickyRange + viewH) {
          setActive(i);
          setProgress(progress);
        }
      });
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* ── Smooth scroll to section ── */
  const scrollToSection = useCallback((idx) => {
    const wrapper = wrapperRefs.current[idx];
    if (!wrapper) return;
    window.scrollTo({ top: wrapper.offsetTop + 1, behavior: "smooth" });
  }, []);

  /* ── Section labels ── */
  const SECTION_LABELS = ["Concept", "About", "Members", "Topics"];

  /* ── Horizontal track width helpers ── */
  /* We set min-height on wrappers via inline style after knowing track width.
     Instead, we size wrappers by giving tracks a fixed total width in CSS,
     then setting wrapper height = trackWidth + 100vh via CSS custom property. */

  /* ─────────────────────────────────────────────────────── */
  return (
    <div className="pf-root">

      {/* ── Fixed Header ── */}
      <header className="pf-header">
        <a className="pf-hdr-logo" href="/about-pikfun">
          <div className="pf-hdr-mark">P</div>
          <div>
            <div className="pf-hdr-type pf-en">PikFun</div>
            <div className="pf-hdr-tagline">匹克方 Pickleball</div>
          </div>
        </a>

        <div className="pf-hdr-wave-wrap">
          <div className="pf-hdr-wave-inner">
            {[...Array(8)].map((_, i) => <WaveSvg key={i} />)}
          </div>
        </div>

        <div className="pf-hdr-cmpname">
          <div className="pf-hdr-cmpname-wave">
            <div className="pf-hdr-cmpname-wave-inner">
              {[...Array(8)].map((_, i) => <WaveSvg key={i} />)}
            </div>
          </div>
          <div className="pf-hdr-cmpname-text pf-en">pikfun taiwan</div>
        </div>
      </header>

      {/* ── Fixed Hero ── */}
      <section className="pf-hero">
        {/* Left phrase strip */}
        <div className="pf-hero-phrase">
          <div className="pf-phrase-line">
            <span>讓匹克球</span>
            <span>成為生活</span>
          </div>
        </div>

        {/* Right main area */}
        <div className="pf-hero-main">
          {/* Slideshow */}
          <div className="pf-hero-visual-wrap">
            {HERO_IMAGES.map((src, i) => (
              <div
                key={i}
                className={`pf-hero-slide ${i === heroIdx ? "is-active" : ""}`}
                style={{ backgroundImage: `url(${src})` }}
              />
            ))}
          </div>

          {/* Concept text */}
          <div className="pf-hero-concept" style={{ position: "relative", zIndex: 2 }}>
            <p>以台灣為基地，連結球友、教練與社群，</p>
            <p>透過揪團、課程與賽事，解決 pickleball 的普及難題</p>
          </div>

          {/* Brand overlay */}
          <div className="pf-hero-brand" style={{ position: "absolute", bottom: "14%", left: "30%", zIndex: 3 }}>
            <div className="pf-hero-brand-name pf-en">PikFun</div>
            <div className="pf-hero-brand-sub pf-en">匹克方 Pickleball Taiwan</div>
          </div>

          {/* Decor */}
          <div className="pf-hero-decor">
            <span className="pf-scroll-label pf-en">Scroll</span>
            <div className="pf-slide-counter">
              {HERO_IMAGES.map((_, i) => (
                <button
                  key={i}
                  className={`pf-counter-dot ${i === heroIdx ? "is-active" : ""}`}
                  onClick={() => setHeroIdx(i)}
                  aria-label={`Slide ${i + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Page scroll content ── */}
      <div className="pf-page" style={{ marginTop: "100vh" }}>

        {/* ── Intro ── */}
        <section className="pf-intro">
          <div className="pf-intro-wrap">
            <p className="pf-intro-en pf-en">
              As a pickleball practitioner, we keep putting it into practice<br />
              to support players and coaches, and build a vibrant community.<br />
              We believe a more connected world begins on the court.
            </p>
            <div className="pf-intro-brand-name pf-en">PikFun</div>
            <p className="pf-intro-nick">簡稱 <q>匹克方</q></p>
          </div>
        </section>

        {/* ════════ HORIZONTAL SECTION 0 — Concept ════════ */}
        <HScrollSection
          wrapperRef={el => (wrapperRefs.current[0] = el)}
          trackRef={el => (trackRefs.current[0] = el)}
          trackWidth={4000}
        >
          {/* Caption */}
          <div className="pf-sec-caption" style={{ width: 160 }}>
            <h2 className="pf-sec-title pf-en">Con<br />cept</h2>
            <p className="pf-sec-subtitle">概念與價值</p>
          </div>

          {/* Based in */}
          <div className="pf-panel pf-panel--bg-pink pf-panel-location" style={{ width: 360, justifyContent: "space-between" }}>
            <div>
              <div className="pf-mid-label pf-en"><span>Based in</span></div>
              <div className="pf-mid-title"><span>台灣・台北</span><span>以球會友，</span><span>從這裡出發</span></div>
            </div>
            <div className="pf-map-placeholder">[ Taiwan Map ]</div>
            <p className="pf-body" style={{ marginTop: 12 }}>
              我們從台北出發，把 pickleball 這項風靡北美的新興運動帶入台灣日常。
              無論你在都市公園、社區中心還是室內球館，都能找到 PikFun 的身影。
              這裡沒有「初學者不能來」的規定，只有「歡迎你來試試」的邀請。
            </p>
          </div>

          {/* Concept MV */}
          <div className="pf-panel pf-panel--bg-white pf-panel-concept-mv" style={{ width: 580, justifyContent: "flex-end" }}>
            <PfImg src="/images/about/concept-main.jpg" className="pf-img--free" style={{ height: "55%" }} />
            <h3 className="pf-mv-intro" style={{ marginTop: 24 }}>
              <span>讓眼前的每一場球，</span>
              <span>都讓你</span>
              <span>躍躍欲試</span>
            </h3>
            <h4 className="pf-small-cpt" style={{ marginTop: 20, opacity: .65 }}>
              <span>輸了不丟臉，</span>
              <span>沒球友不是藉口，</span>
              <span>只是還沒遇見 PikFun。</span>
            </h4>
          </div>

          {/* Desc 1 */}
          <div className="pf-panel pf-panel--bg-off pf-panel-desc" style={{ width: 300 }}>
            <div className="pf-img-grid" style={{ marginBottom: 20 }}>
              <PfImg src="/images/about/concept-img1.jpg" className="pf-img--43" />
              <PfImg src="/images/about/concept-img2.jpg" className="pf-img--43" />
            </div>
            <p className="pf-body">
              在台灣推廣 pickleball 不容易——場地不足、器材難找、找不到球友。
              但正因為這樣，才需要一個真正懂你的平台，把這些問題一次解決。
              我們選擇直面挑戰，而不是等待市場自然成熟。
            </p>
          </div>

          {/* Sub-visual */}
          <div className="pf-panel pf-panel--bg-pink" style={{ width: 340, justifyContent: "center" }}>
            <PfImg src="/images/about/concept-sub.jpg" className="pf-img--34" style={{ height: "60%" }} />
            <h4 className="pf-small-cpt" style={{ marginTop: 24 }}>
              <span>為此，</span>
              <span>我們把</span>
              <span>3 件事做到極致。</span>
            </h4>
          </div>

          {/* Values */}
          {VALUES.map((v) => (
            <div key={v.num} className="pf-panel pf-panel--bg-white pf-panel-value" style={{ width: 400 }}>
              <div className="pf-mid-label pf-en">
                <span>Value</span>
                <span className="pf-mid-label-num">{v.num}</span>
              </div>
              <div className="pf-mid-title">
                {v.title.map((t, i) => <span key={i}>{t}</span>)}
              </div>
              <div className="pf-img-grid" style={{ margin: "16px 0" }}>
                {v.imgs.map((src, i) => (
                  <PfImg key={i} src={src} className="pf-img--43" />
                ))}
              </div>
              <p className="pf-body">{v.body}</p>
            </div>
          ))}
        </HScrollSection>

        {/* ════════ HORIZONTAL SECTION 1 — About ════════ */}
        <HScrollSection
          wrapperRef={el => (wrapperRefs.current[1] = el)}
          trackRef={el => (trackRefs.current[1] = el)}
          trackWidth={5200}
        >
          {/* Caption */}
          <div className="pf-sec-caption" style={{ width: 160 }}>
            <h2 className="pf-sec-title pf-en">Ab<br />out</h2>
            <p className="pf-sec-subtitle">關於 PikFun</p>
          </div>

          {/* About intro */}
          <div className="pf-panel pf-panel--bg-pink pf-panel-about-intro" style={{ width: 400, justifyContent: "space-between" }}>
            <PfImg src="/images/about/about-main.jpg" className="pf-img--free" style={{ height: "52%", marginBottom: 20 }} />
            <h4 className="pf-small-cpt">
              <span>在台灣，</span>
              <span>做 pickleball</span>
              <span>最好的事</span>
            </h4>
            <p className="pf-body" style={{ marginTop: 16 }}>
              台灣球場數少、教練資訊分散、新手不知從何入門。
              PikFun 從一個揪團 App 出發，逐步建立教練媒合、賽事管理、裝備選購的完整生態。
              農業社會說「合力才能豐收」；我們說「一起打才好玩」。
            </p>
          </div>

          {/* Projects */}
          {PROJECTS.map((proj) => (
            <div key={proj.num} className="pf-panel pf-panel--bg-white pf-panel-project" style={{ width: 440 }}>
              <div className="pf-mid-label pf-en">
                <span>Project</span>
                <span className="pf-mid-label-num">{proj.num}</span>
              </div>
              <div className="pf-mid-title">
                {proj.title.map((t, i) => <span key={i}>{t}</span>)}
              </div>
              <div className="pf-img-grid" style={{ margin: "14px 0" }}>
                {proj.imgs.map((src, i) => (
                  <PfImg key={i} src={src} className="pf-img--43" />
                ))}
              </div>
              <p className="pf-body">{proj.body}</p>
              {proj.brand && (
                <div className="pf-brand-card">
                  <div className="pf-brand-label pf-en">Our Platform</div>
                  <div className="pf-brand-num pf-en">{proj.brand.num}</div>
                  <div className="pf-brand-name-h">{proj.brand.name}</div>
                  <p className="pf-body">{proj.brand.desc}</p>
                  <a href={proj.brand.href} className="pf-brand-link pf-en">→ Visit</a>
                </div>
              )}
            </div>
          ))}

          {/* Outline */}
          <div className="pf-panel pf-panel-outline" style={{ width: 320, justifyContent: "flex-start", overflowY: "auto" }}>
            <div className="pf-mid-label pf-en" style={{ marginBottom: 20 }}>
              <span>Outline</span>
            </div>
            <ul className="pf-outline-list">
              {[
                ["公司名稱", "PikFun 匹克方有限公司"],
                ["創辦人", "陳 凱 (Coach Kai)"],
                ["所在地", "台北市大安區・運動科技中心"],
                ["聯絡信箱", "hello@pikfun.tw"],
                ["事業內容", "揪團平台、教練媒合、賽事管理、裝備選購"],
                ["Brand List", null],
              ].map(([th, td], i) => (
                <li key={i} style={{ paddingLeft: 0, padding: "14px 0", borderBottom: "1px solid rgba(0,0,0,.07)" }}>
                  <div className="pf-outline-th">{th}</div>
                  {td ? (
                    <div className="pf-outline-td">{td}</div>
                  ) : (
                    <div className="pf-outline-td">
                      <a href="/play">揪團打球</a>　
                      <a href="/coaching">教練平台</a>　
                      <a href="#">PikFun Lab</a>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </HScrollSection>

        {/* ════════ HORIZONTAL SECTION 2 — Members ════════ */}
        <HScrollSection
          wrapperRef={el => (wrapperRefs.current[2] = el)}
          trackRef={el => (trackRefs.current[2] = el)}
          trackWidth={2400}
        >
          {/* Caption */}
          <div className="pf-sec-caption" style={{ width: 200 }}>
            <h2 className="pf-sec-title pf-en">Mem<br />ber<sup style={{ fontSize: ".4em" }}>s</sup></h2>
            <p className="pf-sec-subtitle">團隊成員</p>
          </div>

          {/* Members grid */}
          <div className="pf-panel pf-panel--bg-white pf-panel-members-main" style={{ width: 760 }}>
            <div className="pf-mbr-grid">
              {MEMBERS.map((m) => (
                <button
                  key={m.id}
                  className="pf-mbr-card"
                  onClick={() => setMemberOpen(m)}
                  type="button"
                >
                  <div className="pf-mbr-name-en pf-en">{m.enFirst}</div>
                  <div className="pf-mbr-name-sub pf-en">{m.enLast}</div>
                  <div className="pf-mbr-thumb">
                    <PfImg src={m.img} />
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Member intro text */}
          <div className="pf-panel pf-panel--bg-pink" style={{ width: 360 }}>
            <h4 className="pf-small-cpt">
              <span>球場上的</span>
              <span>每個人，</span>
              <span>都有一段故事。</span>
            </h4>
            <p className="pf-body" style={{ marginTop: 20 }}>
              點選成員卡片，閱讀他們投入 pickleball 的故事——為什麼放棄穩定工作、為什麼選擇台灣，以及為什麼相信「匹克方」這個名字值得押上全力。
            </p>
          </div>
        </HScrollSection>

        {/* ════════ HORIZONTAL SECTION 3 — Topics ════════ */}
        <HScrollSection
          wrapperRef={el => (wrapperRefs.current[3] = el)}
          trackRef={el => (trackRefs.current[3] = el)}
          trackWidth={1800}
        >
          {/* Caption */}
          <div className="pf-sec-caption" style={{ width: 200 }}>
            <h2 className="pf-sec-title pf-en">Top<br />ic<sup style={{ fontSize: ".4em" }}>s</sup></h2>
            <p className="pf-sec-subtitle">最新消息</p>
          </div>

          {/* Topics list */}
          <div className="pf-panel pf-panel--bg-white pf-panel-topics" style={{ width: 520 }}>
            <ul className="pf-topic-list">
              {TOPICS.map((t, i) => (
                <li key={i} className="pf-topic-item">
                  <a href={t.href} className="pf-topic-link">
                    <div className="pf-topic-date pf-en">{t.date}</div>
                    <div className="pf-topic-title">{t.title}</div>
                  </a>
                </li>
              ))}
            </ul>
            <a href="https://note.com" className="pf-read-all pf-en" target="_blank" rel="noreferrer">
              <span>Read All</span>
              <span className="pf-read-all-arrow">→</span>
            </a>
          </div>

          {/* Contact teaser */}
          <div className="pf-panel pf-panel--bg-pink" style={{ width: 360 }}>
            <div className="pf-mid-label pf-en"><span>Get in touch</span></div>
            <h4 className="pf-small-cpt">
              <span>有任何問題，</span>
              <span>歡迎找我們</span>
            </h4>
            <p className="pf-body" style={{ margin: "20px 0" }}>
              無論你是想開課的教練、想揪團的玩家，或是想合作的品牌，都歡迎來信或在社群找到我們。
            </p>
            <a href="mailto:hello@pikfun.tw" className="pf-brand-link pf-en" style={{ marginTop: 0 }}>
              hello@pikfun.tw
            </a>
          </div>
        </HScrollSection>

        {/* ── Footer ── */}
        <footer className="pf-footer">
          <div className="pf-footer-title pf-en">Get in touch</div>
          <a href="mailto:hello@pikfun.tw" className="pf-contact-btn pf-en">お問い合わせ · 聯絡我們</a>
          <div className="pf-sns">
            {["Instagram", "Facebook", "LINE@", "note", "YouTube"].map(s => (
              <a key={s} href="#" target="_blank" rel="noreferrer">{s}</a>
            ))}
          </div>
          <address className="pf-copyright pf-en">© PikFun 匹克方有限公司</address>
        </footer>
      </div>

      {/* ── Nav toggle ── */}
      <button
        className="pf-nav-btn pf-nav-btn--open"
        onClick={() => setNavOpen(true)}
        aria-label="Open navigation"
      >
        <div className="pf-nav-open-bar">
          <span/><span/><span/>
        </div>
      </button>

      {/* ── Nav drawer ── */}
      <nav className={`pf-nav ${navOpen ? "is-open" : ""}`}>
        <button
          className="pf-nav-close"
          onClick={() => setNavOpen(false)}
          aria-label="Close navigation"
        >×</button>

        <ul className="pf-nav-group">
          {SECTION_LABELS.map((label, i) => (
            <li key={label}>
              <button
                className="pf-nav-link pf-en"
                style={{ background: "none", border: "none", cursor: "pointer", textAlign: "left", width: "100%", padding: "14px 0" }}
                onClick={() => { setNavOpen(false); scrollToSection(i); }}
              >{label}</button>
            </li>
          ))}
          <li>
            <a
              className="pf-nav-link pf-en"
              href="#"
              onClick={e => { e.preventDefault(); setNavOpen(false); window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" }); }}
            >Contact</a>
          </li>
        </ul>

        <ul className="pf-nav-group">
          <li><a className="pf-nav-link pf-en" href="/play" onClick={() => setNavOpen(false)}>Play / 揪團</a></li>
          <li><a className="pf-nav-link pf-en" href="/coaching" onClick={() => setNavOpen(false)}>Coaching / 教練</a></li>
        </ul>

        <div className="pf-nav-store">
          <a href="/" className="pf-en">[Online Store]</a>
        </div>
      </nav>

      {/* ── Progress sidebar ── */}
      <aside className="pf-progress">
        <div className="pf-prgs-label pf-en">{SECTION_LABELS[activeSection]}</div>
        <div className="pf-prgs-bar">
          <div className="pf-prgs-fill" style={{ width: `${sectionProgress * 100}%` }} />
        </div>
        <div className="pf-prgs-num pf-en">
          {String(activeSection + 1).padStart(2, "0")}
        </div>
      </aside>

      {/* ── Member modal ── */}
      <div className={`pf-modal-overlay ${memberOpen ? "is-open" : ""}`}>
        <button className="pf-modal-close" onClick={() => setMemberOpen(null)} aria-label="Close">×</button>
        {memberOpen && (
          <div className="pf-modal">
            <div>
              <div className="pf-modal-ename pf-en">
                {memberOpen.enFirst} {memberOpen.enLast}
              </div>
              <div className="pf-modal-jname">{memberOpen.jpName} · {memberOpen.role}</div>
              <ul className="pf-modal-links">
                {memberOpen.links.map((l, i) => (
                  <li key={i}><a href={l.href} target="_blank" rel="noreferrer">{l.name}</a></li>
                ))}
              </ul>
              <p className="pf-modal-phrase">
                {memberOpen.phrase.map((t, i) => <span key={i}>{t}</span>)}
              </p>
              <p className="pf-modal-story pf-body">{memberOpen.story}</p>
            </div>
            <div>
              <div className="pf-modal-portrait">
                <PfImg src={memberOpen.img} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── HScrollSection ─────────────────────────────────────
   Sticky wrapper that converts vertical scroll into
   horizontal translation of its children.
───────────────────────────────────────────────────────── */
function HScrollSection({ children, wrapperRef, trackRef, trackWidth }) {
  /* wrapper height = trackWidth so that scrolling through the wrapper
     gives the full horizontal travel distance  */
  return (
    <div
      ref={wrapperRef}
      style={{ height: trackWidth + "px", position: "relative" }}
    >
      <div className="pf-hscroll-sticky">
        <div
          ref={trackRef}
          className="pf-hscroll-track"
          style={{ width: trackWidth + "px" }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
