import env from "../env";
import { executeJsonFunction } from "../utils/functions";

const ensureFunctionId = (functionId, envKey) => {
  if (!functionId) {
    throw new Error(`No esta configurada ${envKey}.`);
  }
};

export const marketingService = {
  async submitContact(payload) {
    const functionId = env.appwrite.functions.createMarketingContact;
    ensureFunctionId(
      functionId,
      "APPWRITE_FUNCTION_CREATE_MARKETING_CONTACT_ID",
    );
    return executeJsonFunction(functionId, payload);
  },

  async subscribeNewsletter(payload) {
    const functionId = env.appwrite.functions.createNewsletterSubscription;
    ensureFunctionId(
      functionId,
      "APPWRITE_FUNCTION_CREATE_NEWSLETTER_SUBSCRIPTION_ID",
    );
    return executeJsonFunction(functionId, payload);
  },
};

