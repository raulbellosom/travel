/**
 * Vehicle wizard profile (resourceType = "vehicle")
 * Human-first wizard configuration that maps UI -> canonical resources schema.
 *
 * Notes:
 * - Vehicles support sale, long-term rent (manual contact) and short-term rent (date_range).
 * - The vehicle-specific details are stored in `attributes.*` per schema convention:
 *   vehicleModelYear, vehicleSeats, vehicleDoors, vehicleTransmission, vehicleFuelType, vehicleLuggageCapacity.
 * - Pricing is asked once and mapped to pricingModel based on offering.
 */

const RESOURCE_TYPE = "vehicle";

const VEHICLE_CATEGORIES = ["car", "suv", "pickup", "van", "motorcycle", "boat"];

/**
 * Human offering modes for vehicles.
 * We follow current product rules:
 * - sale => manual_contact
 * - rent_long_term => manual_contact
 * - rent_short_term => date_range
 * We intentionally omit rent_hourly for vehicles (based on current combinations policy).
 */
const OFFERINGS = [
  {
    id: "sell",
    commercialMode: "sale",
    bookingType: "manual_contact",
    i18nLabelKey: "wizard.offerings.vehicle.sell.label",
    i18nHelpKey: "wizard.offerings.vehicle.sell.help",
  },
  {
    id: "rent_long_term",
    commercialMode: "rent_long_term",
    bookingType: "manual_contact",
    i18nLabelKey: "wizard.offerings.vehicle.rent_long_term.label",
    i18nHelpKey: "wizard.offerings.vehicle.rent_long_term.help",
  },
  {
    id: "rent_short_term",
    commercialMode: "rent_short_term",
    bookingType: "date_range",
    i18nLabelKey: "wizard.offerings.vehicle.rent_short_term.label",
    i18nHelpKey: "wizard.offerings.vehicle.rent_short_term.help",
  },
];

/**
 * Human pricing choices, mapped to schema pricingModel enum.
 * Keep schema enum `total`, but display it as "Precio fijo" (UI id fixed_total).
 */
const PRICING_CHOICES = {
  fixed_total: { schemaPricingModel: "fixed_total", labelKey: "wizard.pricing.fixed_total" },
  per_month: { schemaPricingModel: "per_month", labelKey: "wizard.pricing.per_month" },
  per_day: { schemaPricingModel: "per_day", labelKey: "wizard.pricing.per_day" },
};

