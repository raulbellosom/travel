import { createHash } from "node:crypto";
import { Client, Databases, ID, Permission, Query, Role, Users } from "node-appwrite";

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

const normalizeText = (value, maxLength = 0) => {
  const normalized = String(value ?? "").trim().replace(/\s+/g, " ");
  if (!maxLength) return normalized;
  return normalized.slice(0, maxLength);
};

const safeJsonString = (value, maxLength = 20000) => {
  try {
    return JSON.stringify(value).slice(0, maxLength);
  } catch {
    return "{}";
  }
};

const hashEmail = (email) =>
  createHash("sha256").update(String(email || "").toLowerCase()).digest("hex");

const getAuthenticatedUserId = (req) => {
  const headers = req.headers || {};
  return (
    headers["x-appwrite-user-id"] ||
    headers["x-appwrite-userid"] ||
    ""
  );
};

const buildReviewPermissions = (resourceOwnerUserId, authorUserId) => {
  const permissions = [Permission.read(Role.user(authorUserId))];
  if (resourceOwnerUserId) {
    permissions.push(Permission.read(Role.user(resourceOwnerUserId)));
    permissions.push(Permission.update(Role.user(resourceOwnerUserId)));
    permissions.push(Permission.delete(Role.user(resourceOwnerUserId)));
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
      message: "You must be authenticated to create a review",
    });
  }

  const payload = parseBody(req);
  const resourceId = normalizeText(payload.resourceId, 64);
  const reservationId = normalizeText(payload.reservationId, 64);
  const comment = normalizeText(payload.comment, 3000);
  const title = normalizeText(payload.title, 160);
  const rating = Number(payload.rating);

  if (!resourceId || !reservationId || !comment) {
    return json(res, 400, {
      ok: false,
      success: false,
      code: "VALIDATION_ERROR",
      message: "resourceId, reservationId and comment are required",
    });
  }

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return json(res, 422, {
      ok: false,
      success: false,
      code: "VALIDATION_ERROR",
      message: "rating must be an integer between 1 and 5",
    });
  }

  if (comment.length < 10) {
    return json(res, 422, {
      ok: false,
      success: false,
      code: "VALIDATION_ERROR",
      message: "comment must contain at least 10 characters",
    });
  }

  const client = new Client()
    .setEndpoint(config.endpoint)
    .setProject(config.projectId)
    .setKey(config.apiKey);
  const db = new Databases(client);
  const users = new Users(client);

  try {
    const authUser = await users.get(authenticatedUserId);
    const authEmail = normalizeText(authUser.email, 254).toLowerCase();
    if (!authEmail) {
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
        message: "Verify your email before creating a review",
      });
    }

    const [resource, reservation] = await Promise.all([
      db.getDocument(config.databaseId, config.resourcesCollectionId, resourceId),
      db.getDocument(config.databaseId, config.reservationsCollectionId, reservationId),
    ]);

    if (resource.enabled !== true) {
      return json(res, 404, {
        ok: false,
        success: false,
        code: "RESOURCE_NOT_AVAILABLE",
        message: "Resource not available",
      });
    }

    if (reservation.enabled !== true) {
      return json(res, 404, {
        ok: false,
        success: false,
        code: "RESERVATION_NOT_AVAILABLE",
        message: "Reservation not available",
      });
    }

    if (normalizeText(reservation.resourceId, 64) !== resourceId) {
      return json(res, 422, {
        ok: false,
        success: false,
        code: "REVIEW_NOT_ELIGIBLE",
        message: "Reservation does not belong to resource",
      });
    }

    const reservationStatus = String(reservation.status || "");
    const paymentStatus = String(reservation.paymentStatus || "");
    const isEligibleStatus = reservationStatus === "completed" || reservationStatus === "confirmed";

    if (!isEligibleStatus || paymentStatus !== "paid") {
      return json(res, 422, {
        ok: false,
        success: false,
        code: "REVIEW_NOT_ELIGIBLE",
        message: "Reservation is not eligible for review",
      });
    }

    const reservationGuestUserId = normalizeText(reservation.guestUserId, 64);
    const reservationGuestEmail = normalizeText(reservation.guestEmail, 254).toLowerCase();
    const isGuestByUserId =
      reservationGuestUserId && reservationGuestUserId === authenticatedUserId;
    const isGuestByEmail =
      !reservationGuestUserId &&
      reservationGuestEmail &&
      reservationGuestEmail === authEmail;

    if (!isGuestByUserId && !isGuestByEmail) {
      return json(res, 403, {
        ok: false,
        success: false,
        code: "REVIEW_UNAUTHORIZED",
        message: "Authenticated user does not match reservation guest",
      });
    }

    const duplicates = await db.listDocuments(
      config.databaseId,
      config.reviewsCollectionId,
      [
        Query.equal("reservationId", reservationId),
        Query.equal("enabled", true),
        Query.limit(1),
      ],
    );

    if (duplicates.total > 0) {
      return json(res, 409, {
        ok: false,
        success: false,
        code: "REVIEW_ALREADY_EXISTS",
        message: "A review already exists for this reservation",
      });
    }

    const resourceOwnerUserId =
      String(reservation.resourceOwnerUserId || "") || String(resource.ownerUserId || "");

    const reviewData = {
      resourceId,
      reservationId,
      authorUserId: authenticatedUserId,
      authorName:
        normalizeText(authUser.name, 120) ||
        normalizeText(reservation.guestName, 120) ||
        "Guest",
      authorEmailHash: hashEmail(authEmail),
      rating,
      comment,
      status: "pending",
      enabled: true,
    };

    if (title) {
      reviewData.title = title;
    }

    const review = await db.createDocument(
      config.databaseId,
      config.reviewsCollectionId,
      ID.unique(),
      reviewData,
      buildReviewPermissions(resourceOwnerUserId, authenticatedUserId),
    );

    if (resourceOwnerUserId) {
      await safeActivityLog({
        db,
        config,
        logger: log,
        data: {
          actorUserId: authenticatedUserId,
          actorRole: "client",
          action: "review.create_authenticated",
          entityType: "reviews",
          entityId: review.$id,
          afterData: safeJsonString({
            reservationId,
            resourceId,
            authorUserId: authenticatedUserId,
            rating,
            status: "pending",
          }),
          severity: "info",
        },
      });
    }

    return json(res, 201, {
      ok: true,
      success: true,
      code: "REVIEW_CREATED",
      message: "Review created in pending state",
      data: {
        reviewId: review.$id,
        reservationId,
        resourceId,
        authorUserId: authenticatedUserId,
        status: "pending",
      },
    });
  } catch (err) {
    error(`create-review-public failed: ${err.message}`);
    return json(res, 500, {
      ok: false,
      success: false,
      code: "INTERNAL_ERROR",
      message: err.message,
    });
  }
};
