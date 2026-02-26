/**
 * Experience wizard profile (resourceType = "experience")
 * Human-first wizard configuration that maps UI -> canonical resources schema.
 *
 * Notes:
 * - Experiences can be offered "Por evento / por dÃ­a" (rent_short_term + date_range)
 *   or "Por horas" (rent_hourly + time_slot).
 * - Experience-specific details are stored in `attributes.*` per schema convention:
 *   experienceDurationMinutes, experienceMinParticipants, experienceMaxParticipants,
 *   experienceDifficulty, experienceIncludesEquipment, experienceMinAge.
 * - Generic booking limits and availability windows are stored in `attributes`:
 *   bookingMinUnits, bookingMaxUnits, availabilityStartTime, availabilityEndTime.
 */

const RESOURCE_TYPE = "experience";

const EXPERIENCE_CATEGORIES = ["tour", "class", "workshop", "adventure", "wellness", "gastronomy"];

const OFFERINGS = [
  {
    id: "per_event_or_day",
    commercialMode: "rent_short_term",
    bookingType: "date_range",
    i18nLabelKey: "wizard.offerings.experience.per_event_or_day.label",
    i18nHelpKey: "wizard.offerings.experience.per_event_or_day.help",
  },
  {
    id: "per_hour",
    commercialMode: "rent_hourly",
    bookingType: "time_slot",
    i18nLabelKey: "wizard.offerings.experience.per_hour.label",
    i18nHelpKey: "wizard.offerings.experience.per_hour.help",
  },
];

/**
 * Human pricing choices, mapped to schema pricingModel enum.
 * Keep schema enum `total`, but display it as "Precio fijo" (UI id fixed_total).
 */
const PRICING_CHOICES = {
  fixed_total: { schemaPricingModel: "fixed_total", labelKey: "wizard.pricing.fixed_total" },
  per_hour: { schemaPricingModel: "per_hour", labelKey: "wizard.pricing.per_hour" },
  per_person: { schemaPricingModel: "per_person", labelKey: "wizard.pricing.per_person" },
  per_day: { schemaPricingModel: "per_day", labelKey: "wizard.pricing.per_day" },
  per_event: { schemaPricingModel: "per_event", labelKey: "wizard.pricing.per_event" },
};

function inferPricingChoiceId({ commercialMode, pricingModel }) {
  const defaultByMode =
    commercialMode === "rent_hourly"
      ? "per_hour"
      : commercialMode === "rent_short_term"
        ? "per_event"
        : "fixed_total";

  const allowedByMode = {
    rent_hourly: new Set(["fixed_total", "per_hour", "per_person", "per_event"]),
    rent_short_term: new Set(["fixed_total", "per_day", "per_person", "per_event"]),
  };

  const byExistingModel = Object.entries(PRICING_CHOICES).find(
    ([, choice]) => choice.schemaPricingModel === pricingModel,
  );
  const existingChoiceId = byExistingModel?.[0];
  if (existingChoiceId) {
    if (!commercialMode) return existingChoiceId;
    if (allowedByMode[commercialMode]?.has(existingChoiceId)) {
      return existingChoiceId;
    }
  }

  return defaultByMode;
}

const EXPERIENCE_ATTRIBUTE_KEYS = [
  "experienceDurationMinutes",
  "experienceMinParticipants",
  "experienceMaxParticipants",
  "experienceDifficulty",
  "experienceIncludesEquipment",
  "experienceMinAge",
];

const GENERIC_BOOKING_CONDITION_KEYS = [
  "bookingMinUnits",
  "bookingMaxUnits",
  "availabilityStartTime",
  "availabilityEndTime",
];

/** Experiences usually use participants for booking units */
function getUnitLabelVariant() {
  return "people";
}

