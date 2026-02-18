import { Client, Databases, ID, Query } from "node-appwrite";
import {
  getAuthenticatedUserId,
  isMethodAllowed,
  json,
  parseBody,
} from "./_request.js";

const SUPPORTED_CURRENCIES = ["MXN", "USD", "EUR"];

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
  resourcesCollectionId:
    getEnv("APPWRITE_COLLECTION_RESOURCES_ID") || "resources",
  leadsCollectionId: getEnv("APPWRITE_COLLECTION_LEADS_ID") || "leads",
  reservationsCollectionId:
    getEnv("APPWRITE_COLLECTION_RESERVATIONS_ID") || "reservations",
  reservationPaymentsCollectionId:
    getEnv("APPWRITE_COLLECTION_RESERVATION_PAYMENTS_ID") ||
    "reservation_payments",
  analyticsDailyCollectionId:
    getEnv("APPWRITE_COLLECTION_ANALYTICS_DAILY_ID") || "analytics_daily",
  activityLogsCollectionId:
    getEnv("APPWRITE_COLLECTION_ACTIVITY_LOGS_ID") || "",
});

const normalizeText = (value, maxLength = 0) => {
  const normalized = String(value ?? "").trim();
  if (!maxLength) return normalized;
  return normalized.slice(0, maxLength);
};

const safeJsonString = (value, maxLength = 8000) => {
  try {
    return JSON.stringify(value).slice(0, maxLength);
  } catch {
    return "{}";
  }
};

const roundMoney = (value) => Math.round(Number(value || 0) * 100) / 100;

const resolveMetricDate = (rawInput) => {
  const input = normalizeText(rawInput);
  if (!input) {
    const now = new Date();
    const date = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
    );
    return date;
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(input)) {
    return new Date(`${input}T00:00:00.000Z`);
  }

  const parsed = new Date(input);
  if (Number.isNaN(parsed.getTime())) return null;

  return new Date(
    Date.UTC(
      parsed.getUTCFullYear(),
      parsed.getUTCMonth(),
      parsed.getUTCDate(),
    ),
  );
};

const getDateRange = (metricDate) => {
  const start = metricDate;
  const end = new Date(metricDate.getTime() + 24 * 60 * 60 * 1000);
  return {
    metricDateIso: start.toISOString(),
    startIso: start.toISOString(),
    endIso: end.toISOString(),
  };
};

const countDocuments = async ({ db, databaseId, collectionId, queries }) => {
  const result = await db.listDocuments(databaseId, collectionId, [
    ...queries,
    Query.limit(1),
  ]);
  return Number(result.total || 0);
};

const listAllDocuments = async ({
  db,
  databaseId,
  collectionId,
  queries,
  pageSize = 100,
}) => {
  const docs = [];
  let cursor = "";

  while (true) {
    const batchQueries = [
      ...queries,
      Query.orderAsc("$id"),
      Query.limit(pageSize),
    ];
    if (cursor) batchQueries.push(Query.cursorAfter(cursor));

    const result = await db.listDocuments(
      databaseId,
      collectionId,
      batchQueries,
    );
    const batch = result.documents || [];
    if (batch.length === 0) break;

    docs.push(...batch);
    if (batch.length < pageSize) break;
    cursor = batch[batch.length - 1].$id;
  }

  return docs;
};

const safeActivityLog = async ({ db, config, data, logger }) => {
  if (!config.activityLogsCollectionId || !data.actorUserId) return;
  try {
    await db.createDocument(
      config.databaseId,
      config.activityLogsCollectionId,
      ID.unique(),
      data,
    );
  } catch (err) {
    logger(`activity_logs write skipped: ${err.message}`);
  }
};

