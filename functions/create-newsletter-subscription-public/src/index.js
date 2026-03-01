import { Client, Databases, ID, Query } from "node-appwrite";

const hasValue = (value) =>
  value !== undefined && value !== null && String(value).trim() !== "";

const getEnv = (...keys) => {
  for (const key of keys) {
    if (hasValue(process.env[key])) {
      return process.env[key];
    }
  }
  return "";
};

const cfg = () => ({
  endpoint: getEnv("APPWRITE_FUNCTION_ENDPOINT", "APPWRITE_ENDPOINT"),
  projectId: getEnv("APPWRITE_FUNCTION_PROJECT_ID", "APPWRITE_PROJECT_ID"),
  apiKey: getEnv("APPWRITE_FUNCTION_API_KEY", "APPWRITE_API_KEY"),
  databaseId: getEnv("APPWRITE_DATABASE_ID") || "main",
  subscribersCollectionId:
    getEnv("APPWRITE_COLLECTION_MARKETING_NEWSLETTER_SUBSCRIBERS_ID") ||
    "marketing_newsletter_subscribers",
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

const isValidEmail = (email) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || ""));

const parseUtmJson = (value) => {
  if (!value) return "{}";

  if (typeof value === "object" && !Array.isArray(value)) {
    return JSON.stringify(value).slice(0, 4000);
  }

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return JSON.stringify(parsed).slice(0, 4000);
      }
    } catch {
      return "{}";
    }
  }

  return "{}";
};

export default async ({ req, res, error }) => {
  const config = cfg();
  if (!config.endpoint || !config.projectId || !config.apiKey) {
    return res.json({ ok: false, error: "Missing Appwrite credentials" }, 500);
  }

  const body = parseBody(req);
  const email = normalizeText(body.email, 254).toLowerCase();
  const name = normalizeText(body.name, 120);
  const source = normalizeText(body.source, 80) || "landing_newsletter";
  const utmJson = parseUtmJson(body.utmJson || body.utm || body.meta);

  if (!email) {
    return res.json({ ok: false, error: "Missing email" }, 400);
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
    const existing = await db.listDocuments(
      config.databaseId,
      config.subscribersCollectionId,
      [Query.equal("email", email), Query.limit(1)],
    );

    if (existing.total > 0 && existing.documents?.[0]) {
      const current = existing.documents[0];
      const updated = await db.updateDocument(
        config.databaseId,
        config.subscribersCollectionId,
        current.$id,
        {
          name: name || current.name || undefined,
          source,
          utmJson,
          enabled: true,
        },
      );

      return res.json(
        {
          ok: true,
          alreadyExists: true,
          subscriberId: updated.$id,
        },
        200,
      );
    }

    const created = await db.createDocument(
      config.databaseId,
      config.subscribersCollectionId,
      ID.unique(),
      {
        email,
        name: name || undefined,
        source,
        utmJson,
        enabled: true,
      },
    );

    return res.json(
      {
        ok: true,
        alreadyExists: false,
        subscriberId: created.$id,
      },
      200,
    );
  } catch (err) {
    error(err.message);
    return res.json({ ok: false, error: err.message }, 500);
  }
};
