import { Query } from "node-appwrite";

const DEFAULT_ENABLED_MODULES = Object.freeze([
  "module.resources",
  "module.leads",
  "module.staff",
  "module.analytics.basic",
  "module.booking.long_term",
  "module.messaging.realtime",
  "module.reviews",
]);

const DEFAULT_LIMITS = Object.freeze({
  maxPublishedResources: 50,
  maxStaffUsers: 5,
  maxActiveReservationsPerMonth: 200,
});

const normalizeText = (value) => String(value ?? "").trim();

const normalizeUiMode = (value) => {
  const normalized = normalizeText(value).toLowerCase();
  if (normalized === "marketing" || normalized === "platform") {
    return normalized;
  }
  return "platform";
};

const normalizeCommercialMode = (value) => {
  const normalized = normalizeText(value).toLowerCase();
  if (["sale", "rent_long_term", "rent_short_term", "rent_hourly"].includes(normalized)) {
    return normalized;
  }
  if (normalized === "rent") return "rent_long_term";
  if (normalized === "vacation_rental") return "rent_short_term";
  return "sale";
};

const normalizeBookingType = (value, commercialMode) => {
  const normalized = normalizeText(value).toLowerCase();
  if (["manual_contact", "date_range", "time_slot", "fixed_event"].includes(normalized)) {
    return normalized;
  }

  if (commercialMode === "rent_short_term") return "date_range";
  if (commercialMode === "rent_hourly") return "time_slot";
  return "manual_contact";
};

const parseLimits = (rawValue) => {
  if (!rawValue) return { ...DEFAULT_LIMITS };

  if (typeof rawValue === "object") {
    return {
      ...DEFAULT_LIMITS,
      ...(rawValue && typeof rawValue === "object" ? rawValue : {}),
    };
  }

  try {
    const parsed = JSON.parse(String(rawValue || "{}"));
    return {
      ...DEFAULT_LIMITS,
      ...(parsed && typeof parsed === "object" ? parsed : {}),
    };
  } catch {
    return { ...DEFAULT_LIMITS };
  }
};

const normalizeSettingsDoc = (doc = {}) => {
  const enabledModules = Array.isArray(doc.enabledModules)
    ? doc.enabledModules.map((moduleKey) => normalizeText(moduleKey)).filter(Boolean)
    : [];

  return {
    key: normalizeText(doc.key) || "main",
    enabled: doc.enabled !== false,
    uiMode:
      hasValue(doc.uiMode)
        ? normalizeUiMode(doc.uiMode)
        : doc.marketingEnabled === true
          ? "marketing"
          : "platform",
    marketingEnabled:
      hasValue(doc.uiMode)
        ? normalizeUiMode(doc.uiMode) === "marketing"
        : doc.marketingEnabled === true,
    enabledModules:
      enabledModules.length > 0
        ? enabledModules
        : [...DEFAULT_ENABLED_MODULES],
    limits: parseLimits(doc.limits),
  };
};

const buildDefaults = () => ({
  key: "main",
  enabled: true,
  uiMode: "platform",
  marketingEnabled: false,
  enabledModules: [...DEFAULT_ENABLED_MODULES],
  limits: { ...DEFAULT_LIMITS },
});

function hasValue(value) {
  return value !== undefined && value !== null && String(value).trim() !== "";
}

const loadMainSettings = async (db, config) => {
  if (!config?.instanceSettingsCollectionId) return buildDefaults();

  try {
    const response = await db.listDocuments(
      config.databaseId,
      config.instanceSettingsCollectionId,
      [Query.equal("key", "main"), Query.limit(1)],
    );
    const doc = response.documents?.[0];
    if (!doc) return buildDefaults();
    return normalizeSettingsDoc(doc);
  } catch {
    return buildDefaults();
  }
};

