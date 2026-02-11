import env from "../env";
import { databases, ensureAppwriteConfigured, ID, Query } from "../api/appwriteClient";
import { executeJsonFunction } from "../utils/functions";

export const leadsService = {
  async listMine(userId, { status, propertyId } = {}) {
    ensureAppwriteConfigured();
    const queries = [
      Query.equal("propertyOwnerId", userId),
      Query.orderDesc("$createdAt"),
      Query.limit(200),
    ];
    if (status) queries.push(Query.equal("status", status));
    if (propertyId) queries.push(Query.equal("propertyId", propertyId));

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
        "No está configurada VITE_APPWRITE_FUNCTION_CREATE_LEAD_ID para crear leads públicos."
      );
    }

    return executeJsonFunction(functionId, payload);
  },

  async createDirectLead(payload, propertyOwnerId) {
    ensureAppwriteConfigured();
    return databases.createDocument({
      databaseId: env.appwrite.databaseId,
      collectionId: env.appwrite.collections.leads,
      documentId: ID.unique(),
      data: {
        ...payload,
        propertyOwnerId,
        status: payload.status || "new",
        enabled: true,
      },
    });
  },
};
