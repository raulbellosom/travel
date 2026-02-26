/**
 * Service wizard profile (resourceType = "service")
 * Human-first wizard configuration that maps UI -> canonical resources schema.
 *
 * Notes:
 * - Services can be offered "Por evento / por dÃ­a" (rent_short_term + date_range)
 *   or "Por horas" (rent_hourly + time_slot).
 * - Generic booking limits and availability windows are stored in `attributes`:
 *   bookingMinUnits, bookingMaxUnits, availabilityStartTime, availabilityEndTime.
 * - Category-specific details are stored in `attributes.<key>`.
 */

const RESOURCE_TYPE = "service";

const SERVICE_CATEGORIES = [
  "cleaning",
  "chef",
  "photography",
  "catering",
  "maintenance",
];

/**
 * Human offering modes for services.
 * - short_term => date_range (book by date range)
 * - hourly => time_slot (book by time slots)
 */
const OFFERINGS = [
  {
    id: "per_event_or_day",
    commercialMode: "rent_short_term",
    bookingType: "date_range",
    i18nLabelKey: "wizard.offerings.service.per_event_or_day.label",
    i18nHelpKey: "wizard.offerings.service.per_event_or_day.help",
  },
  {
    id: "per_hour",
    commercialMode: "rent_hourly",
    bookingType: "time_slot",
    i18nLabelKey: "wizard.offerings.service.per_hour.label",
    i18nHelpKey: "wizard.offerings.service.per_hour.help",
  },
];

function getDefaultBookingTypeForCommercialMode(commercialMode) {
  if (commercialMode === "rent_hourly") return "time_slot";
  if (commercialMode === "rent_short_term") return "date_range";
  return "manual_contact";
}

/**
 * Human pricing choices, mapped to schema pricingModel enum.
 * Keep schema enum `total`, but display it as "Precio fijo" (UI id fixed_total).
 */
