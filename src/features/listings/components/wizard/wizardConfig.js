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

/** Default form values for property creation wizard */
export const WIZARD_DEFAULTS = {
  // Step 1: Type & Info
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
    fields: ["propertyType", "operationType", "title", "slug", "description"],
    appliesTo: ["sale", "rent", "vacation_rental"],
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
    appliesTo: ["sale", "rent", "vacation_rental"],
  },
  {
    id: "features",
    titleKey: "propertyForm.wizard.steps.features",
    descriptionKey: "propertyForm.wizard.steps.featuresDesc",
    icon: Building2,
    fields: [
      "bedrooms",
      "bathrooms",
      "parkingSpaces",
      "totalArea",
      "builtArea",
      "floors",
      "yearBuilt",
    ],
    appliesTo: ["sale", "rent", "vacation_rental"],
  },
  {
    id: "rentalTerms",
    titleKey: "propertyForm.wizard.steps.rentalTerms",
    descriptionKey: "propertyForm.wizard.steps.rentalTermsDesc",
    icon: ClipboardList,
    fields: ["furnished", "petsAllowed", "rentPeriod"],
    appliesTo: ["rent"],
  },
  {
    id: "vacationRules",
    titleKey: "propertyForm.wizard.steps.vacationRules",
    descriptionKey: "propertyForm.wizard.steps.vacationRulesDesc",
    icon: CalendarCheck,
    fields: [
      "maxGuests",
      "minStayNights",
      "maxStayNights",
      "checkInTime",
      "checkOutTime",
      "furnished",
      "petsAllowed",
    ],
    appliesTo: ["vacation_rental"],
  },
  {
    id: "pricing",
    titleKey: "propertyForm.wizard.steps.pricing",
    descriptionKey: "propertyForm.wizard.steps.pricingDesc",
    icon: DollarSign,
    fields: ["price", "currency", "pricePerUnit", "priceNegotiable"],
    appliesTo: ["sale", "rent", "vacation_rental"],
  },
  {
    id: "amenities",
    titleKey: "propertyForm.wizard.steps.amenities",
    descriptionKey: "propertyForm.wizard.steps.amenitiesDesc",
    icon: Sparkles,
    fields: ["amenityIds"],
    appliesTo: ["sale", "rent", "vacation_rental"],
  },
  {
    id: "images",
    titleKey: "propertyForm.wizard.steps.images",
    descriptionKey: "propertyForm.wizard.steps.imagesDesc",
    icon: Camera,
    fields: ["videoUrl", "virtualTourUrl", "imageFiles"],
    appliesTo: ["sale", "rent", "vacation_rental"],
  },
];

/** Summary step is always last and added dynamically */
export const SUMMARY_STEP = {
  id: "summary",
  titleKey: "propertyForm.wizard.steps.summary",
  descriptionKey: "propertyForm.wizard.steps.summaryDesc",
  icon: ClipboardList,
  fields: [],
  appliesTo: ["sale", "rent", "vacation_rental"],
};

/**
 * Get the active wizard steps for a given operation type.
 * Includes the summary step at the end.
 */
export const getActiveSteps = (operationType = "sale") => {
  const steps = WIZARD_STEPS.filter((step) =>
    step.appliesTo.includes(operationType),
  );
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
  { value: "sale", key: "propertyForm.options.operationType.sale" },
  { value: "rent", key: "propertyForm.options.operationType.rent" },
  {
    value: "vacation_rental",
    key: "propertyForm.options.operationType.vacationRental",
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
