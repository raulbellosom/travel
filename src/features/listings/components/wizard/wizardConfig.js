/**
 * Wizard step configuration for property creation.
 * Steps are dynamically filtered based on commercialMode.
 */
import {
  Building2,
  Camera,
  ClipboardList,
  DollarSign,
  Home,
  MapPin,
  Sparkles,
} from "lucide-react";
import { getResourceFormProfile } from "../../../../utils/resourceFormProfile";
import { getAllowedCommercialModes } from "../../../../utils/resourceTaxonomy";

/** Default form values for property creation wizard */
export const WIZARD_DEFAULTS = {
  // Step 1: Type & Info
  resourceType: "property",
  category: "house",
  commercialMode: "sale",
  pricingModel: "fixed_total",
  bookingType: "manual_contact",
  attributes: "{}",
  propertyType: "house",
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

  // Step 3c: Booking/commercial conditions
  maxGuests: "1",
  minStayNights: "1",
  maxStayNights: "365",
  checkInTime: "15:00",
  checkOutTime: "11:00",

  // Step 4: Pricing
  price: "",
  currency: "MXN",
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
      "title",
      "slug",
      "description",
    ],
    appliesTo: ["sale", "rent_long_term", "rent_short_term", "rent_hourly"],
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
    appliesTo: ["sale", "rent_long_term", "rent_short_term", "rent_hourly"],
  },
  {
    id: "features",
    titleKey: "propertyForm.wizard.steps.features",
    descriptionKey: "propertyForm.wizard.steps.featuresDesc",
    icon: Building2,
    fields: [],
    appliesTo: ["sale", "rent_long_term", "rent_short_term", "rent_hourly"],
  },
  {
    id: "commercialConditions",
    titleKey: "propertyForm.wizard.steps.commercialConditions",
    descriptionKey: "propertyForm.wizard.steps.commercialConditionsDesc",
    icon: ClipboardList,
    fields: [],
    appliesTo: ["sale", "rent_long_term", "rent_short_term", "rent_hourly"],
  },
  {
    id: "pricing",
    titleKey: "propertyForm.wizard.steps.pricing",
    descriptionKey: "propertyForm.wizard.steps.pricingDesc",
    icon: DollarSign,
    fields: ["price", "currency", "pricingModel", "priceNegotiable"],
    appliesTo: ["sale", "rent_long_term", "rent_short_term", "rent_hourly"],
  },
  {
    id: "amenities",
    titleKey: "propertyForm.wizard.steps.amenities",
    descriptionKey: "propertyForm.wizard.steps.amenitiesDesc",
    icon: Sparkles,
    fields: ["amenityIds"],
    appliesTo: ["sale", "rent_long_term", "rent_short_term", "rent_hourly"],
  },
  {
    id: "images",
    titleKey: "propertyForm.wizard.steps.images",
    descriptionKey: "propertyForm.wizard.steps.imagesDesc",
    icon: Camera,
    fields: ["videoUrl", "virtualTourUrl", "imageFiles"],
    appliesTo: ["sale", "rent_long_term", "rent_short_term", "rent_hourly"],
  },
];

/** Summary step is always last and added dynamically */
export const SUMMARY_STEP = {
  id: "summary",
  titleKey: "propertyForm.wizard.steps.summary",
  descriptionKey: "propertyForm.wizard.steps.summaryDesc",
  icon: ClipboardList,
  fields: [],
  appliesTo: ["sale", "rent_long_term", "rent_short_term", "rent_hourly"],
};

/**
 * Get the active wizard steps for a given commercial mode.
 * Includes the summary step at the end.
 */
const resolveAllowedCommercialModes = (
  resourceType = WIZARD_DEFAULTS.resourceType,
  category = WIZARD_DEFAULTS.category,
) => {
  return getAllowedCommercialModes(resourceType, category);
};

export const getActiveSteps = (
  commercialMode = "sale",
  modulesApi = {},
  resourceContext = {},
) => {
  void modulesApi;
  const baseProfile = getResourceFormProfile({
    ...resourceContext,
    commercialMode,
  });
  const allowedCommercialModes = resolveAllowedCommercialModes(
    baseProfile.resourceType,
    baseProfile.category,
  );
  const effectiveCommercialMode = allowedCommercialModes.includes(
    baseProfile.commercialMode,
  )
    ? baseProfile.commercialMode
    : allowedCommercialModes[0];
  const profile =
    effectiveCommercialMode === baseProfile.commercialMode
      ? baseProfile
      : getResourceFormProfile({
          ...resourceContext,
          resourceType: baseProfile.resourceType,
          category: baseProfile.category,
          commercialMode: effectiveCommercialMode,
        });

  const dynamicFieldsByStep = {
    features: profile.features.map((field) => field.key),
    commercialConditions: profile.commercialConditions.map((field) => field.key),
  };

  const steps = WIZARD_STEPS.filter((step) => {
    if (!step.appliesTo.includes(effectiveCommercialMode)) return false;
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

/** Commercial mode options */
export const COMMERCIAL_MODE_OPTIONS = [
  {
    value: "sale",
    key: "propertyForm.options.commercialMode.sale",
  },
  {
    value: "rent_long_term",
    key: "propertyForm.options.commercialMode.rentLongTerm",
  },
  {
    value: "rent_short_term",
    moduleKey: "module.booking.short_term",
    key: "propertyForm.options.commercialMode.rentShortTerm",
  },
  {
    value: "rent_hourly",
    moduleKey: "module.booking.hourly",
    key: "propertyForm.options.commercialMode.rentHourly",
  },
];

/** Currency options */
export const CURRENCY_OPTIONS = [
  { value: "MXN", label: "MXN — Peso Mexicano" },
  { value: "USD", label: "USD — Dólar Americano" },
  { value: "EUR", label: "EUR — Euro" },
];

/** Canonical pricing model options */
export const PRICING_MODEL_OPTIONS = [
  { value: "fixed_total", key: "propertyForm.options.pricingModel.fixedTotal" },
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
