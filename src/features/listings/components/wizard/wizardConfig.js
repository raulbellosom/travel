/**
 * Wizard step configuration for property creation.
 * Steps are dynamically filtered based on operationType.
 */
import {
  Building2,
  CalendarCheck,
  Camera,
  ClipboardList,
  DollarSign,
  Home,
  MapPin,
  Sparkles,
} from "lucide-react";
import { getResourceFormProfile } from "../../../../utils/resourceFormProfile";

/** Default form values for property creation wizard */
export const WIZARD_DEFAULTS = {
  // Step 1: Type & Info
  resourceType: "property",
  category: "house",
  commercialMode: "sale",
  pricingModel: "total",
  bookingType: "manual_contact",
  attributes: "{}",
  propertyType: "house",
  operationType: "sale",
  title: "",
  slug: "",
  description: "",

  // Step 2: Location
  country: "MX",
  state: "",
  city: "",
  streetAddress: "",
  neighborhood: "",
  postalCode: "",
  latitude: "",
  longitude: "",

  // Step 3: Features
  bedrooms: "0",
  bathrooms: "0",
  parkingSpaces: "0",
  totalArea: "",
  builtArea: "",
  floors: "1",
  yearBuilt: "",

  // Step 3b: Rent terms (rent only)
  furnished: "",
  petsAllowed: false,
  rentPeriod: "monthly",

  // Step 3c: Vacation rules (vacation_rental only)
  maxGuests: "1",
  minStayNights: "1",
  maxStayNights: "365",
  checkInTime: "15:00",
  checkOutTime: "11:00",

  // Step 4: Pricing
  price: "",
  currency: "MXN",
  pricePerUnit: "total",
  priceNegotiable: false,

  // Step 5: Amenities
  amenityIds: [],

  // Step 6: Images
  videoUrl: "",
  virtualTourUrl: "",

  // Internal
  status: "draft",
  featured: false,
};

/** All wizard step definitions */
export const WIZARD_STEPS = [
  {
    id: "typeAndInfo",
    titleKey: "propertyForm.wizard.steps.typeAndInfo",
    descriptionKey: "propertyForm.wizard.steps.typeAndInfoDesc",
    icon: Home,
    fields: [
      "resourceType",
      "category",
      "commercialMode",
      "propertyType",
      "operationType",
      "title",
      "slug",
      "description",
    ],
    appliesTo: ["sale", "rent", "vacation_rental", "rent_hourly"],
  },
  {
    id: "location",
    titleKey: "propertyForm.wizard.steps.location",
    descriptionKey: "propertyForm.wizard.steps.locationDesc",
    icon: MapPin,
    fields: [
      "country",
      "state",
      "city",
      "streetAddress",
      "neighborhood",
      "postalCode",
      "latitude",
      "longitude",
    ],
    appliesTo: ["sale", "rent", "vacation_rental", "rent_hourly"],
  },
  {
    id: "features",
    titleKey: "propertyForm.wizard.steps.features",
    descriptionKey: "propertyForm.wizard.steps.featuresDesc",
    icon: Building2,
    fields: [],
    appliesTo: ["sale", "rent", "vacation_rental", "rent_hourly"],
  },
  {
    id: "rentalTerms",
    titleKey: "propertyForm.wizard.steps.rentalTerms",
    descriptionKey: "propertyForm.wizard.steps.rentalTermsDesc",
    icon: ClipboardList,
    fields: [],
    appliesTo: ["rent"],
  },
  {
    id: "vacationRules",
    titleKey: "propertyForm.wizard.steps.vacationRules",
    descriptionKey: "propertyForm.wizard.steps.vacationRulesDesc",
    icon: CalendarCheck,
    fields: [],
    appliesTo: ["vacation_rental", "rent_hourly"],
  },
  {
    id: "pricing",
    titleKey: "propertyForm.wizard.steps.pricing",
    descriptionKey: "propertyForm.wizard.steps.pricingDesc",
    icon: DollarSign,
    fields: ["price", "currency", "pricePerUnit", "priceNegotiable"],
    appliesTo: ["sale", "rent", "vacation_rental", "rent_hourly"],
  },
  {
    id: "amenities",
    titleKey: "propertyForm.wizard.steps.amenities",
    descriptionKey: "propertyForm.wizard.steps.amenitiesDesc",
    icon: Sparkles,
    fields: ["amenityIds"],
    appliesTo: ["sale", "rent", "vacation_rental", "rent_hourly"],
  },
  {
    id: "images",
    titleKey: "propertyForm.wizard.steps.images",
    descriptionKey: "propertyForm.wizard.steps.imagesDesc",
    icon: Camera,
    fields: ["videoUrl", "virtualTourUrl", "imageFiles"],
    appliesTo: ["sale", "rent", "vacation_rental", "rent_hourly"],
  },
];

/** Summary step is always last and added dynamically */
export const SUMMARY_STEP = {
  id: "summary",
  titleKey: "propertyForm.wizard.steps.summary",
  descriptionKey: "propertyForm.wizard.steps.summaryDesc",
  icon: ClipboardList,
  fields: [],
  appliesTo: ["sale", "rent", "vacation_rental", "rent_hourly"],
};

/**
 * Get the active wizard steps for a given operation type.
 * Includes the summary step at the end.
 */
