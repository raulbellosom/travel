import { Client, Databases, Query } from "node-appwrite";

const DAY_IN_MS = 24 * 60 * 60 * 1000;
const MAX_RANGE_DAYS = 730;
const ACTIVE_RESERVATION_STATUSES = ["pending", "confirmed"];

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
  const normalized = String(value ?? "").trim();
  if (!maxLength) return normalized;
  return normalized.slice(0, maxLength);
};

const normalizeBookingType = (value, commercialMode = "") => {
  const normalized = normalizeText(value, 40).toLowerCase();
  if (["manual_contact", "date_range", "time_slot", "fixed_event"].includes(normalized)) {
    return normalized;
  }

  const mode = normalizeText(commercialMode, 40).toLowerCase();
  if (mode === "rent_short_term") return "date_range";
  if (mode === "rent_hourly") return "time_slot";
  return "manual_contact";
};

const parseDate = (value) => {
  if (!hasValue(value)) return null;
  const raw = String(value).trim();
  const parsed = /^\d{4}-\d{2}-\d{2}$/.test(raw)
    ? new Date(`${raw}T00:00:00.000Z`)
    : new Date(raw);
  const time = parsed.getTime();
  if (Number.isNaN(time)) return null;
  return parsed;
};

const startOfDayUtc = (value) => {
  const date = value instanceof Date ? value : new Date(value);
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
};

