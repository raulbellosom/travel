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
const DEFAULT_HOLD_MINUTES = 15;

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

const resolveBaseAmount = ({ resource, bookingType, nights }) => {
  const unitAmount = toMoney(resource.price || 0);
  if (unitAmount === null || unitAmount <= 0) return null;

  const pricingModel = normalizeText(resource.pricingModel).toLowerCase();
  const multiplier =
    bookingType === "date_range" && ["per_night", "per_day"].includes(pricingModel)
      ? Math.max(1, nights)
      : 1;
  return toMoney(unitAmount * multiplier);
};

const getHoldMinutes = async (modulesService) => {
  const configured = Number(await modulesService.getLimit("reservationHoldMinutes", DEFAULT_HOLD_MINUTES));
  if (!Number.isFinite(configured) || configured < 1 || configured > 240) {
    return DEFAULT_HOLD_MINUTES;
  }
  return Math.trunc(configured);
};

const isPendingStillBlocking = (reservation, nowMs) => {
  const status = normalizeText(reservation?.status).toLowerCase();
  if (status === "confirmed") return true;
  if (status !== "pending") return false;
  const holdExpiresAt = reservation?.holdExpiresAt;
  if (!holdExpiresAt) return true;
  const holdExpiresMs = new Date(holdExpiresAt).getTime();
  if (Number.isNaN(holdExpiresMs)) return true;
  return holdExpiresMs > nowMs;
};

const dateRangeOverlap = (existing, incoming) =>
  existing.startMs < incoming.endMs && existing.endMs > incoming.startMs;

const toWindow = ({ startMs, endMs, bufferMinutes }) => {
  const bufferMs = Math.max(0, Number(bufferMinutes || 0)) * 60 * 1000;
  return {
    startMs: startMs - bufferMs,
    endMs: endMs + bufferMs,
  };
};

const resolveIncomingWindow = ({ bookingType, checkIn, checkOut, startDateTime, endDateTime, slotBufferMinutes }) => {
  if (bookingType === "date_range") {
    return toWindow({
      startMs: checkIn.getTime(),
      endMs: checkOut.getTime(),
      bufferMinutes: slotBufferMinutes,
    });
  }

  return toWindow({
    startMs: startDateTime.getTime(),
    endMs: endDateTime.getTime(),
    bufferMinutes: slotBufferMinutes,
  });
};

const resolveExistingWindow = (reservation, slotBufferMinutes) => {
  const existingBookingType = normalizeText(reservation.bookingType).toLowerCase();
  if (existingBookingType === "date_range") {
    const start = new Date(reservation.checkInDate).getTime();
    const end = new Date(reservation.checkOutDate).getTime();
    if (Number.isNaN(start) || Number.isNaN(end)) return null;
    return toWindow({ startMs: start, endMs: end, bufferMinutes: slotBufferMinutes });
  }

  const start = new Date(reservation.startDateTime || reservation.checkInDate).getTime();
  const end = new Date(reservation.endDateTime || reservation.checkOutDate).getTime();
  if (Number.isNaN(start) || Number.isNaN(end)) return null;
  return toWindow({ startMs: start, endMs: end, bufferMinutes: slotBufferMinutes });
};

const listCandidateReservations = async ({ db, config, resourceId }) => {
  try {
    return await db.listDocuments(config.databaseId, config.reservationsCollectionId, [
      Query.equal("resourceId", resourceId),
      Query.equal("enabled", true),
      Query.equal("status", ["pending", "confirmed"]),
      Query.limit(100),
    ]);
  } catch {
    return { total: 0, documents: [] };
  }
};

