import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useAuth } from "../hooks/useAuth";
import { chatService } from "../services/chatService";
import { isInternalRole } from "../utils/roles";

/* ─── Context ──────────────────────────────────────────── */

const ChatContext = createContext(null);

export const useChat = () => {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error("useChat must be used within a ChatProvider");
  return ctx;
};

/* ─── Provider ─────────────────────────────────────────── */

export const ChatProvider = ({ children }) => {
  const { user } = useAuth();

  // Global state
  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);

  // Refs for real-time subscriptions
  const unsubConversationsRef = useRef(null);
  const unsubMessagesRef = useRef(null);

  /* ── Derived ─────────────────────────────────────────── */

  const isAuthenticated = Boolean(user?.$id);
  const isInternal = isInternalRole(user?.role);
  const chatRole = isInternal ? "owner" : "client";

  const totalUnread = useMemo(() => {
    if (!isAuthenticated) return 0;
    return conversations.reduce((acc, c) => {
      const count =
        chatRole === "client" ? c.clientUnread || 0 : c.ownerUnread || 0;
      return acc + count;
    }, 0);
  }, [conversations, chatRole, isAuthenticated]);

  const activeConversation = useMemo(
    () => conversations.find((c) => c.$id === activeConversationId) || null,
    [conversations, activeConversationId],
  );

  /* ── Load conversations ──────────────────────────────── */

  const loadConversations = useCallback(async () => {
    if (!user?.$id) return;
    setLoadingConversations(true);
    try {
      const res = await chatService.listConversations(user.$id, {
        role: chatRole,
      });
      setConversations(res.documents || []);
    } catch (err) {
      console.error("Failed to load conversations:", err);
    } finally {
      setLoadingConversations(false);
    }
  }, [user?.$id, chatRole]);

  /* ── Load messages for active conversation ───────────── */

  const loadMessages = useCallback(async (conversationId) => {
    if (!conversationId) return;
    setLoadingMessages(true);
    try {
      const res = await chatService.listMessages(conversationId);
      setMessages(res.documents || []);
    } catch (err) {
      console.error("Failed to load messages:", err);
    } finally {
      setLoadingMessages(false);
    }
  }, []);

  /* ── Open a conversation ─────────────────────────────── */

  const openConversation = useCallback(
    async (conversationId) => {
      setActiveConversationId(conversationId);
      setIsChatOpen(true);
      await loadMessages(conversationId);

      // Mark as read
      try {
        await chatService.markAsRead(conversationId, chatRole);
        setConversations((prev) =>
          prev.map((c) =>
            c.$id === conversationId
              ? {
                  ...c,
                  ...(chatRole === "client"
                    ? { clientUnread: 0 }
                    : { ownerUnread: 0 }),
                }
              : c,
          ),
        );
      } catch {
        // Silent fail for mark-as-read
      }
    },
    [chatRole, loadMessages],
  );

  /* ── Start or resume a conversation from property ────── */
  /* Only client-role users with verified email can initiate.
     Internal roles (owner/staff/root) respond to existing conversations
     but don't create new ones from the public property page. */

  const startConversation = useCallback(
    async ({ propertyId, propertyTitle, ownerUserId, ownerName }) => {
      if (!user?.$id) return null;

      // Guard: only verified clients can initiate
      if (user.role !== "client") {
        throw new Error("Only client users can initiate conversations.");
      }
      if (!user.emailVerified) {
        throw new Error("Email must be verified to start a chat.");
      }

      const conversation = await chatService.getOrCreateConversation({
        propertyId,
        propertyTitle,
        clientUserId: user.$id,
        clientName: user.name || user.email || "Cliente",
        ownerUserId,
        ownerName: ownerName || "Propietario",
      });

      // Add to local list if new
      setConversations((prev) => {
        const exists = prev.find((c) => c.$id === conversation.$id);
        if (exists) return prev;
        return [conversation, ...prev];
      });

      await openConversation(conversation.$id);
      return conversation;
    },
    [user, openConversation],
  );

  /* ── Send a message ──────────────────────────────────── */

  const sendMessage = useCallback(
    async (body) => {
      if (!activeConversationId || !user?.$id || !body.trim()) return null;

      const message = await chatService.sendMessage({
        conversationId: activeConversationId,
        senderUserId: user.$id,
        senderName: user.name || user.email || "Usuario",
        senderRole: chatRole,
        body: body.trim(),
      });

      // Optimistically add message to local state
      setMessages((prev) => [...prev, message]);

      // Update conversation in list
      setConversations((prev) =>
        prev.map((c) =>
          c.$id === activeConversationId
            ? {
                ...c,
                lastMessage:
                  body.length > 120 ? body.slice(0, 120) + "…" : body,
                lastMessageAt: new Date().toISOString(),
              }
            : c,
        ),
      );

      // Trigger notification for offline recipient
      try {
        await chatService.sendChatNotification({
          conversationId: activeConversationId,
          messageId: message.$id,
          senderName: user.name || user.email,
          body: body.trim(),
        });
      } catch {
        // Non-critical
      }

      return message;
    },
    [activeConversationId, user, chatRole],
  );

  /* ── Toggle chat ─────────────────────────────────────── */

  const toggleChat = useCallback(() => {
    setIsChatOpen((prev) => !prev);
  }, []);

  const closeChat = useCallback(() => {
    setIsChatOpen(false);
    setActiveConversationId(null);
    setMessages([]);
  }, []);

  const goBackToList = useCallback(() => {
    setActiveConversationId(null);
    setMessages([]);
  }, []);

  /* ── Real-time: conversations ────────────────────────── */

  useEffect(() => {
    if (!isAuthenticated) return;
    loadConversations();

    // Subscribe to conversation changes
    unsubConversationsRef.current = chatService.subscribeToConversations(
      (response) => {
        const event = response.events?.[0] || "";
        const doc = response.payload;

        if (event.includes(".create")) {
          // New conversation — add if it involves me
          const involvesMe =
            doc.clientUserId === user.$id || doc.ownerUserId === user.$id;
          if (involvesMe) {
            setConversations((prev) => {
              if (prev.find((c) => c.$id === doc.$id)) return prev;
              return [doc, ...prev];
            });
          }
        } else if (event.includes(".update")) {
          setConversations((prev) =>
            prev.map((c) => (c.$id === doc.$id ? { ...c, ...doc } : c)),
          );
        } else if (event.includes(".delete")) {
          setConversations((prev) => prev.filter((c) => c.$id !== doc.$id));
        }
      },
    );

    return () => {
      if (unsubConversationsRef.current) {
        unsubConversationsRef.current();
        unsubConversationsRef.current = null;
      }
    };
  }, [isAuthenticated, user?.$id, loadConversations]);

  /* ── Real-time: messages ─────────────────────────────── */

  useEffect(() => {
    // Unsubscribe previous
    if (unsubMessagesRef.current) {
      unsubMessagesRef.current();
      unsubMessagesRef.current = null;
    }

    if (!activeConversationId || !isAuthenticated) return;

    unsubMessagesRef.current = chatService.subscribeToMessages(
      activeConversationId,
      (response) => {
        const event = response.events?.[0] || "";
        const doc = response.payload;

        if (event.includes(".create")) {
          // Avoid duplicating if we already optimistically added it
          setMessages((prev) => {
            if (prev.find((m) => m.$id === doc.$id)) return prev;
            return [...prev, doc];
          });

          // If message is from the other party, auto-mark as read
          if (doc.senderUserId !== user.$id) {
            chatService
              .markAsRead(activeConversationId, chatRole)
              .catch(() => {});
            setConversations((prev) =>
              prev.map((c) =>
                c.$id === activeConversationId
                  ? {
                      ...c,
                      ...(chatRole === "client"
                        ? { clientUnread: 0 }
                        : { ownerUnread: 0 }),
                    }
                  : c,
              ),
            );
          }
        }
      },
    );

    return () => {
      if (unsubMessagesRef.current) {
        unsubMessagesRef.current();
        unsubMessagesRef.current = null;
      }
    };
  }, [activeConversationId, isAuthenticated, user?.$id, chatRole]);

  /* ── Context value ───────────────────────────────────── */

  const value = useMemo(
    () => ({
      // State
      conversations,
      activeConversation,
      activeConversationId,
      messages,
      isChatOpen,
      loadingConversations,
      loadingMessages,
      totalUnread,
      chatRole,
      isAuthenticated,

      // Actions
      loadConversations,
      openConversation,
      startConversation,
      sendMessage,
      toggleChat,
      closeChat,
      goBackToList,
    }),
    [
      conversations,
      activeConversation,
      activeConversationId,
      messages,
      isChatOpen,
      loadingConversations,
      loadingMessages,
      totalUnread,
      chatRole,
      isAuthenticated,
      loadConversations,
      openConversation,
      startConversation,
      sendMessage,
      toggleChat,
      closeChat,
      goBackToList,
    ],
  );

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};
