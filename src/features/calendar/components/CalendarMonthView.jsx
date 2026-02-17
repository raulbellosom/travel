import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import {
  getMonthGridDays,
  isSameMonth,
  isToday,
  dateKey,
  STATUS_COLORS,
} from "../utils/calendarUtils";
import CalendarEventCard from "./CalendarEventCard";

/**
 * CalendarMonthView – month grid with reservation events.
 * Mobile: compact dots/badges. Desktop: shows event cards.
 *
 * @param {Object} props
 * @param {Date} props.currentDate
 * @param {Object} props.eventsByDate - { 'YYYY-MM-DD': [reservation, ...] }
 * @param {Function} props.onDayClick
 * @param {Function} props.onEventClick
 */
export default function CalendarMonthView({
  currentDate,
  eventsByDate = {},
  onDayClick,
  onEventClick,
}) {
  const { t, i18n } = useTranslation();
  const locale = i18n.language === "es" ? "es-MX" : "en-US";
  const MotionDiv = motion.div;

  const days = useMemo(() => getMonthGridDays(currentDate), [currentDate]);

  const dayHeaders = useMemo(() => {
    const base = new Date(2024, 0, 7); // Sunday
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(base);
      d.setDate(base.getDate() + i);
      return {
        full: d.toLocaleDateString(locale, { weekday: "long" }),
        short: d.toLocaleDateString(locale, { weekday: "short" }),
        narrow: d.toLocaleDateString(locale, { weekday: "narrow" }),
      };
    });
  }, [locale]);

  return (
    <MotionDiv
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="w-full"
    >
      {/* Day headers */}
      <div className="grid grid-cols-7 mb-1">
        {dayHeaders.map((h, i) => (
          <div
            key={i}
            className="text-center py-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase"
          >
            <span className="hidden sm:inline">{h.short}</span>
            <span className="sm:hidden">{h.narrow}</span>
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7 border-t border-l border-gray-200 dark:border-gray-700">
        {days.map((day, idx) => {
          const key = dateKey(day);
          const events = eventsByDate[key] || [];
          const inMonth = isSameMonth(day, currentDate);
          const today = isToday(day);

          return (
            <button
              key={idx}
              type="button"
              onClick={() => onDayClick?.(day)}
              className={[
                "relative border-r border-b border-gray-200 dark:border-gray-700 p-1 sm:p-2 text-left transition-colors min-h-15 sm:min-h-25 lg:min-h-30",
                inMonth
                  ? "bg-white dark:bg-gray-900"
                  : "bg-gray-50 dark:bg-gray-900/50",
                "hover:bg-blue-50/50 dark:hover:bg-blue-900/10",
              ].join(" ")}
            >
              {/* Day number */}
              <span
                className={[
                  "inline-flex items-center justify-center w-7 h-7 text-sm font-medium rounded-full",
                  today
                    ? "bg-blue-600 text-white"
                    : inMonth
                      ? "text-gray-900 dark:text-gray-100"
                      : "text-gray-400 dark:text-gray-600",
                ].join(" ")}
              >
                {day.getDate()}
              </span>

              {/* Events – desktop: cards, mobile: dots */}
              {events.length > 0 && (
                <>
                  {/* Mobile: colored dots */}
                  <div className="flex gap-0.5 mt-1 sm:hidden flex-wrap">
                    {events.slice(0, 3).map((ev, i) => {
                      const color =
                        STATUS_COLORS[ev.status] || STATUS_COLORS.pending;
                      return (
                        <span
                          key={i}
                          className={`w-2 h-2 rounded-full ${color.dot}`}
                        />
                      );
                    })}
                    {events.length > 3 && (
                      <span className="text-[9px] text-gray-400 font-bold">
                        +{events.length - 3}
                      </span>
                    )}
                  </div>

                  {/* Desktop: event cards */}
                  <div className="hidden sm:flex flex-col gap-0.5 mt-1 overflow-hidden">
                    {events.slice(0, 3).map((ev, i) => (
                      <CalendarEventCard
                        key={ev.$id || i}
                        reservation={ev}
                        variant="compact"
                        onClick={onEventClick}
                      />
                    ))}
                    {events.length > 3 && (
                      <span className="text-[10px] text-gray-500 dark:text-gray-400 font-medium px-2">
                        +{events.length - 3} {t("calendar.more")}
                      </span>
                    )}
                  </div>
                </>
              )}
            </button>
          );
        })}
      </div>
    </MotionDiv>
  );
}
