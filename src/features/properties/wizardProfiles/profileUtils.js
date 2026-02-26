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
