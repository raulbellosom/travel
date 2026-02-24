/**
 * ReservationCard – redesigned mobile-first card with:
 *  • Better visual hierarchy, spacing, and typography
 *  • Status-validated swipe actions
 *  • Status-validated context menu via shared ReservationActionsMenu
 *  • Consistent icons and layout
 */
import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  CalendarDays,
  CheckCircle,
  CreditCard,
  User,
  Phone,
  Mail,
  Hash,
  X,
  Moon,
} from "lucide-react";
import { ReservationStatusBadge } from "./ReservationStatusBadge";
import ReservationActionsMenu from "./ReservationActionsMenu";
import { formatScheduleLabel, formatMoney, calcNights } from "../utils";
import {
  canConfirmReservation,
  canMarkPaidReservation,
  canCancelReservation,
} from "../actions";
import { canWriteReservations } from "../rbac";
import { useAuth } from "../../../hooks/useAuth";

const SWIPE_THRESHOLD = 60;
const ACTION_WIDTH = 180;

/**
 * ReservationCard
 *
 * Swipe RIGHT → Confirm / Mark Paid  (only if valid for current status)
 * Swipe LEFT  → Cancel               (only if valid for current status)
 * ⋮ button    → Full actions menu     (status-validated via getReservationActions)
 */
const ReservationCard = ({
  reservation,
  resourceMap = {},
  locale,
  busyId,
  onConfirm,
  onMarkPaid,
  onCancel,
  onComplete,
  isFocused = false,
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [swipeX, setSwipeX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const touchStartX = useRef(null);
  const touchStartY = useRef(null);

  const isBusy = busyId === reservation.$id;
  const canWrite = canWriteReservations(user);

  const status = reservation.status || "";
  const canConfirm = canWrite && canConfirmReservation(status);
  const canMarkPaid =
    canWrite && canMarkPaidReservation(status, reservation.paymentStatus);
  const canCancel = canWrite && canCancelReservation(status);

  // Determine if swipe panels should be available
  const hasRightActions = canConfirm || canMarkPaid;
  const hasLeftActions = canCancel;

  const resourceTitle =
    resourceMap[reservation.resourceId || reservation.propertyId]?.title ||
    reservation.resourceId ||
    "—";

  const scheduleLabel = formatScheduleLabel(reservation, locale);
  const nights = calcNights(
    reservation.checkInDate || reservation.startDateTime,
    reservation.checkOutDate || reservation.endDateTime,
  );

  // ── Swipe handlers ────────────────────────────────────────────────────────
  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e) => {
    if (touchStartX.current === null) return;
    const dx = e.touches[0].clientX - touchStartX.current;
    const dy = e.touches[0].clientY - touchStartY.current;

    if (Math.abs(dy) > Math.abs(dx)) return;

    e.preventDefault();
    setIsDragging(true);

    const maxRight = hasRightActions ? ACTION_WIDTH : 0;
    const maxLeft = hasLeftActions ? ACTION_WIDTH : 0;
    const clamped = Math.max(-maxLeft, Math.min(maxRight, dx));
    setSwipeX(clamped);
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    touchStartX.current = null;
    touchStartY.current = null;

    if (swipeX > SWIPE_THRESHOLD && hasRightActions) {
      setSwipeX(ACTION_WIDTH);
    } else if (swipeX < -SWIPE_THRESHOLD && hasLeftActions) {
      setSwipeX(-ACTION_WIDTH);
    } else {
      setSwipeX(0);
    }
  };

  const closeSwipe = () => setSwipeX(0);

  const handleConfirm = () => {
    closeSwipe();
    onConfirm?.(reservation.$id);
  };
  const handleMarkPaid = () => {
    closeSwipe();
    onMarkPaid?.(reservation.$id);
  };
  const handleCancel = () => {
    closeSwipe();
    onCancel?.(reservation.$id);
  };

  const handleCardClick = (e) => {
    if (isDragging || Math.abs(swipeX) > 10) {
      closeSwipe();
      return;
    }
    navigate(`/app/reservations/${reservation.$id}`);
  };

  return (
    <div
      id={`reservation-${reservation.$id}`}
      className={`group relative overflow-hidden rounded-2xl border transition-all duration-200
        ${
          isFocused
            ? "border-cyan-400 dark:border-cyan-500 shadow-lg shadow-cyan-500/10 ring-1 ring-cyan-400/30"
            : "border-slate-200/80 dark:border-slate-700/80"
        }
        bg-white dark:bg-slate-900`}
    >
      {/* ── Right-side actions (swipe right) — status validated ── */}
      {hasRightActions && (
        <div className="absolute inset-y-0 left-0 flex w-45 items-stretch">
          {canConfirm && (
            <button
              onClick={handleConfirm}
              disabled={isBusy}
              aria-label={t("appReservationsPage.actions.markConfirmed")}
              className="flex flex-1 flex-col items-center justify-center gap-1.5 bg-cyan-600 px-3 text-xs font-semibold text-white transition active:bg-cyan-700 disabled:opacity-50"
            >
              <CheckCircle size={20} />
              <span className="leading-tight">
                {t("appReservationsPage.actions.markConfirmed")}
              </span>
            </button>
          )}
          {canMarkPaid && (
            <button
              onClick={handleMarkPaid}
              disabled={isBusy}
              aria-label={t("appReservationsPage.actions.markCompleted")}
              className="flex flex-1 flex-col items-center justify-center gap-1.5 bg-emerald-600 px-3 text-xs font-semibold text-white transition active:bg-emerald-700 disabled:opacity-50"
            >
              <CreditCard size={20} />
              <span className="leading-tight">
                {t("appReservationsPage.actions.markCompleted")}
              </span>
            </button>
          )}
        </div>
      )}

      {/* ── Left-side danger actions (swipe left) — status validated ── */}
      {hasLeftActions && (
        <div className="absolute inset-y-0 right-0 flex w-45 items-stretch">
          <button
            onClick={handleCancel}
            disabled={isBusy}
            aria-label={t("appReservationsPage.actions.cancel")}
            className="flex flex-1 flex-col items-center justify-center gap-1.5 bg-rose-600 px-3 text-xs font-semibold text-white transition active:bg-rose-700 disabled:opacity-50"
          >
            <X size={20} />
            <span className="leading-tight">
              {t("appReservationsPage.actions.cancel")}
            </span>
          </button>
        </div>
      )}

      {/* ── Draggable card face ── CSS transform instead of framer-motion for perf */}
      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={handleCardClick}
        role="article"
        tabIndex={0}
        onKeyDown={(e) =>
          (e.key === "Enter" || e.key === " ") && handleCardClick(e)
        }
        aria-label={`${t("appReservationsPage.title")} ${reservation.$id}`}
        className="relative z-10 cursor-pointer select-none bg-white dark:bg-slate-900 focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2 rounded-t-xl"
        style={{
          touchAction: "pan-y",
          transform: `translateX(${swipeX}px)`,
          transition: isDragging
            ? "none"
            : "transform 0.25s cubic-bezier(0.25,1,0.5,1)",
          willChange: swipeX !== 0 ? "transform" : "auto",
        }}
      >
        {/* ── Top section: resource + badges + menu ─── */}
        <div className="flex items-start gap-3 px-4 pt-4 pb-3">
          <div className="min-w-0 flex-1">
            {/* Resource title */}
            <h3 className="truncate text-sm font-semibold text-slate-900 dark:text-slate-50 leading-tight">
              {resourceTitle}
            </h3>
            {/* Status badges */}
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
              <ReservationStatusBadge
                status={reservation.status}
                type="reservation"
              />
              <ReservationStatusBadge
                status={reservation.paymentStatus}
                type="payment"
              />
            </div>
          </div>

          {/* Actions menu (⋮) — portal-based, status validated */}
          <div onClick={(e) => e.stopPropagation()}>
            <ReservationActionsMenu
              reservation={reservation}
              busyId={busyId}
              onConfirm={onConfirm}
              onMarkPaid={onMarkPaid}
              onComplete={onComplete}
              onCancel={onCancel}
              compact
            />
          </div>
        </div>

        {/* ── Info grid ─── */}
        <div className="px-4 pb-3">
          <dl className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
            {/* Guest */}
            {reservation.guestName && (
              <div className="flex items-center gap-2.5 text-slate-700 dark:text-slate-200">
                <User
                  size={14}
                  className="shrink-0 text-slate-400 dark:text-slate-500"
                />
                <span className="truncate font-medium">
                  {reservation.guestName}
                </span>
              </div>
            )}
            {/* Phone */}
            {reservation.guestPhone && (
              <div className="flex items-center gap-2.5 text-slate-600 dark:text-slate-300">
                <Phone
                  size={14}
                  className="shrink-0 text-slate-400 dark:text-slate-500"
                />
                <span className="truncate">{reservation.guestPhone}</span>
              </div>
            )}
            {/* Email */}
            {reservation.guestEmail && (
              <div className="flex items-center gap-2.5 text-slate-600 dark:text-slate-300 sm:col-span-2">
                <Mail
                  size={14}
                  className="shrink-0 text-slate-400 dark:text-slate-500"
                />
                <span className="truncate">{reservation.guestEmail}</span>
              </div>
            )}
            {/* Dates + nights */}
            <div className="flex items-center gap-2.5 text-slate-600 dark:text-slate-300 sm:col-span-2">
              <CalendarDays
                size={14}
                className="shrink-0 text-slate-400 dark:text-slate-500"
              />
              <span>{scheduleLabel}</span>
              {nights > 0 && (
                <span className="ml-auto flex items-center gap-1 rounded-md bg-slate-100 px-1.5 py-0.5 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                  <Moon size={10} />
                  {nights} {nights === 1 ? "noche" : "noches"}
                </span>
              )}
            </div>
          </dl>
        </div>

        {/* ── Bottom: ID + amount ─── */}
        <div className="flex items-center justify-between gap-3 border-t border-slate-100 px-4 py-3 dark:border-slate-800">
          <span className="flex items-center gap-1.5 text-xs text-slate-400">
            <Hash size={11} />
            {reservation.$id.slice(-8)}
          </span>
          <span className="text-sm font-bold tabular-nums text-slate-900 dark:text-slate-50">
            {formatMoney(
              reservation.totalAmount,
              reservation.currency || "MXN",
              locale,
            )}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ReservationCard;
