/**
 * Property wizard profile (resourceType = "property")
 * Human-first wizard configuration that maps UI -> canonical resources schema.
 *
 * IMPORTANT:
 * - Do not expose internal backend terms in UI (pricingModel/bookingType/etc).
 * - This profile only defines what to ask, how to label it (via i18n keys),
 *   and how to translate answers into the canonical resource payload.
 *
 * Expected integration:
 * - Wizard uses `getNarrativeSteps()` to build the flow.
 * - Wizard uses `getFieldsForStep()` to render dynamic fields.
 * - Wizard stores answers in a generic `formState` (plain object).
 * - Wizard calls `toSchemaPatch()` before save/update.
 */

const RESOURCE_TYPE = "property";

/** Controlled categories for resourceType=property */
const PROPERTY_CATEGORIES = [
  "house",
  "apartment",
  "land",
  "commercial",
  "office",
  "warehouse",
];

/**
 * Human offering modes for Property.
 * We intentionally do NOT include hourly for property (hourly is for venue in current product rules).
 */
const OFFERINGS = [
  {
    id: "sell",
    commercialMode: "sale",
    bookingType: "manual_contact",
    i18nLabelKey: "wizard.offerings.property.sell.label",
    i18nHelpKey: "wizard.offerings.property.sell.help",
  },
  {
    id: "rent_long_term",
    commercialMode: "rent_long_term",
    bookingType: "manual_contact",
    i18nLabelKey: "wizard.offerings.property.rent_long_term.label",
    i18nHelpKey: "wizard.offerings.property.rent_long_term.help",
  },
  {
    id: "rent_short_term",
    commercialMode: "rent_short_term",
    bookingType: "date_range",
    i18nLabelKey: "wizard.offerings.property.rent_short_term.label",
    i18nHelpKey: "wizard.offerings.property.rent_short_term.help",
  },
];

/**
 * Pricing choices are human-facing (UI ids), then mapped to schema enum.
 * NOTE: We keep the schema enum `total` but display it as "Precio fijo" (UI id fixed_total).
 */
const PRICING_CHOICES = {
  fixed_total: { schemaPricingModel: "fixed_total", labelKey: "wizard.pricing.fixed_total" },
  per_m2: { schemaPricingModel: "per_m2", labelKey: "wizard.pricing.per_m2" },
  per_month: { schemaPricingModel: "per_month", labelKey: "wizard.pricing.per_month" },
  per_night: { schemaPricingModel: "per_night", labelKey: "wizard.pricing.per_night" },
  per_day: { schemaPricingModel: "per_day", labelKey: "wizard.pricing.per_day" },
};

/** Allowed pricing by category + offering (commercialMode). */
function getAllowedPricingChoiceIds({ category, commercialMode }) {
  // Sale: house/apartment/commercial/office/warehouse => fixed_total, per_m2
  if (commercialMode === "sale") return ["fixed_total", "per_m2"];

  if (commercialMode === "rent_long_term") {
    // land rent long-term: per_month, fixed_total, per_m2 (but conditions differ)
    return ["per_month", "fixed_total", "per_m2"];
  }

  if (commercialMode === "rent_short_term") {
    // Short-term:
    // - house/apartment: per_night, per_day, fixed_total
    // - land/commercial/office/warehouse: per_day, fixed_total
    if (category === "house" || category === "apartment") return ["per_night", "per_day", "fixed_total"];
    return ["per_day", "fixed_total"];
  }

  // Default fallback (should not happen for property profile)
  return ["fixed_total"];
}

function isResidential(category) {
  return category === "house" || category === "apartment";
}

function isBuiltSpace(category) {
  return category === "house" || category === "apartment" || category === "commercial" || category === "office" || category === "warehouse";
}

/**
 * Build the narrative steps (human-first).
 * Step ids are used by the wizard engine.
 */
function getNarrativeSteps({ t }) {
  // You may hide some steps if not applicable, but keep the narrative order.
  return [
    {
      id: "publishWhat",
      title: t("wizard.steps.publishWhat.title"),
      description: t("wizard.steps.publishWhat.description"),
    },
    {
      id: "howOffer",
      title: t("wizard.steps.howOffer.title"),
      description: t("wizard.steps.howOffer.description"),
    },
    {
      id: "describe",
      title: t("wizard.steps.describe.title"),
      description: t("wizard.steps.describe.description"),
    },
    {
      id: "details",
      title: t("wizard.steps.details.title"),
      description: t("wizard.steps.details.description"),
    },
    {
      id: "conditions",
      title: t("wizard.steps.conditions.title"),
      description: t("wizard.steps.conditions.description"),
    },
    {
      id: "price",
      title: t("wizard.steps.price.title"),
      description: t("wizard.steps.price.description"),
    },
    {
      id: "location",
      title: t("wizard.steps.location.title"),
      description: t("wizard.steps.location.description"),
    },
    {
      id: "review",
      title: t("wizard.steps.review.title"),
      description: t("wizard.steps.review.description"),
    },
  ];
}

