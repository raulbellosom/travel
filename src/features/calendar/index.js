// Feature: calendar
// Barrel exports for the calendar module

// Components
export { default as AdminCalendar } from "./components/AdminCalendar";
export { default as PropertyAvailabilityCalendar } from "./components/PropertyAvailabilityCalendar";
export { default as BookingSummary } from "./components/BookingSummary";
export { default as GuestSelector } from "./components/GuestSelector";
export { default as CalendarToolbar } from "./components/CalendarToolbar";
export { default as CalendarFilters } from "./components/CalendarFilters";
export { default as CalendarMonthView } from "./components/CalendarMonthView";
export { default as CalendarWeekView } from "./components/CalendarWeekView";
export { default as CalendarDayView } from "./components/CalendarDayView";
export { default as CalendarYearView } from "./components/CalendarYearView";
export { default as CalendarEventCard } from "./components/CalendarEventCard";
export { default as CalendarEventModal } from "./components/CalendarEventModal";

// Hooks
export { default as useCalendar } from "./hooks/useCalendar";
export { default as useCalendarReservations } from "./hooks/useCalendarReservations";

// Utils
export * from "./utils/calendarUtils";
