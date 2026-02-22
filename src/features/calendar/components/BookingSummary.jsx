import { useTranslation } from "react-i18next";
import { Calendar, Moon, Users, DollarSign, ArrowRight } from "lucide-react";
import { formatMoneyWithDenomination } from "../../../utils/money";

/**
 * BookingSummary – shows selected dates, price breakdown, and reserve CTA.
 * Sticky bottom bar on mobile, inline card on desktop.
 *
 * @param {Object} props
 * @param {Object} props.property
 * @param {Date} props.startDate
 * @param {Date} props.endDate
 * @param {Object} props.summary - { total, nights, breakdown }
 * @param {Function} props.onReserveClick
 */
export default function BookingSummary({
  property = {},
  startDate,
  endDate,
  summary,
  onReserveClick,
}) {
  const { t, i18n } = useTranslation();
  const locale = i18n.language === "es" ? "es-MX" : "en-US";

  if (!startDate || !endDate || !summary) return null;

  const fmtDate = (d) =>
    d.toLocaleDateString(locale, {
      day: "numeric",
      month: "short",
    });

  const fmtCurrency = (amount) =>
    formatMoneyWithDenomination(amount, {
      locale,
      currency: property.currency || "MXN",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  const avgPerNight = summary.nights > 0 ? summary.total / summary.nights : 0;

  // Estimated fees/taxes (prepared for future integration)
  const estimatedFees = 0;
  const estimatedTax = 0;
  const grandTotal = summary.total + estimatedFees + estimatedTax;

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-md overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800/80 border-b border-gray-200 dark:border-gray-700">
        <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
          {t("calendar.booking.summary")}
        </h4>
      </div>

      <div className="p-4 space-y-3">
        {/* Dates */}
        <div className="flex items-center gap-3">
          <Calendar className="w-4 h-4 text-gray-400 shrink-0" />
          <div className="flex items-center gap-2 text-sm">
            <span className="font-medium text-gray-900 dark:text-gray-100">
              {fmtDate(startDate)}
            </span>
            <ArrowRight className="w-3 h-3 text-gray-400" />
            <span className="font-medium text-gray-900 dark:text-gray-100">
              {fmtDate(endDate)}
            </span>
          </div>
        </div>

        {/* Nights */}
        <div className="flex items-center gap-3">
          <Moon className="w-4 h-4 text-gray-400 shrink-0" />
          <span className="text-sm text-gray-700 dark:text-gray-300">
            {summary.nights}{" "}
            {summary.nights === 1
              ? t("calendar.booking.night")
              : t("calendar.booking.nights")}
          </span>
        </div>

        {/* Max guests */}
        {property.maxGuests && (
          <div className="flex items-center gap-3">
            <Users className="w-4 h-4 text-gray-400 shrink-0" />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              {t("calendar.booking.maxGuests", { count: property.maxGuests })}
            </span>
          </div>
        )}

        {/* Price breakdown */}
        <div className="border-t border-gray-100 dark:border-gray-700 pt-3 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500 dark:text-gray-400">
              {fmtCurrency(avgPerNight)} × {summary.nights}{" "}
              {summary.nights === 1
                ? t("calendar.booking.night")
                : t("calendar.booking.nights")}
            </span>
            <span className="text-gray-900 dark:text-gray-100 font-medium">
              {fmtCurrency(summary.total)}
            </span>
          </div>

          {estimatedFees > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-500 dark:text-gray-400">
                {t("calendar.booking.fees")}
              </span>
              <span className="text-gray-900 dark:text-gray-100">
                {fmtCurrency(estimatedFees)}
              </span>
            </div>
          )}

          {estimatedTax > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-500 dark:text-gray-400">
                {t("calendar.booking.taxes")}
              </span>
              <span className="text-gray-900 dark:text-gray-100">
                {fmtCurrency(estimatedTax)}
              </span>
            </div>
          )}

          {/* Total */}
          <div className="flex justify-between items-center pt-2 border-t border-gray-100 dark:border-gray-700">
            <span className="font-semibold text-gray-900 dark:text-gray-100">
              {t("calendar.booking.total")}
            </span>
            <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
              {fmtCurrency(grandTotal)}
            </span>
          </div>
        </div>

        {/* Check-in/out times */}
        {(property.checkInTime || property.checkOutTime) && (
          <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400 pt-1">
            {property.checkInTime && (
              <span>Check-in: {property.checkInTime}</span>
            )}
            {property.checkOutTime && (
              <span>Check-out: {property.checkOutTime}</span>
            )}
          </div>
        )}

        {/* Reserve button */}
        <button
          type="button"
          onClick={() =>
            onReserveClick?.({
              startDate,
              endDate,
              nights: summary.nights,
              total: grandTotal,
              baseAmount: summary.total,
              fees: estimatedFees,
              taxes: estimatedTax,
              currency: property.currency || "MXN",
              breakdown: summary.breakdown,
            })
          }
          className="w-full mt-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors min-h-12 flex items-center justify-center gap-2 shadow-sm hover:shadow-md"
        >
          <DollarSign className="w-4 h-4" />
          {t("calendar.booking.reserve")}
        </button>

        <p className="text-[11px] text-center text-gray-400 dark:text-gray-500">
          {t("calendar.booking.noChargeYet")}
        </p>
      </div>
    </div>
  );
}
