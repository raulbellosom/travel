import env from "../env";
import { databases, ensureAppwriteConfigured, Query } from "../api/appwriteClient";
import { deepSearchService } from "./deepSearchService";
import { staffService } from "./staffService";

const MAX_ITEMS_PER_COLLECTION = 120;
const MAX_RESULTS_PER_ENTITY = 10;
const MODULE_CACHE_TTL_MS = 30_000;
const SEARCH_CACHE_TTL_MS = 20_000;

const EMPTY_DATASET = Object.freeze({
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
  loadedAt: 0,
});

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
  leads: [
    "lead",
    "leads",
    "message",
    "messages",
    "mensaje",
    "mensajes",
    "client",
    "clients",
    "cliente",
    "clientes",
    "contact",
    "contacto",
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
  clients: ["client", "clients", "customer", "customers", "cliente", "clientes"],
  profile: ["profile", "perfil", "account", "cuenta", "preferences", "preferencias"],
});

const moduleDataCache = new Map();
const searchResultCache = new Map();

const listDocumentsSafe = async ({ collectionId, queries = [] }) => {
  if (!collectionId) return [];
  try {
    const response = await databases.listDocuments({
      databaseId: env.appwrite.databaseId,
      collectionId,
      queries,
    });
    return response?.documents || [];
  } catch {
    return [];
  }
};

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

const getScore = (query, values = []) => {
  if (!query) return 1;

  const text = asSearchBlob(values);
  if (!text) return 0;

  const queryTokens = toTokens(query);
  if (queryTokens.length === 0) return 0;

  const exact = text === query;
  const starts = text.startsWith(query);
  const includes = text.includes(query);
  let tokenMatches = 0;

  for (const token of queryTokens) {
    if (text.includes(token)) tokenMatches += 1;
  }

  if (!tokenMatches && !includes) return 0;

  let score = tokenMatches * 18;
  if (tokenMatches === queryTokens.length) score += 28;
  if (includes) score += 20;
  if (starts) score += 20;
  if (exact) score += 40;

  return score;
};

