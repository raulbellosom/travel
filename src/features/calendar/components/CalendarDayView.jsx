import { useTranslation } from "react-i18next";
import { m } from "framer-motion";
import {
  isToday,
  dateKey,
  HOUR_SLOTS,
  formatHour,
} from "../utils/calendarUtils";
import CalendarEventCard from "./CalendarEventCard";

/**
 * CalendarDayView – single day with hourly slots + event list.
 * Optimized for mobile: stacked layout.
 *
 * @param {Object} props
 * @param {Date} props.currentDate
 * @param {Object} props.eventsByDate
 * @param {Function} props.onEventClick
 */
const EMPTY_OBJECT = {};
export default function CalendarDayView({
  currentDate,
  eventsByDate = EMPTY_OBJECT,
  onEventClick,
}) {
  const { t, i18n } = useTranslation();
  const locale = i18n.language === "es" ? "es-MX" : "en-US";
  const MotionDiv = m.div;

  const key = dateKey(currentDate);
  const dayEvents = eventsByDate[key] || [];
  const today = isToday(currentDate);

  const headerLabel = currentDate.toLocaleDateString(locale, {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <MotionDiv
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="w-full"
    >
      {/* Day header */}
      <div
        className={[
          "px-4 py-3 rounded-t-lg border border-gray-200 dark:border-gray-700",
          today
            ? "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800"
            : "bg-gray-50 dark:bg-gray-800/50",
        ].join(" ")}
      >
        <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 capitalize">
          {headerLabel}
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
          {dayEvents.length}{" "}
          {dayEvents.length === 1 ? t("calendar.event") : t("calendar.events")}
        </p>
      </div>

      {/* Events list */}
      {dayEvents.length > 0 && (
        <div className="p-3 space-y-2 border-x border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
          {dayEvents.map((ev, i) => (
            <CalendarEventCard
              key={ev.$id || i}
              reservation={ev}
              variant="full"
              onClick={onEventClick}
            />
          ))}
        </div>
      )}

      {dayEvents.length === 0 && (
        <div className="p-8 text-center border-x border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
          <p className="text-sm text-gray-400 dark:text-gray-500">
            {t("calendar.noEvents")}
          </p>
        </div>
      )}

      {/* Hour timeline */}
      <div className="border border-t-0 border-gray-200 dark:border-gray-700 rounded-b-lg overflow-y-auto max-h-[calc(100vh-440px)] sm:max-h-[calc(100vh-360px)]">
        {HOUR_SLOTS.map((hour) => (
          <div
            key={hour}
            className="flex border-b border-gray-100 dark:border-gray-800 last:border-b-0 min-h-11"
          >
            <div className="w-16 sm:w-20 shrink-0 p-2 text-right border-r border-gray-200 dark:border-gray-700">
              <span className="text-xs text-gray-400 dark:text-gray-500">
                {formatHour(hour, locale)}
              </span>
            </div>
            <div className="flex-1 p-1 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors cursor-pointer" />
          </div>
        ))}
      </div>
    </MotionDiv>
  );
}
