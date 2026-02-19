const LEGACY_OPERATION_TO_COMMERCIAL = Object.freeze({
  sale: "sale",
  rent: "rent_long_term",
  vacation_rental: "rent_short_term",
  rent_hourly: "rent_hourly",
});

const COMMERCIAL_TO_LEGACY_OPERATION = Object.freeze({
  sale: "sale",
  rent_long_term: "rent",
  rent_short_term: "vacation_rental",
  rent_hourly: "rent_hourly",
});

const LEGACY_PRICE_PER_UNIT_TO_MODEL = Object.freeze({
  total: "total",
  sqm: "per_m2",
  sqft: "per_m2",
});

const PRICING_MODEL_TO_LEGACY_UNIT = Object.freeze({
  total: "total",
  per_m2: "sqm",
  per_month: "total",
  per_night: "total",
  per_day: "total",
  per_hour: "total",
  per_person: "total",
  per_event: "total",
});

const KNOWN_PRICING_MODELS = Object.freeze([
  "total",
  "per_month",
  "per_night",
  "per_day",
  "per_hour",
  "per_person",
  "per_event",
  "per_m2",
]);

const COMMERCIAL_MODE_VALUES = new Set([
  "sale",
  "rent_long_term",
  "rent_short_term",
  "rent_hourly",
]);

const RESOURCE_TYPES = new Set([
  "property",
  "service",
  "vehicle",
  "experience",
  "venue",
]);

const normalizeText = (value) => String(value || "").trim();

const normalizeLower = (value) => normalizeText(value).toLowerCase();

export const normalizeResourceType = (value) => {
  const normalized = normalizeLower(value);
  return RESOURCE_TYPES.has(normalized) ? normalized : "property";
};

export const normalizeCommercialMode = (value) => {
  const normalized = normalizeLower(value);
  if (COMMERCIAL_MODE_VALUES.has(normalized)) return normalized;

  const fromLegacy = LEGACY_OPERATION_TO_COMMERCIAL[normalized];
  if (fromLegacy) return fromLegacy;

  return "sale";
};

const ALLOWED_PRICING_MODELS_BY_RESOURCE_AND_MODE = Object.freeze({
  property: Object.freeze({
    sale: Object.freeze(["total", "per_m2"]),
    rent_long_term: Object.freeze(["per_month", "per_day", "total", "per_m2"]),
    rent_short_term: Object.freeze(["per_day", "per_night", "total"]),
    rent_hourly: Object.freeze(["per_hour", "per_event", "total"]),
  }),
  vehicle: Object.freeze({
    sale: Object.freeze(["total"]),
    rent_long_term: Object.freeze(["per_month", "per_day", "total"]),
    rent_short_term: Object.freeze(["per_day", "total"]),
    rent_hourly: Object.freeze(["per_hour", "total"]),
  }),
  service: Object.freeze({
    rent_short_term: Object.freeze(["per_day", "per_person", "per_event", "total"]),
    rent_hourly: Object.freeze(["per_hour", "per_person", "per_event", "total"]),
  }),
  experience: Object.freeze({
    rent_short_term: Object.freeze(["per_person", "per_day", "per_event", "total"]),
    rent_hourly: Object.freeze(["per_hour", "per_person", "per_event", "total"]),
  }),
  venue: Object.freeze({
    rent_short_term: Object.freeze(["per_day", "per_event", "total"]),
    rent_hourly: Object.freeze(["per_hour", "per_event", "total"]),
  }),
});

const pickFirstNonEmptyPricingModelList = (pricingMap = {}) =>
  Object.values(pricingMap).find(
    (models) => Array.isArray(models) && models.length > 0,
  ) || [];

export const getAllowedPricingModels = (
  resourceType = "property",
  commercialMode = "sale",
) => {
  const normalizedType = normalizeResourceType(resourceType);
  const normalizedMode = normalizeCommercialMode(commercialMode);

  const byType =
    ALLOWED_PRICING_MODELS_BY_RESOURCE_AND_MODE[normalizedType] ||
    ALLOWED_PRICING_MODELS_BY_RESOURCE_AND_MODE.property;

  const direct = byType[normalizedMode];
  if (Array.isArray(direct) && direct.length > 0) return [...direct];

  const fallbackFromType = pickFirstNonEmptyPricingModelList(byType);
  if (fallbackFromType.length > 0) return [...fallbackFromType];

  const fallbackFromProperty = pickFirstNonEmptyPricingModelList(
    ALLOWED_PRICING_MODELS_BY_RESOURCE_AND_MODE.property,
  );
  return fallbackFromProperty.length > 0 ? [...fallbackFromProperty] : ["total"];
};

