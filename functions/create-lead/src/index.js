import {
  Client,
  Databases,
  ID,
  Permission,
  Query,
  Role,
  Users,
} from "node-appwrite";
import {
  createModulesService,
  getBookingType,
  getCommercialMode,
  toModuleErrorResponse,
} from "./lib/modulesService.js";

const SUPPORTED_CONTACT_CHANNELS = new Set([
  "resource_chat",
  "resource_cta_form",
]);
const SUPPORTED_INTENTS = new Set([
  "booking_request",
  "booking_request_manual",
  "visit_request",
  "info_request",
]);
const META_JSON_MAX_LENGTH = 8000;
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
  resourcesCollectionId:
    getEnv("APPWRITE_COLLECTION_RESOURCES_ID") || "resources",
  leadsCollectionId: getEnv("APPWRITE_COLLECTION_LEADS_ID") || "leads",
  conversationsCollectionId:
    getEnv("APPWRITE_COLLECTION_CONVERSATIONS_ID") || "conversations",
  messagesCollectionId: getEnv("APPWRITE_COLLECTION_MESSAGES_ID") || "messages",
  activityLogsCollectionId:
    getEnv("APPWRITE_COLLECTION_ACTIVITY_LOGS_ID") || "",
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

const normalizeText = (value, maxLength = 0) => {
  const normalized = String(value ?? "")
    .trim()
    .replace(/\s+/g, " ");
  if (!maxLength) return normalized;
  return normalized.slice(0, maxLength);
};

const normalizeNullableText = (value, maxLength = 0) => {
  const normalized = normalizeText(value, maxLength);
  return normalized || undefined;
};

const toSafeInteger = (value, fallback = undefined) => {
  if (!hasValue(value)) return fallback;
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  return Math.trunc(numeric);
};

const parseObject = (value) => {
  if (!value) return {};
  if (typeof value === "object" && !Array.isArray(value)) return value;
  if (typeof value !== "string") return {};
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? parsed
      : {};
  } catch {
    return {};
  }
};

const parseMetaPayload = (body) => {
  if (body?.meta && typeof body.meta === "object" && !Array.isArray(body.meta)) {
    return body.meta;
  }
  if (body?.metaJson && typeof body.metaJson === "string") {
    return parseObject(body.metaJson);
  }
  return {};
};

const normalizeContactChannel = (value) => {
  const normalized = normalizeText(value, 40).toLowerCase();
  if (SUPPORTED_CONTACT_CHANNELS.has(normalized)) return normalized;

  if (normalized === "authenticated_chat") return "resource_chat";
  if (normalized === "authenticated_form") return "resource_cta_form";

  return "resource_chat";
};

const normalizeIntent = (value) => {
  const normalized = normalizeText(value, 40).toLowerCase();
  if (!SUPPORTED_INTENTS.has(normalized)) return "";
  return normalized;
};

const normalizeMeetingType = (value) => {
  const normalized = normalizeText(value, 20).toLowerCase();
  if (normalized === "on_site" || normalized === "video_call") {
    return normalized;
  }
  return "";
};

const parseDateTime = (value) => {
  if (!hasValue(value)) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
};

const toIsoOrUndefined = (value) => {
  const parsed = parseDateTime(value);
  return parsed ? parsed.toISOString() : undefined;
};

const buildClientDisplayName = (profile, authUser) => {
  const profileName =
    normalizeNullableText(profile?.name, 120) ||
    normalizeNullableText(
      [profile?.firstName, profile?.lastName].filter(Boolean).join(" "),
      120,
    );

  if (profileName) return profileName;
  return (
    normalizeNullableText(authUser?.name, 120) ||
    normalizeNullableText(authUser?.email, 120) ||
    "Cliente"
  );
};

const resolveProfilePhone = (profile) => {
  const phone = normalizeText(profile?.phone, 30);
  if (!phone) return "";
  const prefix = normalizeText(
    profile?.phoneCountryCode || profile?.whatsappCountryCode,
    8,
  );
  return normalizeText(`${prefix} ${phone}`, 30);
};

const buildResourceSnapshot = (resource) => {
  const commercialMode = getCommercialMode(resource);
  const bookingType = getBookingType(resource, commercialMode);

  return {
    resourceType: normalizeText(resource?.resourceType || "property", 40),
    category: normalizeText(resource?.category || "", 80),
    commercialMode,
    bookingType,
  };
};

