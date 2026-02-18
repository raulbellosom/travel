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
const COL_USERS = () => env.appwrite.collections.users;
const normalizeId = (value) => String(value || "").trim();
const INTERNAL_CHAT_ROLES = [
  "owner",
  "staff_manager",
  "staff_editor",
  "staff_support",
];

const isQueryCompatibilityError = (error) => {
  const code = Number(error?.code);
  if (code === 400) return true;
  const message = String(error?.message || "").toLowerCase();
  return (
    message.includes("invalid query") ||
    message.includes("attribute") ||
    message.includes("index")
  );
};

const buildConversationPermissions = (clientUserId, ownerUserId) => {
  const userIds = Array.from(
    new Set([normalizeId(clientUserId), normalizeId(ownerUserId)].filter(Boolean)),
  );
  const readPermissions = userIds.map((id) => Permission.read(Role.user(id)));
  const updatePermissions = userIds.map((id) => Permission.update(Role.user(id)));
  return [...readPermissions, ...updatePermissions];
};

const sortByLastMessageAtDesc = (docs) =>
  [...docs].sort((a, b) => {
    const aTime = new Date(a?.lastMessageAt || a?.$updatedAt || 0).getTime();
    const bTime = new Date(b?.lastMessageAt || b?.$updatedAt || 0).getTime();
    return bTime - aTime;
  });

/* ─── Conversations ────────────────────────────────────── */

