import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { ExternalLink, MessageCircle, Search } from "lucide-react";
import { useState } from "react";
import { useChat } from "../../contexts/ChatContext";
import { useAuth } from "../../hooks/useAuth";
import { getConversationsRoute } from "../../utils/internalRoutes";
import { cn } from "../../utils/cn";
import { Spinner } from "../common";

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
  } = useChat();
  const [search, setSearch] = useState("");

  const filtered = conversations.filter((c) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      (c.propertyTitle || "").toLowerCase().includes(q) ||
      (c.clientName || "").toLowerCase().includes(q) ||
      (c.ownerName || "").toLowerCase().includes(q) ||
      (c.lastMessage || "").toLowerCase().includes(q)
    );
  });

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
      {/* Header */}
      <header className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-700">
        <div className="flex items-center gap-2">
          <MessageCircle
            size={20}
            className="text-cyan-600 dark:text-cyan-400"
          />
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">
            {t("chat.conversations.title")}
          </h2>
        </div>{getConversationsRoute(user)}
        <div className="flex items-center gap-2">
          <Link
            to="/mis-conversaciones"
            onClick={closeChat}
            className="flex items-center gap-1 text-xs font-medium text-cyan-600 transition hover:text-cyan-700 dark:text-cyan-400 dark:hover:text-cyan-300"
            title={t("chat.conversations.viewAll")}
          >
            <ExternalLink size={14} />
          </Link>
          <button
            onClick={closeChat}
            className="text-sm text-slate-500 hover:text-slate-700 sm:hidden dark:text-slate-400 dark:hover:text-slate-200"
          >
            {t("chat.actions.close")}
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
          const contactName =
            chatRole === "client" ? conv.ownerName : conv.clientName;

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
              {/* Avatar placeholder */}
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-cyan-500 to-blue-600 text-sm font-bold text-white">
                {(contactName || "?").charAt(0).toUpperCase()}
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
    </div>
  );
};

export default ConversationList;
