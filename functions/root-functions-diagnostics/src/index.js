import { Client, Databases, Functions, Query } from "node-appwrite";

const hasValue = (value) =>
  value !== undefined && value !== null && String(value).trim() !== "";

const getEnv = (...keys) => {
  for (const key of keys) {
    if (hasValue(process.env[key])) return process.env[key];
  }
  return "";
};

const normalize = (value, maxLength = 0) => {
  const output = String(value ?? "").trim();
  if (!maxLength) return output;
  return output.slice(0, maxLength);
};

const toBoolean = (value, fallback = false) => {
  if (!hasValue(value)) return fallback;
  return String(value).toLowerCase() === "true";
};

const parseBody = (req) => {
  try {
    const raw = req.body ?? req.payload ?? "{}";
    return typeof raw === "string" ? JSON.parse(raw) : raw;
  } catch {
    return {};
  }
};

const json = (res, status, body) => res.json(body, status);

const getAuthenticatedUserId = (req) => {
  const headers = req.headers || {};
  return normalize(
    headers["x-appwrite-user-id"] || headers["x-appwrite-userid"],
    64,
  );
};

const summarizeError = (error) => {
  const message =
    normalize(error?.response?.message || "", 220) ||
    normalize(error?.message || "", 220) ||
    "Unexpected error";
  const code = Number(error?.code || error?.response?.code || 0);
  return {
    code: Number.isFinite(code) ? code : 0,
    message,
  };
};

const extractSmokeMessage = (execution) => {
  const body = String(execution?.responseBody || "").trim();
  if (!body) return "";

  try {
    const parsed = JSON.parse(body);
    return normalize(parsed?.message || parsed?.error || body, 300);
  } catch {
    return normalize(body, 300);
  }
};

const APPWRITE_AUTH_ENV_GROUPS = [
  ["APPWRITE_FUNCTION_ENDPOINT", "APPWRITE_ENDPOINT"],
  ["APPWRITE_FUNCTION_PROJECT_ID", "APPWRITE_PROJECT_ID"],
  ["APPWRITE_FUNCTION_API_KEY", "APPWRITE_API_KEY"],
];

