/**
 * resourceLabels.js
 *
 * Centralized label resolution for all resource-related enums.
 * Uses i18n keys from `client:common.enums.*` as primary source,
 * falls back to `propertyForm.options.*` for legacy compat.
 *
 * Every snake_case DB value is mapped to a human-readable translated string.
 */

// ─── Resource Type ──────────────────────────────────────────────
const RESOURCE_TYPE_I18N_MAP = Object.freeze({
  property: "client:common.enums.resourceType.property",
  service: "client:common.enums.resourceType.service",
  music: "client:common.enums.resourceType.music",
  vehicle: "client:common.enums.resourceType.vehicle",
  experience: "client:common.enums.resourceType.experience",
  venue: "client:common.enums.resourceType.venue",
});

// ─── Category (snake_case DB values) ────────────────────────────
const CATEGORY_I18N_MAP = Object.freeze({
  // property
  house: "client:common.enums.category.house",
  apartment: "client:common.enums.category.apartment",
  land: "client:common.enums.category.land",
  commercial: "client:common.enums.category.commercial",
  office: "client:common.enums.category.office",
  warehouse: "client:common.enums.category.warehouse",
  // service
  cleaning: "client:common.enums.category.cleaning",
  dj: "client:common.enums.category.dj",
  chef: "client:common.enums.category.chef",
  photography: "client:common.enums.category.photography",
  catering: "client:common.enums.category.catering",
  maintenance: "client:common.enums.category.maintenance",
  // music
  banda: "client:common.enums.category.banda",
  norteno: "client:common.enums.category.norteno",
  sierreno: "client:common.enums.category.sierreno",
  mariachi: "client:common.enums.category.mariachi",
  corridos: "client:common.enums.category.corridos",
  corridos_tumbados: "client:common.enums.category.corridos_tumbados",
  corrido_mexicano: "client:common.enums.category.corrido_mexicano",
  regional_mexicano: "client:common.enums.category.regional_mexicano",
  duranguense: "client:common.enums.category.duranguense",
  grupera: "client:common.enums.category.grupera",
  cumbia: "client:common.enums.category.cumbia",
  cumbia_sonidera: "client:common.enums.category.cumbia_sonidera",
  cumbia_rebajada: "client:common.enums.category.cumbia_rebajada",
  salsa: "client:common.enums.category.salsa",
  bachata: "client:common.enums.category.bachata",
  merengue: "client:common.enums.category.merengue",
  pop: "client:common.enums.category.pop",
  rock: "client:common.enums.category.rock",
  rock_urbano: "client:common.enums.category.rock_urbano",
  hip_hop: "client:common.enums.category.hip_hop",
  rap: "client:common.enums.category.rap",
  reggaeton: "client:common.enums.category.reggaeton",
  urbano_latino: "client:common.enums.category.urbano_latino",
  electronica: "client:common.enums.category.electronica",
  techno: "client:common.enums.category.techno",
  trance: "client:common.enums.category.trance",
  jazz: "client:common.enums.category.jazz",
  blues: "client:common.enums.category.blues",
  boleros: "client:common.enums.category.boleros",
  trova: "client:common.enums.category.trova",
  instrumental: "client:common.enums.category.instrumental",
  versatil: "client:common.enums.category.versatil",
  son_jarocho: "client:common.enums.category.son_jarocho",
  huapango: "client:common.enums.category.huapango",
  sonora: "client:common.enums.category.sonora",
  // vehicle
  car: "client:common.enums.category.car",
  suv: "client:common.enums.category.suv",
  pickup: "client:common.enums.category.pickup",
  van: "client:common.enums.category.van",
  motorcycle: "client:common.enums.category.motorcycle",
  boat: "client:common.enums.category.boat",
  // experience
  tour: "client:common.enums.category.tour",
  class: "client:common.enums.category.class",
  workshop: "client:common.enums.category.workshop",
  adventure: "client:common.enums.category.adventure",
  wellness: "client:common.enums.category.wellness",
  gastronomy: "client:common.enums.category.gastronomy",
  // venue
  event_hall: "client:common.enums.category.event_hall",
  commercial_local: "client:common.enums.category.commercial_local",
  studio: "client:common.enums.category.studio",
  coworking: "client:common.enums.category.coworking",
  meeting_room: "client:common.enums.category.meeting_room",
});

// ─── Commercial Mode (snake_case DB values) ─────────────────────
const COMMERCIAL_MODE_I18N_MAP = Object.freeze({
  sale: "client:common.enums.commercialMode.sale",
  rent_long_term: "client:common.enums.commercialMode.rent_long_term",
  rent_short_term: "client:common.enums.commercialMode.rent_short_term",
  rent_hourly: "client:common.enums.commercialMode.rent_hourly",
});

