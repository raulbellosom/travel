import { useState, useMemo, useEffect } from "react";
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

const MonthGrid = ({
  base,
  showMonthLabel = false,
  locale,
  dayHeaders,
  isDisabled,
  startDate,
  endDate,
  inRange,
  inHoverRange,
  priceOf,
  fmtCompactPrice,
  fmtPrice,
  getRangeHint,
  pick,
  setHoverDate,
}) => {
  const days = getMonthGridDays(base);
  const monthTitle = base.toLocaleDateString(locale, {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="min-w-0">
      {showMonthLabel && (
        <h4 className="mb-3 text-center text-sm font-semibold capitalize text-slate-900 dark:text-slate-100">
          {monthTitle}
        </h4>
      )}

      <div className="mb-2 grid grid-cols-7 gap-1">
        {dayHeaders.map((h, i) => (
          <div
            key={i}
            className="py-1 text-center text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400"
          >
            <span className="hidden sm:inline">{h.short}</span>
            <span className="sm:hidden">{h.narrow}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((d, idx) => {
          const disabled = isDisabled(d);
          const inThisMonth = isSameMonth(d, base);
          const today = isToday(d);
          const selected = sameDay(d, startDate) || sameDay(d, endDate);
          const inSel = inRange(d) || inHoverRange(d);
          const price = priceOf(d);
          const compactPrice = fmtCompactPrice(price);
          const rangeHint = inThisMonth && !disabled ? getRangeHint(d) : null;

          return (
            <button
              key={idx}
              type="button"
              onClick={() => pick(d)}
              onMouseEnter={() => setHoverDate(d)}
              onMouseLeave={() => setHoverDate(null)}
              disabled={disabled || !inThisMonth}
              aria-label={d.toLocaleDateString(locale)}
              className={[
                "group relative flex min-h-14 w-full flex-col items-center justify-center rounded-xl border text-center transition-all duration-150",
                !inThisMonth ? "invisible pointer-events-none" : "",
                selected
                  ? "border-cyan-600 bg-cyan-600 text-white shadow-[0_8px_20px_-12px_rgba(8,145,178,0.95)]"
                  : inSel
                    ? "border-cyan-200 bg-cyan-50/90 text-cyan-800 dark:border-cyan-800/60 dark:bg-cyan-950/40 dark:text-cyan-100"
                    : rangeHint === "valid"
                      ? "border-emerald-200 bg-emerald-50/70 text-emerald-800 ring-1 ring-emerald-200/60 dark:border-emerald-800/50 dark:bg-emerald-950/30 dark:text-emerald-200 dark:ring-emerald-700/40"
                      : rangeHint === "tooClose"
                        ? "border-amber-200 bg-amber-50/50 text-amber-700 opacity-60 dark:border-amber-800/40 dark:bg-amber-950/20 dark:text-amber-300"
                        : rangeHint === "tooFar"
                          ? "border-red-200 bg-red-50/40 text-red-400 opacity-50 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-400"
                          : disabled
                            ? "cursor-not-allowed border-slate-200 bg-slate-50 text-slate-400 opacity-75 line-through dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-500"
                            : "border-slate-200 bg-white text-slate-800 hover:-translate-y-0.5 hover:border-cyan-300 hover:bg-cyan-50/60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:border-cyan-600 dark:hover:bg-cyan-950/30",
              ].join(" ")}
            >
              <span
                className={[
                  "text-sm font-semibold",
                  selected
                    ? "text-white"
                    : today
                      ? "text-cyan-600 dark:text-cyan-400"
                      : rangeHint === "valid"
                        ? "text-emerald-700 dark:text-emerald-300"
                        : rangeHint === "tooFar"
                          ? "text-red-400 dark:text-red-500"
                          : "text-slate-900 dark:text-slate-100",
                ].join(" ")}
              >
                {d.getDate()}
              </span>

              {compactPrice && inThisMonth && !disabled && (
                <span
                  title={fmtPrice(price)}
                  className={[
                    "mt-0.5 max-w-[90%] truncate text-[10px] font-medium leading-tight",
                    selected
                      ? "text-cyan-100"
                      : "text-slate-500 dark:text-slate-400",
                  ].join(" ")}
                >
                  {compactPrice}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

/**
 * PropertyAvailabilityCalendar - Client-facing calendar for resource pages.
 * Shows pricing per unit, availability, and allows date selection.
 * Supports all resource types: property, vehicle, experience, venue, service.
 *
 * `months` prop controls layout:
 *   1            – always single month
 *   2            – always two months side-by-side
 *   "responsive" – 1 month on mobile (< lg), 2 on desktop (>= lg)
 *
 * Legacy `singleMonth=true` is equivalent to `months={1}`.
 * No hover-driven expansion. Month navigation via arrows only.
 */
export default function PropertyAvailabilityCalendar({
  property = {},
  pricing = {},
  disabledDates = [],
  selectedRange = { startDate: null, endDate: null },
  onRangeChange,
  onReserveClick,
  resourceType,
  priceLabel,
  guestCount,
  onGuestCountChange,
  singleMonth = false,
  months: monthsProp,
  selectionMode = "range",
}) {
  const isSingleMode = selectionMode === "single";
  // Resolve effective months: prop > legacy singleMonth > default responsive
  const resolvedMonthsMode = monthsProp ?? (singleMonth ? 1 : "responsive");
  const { t, i18n } = useTranslation();
  const locale = i18n.language === "es" ? "es-MX" : "en-US";
  const MotionDiv = motion.div;

  const [month, setMonth] = useState(
    () => new Date(new Date().getFullYear(), new Date().getMonth(), 1),
  );
  const [hoverDate, setHoverDate] = useState(null);

  // For "responsive" mode: track viewport width to decide 1 vs 2 months
  const [isLg, setIsLg] = useState(
    () => typeof window !== "undefined" && window.innerWidth >= 1024,
  );
  useEffect(() => {
    if (resolvedMonthsMode !== "responsive") return;
    const mql = window.matchMedia("(min-width: 1024px)");
    const handler = (e) => setIsLg(e.matches);
    setIsLg(mql.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, [resolvedMonthsMode]);

  // Effective month count to render
  const showMonths =
    resolvedMonthsMode === "responsive"
      ? isLg
        ? 2
        : 1
      : resolvedMonthsMode === 2
        ? 2
        : 1;

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

    // Single-day mode: toggle the selected date
    if (isSingleMode) {
      if (startDate && sameDay(d, startDate)) {
        onRangeChange?.({ startDate: null, endDate: null });
      } else {
        onRangeChange?.({ startDate: d, endDate: null });
      }
      return;
    }

    // Range mode (default)
    if (!startDate) {
      onRangeChange?.({ startDate: d, endDate: null });
    } else if (!endDate) {
      if (sameDay(d, startDate)) {
        onRangeChange?.({ startDate: null, endDate: null });
      } else if (d < startDate) {
        onRangeChange?.({ startDate: d, endDate: null });
      } else {
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
    // No hover-range highlight in single-day mode
    if (isSingleMode) return false;
    if (startDate && !endDate && hoverDate) {
      // Don't show hover range if hovered date violates stay constraints
      if (hoverDate > startDate) {
        const nights = daysBetween(startDate, hoverDate);
        if (property.minStayNights && nights < property.minStayNights)
          return false;
        if (property.maxStayNights && nights > property.maxStayNights)
          return false;
      }
      const a = startDate < hoverDate ? startDate : hoverDate;
      const b = startDate < hoverDate ? hoverDate : startDate;
      return d >= a && d <= b;
    }
    return false;
  };

  /**
   * When startDate is picked but endDate is not yet, classify each day d:
   *  - "valid"   = within [minStay, maxStay] range from startDate (selectable)
   *  - "tooClose"= between 1 and minStay-1 nights (can't pick yet)
   *  - "tooFar"  = beyond maxStay (can't pick)
   *  - null      = not applicable (before startDate, already disabled, etc.)
   */
  const getRangeHint = (d) => {
    // Single-day mode: every non-disabled day from today is "valid" (green)
    if (isSingleMode) {
      if (isDisabled(d)) return null;
      return "valid";
    }
    if (!startDate || endDate) return null;
    if (d <= startDate) return null;
    if (isDisabled(d)) return null;

    const nights = daysBetween(startDate, d);
    const min = property.minStayNights || 1;
    const max = property.maxStayNights || 365;

    if (nights < min) return "tooClose";
    if (nights > max) return "tooFar";
    return "valid";
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

  const fmtCompactPrice = (amount) => {
    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0) return "";
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: property.currency || "MXN",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

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

  const modalRangeLabel = `${month.toLocaleDateString(locale, {
    month: "long",
    year: "numeric",
  })} - ${addMonths(month, 1).toLocaleDateString(locale, {
    month: "long",
    year: "numeric",
  })}`;

  const monthGridCommonProps = {
    locale,
    dayHeaders,
    isDisabled,
    startDate,
    endDate,
    inRange,
    inHoverRange,
    priceOf,
    fmtCompactPrice: isSingleMode ? () => "" : fmtCompactPrice,
    fmtPrice,
    getRangeHint: isSingleMode ? () => null : getRangeHint,
    pick,
    setHoverDate,
  };

  // Resolve unit label for stay constraints
  const unitLabelSingular =
    priceLabel === "day"
      ? t("calendar.booking.day")
      : priceLabel === "hour"
        ? t("calendar.booking.hour")
        : t("calendar.booking.night");
  const unitLabelPlural =
    priceLabel === "day"
      ? t("calendar.booking.days")
      : priceLabel === "hour"
        ? t("calendar.booking.hours")
        : t("calendar.booking.nights");

  return (
    <div className="space-y-4">
      {/* ── Inline calendar card ─────────────────────────── */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-linear-to-b from-white to-slate-50/70 shadow-sm transition-all duration-200 dark:border-slate-700 dark:from-slate-900 dark:to-slate-950">
        {/* Navigation header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-3 py-3 dark:border-slate-700">
          <button
            type="button"
            onClick={() => setMonth(addMonths(month, -1))}
            className="flex min-h-11 min-w-11 items-center justify-center rounded-xl text-slate-600 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
            aria-label={t("calendar.aria.previous")}
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          <div className="flex min-w-0 items-center gap-2 text-center">
            <CalendarIcon className="h-4 w-4 text-slate-400" />
            <h3 className="truncate text-sm font-semibold capitalize text-slate-900 dark:text-slate-100">
              {showMonths === 2
                ? modalRangeLabel
                : month.toLocaleDateString(locale, {
                    month: "long",
                    year: "numeric",
                  })}
            </h3>
          </div>

          <button
            type="button"
            onClick={() => setMonth(addMonths(month, 1))}
            className="flex min-h-11 min-w-11 items-center justify-center rounded-xl text-slate-600 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
            aria-label={t("calendar.aria.next")}
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        {/* Calendar grids — deterministic: 1 or 2 months, no hover */}
        <div className="p-3 sm:p-4">
          <div
            className={`grid gap-6 ${
              showMonths === 2 ? "grid-cols-2" : "grid-cols-1"
            }`}
          >
            <MonthGrid
              base={month}
              showMonthLabel={showMonths === 2}
              {...monthGridCommonProps}
            />
            {showMonths === 2 && (
              <MonthGrid
                base={addMonths(month, 1)}
                showMonthLabel
                {...monthGridCommonProps}
              />
            )}
          </div>
        </div>

        {/* Stay constraints — hidden in single/visit mode */}
        {!isSingleMode && property.minStayNights && (
          <div className="px-4 pb-2 text-xs text-slate-500 dark:text-slate-400">
            {priceLabel && priceLabel !== "night"
              ? `${t("calendar.minStayGeneric", { count: property.minStayNights, unit: property.minStayNights === 1 ? unitLabelSingular : unitLabelPlural })} \u00b7 ${t("calendar.maxStayGeneric", { count: property.maxStayNights || 365, unit: unitLabelPlural })}`
              : `${t("calendar.minStay", { nights: property.minStayNights })} \u00b7 ${t("calendar.maxStay", { nights: property.maxStayNights || 365 })}`}
          </div>
        )}

        {/* Range hint legend — only when picking end date in range mode */}
        {!isSingleMode &&
          startDate &&
          !endDate &&
          (property.minStayNights || property.maxStayNights) && (
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 pb-2">
              <span className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                <span className="inline-block h-3 w-3 rounded border border-emerald-300 bg-emerald-100 dark:border-emerald-700 dark:bg-emerald-900/40" />
                {t("calendar.hint.selectable", { defaultValue: "Disponible" })}
              </span>
              {Number(property.minStayNights) > 1 && (
                <span className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                  <span className="inline-block h-3 w-3 rounded border border-amber-300 bg-amber-100 dark:border-amber-700 dark:bg-amber-900/40" />
                  {t("calendar.hint.tooClose", {
                    defaultValue: "Mín. no alcanzado",
                  })}
                </span>
              )}
              <span className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                <span className="inline-block h-3 w-3 rounded border border-red-300 bg-red-100 dark:border-red-700 dark:bg-red-900/40" />
                {t("calendar.hint.tooFar", { defaultValue: "Máx. excedido" })}
              </span>
            </div>
          )}

        {/* Action buttons */}
        <div className="flex flex-wrap items-center justify-end gap-2 px-4 pb-3 pt-1">
          {(startDate || endDate) && (
            <button
              type="button"
              onClick={() =>
                onRangeChange?.({ startDate: null, endDate: null })
              }
              className="text-xs font-semibold text-slate-500 transition hover:text-red-500 dark:text-slate-400"
            >
              {t("calendar.clearDates")}
            </button>
          )}
        </div>
      </div>

      {/* ── Booking summary (hidden for visit/single mode) ── */}
      {!isSingleMode && summary && (
        <MotionDiv
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
        >
          <BookingSummary
            property={property}
            resourceType={resourceType || property.resourceType}
            priceLabel={priceLabel}
            startDate={startDate}
            endDate={endDate}
            summary={summary}
            onReserveClick={onReserveClick}
            guestCount={guestCount}
            onGuestCountChange={onGuestCountChange}
          />
        </MotionDiv>
      )}
    </div>
  );
}
