import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X } from "lucide-react";
import { useChat } from "../../contexts/ChatContext";
import { cn } from "../../utils/cn";
import ChatWindow from "./ChatWindow";

/**
 * Floating chat bubble + chat window overlay.
 * Visible on all pages when user is authenticated, EXCEPT on conversation pages.
 */
const ChatBubble = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const { isChatOpen, toggleChat, closeChat, totalUnread, isAuthenticated } =
    useChat();
  const [hasFocus, setHasFocus] = useState(false);

  // Don't show floating chat on dedicated conversation pages
  const isOnConversationsPage =
    location.pathname === "/mis-conversaciones" ||
    location.pathname === "/app/conversations";

  // Close chat bubble if user navigates to conversations page
  // (don't call closeChat() as it clears activeConversationId)
  useEffect(() => {
    if (isOnConversationsPage && isChatOpen) {
      // Just close the bubble, don't clear the active conversation
      toggleChat();
    }
  }, [isOnConversationsPage, isChatOpen, toggleChat]);

  // Close with Escape key only when chat window has focus (like Facebook)
  useEffect(() => {
    if (!isChatOpen || !hasFocus) return;
    const handleKey = (e) => {
      if (e.key === "Escape") {
        closeChat();
        setHasFocus(false);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isChatOpen, hasFocus, closeChat]);

  // Lock body scroll on mobile when chat is open (full-screen mode)
  useEffect(() => {
    if (!isChatOpen) return;

    // Only lock scroll on mobile (< 1024px)
    const isMobile = window.innerWidth < 1024;
    if (!isMobile) return;

    // Store original values
    const originalBodyOverflow = document.body.style.overflow;
    const originalHtmlOverflow = document.documentElement.style.overflow;

    // Lock scroll on both html and body
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalBodyOverflow;
      document.documentElement.style.overflow = originalHtmlOverflow;
    };
  }, [isChatOpen]);

  if (!isAuthenticated || isOnConversationsPage) return null;

  return (
    <>
      {/* ── Chat Window (animated) ───────────────────── */}
      <AnimatePresence mode="wait">
        {isChatOpen && (
          <motion.div
            key="chat-window"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            onClick={() => setHasFocus(true)}
            className={cn(
              "fixed z-9998",
              // Mobile: full screen
              "inset-0 lg:inset-auto",
              // Desktop: anchored bottom-right
              "lg:bottom-20 lg:right-5 lg:h-130 lg:w-95",
              "lg:rounded-2xl lg:shadow-2xl",
            )}
          >
            <ChatWindow />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Floating Action Button ───────────────────── */}
      <button
        onClick={toggleChat}
        aria-label={isChatOpen ? t("chat.bubble.close") : t("chat.bubble.open")}
        className={cn(
          "fixed bottom-20 right-5 z-9999 lg:bottom-5",
          "flex h-14 w-14 items-center justify-center",
          "rounded-full shadow-lg transition-all duration-200",
          "hover:scale-105 active:scale-95",
          isChatOpen
            ? "bg-slate-700 text-white dark:bg-slate-600"
            : "bg-cyan-600 text-white hover:bg-cyan-700 dark:bg-cyan-500 dark:hover:bg-cyan-600",
        )}
      >
        <AnimatePresence mode="wait">
          {isChatOpen ? (
            <motion.span
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <X size={22} />
            </motion.span>
          ) : (
            <motion.span
              key="open"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <MessageCircle size={22} />
            </motion.span>
          )}
        </AnimatePresence>

        {/* Unread badge */}
        {!isChatOpen && totalUnread > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white ring-2 ring-white dark:ring-slate-900">
            {totalUnread > 99 ? "99+" : totalUnread}
          </span>
        )}
      </button>
    </>
  );
};

export default ChatBubble;
