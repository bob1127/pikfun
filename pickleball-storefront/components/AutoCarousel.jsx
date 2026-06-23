import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import Link from "next/link";
import { ChevronRight, ChevronLeft } from "lucide-react";

const CLONE_MAX = 3;
const SLIDE_PERCENT = 33.333;

function buildExtended(events) {
  if (!events.length) return [];
  const clone = Math.min(CLONE_MAX, events.length);
  return [
    ...events.slice(-clone),
    ...events,
    ...events.slice(0, clone),
  ];
}

const AutoCarousel = ({ items = [] }) => {
  const events = items;
  const cloneCount = Math.min(CLONE_MAX, events.length || 1);

  const extendedEvents = useMemo(
    () => buildExtended(events),
    [events]
  );

  const [currentIndex, setCurrentIndex] = useState(cloneCount);
  const [isTransitioning, setIsTransitioning] = useState(true);

  const [isDragging, setIsDragging] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);

  const timerRef = useRef(null);
  const eventsLenRef = useRef(events.length);
  const cloneRef = useRef(cloneCount);

  useEffect(() => {
    eventsLenRef.current = events.length;
    cloneRef.current = Math.min(CLONE_MAX, events.length || 1);
    setCurrentIndex(Math.min(CLONE_MAX, events.length || 1));
  }, [events]);

  const handleNext = useCallback(() => {
    setIsTransitioning(true);
    setCurrentIndex((prev) => prev + 1);
  }, []);

  const handlePrev = useCallback(() => {
    setIsTransitioning(true);
    setCurrentIndex((prev) => prev - 1);
  }, []);

  const startTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (eventsLenRef.current < 2) return;
    timerRef.current = setInterval(() => {
      setIsTransitioning(true);
      setCurrentIndex((prev) => prev + 1);
    }, 4000);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  useEffect(() => {
    startTimer();
    return () => stopTimer();
  }, [events.length, startTimer, stopTimer]);

  const handleTransitionEnd = () => {
    const len = eventsLenRef.current;
    const clone = cloneRef.current;
    if (len === 0) return;

    if (currentIndex >= len + clone) {
      setIsTransitioning(false);
      setCurrentIndex(clone);
    } else if (currentIndex <= 0) {
      setIsTransitioning(false);
      setCurrentIndex(len);
    }
  };

  const handleDragStart = (e) => {
    stopTimer();
    setIsDragging(true);
    setIsTransitioning(false);
    const clientX = e.type.includes("mouse") ? e.clientX : e.touches[0].clientX;
    setDragStartX(clientX);
  };

  const handleDragMove = (e) => {
    if (!isDragging) return;
    const clientX = e.type.includes("mouse") ? e.clientX : e.touches[0].clientX;
    setDragOffset(clientX - dragStartX);
  };

  const handleDragEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);
    setIsTransitioning(true);

    if (dragOffset > 50) {
      handlePrev();
    } else if (dragOffset < -50) {
      handleNext();
    }
    setDragOffset(0);
    startTimer();
  };

  return (
    <section className="max-w-7xl mx-auto px-4 py-12 bg-white relative select-none">
      {/* 標題區域 */}
      <div className="mb-8 px-2">
        <span className="text-[#2369ab] text-sm font-bold block mb-2 uppercase tracking-wider">
          Pickleball Tips
        </span>
        <div className="flex justify-between items-end border-b pb-4">
          <h2 className="text-3xl font-bold text-gray-900">運動知識與攻略</h2>

          {/* 頂部按鈕與查看更多 */}
          <div className="flex items-center gap-6">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  handlePrev();
                  stopTimer();
                  startTimer();
                }}
                className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 transition"
              >
                <ChevronLeft size={18} className="text-gray-600" />
              </button>
              <button
                type="button"
                onClick={() => {
                  handleNext();
                  stopTimer();
                  startTimer();
                }}
                className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 transition"
              >
                <ChevronRight size={18} className="text-gray-600" />
              </button>
            </div>
            <Link
              href="/blog?category=knowledge"
              className="flex items-center text-[#2369ab] text-sm font-bold hover:opacity-70 transition-opacity"
            >
              查看更多內容
              <div className="ml-2 w-6 h-6 rounded-full bg-[#2369ab] flex items-center justify-center">
                <ChevronRight size={16} color="white" />
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* 輪播視窗 (支援滑鼠與觸控事件) */}
      {events.length > 0 ? (
        <div
          className="overflow-hidden relative -mx-4 px-4 py-2 cursor-grab active:cursor-grabbing"
          onMouseEnter={stopTimer}
          onMouseLeave={() => {
            handleDragEnd();
            startTimer();
          }}
          onMouseDown={handleDragStart}
          onMouseMove={handleDragMove}
          onMouseUp={handleDragEnd}
          onTouchStart={handleDragStart}
          onTouchMove={handleDragMove}
          onTouchEnd={handleDragEnd}
        >
          <div
            className={`flex ${isTransitioning ? "transition-transform duration-500 ease-out" : ""}`}
            style={{
              transform: `translateX(calc(-${currentIndex * SLIDE_PERCENT}% + ${dragOffset}px))`,
            }}
            onTransitionEnd={handleTransitionEnd}
          >
            {extendedEvents.map((item, index) => {
              const href = item.href || `/blog/${item.slug}`;
              return (
                <div
                  key={`${item.id}-${index}`}
                  className="min-w-[33.333%] px-4 group"
                >
                  <Link href={href} className="bg-white block">
                    <div className="relative overflow-hidden rounded-xl aspect-[16/10] mb-4">
                      <img
                        src={item.img}
                        alt={item.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        draggable="false"
                      />
                    </div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[#2369ab] font-mono font-bold tracking-tighter">
                        {item.date}
                      </span>
                      <div className="w-6 h-6 rounded-full bg-[#2369ab] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <ChevronRight size={14} color="white" />
                      </div>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-1 leading-snug line-clamp-2 min-h-[3.5rem] group-hover:text-[#2369ab] transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-gray-500 text-xs mb-4">{item.subtitle}</p>
                    <div className="inline-block px-3 py-1 border border-[#6EC1E4] text-[#6EC1E4] text-[10px] rounded mb-3 font-bold">
                      {item.status}
                    </div>
                    <div className="flex gap-2">
                      {(item.tags || []).map((tag) => (
                        <span key={tag} className="text-gray-400 text-[10px]">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <p className="text-gray-400 text-sm px-2 py-8">尚無文章，請至 WordPress 後台發佈。</p>
      )}
    </section>
  );
};

export default AutoCarousel;
