import { useCallback, useEffect, useRef, useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { ArrowLeft, Minimize2, Send, Smile } from "lucide-react";
import EmojiPicker from "emoji-picker-react";
import { useChat } from "../../contexts/ChatContext";
import { profileService } from "../../services/profileService";
import { isUserOnline, getLastSeenText } from "../../utils/presence";
import { cn } from "../../utils/cn";
import { Spinner } from "../common";
import ChatMessage from "./ChatMessage";

/**
 * Get 2-letter initials from a name.
 * @param {string} name - Full name
 * @returns {string} 2 uppercase initials
 */
const getInitials = (name) => {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }
  return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
};

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
    toggleChat,
    chatRole,
  } = useChat();

  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [contactProfile, setContactProfile] = useState(null);
  const [presenceRefresh, setPresenceRefresh] = useState(0); // Trigger to refresh presence text
  const [isScrollReady, setIsScrollReady] = useState(false);
  const messagesContainerRef = useRef(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const emojiPickerRef = useRef(null);

  const contactName =
    chatRole === "client"
      ? activeConversation?.ownerName
      : activeConversation?.clientName;

  const contactUserId =
    chatRole === "client"
      ? activeConversation?.ownerUserId
      : activeConversation?.clientUserId;

  /** Load contact user profile for avatar */
  useEffect(() => {
    if (!contactUserId) {
      setContactProfile(null);
      return;
    }

    let mounted = true;
    profileService
      .getProfile(contactUserId)
      .then((profile) => {
        if (mounted) setContactProfile(profile);
      })
      .catch(() => {
        if (mounted) setContactProfile(null);
      });

    return () => {
      mounted = false;
    };
  }, [contactUserId]);

  /** Contact avatar URL from loaded profile */
  const contactAvatarUrl = useMemo(() => {
    const avatarFileId = contactProfile?.avatarFileId;
    if (!avatarFileId) return "";
    return profileService.getAvatarViewUrl(avatarFileId);
  }, [contactProfile]);

  /** Contact presence status */
  const contactPresence = useMemo(() => {
    const lastSeenAt = contactProfile?.lastSeenAt;
    if (!lastSeenAt) return null;

    return {
      isOnline: isUserOnline(lastSeenAt),
      text: getLastSeenText(lastSeenAt, t),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contactProfile?.lastSeenAt, t, presenceRefresh]);

  /** Refresh presence text every minute */
  useEffect(() => {
    const interval = setInterval(() => {
      setPresenceRefresh((prev) => prev + 1);
    }, 60000); // 60 seconds

    return () => clearInterval(interval);
  }, []);

  /* ── Auto-resize textarea ────────────────────────────── */

  useEffect(() => {
    const textarea = inputRef.current;
    if (!textarea) return;

    // Reset height to auto to get correct scrollHeight
    textarea.style.height = "auto";

    // Calculate new height (max 4 rows ~96px)
    const newHeight = Math.min(textarea.scrollHeight, 96);
    textarea.style.height = `${newHeight}px`;
  }, [input]);

  /* ── Close emoji picker when clicking outside ─────────── */

  useEffect(() => {
    if (!showEmojiPicker) return;
    const handleClickOutside = (e) => {
      if (
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(e.target)
      ) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showEmojiPicker]);

  /* ── Auto-scroll to bottom ───────────────────────────── */

  const scrollToBottom = useCallback((smooth = true) => {
    // Use the sentinel element for more reliable scrolling
    const endElement = messagesEndRef.current;
    if (endElement) {
      endElement.scrollIntoView({ behavior: smooth ? "smooth" : "instant", block: "end" });
      return;
    }

    // Fallback to container scroll
    const container = messagesContainerRef.current;
    if (!container) return;

    if (smooth) {
      container.scrollTo({
        top: container.scrollHeight,
        behavior: "smooth",
      });
    } else {
      container.scrollTop = container.scrollHeight;
    }
  }, []);

  // Track which conversation we've scrolled for
  const scrolledConversationRef = useRef(null);

  // Scroll to bottom when conversation first loads (instant, no smooth)
  useEffect(() => {
    // Reset when conversation changes
    if (!activeConversation?.$id) {
      setIsScrollReady(false);
      scrolledConversationRef.current = null;
      return;
    }

    // Already scrolled for this conversation
    if (scrolledConversationRef.current === activeConversation.$id) {
      return;
    }

    // Wait for messages to load
    if (loadingMessages) {
      setIsScrollReady(false);
      return;
    }

    // No messages yet but not loading - show empty state
    if (messages.length === 0) {
      setIsScrollReady(true);
      scrolledConversationRef.current = activeConversation.$id;
      return;
    }

    // Wait for DOM to render, then scroll to bottom
    // Use multiple animation frames to ensure content is fully painted
    let frameId1, frameId2, frameId3;
    let cancelled = false;

    const doScroll = () => {
      // First frame: React has committed
      frameId1 = requestAnimationFrame(() => {
        if (cancelled) return;
        // Second frame: browser has painted
        frameId2 = requestAnimationFrame(() => {
          if (cancelled) return;
          // Third frame: extra safety for complex renders
          frameId3 = requestAnimationFrame(() => {
            if (cancelled) return;
            
            // Use sentinel element for reliable scroll
            const endElement = messagesEndRef.current;
            if (endElement) {
              endElement.scrollIntoView({ behavior: "instant", block: "end" });
            } else {
              // Fallback
              const container = messagesContainerRef.current;
              if (container) {
                container.scrollTop = container.scrollHeight;
              }
            }
            
            setIsScrollReady(true);
            scrolledConversationRef.current = activeConversation.$id;
          });
        });
      });
    };

    // Start scrolling immediately after state update
    doScroll();

    return () => {
      cancelled = true;
      if (frameId1) cancelAnimationFrame(frameId1);
      if (frameId2) cancelAnimationFrame(frameId2);
      if (frameId3) cancelAnimationFrame(frameId3);
    };
  }, [
    activeConversation?.$id,
    messages.length,
    loadingMessages,
  ]);

  // Scroll to bottom when new messages arrive (smooth)
  useEffect(() => {
    if (messages.length > 0 && sending) {
      scrollToBottom(true);
    }
  }, [messages.length, sending, scrollToBottom]);

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

  const handleEmojiClick = (emojiObject) => {
    setInput((prev) => prev + emojiObject.emoji);
    inputRef.current?.focus();
  };

  /* ── Render ──────────────────────────────────────────── */

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <header className="flex items-center gap-3 border-b border-slate-200 px-3 py-3 dark:border-slate-700">
        <button
          onClick={() => {
            console.log("[ConversationView] goBackToList clicked");
            goBackToList();
          }}
          aria-label={t("chat.actions.back")}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-600 transition hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
        >
          <ArrowLeft size={18} />
        </button>

        {/* Contact avatar */}
        {contactAvatarUrl ? (
          <img
            src={contactAvatarUrl}
            alt={contactName || ""}
            className="h-8 w-8 shrink-0 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-cyan-500 to-blue-600 text-xs font-bold text-white">
            {getInitials(contactName)}
          </div>
        )}

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
            {contactName || t("chat.conversations.unknownUser")}
          </p>
          {contactPresence && (
            <div className="flex items-center gap-1.5 text-[11px]">
              {contactPresence.isOnline && (
                <span className="h-2 w-2 rounded-full bg-green-500" />
              )}
              <span
                className={cn(
                  contactPresence.isOnline
                    ? "text-green-600 dark:text-green-400"
                    : "text-slate-500 dark:text-slate-400",
                )}
              >
                {contactPresence.text}
              </span>
            </div>
          )}
          {!contactPresence && activeConversation?.propertyTitle && (
            <p className="truncate text-[11px] text-slate-500 dark:text-slate-400">
              {activeConversation.propertyTitle}
            </p>
          )}
        </div>

        {/* Minimize button - icon on desktop, text on mobile */}
        <button
          onClick={toggleChat}
          className="hidden rounded p-1 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 lg:block dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          title={t("chat.bubble.close")}
        >
          <Minimize2 size={16} />
        </button>
        <button
          onClick={toggleChat}
          className="text-xs text-slate-500 hover:text-slate-700 lg:hidden dark:text-slate-400 dark:hover:text-slate-200"
        >
          {t("chat.actions.close")}
        </button>
      </header>

      {/* Messages area */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto px-3 py-3"
      >
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

        <div className={!isScrollReady && messages.length > 0 ? "opacity-0" : "opacity-100"}>
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
          {/* Sentinel element for reliable scroll to bottom */}
          <div ref={messagesEndRef} aria-hidden="true" />
        </div>
      </div>

      {/* Input */}
      <div className="relative border-t border-slate-200 dark:border-slate-700">
        {/* Emoji Picker */}
        {showEmojiPicker && (
          <div
            ref={emojiPickerRef}
            className="absolute bottom-full left-3 mb-2 z-50"
          >
            <EmojiPicker
              onEmojiClick={handleEmojiClick}
              theme="auto"
              searchDisabled={false}
              skinTonesDisabled
              previewConfig={{ showPreview: false }}
              height={350}
              width={320}
            />
          </div>
        )}

        <form onSubmit={handleSend} className="flex items-end gap-2 px-3 py-3">
          {/* Emoji Button */}
          <button
            type="button"
            onClick={() => setShowEmojiPicker((prev) => !prev)}
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition",
              showEmojiPicker
                ? "bg-cyan-100 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-400"
                : "text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-slate-300",
            )}
            aria-label="Emojis"
          >
            <Smile size={20} />
          </button>

          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t("chat.messages.inputPlaceholder")}
            className={cn(
              "min-h-10 flex-1 resize-none overflow-y-auto rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none transition",
              "focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20",
              "dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-cyan-400",
            )}
            style={{ maxHeight: "96px" }}
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