function getNarrativeSteps({ t }) {
  return [
    { id: "publishWhat", title: t("wizard.steps.publishWhat.title"), description: t("wizard.steps.publishWhat.description") },
    { id: "howOffer", title: t("wizard.steps.howOffer.title"), description: t("wizard.steps.howOffer.description") },
    { id: "describe", title: t("wizard.steps.describe.title"), description: t("wizard.steps.describe.description") },
    { id: "details", title: t("wizard.steps.details.title"), description: t("wizard.steps.details.description") },
    { id: "conditions", title: t("wizard.steps.conditions.title"), description: t("wizard.steps.conditions.description") },
    { id: "price", title: t("wizard.steps.price.title"), description: t("wizard.steps.price.description") },
    { id: "location", title: t("wizard.steps.location.title"), description: t("wizard.steps.location.description") },
    { id: "review", title: t("wizard.steps.review.title"), description: t("wizard.steps.review.description") },
  ];
}

function getCategoryOptions({ t }) {
  return EXPERIENCE_CATEGORIES.map((id) => ({
    id,
    label: t(`wizard.categories.experience.${id}`),
  }));
}

function getOfferingOptions({ t }) {
  return OFFERINGS.map((o) => ({
    id: o.id,
    label: t(o.i18nLabelKey),
    help: o.i18nHelpKey ? t(o.i18nHelpKey) : undefined,
    commercialMode: o.commercialMode,
    bookingType: o.bookingType,
  }));
}