const resolveAllowedOperationTypes = (modulesApi = {}) => {
  const isEnabled =
    typeof modulesApi.isEnabled === "function"
      ? modulesApi.isEnabled
      : () => true;

  return [
    "sale",
    "rent",
    ...(isEnabled("module.booking.short_term") ? ["vacation_rental"] : []),
    ...(isEnabled("module.booking.hourly") ? ["rent_hourly"] : []),
  ];
};

export const getActiveSteps = (
  operationType = "sale",
  modulesApi = {},
  resourceContext = {},
) => {
  const allowedOperations = resolveAllowedOperationTypes(modulesApi);
  const effectiveOperation = allowedOperations.includes(operationType)
    ? operationType
    : "sale";

  const profile = getResourceFormProfile(resourceContext);
  const dynamicFieldsByStep = {
    features: profile.features.map((field) => field.key),
    rentalTerms: profile.rentalTerms.map((field) => field.key),
    vacationRules: profile.vacationRules.map((field) => field.key),
  };

  const steps = WIZARD_STEPS.filter((step) => {
    if (!step.appliesTo.includes(effectiveOperation)) return false;
    const dynamicFields = dynamicFieldsByStep[step.id];
    if (!dynamicFields) return true;
    return dynamicFields.length > 0;
  }).map((step) => {
    const dynamicFields = dynamicFieldsByStep[step.id];
    if (!dynamicFields) return step;
    return {
      ...step,
      fields: dynamicFields,
    };
  });

  return [...steps, SUMMARY_STEP];
};

/** Property type options */
export const PROPERTY_TYPES = [
  { value: "house", key: "propertyForm.options.propertyType.house" },
  { value: "apartment", key: "propertyForm.options.propertyType.apartment" },
  { value: "land", key: "propertyForm.options.propertyType.land" },
  { value: "commercial", key: "propertyForm.options.propertyType.commercial" },
  { value: "office", key: "propertyForm.options.propertyType.office" },
  { value: "warehouse", key: "propertyForm.options.propertyType.warehouse" },
];

/** Operation type options */
export const OPERATION_TYPES = [
  {
    value: "sale",
    commercialMode: "sale",
    key: "propertyForm.options.operationType.sale",
  },
  {
    value: "rent",
    commercialMode: "rent_long_term",
    key: "propertyForm.options.operationType.rent",
  },
  {
    value: "vacation_rental",
    commercialMode: "rent_short_term",
    moduleKey: "module.booking.short_term",
    key: "propertyForm.options.operationType.vacationRental",
  },
  {
    value: "rent_hourly",
    commercialMode: "rent_hourly",
    moduleKey: "module.booking.hourly",
    key: "propertyForm.options.operationType.hourly",
  },
];

/** Currency options */
export const CURRENCY_OPTIONS = [
  { value: "MXN", label: "MXN — Peso Mexicano" },
  { value: "USD", label: "USD — Dólar Americano" },
  { value: "EUR", label: "EUR — Euro" },
];

/** Price per unit options */
export const PRICE_PER_UNIT_OPTIONS = [
  { value: "total", key: "propertyForm.options.pricePer.total" },
  { value: "sqm", key: "propertyForm.options.pricePer.sqm" },
  { value: "sqft", key: "propertyForm.options.pricePer.sqft" },
];

/** Canonical pricing model options */
export const PRICING_MODEL_OPTIONS = [
  { value: "total", key: "propertyForm.options.pricingModel.total" },
  { value: "per_month", key: "propertyForm.options.pricingModel.perMonth" },
  { value: "per_night", key: "propertyForm.options.pricingModel.perNight" },
  { value: "per_day", key: "propertyForm.options.pricingModel.perDay" },
  { value: "per_hour", key: "propertyForm.options.pricingModel.perHour" },
  { value: "per_person", key: "propertyForm.options.pricingModel.perPerson" },
  { value: "per_event", key: "propertyForm.options.pricingModel.perEvent" },
  { value: "per_m2", key: "propertyForm.options.pricingModel.perM2" },
];

/** Furnished options */
export const FURNISHED_OPTIONS = [
  { value: "", key: "propertyForm.options.furnished.unspecified" },
  {
    value: "unfurnished",
    key: "propertyForm.options.furnished.unfurnished",
  },
  {
    value: "semi_furnished",
    key: "propertyForm.options.furnished.semiFurnished",
  },
  { value: "furnished", key: "propertyForm.options.furnished.furnished" },
];

/** Rent period options */
export const RENT_PERIOD_OPTIONS = [
  { value: "weekly", key: "propertyForm.options.rentPeriod.weekly" },
  { value: "monthly", key: "propertyForm.options.rentPeriod.monthly" },
  { value: "yearly", key: "propertyForm.options.rentPeriod.yearly" },
];

/** Image upload constants */
export const MAX_PROPERTY_IMAGES = 50;
export const MAX_PROPERTY_IMAGE_SIZE_MB = 10;
export const MAX_PROPERTY_IMAGE_SIZE_BYTES =
  MAX_PROPERTY_IMAGE_SIZE_MB * 1024 * 1024;
export const PROPERTY_IMAGE_ACCEPT = "image/png,image/jpeg,image/webp";

/** Shared CSS class names */
export const inputClassName =
  "min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100";

export const inputErrorClassName =
  "border-red-400 focus:border-red-500 focus:ring-red-500/20 dark:border-red-700 dark:focus:border-red-500";

export const comboboxInputClassName = `${inputClassName} pr-9`;
