export const INTERNAL_ROLES = new Set([
  "root",
  "owner",
  "staff_manager",
  "staff_editor",
  "staff_support",
]);

export const PROPERTY_EDITOR_ROLES = new Set([
  "root",
  "owner",
  "staff_manager",
  "staff_editor",
]);

const ROLE_HIERARCHY = [
  "staff_support",
  "staff_editor",
  "staff_manager",
  "owner",
  "root",
];

const ROLE_DEFAULT_SCOPES = {
  root: ["*"],
  owner: ["*"],
  staff_manager: [
    "resources.read",
    "resources.write",
    "leads.read",
    "leads.write",
    "reservations.read",
    "reservations.write",
    "payments.read",
    "reviews.moderate",
    "messaging.read",
    "messaging.write",
  ],
  staff_editor: ["resources.read", "resources.write", "reviews.moderate"],
  staff_support: [
    "leads.read",
    "leads.write",
    "reservations.read",
    "reservations.write",
    "messaging.read",
    "messaging.write",
  ],
  client: [],
};

export const isInternalRole = (role) => INTERNAL_ROLES.has(String(role || ""));

export const canPublishProperty = (role) =>
  PROPERTY_EDITOR_ROLES.has(String(role || ""));

export const getRoleRank = (role) =>
  ROLE_HIERARCHY.indexOf(
    String(role || "")
      .trim()
      .toLowerCase(),
  );

export const hasRoleAtLeast = (role, minimumRole) => {
  const currentRank = getRoleRank(role);
  const minRank = getRoleRank(minimumRole);
  if (currentRank < 0 || minRank < 0) return false;
  return currentRank >= minRank;
};

const parseScopesJson = (rawScopes) => {
  if (!rawScopes) return [];
  if (Array.isArray(rawScopes)) {
    return rawScopes.map((scope) => String(scope || "").trim()).filter(Boolean);
  }

  try {
    const parsed = JSON.parse(String(rawScopes || "[]"));
    if (!Array.isArray(parsed)) return [];
    return parsed.map((scope) => String(scope || "").trim()).filter(Boolean);
  } catch {
    return [];
  }
};

export const getEffectiveScopes = (user) => {
  const role = String(user?.role || "")
    .trim()
    .toLowerCase();
  const roleScopes = ROLE_DEFAULT_SCOPES[role] || [];
  const explicitScopes = parseScopesJson(user?.scopesJson);
  const scopes = new Set([...roleScopes, ...explicitScopes]);
  return Array.from(scopes);
};

export const hasScope = (user, requiredScope) => {
  if (!requiredScope) return true;
  const scope = String(requiredScope || "").trim();
  const scopes = getEffectiveScopes(user);
  return scopes.includes("*") || scopes.includes(scope);
};