function getFieldsForStep({ t, context, stepId }) {
  const { commercialMode } = context || {};

  if (stepId === "publishWhat") {
    return [
      {
        key: "category",
        type: "select",
        labelKey: "wizard.fields.experience.category.label",
        helpKey: "wizard.fields.experience.category.help",
        options: getCategoryOptions({ t }),
        required: true,
      },
    ];
  }

  if (stepId === "howOffer") {
    return [
      {
        key: "offeringId",
        type: "select",
        labelKey: "wizard.fields.experience.offering.label",
        helpKey: "wizard.fields.experience.offering.help",
        options: getOfferingOptions({ t }),
        required: true,
      },
    ];
  }

  if (stepId === "describe") {
    return [
      { key: "title", type: "text", labelKey: "wizard.fields.title.label", helpKey: "wizard.fields.title.help", required: true, minLength: 3 },
      { key: "description", type: "textarea", labelKey: "wizard.fields.description.label", helpKey: "wizard.fields.description.help", required: true, minLength: 20 },
      { key: "slug", type: "text", labelKey: "wizard.fields.slugPublic.label", helpKey: "wizard.fields.slugPublic.help", required: false },
      { key: "imageFiles", type: "images", labelKey: "wizard.fields.images.label", helpKey: "wizard.fields.images.help", required: false },
      { key: "videoUrl", type: "url", labelKey: "wizard.fields.videoUrl.label", helpKey: "wizard.fields.videoUrl.help", required: false },
    ];
  }

  if (stepId === "details") {
    return [
      {
        key: "attributes.experienceDurationMinutes",
        type: "number",
        labelKey: "wizard.fields.experience.experienceDurationMinutes.label",
        helpKey: "wizard.fields.experience.experienceDurationMinutes.help",
        required: false,
        min: 15,
        max: 1440,
        suffixKey: "wizard.units.minutes",
      },
      {
        key: "attributes.experienceMinParticipants",
        type: "number",
        labelKey: "wizard.fields.experience.experienceMinParticipants.label",
        required: false,
        min: 1,
        max: 9999,
      },
      {
        key: "attributes.experienceMaxParticipants",
        type: "number",
        labelKey: "wizard.fields.experience.experienceMaxParticipants.label",
        required: false,
        min: 1,
        max: 9999,
      },
      {
        key: "attributes.experienceDifficulty",
        type: "select",
        labelKey: "wizard.fields.experience.experienceDifficulty.label",
        required: false,
        options: [
          { id: "easy", label: t("wizard.options.experienceDifficulty.easy") },
          { id: "medium", label: t("wizard.options.experienceDifficulty.medium") },
          { id: "hard", label: t("wizard.options.experienceDifficulty.hard") },
          { id: "unspecified", label: t("wizard.options.experienceDifficulty.unspecified") },
        ],
      },
      {
        key: "attributes.experienceIncludesEquipment",
        type: "boolean",
        labelKey: "wizard.fields.experience.experienceIncludesEquipment.label",
        required: false,
      },
      {
        key: "attributes.experienceMinAge",
        type: "number",
        labelKey: "wizard.fields.experience.experienceMinAge.label",
        required: false,
        min: 0,
        max: 120,
        suffixKey: "wizard.units.years",
      },
      {
        key: "amenities",
        type: "amenities",
        labelKey: "propertyForm.amenities.searchLabel",
        helpKey: "propertyForm.amenitiesHelp",
        required: false,
      },
    ];
  }

  if (stepId === "conditions") {
    const unitVariant = getUnitLabelVariant();

    return [
      {
        key: "attributes.bookingMinUnits",
        type: "number",
        labelKey: `wizard.fields.experience.bookingMinUnits.${unitVariant}.label`,
        helpKey: `wizard.fields.experience.bookingMinUnits.${unitVariant}.help`,
        required: false,
        min: 1,
        max: 9999,
      },
      {
        key: "attributes.bookingMaxUnits",
        type: "number",
        labelKey: `wizard.fields.experience.bookingMaxUnits.${unitVariant}.label`,
        helpKey: `wizard.fields.experience.bookingMaxUnits.${unitVariant}.help`,
        required: false,
        min: 1,
        max: 9999,
      },
      {
        key: "attributes.availabilityStartTime",
        type: "time",
        labelKey: "wizard.fields.experience.availabilityStartTime.label",
        helpKey: "wizard.fields.experience.availabilityStartTime.help",
        required: false,
      },
      {
        key: "attributes.availabilityEndTime",
        type: "time",
        labelKey: "wizard.fields.experience.availabilityEndTime.label",
        helpKey: "wizard.fields.experience.availabilityEndTime.help",
        required: false,
      },
      ...(commercialMode === "rent_hourly"
        ? [
            {
              key: "slotDurationMinutes",
              type: "number",
              labelKey: "wizard.fields.experience.slotDurationMinutes.label",
              helpKey: "wizard.fields.experience.slotDurationMinutes.help",
              required: false,
              min: 15,
              max: 1440,
              suffixKey: "wizard.units.minutes",
            },
            {
              key: "slotBufferMinutes",
              type: "number",
              labelKey: "wizard.fields.experience.slotBufferMinutes.label",
              helpKey: "wizard.fields.experience.slotBufferMinutes.help",
              required: false,
              min: 0,
              max: 240,
              suffixKey: "wizard.units.minutes",
            },
          ]
        : []),
    ];
  }

  if (stepId === "price") {
    return [
      {
        key: "price",
        type: "currencyAmount",
        labelKey: "wizard.fields.price.label",
        helpKey: "wizard.fields.price.help",
        required: true,
        min: 0,
        max: 999999999,
      },
      {
        key: "currency",
        type: "select",
        labelKey: "wizard.fields.currency.label",
        options: [
          { id: "MXN", label: "MXN" },
          { id: "USD", label: "USD" },
          { id: "EUR", label: "EUR" },
        ],
        required: false,
      },
      {
        key: "priceNegotiable",
        type: "boolean",
        labelKey: "wizard.fields.priceNegotiable.label",
        helpKey: "wizard.fields.priceNegotiable.help",
        required: false,
      },
    ];
  }

  if (stepId === "location") {
    // Experiences: city + state required by schema; address optional.
    return [
      {
        key: "country",
        type: "select",
        labelKey: "wizard.fields.location.country.label",
        options: [{ id: "MX", label: t("wizard.countries.MX") }],
        required: false,
      },
      { key: "state", type: "text", labelKey: "wizard.fields.location.state.label", required: true, minLength: 2 },
      { key: "city", type: "text", labelKey: "wizard.fields.location.city.label", required: true, minLength: 2 },
      { key: "streetAddress", type: "text", labelKey: "wizard.fields.location.streetAddress.label", required: false },
      { key: "neighborhood", type: "text", labelKey: "wizard.fields.location.neighborhood.label", required: false },
      { key: "postalCode", type: "text", labelKey: "wizard.fields.location.postalCode.label", required: false },
      { key: "latitude", type: "number", labelKey: "wizard.fields.location.latitude.label", required: false },
      { key: "longitude", type: "number", labelKey: "wizard.fields.location.longitude.label", required: false },
    ];
  }

  return [];
}

