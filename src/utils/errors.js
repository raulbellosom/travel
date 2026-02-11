export const getErrorMessage = (error, fallback = "Ocurrió un error inesperado.") => {
  if (!error) return fallback;
  if (typeof error === "string") return error;
  if (error?.message) return error.message;
  if (error?.response?.message) return error.response.message;
  return fallback;
};

export const isUnauthorizedError = (error) => {
  return Number(error?.code) === 401 || Number(error?.response?.code) === 401;
};
