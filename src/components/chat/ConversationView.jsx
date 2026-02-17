import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { ArrowLeft, Send } from "lucide-react";
import { useChat } from "../../contexts/ChatContext";
import { cn } from "../../utils/cn";
import { Spinner } from "../common";
import ChatMessage from "./ChatMessage";

/**
 * Active conversation view with message list + input.
 */
const ConversationView = () => {
  const { t } = useTranslation();
  const {
    activeConversation,
    messages,
    loadingMessages,
    sendMessage,
    goBackToList,
    closeChat,
    chatRole,
  } = useChat();

  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const contactName =
    chatRole === "client"
      ? activeConversation?.ownerName
      : activeConversation?.clientName;

  /* ── Auto-scroll to bottom ───────────────────────────── */

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages.length, scrollToBottom]);

  /* ── Send handler ────────────────────────────────────── */

  const handleSend = async (e) => {
    e?.preventDefault();
    if (!input.trim() || sending) return;

    setSending(true);
    try {
      await sendMessage(input);
      setInput("");
      inputRef.current?.focus();
    } catch (err) {
      console.error("Failed to send message:", err);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  /* ── Render ──────────────────────────────────────────── */

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <header className="flex items-center gap-3 border-b border-slate-200 px-3 py-3 dark:border-slate-700">
        <button
          onClick={goBackToList}
          aria-label={t("chat.actions.back")}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-600 transition hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
        >
          <ArrowLeft size={18} />
        </button>

        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-cyan-500 to-blue-600 text-xs font-bold text-white">
          {(contactName || "?").charAt(0).toUpperCase()}
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
            {contactName || t("chat.conversations.unknownUser")}
          </p>
          <p className="truncate text-[11px] text-slate-500 dark:text-slate-400">
            {activeConversation?.propertyTitle || ""}
          </p>
        </div>

        <button
          onClick={closeChat}
          className="text-xs text-slate-500 hover:text-slate-700 sm:hidden dark:text-slate-400 dark:hover:text-slate-200"
        >
          {t("chat.actions.close")}
        </button>
      </header>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-3 py-3">
        {loadingMessages && (
          <div className="flex items-center justify-center py-8">
            <Spinner size="sm" />
          </div>
        )}

        {!loadingMessages && messages.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-sm text-slate-400 dark:text-slate-500">
              {t("chat.messages.empty")}
            </p>
          </div>
        )}

        {messages.map((msg, idx) => {
          const prev = messages[idx - 1];
          const showDateSep = shouldShowDateSeparator(prev, msg);

          return (
            <div key={msg.$id}>
              {showDateSep && (
                <div className="my-3 flex items-center gap-3">
                  <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
                  <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500">
                    {formatDateSeparator(msg.$createdAt)}
                  </span>
                  <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
                </div>
              )}
              <ChatMessage
                message={msg}
                isOwn={
                  (msg.senderUserId === activeConversation?.clientUserId &&
                    chatRole === "client") ||
                  (msg.senderUserId === activeConversation?.ownerUserId &&
                    chatRole !== "client")
                }
              />
            </div>
          );
        })}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={handleSend}
        className="flex items-end gap-2 border-t border-slate-200 px-3 py-3 dark:border-slate-700"
      >
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t("chat.messages.inputPlaceholder")}
          rows={1}
          className={cn(
            "max-h-24 min-h-10 flex-1 resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none transition",
            "focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20",
            "dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-cyan-400",
          )}
        />
        <button
          type="submit"
          disabled={!input.trim() || sending}
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition",
            input.trim() && !sending
              ? "bg-cyan-600 text-white hover:bg-cyan-700 dark:bg-cyan-500 dark:hover:bg-cyan-600"
              : "bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-600",
          )}
        >
          {sending ? <Spinner size="xs" /> : <Send size={16} />}
        </button>
      </form>
    </div>
  );
};

/* ─── Helpers ──────────────────────────────────────────── */

function shouldShowDateSeparator(prev, current) {
  if (!prev) return true;
  const d1 = new Date(prev.$createdAt).toDateString();
  const d2 = new Date(current.$createdAt).toDateString();
  return d1 !== d2;
}

function formatDateSeparator(dateStr) {
  const d = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (d.toDateString() === today.toDateString()) return "Hoy";
  if (d.toDateString() === yesterday.toDateString()) return "Ayer";

  return d.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: d.getFullYear() !== today.getFullYear() ? "numeric" : undefined,
  });
}

export default ConversationView;