const DIAGNOSTICS_CATALOG = [
  {
    key: "createLead",
    title: "create-lead-public",
    functionIdEnvKey: "APPWRITE_FUNCTION_CREATE_LEAD_ID",
    requiredEnv: ["APPWRITE_DATABASE_ID"],
    recommendedEnv: [
      "APPWRITE_COLLECTION_PROPERTIES_ID",
      "APPWRITE_COLLECTION_LEADS_ID",
      "APPWRITE_COLLECTION_ACTIVITY_LOGS_ID",
    ],
    smokePayload: {},
  },
  {
    key: "emailVerification",
    title: "email-verification",
    functionIdEnvKey: "APPWRITE_FUNCTION_EMAIL_VERIFICATION_ID",
    requiredEnv: ["APPWRITE_DATABASE_ID"],
    recommendedEnv: [
      "APPWRITE_COLLECTION_USERS_ID",
      "APPWRITE_COLLECTION_EMAIL_VERIFICATIONS_ID",
      "APP_BASE_URL",
      "EMAIL_VERIFICATION_TTL_MINUTES",
      "EMAIL_VERIFICATION_RESEND_COOLDOWN_SECONDS",
      "EMAIL_SMTP_HOST",
      "EMAIL_SMTP_PORT",
      "EMAIL_SMTP_SECURE",
      "EMAIL_SMTP_USER",
      "EMAIL_SMTP_PASS",
      "EMAIL_FROM_NAME",
      "EMAIL_FROM_ADDRESS",
    ],
    smokePayload: {},
  },
  {
    key: "syncUserProfile",
    title: "sync-user-profile",
    functionIdEnvKey: "APPWRITE_FUNCTION_SYNC_USER_PROFILE_ID",
    requiredEnv: ["APPWRITE_DATABASE_ID"],
    recommendedEnv: [
      "APPWRITE_COLLECTION_USERS_ID",
      "APPWRITE_FUNCTION_EMAIL_VERIFICATION_ID",
    ],
    smokePayload: {},
  },
  {
    key: "userCreateProfile",
    title: "user-create-profile",
    functionIdEnvKey: "APPWRITE_FUNCTION_USER_CREATE_PROFILE_ID",
    requiredEnv: ["APPWRITE_DATABASE_ID"],
    recommendedEnv: [
      "APPWRITE_COLLECTION_USERS_ID",
      "APPWRITE_COLLECTION_USER_PREFERENCES_ID",
      "APPWRITE_FUNCTION_EMAIL_VERIFICATION_ID",
    ],
    smokePayload: {},
  },
  {
    key: "sendLeadNotification",
    title: "send-lead-notification",
    functionIdEnvKey: "APPWRITE_FUNCTION_SEND_LEAD_NOTIFICATION_ID",
    requiredEnv: [
      "APPWRITE_DATABASE_ID",
      "EMAIL_SMTP_HOST",
      "EMAIL_SMTP_USER",
      "EMAIL_SMTP_PASS",
      "EMAIL_FROM_ADDRESS",
    ],
    recommendedEnv: [
      "APPWRITE_COLLECTION_PROPERTIES_ID",
      "APPWRITE_COLLECTION_USERS_ID",
      "APP_BASE_URL",
      "EMAIL_SMTP_PORT",
      "EMAIL_SMTP_SECURE",
      "EMAIL_FROM_NAME",
    ],
    smokePayload: {},
  },
  {
    key: "propertyViewCounter",
    title: "property-view-counter",
    functionIdEnvKey: "APPWRITE_FUNCTION_PROPERTY_VIEW_COUNTER_ID",
    requiredEnv: ["APPWRITE_DATABASE_ID"],
    recommendedEnv: ["APPWRITE_COLLECTION_PROPERTIES_ID"],
    smokePayload: {},
  },
  {
    key: "createReservation",
    title: "create-reservation-public",
    functionIdEnvKey: "APPWRITE_FUNCTION_CREATE_RESERVATION_ID",
    requiredEnv: ["APPWRITE_DATABASE_ID"],
    recommendedEnv: [
      "APPWRITE_COLLECTION_PROPERTIES_ID",
      "APPWRITE_COLLECTION_RESERVATIONS_ID",
      "APPWRITE_COLLECTION_ACTIVITY_LOGS_ID",
    ],
    smokePayload: {},
  },
  {
    key: "reservationCreatedNotification",
    title: "reservation-created-notification",
    functionIdEnvKey: "APPWRITE_FUNCTION_RESERVATION_CREATED_NOTIFICATION_ID",
    requiredEnv: ["APPWRITE_DATABASE_ID"],
    recommendedEnv: [
      "APPWRITE_COLLECTION_RESERVATIONS_ID",
      "APPWRITE_COLLECTION_ACTIVITY_LOGS_ID",
    ],
    smokePayload: {},
  },
  {
    key: "createPaymentSession",
    title: "create-payment-session",
    functionIdEnvKey: "APPWRITE_FUNCTION_CREATE_PAYMENT_SESSION_ID",
    requiredEnv: ["APPWRITE_DATABASE_ID"],
    recommendedEnv: [
      "APP_BASE_URL",
      "APPWRITE_COLLECTION_RESERVATIONS_ID",
      "APPWRITE_COLLECTION_RESERVATION_PAYMENTS_ID",
      "APPWRITE_COLLECTION_ACTIVITY_LOGS_ID",
      "PAYMENT_DEFAULT_PROVIDER",
      "PAYMENT_SUCCESS_URL",
      "PAYMENT_CANCEL_URL",
      "STRIPE_SECRET_KEY",
      "MERCADOPAGO_ACCESS_TOKEN",
    ],
    smokePayload: {},
  },
  {
    key: "paymentWebhookStripe",
    title: "payment-webhook-stripe",
    functionIdEnvKey: "APPWRITE_FUNCTION_PAYMENT_WEBHOOK_STRIPE_ID",
    requiredEnv: ["APPWRITE_DATABASE_ID", "STRIPE_WEBHOOK_SECRET"],
    recommendedEnv: [
      "APPWRITE_COLLECTION_RESERVATIONS_ID",
      "APPWRITE_COLLECTION_RESERVATION_PAYMENTS_ID",
      "APPWRITE_COLLECTION_ACTIVITY_LOGS_ID",
      "APPWRITE_FUNCTION_ISSUE_RESERVATION_VOUCHER_ID",
    ],
    smokePayload: {},
  },
  {
    key: "paymentWebhookMercadoPago",
    title: "payment-webhook-mercadopago",
    functionIdEnvKey: "APPWRITE_FUNCTION_PAYMENT_WEBHOOK_MERCADOPAGO_ID",
    requiredEnv: ["APPWRITE_DATABASE_ID", "MERCADOPAGO_WEBHOOK_SECRET"],
    recommendedEnv: [
      "APPWRITE_COLLECTION_RESERVATIONS_ID",
      "APPWRITE_COLLECTION_RESERVATION_PAYMENTS_ID",
      "APPWRITE_COLLECTION_ACTIVITY_LOGS_ID",
      "APPWRITE_FUNCTION_ISSUE_RESERVATION_VOUCHER_ID",
    ],
    smokePayload: {},
  },
  {
    key: "issueReservationVoucher",
    title: "issue-reservation-voucher",
    functionIdEnvKey: "APPWRITE_FUNCTION_ISSUE_RESERVATION_VOUCHER_ID",
    requiredEnv: ["APPWRITE_DATABASE_ID"],
    recommendedEnv: [
      "APP_BASE_URL",
      "APPWRITE_COLLECTION_RESERVATIONS_ID",
      "APPWRITE_COLLECTION_RESERVATION_VOUCHERS_ID",
      "APPWRITE_COLLECTION_ACTIVITY_LOGS_ID",
    ],
    smokePayload: {},
  },
  {
    key: "createReview",
    title: "create-review-public",
    functionIdEnvKey: "APPWRITE_FUNCTION_CREATE_REVIEW_ID",
    requiredEnv: ["APPWRITE_DATABASE_ID"],
    recommendedEnv: [
      "APPWRITE_COLLECTION_PROPERTIES_ID",
      "APPWRITE_COLLECTION_RESERVATIONS_ID",
      "APPWRITE_COLLECTION_REVIEWS_ID",
      "APPWRITE_COLLECTION_ACTIVITY_LOGS_ID",
    ],
    smokePayload: {},
  },
  {
    key: "moderateReview",
    title: "moderate-review",
    functionIdEnvKey: "APPWRITE_FUNCTION_MODERATE_REVIEW_ID",
    requiredEnv: ["APPWRITE_DATABASE_ID"],
    recommendedEnv: [
      "APPWRITE_COLLECTION_USERS_ID",
      "APPWRITE_COLLECTION_REVIEWS_ID",
      "APPWRITE_COLLECTION_ACTIVITY_LOGS_ID",
    ],
    smokePayload: {},
  },
  {
    key: "dashboardMetrics",
    title: "dashboard-metrics-aggregator",
    functionIdEnvKey: "APPWRITE_FUNCTION_DASHBOARD_METRICS_ID",
    requiredEnv: ["APPWRITE_DATABASE_ID"],
    recommendedEnv: [
      "APPWRITE_COLLECTION_PROPERTIES_ID",
      "APPWRITE_COLLECTION_LEADS_ID",
      "APPWRITE_COLLECTION_RESERVATIONS_ID",
      "APPWRITE_COLLECTION_RESERVATION_PAYMENTS_ID",
      "APPWRITE_COLLECTION_ANALYTICS_DAILY_ID",
      "APPWRITE_COLLECTION_ACTIVITY_LOGS_ID",
    ],
    smokePayload: {},
  },
  {
    key: "staffUserManagement",
    title: "staff-user-management",
    functionIdEnvKey: "APPWRITE_FUNCTION_STAFF_USER_MANAGEMENT_ID",
    requiredEnv: ["APPWRITE_DATABASE_ID"],
    recommendedEnv: [
      "APPWRITE_COLLECTION_USERS_ID",
      "APPWRITE_COLLECTION_USER_PREFERENCES_ID",
      "APPWRITE_COLLECTION_ACTIVITY_LOGS_ID",
      "APPWRITE_BUCKET_AVATARS_ID",
    ],
    smokePayload: {},
  },
  {
    key: "activityLogQuery",
    title: "activity-log-query",
    functionIdEnvKey: "APPWRITE_FUNCTION_ACTIVITY_LOG_QUERY_ID",
    requiredEnv: ["APPWRITE_DATABASE_ID"],
    recommendedEnv: [
      "APPWRITE_COLLECTION_USERS_ID",
      "APPWRITE_COLLECTION_ACTIVITY_LOGS_ID",
    ],
    smokePayload: {},
  },
  {
    key: "rootDiagnostics",
    title: "root-functions-diagnostics",
    functionIdEnvKey: "APPWRITE_FUNCTION_ROOT_DIAGNOSTICS_ID",
    requiredEnv: ["APPWRITE_DATABASE_ID", "APPWRITE_COLLECTION_USERS_ID"],
    recommendedEnv: [],
    smokePayload: {},
    smokeEnabled: false,
  },
];

