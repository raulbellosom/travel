import {
  normalizeCommercialMode,
  normalizeResourceType,
} from "./resourceModel.js";

const MUSIC_CATEGORIES = Object.freeze([
  "dj",
  "banda",
  "norteno",
  "sierreno",
  "mariachi",
  "corridos",
  "corridos_tumbados",
  "corrido_mexicano",
  "regional_mexicano",
  "duranguense",
  "grupera",
  "cumbia",
  "cumbia_sonidera",
  "cumbia_rebajada",
  "salsa",
  "bachata",
  "merengue",
  "pop",
  "rock",
  "rock_urbano",
  "hip_hop",
  "rap",
  "reggaeton",
  "urbano_latino",
  "electronica",
  "house",
  "techno",
  "trance",
  "jazz",
  "blues",
  "boleros",
  "trova",
  "instrumental",
  "versatil",
  "son_jarocho",
  "huapango",
  "sonora",
]);

const BOOKABLE_COMMERCIAL_MODES = Object.freeze([
  "rent_short_term",
  "rent_hourly",
]);

const BOOKABLE_MODES_BY_CATEGORY = Object.freeze(
  Object.fromEntries(
    MUSIC_CATEGORIES.map((category) => [category, BOOKABLE_COMMERCIAL_MODES]),
  ),
);

const MUSIC_CATEGORY_I18N_KEYS = Object.freeze(
  Object.fromEntries(
    MUSIC_CATEGORIES.map((category) => [
      category,
      `client:common.enums.category.${category}`,
    ]),
  ),
);

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
    "chef",
    "photography",
    "catering",
    "maintenance",
  ]),
  music: MUSIC_CATEGORIES,
  vehicle: Object.freeze(["car", "suv", "pickup", "van", "motorcycle", "boat"]),
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
  music: BOOKABLE_COMMERCIAL_MODES,
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
    chef: Object.freeze(["rent_short_term", "rent_hourly"]),
    photography: Object.freeze(["rent_short_term", "rent_hourly"]),
    catering: Object.freeze(["rent_short_term", "rent_hourly"]),
    maintenance: Object.freeze(["rent_short_term", "rent_hourly"]),
  }),
  music: BOOKABLE_MODES_BY_CATEGORY,
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
  // property
  house: "client:common.enums.category.house",
  apartment: "client:common.enums.category.apartment",
  land: "client:common.enums.category.land",
  commercial: "client:common.enums.category.commercial",
  office: "client:common.enums.category.office",
  warehouse: "client:common.enums.category.warehouse",
  // service
  cleaning: "client:common.enums.category.cleaning",
  chef: "client:common.enums.category.chef",
  photography: "client:common.enums.category.photography",
  catering: "client:common.enums.category.catering",
  maintenance: "client:common.enums.category.maintenance",
  // music (auto-generated from MUSIC_CATEGORIES)
  ...MUSIC_CATEGORY_I18N_KEYS,
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
  return [
    ...(CATEGORY_BY_RESOURCE_TYPE[normalizedType] ||
      CATEGORY_BY_RESOURCE_TYPE.property),
  ];
};

export const getAllowedCommercialModes = (resourceType, category = "") => {
  const normalizedType = normalizeResourceType(resourceType);
  const normalizedCategory = normalizeCategory(category);
  const byCategory =
    COMMERCIAL_MODE_BY_RESOURCE_AND_CATEGORY[normalizedType]?.[
      normalizedCategory
    ];
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
