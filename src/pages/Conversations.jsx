import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router-dom";
import {
  MessageCircle,
  Search,
  ArrowLeft,
  Send,
  Inbox,
  CheckCheck,
  CheckCircle2,
  Archive,
  XCircle,
  Smile,
  X,
} from "lucide-react";
import EmojiPicker from "emoji-picker-react";
import { useAuth } from "../hooks/useAuth";
import { useChat } from "../contexts/ChatContext";
import { profileService } from "../services/profileService";
import { isUserOnline, getLastSeenText } from "../utils/presence";
import { cn } from "../utils/cn";
import { Badge, Spinner, StatsCardsRow, ImageViewerModal } from "../components/common";
import ChatMessage from "../components/chat/ChatMessage";

/**
 * Full-page conversations management view for the dashboard.
 * Split panel: conversation list on the left, messages on the right.
 */
const Conversations = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const {
    conversations,
    loadingConversations,
    messages,
    loadingMessages,
    activeConversationId,
    activeConversation,
    openConversation,
    sendMessage,
    goBackToList,
    chatRole,
    totalUnread,
    isRestoringConversation,
  } = useChat();

  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState("");
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [contactProfile, setContactProfile] = useState(null);
  const [contactProfiles, setContactProfiles] = useState({}); // Profiles for conversation list
  const [presenceRefresh, setPresenceRefresh] = useState(0);
  const [isScrollReady, setIsScrollReady] = useState(false);
  const [viewerImage, setViewerImage] = useState(null);
  const messagesContainerRef = useRef(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const emojiPickerRef = useRef(null);
  const scrolledConversationRef = useRef(null);
  const prevMessagesCountRef = useRef(0);

  // Generate initials (2 letters from name)
  const getInitials = useCallback((name) => {
    if (!name) return "?";
    return name
      .split(" ")
      .slice(0, 2)
      .map((word) => word.charAt(0).toUpperCase())
      .join("");
  }, []);

  // Get status badge configuration
  const getStatusConfig = useCallback(
    (status) => {
      const configs = {
        active: {
          variant: "success",
          icon: CheckCircle2,
          label: t("conversationsPage.status.active"),
        },
        archived: {
          variant: "warning",
          icon: Archive,
          label: t("conversationsPage.status.archived"),
        },
        closed: {
          variant: "secondary",
          icon: XCircle,
          label: t("conversationsPage.status.closed"),
        },
      };
      return configs[status] || configs.active;
    },
    [t],
  );

  // Focus on a specific conversation from URL param
  useEffect(() => {
    const focusId = searchParams.get("focus");
    if (focusId && !activeConversationId) {
      openConversation(focusId);
    }
  }, [searchParams, activeConversationId, openConversation]);

  // Close conversation with Escape key
  useEffect(() => {
    if (!activeConversationId) return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        goBackToList();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeConversationId, goBackToList]);

  // Auto-scroll to bottom when conversation first loads
  // Using useLayoutEffect to run synchronously after DOM mutations
  useLayoutEffect(() => {
    // Reset when no conversation
    if (!activeConversationId) {
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
      scrolledConversationRef.current = activeConversationId;
      prevMessagesCountRef.current = 0;
      return;
    }

    // Already scrolled for this conversation with same message count
    if (
      scrolledConversationRef.current === activeConversationId &&
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
        scrolledConversationRef.current = activeConversationId;
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
  }, [activeConversationId, loadingMessages, messages.length]);

  // Scroll when new messages arrive (smooth)
  useEffect(() => {
    if (!activeConversationId || messages.length === 0 || loadingMessages)
      return;

    const container = messagesContainerRef.current;
    if (container) {
      // Only scroll if near bottom (user hasn't scrolled up)
      const isNearBottom =
        container.scrollHeight - container.scrollTop - container.clientHeight <
        100;
      if (isNearBottom) {
        // Use sentinel element for reliable scroll
        const endElement = messagesEndRef.current;
        if (endElement) {
          endElement.scrollIntoView({ behavior: "smooth", block: "end" });
        } else {
          container.scrollTo({
            top: container.scrollHeight,
            behavior: "smooth",
          });
        }
      }
    }
  }, [messages, activeConversationId, loadingMessages]);

  /** Load contact user profile for presence */
  useEffect(() => {
    const contactUserId =
      chatRole === "client"
        ? activeConversation?.ownerUserId
        : activeConversation?.clientUserId;

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

    // Refresh profile every 30s for presence updates
    const interval = setInterval(fetchProfile, 30000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [chatRole, activeConversation]);

  /** Refresh presence calculation periodically */
  useEffect(() => {
    const interval = setInterval(() => {
      setPresenceRefresh((prev) => prev + 1);
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  /** Get contact user ID from a conversation */
  const getContactUserId = useCallback(
    (conv) => (chatRole === "client" ? conv.ownerUserId : conv.clientUserId),
    [chatRole],
  );

  /** Load contact profiles for conversation list avatars and presence */
  useEffect(() => {
    if (conversations.length === 0) return;

    let mounted = true;

    const fetchProfiles = async () => {
      const contactIds = [
        ...new Set(conversations.map(getContactUserId).filter(Boolean)),
      ];

      const profiles = {};
      // Load profiles in parallel (max 10 at a time)
      const chunks = [];
      for (let i = 0; i < contactIds.length; i += 10) {
        chunks.push(contactIds.slice(i, i + 10));
      }

      for (const chunk of chunks) {
        const results = await Promise.allSettled(
          chunk.map((id) => profileService.getProfile(id)),
        );
        results.forEach((result, idx) => {
          if (result.status === "fulfilled" && result.value) {
            profiles[chunk[idx]] = result.value;
          }
        });
      }

      if (mounted) setContactProfiles(profiles);
    };

    fetchProfiles();

    // Refresh profiles every 30s for presence updates
    const interval = setInterval(fetchProfiles, 30000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [conversations, getContactUserId]);

  /** Check if a contact in the list is online */
  const isListContactOnline = useCallback(
    (conv) => {
      const contactId = getContactUserId(conv);
      const profile = contactProfiles[contactId];
      return profile?.lastSeenAt ? isUserOnline(profile.lastSeenAt) : false;
    },
    [contactProfiles, getContactUserId],
  );

  /** Get avatar URL for a contact in the list */
  const getListContactAvatarUrl = useCallback(
    (conv) => {
      const contactId = getContactUserId(conv);
      const profile = contactProfiles[contactId];
      return profile?.avatarFileId
        ? profileService.getAvatarViewUrl(profile.avatarFileId)
        : "";
    },
    [contactProfiles, getContactUserId],
  );

  /* ── Filtered conversations ──────────────────────────── */

  const filtered = useMemo(() => {
    if (!search.trim()) return conversations;
    const q = search.toLowerCase();
    return conversations.filter(
      (c) =>
        (c.propertyTitle || "").toLowerCase().includes(q) ||
        (c.clientName || "").toLowerCase().includes(q) ||
        (c.ownerName || "").toLowerCase().includes(q) ||
        (c.lastMessage || "").toLowerCase().includes(q),
    );
  }, [conversations, search]);

  /* ── Summary stats ───────────────────────────────────── */

  const stats = useMemo(() => {
    const total = conversations.length;
    const active = conversations.filter((c) => c.status === "active").length;
    return [
      {
        label: t("conversationsPage.metrics.total"),
        value: total,
        icon: MessageCircle,
      },
      {
        label: t("conversationsPage.metrics.active"),
        value: active,
        icon: CheckCheck,
      },
      {
        label: t("conversationsPage.metrics.unread"),
        value: totalUnread,
        icon: Inbox,
      },
    ];
  }, [conversations, totalUnread, t]);

  /* ── Send handler ────────────────────────────────────── */

  const handleSend = async (e) => {
    e?.preventDefault();
    if (!input.trim() || sending) return;
    setSending(true);
    try {
      await sendMessage(input);
      setInput("");
    } catch {
      // handled in context
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

  /* ── Time formatter ──────────────────────────────────── */

  const formatTime = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    const now = new Date();
    const diff = now - d;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return t("chat.time.now");
    if (mins < 60) return t("chat.time.minutesAgo", { count: mins });
    const hours = Math.floor(mins / 60);
    if (hours < 24) return t("chat.time.hoursAgo", { count: hours });
    return d.toLocaleDateString();
  };

  const contactName = (conv) =>
    chatRole === "client" ? conv.ownerName : conv.clientName;

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

  /** Contact avatar URL for active conversation header */
  const contactAvatarUrl = useMemo(() => {
    const avatarFileId = contactProfile?.avatarFileId;
    if (!avatarFileId) return "";
    return profileService.getAvatarViewUrl(avatarFileId);
  }, [contactProfile]);

  /* ── Render ──────────────────────────────────────────── */

  // Show loading while restoring conversation from localStorage
  if (isRestoringConversation || (loadingConversations && conversations.length === 0)) {
    return (
      <section className="flex h-[50vh] items-center justify-center">
        <Spinner size="lg" />
      </section>
    );
  }

  return (
    <section className="space-y-5">
      {/* Page header */}
      <header>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          {t("conversationsPage.title")}
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          {t("conversationsPage.subtitle")}
        </p>
      </header>

      <StatsCardsRow items={stats} />

      {/* Split panel */}
      <div className="flex h-[calc(100vh-22rem)] min-h-100 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900 md:h-[calc(100vh-20rem)]">
        {/* ── Left: Conversation list ────────────────── */}
        <div
          className={cn(
            "flex w-full flex-col border-r border-slate-200 dark:border-slate-700 md:w-80 lg:w-96",
            activeConversationId && "hidden md:flex",
          )}
        >
          {/* Search */}
          <div className="border-b border-slate-100 px-3 py-3 dark:border-slate-800">
            <div className="relative">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                placeholder={t("chat.conversations.searchPlaceholder")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto">
            {loadingConversations && (
              <div className="flex items-center justify-center py-12">
                <Spinner size="md" />
              </div>
            )}

            {!loadingConversations && filtered.length === 0 && (
              <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
                <MessageCircle
                  size={40}
                  className="mb-3 text-slate-300 dark:text-slate-600"
                />
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {search
                    ? t("chat.conversations.noResults")
                    : t("chat.conversations.empty")}
                </p>
              </div>
            )}

            {filtered.map((conv) => {
              const unread =
                chatRole === "client"
                  ? conv.clientUnread || 0
                  : conv.ownerUnread || 0;
              const online = isListContactOnline(conv);
              const avatarUrl = getListContactAvatarUrl(conv);

              return (
                <button
                  key={conv.$id}
                  onClick={() => openConversation(conv.$id)}
                  className={cn(
                    "flex w-full items-start gap-3 border-b border-slate-100 px-4 py-3 text-left transition",
                    "hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/50",
                    conv.$id === activeConversationId &&
                      "bg-cyan-50 dark:bg-cyan-950/30",
                    unread > 0 &&
                      conv.$id !== activeConversationId &&
                      "bg-cyan-50/50 dark:bg-cyan-950/20",
                  )}
                >
                  {/* Avatar with online indicator */}
                  <div className="relative shrink-0">
                    {avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt={contactName(conv) || ""}
                        className="h-10 w-10 cursor-pointer rounded-full object-cover transition hover:opacity-80"
                        onClick={(e) => {
                          e.stopPropagation();
                          setViewerImage({ src: avatarUrl, alt: contactName(conv) });
                        }}
                      />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-linear-to-br from-cyan-500 to-blue-600 text-sm font-bold text-white">
                        {getInitials(contactName(conv))}
                      </div>
                    )}
                    {/* Online indicator dot */}
                    {online && (
                      <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-green-500 dark:border-slate-900" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={cn(
                          "truncate text-sm",
                          unread > 0
                            ? "font-semibold text-slate-900 dark:text-white"
                            : "font-medium text-slate-700 dark:text-slate-300",
                        )}
                      >
                        {contactName(conv) ||
                          t("chat.conversations.unknownUser")}
                      </span>
                      <span className="shrink-0 text-[11px] text-slate-400 dark:text-slate-500">
                        {formatTime(conv.lastMessageAt)}
                      </span>
                    </div>
                    <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">
                      {conv.propertyTitle}
                    </p>
                    <div className="mt-1 flex items-center justify-between gap-2">
                      <p
                        className={cn(
                          "truncate text-xs",
                          unread > 0
                            ? "font-medium text-slate-700 dark:text-slate-300"
                            : "text-slate-400 dark:text-slate-500",
                        )}
                      >
                        {conv.lastMessage || t("chat.conversations.noMessages")}
                      </p>
                      {unread > 0 && (
                        <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-cyan-600 px-1 text-[10px] font-bold text-white">
                          {unread > 99 ? "99+" : unread}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Right: Message view ────────────────────── */}
        <div
          className={cn(
            "flex flex-1 flex-col",
            !activeConversationId && "hidden md:flex",
          )}
        >
          {!activeConversationId ? (
            <div className="flex flex-1 flex-col items-center justify-center text-center">
              <MessageCircle
                size={48}
                className="mb-4 text-slate-200 dark:text-slate-700"
              />
              <p className="text-sm text-slate-400 dark:text-slate-500">
                {t("conversationsPage.selectConversation")}
              </p>
            </div>
          ) : (
            <>
              {/* Conversation header */}
              <header className="flex items-center gap-3 border-b border-slate-200 px-4 py-3 dark:border-slate-700">
                <button
                  onClick={goBackToList}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-600 transition hover:bg-slate-100 md:hidden dark:text-slate-400 dark:hover:bg-slate-800"
                >
                  <ArrowLeft size={18} />
                </button>
                {/* Avatar with online indicator */}
                <div className="relative shrink-0">
                  {contactAvatarUrl ? (
                    <img
                      src={contactAvatarUrl}
                      alt={contactName(activeConversation || {}) || ""}
                      className="h-8 w-8 cursor-pointer rounded-full object-cover transition hover:opacity-80"
                      onClick={() => setViewerImage({ src: contactAvatarUrl, alt: contactName(activeConversation || {}) })}
                    />
                  ) : (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-linear-to-br from-cyan-500 to-blue-600 text-xs font-bold text-white">
                      {getInitials(contactName(activeConversation || {}))}
                    </div>
                  )}
                  {/* Online indicator dot */}
                  {contactPresence?.isOnline && (
                    <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-green-500 dark:border-slate-900" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                    {contactName(activeConversation || {}) ||
                      t("chat.conversations.unknownUser")}
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
                            : "text-slate-500 dark:text-slate-400"
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
                {activeConversation?.status &&
                  (() => {
                    const statusConfig = getStatusConfig(
                      activeConversation.status,
                    );
                    return (
                      <Badge
                        variant={statusConfig.variant}
                        size="sm"
                        icon={statusConfig.icon}
                      >
                        {statusConfig.label}
                      </Badge>
                    );
                  })()}
                {/* Close conversation button */}
                <button
                  onClick={goBackToList}
                  className="hidden h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 md:flex dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-slate-300"
                  title={t("chat.actions.close")}
                >
                  <X size={18} />
                </button>
              </header>

              {/* Messages */}
              <div
                ref={messagesContainerRef}
                className="flex-1 overflow-y-auto px-4 py-3"
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
                  {messages.map((msg) => (
                    <ChatMessage
                      key={msg.$id}
                      message={msg}
                      isOwn={msg.senderUserId === user?.$id}
                    />
                  ))}
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

                <form
                  onSubmit={handleSend}
                  className="flex items-end gap-2 px-4 py-3"
                >
                  {/* Emoji Button */}
                  <button
                    type="button"
                    onClick={() => setShowEmojiPicker((prev) => !prev)}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-300"
                    aria-label={t("chat.actions.emoji")}
                  >
                    <Smile size={20} />
                  </button>

                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={t("chat.messages.inputPlaceholder")}
                    rows={1}
                    className="max-h-24 min-h-10 flex-1 resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-cyan-400"
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
            </>
          )}
        </div>
      </div>

      {/* Image Viewer Modal */}
      <ImageViewerModal
        isOpen={!!viewerImage}
        onClose={() => setViewerImage(null)}
        src={viewerImage?.src}
        alt={viewerImage?.alt || "Profile"}
        showDownload={false}
      />
    </section>
  );
};

export default Conversations;
