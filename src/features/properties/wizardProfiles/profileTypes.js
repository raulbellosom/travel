/**
 * wizardProfiles/profileTypes.js
 * Centralized ids to avoid scattering raw strings.
 *
 * NOTE:
 * - Keep these stable. They must match backend enums/catalogs.
 * - UI labels are resolved via i18n keys, not these ids.
 */

export const RESOURCE_TYPES = Object.freeze({
  property: "property",
  service: "service",
  music: "music",
  vehicle: "vehicle",
  experience: "experience",
  venue: "venue",
});

export const COMMERCIAL_MODES = Object.freeze({
  sale: "sale",
  rent_long_term: "rent_long_term",
  rent_short_term: "rent_short_term",
  rent_hourly: "rent_hourly",
});

export const BOOKING_TYPES = Object.freeze({
  manual_contact: "manual_contact",
  date_range: "date_range",
  time_slot: "time_slot",
  fixed_event: "fixed_event",
});

// Backend enum for pricingModel.
// UI will use a human "pricingChoiceId" (e.g. fixed_total) and profiles will map -> one of these.
export const PRICING_MODELS = Object.freeze({
  fixed_total: "fixed_total",
  total: "total",
  per_month: "per_month",
  per_night: "per_night",
  per_day: "per_day",
  per_hour: "per_hour",
  per_person: "per_person",
  per_event: "per_event",
  per_m2: "per_m2",
});

// Common currencies (extend as needed)
export const CURRENCIES = Object.freeze({
  MXN: "MXN",
  USD: "USD",
  EUR: "EUR",
});
