/**
 * wizard/wizardMapping.js
 * Builds derived context from user selections and produces the final patch for save.
 *
 * Responsibilities:
 * - Derive commercialMode/bookingType from offeringId using profile.getOfferingOptions()
 * - Keep derived context in a single place (used by wizard for filtering fields/options)
 * - Build final patch using profile.toSchemaPatch()
 *
 * Notes:
 * - profile.toSchemaPatch() must output:
 *   { resourceType, category, commercialMode, bookingType, pricingModel, ... , attributes: "<json-string>" }
 * - Wizard formState keeps attributes as an object. toSchemaPatch serializes it.
 */

export function buildContextFromSelection(profile, formState) {
  const resourceType = profile?.resourceType || formState?.resourceType || "property";
  const category = formState?.category || "";

  // derive offering -> commercialMode + bookingType
  let commercialMode = "";
  let bookingType = "";

  const offeringId = formState?.offeringId || "";
  if (profile?.getOfferingOptions && offeringId) {
    // getOfferingOptions may depend on category
    const opts = profile.getOfferingOptions({
      // t is not required here because we only need ids/derived internal values
      t: (k) => k,
      category,
    });

    const selected = Array.isArray(opts) ? opts.find((o) => o.id === offeringId) : null;
    if (selected) {
      commercialMode = selected.commercialMode || "";
      bookingType = selected.bookingType || "";
    }
  }

  // In edit mode, values may already exist on formState.
  // bookingType can be explicitly overridden by the user (e.g. manual contact).
  commercialMode = commercialMode || formState?.commercialMode || "";
  bookingType = formState?.bookingType || bookingType || "";

  return {
    resourceType,
    category,
    commercialMode,
    bookingType,
  };
}

/**
 * Build final patch for saving a resource.
 * - Normalizes formState before passing to profile
 * - Uses profile.toSchemaPatch as single source of mapping truth
 */
export function buildPatchForSave(profile, formState, context) {
  if (!profile?.toSchemaPatch) {
    throw new Error("Profile is missing toSchemaPatch()");
  }

  // Ensure attributes is an object
  const safeFormState = {
    ...(formState || {}),
    attributes:
      formState?.attributes && typeof formState.attributes === "object"
        ? formState.attributes
        : {},
  };

  const patch = profile.toSchemaPatch({
    formState: safeFormState,
    context: context || {},
  });

  return patch;
}

/**
 * Optional helper: derive UI pricingChoiceId from an existing resource document.
 * This is useful in edit mode when the backend already has pricingModel.
 *
 * Since each profile defines its own PRICING_CHOICES mapping internally,
 * the wizard engine can call this if the profile provides a custom implementation later.
 *
 * For now, profiles handle pricingChoiceId on create; edit mode can default to:
 * - set pricingChoiceId = "fixed_total" if pricingModel is "total"
 * - else set it to the same enum value (per_day, per_hour, per_month, etc.) if your UI choice ids match.
 */
export function guessPricingChoiceIdFromPricingModel(pricingModel) {
  if (!pricingModel) return "";
  if (pricingModel === "total") return "fixed_total";
  // Common enums match the choice ids we used: per_day, per_hour, per_month, per_night, per_person, per_event, per_m2
  return pricingModel;
}
