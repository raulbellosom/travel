/**
 * Calendar utility functions
 * Pure helpers for date manipulation, grid generation, and formatting.
 */

/* ── Date helpers ───────────────────────────────────── */

export const pad = (n) => (n < 10 ? `0${n}` : `${n}`);

/** YYYY-MM-DD key from a Date */
export const dateKey = (d) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

/** Compare two dates ignoring time */
export const sameDay = (a, b) =>
  a &&
  b &&
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

/** Strip time from a date */
export const stripTime = (d) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate());

/** First day of month */
export const startOfMonth = (d) => new Date(d.getFullYear(), d.getMonth(), 1);

/** Last day of month */
export const endOfMonth = (d) => new Date(d.getFullYear(), d.getMonth() + 1, 0);

/** Add N months */
export const addMonths = (d, n) =>
  new Date(d.getFullYear(), d.getMonth() + n, 1);

/** Add N days */
export const addDays = (d, n) => {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
};

/** Start of week (Sunday = 0) */
export const startOfWeek = (d) => {
  const r = new Date(d);
  r.setDate(r.getDate() - r.getDay());
  return stripTime(r);
};

/** End of week (Saturday) */
export const endOfWeek = (d) => {
  const r = startOfWeek(d);
  r.setDate(r.getDate() + 6);
  return r;
};

/** Start of year (Jan 1) */
export const startOfYear = (d) => new Date(d.getFullYear(), 0, 1);

/** End of year (Dec 31) */
export const endOfYear = (d) => new Date(d.getFullYear(), 11, 31);

/** Number of days between two dates */
export const daysBetween = (a, b) =>
  Math.ceil((stripTime(b) - stripTime(a)) / 86400000);

/** Check if date is today */
export const isToday = (d) => sameDay(d, new Date());

/** Check if date is in the same month as ref */
export const isSameMonth = (d, ref) =>
  d.getFullYear() === ref.getFullYear() && d.getMonth() === ref.getMonth();

/* ── Grid generators ────────────────────────────────── */

/** Generate all days visible in a month grid (includes partial prev/next month) */
export const getMonthGridDays = (monthDate) => {
  const start = startOfMonth(monthDate);
  const end = endOfMonth(monthDate);
  const gridStart = new Date(start);
  gridStart.setDate(start.getDate() - start.getDay()); // Start from Sunday

  const days = [];
  const cur = new Date(gridStart);

  // 6 weeks max
  while (cur <= end || cur.getDay() !== 0) {
    days.push(new Date(cur));
    cur.setDate(cur.getDate() + 1);
  }
  return days;
};

/** Generate all days in a week starting from date */
export const getWeekDays = (date) => {
  const weekStart = startOfWeek(date);
  return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
};

/** Hour slots for day/week view (0-23) */
export const HOUR_SLOTS = Array.from({ length: 24 }, (_, i) => i);

/** Generate 12 months for year view */
export const getYearMonths = (year) =>
  Array.from({ length: 12 }, (_, i) => new Date(year, i, 1));

/* ── View range calculators ─────────────────────────── */

/** Get the date range for a given view and reference date */
export const getViewRange = (view, refDate) => {
  const d = stripTime(refDate);
  switch (view) {
    case "day":
      return { start: d, end: d };
    case "week":
      return { start: startOfWeek(d), end: endOfWeek(d) };
    case "month":
      return { start: startOfMonth(d), end: endOfMonth(d) };
    case "year":
      return { start: startOfYear(d), end: endOfYear(d) };
    default:
      return { start: d, end: d };
  }
};

/** Navigate to next/prev period based on view */
export const navigateDate = (view, refDate, direction) => {
  const d = new Date(refDate);
  switch (view) {
    case "day":
      return addDays(d, direction);
    case "week":
      return addDays(d, direction * 7);
    case "month":
      return addMonths(d, direction);
    case "year":
      return new Date(d.getFullYear() + direction, d.getMonth(), 1);
    default:
      return d;
  }
};

/* ── Formatting ─────────────────────────────────────── */

/** Format hour (0-23) to display string */
export const formatHour = (hour, locale = "es-MX") => {
  const d = new Date(2000, 0, 1, hour, 0, 0);
  return d.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" });
};

