const DEFAULT_CURRENCY = "MXN";

const normalizeNumber = (value) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
};

const normalizeCurrency = (currency) => {
  const value = String(currency || DEFAULT_CURRENCY).trim().toUpperCase();
  return value || DEFAULT_CURRENCY;
};

const createCurrencyFormatter = ({
  locale = "es-MX",
  currency = DEFAULT_CURRENCY,
  minimumFractionDigits = 2,
  maximumFractionDigits = 2,
} = {}) => {
  const normalizedCurrency = normalizeCurrency(currency);
  try {
    return {
      formatter: new Intl.NumberFormat(locale, {
        style: "currency",
        currency: normalizedCurrency,
        minimumFractionDigits,
        maximumFractionDigits,
      }),
      currency: normalizedCurrency,
    };
  } catch {
    return {
      formatter: new Intl.NumberFormat(locale, {
        style: "currency",
        currency: DEFAULT_CURRENCY,
        minimumFractionDigits,
        maximumFractionDigits,
      }),
      currency: DEFAULT_CURRENCY,
    };
  }
};

export const formatMoneyWithDenomination = (
  value,
  {
    locale = "es-MX",
    currency = DEFAULT_CURRENCY,
    minimumFractionDigits = 2,
    maximumFractionDigits = 2,
    showDenomination = true,
  } = {},
) => {
  const amount = normalizeNumber(value);
  const { formatter, currency: currencyCode } = createCurrencyFormatter({
    locale,
    currency,
    minimumFractionDigits,
    maximumFractionDigits,
  });
  const formatted = formatter.format(amount);
  return showDenomination ? `${formatted} ${currencyCode}` : formatted;
};

export const formatMoneyParts = (
  value,
  {
    locale = "es-MX",
    currency = DEFAULT_CURRENCY,
    minimumFractionDigits = 2,
    maximumFractionDigits = 2,
  } = {},
) => {
  const amount = normalizeNumber(value);
  const { formatter, currency: currencyCode } = createCurrencyFormatter({
    locale,
    currency,
    minimumFractionDigits,
    maximumFractionDigits,
  });
  const parts = formatter.formatToParts(amount);
  const main = parts
    .filter((part) => part.type !== "decimal" && part.type !== "fraction")
    .map((part) => part.value)
    .join("")
    .trim();
  const decimalPart = parts.find((part) => part.type === "decimal")?.value || ".";
  const fractionPart =
    parts.find((part) => part.type === "fraction")?.value ||
    "0".repeat(Math.max(minimumFractionDigits, 0));
  const decimals = fractionPart ? `${decimalPart}${fractionPart}` : "";

  return {
    main,
    decimals,
    denomination: currencyCode,
    value: formatter.format(amount),
  };
};

