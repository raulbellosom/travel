export const INTERNAL_BASE_PATH = "/app";

const withInternalBase = (segment) => `${INTERNAL_BASE_PATH}/${segment}`;

export const INTERNAL_ROUTES = Object.freeze({
  dashboard: withInternalBase("dashboard"),

  // ── Canonical names (prefer these in new code) ────────────
  myResources: withInternalBase("my-resources"),
  createResource: withInternalBase("resources/new"),

  // ── Legacy aliases (deprecated – do not use in new code) ──
  myProperties: withInternalBase("my-resources"),
  createProperty: withInternalBase("resources/new"),

  leads: withInternalBase("leads"),
  reservations: withInternalBase("reservations"),
  calendar: withInternalBase("calendar"),
  payments: withInternalBase("payments"),
  reviews: withInternalBase("reviews"),
  clients: withInternalBase("clients"),
  team: withInternalBase("team"),
  conversations: withInternalBase("conversations"),
  rootActivity: withInternalBase("activity"),
  rootAmenities: withInternalBase("amenities"),
  rootFunctionsDiagnostics: withInternalBase("functions-health"),
  rootInstance: withInternalBase("root/instance"),
  rootModules: withInternalBase("root/modules"),
  profile: withInternalBase("profile"),
});

/** Canonical resource route helpers */
export const getInternalEditResourceRoute = (id) =>
  withInternalBase(`resources/${id}/edit`);

export const getInternalResourceDetailRoute = (id) =>
  withInternalBase(`resources/${id}`);

/** @deprecated Use getInternalEditResourceRoute */
export const getInternalEditPropertyRoute = (id) =>
  getInternalEditResourceRoute(id);

/** @deprecated Use getInternalResourceDetailRoute */
export const getInternalPropertyDetailRoute = (id) =>
  getInternalResourceDetailRoute(id);

export const getLegacyInternalEditPropertyRoute = (id) =>
  withInternalBase(`editar-propiedad/${id}`);

export const getLegacyInternalPropertyDetailRoute = (id) =>
  withInternalBase(`propiedades/${id}`);

/* ── Public routes ─────────────────────────────────── */

/** Canonical public resource route */
export const getPublicResourceRoute = (slug, language = "es") => {
  const normalizedLanguage = String(language || "es").toLowerCase();
  const basePath = normalizedLanguage.startsWith("en")
    ? "/resources"
    : "/recursos";
  return `${basePath}/${slug}`;
};

/** @deprecated Use getPublicResourceRoute */
export const getPublicPropertyRoute = (slug, language = "es") =>
  getPublicResourceRoute(slug, language);

/* ── Conversations routes (role-based) ───────────────── */

/**
 * Get the appropriate conversations route based on user role
 * @param {Object} user - The user object (must have role property)
 * @returns {string} - The conversations route path
 */
export const getConversationsRoute = (user) => {
  if (!user) return "/my-conversations";

  // Internal roles (owner, staff, root) go to dashboard conversations
  const internalRoles = ["owner", "staff", "root"];
  if (internalRoles.includes(user.role)) {
    return INTERNAL_ROUTES.conversations;
  }

  // Client users go to public conversations
  return "/my-conversations";
};
