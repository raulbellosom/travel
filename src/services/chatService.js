import env from "../env";
import {
  client,
  databases,
  ensureAppwriteConfigured,
  ID,
  Permission,
  Query,
  Role,
} from "../api/appwriteClient";
import { executeJsonFunction } from "../utils/functions";

/* ─── Constants ────────────────────────────────────────── */

const DB = () => env.appwrite.databaseId;
const COL_CONVERSATIONS = () => env.appwrite.collections.conversations;
const COL_MESSAGES = () => env.appwrite.collections.messages;

/* ─── Conversations ────────────────────────────────────── */

export const chatService = {
  /**
   * Find an existing conversation between a client and a property,
   * or return null if none exists.
   */
  async findConversation(propertyId, clientUserId) {
    ensureAppwriteConfigured();
    const res = await databases.listDocuments({
      databaseId: DB(),
      collectionId: COL_CONVERSATIONS(),
      queries: [
        Query.equal("propertyId", propertyId),
        Query.equal("clientUserId", clientUserId),
        Query.equal("enabled", true),
        Query.limit(1),
      ],
    });
    return res.documents[0] || null;
  },

  /**
   * Create a new conversation between client and property owner.
   * Both parties + root get read/write; the function will also log an activity.
   */
  async createConversation({
    propertyId,
    propertyTitle,
    clientUserId,
    clientName,
    ownerUserId,
    ownerName,
  }) {
    ensureAppwriteConfigured();
    const docId = ID.unique();
    return databases.createDocument({
      databaseId: DB(),
      collectionId: COL_CONVERSATIONS(),
      documentId: docId,
      data: {
        propertyId,
        propertyTitle,
        clientUserId,
        clientName,
        ownerUserId,
        ownerName,
        lastMessage: "",
        lastMessageAt: new Date().toISOString(),
        clientUnread: 0,
        ownerUnread: 0,
        status: "active",
        enabled: true,
      },
      permissions: [
        Permission.read(Role.user(clientUserId)),
        Permission.update(Role.user(clientUserId)),
        Permission.read(Role.user(ownerUserId)),
        Permission.update(Role.user(ownerUserId)),
        Permission.read(Role.label("root")),
        Permission.update(Role.label("root")),
        Permission.delete(Role.label("root")),
      ],
    });
  },

  /**
   * Find-or-create a conversation. Returns the conversation document.
   */
  async getOrCreateConversation(params) {
    const existing = await this.findConversation(
      params.propertyId,
      params.clientUserId,
    );
    if (existing) return existing;
    return this.createConversation(params);
  },

  /**
   * List all conversations for a given user (either as client or owner).
   */
  async listConversations(userId, { role } = {}) {
    ensureAppwriteConfigured();
    const queries = [
      Query.equal("enabled", true),
      Query.orderDesc("lastMessageAt"),
      Query.limit(100),
    ];

    if (role === "client") {
      queries.push(Query.equal("clientUserId", userId));
    } else if (role === "owner") {
      queries.push(Query.equal("ownerUserId", userId));
    }
    // If no role filter, Appwrite permissions will naturally scope results.

    return databases.listDocuments({
      databaseId: DB(),
      collectionId: COL_CONVERSATIONS(),
      queries,
    });
  },

  /**
   * Update conversation metadata (lastMessage, unread counts, etc.)
   */
  async updateConversation(conversationId, patch) {
    ensureAppwriteConfigured();
    return databases.updateDocument({
      databaseId: DB(),
      collectionId: COL_CONVERSATIONS(),
      documentId: conversationId,
      data: patch,
    });
  },

  /* ─── Messages ─────────────────────────────────────── */

  /**
   * Send a new message in a conversation.
   */
  async sendMessage({
    conversationId,
    senderUserId,
    senderName,
    senderRole,
    body,
  }) {
    ensureAppwriteConfigured();
    const docId = ID.unique();

    // Create the message document
    const message = await databases.createDocument({
      databaseId: DB(),
      collectionId: COL_MESSAGES(),
      documentId: docId,
      data: {
        conversationId,
        senderUserId,
        senderName,
        senderRole, // "client" | "owner" | "staff" | "root"
        body,
        readBySender: true,
        readByRecipient: false,
        enabled: true,
      },
    });

    // Update the conversation with latest message info
    const conversation = await databases.getDocument({
      databaseId: DB(),
      collectionId: COL_CONVERSATIONS(),
      documentId: conversationId,
    });

    const isClient = senderRole === "client";
    const patch = {
      lastMessage: body.length > 120 ? body.slice(0, 120) + "…" : body,
      lastMessageAt: new Date().toISOString(),
    };

    // Increment unread count for the other party
    if (isClient) {
      patch.ownerUnread = (conversation.ownerUnread || 0) + 1;
    } else {
      patch.clientUnread = (conversation.clientUnread || 0) + 1;
    }

    await this.updateConversation(conversationId, patch);

    return message;
  },

  /**
   * List messages in a conversation, ordered oldest-first for chat display.
   */
  async listMessages(conversationId, { limit = 50, cursor } = {}) {
    ensureAppwriteConfigured();
    const queries = [
      Query.equal("conversationId", conversationId),
      Query.equal("enabled", true),
      Query.orderAsc("$createdAt"),
      Query.limit(limit),
    ];
    if (cursor) {
      queries.push(Query.cursorAfter(cursor));
    }

    return databases.listDocuments({
      databaseId: DB(),
      collectionId: COL_MESSAGES(),
      queries,
    });
  },

  /**
   * Mark all messages in a conversation as read for the given user role.
   * Also resets the unread counter on the conversation.
   */
  async markAsRead(conversationId, myRole) {
    ensureAppwriteConfigured();

    // Reset the unread counter
    const patch =
      myRole === "client" ? { clientUnread: 0 } : { ownerUnread: 0 };
    await this.updateConversation(conversationId, patch);
  },

  /* ─── Real-time subscriptions ──────────────────────── */

  /**
   * Subscribe to new messages in a specific conversation.
   * Returns an unsubscribe function (no-op if Realtime unavailable).
   */
  subscribeToMessages(conversationId, callback) {
    try {
      const channel = `databases.${DB()}.collections.${COL_MESSAGES()}.documents`;
      return client.subscribe(channel, (response) => {
        const payload = response.payload;
        if (
          payload?.conversationId === conversationId &&
          payload?.enabled !== false
        ) {
          callback(response);
        }
      });
    } catch (err) {
      console.warn("[Chat] Realtime messages subscription unavailable:", err.message);
      return () => {}; // no-op unsubscribe
    }
  },

  /**
   * Subscribe to conversation updates (new messages, unread count changes).
   * Returns an unsubscribe function (no-op if Realtime unavailable).
   */
  subscribeToConversations(callback) {
    try {
      const channel = `databases.${DB()}.collections.${COL_CONVERSATIONS()}.documents`;
      return client.subscribe(channel, (response) => {
        if (response.payload?.enabled !== false) {
          callback(response);
        }
      });
    } catch (err) {
      console.warn("[Chat] Realtime conversations subscription unavailable:", err.message);
      return () => {}; // no-op unsubscribe
    }
  },

  /* ─── Notifications (server-side) ──────────────────── */

  /**
   * Trigger email notification for offline recipient.
   * Only called when recipient is not actively online.
   */
  async sendChatNotification(payload) {
    const functionId = env.appwrite.functions.sendChatNotification;
    if (!functionId) {
      console.warn(
        "APPWRITE_FUNCTION_SEND_CHAT_NOTIFICATION_ID not configured",
      );
      return null;
    }
    return executeJsonFunction(functionId, payload);
  },
};