const buildConfig = () => ({
  endpoint: getEnv("APPWRITE_FUNCTION_ENDPOINT", "APPWRITE_ENDPOINT"),
  projectId: getEnv("APPWRITE_FUNCTION_PROJECT_ID", "APPWRITE_PROJECT_ID"),
  apiKey: getEnv("APPWRITE_FUNCTION_API_KEY", "APPWRITE_API_KEY"),
  databaseId: getEnv("APPWRITE_DATABASE_ID") || "main",
  usersCollectionId: getEnv("APPWRITE_COLLECTION_USERS_ID") || "users",
  selfFunctionId: getEnv("APPWRITE_FUNCTION_ROOT_DIAGNOSTICS_ID"),
});

const withFunctionIds = () =>
  DIAGNOSTICS_CATALOG.map((item) => ({
    ...item,
    functionId: normalize(getEnv(item.functionIdEnvKey), 120),
  }));

const mapExecution = (execution) => {
  if (!execution) return null;

  return {
    executionId: execution.$id || "",
    status: normalize(execution.status, 40),
    responseStatusCode: Number(execution.responseStatusCode || 0),
    duration: Number(execution.duration || 0),
    createdAt: execution.$createdAt || "",
    trigger: normalize(execution.trigger, 40),
  };
};

const checkEnv = (variableKeys, descriptor) => {
  const keySet = new Set(variableKeys);

  const missingAuthGroups = APPWRITE_AUTH_ENV_GROUPS.filter(
    (group) => !group.some((item) => keySet.has(item)),
  ).map((group) => group.join(" | "));

  const missingRequired = descriptor.requiredEnv.filter(
    (key) => !keySet.has(key),
  );
  const missingRecommended = descriptor.recommendedEnv.filter(
    (key) => !keySet.has(key),
  );

  let status = "ok";
  if (missingAuthGroups.length > 0 || missingRequired.length > 0) {
    status = "error";
  } else if (missingRecommended.length > 0) {
    status = "warning";
  }

  return {
    status,
    missingAuthGroups,
    missingRequired,
    missingRecommended,
  };
};