const hasOverlapConflict = ({ existingReservations, incomingWindow, slotBufferMinutes }) => {
  const nowMs = Date.now();
  for (const reservation of existingReservations) {
    if (!isPendingStillBlocking(reservation, nowMs)) continue;
    const existingWindow = resolveExistingWindow(reservation, slotBufferMinutes);
    if (!existingWindow) continue;
    if (dateRangeOverlap(existingWindow, incomingWindow)) return true;
  }
  return false;
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

const findByClientRequestId = async ({
  db,
  config,
  resourceId,
  guestUserId,
  clientRequestId,
}) => {
  if (!clientRequestId) return null;

  try {
    const response = await db.listDocuments(config.databaseId, config.reservationsCollectionId, [
      Query.equal("resourceId", resourceId),
      Query.equal("guestUserId", guestUserId),
      Query.equal("status", "pending"),
      Query.equal("paymentStatus", "unpaid"),
      Query.equal("externalRef", `client:${clientRequestId}`),
      Query.equal("enabled", true),
      Query.orderDesc("$createdAt"),
      Query.limit(1),
    ]);

    const reservation = response.documents?.[0] || null;
    if (!reservation) return null;

    if (!isPendingStillBlocking(reservation, Date.now())) return null;
    return reservation;
  } catch {
    return null;
  }
};

const buildReservationData = ({
  resource,
  payload,
  guestUserId,
  authUser,
  guestCount,
  bookingType,
  commercialMode,
  checkInIso,
  checkOutIso,
  startDateTimeIso,
  endDateTimeIso,
  nights,
  baseAmount,
  feesAmount,
  taxAmount,
  totalAmount,
  currency,
  holdExpiresAt,
  clientRequestId,
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
    guestCount,
    commercialMode,
    bookingType,
    nights,
    baseAmount,
    feesAmount,
    taxAmount,
    totalAmount,
    currency,
    holdExpiresAt,
    status: "pending",
    paymentStatus: "unpaid",
    enabled: true,
  };

  if (bookingType === "date_range") {
    data.checkInDate = checkInIso;
    data.checkOutDate = checkOutIso;
  } else {
    data.startDateTime = startDateTimeIso;
    data.endDateTime = endDateTimeIso;
    data.checkInDate = startDateTimeIso;
    data.checkOutDate = endDateTimeIso;
  }

  const guestPhone = toOptionalText(payload.guestPhone || authUser.phone, 20);
  if (guestPhone) data.guestPhone = guestPhone;

  const specialRequests = toOptionalText(payload.specialRequests, 2000);
  if (specialRequests) data.specialRequests = specialRequests;

  if (clientRequestId) {
    data.externalRef = `client:${clientRequestId}`;
  }

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
  const resourceId = normalizeText(payload.resourceId || payload.propertyId, 64);
  const guestCount = toPositiveInt(payload.guestCount);
  const clientRequestId = normalizeText(payload.clientRequestId, 120);

  if (!resourceId || guestCount === null) {
    return json(res, 400, {
      ok: false,
      success: false,
      code: "VALIDATION_ERROR",
      message: "resourceId and guestCount are required",
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
        message: "This resource uses manual contact flow. Use create-lead instead.",
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

    const reusedReservation = await findByClientRequestId({
      db,
      config,
      resourceId,
      guestUserId: authenticatedUserId,
      clientRequestId,
    });

    if (reusedReservation) {
      return json(res, 200, {
        ok: true,
        success: true,
        code: "RESERVATION_REUSED",
        message: "Existing pending reservation reused",
        data: {
          reservationId: reusedReservation.$id,
          resourceId,
          holdExpiresAt: reusedReservation.holdExpiresAt || null,
          reused: true,
        },
      });
    }

    const checkIn = parseDate(payload.checkInDate);
    const checkOut = parseDate(payload.checkOutDate);
    const startDateTime = parseDate(payload.startDateTime || payload.checkInDate);
    const endDateTime = parseDate(payload.endDateTime || payload.checkOutDate);

    if (bookingType === "date_range" && (!checkIn || !checkOut)) {
      return json(res, 422, {
        ok: false,
        success: false,
        code: "DATE_RANGE_REQUIRED",
        message: "checkInDate and checkOutDate are required for date_range bookings",
      });
    }

    if (bookingType !== "date_range" && (!startDateTime || !endDateTime)) {
      return json(res, 422, {
        ok: false,
        success: false,
        code: "TIME_SLOT_REQUIRED",
        message: "startDateTime and endDateTime are required for slot/event bookings",
      });
    }

    const incomingStart = bookingType === "date_range" ? checkIn : startDateTime;
    const incomingEnd = bookingType === "date_range" ? checkOut : endDateTime;

    if (incomingEnd.getTime() <= incomingStart.getTime()) {
      return json(res, 422, {
        ok: false,
        success: false,
        code: "DATE_RANGE_INVALID",
        message: "End date/time must be greater than start date/time",
      });
    }

    const nights =
      bookingType === "date_range"
        ? Math.ceil((incomingEnd.getTime() - incomingStart.getTime()) / DAY_IN_MS)
        : 0;

    if (bookingType === "date_range" && (nights < 1 || nights > 365)) {
      return json(res, 422, {
        ok: false,
        success: false,
        code: "DATE_RANGE_INVALID",
        message: "Reservation nights must be between 1 and 365",
      });
    }

    const slotBufferMinutes = Number(resource.slotBufferMinutes || 0);
    const incomingWindow = resolveIncomingWindow({
      bookingType,
      checkIn,
      checkOut,
      startDateTime,
      endDateTime,
      slotBufferMinutes,
    });

    const candidates = await listCandidateReservations({ db, config, resourceId });
    const hasConflict = hasOverlapConflict({
      existingReservations: candidates.documents || [],
      incomingWindow,
      slotBufferMinutes,
    });

    if (hasConflict) {
      return json(res, 409, {
        ok: false,
        success: false,
        code: "RESERVATION_CONFLICT",
        message: "The selected schedule is not available",
      });
    }

    const baseAmount = resolveBaseAmount({ resource, bookingType, nights });
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

    const holdMinutes = await getHoldMinutes(modulesService);
    const holdExpiresAt = new Date(Date.now() + holdMinutes * 60 * 1000).toISOString();

    const reservationData = buildReservationData({
      resource,
      payload,
      guestUserId: authenticatedUserId,
      authUser,
      guestCount,
      bookingType,
      commercialMode,
      checkInIso: bookingType === "date_range" ? checkIn.toISOString() : undefined,
      checkOutIso: bookingType === "date_range" ? checkOut.toISOString() : undefined,
      startDateTimeIso:
        bookingType !== "date_range" ? startDateTime.toISOString() : undefined,
      endDateTimeIso:
        bookingType !== "date_range" ? endDateTime.toISOString() : undefined,
      nights,
      baseAmount,
      feesAmount,
      taxAmount,
      totalAmount,
      currency,
      holdExpiresAt,
      clientRequestId,
    });

    const reservation = await db.createDocument(
      config.databaseId,
      config.reservationsCollectionId,
      ID.unique(),
      reservationData,
      buildReservationPermissions(resource.ownerUserId, authenticatedUserId),
    );

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
          bookingType,
          holdExpiresAt,
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
        holdExpiresAt,
        reused: false,
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
