import { Client, Databases, ID, Permission, Role } from "node-appwrite";

const parseBody = (req) => {
  try {
    const raw = req.body ?? req.payload ?? "{}";
    return typeof raw === "string" ? JSON.parse(raw) : raw;
  } catch {
    return {};
  }
};

const cfg = () => ({
  endpoint: process.env.APPWRITE_FUNCTION_ENDPOINT || process.env.APPWRITE_ENDPOINT,
  projectId:
    process.env.APPWRITE_FUNCTION_PROJECT_ID || process.env.APPWRITE_PROJECT_ID,
  apiKey: process.env.APPWRITE_FUNCTION_API_KEY || process.env.APPWRITE_API_KEY,
  databaseId: process.env.APPWRITE_DATABASE_ID || "main",
  propertiesCollectionId: process.env.APPWRITE_COLLECTION_PROPERTIES_ID || "properties",
  leadsCollectionId: process.env.APPWRITE_COLLECTION_LEADS_ID || "leads",
  activityLogsCollectionId: process.env.APPWRITE_COLLECTION_ACTIVITY_LOGS_ID || "",
});

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || ""));

export default async ({ req, res, error }) => {
  const config = cfg();
  if (!config.endpoint || !config.projectId || !config.apiKey) {
    return res.json({ ok: false, error: "Missing Appwrite credentials" }, 500);
  }

  const body = parseBody(req);
  const propertyId = String(body.propertyId || "").trim();
  const name = String(body.name || "").trim();
  const email = String(body.email || "").trim().toLowerCase();
  const phone = String(body.phone || "").trim();
  const message = String(body.message || "").trim();

  if (!propertyId || !name || !email || !message) {
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

  try {
    const property = await db.getDocument(
      config.databaseId,
      config.propertiesCollectionId,
      propertyId
    );

    if (property.status !== "published" || property.enabled !== true) {
      return res.json({ ok: false, error: "Property not available" }, 404);
    }

    const propertyOwnerId = property.ownerUserId;
    if (!propertyOwnerId) {
      return res.json({ ok: false, error: "Property owner not configured" }, 422);
    }

    const leadData = {
      propertyId,
      propertyOwnerId,
      name,
      email,
      message,
      status: "new",
      enabled: true,
    };
    if (phone) {
      leadData.phone = phone;
    }

    const lead = await db.createDocument(
      config.databaseId,
      config.leadsCollectionId,
      ID.unique(),
      leadData,
      [
        Permission.read(Role.user(propertyOwnerId)),
        Permission.update(Role.user(propertyOwnerId)),
        Permission.delete(Role.user(propertyOwnerId)),
      ]
    );

    await db.updateDocument(
      config.databaseId,
      config.propertiesCollectionId,
      propertyId,
      {
        contactCount: Number(property.contactCount || 0) + 1,
      }
    );

    if (config.activityLogsCollectionId) {
      await db.createDocument(
        config.databaseId,
        config.activityLogsCollectionId,
        ID.unique(),
        {
          actorUserId: propertyOwnerId,
          actorRole: "owner",
          action: "lead.create_public",
          entityType: "leads",
          entityId: lead.$id,
          afterData: JSON.stringify({
            propertyId,
            propertyOwnerId,
            email,
            status: "new",
          }).slice(0, 20000),
          severity: "info",
        }
      ).catch(() => {});
    }

    return res.json({ ok: true, leadId: lead.$id }, 200);
  } catch (err) {
    error(err.message);
    return res.json({ ok: false, error: err.message }, 500);
  }
};