const safeGetFunction = async (functionsService, functionId) => {
  if (typeof functionsService.get !== "function") {
    throw new Error("Functions.get is not available in this runtime");
  }

  try {
    return await functionsService.get(functionId);
  } catch {
    return functionsService.get({ functionId });
  }
};

const safeListVariables = async (functionsService, functionId) => {
  if (typeof functionsService.listVariables !== "function") {
    throw new Error("Functions.listVariables is not available in this runtime");
  }

  try {
    return await functionsService.listVariables(functionId);
  } catch {
    return functionsService.listVariables({ functionId });
  }
};

const safeListExecutions = async (functionsService, functionId) => {
  if (typeof functionsService.listExecutions !== "function") {
    throw new Error(
      "Functions.listExecutions is not available in this runtime",
    );
  }

  const queries = [Query.limit(1)];
  try {
    return await functionsService.listExecutions(functionId, queries, false);
  } catch {
    return functionsService.listExecutions({
      functionId,
      queries,
      total: false,
    });
  }
};

const safeCreateExecution = async ({
  functionsService,
  functionId,
  payload,
}) => {
  if (typeof functionsService.createExecution !== "function") {
    throw new Error(
      "Functions.createExecution is not available in this runtime",
    );
  }

  const body = JSON.stringify(payload || {});
  const headers = {
    "content-type": "application/json",
  };

  try {
    return await functionsService.createExecution(
      functionId,
      body,
      false,
      "/",
      "POST",
      headers,
    );
  } catch {
    return functionsService.createExecution({
      functionId,
      body,
      async: false,
      xpath: "/",
      method: "POST",
      headers,
    });
  }
};

