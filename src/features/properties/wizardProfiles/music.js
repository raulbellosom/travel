/**
 * Music wizard profile (resourceType = "music")
 * Mexico-first genres and booking-oriented commercial modes.
 */

const RESOURCE_TYPE = "music";

const MUSIC_CATEGORIES = [
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
];

const OFFERINGS = [
  {
    id: "per_event_or_day",
    commercialMode: "rent_short_term",
    bookingType: "date_range",
    i18nLabelKey: "wizard.offerings.music.per_event_or_day.label",
    i18nHelpKey: "wizard.offerings.music.per_event_or_day.help",
  },
  {
    id: "per_hour",
    commercialMode: "rent_hourly",
    bookingType: "time_slot",
    i18nLabelKey: "wizard.offerings.music.per_hour.label",
    i18nHelpKey: "wizard.offerings.music.per_hour.help",
  },
];

function getDefaultBookingTypeForCommercialMode(commercialMode) {
  if (commercialMode === "rent_hourly") return "time_slot";
  if (commercialMode === "rent_short_term") return "date_range";
  return "manual_contact";
}

const PRICING_CHOICES = {
  fixed_total: {
    schemaPricingModel: "fixed_total",
    labelKey: "wizard.pricing.fixed_total",
  },
  per_day: {
    schemaPricingModel: "per_day",
    labelKey: "wizard.pricing.per_day",
  },
  per_hour: {
    schemaPricingModel: "per_hour",
    labelKey: "wizard.pricing.per_hour",
  },
  per_event: {
    schemaPricingModel: "per_event",
    labelKey: "wizard.pricing.per_event",
  },
};

const MUSIC_ATTRIBUTE_KEYS = [
  "musicIncludesSound",
  "musicIncludesLighting",
  "musicMaxAudience",
  "musicBandMembers",
  "musicTravelsToVenue",
  "musicSetDurationMinutes",
  "musicRepertoireNotes",
];

const GENERIC_BOOKING_CONDITION_KEYS = [
  "bookingMinUnits",
  "bookingMaxUnits",
  "availabilityStartTime",
  "availabilityEndTime",
  "manualContactScheduleType",
  "slotMode",
];

