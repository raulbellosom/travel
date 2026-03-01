import env from "../env";
import { databases, ensureAppwriteConfigured, ID, Query } from "../api/appwriteClient";
import { executeJsonFunction } from "../utils/functions";

const META_JSON_MAX_LENGTH = 8000;
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

const parseJsonString = (value) => {
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

export const leadsService = {
  async listMine(
    _userId,
    { status, intent, contactChannel, resourceId, propertyId, propertyOwnerId } = {},
  ) {
    ensureAppwriteConfigured();
    const queries = [
      Query.equal("enabled", true),
      Query.orderDesc("$createdAt"),
      Query.limit(200),
    ];
    if (status) queries.push(Query.equal("status", status));
    if (intent) queries.push(Query.equal("intent", intent));
    if (contactChannel) queries.push(Query.equal("contactChannel", contactChannel));
    const resolvedResourceId = resourceId || propertyId;
    if (resolvedResourceId) {
      try {
        queries.push(Query.equal("resourceId", resolvedResourceId));
      } catch {
        queries.push(Query.equal("propertyId", resolvedResourceId));
      }
    }
    if (propertyOwnerId) {
      queries.push(Query.equal("resourceOwnerUserId", propertyOwnerId));
    }

    try {
      return await databases.listDocuments({
        databaseId: env.appwrite.databaseId,
        collectionId: env.appwrite.collections.leads,
        queries,
      });
    } catch (strictError) {
      if (!isQueryCompatibilityError(strictError) || !contactChannel) {
        throw strictError;
      }

      const fallbackQueries = queries.filter(
        (query) => !String(query).includes("contactChannel"),
      );
      fallbackQueries.push(Query.equal("source", contactChannel));

      return databases.listDocuments({
        databaseId: env.appwrite.databaseId,
        collectionId: env.appwrite.collections.leads,
        queries: fallbackQueries,
      });
    }
  },

  async updateLead(leadId, patch) {
    ensureAppwriteConfigured();
    return databases.updateDocument({
      databaseId: env.appwrite.databaseId,
      collectionId: env.appwrite.collections.leads,
      documentId: leadId,
      data: patch,
    });
  },

  async createLead(payload) {
    ensureAppwriteConfigured();
    const functionId = env.appwrite.functions.createLead;
    if (!functionId) {
      throw new Error(
        "No esta configurada APPWRITE_FUNCTION_CREATE_LEAD_ID para crear leads autenticados."
      );
    }

    const rawMeta =
      payload?.meta && typeof payload.meta === "object" && !Array.isArray(payload.meta)
        ? payload.meta
        : parseJsonString(payload?.metaJson);

    const serializedMeta = JSON.stringify(rawMeta || {});
    if (serializedMeta.length > META_JSON_MAX_LENGTH) {
      throw new Error(
        `El payload de meta excede ${META_JSON_MAX_LENGTH} caracteres.`,
      );
    }

    const normalizedPayload = {
      ...payload,
      contactChannel: payload?.contactChannel || payload?.source || "resource_chat",
      meta: rawMeta,
    };

    return executeJsonFunction(functionId, normalizedPayload);
  },

  async findLatestByConversation(conversationId) {
    ensureAppwriteConfigured();
    const normalizedConversationId = String(conversationId || "").trim();
    if (!normalizedConversationId) return null;

    const response = await databases.listDocuments({
      databaseId: env.appwrite.databaseId,
      collectionId: env.appwrite.collections.leads,
      queries: [
        Query.equal("conversationId", normalizedConversationId),
        Query.equal("enabled", true),
        Query.orderDesc("$createdAt"),
        Query.limit(1),
      ],
    });

    return response.documents?.[0] || null;
  },

  async createDirectLead(payload, propertyOwnerId) {
    ensureAppwriteConfigured();
    const resolvedResourceId = String(
      payload.resourceId || payload.propertyId || "",
    ).trim();
    const userId = String(payload.userId || "").trim();
    const lastMessage = String(
      payload.lastMessage || payload.message || "",
    ).trim();
    return databases.createDocument({
      databaseId: env.appwrite.databaseId,
      collectionId: env.appwrite.collections.leads,
      documentId: ID.unique(),
      data: {
        resourceId: resolvedResourceId || undefined,
        resourceOwnerUserId: propertyOwnerId,
        userId: userId || undefined,
        lastMessage,
        contactChannel: payload.contactChannel || payload.source || "resource_cta_form",
        source: payload.source || payload.contactChannel || "resource_cta_form",
        intent: payload.intent || "info_request",
        conversationId: payload.conversationId || undefined,
        metaJson: payload.metaJson || undefined,
        isArchived: Boolean(payload.isArchived || false),
        status: payload.status || "new",
        notes: payload.notes || undefined,
        enabled: true,
      },
    });
  },
};
