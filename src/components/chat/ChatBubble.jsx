import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X } from "lucide-react";
import { useChat } from "../../contexts/ChatContext";
import { cn } from "../../utils/cn";
import ChatWindow from "./ChatWindow";

/**
 * Floating chat bubble + chat window overlay.
 * Visible on all pages when user is authenticated.
 */
const ChatBubble = () => {
  const { t } = useTranslation();
  const { isChatOpen, toggleChat, totalUnread, isAuthenticated } = useChat();

  if (!isAuthenticated) return null;

  return (
    <>
      {/* ── Chat Window (animated) ───────────────────── */}
      <AnimatePresence>
        {isChatOpen && (
          <motion.div
            key="chat-window"
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className={cn(
              "fixed z-9998",
              // Mobile: full screen
              "inset-0 sm:inset-auto",
              // Desktop: anchored bottom-right
              "sm:bottom-20 sm:right-5 sm:h-130 sm:w-95",
              "sm:rounded-2xl sm:shadow-2xl",
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
          "fixed bottom-5 right-5 z-9999",
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
