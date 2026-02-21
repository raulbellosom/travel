import { useTranslation } from "react-i18next";
import { ChevronDown, ChevronUp } from "lucide-react";

/**
 * ResourceTableHeader
 *
 * Table header row for the resource listing.
 * Sortable columns show direction indicators and respond to clicks.
 *
 * @param {string}   sortKey       - Currently active sort column key
 * @param {string}   sortDirection - "asc" | "desc"
 * @param {Function} onSort        - Callback(columnKey) to toggle sort
 */
const ResourceTableHeader = ({ sortKey, sortDirection, onSort }) => {
  const { t } = useTranslation();
  const ns = "myResourcesPage.table";

  const columns = [
    { key: "image", label: t(`${ns}.image`), width: "w-24" },
    { key: "title", label: t(`${ns}.title`), minWidth: "min-w-[200px]" },
    { key: "location", label: t(`${ns}.location`), minWidth: "min-w-[140px]" },
    {
      key: "resourceType",
      label: t(`${ns}.resourceType`),
      minWidth: "min-w-[130px]",
      sortable: true,
    },
    {
      key: "commercialMode",
      label: t(`${ns}.commercialMode`),
      minWidth: "min-w-[110px]",
    },
    { key: "details", label: t(`${ns}.details`), minWidth: "min-w-[120px]" },
    {
      key: "responsible",
      label: t(`${ns}.responsible`),
      minWidth: "min-w-[180px]",
    },
    {
      key: "status",
      label: t(`${ns}.status`),
      minWidth: "min-w-[160px]",
      sortable: true,
    },
    {
      key: "featured",
      label: t(`${ns}.featured`),
      minWidth: "min-w-[90px]",
      sortable: true,
    },
    {
      key: "metrics",
      label: t(`${ns}.metrics`),
      minWidth: "min-w-[120px]",
      sortable: true,
    },
    {
      key: "price",
      label: t(`${ns}.price`),
      minWidth: "min-w-[120px]",
      sortable: true,
    },
    {
      key: "updatedAt",
      label: t(`${ns}.updatedAt`),
      minWidth: "min-w-[110px]",
      sortable: true,
    },
    { key: "actions", label: t(`${ns}.actions`), minWidth: "min-w-[80px]" },
  ];

  return (
    <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-800 dark:text-slate-300">
      <tr>
        {columns.map((col) => {
          const isSortable = col.sortable && onSort;
          const isActive = sortKey === col.key;

          return (
            <th
              key={col.key}
              className={`px-4 py-3 ${col.width || ""} ${col.minWidth || ""} ${
                isSortable
                  ? "cursor-pointer select-none transition-colors hover:text-slate-700 dark:hover:text-slate-100"
                  : ""
              } ${isActive ? "text-slate-700 dark:text-slate-100" : ""}`}
              onClick={isSortable ? () => onSort(col.key) : undefined}
            >
              <span
                className={`inline-flex items-center gap-1 ${isSortable ? "group" : ""}`}
              >
                {col.label}
                {isSortable && isActive ? (
                  sortDirection === "asc" ? (
                    <ChevronUp size={14} className="shrink-0" />
                  ) : (
                    <ChevronDown size={14} className="shrink-0" />
                  )
                ) : null}
                {isSortable && !isActive ? (
                  <ChevronDown
                    size={14}
                    className="shrink-0 text-slate-300 opacity-0 transition-opacity group-hover:opacity-100 dark:text-slate-600"
                  />
                ) : null}
              </span>
            </th>
          );
        })}
      </tr>
    </thead>
  );
};

export default ResourceTableHeader;