const normalizeBookingPayload = (meta) => {
  const bookingNode =
    meta?.booking && typeof meta.booking === "object" && !Array.isArray(meta.booking)
      ? meta.booking
      : {};

  const requestSchedule =
    meta?.requestSchedule &&
    typeof meta.requestSchedule === "object" &&
    !Array.isArray(meta.requestSchedule)
      ? meta.requestSchedule
      : {};

  const guests = toSafeInteger(
    bookingNode.guests ?? meta.guests ?? meta.guestCount,
    undefined,
  );
  const adults = toSafeInteger(bookingNode.adults ?? meta.adults, undefined);
  const children = toSafeInteger(
    bookingNode.children ?? meta.children,
    undefined,
  );
  const pets = toSafeInteger(bookingNode.pets ?? meta.pets, undefined);

  const startDate =
    normalizeNullableText(bookingNode.startDate, 40) ||
    normalizeNullableText(bookingNode.checkInDate, 40) ||
    normalizeNullableText(meta.preferredStartDate, 40) ||
    normalizeNullableText(requestSchedule.checkInDate, 40);

  const endDate =
    normalizeNullableText(bookingNode.endDate, 40) ||
    normalizeNullableText(bookingNode.checkOutDate, 40) ||
    normalizeNullableText(meta.preferredEndDate, 40) ||
    normalizeNullableText(requestSchedule.checkOutDate, 40);

  const nights = toSafeInteger(
    bookingNode.nights ?? requestSchedule.nights,
    undefined,
  );

  const checkInTime =
    normalizeNullableText(bookingNode.checkInTime, 20) ||
    normalizeNullableText(meta.checkInTime, 20);
  const checkOutTime =
    normalizeNullableText(bookingNode.checkOutTime, 20) ||
    normalizeNullableText(meta.checkOutTime, 20);

  return stripUndefined({
    guests,
    adults,
    children,
    pets,
    startDate,
    endDate,
    nights,
    checkInTime,
    checkOutTime,
  });
};

const normalizeVisitSlots = (rawSlots = []) => {
  if (!Array.isArray(rawSlots)) return [];

  return rawSlots
    .map((slot) => {
      if (!slot || typeof slot !== "object") return null;
      const start = toIsoOrUndefined(slot.startDateTime || slot.start);
      const end = toIsoOrUndefined(slot.endDateTime || slot.end);
      const timezone =
        normalizeNullableText(slot.timezone, 50) ||
        normalizeNullableText(slot.tz, 50) ||
        "UTC";

      if (!start || !end) return null;
      return { startDateTime: start, endDateTime: end, timezone };
    })
    .filter(Boolean);
};

const normalizeVisitPayload = (meta) => {
  const visitNode =
    meta?.visit && typeof meta.visit === "object" && !Array.isArray(meta.visit)
      ? meta.visit
      : {};

  const requestSchedule =
    meta?.requestSchedule &&
    typeof meta.requestSchedule === "object" &&
    !Array.isArray(meta.requestSchedule)
      ? meta.requestSchedule
      : {};

  const directSlots = normalizeVisitSlots(visitNode.preferredSlots);

  const legacySlot = stripUndefined({
    startDateTime: toIsoOrUndefined(
      requestSchedule.startDateTime ||
        meta.startDateTime ||
        visitNode.startDateTime,
    ),
    endDateTime: toIsoOrUndefined(
      requestSchedule.endDateTime ||
        meta.endDateTime ||
        visitNode.endDateTime,
    ),
    timezone:
      normalizeNullableText(visitNode.timezone, 50) ||
      normalizeNullableText(requestSchedule.timezone, 50) ||
      normalizeNullableText(meta.timezone, 50) ||
      "UTC",
  });

  const preferredSlots = [...directSlots];
  if (
    preferredSlots.length === 0 &&
    legacySlot.startDateTime &&
    legacySlot.endDateTime
  ) {
    preferredSlots.push(legacySlot);
  }

  const meetingType =
    normalizeMeetingType(visitNode.meetingType || meta.meetingType) || undefined;

  const notes =
    normalizeNullableText(visitNode.notes, 1000) ||
    normalizeNullableText(meta.notes, 1000);

  return stripUndefined({
    meetingType,
    preferredSlots,
    notes,
  });
};

