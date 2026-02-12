import env from "../env";
import { databases, ensureAppwriteConfigured, Query } from "../api/appwriteClient";
import { executeJsonFunction } from "../utils/functions";

const MAX_LIMIT = 200;

export const activityLogsService = {
  async list({
    action = "",
    actorUserId = "",
    entityType = "",
    severity = "",
    fromDate = "",
    toDate = "",
  } = {}) {
    ensureAppwriteConfigured();

    const functionId = env.appwrite.functions.activityLogQuery;
    if (functionId) {
      const result = await executeJsonFunction(functionId, {
        action,
        actorUserId,
        entityType,
        severity,
        fromDate,
        toDate,
        limit: MAX_LIMIT,
        offset: 0,
      });
      return {
        documents: result?.body?.data?.documents || [],
        total: result?.body?.data?.total || 0,
      };
    }

    const queries = [Query.orderDesc("$createdAt"), Query.limit(MAX_LIMIT)];
    if (action) queries.push(Query.equal("action", action));
    if (actorUserId) queries.push(Query.equal("actorUserId", actorUserId));
    if (entityType) queries.push(Query.equal("entityType", entityType));
    if (severity) queries.push(Query.equal("severity", severity));
    if (fromDate) queries.push(Query.greaterThanEqual("$createdAt", `${fromDate}T00:00:00.000Z`));
    if (toDate) queries.push(Query.lessThan("$createdAt", `${toDate}T23:59:59.999Z`));

    return databases.listDocuments({
      databaseId: env.appwrite.databaseId,
      collectionId: env.appwrite.collections.activityLogs,
      queries,
    });
  },
};
