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
  UserPlus,
  Smile,
  X,
  Archive,
  CheckCircle2,
  RotateCcw,
} from "lucide-react";
import EmojiPicker from "emoji-picker-react";
import { useAuth } from "../hooks/useAuth";
import { useChatPresence } from "../hooks/useChatPresence";
import { useChat } from "../contexts/ChatContext";
import { profileService } from "../services/profileService";
import {
  getConversationCounterparty,
  getConversationUnreadCount,
} from "../utils/chatParticipants";
import { isInternalRole } from "../utils/roles";
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
    startDirectConversation,
    internalChatUsers,
    loadingInternalChatUsers,
    loadInternalChatUsers,
    goBackToList,
    chatRole,
    totalUnread,
    isRestoringConversation,
    isUserRecentlyActive,
    updateConversationStatus,
    canWriteMessaging,
  } = useChat();

  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState("");
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showNewConversationModal, setShowNewConversationModal] = useState(false);
  const [newConversationSearch, setNewConversationSearch] = useState("");
  const [startingDirectConversationFor, setStartingDirectConversationFor] = useState("");
  const [statusMutation, setStatusMutation] = useState({
    conversationId: "",
    status: "",
  });
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

  const getConversationContact = useCallback(
    (conversation) =>
      getConversationCounterparty(conversation, user?.$id, chatRole),
    [chatRole, user?.$id],
  );

  const getContactUserId = useCallback(
    (conversation) => getConversationContact(conversation).userId,
    [getConversationContact],
  );

  const getContactName = useCallback(
    (conversation) => getConversationContact(conversation).name,
    [getConversationContact],
  );

  const getConversationUnread = useCallback(
    (conversation) =>
      getConversationUnreadCount(conversation, user?.$id, chatRole),
    [chatRole, user?.$id],
  );

  const getInternalUserDisplayName = useCallback(
    (staffUser) => {
      const fullName = `${staffUser?.firstName || ""} ${staffUser?.lastName || ""}`.trim();
      return (
        fullName ||
        String(staffUser?.name || "").trim() ||
        String(staffUser?.email || "").trim() ||
        t("chat.conversations.unknownUser")
      );
    },
    [t],
  );

  const getConversationStatusConfig = useCallback(
    (status) => {
      const normalizedStatus = String(status || "active").toLowerCase();
      if (normalizedStatus === "archived") {
        return {
          variant: "warning",
          label: t("conversationsPage.status.archived"),
        };
      }
      if (normalizedStatus === "closed") {
        return {
          variant: "secondary",
          label: t("conversationsPage.status.closed"),
        };
      }
      return {
        variant: "success",
        label: t("conversationsPage.status.active"),
      };
    },
    [t],
  );

  const activeConversationStatus = String(
    activeConversation?.status || "active",
  )
    .trim()
    .toLowerCase();
  const isConversationClosed = activeConversationStatus === "closed";
  const canManageConversationStatus = isInternalRole(user?.role);
  const isUpdatingActiveConversationStatus =
    statusMutation.conversationId === activeConversation?.$id;

  // Focus on a specific conversation from URL param
  useEffect(() => {
    const focusId = searchParams.get("focus");
    if (focusId && !activeConversationId) {
      openConversation(focusId, { openChatBubble: false });
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
      const lastMessage = messages[messages.length - 1];
      const isOwnLast = lastMessage?.senderUserId === user?.$id;

      // Keep auto-follow for own sends; for incoming only if user is near bottom.
      const isNearBottom =
        container.scrollHeight - container.scrollTop - container.clientHeight <
        100;
      if (isNearBottom || isOwnLast) {
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
  }, [messages, activeConversationId, loadingMessages, user?.$id]);

  const activeContactUserId = useMemo(
    () => getContactUserId(activeConversation),
    [activeConversation, getContactUserId],
  );

  const presenceUserIds = useMemo(() => {
    const contactIds = conversations
      .map(getContactUserId)
      .filter((id) => id && id !== user?.$id);
    if (activeContactUserId && activeContactUserId !== user?.$id) {
      contactIds.push(activeContactUserId);
    }
    return Array.from(new Set(contactIds));
  }, [activeContactUserId, conversations, getContactUserId, user?.$id]);

  const { profilesById: contactProfiles } = useChatPresence(presenceUserIds);
  const contactProfile = activeContactUserId
    ? contactProfiles[activeContactUserId]
    : null;

  /** Check if a contact in the list is online */
  const isListContactOnline = useCallback(
    (conv) => {
      const contactId = getContactUserId(conv);
      const profile = contactProfiles[contactId];
      if (profile?.lastSeenAt && isUserOnline(profile.lastSeenAt)) {
        return true;
      }
      return isUserRecentlyActive(contactId);
    },
    [contactProfiles, getContactUserId, isUserRecentlyActive],
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
        (c.resourceTitle || "").toLowerCase().includes(q) ||
        (c.clientName || "").toLowerCase().includes(q) ||
        (c.ownerName || "").toLowerCase().includes(q) ||
      (c.lastMessage || "").toLowerCase().includes(q),
    );
  }, [conversations, search]);

  const filteredInternalChatUsers = useMemo(() => {
    const q = newConversationSearch.trim().toLowerCase();
    if (!q) return internalChatUsers;
    return internalChatUsers.filter((staffUser) => {
      const fullName = getInternalUserDisplayName(staffUser).toLowerCase();
      const email = String(staffUser?.email || "").toLowerCase();
      return fullName.includes(q) || email.includes(q);
    });
  }, [internalChatUsers, newConversationSearch, getInternalUserDisplayName]);

  const openNewConversationModal = useCallback(() => {
    if (!canWriteMessaging) return;
    setShowNewConversationModal(true);
    setNewConversationSearch("");
    loadInternalChatUsers();
  }, [canWriteMessaging, loadInternalChatUsers]);

  const closeNewConversationModal = useCallback(() => {
    setShowNewConversationModal(false);
    setNewConversationSearch("");
    setStartingDirectConversationFor("");
  }, []);

  const handleStartDirectConversation = useCallback(
    async (staffUser) => {
      if (!canWriteMessaging) return;
      const targetUserId = String(staffUser?.$id || "").trim();
      if (!targetUserId || startingDirectConversationFor) return;

      setStartingDirectConversationFor(targetUserId);
      try {
        await startDirectConversation({
          targetUserId,
          targetName: getInternalUserDisplayName(staffUser),
        });
        closeNewConversationModal();
      } catch (err) {
        console.error("Failed to start direct conversation:", err);
      } finally {
        setStartingDirectConversationFor("");
      }
    },
    [
      closeNewConversationModal,
      canWriteMessaging,
      getInternalUserDisplayName,
      startDirectConversation,
      startingDirectConversationFor,
    ],
  );

  const handleConversationStatusChange = useCallback(
    async (nextStatus) => {
      if (!canWriteMessaging) return;
      const conversationId = String(activeConversation?.$id || "").trim();
      const normalizedNextStatus = String(nextStatus || "").trim().toLowerCase();
      const currentStatus = String(activeConversation?.status || "active")
        .trim()
        .toLowerCase();

      if (!conversationId || !normalizedNextStatus) return;
      if (normalizedNextStatus === currentStatus) return;
      if (statusMutation.conversationId === conversationId) return;

      setStatusMutation({
        conversationId,
        status: normalizedNextStatus,
      });

      try {
        await updateConversationStatus(conversationId, normalizedNextStatus);
      } catch (err) {
        console.error("Failed to update conversation status:", err);
      } finally {
        setStatusMutation({
          conversationId: "",
          status: "",
        });
      }
    },
    [
      activeConversation?.$id,
      activeConversation?.status,
      canWriteMessaging,
      statusMutation.conversationId,
      updateConversationStatus,
    ],
  );

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
    const text = input.trim();
    if (!canWriteMessaging || !text || sending || isConversationClosed) return;
    setInput("");
    setShowEmojiPicker(false);
    setSending(true);
    try {
      await sendMessage(text);
      inputRef.current?.focus();
    } catch {
      setInput(text);
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
  };

  const toggleEmojiPicker = () => {
    if (isConversationClosed || !canWriteMessaging) return;
    setShowEmojiPicker((prev) => {
      const next = !prev;
      if (next) inputRef.current?.blur();
      return next;
    });
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

  const contactName = getContactName;

  /** Contact presence status */
  const contactPresence = (() => {
    const lastSeenAt = contactProfile?.lastSeenAt;
    const recentlyActive = isUserRecentlyActive(activeContactUserId);

    if (lastSeenAt && isUserOnline(lastSeenAt)) {
      return {
        isOnline: true,
        text: t("chat.presence.active"),
      };
    }

    if (recentlyActive) {
      return {
        isOnline: true,
        text: t("chat.presence.active"),
      };
    }

    if (!lastSeenAt) {
      return {
        isOnline: false,
        text: t("chat.presence.inactive"),
      };
    }

    return {
      isOnline: false,
      text: getLastSeenText(lastSeenAt, t),
    };
  })();

  /** Contact avatar URL for active conversation header */
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
    if (!user?.$id) return null;
    for (let i = messages.length - 1; i >= 0; i -= 1) {
      if (messages[i].senderUserId === user.$id) {
        return messages[i].$id;
      }
    }
    return null;
  }, [messages, user?.$id]);

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
          {chatRole === "owner" && (
            <div className="border-b border-slate-100 px-3 py-3 dark:border-slate-800">
              <button
                type="button"
                onClick={openNewConversationModal}
                disabled={!canWriteMessaging}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-cyan-200 bg-cyan-50 px-3 py-2 text-sm font-semibold text-cyan-700 transition hover:bg-cyan-100 dark:border-cyan-900/50 dark:bg-cyan-950/30 dark:text-cyan-300 dark:hover:bg-cyan-950/50"
              >
                <UserPlus size={16} />
                {t("conversationsPage.actions.newConversation")}
              </button>
            </div>
          )}

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
              const unread = getConversationUnread(conv);
              const online = isListContactOnline(conv);
              const avatarUrl = getListContactAvatarUrl(conv);

              return (
                <button
                  key={conv.$id}
                  onClick={() =>
                    openConversation(conv.$id, { openChatBubble: false })
                  }
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
                        role="button"
                        tabIndex={0}
                        className="h-10 w-10 cursor-pointer rounded-full object-cover transition hover:opacity-80"
                        onClick={(e) => {
                          e.stopPropagation();
                          setViewerImage({ src: avatarUrl, alt: contactName(conv) });
                        }}
                        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.stopPropagation(); setViewerImage({ src: avatarUrl, alt: contactName(conv) }); } }}
                      />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-linear-to-br from-cyan-500 to-blue-600 text-sm font-bold text-white">
                        {getInitials(contactName(conv))}
                      </div>
                    )}
                    {/* Presence indicator dot */}
                    <span
                      className={cn(
                        "absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white dark:border-slate-900",
                        online
                          ? "bg-green-500"
                          : "bg-slate-300 dark:bg-slate-600",
                      )}
                    />
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
                      {conv.resourceTitle || conv.propertyTitle}
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
                      role="button"
                      tabIndex={0}
                      className="h-8 w-8 cursor-pointer rounded-full object-cover transition hover:opacity-80"
                      onClick={() => setViewerImage({ src: contactAvatarUrl, alt: contactName(activeConversation || {}) })}
                      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setViewerImage({ src: contactAvatarUrl, alt: contactName(activeConversation || {}) }); }}
                    />
                  ) : (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-linear-to-br from-cyan-500 to-blue-600 text-xs font-bold text-white">
                      {getInitials(contactName(activeConversation || {}))}
                    </div>
                  )}
                  {/* Presence indicator dot */}
                  <span
                    className={cn(
                      "absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white dark:border-slate-900",
                      contactPresence.isOnline
                        ? "bg-green-500"
                        : "bg-slate-300 dark:bg-slate-600",
                    )}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                    {contactName(activeConversation || {}) ||
                      t("chat.conversations.unknownUser")}
                  </p>
                  <div className="flex items-center gap-1.5 text-[11px]">
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
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant={getConversationStatusConfig(activeConversation?.status).variant}
                    size="sm"
                  >
                    {getConversationStatusConfig(activeConversation?.status).label}
                  </Badge>

                  {canManageConversationStatus && activeConversation?.$id && (
                    <div className="hidden items-center gap-1 sm:flex">
                      {activeConversationStatus !== "active" && (
                        <button
                          type="button"
                          onClick={() => handleConversationStatusChange("active")}
                          disabled={
                            !canWriteMessaging || isUpdatingActiveConversationStatus
                          }
                          className="inline-flex h-8 items-center gap-1 rounded-lg border border-green-200 bg-green-50 px-2 text-xs font-medium text-green-700 transition hover:bg-green-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-green-900/60 dark:bg-green-900/25 dark:text-green-300 dark:hover:bg-green-900/35"
                          title={t("conversationsPage.actions.markActive")}
                        >
                          {statusMutation.status === "active" ? (
                            <Spinner size="xs" />
                          ) : (
                            <RotateCcw size={12} />
                          )}
                          {t("conversationsPage.actions.markActive")}
                        </button>
                      )}

                      {activeConversationStatus !== "archived" && (
                        <button
                          type="button"
                          onClick={() => handleConversationStatusChange("archived")}
                          disabled={
                            !canWriteMessaging || isUpdatingActiveConversationStatus
                          }
                          className="inline-flex h-8 items-center gap-1 rounded-lg border border-amber-200 bg-amber-50 px-2 text-xs font-medium text-amber-700 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-amber-900/60 dark:bg-amber-900/25 dark:text-amber-300 dark:hover:bg-amber-900/35"
                          title={t("conversationsPage.actions.archive")}
                        >
                          {statusMutation.status === "archived" ? (
                            <Spinner size="xs" />
                          ) : (
                            <Archive size={12} />
                          )}
                          {t("conversationsPage.actions.archive")}
                        </button>
                      )}

                      {activeConversationStatus !== "closed" && (
                        <button
                          type="button"
                          onClick={() => handleConversationStatusChange("closed")}
                          disabled={
                            !canWriteMessaging || isUpdatingActiveConversationStatus
                          }
                          className="inline-flex h-8 items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-2 text-xs font-medium text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-red-900/60 dark:bg-red-900/25 dark:text-red-300 dark:hover:bg-red-900/35"
                          title={t("conversationsPage.actions.closeConversation")}
                        >
                          {statusMutation.status === "closed" ? (
                            <Spinner size="xs" />
                          ) : (
                            <CheckCircle2 size={12} />
                          )}
                          {t("conversationsPage.actions.closeConversation")}
                        </button>
                      )}
                    </div>
                  )}

                  {/* Close conversation panel button */}
                  <button
                    onClick={goBackToList}
                    className="hidden h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 md:flex dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-slate-300"
                    title={t("chat.actions.close")}
                  >
                    <X size={18} />
                  </button>
                </div>
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
                      showOwnAvatar={msg.$id === lastOwnMessageId}
                      ownAvatarUrl={ownAvatarUrl}
                      ownAvatarLabel={user?.name || user?.email || "Me"}
                    />
                  ))}
                  {/* Sentinel element for reliable scroll to bottom */}
                  <div ref={messagesEndRef} aria-hidden="true" />
                </div>
              </div>

              {/* Input */}
              <div className="relative border-t border-slate-200 dark:border-slate-700">
                {/* Emoji Picker */}
                {!isConversationClosed && canWriteMessaging && showEmojiPicker && (
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

                <form
                  onSubmit={handleSend}
                  className="flex items-end gap-2 px-4 py-3"
                >
                  {/* Emoji Button */}
                  <button
                    type="button"
                    onClick={toggleEmojiPicker}
                    disabled={isConversationClosed || !canWriteMessaging}
                    className={cn(
                      "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition",
                      isConversationClosed || !canWriteMessaging
                        ? "cursor-not-allowed text-slate-300 dark:text-slate-600"
                        : "text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-300",
                    )}
                    aria-label={t("chat.actions.emoji")}
                  >
                    <Smile size={20} />
                  </button>

                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={
                      isConversationClosed || !canWriteMessaging
                        ? t("chat.messages.closedInputPlaceholder")
                        : t("chat.messages.inputPlaceholder")
                    }
                    rows={1}
                    disabled={isConversationClosed || !canWriteMessaging}
                    className={cn(
                      "max-h-24 min-h-10 flex-1 resize-none rounded-xl border px-3 py-2.5 text-sm outline-none transition",
                      isConversationClosed || !canWriteMessaging
                        ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-500"
                        : "border-slate-200 bg-slate-50 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-cyan-400",
                    )}
                  />
                  <button
                    type="submit"
                    disabled={
                      !canWriteMessaging ||
                      !input.trim() ||
                      sending ||
                      isConversationClosed
                    }
                    className={cn(
                      "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition",
                      input.trim() &&
                        !sending &&
                        !isConversationClosed &&
                        canWriteMessaging
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

      {showNewConversationModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-700">
              <div>
                <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                  {t("conversationsPage.newConversation.title")}
                </h2>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                  {t("conversationsPage.newConversation.subtitle")}
                </p>
              </div>
              <button
                type="button"
                onClick={closeNewConversationModal}
                className="rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                aria-label={t("chat.actions.close")}
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 p-4">
              <div className="relative">
                <Search
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="text"
                  value={newConversationSearch}
                  onChange={(e) => setNewConversationSearch(e.target.value)}
                  placeholder={t("conversationsPage.newConversation.searchPlaceholder")}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div className="max-h-80 overflow-y-auto rounded-lg border border-slate-100 dark:border-slate-800">
                {loadingInternalChatUsers && (
                  <div className="flex items-center justify-center py-8">
                    <Spinner size="sm" />
                  </div>
                )}

                {!loadingInternalChatUsers &&
                  filteredInternalChatUsers.length === 0 && (
                    <div className="px-4 py-8 text-center text-sm text-slate-500 dark:text-slate-400">
                      {t("conversationsPage.newConversation.empty")}
                    </div>
                  )}

                {!loadingInternalChatUsers &&
                  filteredInternalChatUsers.map((staffUser) => {
                    const fullName = getInternalUserDisplayName(staffUser);
                    const roleLabel = String(staffUser?.role || "")
                      .replaceAll("_", " ")
                      .trim();
                    const avatarUrl = staffUser?.avatarFileId
                      ? profileService.getAvatarViewUrl(staffUser.avatarFileId)
                      : "";
                    const isStarting =
                      startingDirectConversationFor === staffUser.$id;

                    return (
                      <button
                        key={staffUser.$id}
                        type="button"
                        onClick={() => handleStartDirectConversation(staffUser)}
                        disabled={Boolean(startingDirectConversationFor)}
                        className="flex w-full items-center gap-3 border-b border-slate-100 px-4 py-3 text-left transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-800 dark:hover:bg-slate-800/50"
                      >
                        {avatarUrl ? (
                          <img
                            src={avatarUrl}
                            alt={fullName}
                            className="h-10 w-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-linear-to-br from-cyan-500 to-blue-600 text-xs font-bold text-white">
                            {getInitials(fullName)}
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-slate-900 dark:text-white">
                            {fullName}
                          </p>
                          <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                            {staffUser?.email || roleLabel}
                          </p>
                        </div>
                        {isStarting && <Spinner size="xs" />}
                      </button>
                    );
                  })}
              </div>
            </div>
          </div>
        </div>
      )}

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