export const createModulesService = ({ db, config }) => {
  let settingsPromise = null;

  const getSettings = async () => {
    if (!settingsPromise) {
      settingsPromise = loadMainSettings(db, config);
    }
    return settingsPromise;
  };

  const isEnabled = async (moduleKey) => {
    const normalizedKey = normalizeText(moduleKey);
    if (!normalizedKey) return true;
    const settings = await getSettings();
    if (settings.enabled === false) return false;
    return (settings.enabledModules || []).includes(normalizedKey);
  };

  const getLimit = async (limitKey, fallbackValue = null) => {
    const normalizedKey = normalizeText(limitKey);
    if (!normalizedKey) return fallbackValue;
    const settings = await getSettings();
    const raw = settings.limits?.[normalizedKey];
    return raw === undefined || raw === null ? fallbackValue : raw;
  };

  const assertModuleEnabled = async (
    moduleKey,
    message = "Este modulo no esta habilitado para esta instancia.",
  ) => {
    const normalizedKey = normalizeText(moduleKey);
    if (!normalizedKey) return;

    if (!(await isEnabled(normalizedKey))) {
      const err = new Error(message);
      err.status = 403;
      err.code = "MODULE_DISABLED";
      err.error = "MODULE_DISABLED";
      err.moduleKey = normalizedKey;
      throw err;
    }
  };

  const assertLimitNotExceeded = async (
    limitKey,
    currentValue,
    message = "Se alcanzo el limite del plan para esta accion.",
  ) => {
    const normalizedKey = normalizeText(limitKey);
    if (!normalizedKey) return;

    const configuredLimit = Number(await getLimit(normalizedKey, null));
    if (!Number.isFinite(configuredLimit) || configuredLimit <= 0) return;

    const current = Number(currentValue || 0);
    if (Number.isFinite(current) && current >= configuredLimit) {
      const err = new Error(message);
      err.status = 403;
      err.code = "LIMIT_EXCEEDED";
      err.error = "LIMIT_EXCEEDED";
      err.limitKey = normalizedKey;
      err.limit = configuredLimit;
      err.currentValue = current;
      throw err;
    }
  };

  return {
    getSettings,
    isEnabled,
    getLimit,
    assertModuleEnabled,
    assertLimitNotExceeded,
  };
};

export const getCommercialMode = (resourceDoc = {}) =>
  normalizeCommercialMode(resourceDoc.commercialMode || resourceDoc.operationType);

export const getBookingType = (resourceDoc = {}, commercialMode = getCommercialMode(resourceDoc)) =>
  normalizeBookingType(resourceDoc.bookingType, commercialMode);

export const getRequiredBookingModule = (commercialMode) => {
  const normalizedMode = normalizeCommercialMode(commercialMode);
  if (normalizedMode === "rent_short_term") return "module.booking.short_term";
  if (normalizedMode === "rent_hourly") return "module.booking.hourly";
  return "";
};

export const requiresOnlinePayments = (commercialMode, bookingType = "") => {
  const normalizedMode = normalizeCommercialMode(commercialMode);
  const normalizedBooking = normalizeBookingType(bookingType, normalizedMode);
  if (["time_slot", "fixed_event", "date_range"].includes(normalizedBooking)) {
    return normalizedMode === "rent_short_term" || normalizedMode === "rent_hourly";
  }
  return false;
};

export const toModuleErrorResponse = (err) => {
  const status = Number(err?.status || 403);
  const code = String(err?.code || err?.error || "MODULE_DISABLED");
  const body = {
    ok: false,
    success: false,
    error: code,
    code,
    message: String(
      err?.message ||
        "Este modulo no esta habilitado para esta instancia.",
    ),
  };

  if (err?.moduleKey) body.moduleKey = String(err.moduleKey);
  if (err?.limitKey) body.limitKey = String(err.limitKey);
  if (err?.limit !== undefined) body.limit = Number(err.limit);
  if (err?.currentValue !== undefined) body.currentValue = Number(err.currentValue);

  return { status, body };
};
