export const INTERNAL_BASE_PATH = "/app";

export const INTERNAL_ROUTES = Object.freeze({
  dashboard: `${INTERNAL_BASE_PATH}/dashboard`,
  myProperties: `${INTERNAL_BASE_PATH}/mis-propiedades`,
  createProperty: `${INTERNAL_BASE_PATH}/crear-propiedad`,
  leads: `${INTERNAL_BASE_PATH}/leads`,
  clients: `${INTERNAL_BASE_PATH}/clientes`,
  team: `${INTERNAL_BASE_PATH}/equipo`,
  settings: `${INTERNAL_BASE_PATH}/configuracion`,
});

export const getInternalEditPropertyRoute = (id) =>
  `${INTERNAL_BASE_PATH}/editar-propiedad/${id}`;
