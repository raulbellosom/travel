import { Client, Databases, Query } from "node-appwrite";

const MAX_LIMIT_PER_MODULE = 20;
const DEFAULT_LIMIT_PER_MODULE = 8;
const SCAN_LIMIT = 120;

const STAFF_ROLES = ["staff_manager", "staff_editor", "staff_support"];

const SEARCHABLE_MODULES = Object.freeze({
  properties: [
    "property",
    "properties",
    "propiedad",
    "propiedades",
    "listing",
    "listings",
    "anuncio",
    "anuncios",
    "casa",
    "casas",
    "inmueble",
    "inmuebles",
  ],
  leads: [
    "lead",
    "leads",
    "message",
    "messages",
    "mensaje",
    "mensajes",
    "inbox",
  ],
  reservations: [
    "reservation",
    "reservations",
    "booking",
    "bookings",
    "reserva",
    "reservas",
  ],
  payments: [
    "payment",
    "payments",
    "pago",
    "pagos",
    "charge",
    "charges",
    "cobro",
    "cobros",
  ],
  reviews: ["review", "reviews", "resena", "resenas"],
  team: [
    "team",
    "equipo",
    "staff",
    "usuario",
    "usuarios",
    "user",
    "users",
    "member",
    "members",
    "miembro",
    "miembros",
  ],
  clients: [
    "client",
    "clients",
    "cliente",
    "clientes",
    "customer",
    "customers",
  ],
  profile: ["profile", "perfil", "cuenta", "account", "preferences", "preferencias"],
});

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
  collections: {
    users: getEnv("APPWRITE_COLLECTION_USERS_ID") || "users",
    userPreferences:
      getEnv("APPWRITE_COLLECTION_USER_PREFERENCES_ID") || "user_preferences",
    properties: getEnv("APPWRITE_COLLECTION_PROPERTIES_ID") || "properties",
    leads: getEnv("APPWRITE_COLLECTION_LEADS_ID") || "leads",
    reservations: getEnv("APPWRITE_COLLECTION_RESERVATIONS_ID") || "reservations",
    payments:
      getEnv("APPWRITE_COLLECTION_RESERVATION_PAYMENTS_ID") ||
      "reservation_payments",
    reviews: getEnv("APPWRITE_COLLECTION_REVIEWS_ID") || "reviews",
    activityLogs:
      getEnv("APPWRITE_COLLECTION_ACTIVITY_LOGS_ID") || "activity_logs",
  },
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

const normalizeText = (value) =>
  String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

const toTokens = (value) => normalizeText(value).split(/\s+/).filter(Boolean);

const asSearchBlob = (values) =>
  values
    .map((value) => normalizeText(value))
    .filter(Boolean)
    .join(" ");

const parseScopesJson = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.map((item) => String(item || "").trim()).filter(Boolean);
  }
  try {
    const parsed = JSON.parse(String(value || "[]"));
    if (!Array.isArray(parsed)) return [];
    return parsed.map((item) => String(item || "").trim()).filter(Boolean);
  } catch {
    return [];
  }
};

const getEffectiveScopes = (userDoc) => {
  const role = String(userDoc?.role || "").trim().toLowerCase();
  if (role === "root" || role === "owner") return ["*"];
  return parseScopesJson(userDoc?.scopesJson);
};

const hasScope = (scopes, required) => {
  if (!required) return true;
  const needed = String(required || "").trim();
  if (!needed) return true;
  const scopeSet = new Set(scopes || []);
  return scopeSet.has("*") || scopeSet.has(needed);
};

const isInternalRole = (role) => {
  const normalized = String(role || "").toLowerCase();
  return normalized === "root" || normalized === "owner" || STAFF_ROLES.includes(normalized);
};

const getScore = (query, values = []) => {
  if (!query) return 1;
  const text = asSearchBlob(values);
  if (!text) return 0;

  const tokens = toTokens(query);
  if (tokens.length === 0) return 0;

  const exact = text === query;
  const starts = text.startsWith(query);
  const includes = text.includes(query);
  let tokenMatches = 0;
  for (const token of tokens) {
    if (text.includes(token)) tokenMatches += 1;
  }
  if (!includes && tokenMatches === 0) return 0;

  let score = tokenMatches * 18;
  if (tokenMatches === tokens.length) score += 24;
  if (includes) score += 20;
  if (starts) score += 18;
  if (exact) score += 40;
  return score;
};

