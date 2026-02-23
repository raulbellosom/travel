import { Client, Databases, ID, Permission, Query, Role, Users } from "node-appwrite";
import {
  createModulesService,
  toModuleErrorResponse,
} from "./lib/modulesService.js";

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
  leadsCollectionId: getEnv("APPWRITE_COLLECTION_LEADS_ID") || "leads",
  conversationsCollectionId:
    getEnv("APPWRITE_COLLECTION_CONVERSATIONS_ID") || "conversations",
  messagesCollectionId: getEnv("APPWRITE_COLLECTION_MESSAGES_ID") || "messages",
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

const normalizeText = (value, maxLength = 0) => {
  const normalized = String(value ?? "").trim().replace(/\s+/g, " ");
  if (!maxLength) return normalized;
  return normalized.slice(0, maxLength);
};

const safeJson = (value, maxLength = 3000) => {
  try {
    return JSON.stringify(value).slice(0, maxLength);
  } catch {
    return "{}";
  }
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

const buildLeadPermissions = (ownerUserId, clientUserId) =>
  [...new Set([
    Permission.read(Role.user(ownerUserId)),
    Permission.update(Role.user(ownerUserId)),
    Permission.delete(Role.user(ownerUserId)),
    Permission.read(Role.user(clientUserId)),
  ])];

const buildConversationPermissions = (ownerUserId, clientUserId) =>
  [...new Set([
    Permission.read(Role.user(ownerUserId)),
    Permission.update(Role.user(ownerUserId)),
    Permission.delete(Role.user(ownerUserId)),
    Permission.read(Role.user(clientUserId)),
    Permission.update(Role.user(clientUserId)),
  ])];

const buildMessagePermissions = (ownerUserId, clientUserId) =>
  [...new Set([
    Permission.read(Role.user(ownerUserId)),
    Permission.update(Role.user(ownerUserId)),
    Permission.delete(Role.user(ownerUserId)),
    Permission.read(Role.user(clientUserId)),
  ])];

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

const findOpenLead = async ({ db, config, resourceId, userId }) => {
  try {
    const response = await db.listDocuments(config.databaseId, config.leadsCollectionId, [
      Query.equal("resourceId", resourceId),
      Query.equal("userId", userId),
      Query.equal("status", ["new", "contacted"]),
      Query.equal("enabled", true),
      Query.orderDesc("$createdAt"),
      Query.limit(1),
    ]);
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
      clientName:
        normalizeText(clientUser?.name, 120) ||
        normalizeText(clientUser?.email, 120) ||
        "Cliente",
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

const createMessage = async ({
  db,
  config,
  conversationId,
  message,
  clientUser,
  clientUserId,
  ownerUserId,
}) => {
  const senderName =
    normalizeText(clientUser?.name, 120) ||
    normalizeText(clientUser?.email, 120) ||
    "Cliente";

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
      readBySender: true,
      readByRecipient: false,
      type: "text",
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
      lastMessage: message.length > 120 ? `${message.slice(0, 120)}...` : message,
      lastMessageAt: new Date().toISOString(),
      ownerUnread: Number(conversation.ownerUnread || 0) + 1,
    },
  );

  return msg;
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
    return res.json({ ok: false, error: "Missing Appwrite credentials" }, 500);
  }

  const authenticatedUserId = normalizeText(getAuthenticatedUserId(req), 64);
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
  const meta = body.meta && typeof body.meta === "object" ? body.meta : null;

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

    const [resource, clientUser] = await Promise.all([
      db.getDocument(config.databaseId, config.resourcesCollectionId, resourceId),
      users.get(authenticatedUserId),
    ]);

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
        clientUser,
        clientUserId: authenticatedUserId,
      });
    } else if (normalizeText(conversation.status).toLowerCase() !== "active") {
      conversation = await db.updateDocument(
        config.databaseId,
        config.conversationsCollectionId,
        conversation.$id,
        { status: "active" },
      );
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
      source: "authenticated_chat",
      status: openLead ? openLead.status : "new",
      enabled: true,
    };

    if (meta) {
      leadPayload.metaJson = safeJson(meta, 10000);
    }

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
      clientUser,
      clientUserId: authenticatedUserId,
      ownerUserId: resourceOwnerUserId,
    });

    await db
      .updateDocument(config.databaseId, config.resourcesCollectionId, resourceId, {
        contactCount: Number(resource.contactCount || 0) + 1,
      })
      .catch(() => {});

    await safeActivityLog({
      db,
      config,
      logger: log,
      data: {
        actorUserId: authenticatedUserId,
        actorRole: "client",
        action: "lead.create_authenticated",
        entityType: "leads",
        entityId: lead.$id,
        afterData: safeJson({
          resourceId,
          resourceOwnerUserId,
          userId: authenticatedUserId,
          leadId: lead.$id,
          conversationId: conversation.$id,
        }, 20000),
        requestId: String(getRequestId(req)).slice(0, 100),
        severity: "info",
      },
    });

    return res.json(
      {
        ok: true,
        success: true,
        leadId: lead.$id,
        conversationId: conversation.$id,
      },
      openLead ? 200 : 201,
    );
  } catch (err) {
    if (err?.code === "MODULE_DISABLED" || err?.code === "LIMIT_EXCEEDED") {
      const moduleError = toModuleErrorResponse(err);
      return res.json(moduleError.body, moduleError.status);
    }

    error(err.message);
    return res.json({ ok: false, error: err.message }, 500);
  }
};