const listVariableKeys = (variablesResponse) => {
  const variables = Array.isArray(variablesResponse?.variables)
    ? variablesResponse.variables
    : [];

  return Array.from(
    new Set(
      variables
        .map((item) => normalize(item?.key, 120))
        .filter(Boolean)
        .map((item) => item.toUpperCase()),
    ),
  ).sort();
};

const buildResultSummary = (results) => {
  const summary = {
    total: results.length,
    ok: 0,
    warning: 0,
    error: 0,
    smokePassed: 0,
    smokeFailed: 0,
    smokeSkipped: 0,
  };

  for (const item of results) {
    if (item.status === "ok") summary.ok += 1;
    if (item.status === "warning") summary.warning += 1;
    if (item.status === "error") summary.error += 1;

    if (item.smoke?.attempted && item.smoke.ok === true)
      summary.smokePassed += 1;
    if (item.smoke?.attempted && item.smoke.ok === false)
      summary.smokeFailed += 1;
    if (!item.smoke?.attempted) summary.smokeSkipped += 1;
  }

  return summary;
};

const resolveResultStatus = (item, includeSmoke) => {
  if (!item.functionIdConfigured) return "error";
  if (!item.functionExists) return "error";
  if (item.env.status === "error") return "error";
  if (includeSmoke && item.smoke.attempted && item.smoke.ok === false)
    return "error";
  if (item.env.status === "warning") return "warning";
  return "ok";
};

const buildFunctionDiagnostics = async ({
  functionsService,
  descriptor,
  includeSmoke,
  selfFunctionId,
}) => {
  const baseResult = {
    key: descriptor.key,
    title: descriptor.title,
    functionIdEnvKey: descriptor.functionIdEnvKey,
    functionId: descriptor.functionId,
    functionIdConfigured: Boolean(descriptor.functionId),
    functionExists: false,
    functionMetadata: null,
    env: {
      status: "error",
      availableKeys: [],
      missingAuthGroups: APPWRITE_AUTH_ENV_GROUPS.map((group) =>
        group.join(" | "),
      ),
      missingRequired: descriptor.requiredEnv,
      missingRecommended: descriptor.recommendedEnv,
    },
    latestExecution: null,
    smoke: {
      attempted: false,
      ok: null,
      executionId: "",
      responseStatusCode: 0,
      duration: 0,
      status: "",
      message: "",
      error: "",
    },
    errors: [],
    status: "error",
  };

  if (!descriptor.functionId) {
    baseResult.errors.push({
      code: 0,
      message: `Missing function id variable: ${descriptor.functionIdEnvKey}`,
    });
    return baseResult;
  }

  try {
    const functionMeta = await safeGetFunction(
      functionsService,
      descriptor.functionId,
    );
    baseResult.functionExists = true;
    baseResult.functionMetadata = {
      name: normalize(functionMeta?.name, 120),
      enabled: Boolean(functionMeta?.enabled),
      deploymentId: normalize(functionMeta?.deploymentId, 120),
      runtime: normalize(functionMeta?.runtime, 80),
      execute: Array.isArray(functionMeta?.execute)
        ? functionMeta.execute.map((value) => normalize(value, 80))
        : [],
    };
  } catch (err) {
    baseResult.errors.push(summarizeError(err));
  }

  try {
    const variablesResponse = await safeListVariables(
      functionsService,
      descriptor.functionId,
    );
    const variableKeys = listVariableKeys(variablesResponse);
    const envCheck = checkEnv(variableKeys, descriptor);
    baseResult.env = {
      status: envCheck.status,
      availableKeys: variableKeys,
      missingAuthGroups: envCheck.missingAuthGroups,
      missingRequired: envCheck.missingRequired,
      missingRecommended: envCheck.missingRecommended,
    };
  } catch (err) {
    baseResult.errors.push(summarizeError(err));
  }

  try {
    const executions = await safeListExecutions(
      functionsService,
      descriptor.functionId,
    );
    const latestExecution = Array.isArray(executions?.executions)
      ? executions.executions[0]
      : null;
    baseResult.latestExecution = mapExecution(latestExecution);
  } catch (err) {
    baseResult.errors.push(summarizeError(err));
  }

  const shouldRunSmoke =
    includeSmoke &&
    descriptor.smokeEnabled !== false &&
    descriptor.functionId !== selfFunctionId;

  if (shouldRunSmoke) {
    baseResult.smoke.attempted = true;

    try {
      const execution = await safeCreateExecution({
        functionsService,
        functionId: descriptor.functionId,
        payload: descriptor.smokePayload,
      });
      const responseStatusCode = Number(execution?.responseStatusCode || 0);
      const ok = responseStatusCode > 0 && responseStatusCode < 500;

      baseResult.smoke = {
        attempted: true,
        ok,
        executionId: execution?.$id || "",
        responseStatusCode,
        duration: Number(execution?.duration || 0),
        status: normalize(execution?.status, 40),
        message: extractSmokeMessage(execution),
        error: "",
      };
    } catch (err) {
      const parsed = summarizeError(err);
      baseResult.smoke = {
        attempted: true,
        ok: false,
        executionId: "",
        responseStatusCode: parsed.code || 0,
        duration: 0,
        status: "error",
        message: "",
        error: parsed.message,
      };
      baseResult.errors.push(parsed);
    }
  }

  baseResult.status = resolveResultStatus(baseResult, includeSmoke);
  return baseResult;
};

