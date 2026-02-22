import { useTranslation } from "react-i18next";
import { STATUS_COLORS } from "../utils/calendarUtils";
import { MapPin, User, Moon } from "lucide-react";
import { formatMoneyWithDenomination } from "../../../utils/money";

/**
 * CalendarEventCard – renders a single reservation event in the calendar.
 * Compact on mobile, expandable on desktop.
 *
 * @param {Object} props
 * @param {Object} props.reservation - Reservation document
 * @param {'compact'|'full'} props.variant
 * @param {Function} props.onClick
 */
export default function CalendarEventCard({
  reservation,
  variant = "compact",
  onClick,
}) {
  const { t, i18n } = useTranslation();
  const locale = i18n.language === "es" ? "es-MX" : "en-US";
  const colors = STATUS_COLORS[reservation.status] || STATUS_COLORS.pending;

  const fmtDate = (iso) =>
    new Date(iso).toLocaleDateString(locale, {
      month: "short",
      day: "numeric",
    });

  const fmtCurrency = (amount, currency = "MXN") =>
    formatMoneyWithDenomination(amount, {
      locale,
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  if (variant === "compact") {
    return (
      <button
        type="button"
        onClick={() => onClick?.(reservation)}
        className={`w-full text-left px-2 py-1 rounded text-xs font-medium truncate border-l-2 ${colors.bg} ${colors.text} ${colors.border} hover:opacity-80 transition-opacity min-h-6`}
        title={`${reservation.guestName} – ${t(`calendar.status.${reservation.status}`)}`}
      >
        {reservation.guestName}
      </button>
    );
  }

  // Full variant (for day/week views)
  return (
    <button
      type="button"
      onClick={() => onClick?.(reservation)}
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
              {reservation.propertyId}
            </span>
          </div>
          <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-500 dark:text-gray-400">
            <span className="flex items-center gap-1">
              <User className="w-3 h-3" />
              {reservation.guestCount}
            </span>
            <span className="flex items-center gap-1">
              <Moon className="w-3 h-3" />
              {reservation.nights} {t("calendar.nights")}
            </span>
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
          <p className="text-[10px] text-gray-400 mt-0.5">
            {fmtDate(reservation.checkInDate)} —{" "}
            {fmtDate(reservation.checkOutDate)}
          </p>
        </div>
      </div>
    </button>
  );
}
