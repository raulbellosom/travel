import { Client, Databases, ID, Permission, Query, Role, Users } from "node-appwrite";
import {
  createModulesService,
  getBookingType,
  getCommercialMode,
  getRequiredBookingModule,
  requiresOnlinePayments,
  toModuleErrorResponse,
} from "./lib/modulesService.js";

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
  resourcesCollectionId: getEnv("APPWRITE_COLLECTION_RESOURCES_ID") || "resources",
  reservationsCollectionId:
    getEnv("APPWRITE_COLLECTION_RESERVATIONS_ID") || "reservations",
  activityLogsCollectionId: getEnv("APPWRITE_COLLECTION_ACTIVITY_LOGS_ID") || "",
  instanceSettingsCollectionId:
    getEnv("APPWRITE_COLLECTION_INSTANCE_SETTINGS_ID") || "instance_settings",
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

const getAuthenticatedUserId = (req) => {
  const headers = req.headers || {};
  return headers["x-appwrite-user-id"] || headers["x-appwrite-userid"] || "";
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

const buildReservationPermissions = (ownerUserId, guestUserId) =>
  [...new Set([
    Permission.read(Role.user(ownerUserId)),
    Permission.update(Role.user(ownerUserId)),
    Permission.delete(Role.user(ownerUserId)),
    Permission.read(Role.user(guestUserId)),
  ])];

const buildReservationData = ({
  resource,
  payload,
  guestUserId,
  authUser,
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
    resourceId: resource.$id,
    resourceOwnerUserId: resource.ownerUserId,
    guestUserId,
    guestName:
      normalizeText(payload.guestName, 120) ||
      normalizeText(authUser.name, 120) ||
      "Guest",
    guestEmail: normalizeText(authUser.email, 254).toLowerCase(),
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

  const guestPhone = toOptionalText(payload.guestPhone || authUser.phone, 20);
  if (guestPhone) data.guestPhone = guestPhone;

  const specialRequests = toOptionalText(payload.specialRequests, 2000);
  if (specialRequests) data.specialRequests = specialRequests;

  return data;
};

const createReservationDocument = async ({ db, config, data, permissions }) => {
  return db.createDocument(
    config.databaseId,
    config.reservationsCollectionId,
    ID.unique(),
    data,
    permissions,
  );
};

const listOverlaps = async ({ db, config, resourceId, checkInIso, checkOutIso }) => {
  const baseQueries = [
    Query.equal("enabled", true),
    Query.equal("status", ["pending", "confirmed"]),
    Query.lessThan("checkInDate", checkOutIso),
    Query.greaterThan("checkOutDate", checkInIso),
    Query.limit(1),
  ];

  try {
    return await db.listDocuments(
      config.databaseId,
      config.reservationsCollectionId,
      [Query.equal("resourceId", resourceId), ...baseQueries],
    );
  } catch {
    return { total: 0, documents: [] };
  }
};

const countActiveReservationsThisMonth = async ({ db, config }) => {
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));

  try {
    const response = await db.listDocuments(
      config.databaseId,
      config.reservationsCollectionId,
      [
        Query.equal("enabled", true),
        Query.equal("status", ["pending", "confirmed"]),
        Query.greaterThanEqual("$createdAt", start.toISOString()),
        Query.lessThan("$createdAt", end.toISOString()),
        Query.limit(1),
      ],
    );
    return Number(response.total || 0);
  } catch {
    return 0;
  }
};

