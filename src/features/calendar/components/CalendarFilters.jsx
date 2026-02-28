import { useTranslation } from "react-i18next";
import {
  Search,
  X,
  Building2,
  Wrench,
  Music,
  Car,
  Compass,
  Landmark,
  SlidersHorizontal,
  ChevronDown,
} from "lucide-react";
import { useState, useMemo, useRef, useCallback } from "react";
import { Combobox } from "../../../components/common";
import {
  getResourceTypeLabel,
  getCommercialModeLabel,
} from "../../../utils/resourceLabels";

const RESERVATION_STATUSES = [
  "pending",
  "confirmed",
  "completed",
  "cancelled",
  "expired",
];

const PAYMENT_STATUSES = ["unpaid", "pending", "paid", "failed", "refunded"];

const RESOURCE_TYPES = [
  "property",
  "service",
  "music",
  "vehicle",
  "experience",
  "venue",
];

const RESOURCE_TYPE_ICONS = {
  property: Building2,
  service: Wrench,
  music: Music,
  vehicle: Car,
  experience: Compass,
  venue: Landmark,
};

const COMMERCIAL_MODES = [
  "sale",
  "rent_long_term",
  "rent_short_term",
  "rent_hourly",
];

/* ── Chip toggle component ───────────────────────────────────── */
const FilterChip = ({ active, label, icon: Icon, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={[
      "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all whitespace-nowrap",
      "focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
      active
        ? "bg-blue-600 text-white border-blue-600 dark:bg-blue-500 dark:border-blue-500 shadow-sm"
        : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 hover:text-blue-600 dark:hover:text-blue-400",
    ].join(" ")}
  >
    {Icon && <Icon className="w-3.5 h-3.5" />}
    {label}
  </button>
);

/* ── Inline dropdown chip for secondary filters ──────────────── */
const DropdownChip = ({ label, value, options, onChange, t }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const selectedLabel = options.find((o) => o.value === value)?.label || label;
  const isActive = !!value;

  const handleBlur = useCallback(() => {
    setTimeout(() => {
      if (ref.current && !ref.current.contains(document.activeElement)) {
        setOpen(false);
      }
    }, 0);
  }, []);

  return (
    <div className="relative" ref={ref} onBlur={handleBlur}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={[
          "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all whitespace-nowrap",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
          isActive
            ? "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700"
            : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600",
        ].join(" ")}
      >
        <span className="text-gray-400 dark:text-gray-500">{label}:</span>
        <span className="font-semibold truncate max-w-24">
          {isActive ? selectedLabel : t("calendar.filters.all")}
        </span>
        <ChevronDown
          className={`w-3 h-3 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 z-50 min-w-40 max-h-56 overflow-y-auto rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-lg py-1">
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                onChange(opt.value);
                setOpen(false);
              }}
              className={[
                "w-full text-left px-3 py-2 text-xs transition-colors",
                opt.value === value
                  ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 font-semibold"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800",
              ].join(" ")}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

/**
 * CalendarFilters – modern filter bar for admin calendar.
 * Searchable combobox for resource selection + chip toggles for resource type
 * + inline dropdown chips for secondary filters.
 *
 * @param {Object} props
 * @param {Object} props.filters - { resourceId, resourceType, commercialMode, status, paymentStatus }
 * @param {Function} props.onFiltersChange
 * @param {Array} props.resources - [{ $id, title, resourceType, commercialMode }]
 */
const EMPTY_ARRAY = [];
const EMPTY_OBJECT = {};
export default function CalendarFilters({
  filters = EMPTY_OBJECT,
  onFiltersChange,
  resources = EMPTY_ARRAY,
}) {
  const { t } = useTranslation();
  const [showSecondary, setShowSecondary] = useState(false);

  const update = useCallback(
    (key, value) => {
      onFiltersChange?.({ ...filters, [key]: value });
    },
    [filters, onFiltersChange],
  );

  const clearAll = useCallback(() => {
    onFiltersChange?.({
      resourceId: "",
      resourceType: "",
      commercialMode: "",
      status: "",
      paymentStatus: "",
    });
  }, [onFiltersChange]);

  const hasActiveFilters =
    filters.resourceId ||
    filters.resourceType ||
    filters.commercialMode ||
    filters.status ||
    filters.paymentStatus;

  const activeFilterCount = [
    filters.resourceId,
    filters.resourceType,
    filters.commercialMode,
    filters.status,
    filters.paymentStatus,
  ].filter(Boolean).length;

  // ── Combobox options for resource search ───────────────────────
  const resourceComboOptions = useMemo(
    () =>
      resources.map((r) => ({
        value: r.$id,
        label: r.title,
        searchText: `${r.title} ${getResourceTypeLabel(r.resourceType, t)} ${r.city || ""}`,
      })),
    [resources, t],
  );

  // ── Secondary filter options ──────────────────────────────────
  const commercialModeOptions = useMemo(
    () => [
      { value: "", label: t("calendar.filters.allCommercialModes") },
      ...COMMERCIAL_MODES.map((mode) => ({
        value: mode,
        label: getCommercialModeLabel(mode, t),
      })),
    ],
    [t],
  );

  const reservationStatusOptions = useMemo(
    () => [
      { value: "", label: t("calendar.filters.allStatuses") },
      ...RESERVATION_STATUSES.map((status) => ({
        value: status,
        label: t(`calendar.status.${status}`),
      })),
    ],
    [t],
  );

  const paymentStatusOptions = useMemo(
    () => [
      { value: "", label: t("calendar.filters.allPaymentStatuses") },
      ...PAYMENT_STATUSES.map((status) => ({
        value: status,
        label: t(`calendar.paymentStatus.${status}`),
      })),
    ],
    [t],
  );

  const hasSecondaryFilters =
    filters.commercialMode || filters.status || filters.paymentStatus;

  return (
    <div className="space-y-2.5">
      {/* ── Row 1: Resource search + more-filters toggle ───────── */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none z-10" />
          <Combobox
            value={filters.resourceId || ""}
            onChange={(val) => update("resourceId", val)}
            options={resourceComboOptions}
            placeholder={t("calendar.filters.searchResource")}
            noResultsText={t("calendar.filters.noResourcesFound")}
            inputClassName="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
          />
        </div>

        {/* Toggle secondary filters */}
        <button
          type="button"
          onClick={() => setShowSecondary((v) => !v)}
          className={[
            "inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-medium transition-all shrink-0",
            hasSecondaryFilters || showSecondary
              ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700"
              : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-gray-300",
          ].join(" ")}
          title={t("calendar.filters.moreFilters")}
        >
          <SlidersHorizontal className="w-4 h-4" />
          <span className="hidden sm:inline">
            {t("calendar.filters.moreFilters")}
          </span>
          {activeFilterCount > 0 && (
            <span className="ml-0.5 px-1.5 py-0.5 bg-blue-600 text-white text-[10px] rounded-full font-bold leading-none">
              {activeFilterCount}
            </span>
          )}
        </button>

        {/* Clear all */}
        {hasActiveFilters && (
          <button
            type="button"
            onClick={clearAll}
            className="inline-flex items-center gap-1 px-2.5 py-2 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors shrink-0"
            title={t("calendar.filters.clear")}
          >
            <X className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">
              {t("calendar.filters.clear")}
            </span>
          </button>
        )}
      </div>

      {/* ── Row 2: Resource type chips (always visible) ────────── */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-hide -mx-1 px-1">
        <FilterChip
          active={!filters.resourceType}
          label={t("calendar.filters.allResourceTypes")}
          onClick={() => update("resourceType", "")}
        />
        {RESOURCE_TYPES.map((type) => (
          <FilterChip
            key={type}
            active={filters.resourceType === type}
            label={getResourceTypeLabel(type, t)}
            icon={RESOURCE_TYPE_ICONS[type]}
            onClick={() =>
              update("resourceType", filters.resourceType === type ? "" : type)
            }
          />
        ))}
      </div>

      {/* ── Row 3: Secondary filters (collapsible) ─────────────── */}
      {(showSecondary || hasSecondaryFilters) && (
        <div className="flex items-center gap-2 flex-wrap">
          <DropdownChip
            label={t("calendar.filters.commercialMode")}
            value={filters.commercialMode || ""}
            options={commercialModeOptions}
            onChange={(val) => update("commercialMode", val)}
            t={t}
          />
          <DropdownChip
            label={t("calendar.filters.status")}
            value={filters.status || ""}
            options={reservationStatusOptions}
            onChange={(val) => update("status", val)}
            t={t}
          />
          <DropdownChip
            label={t("calendar.filters.paymentStatus")}
            value={filters.paymentStatus || ""}
            options={paymentStatusOptions}
            onChange={(val) => update("paymentStatus", val)}
            t={t}
          />
        </div>
      )}
    </div>
  );
}
