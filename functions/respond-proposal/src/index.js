import { Client, Databases, ID, Permission, Query, Role } from "node-appwrite";
import {
  createModulesService,
  toModuleErrorResponse,
} from "./lib/modulesService.js";

const RESPONSE_MAP = Object.freeze({
  accept: "accepted",
  reject: "rejected",
  request_change: "reschedule_requested",
});
const SUPPORTED_RESPONSES = new Set(Object.keys(RESPONSE_MAP));

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

const createHttpError = (status, code, message) => {
  const err = new Error(message);
  err.status = status;
  err.code = code;
  return err;
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

const normalizeSuggestedSlots = (slots = []) => {
  if (!Array.isArray(slots)) return [];

  return slots
    .map((slot) => {
      if (!slot || typeof slot !== "object") return null;
      const startDateTime = toIso(slot.startDateTime || slot.start);
      const endDateTime = toIso(slot.endDateTime || slot.end);
      const timezone =
        normalizeNullableText(slot.timezone, 50) ||
        normalizeNullableText(slot.tz, 50) ||
        "UTC";

      if (!startDateTime || !endDateTime) return null;
      const start = new Date(startDateTime).getTime();
      const end = new Date(endDateTime).getTime();
      if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) {
        return null;
      }

      return {
        startDateTime,
        endDateTime,
        timezone,
      };
    })
    .filter(Boolean);
};

const findLeadByConversation = async ({ db, config, conversationId }) => {
  const response = await db.listDocuments(config.databaseId, config.leadsCollectionId, [
    Query.equal("conversationId", conversationId),
    Query.equal("enabled", true),
    Query.orderDesc("$createdAt"),
    Query.limit(1),
  ]);

  return response.documents?.[0] || null;
};

const buildClientName = (profile) => {
  const fullName = normalizeText(
    [profile?.firstName, profile?.lastName].filter(Boolean).join(" "),
    120,
  );

  return (
    normalizeNullableText(profile?.name, 120) ||
    fullName ||
    normalizeNullableText(profile?.email, 120) ||
    "Cliente"
  );
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
  const proposalMessageId = normalizeText(payload.proposalMessageId, 64);
  const responseValue = normalizeText(payload.response, 30).toLowerCase();
  const comment = normalizeNullableText(payload.comment, 1000);

  if (!conversationId || !proposalMessageId || !responseValue) {
    return res.json(
      {
        ok: false,
        success: false,
        code: "VALIDATION_ERROR",
        message: "conversationId, proposalMessageId and response are required",
      },
      422,
    );
  }

  if (!SUPPORTED_RESPONSES.has(responseValue)) {
    return res.json(
      {
        ok: false,
        success: false,
        code: "VALIDATION_ERROR",
        message: "response is invalid",
      },
      422,
    );
  }

  const suggestedSlots = normalizeSuggestedSlots(payload.suggestedSlots);

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
    if (actorProfile.enabled === false || actorRole !== "client") {
      throw createHttpError(403, "FORBIDDEN", "Only client users can respond to proposals");
    }

    const conversation = await db.getDocument(
      config.databaseId,
      config.conversationsCollectionId,
      conversationId,
    );

    if (conversation.enabled === false) {
      throw createHttpError(404, "CONVERSATION_NOT_AVAILABLE", "Conversation not available");
    }

    if (normalizeText(conversation.clientUserId, 64) !== actorUserId) {
      throw createHttpError(403, "FORBIDDEN", "You are not a participant in this conversation");
    }

    const conversationStatus = normalizeText(conversation.status, 20).toLowerCase();
    if (conversationStatus === "closed") {
      throw createHttpError(
        409,
        "CONVERSATION_CLOSED",
        "This conversation is closed. Create a new lead request from the resource page.",
      );
    }

    const proposalMessage = await db.getDocument(
      config.databaseId,
      config.messagesCollectionId,
      proposalMessageId,
    );

    if (
      normalizeText(proposalMessage.conversationId, 64) !== conversationId ||
      normalizeText(proposalMessage.kind, 30).toLowerCase() !== "proposal" ||
      proposalMessage.enabled === false
    ) {
      throw createHttpError(404, "PROPOSAL_NOT_FOUND", "Proposal message not found");
    }

    const proposalPayload = parseObject(proposalMessage.payloadJson);
    const proposalStatus = normalizeText(proposalPayload.status, 30).toLowerCase();
    if (proposalStatus && proposalStatus !== "pending") {
      throw createHttpError(409, "PROPOSAL_NOT_PENDING", "Proposal already resolved");
    }

    const responsePayload = stripUndefined({
      response: responseValue,
      comment,
      suggestedSlots: suggestedSlots.length > 0 ? suggestedSlots : undefined,
    });

    const summaryText =
      comment ||
      (responseValue === "accept"
        ? "Propuesta aceptada"
        : responseValue === "reject"
          ? "Propuesta rechazada"
          : "Solicitud de cambio de horario");

    const responseMessage = await db.createDocument(
      config.databaseId,
      config.messagesCollectionId,
      ID.unique(),
      {
        conversationId,
        senderUserId: actorUserId,
        senderName: buildClientName(actorProfile),
        senderRole: "client",
        body: summaryText,
        kind: "proposal_response",
        payloadJson: JSON.stringify(responsePayload),
        relatedLeadId: normalizeNullableText(payload.relatedLeadId, 64),
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

    const nextProposalPayload = {
      ...proposalPayload,
      status: RESPONSE_MAP[responseValue],
      respondedAt: new Date().toISOString(),
      responseMessageId: responseMessage.$id,
      response: responseValue,
    };

    await db.updateDocument(
      config.databaseId,
      config.messagesCollectionId,
      proposalMessageId,
      {
        payloadJson: JSON.stringify(nextProposalPayload),
      },
    );

    const patch = {
      status: "active",
      lastMessage:
        summaryText.length > 120 ? `${summaryText.slice(0, 120)}...` : summaryText,
      lastMessageAt: new Date().toISOString(),
      ownerUnread: Number(conversation.ownerUnread || 0) + 1,
      clientUnread: Number(conversation.clientUnread || 0),
    };

    await db.updateDocument(
      config.databaseId,
      config.conversationsCollectionId,
      conversationId,
      patch,
    );

    const lead = await findLeadByConversation({ db, config, conversationId }).catch(
      () => null,
    );

    if (lead?.$id) {
      const leadPatch = {
        isArchived: false,
      };

      if (responseValue === "accept") {
        const currentStatus = normalizeText(lead.status, 30).toLowerCase();
        if (currentStatus === "new") {
          leadPatch.status = "contacted";
        }
      }

      await db
        .updateDocument(config.databaseId, config.leadsCollectionId, lead.$id, leadPatch)
        .catch(() => {});
    }

    await safeActivityLog({
      db,
      config,
      logger: log,
      data: {
        actorUserId,
        actorRole: "client",
        action: "proposal.respond",
        entityType: "messages",
        entityId: responseMessage.$id,
        afterData: safeJson({
          conversationId,
          proposalMessageId,
          response: responseValue,
          leadId: lead?.$id || "",
        }),
        requestId: getRequestId(req),
        severity: "info",
      },
    });

    return res.json(
      {
        ok: true,
        success: true,
        messageId: responseMessage.$id,
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

    error(`respond-proposal failed: ${err.message}`);
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