const PRICING_CHOICES = {
  fixed_total: { schemaPricingModel: "fixed_total", labelKey: "wizard.pricing.fixed_total" },
  per_day: { schemaPricingModel: "per_day", labelKey: "wizard.pricing.per_day" },
  per_hour: { schemaPricingModel: "per_hour", labelKey: "wizard.pricing.per_hour" },
  per_person: { schemaPricingModel: "per_person", labelKey: "wizard.pricing.per_person" },
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

/** Category-specific attribute keys to keep */
const ATTRIBUTE_KEYS_BY_CATEGORY = {
  cleaning: ["cleaningType", "cleaningMaxArea", "cleaningStaffCount", "cleaningIncludesSupplies"],
  chef: ["chefCuisineType", "chefMaxDiners", "chefIncludesIngredients", "chefIncludesTableware", "chefTravelsToLocation"],
  photography: ["photoSpecialty", "photoEditedCount", "photoIncludesVideo", "photoTravelsToLocation"],
  catering: ["cateringServiceType", "cateringMinGuests", "cateringMaxGuests", "cateringIncludesWaiters", "cateringIncludesSetup", "cateringIncludesTableware"],
  maintenance: ["maintenanceSpecialty", "maintenanceIncludesMaterials", "maintenanceEmergencyService", "maintenanceWarranty", "maintenanceResponseTimeHours"],
};

/**
 * Booking condition keys for non-property services.
 * These stay under attributes (generic).
 */
const GENERIC_BOOKING_CONDITION_KEYS = [
  "bookingMinUnits",
  "bookingMaxUnits",
  "availabilityStartTime",
  "availabilityEndTime",
  "manualContactScheduleType",
];

/**
 * Some categories need different labels for booking units.
 * - chef/catering: people
 * - cleaning/maintenance/photography: units (default)
 */
function getUnitLabelVariant(category) {
  if (category === "chef" || category === "catering") return "people";
  return "units"; // generic/hours-like
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
  return SERVICE_CATEGORIES.map((id) => ({
    id,
    label: t(`wizard.categories.service.${id}`),
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

function getBookingTypeOptions({ t, commercialMode, paymentsOnlineEnabled = true }) {
  const defaultBookingType =
    getDefaultBookingTypeForCommercialMode(commercialMode);
  const manualOption = {
    id: "manual_contact",
    label: t("wizard.bookingType.manualContact", {
      defaultValue: "Reservacion por contacto",
    }),
    description: t("propertyForm.helper.bookingTypeManual"),
  };

  if (!defaultBookingType || defaultBookingType === "manual_contact") {
    return [manualOption];
  }

  if (!paymentsOnlineEnabled) {
    return [manualOption];
  }

  const directLabel =
    defaultBookingType === "time_slot"
      ? t("wizard.bookingType.onlineTimeSlot", {
          defaultValue: "Reserva en linea (horarios)",
        })
      : t("wizard.bookingType.onlineDateRange", {
          defaultValue: "Reserva en linea (fechas)",
        });

  return [
    {
      id: defaultBookingType,
      label: directLabel,
      description: t("propertyForm.helper.bookingTypeDirect"),
    },
    manualOption,
  ];
}

function getFieldsForStep({ t, context, stepId }) {
  const {
    category,
    commercialMode,
    bookingType,
    paymentsOnlineEnabled = true,
  } = context || {};

  if (stepId === "publishWhat") {
    return [
      {
        key: "category",
        type: "select",
        labelKey: "wizard.fields.service.category.label",
        helpKey: "wizard.fields.service.category.help",
        options: getCategoryOptions({ t }),
        required: true,
      },
    ];
  }

  if (stepId === "howOffer") {
    const fields = [
      {
        key: "offeringId",
        type: "select",
        labelKey: "wizard.fields.service.offering.label",
        helpKey: "wizard.fields.service.offering.help",
        options: getOfferingOptions({ t, category }),
        required: true,
      },
    ];

    if (commercialMode === "rent_short_term" || commercialMode === "rent_hourly") {
      fields.push({
        key: "bookingType",
        type: "select",
        labelKey: "propertyForm.fields.bookingType",
        options: getBookingTypeOptions({
          t,
          commercialMode,
          paymentsOnlineEnabled,
        }),
        required: true,
      });
    }

    return fields;
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
    const fields = [];

    // Category specific details (stored in attributes)
    switch (category) {
      case "chef":
        fields.push(
          { key: "attributes.chefCuisineType", type: "text", labelKey: "wizard.fields.service.chefCuisineType.label", required: false },
          { key: "attributes.chefMaxDiners", type: "number", labelKey: "wizard.fields.service.chefMaxDiners.label", required: false, min: 1, max: 10000 },
          { key: "attributes.chefIncludesIngredients", type: "boolean", labelKey: "wizard.fields.service.chefIncludesIngredients.label", required: false },
          { key: "attributes.chefIncludesTableware", type: "boolean", labelKey: "wizard.fields.service.chefIncludesTableware.label", required: false },
          { key: "attributes.chefTravelsToLocation", type: "boolean", labelKey: "wizard.fields.service.chefTravelsToLocation.label", required: false },
        );
        break;

      case "photography":
        fields.push(
          { key: "attributes.photoSpecialty", type: "text", labelKey: "wizard.fields.service.photoSpecialty.label", required: false },
          { key: "attributes.photoEditedCount", type: "number", labelKey: "wizard.fields.service.photoEditedCount.label", required: false, min: 0, max: 100000 },
          { key: "attributes.photoIncludesVideo", type: "boolean", labelKey: "wizard.fields.service.photoIncludesVideo.label", required: false },
          { key: "attributes.photoTravelsToLocation", type: "boolean", labelKey: "wizard.fields.service.photoTravelsToLocation.label", required: false },
        );
        break;

      case "catering":
        fields.push(
          { key: "attributes.cateringServiceType", type: "text", labelKey: "wizard.fields.service.cateringServiceType.label", required: false },
          { key: "attributes.cateringMinGuests", type: "number", labelKey: "wizard.fields.service.cateringMinGuests.label", required: false, min: 1, max: 100000 },
          { key: "attributes.cateringMaxGuests", type: "number", labelKey: "wizard.fields.service.cateringMaxGuests.label", required: false, min: 1, max: 100000 },
          { key: "attributes.cateringIncludesWaiters", type: "boolean", labelKey: "wizard.fields.service.cateringIncludesWaiters.label", required: false },
          { key: "attributes.cateringIncludesSetup", type: "boolean", labelKey: "wizard.fields.service.cateringIncludesSetup.label", required: false },
          { key: "attributes.cateringIncludesTableware", type: "boolean", labelKey: "wizard.fields.service.cateringIncludesTableware.label", required: false },
        );
        break;

      case "cleaning":
        fields.push(
          { key: "attributes.cleaningType", type: "text", labelKey: "wizard.fields.service.cleaningType.label", required: false },
          { key: "attributes.cleaningMaxArea", type: "number", labelKey: "wizard.fields.service.cleaningMaxArea.label", required: false, min: 0, max: 999999, suffixKey: "wizard.units.m2" },
          { key: "attributes.cleaningStaffCount", type: "number", labelKey: "wizard.fields.service.cleaningStaffCount.label", required: false, min: 1, max: 1000 },
          { key: "attributes.cleaningIncludesSupplies", type: "boolean", labelKey: "wizard.fields.service.cleaningIncludesSupplies.label", required: false },
        );
        break;

      case "maintenance":
        fields.push(
          { key: "attributes.maintenanceSpecialty", type: "text", labelKey: "wizard.fields.service.maintenanceSpecialty.label", required: false },
          { key: "attributes.maintenanceIncludesMaterials", type: "boolean", labelKey: "wizard.fields.service.maintenanceIncludesMaterials.label", required: false },
          { key: "attributes.maintenanceEmergencyService", type: "boolean", labelKey: "wizard.fields.service.maintenanceEmergencyService.label", required: false },
          { key: "attributes.maintenanceWarranty", type: "boolean", labelKey: "wizard.fields.service.maintenanceWarranty.label", required: false },
          { key: "attributes.maintenanceResponseTimeHours", type: "number", labelKey: "wizard.fields.service.maintenanceResponseTimeHours.label", required: false, min: 0, max: 9999, suffixKey: "wizard.units.hours" },
        );
        break;

      default:
        break;
    }

    fields.push({
      key: "amenities",
      type: "amenities",
      labelKey: "propertyForm.amenities.searchLabel",
      helpKey: "propertyForm.amenitiesHelp",
      required: false,
    });

    return fields;
  }

  if (stepId === "conditions") {
    const unitVariant = getUnitLabelVariant(category);

    // Booking minimum/maximum â€œunitsâ€ + availability window
    // Stored in attributes for services.
    return [
      ...(bookingType === "manual_contact" &&
      (commercialMode === "rent_short_term" || commercialMode === "rent_hourly")
        ? [
            {
              key: "attributes.manualContactScheduleType",
              type: "select",
              labelKey: "propertyForm.fields.manualContactScheduleType",
              options: [
                {
                  id: "none",
                  label: t("propertyForm.options.manualContactScheduleType.none"),
                },
                {
                  id: "date_range",
                  label: t("propertyForm.options.manualContactScheduleType.date_range"),
                },
                {
                  id: "time_slot",
                  label: t("propertyForm.options.manualContactScheduleType.time_slot"),
                },
              ],
              required: false,
            },
          ]
        : []),
      {
        key: "attributes.bookingMinUnits",
        type: "number",
        labelKey: `wizard.fields.service.bookingMinUnits.${unitVariant}.label`,
        helpKey: `wizard.fields.service.bookingMinUnits.${unitVariant}.help`,
        required: false,
        min: 1,
        max: 9999,
      },
      {
        key: "attributes.bookingMaxUnits",
        type: "number",
        labelKey: `wizard.fields.service.bookingMaxUnits.${unitVariant}.label`,
        helpKey: `wizard.fields.service.bookingMaxUnits.${unitVariant}.help`,
        required: false,
        min: 1,
        max: 9999,
      },
      {
        key: "attributes.availabilityStartTime",
        type: "time",
        labelKey: "wizard.fields.service.availabilityStartTime.label",
        helpKey: "wizard.fields.service.availabilityStartTime.help",
        required: false,
      },
      {
        key: "attributes.availabilityEndTime",
        type: "time",
        labelKey: "wizard.fields.service.availabilityEndTime.label",
        helpKey: "wizard.fields.service.availabilityEndTime.help",
        required: false,
      },
      // Hourly-only helper (optional): slot duration and buffer are root fields in schema,
      // but in MVP they may be used by booking overlap logic. Keep them optional.
      ...(commercialMode === "rent_hourly"
        ? [
            {
              key: "slotDurationMinutes",
              type: "number",
              labelKey: "wizard.fields.service.slotDurationMinutes.label",
              helpKey: "wizard.fields.service.slotDurationMinutes.help",
              required: false,
              min: 15,
              max: 1440,
              suffixKey: "wizard.units.minutes",
            },
            {
              key: "slotBufferMinutes",
              type: "number",
              labelKey: "wizard.fields.service.slotBufferMinutes.label",
              helpKey: "wizard.fields.service.slotBufferMinutes.help",
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
    // Services: city + state required by schema; address optional.
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
 * Sanitize attributes for services:
 * - Keep only category-specific keys + generic booking condition keys.
 * - Remove empty/undefined values.
 */
function sanitizeAttributes({ attributes, context }) {
  const { category } = context || {};
  const allowed = new Set([
    ...(ATTRIBUTE_KEYS_BY_CATEGORY[category] || []),
    ...GENERIC_BOOKING_CONDITION_KEYS,
  ]);

  const safe = {};
  Object.entries(attributes || {}).forEach(([k, v]) => {
    if (!allowed.has(k)) return;
    if (v === undefined || v === null || v === "") return;
    safe[k] = v;
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
  patch.resourceType = RESOURCE_TYPE;

  if (formState?.category) patch.category = formState.category;

  const offering = OFFERINGS.find((o) => o.id === formState?.offeringId);
  if (offering) {
    patch.commercialMode = offering.commercialMode;
  } else if (context?.commercialMode) {
    patch.commercialMode = context.commercialMode;
  }
  patch.bookingType =
    formState?.bookingType ||
    offering?.bookingType ||
    context?.bookingType ||
    "";

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

  // Optional scheduling/slot config (root)
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

  // Attributes: merge the attributes object from state
  const rawAttributes = { ...(formState?.attributes || {}) };
  if (patch.bookingType !== "manual_contact") {
    delete rawAttributes.manualContactScheduleType;
  }
  const sanitized = sanitizeAttributes({
    attributes: rawAttributes,
    context: {
      ...context,
      category: formState?.category,
      commercialMode: patch.commercialMode,
    },
  });

  patch.attributes = JSON.stringify(sanitized);

  return patch;
}

export const serviceProfile = {
  resourceType: RESOURCE_TYPE,
  getCategoryOptions,
  getOfferingOptions,
  getNarrativeSteps,
  getFieldsForStep,
  toSchemaPatch,
  sanitizeAttributes,
};

export default serviceProfile;

