import { normalizeCommercialMode, normalizeResourceType } from "./resourceModel";

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
  property: Object.freeze([
    "sale",
    "rent_long_term",
    "rent_short_term",
    "rent_hourly",
  ]),
  service: Object.freeze(["rent_short_term", "rent_hourly"]),
  vehicle: Object.freeze([
    "sale",
    "rent_long_term",
    "rent_short_term",
    "rent_hourly",
  ]),
  experience: Object.freeze(["rent_short_term", "rent_hourly"]),
  venue: Object.freeze(["rent_short_term", "rent_hourly"]),
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

export const getAllowedCommercialModes = (resourceType) => {
  const normalizedType = normalizeResourceType(resourceType);
  return [
    ...(COMMERCIAL_MODE_BY_RESOURCE_TYPE[normalizedType] ||
      COMMERCIAL_MODE_BY_RESOURCE_TYPE.property),
  ];
};

export const isAllowedCategory = (resourceType, category) =>
  getAllowedCategories(resourceType).includes(normalizeCategory(category));

export const isAllowedCommercialMode = (resourceType, commercialMode) =>
  getAllowedCommercialModes(resourceType).includes(
    normalizeCommercialMode(commercialMode),
  );

export const sanitizeCategory = (resourceType, category) => {
  const normalizedCategory = normalizeCategory(category);
  return isAllowedCategory(resourceType, normalizedCategory)
    ? normalizedCategory
    : getDefaultCategory(resourceType);
};

export const sanitizeCommercialMode = (resourceType, commercialMode) => {
  const normalizedMode = normalizeCommercialMode(commercialMode);
  return isAllowedCommercialMode(resourceType, normalizedMode)
    ? normalizedMode
    : getDefaultCommercialMode(resourceType);
};

export const isValidResourceCombo = (resourceType, category, commercialMode) =>
  isAllowedCategory(resourceType, category) &&
  isAllowedCommercialMode(resourceType, commercialMode);

export const getCategoryTranslationKey = (categorySlug) =>
  CATEGORY_I18N_KEY_BY_SLUG[normalizeCategory(categorySlug)] || "";
