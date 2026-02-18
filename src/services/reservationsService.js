import env from "../env";
import { databases, ensureAppwriteConfigured, Query } from "../api/appwriteClient";
import { executeJsonFunction } from "../utils/functions";

const MAX_LIMIT = 200;

export const reservationsService = {
  async listMine(userId) {
    ensureAppwriteConfigured();
    if (!userId) return { documents: [], total: 0 };

    return databases.listDocuments({
      databaseId: env.appwrite.databaseId,
      collectionId: env.appwrite.collections.reservations,
      queries: [
        Query.equal("guestUserId", userId),
        Query.orderDesc("$createdAt"),
        Query.limit(MAX_LIMIT),
      ],
    });
  },

  async listForOwner(
    _ownerUserId,
    { status = "", paymentStatus = "", propertyOwnerId = "", resourceId = "" } = {},
  ) {
    ensureAppwriteConfigured();

    const queries = [
      Query.equal("enabled", true),
      Query.orderDesc("$createdAt"),
      Query.limit(MAX_LIMIT),
    ];

    if (status) queries.push(Query.equal("status", status));
    if (paymentStatus) queries.push(Query.equal("paymentStatus", paymentStatus));
    if (propertyOwnerId) queries.push(Query.equal("propertyOwnerId", propertyOwnerId));
    if (resourceId) {
      try {
        queries.push(Query.equal("resourceId", resourceId));
      } catch {
        queries.push(Query.equal("propertyId", resourceId));
      }
    }

    return databases.listDocuments({
      databaseId: env.appwrite.databaseId,
      collectionId: env.appwrite.collections.reservations,
      queries,
    });
  },

  async updateStatus(reservationId, { status, paymentStatus }) {
    ensureAppwriteConfigured();
    const patch = {};
    if (status) patch.status = status;
    if (paymentStatus) patch.paymentStatus = paymentStatus;

    return databases.updateDocument({
      databaseId: env.appwrite.databaseId,
      collectionId: env.appwrite.collections.reservations,
      documentId: reservationId,
      data: patch,
    });
  },

  async createReservationPublic(payload) {
    ensureAppwriteConfigured();
    const functionId = env.appwrite.functions.createReservation;
    if (!functionId) {
      throw new Error("No esta configurada APPWRITE_FUNCTION_CREATE_RESERVATION_ID.");
    }

    const resolvedResourceId = String(
      payload.resourceId || payload.propertyId || "",
    ).trim();
    return executeJsonFunction(functionId, {
      ...payload,
      resourceId: resolvedResourceId || undefined,
      propertyId: resolvedResourceId || payload.propertyId,
    });
  },

  async createPaymentSession(payload) {
    ensureAppwriteConfigured();
    const functionId = env.appwrite.functions.createPaymentSession;
    if (!functionId) {
      throw new Error("No esta configurada APPWRITE_FUNCTION_CREATE_PAYMENT_SESSION_ID.");
    }

    return executeJsonFunction(functionId, payload);
  },
};
