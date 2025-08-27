import React from "react";
import { useTranslation } from "react-i18next";

/**
 * PriceBadge component for displaying pricing with currency formatting.
 * Supports multiple currencies, periods, and tooltips with breakdown.
 */
const PriceBadge = ({
  amount,
  currency = "USD",
  period = "night",
  locale = "es-MX", // Default to Mexican Spanish
  variant = "default",
  size = "md",
  showTooltip = false,
  breakdown,
  originalAmount,
  className = "",
  ...props
}) => {
  const { t, i18n } = useTranslation();

  // Format currency based on locale and currency
  const formatCurrency = (amount, currency, locale) => {
    try {
      return new Intl.NumberFormat(locale, {
        style: "currency",
        currency: currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(amount);
    } catch (error) {
      // Fallback formatting
      const symbols = {
        USD: "$",
        EUR: "€",
        MXN: "$",
        CAD: "C$",
        GBP: "£",
      };
      return `${symbols[currency] || currency} ${amount.toLocaleString()}`;
    }
  };

  // Get period text with i18n
  const getPeriodText = (period) => {
    const periods = {
      night: t("pricing.perNight", "per night"),
      day: t("pricing.perDay", "per day"),
      week: t("pricing.perWeek", "per week"),
      month: t("pricing.perMonth", "per month"),
      person: t("pricing.perPerson", "per person"),
      hour: t("pricing.perHour", "per hour"),
    };
    return periods[period] || period;
  };

  // Variant styles
  const variantStyles = {
    default: ["text-gray-900 dark:text-gray-100"],
    highlighted: ["text-blue-600 dark:text-blue-400 font-semibold"],
    large: ["text-gray-900 dark:text-gray-100 font-bold"],
    card: ["text-gray-800 dark:text-gray-200"],
  };

  // Size styles
  const sizeStyles = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
    xl: "text-xl",
    "2xl": "text-2xl",
  };

  // Combine styles
  const safeSize = sizeStyles[size] ? size : "md";
  const safeVariant = variantStyles[variant] ? variant : "primary";
  const priceStyles = [
    "inline-flex items-baseline gap-1",
    ...variantStyles[safeVariant],
    sizeStyles[safeSize],
    className,
  ].join(" ");

  // Format the main price
  const formattedPrice = formatCurrency(amount, currency, locale);

  // Calculate total if breakdown is provided
  const totalWithBreakdown = breakdown
    ? amount + (breakdown.fees || 0) + (breakdown.taxes || 0)
    : amount;

  return (
    <div className="relative inline-block">
      <span className={priceStyles} {...props}>
        <span className="font-semibold">{formattedPrice}</span>
        <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
          {getPeriodText(period)}
        </span>
      </span>

      {/* Tooltip with breakdown (if provided) */}
      {showTooltip && breakdown && (
        <div className="absolute z-10 w-64 p-3 mt-2 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>{t("pricing.basePrice", "Base price")}</span>
              <span>{formatCurrency(amount, currency, locale)}</span>
            </div>

            {breakdown.fees && (
              <div className="flex justify-between">
                <span>{t("pricing.serviceFees", "Service fees")}</span>
                <span>{formatCurrency(breakdown.fees, currency, locale)}</span>
              </div>
            )}

            {breakdown.taxes && (
              <div className="flex justify-between">
                <span>{t("pricing.taxes", "Taxes")}</span>
                <span>{formatCurrency(breakdown.taxes, currency, locale)}</span>
              </div>
            )}

            <hr className="border-gray-200 dark:border-gray-600" />

            <div className="flex justify-between font-semibold">
              <span>{t("pricing.total", "Total")}</span>
              <span>
                {formatCurrency(totalWithBreakdown, currency, locale)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PriceBadge;
