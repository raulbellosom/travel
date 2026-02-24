import dayjs from "dayjs";
import { RESERVATION_STATUS_COLORS, PAYMENT_STATUS_COLORS } from "./constants";

/**
 * Returns a human-readable schedule label for a reservation.
 */
export const formatScheduleLabel = (reservation, locale = "es-MX") => {
  const isTimeSlot =
    reservation.bookingType === "time_slot" ||
    reservation.bookingType === "fixed_event";

  const startValue = reservation.startDateTime || reservation.checkInDate;
  const endValue = reservation.endDateTime || reservation.checkOutDate;

  if (!startValue || !endValue) return "—";

  const start = dayjs(startValue);
  const end = dayjs(endValue);

  if (!start.isValid() || !end.isValid()) return "—";

  if (isTimeSlot) {
    return `${start.format("DD/MM/YY HH:mm")} – ${end.format("DD/MM/YY HH:mm")}`;
  }
  return `${start.format("DD/MM/YYYY")} – ${end.format("DD/MM/YYYY")}`;
};

/**
 * Calculate number of nights (or days) between two date strings.
 */
export const calcNights = (checkIn, checkOut) => {
  if (!checkIn || !checkOut) return 0;
  const diff = dayjs(checkOut).diff(dayjs(checkIn), "day");
  return Math.max(0, diff);
};

/**
 * Returns TailwindCSS colour classes for a reservation status.
 */
export const getReservationStatusColors = (status) =>
  RESERVATION_STATUS_COLORS[status] || RESERVATION_STATUS_COLORS.pending;

/**
 * Returns TailwindCSS colour classes for a payment status.
 */
export const getPaymentStatusColors = (status) =>
  PAYMENT_STATUS_COLORS[status] || PAYMENT_STATUS_COLORS.pending;

/**
 * Formats a monetary amount with currency code.
 */
export const formatMoney = (amount, currency = "MXN", locale = "es-MX") => {
  const num = Number(amount || 0);
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num);
  } catch {
    return `${currency} ${num.toFixed(2)}`;
  }
};

/**
 * Debounce utility (returns debounced fn + cancel).
 */
export const debounce = (fn, ms = 300) => {
  let timer;
  const debounced = (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
  debounced.cancel = () => clearTimeout(timer);
  return debounced;
};