const toDateKey = (value) => {
  const date = value instanceof Date ? value : new Date(value);
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

const parseAttributes = (raw) => {
  if (!hasValue(raw)) return {};
  if (typeof raw === "object" && !Array.isArray(raw)) return raw;
  try {
    const parsed = JSON.parse(String(raw || "{}"));
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? parsed
      : {};
  } catch {
    return {};
  }
};

const resolveReservationInterval = (reservation = {}) => {
  const bookingType = normalizeBookingType(
    reservation.bookingType,
    reservation.commercialMode,
  );

  const checkInDate = parseDate(reservation.checkInDate);
  const checkOutDate = parseDate(reservation.checkOutDate);
  const hasExplicitSlotRange =
    hasValue(reservation.startDateTime) && hasValue(reservation.endDateTime);
  const startDateTime = parseDate(reservation.startDateTime);
  const endDateTime = parseDate(reservation.endDateTime);

  if (bookingType === "date_range") {
    if (!checkInDate || !checkOutDate) return null;
    return {
      bookingType,
      start: checkInDate,
      end: checkOutDate,
      isSlot: false,
    };
  }

  if (hasExplicitSlotRange && startDateTime && endDateTime) {
    return {
      bookingType,
      start: startDateTime,
      end: endDateTime,
      isSlot: true,
    };
  }

  if (checkInDate && checkOutDate) {
    const isSlot =
      bookingType === "time_slot" || bookingType === "fixed_event";
    return {
      bookingType,
      start: checkInDate,
      end: checkOutDate,
      isSlot,
    };
  }

  return null;
};

const overlapsRange = ({ start, end }, from, to) =>
  start.getTime() <= to.getTime() && end.getTime() >= from.getTime();

const sortByStartTime = (a, b) =>
  new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime();

const addBlockedDateKeys = ({ set, start, end, from, to }) => {
  let cursor = startOfDayUtc(start);
  const limitEnd = startOfDayUtc(end);

  while (cursor.getTime() <= limitEnd.getTime()) {
    if (cursor.getTime() >= from.getTime() && cursor.getTime() <= to.getTime()) {
      set.add(toDateKey(cursor));
    }
    cursor = new Date(cursor.getTime() + DAY_IN_MS);
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

  const payload = parseBody(req);
  const resourceId = normalizeText(payload.resourceId || payload.propertyId, 64);

  if (!resourceId) {
    return json(res, 422, {
      ok: false,
      success: false,
      code: "VALIDATION_ERROR",
      message: "resourceId is required",
    });
  }

  const fromDate = parseDate(payload.from) || startOfDayUtc(new Date());
  const requestedTo = parseDate(payload.to);
  const defaultTo = new Date(fromDate.getTime() + 365 * DAY_IN_MS);
  const toDate = requestedTo || defaultTo;

  if (toDate.getTime() < fromDate.getTime()) {
    return json(res, 422, {
      ok: false,
      success: false,
      code: "INVALID_WINDOW",
      message: "to must be greater than or equal to from",
    });
  }

  const rangeDays = Math.ceil((toDate.getTime() - fromDate.getTime()) / DAY_IN_MS) + 1;
  if (rangeDays > MAX_RANGE_DAYS) {
    return json(res, 422, {
      ok: false,
      success: false,
      code: "WINDOW_TOO_LARGE",
      message: `Maximum window size is ${MAX_RANGE_DAYS} days`,
    });
  }

  const client = new Client()
    .setEndpoint(config.endpoint)
    .setProject(config.projectId)
    .setKey(config.apiKey);
  const db = new Databases(client);

  try {
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
        message: "Resource not available",
      });
    }

    const resourceBookingType = normalizeBookingType(
      resource.bookingType,
      resource.commercialMode,
    );
    const resourceAttributes = parseAttributes(resource.attributes);
    const manualContactScheduleType = normalizeText(
      resourceAttributes.manualContactScheduleType,
      40,
    ).toLowerCase();

    const response = await db.listDocuments(
      config.databaseId,
      config.reservationsCollectionId,
      [
        Query.equal("resourceId", resourceId),
        Query.equal("enabled", true),
        Query.equal("status", ACTIVE_RESERVATION_STATUSES),
        Query.limit(500),
      ],
    );

    const blockedDateSet = new Set();
    const occupiedSlotsByDate = {};
    const reservations = [];

    for (const reservation of response.documents || []) {
      const interval = resolveReservationInterval(reservation);
      if (!interval) continue;
      if (interval.end.getTime() <= interval.start.getTime()) continue;
      if (!overlapsRange(interval, fromDate, toDate)) continue;

      reservations.push({
        reservationId: reservation.$id,
        bookingType: interval.bookingType,
        status: reservation.status,
        startDateTime: interval.start.toISOString(),
        endDateTime: interval.end.toISOString(),
      });

      if (interval.isSlot) {
        const slotDateKey = toDateKey(interval.start);
        if (!occupiedSlotsByDate[slotDateKey]) occupiedSlotsByDate[slotDateKey] = [];
        occupiedSlotsByDate[slotDateKey].push({
          reservationId: reservation.$id,
          bookingType: interval.bookingType,
          status: reservation.status,
          startDateTime: interval.start.toISOString(),
          endDateTime: interval.end.toISOString(),
        });
      } else {
        addBlockedDateKeys({
          set: blockedDateSet,
          start: interval.start,
          end: interval.end,
          from: fromDate,
          to: toDate,
        });
      }
    }

    Object.keys(occupiedSlotsByDate).forEach((key) => {
      occupiedSlotsByDate[key] = occupiedSlotsByDate[key].sort(sortByStartTime);
    });

    return json(res, 200, {
      ok: true,
      success: true,
      code: "RESOURCE_AVAILABILITY",
      message: "Availability loaded",
      data: {
        resourceId,
        bookingType: resourceBookingType,
        manualContactScheduleType:
          manualContactScheduleType === "date_range" || manualContactScheduleType === "time_slot"
            ? manualContactScheduleType
            : "none",
        from: fromDate.toISOString(),
        to: toDate.toISOString(),
        blockedDateKeys: Array.from(blockedDateSet).sort(),
        occupiedSlotsByDate,
        reservations,
      },
    });
  } catch (err) {
    error(`get-resource-availability failed: ${err.message}`);
    return json(res, 500, {
      ok: false,
      success: false,
      code: "INTERNAL_ERROR",
      message: err.message,
    });
  }
};
