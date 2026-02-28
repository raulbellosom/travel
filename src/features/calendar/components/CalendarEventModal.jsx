import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import {
  Calendar,
  User,
  CreditCard,
  MapPin,
  Mail,
  Phone,
  Clock,
  DollarSign,
  Tag,
  ShoppingBag,
  Ticket,
  Users,
  ExternalLink,
  FileText,
  Hash,
} from "lucide-react";
import Modal, {
  ModalFooter,
} from "../../../components/common/organisms/Modal/Modal";
import { Button } from "../../../components/common";
import { STATUS_COLORS } from "../utils/calendarUtils";
import { formatMoneyWithDenomination } from "../../../utils/money";
import {
  getResourceTypeLabel,
  getCommercialModeLabel,
  getPricingModelLabel,
  getBookingTypeLabel,
} from "../../../utils/resourceLabels";

/**
 * CalendarEventModal – detailed view of a reservation event.
 * Uses the shared Modal component with proper header/scrollable-content/footer.
 *
 * Resource-aware: adapts display based on bookingType, commercialMode, pricingModel.
 *
 * @param {Object} props
 * @param {Object|null} props.reservation
 * @param {boolean} props.open
 * @param {Function} props.onClose
 * @param {Object} props.resourceMap – { resourceId: resourceDoc }
 */
const InfoRow = ({ icon: Icon, label, value, className = "" }) => {
  if (value === null || value === undefined || value === "") return null;
  return (
    <div className={`flex items-start gap-3 py-2 ${className}`}>
      <Icon className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
      <div className="min-w-0">
        <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 break-words">
          {value}
        </p>
      </div>
    </div>
  );
};

const Divider = () => (
  <div className="border-t border-gray-100 dark:border-gray-800 my-2" />
);

const EMPTY_OBJECT = {};

