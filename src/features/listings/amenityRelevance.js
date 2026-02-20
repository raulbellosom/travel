/**
 * Amenity relevance scoring for sorting amenities by resource type and category.
 */

/**
 * Priority categories and keywords per resource type.
 * Categories are ordered by priority (first = highest).
 */
export const RESOURCE_AMENITY_RELEVANCE = Object.freeze({
  property: Object.freeze({
    categories: Object.freeze(["general", "services", "tech", "security", "outdoor"]),
    keywords: Object.freeze([
      "furnished",
      "kitchen",
      "parking",
      "wifi",
      "air",
      "pet",
      "garden",
      "pool",
      "security",
      "elevator",
      "meeting",
      "conference",
      "warehouse",
      "water",
      "electricity",
    ]),
  }),
  vehicle: Object.freeze({
    categories: Object.freeze(["services", "tech", "security", "general"]),
    keywords: Object.freeze([
      "gps",
      "bluetooth",
      "parking",
      "sensor",
      "camera",
      "leather",
      "sunroof",
      "panoramic",
      "sound",
      "insurance",
      "mileage",
      "child",
      "seat",
      "driver",
      "automatic",
      "transmission",
      "cruise",
      "usb",
      "roadside",
      "assistance",
      "4wd",
      "awd",
      "roof-rack",
      "ev",
      "charger",
      "covered",
      "valet",
      "security",
      "cctv",
    ]),
  }),
  service: Object.freeze({
    categories: Object.freeze(["services", "tech", "general", "security"]),
    keywords: Object.freeze([
      "materials",
      "location",
      "domicilio",
      "24-7",
      "available",
      "bilingual",
      "certified",
      "portfolio",
      "professional",
      "equipment",
      "guarantee",
      "quote",
      "flexible",
      "scheduling",
      "experienced",
      "eco-friendly",
      "wifi",
      "workspace",
      "parking",
      "security",
      "maintenance",
      "concierge",
      "meeting",
    ]),
  }),
  experience: Object.freeze({
    categories: Object.freeze(["services", "outdoor", "general", "tech"]),
    keywords: Object.freeze([
      "guide",
      "guia",
      "spanish",
      "english",
      "equipment",
      "beginner",
      "kid",
      "exclusive",
      "photo",
      "video",
      "transport",
      "food",
      "drinks",
      "small-groups",
      "certification",
      "local",
      "expert",
      "private",
      "rain",
      "shine",
      "all-skill",
      "outdoor",
      "garden",
      "beach",
      "mountain",
      "pool",
      "wifi",
      "parking",
      "family",
      "security",
    ]),
  }),
  venue: Object.freeze({
    categories: Object.freeze(["services", "tech", "general", "security", "outdoor"]),
    keywords: Object.freeze([
      "sound",
      "audio",
      "lighting",
      "stage",
      "projector",
      "screen",
      "furniture",
      "commercial-kitchen",
      "prep",
      "coat-check",
      "dressing",
      "camerino",
      "terrace",
      "capacity",
      "tables",
      "chairs",
      "decor",
      "event-security",
      "dance",
      "floor",
      "catering",
      "dj",
      "booth",
      "bridal",
      "outdoor-ceremony",
      "acoustic",
      "green-screen",
      "natural-light",
      "blackout",
      "high-speed",
      "conference",
      "meeting",
      "parking",
      "valet",
      "wifi",
      "security",
      "cctv",
      "workspace",
    ]),
  }),
});

/**
 * Additional keywords by resource category (sub-type).
 */