const rankDocuments = (documents, query, valueSelector, limit = MAX_RESULTS_PER_ENTITY) =>
  (documents || [])
    .map((document) => ({
      document,
      score: getScore(query, valueSelector(document)),
    }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((entry) => entry.document);

const getCached = (cache, key, ttlMs) => {
  const cached = cache.get(key);
  if (!cached) return null;
  if (Date.now() - cached.at > ttlMs) {
    cache.delete(key);
    return null;
  }
  return cached.value;
};

const setCached = (cache, key, value) => {
  cache.set(key, { value, at: Date.now() });
  return value;
};

const detectSearchPlan = ({ query }) => {
  const matchedModules = new Set();

  for (const [moduleName, aliases] of Object.entries(SEARCHABLE_MODULES)) {
    if (aliases.some((alias) => query.includes(alias))) {
      matchedModules.add(moduleName);
    }
  }

  return {
    isBroadSearch: matchedModules.size === 0,
    matchedModules,
  };
};

const fetchCollectionRecency = async ({ userId, moduleName, collectionId, queries = [] }) => {
  const cacheKey = `${userId || "anonymous"}:${moduleName}`;
  const cached = getCached(moduleDataCache, cacheKey, MODULE_CACHE_TTL_MS);
  if (cached) return cached;

  const rows = await listDocumentsSafe({
    collectionId,
    queries: [...queries, Query.orderDesc("$createdAt"), Query.limit(MAX_ITEMS_PER_COLLECTION)],
  });

  return setCached(moduleDataCache, cacheKey, rows);
};

const searchPropertiesLocal = async ({ userId, query }) => {
  const pool = await fetchCollectionRecency({
    userId,
    moduleName: "properties",
    collectionId: env.appwrite.collections.properties,
    queries: [Query.equal("enabled", true)],
  });

  return rankDocuments(pool, query, (property) => [
    property.$id,
    property.title,
    property.slug,
    property.city,
    property.state,
    property.description,
  ]);
};

const searchLeadsLocal = async ({ userId, query }) => {
  const pool = await fetchCollectionRecency({
    userId,
    moduleName: "leads",
    collectionId: env.appwrite.collections.leads,
    queries: [Query.equal("enabled", true)],
  });

  return rankDocuments(pool, query, (lead) => [
    lead.$id,
    lead.name,
    lead.email,
    lead.phone,
    lead.message,
    lead.status,
    lead.propertyId,
  ]);
};

const searchReservationsLocal = async ({ userId, query }) => {
  const pool = await fetchCollectionRecency({
    userId,
    moduleName: "reservations",
    collectionId: env.appwrite.collections.reservations,
    queries: [Query.equal("enabled", true)],
  });

  return rankDocuments(pool, query, (reservation) => [
    reservation.$id,
    reservation.propertyId,
    reservation.guestName,
    reservation.guestEmail,
    reservation.guestPhone,
    reservation.status,
    reservation.paymentStatus,
  ]);
};

const searchPaymentsLocal = async ({ userId, query }) => {
  const pool = await fetchCollectionRecency({
    userId,
    moduleName: "payments",
    collectionId: env.appwrite.collections.reservationPayments,
    queries: [Query.equal("enabled", true)],
  });

  return rankDocuments(pool, query, (payment) => [
    payment.$id,
    payment.reservationId,
    payment.provider,
    payment.providerPaymentId,
    payment.status,
  ]);
};

const searchReviewsLocal = async ({ userId, query }) => {
  const pool = await fetchCollectionRecency({
    userId,
    moduleName: "reviews",
    collectionId: env.appwrite.collections.reviews,
    queries: [Query.equal("enabled", true)],
  });

  return rankDocuments(pool, query, (review) => [
    review.$id,
    review.propertyId,
    review.authorName,
    review.title,
    review.comment,
    review.status,
  ]);
};

const searchTeamLocal = async ({ userId, query }) => {
  const cacheKey = `${userId || "anonymous"}:team`;
  const cached = getCached(moduleDataCache, cacheKey, MODULE_CACHE_TTL_MS);
  const staff = cached || (await staffService.listStaff().catch(() => []));
  if (!cached) {
    setCached(moduleDataCache, cacheKey, staff);
  }

  return rankDocuments(staff, query, (member) => [
    member.$id,
    member.firstName,
    member.lastName,
    member.email,
    member.role,
  ]);
};

const searchClientsLocal = async ({ userId, query }) => {
  const pool = await fetchCollectionRecency({
    userId,
    moduleName: "clients",
    collectionId: env.appwrite.collections.users,
    queries: [Query.equal("role", "client")],
  });

  return rankDocuments(pool, query, (client) => [
    client.$id,
    client.firstName,
    client.lastName,
    client.email,
    client.phone,
  ]);
};

const searchProfileLocal = async ({ userId, query }) => {
  if (!userId || !env.appwrite.collections.users) return null;
  try {
    const profile = await databases.getDocument({
      databaseId: env.appwrite.databaseId,
      collectionId: env.appwrite.collections.users,
      documentId: userId,
    });
    const score = getScore(query, [
      profile.firstName,
      profile.lastName,
      profile.email,
      profile.phone,
      profile.whatsappNumber,
      profile.role,
    ]);
    return score > 0 ? profile : null;
  } catch {
    return null;
  }
};

const searchPreferencesLocal = async ({ userId, query }) => {
  if (!userId || !env.appwrite.collections.userPreferences) return null;

  const rows = await listDocumentsSafe({
    collectionId: env.appwrite.collections.userPreferences,
    queries: [Query.equal("userId", userId), Query.limit(1)],
  });
  const preference = rows?.[0] || null;
  if (!preference) return null;

  const score = getScore(query, [preference.theme, preference.locale]);
  return score > 0 ? preference : null;
};

export const globalSearchService = {
  async search({
    query = "",
    actorUserId = "",
    canReadProperties = false,
    canReadLeads = false,
    canReadReservations = false,
    canReadPayments = false,
    canReadReviews = false,
    canManageTeam = false,
    canReadClients = false,
    canReadProfile = true,
  } = {}) {
    ensureAppwriteConfigured();

    const normalizedQuery = normalizeText(query);
    if (normalizedQuery.length < 2) {
      return EMPTY_DATASET;
    }

    const permissionsKey = [
      canReadProperties,
      canReadLeads,
      canReadReservations,
      canReadPayments,
      canReadReviews,
      canManageTeam,
      canReadClients,
      canReadProfile,
    ].join("|");
    const cacheKey = `${actorUserId || "anonymous"}:${permissionsKey}:${normalizedQuery}`;
    const cachedResult = getCached(searchResultCache, cacheKey, SEARCH_CACHE_TTL_MS);
    if (cachedResult) return cachedResult;

    if (deepSearchService.isConfigured()) {
      try {
        const deepSearchResult = await deepSearchService.search({
          query: normalizedQuery,
          limitPerModule: MAX_RESULTS_PER_ENTITY,
        });
        const result = {
          ...EMPTY_DATASET,
          ...deepSearchResult,
          loadedAt: Date.now(),
        };
        return setCached(searchResultCache, cacheKey, result);
      } catch {
        // Fallback local search when function is unavailable or misconfigured.
      }
    }

    const plan = detectSearchPlan({ query: normalizedQuery });
    const hasModuleHint = (moduleName) =>
      plan.isBroadSearch || plan.matchedModules.has(moduleName);

    const tasks = [
      canReadProperties && hasModuleHint("properties")
        ? searchPropertiesLocal({ userId: actorUserId, query: normalizedQuery })
        : Promise.resolve([]),
      canReadLeads && hasModuleHint("leads")
        ? searchLeadsLocal({ userId: actorUserId, query: normalizedQuery })
        : Promise.resolve([]),
      canReadReservations && hasModuleHint("reservations")
        ? searchReservationsLocal({ userId: actorUserId, query: normalizedQuery })
        : Promise.resolve([]),
      canReadPayments && hasModuleHint("payments")
        ? searchPaymentsLocal({ userId: actorUserId, query: normalizedQuery })
        : Promise.resolve([]),
      canReadReviews && hasModuleHint("reviews")
        ? searchReviewsLocal({ userId: actorUserId, query: normalizedQuery })
        : Promise.resolve([]),
      canManageTeam && hasModuleHint("team")
        ? searchTeamLocal({ userId: actorUserId, query: normalizedQuery })
        : Promise.resolve([]),
      canReadClients && hasModuleHint("clients")
        ? searchClientsLocal({ userId: actorUserId, query: normalizedQuery })
        : Promise.resolve([]),
      canReadProfile && hasModuleHint("profile")
        ? searchProfileLocal({ userId: actorUserId, query: normalizedQuery })
        : Promise.resolve(null),
      canReadProfile && hasModuleHint("profile")
        ? searchPreferencesLocal({ userId: actorUserId, query: normalizedQuery })
        : Promise.resolve(null),
    ];

    const [
      properties,
      leads,
      reservations,
      payments,
      reviews,
      team,
      clients,
      profile,
      preferences,
    ] = await Promise.all(tasks);

    const result = {
      properties,
      leads,
      reservations,
      payments,
      reviews,
      team,
      clients,
      profile,
      preferences,
      activityLogs: [],
      loadedAt: Date.now(),
    };

    return setCached(searchResultCache, cacheKey, result);
  },
};