function getCategoryOptions({ t }) {
  return PROPERTY_CATEGORIES.map((id) => ({
    id,
    label: t(`wizard.categories.property.${id}`),
  }));
}

function getOfferingOptions({ t }) {
  // Offerings are the same for all property categories right now.
  // If you later want different offerings per category, branch here.
  return OFFERINGS.map((o) => ({
    id: o.id,
    label: t(o.i18nLabelKey),
    help: o.i18nHelpKey ? t(o.i18nHelpKey) : undefined,
    // internal derivation (wizard stores these in context after selection)
    commercialMode: o.commercialMode,
    bookingType: o.bookingType,
  }));
}

/**
 * Field definitions by step.
 * The wizard engine renders these using a generic renderer.
 *
 * Key conventions:
 * - Root keys map to `resources` fields (title, bedrooms, etc).
 * - "attributes.<key>" maps to attributes JSON keys.
 */
function getFieldsForStep({ t, context, stepId }) {
  const { category, commercialMode } = context || {};

  if (stepId === "publishWhat") {
    return [
      {
        key: "category",
        type: "select",
        labelKey: "wizard.fields.property.category.label",
        helpKey: "wizard.fields.property.category.help",
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
        labelKey: "wizard.fields.property.offering.label",
        helpKey: "wizard.fields.property.offering.help",
        options: getOfferingOptions({ t, category }),
        required: true,
      },
    ];
  }

  if (stepId === "describe") {
    return [
      {
        key: "title",
        type: "text",
        labelKey: "wizard.fields.title.label",
        helpKey: "wizard.fields.title.help",
        required: true,
        minLength: 3,
      },
      {
        key: "description",
        type: "textarea",
        labelKey: "wizard.fields.description.label",
        helpKey: "wizard.fields.description.help",
        required: true,
        minLength: 20,
      },
      // Slug is optional; if the project still requires it, keep it but label it human-friendly.
      {
        key: "slug",
        type: "text",
        labelKey: "wizard.fields.slugPublic.label",
        helpKey: "wizard.fields.slugPublic.help",
        required: false,
      },
      {
        key: "imageFiles",
        type: "images",
        labelKey: "wizard.fields.images.label",
        helpKey: "wizard.fields.images.help",
        required: false,
      },
      {
        key: "videoUrl",
        type: "url",
        labelKey: "wizard.fields.videoUrl.label",
        helpKey: "wizard.fields.videoUrl.help",
        required: false,
      },
      {
        key: "virtualTourUrl",
        type: "url",
        labelKey: "wizard.fields.virtualTourUrl.label",
        helpKey: "wizard.fields.virtualTourUrl.help",
        required: false,
      },
    ];
  }

  if (stepId === "details") {
    const fields = [];

    // Bedrooms/bathrooms/parking: for built spaces and residential
    if (isBuiltSpace(category)) {
      if (isResidential(category)) {
        fields.push(
          {
            key: "bedrooms",
            type: "number",
            labelKey: "wizard.fields.property.bedrooms.label",
            required: false,
            min: 0,
            max: 50,
          },
        );
      }
      fields.push(
        {
          key: "bathrooms",
          type: "number",
          labelKey: "wizard.fields.property.bathrooms.label",
          required: false,
          min: 0,
          max: 50,
          step: 0.5,
        },
        {
          key: "parkingSpaces",
          type: "number",
          labelKey: "wizard.fields.property.parkingSpaces.label",
          required: false,
          min: 0,
          max: 100,
        },
      );
    }

    // Areas:
    fields.push({
      key: "totalArea",
      type: "number",
      labelKey: "wizard.fields.property.totalArea.label",
      helpKey: "wizard.fields.property.totalArea.help",
      required: false,
      min: 0,
      max: 999999,
      suffixKey: "wizard.units.m2",
    });

    if (isBuiltSpace(category)) {
      fields.push(
        {
          key: "builtArea",
          type: "number",
          labelKey: "wizard.fields.property.builtArea.label",
          required: false,
          min: 0,
          max: 999999,
          suffixKey: "wizard.units.m2",
        },
        {
          key: "floors",
          type: "number",
          labelKey: "wizard.fields.property.floors.label",
          required: false,
          min: 1,
          max: 200,
        },
        {
          key: "yearBuilt",
          type: "number",
          labelKey: "wizard.fields.property.yearBuilt.label",
          required: false,
          min: 1800,
          max: 2100,
        },
      );
    }

    return fields;
  }

  if (stepId === "conditions") {
    const fields = [];

    // Sale conditions: furnished (not for land)
    if (commercialMode === "sale" && category !== "land" && isBuiltSpace(category)) {
      fields.push({
        key: "furnished",
        type: "select",
        labelKey: "wizard.fields.property.furnished.label",
        helpKey: "wizard.fields.property.furnished.help",
        options: [
          { id: "unspecified", label: t("wizard.options.furnished.unspecified") },
          { id: "unfurnished", label: t("wizard.options.furnished.unfurnished") },
          { id: "semi_furnished", label: t("wizard.options.furnished.semi_furnished") },
          { id: "furnished", label: t("wizard.options.furnished.furnished") },
        ],
        required: false,
      });
    }

    // Long term rent: contract duration (always), furnished/pets for built spaces except land rule differences
    if (commercialMode === "rent_long_term") {
      // Minimum contract duration (stored in attributes)
      fields.push({
        key: "attributes.minimumContractDuration",
        type: "number",
        labelKey: "wizard.fields.property.minimumContractDuration.label",
        helpKey: "wizard.fields.property.minimumContractDuration.help",
        required: false,
        min: 1,
        max: 120,
        suffixKey: "wizard.units.months",
      });

      // For land: only contract duration (no furnished/pets per combinations rules)
      if (category !== "land" && isBuiltSpace(category)) {
        fields.push(
          {
            key: "furnished",
            type: "select",
            labelKey: "wizard.fields.property.furnished.label",
            options: [
              { id: "unspecified", label: t("wizard.options.furnished.unspecified") },
              { id: "unfurnished", label: t("wizard.options.furnished.unfurnished") },
              { id: "semi_furnished", label: t("wizard.options.furnished.semi_furnished") },
              { id: "furnished", label: t("wizard.options.furnished.furnished") },
            ],
            required: false,
          },
          {
            key: "petsAllowed",
            type: "boolean",
            labelKey: "wizard.fields.property.petsAllowed.label",
            helpKey: "wizard.fields.property.petsAllowed.help",
            required: false,
          },
        );
      }
    }

    // Short term rent: guest limits + stay nights + check-in/out (only for house/apartment)
    if (commercialMode === "rent_short_term" && isResidential(category)) {
      fields.push(
        {
          key: "maxGuests",
          type: "number",
          labelKey: "wizard.fields.property.maxGuests.label",
          required: false,
          min: 1,
          max: 500,
        },
        {
          key: "minStayNights",
          type: "number",
          labelKey: "wizard.fields.property.minStayNights.label",
          required: false,
          min: 1,
          max: 365,
        },
        {
          key: "maxStayNights",
          type: "number",
          labelKey: "wizard.fields.property.maxStayNights.label",
          required: false,
          min: 1,
          max: 365,
        },
        {
          key: "checkInTime",
          type: "time",
          labelKey: "wizard.fields.property.checkInTime.label",
          required: false,
        },
        {
          key: "checkOutTime",
          type: "time",
          labelKey: "wizard.fields.property.checkOutTime.label",
          required: false,
        },
      );
    }

    return fields;
  }

  if (stepId === "price") {
    const allowedChoiceIds = getAllowedPricingChoiceIds({ category, commercialMode });
    const options = allowedChoiceIds
      .map((id) => PRICING_CHOICES[id])
      .filter(Boolean)
      .map((c, idx) => ({
        id: allowedChoiceIds[idx],
        label: t(c.labelKey),
      }));

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
    return [
      {
        key: "country",
        type: "select",
        labelKey: "wizard.fields.location.country.label",
        options: [
          { id: "MX", label: t("wizard.countries.MX") },
          // Keep the list small; expand later via a shared countries dataset.
        ],
        required: false,
      },
      {
        key: "state",
        type: "text",
        labelKey: "wizard.fields.location.state.label",
        required: true,
        minLength: 2,
      },
      {
        key: "city",
        type: "text",
        labelKey: "wizard.fields.location.city.label",
        required: true,
        minLength: 2,
      },
      {
        key: "streetAddress",
        type: "text",
        labelKey: "wizard.fields.location.streetAddress.label",
        required: false,
      },
      {
        key: "neighborhood",
        type: "text",
        labelKey: "wizard.fields.location.neighborhood.label",
        required: false,
      },
      {
        key: "postalCode",
        type: "text",
        labelKey: "wizard.fields.location.postalCode.label",
        required: false,
      },
      {
        key: "latitude",
        type: "number",
        labelKey: "wizard.fields.location.latitude.label",
        required: false,
      },
      {
        key: "longitude",
        type: "number",
        labelKey: "wizard.fields.location.longitude.label",
        required: false,
      },
    ];
  }

  // review step is rendered from state summary; no fields.
  return [];
}