function inferPricingChoiceId({ commercialMode, pricingModel }) {
  const defaultByMode =
    commercialMode === "rent_hourly"
      ? "per_hour"
      : commercialMode === "rent_short_term"
        ? "per_event"
        : "fixed_total";

  const allowedByMode = {
    rent_hourly: new Set([
      "fixed_total",
      "per_hour",
      "per_person",
      "per_event",
    ]),
    rent_short_term: new Set([
      "fixed_total",
      "per_day",
      "per_person",
      "per_event",
    ]),
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

function getNarrativeSteps({ t }) {
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
  return MUSIC_CATEGORIES.map((id) => ({
    id,
    label: t(`wizard.categories.music.${id}`),
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

function getBookingTypeOptions({
  t,
  commercialMode,
  paymentsOnlineEnabled = true,
}) {
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
    commercialMode,
    bookingType,
    paymentsOnlineEnabled = true,
  } = context || {};

  if (stepId === "publishWhat") {
    return [
      {
        key: "category",
        type: "select",
        labelKey: "wizard.fields.music.category.label",
        helpKey: "wizard.fields.music.category.help",
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
        labelKey: "wizard.fields.music.offering.label",
        helpKey: "wizard.fields.music.offering.help",
        options: getOfferingOptions({ t }),
        required: true,
      },
    ];

    if (
      commercialMode === "rent_short_term" ||
      commercialMode === "rent_hourly"
    ) {
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
    ];
  }

  if (stepId === "details") {
    return [
      {
        key: "amenities",
        type: "amenities",
        labelKey: "wizard.fields.music.musicGenres.label",
        helpKey: "wizard.fields.music.musicGenres.help",
        required: false,
      },
      {
        key: "attributes.musicBandMembers",
        type: "number",
        labelKey: "wizard.fields.music.musicBandMembers.label",
        required: false,
        min: 1,
        max: 100,
      },
      {
        key: "attributes.musicSetDurationMinutes",
        type: "number",
        labelKey: "wizard.fields.music.musicSetDurationMinutes.label",
        required: false,
        min: 15,
        max: 1440,
        suffixKey: "wizard.units.minutes",
      },
      {
        key: "attributes.musicIncludesSound",
        type: "boolean",
        labelKey: "wizard.fields.music.musicIncludesSound.label",
        required: false,
      },
      {
        key: "attributes.musicIncludesLighting",
        type: "boolean",
        labelKey: "wizard.fields.music.musicIncludesLighting.label",
        required: false,
      },
      {
        key: "attributes.musicMaxAudience",
        type: "number",
        labelKey: "wizard.fields.music.musicMaxAudience.label",
        required: false,
        min: 1,
        max: 100000,
      },
      {
        key: "attributes.musicTravelsToVenue",
        type: "boolean",
        labelKey: "wizard.fields.music.musicTravelsToVenue.label",
        required: false,
      },
      {
        key: "attributes.musicRepertoireNotes",
        type: "textarea",
        labelKey: "wizard.fields.music.musicRepertoireNotes.label",
        required: false,
        minLength: 3,
      },
    ];
  }

  if (stepId === "conditions") {
    const slotMode = context.slotMode || "predefined";
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
                  label: t(
                    "propertyForm.options.manualContactScheduleType.none",
                  ),
                },
                // date_range solo es congruente con rent_short_term
                ...(commercialMode === "rent_short_term"
                  ? [
                      {
                        id: "date_range",
                        label: t(
                          "propertyForm.options.manualContactScheduleType.date_range",
                        ),
                      },
                    ]
                  : []),
                {
                  id: "time_slot",
                  label: t(
                    "propertyForm.options.manualContactScheduleType.time_slot",
                  ),
                },
              ],
              required: false,
            },
          ]
        : []),
      // Slot mode selector: predefined fixed-duration slots vs. hour-range picker
      ...(commercialMode === "rent_hourly"
        ? [
            {
              key: "attributes.slotMode",
              type: "select",
              labelKey: "wizard.fields.slotMode.label",
              helpKey: "wizard.fields.slotMode.help",
              options: [
                {
                  id: "predefined",
                  label: t("wizard.options.slotMode.predefined"),
                },
                {
                  id: "hour_range",
                  label: t("wizard.options.slotMode.hour_range"),
                },
              ],
              required: false,
            },
          ]
        : []),
      {
        key: "attributes.availabilityStartTime",
        type: "time",
        labelKey: "wizard.fields.music.availabilityStartTime.label",
        helpKey: "wizard.fields.music.availabilityStartTime.help",
        required: false,
      },
      {
        key: "attributes.availabilityEndTime",
        type: "time",
        labelKey: "wizard.fields.music.availabilityEndTime.label",
        helpKey: "wizard.fields.music.availabilityEndTime.help",
        required: false,
      },
      // hour_range mode: client picks start time + number of hours
      ...(slotMode === "hour_range"
        ? [
            {
              key: "attributes.bookingMinUnits",
              type: "number",
              labelKey: "wizard.fields.music.bookingMinUnits.hours.label",
              helpKey: "wizard.fields.music.bookingMinUnits.hours.help",
              required: false,
              min: 1,
              max: 9999,
            },
            {
              key: "attributes.bookingMaxUnits",
              type: "number",
              labelKey: "wizard.fields.music.bookingMaxUnits.hours.label",
              helpKey: "wizard.fields.music.bookingMaxUnits.hours.help",
              required: false,
              min: 1,
              max: 9999,
            },
          ]
        : []),
      // predefined mode: owner defines fixed-duration slot grid
      ...(commercialMode === "rent_hourly" && slotMode === "predefined"
        ? [
            {
              key: "slotDurationMinutes",
              type: "number",
              labelKey: "wizard.fields.music.slotDurationMinutes.label",
              helpKey: "wizard.fields.music.slotDurationMinutes.help",
              required: false,
              min: 15,
              max: 1440,
              suffixKey: "wizard.units.minutes",
            },
            {
              key: "slotBufferMinutes",
              type: "number",
              labelKey: "wizard.fields.music.slotBufferMinutes.label",
              helpKey: "wizard.fields.music.slotBufferMinutes.help",
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
    return [
      {
        key: "country",
        type: "select",
        labelKey: "wizard.fields.location.country.label",
        options: [{ id: "MX", label: t("wizard.countries.MX") }],
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

  return [];
}

function sanitizeAttributes({ attributes }) {
  const allowed = new Set([
    ...MUSIC_ATTRIBUTE_KEYS,
    ...GENERIC_BOOKING_CONDITION_KEYS,
  ]);

  const safe = {};
  Object.entries(attributes || {}).forEach(([key, value]) => {
    if (!allowed.has(key)) return;
    if (value === undefined || value === null || value === "") return;

    safe[key] = value;
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
  } else if (context?.commercialMode) {
    patch.commercialMode = context.commercialMode;
  }
  patch.bookingType =
    formState?.bookingType ||
    offering?.bookingType ||
    context?.bookingType ||
    "";

  if (formState?.title != null) patch.title = String(formState.title).trim();
  if (formState?.description != null) {
    patch.description = String(formState.description).trim();
  }
  if (formState?.slug != null && String(formState.slug).trim() !== "") {
    patch.slug = String(formState.slug).trim();
  }

  if (Array.isArray(formState?.imageFiles) && formState.imageFiles.length > 0) {
    patch.imageFiles = formState.imageFiles.filter(
      (file) =>
        file && typeof file === "object" && typeof file.name === "string",
    );
  }
  if (formState?.videoUrl) patch.videoUrl = formState.videoUrl;

  const locationKeys = [
    "streetAddress",
    "neighborhood",
    "city",
    "state",
    "country",
    "postalCode",
    "latitude",
    "longitude",
  ];
  locationKeys.forEach((key) => {
    if (formState?.[key] !== undefined) patch[key] = formState[key];
  });

  if (formState?.slotDurationMinutes !== undefined) {
    patch.slotDurationMinutes = formState.slotDurationMinutes;
  }
  if (formState?.slotBufferMinutes !== undefined) {
    patch.slotBufferMinutes = formState.slotBufferMinutes;
  }

  if (formState?.price !== undefined) patch.price = Number(formState.price);
  if (formState?.currency) patch.currency = formState.currency;
  if (formState?.priceNegotiable !== undefined) {
    patch.priceNegotiable = Boolean(formState.priceNegotiable);
  }

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

  const rawAttributes = { ...(formState?.attributes || {}) };
  if (patch.bookingType !== "manual_contact") {
    delete rawAttributes.manualContactScheduleType;
  }
  const amenitySlugs = Array.isArray(formState?.amenities)
    ? Array.from(
        new Set(
          formState.amenities
            .map((slug) => String(slug || "").trim())
            .filter(Boolean),
        ),
      )
    : [];
  if (amenitySlugs.length > 0) {
    patch.amenities = amenitySlugs;
  }
  const sanitized = sanitizeAttributes({ attributes: rawAttributes });
  patch.attributes = JSON.stringify(sanitized);

  return patch;
}

export const musicProfile = {
  resourceType: RESOURCE_TYPE,
  getCategoryOptions,
  getOfferingOptions,
  getNarrativeSteps,
  getFieldsForStep,
  toSchemaPatch,
  sanitizeAttributes,
};

export default musicProfile;
