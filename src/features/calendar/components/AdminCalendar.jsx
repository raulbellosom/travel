import { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../../hooks/useAuth";
import useCalendar from "../hooks/useCalendar";
import useCalendarReservations from "../hooks/useCalendarReservations";
import CalendarToolbar from "./CalendarToolbar";
import CalendarFilters from "./CalendarFilters";
import CalendarMonthView from "./CalendarMonthView";
import CalendarWeekView from "./CalendarWeekView";
import CalendarDayView from "./CalendarDayView";
import CalendarYearView from "./CalendarYearView";
import CalendarEventModal from "./CalendarEventModal";
import { Spinner } from "../../../components/common";

/**
 * AdminCalendar – full calendar experience for the admin dashboard.
 * Composes all calendar views, filters, and event interactions.
 *
 * @param {Object} props
 * @param {Array} props.properties - List of properties for filtering
 */
export default function AdminCalendar({ properties = [] }) {
  const { t } = useTranslation();
  const { user } = useAuth();

  const {
    view,
    currentDate,
    range,
    goNext,
    goPrev,
    goToday,
    goToDate,
    changeView,
  } = useCalendar({ defaultView: "month" });

  const [filters, setFilters] = useState({
    propertyId: "",
    status: "",
    paymentStatus: "",
  });

  const { eventsByDate, rangeReservations, loading, error, refresh } =
    useCalendarReservations({
      userId: user?.$id,
      range,
      filters,
    });

  const [selectedEvent, setSelectedEvent] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  const handleEventClick = useCallback((reservation) => {
    setSelectedEvent(reservation);
    setModalOpen(true);
  }, []);

  const handleDayClick = useCallback(
    (day) => {
      if (view === "month" || view === "year") {
        goToDate(day);
        changeView("day");
      } else {
        goToDate(day);
      }
    },
    [view, goToDate, changeView],
  );

  const handleMonthClick = useCallback(
    (monthDate) => {
      goToDate(monthDate);
      changeView("month");
    },
    [goToDate, changeView],
  );

  const renderView = () => {
    switch (view) {
      case "day":
        return (
          <CalendarDayView
            currentDate={currentDate}
            eventsByDate={eventsByDate}
            onEventClick={handleEventClick}
          />
        );
      case "week":
        return (
          <CalendarWeekView
            currentDate={currentDate}
            eventsByDate={eventsByDate}
            onDayClick={handleDayClick}
            onEventClick={handleEventClick}
          />
        );
      case "month":
        return (
          <CalendarMonthView
            currentDate={currentDate}
            eventsByDate={eventsByDate}
            onDayClick={handleDayClick}
            onEventClick={handleEventClick}
          />
        );
      case "year":
        return (
          <CalendarYearView
            currentDate={currentDate}
            eventsByDate={eventsByDate}
            onMonthClick={handleMonthClick}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <CalendarToolbar
        view={view}
        currentDate={currentDate}
        onPrev={goPrev}
        onNext={goNext}
        onToday={goToday}
        onViewChange={changeView}
      />

      {/* Filters */}
      <CalendarFilters
        filters={filters}
        onFiltersChange={setFilters}
        properties={properties}
      />

      {/* Stats bar */}
      <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 px-1">
        <span>
          {rangeReservations.length} {t("calendar.reservationsInView")}
        </span>
        {loading && <Spinner size="sm" />}
        {error && (
          <span className="text-red-500 text-xs">
            {error}
            <button
              type="button"
              onClick={refresh}
              className="ml-2 underline text-blue-500"
            >
              {t("calendar.retry")}
            </button>
          </span>
        )}
      </div>

      {/* Calendar view */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {loading && rangeReservations.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <Spinner size="lg" />
          </div>
        ) : (
          renderView()
        )}
      </div>

      {/* Event detail modal */}
      <CalendarEventModal
        reservation={selectedEvent}
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelectedEvent(null);
        }}
      />
    </div>
  );
}
