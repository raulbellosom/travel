import { useTranslation } from "react-i18next";
import { getReservationStatusColors, getPaymentStatusColors } from "../utils";

/**
 * StatusBadge – shows reservation or payment status with appropriate colour.
 */
export const ReservationStatusBadge = ({
  status,
  type = "reservation",
  className = "",
}) => {
  const { t } = useTranslation();
  const colors =
    type === "payment"
      ? getPaymentStatusColors(status)
      : getReservationStatusColors(status);

  const label =
    type === "payment"
      ? t(`paymentStatus.${status}`, { defaultValue: status })
      : t(`reservationStatus.${status}`, { defaultValue: status });

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${colors.bg} ${colors.text} ${className}`}
    >
      {label}
    </span>
  );
};

export default ReservationStatusBadge;
