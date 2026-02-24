import { Client, Databases, ID, Permission, Query, Role } from "node-appwrite";
import {
  createModulesService,
  getBookingType,
  getCommercialMode,
  toModuleErrorResponse,
} from "./lib/modulesService.js";

const DAY_IN_MS = 24 * 60 * 60 * 1000;
const MAX_SPECIAL_REQUESTS_LENGTH = 2000;
const SUPPORTED_BOOKING_TYPES = new Set([
  "manual_contact",
  "date_range",
  "time_slot",
  "fixed_event",
]);
const SUPPORTED_SCHEDULE_TYPES = new Set(["date_range", "time_slot"]);
const SUPPORTED_STATUSES = new Set([
  "pending",
  "confirmed",
  "cancelled",
  "completed",
  "expired",
]);
const SUPPORTED_PAYMENT_STATUSES = new Set([
  "unpaid",
  "pending",
  "paid",
  "failed",
  "refunded",
]);
const SUPPORTED_CURRENCIES = new Set(["MXN", "USD", "EUR"]);
const INTERNAL_ROLES = new Set([
  "root",
  "owner",
  "staff_manager",
  "staff_editor",
  "staff_support",
]);

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
  resourcesCollectionId: getEnv("APPWRITE_COLLECTION_RESOURCES_ID") || "resources",
  leadsCollectionId: getEnv("APPWRITE_COLLECTION_LEADS_ID") || "leads",
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

const toPositiveInt = (value, fallback = null) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  const rounded = Math.trunc(parsed);
  return rounded >= 0 ? rounded : fallback;
};

const clampInt = (value, min, max, fallback) => {
  const parsed = toPositiveInt(value, fallback);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(min, Math.min(max, parsed));
};

const toMoney = (value, fallback = null) => {
  if (value === "" || value === null || value === undefined) return fallback;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) return fallback;
  return Math.round(parsed * 100) / 100;
};

const parseDate = (value) => {
  if (!hasValue(value)) return null;
  const parsed = new Date(value);
  const time = parsed.getTime();
  if (Number.isNaN(time)) return null;
  return parsed;
};

const parseJsonString = (value) => {
  if (!hasValue(value)) return {};
  if (typeof value === "object" && !Array.isArray(value)) return value;
  try {
    const parsed = JSON.parse(String(value || "{}"));
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed;
    }
  } catch {
    // noop
  }
  return {};
};

const parseScopes = (rawScopes) => {
  if (!rawScopes) return [];
  if (Array.isArray(rawScopes)) {
    return rawScopes.map((scope) => normalizeText(scope, 80).toLowerCase()).filter(Boolean);
  }

  try {
    const parsed = JSON.parse(String(rawScopes || "[]"));
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((scope) => normalizeText(scope, 80).toLowerCase())
      .filter(Boolean);
  } catch {
    return [];
  }
};

const hasScope = (profile, scopeKey) => {
  const targetScope = normalizeText(scopeKey, 80).toLowerCase();
  if (!targetScope) return true;

  const role = normalizeText(profile?.role, 40).toLowerCase();
  if (role === "root" || role === "owner") return true;

  const scopes = new Set(parseScopes(profile?.scopesJson));
  if (scopes.has("*") || scopes.has(targetScope)) return true;

  if (targetScope === "reservations.write") {
    return scopes.has("bookings.write") || scopes.has("reservation.write");
  }

  return false;
};

const canWriteReservations = (profile) => {
  const role = normalizeText(profile?.role, 40).toLowerCase();
  if (INTERNAL_ROLES.has(role)) return true;
  return hasScope(profile, "reservations.write");
};

const getAuthenticatedUserId = (req) => {
  const headers = req.headers || {};
  return normalizeText(headers["x-appwrite-user-id"] || headers["x-appwrite-userid"], 64);
};

const getRequestId = (req) => {
  const headers = req.headers || {};
  return normalizeText(
    headers["x-request-id"] ||
      headers["x-appwrite-execution-id"] ||
      headers["x-appwrite-trigger"],
    100,
  );
};

