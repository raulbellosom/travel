import React from "react";
import { useTranslation } from "react-i18next";
import {
  formatMoneyParts,
  formatMoneyWithDenomination,
} from "../../../../utils/money";

const PriceBadge = ({
  amount,
  currency = "USD",
  period = "night",
  locale = "es-MX",
  variant = "default",
  size = "md",
  showTooltip = false,
  breakdown,
  className = "",
  ...props
}) => {
  const { t } = useTranslation();

  const formatCurrency = (amount, currentCurrency, currentLocale) =>
    formatMoneyWithDenomination(amount, {
      currency: currentCurrency,
      locale: currentLocale,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  const getPeriodText = (period) => {
    const periods = {
      night: t("pricing.perNight"),
      day: t("pricing.perDay"),
      week: t("pricing.perWeek"),
      month: t("pricing.perMonth"),
      person: t("pricing.perPerson"),
      hour: t("pricing.perHour"),
    };
    return periods[period] || period;
  };

  const variantStyles = {
    default: ["text-gray-900 dark:text-gray-100"],
    highlighted: ["text-blue-600 dark:text-blue-400 font-semibold"],
    large: ["text-gray-900 dark:text-gray-100 font-bold"],
    card: ["text-gray-800 dark:text-gray-200"],
  };

  const sizeStyles = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
    xl: "text-xl",
    "2xl": "text-2xl",
  };

  const safeSize = sizeStyles[size] ? size : "md";
  const safeVariant = variantStyles[variant] ? variant : "primary";
  const priceStyles = [
    "inline-flex items-baseline gap-1",
    ...variantStyles[safeVariant],
    sizeStyles[safeSize],
    className,
  ].join(" ");

  const formattedPriceParts = formatMoneyParts(amount, {
    currency,
    locale,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const totalWithBreakdown = breakdown
    ? amount + (breakdown.fees || 0) + (breakdown.taxes || 0)
    : amount;

  return (
    <div className="relative inline-block">
      <span className={priceStyles} {...props}>
        <span className="font-semibold">
          <span>{formattedPriceParts.main}</span>
          <span className="ml-0.5 align-top text-xs font-semibold opacity-85">
            {formattedPriceParts.decimals}
          </span>
          <span className="ml-1 text-xs font-semibold opacity-85">
            {formattedPriceParts.denomination}
          </span>
        </span>
        <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
          {getPeriodText(period)}
        </span>
      </span>

      {showTooltip && breakdown && (
        <div className="absolute z-10 w-64 p-3 mt-2 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>{t("pricing.basePrice")}</span>
              <span>{formatCurrency(amount, currency, locale)}</span>
            </div>

            {breakdown.fees && (
              <div className="flex justify-between">
                <span>{t("pricing.serviceFees")}</span>
                <span>{formatCurrency(breakdown.fees, currency, locale)}</span>
              </div>
            )}

            {breakdown.taxes && (
              <div className="flex justify-between">
                <span>{t("pricing.taxes")}</span>
                <span>{formatCurrency(breakdown.taxes, currency, locale)}</span>
              </div>
            )}

            <hr className="border-gray-200 dark:border-gray-600" />

            <div className="flex justify-between font-semibold">
              <span>{t("pricing.total")}</span>
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