function getAllowedPricingChoiceIds({ commercialMode }) {
  if (commercialMode === "sale") return ["fixed_total"];
  if (commercialMode === "rent_long_term") return ["per_month", "fixed_total"];
  // rent_short_term
  return ["per_day"]; // strict per current matrix
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
  return VEHICLE_CATEGORIES.map((id) => ({
    id,
    label: t(`wizard.categories.vehicle.${id}`),
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
        labelKey: "wizard.fields.vehicle.category.label",
        helpKey: "wizard.fields.vehicle.category.help",
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
        labelKey: "wizard.fields.vehicle.offering.label",
        helpKey: "wizard.fields.vehicle.offering.help",
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
    // Vehicle details live in attributes.*
    return [
      { key: "attributes.vehicleModelYear", type: "number", labelKey: "wizard.fields.vehicle.vehicleModelYear.label", required: false, min: 1800, max: 2100 },
      { key: "attributes.vehicleSeats", type: "number", labelKey: "wizard.fields.vehicle.vehicleSeats.label", required: false, min: 1, max: 100 },
      { key: "attributes.vehicleDoors", type: "number", labelKey: "wizard.fields.vehicle.vehicleDoors.label", required: false, min: 0, max: 10 },
      {
        key: "attributes.vehicleTransmission",
        type: "select",
        labelKey: "wizard.fields.vehicle.vehicleTransmission.label",
        required: false,
        options: [
          { id: "manual", label: t("wizard.options.vehicleTransmission.manual") },
          { id: "automatic", label: t("wizard.options.vehicleTransmission.automatic") },
          { id: "cvt", label: t("wizard.options.vehicleTransmission.cvt") },
          { id: "unspecified", label: t("wizard.options.vehicleTransmission.unspecified") },
        ],
      },
      {
        key: "attributes.vehicleFuelType",
        type: "select",
        labelKey: "wizard.fields.vehicle.vehicleFuelType.label",
        required: false,
        options: [
          { id: "gasoline", label: t("wizard.options.vehicleFuelType.gasoline") },
          { id: "diesel", label: t("wizard.options.vehicleFuelType.diesel") },
          { id: "hybrid", label: t("wizard.options.vehicleFuelType.hybrid") },
          { id: "electric", label: t("wizard.options.vehicleFuelType.electric") },
          { id: "unspecified", label: t("wizard.options.vehicleFuelType.unspecified") },
        ],
      },
      {
        key: "attributes.vehicleLuggageCapacity",
        type: "select",
        labelKey: "wizard.fields.vehicle.vehicleLuggageCapacity.label",
        required: false,
        options: [
          { id: "small", label: t("wizard.options.vehicleLuggageCapacity.small") },
          { id: "medium", label: t("wizard.options.vehicleLuggageCapacity.medium") },
          { id: "large", label: t("wizard.options.vehicleLuggageCapacity.large") },
          { id: "unspecified", label: t("wizard.options.vehicleLuggageCapacity.unspecified") },
        ],
      },
    ];
  }

  if (stepId === "conditions") {
    // Vehicles currently have no extra conditions in matrix.
    // Keep this step empty (wizard can auto-skip empty steps).
    // If you later add rules (min days, delivery time, etc), add attributes here.
    const fields = [];

    // Optional: allow slot configuration only if rent_short_term uses date_range overlap logic.
    // But vehicles short-term is date_range in current rules; slot fields are not relevant.
    // Keep empty for now.

    return fields;
  }

  if (stepId === "price") {
    const allowedChoiceIds = getAllowedPricingChoiceIds({ commercialMode });
    const options = allowedChoiceIds
      .map((id) => PRICING_CHOICES[id])
      .filter(Boolean)
      .map((c, idx) => ({ id: allowedChoiceIds[idx], label: t(c.labelKey) }));

    return [
      {
        key: "pricingChoiceId",
        type: "select",
        labelKey: "wizard.fields.pricingChoice.label",
        helpKey: "wizard.fields.pricingChoice.help",
        options,
        required: true,
      },
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
    // Vehicles: city + state required by schema; address optional.
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
 * Sanitize attributes for vehicle:
 * keep only vehicle-related keys.
 */
function sanitizeAttributes({ attributes }) {
  const allowed = new Set([
    "vehicleModelYear",
    "vehicleSeats",
    "vehicleDoors",
    "vehicleTransmission",
    "vehicleFuelType",
    "vehicleLuggageCapacity",
  ]);

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

  // Price
  if (formState?.price !== undefined) patch.price = Number(formState.price);
  if (formState?.currency) patch.currency = formState.currency;
  if (formState?.priceNegotiable !== undefined) patch.priceNegotiable = Boolean(formState.priceNegotiable);

  // pricingModel derived from pricingChoiceId
  const choice = PRICING_CHOICES[formState?.pricingChoiceId];
  if (choice?.schemaPricingModel) patch.pricingModel = choice.schemaPricingModel;

  // Attributes
  const rawAttributes = { ...(formState?.attributes || {}) };
  const sanitized = sanitizeAttributes({ attributes: rawAttributes, context });

  patch.attributes = JSON.stringify(sanitized);

  return patch;
}

export const vehicleProfile = {
  resourceType: RESOURCE_TYPE,
  getCategoryOptions,
  getOfferingOptions,
  getNarrativeSteps,
  getFieldsForStep,
  toSchemaPatch,
  sanitizeAttributes,
};

export default vehicleProfile;