const resolveBaseAmount = ({ resource, nights }) => {
  const unitAmount = toMoney(resource.price || 0);
  if (unitAmount === null || unitAmount <= 0) return null;

  const pricingModel = normalizeText(resource.pricingModel).toLowerCase();
  const multiplier = ["per_night", "per_day"].includes(pricingModel)
    ? Math.max(1, nights)
    : 1;
  return toMoney(unitAmount * multiplier);
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

  const authenticatedUserId = normalizeText(getAuthenticatedUserId(req), 64);
  if (!authenticatedUserId) {
    return json(res, 401, {
      ok: false,
      success: false,
      code: "AUTH_REQUIRED",
      message: "You must be authenticated to create a reservation",
    });
  }

  const payload = parseBody(req);
  const resourceId = normalizeText(payload.resourceId, 64);
  const checkIn = parseDate(payload.checkInDate);
  const checkOut = parseDate(payload.checkOutDate);
  const guestCount = toPositiveInt(payload.guestCount);

  if (!resourceId || !checkIn || !checkOut || guestCount === null) {
    return json(res, 400, {
      ok: false,
      success: false,
      code: "VALIDATION_ERROR",
      message:
        "resourceId, checkInDate, checkOutDate and guestCount are required",
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
  const users = new Users(client);
  const modulesService = createModulesService({ db, config });

  try {
    const authUser = await users.get(authenticatedUserId);
    const normalizedAuthEmail = normalizeText(authUser.email, 254).toLowerCase();
    if (!normalizedAuthEmail) {
      return json(res, 422, {
        ok: false,
        success: false,
        code: "AUTH_EMAIL_MISSING",
        message: "Authenticated account has no email configured",
      });
    }

    if (!authUser.emailVerification) {
      return json(res, 403, {
        ok: false,
        success: false,
        code: "EMAIL_NOT_VERIFIED",
        message: "Verify your email before creating a reservation",
      });
    }

    const payloadGuestEmail = normalizeText(payload.guestEmail, 254).toLowerCase();
    if (payloadGuestEmail && payloadGuestEmail !== normalizedAuthEmail) {
      return json(res, 422, {
        ok: false,
        success: false,
        code: "GUEST_EMAIL_MISMATCH",
        message: "guestEmail must match the authenticated account email",
      });
    }

    await modulesService.assertModuleEnabled("module.resources");

    const resource = await db.getDocument(
      config.databaseId,
      config.resourcesCollectionId,
      resourceId,
    );

    if (resource.enabled !== true || resource.status !== "published") {
      return json(res, 404, {
        ok: false,
        success: false,
        code: "RESOURCE_NOT_AVAILABLE",
        message: "Resource not available for reservations",
      });
    }

    if (!resource.ownerUserId) {
      return json(res, 422, {
        ok: false,
        success: false,
        code: "RESOURCE_OWNER_MISSING",
        message: "Resource owner is not configured",
      });
    }

    const commercialMode = getCommercialMode(resource);
    const bookingType = getBookingType(resource, commercialMode);

    const requiredBookingModule = getRequiredBookingModule(commercialMode);
    if (requiredBookingModule) {
      await modulesService.assertModuleEnabled(requiredBookingModule);
    }

    if (bookingType === "manual_contact") {
      return json(res, 409, {
        ok: false,
        success: false,
        code: "MANUAL_CONTACT_ONLY",
        message: "This resource uses manual contact flow and does not support checkout",
      });
    }

    if (requiresOnlinePayments(commercialMode, bookingType)) {
      await modulesService.assertModuleEnabled("module.payments.online");
    }

    const activeReservationsThisMonth = await countActiveReservationsThisMonth({
      db,
      config,
    });
    await modulesService.assertLimitNotExceeded(
      "maxActiveReservationsPerMonth",
      activeReservationsThisMonth,
    );

    const maxGuests = Number(resource.maxGuests || 0);
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

    const overlap = await listOverlaps({
      db,
      config,
      resourceId,
      checkInIso,
      checkOutIso,
    });

    if (overlap.total > 0) {
      return json(res, 409, {
        ok: false,
        success: false,
        code: "RESERVATION_CONFLICT",
        message: "The selected dates are not available",
      });
    }

    const baseAmount = resolveBaseAmount({ resource, nights });
    if (baseAmount === null || baseAmount <= 0) {
      return json(res, 422, {
        ok: false,
        success: false,
        code: "PRICE_NOT_CONFIGURED",
        message: "Resource price is not configured for reservation",
      });
    }

    const feesAmount = toMoney(payload.feesAmount || 0);
    const taxAmount = toMoney(payload.taxAmount || 0);

    if (feesAmount === null || taxAmount === null) {
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

    const currency = currencyInput || String(resource.currency || "MXN").toUpperCase();
    if (!SUPPORTED_CURRENCIES.includes(currency)) {
      return json(res, 422, {
        ok: false,
        success: false,
        code: "CURRENCY_NOT_SUPPORTED",
        message: `Supported currencies: ${SUPPORTED_CURRENCIES.join(", ")}`,
      });
    }

    const reservationData = buildReservationData({
      resource,
      payload,
      guestUserId: authenticatedUserId,
      authUser,
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

    const reservation = await createReservationDocument({
      db,
      config,
      data: reservationData,
      permissions: buildReservationPermissions(
        resource.ownerUserId,
        authenticatedUserId,
      ),
    });

    await db.updateDocument(
      config.databaseId,
      config.resourcesCollectionId,
      resourceId,
      {
        reservationCount: Number(resource.reservationCount || 0) + 1,
      },
    );

    await safeActivityLog({
      db,
      config,
      logger: log,
      data: {
        actorUserId: authenticatedUserId,
        actorRole: "client",
        action: "reservation.create_authenticated",
        entityType: "reservations",
        entityId: reservation.$id,
        afterData: JSON.stringify({
          resourceId,
          guestUserId: authenticatedUserId,
          guestEmail: reservationData.guestEmail,
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
        resourceId,
        guestUserId: authenticatedUserId,
        nights,
        totalAmount,
        currency,
        nextStep: "create-payment-session",
      },
    });
  } catch (err) {
    if (err?.code === "MODULE_DISABLED" || err?.code === "LIMIT_EXCEEDED") {
      const moduleError = toModuleErrorResponse(err);
      return json(res, moduleError.status, moduleError.body);
    }

    error(`create-reservation-public failed: ${err.message}`);
    return json(res, 500, {
      ok: false,
      success: false,
      code: "INTERNAL_ERROR",
      message: err.message,
    });
  }
};
