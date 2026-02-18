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
import {
  getConversationSide,
  getConversationUnreadCount,
  getConversationUnreadResetPatch,
} from "../utils/chatParticipants";
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
  const [internalChatUsers, setInternalChatUsers] = useState([]);
  const [loadingInternalChatUsers, setLoadingInternalChatUsers] = useState(false);
  const [isRestoringConversation, setIsRestoringConversation] = useState(() =>
    Boolean(localStorage.getItem("activeConversationId")),
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
    return conversations.reduce(
      (acc, conversation) =>
        acc +
        getConversationUnreadCount(conversation, user?.$id, chatRole),
      0,
    );
  }, [conversations, chatRole, isAuthenticated, user?.$id]);

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
      setActiveConversationId(savedConversationId);
    } else {
      // Conversation was deleted, clear localStorage
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
      setConversations([]);
      setMessages([]);
      setInternalChatUsers([]);
    }
  }, [isAuthenticated]);

  /* ── Load conversations ──────────────────────────────── */

  const loadConversations = useCallback(async () => {
    if (!user?.$id) return;
    setLoadingConversations(true);
    try {
      const res = await chatService.listConversations(user.$id, {
        role: chatRole,
        includeClientConversations: isInternal,
      });
      setConversations(res.documents || []);
    } catch (err) {
      console.error("Failed to load conversations:", err);
    } finally {
      setLoadingConversations(false);
    }
  }, [user?.$id, chatRole, isInternal]);

  const loadInternalChatUsers = useCallback(async () => {
    if (!isInternal || !user?.$id) {
      setInternalChatUsers([]);
      return [];
    }

    setLoadingInternalChatUsers(true);
    try {
      const docs = await chatService.listInternalChatUsers({
        excludeUserId: user.$id,
      });
      setInternalChatUsers(docs || []);
      return docs || [];
    } catch (err) {
      console.error("Failed to load internal chat users:", err);
      setInternalChatUsers([]);
      return [];
    } finally {
      setLoadingInternalChatUsers(false);
    }
  }, [isInternal, user?.$id]);

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
  }, [activeConversationId, conversations, loadMessages]);

  /* ── Open a conversation ─────────────────────────────── */

  const openConversation = useCallback(
    async (conversationId) => {
      setActiveConversationId(conversationId);
      setIsChatOpen(true);
      // Messages will be loaded automatically by the useEffect above

      // Mark as read
      try {
        await chatService.markAsRead(conversationId, chatRole, user?.$id);
        setConversations((prev) =>
          prev.map((c) =>
            c.$id === conversationId
              ? {
                  ...c,
                  ...getConversationUnreadResetPatch(c, user?.$id, chatRole),
                }
              : c,
          ),
        );
        setMessages((prev) =>
          prev.map((m) =>
            m.senderUserId === user?.$id
              ? m
              : { ...m, readByRecipient: true },
          ),
        );
      } catch {
        // Silent fail for mark-as-read
      }
    },
    [chatRole, user?.$id],
  );

  /* ── Start or resume a conversation from property ────── */
  /* Only client-role users with verified email can initiate.
     Internal roles (owner/staff/root) respond to existing conversations
     but don't create new ones from the public property page. */

  const startConversation = useCallback(
    async ({
      resourceId,
      resourceTitle,
      propertyId,
      propertyTitle,
      ownerUserId,
      ownerName,
    }) => {
      if (!user?.$id) return null;

      // Guard: only verified clients can initiate
      if (user.role !== "client") {
        throw new Error("Only client users can initiate conversations.");
      }
      if (!user.emailVerified) {
        throw new Error("Email must be verified to start a chat.");
      }

      const conversation = await chatService.getOrCreateConversation({
        resourceId: resourceId || propertyId,
        resourceTitle: resourceTitle || propertyTitle,
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

  const startDirectConversation = useCallback(
    async ({ targetUserId, targetName }) => {
      if (!isInternal || !user?.$id) {
        throw new Error("Only internal users can start direct conversations.");
      }

      const conversation = await chatService.getOrCreateDirectConversation({
        initiatorUserId: user.$id,
        initiatorName: user.name || user.email || "Usuario",
        targetUserId,
        targetName,
      });

      setConversations((prev) => {
        const next = [
          conversation,
          ...prev.filter((item) => item.$id !== conversation.$id),
        ];
        return next.sort((a, b) => {
          const aTime = new Date(a?.lastMessageAt || a?.$updatedAt || 0).getTime();
          const bTime = new Date(b?.lastMessageAt || b?.$updatedAt || 0).getTime();
          return bTime - aTime;
        });
      });

      await openConversation(conversation.$id);
      return conversation;
    },
    [isInternal, user, openConversation],
  );

  /* ── Send a message ──────────────────────────────────── */

  const sendMessage = useCallback(
    async (body) => {
      if (!activeConversationId || !user?.$id || !body.trim()) return null;

      const trimmedBody = body.trim();
      const senderSide = getConversationSide(activeConversation, user.$id, chatRole);
      const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2)}`;

      // Optimistic update: add message immediately with "sending" status
      const optimisticMessage = {
        $id: tempId,
        conversationId: activeConversationId,
        senderUserId: user.$id,
        senderName: user.name || user.email || "Usuario",
        senderRole: senderSide || chatRole,
        body: trimmedBody,
        $createdAt: new Date().toISOString(),
        status: "sending",
      };

      setMessages((prev) => [...prev, optimisticMessage]);

      let message;
      try {
        message = await chatService.sendMessage({
          conversationId: activeConversationId,
          senderUserId: user.$id,
          senderName: user.name || user.email || "Usuario",
          senderRole: senderSide || chatRole,
          body: trimmedBody,
        });

        // Replace optimistic message with real one (real-time also handles this but may be slow)
        setMessages((prev) =>
          prev.map((m) =>
            m.$id === tempId ? { ...message, status: "sent" } : m,
          ),
        );
      } catch (error) {
        // Mark as failed on error
        setMessages((prev) =>
          prev.map((m) => (m.$id === tempId ? { ...m, status: "failed" } : m)),
        );
        throw error;
      }

      // Update conversation in list
      setConversations((prev) =>
        prev.map((c) =>
          c.$id === activeConversationId
            ? {
                ...c,
                lastMessage:
                  trimmedBody.length > 120
                    ? `${trimmedBody.slice(0, 120)}...`
                    : trimmedBody,
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
          body: trimmedBody,
        });
      } catch {
        // Non-critical
      }

      return message;
    },
    [activeConversation, activeConversationId, user, chatRole],
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
    // Also clear from localStorage
    localStorage.removeItem("activeConversationId");
  }, []);

  /* ── Real-time: conversations ────────────────────────── */

  useEffect(() => {
    if (!isAuthenticated) return;
    loadConversations();
    if (isInternal) {
      loadInternalChatUsers();
    } else {
      setInternalChatUsers([]);
    }

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
  }, [
    isAuthenticated,
    isInternal,
    user?.$id,
    loadConversations,
    loadInternalChatUsers,
  ]);

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
          setMessages((prev) => {
            // Check if we already have this message (by $id) or an optimistic version (by tempId)
            const existingIndex = prev.findIndex((m) => m.$id === doc.$id);
            if (existingIndex !== -1) {
              const updated = [...prev];
              const current = updated[existingIndex];
              const merged = { ...current, ...doc };

              if (doc.senderUserId === user.$id && doc.readByRecipient) {
                merged.status = "read";
              } else if (
                doc.senderUserId === user.$id &&
                current.status === "sent"
              ) {
                merged.status = "delivered";
              }

              updated[existingIndex] = merged;
              return updated;
            }

            // Check for optimistic messages (same sender, body, recent timestamp)
            const optimisticIndex = prev.findIndex(
              (m) =>
                m.$id.startsWith("temp-") &&
                m.senderUserId === doc.senderUserId &&
                m.body === doc.body,
            );

            if (optimisticIndex !== -1) {
              // Replace optimistic message with confirmed one
              const updated = [...prev];
              updated[optimisticIndex] = {
                ...doc,
                status:
                  doc.senderUserId === user.$id
                    ? doc.readByRecipient
                      ? "read"
                      : "delivered"
                    : undefined,
              };
              return updated;
            }

            return [
              ...prev,
              {
                ...doc,
                status:
                  doc.senderUserId === user.$id
                    ? doc.readByRecipient
                      ? "read"
                      : "delivered"
                    : undefined,
              },
            ];
          });

          // If message is from the other party, play notification sound and auto-mark as read
          if (doc.senderUserId !== user.$id) {
            playNotificationSound();

            chatService
              .markAsRead(activeConversationId, chatRole, user.$id)
              .catch(() => {});
            setConversations((prev) =>
              prev.map((c) =>
                c.$id === activeConversationId
                  ? {
                      ...c,
                      ...getConversationUnreadResetPatch(c, user.$id, chatRole),
                    }
                  : c,
              ),
            );
          }
        } else if (event.includes(".update")) {
          setMessages((prev) =>
            prev.map((m) => {
              if (m.$id !== doc.$id) return m;
              const merged = { ...m, ...doc };

              if (doc.senderUserId === user.$id && doc.readByRecipient) {
                merged.status = "read";
              } else if (doc.senderUserId === user.$id && m.status === "sent") {
                merged.status = "delivered";
              }

              return merged;
            }),
          );
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
      internalChatUsers,
      loadingInternalChatUsers,
      totalUnread,
      chatRole,
      isAuthenticated,
      isRestoringConversation,

      // Actions
      loadConversations,
      loadInternalChatUsers,
      openConversation,
      startConversation,
      startDirectConversation,
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
      internalChatUsers,
      loadingInternalChatUsers,
      totalUnread,
      chatRole,
      isAuthenticated,
      isRestoringConversation,
      loadConversations,
      loadInternalChatUsers,
      openConversation,
      startConversation,
      startDirectConversation,
      sendMessage,
      toggleChat,
      closeChat,
      goBackToList,
    ],
  );

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};
