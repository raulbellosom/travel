import { useState, useMemo, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
} from "lucide-react";
import {
  getMonthGridDays,
  isSameMonth,
  isToday,
  dateKey,
  sameDay,
  stripTime,
  addMonths,
  addDays,
  daysBetween,
  calculateRangePrice,
} from "../utils/calendarUtils";
import BookingSummary from "./BookingSummary";
import { formatMoneyWithDenomination } from "../../../utils/money";

/**
 * PropertyAvailabilityCalendar – Client-facing calendar for property pages.
 * Shows pricing per night, availability, and allows date selection.
 * Optimized for vacation_rental and rent properties.
 *
 * @param {Object} props
 * @param {Object} props.property - Property document
 * @param {Object} props.pricing - { 'YYYY-MM-DD': pricePerNight }
 * @param {Date[]} props.disabledDates - Dates already booked
 * @param {Object} props.selectedRange - { startDate, endDate }
 * @param {Function} props.onRangeChange - ({ startDate, endDate }) => void
 * @param {Function} props.onReserveClick - (summary) => void
 */
export default function PropertyAvailabilityCalendar({
  property = {},
  pricing = {},
  disabledDates = [],
  selectedRange = { startDate: null, endDate: null },
  onRangeChange,
  onReserveClick,
}) {
  const { t, i18n } = useTranslation();
  const locale = i18n.language === "es" ? "es-MX" : "en-US";
  const MotionDiv = motion.div;

  const [month, setMonth] = useState(
    () => new Date(new Date().getFullYear(), new Date().getMonth(), 1),
  );
  const [hoverDate, setHoverDate] = useState(null);

  // Responsive: 1 month on mobile, 2 on desktop
  const containerRef = useRef(null);
  const [numMonths, setNumMonths] = useState(
    typeof window !== "undefined" && window.innerWidth >= 768 ? 2 : 1,
  );

  useEffect(() => {
    const handleResize = () => {
      setNumMonths(window.innerWidth >= 768 ? 2 : 1);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const minDate = stripTime(new Date());
  const maxDate = addDays(new Date(), 365);

  const isDisabled = (d) => {
    if (d < minDate) return true;
    if (d > maxDate) return true;
    if (disabledDates.some((x) => sameDay(x, d))) return true;
    return false;
  };

  const { startDate, endDate } = selectedRange;

  const pick = (d) => {
    if (isDisabled(d)) return;
    if (!startDate) {
      onRangeChange?.({ startDate: d, endDate: null });
    } else if (!endDate) {
      if (sameDay(d, startDate)) {
        onRangeChange?.({ startDate: null, endDate: null });
      } else if (d < startDate) {
        onRangeChange?.({ startDate: d, endDate: null });
      } else {
        // Check min/max stay
        const nights = daysBetween(startDate, d);
        if (property.minStayNights && nights < property.minStayNights) return;
        if (property.maxStayNights && nights > property.maxStayNights) return;
        onRangeChange?.({ startDate, endDate: d });
      }
    } else {
      onRangeChange?.({ startDate: d, endDate: null });
    }
  };

  const inRange = (d) => {
    if (!startDate || !endDate) return false;
    return d >= startDate && d <= endDate;
  };

  const inHoverRange = (d) => {
    if (startDate && !endDate && hoverDate) {
      const a = startDate < hoverDate ? startDate : hoverDate;
      const b = startDate < hoverDate ? hoverDate : startDate;
      return d >= a && d <= b;
    }
    return false;
  };

  const priceOf = (d) => {
    const key = dateKey(d);
    return pricing[key] || property.price || null;
  };

  const fmtPrice = (amount) =>
    formatMoneyWithDenomination(amount, {
      locale,
      currency: property.currency || "MXN",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  const dayHeaders = useMemo(() => {
    const base = new Date(2024, 0, 7);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(base);
      d.setDate(base.getDate() + i);
      return {
        short: d.toLocaleDateString(locale, { weekday: "short" }),
        narrow: d.toLocaleDateString(locale, { weekday: "narrow" }),
      };
    });
  }, [locale]);

  // Price summary for selected range
  const summary = useMemo(() => {
    if (!startDate || !endDate) return null;
    const basePricing = {};
    let cur = new Date(startDate);
    const nights = daysBetween(startDate, endDate);
    for (let i = 0; i < nights; i++) {
      const key = dateKey(cur);
      basePricing[key] = pricing[key] || property.price || 0;
      cur = addDays(cur, 1);
    }
    return calculateRangePrice(startDate, endDate, basePricing);
  }, [startDate, endDate, pricing, property.price]);

  const MonthGrid = ({ base }) => {
    const days = getMonthGridDays(base);
    const monthTitle = base.toLocaleDateString(locale, {
      month: "long",
      year: "numeric",
    });

    return (
      <div className="flex-1 min-w-0">
        {/* Month title (only shown when 2-month, individual titles) */}
        {numMonths === 2 && (
          <h4 className="text-center text-sm font-semibold text-gray-900 dark:text-gray-100 capitalize mb-2">
            {monthTitle}
          </h4>
        )}

        {/* Day headers */}
        <div className="grid grid-cols-7 mb-1">
          {dayHeaders.map((h, i) => (
            <div
              key={i}
              className="text-center text-[10px] sm:text-xs font-medium text-gray-500 dark:text-gray-400 py-1 uppercase"
            >
              <span className="hidden sm:inline">{h.short}</span>
              <span className="sm:hidden">{h.narrow}</span>
            </div>
          ))}
        </div>

        {/* Days grid */}
        <div className="grid grid-cols-7 gap-0.5">
          {days.map((d, idx) => {
            const disabled = isDisabled(d);
            const inThisMonth = isSameMonth(d, base);
            const today = isToday(d);
            const selected = sameDay(d, startDate) || sameDay(d, endDate);
            const inSel = inRange(d) || inHoverRange(d);
            const price = priceOf(d);

            return (
              <button
                key={idx}
                type="button"
                onClick={() => pick(d)}
                onMouseEnter={() => setHoverDate(d)}
                onMouseLeave={() => setHoverDate(null)}
                disabled={disabled || !inThisMonth}
                className={[
                  "relative flex flex-col items-center justify-center rounded-lg transition-all text-center",
                  "min-h-12 sm:min-h-14 lg:min-h-16",
                  !inThisMonth ? "opacity-0 pointer-events-none" : "",
                  disabled && inThisMonth
                    ? "opacity-30 cursor-not-allowed line-through"
                    : inThisMonth
                      ? "cursor-pointer"
                      : "",
                  selected
                    ? "bg-blue-600 text-white shadow-md"
                    : inSel
                      ? "bg-blue-100 dark:bg-blue-900/30"
                      : inThisMonth
                        ? "hover:bg-gray-100 dark:hover:bg-gray-800"
                        : "",
                ].join(" ")}
              >
                <span
                  className={[
                    "text-sm font-medium",
                    selected
                      ? "text-white"
                      : today
                        ? "text-blue-600 dark:text-blue-400 font-bold"
                        : "text-gray-900 dark:text-gray-100",
                  ].join(" ")}
                >
                  {d.getDate()}
                </span>

                {/* Price per night */}
                {price && inThisMonth && !disabled && (
                  <span
                    className={[
                      "text-[9px] sm:text-[10px] leading-tight mt-0.5",
                      selected
                        ? "text-blue-100"
                        : "text-gray-500 dark:text-gray-400",
                    ].join(" ")}
                  >
                    {fmtPrice(price)}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div ref={containerRef} className="space-y-4">
      {/* Calendar */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={() => setMonth(addMonths(month, -1))}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors min-h-11 min-w-11 flex items-center justify-center"
            aria-label={t("calendar.aria.previous")}
          >
            <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </button>

          <div className="text-center">
            {numMonths === 1 ? (
              <h3 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-gray-100 capitalize">
                {month.toLocaleDateString(locale, {
                  month: "long",
                  year: "numeric",
                })}
              </h3>
            ) : (
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-gray-400" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t("calendar.selectDates")}
                </span>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => setMonth(addMonths(month, 1))}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors min-h-11 min-w-11 flex items-center justify-center"
            aria-label={t("calendar.aria.next")}
          >
            <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </button>
        </div>

        {/* Month grids */}
        <div
          className={["p-3 sm:p-4", numMonths === 2 ? "flex gap-6" : ""].join(
            " ",
          )}
        >
          <MonthGrid base={month} />
          {numMonths === 2 && <MonthGrid base={addMonths(month, 1)} />}
        </div>

        {/* Stay info */}
        {property.minStayNights && (
          <div className="px-4 pb-3 text-xs text-gray-500 dark:text-gray-400">
            {t("calendar.minStay", { nights: property.minStayNights })} ·{" "}
            {t("calendar.maxStay", { nights: property.maxStayNights || 365 })}
          </div>
        )}

        {/* Clear */}
        {(startDate || endDate) && (
          <div className="px-4 pb-3">
            <button
              type="button"
              onClick={() =>
                onRangeChange?.({ startDate: null, endDate: null })
              }
              className="text-sm text-gray-500 dark:text-gray-400 hover:text-red-500 transition-colors"
            >
              {t("calendar.clearDates")}
            </button>
          </div>
        )}
      </div>

      {/* Booking summary */}
      {summary && (
        <MotionDiv
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
        >
          <BookingSummary
            property={property}
            startDate={startDate}
            endDate={endDate}
            summary={summary}
            onReserveClick={onReserveClick}
          />
        </MotionDiv>
      )}
    </div>
  );
}
