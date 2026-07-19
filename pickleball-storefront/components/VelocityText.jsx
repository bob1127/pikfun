"use client";

import React, { useRef } from "react";
import {
  motion,
  useScroll,
  useTransform,
  useSpring,
} from "motion/react";

/**
 * 滾動文字：隨頁面滾動水平左右位移（無傾斜、不佔額外高度）。
 */
export default function VelocityText({ children, className = "" }) {
  const targetRef = useRef(null);

  // 以文字經過視窗的進度驅動（進入視窗到離開視窗）
  const { scrollYProgress } = useScroll({
    target: targetRef,
    offset: ["start end", "end start"],
  });

  // 往下滾動時文字往左滑
  const xRaw = useTransform(scrollYProgress, [0, 1], [60, -1100]);
  // 輕微平滑即可，避免果凍感過強
  const x = useSpring(xRaw, { mass: 1, stiffness: 120, damping: 30 });

  return (
    <div ref={targetRef} className="overflow-hidden">
      <motion.p
        style={{ x }}
        className={`whitespace-nowrap select-none pointer-events-none ${className}`}
      >
        {children}
      </motion.p>
    </div>
  );
}
