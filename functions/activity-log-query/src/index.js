import { Client, Databases, ID, Query } from "node-appwrite";

const hasValue = (value) =>
  value !== undefined && value !== null && String(value).trim() !== "";

const getEnv = (...keys) => {
  for (const key of keys) {
    if (hasValue(process.env[key])) return process.env[key];
  }
  return "";
};

const cfg = () => ({
  endpoint: getEnv("APPWRITE_FUNCTION_ENDPOINT", "APPWRITE_ENDPOINT"),
  projectId: getEnv("APPWRITE_FUNCTION_PROJECT_ID", "APPWRITE_PROJECT_ID"),
  apiKey: getEnv("APPWRITE_FUNCTION_API_KEY", "APPWRITE_API_KEY"),
  databaseId: getEnv("APPWRITE_DATABASE_ID") || "main",
  usersCollectionId: getEnv("APPWRITE_COLLECTION_USERS_ID") || "users",
  activityLogsCollectionId: getEnv("APPWRITE_COLLECTION_ACTIVITY_LOGS_ID") || "activity_logs",
});

const parseBody = (req) => {
  try {
    const raw = req.body ?? req.payload ?? "{}";
    return typeof raw === "string" ? JSON.parse(raw) : raw;
  } catch {
    return {};
  }
};

const json = (res, status, body) => res.json(body, status);

const normalize = (value, maxLength = 0) => {
  const output = String(value ?? "").trim();
  if (!maxLength) return output;
  return output.slice(0, maxLength);
};

const getActorUserId = (req) => {
  const headers = req.headers || {};
  return normalize(headers["x-appwrite-user-id"] || headers["x-appwrite-userid"], 64);
};

const isValidDateOnly = (value) => /^\d{4}-\d{2}-\d{2}$/.test(String(value || ""));

const toStartOfDayIso = (dateOnly) => `${dateOnly}T00:00:00.000Z`;

const addDaysDateOnly = (dateOnly, days) => {
  const date = new Date(`${dateOnly}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) return "";
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
};

const safeJson = (value, max = 20000) => {
  try {
    return JSON.stringify(value).slice(0, max);
  } catch {
    return "{}";
  }
};

const writeActivityLog = async ({ db, config, data, logError }) => {
  if (!config.activityLogsCollectionId) return;
  try {
    await db.createDocument(
      config.databaseId,
      config.activityLogsCollectionId,
      ID.unique(),
      data,
    );
  } catch (err) {
    if (typeof logError === "function") {
      logError(`activity_logs write skipped: ${err.message}`);
    }
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

  const config = cfg();
  if (!config.endpoint || !config.projectId || !config.apiKey) {
    return json(res, 500, {
      ok: false,
      success: false,
      code: "ENV_MISSING",
      message: "Missing Appwrite credentials",
    });
  }

  const actorUserId = getActorUserId(req);
  if (!actorUserId) {
    return json(res, 401, {
      ok: false,
      success: false,
      code: "UNAUTHORIZED",
      message: "Missing authenticated user context",
    });
  }

  const body = parseBody(req);
  const limit = Math.min(200, Math.max(1, Number(body.limit || 50)));
  const offset = Math.max(0, Number(body.offset || 0));
  const action = normalize(body.action, 80);
  const entityType = normalize(body.entityType, 80);
  const actorFilter = normalize(body.actorUserId, 64);
  const severity = normalize(body.severity, 20);
  const fromDate = normalize(body.fromDate, 10);
  const toDate = normalize(body.toDate, 10);

  if (fromDate && !isValidDateOnly(fromDate)) {
    return json(res, 422, {
      ok: false,
      success: false,
      code: "VALIDATION_ERROR",
      message: "fromDate must use YYYY-MM-DD format",
    });
  }

  if (toDate && !isValidDateOnly(toDate)) {
    return json(res, 422, {
      ok: false,
      success: false,
      code: "VALIDATION_ERROR",
      message: "toDate must use YYYY-MM-DD format",
    });
  }

  if (fromDate && toDate && fromDate > toDate) {
    return json(res, 422, {
      ok: false,
      success: false,
      code: "VALIDATION_ERROR",
      message: "fromDate must be less than or equal to toDate",
    });
  }

  const client = new Client()
    .setEndpoint(config.endpoint)
    .setProject(config.projectId)
    .setKey(config.apiKey);
  const db = new Databases(client);

  try {
    const actor = await db.getDocument(
      config.databaseId,
      config.usersCollectionId,
      actorUserId,
    );

    const actorRole = normalize(actor.role, 40).toLowerCase();
    if (actorRole !== "root" || actor.enabled === false) {
      await writeActivityLog({
        db,
        config,
        logError: error,
        data: {
          actorUserId,
          actorRole: actorRole || "client",
          action: "root_panel.access_denied",
          entityType: "root_panel",
          entityId: "activity_logs",
          afterData: safeJson({
            action,
            actorFilter,
            entityType,
            severity,
            fromDate,
            toDate,
          }),
          severity: "warning",
        },
      });

      return json(res, 403, {
        ok: false,
        success: false,
        code: "FORBIDDEN",
        message: "Root role required",
      });
    }

    const queries = [Query.orderDesc("$createdAt"), Query.limit(limit), Query.offset(offset)];
    if (action) queries.push(Query.equal("action", action));
    if (entityType) queries.push(Query.equal("entityType", entityType));
    if (actorFilter) queries.push(Query.equal("actorUserId", actorFilter));
    if (severity) queries.push(Query.equal("severity", severity));
    if (fromDate) queries.push(Query.greaterThanEqual("$createdAt", toStartOfDayIso(fromDate)));
    if (toDate) {
      const toExclusive = addDaysDateOnly(toDate, 1);
      if (toExclusive) {
        queries.push(Query.lessThan("$createdAt", toStartOfDayIso(toExclusive)));
      }
    }

    const response = await db.listDocuments(
      config.databaseId,
      config.activityLogsCollectionId,
      queries,
    );

    return json(res, 200, {
      ok: true,
      success: true,
      code: "ACTIVITY_LOGS_FETCHED",
      data: {
        total: response.total || 0,
        limit,
        offset,
        fromDate: fromDate || "",
        toDate: toDate || "",
        documents: response.documents || [],
      },
    });
  } catch (err) {
    error(`activity-log-query failed: ${err.message}`);
    return json(res, 500, {
      ok: false,
      success: false,
      code: "INTERNAL_ERROR",
      message: err.message,
    });
  }
};
