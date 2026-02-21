import { normalizeCommercialMode, normalizeResourceType } from "./resourceModel.js";

export const CATEGORY_BY_RESOURCE_TYPE = Object.freeze({
  property: Object.freeze([
    "house",
    "apartment",
    "land",
    "commercial",
    "office",
    "warehouse",
  ]),
  service: Object.freeze([
    "cleaning",
    "dj",
    "chef",
    "photography",
    "catering",
    "maintenance",
  ]),
  vehicle: Object.freeze([
    "car",
    "suv",
    "pickup",
    "van",
    "motorcycle",
    "boat",
  ]),
  experience: Object.freeze([
    "tour",
    "class",
    "workshop",
    "adventure",
    "wellness",
    "gastronomy",
  ]),
  venue: Object.freeze([
    "event_hall",
    "commercial_local",
    "studio",
    "coworking",
    "meeting_room",
  ]),
});

export const COMMERCIAL_MODE_BY_RESOURCE_TYPE = Object.freeze({
  property: Object.freeze(["sale", "rent_long_term", "rent_short_term"]),
  service: Object.freeze(["rent_short_term", "rent_hourly"]),
  vehicle: Object.freeze(["sale", "rent_long_term", "rent_short_term"]),
  experience: Object.freeze(["rent_short_term", "rent_hourly"]),
  venue: Object.freeze(["rent_short_term", "rent_hourly"]),
});

const COMMERCIAL_MODE_BY_RESOURCE_AND_CATEGORY = Object.freeze({
  property: Object.freeze({
    house: Object.freeze(["sale", "rent_long_term", "rent_short_term"]),
    apartment: Object.freeze(["sale", "rent_long_term", "rent_short_term"]),
    land: Object.freeze(["sale", "rent_long_term", "rent_short_term"]),
    commercial: Object.freeze(["sale", "rent_long_term", "rent_short_term"]),
    office: Object.freeze(["sale", "rent_long_term", "rent_short_term"]),
    warehouse: Object.freeze(["sale", "rent_long_term", "rent_short_term"]),
  }),
  service: Object.freeze({
    cleaning: Object.freeze(["rent_short_term", "rent_hourly"]),
    dj: Object.freeze(["rent_short_term", "rent_hourly"]),
    chef: Object.freeze(["rent_short_term", "rent_hourly"]),
    photography: Object.freeze(["rent_short_term", "rent_hourly"]),
    catering: Object.freeze(["rent_short_term", "rent_hourly"]),
    maintenance: Object.freeze(["rent_short_term", "rent_hourly"]),
  }),
  vehicle: Object.freeze({
    car: Object.freeze(["sale", "rent_long_term", "rent_short_term"]),
    suv: Object.freeze(["sale", "rent_long_term", "rent_short_term"]),
    pickup: Object.freeze(["sale", "rent_long_term", "rent_short_term"]),
    van: Object.freeze(["sale", "rent_long_term", "rent_short_term"]),
    motorcycle: Object.freeze(["sale", "rent_long_term", "rent_short_term"]),
    boat: Object.freeze(["sale", "rent_long_term", "rent_short_term"]),
  }),
  experience: Object.freeze({
    tour: Object.freeze(["rent_short_term", "rent_hourly"]),
    class: Object.freeze(["rent_short_term", "rent_hourly"]),
    workshop: Object.freeze(["rent_short_term", "rent_hourly"]),
    adventure: Object.freeze(["rent_short_term", "rent_hourly"]),
    wellness: Object.freeze(["rent_short_term", "rent_hourly"]),
    gastronomy: Object.freeze(["rent_short_term", "rent_hourly"]),
  }),
  venue: Object.freeze({
    event_hall: Object.freeze(["rent_short_term", "rent_hourly"]),
    commercial_local: Object.freeze(["rent_short_term", "rent_hourly"]),
    studio: Object.freeze(["rent_short_term", "rent_hourly"]),
    coworking: Object.freeze(["rent_short_term", "rent_hourly"]),
    meeting_room: Object.freeze(["rent_short_term", "rent_hourly"]),
  }),
});

