"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import gsap from "gsap";
import { CustomEase } from "gsap/dist/CustomEase";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/router";

if (typeof window !== "undefined") {
  gsap.registerPlugin(CustomEase);
}

// 雙語標語成對定義：畫面永遠同時顯示中英，依語系切換主次
const HERO_SLIDES = [
  {
    src: "/images/index/hero-carousel/banner11.png",
    zh: { category: "社群", title: "一起上場" },
    en: { category: "COMMUNITY", title: "PLAY TOGETHER" },
  },
  {
    src: "/images/index/hero-carousel/banner23.png",
    zh: { category: "球場", title: "準備對打" },
    en: { category: "ON COURT", title: "READY TO RALLY" },
  },
  {
    src: "/images/index/hero-carousel/3d1c939e-b991-4df3-a797-51d81ae4ac43.png",
    zh: { category: "臨打", title: "找到你的球場" },
    en: { category: "OPEN PLAY", title: "FIND YOUR COURT" },
  },
  {
    src: "/images/index/hero-carousel/banner01.png",
    zh: { category: "訓練", title: "持續精進" },
    en: { category: "TRAINING", title: "LEVEL UP" },
  },
  {
    src: "/images/index/hero-carousel/banner04.png",
    zh: { category: "社團生活", title: "開打吧" },
    en: { category: "CLUB LIFE", title: "GAME ON" },
  },
];

function resolveSlideCopy(slide, locale) {
  const primary = locale === "en" ? slide.en : slide.zh;
  const secondary = locale === "en" ? slide.zh : slide.en;
  return {
    type: "image",
    src: slide.src,
    category: primary.category,
    title: primary.title,
    subtitle: secondary.title,
    alt: `${slide.zh.title} / ${slide.en.title}`,
  };
}

