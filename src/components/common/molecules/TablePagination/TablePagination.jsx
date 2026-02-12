import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import Select from "../../atoms/Select";

const DEFAULT_PAGE_SIZE_OPTIONS = [5, 10, 20, 50];

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const TablePagination = ({
  page = 1,
  totalPages = 1,
  totalItems = 0,
  pageSize = 5,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = DEFAULT_PAGE_SIZE_OPTIONS,
  className = "",
}) => {
  const { t, i18n } = useTranslation();
  const language = String(i18n.resolvedLanguage || i18n.language || "").toLowerCase();
  const isSpanish = language.startsWith("es");

  const labels = isSpanish
    ? {
        resultsPerPage: "Resultados por pagina",
        pageOf: "Pagina {{page}} de {{totalPages}}",
        range: "{{start}}-{{end}} de {{total}}",
      }
    : {
        resultsPerPage: "Results per page",
        pageOf: "Page {{page}} of {{totalPages}}",
        range: "{{start}}-{{end}} of {{total}}",
      };

  const safePageSize = Math.max(1, Number(pageSize) || 5);
  const safeTotalPages = Math.max(1, Number(totalPages) || 1);
  const safeTotalItems = Math.max(0, Number(totalItems) || 0);
  const safePage = clamp(Number(page) || 1, 1, safeTotalPages);

  const pageNumbers = useMemo(() => {
    const from = Math.max(1, safePage - 2);
    const to = Math.min(safeTotalPages, safePage + 2);
    return Array.from({ length: to - from + 1 }, (_, index) => from + index);
  }, [safePage, safeTotalPages]);

  if (safeTotalItems === 0) {
    return null;
  }

  const startItem = (safePage - 1) * safePageSize + 1;
  const endItem = Math.min(safeTotalItems, safePage * safePageSize);

  return (
    <div
      className={`flex flex-col gap-3 border-t border-slate-200 px-4 py-3 text-sm text-slate-600 dark:border-slate-700 dark:text-slate-300 sm:flex-row sm:items-center sm:justify-between ${className}`}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span>{t("tablePagination.resultsPerPage", { defaultValue: labels.resultsPerPage })}</span>
        <div className="w-24">
          <Select
            value={safePageSize}
            onChange={(value) => onPageSizeChange?.(Number(value))}
            options={pageSizeOptions.map((option) => ({
              value: Number(option),
              label: String(option),
            }))}
            size="sm"
          />
        </div>
        <span>
          {t("tablePagination.range", {
            defaultValue: labels.range,
            start: startItem,
            end: endItem,
            total: safeTotalItems,
          })}
        </span>
        <span className="text-slate-500 dark:text-slate-400">
          {t("tablePagination.pageOf", {
            defaultValue: labels.pageOf,
            page: safePage,
            totalPages: safeTotalPages,
          })}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={safePage <= 1}
          onClick={() => onPageChange?.(safePage - 1)}
          className="min-h-10 rounded-lg border border-slate-300 px-3 py-2 text-xs font-medium disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-600"
        >
          {t("common.previous")}
        </button>
        {pageNumbers.map((pageNumber) => {
          const active = pageNumber === safePage;
          return (
            <button
              key={pageNumber}
              type="button"
              onClick={() => onPageChange?.(pageNumber)}
              className={`min-h-10 min-w-10 rounded-lg border px-3 py-2 text-xs font-semibold transition ${
                active
                  ? "border-sky-500 bg-sky-500 text-white"
                  : "border-slate-300 text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
              }`}
            >
              {pageNumber}
            </button>
          );
        })}
        <button
          type="button"
          disabled={safePage >= safeTotalPages}
          onClick={() => onPageChange?.(safePage + 1)}
          className="min-h-10 rounded-lg border border-slate-300 px-3 py-2 text-xs font-medium disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-600"
        >
          {t("common.next")}
        </button>
      </div>
    </div>
  );
};

export default TablePagination;