export default async ({ req, res, log, error }) => {
  const config = cfg();
  const actorUserId = getAuthenticatedUserId(req);
  if (!config.endpoint || !config.projectId || !config.apiKey) {
    return json(res, 500, {
      ok: false,
      success: false,
      code: "ENV_MISSING",
      message: "Missing Appwrite credentials",
    });
  }

  if (!isMethodAllowed(req, ["POST", "GET"])) {
    return json(res, 405, {
      ok: false,
      success: false,
      code: "METHOD_NOT_ALLOWED",
      message: "Use GET or POST",
    });
  }

  const body = parseBody(req);
  const metricDate = resolveMetricDate(body.metricDate);
  if (!metricDate) {
    return json(res, 422, {
      ok: false,
      success: false,
      code: "VALIDATION_ERROR",
      message: "metricDate must be YYYY-MM-DD or ISO date",
    });
  }

  const { metricDateIso, startIso, endIso } = getDateRange(metricDate);

  const client = new Client()
    .setEndpoint(config.endpoint)
    .setProject(config.projectId)
    .setKey(config.apiKey);
  const db = new Databases(client);

  try {
    const [resourcesPublished, leadsCreated, reservationsCreated] =
      await Promise.all([
        countDocuments({
          db,
          databaseId: config.databaseId,
          collectionId: config.resourcesCollectionId,
          queries: [
            Query.equal("status", "published"),
            Query.equal("enabled", true),
            Query.greaterThanEqual("$createdAt", startIso),
            Query.lessThan("$createdAt", endIso),
          ],
        }),
        countDocuments({
          db,
          databaseId: config.databaseId,
          collectionId: config.leadsCollectionId,
          queries: [
            Query.equal("enabled", true),
            Query.greaterThanEqual("$createdAt", startIso),
            Query.lessThan("$createdAt", endIso),
          ],
        }),
        countDocuments({
          db,
          databaseId: config.databaseId,
          collectionId: config.reservationsCollectionId,
          queries: [
            Query.equal("enabled", true),
            Query.greaterThanEqual("$createdAt", startIso),
            Query.lessThan("$createdAt", endIso),
          ],
        }),
      ]);

    const approvedPayments = await listAllDocuments({
      db,
      databaseId: config.databaseId,
      collectionId: config.reservationPaymentsCollectionId,
      queries: [
        Query.equal("status", "approved"),
        Query.equal("enabled", true),
        Query.greaterThanEqual("$createdAt", startIso),
        Query.lessThan("$createdAt", endIso),
      ],
      pageSize: 100,
    });

    const paymentsApproved = approvedPayments.length;
    const grossRevenue = roundMoney(
      approvedPayments.reduce(
        (total, item) => total + Number(item.amount || 0),
        0,
      ),
    );

    const paymentsByProvider = approvedPayments.reduce((acc, item) => {
      const key = String(item.provider || "unknown");
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    const preferredCurrency = String(body.currency || "").toUpperCase();
    const fallbackCurrency = String(
      approvedPayments[0]?.currency || "MXN",
    ).toUpperCase();
    const currency = SUPPORTED_CURRENCIES.includes(preferredCurrency)
      ? preferredCurrency
      : SUPPORTED_CURRENCIES.includes(fallbackCurrency)
        ? fallbackCurrency
        : "MXN";

    const payloadJson = safeJsonString({
      range: {
        startIso,
        endIso,
      },
      totals: {
        resourcesPublished,
        leadsCreated,
        reservationsCreated,
        paymentsApproved,
        grossRevenue,
      },
      paymentsByProvider,
    });

    const existing = await db.listDocuments(
      config.databaseId,
      config.analyticsDailyCollectionId,
      [Query.equal("metricDate", metricDateIso), Query.limit(1)],
    );

    const analyticsData = {
      metricDate: metricDateIso,
      resourcesPublished,
      leadsCreated,
      reservationsCreated,
      paymentsApproved,
      grossRevenue,
      currency,
      payloadJson,
    };

    let analyticsDoc;
    if (existing.total > 0) {
      analyticsDoc = await db.updateDocument(
        config.databaseId,
        config.analyticsDailyCollectionId,
        existing.documents[0].$id,
        analyticsData,
      );
    } else {
      analyticsDoc = await db.createDocument(
        config.databaseId,
        config.analyticsDailyCollectionId,
        ID.unique(),
        analyticsData,
      );
    }

    await safeActivityLog({
      db,
      config,
      logger: log,
      data: {
        actorUserId,
        actorRole: "root",
        action: "analytics.aggregate_daily",
        entityType: "analytics_daily",
        entityId: analyticsDoc.$id,
        afterData: safeJsonString(
          {
            metricDate: metricDateIso,
            resourcesPublished,
            leadsCreated,
            reservationsCreated,
            paymentsApproved,
            grossRevenue,
            currency,
          },
          20000,
        ),
        severity: "info",
      },
    });

    return json(res, 200, {
      ok: true,
      success: true,
      code: "DASHBOARD_METRICS_AGGREGATED",
      message: "Daily metrics aggregated",
      data: {
        analyticsId: analyticsDoc.$id,
        metricDate: metricDateIso,
        resourcesPublished,
        leadsCreated,
        reservationsCreated,
        paymentsApproved,
        grossRevenue,
        currency,
      },
    });
  } catch (err) {
    error(`dashboard-metrics-aggregator failed: ${err.message}`);
    return json(res, 500, {
      ok: false,
      success: false,
      code: "INTERNAL_ERROR",
      message: err.message,
    });
  }
};