const PickleballAnimation = () => {
  const router = useRouter();
  const locale = router.locale === "en" ? "en" : "zh-TW";

  const wrapperRef = useRef(null);
  const carouselImagesRef = useRef(null);
  const textTitleRef = useRef(null);
  const textCategoryRef = useRef(null);
  const textSubtitleRef = useRef(null);

  const [isLoading, setIsLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);

  const isGsapInitialized = useRef(false);

  const stateRef = useRef({
    currentIndex: 0,
    isAnimating: false,
    autoPlayTimer: null,
  });

  const slides = useMemo(
    () => HERO_SLIDES.map((slide) => resolveSlideCopy(slide, locale)),
    [locale],
  );

  const slidesRef = useRef(slides);
  useEffect(() => {
    slidesRef.current = slides;
  }, [slides]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const first = slides[0];
    if (!first) {
      setIsLoading(false);
      return;
    }
    const img = new window.Image();
    img.onload = () => setIsLoading(false);
    img.onerror = () => setIsLoading(false);
    img.src = first.src;
  }, [slides]);

  // 語系切換時，同步目前畫面三行文字
  useEffect(() => {
    const current = slides[stateRef.current.currentIndex];
    if (!current) return;
    if (textCategoryRef.current)
      textCategoryRef.current.innerText = current.category;
    if (textTitleRef.current) textTitleRef.current.innerText = current.title;
    if (textSubtitleRef.current)
      textSubtitleRef.current.innerText = current.subtitle;
  }, [slides]);

  const createMediaElement = (slideData) => {
    const mediaEl = document.createElement("img");
    mediaEl.src = slideData.src;
    mediaEl.alt = slideData.alt || slideData.title;
    Object.assign(mediaEl.style, {
      width: "100%",
      height: "100%",
      objectFit: "cover",
      display: "block",
    });
    return mediaEl;
  };

  const animateTextOutIn = (nextData) => {
    const targets = [
      textCategoryRef.current,
      textTitleRef.current,
      textSubtitleRef.current,
    ].filter(Boolean);
    if (!targets.length) return;

    gsap.to(targets, {
      y: -24,
      opacity: 0,
      duration: 0.35,
      ease: "power2.in",
      stagger: 0.06,
      onComplete: () => {
        if (textCategoryRef.current)
          textCategoryRef.current.innerText = nextData.category;
        if (textTitleRef.current)
          textTitleRef.current.innerText = nextData.title;
        if (textSubtitleRef.current)
          textSubtitleRef.current.innerText = nextData.subtitle;
        gsap.set(targets, { y: 24 });
        gsap.to(targets, {
          y: 0,
          opacity: 1,
          duration: 0.7,
          ease: "power2.out",
          stagger: 0.08,
        });
      },
    });
  };

  const performTransition = (direction) => {
    const currentSlides = slidesRef.current;
    if (
      stateRef.current.isAnimating ||
      !carouselImagesRef.current ||
      currentSlides.length === 0
    )
      return;
    stateRef.current.isAnimating = true;

    const nextIndex = stateRef.current.currentIndex;
    const nextData = currentSlides[nextIndex];
    setActiveIndex(nextIndex);
    animateTextOutIn(nextData);

    const slideOffset = window.innerWidth < 1000 ? 100 : 500;
    const currentSlide =
      carouselImagesRef.current.querySelector(".img:last-child");
    const currentMedia = currentSlide?.querySelector("img, video");

    const newSlideContainer = document.createElement("div");
    newSlideContainer.className = "img";
    Object.assign(newSlideContainer.style, {
      position: "absolute",
      top: 0,
      left: 0,
      width: "100%",
      height: "100%",
      zIndex: 2,
    });

    const newMediaEl = createMediaElement(nextData);
    gsap.set(newMediaEl, {
      x: direction === "right" ? slideOffset : -slideOffset,
    });
    newSlideContainer.appendChild(newMediaEl);
    carouselImagesRef.current.appendChild(newSlideContainer);

    if (currentMedia) {
      gsap.to(currentMedia, {
        x: direction === "right" ? -slideOffset : slideOffset,
        duration: 1.5,
        ease: "hop",
      });
    }

    gsap.fromTo(
      newSlideContainer,
      {
        clipPath:
          direction === "right"
            ? "polygon(100% 0%, 100% 0%, 100% 100%, 100% 100%)"
            : "polygon(0% 0%, 0% 0%, 0% 100%, 0% 100%)",
      },
      {
        clipPath: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)",
        duration: 1.5,
        ease: "hop",
        onComplete: () => {
          if (!carouselImagesRef.current) return;
          const allSlides =
            carouselImagesRef.current.querySelectorAll(".img") || [];
          if (allSlides.length > 1) {
            for (let i = 0; i < allSlides.length - 1; i++)
              allSlides[i].remove();
          }
          stateRef.current.isAnimating = false;
        },
      },
    );
    gsap.to(newMediaEl, { x: 0, duration: 1.5, ease: "hop" });
  };

  const startAutoPlay = () => {
    stopAutoPlay();
    if (slidesRef.current.length > 1) {
      stateRef.current.autoPlayTimer = setInterval(() => {
        stateRef.current.currentIndex =
          (stateRef.current.currentIndex + 1) % slidesRef.current.length;
        performTransition("right");
      }, 5000);
    }
  };

  const stopAutoPlay = () => {
    if (stateRef.current.autoPlayTimer)
      clearInterval(stateRef.current.autoPlayTimer);
  };

  const clickSlide = (direction) => {
    if (stateRef.current.isAnimating || slidesRef.current.length <= 1) return;
    stopAutoPlay();
    if (direction === "next") {
      stateRef.current.currentIndex =
        (stateRef.current.currentIndex + 1) % slidesRef.current.length;
      performTransition("right");
    } else {
      stateRef.current.currentIndex =
        (stateRef.current.currentIndex - 1 + slidesRef.current.length) %
        slidesRef.current.length;
      performTransition("left");
    }
    startAutoPlay();
  };

  const goToSlide = (index) => {
    if (
      stateRef.current.isAnimating ||
      slidesRef.current.length <= 1 ||
      index === stateRef.current.currentIndex
    )
      return;
    stopAutoPlay();
    const direction =
      index > stateRef.current.currentIndex ? "right" : "left";
    stateRef.current.currentIndex = index;
    performTransition(direction);
    startAutoPlay();
  };

  useEffect(() => {
    if (
      typeof window === "undefined" ||
      !wrapperRef.current ||
      isLoading ||
      slides.length === 0
    )
      return;
    if (isGsapInitialized.current) return;
    isGsapInitialized.current = true;

    if (!CustomEase.get("hop")) {
      CustomEase.create(
        "hop",
        "M0,0 C0.071,0.505 0.192,0.726 0.318,0.852 0.45,0.984 0.504,1 1,1",
      );
    }

    if (carouselImagesRef.current) {
      carouselImagesRef.current.innerHTML = "";
      const initContainer = document.createElement("div");
      initContainer.className = "img";
      Object.assign(initContainer.style, {
        position: "absolute",
        width: "100%",
        height: "100%",
      });
      initContainer.appendChild(createMediaElement(slides[0]));
      carouselImagesRef.current.appendChild(initContainer);

      if (textCategoryRef.current)
        textCategoryRef.current.innerText = slides[0].category;
      if (textTitleRef.current) textTitleRef.current.innerText = slides[0].title;
      if (textSubtitleRef.current)
        textSubtitleRef.current.innerText = slides[0].subtitle;

      const targets = [
        textCategoryRef.current,
        textTitleRef.current,
        textSubtitleRef.current,
      ].filter(Boolean);
      gsap.fromTo(
        targets,
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 1, ease: "power2.out", stagger: 0.15 },
      );
    }

    startAutoPlay();
    return () => stopAutoPlay();
  }, [isLoading, slides]);

  return (
    <>
      <style jsx>{`
        #integrated-wrapper {
          width: 100%;
          height: 100vh;
          overflow: hidden;
          position: relative;
          background: #000;
        }
        .carousel {
          width: 100%;
          height: 100%;
          position: relative;
        }
        .carousel-images {
          position: absolute;
          inset: 0;
          opacity: 0.8;
        }
        .slide-info {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          z-index: 20;
          text-align: center;
          pointer-events: none;
          width: min(88%, 920px);
        }
        .slide-info .category {
          font-size: 0.8rem;
          letter-spacing: 0.28rem;
          text-transform: uppercase;
          color: #fff;
          margin-bottom: 0.75rem;
          opacity: 0.9;
        }
        .slide-info .title {
          font-size: clamp(2rem, 5.5vw, 3.75rem);
          font-weight: 700;
          color: #fff;
          letter-spacing: 0.04em;
          line-height: 1.15;
          margin: 0;
        }
        .slide-info .subtitle {
          margin-top: 0.85rem;
          font-size: clamp(0.85rem, 1.6vw, 1.05rem);
          letter-spacing: 0.18em;
          color: rgba(255, 255, 255, 0.78);
          text-transform: none;
        }
        .slider-timeline {
          position: absolute;
          left: 50%;
          bottom: 2.75rem;
          transform: translateX(-50%);
          z-index: 30;
          display: flex;
          align-items: center;
          gap: 0.85rem;
          pointer-events: auto;
        }
        .timeline-arrow {
          width: 28px;
          height: 28px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border: 1px solid rgba(255, 255, 255, 0.55);
          background: transparent;
          color: #fff;
          cursor: pointer;
          transition: background 0.25s ease, border-color 0.25s ease;
          flex-shrink: 0;
        }
        .timeline-arrow:hover {
          background: rgba(255, 255, 255, 0.15);
          border-color: #fff;
        }
        .timeline-arrow svg {
          fill: currentColor;
        }
        .timeline-track {
          display: flex;
          align-items: center;
          gap: 0.45rem;
          min-width: 140px;
        }
        .timeline-segment {
          height: 1px;
          flex: 1;
          min-width: 22px;
          background: rgba(255, 255, 255, 0.35);
          border: none;
          padding: 0;
          cursor: pointer;
          transition: background 0.3s ease, height 0.3s ease, transform 0.3s ease;
        }
        .timeline-segment.is-active {
          height: 2px;
          background: #fff;
          transform: scaleY(1.2);
        }
        footer {
          position: absolute;
          bottom: 0;
          width: 100%;
          padding: 1.25rem 2rem;
          display: flex;
          justify-content: space-between;
          color: rgba(255, 255, 255, 0.55);
          z-index: 20;
          font-size: 0.7rem;
          letter-spacing: 0.08em;
          pointer-events: none;
        }
        @media (max-width: 768px) {
          .slider-timeline {
            bottom: 2.25rem;
            gap: 0.65rem;
          }
          .timeline-track {
            min-width: 110px;
          }
          footer {
            padding: 1rem 1.25rem;
          }
        }
      `}</style>

      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{
              opacity: 0,
              transition: { duration: 0.8, ease: "easeInOut" },
            }}
            className="absolute inset-0 z-50 bg-black flex items-center justify-center"
          >
            <span className="text-white text-xs tracking-widest uppercase animate-pulse">
              PikFun Loading...
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      <div id="integrated-wrapper" ref={wrapperRef}>
        <div className="carousel">
          <div className="carousel-images" ref={carouselImagesRef}></div>
          <div className="slide-info">
            <p className="category" ref={textCategoryRef}></p>
            <h1 className="title" ref={textTitleRef}></h1>
            <p className="subtitle" ref={textSubtitleRef}></p>
          </div>

          {slides.length > 1 && (
            <div className="slider-timeline" aria-label="Hero carousel controls">
              <button
                type="button"
                className="timeline-arrow"
                onClick={() => clickSlide("prev")}
                aria-label="Previous slide"
              >
                <svg width="12" height="12" viewBox="0 0 24 24">
                  <path d="m3.3 12 8.7 8.7 1.5-1.5L6.3 12l7.2-7.2-1.5-1.5L3.3 12Z" />
                </svg>
              </button>

              <div className="timeline-track" role="tablist">
                {slides.map((slide, index) => (
                  <button
                    key={`${slide.src}-${index}`}
                    type="button"
                    role="tab"
                    aria-label={`Go to slide ${index + 1}`}
                    aria-selected={index === activeIndex}
                    className={`timeline-segment${
                      index === activeIndex ? " is-active" : ""
                    }`}
                    onClick={() => goToSlide(index)}
                  />
                ))}
              </div>

              <button
                type="button"
                className="timeline-arrow"
                onClick={() => clickSlide("next")}
                aria-label="Next slide"
              >
                <svg width="12" height="12" viewBox="0 0 24 24">
                  <path d="M20.7 12l-8.7-8.7-1.5 1.5 7.2 7.2-7.2 7.2 1.5 1.5 8.7-8.7Z" />
                </svg>
              </button>
            </div>
          )}

          <footer>
            <p>© 2026 PikFun</p>
            <p>Community & Marketplace</p>
          </footer>
        </div>
      </div>
    </>
  );
};

export default PickleballAnimation;
