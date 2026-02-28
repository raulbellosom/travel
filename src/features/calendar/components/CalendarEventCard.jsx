import { useTranslation } from "react-i18next";
import { STATUS_COLORS } from "../utils/calendarUtils";
import { MapPin, User, Clock, Calendar } from "lucide-react";
import { formatMoneyWithDenomination } from "../../../utils/money";

/**
 * CalendarEventCard – renders a single reservation event in the calendar.
 * Compact on mobile, expandable on desktop.
 * Resource-aware: adapts display based on bookingType.
 *
 * @param {Object} props
 * @param {Object} props.reservation - Reservation document
 * @param {'compact'|'full'} props.variant
 * @param {Function} props.onClick
 * @param {Object} props.resourceMap - { resourceId: resourceDoc }
 */
const EMPTY_OBJECT = {};

export default function CalendarEventCard({
  reservation,
  variant = "compact",
  onClick,
  resourceMap = EMPTY_OBJECT,
}) {
  const { t, i18n } = useTranslation();
  const locale = i18n.language === "es" ? "es-MX" : "en-US";
  const colors = STATUS_COLORS[reservation.status] || STATUS_COLORS.pending;

  const resourceId = reservation.resourceId || reservation.propertyId;
  const resource = resourceMap[resourceId] || null;
  const resourceTitle = resource?.title || resourceId || "—";

  const bookingType =
    reservation.bookingType || resource?.bookingType || "date_range";
  const isTimeSlot =
    bookingType === "time_slot" || bookingType === "fixed_event";
  const hasTimeSlotDates = reservation.startDateTime && reservation.endDateTime;

  const fmtDate = (iso) =>
    new Date(iso).toLocaleDateString(locale, {
      month: "short",
      day: "numeric",
    });

  const fmtTime = (iso) =>
    new Date(iso).toLocaleTimeString(locale, {
      hour: "2-digit",
      minute: "2-digit",
    });

  const fmtCurrency = (amount, currency = "MXN") =>
    formatMoneyWithDenomination(amount, {
      locale,
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  // Build duration label
  const durationLabel = (() => {
    if (isTimeSlot && hasTimeSlotDates) {
      const start = new Date(reservation.startDateTime);
      const end = new Date(reservation.endDateTime);
      const diffMs = end - start;
      const diffHours = Math.round((diffMs / 3600000) * 10) / 10;
      if (diffHours < 24) {
        return `${diffHours}h`;
      }
      return `${Math.round(diffHours / 24)}d`;
    }
    if (reservation.nights > 0) {
      return `${reservation.nights} ${t("calendar.nights")}`;
    }
    return null;
  })();

  // Build date range label
  const dateLabel = (() => {
    if (isTimeSlot && hasTimeSlotDates) {
      return `${fmtTime(reservation.startDateTime)} — ${fmtTime(reservation.endDateTime)}`;
    }
    if (reservation.checkInDate && reservation.checkOutDate) {
      return `${fmtDate(reservation.checkInDate)} — ${fmtDate(reservation.checkOutDate)}`;
    }
    return null;
  })();

  if (variant === "compact") {
    return (
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onClick?.(reservation);
        }}
        className={`w-full text-left px-2 py-1 rounded text-xs font-medium truncate border-l-2 ${colors.bg} ${colors.text} ${colors.border} hover:opacity-80 transition-opacity min-h-6`}
        title={`${reservation.guestName} – ${resourceTitle} – ${t(`calendar.status.${reservation.status}`)}`}
      >
        {reservation.guestName}
      </button>
    );
  }

  // Full variant (for day/week views)
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick?.(reservation);
      }}
      className={`w-full text-left p-3 rounded-lg border ${colors.bg} ${colors.border} hover:shadow-md transition-all min-h-11`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className={`font-semibold text-sm truncate ${colors.text}`}>
            {reservation.guestName}
          </p>
          <div className="flex items-center gap-1.5 mt-1">
            <MapPin className="w-3 h-3 text-gray-400 shrink-0" />
            <span className="text-xs text-gray-500 dark:text-gray-400 truncate">
              {resourceTitle}
            </span>
          </div>
          <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-500 dark:text-gray-400">
            {reservation.guestCount > 0 && (
              <span className="flex items-center gap-1">
                <User className="w-3 h-3" />
                {reservation.guestCount}
              </span>
            )}
            {durationLabel && (
              <span className="flex items-center gap-1">
                {isTimeSlot ? (
                  <Clock className="w-3 h-3" />
                ) : (
                  <Calendar className="w-3 h-3" />
                )}
                {durationLabel}
              </span>
            )}
          </div>
        </div>
        <div className="text-right shrink-0">
          <span
            className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold ${colors.bg} ${colors.text}`}
          >
            {t(`calendar.status.${reservation.status}`)}
          </span>
          <p className="text-sm font-bold text-gray-900 dark:text-gray-100 mt-1">
            {fmtCurrency(reservation.totalAmount, reservation.currency)}
          </p>
          {dateLabel && (
            <p className="text-[10px] text-gray-400 mt-0.5">{dateLabel}</p>
          )}
        </div>
      </div>
    </button>
  );
}
