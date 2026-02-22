import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Calendar,
  User,
  Moon,
  CreditCard,
  MapPin,
  Mail,
  Phone,
  Clock,
  DollarSign,
} from "lucide-react";
import { STATUS_COLORS } from "../utils/calendarUtils";
import { formatMoneyWithDenomination } from "../../../utils/money";

/**
 * CalendarEventModal – detailed view of a reservation event.
 * Full-screen on mobile, centered modal on desktop.
 *
 * @param {Object} props
 * @param {Object|null} props.reservation
 * @param {boolean} props.open
 * @param {Function} props.onClose
 */
export default function CalendarEventModal({ reservation, open, onClose }) {
  const { t, i18n } = useTranslation();
  const locale = i18n.language === "es" ? "es-MX" : "en-US";
  const MotionDiv = motion.div;

  if (!reservation) return null;

  const colors = STATUS_COLORS[reservation.status] || STATUS_COLORS.pending;

  const fmtDate = (iso) =>
    new Date(iso).toLocaleDateString(locale, {
      weekday: "short",
      day: "numeric",
      month: "long",
      year: "numeric",
    });

  const fmtCurrency = (amount, currency = "MXN") =>
    formatMoneyWithDenomination(amount, {
      locale,
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  const InfoRow = ({ icon: Icon, label, value }) => {
    const IconComp = Icon;
    return (
      <div className="flex items-start gap-3 py-2">
        <IconComp className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
        <div className="min-w-0">
          <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 wrap-break-word">
            {value}
          </p>
        </div>
      </div>
    );
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <MotionDiv
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Modal */}
          <MotionDiv
            className="fixed inset-0 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 z-50 bg-white dark:bg-gray-900 sm:rounded-2xl sm:max-w-lg sm:w-full sm:max-h-[85vh] overflow-y-auto shadow-2xl"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
          >
            {/* Header */}
            <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center justify-between z-10">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {t("calendar.eventDetail.title")}
                </h3>
                <span
                  className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-semibold ${colors.bg} ${colors.text}`}
                >
                  {t(`calendar.status.${reservation.status}`)}
                </span>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors min-h-11 min-w-11 flex items-center justify-center"
                aria-label={t("calendar.aria.close")}
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Body */}
            <div className="px-4 py-4 space-y-1">
              <InfoRow
                icon={User}
                label={t("calendar.eventDetail.guest")}
                value={reservation.guestName}
              />
              <InfoRow
                icon={Mail}
                label={t("calendar.eventDetail.email")}
                value={reservation.guestEmail}
              />
              {reservation.guestPhone && (
                <InfoRow
                  icon={Phone}
                  label={t("calendar.eventDetail.phone")}
                  value={reservation.guestPhone}
                />
              )}
              <InfoRow
                icon={MapPin}
                label={t("calendar.eventDetail.property")}
                value={reservation.propertyId}
              />

              <div className="border-t border-gray-100 dark:border-gray-800 my-2" />

              <InfoRow
                icon={Calendar}
                label={t("calendar.eventDetail.checkIn")}
                value={fmtDate(reservation.checkInDate)}
              />
              <InfoRow
                icon={Calendar}
                label={t("calendar.eventDetail.checkOut")}
                value={fmtDate(reservation.checkOutDate)}
              />
              <InfoRow
                icon={Moon}
                label={t("calendar.eventDetail.nights")}
                value={reservation.nights}
              />
              <InfoRow
                icon={User}
                label={t("calendar.eventDetail.guests")}
                value={reservation.guestCount}
              />

              <div className="border-t border-gray-100 dark:border-gray-800 my-2" />

              <InfoRow
                icon={DollarSign}
                label={t("calendar.eventDetail.total")}
                value={fmtCurrency(
                  reservation.totalAmount,
                  reservation.currency,
                )}
              />
              {reservation.baseAmount && (
                <InfoRow
                  icon={DollarSign}
                  label={t("calendar.eventDetail.baseAmount")}
                  value={fmtCurrency(
                    reservation.baseAmount,
                    reservation.currency,
                  )}
                />
              )}
              <InfoRow
                icon={CreditCard}
                label={t("calendar.eventDetail.paymentStatus")}
                value={t(`calendar.paymentStatus.${reservation.paymentStatus}`)}
              />
              {reservation.paymentProvider && (
                <InfoRow
                  icon={CreditCard}
                  label={t("calendar.eventDetail.provider")}
                  value={reservation.paymentProvider}
                />
              )}

              {reservation.specialRequests && (
                <>
                  <div className="border-t border-gray-100 dark:border-gray-800 my-2" />
                  <InfoRow
                    icon={Clock}
                    label={t("calendar.eventDetail.specialRequests")}
                    value={reservation.specialRequests}
                  />
                </>
              )}
            </div>

            {/* Footer info */}
            <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700 sm:rounded-b-2xl">
              <p className="text-[11px] text-gray-400">ID: {reservation.$id}</p>
              {reservation.$createdAt && (
                <p className="text-[11px] text-gray-400">
                  {t("calendar.eventDetail.createdAt")}:{" "}
                  {new Date(reservation.$createdAt).toLocaleDateString(locale)}
                </p>
              )}
            </div>
          </MotionDiv>
        </>
      )}
    </AnimatePresence>
  );
}
