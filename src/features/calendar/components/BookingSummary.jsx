import { useTranslation } from "react-i18next";
import {
  Calendar,
  Moon,
  Sun,
  Clock,
  Users,
  DollarSign,
  ArrowRight,
  Car,
  Sparkles,
  Building2,
} from "lucide-react";
import { formatMoneyWithDenomination } from "../../../utils/money";
import GuestSelector from "./GuestSelector";

/* ── Helper maps ──────────────────────────────────────── */

/** Resolve the unit singular/plural keys based on priceLabel */
const UNIT_KEYS = {
  night: {
    singular: "calendar.booking.night",
    plural: "calendar.booking.nights",
    icon: Moon,
  },
  day: {
    singular: "calendar.booking.day",
    plural: "calendar.booking.days",
    icon: Sun,
  },
  hour: {
    singular: "calendar.booking.hour",
    plural: "calendar.booking.hours",
    icon: Clock,
  },
  person: {
    singular: "calendar.booking.person",
    plural: "calendar.booking.persons",
    icon: Users,
  },
  event: {
    singular: "calendar.booking.event",
    plural: "calendar.booking.events",
    icon: Sparkles,
  },
};

/** Icon for the "capacity" row per resource type */
const CAPACITY_ICON = {
  property: Users,
  vehicle: Car,
  experience: Users,
  venue: Building2,
  service: Users,
};

/** Capacity label key per resource type */
const CAPACITY_LABEL_KEY = {
  property: "calendar.booking.guests",
  vehicle: "calendar.booking.passengers",
  experience: "calendar.booking.persons",
  venue: "calendar.booking.attendees",
  service: "calendar.booking.persons",
};

/** Max capacity i18n key per resource type */
const MAX_CAPACITY_KEY = {
  property: "calendar.booking.maxGuests",
  vehicle: "calendar.booking.maxPassengers",
  experience: "calendar.booking.maxPersons",
  venue: "calendar.booking.capacity",
  service: "calendar.booking.maxPersons",
};

/** Date-range time label keys per resource type */
const TIME_LABELS = {
  property: {
    start: "calendar.booking.checkIn",
    end: "calendar.booking.checkOut",
  },
  default: {
    start: "calendar.booking.startDate",
    end: "calendar.booking.endDate",
  },
};

/**
 * BookingSummary – shows selected dates, price breakdown, guest selector, and reserve CTA.
 * Supports all resource types and pricing models.
 *
 * @param {Object}   props
 * @param {Object}   props.resource          – Normalised resource document
 * @param {string}   [props.resourceType]    – property | vehicle | experience | venue | service
 * @param {string}   [props.priceLabel]      – night | day | hour | person | event | total
 * @param {Date}     props.startDate
 * @param {Date}     props.endDate
 * @param {Object}   props.summary           – { total, nights (count of units), breakdown }
 * @param {Function} props.onReserveClick
 * @param {number}   [props.guestCount]      – Currently selected guest count
 * @param {Function} [props.onGuestCountChange]
 * @param {Object}   [props.property]        – Legacy alias for resource (backward compat)
 */
export default function BookingSummary({
  resource: resourceProp,
  property: propertyProp,
  resourceType: resourceTypeProp,
  priceLabel: priceLabelProp,
  startDate,
  endDate,
  summary,
  onReserveClick,
  guestCount,
  onGuestCountChange,
}) {
  const { t, i18n } = useTranslation();
  const locale = i18n.language === "es" ? "es-MX" : "en-US";

  // Support both "resource" and legacy "property" prop
  const resource = resourceProp || propertyProp || {};
  const resourceType = resourceTypeProp || resource.resourceType || "property";
  const priceLabel = priceLabelProp || "night";

  if (!startDate || !endDate || !summary) return null;

  const unitCount = summary.nights || summary.count || 0;
  const unitInfo = UNIT_KEYS[priceLabel] || UNIT_KEYS.night;
  const UnitIcon = unitInfo.icon;

  const fmtDate = (d) =>
    d.toLocaleDateString(locale, { day: "numeric", month: "short" });

  const fmtCurrency = (amount) =>
    formatMoneyWithDenomination(amount, {
      locale,
      currency: resource.currency || "MXN",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  const avgPerUnit = unitCount > 0 ? summary.total / unitCount : 0;

  // Fees/taxes (ready for integration)
  const estimatedFees = 0;
  const estimatedTax = 0;
  const grandTotal = summary.total + estimatedFees + estimatedTax;

  // Capacity
  const maxCapacity =
    resource.maxGuests ||
    resource.maxPassengers ||
    resource.maxPersons ||
    resource.capacity ||
    0;
  const showGuestSelector =
    maxCapacity > 0 && typeof onGuestCountChange === "function";
  const showStaticCapacity = maxCapacity > 0 && !showGuestSelector;

  // Time labels (check-in/check-out vs start/end)
  const timeLabels = TIME_LABELS[resourceType] || TIME_LABELS.default;
  const hasCheckTimes = resource.checkInTime || resource.checkOutTime;
  const hasStartEndTimes = resource.startTime || resource.endTime;
  const showTimes = hasCheckTimes || hasStartEndTimes;

  const CapacityIcon = CAPACITY_ICON[resourceType] || Users;
  const capacityLabel = t(
    CAPACITY_LABEL_KEY[resourceType] || "calendar.booking.guests",
  );
  const maxCapacityLabel = t(
    MAX_CAPACITY_KEY[resourceType] || "calendar.booking.maxGuests",
    { count: maxCapacity },
  );

  const unitLabel = unitCount === 1 ? t(unitInfo.singular) : t(unitInfo.plural);

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

        {/* Unit count (nights, days, hours, persons, events) */}
        <div className="flex items-center gap-3">
          <UnitIcon className="w-4 h-4 text-gray-400 shrink-0" />
          <span className="text-sm text-gray-700 dark:text-gray-300">
            {unitCount} {unitLabel}
          </span>
        </div>

        {/* Guest / Passenger selector */}
        {showGuestSelector && (
          <GuestSelector
            label={capacityLabel}
            value={guestCount || 1}
            min={1}
            max={maxCapacity}
            onChange={onGuestCountChange}
            resourceType={resourceType}
          />
        )}

        {/* Static capacity display (fallback when no selector) */}
        {showStaticCapacity && (
          <div className="flex items-center gap-3">
            <CapacityIcon className="w-4 h-4 text-gray-400 shrink-0" />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              {maxCapacityLabel}
            </span>
          </div>
        )}

        {/* Price breakdown */}
        <div className="border-t border-gray-100 dark:border-gray-700 pt-3 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500 dark:text-gray-400">
              {fmtCurrency(avgPerUnit)} × {unitCount} {unitLabel}
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

        {/* Check-in/Check-out or Start/End times */}
        {showTimes && (
          <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400 pt-1">
            {(resource.checkInTime || resource.startTime) && (
              <span>
                {t(timeLabels.start)}:{" "}
                {resource.checkInTime || resource.startTime}
              </span>
            )}
            {(resource.checkOutTime || resource.endTime) && (
              <span>
                {t(timeLabels.end)}: {resource.checkOutTime || resource.endTime}
              </span>
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
              nights: unitCount,
              count: unitCount,
              total: grandTotal,
              baseAmount: summary.total,
              fees: estimatedFees,
              taxes: estimatedTax,
              currency: resource.currency || "MXN",
              breakdown: summary.breakdown,
              guestCount: guestCount || undefined,
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
