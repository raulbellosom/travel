import { useTranslation } from "react-i18next";
import { Filter, X } from "lucide-react";
import { useState } from "react";

const RESERVATION_STATUSES = [
  "pending",
  "confirmed",
  "completed",
  "cancelled",
  "expired",
];

const PAYMENT_STATUSES = ["unpaid", "pending", "paid", "failed", "refunded"];

/**
 * CalendarFilters – filter panel for admin calendar.
 * Collapsible on mobile, inline on desktop.
 *
 * @param {Object} props
 * @param {Object} props.filters - { propertyId, status, paymentStatus }
 * @param {Function} props.onFiltersChange
 * @param {Array} props.properties - [{ $id, title }] for property filter
 */
export default function CalendarFilters({
  filters = {},
  onFiltersChange,
  properties = [],
}) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);

  const update = (key, value) => {
    onFiltersChange?.({ ...filters, [key]: value });
  };

  const clearAll = () => {
    onFiltersChange?.({ propertyId: "", status: "", paymentStatus: "" });
  };

  const hasActiveFilters =
    filters.propertyId || filters.status || filters.paymentStatus;

  const FilterContent = () => (
    <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
      {/* Property filter */}
      <div className="flex-1 min-w-0">
        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
          {t("calendar.filters.property")}
        </label>
        <select
          value={filters.propertyId || ""}
          onChange={(e) => update("propertyId", e.target.value)}
          className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-11"
        >
          <option value="">{t("calendar.filters.allProperties")}</option>
          {properties.map((p) => (
            <option key={p.$id} value={p.$id}>
              {p.title}
            </option>
          ))}
        </select>
      </div>

      {/* Status filter */}
      <div className="flex-1 min-w-0">
        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
          {t("calendar.filters.status")}
        </label>
        <select
          value={filters.status || ""}
          onChange={(e) => update("status", e.target.value)}
          className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-11"
        >
          <option value="">{t("calendar.filters.allStatuses")}</option>
          {RESERVATION_STATUSES.map((s) => (
            <option key={s} value={s}>
              {t(`calendar.status.${s}`)}
            </option>
          ))}
        </select>
      </div>

      {/* Payment status filter */}
      <div className="flex-1 min-w-0">
        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
          {t("calendar.filters.paymentStatus")}
        </label>
        <select
          value={filters.paymentStatus || ""}
          onChange={(e) => update("paymentStatus", e.target.value)}
          className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-11"
        >
          <option value="">{t("calendar.filters.allPaymentStatuses")}</option>
          {PAYMENT_STATUSES.map((s) => (
            <option key={s} value={s}>
              {t(`calendar.paymentStatus.${s}`)}
            </option>
          ))}
        </select>
      </div>

      {/* Clear button */}
      {hasActiveFilters && (
        <button
          type="button"
          onClick={clearAll}
          className="flex items-center gap-1.5 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors min-h-11"
        >
          <X className="w-4 h-4" />
          {t("calendar.filters.clear")}
        </button>
      )}
    </div>
  );

  return (
    <div>
      {/* Mobile: toggle button */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className={[
          "sm:hidden flex items-center gap-2 px-3 py-2 text-sm rounded-lg border transition-colors min-h-11",
          hasActiveFilters
            ? "border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
            : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300",
        ].join(" ")}
      >
        <Filter className="w-4 h-4" />
        {t("calendar.filters.title")}
        {hasActiveFilters && (
          <span className="ml-1 px-1.5 py-0.5 bg-blue-600 text-white text-[10px] rounded-full font-bold">
            {
              [
                filters.propertyId,
                filters.status,
                filters.paymentStatus,
              ].filter(Boolean).length
            }
          </span>
        )}
      </button>

      {/* Mobile: collapsible */}
      {expanded && (
        <div className="mt-3 sm:hidden">
          <FilterContent />
        </div>
      )}

      {/* Desktop: always visible */}
      <div className="hidden sm:block">
        <FilterContent />
      </div>
    </div>
  );
}
