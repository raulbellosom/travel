import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import {
  getYearMonths,
  getMonthGridDays,
  isSameMonth,
  isToday,
  dateKey,
  STATUS_COLORS,
} from "../utils/calendarUtils";

/**
 * CalendarYearView – 12-month compact overview.
 * 2 cols on mobile, 3 on tablet, 4 on desktop.
 *
 * @param {Object} props
 * @param {Date} props.currentDate
 * @param {Object} props.eventsByDate
 * @param {Function} props.onMonthClick – click a month to switch to month view
 */
export default function CalendarYearView({
  currentDate,
  eventsByDate = {},
  onMonthClick,
}) {
  const { i18n } = useTranslation();
  const locale = i18n.language === "es" ? "es-MX" : "en-US";
  const MotionDiv = motion.div;

  const months = useMemo(
    () => getYearMonths(currentDate.getFullYear()),
    [currentDate],
  );

  const dayNarrow = useMemo(() => {
    const base = new Date(2024, 0, 7); // Sunday
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(base);
      d.setDate(base.getDate() + i);
      return d.toLocaleDateString(locale, { weekday: "narrow" });
    });
  }, [locale]);

  return (
    <MotionDiv
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6"
    >
      {months.map((monthDate, mi) => {
        const days = getMonthGridDays(monthDate);
        const monthName = monthDate.toLocaleDateString(locale, {
          month: "long",
        });

        // Count events for this month
        let eventCount = 0;
        days.forEach((d) => {
          if (isSameMonth(d, monthDate)) {
            const key = dateKey(d);
            if (eventsByDate[key]?.length)
              eventCount += eventsByDate[key].length;
          }
        });

        return (
          <button
            key={mi}
            type="button"
            onClick={() => onMonthClick?.(monthDate)}
            className="text-left p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-md transition-all"
          >
            {/* Month title */}
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 capitalize">
                {monthName}
              </h4>
              {eventCount > 0 && (
                <span className="px-1.5 py-0.5 text-[10px] font-bold bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full">
                  {eventCount}
                </span>
              )}
            </div>

            {/* Mini day headers */}
            <div className="grid grid-cols-7 mb-0.5">
              {dayNarrow.map((d, i) => (
                <div
                  key={i}
                  className="text-center text-[9px] text-gray-400 dark:text-gray-500 font-medium"
                >
                  {d}
                </div>
              ))}
            </div>

            {/* Mini day grid */}
            <div className="grid grid-cols-7 gap-px">
              {days.map((day, di) => {
                const inMonth = isSameMonth(day, monthDate);
                const today = isToday(day);
                const key = dateKey(day);
                const hasEvents = eventsByDate[key]?.length > 0;
                const topEvent = eventsByDate[key]?.[0];
                const dotColor = topEvent
                  ? STATUS_COLORS[topEvent.status]?.dot || "bg-blue-500"
                  : "";

                return (
                  <div
                    key={di}
                    className={[
                      "relative flex items-center justify-center h-5 sm:h-6 text-[10px] sm:text-[11px] rounded",
                      inMonth
                        ? "text-gray-700 dark:text-gray-300"
                        : "text-gray-300 dark:text-gray-700",
                      today ? "font-bold" : "",
                      today ? "bg-blue-600 text-white rounded-full" : "",
                    ].join(" ")}
                  >
                    {day.getDate()}
                    {hasEvents && !today && (
                      <span
                        className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full ${dotColor}`}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </button>
        );
      })}
    </MotionDiv>
  );
}
