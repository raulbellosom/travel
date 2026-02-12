import { createHmac, timingSafeEqual } from "node:crypto";
import { Client, Databases, Functions, ID, Query } from "node-appwrite";

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
  reservationsCollectionId: getEnv("APPWRITE_COLLECTION_RESERVATIONS_ID") || "reservations",
  reservationPaymentsCollectionId:
    getEnv("APPWRITE_COLLECTION_RESERVATION_PAYMENTS_ID") || "reservation_payments",
  activityLogsCollectionId: getEnv("APPWRITE_COLLECTION_ACTIVITY_LOGS_ID") || "",
  issueVoucherFunctionId: getEnv("APPWRITE_FUNCTION_ISSUE_RESERVATION_VOUCHER_ID") || "",
  mercadoPagoWebhookSecret: getEnv("MERCADOPAGO_WEBHOOK_SECRET") || "",
});

const json = (res, status, body) => res.json(body, status);

const rawBodyFromRequest = (req) => {
  const raw = req.body ?? req.payload ?? "{}";
  return typeof raw === "string" ? raw : JSON.stringify(raw);
};

const parseBody = (req) => {
  try {
    return JSON.parse(rawBodyFromRequest(req));
  } catch {
    return {};
  }
};

const normalize = (value, maxLength = 0) => {
  const output = String(value ?? "").trim();
  if (!maxLength) return output;
  return output.slice(0, maxLength);
};

const verifySimpleHmac = ({ rawBody, signatureHeader, secret }) => {
  if (!secret) return true;
  const signature = normalize(signatureHeader, 256);
  if (!signature) return false;
  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  const left = Buffer.from(signature, "utf8");
  const right = Buffer.from(expected, "utf8");
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
};

const mapStatus = (value) => {
  const normalized = normalize(value, 40).toLowerCase();
  if (["approved", "accredited"].includes(normalized)) return "approved";
  if (["refunded", "charged_back"].includes(normalized)) return "refunded";
  if (["rejected", "cancelled"].includes(normalized)) return "rejected";
  return "pending";
};

const toMoney = (value) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) return 0;
  return Math.round(parsed * 100) / 100;
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

const maybeIssueVoucher = async ({ functions, config, reservationId, log }) => {
  if (!config.issueVoucherFunctionId) return;
  try {
    await functions.createExecution(
      config.issueVoucherFunctionId,
      JSON.stringify({ reservationId }),
      true,
    );
  } catch (err) {
    log(`issue-reservation-voucher skipped: ${err.message}`);
  }
};

export default async ({ req, res, log, error }) => {
  if (req.method && req.method.toUpperCase() !== "POST") {
    return json(res, 405, { ok: false, code: "METHOD_NOT_ALLOWED", message: "Use POST" });
  }

  const config = cfg();
  if (!config.endpoint || !config.projectId || !config.apiKey) {
    return json(res, 500, { ok: false, code: "ENV_MISSING", message: "Missing Appwrite credentials" });
  }

  const rawBody = rawBodyFromRequest(req);
  const payload = parseBody(req);
  const signatureHeader =
    req.headers?.["x-signature"] || req.headers?.["x-mercadopago-signature"] || "";

  if (
    !verifySimpleHmac({
      rawBody,
      signatureHeader,
      secret: config.mercadoPagoWebhookSecret,
    })
  ) {
    return json(res, 401, { ok: false, code: "INVALID_SIGNATURE", message: "Invalid Mercado Pago signature" });
  }

  const eventId = normalize(payload.id || payload.eventId || payload.data?.id, 120);
  const reservationId = normalize(
    payload?.metadata?.reservationId ||
      payload?.external_reference ||
      payload?.reservationId ||
      payload?.data?.metadata?.reservationId,
    64,
  );
  const providerPaymentId = normalize(payload?.paymentId || payload?.data?.id || eventId, 120);
  const status = mapStatus(payload?.status || payload?.data?.status);
  const amount = toMoney(payload?.transaction_amount || payload?.amount || 0);
  const currency = normalize(payload?.currency_id || payload?.currency || "MXN", 3).toUpperCase();

  if (!eventId || !reservationId) {
    return json(res, 422, {
      ok: false,
      code: "VALIDATION_ERROR",
      message: "eventId and reservationId are required",
    });
  }

  const client = new Client()
    .setEndpoint(config.endpoint)
    .setProject(config.projectId)
    .setKey(config.apiKey);
  const db = new Databases(client);
  const functions = new Functions(client);

  try {
    const duplicate = await db.listDocuments(
      config.databaseId,
      config.reservationPaymentsCollectionId,
      [Query.equal("providerEventId", eventId), Query.limit(1)],
    );
    if (duplicate.total > 0) {
      return json(res, 200, {
        ok: true,
        success: true,
        code: "EVENT_ALREADY_PROCESSED",
        message: "Duplicate event ignored",
      });
    }

    const reservation = await db.getDocument(
      config.databaseId,
      config.reservationsCollectionId,
      reservationId,
    );

    const payment = await db.createDocument(
      config.databaseId,
      config.reservationPaymentsCollectionId,
      ID.unique(),
      {
        reservationId,
        propertyOwnerId: reservation.propertyOwnerId,
        provider: "mercadopago",
        providerPaymentId: providerPaymentId || eventId,
        providerEventId: eventId,
        amount,
        currency: currency || reservation.currency || "MXN",
        status,
        rawPayload: safeJson(payload),
        processedAt: new Date().toISOString(),
        enabled: true,
      },
    );

    const reservationPatch = {};
    if (status === "approved") {
      reservationPatch.paymentStatus = "paid";
      reservationPatch.status = reservation.status === "completed" ? "completed" : "confirmed";
      reservationPatch.paymentProvider = "mercadopago";
      reservationPatch.externalRef = providerPaymentId || eventId;
    } else if (status === "rejected") {
      reservationPatch.paymentStatus = "failed";
      reservationPatch.paymentProvider = "mercadopago";
      reservationPatch.externalRef = providerPaymentId || eventId;
    } else if (status === "refunded") {
      reservationPatch.paymentStatus = "refunded";
    }

    if (Object.keys(reservationPatch).length > 0) {
      await db.updateDocument(
        config.databaseId,
        config.reservationsCollectionId,
        reservationId,
        reservationPatch,
      );
    }

    await writeActivityLog({
      db,
      config,
      log,
      data: {
        actorUserId: reservation.propertyOwnerId,
        actorRole: "owner",
        action: "payment.webhook_mercadopago_processed",
        entityType: "reservation_payments",
        entityId: payment.$id,
        afterData: safeJson({
          reservationId,
          providerEventId: eventId,
          providerPaymentId: providerPaymentId || eventId,
          status,
        }),
        severity: status === "rejected" ? "warning" : "info",
      },
    });

    if (status === "approved") {
      await maybeIssueVoucher({ functions, config, reservationId, log });
    }

    return json(res, 200, {
      ok: true,
      success: true,
      code: "WEBHOOK_PROCESSED",
      data: {
        reservationId,
        paymentId: payment.$id,
        status,
      },
    });
  } catch (err) {
    error(`payment-webhook-mercadopago failed: ${err.message}`);
    return json(res, 500, {
      ok: false,
      success: false,
      code: "INTERNAL_ERROR",
      message: err.message,
    });
  }
};
