import env from "../env";
import { executeJsonFunction } from "../utils/functions";

const getFunctionId = () => {
  const functionId = String(env.appwrite.functions.rootDiagnostics || "").trim();
  if (!functionId) {
    throw new Error("No esta configurada APPWRITE_FUNCTION_ROOT_DIAGNOSTICS_ID.");
  }
  return functionId;
};

export const rootFunctionsDiagnosticsService = {
  async run({ includeSmoke = false, keys = [] } = {}) {
    const functionId = getFunctionId();
    const result = await executeJsonFunction(functionId, {
      includeSmoke: Boolean(includeSmoke),
      keys: Array.isArray(keys) ? keys : [],
    });
    return result?.body?.data || {};
  },
};
