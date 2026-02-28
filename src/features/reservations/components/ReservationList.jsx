/**
 * ReservationList – responsive wrapper with table/cards toggle.
 *
 * Supports three strategies:
 *   • "auto"  – CSS breakpoint: cards on mobile, table on desktop (default)
 *   • "cards" – always render cards
 *   • "table" – always render table
 *
 * The active view is controlled by the `view` prop (from URL param).
 */
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { CalendarDays, LayoutGrid, Table2 } from "lucide-react";
import ReservationCard from "./ReservationCard";
import ReservationTable from "./ReservationTable";
import EmptyStatePanel from "../../../components/common/organisms/EmptyStatePanel";
import SkeletonLoader from "../../../components/common/molecules/SkeletonLoader";
import TablePagination from "../../../components/common/molecules/TablePagination";

/** View toggle button group */
const ViewToggle = ({ view, onViewChange }) => {
  const options = [
    { key: "auto", label: "Auto", icon: null },
    { key: "cards", label: "Cards", icon: LayoutGrid },
    { key: "table", label: "Tabla", icon: Table2 },
  ];

  return (
    <div
      className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5 dark:border-slate-700 dark:bg-slate-800"
      role="radiogroup"
      aria-label="Vista de listado"
    >
      {options.map(({ key, label, icon: Icon }) => {
        const active = view === key;
        return (
          <button
            key={key}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={`Vista: ${label}`}
            onClick={() => onViewChange(key)}
            className={`flex items-center gap-1.5 rounded-md px-3 py-2 text-xs font-medium transition
              ${
                active
                  ? "bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-slate-100"
                  : "text-slate-500 [@media(hover:hover)]:hover:text-slate-700 dark:text-slate-400 dark:[@media(hover:hover)]:hover:text-slate-200"
              }`}
          >
            {Icon && <Icon size={13} />}
            <span className="hidden sm:inline">{label}</span>
            {!Icon && (
              <span className="sm:hidden" aria-hidden="true">
                {label.charAt(0)}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};

/**
 * ReservationList
 */
const EMPTY_ARRAY = [];
const EMPTY_OBJECT = {};
const ReservationList = ({
  reservations = EMPTY_ARRAY,
  resourceMap = EMPTY_OBJECT,
  locale,
  loading,
  page,
  totalPages,
  totalCount = 0,
  pageSize = 20,
  busyId,
  focusId,
  onConfirm,
  onMarkPaid,
  onCancel,
  onComplete,
  onPageChange,
  onPageSizeChange,
  sortKey = "checkIn",
  sortDir = "desc",
  onSort,
  view = "auto",
  onViewChange,
}) => {
  const { t } = useTranslation();

  // Detect viewport for "auto" mode so we only render ONE view, not both
  const [isDesktop, setIsDesktop] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(min-width: 768px)").matches,
  );
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const handler = (e) => setIsDesktop(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  if (loading) return <SkeletonLoader className="py-2" />;

  if (reservations.length === 0) {
    return (
      <EmptyStatePanel
        icon={CalendarDays}
        title={t("appReservationsPage.empty")}
        description={t("appReservationsPage.subtitle")}
        compact
      />
    );
  }

  const resolvedView = view === "auto" ? (isDesktop ? "table" : "cards") : view;

  const sharedProps = {
    reservations,
    resourceMap,
    locale,
    busyId,
    focusId,
    onConfirm,
    onMarkPaid,
    onCancel,
    onComplete,
    sortKey,
    sortDir,
    onSort,
  };

  const pagination = (
    <TablePagination
      page={page}
      totalPages={totalPages}
      totalItems={totalCount}
      pageSize={pageSize}
      onPageChange={onPageChange}
      onPageSizeChange={onPageSizeChange}
    />
  );

  const cardsView = (
    <div className="space-y-3">
      <div className="grid gap-3">
        {reservations.map((r) => (
          <ReservationCard
            key={r.$id}
            reservation={r}
            resourceMap={resourceMap}
            locale={locale}
            busyId={busyId}
            onConfirm={onConfirm}
            onMarkPaid={onMarkPaid}
            onCancel={onCancel}
            onComplete={onComplete}
            isFocused={Boolean(focusId) && r.$id === focusId}
          />
        ))}
      </div>
      <div className="rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
        {pagination}
      </div>
    </div>
  );

  const tableView = (
    <div className="min-w-0 rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
      <ReservationTable {...sharedProps} />
      {pagination}
    </div>
  );

  return (
    <div className="space-y-3">
      {/* View toggle */}
      {onViewChange && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {totalCount} {totalCount === 1 ? "reserva" : "reservas"}
          </p>
          <ViewToggle view={view} onViewChange={onViewChange} />
        </div>
      )}

      {/* Content based on view mode — single render path */}
      {resolvedView === "cards" ? cardsView : tableView}
    </div>
  );
};

export default ReservationList;
