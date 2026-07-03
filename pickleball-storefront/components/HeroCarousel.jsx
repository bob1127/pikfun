"use client";

import React, { useState, useEffect, useRef } from "react";
import gsap from "gsap";
import { CustomEase } from "gsap/dist/CustomEase";
import { motion, AnimatePresence } from "framer-motion";

if (typeof window !== "undefined") {
  gsap.registerPlugin(CustomEase);
}

// ==========================================
// 1. 定義本機端圖片資料 (請將圖片放在 public/images/ 下)
// ==========================================
const LOCAL_SLIDES = [
  {
    type: "image",
    src: "/images/index/hero-carousel/banner11.png", // 對應 public/images/index/hero-1.jpg
    title: "PikFun COMMUNITY",
    category: "JOIN THE FACTION",
    alt: "Pickleball Community",
  },
  {
    type: "image",
    src: "/images/index/hero-carousel/banner23.png",
    title: "PREMIUM GEAR",
    category: "EQUIPMENT",
    alt: "Pickleball Paddles",
  },
  {
    type: "image",
    src: "/images/index/hero-carousel/3d1c939e-b991-4df3-a797-51d81ae4ac43.png",
    title: "COURT BOOKING",
    category: "RESERVATION",
    alt: "Pickleball Courts",
  },

  {
    type: "image",
    src: "/images/index/hero-carousel/banner01.png",
    title: "COURT BOOKING",
    category: "RESERVATION",
    alt: "Pickleball Courts",
  },
  {
    type: "image",
    src: "/images/index/hero-carousel/banner04.png",
    title: "COURT BOOKING",
    category: "RESERVATION",
    alt: "Pickleball Courts",
  },
];

