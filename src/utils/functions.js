import { ExecutionMethod } from "appwrite";
import { functions } from "../api/appwriteClient";

const parseExecutionBody = (execution) => {
  if (!execution?.responseBody) return {};
  try {
    return JSON.parse(execution.responseBody);
  } catch {
    return { raw: execution.responseBody };
  }
};

export const executeJsonFunction = async (functionId, payload) => {
  const execution = await functions.createExecution({
    functionId,
    body: JSON.stringify(payload || {}),
    async: false,
    method: ExecutionMethod.POST,
    xpath: "/",
    headers: {
      "content-type": "application/json",
    },
  });

  const body = parseExecutionBody(execution);
  const statusCode = execution?.responseStatusCode || 500;
  if (statusCode >= 400 || body?.ok === false || body?.success === false) {
    const message =
      body?.message ||
      body?.error ||
      `Execution ${execution.$id} falló con status ${statusCode}`;
    const error = new Error(message);
    error.code = statusCode;
    error.execution = execution;
    throw error;
  }

  return {
    execution,
    body,
  };
};
