// ─── Reservation & Payment status enums ────────────────────────────────────
export const RESERVATION_STATUSES = [
  "pending",
  "confirmed",
  "completed",
  "cancelled",
  "expired",
];

export const PAYMENT_STATUSES = [
  "unpaid",
  "pending",
  "paid",
  "failed",
  "refunded",
];

export const SCHEDULE_TYPES = ["date_range", "time_slot"];

export const CURRENCIES = ["MXN", "USD", "EUR"];

// ─── Status colour maps ─────────────────────────────────────────────────────
export const RESERVATION_STATUS_COLORS = {
  pending: {
    bg: "bg-amber-100  dark:bg-amber-900/30",
    text: "text-amber-700  dark:text-amber-300",
    ring: "ring-amber-400",
  },
  confirmed: {
    bg: "bg-cyan-100   dark:bg-cyan-900/30",
    text: "text-cyan-700   dark:text-cyan-300",
    ring: "ring-cyan-400",
  },
  completed: {
    bg: "bg-emerald-100 dark:bg-emerald-900/30",
    text: "text-emerald-700 dark:text-emerald-300",
    ring: "ring-emerald-400",
  },
  cancelled: {
    bg: "bg-rose-100   dark:bg-rose-900/30",
    text: "text-rose-700   dark:text-rose-300",
    ring: "ring-rose-400",
  },
  expired: {
    bg: "bg-slate-100  dark:bg-slate-800",
    text: "text-slate-500  dark:text-slate-400",
    ring: "ring-slate-400",
  },
};

export const PAYMENT_STATUS_COLORS = {
  unpaid: {
    bg: "bg-orange-100 dark:bg-orange-900/30",
    text: "text-orange-700 dark:text-orange-300",
  },
  pending: {
    bg: "bg-amber-100  dark:bg-amber-900/30",
    text: "text-amber-700  dark:text-amber-300",
  },
  paid: {
    bg: "bg-emerald-100 dark:bg-emerald-900/30",
    text: "text-emerald-700 dark:text-emerald-300",
  },
  failed: {
    bg: "bg-rose-100   dark:bg-rose-900/30",
    text: "text-rose-700   dark:text-rose-300",
  },
  refunded: {
    bg: "bg-purple-100 dark:bg-purple-900/30",
    text: "text-purple-700 dark:text-purple-300",
  },
};

// ─── Form defaults ──────────────────────────────────────────────────────────
export const MANUAL_FORM_INITIAL_STATE = Object.freeze({
  resourceId: "",
  scheduleType: "date_range",
  checkInDate: "",
  checkOutDate: "",
  startDateTime: "",
  endDateTime: "",
  guestName: "",
  guestEmail: "",
  guestPhone: "",
  guestCount: "1",
  baseAmount: "",
  totalAmount: "",
  currency: "MXN",
  externalRef: "",
  specialRequests: "",
  status: "pending",
  paymentStatus: "pending",
});

// ─── URL param keys ─────────────────────────────────────────────────────────
export const FILTER_PARAMS = {
  query: "query",
  status: "status",
  paymentStatus: "paymentStatus",
  resourceId: "resourceId",
  from: "from",
  to: "to",
  page: "page",
  sort: "sort",
  sortDir: "sortDir",
  pageSize: "pageSize",
  view: "view", // "table" | "cards"
};
