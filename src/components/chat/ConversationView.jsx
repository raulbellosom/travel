import { useCallback, useEffect, useLayoutEffect, useRef, useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { ArrowLeft, Minimize2, Send, Smile, X } from "lucide-react";
import EmojiPicker from "emoji-picker-react";
import { useAuth } from "../../hooks/useAuth";
import { useChat } from "../../contexts/ChatContext";
import { profileService } from "../../services/profileService";
import { getConversationCounterparty } from "../../utils/chatParticipants";
import { isUserOnline, getLastSeenText } from "../../utils/presence";
import { cn } from "../../utils/cn";
import { Spinner, ImageViewerModal } from "../common";
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
  const { user } = useAuth();
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
  const [viewerImage, setViewerImage] = useState(null);
  const messagesContainerRef = useRef(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const emojiPickerRef = useRef(null);

  const contact = useMemo(
    () => getConversationCounterparty(activeConversation, user?.$id, chatRole),
    [activeConversation, chatRole, user?.$id],
  );
  const contactName = contact.name;
  const contactUserId = contact.userId;
  const ownUserId = user?.$id;

  /** Load contact user profile for avatar and presence */
  useEffect(() => {
    if (!contactUserId) {
      setContactProfile(null);
      return;
    }

    let mounted = true;

    const fetchProfile = () => {
      profileService
        .getProfile(contactUserId)
        .then((profile) => {
          if (mounted) setContactProfile(profile);
        })
        .catch(() => {
          if (mounted) setContactProfile(null);
        });
    };

    // Initial load
    fetchProfile();

    // Refresh profile every 30s to get updated lastSeenAt for presence
    const interval = setInterval(fetchProfile, 30000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [contactUserId]);

  /** Contact avatar URL from loaded profile */
  const contactAvatarUrl = useMemo(() => {
    const avatarFileId = contactProfile?.avatarFileId;
    if (!avatarFileId) return "";
    return profileService.getAvatarViewUrl(avatarFileId);
  }, [contactProfile]);

  const ownAvatarUrl = useMemo(() => {
    const avatarFileId = user?.avatarFileId;
    if (!avatarFileId) return "";
    return profileService.getAvatarViewUrl(avatarFileId);
  }, [user?.avatarFileId]);

  const lastOwnMessageId = useMemo(() => {
    if (!ownUserId) return null;
    for (let i = messages.length - 1; i >= 0; i -= 1) {
      if (messages[i].senderUserId === ownUserId) {
        return messages[i].$id;
      }
    }
    return null;
  }, [messages, ownUserId]);

  /** Contact presence status */
  const contactPresence = useMemo(() => {
    const lastSeenAt = contactProfile?.lastSeenAt;
    if (!lastSeenAt) return null;
    void presenceRefresh;

    return {
      isOnline: isUserOnline(lastSeenAt),
      text: getLastSeenText(lastSeenAt, t),
    };
  }, [contactProfile?.lastSeenAt, t, presenceRefresh]);

  /** Refresh presence calculation periodically in addition to profile polling */
  useEffect(() => {
    // This ensures UI updates even between profile fetches
    const interval = setInterval(() => {
      setPresenceRefresh((prev) => prev + 1);
    }, 30000); // 30 seconds

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
  // Track messages count to detect when messages are fully loaded
  const prevMessagesCountRef = useRef(0);

  // Scroll to bottom when conversation first loads (instant, no smooth)
  // Using useLayoutEffect to run synchronously after DOM mutations
  useLayoutEffect(() => {
    // Reset when conversation changes
    if (!activeConversation?.$id) {
      setIsScrollReady(false);
      scrolledConversationRef.current = null;
      prevMessagesCountRef.current = 0;
      return;
    }

    // Still loading - wait
    if (loadingMessages) {
      setIsScrollReady(false);
      return;
    }

    // No messages yet but not loading - show empty state
    if (messages.length === 0) {
      setIsScrollReady(true);
      scrolledConversationRef.current = activeConversation.$id;
      prevMessagesCountRef.current = 0;
      return;
    }

    // Already scrolled for this conversation with same message count
    if (
      scrolledConversationRef.current === activeConversation.$id &&
      prevMessagesCountRef.current === messages.length
    ) {
      return;
    }

    // New conversation or messages just loaded - need to scroll
    let cancelled = false;
    let timeoutId;
    let frameId;
    let retryCount = 0;
    const maxRetries = 30; // ~500ms max wait at 60fps

    const performScroll = () => {
      if (cancelled) return;

      const container = messagesContainerRef.current;
      const endElement = messagesEndRef.current;

      // Check if content is ready:
      // 1. Sentinel element exists in DOM (React rendered messages)
      // 2. Or container has some scroll height
      // 3. Or we've retried enough times (fallback)
      const contentReady =
        endElement ||
        (container && container.scrollHeight > 0) ||
        retryCount >= maxRetries;

      if (contentReady && container) {
        // Scroll to bottom
        if (endElement) {
          endElement.scrollIntoView({ behavior: "instant", block: "end" });
        } else {
          container.scrollTop = container.scrollHeight;
        }

        setIsScrollReady(true);
        scrolledConversationRef.current = activeConversation.$id;
        prevMessagesCountRef.current = messages.length;
      } else {
        // Content not ready yet, try again in next frame
        retryCount++;
        frameId = requestAnimationFrame(performScroll);
      }
    };

    // Start after a microtask to let React fully commit
    timeoutId = setTimeout(() => {
      frameId = requestAnimationFrame(performScroll);
    }, 0);

    return () => {
      cancelled = true;
      if (timeoutId) clearTimeout(timeoutId);
      if (frameId) cancelAnimationFrame(frameId);
    };
  }, [activeConversation?.$id, messages.length, loadingMessages]);

  // Scroll to bottom when new messages arrive (smooth).
  // Always follows own sends; follows incoming only if user is near the bottom.
  useEffect(() => {
    if (messages.length === 0 || loadingMessages) return;

    const container = messagesContainerRef.current;
    if (!container) return;

    const lastMessage = messages[messages.length - 1];
    const isOwnLast = lastMessage?.senderUserId === ownUserId;
    const isNearBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight <
      100;

    if (isOwnLast || isNearBottom) {
      scrollToBottom(true);
    }
  }, [messages, loadingMessages, ownUserId, scrollToBottom]);

  /* ── Send handler ────────────────────────────────────── */

  const handleSend = async (e) => {
    e?.preventDefault();
    const text = input.trim();
    if (!text || sending) return;

    setInput("");
    setShowEmojiPicker(false);
    setSending(true);
    try {
      await sendMessage(text);
      inputRef.current?.focus();
    } catch (err) {
      setInput(text);
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
  };

  const toggleEmojiPicker = () => {
    setShowEmojiPicker((prev) => {
      const next = !prev;
      if (next) {
        inputRef.current?.blur();
      }
      return next;
    });
  };

  /* ── Render ──────────────────────────────────────────── */

  return (
    <div className="flex h-full flex-col">
      {/* Header - fixed height for consistent transitions */}
      <header className="flex h-14 shrink-0 items-center gap-3 border-b border-slate-200 px-3 dark:border-slate-700">
        <button
          onClick={goBackToList}
          aria-label={t("chat.actions.back")}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-600 transition hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
        >
          <ArrowLeft size={18} />
        </button>

        {/* Contact avatar with online indicator */}
        <div className="relative shrink-0">
          {contactAvatarUrl ? (
            <img
              src={contactAvatarUrl}
              alt={contactName || ""}
              className="h-8 w-8 cursor-pointer rounded-full object-cover transition hover:opacity-80"
              onClick={() => setViewerImage({ src: contactAvatarUrl, alt: contactName })}
            />
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-linear-to-br from-cyan-500 to-blue-600 text-xs font-bold text-white">
              {getInitials(contactName)}
            </div>
          )}
          {/* Online indicator dot */}
          {contactPresence?.isOnline && (
            <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-green-500 dark:border-slate-900" />
          )}
        </div>

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

        {/* Minimize button - icon on desktop, X on mobile */}
        <button
          onClick={toggleChat}
          className="hidden rounded p-1 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 lg:block dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          title={t("chat.bubble.close")}
        >
          <Minimize2 size={16} />
        </button>
        <button
          onClick={toggleChat}
          className="rounded p-1 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 lg:hidden dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          title={t("chat.bubble.close")}
        >
          <X size={20} />
        </button>
      </header>

      {/* Messages area */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto overscroll-contain px-3 py-3"
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
                isOwn={msg.senderUserId === ownUserId}
                showOwnAvatar={msg.$id === lastOwnMessageId}
                ownAvatarUrl={ownAvatarUrl}
                ownAvatarLabel={user?.name || user?.email || "Me"}
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
              autoFocusSearch={false}
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
            onClick={toggleEmojiPicker}
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

      {/* Image Viewer Modal */}
      <ImageViewerModal
        isOpen={!!viewerImage}
        onClose={() => setViewerImage(null)}
        src={viewerImage?.src}
        alt={viewerImage?.alt || "Profile"}
        showDownload={false}
      />
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
