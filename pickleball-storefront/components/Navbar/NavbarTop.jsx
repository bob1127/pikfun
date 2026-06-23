"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, User, ShoppingBag, Search, X } from "lucide-react";

const BRAND_COLORS = {
  blue: "#3157B5",
  pink: "#F4596A",
  yellow: "#FFD43A",
};

function Logo({ light }) {
  return (
    <Link href="/" className="flex items-center gap-2.5 shrink-0">
      <div className="flex -space-x-1.5">
        <div
          className={`w-5 h-5 rounded-full border-[2.5px] ${
            light ? "border-white" : "border-[#3157B5]"
          }`}
        />
        <div
          className={`w-5 h-5 rounded-full border-[2.5px] ${
            light ? "border-[#FFD43A]" : "border-[#FFD43A]"
          }`}
        />
      </div>
      <span
        className={`text-lg font-black tracking-widest ${
          light ? "text-white drop-shadow-sm" : "text-gray-900"
        }`}
      >
        PikFun
      </span>
    </Link>
  );
}

export default function NavbarTop({
  visible,
  variant = "overlay",
  navLinks,
  router,
  totalQty,
  userInfo,
  userLoading,
  onMenuOpen,
  onCartOpen,
  searchQuery,
  onSearchQueryChange,
  onSearchSubmit,
}) {
  const [searchOpen, setSearchOpen] = useState(false);
  const isOverlay = variant === "overlay";

  const iconBtnClass = isOverlay
    ? "p-2 rounded-full text-white bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 transition-colors"
    : "p-2 rounded-full text-gray-700 bg-[#F2F4F7] hover:bg-gray-200 transition-colors";

  const linkClass = isOverlay
    ? "text-white/90 hover:text-[#FFD43A] text-sm font-bold tracking-wide transition-colors drop-shadow-sm"
    : "text-gray-700 hover:text-[#3157B5] text-sm font-bold tracking-wide transition-colors";

  return (
    <motion.header
      initial={false}
      animate={{
        y: visible ? 0 : "-100%",
        opacity: visible ? 1 : 0,
      }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      className={`fixed top-0 left-0 right-0 z-[999] pointer-events-none ${
        visible ? "" : "invisible"
      }`}
      aria-hidden={!visible}
    >
      <div
        className={`pointer-events-auto ${
          isOverlay
            ? "bg-gradient-to-b from-black/55 via-black/25 to-transparent"
            : "bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm"
        }`}
      >
        <div className="mx-auto max-w-[1400px] h-14 md:h-16 px-4 md:px-6 flex items-center justify-between gap-4">
          <Logo light={isOverlay} />

          <nav className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) => {
              const isActive =
                router.pathname === link.href ||
                (link.href !== "/" && router.pathname.startsWith(link.href));
              return (
                <Link
                  key={link.key}
                  href={link.href}
                  className={`relative py-1 ${linkClass} ${
                    isActive
                      ? isOverlay
                        ? "text-[#FFD43A]"
                        : "text-[#3157B5]"
                      : ""
                  }`}
                >
                  {link.label}
                  {isActive && (
                    <span
                      className="absolute -bottom-0.5 left-0 right-0 h-0.5 rounded-full"
                      style={{ backgroundColor: BRAND_COLORS.yellow }}
                    />
                  )}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-1.5 md:gap-2">
            <div className="relative">
              <button
                type="button"
                onClick={() => setSearchOpen((v) => !v)}
                className={iconBtnClass}
                aria-label="搜尋"
              >
                {searchOpen ? <X size={18} /> : <Search size={18} />}
              </button>
              <AnimatePresence>
                {searchOpen && (
                  <motion.div
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: "auto" }}
                    exit={{ opacity: 0, width: 0 }}
                    className={`absolute right-0 top-full mt-2 overflow-hidden rounded-lg shadow-xl ${
                      isOverlay
                        ? "bg-black/80 backdrop-blur-md border border-white/20"
                        : "bg-white border border-gray-100"
                    }`}
                  >
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => onSearchQueryChange(e.target.value)}
                      onKeyDown={onSearchSubmit}
                      placeholder="搜尋..."
                      autoFocus
                      className={`w-48 md:w-56 px-4 py-2.5 text-sm outline-none bg-transparent ${
                        isOverlay
                          ? "text-white placeholder-white/50"
                          : "text-gray-800 placeholder-gray-400"
                      }`}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {!userLoading && (
              <Link
                href={userInfo ? "/member" : "/login"}
                className={`hidden md:flex ${iconBtnClass}`}
                aria-label={userInfo ? "會員中心" : "登入"}
              >
                <User size={18} />
              </Link>
            )}

            <button
              type="button"
              onClick={onCartOpen}
              className={`relative ${iconBtnClass}`}
              aria-label="購物車"
            >
              <ShoppingBag size={18} />
              {totalQty > 0 && (
                <span
                  className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold text-white flex items-center justify-center"
                  style={{ backgroundColor: BRAND_COLORS.pink }}
                >
                  {totalQty > 99 ? "99+" : totalQty}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={onMenuOpen}
              className={iconBtnClass}
              aria-label="開啟選單"
            >
              <Menu size={20} strokeWidth={2.5} />
            </button>
          </div>
        </div>
      </div>
    </motion.header>
  );
}
