/**
 * Venue wizard profile (resourceType = "venue")
 * Human-first wizard configuration that maps UI -> canonical resources schema.
 *
 * Notes:
 * - Venues support short-term and hourly rentals:
 *   - rent_short_term => date_range
 *   - rent_hourly => time_slot
 * - Venue-specific details are stored in `attributes.*` per schema convention:
 *   venueCapacitySeated, venueCapacityStanding, venueHasStage, venueOpeningTime, venueClosingTime.
 * - For venue, hourly is allowed (unlike property).
 */

const RESOURCE_TYPE = "venue";

const VENUE_CATEGORIES = [
  "event_hall",
  "commercial_local",
  "studio",
  "coworking",
  "meeting_room",
];

const OFFERINGS = [
  {
    id: "rent_short_term",
    commercialMode: "rent_short_term",
    bookingType: "date_range",
    i18nLabelKey: "wizard.offerings.venue.rent_short_term.label",
    i18nHelpKey: "wizard.offerings.venue.rent_short_term.help",
  },
  {
    id: "rent_hourly",
    commercialMode: "rent_hourly",
    bookingType: "time_slot",
    i18nLabelKey: "wizard.offerings.venue.rent_hourly.label",
    i18nHelpKey: "wizard.offerings.venue.rent_hourly.help",
  },
];

/**
 * Human pricing choices, mapped to schema pricingModel enum.
 * Keep schema enum `total`, but display it as "Precio fijo" (UI id fixed_total).
 */
const PRICING_CHOICES = {
  fixed_total: { schemaPricingModel: "fixed_total", labelKey: "wizard.pricing.fixed_total" },
  per_day: { schemaPricingModel: "per_day", labelKey: "wizard.pricing.per_day" },
  per_hour: { schemaPricingModel: "per_hour", labelKey: "wizard.pricing.per_hour" },
  per_event: { schemaPricingModel: "per_event", labelKey: "wizard.pricing.per_event" },
};

