import { Client, Databases, ID } from "node-appwrite";

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
  reviewsCollectionId: getEnv("APPWRITE_COLLECTION_REVIEWS_ID") || "reviews",
  activityLogsCollectionId: getEnv("APPWRITE_COLLECTION_ACTIVITY_LOGS_ID") || "",
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

const parseScopes = (scopesJson) => {
  if (!scopesJson) return [];
  if (Array.isArray(scopesJson)) return scopesJson;
  try {
    const parsed = JSON.parse(String(scopesJson || "[]"));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const hasScope = (profile, scope) => {
  const role = normalize(profile?.role, 40).toLowerCase();
  if (role === "root" || role === "owner") return true;
  const scopes = parseScopes(profile?.scopesJson).map((item) =>
    normalize(item, 80).toLowerCase(),
  );
  return scopes.includes("*") || scopes.includes(String(scope || "").toLowerCase());
};

const getActorUserId = (req) => {
  const headers = req.headers || {};
  return normalize(headers["x-appwrite-user-id"] || headers["x-appwrite-userid"], 64);
};

const safeJson = (value, max = 20000) => {
  try {
    return JSON.stringify(value).slice(0, max);
  } catch {
    return "{}";
  }
};

const writeActivityLog = async ({ db, config, data, log }) => {
  if (!config.activityLogsCollectionId) return;
  try {
    await db.createDocument(
      config.databaseId,
      config.activityLogsCollectionId,
      ID.unique(),
      data,
    );
  } catch (err) {
    log(`activity_logs write skipped: ${err.message}`);
  }
};

export default async ({ req, res, log, error }) => {
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
  const reviewId = normalize(body.reviewId, 64);
  const status = normalize(body.status, 20).toLowerCase();
  if (!reviewId || !["published", "rejected"].includes(status)) {
    return json(res, 422, {
      ok: false,
      success: false,
      code: "VALIDATION_ERROR",
      message: "reviewId and status (published|rejected) are required",
    });
  }

  const client = new Client()
    .setEndpoint(config.endpoint)
    .setProject(config.projectId)
    .setKey(config.apiKey);
  const db = new Databases(client);

  try {
    const actorProfile = await db.getDocument(
      config.databaseId,
      config.usersCollectionId,
      actorUserId,
    );

    if (actorProfile.enabled === false || !hasScope(actorProfile, "reviews.moderate")) {
      return json(res, 403, {
        ok: false,
        success: false,
        code: "FORBIDDEN",
        message: "Insufficient permissions",
      });
    }

    const review = await db.getDocument(
      config.databaseId,
      config.reviewsCollectionId,
      reviewId,
    );

    const actorRole = normalize(actorProfile.role, 40).toLowerCase();

    const patch = { status };
    if (status === "published") {
      patch.publishedAt = new Date().toISOString();
    }

    const updated = await db.updateDocument(
      config.databaseId,
      config.reviewsCollectionId,
      reviewId,
      patch,
    );

    await writeActivityLog({
      db,
      config,
      log,
      data: {
        actorUserId,
        actorRole: actorRole || "owner",
        action: "review.moderate",
        entityType: "reviews",
        entityId: reviewId,
        beforeData: safeJson({ status: review.status, publishedAt: review.publishedAt }),
        afterData: safeJson({ status, publishedAt: patch.publishedAt || null }),
        changedFields: ["status", ...(patch.publishedAt ? ["publishedAt"] : [])],
        severity: "info",
      },
    });

    return json(res, 200, {
      ok: true,
      success: true,
      code: "REVIEW_MODERATED",
      message: "Review status updated",
      data: {
        reviewId: updated.$id,
        status: updated.status,
        publishedAt: updated.publishedAt || null,
      },
    });
  } catch (err) {
    error(`moderate-review failed: ${err.message}`);
    return json(res, 500, {
      ok: false,
      success: false,
      code: "INTERNAL_ERROR",
      message: err.message,
    });
  }
};