const rankDocuments = (documents, query, valuesSelector, limit) =>
  (documents || [])
    .map((document) => ({
      document,
      score: getScore(query, valuesSelector(document)),
    }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((item) => item.document);

const listDocumentsSafe = async ({ db, config, collectionId, queries }) => {
  if (!collectionId) return [];
  try {
    const response = await db.listDocuments(config.databaseId, collectionId, queries || []);
    return response?.documents || [];
  } catch {
    return [];
  }
};

const detectSearchPlan = (query) => {
  const matchedModules = new Set();
  for (const [moduleName, aliases] of Object.entries(SEARCHABLE_MODULES)) {
    if (aliases.some((alias) => query.includes(alias))) {
      matchedModules.add(moduleName);
    }
  }
  return {
    broad: matchedModules.size === 0,
    matchedModules,
  };
};

const canFetchModule = (plan, moduleName) =>
  plan.broad || plan.matchedModules.has(moduleName);

export default async ({ req, res }) => {
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

  const actorUserId =
    req.headers?.["x-appwrite-user-id"] || req.headers?.["x-appwrite-userid"] || "";
  if (!actorUserId) {
    return json(res, 401, {
      ok: false,
      success: false,
      code: "UNAUTHORIZED",
      message: "Missing authenticated user context",
    });
  }

  const body = parseBody(req);
  const rawQuery = normalizeText(body.query);
  if (rawQuery.length < 2) {
    return json(res, 200, {
      ok: true,
      success: true,
      code: "DEEP_SEARCH_OK",
      data: {
        properties: [],
        leads: [],
        reservations: [],
        payments: [],
        reviews: [],
        team: [],
        clients: [],
        profile: null,
        preferences: null,
        activityLogs: [],
        loadedAt: Date.now(),
      },
    });
  }

  const limitPerModule = Math.min(
    MAX_LIMIT_PER_MODULE,
    Math.max(1, Number(body.limitPerModule || DEFAULT_LIMIT_PER_MODULE)),
  );

  const client = new Client()
    .setEndpoint(config.endpoint)
    .setProject(config.projectId)
    .setKey(config.apiKey);
  const db = new Databases(client);

  try {
    const actorDoc = await db.getDocument(
      config.databaseId,
      config.collections.users,
      String(actorUserId),
    );

    const actorRole = String(actorDoc?.role || "").toLowerCase();
    if (!isInternalRole(actorRole) || actorDoc?.enabled === false) {
      return json(res, 403, {
        ok: false,
        success: false,
        code: "FORBIDDEN",
        message: "Internal user required",
      });
    }

    const scopes = getEffectiveScopes(actorDoc);
    const plan = detectSearchPlan(rawQuery);
    const baseQuery = [Query.equal("enabled", true), Query.orderDesc("$createdAt"), Query.limit(SCAN_LIMIT)];

    const tasks = [
      hasScope(scopes, "properties.read") && canFetchModule(plan, "properties")
        ? listDocumentsSafe({
            db,
            config,
            collectionId: config.collections.properties,
            queries: baseQuery,
          })
        : Promise.resolve([]),
      hasScope(scopes, "leads.read") && canFetchModule(plan, "leads")
        ? listDocumentsSafe({
            db,
            config,
            collectionId: config.collections.leads,
            queries: baseQuery,
          })
        : Promise.resolve([]),
      hasScope(scopes, "reservations.read") && canFetchModule(plan, "reservations")
        ? listDocumentsSafe({
            db,
            config,
            collectionId: config.collections.reservations,
            queries: baseQuery,
          })
        : Promise.resolve([]),
      hasScope(scopes, "payments.read") && canFetchModule(plan, "payments")
        ? listDocumentsSafe({
            db,
            config,
            collectionId: config.collections.payments,
            queries: baseQuery,
          })
        : Promise.resolve([]),
      hasScope(scopes, "reviews.moderate") && canFetchModule(plan, "reviews")
        ? listDocumentsSafe({
            db,
            config,
            collectionId: config.collections.reviews,
            queries: baseQuery,
          })
        : Promise.resolve([]),
      hasScope(scopes, "staff.manage") && canFetchModule(plan, "team")
        ? listDocumentsSafe({
            db,
            config,
            collectionId: config.collections.users,
            queries: [
              Query.equal("role", STAFF_ROLES),
              Query.orderDesc("$createdAt"),
              Query.limit(SCAN_LIMIT),
            ],
          })
        : Promise.resolve([]),
      (actorRole === "owner" || actorRole === "root") && canFetchModule(plan, "clients")
        ? listDocumentsSafe({
            db,
            config,
            collectionId: config.collections.users,
            queries: [
              Query.equal("role", "client"),
              Query.orderDesc("$createdAt"),
              Query.limit(SCAN_LIMIT),
            ],
          })
        : Promise.resolve([]),
      canFetchModule(plan, "profile")
        ? Promise.resolve(actorDoc)
        : Promise.resolve(null),
      canFetchModule(plan, "profile")
        ? listDocumentsSafe({
            db,
            config,
            collectionId: config.collections.userPreferences,
            queries: [Query.equal("userId", String(actorUserId)), Query.limit(1)],
          })
        : Promise.resolve([]),
      actorRole === "root"
        ? listDocumentsSafe({
            db,
            config,
            collectionId: config.collections.activityLogs,
            queries: [Query.orderDesc("$createdAt"), Query.limit(SCAN_LIMIT)],
          })
        : Promise.resolve([]),
    ];

    const [
      propertiesPool,
      leadsPool,
      reservationsPool,
      paymentsPool,
      reviewsPool,
      teamPool,
      clientsPool,
      profileDoc,
      preferencesPool,
      activityLogsPool,
    ] = await Promise.all(tasks);

    const result = {
      properties: rankDocuments(
        propertiesPool,
        rawQuery,
        (item) => [item.$id, item.title, item.slug, item.city, item.state, item.description],
        limitPerModule,
      ),
      leads: rankDocuments(
        leadsPool,
        rawQuery,
        (item) => [item.$id, item.name, item.email, item.phone, item.message, item.status, item.propertyId],
        limitPerModule,
      ),
      reservations: rankDocuments(
        reservationsPool,
        rawQuery,
        (item) => [
          item.$id,
          item.propertyId,
          item.guestName,
          item.guestEmail,
          item.guestPhone,
          item.status,
          item.paymentStatus,
        ],
        limitPerModule,
      ),
      payments: rankDocuments(
        paymentsPool,
        rawQuery,
        (item) => [item.$id, item.provider, item.status, item.reservationId, item.providerPaymentId],
        limitPerModule,
      ),
      reviews: rankDocuments(
        reviewsPool,
        rawQuery,
        (item) => [item.$id, item.propertyId, item.authorName, item.title, item.comment, item.status],
        limitPerModule,
      ),
      team: rankDocuments(
        teamPool,
        rawQuery,
        (item) => [item.$id, item.firstName, item.lastName, item.email, item.role],
        limitPerModule,
      ),
      clients: rankDocuments(
        clientsPool,
        rawQuery,
        (item) => [item.$id, item.firstName, item.lastName, item.email, item.phone],
        limitPerModule,
      ),
      profile:
        profileDoc && getScore(rawQuery, [
          profileDoc.firstName,
          profileDoc.lastName,
          profileDoc.email,
          profileDoc.phone,
          profileDoc.whatsappNumber,
          profileDoc.role,
        ]) > 0
          ? profileDoc
          : null,
      preferences: (() => {
        const pref = preferencesPool?.[0] || null;
        if (!pref) return null;
        return getScore(rawQuery, [pref.theme, pref.locale, pref.brandFontBody, pref.brandFontHeading]) > 0
          ? pref
          : null;
      })(),
      activityLogs: rankDocuments(
        activityLogsPool,
        rawQuery,
        (item) => [item.$id, item.action, item.entityType, item.entityId, item.actorUserId, item.changeSummary],
        limitPerModule,
      ),
      loadedAt: Date.now(),
    };

    return json(res, 200, {
      ok: true,
      success: true,
      code: "DEEP_SEARCH_OK",
      data: result,
    });
  } catch (err) {
    return json(res, 500, {
      ok: false,
      success: false,
      code: "INTERNAL_ERROR",
      message: err.message,
    });
  }
};
