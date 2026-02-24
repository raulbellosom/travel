import env from "../env";
import { databases, ensureAppwriteConfigured, Query } from "../api/appwriteClient";
import { executeJsonFunction } from "../utils/functions";

const MAX_LIMIT = 200;
const DEFAULT_AVAILABILITY_WINDOW_DAYS = 365;

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
    ownerUserId,
    {
      status = "",
      paymentStatus = "",
      propertyOwnerId = "",
      resourceOwnerUserId = "",
      resourceId = "",
    } = {},
  ) {
    ensureAppwriteConfigured();

    const resolvedOwnerUserId = String(
      ownerUserId || resourceOwnerUserId || propertyOwnerId || "",
    ).trim();

    const queries = [
      Query.equal("enabled", true),
      Query.orderDesc("$createdAt"),
      Query.limit(MAX_LIMIT),
    ];

    if (status) queries.push(Query.equal("status", status));
    if (paymentStatus) queries.push(Query.equal("paymentStatus", paymentStatus));
    if (resolvedOwnerUserId) {
      try {
        queries.push(Query.equal("resourceOwnerUserId", resolvedOwnerUserId));
      } catch {
        queries.push(Query.equal("propertyOwnerId", resolvedOwnerUserId));
      }
    }
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

  async updateStatus(
    reservationId,
    { status, paymentStatus, externalRef, specialRequests, paymentProvider } = {},
  ) {
    ensureAppwriteConfigured();
    const patch = {};
    if (status) patch.status = status;
    if (paymentStatus) patch.paymentStatus = paymentStatus;
    const normalizedExternalRef = String(externalRef || "").trim();
    if (normalizedExternalRef) patch.externalRef = normalizedExternalRef;
    const normalizedSpecialRequests = String(specialRequests || "").trim();
    if (normalizedSpecialRequests) {
      patch.specialRequests = normalizedSpecialRequests;
    }
    if (paymentProvider) patch.paymentProvider = paymentProvider;

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

  async createManualReservation(payload) {
    ensureAppwriteConfigured();
    const functionId = env.appwrite.functions.createManualReservation;
    if (!functionId) {
      throw new Error(
        "No esta configurada APPWRITE_FUNCTION_CREATE_MANUAL_RESERVATION_ID.",
      );
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

  async convertLeadToManualReservation(leadId, payload = {}) {
    const normalizedLeadId = String(leadId || "").trim();
    if (!normalizedLeadId) {
      throw new Error("leadId es requerido para convertir lead a reserva.");
    }

    return this.createManualReservation({
      ...payload,
      leadId: normalizedLeadId,
    });
  },

  async getResourceAvailability(
    resourceId,
    { from = "", to = "", days = DEFAULT_AVAILABILITY_WINDOW_DAYS } = {},
  ) {
    ensureAppwriteConfigured();
    const functionId = env.appwrite.functions.getResourceAvailability;
    if (!functionId) {
      throw new Error(
        "No esta configurada APPWRITE_FUNCTION_GET_RESOURCE_AVAILABILITY_ID.",
      );
    }

    const normalizedResourceId = String(resourceId || "").trim();
    if (!normalizedResourceId) {
      throw new Error("resourceId es requerido para consultar disponibilidad.");
    }

    const fromDate = String(from || "").trim();
    const toDate = String(to || "").trim();
    const now = new Date();
    const defaultFrom = now.toISOString();
    const defaultTo = new Date(
      now.getTime() + Math.max(1, Number(days) || 365) * 24 * 60 * 60 * 1000,
    ).toISOString();

    return executeJsonFunction(functionId, {
      resourceId: normalizedResourceId,
      from: fromDate || defaultFrom,
      to: toDate || defaultTo,
    });
  },
};
