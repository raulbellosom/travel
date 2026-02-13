export const INTERNAL_BASE_PATH = "/app";

const withInternalBase = (segment) => `${INTERNAL_BASE_PATH}/${segment}`;

export const INTERNAL_ROUTES = Object.freeze({
  dashboard: withInternalBase("dashboard"),
  myProperties: withInternalBase("my-properties"),
  createProperty: withInternalBase("properties/new"),
  leads: withInternalBase("leads"),
  reservations: withInternalBase("reservations"),
  payments: withInternalBase("payments"),
  reviews: withInternalBase("reviews"),
  clients: withInternalBase("clients"),
  team: withInternalBase("team"),
  rootActivity: withInternalBase("activity"),
  rootAmenities: withInternalBase("amenities"),
  rootFunctionsDiagnostics: withInternalBase("functions-health"),
  profile: withInternalBase("profile"),
  settings: withInternalBase("settings"),
});

export const getInternalEditPropertyRoute = (id) =>
  withInternalBase(`properties/${id}/edit`);

export const getLegacyInternalEditPropertyRoute = (id) =>
  withInternalBase(`editar-propiedad/${id}`);