function inferPricingChoiceId({ commercialMode, pricingModel }) {
  const defaultByMode =
    commercialMode === "rent_hourly"
      ? "per_hour"
      : commercialMode === "rent_short_term"
        ? "per_day"
        : "fixed_total";

  const allowedByMode = {
    rent_hourly: new Set(["fixed_total", "per_hour", "per_event"]),
    rent_short_term: new Set(["fixed_total", "per_day", "per_event"]),
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

const VENUE_ATTRIBUTE_KEYS = [
  "venueCapacitySeated",
  "venueCapacityStanding",
  "venueHasStage",
  "venueOpeningTime",
  "venueClosingTime",
];

/** Optional generic booking conditions for hourly operation */
const GENERIC_BOOKING_CONDITION_KEYS = [
  "bookingMinUnits",
  "bookingMaxUnits",
  "availabilityStartTime",
  "availabilityEndTime",
];

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
  return VENUE_CATEGORIES.map((id) => ({
    id,
    label: t(`wizard.categories.venue.${id}`),
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
        labelKey: "wizard.fields.venue.category.label",
        helpKey: "wizard.fields.venue.category.help",
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
        labelKey: "wizard.fields.venue.offering.label",
        helpKey: "wizard.fields.venue.offering.help",
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
      { key: "virtualTourUrl", type: "url", labelKey: "wizard.fields.virtualTourUrl.label", helpKey: "wizard.fields.virtualTourUrl.help", required: false },
    ];
  }

  if (stepId === "details") {
    return [
      {
        key: "attributes.venueCapacitySeated",
        type: "number",
        labelKey: "wizard.fields.venue.venueCapacitySeated.label",
        required: false,
        min: 0,
        max: 1000000,
      },
      {
        key: "attributes.venueCapacityStanding",
        type: "number",
        labelKey: "wizard.fields.venue.venueCapacityStanding.label",
        required: false,
        min: 0,
        max: 1000000,
      },
      {
        key: "attributes.venueHasStage",
        type: "boolean",
        labelKey: "wizard.fields.venue.venueHasStage.label",
        required: false,
      },
      {
        key: "attributes.venueOpeningTime",
        type: "time",
        labelKey: "wizard.fields.venue.venueOpeningTime.label",
        required: false,
      },
      {
        key: "attributes.venueClosingTime",
        type: "time",
        labelKey: "wizard.fields.venue.venueClosingTime.label",
        required: false,
      },
    ];
  }

  if (stepId === "conditions") {
    // For venues, conditions can include:
    // - generic min/max units for hourly (hours)
    // - availability window
    // - slot config (duration/buffer) for rent_hourly
    //
    // For short-term (date_range), we keep this step light (optional).
    const fields = [];

    // Availability window (attributes) - optional for both modes
    fields.push(
      {
        key: "attributes.availabilityStartTime",
        type: "time",
        labelKey: "wizard.fields.venue.availabilityStartTime.label",
        helpKey: "wizard.fields.venue.availabilityStartTime.help",
        required: false,
      },
      {
        key: "attributes.availabilityEndTime",
        type: "time",
        labelKey: "wizard.fields.venue.availabilityEndTime.label",
        helpKey: "wizard.fields.venue.availabilityEndTime.help",
        required: false,
      },
    );

    if (commercialMode === "rent_hourly") {
      fields.push(
        {
          key: "attributes.bookingMinUnits",
          type: "number",
          labelKey: "wizard.fields.venue.bookingMinUnits.hours.label",
          helpKey: "wizard.fields.venue.bookingMinUnits.hours.help",
          required: false,
          min: 1,
          max: 9999,
        },
        {
          key: "attributes.bookingMaxUnits",
          type: "number",
          labelKey: "wizard.fields.venue.bookingMaxUnits.hours.label",
          helpKey: "wizard.fields.venue.bookingMaxUnits.hours.help",
          required: false,
          min: 1,
          max: 9999,
        },
        {
          key: "slotDurationMinutes",
          type: "number",
          labelKey: "wizard.fields.venue.slotDurationMinutes.label",
          helpKey: "wizard.fields.venue.slotDurationMinutes.help",
          required: false,
          min: 15,
          max: 1440,
          suffixKey: "wizard.units.minutes",
        },
        {
          key: "slotBufferMinutes",
          type: "number",
          labelKey: "wizard.fields.venue.slotBufferMinutes.label",
          helpKey: "wizard.fields.venue.slotBufferMinutes.help",
          required: false,
          min: 0,
          max: 240,
          suffixKey: "wizard.units.minutes",
        },
      );
    }

    return fields;
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
    // Venues: fixed location is required.
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
      { key: "streetAddress", type: "text", labelKey: "wizard.fields.location.streetAddress.label", required: true },
      { key: "neighborhood", type: "text", labelKey: "wizard.fields.location.neighborhood.label", required: false },
      { key: "postalCode", type: "text", labelKey: "wizard.fields.location.postalCode.label", required: false },
      { key: "latitude", type: "number", labelKey: "wizard.fields.location.latitude.label", required: false },
      { key: "longitude", type: "number", labelKey: "wizard.fields.location.longitude.label", required: false },
    ];
  }

  return [];
}

/**
 * Sanitize attributes for venue:
 * keep venue keys + (optional) booking condition keys.
 */
function sanitizeAttributes({ attributes }) {
  const allowed = new Set([...VENUE_ATTRIBUTE_KEYS, ...GENERIC_BOOKING_CONDITION_KEYS]);

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
  if (formState?.virtualTourUrl) patch.virtualTourUrl = formState.virtualTourUrl;

  // Location root fields (venues require address)
  const locationKeys = ["streetAddress", "neighborhood", "city", "state", "country", "postalCode", "latitude", "longitude"];
  locationKeys.forEach((k) => {
    if (formState?.[k] !== undefined) patch[k] = formState[k];
  });

  // Slot config (root) - relevant for hourly overlap logic
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

export const venueProfile = {
  resourceType: RESOURCE_TYPE,
  getCategoryOptions,
  getOfferingOptions,
  getNarrativeSteps,
  getFieldsForStep,
  toSchemaPatch,
  sanitizeAttributes,
};

export default venueProfile;