const normalizeContactPrefs = (meta, profile, authUser) => {
  const contactNode =
    meta?.contactPrefs &&
    typeof meta.contactPrefs === "object" &&
    !Array.isArray(meta.contactPrefs)
      ? meta.contactPrefs
      : {};

  const preferredLanguage =
    normalizeNullableText(contactNode.preferredLanguage, 12) ||
    normalizeNullableText(meta.preferredLanguage, 12) ||
    normalizeNullableText(profile?.preferredLanguage, 12) ||
    normalizeNullableText(profile?.locale, 12);

  const phone =
    normalizeNullableText(contactNode.phone, 30) ||
    normalizeNullableText(meta.phone, 30) ||
    normalizeNullableText(resolveProfilePhone(profile), 30) ||
    normalizeNullableText(authUser?.phone, 30);

  return stripUndefined({ preferredLanguage, phone });
};

const hasVisitData = (visitPayload) => {
  if (!visitPayload || typeof visitPayload !== "object") return false;
  if (Array.isArray(visitPayload.preferredSlots) && visitPayload.preferredSlots.length > 0) {
    return true;
  }
  return false;
};

const hasBookingData = (bookingPayload) => {
  if (!bookingPayload || typeof bookingPayload !== "object") return false;
  return Boolean(
    hasValue(bookingPayload.startDate) ||
      hasValue(bookingPayload.endDate) ||
      Number.isFinite(Number(bookingPayload.guests)),
  );
};

const deriveIntent = ({
  requestedIntent,
  resourceSnapshot,
  bookingPayload,
  visitPayload,
}) => {
  const mode = normalizeText(resourceSnapshot?.commercialMode, 40).toLowerCase();
  const bookingType = normalizeText(resourceSnapshot?.bookingType, 40).toLowerCase();

  const forcedVisit = mode === "sale" || mode === "rent_long_term";
  if (forcedVisit) return "visit_request";

  const forcedManualBooking =
    mode === "rent_short_term" && bookingType === "manual_contact";
  if (forcedManualBooking) return "booking_request_manual";

  const normalizedRequested = normalizeIntent(requestedIntent);
  if (normalizedRequested === "booking_request_manual") {
    return hasBookingData(bookingPayload) ? "booking_request" : "info_request";
  }

  if (normalizedRequested) return normalizedRequested;

  if (hasBookingData(bookingPayload)) return "booking_request";
  if (hasVisitData(visitPayload)) return "visit_request";

  return "info_request";
};

const validateSlots = (slots = []) => {
  if (!Array.isArray(slots)) return false;
  if (slots.length < 1) return false;

  return slots.every((slot) => {
    const start = parseDateTime(slot.startDateTime);
    const end = parseDateTime(slot.endDateTime);
    if (!start || !end) return false;
    if (end.getTime() <= start.getTime()) return false;
    return hasValue(slot.timezone);
  });
};

const validateBookingDateRange = (bookingPayload = {}) => {
  const start = parseDateTime(bookingPayload.startDate);
  const end = parseDateTime(bookingPayload.endDate);
  if (!start || !end) return false;
  return end.getTime() > start.getTime();
};

const validateCanonicalMeta = ({ intent, bookingPayload, visitPayload }) => {
  if (intent === "visit_request") {
    if (!validateSlots(visitPayload.preferredSlots || [])) {
      throw createHttpError(
        422,
        "VALIDATION_ERROR",
        "visit.preferredSlots must include at least one valid slot",
      );
    }
    return;
  }

  if (intent === "booking_request_manual") {
    const guests = Number(bookingPayload.guests || 0);
    if (!Number.isFinite(guests) || guests < 1) {
      throw createHttpError(
        422,
        "VALIDATION_ERROR",
        "booking.guests is required for booking_request_manual",
      );
    }

    if (!validateBookingDateRange(bookingPayload)) {
      throw createHttpError(
        422,
        "VALIDATION_ERROR",
        "booking.startDate and booking.endDate are required for booking_request_manual",
      );
    }
  }

  if (intent === "booking_request") {
    const hasAnyDate = hasValue(bookingPayload.startDate) || hasValue(bookingPayload.endDate);
    if (hasAnyDate && !validateBookingDateRange(bookingPayload)) {
      throw createHttpError(
        422,
        "VALIDATION_ERROR",
        "booking.startDate must be before booking.endDate",
      );
    }
  }
};

const stripUndefined = (value) => {
  if (Array.isArray(value)) {
    return value.map(stripUndefined).filter((item) => item !== undefined);
  }

  if (value && typeof value === "object") {
    const next = {};
    Object.entries(value).forEach(([key, currentValue]) => {
      const normalized = stripUndefined(currentValue);
      if (normalized !== undefined) {
        next[key] = normalized;
      }
    });
    return next;
  }

  return value === undefined ? undefined : value;
};

