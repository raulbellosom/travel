/**
 * VoucherTicketMini — Compact "mini-ticket" card for voucher history lists.
 *
 * Styled like a small pass/stub with notch cutouts, to keep the ticket metaphor.
 */
import dayjs from "dayjs";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { Calendar, ChevronRight, Ticket } from "lucide-react";
import { ReservationStatusBadge } from "../../reservations/components/ReservationStatusBadge";
import { formatMoney } from "../../reservations/utils";

const VoucherTicketMini = ({ voucher, onClick }) => {
  const { t, i18n } = useTranslation();
  const locale = i18n.language === "en" ? "en-US" : "es-MX";
  const reservation = voucher?._reservation;

  const checkIn = reservation?.checkInDate
    ? dayjs(reservation.checkInDate).format("DD MMM")
    : "—";
  const checkOut = reservation?.checkOutDate
    ? dayjs(reservation.checkOutDate).format("DD MMM YY")
    : "";

  return (
    <motion.button
      type="button"
      onClick={() => onClick?.(voucher)}
      whileTap={{ scale: 0.98 }}
      className="group relative flex w-full items-stretch overflow-hidden rounded-2xl
                 border border-slate-200 dark:border-slate-700/50 bg-white dark:bg-slate-800/70 text-left shadow-sm
                 transition-all
                 [@media(hover:hover)]:hover:border-cyan-500/30 [@media(hover:hover)]:hover:shadow-md
                 [@media(hover:hover)]:hover:shadow-cyan-500/5"
    >
      {/* Left accent */}
      <div className="flex w-12 shrink-0 items-center justify-center bg-linear-to-b from-cyan-600 to-cyan-500">
        <Ticket className="h-5 w-5 text-white" aria-hidden="true" />
      </div>

      {/* Left notch */}
      <div className="absolute left-9 top-1/2 z-10 -translate-y-1/2">
        <div className="h-4 w-4 rounded-full bg-slate-100 dark:bg-slate-950" />
      </div>

      {/* Content area */}
      <div className="flex min-w-0 flex-1 items-center justify-between gap-3 py-3 pl-5 pr-3">
        <div className="min-w-0 flex-1">
          {/* Code */}
          <p className="truncate font-mono text-xs font-bold tracking-wide text-cyan-600 dark:text-cyan-300">
            {voucher.voucherCode}
          </p>

          {/* Guest */}
          <p className="mt-0.5 truncate text-[11px] text-slate-500 dark:text-slate-400">
            {reservation?.guestName || t("voucherPage.labels.guest")}
          </p>

          {/* Date + status */}
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 text-[10px] text-slate-500">
              <Calendar className="h-3 w-3" aria-hidden="true" />
              {checkIn} – {checkOut}
            </span>
            {reservation?.status && (
              <ReservationStatusBadge
                status={reservation.status}
                type="reservation"
                className="text-[9px]! px-1.5! py-0!"
              />
            )}
          </div>
        </div>

        {/* Amount + chevron */}
        <div className="shrink-0 text-right">
          {reservation?.totalAmount && (
            <p className="text-xs font-bold text-slate-700 dark:text-slate-200">
              {formatMoney(
                reservation.totalAmount,
                reservation.currency || "MXN",
                locale,
              )}
            </p>
          )}
          <ChevronRight className="mt-1 ml-auto h-4 w-4 text-slate-600 transition-colors group-hover:text-cyan-400" />
        </div>
      </div>

      {/* Right notch */}
      <div className="absolute -right-1.5 top-1/2 z-10 -translate-y-1/2">
        <div className="h-4 w-4 rounded-full bg-slate-100 dark:bg-slate-950" />
      </div>
    </motion.button>
  );
};

export default VoucherTicketMini;
