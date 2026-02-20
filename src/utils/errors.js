const INTERNAL_MESSAGE_PATTERNS = [
  /\b(root|owner|staff_[a-z_]+|client)\b/i,
  /\bscopes?\b/i,
  /\bpermissions?\b/i,
  /\b(forbidden|unauthorized)\b/i,
  /\b(appwrite|execution|function|database|collection)\b/i,
  /\bAPPWRITE_[A-Z0-9_]+\b/,
];

const extractErrorMessage = (error) => {
  if (!error) return "";
  if (typeof error === "string") return error.trim();
  const responseMessage = String(error?.response?.message || "").trim();
  if (responseMessage) return responseMessage;
  return String(error?.message || "").trim();
};

const isInternalMessage = (message) => {
  if (!message) return false;
  return INTERNAL_MESSAGE_PATTERNS.some((pattern) => pattern.test(message));
};

const normalizeKnownMessage = (message) => {
  if (!message) return "";

  if (
    /attribute\s+"longitude".*range between -90 and 90/i.test(message) ||
    /attribute\s+"longitude".*min.*-90.*max.*90/i.test(message)
  ) {
    return "La base de datos tiene el campo longitude mal configurado. Debe permitir valores entre -180 y 180.";
  }

  return message;
};

export const getErrorMessage = (error, fallback = "Ocurrio un error inesperado.") => {
  const message = normalizeKnownMessage(extractErrorMessage(error));
  if (!message) return fallback;
  return isInternalMessage(message) ? fallback : message;
};

export const isUnauthorizedError = (error) => {
  return Number(error?.code) === 401 || Number(error?.response?.code) === 401;
};