const buildLeadPermissions = (ownerUserId, clientUserId) => [
  ...new Set([
    Permission.read(Role.user(ownerUserId)),
    Permission.update(Role.user(ownerUserId)),
    Permission.delete(Role.user(ownerUserId)),
    Permission.read(Role.user(clientUserId)),
  ]),
];

const buildConversationPermissions = (ownerUserId, clientUserId) => [
  ...new Set([
    Permission.read(Role.user(ownerUserId)),
    Permission.update(Role.user(ownerUserId)),
    Permission.delete(Role.user(ownerUserId)),
    Permission.read(Role.user(clientUserId)),
    Permission.update(Role.user(clientUserId)),
  ]),
];

const buildMessagePermissions = (ownerUserId, clientUserId) => [
  ...new Set([
    Permission.read(Role.user(ownerUserId)),
    Permission.update(Role.user(ownerUserId)),
    Permission.delete(Role.user(ownerUserId)),
    Permission.read(Role.user(clientUserId)),
  ]),
];

const safeActivityLog = async ({ db, config, logger, data }) => {
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

const createHttpError = (status, code, message) => {
  const err = new Error(message);
  err.status = status;
  err.code = code;
  return err;
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

const findOpenLead = async ({ db, config, resourceId, userId }) => {
  try {
    const response = await db.listDocuments(
      config.databaseId,
      config.leadsCollectionId,
      [
        Query.equal("resourceId", resourceId),
        Query.equal("userId", userId),
        Query.equal("status", ["new", "contacted"]),
        Query.equal("enabled", true),
        Query.orderDesc("$createdAt"),
        Query.limit(1),
      ],
    );
    return response.documents?.[0] || null;
  } catch {
    return null;
  }
};

const findConversation = async ({
  db,
  config,
  resourceId,
  clientUserId,
  ownerUserId,
}) => {
  try {
    const response = await db.listDocuments(
      config.databaseId,
      config.conversationsCollectionId,
      [
        Query.equal("resourceId", resourceId),
        Query.equal("clientUserId", clientUserId),
        Query.equal("ownerUserId", ownerUserId),
        Query.equal("enabled", true),
        Query.limit(1),
      ],
    );
    return response.documents?.[0] || null;
  } catch {
    return null;
  }
};

const createConversation = async ({
  db,
  config,
  resource,
  ownerUserId,
  clientUser,
  clientUserId,
}) => {
  return db.createDocument(
    config.databaseId,
    config.conversationsCollectionId,
    ID.unique(),
    {
      resourceId: resource.$id,
      resourceTitle: normalizeText(resource.title, 200),
      clientUserId,
      clientName: buildClientDisplayName(clientUser, null),
      ownerUserId,
      ownerName: normalizeText(resource.ownerName || "Propietario", 120),
      lastMessage: "",
      lastMessageAt: new Date().toISOString(),
      clientUnread: 0,
      ownerUnread: 0,
      status: "active",
      enabled: true,
    },
    buildConversationPermissions(ownerUserId, clientUserId),
  );
};

const reopenConversationIfNeeded = async ({ db, config, conversation }) => {
  const normalizedStatus = normalizeText(conversation?.status, 20).toLowerCase();
  if (!normalizedStatus || normalizedStatus === "active") return conversation;

  return db.updateDocument(
    config.databaseId,
    config.conversationsCollectionId,
    conversation.$id,
    { status: "active" },
  );
};

const createMessage = async ({
  db,
  config,
  conversationId,
  message,
  clientUser,
  clientUserId,
  ownerUserId,
  intent,
  contactChannel,
}) => {
  const senderName = buildClientDisplayName(clientUser, null);

  const msg = await db.createDocument(
    config.databaseId,
    config.messagesCollectionId,
    ID.unique(),
    {
      conversationId,
      senderUserId: clientUserId,
      senderName,
      senderRole: "client",
      body: message,
      kind: "text",
      payloadJson: safeJson({ intent, contactChannel }, 2000),
      readBySender: true,
      readByRecipient: false,
      enabled: true,
    },
    buildMessagePermissions(ownerUserId, clientUserId),
  );

  const conversation = await db.getDocument(
    config.databaseId,
    config.conversationsCollectionId,
    conversationId,
  );

  await db.updateDocument(
    config.databaseId,
    config.conversationsCollectionId,
    conversationId,
    {
      status: "active",
      lastMessage:
        message.length > 120 ? `${message.slice(0, 120)}...` : message,
      lastMessageAt: new Date().toISOString(),
      ownerUnread: Number(conversation.ownerUnread || 0) + 1,
    },
  );

  return msg;
};

const buildCanonicalMeta = ({
  resource,
  rawMeta,
  clientProfile,
  authUser,
  requestedIntent,
}) => {
  const resourceSnapshot = buildResourceSnapshot(resource);
  const bookingPayload = normalizeBookingPayload(rawMeta);
  const visitPayload = normalizeVisitPayload(rawMeta);
  const contactPrefs = normalizeContactPrefs(rawMeta, clientProfile, authUser);

  const intent = deriveIntent({
    requestedIntent,
    resourceSnapshot,
    bookingPayload,
    visitPayload,
  });

  validateCanonicalMeta({ intent, bookingPayload, visitPayload });

  const canonicalMeta = {
    resourceSnapshot,
    booking: bookingPayload,
    visit: visitPayload,
    contactPrefs,
  };

  const serializedMeta = JSON.stringify(canonicalMeta);
  if (serializedMeta.length > META_JSON_MAX_LENGTH) {
    throw createHttpError(
      422,
      "META_TOO_LARGE",
      `metaJson exceeds ${META_JSON_MAX_LENGTH} characters`,
    );
  }

  return {
    intent,
    canonicalMeta,
    serializedMeta,
  };
};

const assertClientActor = ({ profile, authUser }) => {
  const role = normalizeText(profile?.role, 40).toLowerCase();
  if (profile?.enabled === false) {
    throw createHttpError(403, "FORBIDDEN", "User profile is disabled");
  }

  if (role !== "client") {
    throw createHttpError(403, "FORBIDDEN", "Only client users can create leads");
  }

  if (INTERNAL_ROLES.has(role)) {
    throw createHttpError(403, "FORBIDDEN", "Internal users cannot create leads");
  }

  if (!authUser?.emailVerification) {
    throw createHttpError(
      403,
      "EMAIL_NOT_VERIFIED",
      "Email must be verified to create a lead",
    );
  }
};

export default async ({ req, res, log, error }) => {
  if (req.method && req.method.toUpperCase() !== "POST") {
    return res.json(
      {
        ok: false,
        success: false,
        code: "METHOD_NOT_ALLOWED",
        message: "Use POST",
      },
      405,
    );
  }

  const config = cfg();
  if (!config.endpoint || !config.projectId || !config.apiKey) {
    return res.json(
      {
        ok: false,
        success: false,
        code: "ENV_MISSING",
        message: "Missing Appwrite credentials",
      },
      500,
    );
  }

  const authenticatedUserId = getAuthenticatedUserId(req);
  if (!authenticatedUserId) {
    return res.json(
      {
        ok: false,
        success: false,
        code: "AUTH_REQUIRED",
        message: "You must be authenticated to create a lead",
      },
      401,
    );
  }

  const body = parseBody(req);
  const resourceId = normalizeText(body.resourceId || body.propertyId, 64);
  const message = normalizeText(body.message, 2000);
  const requestedIntent = normalizeIntent(body.intent);
  const contactChannel = normalizeContactChannel(body.contactChannel || body.source);
  const rawMeta = parseMetaPayload(body);

  if (!resourceId || !message) {
    return res.json(
      {
        ok: false,
        success: false,
        code: "VALIDATION_ERROR",
        message: "resourceId and message are required",
      },
      400,
    );
  }

  const client = new Client()
    .setEndpoint(config.endpoint)
    .setProject(config.projectId)
    .setKey(config.apiKey);

  const db = new Databases(client);
  const users = new Users(client);
  const modulesService = createModulesService({ db, config });

  try {
    await modulesService.assertModuleEnabled("module.resources");
    await modulesService.assertModuleEnabled("module.leads");
    await modulesService.assertModuleEnabled("module.messaging.realtime");

    const settings = await modulesService.getSettings();
    if (normalizeText(settings?.uiMode, 20).toLowerCase() === "marketing") {
      return res.json(
        {
          ok: false,
          success: false,
          code: "PLATFORM_MODE_REQUIRED",
          message: "Leads are disabled while uiMode is marketing",
        },
        403,
      );
    }

    const [resource, authUser, clientProfile] = await Promise.all([
      db.getDocument(
        config.databaseId,
        config.resourcesCollectionId,
        resourceId,
      ),
      users.get(authenticatedUserId),
      db.getDocument(config.databaseId, config.usersCollectionId, authenticatedUserId),
    ]);

    assertClientActor({ profile: clientProfile, authUser });

    if (resource.status !== "published" || resource.enabled !== true) {
      return res.json(
        {
          ok: false,
          success: false,
          code: "RESOURCE_NOT_AVAILABLE",
          message: "Resource not available",
        },
        404,
      );
    }

    const resourceOwnerUserId = normalizeText(resource.ownerUserId, 64);
    if (!resourceOwnerUserId) {
      return res.json(
        {
          ok: false,
          success: false,
          code: "RESOURCE_OWNER_MISSING",
          message: "Resource owner not configured",
        },
        422,
      );
    }

    if (resourceOwnerUserId === authenticatedUserId) {
      return res.json(
        {
          ok: false,
          success: false,
          code: "SELF_CONTACT_NOT_ALLOWED",
          message: "You cannot create a lead for your own resource",
        },
        409,
      );
    }

    const { intent, serializedMeta } = buildCanonicalMeta({
      resource,
      rawMeta,
      clientProfile,
      authUser,
      requestedIntent,
    });

    let conversation = await findConversation({
      db,
      config,
      resourceId,
      clientUserId: authenticatedUserId,
      ownerUserId: resourceOwnerUserId,
    });

    if (!conversation) {
      conversation = await createConversation({
        db,
        config,
        resource,
        ownerUserId: resourceOwnerUserId,
        clientUser: clientProfile,
        clientUserId: authenticatedUserId,
      });
    } else {
      conversation = await reopenConversationIfNeeded({
        db,
        config,
        conversation,
      });
    }

    const openLead = await findOpenLead({
      db,
      config,
      resourceId,
      userId: authenticatedUserId,
    });

    const leadPayload = {
      resourceId,
      resourceOwnerUserId,
      userId: authenticatedUserId,
      lastMessage: message,
      conversationId: conversation.$id,
      contactChannel,
      source: contactChannel,
      intent,
      status: openLead ? openLead.status : "new",
      isArchived: false,
      metaJson: serializedMeta,
      enabled: true,
    };

    const lead = openLead
      ? await db.updateDocument(
          config.databaseId,
          config.leadsCollectionId,
          openLead.$id,
          leadPayload,
        )
      : await db.createDocument(
          config.databaseId,
          config.leadsCollectionId,
          ID.unique(),
          leadPayload,
          buildLeadPermissions(resourceOwnerUserId, authenticatedUserId),
        );

    await createMessage({
      db,
      config,
      conversationId: conversation.$id,
      message,
      clientUser: clientProfile,
      clientUserId: authenticatedUserId,
      ownerUserId: resourceOwnerUserId,
      intent,
      contactChannel,
    });

    await db
      .updateDocument(
        config.databaseId,
        config.resourcesCollectionId,
        resourceId,
        {
          contactCount: Number(resource.contactCount || 0) + 1,
        },
      )
      .catch(() => {});

    await safeActivityLog({
      db,
      config,
      logger: log,
      data: {
        actorUserId: authenticatedUserId,
        actorRole: "client",
        action: openLead ? "lead.update" : "lead.create",
        entityType: "leads",
        entityId: lead.$id,
        afterData: safeJson(
          {
            resourceId,
            resourceOwnerUserId,
            userId: authenticatedUserId,
            leadId: lead.$id,
            conversationId: conversation.$id,
            intent,
            contactChannel,
          },
          20000,
        ),
        requestId: getRequestId(req),
        severity: "info",
      },
    });

    return res.json(
      {
        ok: true,
        success: true,
        leadId: lead.$id,
        conversationId: conversation.$id,
        intent,
        contactChannel,
      },
      openLead ? 200 : 201,
    );
  } catch (err) {
    if (err?.code === "MODULE_DISABLED" || err?.code === "LIMIT_EXCEEDED") {
      const moduleError = toModuleErrorResponse(err);
      return res.json(moduleError.body, moduleError.status);
    }

    const statusCode = Number(err?.status || 500);
    if (statusCode >= 400 && statusCode < 500) {
      return res.json(
        {
          ok: false,
          success: false,
          code: String(err?.code || "VALIDATION_ERROR"),
          message: String(err?.message || "Invalid request"),
        },
        statusCode,
      );
    }

    error(err.message);
    return res.json(
      {
        ok: false,
        success: false,
        code: "INTERNAL_ERROR",
        message: err.message,
      },
      500,
    );
  }
};