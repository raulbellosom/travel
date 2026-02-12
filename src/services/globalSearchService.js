import env from "../env";
import { databases, ensureAppwriteConfigured, Query } from "../api/appwriteClient";

const MAX_ITEMS_PER_COLLECTION = 60;

const listDocumentsSafe = async ({ collectionId, queries }) => {
  if (!collectionId) return [];

  try {
    const response = await databases.listDocuments({
      databaseId: env.appwrite.databaseId,
      collectionId,
      queries,
    });
    return response?.documents || [];
  } catch {
    return [];
  }
};

const byRecency = [Query.orderDesc("$createdAt"), Query.limit(MAX_ITEMS_PER_COLLECTION)];

export const globalSearchService = {
  async getDataset({
    ownerUserId = "",
    role = "",
    canReadProperties = false,
    canReadLeads = false,
    canReadReservations = false,
    canReadPayments = false,
  } = {}) {
    ensureAppwriteConfigured();

    // ownerUserId/role remain in signature for backward compatibility.
    void ownerUserId;
    void role;

    const propertiesPromise = canReadProperties
      ? listDocumentsSafe({
          collectionId: env.appwrite.collections.properties,
          queries: [Query.equal("enabled", true), ...byRecency],
        })
      : Promise.resolve([]);

    const leadsPromise = canReadLeads
      ? listDocumentsSafe({
          collectionId: env.appwrite.collections.leads,
          queries: [Query.equal("enabled", true), ...byRecency],
        })
      : Promise.resolve([]);

    const reservationsPromise = canReadReservations
      ? listDocumentsSafe({
          collectionId: env.appwrite.collections.reservations,
          queries: [Query.equal("enabled", true), ...byRecency],
        })
      : Promise.resolve([]);

    const paymentsPromise = canReadPayments
      ? listDocumentsSafe({
          collectionId: env.appwrite.collections.reservationPayments,
          queries: [Query.equal("enabled", true), ...byRecency],
        })
      : Promise.resolve([]);

    const [properties, leads, reservations, payments] = await Promise.all([
      propertiesPromise,
      leadsPromise,
      reservationsPromise,
      paymentsPromise,
    ]);

    return {
      properties,
      leads,
      reservations,
      payments,
      loadedAt: Date.now(),
    };
  },
};
