import React, { useRef, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Check, ArrowRight } from "lucide-react";

// --- 1. 單一專案卡片 (完全參照截圖排版) ---
const ProjectCard = ({ data }) => {
  const href = data.href || `/blog/${data.slug}`;

  return (
    <Link
      href={href}
      className="flex-none w-full md:w-[600px] bg-white shadow-xl rounded-sm overflow-hidden snap-start border border-gray-100 mb-8 block hover:shadow-2xl transition-shadow"
    >
      {/* 頂部黑條編號區 */}
      <div className="bg-[#262E30] px-6 py-3 flex items-center gap-2">
        <div className="w-5 h-5 bg-[#00B46E] rounded-full flex items-center justify-center">
          <Check size={14} className="text-white" />
        </div>
        <span className="text-[#00B46E] font-mono text-sm tracking-widest">
          {data.id}
        </span>
      </div>

      {/* 主內容區 */}
      <div className="p-8 relative">
        {/* 背景裝飾引號 */}
        <div className="absolute right-8 top-8 text-[#F2F2F2] text-8xl font-serif select-none pointer-events-none">
          ”
        </div>

        <div className="flex flex-col md:flex-row gap-6 items-start relative z-10">
          {/* 左側：Logo 或 圖片 */}
          <div className="w-full md:w-48 h-32 flex-shrink-0 bg-white border border-gray-100 flex items-center justify-center overflow-hidden">
            <img
              src={data.image}
              alt={data.brand}
              className="w-full h-full object-cover"
            />
          </div>

          {/* 右側：文字資訊 */}
          <div className="flex-1">
            <p className="text-[#00B46E] font-bold mb-2 text-sm">
              {data.brand}
            </p>
            <h3 className="text-xl font-extrabold text-gray-900 mb-4 leading-tight">
              {data.title}
            </h3>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[13px] text-gray-500 mb-4">
              <span>{data.date}</span>
              <span className="flex items-center gap-1">
                <span className="text-yellow-500 font-bold">#</span> {data.type}
              </span>
              <span>{data.status}</span>
            </div>
          </div>
        </div>

        {/* 下方灰色描述盒 */}
        <div className="mt-6 bg-[#F5F7F8] p-5 relative group">
          <p className="text-gray-600 text-[14px] leading-relaxed line-clamp-2">
            {data.description}
          </p>
          <div className="absolute bottom-4 right-4 text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
            <ArrowRight size={18} />
          </div>
        </div>
      </div>
    </Link>
  );
};

// --- 2. 主元件 (含雙色背景與滑動邏輯) ---
export default function ProjectSection({ posts = [] }) {
  const scrollRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const items = posts;

  const handleScroll = (direction) => {
    if (scrollRef.current) {
      const { scrollLeft, offsetWidth } = scrollRef.current;
      const moveDistance =
        direction === "left" ? -offsetWidth * 0.7 : offsetWidth * 0.7;
      scrollRef.current.scrollTo({
        left: scrollLeft + moveDistance,
        behavior: "smooth",
      });
    }
  };

  // 監聽捲動來更新小圓點
  const onScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, offsetWidth } = scrollRef.current;
      const index = Math.round(scrollLeft / (offsetWidth * 0.7));
      setActiveIndex(index);
    }
  };

  return (
    <div className="relative   bg-[#EBECEE] font-sans w-full">
      {/* 雙色背景：黃色區塊 */}
      <div className="absolute top-0  w-[63%] h-full bg-[#FAD02C] hidden lg:block" />

      <div className="relative z-10  pl-[13%] w-full mx-auto px-6 py-20">
        {/* 標題與控制列 */}
        <div className="flex flex-col  max-w-[1500px] lg:flex-row justify-between items-start lg:items-center mb-12 gap-8">
          <div>
            <h2 className="text-5xl font-black text-gray-900 mb-4">
              查找球場與活動資訊
            </h2>
            <span className="text-stone-800 font-normal text-[14px]">
              從新手交流、球友討論，到球場資訊、裝備推薦與活動分享<br></br>
              打造屬於台灣匹克球玩家的聚落。
            </span>
            <p className="text-stone-400 mt-6 font-normal">
              文章總數 {items.length} 篇
            </p>
          </div>

          <div className="flex items-center gap-10 w-full lg:w-auto">
            {/* 左右導覽按鈕 */}
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => handleScroll("left")}
                className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg hover:bg-gray-50 transition-all group"
              >
                <ChevronLeft
                  size={24}
                  className="text-gray-400 group-hover:text-black"
                />
              </button>
              <button
                type="button"
                onClick={() => handleScroll("right")}
                className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg hover:bg-gray-50 transition-all relative group"
              >
                <ChevronRight
                  size={24}
                  className="text-gray-400 group-hover:text-black"
                />
                {/* 右側按鈕上的黃色裝飾點 */}
                <div className="absolute top-1 right-1 w-4 h-4 bg-[#FAD02C] rounded-full border-2 border-white" />
              </button>
            </div>

            {/* 藍色 CTA 按鈕 */}
            <Link
              href="/blog?category=active"
              className="flex-1 lg:flex-none bg-[#2F54EB] text-white px-10 py-5 rounded-full flex items-center justify-center gap-4 hover:bg-blue-700 transition-all shadow-xl font-bold tracking-wide"
            >
              採択プロジェクト一覧を見る
              <ArrowRight size={20} />
            </Link>
          </div>
        </div>

        {/* 卡片滑動區塊 */}
        <div
          ref={scrollRef}
          onScroll={onScroll}
          className="flex overflow-x-auto gap-8 pb-10 hide-scrollbar snap-x snap-mandatory scroll-smooth"
        >
          {items.length > 0 ? (
            items.map((item, index) => (
              <ProjectCard key={item.slug || index} data={item} />
            ))
          ) : (
            <p className="text-stone-500 text-sm py-8">
              尚無文章，請至 WordPress 後台發佈。
            </p>
          )}
        </div>

        {/* 底部分頁點 */}
        {items.length > 0 && (
          <div className="flex justify-end gap-3 pr-4">
            {items.map((_, index) => (
              <div
                key={index}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  activeIndex === index ? "bg-[#00B46E] scale-125" : "bg-white"
                }`}
              />
            ))}
          </div>
        )}
      </div>

      <style
        dangerouslySetInnerHTML={{
          __html: `
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `,
        }}
      />
    </div>
  );
}
