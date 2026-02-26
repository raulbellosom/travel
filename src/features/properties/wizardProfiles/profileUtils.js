/**
 * wizardProfiles/profileUtils.js
 * Shared helpers for wizard profiles + wizard engine.
 *
 * Goals:
 * - Handle attributes JSON (string <-> object)
 * - Skip empty steps
 * - Build field lists safely
 * - Apply profile patch to an existing document (edit mode)
 */

export function parseAttributes(attributesValue) {
  if (!attributesValue) return {};
  if (typeof attributesValue === "object") return attributesValue; // already parsed
  if (typeof attributesValue !== "string") return {};
  try {
    const parsed = JSON.parse(attributesValue);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

export function serializeAttributes(attributesObject) {
  const obj = attributesObject && typeof attributesObject === "object" ? attributesObject : {};
  try {
    return JSON.stringify(obj);
  } catch {
    // Fall back to empty object string to avoid breaking saves
    return "{}";
  }
}

export function isEmptyFields(fields) {
  return !Array.isArray(fields) || fields.length === 0;
}

const CATEGORY_RESOURCE_TYPE_MAP = Object.freeze({
  // property
  house: "property",
  apartment: "property",
  land: "property",
  commercial: "property",
  office: "property",
  warehouse: "property",

  // service
  cleaning: "service",
  chef: "service",
  photography: "service",
  catering: "service",
  maintenance: "service",

  // music
  dj: "music",
  banda: "music",
  norteno: "music",
  sierreno: "music",
  mariachi: "music",
  corridos: "music",
  corridos_tumbados: "music",
  corrido_mexicano: "music",
  regional_mexicano: "music",
  duranguense: "music",
  grupera: "music",
  cumbia: "music",
  cumbia_sonidera: "music",
  cumbia_rebajada: "music",
  salsa: "music",
  bachata: "music",
  merengue: "music",
  pop: "music",
  rock: "music",
  rock_urbano: "music",
  hip_hop: "music",
  rap: "music",
  reggaeton: "music",
  urbano_latino: "music",
  electronica: "music",
  techno: "music",
  trance: "music",
  jazz: "music",
  blues: "music",
  boleros: "music",
  trova: "music",
  instrumental: "music",
  versatil: "music",
  son_jarocho: "music",
  huapango: "music",
  sonora: "music",

  // vehicle
  car: "vehicle",
  suv: "vehicle",
  pickup: "vehicle",
  van: "vehicle",
  motorcycle: "vehicle",
  boat: "vehicle",

  // experience
  tour: "experience",
  class: "experience",
  workshop: "experience",
  adventure: "experience",
  wellness: "experience",
  gastronomy: "experience",

  // venue
  event_hall: "venue",
  commercial_local: "venue",
  studio: "venue",
  coworking: "venue",
  meeting_room: "venue",
});

function inferResourceTypeFromDocument(doc = {}) {
  const explicit = String(doc.resourceType || "")
    .trim()
    .toLowerCase();
  const category = String(doc.category || "")
    .trim()
    .toLowerCase();

  // Backward compatibility for data created before `dj` moved to music.
  if (explicit === "service" && category === "dj") {
    return "music";
  }

  if (explicit) return explicit;
  if (category && CATEGORY_RESOURCE_TYPE_MAP[category]) {
    return CATEGORY_RESOURCE_TYPE_MAP[category];
  }
  return "property";
}

/**
 * Some profiles may return empty fields for a step.
 * Wizard can auto-skip them using this helper.
 */
export function getActiveSteps(profile, t, context) {
  const steps = profile?.getNarrativeSteps ? profile.getNarrativeSteps({ t, context }) : [];
  if (!Array.isArray(steps)) return [];

  return steps.filter((step) => {
    const fields = profile?.getFieldsForStep
      ? profile.getFieldsForStep({ t, context, stepId: step.id })
      : [];
    return !isEmptyFields(fields) || step.id === "review"; // keep review always
  });
}

/**
 * Get fields for the step (safe).
 */
export function getStepFields(profile, t, context, stepId) {
  if (!profile?.getFieldsForStep) return [];
  const fields = profile.getFieldsForStep({ t, context, stepId });
  return Array.isArray(fields) ? fields : [];
}

/**
 * Merge a patch into a base resource document.
 * - Does not mutate inputs.
 * - If patch.attributes is JSON string, it stays string.
 */
export function mergePatch(baseDoc, patch) {
  return {
    ...(baseDoc || {}),
    ...(patch || {}),
  };
}

/**
 * Hydrate wizard formState from a resource document (edit mode).
 *
 * Expected wizard state shape:
 *   formState = { ...rootFields, attributes: { ... } }
 *
 * This helper:
 * - copies selected root keys
 * - parses attributes JSON string into formState.attributes
 */
export function hydrateFormStateFromResource(resourceDoc) {
  const doc = resourceDoc || {};
  const formState = {};
  const inferredResourceType = inferResourceTypeFromDocument(doc);

  // copy most common editable fields
  const keys = [
    "resourceType",
    "category",
    "commercialMode",
    "bookingType",
    "pricingModel",
    "title",
    "slug",
    "description",
    "price",
    "currency",
    "priceNegotiable",
    "streetAddress",
    "neighborhood",
    "city",
    "state",
    "country",
    "postalCode",
    "latitude",
    "longitude",
    "bedrooms",
    "bathrooms",
    "parkingSpaces",
    "totalArea",
    "builtArea",
    "floors",
    "yearBuilt",
    "maxGuests",
    "furnished",
    "petsAllowed",
    "minStayNights",
    "maxStayNights",
    "checkInTime",
    "checkOutTime",
    "slotDurationMinutes",
    "slotBufferMinutes",
    "videoUrl",
    "virtualTourUrl",
    "amenities",
    "galleryImageIds",
  ];

  keys.forEach((k) => {
    if (doc[k] !== undefined) formState[k] = doc[k];
  });

  formState.resourceType = inferredResourceType;

  // attributes JSON -> object
  formState.attributes = parseAttributes(doc.attributes);

  // Note: offeringId and pricingChoiceId are UI-only and must be re-derived.
  // Wizard should compute them by comparing derived values in the profile when entering edit mode.

  return formState;
}

/**
 * Clean a formState before saving:
 * - Ensure attributes is object
 * - Drop empty strings in attributes
 */
export function normalizeFormState(formState) {
  const next = { ...(formState || {}) };
  next.attributes = parseAttributes(next.attributes);

  Object.keys(next.attributes).forEach((k) => {
    const v = next.attributes[k];
    if (v === undefined || v === null || v === "") delete next.attributes[k];
  });

  return next;
}
