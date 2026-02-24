const RESERVATION_MODULE_KEYS = Object.freeze([
  "module.booking.long_term",
  "module.booking.short_term",
  "module.booking.hourly",
]);

const SCOPE_ALL_MODULE_REQUIREMENTS = Object.freeze({
  "resources.read": Object.freeze(["module.resources"]),
  "resources.write": Object.freeze(["module.resources"]),
  "leads.read": Object.freeze(["module.leads"]),
  "leads.write": Object.freeze(["module.leads"]),
  "messaging.read": Object.freeze(["module.messaging.realtime"]),
  "messaging.write": Object.freeze(["module.messaging.realtime"]),
  "payments.read": Object.freeze(["module.payments.online"]),
  "reviews.moderate": Object.freeze(["module.reviews"]),
  "staff.manage": Object.freeze(["module.staff"]),
  "profile.read": Object.freeze(["module.profile"]),
  "profile.write": Object.freeze(["module.profile"]),
});

const SCOPE_ANY_MODULE_REQUIREMENTS = Object.freeze({
  "reservations.read": RESERVATION_MODULE_KEYS,
  "reservations.write": RESERVATION_MODULE_KEYS,
  "preferences.write": Object.freeze([
    "module.preferences.theme",
    "module.preferences.locale",
  ]),
});

const isModuleEnabledSafe = (isModuleEnabled, moduleKey) => {
  if (!moduleKey) return true;
  if (typeof isModuleEnabled !== "function") return true;
  return isModuleEnabled(moduleKey);
};

export const isScopeAllowedByModules = (scope, isModuleEnabled) => {
  const normalizedScope = String(scope || "").trim();
  if (!normalizedScope || normalizedScope === "*") return true;

  const requiredAll = SCOPE_ALL_MODULE_REQUIREMENTS[normalizedScope];
  if (Array.isArray(requiredAll) && requiredAll.length > 0) {
    return requiredAll.every((moduleKey) =>
      isModuleEnabledSafe(isModuleEnabled, moduleKey),
    );
  }

  const requiredAny = SCOPE_ANY_MODULE_REQUIREMENTS[normalizedScope];
  if (Array.isArray(requiredAny) && requiredAny.length > 0) {
    return requiredAny.some((moduleKey) =>
      isModuleEnabledSafe(isModuleEnabled, moduleKey),
    );
  }

  return true;
};

export const filterScopesByEnabledModules = (scopes, isModuleEnabled) => {
  const source = Array.isArray(scopes) ? scopes : [];
  return source.filter((scope) =>
    isScopeAllowedByModules(scope, isModuleEnabled),
  );
};