const PickleballAnimation = () => {
  const wrapperRef = useRef(null);
  const carouselImagesRef = useRef(null);
  const textTitleRef = useRef(null);
  const textCategoryRef = useRef(null);

  const [slides, setSlides] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const isGsapInitialized = useRef(false);

  const stateRef = useRef({
    currentIndex: 0,
    isAnimating: false,
    slideOffset: 500,
    autoPlayTimer: null,
  });

  // ==========================================
  // 2. 處理本機圖片初始化與預載
  // ==========================================
  useEffect(() => {
    if (typeof window === "undefined") return;

    const preloadFirstImage = (slide) => {
      if (!slide || slide.type === "video") {
        setIsLoading(false);
        return;
      }

      const img = new window.Image();
      img.onload = () => setIsLoading(false);
      img.onerror = () => setIsLoading(false);
      img.src = slide.src;
    };

    // 直接設定本機資料並開始預載第一張
    setSlides(LOCAL_SLIDES);
    preloadFirstImage(LOCAL_SLIDES[0]);
  }, []);

  // Helper: 建立媒體元件
  const createMediaElement = (slideData) => {
    const mediaEl =
      slideData.type === "video"
        ? document.createElement("video")
        : document.createElement("img");

    mediaEl.src = slideData.src;

    if (slideData.type === "image") {
      mediaEl.alt = slideData.alt || slideData.title;
    }

    if (slideData.type === "video") {
      mediaEl.muted = true;
      mediaEl.loop = true;
      mediaEl.autoplay = true;
      mediaEl.setAttribute("playsinline", "");
      mediaEl.onloadeddata = () => mediaEl.play();
    }

    Object.assign(mediaEl.style, {
      width: "100%",
      height: "100%",
      objectFit: "cover",
      display: "block",
    });
    return mediaEl;
  };

  // 核心：切換動畫函式
  const performTransition = (direction) => {
    if (
      stateRef.current.isAnimating ||
      !carouselImagesRef.current ||
      slides.length === 0
    )
      return;
    stateRef.current.isAnimating = true;

    const nextIndex = stateRef.current.currentIndex;
    const nextData = slides[nextIndex];

    // 文字動畫
    if (textTitleRef.current && textCategoryRef.current) {
      gsap.to([textCategoryRef.current, textTitleRef.current], {
        y: -30,
        opacity: 0,
        duration: 0.4,
        ease: "power2.in",
        stagger: 0.1,
        onComplete: () => {
          textTitleRef.current.innerText = nextData.title;
          textCategoryRef.current.innerText = nextData.category;
          gsap.set([textCategoryRef.current, textTitleRef.current], { y: 30 });
          gsap.to([textCategoryRef.current, textTitleRef.current], {
            y: 0,
            opacity: 1,
            duration: 0.8,
            ease: "power2.out",
            stagger: 0.1,
          });
        },
      });
    }

    // 圖片動畫
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
    if (slides.length > 1) {
      stateRef.current.autoPlayTimer = setInterval(() => {
        stateRef.current.currentIndex =
          (stateRef.current.currentIndex + 1) % slides.length;
        performTransition("right");
      }, 5000);
    }
  };

  const stopAutoPlay = () => {
    if (stateRef.current.autoPlayTimer)
      clearInterval(stateRef.current.autoPlayTimer);
  };

  const clickSlide = (direction) => {
    if (stateRef.current.isAnimating || slides.length <= 1) return;
    stopAutoPlay();
    if (direction === "next") {
      stateRef.current.currentIndex =
        (stateRef.current.currentIndex + 1) % slides.length;
      performTransition("right");
    } else {
      stateRef.current.currentIndex =
        (stateRef.current.currentIndex - 1 + slides.length) % slides.length;
      performTransition("left");
    }
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

      if (textTitleRef.current && textCategoryRef.current) {
        textTitleRef.current.innerText = slides[0].title;
        textCategoryRef.current.innerText = slides[0].category;
        gsap.fromTo(
          [textCategoryRef.current, textTitleRef.current],
          { y: 30, opacity: 0 },
          { y: 0, opacity: 1, duration: 1, ease: "power2.out", stagger: 0.2 },
        );
      }
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
          width: 80%;
        }
        .slide-info p {
          font-size: 1rem;
          letter-spacing: 0.2rem;
          text-transform: uppercase;
          color: #fff;
          margin-bottom: 1rem;
        }
        .slide-info h1 {
          font-size: 4rem;
          font-weight: 700;
          color: #fff;
          text-transform: uppercase;
        }
        .slider-controls {
          position: absolute;
          width: 100%;
          top: 50%;
          transform: translateY(-50%);
          padding: 0 5%;
          display: flex;
          justify-content: space-between;
          z-index: 30;
          pointer-events: none;
        }
        .control-btn {
          pointer-events: auto;
          padding: 1.5rem;
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(5px);
          border: 1px solid rgba(255, 255, 255, 0.3);
          border-radius: 50%;
          cursor: pointer;
          transition: all 0.3s;
        }
        .control-btn:hover {
          background: #fff;
          transform: scale(1.1);
        }
        .control-btn svg {
          fill: #fff;
        }
        .control-btn:hover svg {
          fill: #000;
        }
        footer {
          position: absolute;
          bottom: 0;
          width: 100%;
          padding: 2rem;
          display: flex;
          justify-content: space-between;
          color: #fff;
          z-index: 20;
        }
        @media (max-width: 768px) {
          .slide-info h1 {
            font-size: 2.5rem;
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
            <p ref={textCategoryRef}></p>
            <h1 ref={textTitleRef}></h1>
          </div>

          {slides.length > 1 && (
            <div className="slider-controls">
              <button
                className="control-btn"
                onClick={() => clickSlide("prev")}
              >
                <svg width="24" height="24" viewBox="0 0 24 24">
                  <path d="m3.3 12 8.7 8.7 1.5-1.5L6.3 12l7.2-7.2-1.5-1.5L3.3 12Z" />
                </svg>
              </button>
              <button
                className="control-btn"
                onClick={() => clickSlide("next")}
              >
                <svg width="24" height="24" viewBox="0 0 24 24">
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
