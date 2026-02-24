import env from "../env";
import { databases, ensureAppwriteConfigured, ID, Query } from "../api/appwriteClient";

export const MODULE_CATALOG = Object.freeze([
  { key: "module.resources", label: "Resources" },
  { key: "module.leads", label: "Leads" },
  { key: "module.staff", label: "Staff" },
  { key: "module.analytics.basic", label: "Analytics Basic" },
  { key: "module.booking.long_term", label: "Booking Long Term" },
  { key: "module.booking.short_term", label: "Booking Short Term" },
  { key: "module.booking.hourly", label: "Booking Hourly" },
  { key: "module.payments.online", label: "Payments Online" },
  { key: "module.messaging.realtime", label: "Messages" },
  { key: "module.profile", label: "Profile" },
  { key: "module.preferences.theme", label: "Theme Preferences" },
  { key: "module.preferences.locale", label: "Language Preferences" },
  { key: "module.reviews", label: "Reviews" },
  { key: "module.calendar.advanced", label: "Calendar Advanced" },
]);

const DEFAULT_LIMITS = Object.freeze({
  maxPublishedResources: 50,
  maxStaffUsers: 5,
  maxActiveReservationsPerMonth: 200,
});

const DEFAULT_MODULES = Object.freeze([
  "module.resources",
  "module.leads",
  "module.staff",
  "module.analytics.basic",
  "module.booking.long_term",
  "module.messaging.realtime",
  "module.profile",
  "module.preferences.theme",
  "module.preferences.locale",
  "module.reviews",
]);

const DEFAULT_INSTANCE_SETTINGS = Object.freeze({
  key: "main",
  planKey: "starter",
  enabledModules: DEFAULT_MODULES,
  limits: DEFAULT_LIMITS,
  enabled: true,
});

const parseLimits = (rawValue) => {
  if (!rawValue) return { ...DEFAULT_LIMITS };
  if (typeof rawValue === "object") {
    return { ...DEFAULT_LIMITS, ...rawValue };
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

const normalizeSettingsDocument = (doc = {}) => {
  const enabledModules = Array.isArray(doc.enabledModules)
    ? doc.enabledModules.map((moduleKey) => String(moduleKey || "").trim()).filter(Boolean)
    : [];

  return {
    ...doc,
    key: String(doc.key || "main").trim() || "main",
    planKey: String(doc.planKey || DEFAULT_INSTANCE_SETTINGS.planKey).trim(),
    enabledModules: enabledModules.length > 0 ? enabledModules : [...DEFAULT_MODULES],
    limits: parseLimits(doc.limits),
    enabled: doc.enabled !== false,
  };
};

const serializeLimits = (limits) =>
  JSON.stringify({
    ...DEFAULT_LIMITS,
    ...(limits && typeof limits === "object" ? limits : {}),
  });

const ensureCollectionConfigured = () => {
  const collectionId = env.appwrite.collections.instanceSettings;
  if (!collectionId) {
    throw new Error("No esta configurada APPWRITE_COLLECTION_INSTANCE_SETTINGS_ID.");
  }
  return collectionId;
};

const normalizeRole = (value) =>
  String(value || "")
    .trim()
    .toLowerCase();

const assertRootActor = (actorRole) => {
  if (normalizeRole(actorRole) === "root") return;
  const error = new Error("Solo root puede modificar instance_settings.");
  error.code = "FORBIDDEN";
  throw error;
};

const createActivityLog = async (payload = {}) => {
  const collectionId = env.appwrite.collections.activityLogs;
  if (!collectionId) return;

  await databases
    .createDocument({
      databaseId: env.appwrite.databaseId,
      collectionId,
      documentId: ID.unique(),
      data: payload,
    })
    .catch(() => {});
};

export const instanceSettingsService = {
  getDefaults() {
    return {
      ...DEFAULT_INSTANCE_SETTINGS,
      enabledModules: [...DEFAULT_MODULES],
      limits: { ...DEFAULT_LIMITS },
    };
  },

  getModuleCatalog() {
    return MODULE_CATALOG;
  },

  async getMain() {
    ensureAppwriteConfigured();
    const collectionId = ensureCollectionConfigured();

    const response = await databases.listDocuments({
      databaseId: env.appwrite.databaseId,
      collectionId,
      queries: [Query.equal("key", "main"), Query.limit(1)],
    });

    const doc = response.documents?.[0] || null;
    if (!doc) {
      return this.getDefaults();
    }
    return normalizeSettingsDocument(doc);
  },

  async ensureMain({ actorUserId = "", actorRole = "" } = {}) {
    assertRootActor(actorRole);
    ensureAppwriteConfigured();
    const collectionId = ensureCollectionConfigured();
    const current = await this.getMain();

    if (current?.$id) {
      return current;
    }

    const created = await databases.createDocument({
      databaseId: env.appwrite.databaseId,
      collectionId,
      documentId: ID.unique(),
      data: {
        key: "main",
        planKey: current.planKey || DEFAULT_INSTANCE_SETTINGS.planKey,
        enabledModules: current.enabledModules || [...DEFAULT_MODULES],
        limits: serializeLimits(current.limits || DEFAULT_LIMITS),
        enabled: true,
      },
    });

    await createActivityLog({
      actorUserId: String(actorUserId || "").trim(),
      actorRole,
      action: "instance_settings.bootstrap",
      entityType: "instance_settings",
      entityId: created.$id,
      afterData: JSON.stringify({
        key: "main",
        planKey: created.planKey,
        enabledModules: created.enabledModules,
      }).slice(0, 20000),
      severity: "info",
    });

    return normalizeSettingsDocument(created);
  },

  async saveMain(
    { planKey, enabledModules, limits, enabled } = {},
    { actorUserId = "", actorRole = "" } = {},
  ) {
    assertRootActor(actorRole);
    ensureAppwriteConfigured();
    const collectionId = ensureCollectionConfigured();
    const current = await this.ensureMain({ actorUserId, actorRole });

    const next = {
      planKey: String(planKey || current.planKey || "starter").trim(),
      enabledModules: Array.isArray(enabledModules)
        ? enabledModules.map((moduleKey) => String(moduleKey || "").trim()).filter(Boolean)
        : current.enabledModules,
      limits: parseLimits(limits || current.limits),
      enabled: enabled === undefined ? current.enabled !== false : Boolean(enabled),
    };

    const payload = {
      key: "main",
      planKey: next.planKey,
      enabledModules: next.enabledModules,
      limits: serializeLimits(next.limits),
      enabled: next.enabled,
    };

    const saved = current.$id
      ? await databases.updateDocument({
          databaseId: env.appwrite.databaseId,
          collectionId,
          documentId: current.$id,
          data: payload,
        })
      : await databases.createDocument({
          databaseId: env.appwrite.databaseId,
          collectionId,
          documentId: ID.unique(),
          data: payload,
        });

    await createActivityLog({
      actorUserId: String(actorUserId || "").trim(),
      actorRole,
      action: "instance_settings.update",
      entityType: "instance_settings",
      entityId: saved.$id,
      beforeData: JSON.stringify({
        planKey: current.planKey,
        enabledModules: current.enabledModules,
        limits: current.limits,
      }).slice(0, 20000),
      afterData: JSON.stringify({
        planKey: next.planKey,
        enabledModules: next.enabledModules,
        limits: next.limits,
      }).slice(0, 20000),
      severity: "warning",
    });

    return normalizeSettingsDocument(saved);
  },
};
