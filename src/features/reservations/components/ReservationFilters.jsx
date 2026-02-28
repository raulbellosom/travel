/**
 * ReservationFilters
 *
 * Desktop: filters displayed inline in a responsive grid.
 * Mobile:  search bar + "Filtros" button → opens the global Modal
 *          in full-screen bottom-sheet style with scroll lock.
 *
 * Uses the project's global Modal (src/components/common/organisms/Modal)
 * for the mobile filter sheet, ensuring:
 *   - Portal-rendered overlay above everything
 *   - Body scroll lock when open
 *   - Escape key & backdrop click to close
 *   - Proper z-index (110+)
 */
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Search, SlidersHorizontal, X } from "lucide-react";
import Modal, {
  ModalFooter,
} from "../../../components/common/organisms/Modal/Modal";
import { Select } from "../../../components/common";
import DateRangePicker from "./DateRangePicker";
import {
  FILTER_PARAMS,
  RESERVATION_STATUSES,
  PAYMENT_STATUSES,
} from "../constants";

const FIELD_CLASS =
  "min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition " +
  "focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 " +
  "dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100";

const EMPTY_ARRAY = [];
const ReservationFilters = ({
  filters,
  resources = EMPTY_ARRAY,
  canSeeAll,
  onChange,
  onReset,
  onSearchChange,
}) => {
  const { t } = useTranslation();
  const [sheetOpen, setSheetOpen] = useState(false);

  // Derived values
  const hasActiveFilters =
    filters.status ||
    filters.paymentStatus ||
    filters.resourceId ||
    filters.from ||
    filters.to;

  const activeFilterCount = [
    filters.status,
    filters.paymentStatus,
    filters.resourceId,
    filters.from,
  ].filter(Boolean).length;

  const statusOptions = [
    { value: "", label: t("appReservationsPage.filters.all") },
    ...RESERVATION_STATUSES.map((s) => ({
      value: s,
      label: t(`reservationStatus.${s}`, { defaultValue: s }),
    })),
  ];

  const paymentOptions = [
    { value: "", label: t("appReservationsPage.filters.all") },
    ...PAYMENT_STATUSES.map((s) => ({
      value: s,
      label: t(`paymentStatus.${s}`, { defaultValue: s }),
    })),
  ];

  const resourceOptions = [
    { value: "", label: "Todos los recursos" },
    ...resources.map((r) => ({ value: r.$id, label: r.title || r.$id })),
  ];

  const filterFieldsContent = (
    <div className="space-y-4">
      {/* Status */}
      <div className="block space-y-1.5 text-sm">
        <span className="font-medium text-slate-700 dark:text-slate-300">
          Estado de reserva
        </span>
        <Select
          value={filters.status}
          onChange={(v) => onChange(FILTER_PARAMS.status, v)}
          options={statusOptions}
          size="md"
        />
      </div>

      {/* Payment status */}
      <div className="block space-y-1.5 text-sm">
        <span className="font-medium text-slate-700 dark:text-slate-300">
          Estado de pago
        </span>
        <Select
          value={filters.paymentStatus}
          onChange={(v) => onChange(FILTER_PARAMS.paymentStatus, v)}
          options={paymentOptions}
          size="md"
        />
      </div>

      {/* Resource (only if canSeeAll or has >1 resource) */}
      {(canSeeAll || resources.length > 1) && (
        <div className="block space-y-1.5 text-sm">
          <span className="font-medium text-slate-700 dark:text-slate-300">
            Recurso
          </span>
          <Select
            value={filters.resourceId}
            onChange={(v) => onChange(FILTER_PARAMS.resourceId, v)}
            options={resourceOptions}
            size="md"
          />
        </div>
      )}

      {/* Date range */}
      <div className="space-y-1.5 text-sm">
        <span className="block font-medium text-slate-700 dark:text-slate-300">
          Rango de fechas
        </span>
        <DateRangePicker
          startDate={filters.from}
          endDate={filters.to}
          onChange={(from, to) => {
            onChange(FILTER_PARAMS.from, from);
            onChange(FILTER_PARAMS.to, to);
          }}
        />
      </div>
    </div>
  );

  return (
    <>
      {/* ── Search + filter toggle bar ─────────────────────────────────────── */}
      <div className="flex gap-2">
        {/* Search input */}
        <label className="relative flex-1">
          <Search
            size={15}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="search"
            defaultValue={filters.query}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={t("appReservationsPage.filters.searchPlaceholder", {
              defaultValue: "Huésped, propiedad, estado o ID",
            })}
            aria-label="Buscar reservas"
            className={`${FIELD_CLASS} pl-9`}
          />
        </label>

        {/* Mobile: filter modal toggle */}
        <button
          type="button"
          onClick={() => setSheetOpen(true)}
          aria-label="Abrir filtros"
          className={`relative flex h-11 min-w-11 items-center gap-2 rounded-lg border px-3 text-sm font-medium transition md:hidden
            ${
              hasActiveFilters
                ? "border-cyan-500 bg-cyan-600 text-white"
                : "border-slate-300 bg-white text-slate-600 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300"
            }`}
        >
          <SlidersHorizontal size={16} />
          <span className="hidden sm:inline">Filtros</span>
          {hasActiveFilters && (
            <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-cyan-400 text-[9px] font-bold text-white">
              {activeFilterCount}
            </span>
          )}
        </button>

        {/* Desktop: reset button */}
        {hasActiveFilters && (
          <button
            type="button"
            onClick={onReset}
            aria-label="Limpiar filtros"
            className="hidden h-11 items-center gap-1.5 rounded-lg border border-slate-200 px-3 text-sm text-slate-500 transition
              [@media(hover:hover)]:hover:border-slate-300 [@media(hover:hover)]:hover:text-slate-700
              dark:border-slate-700 dark:text-slate-400 dark:[@media(hover:hover)]:hover:text-slate-200 md:flex"
          >
            <X size={14} /> Limpiar
          </button>
        )}
      </div>

      {/* ── Desktop inline filters ─────────────────────────────────────────── */}
      <div className="hidden md:block">
        <div className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900 md:grid-cols-2 xl:grid-cols-4">
          <div>
            <p className="mb-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
              Estado
            </p>
            <Select
              value={filters.status}
              onChange={(v) => onChange(FILTER_PARAMS.status, v)}
              options={statusOptions}
              size="md"
            />
          </div>
          <div>
            <p className="mb-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
              Pago
            </p>
            <Select
              value={filters.paymentStatus}
              onChange={(v) => onChange(FILTER_PARAMS.paymentStatus, v)}
              options={paymentOptions}
              size="md"
            />
          </div>
          {(canSeeAll || resources.length > 1) && (
            <div>
              <p className="mb-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
                Recurso
              </p>
              <Select
                value={filters.resourceId}
                onChange={(v) => onChange(FILTER_PARAMS.resourceId, v)}
                options={resourceOptions}
                size="md"
              />
            </div>
          )}
          <div
            className={
              canSeeAll || resources.length > 1
                ? ""
                : "md:col-span-2 xl:col-span-2"
            }
          >
            <p className="mb-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
              Rango de fechas
            </p>
            <DateRangePicker
              startDate={filters.from}
              endDate={filters.to}
              onChange={(from, to) => {
                onChange(FILTER_PARAMS.from, from);
                onChange(FILTER_PARAMS.to, to);
              }}
            />
          </div>
        </div>
      </div>

      {/* ── Mobile filter modal (global Modal) ─────────────────────────────── */}
      <Modal
        isOpen={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title="Filtros de reservas"
        size="md"
        closeOnEscape
        closeOnBackdrop
        showCloseButton
        footer={
          <ModalFooter>
            <button
              type="button"
              onClick={() => {
                onReset();
                setSheetOpen(false);
              }}
              className="flex-1 rounded-xl border border-slate-200 py-3 text-sm font-semibold text-slate-600 transition
                [@media(hover:hover)]:hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300"
            >
              Limpiar todo
            </button>
            <button
              type="button"
              onClick={() => setSheetOpen(false)}
              className="flex-1 rounded-xl bg-cyan-600 py-3 text-sm font-semibold text-white transition
                [@media(hover:hover)]:hover:bg-cyan-500 active:scale-[0.98]"
            >
              Aplicar
            </button>
          </ModalFooter>
        }
      >
        {filterFieldsContent}
      </Modal>
    </>
  );
};

export default ReservationFilters;
