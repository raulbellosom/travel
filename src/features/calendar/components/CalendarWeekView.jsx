import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { m } from "framer-motion";
import {
  getWeekDays,
  isToday,
  dateKey,
  HOUR_SLOTS,
  formatHour,
} from "../utils/calendarUtils";
import CalendarEventCard from "./CalendarEventCard";

/**
 * CalendarWeekView – 7-column timetable with hour slots.
 * Scrollable on mobile (horizontally for columns, vertically for hours).
 *
 * @param {Object} props
 * @param {Date} props.currentDate
 * @param {Object} props.eventsByDate
 * @param {Function} props.onDayClick
 * @param {Function} props.onEventClick
 */
const EMPTY_OBJECT = {};
export default function CalendarWeekView({
  currentDate,
  eventsByDate = EMPTY_OBJECT,
  onDayClick,
  onEventClick,
}) {
  const { i18n } = useTranslation();
  const locale = i18n.language === "es" ? "es-MX" : "en-US";
  const MotionDiv = m.div;

  const weekDays = useMemo(() => getWeekDays(currentDate), [currentDate]);

  // For week view, show all-day events at the top, then time-grid
  const allDayEvents = useMemo(() => {
    const result = {};
    weekDays.forEach((day) => {
      const key = dateKey(day);
      result[key] = eventsByDate[key] || [];
    });
    return result;
  }, [weekDays, eventsByDate]);

  return (
    <MotionDiv
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="w-full"
    >
      {/* Day headers (sticky) */}
      <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10 bg-white dark:bg-gray-900">
        <div className="p-2 border-r border-gray-200 dark:border-gray-700" />
        {weekDays.map((day) => {
          const today = isToday(day);
          return (
            <button
              key={dateKey(day)}
              type="button"
              onClick={() => onDayClick?.(day)}
              className={[
                "p-2 text-center border-r border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors",
                today ? "bg-blue-50 dark:bg-blue-900/20" : "",
              ].join(" ")}
            >
              <span className="block text-xs text-gray-500 dark:text-gray-400 uppercase">
                {day.toLocaleDateString(locale, { weekday: "short" })}
              </span>
              <span
                className={[
                  "inline-flex items-center justify-center w-8 h-8 text-sm font-semibold rounded-full mt-0.5",
                  today
                    ? "bg-blue-600 text-white"
                    : "text-gray-900 dark:text-gray-100",
                ].join(" ")}
              >
                {day.getDate()}
              </span>
            </button>
          );
        })}
      </div>

      {/* All-day events row */}
      <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-gray-200 dark:border-gray-700 min-h-10">
        <div className="p-1 border-r border-gray-200 dark:border-gray-700 text-[10px] text-gray-400 flex items-center justify-center">
          All day
        </div>
        {weekDays.map((day) => {
          const key = dateKey(day);
          const events = allDayEvents[key] || [];
          return (
            <div
              key={key}
              className="border-r border-gray-200 dark:border-gray-700 p-1 space-y-0.5 overflow-hidden"
            >
              {events.slice(0, 2).map((ev, j) => (
                <CalendarEventCard
                  key={ev.$id || j}
                  reservation={ev}
                  variant="compact"
                  onClick={onEventClick}
                />
              ))}
              {events.length > 2 && (
                <span className="text-[10px] text-gray-500 px-1">
                  +{events.length - 2}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Hourly time grid */}
      <div className="overflow-y-auto max-h-[calc(100vh-340px)] sm:max-h-[calc(100vh-280px)]">
        {HOUR_SLOTS.map((hour) => (
          <div
            key={hour}
            className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-gray-100 dark:border-gray-800 min-h-12"
          >
            <div className="p-1 border-r border-gray-200 dark:border-gray-700 text-[11px] text-gray-400 dark:text-gray-500 text-right pr-2 pt-0.5">
              {formatHour(hour, locale)}
            </div>
            {weekDays.map((day) => (
              <div
                key={dateKey(day)}
                role="button"
                tabIndex={0}
                className="border-r border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer"
                onClick={() => onDayClick?.(day)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") onDayClick?.(day);
                }}
              />
            ))}
          </div>
        ))}
      </div>
    </MotionDiv>
  );
}
