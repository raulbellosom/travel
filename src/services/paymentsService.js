import env from "../env";
import {
  databases,
  ensureAppwriteConfigured,
  Query,
} from "../api/appwriteClient";

const MAX_LIMIT = 200;

export const paymentsService = {
  async listForOwner(
    _ownerUserId,
    { provider = "", status = "", resourceOwnerUserId = "" } = {},
  ) {
    ensureAppwriteConfigured();

    const queries = [
      Query.equal("enabled", true),
      Query.orderDesc("$createdAt"),
      Query.limit(MAX_LIMIT),
    ];

    if (provider) queries.push(Query.equal("provider", provider));
    if (status) queries.push(Query.equal("status", status));
    if (resourceOwnerUserId)
      queries.push(Query.equal("resourceOwnerUserId", resourceOwnerUserId));

    return databases.listDocuments({
      databaseId: env.appwrite.databaseId,
      collectionId: env.appwrite.collections.reservationPayments,
      queries,
    });
  },
};