export const normalizeBookingType = (value, fallbackCommercialMode = "sale") => {
  const normalized = normalizeLower(value);
  if (["manual_contact", "date_range", "time_slot", "fixed_event"].includes(normalized)) {
    return normalized;
  }

  const mode = normalizeCommercialMode(fallbackCommercialMode);
  if (mode === "rent_short_term") return "date_range";
  if (mode === "rent_hourly") return "time_slot";
  return "manual_contact";
};

export const normalizePricingModel = (
  value,
  fallbackCommercialMode = "sale",
  fallbackResourceType = "property",
) => {
  const allowedPricingModels = getAllowedPricingModels(
    fallbackResourceType,
    fallbackCommercialMode,
  );

  const normalized = normalizeLower(value);
  if (KNOWN_PRICING_MODELS.includes(normalized)) {
    return allowedPricingModels.includes(normalized)
      ? normalized
      : allowedPricingModels[0] || "total";
  }

  const legacyMapping = LEGACY_PRICE_PER_UNIT_TO_MODEL[normalized];
  if (legacyMapping) {
    return allowedPricingModels.includes(legacyMapping)
      ? legacyMapping
      : allowedPricingModels[0] || "total";
  }

  return allowedPricingModels[0] || "total";
};

export const toLegacyOperationType = (commercialMode) =>
  COMMERCIAL_TO_LEGACY_OPERATION[normalizeCommercialMode(commercialMode)] || "sale";

export const toLegacyPricePerUnit = (pricingModel) =>
  PRICING_MODEL_TO_LEGACY_UNIT[normalizePricingModel(pricingModel)] || "total";

export const normalizeAttributes = (attributes) => {
  if (!attributes) return "{}";
  if (typeof attributes === "string") {
    const trimmed = attributes.trim();
    if (!trimmed) return "{}";
    try {
      const parsed = JSON.parse(trimmed);
      return JSON.stringify(parsed);
    } catch {
      return "{}";
    }
  }
  try {
    return JSON.stringify(attributes);
  } catch {
    return "{}";
  }
};

export const normalizeResourceDocument = (doc = {}) => {
  const resourceType = normalizeResourceType(doc.resourceType || "property");
  const commercialMode = normalizeCommercialMode(
    doc.commercialMode || doc.operationType,
  );
  const bookingType = normalizeBookingType(doc.bookingType, commercialMode);
  const pricingModel = normalizePricingModel(
    doc.pricingModel || doc.pricePerUnit,
    commercialMode,
    resourceType,
  );
  const category = normalizeText(doc.category || doc.propertyType || "house");
  const attributes = normalizeAttributes(doc.attributes);
  const operationType = toLegacyOperationType(commercialMode);
  const pricePerUnit = toLegacyPricePerUnit(pricingModel);
  const title = normalizeText(doc.title || doc.resourceTitle || doc.propertyTitle);

  return {
    ...doc,
    resourceId: normalizeText(doc.resourceId || doc.$id),
    propertyId: normalizeText(doc.propertyId || doc.$id),
    resourceTitle: title,
    propertyTitle: title,
    resourceType,
    category,
    propertyType: category,
    commercialMode,
    operationType,
    pricingModel,
    pricePerUnit,
    bookingType,
    attributes,
  };
};

const priceLabelByModel = Object.freeze({
  total: "total",
  per_month: "month",
  per_night: "night",
  per_day: "day",
  per_hour: "hour",
  per_person: "person",
  per_event: "event",
  per_m2: "m2",
});

export const getResourceBehavior = (resourceDraftOrDoc = {}, modulesApi = {}) => {
  const normalized = normalizeResourceDocument(resourceDraftOrDoc);
  const requiresCalendar = ["date_range", "time_slot", "fixed_event"].includes(
    normalized.bookingType,
  );
  const requiresPayments =
    normalized.commercialMode === "rent_short_term" ||
    normalized.commercialMode === "rent_hourly";

  const requiredModule =
    normalized.commercialMode === "rent_short_term"
      ? "module.booking.short_term"
      : normalized.commercialMode === "rent_hourly"
        ? "module.booking.hourly"
        : "";

  const paymentModule = requiresPayments ? "module.payments.online" : "";

  const isModuleEnabled = (moduleKey) => {
    if (!moduleKey) return true;
    if (typeof modulesApi.isEnabled !== "function") return true;
    return modulesApi.isEnabled(moduleKey);
  };

  const canOperateMode = isModuleEnabled(requiredModule);
  const canUsePayments = isModuleEnabled(paymentModule);

  return {
    ...normalized,
    requiresCalendar,
    requiresPayments,
    requiredModule,
    paymentModule,
    canOperateMode,
    canUsePayments,
    allowedPricingModels: getAllowedPricingModels(
      normalized.resourceType,
      normalized.commercialMode,
    ),
    ctaType:
      normalized.bookingType === "manual_contact" ? "contact" : "book",
    priceLabel: priceLabelByModel[normalized.pricingModel] || "total",
  };
};
