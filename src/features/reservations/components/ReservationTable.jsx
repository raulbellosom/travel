/**
 * ReservationTable – desktop data table with unified action menu.
 *
 * Uses the shared ReservationActionsMenu for consistent, status-validated actions.
 */
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ChevronDown, ChevronUp, ChevronsUpDown } from "lucide-react";
import { ReservationStatusBadge } from "./ReservationStatusBadge";
import ReservationActionsMenu from "./ReservationActionsMenu";
import { formatScheduleLabel, formatMoney } from "../utils";

/** Sort indicator icon helper */
const SortIcon = ({ column, sortKey, sortDir }) => {
  if (sortKey !== column)
    return <ChevronsUpDown size={12} className="ml-1 inline opacity-40" />;
  return sortDir === "asc" ? (
    <ChevronUp size={12} className="ml-1 inline text-cyan-600" />
  ) : (
    <ChevronDown size={12} className="ml-1 inline text-cyan-600" />
  );
};

/**
 * ReservationTable
 */
const ReservationTable = ({
  reservations = [],
  resourceMap = {},
  locale,
  busyId,
  focusId,
  onConfirm,
  onMarkPaid,
  onCancel,
  onComplete,
  sortKey = "checkIn",
  sortDir = "desc",
  onSort,
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const th = (label, col, className = "") => (
    <th
      className={`cursor-pointer select-none px-4 py-3 transition-colors
        [@media(hover:hover)]:hover:text-slate-900 dark:[@media(hover:hover)]:hover:text-slate-100
        ${className}`}
      onClick={() => onSort?.(col)}
    >
      {label}
      <SortIcon column={col} sortKey={sortKey} sortDir={sortDir} />
    </th>
  );

  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full min-w-175 text-sm">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
            {th("Recurso / Huésped", "guestName")}
            {th("Fechas", "checkIn")}
            {th("Estado", "status")}
            {th("Pago", "paymentStatus")}
            {th("Monto", "amount", "text-right")}
            <th className="px-4 py-3 text-right">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {reservations.map((r) => {
            const resourceTitle =
              resourceMap[r.resourceId || r.propertyId]?.title ||
              r.resourceId ||
              "—";
            const isFocused = Boolean(focusId) && r.$id === focusId;

            return (
              <tr
                key={r.$id}
                id={`reservation-${r.$id}`}
                onClick={() => navigate(`/app/reservations/${r.$id}`)}
                tabIndex={0}
                onKeyDown={(e) =>
                  e.key === "Enter" && navigate(`/app/reservations/${r.$id}`)
                }
                className={`cursor-pointer border-b border-slate-100 transition-colors last:border-0
                  [@media(hover:hover)]:hover:bg-slate-50 dark:border-slate-800
                  [@media(hover:hover)]:dark:hover:bg-slate-800/60
                  ${isFocused ? "bg-cyan-50/60 dark:bg-cyan-900/10" : "bg-white dark:bg-slate-900"}`}
              >
                <td className="px-4 py-3">
                  <p className="font-medium text-slate-900 dark:text-slate-100">
                    {resourceTitle}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {r.guestName || "—"}
                  </p>
                </td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                  {formatScheduleLabel(r, locale)}
                </td>
                <td className="px-4 py-3">
                  <ReservationStatusBadge
                    status={r.status}
                    type="reservation"
                  />
                </td>
                <td className="px-4 py-3">
                  <ReservationStatusBadge
                    status={r.paymentStatus}
                    type="payment"
                  />
                </td>
                <td className="px-4 py-3 text-right font-semibold text-slate-900 dark:text-slate-100">
                  {formatMoney(r.totalAmount, r.currency || "MXN", locale)}
                </td>
                <td
                  className="px-4 py-3 text-right"
                  onClick={(e) => e.stopPropagation()}
                >
                  <ReservationActionsMenu
                    reservation={r}
                    busyId={busyId}
                    onConfirm={onConfirm}
                    onMarkPaid={onMarkPaid}
                    onComplete={onComplete}
                    onCancel={onCancel}
                    compact
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default ReservationTable;
