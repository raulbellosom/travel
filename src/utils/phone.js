import {
  getCountries,
  getCountryCallingCode,
  parsePhoneNumberFromString,
} from "libphonenumber-js/min";

export const PHONE_DIAL_CODE_REGEX = /^\+[1-9][0-9]{0,3}$/;
export const PHONE_LOCAL_NUMBER_REGEX = /^[0-9]{6,15}$/;

const buildDisplayNames = (locale) => {
  if (typeof Intl === "undefined" || typeof Intl.DisplayNames !== "function") {
    return null;
  }

  try {
    return new Intl.DisplayNames([locale || "en", "en"], { type: "region" });
  } catch {
    return null;
  }
};

export const sanitizePhoneLocalNumber = (value) =>
  String(value || "")
    .replace(/\D/g, "")
    .slice(0, 15);

export const normalizePhoneDialCode = (value) => {
  const digits = String(value || "")
    .replace(/\D/g, "")
    .slice(0, 4);

  return digits ? `+${digits}` : "";
};

export const isValidPhoneDialCode = (value) =>
  PHONE_DIAL_CODE_REGEX.test(String(value || "").trim());

export const isValidPhoneLocalNumber = (value) =>
  PHONE_LOCAL_NUMBER_REGEX.test(String(value || "").trim());

export const buildE164Phone = ({ dialCode, localNumber }) => {
  const normalizedDialCode = normalizePhoneDialCode(dialCode);
  const normalizedLocalNumber = sanitizePhoneLocalNumber(localNumber);

  if (!normalizedLocalNumber) return "";
  if (!isValidPhoneDialCode(normalizedDialCode)) return "";
  if (!isValidPhoneLocalNumber(normalizedLocalNumber)) return "";

  return `${normalizedDialCode}${normalizedLocalNumber}`;
};

export const splitE164Phone = (value) => {
  const raw = String(value || "").trim();
  if (!raw) return { dialCode: "", localNumber: "" };

  const parsed = parsePhoneNumberFromString(raw);
  if (!parsed?.isValid()) {
    return { dialCode: "", localNumber: "" };
  }

  return {
    dialCode: `+${parsed.countryCallingCode}`,
    localNumber: parsed.nationalNumber || "",
  };
};

export const isValidPhoneCombination = ({ dialCode, localNumber }) => {
  const e164 = buildE164Phone({ dialCode, localNumber });
  if (!e164) return false;

  const parsed = parsePhoneNumberFromString(e164);
  return Boolean(parsed?.isValid());
};

export const formatPhoneForDisplay = ({ dialCode, localNumber }) => {
  const e164 = buildE164Phone({ dialCode, localNumber });
  if (!e164) return "";

  const parsed = parsePhoneNumberFromString(e164);
  if (parsed?.isValid()) {
    return parsed.formatInternational();
  }

  return `${dialCode} ${localNumber}`.trim();
};

export const getCountryDialCodeOptions = (locale = "en") => {
  const displayNames = buildDisplayNames(locale);

  return getCountries()
    .map((countryCode) => {
      const dialCode = `+${getCountryCallingCode(countryCode)}`;
      const countryName = displayNames?.of(countryCode) || countryCode;
      return {
        value: dialCode,
        label: `${countryName} (${dialCode})`,
        searchText: `${countryName} ${countryCode} ${dialCode}`,
      };
    })
    .sort((a, b) => a.label.localeCompare(b.label));
};

