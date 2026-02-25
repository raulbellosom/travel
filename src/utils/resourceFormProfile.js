import {
  normalizeCommercialMode,
  normalizeResourceType,
} from "./resourceModel";
import { sanitizeCategory, sanitizeCommercialMode } from "./resourceTaxonomy";

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

const hasValue = (value) =>
  value !== "" && value !== null && value !== undefined;

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
  minimumContractDuration: createField({
    key: "minimumContractDuration",
    source: "attributes",
    inputType: "number",
    labelKey: "propertyForm.fields.minimumContractDuration",
    defaultValue: "",
    min: 1,
    max: 120,
    step: 1,
    unitKey: "propertyForm.units.months",
  }),
  vehicleModelYear: createField({
    key: "vehicleModelYear",
    source: "attributes",
    inputType: "number",
    labelKey: "propertyForm.fields.vehicleModelYear",
    defaultValue: "",
    min: 1950,
    max: 2100,
    step: 1,
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
  slotDurationMinutes: createField({
    key: "slotDurationMinutes",
    source: "root",
    inputType: "number",
    labelKey: "propertyForm.fields.slotDurationMinutes",
    defaultValue: "60",
    min: 15,
    max: 1440,
    step: 15,
    unitKey: "propertyForm.units.minutes",
  }),
  slotBufferMinutes: createField({
    key: "slotBufferMinutes",
    source: "root",
    inputType: "number",
    labelKey: "propertyForm.fields.slotBufferMinutes",
    defaultValue: "0",
    min: 0,
    max: 240,
    step: 5,
    unitKey: "propertyForm.units.minutes",
  }),
  manualContactScheduleType: createField({
    key: "manualContactScheduleType",
    source: "attributes",
    inputType: "select",
    labelKey: "propertyForm.fields.manualContactScheduleType",
    defaultValue: "none",
    options: Object.freeze([
      Object.freeze({
        value: "none",
        labelKey: "propertyForm.options.manualContactScheduleType.none",
      }),
      Object.freeze({
        value: "date_range",
        labelKey: "propertyForm.options.manualContactScheduleType.date_range",
      }),
      Object.freeze({
        value: "time_slot",
        labelKey: "propertyForm.options.manualContactScheduleType.time_slot",
      }),
    ]),
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
  /* ── DJ ─────────────────────────────────────────────────── */
  djMusicGenre: createField({
    key: "djMusicGenre",
    source: "attributes",
    inputType: "select",
    labelKey: "propertyForm.fields.djMusicGenre",
    defaultValue: "",
    options: Object.freeze([
      Object.freeze({
        value: "electronic",
        labelKey: "propertyForm.options.djMusicGenre.electronic",
      }),
      Object.freeze({
        value: "reggaeton",
        labelKey: "propertyForm.options.djMusicGenre.reggaeton",
      }),
      Object.freeze({
        value: "pop_variety",
        labelKey: "propertyForm.options.djMusicGenre.popVariety",
      }),
      Object.freeze({
        value: "rock",
        labelKey: "propertyForm.options.djMusicGenre.rock",
      }),
      Object.freeze({
        value: "latin",
        labelKey: "propertyForm.options.djMusicGenre.latin",
      }),
      Object.freeze({
        value: "other",
        labelKey: "propertyForm.options.djMusicGenre.other",
      }),
    ]),
  }),
  djIncludesSound: createField({
    key: "djIncludesSound",
    source: "attributes",
    inputType: "boolean",
    labelKey: "propertyForm.fields.djIncludesSound",
    defaultValue: false,
  }),
  djIncludesLighting: createField({
    key: "djIncludesLighting",
    source: "attributes",
    inputType: "boolean",
    labelKey: "propertyForm.fields.djIncludesLighting",
    defaultValue: false,
  }),
  djMaxEventCapacity: createField({
    key: "djMaxEventCapacity",
    source: "attributes",
    inputType: "number",
    labelKey: "propertyForm.fields.djMaxEventCapacity",
    defaultValue: "",
    min: 10,
    max: 5000,
    step: 10,
    unitKey: "propertyForm.units.people",
  }),
  djTravelsToVenue: createField({
    key: "djTravelsToVenue",
    source: "attributes",
    inputType: "boolean",
    labelKey: "propertyForm.fields.djTravelsToVenue",
    defaultValue: true,
  }),
  /* ── Limpieza ───────────────────────────────────────────── */
  cleaningType: createField({
    key: "cleaningType",
    source: "attributes",
    inputType: "select",
    labelKey: "propertyForm.fields.cleaningType",
    defaultValue: "",
    options: Object.freeze([
      Object.freeze({
        value: "residential",
        labelKey: "propertyForm.options.cleaningType.residential",
      }),
      Object.freeze({
        value: "commercial",
        labelKey: "propertyForm.options.cleaningType.commercial",
      }),
      Object.freeze({
        value: "post_construction",
        labelKey: "propertyForm.options.cleaningType.postConstruction",
      }),
      Object.freeze({
        value: "deep",
        labelKey: "propertyForm.options.cleaningType.deep",
      }),
    ]),
  }),
  cleaningMaxArea: createField({
    key: "cleaningMaxArea",
    source: "attributes",
    inputType: "number",
    labelKey: "propertyForm.fields.cleaningMaxArea",
    defaultValue: "",
    min: 10,
    max: 10000,
    step: 10,
    unitKey: "propertyForm.units.squareMeters",
  }),
  cleaningStaffCount: createField({
    key: "cleaningStaffCount",
    source: "attributes",
    inputType: "number",
    labelKey: "propertyForm.fields.cleaningStaffCount",
    defaultValue: "",
    min: 1,
    max: 50,
    step: 1,
    unitKey: "propertyForm.units.people",
  }),
  cleaningIncludesSupplies: createField({
    key: "cleaningIncludesSupplies",
    source: "attributes",
    inputType: "boolean",
    labelKey: "propertyForm.fields.cleaningIncludesSupplies",
    defaultValue: false,
  }),
  /* ── Chef privado ───────────────────────────────────────── */
  chefCuisineType: createField({
    key: "chefCuisineType",
    source: "attributes",
    inputType: "select",
    labelKey: "propertyForm.fields.chefCuisineType",
    defaultValue: "",
    options: Object.freeze([
      Object.freeze({
        value: "mexican",
        labelKey: "propertyForm.options.chefCuisineType.mexican",
      }),
      Object.freeze({
        value: "italian",
        labelKey: "propertyForm.options.chefCuisineType.italian",
      }),
      Object.freeze({
        value: "japanese",
        labelKey: "propertyForm.options.chefCuisineType.japanese",
      }),
      Object.freeze({
        value: "fusion",
        labelKey: "propertyForm.options.chefCuisineType.fusion",
      }),
      Object.freeze({
        value: "international",
        labelKey: "propertyForm.options.chefCuisineType.international",
      }),
      Object.freeze({
        value: "other",
        labelKey: "propertyForm.options.chefCuisineType.other",
      }),
    ]),
  }),
  chefMaxDiners: createField({
    key: "chefMaxDiners",
    source: "attributes",
    inputType: "number",
    labelKey: "propertyForm.fields.chefMaxDiners",
    defaultValue: "",
    min: 1,
    max: 200,
    step: 1,
    unitKey: "propertyForm.units.people",
  }),
  chefIncludesIngredients: createField({
    key: "chefIncludesIngredients",
    source: "attributes",
    inputType: "boolean",
    labelKey: "propertyForm.fields.chefIncludesIngredients",
    defaultValue: false,
  }),
  chefIncludesTableware: createField({
    key: "chefIncludesTableware",
    source: "attributes",
    inputType: "boolean",
    labelKey: "propertyForm.fields.chefIncludesTableware",
    defaultValue: false,
  }),
  chefTravelsToLocation: createField({
    key: "chefTravelsToLocation",
    source: "attributes",
    inputType: "boolean",
    labelKey: "propertyForm.fields.chefTravelsToLocation",
    defaultValue: true,
  }),
  /* ── Fotografía ─────────────────────────────────────────── */
  photoSpecialty: createField({
    key: "photoSpecialty",
    source: "attributes",
    inputType: "select",
    labelKey: "propertyForm.fields.photoSpecialty",
    defaultValue: "",
    options: Object.freeze([
      Object.freeze({
        value: "weddings",
        labelKey: "propertyForm.options.photoSpecialty.weddings",
      }),
      Object.freeze({
        value: "portraits",
        labelKey: "propertyForm.options.photoSpecialty.portraits",
      }),
      Object.freeze({
        value: "product",
        labelKey: "propertyForm.options.photoSpecialty.product",
      }),
      Object.freeze({
        value: "events",
        labelKey: "propertyForm.options.photoSpecialty.events",
      }),
      Object.freeze({
        value: "real_estate",
        labelKey: "propertyForm.options.photoSpecialty.realEstate",
      }),
    ]),
  }),
  photoEditedCount: createField({
    key: "photoEditedCount",
    source: "attributes",
    inputType: "number",
    labelKey: "propertyForm.fields.photoEditedCount",
    defaultValue: "",
    min: 1,
    max: 2000,
    step: 1,
    unitKey: "propertyForm.units.photos",
  }),
  photoIncludesVideo: createField({
    key: "photoIncludesVideo",
    source: "attributes",
    inputType: "boolean",
    labelKey: "propertyForm.fields.photoIncludesVideo",
    defaultValue: false,
  }),
  photoTravelsToLocation: createField({
    key: "photoTravelsToLocation",
    source: "attributes",
    inputType: "boolean",
    labelKey: "propertyForm.fields.photoTravelsToLocation",
    defaultValue: true,
  }),
  /* ── Catering ───────────────────────────────────────────── */
  cateringServiceType: createField({
    key: "cateringServiceType",
    source: "attributes",
    inputType: "select",
    labelKey: "propertyForm.fields.cateringServiceType",
    defaultValue: "",
    options: Object.freeze([
      Object.freeze({
        value: "buffet",
        labelKey: "propertyForm.options.cateringServiceType.buffet",
      }),
      Object.freeze({
        value: "plated",
        labelKey: "propertyForm.options.cateringServiceType.plated",
      }),
      Object.freeze({
        value: "cocktail",
        labelKey: "propertyForm.options.cateringServiceType.cocktail",
      }),
      Object.freeze({
        value: "lunch_box",
        labelKey: "propertyForm.options.cateringServiceType.lunchBox",
      }),
    ]),
  }),
  cateringMinGuests: createField({
    key: "cateringMinGuests",
    source: "attributes",
    inputType: "number",
    labelKey: "propertyForm.fields.cateringMinGuests",
    defaultValue: "",
    min: 1,
    max: 2000,
    step: 1,
    unitKey: "propertyForm.units.people",
  }),
  cateringMaxGuests: createField({
    key: "cateringMaxGuests",
    source: "attributes",
    inputType: "number",
    labelKey: "propertyForm.fields.cateringMaxGuests",
    defaultValue: "",
    min: 1,
    max: 2000,
    step: 1,
    unitKey: "propertyForm.units.people",
  }),
  cateringIncludesWaiters: createField({
    key: "cateringIncludesWaiters",
    source: "attributes",
    inputType: "boolean",
    labelKey: "propertyForm.fields.cateringIncludesWaiters",
    defaultValue: false,
  }),
  cateringIncludesSetup: createField({
    key: "cateringIncludesSetup",
    source: "attributes",
    inputType: "boolean",
    labelKey: "propertyForm.fields.cateringIncludesSetup",
    defaultValue: false,
  }),
  cateringIncludesTableware: createField({
    key: "cateringIncludesTableware",
    source: "attributes",
    inputType: "boolean",
    labelKey: "propertyForm.fields.cateringIncludesTableware",
    defaultValue: false,
  }),
  /* ── Mantenimiento ──────────────────────────────────────── */
  maintenanceSpecialty: createField({
    key: "maintenanceSpecialty",
    source: "attributes",
    inputType: "select",
    labelKey: "propertyForm.fields.maintenanceSpecialty",
    defaultValue: "",
    options: Object.freeze([
      Object.freeze({
        value: "plumbing",
        labelKey: "propertyForm.options.maintenanceSpecialty.plumbing",
      }),
      Object.freeze({
        value: "electrical",
        labelKey: "propertyForm.options.maintenanceSpecialty.electrical",
      }),
      Object.freeze({
        value: "painting",
        labelKey: "propertyForm.options.maintenanceSpecialty.painting",
      }),
      Object.freeze({
        value: "carpentry",
        labelKey: "propertyForm.options.maintenanceSpecialty.carpentry",
      }),
      Object.freeze({
        value: "general",
        labelKey: "propertyForm.options.maintenanceSpecialty.general",
      }),
    ]),
  }),
  maintenanceIncludesMaterials: createField({
    key: "maintenanceIncludesMaterials",
    source: "attributes",
    inputType: "boolean",
    labelKey: "propertyForm.fields.maintenanceIncludesMaterials",
    defaultValue: false,
  }),
  maintenanceEmergencyService: createField({
    key: "maintenanceEmergencyService",
    source: "attributes",
    inputType: "boolean",
    labelKey: "propertyForm.fields.maintenanceEmergencyService",
    defaultValue: false,
  }),
  maintenanceWarranty: createField({
    key: "maintenanceWarranty",
    source: "attributes",
    inputType: "boolean",
    labelKey: "propertyForm.fields.maintenanceWarranty",
    defaultValue: false,
  }),
  maintenanceResponseTimeHours: createField({
    key: "maintenanceResponseTimeHours",
    source: "attributes",
    inputType: "number",
    labelKey: "propertyForm.fields.maintenanceResponseTimeHours",
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

const SERVICE_FEATURE_FIELDS_BY_CATEGORY = Object.freeze({
  dj: Object.freeze([
    "djMusicGenre",
    "djIncludesSound",
    "djIncludesLighting",
    "djMaxEventCapacity",
    "djTravelsToVenue",
  ]),
  cleaning: Object.freeze([
    "cleaningType",
    "cleaningMaxArea",
    "cleaningStaffCount",
    "cleaningIncludesSupplies",
  ]),
  chef: Object.freeze([
    "chefCuisineType",
    "chefMaxDiners",
    "chefIncludesIngredients",
    "chefIncludesTableware",
    "chefTravelsToLocation",
  ]),
  photography: Object.freeze([
    "photoSpecialty",
    "photoEditedCount",
    "photoIncludesVideo",
    "photoTravelsToLocation",
  ]),
  catering: Object.freeze([
    "cateringServiceType",
    "cateringMinGuests",
    "cateringMaxGuests",
    "cateringIncludesWaiters",
    "cateringIncludesSetup",
    "cateringIncludesTableware",
  ]),
  maintenance: Object.freeze([
    "maintenanceSpecialty",
    "maintenanceIncludesMaterials",
    "maintenanceEmergencyService",
    "maintenanceWarranty",
    "maintenanceResponseTimeHours",
  ]),
});

const FEATURES_BY_RESOURCE_TYPE = Object.freeze({
  vehicle: Object.freeze([
    "vehicleModelYear",
    "vehicleSeats",
    "vehicleDoors",
    "vehicleTransmission",
    "vehicleFuelType",
    "vehicleLuggageCapacity",
  ]),
  service: Object.freeze([]),
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

const COMMERCIAL_CONDITION_FIELDS_BY_TYPE_CATEGORY_AND_MODE = Object.freeze({
  property: Object.freeze({
    house: Object.freeze({
      sale: Object.freeze(["furnished"]),
      rent_long_term: Object.freeze([
        "furnished",
        "petsAllowed",
        "minimumContractDuration",
      ]),
      rent_short_term: Object.freeze([
        "maxGuests",
        "minStayNights",
        "maxStayNights",
        "checkInTime",
        "checkOutTime",
      ]),
    }),
    apartment: Object.freeze({
      sale: Object.freeze(["furnished"]),
      rent_long_term: Object.freeze([
        "furnished",
        "petsAllowed",
        "minimumContractDuration",
      ]),
      rent_short_term: Object.freeze([
        "maxGuests",
        "minStayNights",
        "maxStayNights",
        "checkInTime",
        "checkOutTime",
      ]),
    }),
    commercial: Object.freeze({
      sale: Object.freeze(["furnished"]),
      rent_long_term: Object.freeze([
        "furnished",
        "petsAllowed",
        "minimumContractDuration",
      ]),
      rent_short_term: Object.freeze([]),
    }),
    office: Object.freeze({
      sale: Object.freeze(["furnished"]),
      rent_long_term: Object.freeze([
        "furnished",
        "petsAllowed",
        "minimumContractDuration",
      ]),
      rent_short_term: Object.freeze([]),
    }),
    warehouse: Object.freeze({
      sale: Object.freeze(["furnished"]),
      rent_long_term: Object.freeze([
        "furnished",
        "petsAllowed",
        "minimumContractDuration",
      ]),
      rent_short_term: Object.freeze([]),
    }),
    land: Object.freeze({
      sale: Object.freeze([]),
      rent_long_term: Object.freeze(["minimumContractDuration"]),
      rent_short_term: Object.freeze([]),
    }),
  }),
  vehicle: Object.freeze({
    car: Object.freeze({
      rent_long_term: Object.freeze([]),
      rent_short_term: Object.freeze([]),
    }),
    suv: Object.freeze({
      rent_long_term: Object.freeze([]),
      rent_short_term: Object.freeze([]),
    }),
    pickup: Object.freeze({
      rent_long_term: Object.freeze([]),
      rent_short_term: Object.freeze([]),
    }),
    van: Object.freeze({
      rent_long_term: Object.freeze([]),
      rent_short_term: Object.freeze([]),
    }),
    motorcycle: Object.freeze({
      rent_long_term: Object.freeze([]),
      rent_short_term: Object.freeze([]),
    }),
    boat: Object.freeze({
      rent_long_term: Object.freeze([]),
      rent_short_term: Object.freeze([]),
    }),
  }),
  service: Object.freeze({
    cleaning: Object.freeze({
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
    dj: Object.freeze({
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
    chef: Object.freeze({
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
    photography: Object.freeze({
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
    catering: Object.freeze({
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
    maintenance: Object.freeze({
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
  }),
  experience: Object.freeze({
    tour: Object.freeze({
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
    class: Object.freeze({
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
    workshop: Object.freeze({
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
    adventure: Object.freeze({
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
    wellness: Object.freeze({
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
    gastronomy: Object.freeze({
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
  }),
  venue: Object.freeze({
    event_hall: Object.freeze({
      rent_short_term: Object.freeze([
        "maxGuests",
        "bookingMinUnits",
        "bookingMaxUnits",
        "availabilityStartTime",
        "availabilityEndTime",
      ]),
      rent_hourly: Object.freeze([
        "maxGuests",
        "bookingMinUnits",
        "bookingMaxUnits",
        "availabilityStartTime",
        "availabilityEndTime",
      ]),
    }),
    commercial_local: Object.freeze({
      rent_short_term: Object.freeze([
        "maxGuests",
        "bookingMinUnits",
        "bookingMaxUnits",
        "availabilityStartTime",
        "availabilityEndTime",
      ]),
      rent_hourly: Object.freeze([
        "maxGuests",
        "bookingMinUnits",
        "bookingMaxUnits",
        "availabilityStartTime",
        "availabilityEndTime",
      ]),
    }),
    studio: Object.freeze({
      rent_short_term: Object.freeze([
        "maxGuests",
        "bookingMinUnits",
        "bookingMaxUnits",
        "availabilityStartTime",
        "availabilityEndTime",
      ]),
      rent_hourly: Object.freeze([
        "maxGuests",
        "bookingMinUnits",
        "bookingMaxUnits",
        "availabilityStartTime",
        "availabilityEndTime",
      ]),
    }),
    coworking: Object.freeze({
      rent_short_term: Object.freeze([
        "maxGuests",
        "bookingMinUnits",
        "bookingMaxUnits",
        "availabilityStartTime",
        "availabilityEndTime",
      ]),
      rent_hourly: Object.freeze([
        "maxGuests",
        "bookingMinUnits",
        "bookingMaxUnits",
        "availabilityStartTime",
        "availabilityEndTime",
      ]),
    }),
    meeting_room: Object.freeze({
      rent_short_term: Object.freeze([
        "maxGuests",
        "bookingMinUnits",
        "bookingMaxUnits",
        "availabilityStartTime",
        "availabilityEndTime",
      ]),
      rent_hourly: Object.freeze([
        "maxGuests",
        "bookingMinUnits",
        "bookingMaxUnits",
        "availabilityStartTime",
        "availabilityEndTime",
      ]),
    }),
  }),
});

const resolveFeatureFieldKeys = (resourceType, category) => {
  if (resourceType === "property") {
    return (
      PROPERTY_FEATURE_FIELDS_BY_CATEGORY[category] ||
      PROPERTY_FEATURE_FIELDS_BY_CATEGORY.house
    );
  }

  if (resourceType === "service") {
    return (
      SERVICE_FEATURE_FIELDS_BY_CATEGORY[category] ||
      FEATURES_BY_RESOURCE_TYPE.service
    );
  }

  return FEATURES_BY_RESOURCE_TYPE[resourceType] || [];
};

const resolveCommercialConditionFieldKeys = (
  resourceType,
  category,
  commercialMode,
) => {
  const byCategory =
    COMMERCIAL_CONDITION_FIELDS_BY_TYPE_CATEGORY_AND_MODE[resourceType] || {};
  const byMode =
    byCategory[category] || byCategory[Object.keys(byCategory)[0]] || {};
  return byMode[commercialMode] || [];
};

const COMMON_COMMERCIAL_CONDITION_KEYS = Object.freeze([
  "manualContactScheduleType",
  "slotDurationMinutes",
  "slotBufferMinutes",
]);

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
} = {}) => {
  const normalizedType = normalizeResourceType(resourceType);
  const normalizedCategory = sanitizeCategory(normalizedType, category);
  const normalizedCommercial = sanitizeCommercialMode(
    normalizedType,
    normalizeCommercialMode(commercialMode || "sale"),
    normalizedCategory,
  );

  const featureKeys = toUniqueKeys(
    resolveFeatureFieldKeys(normalizedType, normalizedCategory),
  );
  const commercialConditionKeys = toUniqueKeys([
    ...resolveCommercialConditionFieldKeys(
      normalizedType,
      normalizedCategory,
      normalizedCommercial,
    ),
    ...COMMON_COMMERCIAL_CONDITION_KEYS,
  ]);

  const features = mapFieldKeys(featureKeys);
  const commercialConditions = mapFieldKeys(commercialConditionKeys);

  const allFields = [...features, ...commercialConditions];
  const allFieldKeys = toUniqueKeys(allFields.map((field) => field.key));

  return {
    resourceType: normalizedType,
    category: normalizedCategory,
    commercialMode: normalizedCommercial,
    features,
    commercialConditions,
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
  return t(option.labelKey, {
    defaultValue: option.defaultLabel || option.value,
  });
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
