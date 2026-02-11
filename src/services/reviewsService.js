import env from "../env";
import { databases, ensureAppwriteConfigured, Query } from "../api/appwriteClient";

const MAX_LIMIT = 200;

export const reviewsService = {
  async listMine(userId) {
    ensureAppwriteConfigured();
    if (!userId) return { documents: [], total: 0 };

    return databases.listDocuments({
      databaseId: env.appwrite.databaseId,
      collectionId: env.appwrite.collections.reviews,
      queries: [
        Query.equal("authorUserId", userId),
        Query.orderDesc("$createdAt"),
        Query.limit(MAX_LIMIT),
      ],
    });
  },
};