/** Format day header for week/day view */
export const formatDayHeader = (d, locale = "es-MX") =>
  d.toLocaleDateString(locale, { weekday: "short", day: "numeric" });

/** Format month + year */
export const formatMonthYear = (d, locale = "es-MX") =>
  d.toLocaleDateString(locale, { month: "long", year: "numeric" });

/** Format view title based on current view */
export const formatViewTitle = (view, refDate, locale = "es-MX") => {
  switch (view) {
    case "day":
      return refDate.toLocaleDateString(locale, {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    case "week": {
      const ws = startOfWeek(refDate);
      const we = endOfWeek(refDate);
      const sameMonth = ws.getMonth() === we.getMonth();
      if (sameMonth) {
        return `${ws.getDate()} - ${we.getDate()} ${ws.toLocaleDateString(locale, { month: "long", year: "numeric" })}`;
      }
      return `${ws.toLocaleDateString(locale, { day: "numeric", month: "short" })} - ${we.toLocaleDateString(locale, { day: "numeric", month: "short", year: "numeric" })}`;
    }
    case "month":
      return formatMonthYear(refDate, locale);
    case "year":
      return `${refDate.getFullYear()}`;
    default:
      return "";
  }
};

/* ── Reservation helpers ────────────────────────────── */

/** Map reservation status to color scheme */
export const STATUS_COLORS = {
  pending: {
    bg: "bg-amber-100 dark:bg-amber-900/30",
    text: "text-amber-800 dark:text-amber-200",
    border: "border-amber-300 dark:border-amber-700",
    dot: "bg-amber-500",
  },
  confirmed: {
    bg: "bg-blue-100 dark:bg-blue-900/30",
    text: "text-blue-800 dark:text-blue-200",
    border: "border-blue-300 dark:border-blue-700",
    dot: "bg-blue-500",
  },
  completed: {
    bg: "bg-emerald-100 dark:bg-emerald-900/30",
    text: "text-emerald-800 dark:text-emerald-200",
    border: "border-emerald-300 dark:border-emerald-700",
    dot: "bg-emerald-500",
  },
  cancelled: {
    bg: "bg-red-100 dark:bg-red-900/30",
    text: "text-red-800 dark:text-red-200",
    border: "border-red-300 dark:border-red-700",
    dot: "bg-red-500",
  },
  expired: {
    bg: "bg-gray-100 dark:bg-gray-800/50",
    text: "text-gray-600 dark:text-gray-400",
    border: "border-gray-300 dark:border-gray-600",
    dot: "bg-gray-400",
  },
};

/** Get events for a specific day from reservations list (supports all booking types) */
export const getEventsForDay = (date, reservations) => {
  const dayStart = stripTime(date);
  return reservations.filter((r) => {
    // For time_slot / fixed_event: use startDateTime/endDateTime if available
    if (r.startDateTime && r.endDateTime) {
      const start = stripTime(new Date(r.startDateTime));
      const end = stripTime(new Date(r.endDateTime));
      if (dayStart >= start && dayStart <= end) return true;
    }
    // For date_range / fallback: use checkInDate/checkOutDate
    if (r.checkInDate && r.checkOutDate) {
      const checkIn = stripTime(new Date(r.checkInDate));
      const checkOut = stripTime(new Date(r.checkOutDate));
      if (dayStart >= checkIn && dayStart <= checkOut) return true;
    }
    return false;
  });
};

/** Group reservations by date key for fast lookup (supports all booking types) */
export const groupReservationsByDate = (reservations) => {
  const map = {};
  for (const r of reservations) {
    let startDate = null;
    let endDate = null;

    // Prefer startDateTime/endDateTime for time_slot/fixed_event
    if (r.startDateTime && r.endDateTime) {
      startDate = stripTime(new Date(r.startDateTime));
      endDate = stripTime(new Date(r.endDateTime));
    } else if (r.checkInDate && r.checkOutDate) {
      startDate = stripTime(new Date(r.checkInDate));
      endDate = stripTime(new Date(r.checkOutDate));
    }

    if (!startDate || !endDate) continue;

    let cur = new Date(startDate);
    while (cur <= endDate) {
      const key = dateKey(cur);
      if (!map[key]) map[key] = [];
      map[key].push(r);
      cur = addDays(cur, 1);
    }
  }
  return map;
};

/** Calculate price for a date range from pricing map */
export const calculateRangePrice = (startDate, endDate, pricing = {}) => {
  if (!startDate || !endDate) return { total: 0, nights: 0, breakdown: [] };
  const nights = daysBetween(startDate, endDate);
  const breakdown = [];
  let total = 0;
  let cur = new Date(startDate);
  for (let i = 0; i < nights; i++) {
    const key = dateKey(cur);
    const price = pricing[key] || 0;
    breakdown.push({ date: key, price });
    total += price;
    cur = addDays(cur, 1);
  }
  return { total, nights, breakdown };
};

/* ── Lead schedule parser ───────────────────────────── */

/**
 * Attempt to parse schedule information from a reservation's specialRequests text.
 * Lead-generated reservations with bookingType=manual_contact often contain a structured
 * message like:
 *   "... el 27/2/2026 en el horario 11:30 a.m. - 03:30 p.m. ..."
 *   "... on 2/27/2026 from 11:30 AM - 3:30 PM ..."
 *
 * Returns { startDateTime, endDateTime } ISO strings or null if not parseable.
 */
export const parseScheduleFromText = (text) => {
  if (!text || typeof text !== "string") return null;

  // ── Try to extract date (DD/MM/YYYY or D/M/YYYY) ─────────────
  const dateRegex = /(\d{1,2})\/(\d{1,2})\/(\d{4})/;
  const dateMatch = text.match(dateRegex);
  if (!dateMatch) return null;

  const day = parseInt(dateMatch[1], 10);
  const month = parseInt(dateMatch[2], 10);
  const year = parseInt(dateMatch[3], 10);

  // Validate date components
  if (month < 1 || month > 12 || day < 1 || day > 31 || year < 2020)
    return null;

  // ── Try to extract time range ─────────────────────────────────
  // Pattern: HH:MM a.m./p.m./AM/PM - HH:MM a.m./p.m./AM/PM
  const timeRegex =
    /(\d{1,2}):(\d{2})\s*([ap]\.?m\.?)\s*[-–—]\s*(\d{1,2}):(\d{2})\s*([ap]\.?m\.?)/i;
  const timeMatch = text.match(timeRegex);

  const parseHour = (h, m, period) => {
    let hour = parseInt(h, 10);
    const minute = parseInt(m, 10);
    const isAm = /^a/i.test(period);
    const isPm = /^p/i.test(period);

    if (isPm && hour !== 12) hour += 12;
    if (isAm && hour === 12) hour = 0;

    return { hour, minute };
  };

  if (timeMatch) {
    const start = parseHour(timeMatch[1], timeMatch[2], timeMatch[3]);
    const end = parseHour(timeMatch[4], timeMatch[5], timeMatch[6]);

    const startDt = new Date(year, month - 1, day, start.hour, start.minute, 0);
    const endDt = new Date(year, month - 1, day, end.hour, end.minute, 0);

    // Handle overnight (end < start)
    if (endDt <= startDt) endDt.setDate(endDt.getDate() + 1);

    return {
      startDateTime: startDt.toISOString(),
      endDateTime: endDt.toISOString(),
    };
  }

  // No time found, just use the date as a full-day event
  const startDt = new Date(year, month - 1, day, 0, 0, 0);
  const endDt = new Date(year, month - 1, day, 23, 59, 59);

  return {
    startDateTime: startDt.toISOString(),
    endDateTime: endDt.toISOString(),
  };
};

/**
 * Enrich a reservation with parsed schedule when it's a manual_contact booking
 * that has no startDateTime/endDateTime or checkInDate/checkOutDate.
 * Returns a new object with injected date fields (does not mutate original).
 */
export const enrichReservationDates = (reservation) => {
  if (!reservation) return reservation;

  // Already has dates? Nothing to do
  const hasDates =
    (reservation.startDateTime && reservation.endDateTime) ||
    (reservation.checkInDate && reservation.checkOutDate);
  if (hasDates) return reservation;

  // Try parsing from specialRequests
  const parsed = parseScheduleFromText(reservation.specialRequests);
  if (!parsed) return reservation;

  return {
    ...reservation,
    startDateTime: parsed.startDateTime,
    endDateTime: parsed.endDateTime,
    _parsedFromText: true, // Flag for UI to know this was inferred
  };
};
