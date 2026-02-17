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
import { usePresence } from "../hooks/usePresence";
import { chatService } from "../services/chatService";
import { playNotificationSound } from "../utils/notificationSound";
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
  const [isRestoringConversation, setIsRestoringConversation] = useState(
    () => Boolean(localStorage.getItem("activeConversationId")),
  );

  // Refs for real-time subscriptions
  const unsubConversationsRef = useRef(null);
  const unsubMessagesRef = useRef(null);

  /* ── Derived ─────────────────────────────────────────── */

  const isAuthenticated = Boolean(user?.$id);
  const isInternal = isInternalRole(user?.role);
  const chatRole = isInternal ? "owner" : "client";

  // Initialize presence heartbeat for authenticated users
  usePresence();

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

  /* ── Persist active conversation across page reloads ──── */

  // Restore active conversation from localStorage AFTER conversations load
  useEffect(() => {
    const savedConversationId = localStorage.getItem("activeConversationId");

    // No saved conversation - nothing to restore
    if (!savedConversationId) {
      setIsRestoringConversation(false);
      return;
    }

    // Not authenticated yet
    if (!isAuthenticated || !user?.$id) return;

    // Still loading conversations
    if (loadingConversations) return;

    // Already have an active conversation (manual selection)
    if (activeConversationId) {
      setIsRestoringConversation(false);
      return;
    }

    // Wait for conversations to load
    if (conversations.length === 0 && !loadingConversations) {
      // Conversations loaded but empty - nothing to restore
      setIsRestoringConversation(false);
      localStorage.removeItem("activeConversationId");
      return;
    }

    // Verify the conversation still exists before restoring
    const conversationExists = conversations.some(
      (c) => c.$id === savedConversationId,
    );

    if (conversationExists) {
      console.log("[ChatContext] Restoring conversation:", savedConversationId);
      setActiveConversationId(savedConversationId);
    } else {
      // Conversation was deleted, clear localStorage
      console.log("[ChatContext] Saved conversation not found, clearing");
      localStorage.removeItem("activeConversationId");
    }
    setIsRestoringConversation(false);
  }, [
    isAuthenticated,
    user?.$id,
    conversations,
    loadingConversations,
    activeConversationId,
  ]);

  // Save active conversation to localStorage when it changes
  useEffect(() => {
    if (activeConversationId) {
      localStorage.setItem("activeConversationId", activeConversationId);
    } else {
      localStorage.removeItem("activeConversationId");
    }
  }, [activeConversationId]);

  // Clear persisted conversation on logout
  useEffect(() => {
    if (!isAuthenticated) {
      localStorage.removeItem("activeConversationId");
      setActiveConversationId(null);
      setMessages([]);
    }
  }, [isAuthenticated]);

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

  // Auto-load messages when active conversation changes
  useEffect(() => {
    if (activeConversationId && conversations.length > 0) {
      // Verify the conversation exists before loading messages
      const conversationExists = conversations.some(
        (c) => c.$id === activeConversationId,
      );
      if (conversationExists) {
        loadMessages(activeConversationId);
      } else {
        // Conversation doesn't exist (maybe deleted), clear it
        setActiveConversationId(null);
        localStorage.removeItem("activeConversationId");
      }
    }
  }, [activeConversationId, conversations.length, loadMessages]);

  /* ── Open a conversation ─────────────────────────────── */

  const openConversation = useCallback(
    async (conversationId) => {
      setActiveConversationId(conversationId);
      setIsChatOpen(true);
      // Messages will be loaded automatically by the useEffect above

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
    [chatRole],
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

      // DO NOT add message to local state here — let the real-time subscription handle it
      // This prevents race condition duplicates

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
    console.log(
      "[ChatContext] goBackToList called - setting activeConversationId to null",
    );
    setActiveConversationId(null);
    setMessages([]);
    // Also clear from localStorage
    localStorage.removeItem("activeConversationId");
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

          // If message is from the other party, play notification sound and auto-mark as read
          if (doc.senderUserId !== user.$id) {
            // Play notification sound for incoming message
            playNotificationSound();
            
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
      isRestoringConversation,

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
      isRestoringConversation,
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
