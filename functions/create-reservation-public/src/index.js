import { Client, Databases, ID, Permission, Query, Role } from "node-appwrite";

const DAY_IN_MS = 24 * 60 * 60 * 1000;
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
  propertiesCollectionId: getEnv("APPWRITE_COLLECTION_PROPERTIES_ID") || "properties",
  reservationsCollectionId:
    getEnv("APPWRITE_COLLECTION_RESERVATIONS_ID") || "reservations",
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

const normalizeText = (value, maxLength = 0) => {
  const normalized = String(value ?? "").trim().replace(/\s+/g, " ");
  if (!maxLength) return normalized;
  return normalized.slice(0, maxLength);
};

const toOptionalText = (value, maxLength = 0) => {
  const normalized = normalizeText(value, maxLength);
  return normalized ? normalized : undefined;
};

const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || ""));

const parseDate = (value) => {
  const parsed = new Date(value);
  const time = parsed.getTime();
  if (Number.isNaN(time)) return null;
  return parsed;
};

const toPositiveInt = (value) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return null;
  const rounded = Math.trunc(parsed);
  return rounded >= 0 ? rounded : null;
};

const toMoney = (value) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric < 0) return null;
  return Math.round(numeric * 100) / 100;
};

const getRequestId = (req) => {
  const headers = req.headers || {};
  return (
    headers["x-request-id"] ||
    headers["x-appwrite-execution-id"] ||
    headers["x-appwrite-trigger"] ||
    ""
  );
};

