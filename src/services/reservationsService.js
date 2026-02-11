import env from "../env";
import { databases, ensureAppwriteConfigured, Query } from "../api/appwriteClient";

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
};
