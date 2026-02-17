import { useTranslation } from "react-i18next";
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  CalendarDays,
  CalendarRange,
  LayoutGrid,
} from "lucide-react";
import { formatViewTitle } from "../utils/calendarUtils";

const VIEWS = [
  { key: "day", icon: Calendar, labelKey: "calendar.views.day" },
  { key: "week", icon: CalendarDays, labelKey: "calendar.views.week" },
  { key: "month", icon: CalendarRange, labelKey: "calendar.views.month" },
  { key: "year", icon: LayoutGrid, labelKey: "calendar.views.year" },
];

/**
 * CalendarToolbar – navigation + view switcher for admin calendar.
 * Responsive: stacks vertically on mobile, horizontal on desktop.
 */
export default function CalendarToolbar({
  view,
  currentDate,
  onPrev,
  onNext,
  onToday,
  onViewChange,
}) {
  const { t, i18n } = useTranslation();
  const locale = i18n.language === "es" ? "es-MX" : "en-US";
  const title = formatViewTitle(view, currentDate, locale);

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      {/* Left: navigation */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onToday}
          className="px-3 py-2 text-sm font-medium rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors min-h-11"
        >
          {t("calendar.today")}
        </button>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onPrev}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors min-h-11 min-w-11 flex items-center justify-center"
            aria-label={t("calendar.aria.previous")}
          >
            <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </button>
          <button
            type="button"
            onClick={onNext}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors min-h-11 min-w-11 flex items-center justify-center"
            aria-label={t("calendar.aria.next")}
          >
            <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </button>
        </div>

        <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100 capitalize ml-1 truncate">
          {title}
        </h2>
      </div>

      {/* Right: view switcher */}
      <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5 self-start sm:self-auto">
        {VIEWS.map(({ key, icon: Icon, labelKey }) => (
          <button
            key={key}
            type="button"
            onClick={() => onViewChange(key)}
            className={[
              "flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-md transition-all min-h-10",
              view === key
                ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200",
            ].join(" ")}
            aria-label={t(labelKey)}
            aria-pressed={view === key}
          >
            <Icon className="w-4 h-4" />
            <span className="hidden sm:inline">{t(labelKey)}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
