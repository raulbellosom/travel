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
import { leadsService } from "../services/leadsService";
import {
  getConversationSide,
  getConversationUnreadCount,
  getConversationUnreadResetPatch,
} from "../utils/chatParticipants";
import { playNotificationSound } from "../utils/notificationSound";
import { useInstanceModules } from "../hooks/useInstanceModules";
import { hasScope, isInternalRole } from "../utils/roles";

/* ─── Context ──────────────────────────────────────────── */

const ChatContext = createContext(null);
const FINAL_LEAD_STATUSES = new Set(["closed_won", "closed_lost"]);

const parseMetaJson = (value) => {
  if (!value) return {};
  if (typeof value === "object" && !Array.isArray(value)) return value;
  if (typeof value !== "string") return {};
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? parsed
      : {};
  } catch {
    return {};
  }
};

// eslint-disable-next-line react-refresh/only-export-components
export const useOptionalChat = () => useContext(ChatContext);

// eslint-disable-next-line react-refresh/only-export-components
export const useChat = () => {
  const ctx = useOptionalChat();
  if (!ctx) throw new Error("useChat must be used within a ChatProvider");
  return ctx;
};

/* ─── Provider ─────────────────────────────────────────── */

export const ChatProvider = ({ children }) => {
  const { user } = useAuth();
  const { isEnabled } = useInstanceModules();
  const normalizeId = (value) => String(value || "").trim();

  // Global state
  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [internalChatUsers, setInternalChatUsers] = useState([]);
  const [loadingInternalChatUsers, setLoadingInternalChatUsers] =
    useState(false);
  const [peerActivityByUserId, setPeerActivityByUserId] = useState({});
  const [isRestoringConversation, setIsRestoringConversation] = useState(() =>
    Boolean(localStorage.getItem("activeConversationId")),
  );
  const [isBubbleVisible, setIsBubbleVisible] = useState(
    () => localStorage.getItem("chatBubbleVisible") !== "false",
  );

  // Refs for real-time subscriptions
  const unsubConversationsRef = useRef(null);
  const unsubMessagesRef = useRef(null);

  /* ── Derived ─────────────────────────────────────────── */

  const isAuthenticated = Boolean(user?.$id);
  const isInternal = isInternalRole(user?.role);
  const chatRole = isInternal ? "owner" : "client";
  const canReadMessaging =
    isAuthenticated &&
    isEnabled("module.messaging.realtime") &&
    (!isInternal || hasScope(user, "messaging.read"));
  const canWriteMessaging =
    canReadMessaging && (!isInternal || hasScope(user, "messaging.write"));

  const markPeerActive = useCallback((peerUserId, at) => {
    const normalizedPeerId = normalizeId(peerUserId);
    if (!normalizedPeerId) return;

    const parsedAt = new Date(at || Date.now());
    const timestamp = Number.isNaN(parsedAt.getTime())
      ? new Date().toISOString()
      : parsedAt.toISOString();

    setPeerActivityByUserId((prev) => {
      if (prev[normalizedPeerId] === timestamp) return prev;
      return {
        ...prev,
        [normalizedPeerId]: timestamp,
      };
    });
  }, []);

  const isUserRecentlyActive = useCallback(
    (peerUserId, windowMs = 90000) => {
      const normalizedPeerId = normalizeId(peerUserId);
      if (!normalizedPeerId) return false;

      const rawTimestamp = peerActivityByUserId[normalizedPeerId];
      if (!rawTimestamp) return false;

      const activityTime = new Date(rawTimestamp).getTime();
      if (Number.isNaN(activityTime)) return false;

      return Date.now() - activityTime <= windowMs;
    },
    [peerActivityByUserId],
  );

  // Initialize presence heartbeat for authenticated users
  usePresence();

  const totalUnread = useMemo(() => {
    if (!canReadMessaging) return 0;
    return conversations.reduce(
      (acc, conversation) =>
        acc + getConversationUnreadCount(conversation, user?.$id, chatRole),
      0,
    );
  }, [canReadMessaging, conversations, chatRole, user?.$id]);

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
    if (!canReadMessaging || !user?.$id) return;

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
    canReadMessaging,
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
    if (!canReadMessaging) {
      localStorage.removeItem("activeConversationId");
      setActiveConversationId(null);
      setConversations([]);
      setMessages([]);
      setInternalChatUsers([]);
      setPeerActivityByUserId({});
      setIsChatOpen(false);
    }
  }, [canReadMessaging]);

  /* ── Load conversations ──────────────────────────────── */

  const loadConversations = useCallback(async () => {
    if (!canReadMessaging || !user?.$id) return;
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
  }, [canReadMessaging, user?.$id, chatRole, isInternal]);

  const loadInternalChatUsers = useCallback(async () => {
    if (!canReadMessaging || !isInternal || !user?.$id) {
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
  }, [canReadMessaging, isInternal, user?.$id]);

  const syncLeadConversationState = useCallback(
    async (conversationId, nextStatus, options = {}) => {
      const lead = await leadsService.findLatestByConversation(conversationId);
      if (!lead?.$id) return null;

      const patch = {};

      if (nextStatus === "archived") {
        patch.isArchived = true;
      } else if (nextStatus === "active") {
        patch.isArchived = false;
      } else if (nextStatus === "closed") {
        const normalizedLeadStatus = String(options.leadStatus || "")
          .trim()
          .toLowerCase();
        if (!FINAL_LEAD_STATUSES.has(normalizedLeadStatus)) {
          throw new Error("Finalizing a conversation requires closed_won or closed_lost.");
        }
        patch.status = normalizedLeadStatus;
        patch.isArchived = false;

        const closureReason = String(options.closureReason || "").trim();
        if (closureReason) {
          const meta = parseMetaJson(lead.metaJson);
          patch.metaJson = JSON.stringify({
            ...meta,
            closureReason: closureReason.slice(0, 500),
          }).slice(0, 8000);
        }
      }

      if (Object.keys(patch).length === 0) return lead;
      return leadsService.updateLead(lead.$id, patch);
    },
    [],
  );

  const updateConversationStatus = useCallback(
    async (conversationId, nextStatus, options = {}) => {
      const normalizedConversationId = String(conversationId || "").trim();
      const normalizedStatus = String(nextStatus || "")
        .trim()
        .toLowerCase();
      const allowedStatuses = new Set(["active", "archived", "closed"]);

      if (!normalizedConversationId) {
        throw new Error("Invalid conversation id.");
      }
      if (!allowedStatuses.has(normalizedStatus)) {
        throw new Error("Invalid conversation status.");
      }

      if (
        normalizedStatus === "closed" &&
        !FINAL_LEAD_STATUSES.has(
          String(options.leadStatus || "")
            .trim()
            .toLowerCase(),
        )
      ) {
        throw new Error("You must provide leadStatus: closed_won or closed_lost.");
      }

      await syncLeadConversationState(
        normalizedConversationId,
        normalizedStatus,
        options,
      );

      const updatedConversation = await chatService.updateConversation(
        normalizedConversationId,
        { status: normalizedStatus },
      );

      setConversations((prev) =>
        prev.map((conversation) =>
          conversation.$id === normalizedConversationId
            ? {
                ...conversation,
                ...updatedConversation,
                status: normalizedStatus,
              }
            : conversation,
        ),
      );

      return updatedConversation;
    },
    [syncLeadConversationState],
  );

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
    if (!activeConversationId) return;
    loadMessages(activeConversationId);
  }, [activeConversationId, loadMessages]);

  // If active conversation disappears from the list, clear active state safely.
  useEffect(() => {
    if (!activeConversationId || loadingConversations) return;
    if (conversations.length === 0) return;

    const conversationExists = conversations.some(
      (c) => c.$id === activeConversationId,
    );
    if (!conversationExists) {
      setActiveConversationId(null);
      setMessages([]);
      localStorage.removeItem("activeConversationId");
    }
  }, [activeConversationId, conversations, loadingConversations]);

  /* ── Open a conversation ─────────────────────────────── */

  const openConversation = useCallback(
    async (conversationId, options = {}) => {
      if (!canReadMessaging) return;
      const { openChatBubble = true } = options;
      setActiveConversationId(conversationId);
      if (openChatBubble) {
        // Ensure the bubble is visible so the user can see the conversation.
        // This overrides the "hide bubble" preference when a conversation is
        // opened programmatically (e.g. after sending a lead / schedule request).
        setIsBubbleVisible(true);
        localStorage.setItem("chatBubbleVisible", "true");
        setIsChatOpen(true);
      }
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
            m.senderUserId === user?.$id ? m : { ...m, readByRecipient: true },
          ),
        );
      } catch {
        // Silent fail for mark-as-read
      }
    },
    [canReadMessaging, chatRole, user?.$id],
  );

  /* ── Start or resume a conversation from property ────── */
  /* Only client-role users with verified email can initiate.
     Internal roles (owner/staff/root) respond to existing conversations
     but don't create new ones from the public property page. */

  const startConversation = useCallback(
    async ({
      resourceId,
      initialMessage,
      intent = "info_request",
      contactChannel = "resource_chat",
      meta = {},
    }) => {
      if (!canWriteMessaging) {
        throw new Error("Messaging is disabled for this user.");
      }
      if (!user?.$id) return null;

      // Guard: only verified clients can initiate
      if (user.role !== "client") {
        throw new Error("Only client users can initiate conversations.");
      }
      if (!user.emailVerified) {
        throw new Error("Email must be verified to start a chat.");
      }

      const normalizedMeta =
        meta && typeof meta === "object" && !Array.isArray(meta) ? meta : {};

      const leadResult = await leadsService.createLead({
        resourceId,
        message:
          String(initialMessage || "").trim() ||
          "Hola, me interesa este recurso. Quiero mas informacion.",
        intent,
        contactChannel,
        meta: normalizedMeta,
      });
      const conversationId = String(
        leadResult?.body?.conversationId || "",
      ).trim();
      if (!conversationId) {
        throw new Error("No se pudo resolver la conversacion del lead.");
      }

      await loadConversations();
      const conversation =
        await chatService.getConversationById(conversationId);

      // Add to local list if new
      setConversations((prev) => {
        const exists = prev.some((c) => c.$id === conversation.$id);
        if (!exists) return [conversation, ...prev];
        return prev.map((c) =>
          c.$id === conversation.$id ? { ...c, ...conversation } : c,
        );
      });

      await openConversation(conversation.$id);
      return conversation;
    },
    [canWriteMessaging, loadConversations, openConversation, user],
  );

  const startDirectConversation = useCallback(
    async ({ targetUserId, targetName }) => {
      if (!canWriteMessaging) {
        throw new Error("Messaging is disabled for this user.");
      }
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
          const aTime = new Date(
            a?.lastMessageAt || a?.$updatedAt || 0,
          ).getTime();
          const bTime = new Date(
            b?.lastMessageAt || b?.$updatedAt || 0,
          ).getTime();
          return bTime - aTime;
        });
      });

      await openConversation(conversation.$id, { openChatBubble: false });
      return conversation;
    },
    [canWriteMessaging, isInternal, user, openConversation],
  );

  /* ── Send a message ──────────────────────────────────── */

  const sendMessage = useCallback(
    async (body) => {
      if (!canWriteMessaging) {
        throw new Error("Messaging is disabled for this user.");
      }
      if (!activeConversationId || !user?.$id || !body.trim()) return null;

      const normalizedConversationStatus = String(
        activeConversation?.status || "active",
      )
        .trim()
        .toLowerCase();
      if (normalizedConversationStatus === "closed") {
        throw new Error("Cannot send messages to a closed conversation.");
      }
      if (normalizedConversationStatus === "archived") {
        await updateConversationStatus(activeConversationId, "active");
      }

      const trimmedBody = body.trim();
      const senderSide = getConversationSide(
        activeConversation,
        user.$id,
        chatRole,
      );
      const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2)}`;

      // Optimistic update: add message immediately with "sending" status
      const optimisticMessage = {
        $id: tempId,
        conversationId: activeConversationId,
        senderUserId: user.$id,
        senderName: user.name || user.email || "Usuario",
        senderRole: senderSide || chatRole,
        body: trimmedBody,
        kind: "text",
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

        // Replace optimistic message with real one (real-time also handles this but may be slow).
        // Server-confirmed = "delivered" (2 muted ticks); skip the 1-tick "sent" state.
        setMessages((prev) =>
          prev.map((m) =>
            m.$id === tempId ? { ...message, status: "delivered" } : m,
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
    [
      canWriteMessaging,
      activeConversation,
      activeConversationId,
      user,
      chatRole,
      updateConversationStatus,
    ],
  );

  /* ── Toggle chat ─────────────────────────────────────── */

  const sendProposal = useCallback(
    async (proposalInput = {}) => {
      if (!canWriteMessaging) {
        throw new Error("Messaging is disabled for this user.");
      }
      if (!activeConversationId || !user?.$id) {
        throw new Error("No active conversation selected.");
      }
      if (!isInternalRole(user?.role)) {
        throw new Error("Only internal users can send proposals.");
      }

      const result = await chatService.sendProposal({
        ...proposalInput,
        conversationId: activeConversationId,
      });

      await loadConversations();
      return result?.body || null;
    },
    [
      activeConversationId,
      canWriteMessaging,
      loadConversations,
      user?.$id,
      user?.role,
    ],
  );

  const respondToProposal = useCallback(
    async ({ proposalMessageId, response, comment, suggestedSlots = [] }) => {
      if (!canWriteMessaging) {
        throw new Error("Messaging is disabled for this user.");
      }
      if (!activeConversationId || !user?.$id) {
        throw new Error("No active conversation selected.");
      }
      if (String(user?.role || "").trim().toLowerCase() !== "client") {
        throw new Error("Only client users can respond to proposals.");
      }

      const result = await chatService.respondProposal({
        conversationId: activeConversationId,
        proposalMessageId,
        response,
        comment,
        suggestedSlots,
      });

      await loadConversations();
      return result?.body || null;
    },
    [
      activeConversationId,
      canWriteMessaging,
      loadConversations,
      user?.$id,
      user?.role,
    ],
  );

  const toggleChat = useCallback(() => {
    if (!canReadMessaging) return;
    setIsChatOpen((prev) => !prev);
  }, [canReadMessaging]);

  const closeChat = useCallback(() => {
    setIsChatOpen(false);
    setActiveConversationId(null);
    setMessages([]);
  }, []);

  const toggleBubbleVisibility = useCallback(() => {
    setIsBubbleVisible((prev) => {
      const next = !prev;
      localStorage.setItem("chatBubbleVisible", String(next));
      if (!next) {
        setIsChatOpen(false);
        setActiveConversationId(null);
        setMessages([]);
      }
      return next;
    });
  }, []);

  const goBackToList = useCallback(() => {
    setActiveConversationId(null);
    setMessages([]);
    // Also clear from localStorage
    localStorage.removeItem("activeConversationId");
  }, []);

  /* ── Real-time: conversations ────────────────────────── */

  useEffect(() => {
    if (!canReadMessaging) return;
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
            prev.map((c) => {
              if (c.$id !== doc.$id) return c;

              const prevClientUnread = Number(c.clientUnread || 0);
              const prevOwnerUnread = Number(c.ownerUnread || 0);
              const next = { ...c, ...doc };
              const nextClientUnread = Number(next.clientUnread || 0);
              const nextOwnerUnread = Number(next.ownerUnread || 0);
              const currentUserId = normalizeId(user?.$id);

              if (
                currentUserId &&
                normalizeId(c.clientUserId) === currentUserId
              ) {
                if (nextClientUnread > prevClientUnread) {
                  markPeerActive(
                    c.ownerUserId,
                    next.lastMessageAt || next.$updatedAt,
                  );
                }
              } else if (
                currentUserId &&
                normalizeId(c.ownerUserId) === currentUserId
              ) {
                if (nextOwnerUnread > prevOwnerUnread) {
                  markPeerActive(
                    c.clientUserId,
                    next.lastMessageAt || next.$updatedAt,
                  );
                }
              }

              return next;
            }),
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
    canReadMessaging,
    isInternal,
    user?.$id,
    loadConversations,
    loadInternalChatUsers,
    markPeerActive,
  ]);

  /* ── Real-time: messages ─────────────────────────────── */

  useEffect(() => {
    // Unsubscribe previous
    if (unsubMessagesRef.current) {
      unsubMessagesRef.current();
      unsubMessagesRef.current = null;
    }

    if (!activeConversationId || !canReadMessaging) return;

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
              } else if (doc.senderUserId === user.$id) {
                // Already confirmed, ensure it shows as delivered (2 muted ticks)
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
            markPeerActive(doc.senderUserId, doc.$createdAt);
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
              }
              // No else-if: keep current "delivered" status if readByRecipient is still false

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
  }, [
    activeConversationId,
    canReadMessaging,
    user?.$id,
    chatRole,
    markPeerActive,
  ]);

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
      canReadMessaging,
      canWriteMessaging,
      isRestoringConversation,
      isUserRecentlyActive,

      // Actions
      loadConversations,
      loadInternalChatUsers,
      openConversation,
      startConversation,
      startDirectConversation,
      updateConversationStatus,
      sendMessage,
      sendProposal,
      respondToProposal,
      toggleChat,
      closeChat,
      goBackToList,
      isBubbleVisible,
      toggleBubbleVisibility,
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
      canReadMessaging,
      canWriteMessaging,
      isRestoringConversation,
      isUserRecentlyActive,
      loadConversations,
      loadInternalChatUsers,
      openConversation,
      startConversation,
      startDirectConversation,
      updateConversationStatus,
      sendMessage,
      sendProposal,
      respondToProposal,
      toggleChat,
      closeChat,
      goBackToList,
      isBubbleVisible,
      toggleBubbleVisibility,
    ],
  );

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};