export const chatService = {
  /**
   * Find an existing conversation between a client and a property,
   * or return null if none exists.
   */
  async findConversation(resourceId, clientUserId) {
    ensureAppwriteConfigured();
    const normalizedResourceId = normalizeId(resourceId);
    if (!normalizedResourceId) return null;

    const queryByField = async (fieldName) =>
      databases.listDocuments({
        databaseId: DB(),
        collectionId: COL_CONVERSATIONS(),
        queries: [
          Query.equal(fieldName, normalizedResourceId),
          Query.equal("clientUserId", clientUserId),
          Query.equal("enabled", true),
          Query.limit(1),
        ],
      });

    try {
      const resourceResult = await queryByField("resourceId");
      if (resourceResult.documents?.[0]) return resourceResult.documents[0];
    } catch {
      // Fallback to legacy propertyId below
    }

    try {
      const legacyResult = await queryByField("propertyId");
      return legacyResult.documents?.[0] || null;
    } catch {
      return null;
    }
  },

  /**
   * Create a new conversation between client and property owner.
   * Note: Only sets permissions for the creator (current user).
   * The collection must have Role.users() or Role.users("verified") permissions
   * configured server-side to allow:
   *   - Create: users (verified)
   *   - Read: users (verified)
   *   - Update: users (verified)
   * Security is enforced via query filters (clientUserId/ownerUserId).
   */
  async createConversation({
    resourceId,
    resourceTitle,
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
        resourceId: normalizeId(resourceId || propertyId),
        resourceTitle: String(resourceTitle || propertyTitle || "").trim(),
        propertyId: normalizeId(propertyId || resourceId),
        propertyTitle: String(propertyTitle || resourceTitle || "").trim(),
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
      permissions: buildConversationPermissions(clientUserId, ownerUserId),
    });
  },

  /**
   * Find-or-create a conversation. Returns the conversation document.
   */
  async getOrCreateConversation(params) {
    const existing = await this.findConversation(
      params.resourceId || params.propertyId,
      params.clientUserId,
    );
    if (existing) return existing;
    return this.createConversation(params);
  },

  /**
   * Find-or-create a direct internal conversation between two admin users.
   * Uses a canonical pair id so both users land on the same thread.
   */
  async getOrCreateDirectConversation({
    initiatorUserId,
    initiatorName,
    targetUserId,
    targetName,
  }) {
    const a = normalizeId(initiatorUserId);
    const b = normalizeId(targetUserId);
    if (!a || !b || a === b) {
      throw new Error("Invalid direct conversation participants.");
    }

    const [clientUserId, ownerUserId] = [a, b].sort();
    const clientName =
      clientUserId === a
        ? String(initiatorName || "Usuario").trim()
        : String(targetName || "Usuario").trim();
    const ownerName =
      ownerUserId === b
        ? String(targetName || "Usuario").trim()
        : String(initiatorName || "Usuario").trim();
    const resourceId = `direct:${clientUserId}:${ownerUserId}`;

    return this.getOrCreateConversation({
      resourceId,
      resourceTitle: "Chat interno",
      propertyId: resourceId,
      propertyTitle: "Chat interno",
      clientUserId,
      clientName,
      ownerUserId,
      ownerName,
    });
  },

  /**
   * List internal users available for admin-to-admin direct chat.
   * Root users are always excluded.
   */
  async listInternalChatUsers({ excludeUserId } = {}) {
    ensureAppwriteConfigured();

    const baseQueries = [
      Query.equal("role", INTERNAL_CHAT_ROLES),
      Query.equal("enabled", true),
      Query.orderDesc("$createdAt"),
      Query.limit(200),
    ];

    let response;
    try {
      response = await databases.listDocuments({
        databaseId: DB(),
        collectionId: COL_USERS(),
        queries: [...baseQueries, Query.equal("isHidden", false)],
      });
    } catch (strictError) {
      if (!isQueryCompatibilityError(strictError)) throw strictError;
      response = await databases.listDocuments({
        databaseId: DB(),
        collectionId: COL_USERS(),
        queries: baseQueries,
      });
    }

    const excludedId = normalizeId(excludeUserId);
    return (response.documents || []).filter((doc) => {
      const role = String(doc?.role || "").trim().toLowerCase();
      if (role === "root") return false;
      if (!INTERNAL_CHAT_ROLES.includes(role)) return false;
      if (doc?.enabled === false) return false;
      if (doc?.isHidden === true) return false;
      if (excludedId && doc?.$id === excludedId) return false;
      return true;
    });
  },

  /**
   * List all conversations for a given user (either as client or owner).
   */
  async listConversations(userId, { role, includeClientConversations } = {}) {
    ensureAppwriteConfigured();
    const normalizedUserId = normalizeId(userId);
    const baseQueries = [
      Query.equal("enabled", true),
      Query.orderDesc("lastMessageAt"),
      Query.limit(100),
    ];

    if (role === "owner" && includeClientConversations) {
      const [asOwner, asClient] = await Promise.allSettled([
        databases.listDocuments({
          databaseId: DB(),
          collectionId: COL_CONVERSATIONS(),
          queries: [...baseQueries, Query.equal("ownerUserId", normalizedUserId)],
        }),
        databases.listDocuments({
          databaseId: DB(),
          collectionId: COL_CONVERSATIONS(),
          queries: [...baseQueries, Query.equal("clientUserId", normalizedUserId)],
        }),
      ]);

      const docs = [
        ...(asOwner.status === "fulfilled" ? asOwner.value.documents || [] : []),
        ...(asClient.status === "fulfilled" ? asClient.value.documents || [] : []),
      ];
      const unique = Array.from(new Map(docs.map((doc) => [doc.$id, doc])).values());
      const documents = sortByLastMessageAtDesc(unique);
      return {
        total: documents.length,
        documents,
      };
    }

    const queries = [...baseQueries];

    if (role === "client") {
      queries.push(Query.equal("clientUserId", normalizedUserId));
    } else if (role === "owner") {
      queries.push(Query.equal("ownerUserId", normalizedUserId));
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

    const senderId = normalizeId(senderUserId);
    const isSenderClient = normalizeId(conversation.clientUserId) === senderId;
    const isSenderOwner = normalizeId(conversation.ownerUserId) === senderId;
    const patch = {
      lastMessage: body.length > 120 ? `${body.slice(0, 120)}...` : body,
      lastMessageAt: new Date().toISOString(),
    };

    // Increment unread count for the other party.
    if (isSenderClient) {
      patch.ownerUnread = (conversation.ownerUnread || 0) + 1;
    } else if (isSenderOwner) {
      patch.clientUnread = (conversation.clientUnread || 0) + 1;
    } else if (senderRole === "client") {
      // Fallback for legacy payloads that do not include matching participant ids.
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
  async markAsRead(conversationId, myRole, myUserId) {
    ensureAppwriteConfigured();
    const conversation = await databases.getDocument({
      databaseId: DB(),
      collectionId: COL_CONVERSATIONS(),
      documentId: conversationId,
    });

    const normalizedMyUserId = normalizeId(myUserId);
    let mySide = null;

    if (normalizedMyUserId) {
      if (normalizeId(conversation.clientUserId) === normalizedMyUserId) {
        mySide = "client";
      } else if (normalizeId(conversation.ownerUserId) === normalizedMyUserId) {
        mySide = "owner";
      }
    }

    if (!mySide) {
      mySide = myRole === "client" ? "client" : "owner";
    }

    // Reset unread for the participant side opening this conversation.
    const patch = mySide === "client" ? { clientUnread: 0 } : { ownerUnread: 0 };
    await this.updateConversation(conversationId, patch);

    if (!normalizedMyUserId) return;

    // Mark incoming messages as read for read receipts.
    // Uses a small window (latest 100) to keep requests bounded.
    const unreadMessages = await databases.listDocuments({
      databaseId: DB(),
      collectionId: COL_MESSAGES(),
      queries: [
        Query.equal("conversationId", conversationId),
        Query.equal("enabled", true),
        Query.equal("readByRecipient", false),
        Query.limit(100),
      ],
    });

    const incomingUnread = (unreadMessages.documents || []).filter(
      (msg) => normalizeId(msg.senderUserId) !== normalizedMyUserId,
    );

    if (incomingUnread.length === 0) return;

    await Promise.allSettled(
      incomingUnread.map((msg) =>
        databases.updateDocument({
          databaseId: DB(),
          collectionId: COL_MESSAGES(),
          documentId: msg.$id,
          data: { readByRecipient: true },
        }),
      ),
    );
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
      console.warn(
        "[Chat] Realtime messages subscription unavailable:",
        err.message,
      );
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
      console.warn(
        "[Chat] Realtime conversations subscription unavailable:",
        err.message,
      );
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
