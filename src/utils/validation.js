export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;

export const isValidEmail = (value) => EMAIL_REGEX.test(String(value || "").trim());

export const getPasswordChecks = (password) => {
  const raw = String(password || "");
  const hasMinLength = raw.length >= 8;
  const hasLower = /[a-z]/.test(raw);
  const hasUpper = /[A-Z]/.test(raw);
  const hasNumber = /[0-9]/.test(raw);
  const hasSymbol = /[^A-Za-z0-9]/.test(raw);
  const categoryCount = [hasLower, hasUpper, hasNumber, hasSymbol].filter(Boolean).length;

  return {
    hasMinLength,
    hasLower,
    hasUpper,
    hasNumber,
    hasSymbol,
    categoryCount,
  };
};

export const getPasswordStrengthScore = (password) => {
  const checks = getPasswordChecks(password);
  const raw = String(password || "");
  let score = 0;

  if (checks.hasMinLength) score += 1;
  if (checks.categoryCount >= 2) score += 1;
  if (checks.categoryCount >= 3) score += 1;
  if (checks.categoryCount >= 4 || raw.length >= 12) score += 1;

  return Math.max(0, Math.min(4, score));
};

export const isStrongPassword = (password) => {
  const checks = getPasswordChecks(password);
  return checks.hasMinLength && checks.categoryCount >= 3;
};
