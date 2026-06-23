import confetti from "canvas-confetti";

/** 與 ConfettiButton 相同的慶祝彩帶效果 */
export function fireCelebrationConfetti(origin = { x: 0.5, y: 0.5 }, confettiOpts = {}) {
  const { x, y } = origin;

  confetti({
    particleCount: 120,
    spread: 70,
    origin: { x, y },
    colors: ["#005caf", "#c8f542", "#ffffff", "#1a3a8a", "#ef4023", "#38bdf8"],
    ...confettiOpts,
  });

  setTimeout(() => {
    confetti({
      particleCount: 60,
      angle: 120,
      spread: 50,
      origin: { x: x - 0.05, y },
      colors: ["#c8f542", "#005caf", "#fbbf24", "#f472b6"],
      ...confettiOpts,
    });
  }, 120);

  setTimeout(() => {
    confetti({
      particleCount: 60,
      angle: 60,
      spread: 50,
      origin: { x: x + 0.05, y },
      colors: ["#005caf", "#c8f542", "#34d399", "#a78bfa"],
      ...confettiOpts,
    });
  }, 200);
}

/** 從 DOM 元素中心發射彩帶 */
export function fireCelebrationConfettiFromElement(el, confettiOpts = {}) {
  if (!el || typeof window === "undefined") {
    fireCelebrationConfetti({ x: 0.5, y: 0.5 }, confettiOpts);
    return;
  }
  const rect = el.getBoundingClientRect();
  fireCelebrationConfetti(
    {
      x: (rect.left + rect.width / 2) / window.innerWidth,
      y: (rect.top + rect.height / 2) / window.innerHeight,
    },
    confettiOpts
  );
}
