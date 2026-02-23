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
  reservationsCollectionId:
    getEnv("APPWRITE_COLLECTION_RESERVATIONS_ID") || "reservations",
  activityLogsCollectionId: getEnv("APPWRITE_COLLECTION_ACTIVITY_LOGS_ID") || "",
});

const json = (res, status, body) => res.json(body, status);

const safeActivityLog = async ({ db, config, data, log }) => {
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

const listExpiredPending = async ({ db, config, nowIso }) => {
  try {
    return await db.listDocuments(config.databaseId, config.reservationsCollectionId, [
      Query.equal("enabled", true),
      Query.equal("status", "pending"),
      Query.equal("paymentStatus", "unpaid"),
      Query.lessThanEqual("holdExpiresAt", nowIso),
      Query.limit(100),
    ]);
  } catch {
    return { total: 0, documents: [] };
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

  const client = new Client()
    .setEndpoint(config.endpoint)
    .setProject(config.projectId)
    .setKey(config.apiKey);

  const db = new Databases(client);

  try {
    const nowIso = new Date().toISOString();
    const expired = await listExpiredPending({ db, config, nowIso });

    let processed = 0;
    for (const reservation of expired.documents || []) {
      await db.updateDocument(
        config.databaseId,
        config.reservationsCollectionId,
        reservation.$id,
        {
          status: "expired",
        },
      );

      await safeActivityLog({
        db,
        config,
        log,
        data: {
          actorUserId: "system",
          actorRole: "system",
          action: "reservation.expire_pending",
          entityType: "reservations",
          entityId: reservation.$id,
          afterData: JSON.stringify({
            reservationId: reservation.$id,
            previousStatus: "pending",
            nextStatus: "expired",
            holdExpiresAt: reservation.holdExpiresAt || null,
          }).slice(0, 20000),
          severity: "info",
        },
      });
      processed += 1;
    }

    return json(res, 200, {
      ok: true,
      success: true,
      code: "EXPIRE_PENDING_RESERVATIONS_COMPLETED",
      data: {
        checked: Number(expired.total || 0),
        expired: processed,
      },
    });
  } catch (err) {
    error(`expire-pending-reservations failed: ${err.message}`);
    return json(res, 500, {
      ok: false,
      success: false,
      code: "INTERNAL_ERROR",
      message: err.message,
    });
  }
};
