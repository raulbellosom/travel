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

export const getErrorMessage = (error, fallback = "Ocurrio un error inesperado.") => {
  const message = extractErrorMessage(error);
  if (!message) return fallback;
  return isInternalMessage(message) ? fallback : message;
};

export const isUnauthorizedError = (error) => {
  return Number(error?.code) === 401 || Number(error?.response?.code) === 401;
};
