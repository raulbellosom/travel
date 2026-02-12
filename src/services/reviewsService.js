import env from "../env";
import { databases, ensureAppwriteConfigured, Query } from "../api/appwriteClient";
import { executeJsonFunction } from "../utils/functions";

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

  async listForModeration(_ownerUserId, { status = "" } = {}) {
    ensureAppwriteConfigured();

    const queries = [
      Query.equal("enabled", true),
      Query.orderDesc("$createdAt"),
      Query.limit(MAX_LIMIT),
    ];

    if (status) queries.push(Query.equal("status", status));

    return databases.listDocuments({
      databaseId: env.appwrite.databaseId,
      collectionId: env.appwrite.collections.reviews,
      queries,
    });
  },

  async moderateReview(reviewId, status) {
    ensureAppwriteConfigured();
    const functionId = env.appwrite.functions.moderateReview;
    if (functionId) {
      return executeJsonFunction(functionId, {
        reviewId,
        status,
      });
    }

    const patch = { status };
    if (status === "published") {
      patch.publishedAt = new Date().toISOString();
    }

    return databases.updateDocument({
      databaseId: env.appwrite.databaseId,
      collectionId: env.appwrite.collections.reviews,
      documentId: reviewId,
      data: patch,
    });
  },
};
