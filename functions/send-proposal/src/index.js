import { Client, Databases, ID, Permission, Query, Role } from "node-appwrite";
import {
  createModulesService,
  toModuleErrorResponse,
} from "./lib/modulesService.js";

const INTERNAL_ROLES = new Set([
  "root",
  "owner",
  "staff_manager",
  "staff_editor",
  "staff_support",
]);
const STAFF_ROLES = new Set(["staff_manager", "staff_editor", "staff_support"]);
const SUPPORTED_PROPOSAL_TYPES = new Set(["visit", "booking_manual"]);

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

const parseDateTime = (value) => {
  if (!hasValue(value)) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
};

const toIso = (value) => {
  const parsed = parseDateTime(value);
  return parsed ? parsed.toISOString() : "";
};

const parseScopes = (rawScopes) => {
  if (!rawScopes) return [];
  if (Array.isArray(rawScopes)) {
    return rawScopes
      .map((scope) => normalizeText(scope, 80).toLowerCase())
      .filter(Boolean);
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

  if (targetScope === "messaging.write") {
    return scopes.has("chat.write") || scopes.has("conversations.write");
  }

  return false;
};

const createHttpError = (status, code, message) => {
  const err = new Error(message);
  err.status = status;
  err.code = code;
  return err;
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

const safeJson = (value, maxLength = 20000) => {
  try {
    return JSON.stringify(value).slice(0, maxLength);
  } catch {
    return "{}";
  }
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

const resolveSenderRole = (role) => {
  const normalized = normalizeText(role, 40).toLowerCase();
  if (normalized === "root") return "root";
  if (normalized === "owner") return "owner";
  if (STAFF_ROLES.has(normalized)) return "staff";
  return "owner";
};

const buildSenderName = (profile) => {
  const fullName = normalizeText(
    [profile?.firstName, profile?.lastName].filter(Boolean).join(" "),
    120,
  );

  return (
    normalizeNullableText(profile?.name, 120) ||
    fullName ||
    normalizeNullableText(profile?.email, 120) ||
    "Operador"
  );
};

const buildMessagePermissions = ({ ownerUserId, clientUserId, actorUserId }) => [
  ...new Set([
    Permission.read(Role.user(ownerUserId)),
    Permission.update(Role.user(ownerUserId)),
    Permission.delete(Role.user(ownerUserId)),
    Permission.read(Role.user(clientUserId)),
    Permission.update(Role.user(clientUserId)),
    Permission.read(Role.user(actorUserId)),
    Permission.update(Role.user(actorUserId)),
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

const findLeadByConversation = async ({ db, config, conversationId, leadId }) => {
  if (leadId) {
    const lead = await db.getDocument(config.databaseId, config.leadsCollectionId, leadId);
    return lead;
  }

  const response = await db.listDocuments(config.databaseId, config.leadsCollectionId, [
    Query.equal("conversationId", conversationId),
    Query.equal("enabled", true),
    Query.orderDesc("$createdAt"),
    Query.limit(1),
  ]);

  return response.documents?.[0] || null;
};

const buildProposalPayload = (payload, senderRole) => {
  const proposalType = normalizeText(payload.proposalType, 30).toLowerCase();
  if (!SUPPORTED_PROPOSAL_TYPES.has(proposalType)) {
    throw createHttpError(422, "VALIDATION_ERROR", "proposalType is invalid");
  }

  const timeStart = toIso(payload.timeStart);
  const timeEnd = toIso(payload.timeEnd);
  if (!timeStart || !timeEnd) {
    throw createHttpError(422, "VALIDATION_ERROR", "timeStart and timeEnd are required");
  }

  const start = new Date(timeStart).getTime();
  const end = new Date(timeEnd).getTime();
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) {
    throw createHttpError(422, "VALIDATION_ERROR", "timeEnd must be greater than timeStart");
  }

  const meetingType = normalizeText(payload.meetingType, 20).toLowerCase();
  if (proposalType === "visit" && !["on_site", "video_call"].includes(meetingType)) {
    throw createHttpError(
      422,
      "VALIDATION_ERROR",
      "meetingType is required for visit proposals",
    );
  }

  const expiresAt = toIso(payload.expiresAt);
  if (payload.expiresAt && !expiresAt) {
    throw createHttpError(422, "VALIDATION_ERROR", "expiresAt must be a valid ISO date");
  }

  return stripUndefined({
    proposalType,
    timeStart,
    timeEnd,
    timezone: normalizeNullableText(payload.timezone, 50) || "UTC",
    meetingType: ["on_site", "video_call"].includes(meetingType)
      ? meetingType
      : undefined,
    location: normalizeNullableText(payload.location, 240),
    fromResourceAddress:
      payload.fromResourceAddress === undefined
        ? undefined
        : Boolean(payload.fromResourceAddress),
    status: "pending",
    expiresAt,
    createdByRole: senderRole,
  });
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

  const actorUserId = getAuthenticatedUserId(req);
  if (!actorUserId) {
    return res.json(
      {
        ok: false,
        success: false,
        code: "AUTH_REQUIRED",
        message: "You must be authenticated",
      },
      401,
    );
  }

  const payload = parseBody(req);
  const conversationId = normalizeText(payload.conversationId, 64);
  const leadId = normalizeText(payload.leadId || payload.relatedLeadId, 64);

  if (!conversationId) {
    return res.json(
      {
        ok: false,
        success: false,
        code: "VALIDATION_ERROR",
        message: "conversationId is required",
      },
      422,
    );
  }

  const client = new Client()
    .setEndpoint(config.endpoint)
    .setProject(config.projectId)
    .setKey(config.apiKey);
  const db = new Databases(client);
  const modulesService = createModulesService({ db, config });

  try {
    await modulesService.assertModuleEnabled("module.messaging.realtime");
    const settings = await modulesService.getSettings();
    if (normalizeText(settings?.uiMode, 20).toLowerCase() === "marketing") {
      throw createHttpError(
        403,
        "PLATFORM_MODE_REQUIRED",
        "Messaging actions are disabled while uiMode is marketing",
      );
    }

    const actorProfile = await db.getDocument(
      config.databaseId,
      config.usersCollectionId,
      actorUserId,
    );

    const actorRole = normalizeText(actorProfile.role, 40).toLowerCase();
    if (actorProfile.enabled === false || !INTERNAL_ROLES.has(actorRole)) {
      throw createHttpError(403, "FORBIDDEN", "Only internal users can send proposals");
    }

    if (!hasScope(actorProfile, "messaging.write")) {
      throw createHttpError(403, "FORBIDDEN", "Missing messaging.write scope");
    }

    const conversation = await db.getDocument(
      config.databaseId,
      config.conversationsCollectionId,
      conversationId,
    );

    if (conversation.enabled === false) {
      throw createHttpError(404, "CONVERSATION_NOT_AVAILABLE", "Conversation not available");
    }

    const senderRole = resolveSenderRole(actorRole);
    const proposalPayload = buildProposalPayload(payload, senderRole);

    const lead = await findLeadByConversation({
      db,
      config,
      conversationId,
      leadId,
    });

    if (lead?.conversationId && lead.conversationId !== conversationId) {
      throw createHttpError(422, "VALIDATION_ERROR", "leadId does not belong to conversationId");
    }

    const summaryText =
      normalizeNullableText(payload.body, 4000) ||
      (proposalPayload.proposalType === "visit"
        ? "Nueva propuesta de visita"
        : "Nueva propuesta de disponibilidad");

    const message = await db.createDocument(
      config.databaseId,
      config.messagesCollectionId,
      ID.unique(),
      {
        conversationId,
        senderUserId: actorUserId,
        senderName: buildSenderName(actorProfile),
        senderRole,
        body: summaryText,
        kind: "proposal",
        payloadJson: JSON.stringify(proposalPayload),
        relatedLeadId: lead?.$id || undefined,
        readBySender: true,
        readByRecipient: false,
        enabled: true,
      },
      buildMessagePermissions({
        ownerUserId: normalizeText(conversation.ownerUserId, 64),
        clientUserId: normalizeText(conversation.clientUserId, 64),
        actorUserId,
      }),
    );

    const isSenderClient = normalizeText(conversation.clientUserId, 64) === actorUserId;
    const patch = {
      status: "active",
      lastMessage:
        summaryText.length > 120 ? `${summaryText.slice(0, 120)}...` : summaryText,
      lastMessageAt: new Date().toISOString(),
      ownerUnread: Number(conversation.ownerUnread || 0),
      clientUnread: Number(conversation.clientUnread || 0),
    };

    if (isSenderClient) {
      patch.ownerUnread += 1;
    } else {
      patch.clientUnread += 1;
    }

    await db.updateDocument(
      config.databaseId,
      config.conversationsCollectionId,
      conversationId,
      patch,
    );

    await safeActivityLog({
      db,
      config,
      logger: log,
      data: {
        actorUserId,
        actorRole: senderRole,
        action: "proposal.send",
        entityType: "messages",
        entityId: message.$id,
        afterData: safeJson({
          conversationId,
          leadId: lead?.$id || "",
          proposalType: proposalPayload.proposalType,
          timeStart: proposalPayload.timeStart,
          timeEnd: proposalPayload.timeEnd,
          timezone: proposalPayload.timezone,
        }),
        requestId: getRequestId(req),
        severity: "info",
      },
    });

    return res.json(
      {
        ok: true,
        success: true,
        messageId: message.$id,
        conversationId,
        leadId: lead?.$id || null,
      },
      201,
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

    error(`send-proposal failed: ${err.message}`);
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
