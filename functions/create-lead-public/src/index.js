import { Client, Databases, ID, Permission, Role } from "node-appwrite";
import {
  createModulesService,
  toModuleErrorResponse,
} from "./lib/modulesService.js";

const parseBody = (req) => {
  try {
    const raw = req.body ?? req.payload ?? "{}";
    return typeof raw === "string" ? JSON.parse(raw) : raw;
  } catch {
    return {};
  }
};

const cfg = () => ({
  endpoint:
    process.env.APPWRITE_FUNCTION_ENDPOINT || process.env.APPWRITE_ENDPOINT,
  projectId:
    process.env.APPWRITE_FUNCTION_PROJECT_ID || process.env.APPWRITE_PROJECT_ID,
  apiKey: process.env.APPWRITE_FUNCTION_API_KEY || process.env.APPWRITE_API_KEY,
  databaseId: process.env.APPWRITE_DATABASE_ID || "main",
  resourcesCollectionId:
    process.env.APPWRITE_COLLECTION_RESOURCES_ID || "resources",
  leadsCollectionId: process.env.APPWRITE_COLLECTION_LEADS_ID || "leads",
  activityLogsCollectionId:
    process.env.APPWRITE_COLLECTION_ACTIVITY_LOGS_ID || "",
  instanceSettingsCollectionId:
    process.env.APPWRITE_COLLECTION_INSTANCE_SETTINGS_ID || "instance_settings",
});

const isValidEmail = (email) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || ""));

const normalizeText = (value, maxLength = 0) => {
  const normalized = String(value ?? "").trim().replace(/\s+/g, " ");
  if (!maxLength) return normalized;
  return normalized.slice(0, maxLength);
};

const createLeadDocument = async ({ db, config, payload, ownerUserId }) =>
  db.createDocument(config.databaseId, config.leadsCollectionId, ID.unique(), payload, [
    Permission.read(Role.user(ownerUserId)),
    Permission.update(Role.user(ownerUserId)),
    Permission.delete(Role.user(ownerUserId)),
  ]);

export default async ({ req, res, error }) => {
  const config = cfg();
  if (!config.endpoint || !config.projectId || !config.apiKey) {
    return res.json({ ok: false, error: "Missing Appwrite credentials" }, 500);
  }

  const body = parseBody(req);
  const resourceId = normalizeText(body.resourceId, 64);
  const name = normalizeText(body.name, 120);
  const email = normalizeText(body.email, 254).toLowerCase();
  const phone = normalizeText(body.phone, 20);
  const message = normalizeText(body.message, 2000);

  if (!resourceId || !name || !email || !message) {
    return res.json({ ok: false, error: "Missing required fields" }, 400);
  }

  if (!isValidEmail(email)) {
    return res.json({ ok: false, error: "Invalid email format" }, 400);
  }

  const client = new Client()
    .setEndpoint(config.endpoint)
    .setProject(config.projectId)
    .setKey(config.apiKey);
  const db = new Databases(client);
  const modulesService = createModulesService({ db, config });

  try {
    await modulesService.assertModuleEnabled("module.resources");
    await modulesService.assertModuleEnabled("module.leads");

    const resource = await db.getDocument(
      config.databaseId,
      config.resourcesCollectionId,
      resourceId,
    );

    if (resource.status !== "published" || resource.enabled !== true) {
      return res.json({ ok: false, error: "Resource not available" }, 404);
    }

    const resourceOwnerId = normalizeText(resource.ownerUserId, 64);
    if (!resourceOwnerId) {
      return res.json({ ok: false, error: "Resource owner not configured" }, 422);
    }

    const leadData = {
      resourceId,
      resourceOwnerUserId: resourceOwnerId,
      name,
      email,
      message,
      status: "new",
      enabled: true,
    };

    if (phone) {
      leadData.phone = phone;
    }

    const lead = await createLeadDocument({
      db,
      config,
      payload: leadData,
      ownerUserId: resourceOwnerId,
    });

    await db.updateDocument(
      config.databaseId,
      config.resourcesCollectionId,
      resourceId,
      {
        contactCount: Number(resource.contactCount || 0) + 1,
      },
    );

    if (config.activityLogsCollectionId) {
      await db
        .createDocument(
          config.databaseId,
          config.activityLogsCollectionId,
          ID.unique(),
          {
            actorUserId: resourceOwnerId,
            actorRole: "owner",
            action: "lead.create_public",
            entityType: "leads",
            entityId: lead.$id,
            afterData: JSON.stringify({
              resourceId,
              resourceOwnerUserId: resourceOwnerId,
              email,
              status: "new",
            }).slice(0, 20000),
            severity: "info",
          },
        )
        .catch(() => {});
    }

    return res.json({ ok: true, leadId: lead.$id, resourceId }, 200);
  } catch (err) {
    if (err?.code === "MODULE_DISABLED" || err?.code === "LIMIT_EXCEEDED") {
      const moduleError = toModuleErrorResponse(err);
      return res.json(moduleError.body, moduleError.status);
    }

    error(err.message);
    return res.json({ ok: false, error: err.message }, 500);
  }
};