export const CATEGORY_I18N_KEY_BY_SLUG = Object.freeze({
  house: "propertyForm.options.category.house",
  apartment: "propertyForm.options.category.apartment",
  land: "propertyForm.options.category.land",
  commercial: "propertyForm.options.category.commercial",
  office: "propertyForm.options.category.office",
  warehouse: "propertyForm.options.category.warehouse",
  cleaning: "propertyForm.options.category.cleaning",
  dj: "propertyForm.options.category.dj",
  chef: "propertyForm.options.category.chef",
  photography: "propertyForm.options.category.photography",
  catering: "propertyForm.options.category.catering",
  maintenance: "propertyForm.options.category.maintenance",
  car: "propertyForm.options.category.car",
  suv: "propertyForm.options.category.suv",
  pickup: "propertyForm.options.category.pickup",
  van: "propertyForm.options.category.van",
  motorcycle: "propertyForm.options.category.motorcycle",
  boat: "propertyForm.options.category.boat",
  tour: "propertyForm.options.category.tour",
  class: "propertyForm.options.category.class",
  workshop: "propertyForm.options.category.workshop",
  adventure: "propertyForm.options.category.adventure",
  wellness: "propertyForm.options.category.wellness",
  gastronomy: "propertyForm.options.category.gastronomy",
  event_hall: "propertyForm.options.category.eventHall",
  commercial_local: "propertyForm.options.category.commercialLocal",
  studio: "propertyForm.options.category.studio",
  coworking: "propertyForm.options.category.coworking",
  meeting_room: "propertyForm.options.category.meetingRoom",
});

export const normalizeCategory = (value) =>
  String(value || "")
    .trim()
    .toLowerCase();

const getDefaultCategory = (resourceType) =>
  getAllowedCategories(resourceType)[0] || "house";

const getDefaultCommercialMode = (resourceType) =>
  getAllowedCommercialModes(resourceType)[0] || "sale";

export const getAllowedCategories = (resourceType) => {
  const normalizedType = normalizeResourceType(resourceType);
  return [...(CATEGORY_BY_RESOURCE_TYPE[normalizedType] || CATEGORY_BY_RESOURCE_TYPE.property)];
};

export const getAllowedCommercialModes = (resourceType, category = "") => {
  const normalizedType = normalizeResourceType(resourceType);
  const normalizedCategory = normalizeCategory(category);
  const byCategory =
    COMMERCIAL_MODE_BY_RESOURCE_AND_CATEGORY[normalizedType]?.[normalizedCategory];
  if (Array.isArray(byCategory) && byCategory.length > 0) {
    return [...byCategory];
  }
  return [
    ...(COMMERCIAL_MODE_BY_RESOURCE_TYPE[normalizedType] ||
      COMMERCIAL_MODE_BY_RESOURCE_TYPE.property),
  ];
};

export const isAllowedCategory = (resourceType, category) =>
  getAllowedCategories(resourceType).includes(normalizeCategory(category));

export const isAllowedCommercialMode = (
  resourceType,
  categoryOrCommercialMode,
  commercialModeInput,
) => {
  const hasCategory = commercialModeInput !== undefined;
  const category = hasCategory ? categoryOrCommercialMode : "";
  const commercialMode = hasCategory
    ? commercialModeInput
    : categoryOrCommercialMode;
  return getAllowedCommercialModes(resourceType, category).includes(
    normalizeCommercialMode(commercialMode),
  );
};

export const sanitizeCategory = (resourceType, category) => {
  const normalizedCategory = normalizeCategory(category);
  return isAllowedCategory(resourceType, normalizedCategory)
    ? normalizedCategory
    : getDefaultCategory(resourceType);
};

export const sanitizeCommercialMode = (
  resourceType,
  commercialMode,
  category = "",
) => {
  const normalizedMode = normalizeCommercialMode(commercialMode);
  return isAllowedCommercialMode(resourceType, category, normalizedMode)
    ? normalizedMode
    : getAllowedCommercialModes(resourceType, category)[0] ||
        getDefaultCommercialMode(resourceType);
};

export const isValidResourceCombo = (resourceType, category, commercialMode) =>
  isAllowedCategory(resourceType, category) &&
  isAllowedCommercialMode(resourceType, category, commercialMode);

export const getCategoryTranslationKey = (categorySlug) =>
  CATEGORY_I18N_KEY_BY_SLUG[normalizeCategory(categorySlug)] || "";
