import { Client, Databases } from "node-appwrite";

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

const asObjectOrEmpty = (value) => (value && typeof value === "object" ? value : {});

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

  const body = asObjectOrEmpty(parseBody(req));
  const resourceId = String(body.resourceId || "").trim();
  if (!resourceId) {
    return json(res, 400, {
      ok: false,
      success: false,
      code: "VALIDATION_ERROR",
      message: "resourceId is required",
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

    const currentViews = Number(resource.views || 0);
    const nextViews = Number.isFinite(currentViews) && currentViews >= 0 ? currentViews + 1 : 1;

    await db.updateDocument(
      config.databaseId,
      config.resourcesCollectionId,
      resourceId,
      { views: nextViews },
    );

    return json(res, 200, {
      ok: true,
      success: true,
      code: "RESOURCE_VIEW_COUNTED",
      message: "Resource view incremented",
      data: {
        resourceId,
        views: nextViews,
      },
    });
  } catch (err) {
    error(`property-view-counter failed: ${err.message}`);
    return json(res, 500, {
      ok: false,
      success: false,
      code: "INTERNAL_ERROR",
      message: err.message,
    });
  }
};
