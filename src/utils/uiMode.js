import env from "../env";

const normalizeUiMode = (value) => {
  const normalized = String(value || "")
    .trim()
    .toLowerCase();
  if (normalized === "marketing" || normalized === "platform") {
    return normalized;
  }
  return "";
};

export const resolveUiMode = (settings) => {
  const normalizedUiMode = normalizeUiMode(settings?.uiMode);
  if (normalizedUiMode) return normalizedUiMode;
  if (settings?.marketingEnabled === true) return "marketing";
  if (settings?.marketingEnabled === false) return "platform";

  // Local fallback only when instance settings are unavailable.
  if (env.features.marketingSite === true) return "marketing";
  if (env.features.marketingSite === false) return "platform";
  return "platform";
};
