import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Expand,
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
import { Modal } from "../../../components/common";

/**
 * PropertyAvailabilityCalendar - Client-facing calendar for property pages.
 * Shows pricing per night, availability, and allows date selection.
 * Optimized for vacation_rental and rent properties.
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
  const [isExpandedViewOpen, setIsExpandedViewOpen] = useState(false);

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

  const MonthGrid = ({ base, showMonthLabel = false }) => {
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

  const modalRangeLabel = `${month.toLocaleDateString(locale, {
    month: "long",
    year: "numeric",
  })} - ${addMonths(month, 1).toLocaleDateString(locale, {
    month: "long",
    year: "numeric",
  })}`;

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-linear-to-b from-white to-slate-50/70 shadow-sm dark:border-slate-700 dark:from-slate-900 dark:to-slate-950">
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
              {month.toLocaleDateString(locale, {
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

        <div className="p-3 sm:p-4">
          <MonthGrid base={month} />
        </div>

        {property.minStayNights && (
          <div className="px-4 pb-2 text-xs text-slate-500 dark:text-slate-400">
            {t("calendar.minStay", { nights: property.minStayNights })} {"\u00b7"}{" "}
            {t("calendar.maxStay", { nights: property.maxStayNights || 365 })}
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-2 px-4 pb-3 pt-1">
          <button
            type="button"
            onClick={() => setIsExpandedViewOpen(true)}
            className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-cyan-300 hover:text-cyan-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-cyan-600 dark:hover:text-cyan-300"
          >
            <Expand className="h-3.5 w-3.5" />
            {t("calendar.openTwoMonths", {
              defaultValue: "Ver dos meses",
            })}
          </button>

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

      <Modal
        isOpen={isExpandedViewOpen}
        onClose={() => setIsExpandedViewOpen(false)}
        title={t("calendar.modal.title", { defaultValue: "Selecciona fechas" })}
        description={t("calendar.modal.description", {
          defaultValue:
            "Vista extendida para revisar dos meses de disponibilidad.",
        })}
        size="full"
        className="max-w-5xl"
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-700 dark:bg-slate-800/60">
            <button
              type="button"
              onClick={() => setMonth(addMonths(month, -1))}
              className="flex min-h-10 min-w-10 items-center justify-center rounded-lg text-slate-600 transition hover:bg-white dark:text-slate-300 dark:hover:bg-slate-700"
              aria-label={t("calendar.aria.previous")}
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <p className="truncate px-2 text-center text-sm font-semibold capitalize text-slate-700 dark:text-slate-200">
              {modalRangeLabel}
            </p>
            <button
              type="button"
              onClick={() => setMonth(addMonths(month, 1))}
              className="flex min-h-10 min-w-10 items-center justify-center rounded-lg text-slate-600 transition hover:bg-white dark:text-slate-300 dark:hover:bg-slate-700"
              aria-label={t("calendar.aria.next")}
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <MonthGrid base={month} showMonthLabel />
            <MonthGrid base={addMonths(month, 1)} showMonthLabel />
          </div>

          {property.minStayNights && (
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {t("calendar.minStay", { nights: property.minStayNights })} {"\u00b7"}{" "}
              {t("calendar.maxStay", { nights: property.maxStayNights || 365 })}
            </p>
          )}
        </div>
      </Modal>

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