export const CATEGORY_AMENITY_KEYWORDS = Object.freeze({
  // Property categories
  land: Object.freeze(["water", "electricity", "sewer", "paved", "perimeter"]),
  warehouse: Object.freeze(["loading", "dock", "warehouse", "parking"]),
  office: Object.freeze(["meeting", "conference", "workspace", "fiber", "wifi"]),
  commercial: Object.freeze(["parking", "street", "signage", "conference", "security"]),
  house: Object.freeze(["garden", "pool", "parking", "pet", "furnished"]),
  apartment: Object.freeze(["elevator", "parking", "security", "gym", "pool"]),

  // Vehicle categories
  car: Object.freeze(["bluetooth", "gps", "leather", "automatic", "insurance"]),
  suv: Object.freeze(["4wd", "awd", "roof-rack", "leather", "gps"]),
  pickup: Object.freeze(["4wd", "roof-rack", "automatic"]),
  van: Object.freeze(["child-seat", "bluetooth", "insurance"]),
  motorcycle: Object.freeze(["gps", "insurance"]),
  boat: Object.freeze(["dock", "security", "gps", "life"]),

  // Service categories
  cleaning: Object.freeze(["materials", "eco-friendly", "flexible", "professional"]),
  dj: Object.freeze(["professional", "equipment", "portfolio"]),
  chef: Object.freeze(["certified", "materials", "location"]),
  photography: Object.freeze(["professional", "equipment", "portfolio"]),
  catering: Object.freeze(["materials", "certified", "bilingual"]),
  maintenance: Object.freeze(["guarantee", "materials", "available"]),

  // Experience categories
  tour: Object.freeze(["guide", "transport", "food", "photo", "local"]),
  class: Object.freeze(["beginner", "equipment", "certification", "all-skill"]),
  workshop: Object.freeze(["materials", "certification", "beginner", "equipment"]),
  adventure: Object.freeze(["equipment", "guide", "transport", "photo", "rain"]),
  wellness: Object.freeze(["private", "beginner", "equipment"]),
  gastronomy: Object.freeze(["food", "drinks", "local", "guide", "small-groups"]),

  // Venue categories
  event_hall: Object.freeze(["sound", "lighting", "stage", "catering", "dance", "capacity"]),
  commercial_local: Object.freeze(["street", "signage", "parking", "wifi"]),
  studio: Object.freeze(["acoustic", "natural-light", "green-screen", "wifi"]),
  coworking: Object.freeze(["workspace", "wifi", "meeting", "conference", "high-speed"]),
  meeting_room: Object.freeze(["meeting", "conference", "wifi", "workspace", "projector"]),
});

/**
 * Normalize text for search comparison (remove accents, lowercase).
 */
const normalizeSearchableText = (value) =>
  String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

/**
 * Check if the text includes any of the keywords.
 */
const includesAnyKeyword = (text, keywords = []) =>
  keywords.some((keyword) => keyword && text.includes(keyword));

/**
 * Calculate relevance score for an amenity based on resource type and category.
 *
 * @param {Object} params
 * @param {Object} params.item - The amenity item
 * @param {string} params.resourceType - Resource type (property, vehicle, etc.)
 * @param {string} params.category - Resource category (house, car, tour, etc.)
 * @returns {number} Relevance score (higher = more relevant)
 */
export const getAmenityRelevanceScore = ({ item, resourceType, category }) => {
  const profile =
    RESOURCE_AMENITY_RELEVANCE[resourceType] ||
    RESOURCE_AMENITY_RELEVANCE.property;

  // Calculate category score based on amenity category priority
  const categoryWeights = new Map(
    (profile.categories || []).map((entry, index) => [
      entry,
      Math.max(1, profile.categories.length - index),
    ]),
  );
  const categoryScore = (categoryWeights.get(item.category) || 0) * 10;

  // Build searchable text from amenity
  const searchable = normalizeSearchableText(
    `${item.slug || ""} ${item.name_es || ""} ${item.name_en || ""}`,
  );

  // Calculate keyword score
  let keywordScore = 0;
  if (includesAnyKeyword(searchable, profile.keywords || [])) {
    keywordScore += 7;
  }
  if (includesAnyKeyword(searchable, CATEGORY_AMENITY_KEYWORDS[category] || [])) {
    keywordScore += 12;
  }

  return categoryScore + keywordScore;
};