// Legacy operation values → commercial mode key
const LEGACY_OPERATION_TO_COMMERCIAL = Object.freeze({
  sale: "sale",
  rent: "rent_long_term",
  vacation_rental: "rent_short_term",
  rent_hourly: "rent_hourly",
});

// ─── Pricing Model ──────────────────────────────────────────────
const PRICING_MODEL_I18N_MAP = Object.freeze({
  total: "client:common.enums.pricingModel.total",
  fixed_total: "client:common.enums.pricingModel.fixed_total",
  per_month: "client:common.enums.pricingModel.per_month",
  per_night: "client:common.enums.pricingModel.per_night",
  per_day: "client:common.enums.pricingModel.per_day",
  per_hour: "client:common.enums.pricingModel.per_hour",
  per_person: "client:common.enums.pricingModel.per_person",
  per_event: "client:common.enums.pricingModel.per_event",
  per_m2: "client:common.enums.pricingModel.per_m2",
});

// ─── Booking Type ───────────────────────────────────────────────
const BOOKING_TYPE_I18N_MAP = Object.freeze({
  manual_contact: "client:common.enums.bookingType.manual_contact",
  date_range: "client:common.enums.bookingType.date_range",
  time_slot: "client:common.enums.bookingType.time_slot",
  fixed_event: "client:common.enums.bookingType.fixed_event",
});

// ─── Status ─────────────────────────────────────────────────────
const STATUS_I18N_MAP = Object.freeze({
  draft: "propertyStatus.draft",
  published: "propertyStatus.published",
  inactive: "propertyStatus.inactive",
  archived: "propertyStatus.archived",
});

// ─── Helper ─────────────────────────────────────────────────────
const normalize = (value) =>
  String(value || "")
    .trim()
    .toLowerCase();

const resolveLabel = (map, value, t, fallbackMap = null) => {
  const key = normalize(value);
  if (!key) return "-";

  const i18nKey = map[key];
  if (i18nKey) {
    const translated = t(i18nKey, { defaultValue: "" });
    if (translated && translated !== i18nKey) return translated;
  }

  if (fallbackMap) {
    const fallbackKey = fallbackMap[key];
    if (fallbackKey) {
      const translated = t(fallbackKey, { defaultValue: "" });
      if (translated && translated !== fallbackKey) return translated;
    }
  }

  // Capitalize first letter, replace underscores with spaces
  return key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, " ");
};

// ─── Public API ─────────────────────────────────────────────────

/**
 * Get translated label for a resource type (property, service, vehicle, etc.)
 */
export const getResourceTypeLabel = (resourceType, t) =>
  resolveLabel(RESOURCE_TYPE_I18N_MAP, resourceType, t);

/**
 * Get translated label for a category (house, car, tour, event_hall, etc.)
 */
export const getCategoryLabel = (category, t) =>
  resolveLabel(CATEGORY_I18N_MAP, category, t);

/**
 * Get translated label for a commercial mode (sale, rent_long_term, etc.)
 * Also handles legacy operation values (rent, vacation_rental).
 */
export const getCommercialModeLabel = (commercialModeOrOperation, t) => {
  const key = normalize(commercialModeOrOperation);

  // Try direct match on commercial mode first
  const directKey = COMMERCIAL_MODE_I18N_MAP[key];
  if (directKey) {
    const translated = t(directKey, { defaultValue: "" });
    if (translated && translated !== directKey) return translated;
  }

  // Try legacy operation mapping
  const mappedKey = LEGACY_OPERATION_TO_COMMERCIAL[key];
  if (mappedKey && COMMERCIAL_MODE_I18N_MAP[mappedKey]) {
    const translated = t(COMMERCIAL_MODE_I18N_MAP[mappedKey], {
      defaultValue: "",
    });
    if (translated) return translated;
  }

  // Fallback to old operation enum keys
  const legacyKey = `client:common.enums.operation.${key}`;
  const legacyTranslated = t(legacyKey, { defaultValue: "" });
  if (legacyTranslated && legacyTranslated !== legacyKey)
    return legacyTranslated;

  return key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, " ");
};

/**
 * Get translated label for a pricing model (per_night, per_hour, etc.)
 */
export const getPricingModelLabel = (pricingModel, t) =>
  resolveLabel(PRICING_MODEL_I18N_MAP, pricingModel, t);

/**
 * Get translated label for booking type
 */
export const getBookingTypeLabel = (bookingType, t) =>
  resolveLabel(BOOKING_TYPE_I18N_MAP, bookingType, t);

/**
 * Get translated label for resource status
 */
export const getStatusLabel = (status, t) =>
  resolveLabel(STATUS_I18N_MAP, status, t);

/**
 * Resource type icon name suggestions (for use with lucide-react)
 */
export const RESOURCE_TYPE_ICONS = Object.freeze({
  property: "Building2",
  service: "Wrench",
  music: "Music",
  vehicle: "Car",
  experience: "Compass",
  venue: "Landmark",
});
