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
  total: "fixed_total",
  fixed_total: "fixed_total",
  sqm: "per_m2",
  sqft: "per_m2",
});

const PRICING_MODEL_TO_LEGACY_UNIT = Object.freeze({
  fixed_total: "total",
  per_m2: "sqm",
  per_month: "total",
  per_night: "total",
  per_day: "total",
  per_hour: "total",
  per_person: "total",
  per_event: "total",
});

const KNOWN_PRICING_MODELS = Object.freeze([
  "fixed_total",
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
const SUPPORTED_MANUAL_CONTACT_SCHEDULE_TYPES = new Set([
  "date_range",
  "time_slot",
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

const ALLOWED_BOOKING_TYPES_BY_COMMERCIAL_MODE = Object.freeze({
  sale: Object.freeze(["manual_contact"]),
  rent_long_term: Object.freeze(["manual_contact"]),
  rent_short_term: Object.freeze(["date_range", "manual_contact"]),
  rent_hourly: Object.freeze(["time_slot", "fixed_event", "manual_contact"]),
});

const ALLOWED_PRICING_MODELS_BY_RESOURCE_CATEGORY_AND_MODE = Object.freeze({
  property: Object.freeze({
    house: Object.freeze({
      sale: Object.freeze(["fixed_total", "per_m2"]),
      rent_long_term: Object.freeze(["per_month", "fixed_total", "per_m2"]),
      rent_short_term: Object.freeze(["per_night", "per_day", "fixed_total"]),
    }),
    apartment: Object.freeze({
      sale: Object.freeze(["fixed_total", "per_m2"]),
      rent_long_term: Object.freeze(["per_month", "fixed_total", "per_m2"]),
      rent_short_term: Object.freeze(["per_night", "per_day", "fixed_total"]),
    }),
    land: Object.freeze({
      sale: Object.freeze(["fixed_total", "per_m2"]),
      rent_long_term: Object.freeze(["per_month", "fixed_total", "per_m2"]),
      rent_short_term: Object.freeze(["per_day", "fixed_total"]),
    }),
    commercial: Object.freeze({
      sale: Object.freeze(["fixed_total", "per_m2"]),
      rent_long_term: Object.freeze(["per_month", "fixed_total", "per_m2"]),
      rent_short_term: Object.freeze(["per_day", "fixed_total"]),
    }),
    office: Object.freeze({
      sale: Object.freeze(["fixed_total", "per_m2"]),
      rent_long_term: Object.freeze(["per_month", "fixed_total", "per_m2"]),
      rent_short_term: Object.freeze(["per_day", "fixed_total"]),
    }),
    warehouse: Object.freeze({
      sale: Object.freeze(["fixed_total", "per_m2"]),
      rent_long_term: Object.freeze(["per_month", "fixed_total", "per_m2"]),
      rent_short_term: Object.freeze(["per_day", "fixed_total"]),
    }),
  }),
  vehicle: Object.freeze({
    car: Object.freeze({
      sale: Object.freeze(["fixed_total"]),
      rent_long_term: Object.freeze(["per_month", "fixed_total"]),
      rent_short_term: Object.freeze(["per_day"]),
    }),
    suv: Object.freeze({
      sale: Object.freeze(["fixed_total"]),
      rent_long_term: Object.freeze(["per_month", "fixed_total"]),
      rent_short_term: Object.freeze(["per_day"]),
    }),
    pickup: Object.freeze({
      sale: Object.freeze(["fixed_total"]),
      rent_long_term: Object.freeze(["per_month", "fixed_total"]),
      rent_short_term: Object.freeze(["per_day"]),
    }),
    van: Object.freeze({
      sale: Object.freeze(["fixed_total"]),
      rent_long_term: Object.freeze(["per_month", "fixed_total"]),
      rent_short_term: Object.freeze(["per_day"]),
    }),
    motorcycle: Object.freeze({
      sale: Object.freeze(["fixed_total"]),
      rent_long_term: Object.freeze(["per_month", "fixed_total"]),
      rent_short_term: Object.freeze(["per_day"]),
    }),
    boat: Object.freeze({
      sale: Object.freeze(["fixed_total"]),
      rent_long_term: Object.freeze(["per_month", "fixed_total"]),
      rent_short_term: Object.freeze(["per_day"]),
    }),
  }),
  service: Object.freeze({
    cleaning: Object.freeze({
      rent_short_term: Object.freeze(["per_day", "per_person", "per_event", "fixed_total"]),
      rent_hourly: Object.freeze(["per_hour", "per_person", "per_event", "fixed_total"]),
    }),
    dj: Object.freeze({
      rent_short_term: Object.freeze(["per_day", "per_person", "per_event", "fixed_total"]),
      rent_hourly: Object.freeze(["per_hour", "per_person", "per_event", "fixed_total"]),
    }),
    chef: Object.freeze({
      rent_short_term: Object.freeze(["per_day", "per_person", "per_event", "fixed_total"]),
      rent_hourly: Object.freeze(["per_hour", "per_person", "per_event", "fixed_total"]),
    }),
    photography: Object.freeze({
      rent_short_term: Object.freeze(["per_day", "per_person", "per_event", "fixed_total"]),
      rent_hourly: Object.freeze(["per_hour", "per_person", "per_event", "fixed_total"]),
    }),
    catering: Object.freeze({
      rent_short_term: Object.freeze(["per_day", "per_person", "per_event", "fixed_total"]),
      rent_hourly: Object.freeze(["per_hour", "per_person", "per_event", "fixed_total"]),
    }),
    maintenance: Object.freeze({
      rent_short_term: Object.freeze(["per_day", "per_person", "per_event", "fixed_total"]),
      rent_hourly: Object.freeze(["per_hour", "per_person", "per_event", "fixed_total"]),
    }),
  }),
  experience: Object.freeze({
    tour: Object.freeze({
      rent_short_term: Object.freeze(["per_person", "per_day", "per_event", "fixed_total"]),
      rent_hourly: Object.freeze(["per_hour", "per_person", "per_event", "fixed_total"]),
    }),
    class: Object.freeze({
      rent_short_term: Object.freeze(["per_person", "per_day", "per_event", "fixed_total"]),
      rent_hourly: Object.freeze(["per_hour", "per_person", "per_event", "fixed_total"]),
    }),
    workshop: Object.freeze({
      rent_short_term: Object.freeze(["per_person", "per_day", "per_event", "fixed_total"]),
      rent_hourly: Object.freeze(["per_hour", "per_person", "per_event", "fixed_total"]),
    }),
    adventure: Object.freeze({
      rent_short_term: Object.freeze(["per_person", "per_day", "per_event", "fixed_total"]),
      rent_hourly: Object.freeze(["per_hour", "per_person", "per_event", "fixed_total"]),
    }),
    wellness: Object.freeze({
      rent_short_term: Object.freeze(["per_person", "per_day", "per_event", "fixed_total"]),
      rent_hourly: Object.freeze(["per_hour", "per_person", "per_event", "fixed_total"]),
    }),
    gastronomy: Object.freeze({
      rent_short_term: Object.freeze(["per_person", "per_day", "per_event", "fixed_total"]),
      rent_hourly: Object.freeze(["per_hour", "per_person", "per_event", "fixed_total"]),
    }),
  }),
  venue: Object.freeze({
    event_hall: Object.freeze({
      rent_short_term: Object.freeze(["per_day", "per_event", "fixed_total"]),
      rent_hourly: Object.freeze(["per_hour", "per_event", "fixed_total"]),
    }),
    commercial_local: Object.freeze({
      rent_short_term: Object.freeze(["per_day", "per_event", "fixed_total"]),
      rent_hourly: Object.freeze(["per_hour", "per_event", "fixed_total"]),
    }),
    studio: Object.freeze({
      rent_short_term: Object.freeze(["per_day", "per_event", "fixed_total"]),
      rent_hourly: Object.freeze(["per_hour", "per_event", "fixed_total"]),
    }),
    coworking: Object.freeze({
      rent_short_term: Object.freeze(["per_day", "per_event", "fixed_total"]),
      rent_hourly: Object.freeze(["per_hour", "per_event", "fixed_total"]),
    }),
    meeting_room: Object.freeze({
      rent_short_term: Object.freeze(["per_day", "per_event", "fixed_total"]),
      rent_hourly: Object.freeze(["per_hour", "per_event", "fixed_total"]),
    }),
  }),
});

const pickFirstNonEmptyPricingModelList = (pricingMap = {}) =>
  Object.values(pricingMap).find(
    (models) => Array.isArray(models) && models.length > 0,
  ) || [];

export const getAllowedPricingModels = (
  resourceType = "property",
  commercialMode = "sale",
  category = "",
) => {
  const normalizedType = normalizeResourceType(resourceType);
  const normalizedMode = normalizeCommercialMode(commercialMode);
  const normalizedCategory = normalizeLower(category);
  const byType =
    ALLOWED_PRICING_MODELS_BY_RESOURCE_CATEGORY_AND_MODE[normalizedType] ||
    ALLOWED_PRICING_MODELS_BY_RESOURCE_CATEGORY_AND_MODE.property;
  const byCategory = byType[normalizedCategory] || byType[Object.keys(byType)[0]];
  const direct = byCategory?.[normalizedMode];
  if (Array.isArray(direct) && direct.length > 0) return [...direct];

  const fallbackFromType = pickFirstNonEmptyPricingModelList(byCategory || {});
  if (fallbackFromType.length > 0) return [...fallbackFromType];

  const fallbackFromProperty = pickFirstNonEmptyPricingModelList(
    ALLOWED_PRICING_MODELS_BY_RESOURCE_CATEGORY_AND_MODE.property.house,
  );
  return fallbackFromProperty.length > 0 ? [...fallbackFromProperty] : ["fixed_total"];
};

export const getAllowedBookingTypes = (
  _resourceType = "property",
  commercialMode = "sale",
  _category = "",
) => {
  void _resourceType;
  void _category;
  const normalizedMode = normalizeCommercialMode(commercialMode);
  const allowed = ALLOWED_BOOKING_TYPES_BY_COMMERCIAL_MODE[normalizedMode];
  return Array.isArray(allowed) && allowed.length > 0
    ? [...allowed]
    : ["manual_contact"];
};

export const normalizeBookingType = (
  value,
  fallbackCommercialMode = "sale",
  fallbackResourceType = "property",
  fallbackCategory = "",
) => {
  const allowedBookingTypes = getAllowedBookingTypes(
    fallbackResourceType,
    fallbackCommercialMode,
    fallbackCategory,
  );
  const normalized = normalizeLower(value);
  if (allowedBookingTypes.includes(normalized)) {
    return normalized;
  }

  return allowedBookingTypes[0] || "manual_contact";
};

export const normalizePricingModel = (
  value,
  fallbackCommercialMode = "sale",
  fallbackResourceType = "property",
  fallbackCategory = "",
) => {
  const allowedPricingModels = getAllowedPricingModels(
    fallbackResourceType,
    fallbackCommercialMode,
    fallbackCategory,
  );

  const normalized = normalizeLower(value);
  if (KNOWN_PRICING_MODELS.includes(normalized)) {
    const canonical = normalized === "total" ? "fixed_total" : normalized;
    return allowedPricingModels.includes(canonical)
      ? canonical
      : allowedPricingModels[0] || "fixed_total";
  }

  const legacyMapping = LEGACY_PRICE_PER_UNIT_TO_MODEL[normalized];
  if (legacyMapping) {
    return allowedPricingModels.includes(legacyMapping)
      ? legacyMapping
      : allowedPricingModels[0] || "fixed_total";
  }

  return allowedPricingModels[0] || "fixed_total";
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

export const parseResourceAttributes = (attributes) => {
  if (!attributes) return {};

  if (typeof attributes === "string") {
    const trimmed = attributes.trim();
    if (!trimmed) return {};
    try {
      const parsed = JSON.parse(trimmed);
      return parsed && typeof parsed === "object" && !Array.isArray(parsed)
        ? parsed
        : {};
    } catch {
      return {};
    }
  }

  if (typeof attributes === "object" && !Array.isArray(attributes)) {
    return attributes;
  }

  return {};
};

export const normalizeManualContactScheduleType = (value) => {
  const normalized = normalizeLower(value);
  return SUPPORTED_MANUAL_CONTACT_SCHEDULE_TYPES.has(normalized)
    ? normalized
    : "none";
};

export const getManualContactScheduleType = (resourceDoc = {}) => {
  const attributes = parseResourceAttributes(resourceDoc.attributes);
  return normalizeManualContactScheduleType(
    attributes.manualContactScheduleType || attributes.manual_contact_schedule_type,
  );
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
    doc.category || doc.propertyType || "",
  );
  const category = normalizeText(doc.category || doc.propertyType || "house");
  const attributes = normalizeAttributes(doc.attributes);
  const manualContactScheduleType = getManualContactScheduleType({
    ...doc,
    attributes,
  });
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
    manualContactScheduleType,
  };
};

const priceLabelByModel = Object.freeze({
  fixed_total: "total",
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
  const effectiveScheduleType =
    normalized.bookingType === "manual_contact"
      ? normalized.manualContactScheduleType
      : normalized.bookingType === "date_range"
        ? "date_range"
        : normalized.bookingType === "time_slot" ||
            normalized.bookingType === "fixed_event"
          ? "time_slot"
          : "none";
  const requiresCalendar =
    ["date_range", "time_slot", "fixed_event"].includes(normalized.bookingType) ||
    effectiveScheduleType === "date_range" ||
    effectiveScheduleType === "time_slot";
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
    effectiveScheduleType,
    requiresCalendar,
    requiresPayments,
    requiredModule,
    paymentModule,
    canOperateMode,
    canUsePayments,
    allowedPricingModels: getAllowedPricingModels(
      normalized.resourceType,
      normalized.commercialMode,
      normalized.category,
    ),
    ctaType:
      normalized.bookingType === "manual_contact" ? "contact" : "book",
    priceLabel: priceLabelByModel[normalized.pricingModel] || "total",
  };
};
