export const INTERNAL_BASE_PATH = "/app";

const withInternalBase = (segment) => `${INTERNAL_BASE_PATH}/${segment}`;

export const INTERNAL_ROUTES = Object.freeze({
  dashboard: withInternalBase("dashboard"),
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

export const getInternalEditPropertyRoute = (id) =>
  withInternalBase(`resources/${id}/edit`);

export const getInternalPropertyDetailRoute = (id) =>
  withInternalBase(`resources/${id}`);

export const getLegacyInternalEditPropertyRoute = (id) =>
  withInternalBase(`editar-propiedad/${id}`);

export const getLegacyInternalPropertyDetailRoute = (id) =>
  withInternalBase(`propiedades/${id}`);

/* ── Public routes ─────────────────────────────────── */

export const getPublicPropertyRoute = (slug, language = "es") => {
  const normalizedLanguage = String(language || "es").toLowerCase();
  const basePath = normalizedLanguage.startsWith("en")
    ? "/properties"
    : "/propiedades";
  return `${basePath}/${slug}`;
};

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