/**
 * Sanitize attributes based on context.
 * For property, most fields are root fields; attributes currently used for:
 * - minimumContractDuration (rent_long_term)
 */
function sanitizeAttributes({ attributes, context }) {
  const { commercialMode, category } = context || {};
  const safe = { ...(attributes || {}) };

  // Only keep minimumContractDuration when long term rent
  if (commercialMode !== "rent_long_term") {
    delete safe.minimumContractDuration;
  } else {
    // If category is land, keep only minimumContractDuration
    if (category === "land") {
      Object.keys(safe).forEach((k) => {
        if (k !== "minimumContractDuration") delete safe[k];
      });
    }
  }

  // Remove undefined/null
  Object.keys(safe).forEach((k) => {
    if (safe[k] === undefined || safe[k] === null || safe[k] === "") delete safe[k];
  });

  return safe;
}

/**
 * Convert wizard form state into a schema patch for `resources`.
 * - Derives: resourceType, commercialMode, bookingType, pricingModel
 * - Serializes attributes as JSON string
 */
function toSchemaPatch({ formState, context }) {
  const patch = {};

  // Canonical base
  patch.resourceType = RESOURCE_TYPE;

  // Category (required)
  if (formState?.category) patch.category = formState.category;

  // Offering derivation
  const offering = OFFERINGS.find((o) => o.id === formState?.offeringId);
  if (offering) {
    patch.commercialMode = offering.commercialMode;
    patch.bookingType = offering.bookingType;
  } else if (context?.commercialMode && context?.bookingType) {
    // fallback (wizard may already store derived fields in context)
    patch.commercialMode = context.commercialMode;
    patch.bookingType = context.bookingType;
  }

  // Title/description/slug
  if (formState?.title != null) patch.title = String(formState.title).trim();
  if (formState?.description != null) patch.description = String(formState.description).trim();
  if (formState?.slug != null && String(formState.slug).trim() !== "") patch.slug = String(formState.slug).trim();

  // Media fields
  if (Array.isArray(formState?.imageFiles) && formState.imageFiles.length > 0) {
    patch.imageFiles = formState.imageFiles.filter(
      (file) => file && typeof file === "object" && typeof file.name === "string",
    );
  }
  if (formState?.videoUrl) patch.videoUrl = formState.videoUrl;
  if (formState?.virtualTourUrl) patch.virtualTourUrl = formState.virtualTourUrl;

  // Root feature fields
  const rootKeys = [
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
    "streetAddress",
    "neighborhood",
    "city",
    "state",
    "country",
    "postalCode",
    "latitude",
    "longitude",
  ];

  rootKeys.forEach((k) => {
    if (formState?.[k] !== undefined) patch[k] = formState[k];
  });

  // Price fields
  if (formState?.price !== undefined) patch.price = Number(formState.price);
  if (formState?.currency) patch.currency = formState.currency;
  if (formState?.priceNegotiable !== undefined) patch.priceNegotiable = Boolean(formState.priceNegotiable);

  // Pricing model derivation from choice id
  const choice = PRICING_CHOICES[formState?.pricingChoiceId];
  if (choice?.schemaPricingModel) patch.pricingModel = choice.schemaPricingModel;

  // Attributes: gather only attribute.* keys from formState.attributes
  const rawAttributes = { ...(formState?.attributes || {}) };
  const sanitized = sanitizeAttributes({ attributes: rawAttributes, context: { ...context, category: formState?.category, commercialMode: patch.commercialMode } });

  patch.attributes = JSON.stringify(sanitized);

  return patch;
}

export const propertyProfile = {
  resourceType: RESOURCE_TYPE,
  getCategoryOptions,
  getOfferingOptions,
  getNarrativeSteps,
  getFieldsForStep,
  toSchemaPatch,
  sanitizeAttributes,
};

export default propertyProfile;

