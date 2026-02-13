import env from "../env";
import { ensureAppwriteConfigured } from "../api/appwriteClient";
import { executeJsonFunction } from "../utils/functions";

const EMPTY_RESULT = Object.freeze({
  properties: [],
  leads: [],
  reservations: [],
  payments: [],
  reviews: [],
  team: [],
  clients: [],
  profile: null,
  preferences: null,
  activityLogs: [],
  loadedAt: 0,
});

export const deepSearchService = {
  isConfigured() {
    return Boolean(env.appwrite.functions.deepSearchQuery);
  },

  async search({ query = "", limitPerModule = 8 } = {}) {
    ensureAppwriteConfigured();
    const functionId = env.appwrite.functions.deepSearchQuery;
    if (!functionId) {
      throw new Error("No esta configurada APPWRITE_FUNCTION_DEEP_SEARCH_QUERY_ID.");
    }

    const result = await executeJsonFunction(functionId, {
      query,
      limitPerModule,
    });

    return result?.body?.data || EMPTY_RESULT;
  },
};

export { EMPTY_RESULT as EMPTY_DEEP_SEARCH_RESULT };
