import env from "../env";
import {
  databases,
  ensureAppwriteConfigured,
  Query,
} from "../api/appwriteClient";
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

  /**
   * Returns reviews for moderation.
   * NOTE: The `reviews` collection has no `resourceOwnerUserId` field, so
   * ownership filtering cannot be pushed to the DB layer. All reviews are
   * returned regardless of who calls this. Access should be gated at the
   * route level (`reviews.moderate` scope) and will feel global for any
   * user that reaches this call.
   */
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

  /**
   * Submit a new review for a completed reservation.
   * Requires authenticated user (client role).
   * @param {{ resourceId: string, reservationId: string, rating: number, comment: string, title?: string }} data
   */
  async createReview(data) {
    ensureAppwriteConfigured();
    const functionId = env.appwrite.functions.createReview;
    if (!functionId) {
      throw new Error("Review creation function is not configured");
    }
    return executeJsonFunction(functionId, data);
  },
};
