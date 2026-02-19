import { normalizeCommercialMode, normalizeResourceType } from "./resourceModel";
import { sanitizeCategory } from "./resourceTaxonomy";

const createField = (config) => Object.freeze(config);

const toUniqueKeys = (keys = []) =>
  Array.from(
    new Set(
      (Array.isArray(keys) ? keys : [])
        .map((key) => String(key || "").trim())
        .filter(Boolean),
    ),
  );

const toBoolean = (value) => {
  if (typeof value === "boolean") return value;
  const normalized = String(value ?? "")
    .trim()
    .toLowerCase();
  if (["true", "1", "yes", "si", "on"].includes(normalized)) return true;
  if (["false", "0", "no", "off", ""].includes(normalized)) return false;
  return Boolean(value);
};

const toNumberIfPossible = (value) => {
  if (value === "" || value === null || value === undefined) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const hasValue = (value) => value !== "" && value !== null && value !== undefined;

export const RESOURCE_FORM_FIELD_DEFINITIONS = Object.freeze({
  bedrooms: createField({
    key: "bedrooms",
    source: "root",
    inputType: "number",
    labelKey: "propertyForm.fields.bedrooms",
    defaultValue: "0",
    min: 0,
    max: 50,
    step: 1,
  }),
  bathrooms: createField({
    key: "bathrooms",
    source: "root",
    inputType: "number",
    labelKey: "propertyForm.fields.bathrooms",
    defaultValue: "0",
    min: 0,
    max: 50,
    step: 0.5,
  }),
  parkingSpaces: createField({
    key: "parkingSpaces",
    source: "root",
    inputType: "number",
    labelKey: "propertyForm.fields.parkingSpaces",
    defaultValue: "0",
    min: 0,
    max: 20,
    step: 1,
  }),
  totalArea: createField({
    key: "totalArea",
    source: "root",
    inputType: "number",
    labelKey: "propertyForm.fields.totalArea",
    defaultValue: "",
    min: 0,
    max: 999999,
    step: 0.01,
    unitKey: "propertyForm.units.squareMeters",
  }),
  builtArea: createField({
    key: "builtArea",
    source: "root",
    inputType: "number",
    labelKey: "propertyForm.fields.builtArea",
    defaultValue: "",
    min: 0,
    max: 999999,
    step: 0.01,
    unitKey: "propertyForm.units.squareMeters",
  }),
  floors: createField({
    key: "floors",
    source: "root",
    inputType: "number",
    labelKey: "propertyForm.fields.floors",
    defaultValue: "1",
    min: 1,
    max: 200,
    step: 1,
  }),
  yearBuilt: createField({
    key: "yearBuilt",
    source: "root",
    inputType: "number",
    labelKey: "propertyForm.fields.yearBuilt",
    defaultValue: "",
    min: 1800,
    max: 2100,
    step: 1,
  }),
  maxGuests: createField({
    key: "maxGuests",
    source: "root",
    inputType: "number",
    labelKey: "propertyForm.fields.maxGuests",
    defaultValue: "1",
    min: 1,
    max: 500,
    step: 1,
  }),
  furnished: createField({
    key: "furnished",
    source: "root",
    inputType: "select",
    labelKey: "propertyForm.fields.furnished",
    defaultValue: "",
    options: Object.freeze([
      Object.freeze({
        value: "",
        labelKey: "propertyForm.options.furnished.unspecified",
      }),
      Object.freeze({
        value: "unfurnished",
        labelKey: "propertyForm.options.furnished.unfurnished",
      }),
      Object.freeze({
        value: "semi_furnished",
        labelKey: "propertyForm.options.furnished.semiFurnished",
      }),
      Object.freeze({
        value: "furnished",
        labelKey: "propertyForm.options.furnished.furnished",
      }),
    ]),
  }),
  petsAllowed: createField({
    key: "petsAllowed",
    source: "root",
    inputType: "boolean",
    labelKey: "propertyForm.fields.petsAllowed",
    defaultValue: false,
  }),
  rentPeriod: createField({
    key: "rentPeriod",
    source: "root",
    inputType: "select",
    labelKey: "propertyForm.fields.rentPeriod",
    defaultValue: "monthly",
    options: Object.freeze([
      Object.freeze({
        value: "weekly",
        labelKey: "propertyForm.options.rentPeriod.weekly",
      }),
      Object.freeze({
        value: "monthly",
        labelKey: "propertyForm.options.rentPeriod.monthly",
      }),
      Object.freeze({
        value: "yearly",
        labelKey: "propertyForm.options.rentPeriod.yearly",
      }),
    ]),
  }),
  minStayNights: createField({
    key: "minStayNights",
    source: "root",
    inputType: "number",
    labelKey: "propertyForm.fields.minStayNights",
    defaultValue: "1",
    min: 1,
    max: 365,
    step: 1,
  }),
  maxStayNights: createField({
    key: "maxStayNights",
    source: "root",
    inputType: "number",
    labelKey: "propertyForm.fields.maxStayNights",
    defaultValue: "365",
    min: 1,
    max: 365,
    step: 1,
  }),
  checkInTime: createField({
    key: "checkInTime",
    source: "root",
    inputType: "time",
    labelKey: "propertyForm.fields.checkInTime",
    defaultValue: "15:00",
  }),
  checkOutTime: createField({
    key: "checkOutTime",
    source: "root",
    inputType: "time",
    labelKey: "propertyForm.fields.checkOutTime",
    defaultValue: "11:00",
  }),
  vehicleSeats: createField({
    key: "vehicleSeats",
    source: "attributes",
    inputType: "number",
    labelKey: "propertyForm.fields.vehicleSeats",
    defaultValue: "",
    min: 1,
    max: 60,
    step: 1,
    unitKey: "propertyForm.units.seats",
  }),
  vehicleDoors: createField({
    key: "vehicleDoors",
    source: "attributes",
    inputType: "number",
    labelKey: "propertyForm.fields.vehicleDoors",
    defaultValue: "",
    min: 1,
    max: 8,
    step: 1,
    unitKey: "propertyForm.units.doors",
  }),
  vehicleTransmission: createField({
    key: "vehicleTransmission",
    source: "attributes",
    inputType: "select",
    labelKey: "propertyForm.fields.vehicleTransmission",
    defaultValue: "",
    options: Object.freeze([
      Object.freeze({
        value: "automatic",
        labelKey: "propertyForm.options.vehicleTransmission.automatic",
      }),
      Object.freeze({
        value: "manual",
        labelKey: "propertyForm.options.vehicleTransmission.manual",
      }),
      Object.freeze({
        value: "semi_automatic",
        labelKey: "propertyForm.options.vehicleTransmission.semiAutomatic",
      }),
    ]),
  }),
  vehicleFuelType: createField({
    key: "vehicleFuelType",
    source: "attributes",
    inputType: "select",
    labelKey: "propertyForm.fields.vehicleFuelType",
    defaultValue: "",
    options: Object.freeze([
      Object.freeze({
        value: "gasoline",
        labelKey: "propertyForm.options.vehicleFuelType.gasoline",
      }),
      Object.freeze({
        value: "diesel",
        labelKey: "propertyForm.options.vehicleFuelType.diesel",
      }),
      Object.freeze({
        value: "electric",
        labelKey: "propertyForm.options.vehicleFuelType.electric",
      }),
      Object.freeze({
        value: "hybrid",
        labelKey: "propertyForm.options.vehicleFuelType.hybrid",
      }),
    ]),
  }),
  vehicleLuggageCapacity: createField({
    key: "vehicleLuggageCapacity",
    source: "attributes",
    inputType: "number",
    labelKey: "propertyForm.fields.vehicleLuggageCapacity",
    defaultValue: "",
    min: 0,
    max: 20,
    step: 1,
    unitKey: "propertyForm.units.pieces",
  }),
  serviceDurationMinutes: createField({
    key: "serviceDurationMinutes",
    source: "attributes",
    inputType: "number",
    labelKey: "propertyForm.fields.serviceDurationMinutes",
    defaultValue: "",
    min: 15,
    max: 1440,
    step: 15,
    unitKey: "propertyForm.units.minutes",
  }),
  serviceStaffCount: createField({
    key: "serviceStaffCount",
    source: "attributes",
    inputType: "number",
    labelKey: "propertyForm.fields.serviceStaffCount",
    defaultValue: "",
    min: 1,
    max: 100,
    step: 1,
    unitKey: "propertyForm.units.people",
  }),
  serviceAtClientLocation: createField({
    key: "serviceAtClientLocation",
    source: "attributes",
    inputType: "boolean",
    labelKey: "propertyForm.fields.serviceAtClientLocation",
    defaultValue: false,
  }),
  serviceIncludesMaterials: createField({
    key: "serviceIncludesMaterials",
    source: "attributes",
    inputType: "boolean",
    labelKey: "propertyForm.fields.serviceIncludesMaterials",
    defaultValue: false,
  }),
  serviceResponseTimeHours: createField({
    key: "serviceResponseTimeHours",
    source: "attributes",
    inputType: "number",
    labelKey: "propertyForm.fields.serviceResponseTimeHours",
    defaultValue: "",
    min: 0,
    max: 168,
    step: 1,
    unitKey: "propertyForm.units.hours",
  }),
  experienceDurationMinutes: createField({
    key: "experienceDurationMinutes",
    source: "attributes",
    inputType: "number",
    labelKey: "propertyForm.fields.experienceDurationMinutes",
    defaultValue: "",
    min: 30,
    max: 1440,
    step: 15,
    unitKey: "propertyForm.units.minutes",
  }),
  experienceMinParticipants: createField({
    key: "experienceMinParticipants",
    source: "attributes",
    inputType: "number",
    labelKey: "propertyForm.fields.experienceMinParticipants",
    defaultValue: "",
    min: 1,
    max: 200,
    step: 1,
    unitKey: "propertyForm.units.people",
  }),
  experienceMaxParticipants: createField({
    key: "experienceMaxParticipants",
    source: "attributes",
    inputType: "number",
    labelKey: "propertyForm.fields.experienceMaxParticipants",
    defaultValue: "",
    min: 1,
    max: 200,
    step: 1,
    unitKey: "propertyForm.units.people",
  }),
  experienceDifficulty: createField({
    key: "experienceDifficulty",
    source: "attributes",
    inputType: "select",
    labelKey: "propertyForm.fields.experienceDifficulty",
    defaultValue: "",
    options: Object.freeze([
      Object.freeze({
        value: "easy",
        labelKey: "propertyForm.options.experienceDifficulty.easy",
      }),
      Object.freeze({
        value: "intermediate",
        labelKey: "propertyForm.options.experienceDifficulty.intermediate",
      }),
      Object.freeze({
        value: "challenging",
        labelKey: "propertyForm.options.experienceDifficulty.challenging",
      }),
      Object.freeze({
        value: "expert",
        labelKey: "propertyForm.options.experienceDifficulty.expert",
      }),
    ]),
  }),
  experienceIncludesEquipment: createField({
    key: "experienceIncludesEquipment",
    source: "attributes",
    inputType: "boolean",
    labelKey: "propertyForm.fields.experienceIncludesEquipment",
    defaultValue: false,
  }),
  experienceMinAge: createField({
    key: "experienceMinAge",
    source: "attributes",
    inputType: "number",
    labelKey: "propertyForm.fields.experienceMinAge",
    defaultValue: "",
    min: 0,
    max: 99,
    step: 1,
    unitKey: "propertyForm.units.years",
  }),
  venueCapacitySeated: createField({
    key: "venueCapacitySeated",
    source: "attributes",
    inputType: "number",
    labelKey: "propertyForm.fields.venueCapacitySeated",
    defaultValue: "",
    min: 1,
    max: 5000,
    step: 1,
    unitKey: "propertyForm.units.people",
  }),
  venueCapacityStanding: createField({
    key: "venueCapacityStanding",
    source: "attributes",
    inputType: "number",
    labelKey: "propertyForm.fields.venueCapacityStanding",
    defaultValue: "",
    min: 1,
    max: 10000,
    step: 1,
    unitKey: "propertyForm.units.people",
  }),
  venueHasStage: createField({
    key: "venueHasStage",
    source: "attributes",
    inputType: "boolean",
    labelKey: "propertyForm.fields.venueHasStage",
    defaultValue: false,
  }),
  venueOpeningTime: createField({
    key: "venueOpeningTime",
    source: "attributes",
    inputType: "time",
    labelKey: "propertyForm.fields.venueOpeningTime",
    defaultValue: "",
  }),
  venueClosingTime: createField({
    key: "venueClosingTime",
    source: "attributes",
    inputType: "time",
    labelKey: "propertyForm.fields.venueClosingTime",
    defaultValue: "",
  }),
  bookingMinUnits: createField({
    key: "bookingMinUnits",
    source: "attributes",
    inputType: "number",
    labelKey: "propertyForm.fields.bookingMinUnits",
    defaultValue: "",
    min: 1,
    max: 365,
    step: 1,
  }),
  bookingMaxUnits: createField({
    key: "bookingMaxUnits",
    source: "attributes",
    inputType: "number",
    labelKey: "propertyForm.fields.bookingMaxUnits",
    defaultValue: "",
    min: 1,
    max: 365,
    step: 1,
  }),
  availabilityStartTime: createField({
    key: "availabilityStartTime",
    source: "attributes",
    inputType: "time",
    labelKey: "propertyForm.fields.availabilityStartTime",
    defaultValue: "",
  }),
  availabilityEndTime: createField({
    key: "availabilityEndTime",
    source: "attributes",
    inputType: "time",
    labelKey: "propertyForm.fields.availabilityEndTime",
    defaultValue: "",
  }),
});

export const RESOURCE_ATTRIBUTE_FIELD_KEYS = Object.freeze(
  toUniqueKeys(
    Object.values(RESOURCE_FORM_FIELD_DEFINITIONS)
      .filter((field) => field.source === "attributes")
      .map((field) => field.key),
  ),
);

const PROPERTY_FEATURE_FIELDS_BY_CATEGORY = Object.freeze({
  house: Object.freeze([
    "bedrooms",
    "bathrooms",
    "parkingSpaces",
    "totalArea",
    "builtArea",
    "floors",
    "yearBuilt",
  ]),
  apartment: Object.freeze([
    "bedrooms",
    "bathrooms",
    "parkingSpaces",
    "totalArea",
    "builtArea",
    "floors",
    "yearBuilt",
  ]),
  land: Object.freeze(["totalArea"]),
  commercial: Object.freeze([
    "bathrooms",
    "parkingSpaces",
    "totalArea",
    "builtArea",
    "floors",
    "yearBuilt",
  ]),
  office: Object.freeze([
    "bathrooms",
    "parkingSpaces",
    "totalArea",
    "builtArea",
    "floors",
    "yearBuilt",
  ]),
  warehouse: Object.freeze([
    "parkingSpaces",
    "totalArea",
    "builtArea",
    "floors",
    "yearBuilt",
  ]),
});

const FEATURES_BY_RESOURCE_TYPE = Object.freeze({
  vehicle: Object.freeze([
    "vehicleSeats",
    "vehicleDoors",
    "vehicleTransmission",
    "vehicleFuelType",
    "vehicleLuggageCapacity",
    "yearBuilt",
  ]),
  service: Object.freeze([
    "serviceDurationMinutes",
    "serviceStaffCount",
    "serviceAtClientLocation",
    "serviceIncludesMaterials",
    "serviceResponseTimeHours",
  ]),
  experience: Object.freeze([
    "experienceDurationMinutes",
    "experienceMinParticipants",
    "experienceMaxParticipants",
    "experienceDifficulty",
    "experienceIncludesEquipment",
    "experienceMinAge",
  ]),
  venue: Object.freeze([
    "venueCapacitySeated",
    "venueCapacityStanding",
    "totalArea",
    "venueHasStage",
    "venueOpeningTime",
    "venueClosingTime",
  ]),
});

const LONG_TERM_FIELDS_BY_RESOURCE_TYPE = Object.freeze({
  property: Object.freeze(["rentPeriod", "furnished", "petsAllowed"]),
  vehicle: Object.freeze(["rentPeriod"]),
  service: Object.freeze([]),
  experience: Object.freeze([]),
  venue: Object.freeze([]),
});

const BOOKING_RULE_FIELDS_BY_TYPE_AND_MODE = Object.freeze({
  property: Object.freeze({
    rent_short_term: Object.freeze([
      "maxGuests",
      "minStayNights",
      "maxStayNights",
      "checkInTime",
      "checkOutTime",
      "furnished",
      "petsAllowed",
    ]),
    rent_hourly: Object.freeze([
      "maxGuests",
      "bookingMinUnits",
      "bookingMaxUnits",
      "availabilityStartTime",
      "availabilityEndTime",
      "furnished",
      "petsAllowed",
    ]),
  }),
  vehicle: Object.freeze({
    rent_short_term: Object.freeze([
      "bookingMinUnits",
      "bookingMaxUnits",
      "availabilityStartTime",
      "availabilityEndTime",
    ]),
    rent_hourly: Object.freeze([
      "bookingMinUnits",
      "bookingMaxUnits",
      "availabilityStartTime",
      "availabilityEndTime",
    ]),
  }),
  service: Object.freeze({
    rent_short_term: Object.freeze([
      "bookingMinUnits",
      "bookingMaxUnits",
      "availabilityStartTime",
      "availabilityEndTime",
    ]),
    rent_hourly: Object.freeze([
      "bookingMinUnits",
      "bookingMaxUnits",
      "availabilityStartTime",
      "availabilityEndTime",
    ]),
  }),
  experience: Object.freeze({
    rent_short_term: Object.freeze([
      "bookingMinUnits",
      "bookingMaxUnits",
      "availabilityStartTime",
      "availabilityEndTime",
      "experienceMinParticipants",
      "experienceMaxParticipants",
    ]),
    rent_hourly: Object.freeze([
      "bookingMinUnits",
      "bookingMaxUnits",
      "availabilityStartTime",
      "availabilityEndTime",
      "experienceMinParticipants",
      "experienceMaxParticipants",
    ]),
  }),
  venue: Object.freeze({
    rent_short_term: Object.freeze([
      "maxGuests",
      "bookingMinUnits",
      "bookingMaxUnits",
      "availabilityStartTime",
      "availabilityEndTime",
      "venueOpeningTime",
      "venueClosingTime",
    ]),
    rent_hourly: Object.freeze([
      "maxGuests",
      "bookingMinUnits",
      "bookingMaxUnits",
      "availabilityStartTime",
      "availabilityEndTime",
      "venueOpeningTime",
      "venueClosingTime",
    ]),
  }),
});

const resolveFeatureFieldKeys = (resourceType, category) => {
  if (resourceType === "property") {
    return (
      PROPERTY_FEATURE_FIELDS_BY_CATEGORY[category] ||
      PROPERTY_FEATURE_FIELDS_BY_CATEGORY.house
    );
  }

  return FEATURES_BY_RESOURCE_TYPE[resourceType] || [];
};

const resolveRentalTermFieldKeys = (resourceType, commercialMode) => {
  if (commercialMode !== "rent_long_term") return [];
  return LONG_TERM_FIELDS_BY_RESOURCE_TYPE[resourceType] || [];
};

const resolveBookingRuleFieldKeys = (resourceType, commercialMode) => {
  if (!["rent_short_term", "rent_hourly"].includes(commercialMode)) return [];
  const fieldsByMode = BOOKING_RULE_FIELDS_BY_TYPE_AND_MODE[resourceType] || {};
  return fieldsByMode[commercialMode] || [];
};

const mapFieldKeys = (keys) =>
  toUniqueKeys(keys)
    .map((key) => RESOURCE_FORM_FIELD_DEFINITIONS[key])
    .filter(Boolean);

export const parseResourceAttributes = (attributesInput) => {
  if (!attributesInput) return {};

  if (typeof attributesInput === "string") {
    const trimmed = attributesInput.trim();
    if (!trimmed) return {};
    try {
      const parsed = JSON.parse(trimmed);
      return parsed && typeof parsed === "object" && !Array.isArray(parsed)
        ? parsed
        : {};
    } catch {
      return {};
    }
  }

  if (typeof attributesInput === "object" && !Array.isArray(attributesInput)) {
    return attributesInput;
  }

  return {};
};

export const getResourceFormFieldDefinition = (fieldKey) =>
  RESOURCE_FORM_FIELD_DEFINITIONS[String(fieldKey || "").trim()] || null;

export const isAttributeResourceField = (fieldKey) => {
  const field = getResourceFormFieldDefinition(fieldKey);
  return Boolean(field && field.source === "attributes");
};

export const getResourceFormProfile = ({
  resourceType,
  category,
  commercialMode,
  operationType,
} = {}) => {
  const normalizedType = normalizeResourceType(resourceType);
  const normalizedCategory = sanitizeCategory(normalizedType, category);
  const normalizedCommercial = normalizeCommercialMode(
    commercialMode || operationType || "sale",
  );

  const featureKeys = toUniqueKeys(
    resolveFeatureFieldKeys(normalizedType, normalizedCategory),
  );
  const rentalTermKeys = toUniqueKeys(
    resolveRentalTermFieldKeys(normalizedType, normalizedCommercial),
  );
  const vacationRuleKeys = toUniqueKeys(
    resolveBookingRuleFieldKeys(normalizedType, normalizedCommercial),
  );

  const features = mapFieldKeys(featureKeys);
  const rentalTerms = mapFieldKeys(rentalTermKeys);
  const vacationRules = mapFieldKeys(vacationRuleKeys);

  const allFields = [...features, ...rentalTerms, ...vacationRules];
  const allFieldKeys = toUniqueKeys(allFields.map((field) => field.key));

  return {
    resourceType: normalizedType,
    category: normalizedCategory,
    commercialMode: normalizedCommercial,
    features,
    rentalTerms,
    vacationRules,
    allFields,
    allFieldKeys,
    rootFieldKeys: toUniqueKeys(
      allFields
        .filter((field) => field.source === "root")
        .map((field) => field.key),
    ),
    attributeFieldKeys: toUniqueKeys(
      allFields
        .filter((field) => field.source === "attributes")
        .map((field) => field.key),
    ),
  };
};

const getOptionForValue = (field, value) =>
  (Array.isArray(field?.options) ? field.options : []).find(
    (option) => option.value === value,
  );

export const getResourceFieldLabel = (field, t, context = {}) => {
  if (!field) return "";

  const byMode = field.labelByCommercialMode || {};
  const modeLabelKey = byMode[context.commercialMode];
  if (modeLabelKey) {
    return t(modeLabelKey, { defaultValue: field.defaultLabel || field.key });
  }

  return t(field.labelKey, { defaultValue: field.defaultLabel || field.key });
};

export const getResourceFieldOptionLabel = (field, value, t) => {
  const option = getOptionForValue(field, value);
  if (!option) return String(value || "");
  return t(option.labelKey, { defaultValue: option.defaultLabel || option.value });
};

export const toUiFieldValue = (field, value) => {
  if (!field) return value;

  if (field.inputType === "boolean") {
    if (!hasValue(value)) return Boolean(field.defaultValue);
    return toBoolean(value);
  }

  if (!hasValue(value)) {
    return field.defaultValue ?? "";
  }

  return String(value);
};

export const coerceResourceFieldValueForPayload = (field, value) => {
  if (!field) return value;

  if (field.inputType === "boolean") {
    return toBoolean(value);
  }

  if (!hasValue(value)) return null;

  if (field.inputType === "number") {
    return toNumberIfPossible(value);
  }

  return String(value).trim();
};

export const formatResourceFieldValue = (field, value, t) => {
  if (!field) return "-";

  if (field.inputType === "boolean") {
    return toBoolean(value) ? t("common.yes", "Yes") : t("common.no", "No");
  }

  if (!hasValue(value)) return "-";

  if (field.inputType === "select") {
    const optionLabel = getResourceFieldOptionLabel(field, String(value), t);
    return optionLabel || "-";
  }

  if (field.inputType === "number") {
    const numericValue = toNumberIfPossible(value);
    if (numericValue === null) return String(value);

    const baseValue = Number.isInteger(numericValue)
      ? String(numericValue)
      : String(numericValue);

    const unitLabel = field.unitKey
      ? t(field.unitKey, { defaultValue: field.unit || "" })
      : field.unit || "";

    return unitLabel ? `${baseValue} ${unitLabel}` : baseValue;
  }

  if (field.inputType === "time") {
    return String(value);
  }

  const stringValue = String(value).trim();
  return stringValue || "-";
};