export default function CalendarEventModal({
  reservation,
  open,
  onClose,
  resourceMap = EMPTY_OBJECT,
}) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const locale = i18n.language === "es" ? "es-MX" : "en-US";

  const resource = useMemo(() => {
    if (!reservation) return null;
    const id = reservation.resourceId || reservation.propertyId;
    return resourceMap[id] || null;
  }, [reservation, resourceMap]);

  // Determine which date/time section to show based on bookingType
  const bookingType =
    reservation?.bookingType || resource?.bookingType || "date_range";
  const hasTimeSlotDates =
    reservation?.startDateTime || reservation?.endDateTime;
  const hasDateRangeDates =
    reservation?.checkInDate || reservation?.checkOutDate;

  // Duration label for time_slot bookings
  const durationLabel = useMemo(() => {
    if (!reservation?.startDateTime || !reservation?.endDateTime) return null;
    const start = new Date(reservation.startDateTime);
    const end = new Date(reservation.endDateTime);
    const diffMs = end - start;
    const diffHours = Math.round((diffMs / 3600000) * 10) / 10;
    if (diffHours < 24) {
      return `${diffHours} ${diffHours === 1 ? t("calendar.booking.hour") : t("calendar.booking.hours")}`;
    }
    const diffDays = Math.round(diffHours / 24);
    return `${diffDays} ${diffDays === 1 ? t("calendar.booking.day") : t("calendar.booking.days")}`;
  }, [reservation?.startDateTime, reservation?.endDateTime, t]);

  if (!reservation) return null;

  const colors = STATUS_COLORS[reservation.status] || STATUS_COLORS.pending;
  const commercialMode =
    reservation.commercialMode || resource?.commercialMode || "";
  const pricingModel = resource?.pricingModel || "";
  const resourceType = resource?.resourceType || "";

  const fmtDate = (iso) => {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString(locale, {
      weekday: "short",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const fmtDateTime = (iso) => {
    if (!iso) return "—";
    return new Date(iso).toLocaleString(locale, {
      weekday: "short",
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const fmtCurrency = (amount, currency = "MXN") =>
    formatMoneyWithDenomination(amount, {
      locale,
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  // Resolve resource display name
  const resourceTitle =
    resource?.title || reservation.resourceId || reservation.propertyId || "—";

  // Translate enum values using centralized resourceLabels utility

  const handleViewReservation = () => {
    onClose?.();
    navigate(`/app/reservations/${reservation.$id}`);
  };

  const bookingTypeLabel = getBookingTypeLabel(bookingType, t);

  const description = (
    <span className="flex items-center gap-2 flex-wrap">
      <span
        className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${colors.bg} ${colors.text}`}
      >
        {t(`calendar.status.${reservation.status}`)}
      </span>
      {resourceType && (
        <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
          {getResourceTypeLabel(resourceType, t)}
        </span>
      )}
      {commercialMode && (
        <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300">
          {getCommercialModeLabel(commercialMode, t)}
        </span>
      )}
    </span>
  );

  const footer = (
    <ModalFooter>
      <Button variant="ghost" size="md" onClick={onClose}>
        {t("calendar.aria.close")}
      </Button>
      <Button
        variant="primary"
        size="md"
        onClick={handleViewReservation}
        rightIcon={ExternalLink}
      >
        {t("calendar.eventDetail.viewReservation")}
      </Button>
    </ModalFooter>
  );

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      title={t("calendar.eventDetail.title")}
      description={description}
      footer={footer}
      size="md"
    >
      <div className="space-y-1">
        {/* ── Guest info ──────────────────────────── */}
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

        <Divider />

        {/* ── Resource info ───────────────────────── */}
        <InfoRow
          icon={MapPin}
          label={t("calendar.eventDetail.resource")}
          value={resourceTitle}
        />
        {resourceType && (
          <InfoRow
            icon={Tag}
            label={t("calendar.eventDetail.resourceType")}
            value={getResourceTypeLabel(resourceType, t)}
          />
        )}
        {commercialMode && (
          <InfoRow
            icon={ShoppingBag}
            label={t("calendar.eventDetail.commercialMode")}
            value={getCommercialModeLabel(commercialMode, t)}
          />
        )}
        <InfoRow
          icon={Ticket}
          label={t("calendar.eventDetail.bookingType")}
          value={bookingTypeLabel}
        />
        {pricingModel && (
          <InfoRow
            icon={Hash}
            label={t("calendar.eventDetail.pricingModel")}
            value={getPricingModelLabel(pricingModel, t)}
          />
        )}

        <Divider />

        {/* ── Date/time section (adapts to booking type) ─── */}
        {reservation._parsedFromText && (
          <div className="flex items-center gap-2 px-2 py-1.5 bg-amber-50 dark:bg-amber-900/20 rounded-lg text-xs text-amber-700 dark:text-amber-300">
            <Clock className="w-3.5 h-3.5 shrink-0" />
            <span>{t("calendar.eventDetail.parsedFromRequest")}</span>
          </div>
        )}
        {hasTimeSlotDates ? (
          <>
            <InfoRow
              icon={Clock}
              label={t("calendar.eventDetail.startDateTime")}
              value={fmtDateTime(reservation.startDateTime)}
            />
            <InfoRow
              icon={Clock}
              label={t("calendar.eventDetail.endDateTime")}
              value={fmtDateTime(reservation.endDateTime)}
            />
            {durationLabel && (
              <InfoRow
                icon={Clock}
                label={t("calendar.eventDetail.duration")}
                value={durationLabel}
              />
            )}
          </>
        ) : hasDateRangeDates ? (
          <>
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
            {reservation.nights > 0 && (
              <InfoRow
                icon={Calendar}
                label={t("calendar.eventDetail.nights")}
                value={reservation.nights}
              />
            )}
          </>
        ) : null}

        {reservation.guestCount > 0 && (
          <InfoRow
            icon={Users}
            label={t("calendar.eventDetail.guests")}
            value={reservation.guestCount}
          />
        )}
        {reservation.units > 1 && (
          <InfoRow
            icon={Hash}
            label={t("calendar.eventDetail.units")}
            value={reservation.units}
          />
        )}

        <Divider />

        {/* ── Financial section ───────────────────── */}
        <InfoRow
          icon={DollarSign}
          label={t("calendar.eventDetail.total")}
          value={fmtCurrency(reservation.totalAmount, reservation.currency)}
        />
        {reservation.baseAmount > 0 &&
          reservation.baseAmount !== reservation.totalAmount && (
            <InfoRow
              icon={DollarSign}
              label={t("calendar.eventDetail.baseAmount")}
              value={fmtCurrency(reservation.baseAmount, reservation.currency)}
            />
          )}
        {reservation.feesAmount > 0 && (
          <InfoRow
            icon={DollarSign}
            label={t("calendar.eventDetail.fees")}
            value={fmtCurrency(reservation.feesAmount, reservation.currency)}
          />
        )}
        {reservation.taxAmount > 0 && (
          <InfoRow
            icon={DollarSign}
            label={t("calendar.eventDetail.taxes")}
            value={fmtCurrency(reservation.taxAmount, reservation.currency)}
          />
        )}

        <InfoRow
          icon={CreditCard}
          label={t("calendar.eventDetail.paymentStatus")}
          value={t(`calendar.paymentStatus.${reservation.paymentStatus}`)}
        />
        {reservation.paymentProvider &&
          reservation.paymentProvider !== "manual" && (
            <InfoRow
              icon={CreditCard}
              label={t("calendar.eventDetail.provider")}
              value={reservation.paymentProvider}
            />
          )}

        {reservation.specialRequests && (
          <>
            <Divider />
            <InfoRow
              icon={FileText}
              label={t("calendar.eventDetail.specialRequests")}
              value={reservation.specialRequests}
            />
          </>
        )}

        {/* ── Meta footer ────────────────────────── */}
        <Divider />
        <div className="pt-1">
          <p className="text-[11px] text-gray-400">ID: {reservation.$id}</p>
          {reservation.$createdAt && (
            <p className="text-[11px] text-gray-400">
              {t("calendar.eventDetail.createdAt")}:{" "}
              {new Date(reservation.$createdAt).toLocaleDateString(locale)}
            </p>
          )}
        </div>
      </div>
    </Modal>
  );
}