/**
 * Sanitize attributes for experience:
 * keep only experience keys + generic booking condition keys.
 */
function sanitizeAttributes({ attributes }) {
  const allowed = new Set([...EXPERIENCE_ATTRIBUTE_KEYS, ...GENERIC_BOOKING_CONDITION_KEYS]);

  const safe = {};
  Object.entries(attributes || {}).forEach(([k, v]) => {
    if (!allowed.has(k)) return;
    if (v === undefined || v === null || v === "") return;
    safe[k] = v;
  });

  return safe;
}

function toSchemaPatch({ formState, context }) {
  const patch = {};
  patch.resourceType = RESOURCE_TYPE;

  if (formState?.category) patch.category = formState.category;

  const offering = OFFERINGS.find((o) => o.id === formState?.offeringId);
  if (offering) {
    patch.commercialMode = offering.commercialMode;
    patch.bookingType = offering.bookingType;
  } else if (context?.commercialMode && context?.bookingType) {
    patch.commercialMode = context.commercialMode;
    patch.bookingType = context.bookingType;
  }

  // Core descriptive fields
  if (formState?.title != null) patch.title = String(formState.title).trim();
  if (formState?.description != null) patch.description = String(formState.description).trim();
  if (formState?.slug != null && String(formState.slug).trim() !== "") patch.slug = String(formState.slug).trim();

  // Media
  if (Array.isArray(formState?.imageFiles) && formState.imageFiles.length > 0) {
    patch.imageFiles = formState.imageFiles.filter(
      (file) => file && typeof file === "object" && typeof file.name === "string",
    );
  }
  if (formState?.videoUrl) patch.videoUrl = formState.videoUrl;

  // Location root fields
  const locationKeys = ["streetAddress", "neighborhood", "city", "state", "country", "postalCode", "latitude", "longitude"];
  locationKeys.forEach((k) => {
    if (formState?.[k] !== undefined) patch[k] = formState[k];
  });

  if (Array.isArray(formState?.amenities)) {
    patch.amenities = Array.from(
      new Set(
        formState.amenities
          .map((slug) => String(slug || "").trim())
          .filter(Boolean),
      ),
    );
  }

  // Optional slot config (root)
  if (formState?.slotDurationMinutes !== undefined) patch.slotDurationMinutes = formState.slotDurationMinutes;
  if (formState?.slotBufferMinutes !== undefined) patch.slotBufferMinutes = formState.slotBufferMinutes;

  // Price
  if (formState?.price !== undefined) patch.price = Number(formState.price);
  if (formState?.currency) patch.currency = formState.currency;
  if (formState?.priceNegotiable !== undefined) patch.priceNegotiable = Boolean(formState.priceNegotiable);

  const resolvedPricingChoiceId =
    formState?.pricingChoiceId ||
    inferPricingChoiceId({
      commercialMode: patch.commercialMode || context?.commercialMode,
      pricingModel: formState?.pricingModel,
    });
  const choice = PRICING_CHOICES[resolvedPricingChoiceId];
  if (choice?.schemaPricingModel) {
    patch.pricingModel = choice.schemaPricingModel;
  } else if (formState?.pricingModel) {
    patch.pricingModel = formState.pricingModel;
  }

  // Attributes
  const rawAttributes = { ...(formState?.attributes || {}) };
  const sanitized = sanitizeAttributes({ attributes: rawAttributes, context });

  patch.attributes = JSON.stringify(sanitized);

  return patch;
}

export const experienceProfile = {
  resourceType: RESOURCE_TYPE,
  getCategoryOptions,
  getOfferingOptions,
  getNarrativeSteps,
  getFieldsForStep,
  toSchemaPatch,
  sanitizeAttributes,
};

export default experienceProfile;

