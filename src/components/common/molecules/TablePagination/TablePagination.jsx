import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Select from "../../atoms/Select";

const DEFAULT_PAGE_SIZE_OPTIONS = [5, 10, 20, 50, "all"];

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
  const [viewportWidth, setViewportWidth] = useState(() => {
    if (typeof window === "undefined") return 1024;
    return window.innerWidth;
  });
  const language = String(i18n.resolvedLanguage || i18n.language || "").toLowerCase();
  const isSpanish = language.startsWith("es");

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const onResize = () => setViewportWidth(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const labels = isSpanish
    ? {
        resultsPerPage: "Resultados por pagina",
        pageOf: "Pagina {{page}} de {{totalPages}}",
        range: "{{start}}-{{end}} de {{total}}",
        all: "Todos",
      }
    : {
        resultsPerPage: "Results per page",
        pageOf: "Page {{page}} of {{totalPages}}",
        range: "{{start}}-{{end}} of {{total}}",
        all: "All",
      };

  const isAllSelected = pageSize === "all";
  const safePageSize = isAllSelected ? Math.max(1, Number(totalItems) || 1) : Math.max(1, Number(pageSize) || 5);
  const safeTotalPages = Math.max(1, Number(totalPages) || 1);
  const safeTotalItems = Math.max(0, Number(totalItems) || 0);
  const safePage = clamp(Number(page) || 1, 1, safeTotalPages);
  const maxVisiblePages = viewportWidth >= 1024 ? 7 : viewportWidth >= 640 ? 5 : 3;

  const pageNumbers = useMemo(() => {
    const half = Math.floor(maxVisiblePages / 2);
    const from = Math.max(1, safePage - half);
    const to = Math.min(safeTotalPages, from + maxVisiblePages - 1);
    const adjustedFrom = Math.max(1, to - maxVisiblePages + 1);
    return Array.from({ length: to - adjustedFrom + 1 }, (_, index) => adjustedFrom + index);
  }, [maxVisiblePages, safePage, safeTotalPages]);

  if (safeTotalItems === 0) {
    return null;
  }

  const startItem = (safePage - 1) * safePageSize + 1;
  const endItem = Math.min(safeTotalItems, safePage * safePageSize);

  return (
    <div
      className={`w-full border-t border-slate-200 px-3 py-3 text-sm text-slate-600 dark:border-slate-700 dark:text-slate-300 sm:px-4 ${className}`}
    >
      <div className="grid gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
            {t("tablePagination.resultsPerPage", { defaultValue: labels.resultsPerPage })}
          </span>
          <div className="w-24 shrink-0">
            <Select
              value={isAllSelected ? "all" : safePageSize}
              onChange={(value) => onPageSizeChange?.(value === "all" ? "all" : Number(value))}
              options={pageSizeOptions.map((option) => ({
                value: option === "all" ? "all" : Number(option),
                label:
                  option === "all"
                    ? t("tablePagination.all", { defaultValue: labels.all })
                    : String(option),
              }))}
              size="md"
            />
          </div>
          <span className="text-xs text-slate-600 dark:text-slate-300">
            {t("tablePagination.range", {
              defaultValue: labels.range,
              start: startItem,
              end: endItem,
              total: safeTotalItems,
            })}
          </span>
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400">
          {t("tablePagination.pageOf", {
            defaultValue: labels.pageOf,
            page: safePage,
            totalPages: safeTotalPages,
          })}
        </p>

        <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2">
          <button
            type="button"
            disabled={safePage <= 1}
            onClick={() => onPageChange?.(safePage - 1)}
            className="inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-lg border border-slate-300 text-slate-700 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-600 dark:text-slate-200"
            aria-label={t("common.previous")}
            title={t("common.previous")}
          >
            <ChevronLeft size={14} />
          </button>

          <div className="min-w-0">
            <div className="mx-auto flex items-center justify-center gap-1.5">
              {pageNumbers.map((pageNumber) => {
                const active = pageNumber === safePage;
                return (
                  <button
                    key={pageNumber}
                    type="button"
                    onClick={() => onPageChange?.(pageNumber)}
                    aria-current={active ? "page" : undefined}
                    className={`inline-flex h-9 min-w-9 cursor-pointer items-center justify-center rounded-md border px-2 text-[11px] font-semibold transition sm:h-10 sm:min-w-10 ${
                      active
                        ? "border-sky-500 bg-sky-500 text-white"
                        : "border-slate-300 text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
                    }`}
                  >
                    {pageNumber}
                  </button>
                );
              })}
            </div>
          </div>

          <button
            type="button"
            disabled={safePage >= safeTotalPages}
            onClick={() => onPageChange?.(safePage + 1)}
            className="inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-lg border border-slate-300 text-slate-700 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-600 dark:text-slate-200"
            aria-label={t("common.next")}
            title={t("common.next")}
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default TablePagination;