const normalizeBookingTypeInput = (value) => {
  const normalized = normalizeText(value, 40).toLowerCase();
  return SUPPORTED_BOOKING_TYPES.has(normalized) ? normalized : "";
};

const normalizeScheduleTypeInput = (value) => {
  const normalized = normalizeText(value, 40).toLowerCase();
  return SUPPORTED_SCHEDULE_TYPES.has(normalized) ? normalized : "";
};

const parseLeadSchedule = (lead = {}) => {
  const meta = parseJsonString(lead.metaJson);
  const schedule =
    (meta.requestSchedule && typeof meta.requestSchedule === "object" && meta.requestSchedule) ||
    (meta.schedule && typeof meta.schedule === "object" && meta.schedule) ||
    {};

  const scheduleType =
    normalizeScheduleTypeInput(schedule.scheduleType || schedule.type) ||
    normalizeScheduleTypeInput(meta.scheduleType);

  const checkInDate = schedule.checkInDate || meta.checkInDate || "";
  const checkOutDate = schedule.checkOutDate || meta.checkOutDate || "";
  const startDateTime = schedule.startDateTime || meta.startDateTime || "";
  const endDateTime = schedule.endDateTime || meta.endDateTime || "";

  return {
    meta,
    scheduleType,
    checkInDate,
    checkOutDate,
    startDateTime,
    endDateTime,
    guestName: schedule.guestName || meta.guestName || "",
    guestEmail: schedule.guestEmail || meta.guestEmail || "",
    guestPhone: schedule.guestPhone || meta.guestPhone || "",
    guestCount: schedule.guestCount || meta.guestCount || null,
  };
};

const resolveManualScheduleTypeFromResource = (resource = {}) => {
  const attributes = parseJsonString(resource.attributes);
  return normalizeScheduleTypeInput(
    attributes.manualContactScheduleType || attributes.manual_contact_schedule_type,
  );
};

const resolveBaseAmount = ({ resource, bookingType, nights }) => {
  const unitAmount = toMoney(resource.price || 0, null);
  if (unitAmount === null || unitAmount <= 0) return null;

  const pricingModel = normalizeText(resource.pricingModel, 40).toLowerCase();
  const multiplier =
    bookingType === "date_range" && ["per_night", "per_day"].includes(pricingModel)
      ? Math.max(1, nights)
      : 1;

  return toMoney(unitAmount * multiplier, null);
};

const toWindow = ({ startMs, endMs, bufferMinutes }) => {
  const bufferMs = Math.max(0, Number(bufferMinutes || 0)) * 60 * 1000;
  return {
    startMs: startMs - bufferMs,
    endMs: endMs + bufferMs,
  };
};

const overlaps = (a, b) => a.startMs < b.endMs && a.endMs > b.startMs;

const isBlockingReservation = (reservation) => {
  const status = normalizeText(reservation?.status, 20).toLowerCase();
  return status === "pending" || status === "confirmed";
};

const resolveExistingWindow = (reservation, slotBufferMinutes) => {
  const bookingType = normalizeBookingTypeInput(reservation.bookingType) || "manual_contact";

  if (bookingType === "date_range") {
    const start = parseDate(reservation.checkInDate);
    const end = parseDate(reservation.checkOutDate);
    if (!start || !end) return null;
    return toWindow({
      startMs: start.getTime(),
      endMs: end.getTime(),
      bufferMinutes: slotBufferMinutes,
    });
  }

  const start = parseDate(reservation.startDateTime || reservation.checkInDate);
  const end = parseDate(reservation.endDateTime || reservation.checkOutDate);
  if (!start || !end) return null;

  return toWindow({
    startMs: start.getTime(),
    endMs: end.getTime(),
    bufferMinutes: slotBufferMinutes,
  });
};

const listCandidateReservations = async ({ db, config, resourceId }) => {
  try {
    return await db.listDocuments(config.databaseId, config.reservationsCollectionId, [
      Query.equal("resourceId", resourceId),
      Query.equal("enabled", true),
      Query.equal("status", ["pending", "confirmed"]),
      Query.limit(200),
    ]);
  } catch {
    return { total: 0, documents: [] };
  }
};