const safeActivityLog = async ({ db, config, data, logger }) => {
  if (!config.activityLogsCollectionId) return;
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

const buildReservationData = ({
  property,
  payload,
  guestCount,
  checkInIso,
  checkOutIso,
  nights,
  baseAmount,
  feesAmount,
  taxAmount,
  totalAmount,
  currency,
}) => {
  const data = {
    propertyId: property.$id,
    propertyOwnerId: property.ownerUserId,
    guestName: normalizeText(payload.guestName, 120),
    guestEmail: normalizeText(payload.guestEmail, 254).toLowerCase(),
    checkInDate: checkInIso,
    checkOutDate: checkOutIso,
    guestCount,
    nights,
    baseAmount,
    feesAmount,
    taxAmount,
    totalAmount,
    currency,
    status: "pending",
    paymentStatus: "unpaid",
    enabled: true,
  };

  const guestPhone = toOptionalText(payload.guestPhone, 20);
  if (guestPhone) data.guestPhone = guestPhone;

  const specialRequests = toOptionalText(payload.specialRequests, 2000);
  if (specialRequests) data.specialRequests = specialRequests;

  return data;
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

  const payload = parseBody(req);
  const propertyId = normalizeText(payload.propertyId, 64);
  const guestName = normalizeText(payload.guestName, 120);
  const guestEmail = normalizeText(payload.guestEmail, 254).toLowerCase();
  const checkIn = parseDate(payload.checkInDate);
  const checkOut = parseDate(payload.checkOutDate);
  const guestCount = toPositiveInt(payload.guestCount);

  if (!propertyId || !guestName || !guestEmail || !checkIn || !checkOut || guestCount === null) {
    return json(res, 400, {
      ok: false,
      success: false,
      code: "VALIDATION_ERROR",
      message:
        "propertyId, guestName, guestEmail, checkInDate, checkOutDate and guestCount are required",
    });
  }

  if (!isValidEmail(guestEmail)) {
    return json(res, 400, {
      ok: false,
      success: false,
      code: "VALIDATION_ERROR",
      message: "Invalid guestEmail format",
    });
  }

  if (guestCount < 1 || guestCount > 500) {
    return json(res, 422, {
      ok: false,
      success: false,
      code: "VALIDATION_ERROR",
      message: "guestCount must be between 1 and 500",
    });
  }

  const checkInMs = checkIn.getTime();
  const checkOutMs = checkOut.getTime();
  if (checkOutMs <= checkInMs) {
    return json(res, 422, {
      ok: false,
      success: false,
      code: "DATE_RANGE_INVALID",
      message: "checkOutDate must be greater than checkInDate",
    });
  }

  const nights = Math.ceil((checkOutMs - checkInMs) / DAY_IN_MS);
  if (nights < 1 || nights > 365) {
    return json(res, 422, {
      ok: false,
      success: false,
      code: "DATE_RANGE_INVALID",
      message: "Reservation nights must be between 1 and 365",
    });
  }

  const currencyInput = normalizeText(payload.currency || "", 3).toUpperCase();

  const client = new Client()
    .setEndpoint(config.endpoint)
    .setProject(config.projectId)
    .setKey(config.apiKey);
  const db = new Databases(client);

  try {
    const property = await db.getDocument(
      config.databaseId,
      config.propertiesCollectionId,
      propertyId,
    );

    if (property.enabled !== true || property.status !== "published") {
      return json(res, 404, {
        ok: false,
        success: false,
        code: "PROPERTY_NOT_AVAILABLE",
        message: "Property not available for reservations",
      });
    }

    if (!property.ownerUserId) {
      return json(res, 422, {
        ok: false,
        success: false,
        code: "PROPERTY_OWNER_MISSING",
        message: "Property owner is not configured",
      });
    }

    const maxGuests = Number(property.maxGuests || 0);
    if (Number.isFinite(maxGuests) && maxGuests > 0 && guestCount > maxGuests) {
      return json(res, 422, {
        ok: false,
        success: false,
        code: "GUEST_LIMIT_EXCEEDED",
        message: `guestCount exceeds maxGuests (${maxGuests})`,
      });
    }

    const checkInIso = checkIn.toISOString();
    const checkOutIso = checkOut.toISOString();

    const overlap = await db.listDocuments(
      config.databaseId,
      config.reservationsCollectionId,
      [
        Query.equal("propertyId", propertyId),
        Query.equal("enabled", true),
        Query.equal("status", ["pending", "confirmed"]),
        Query.lessThan("checkInDate", checkOutIso),
        Query.greaterThan("checkOutDate", checkInIso),
        Query.limit(1),
      ],
    );

    if (overlap.total > 0) {
      return json(res, 409, {
        ok: false,
        success: false,
        code: "RESERVATION_CONFLICT",
        message: "The selected dates are not available",
      });
    }

    const nightlyAmount = toMoney(property.price || 0);
    if (nightlyAmount === null || nightlyAmount <= 0) {
      return json(res, 422, {
        ok: false,
        success: false,
        code: "PRICE_NOT_CONFIGURED",
        message: "Property price is not configured for reservation",
      });
    }

    const baseAmount = toMoney(nightlyAmount * nights);
    const feesAmount = toMoney(payload.feesAmount || 0);
    const taxAmount = toMoney(payload.taxAmount || 0);

    if (baseAmount === null || feesAmount === null || taxAmount === null) {
      return json(res, 422, {
        ok: false,
        success: false,
        code: "AMOUNT_INVALID",
        message: "Invalid amount values",
      });
    }

    const totalAmount = toMoney(baseAmount + feesAmount + taxAmount);
    if (totalAmount === null) {
      return json(res, 422, {
        ok: false,
        success: false,
        code: "AMOUNT_INVALID",
        message: "Unable to calculate reservation total",
      });
    }

    const currency = currencyInput || String(property.currency || "MXN").toUpperCase();
    if (!SUPPORTED_CURRENCIES.includes(currency)) {
      return json(res, 422, {
        ok: false,
        success: false,
        code: "CURRENCY_NOT_SUPPORTED",
        message: `Supported currencies: ${SUPPORTED_CURRENCIES.join(", ")}`,
      });
    }

    const reservationData = buildReservationData({
      property,
      payload,
      guestCount,
      checkInIso,
      checkOutIso,
      nights,
      baseAmount,
      feesAmount,
      taxAmount,
      totalAmount,
      currency,
    });

    const reservation = await db.createDocument(
      config.databaseId,
      config.reservationsCollectionId,
      ID.unique(),
      reservationData,
      [
        Permission.read(Role.user(property.ownerUserId)),
        Permission.update(Role.user(property.ownerUserId)),
        Permission.delete(Role.user(property.ownerUserId)),
      ],
    );

    await db.updateDocument(
      config.databaseId,
      config.propertiesCollectionId,
      propertyId,
      {
        reservationCount: Number(property.reservationCount || 0) + 1,
      },
    );

    await safeActivityLog({
      db,
      config,
      logger: log,
      data: {
        actorUserId: property.ownerUserId,
        actorRole: "owner",
        action: "reservation.create_public",
        entityType: "reservations",
        entityId: reservation.$id,
        afterData: JSON.stringify({
          propertyId,
          guestEmail,
          checkInDate: checkInIso,
          checkOutDate: checkOutIso,
          totalAmount,
          currency,
          status: "pending",
        }).slice(0, 20000),
        requestId: String(getRequestId(req)).slice(0, 100),
        severity: "info",
      },
    });

    return json(res, 201, {
      ok: true,
      success: true,
      code: "RESERVATION_CREATED",
      message: "Reservation created",
      data: {
        reservationId: reservation.$id,
        propertyId,
        nights,
        totalAmount,
        currency,
        nextStep: "create-payment-session",
      },
    });
  } catch (err) {
    error(`create-reservation-public failed: ${err.message}`);
    return json(res, 500, {
      ok: false,
      success: false,
      code: "INTERNAL_ERROR",
      message: err.message,
    });
  }
};
