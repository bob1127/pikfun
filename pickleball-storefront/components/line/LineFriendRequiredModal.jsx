"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Loader2, UserPlus, CheckCircle2, ExternalLink, ArrowRight } from "lucide-react";

const LINE_OA_FRIEND_URL =
  process.env.NEXT_PUBLIC_LINE_OA_FRIEND_URL || "";

/**
 * 強制加入 LINE 官方好友 popup
 * - 無法關閉，直到 API 確認已加好友
 * - 點擊後開新分頁加好友，並自動輪詢驗證
 */
export default function LineFriendRequiredModal({
  open,
  userEmail,
  backHref = "/member",
  onVerified,
}) {
  const [checking, setChecking] = useState(false);
  const [verified, setVerified] = useState(false);
  const [openedLine, setOpenedLine] = useState(false);
  const [checkAvailable, setCheckAvailable] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const pollRef = useRef(null);

  const checkFriendStatus = useCallback(async () => {
    if (!userEmail) return false;
    setChecking(true);
    try {
      const params = new URLSearchParams({ email: userEmail });
      const res = await fetch(`/api/line/friend-status?${params}`);
      if (!res.ok) return false;
      const data = await res.json();
      setCheckAvailable(data.check_available !== false);
      if (data.friend_added) {
        setVerified(true);
        onVerified?.();
        return true;
      }
      return false;
    } catch {
      return false;
    } finally {
      setChecking(false);
    }
  }, [userEmail, onVerified]);

  const handleManualConfirm = async () => {
    if (!userEmail || !openedLine) return;
    setConfirming(true);
    try {
      const res = await fetch("/api/line/confirm-friend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: userEmail }),
      });
      if (res.ok) {
        setVerified(true);
        onVerified?.();
      }
    } finally {
      setConfirming(false);
    }
  };

  useEffect(() => {
    if (!open || verified) return;

    checkFriendStatus();

    if (!checkAvailable) return;

    pollRef.current = setInterval(() => {
      checkFriendStatus();
    }, 2500);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [open, verified, checkAvailable, checkFriendStatus]);

  const handleAddFriend = () => {
    if (!LINE_OA_FRIEND_URL) return;
    setOpenedLine(true);
    window.open(LINE_OA_FRIEND_URL, "_blank", "noopener,noreferrer");
    checkFriendStatus();
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 z-[500] flex items-center justify-center p-4"
        style={{ backgroundColor: "rgba(11, 45, 110, 0.92)" }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="line-friend-modal-title"
      >
        <motion.div
          initial={{ scale: 0.94, opacity: 0, y: 16 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ type: "spring", damping: 24, stiffness: 320 }}
          className="w-full max-w-md overflow-hidden border border-white/20 bg-[#0B2D6E] text-white shadow-2xl"
        >
          <div className="h-1" style={{ backgroundColor: "#06C755" }} />

          <div className="px-7 py-8 text-center">
            {verified ? (
              <>
                <CheckCircle2
                  className="mx-auto mb-4 text-[#06C755]"
                  size={52}
                />
                <h2
                  id="line-friend-modal-title"
                  className="text-xl font-bold tracking-wide"
                >
                  已成功加入好友 ✅
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-white/70">
                  LINE 提醒已完整設定，活動前會通知你。
                </p>
                <Link
                  href={backHref}
                  className="mt-7 inline-flex w-full items-center justify-center gap-2 border border-white/30 py-3.5 text-sm font-bold transition-colors hover:bg-white/10"
                >
                  返回活動頁
                  <ArrowRight size={16} />
                </Link>
              </>
            ) : (
              <>
                <div
                  className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full border border-[#06C755]/40 bg-[#06C755]/15 text-2xl"
                  aria-hidden
                >
                  📱
                </div>
                <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.35em] text-white/50">
                  REQUIRED
                </p>
                <h2
                  id="line-friend-modal-title"
                  className="text-xl font-bold leading-snug tracking-wide"
                >
                  加入 PikFun 官方 LINE 好友
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-white/70">
                  加入後才能收到提醒
                  <br />
                  <span className="text-white/50">
                    請先完成加好友，才能繼續使用
                  </span>
                </p>

                <div className="mt-6 space-y-3 text-left">
                  <div className="flex items-start gap-3 border border-white/15 bg-white/[0.04] px-4 py-3">
                    <span className="mt-0.5 text-xs font-bold text-[#3D8FD9]">
                      01
                    </span>
                    <p className="text-xs leading-relaxed text-white/75">
                      點下方按鈕前往 LINE 加入官方好友
                    </p>
                  </div>
                  <div className="flex items-start gap-3 border border-white/15 bg-white/[0.04] px-4 py-3">
                    <span className="mt-0.5 text-xs font-bold text-[#3D8FD9]">
                      02
                    </span>
                    <p className="text-xs leading-relaxed text-white/75">
                      加入後此視窗會自動偵測並解除
                    </p>
                  </div>
                </div>

                {LINE_OA_FRIEND_URL ? (
                  <button
                    type="button"
                    onClick={handleAddFriend}
                    className="mt-7 flex w-full items-center justify-center gap-2 py-4 text-sm font-bold text-white transition-opacity hover:opacity-90"
                    style={{ backgroundColor: "#06C755" }}
                  >
                    <UserPlus size={18} />
                    前往加入 LINE 好友
                    <ExternalLink size={14} className="opacity-70" />
                  </button>
                ) : (
                  <p className="mt-6 text-xs text-yellow-200/90">
                    請設定 NEXT_PUBLIC_LINE_OA_FRIEND_URL
                  </p>
                )}

                {openedLine && (
                  <div className="mt-5 space-y-3">
                    {checkAvailable ? (
                      <div className="flex items-center justify-center gap-2 text-xs text-white/55">
                        {checking ? (
                          <>
                            <Loader2 size={14} className="animate-spin" />
                            正在確認是否已加入好友…
                          </>
                        ) : (
                          <>尚未偵測到，請確認已在 LINE 按下「加入好友」</>
                        )}
                      </div>
                    ) : (
                      <p className="text-center text-xs text-white/55">
                        加入完成後，請點下方按鈕繼續
                      </p>
                    )}

                    {openedLine && (
                      <button
                        type="button"
                        onClick={handleManualConfirm}
                        disabled={confirming}
                        className="w-full border border-white/30 py-3 text-xs font-bold tracking-wide text-white/80 transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        {confirming ? "確認中…" : "我已加入好友，繼續"}
                      </button>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export { LINE_OA_FRIEND_URL };