const buildReservationPermissions = ({ ownerUserId, actorUserId, guestUserId }) => {
  const permissions = [
    Permission.read(Role.user(ownerUserId)),
    Permission.update(Role.user(ownerUserId)),
    Permission.delete(Role.user(ownerUserId)),
    Permission.read(Role.user(actorUserId)),
    Permission.update(Role.user(actorUserId)),
  ];

  if (hasValue(guestUserId)) {
    permissions.push(Permission.read(Role.user(guestUserId)));
  }

  return [...new Set(permissions)];
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

const safeJson = (value, maxLength = 20000) => {
  try {
    return JSON.stringify(value).slice(0, maxLength);
  } catch {
    return "{}";
  }
};

const resolveScheduleContext = ({ payload, leadSchedule, bookingType, scheduleTypeFromResource }) => {
  const payloadScheduleType = normalizeScheduleTypeInput(payload.scheduleType);

  let scheduleType = payloadScheduleType || scheduleTypeFromResource;
  if (bookingType === "date_range") scheduleType = "date_range";
  if (bookingType === "time_slot" || bookingType === "fixed_event") scheduleType = "time_slot";

  const rawCheckIn = payload.checkInDate || leadSchedule.checkInDate;
  const rawCheckOut = payload.checkOutDate || leadSchedule.checkOutDate;
  const rawStartDateTime = payload.startDateTime || leadSchedule.startDateTime;
  const rawEndDateTime = payload.endDateTime || leadSchedule.endDateTime;

  const checkInDate = parseDate(rawCheckIn);
  const checkOutDate = parseDate(rawCheckOut);
  const startDateTime = parseDate(rawStartDateTime);
  const endDateTime = parseDate(rawEndDateTime);

  if (!scheduleType && bookingType === "manual_contact") {
    if (checkInDate && checkOutDate) scheduleType = "date_range";
    if (startDateTime && endDateTime) scheduleType = "time_slot";
  }

  if (!scheduleType) {
    throw Object.assign(new Error("A scheduleType is required for manual reservations"), {
      status: 422,
      code: "SCHEDULE_REQUIRED",
    });
  }

  if (scheduleType === "date_range") {
    if (!checkInDate || !checkOutDate) {
      throw Object.assign(
        new Error("checkInDate and checkOutDate are required for date range reservations"),
        { status: 422, code: "DATE_RANGE_REQUIRED" },
      );
    }

    const startMs = checkInDate.getTime();
    const endMs = checkOutDate.getTime();
    if (endMs <= startMs) {
      throw Object.assign(new Error("checkOutDate must be greater than checkInDate"), {
        status: 422,
        code: "DATE_RANGE_INVALID",
      });
    }

    const nights = Math.ceil((endMs - startMs) / DAY_IN_MS);
    if (nights < 1 || nights > 365) {
      throw Object.assign(new Error("Reservation nights must be between 1 and 365"), {
        status: 422,
        code: "DATE_RANGE_INVALID",
      });
    }

    return {
      scheduleType,
      nights,
      hasSchedule: true,
      checkInDate,
      checkOutDate,
      startDateTime: null,
      endDateTime: null,
    };
  }

  if (!startDateTime || !endDateTime) {
    throw Object.assign(
      new Error("startDateTime and endDateTime are required for time slot reservations"),
      { status: 422, code: "TIME_SLOT_REQUIRED" },
    );
  }

  if (endDateTime.getTime() <= startDateTime.getTime()) {
    throw Object.assign(new Error("endDateTime must be greater than startDateTime"), {
      status: 422,
      code: "TIME_SLOT_INVALID",
    });
  }

  return {
    scheduleType: "time_slot",
    nights: 0,
    hasSchedule: true,
    checkInDate: startDateTime,
    checkOutDate: endDateTime,
    startDateTime,
    endDateTime,
  };
};

const mergeLeadNotes = ({ existingNotes, reservationId }) => {
  const normalizedNotes = normalizeText(existingNotes, 3600);
  const marker = `reservation:${reservationId}`;
  if (normalizedNotes.includes(marker)) return normalizedNotes;
  const separator = normalizedNotes ? "\n" : "";
  return `${normalizedNotes}${separator}${marker}`.slice(0, 4000);
};

const normalizeStatus = (value, fallback = "pending") => {
  const normalized = normalizeText(value, 20).toLowerCase();
  if (!SUPPORTED_STATUSES.has(normalized)) return fallback;
  return normalized;
};

const normalizePaymentStatus = (value, fallback = "pending") => {
  const normalized = normalizeText(value, 20).toLowerCase();
  if (!SUPPORTED_PAYMENT_STATUSES.has(normalized)) return fallback;
  return normalized;
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

  const actorUserId = getAuthenticatedUserId(req);
  if (!actorUserId) {
    return json(res, 401, {
      ok: false,
      success: false,
      code: "AUTH_REQUIRED",
      message: "You must be authenticated",
    });
  }

  const payload = parseBody(req);
  const leadId = normalizeText(payload.leadId, 64);

  const client = new Client()
    .setEndpoint(config.endpoint)
    .setProject(config.projectId)
    .setKey(config.apiKey);
  const db = new Databases(client);
  const modulesService = createModulesService({ db, config });

  try {
    await modulesService.assertModuleEnabled("module.resources");

    const actorProfile = await db.getDocument(
      config.databaseId,
      config.usersCollectionId,
      actorUserId,
    );

    if (actorProfile.enabled === false || !canWriteReservations(actorProfile)) {
      return json(res, 403, {
        ok: false,
        success: false,
        code: "FORBIDDEN",
        message: "Insufficient permissions to create manual reservations",
      });
    }

    let leadDoc = null;
    if (leadId) {
      leadDoc = await db.getDocument(
        config.databaseId,
        config.leadsCollectionId,
        leadId,
      );

      if (leadDoc.enabled === false) {
        return json(res, 404, {
          ok: false,
          success: false,
          code: "LEAD_NOT_AVAILABLE",
          message: "Lead is disabled",
        });
      }
    }

    const resourceId = normalizeText(payload.resourceId || leadDoc?.resourceId, 64);
    if (!resourceId) {
      return json(res, 422, {
        ok: false,
        success: false,
        code: "VALIDATION_ERROR",
        message: "resourceId is required",
      });
    }

    const resource = await db.getDocument(
      config.databaseId,
      config.resourcesCollectionId,
      resourceId,
    );

    if (resource.enabled !== true) {
      return json(res, 404, {
        ok: false,
        success: false,
        code: "RESOURCE_NOT_AVAILABLE",
        message: "Resource not available",
      });
    }

    const commercialMode = getCommercialMode(resource);
    const defaultBookingType = getBookingType(resource, commercialMode);
    const requestedBookingType = normalizeBookingTypeInput(payload.bookingType);
    const bookingType = requestedBookingType || defaultBookingType;

    if (!SUPPORTED_BOOKING_TYPES.has(bookingType)) {
      return json(res, 422, {
        ok: false,
        success: false,
        code: "BOOKING_TYPE_INVALID",
        message: "Unsupported bookingType",
      });
    }

    const leadSchedule = parseLeadSchedule(leadDoc || {});
    const scheduleTypeFromResource = resolveManualScheduleTypeFromResource(resource);

    const scheduleContext = resolveScheduleContext({
      payload,
      leadSchedule,
      bookingType,
      scheduleTypeFromResource,
    });

    const slotBufferMinutes = Number(resource.slotBufferMinutes || 0);
    const incomingWindow = scheduleContext.scheduleType === "date_range"
      ? toWindow({
          startMs: scheduleContext.checkInDate.getTime(),
          endMs: scheduleContext.checkOutDate.getTime(),
          bufferMinutes: slotBufferMinutes,
        })
      : toWindow({
          startMs: scheduleContext.startDateTime.getTime(),
          endMs: scheduleContext.endDateTime.getTime(),
          bufferMinutes: slotBufferMinutes,
        });

    const candidates = await listCandidateReservations({ db, config, resourceId });
    const hasConflict = (candidates.documents || []).some((reservation) => {
      if (!isBlockingReservation(reservation)) return false;
      const existingWindow = resolveExistingWindow(reservation, slotBufferMinutes);
      if (!existingWindow) return false;
      return overlaps(existingWindow, incomingWindow);
    });

    if (hasConflict) {
      return json(res, 409, {
        ok: false,
        success: false,
        code: "RESERVATION_CONFLICT",
        message: "The selected schedule is not available",
      });
    }

    const leadUserId = normalizeText(leadDoc?.userId, 64);
    const payloadGuestUserId = normalizeText(payload.guestUserId, 64);
    const guestUserId = payloadGuestUserId || leadUserId || actorUserId;

    let guestProfile = null;
    if (guestUserId) {
      try {
        guestProfile = await db.getDocument(
          config.databaseId,
          config.usersCollectionId,
          guestUserId,
        );
      } catch {
        guestProfile = null;
      }
    }

    const guestName =
      normalizeText(payload.guestName, 120) ||
      normalizeText(leadSchedule.guestName, 120) ||
      normalizeText(guestProfile?.name, 120) ||
      normalizeText(guestProfile?.firstName && guestProfile?.lastName
        ? `${guestProfile.firstName} ${guestProfile.lastName}`
        : guestProfile?.email, 120) ||
      "Cliente manual";

    const guestEmail =
      normalizeText(payload.guestEmail, 254).toLowerCase() ||
      normalizeText(leadSchedule.guestEmail, 254).toLowerCase() ||
      normalizeText(guestProfile?.email, 254).toLowerCase() ||
      normalizeText(actorProfile?.email, 254).toLowerCase() ||
      "manual@inmobo.local";

    const guestPhone =
      normalizeText(payload.guestPhone, 20) ||
      normalizeText(leadSchedule.guestPhone, 20) ||
      normalizeText(guestProfile?.phone, 20);

    const guestCount = clampInt(
      payload.guestCount ?? leadSchedule.guestCount,
      1,
      500,
      1,
    );
    const units = clampInt(payload.units, 1, 9999, 1);

    const computedBaseAmount = resolveBaseAmount({
      resource,
      bookingType: scheduleContext.scheduleType === "date_range" ? "date_range" : bookingType,
      nights: scheduleContext.nights,
    });

    const baseAmount = toMoney(payload.baseAmount, computedBaseAmount);
    const feesAmount = toMoney(payload.feesAmount, 0);
    const taxAmount = toMoney(payload.taxAmount, 0);

    if (baseAmount === null || feesAmount === null || taxAmount === null) {
      return json(res, 422, {
        ok: false,
        success: false,
        code: "AMOUNT_INVALID",
        message: "Invalid amount payload",
      });
    }

    const totalAmount = toMoney(payload.totalAmount, toMoney(baseAmount + feesAmount + taxAmount, null));
    if (totalAmount === null) {
      return json(res, 422, {
        ok: false,
        success: false,
        code: "AMOUNT_INVALID",
        message: "Invalid total amount",
      });
    }

    const currency = normalizeText(payload.currency || resource.currency || "MXN", 3).toUpperCase();
    if (!SUPPORTED_CURRENCIES.has(currency)) {
      return json(res, 422, {
        ok: false,
        success: false,
        code: "CURRENCY_NOT_SUPPORTED",
        message: `Supported currencies: ${Array.from(SUPPORTED_CURRENCIES).join(", ")}`,
      });
    }

    const status = normalizeStatus(payload.status, "pending");
    const paymentStatus = normalizePaymentStatus(payload.paymentStatus, "pending");

    const externalRef = normalizeText(payload.externalRef, 120);
    const payloadSpecialRequests = normalizeText(payload.specialRequests, MAX_SPECIAL_REQUESTS_LENGTH);
    const leadMessage = normalizeText(leadDoc?.lastMessage, 300);
    const specialRequests = payloadSpecialRequests || leadMessage;

    const reservationData = {
      resourceId,
      resourceOwnerUserId: normalizeText(resource.ownerUserId, 64),
      guestUserId,
      guestName,
      guestEmail,
      commercialMode,
      bookingType,
      checkInDate: scheduleContext.checkInDate.toISOString(),
      checkOutDate: scheduleContext.checkOutDate.toISOString(),
      guestCount,
      units,
      nights: scheduleContext.nights,
      baseAmount,
      feesAmount,
      taxAmount,
      totalAmount,
      currency,
      status,
      paymentStatus,
      paymentProvider: "manual",
      enabled: true,
    };

    if (guestPhone) reservationData.guestPhone = guestPhone;
    if (externalRef) reservationData.externalRef = externalRef;
    if (specialRequests) reservationData.specialRequests = specialRequests;

    if (scheduleContext.startDateTime && scheduleContext.endDateTime) {
      reservationData.startDateTime = scheduleContext.startDateTime.toISOString();
      reservationData.endDateTime = scheduleContext.endDateTime.toISOString();
    }

    const reservation = await db.createDocument(
      config.databaseId,
      config.reservationsCollectionId,
      ID.unique(),
      reservationData,
      buildReservationPermissions({
        ownerUserId: reservationData.resourceOwnerUserId,
        actorUserId,
        guestUserId,
      }),
    );

    await db
      .updateDocument(config.databaseId, config.resourcesCollectionId, resourceId, {
        reservationCount: Number(resource.reservationCount || 0) + 1,
      })
      .catch(() => {});

    if (leadDoc?.$id) {
      const closeLead = Boolean(payload.closeLead);
      const nextLeadStatus = closeLead ? "closed_won" : "contacted";

      await db
        .updateDocument(config.databaseId, config.leadsCollectionId, leadDoc.$id, {
          status: nextLeadStatus,
          notes: mergeLeadNotes({
            existingNotes: leadDoc.notes,
            reservationId: reservation.$id,
          }),
        })
        .catch(() => {});
    }

    await safeActivityLog({
      db,
      config,
      logger: log,
      data: {
        actorUserId,
        actorRole: normalizeText(actorProfile.role, 40).toLowerCase() || "owner",
        action: leadDoc?.$id
          ? "reservation.create_manual_from_lead"
          : "reservation.create_manual",
        entityType: "reservations",
        entityId: reservation.$id,
        afterData: safeJson({
          reservationId: reservation.$id,
          resourceId,
          leadId: leadDoc?.$id || "",
          bookingType,
          scheduleType: scheduleContext.scheduleType,
          status,
          paymentStatus,
          paymentProvider: "manual",
          totalAmount,
          currency,
        }),
        requestId: getRequestId(req),
        severity: "info",
      },
    });

    return json(res, 201, {
      ok: true,
      success: true,
      code: "RESERVATION_CREATED_MANUAL",
      message: "Manual reservation created",
      data: {
        reservationId: reservation.$id,
        resourceId,
        leadId: leadDoc?.$id || null,
        bookingType,
        scheduleType: scheduleContext.scheduleType,
        status,
        paymentStatus,
        paymentProvider: "manual",
        totalAmount,
        currency,
      },
    });
  } catch (err) {
    if (err?.code === "MODULE_DISABLED" || err?.code === "LIMIT_EXCEEDED") {
      const moduleError = toModuleErrorResponse(err);
      return json(res, moduleError.status, moduleError.body);
    }

    const statusCode = Number(err?.status || 500);
    if (statusCode >= 400 && statusCode < 500) {
      return json(res, statusCode, {
        ok: false,
        success: false,
        code: String(err?.code || "VALIDATION_ERROR"),
        message: String(err?.message || "Invalid request"),
      });
    }

    error(`create-reservation-manual failed: ${err.message}`);
    return json(res, 500, {
      ok: false,
      success: false,
      code: "INTERNAL_ERROR",
      message: err.message,
    });
  }
};
