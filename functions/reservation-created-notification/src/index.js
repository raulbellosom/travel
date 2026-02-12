import { Client, Databases, ID } from "node-appwrite";

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

const resolveReservationId = (payload) =>
  String(
    payload?.$id ||
      payload?.reservationId ||
      payload?.id ||
      payload?.documentId ||
      payload?.data?.$id ||
      "",
  ).trim();

export default async ({ req, res, log, error }) => {
  const config = cfg();
  if (!config.endpoint || !config.projectId || !config.apiKey) {
    return json(res, 500, { ok: false, message: "Missing Appwrite credentials" });
  }

  const payload = parseBody(req);
  const reservationId = resolveReservationId(payload);
  if (!reservationId) {
    return json(res, 422, { ok: false, message: "reservationId not found in payload" });
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

    // TODO: integrate SMTP/email provider notification dispatch.
    log(
      `reservation-created-notification reservationId=${reservationId} owner=${reservation.propertyOwnerId} guest=${reservation.guestEmail}`,
    );

    if (config.activityLogsCollectionId) {
      await db.createDocument(
        config.databaseId,
        config.activityLogsCollectionId,
        ID.unique(),
        {
          actorUserId: reservation.propertyOwnerId,
          actorRole: "owner",
          action: "reservation.notification_dispatched",
          entityType: "reservations",
          entityId: reservationId,
          afterData: JSON.stringify({
            reservationId,
            guestEmail: reservation.guestEmail,
            status: reservation.status,
          }).slice(0, 20000),
          severity: "info",
        },
      ).catch(() => {});
    }

    return json(res, 200, {
      ok: true,
      success: true,
      code: "RESERVATION_NOTIFICATION_DISPATCHED",
      reservationId,
    });
  } catch (err) {
    error(`reservation-created-notification failed: ${err.message}`);
    return json(res, 500, { ok: false, message: err.message });
  }
};