const assertRootUser = async ({ db, config, actorUserId }) => {
  if (!actorUserId) {
    const error = new Error("Missing authenticated user context");
    error.code = 401;
    throw error;
  }

  const userDoc = await db.getDocument(
    config.databaseId,
    config.usersCollectionId,
    actorUserId,
  );
  const role = normalize(userDoc?.role, 40).toLowerCase();
  if (role !== "root") {
    const error = new Error("This endpoint is root-only");
    error.code = 403;
    throw error;
  }
};

export default async ({ req, res, error }) => {
  if (req.method && req.method.toUpperCase() !== "POST") {
    return json(res, 405, {
      ok: false,
      success: false,
      code: "METHOD_NOT_ALLOWED",
      message: "Use POST",
    });
  }

  const config = buildConfig();
  if (!config.endpoint || !config.projectId || !config.apiKey) {
    return json(res, 500, {
      ok: false,
      success: false,
      code: "ENV_MISSING",
      message: "Missing Appwrite credentials",
    });
  }

  const client = new Client()
    .setEndpoint(config.endpoint)
    .setProject(config.projectId)
    .setKey(config.apiKey);

  const db = new Databases(client);
  const functionsService = new Functions(client);

  const actorUserId = getAuthenticatedUserId(req);
  try {
    await assertRootUser({ db, config, actorUserId });
  } catch (authError) {
    const statusCode = Number(authError?.code || 403);
    return json(res, statusCode, {
      ok: false,
      success: false,
      code: statusCode === 401 ? "AUTH_REQUIRED" : "FORBIDDEN",
      message: normalize(authError?.message, 220) || "Forbidden",
    });
  }

  const payload = parseBody(req);
  const includeSmoke = toBoolean(payload?.includeSmoke, false);
  const requestedKeys = Array.isArray(payload?.keys)
    ? payload.keys.map((item) => normalize(item, 120)).filter(Boolean)
    : [];

  const catalogWithIds = withFunctionIds();
  const selectedCatalog =
    requestedKeys.length > 0
      ? catalogWithIds.filter((item) => requestedKeys.includes(item.key))
      : catalogWithIds;

  try {
    const results = [];
    for (const descriptor of selectedCatalog) {
      // Sequential processing avoids spikes and reduces API rate-limit pressure.
      const item = await buildFunctionDiagnostics({
        functionsService,
        descriptor,
        includeSmoke,
        selfFunctionId: config.selfFunctionId,
      });
      results.push(item);
    }

    const summary = buildResultSummary(results);

    return json(res, 200, {
      ok: true,
      success: true,
      code: "ROOT_FUNCTIONS_DIAGNOSTICS_READY",
      data: {
        generatedAt: new Date().toISOString(),
        includeSmoke,
        actorUserId,
        summary,
        results,
      },
    });
  } catch (err) {
    error(`root-functions-diagnostics failed: ${err.message}`);
    return json(res, 500, {
      ok: false,
      success: false,
      code: "INTERNAL_ERROR",
      message: normalize(err?.message, 220) || "Internal error",
    });
  }
};
