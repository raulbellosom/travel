import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { ExternalLink, MessageCircle, Search, Minimize2, X } from "lucide-react";
import { useState, useMemo, useCallback } from "react";
import { useAuth } from "../../hooks/useAuth";
import { useChatPresence } from "../../hooks/useChatPresence";
import { useChat } from "../../contexts/ChatContext";
import { profileService } from "../../services/profileService";
import { getConversationsRoute } from "../../utils/internalRoutes";
import {
  getConversationCounterparty,
  getConversationUnreadCount,
} from "../../utils/chatParticipants";
import { isUserOnline } from "../../utils/presence";
import { cn } from "../../utils/cn";
import { Spinner, ImageViewerModal } from "../common";

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
 * Lists all conversations for the authenticated user.
 */
const ConversationList = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const {
    conversations,
    loadingConversations,
    openConversation,
    chatRole,
    closeChat,
    toggleChat,
    isUserRecentlyActive,
  } = useChat();
  const [search, setSearch] = useState("");
  const [viewerImage, setViewerImage] = useState(null);

  /** Get contact user ID from a conversation */
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

  const presenceUserIds = useMemo(
    () =>
      Array.from(
        new Set(
          conversations
            .map(getContactUserId)
            .filter((id) => id && id !== user?.$id),
        ),
      ),
    [conversations, getContactUserId, user?.$id],
  );
  const { profilesById: contactProfiles } = useChatPresence(presenceUserIds);

  /** Check if a contact is online */
  const isContactOnline = useCallback(
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

  const filtered = useMemo(() => {
    return conversations.filter((c) => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        (c.propertyTitle || "").toLowerCase().includes(q) ||
        (c.clientName || "").toLowerCase().includes(q) ||
        (c.ownerName || "").toLowerCase().includes(q) ||
        (c.lastMessage || "").toLowerCase().includes(q)
      );
    });
  }, [conversations, search]);

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
    const days = Math.floor(hours / 24);
    if (days < 7) return t("chat.time.daysAgo", { count: days });
    return d.toLocaleDateString();
  };

  return (
    <div className="flex h-full flex-col">
      {/* Header - fixed height for consistent transitions */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-slate-200 px-3 dark:border-slate-700">
        <div className="flex items-center gap-2">
          <MessageCircle
            size={20}
            className="text-cyan-600 dark:text-cyan-400"
          />
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">
            {t("chat.conversations.title")}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to={getConversationsRoute(user)}
            onClick={closeChat}
            className="rounded p-1 text-cyan-600 transition hover:bg-cyan-50 hover:text-cyan-700 dark:text-cyan-400 dark:hover:bg-cyan-950/30 dark:hover:text-cyan-300"
            title={t("chat.conversations.viewAll")}
          >
            <ExternalLink size={16} />
          </Link>
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
        </div>
      </header>

      {/* Search */}
      <div className="border-b border-slate-100 px-3 py-2 dark:border-slate-800">
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
      <div className="flex-1 overflow-y-auto overscroll-contain">
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
          const contactName = getContactName(conv);
          const online = isContactOnline(conv);

          // Get avatar URL from profile if available
          const contactId = getContactUserId(conv);
          const profile = contactProfiles[contactId];
          const avatarUrl = profile?.avatarFileId
            ? profileService.getAvatarViewUrl(profile.avatarFileId)
            : "";

          return (
            <button
              key={conv.$id}
              onClick={() => openConversation(conv.$id)}
              className={cn(
                "flex w-full items-start gap-3 border-b border-slate-100 px-4 py-3 text-left transition",
                "hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/50",
                unread > 0 && "bg-cyan-50/50 dark:bg-cyan-950/20",
              )}
            >
              {/* Avatar with online indicator */}
              <div className="relative shrink-0">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={contactName || ""}
                    className="h-10 w-10 cursor-pointer rounded-full object-cover transition hover:opacity-80"
                    onClick={(e) => {
                      e.stopPropagation();
                      setViewerImage({ src: avatarUrl, alt: contactName });
                    }}
                  />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-linear-to-br from-cyan-500 to-blue-600 text-sm font-bold text-white">
                    {getInitials(contactName)}
                  </div>
                )}
                {/* Online indicator dot */}
                <span
                  className={cn(
                    "absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white dark:border-slate-900",
                    online
                      ? "bg-green-500"
                      : "bg-slate-300 dark:bg-slate-600",
                  )}
                />
              </div>

              {/* Content */}
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
                    {contactName || t("chat.conversations.unknownUser")}
                  </span>
                  <span className="shrink-0 text-[11px] text-slate-400 dark:text-slate-500">
                    {formatTime(conv.lastMessageAt)}
                  </span>
                </div>

                <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">
                  {conv.propertyTitle || ""}
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

export default ConversationList;
