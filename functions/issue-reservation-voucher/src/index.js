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
  reservationsCollectionId: getEnv("APPWRITE_COLLECTION_RESERVATIONS_ID") || "reservations",
  reservationVouchersCollectionId:
    getEnv("APPWRITE_COLLECTION_RESERVATION_VOUCHERS_ID") || "reservation_vouchers",
  activityLogsCollectionId: getEnv("APPWRITE_COLLECTION_ACTIVITY_LOGS_ID") || "",
  appBaseUrl: getEnv("APP_BASE_URL") || "http://localhost:5173",
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

const randomCode = () => Math.random().toString(36).slice(2, 8).toUpperCase();

const buildVoucherCode = (reservationId) =>
  `RSV-${normalize(reservationId, 8).toUpperCase()}-${Date.now().toString(36).toUpperCase()}-${randomCode()}`.slice(
    0,
    40,
  );

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

  const body = parseBody(req);
  const reservationId = normalize(body.reservationId, 64);
  if (!reservationId) {
    return json(res, 422, {
      ok: false,
      success: false,
      code: "VALIDATION_ERROR",
      message: "reservationId is required",
    });
  }

  const client = new Client()
    .setEndpoint(config.endpoint)
    .setProject(config.projectId)
    .setKey(config.apiKey);
  const db = new Databases(client);

  try {
    const reservation = await db.getDocument(
      config.databaseId,
      config.reservationsCollectionId,
      reservationId,
    );

    if (reservation.enabled !== true) {
      return json(res, 404, {
        ok: false,
        success: false,
        code: "RESERVATION_NOT_AVAILABLE",
        message: "Reservation is not available",
      });
    }

    const paid = normalize(reservation.paymentStatus, 20).toLowerCase() === "paid";
    const validStatus = ["confirmed", "completed"].includes(
      normalize(reservation.status, 20).toLowerCase(),
    );
    if (!paid || !validStatus) {
      return json(res, 422, {
        ok: false,
        success: false,
        code: "RESERVATION_NOT_ELIGIBLE",
        message: "Reservation must be confirmed/completed and paid",
      });
    }

    const existing = await db.listDocuments(
      config.databaseId,
      config.reservationVouchersCollectionId,
      [
        Query.equal("reservationId", reservationId),
        Query.equal("enabled", true),
        Query.limit(1),
      ],
    );

    const existingVoucher = existing.documents?.[0];
    if (existingVoucher) {
      return json(res, 200, {
        ok: true,
        success: true,
        code: "VOUCHER_ALREADY_EXISTS",
        data: {
          voucherId: existingVoucher.$id,
          voucherCode: existingVoucher.voucherCode,
          voucherUrl: existingVoucher.voucherUrl || "",
        },
      });
    }

    const voucherCode = buildVoucherCode(reservationId);
    const voucherUrl = `${config.appBaseUrl.replace(/\/$/, "")}/voucher/${encodeURIComponent(voucherCode)}`;
    const voucherDoc = await db.createDocument(
      config.databaseId,
      config.reservationVouchersCollectionId,
      ID.unique(),
      {
        reservationId,
        propertyOwnerId: reservation.propertyOwnerId,
        voucherCode,
        voucherUrl,
        qrPayload: safeJson({
          reservationId,
          voucherCode,
        }),
        issuedAt: new Date().toISOString(),
        sentToEmail: normalize(reservation.guestEmail, 254).toLowerCase(),
        enabled: true,
      },
    );

    await writeActivityLog({
      db,
      config,
      log,
      data: {
        actorUserId: reservation.propertyOwnerId,
        actorRole: "owner",
        action: "voucher.issue",
        entityType: "reservation_vouchers",
        entityId: voucherDoc.$id,
        afterData: safeJson({
          reservationId,
          voucherCode,
          voucherUrl,
        }),
        severity: "info",
      },
    });

    return json(res, 201, {
      ok: true,
      success: true,
      code: "VOUCHER_ISSUED",
      message: "Voucher issued",
      data: {
        voucherId: voucherDoc.$id,
        voucherCode,
        voucherUrl,
      },
    });
  } catch (err) {
    error(`issue-reservation-voucher failed: ${err.message}`);
    return json(res, 500, {
      ok: false,
      success: false,
      code: "INTERNAL_ERROR",
      message: err.message,
    });
  }
};
