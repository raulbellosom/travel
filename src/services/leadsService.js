import env from "../env";
import { databases, ensureAppwriteConfigured, ID, Query } from "../api/appwriteClient";
import { executeJsonFunction } from "../utils/functions";

export const leadsService = {
  async listMine(
    _userId,
    { status, resourceId, propertyId, propertyOwnerId } = {},
  ) {
    ensureAppwriteConfigured();
    const queries = [
      Query.equal("enabled", true),
      Query.orderDesc("$createdAt"),
      Query.limit(200),
    ];
    if (status) queries.push(Query.equal("status", status));
    const resolvedResourceId = resourceId || propertyId;
    if (resolvedResourceId) {
      try {
        queries.push(Query.equal("resourceId", resolvedResourceId));
      } catch {
        queries.push(Query.equal("propertyId", resolvedResourceId));
      }
    }
    if (propertyOwnerId) queries.push(Query.equal("propertyOwnerId", propertyOwnerId));

    return databases.listDocuments({
      databaseId: env.appwrite.databaseId,
      collectionId: env.appwrite.collections.leads,
      queries,
    });
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

  async createPublicLead(payload) {
    ensureAppwriteConfigured();
    const functionId = env.appwrite.functions.createLead;
    if (!functionId) {
      throw new Error(
        "No esta configurada APPWRITE_FUNCTION_CREATE_LEAD_ID para crear leads publicos."
      );
    }

    return executeJsonFunction(functionId, payload);
  },

  async createDirectLead(payload, propertyOwnerId) {
    ensureAppwriteConfigured();
    const resolvedResourceId = String(
      payload.resourceId || payload.propertyId || "",
    ).trim();
    return databases.createDocument({
      databaseId: env.appwrite.databaseId,
      collectionId: env.appwrite.collections.leads,
      documentId: ID.unique(),
      data: {
        ...payload,
        resourceId: resolvedResourceId || undefined,
        propertyId: resolvedResourceId || payload.propertyId,
        propertyOwnerId,
        status: payload.status || "new",
        enabled: true,
      },
    });
  },
};
