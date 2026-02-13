import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Building2, Search } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { propertiesService } from "../services/propertiesService";
import { getErrorMessage } from "../utils/errors";
import { TablePagination } from "../components/common";
import EmptyStatePanel from "../components/common/organisms/EmptyStatePanel";
import {
  INTERNAL_ROUTES,
  getInternalEditPropertyRoute,
} from "../utils/internalRoutes";

const MyProperties = () => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [searchText, setSearchText] = useState(() =>
    String(searchParams.get("search") || "").trim()
  );
  const focusId = String(searchParams.get("focus") || "").trim();

  const locale = i18n.language === "es" ? "es-MX" : "en-US";

  useEffect(() => {
    const nextSearch = String(searchParams.get("search") || "").trim();
    setSearchText((prev) => (prev === nextSearch ? prev : nextSearch));
  }, [searchParams]);

  const loadData = useCallback(async () => {
    if (!user?.$id) return;
    setLoading(true);
    setError("");
    try {
      const response = await propertiesService.listMine(user.$id);
      setItems(response.documents || []);
    } catch (err) {
      setError(getErrorMessage(err, i18n.t("myPropertiesPage.errors.load")));
    } finally {
      setLoading(false);
    }
  }, [i18n, user?.$id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleStatusToggle = async (item) => {
    setBusyId(item.$id);
    try {
      await propertiesService.update(item.$id, user.$id, {
        ...item,
        status: item.status === "published" ? "draft" : "published",
      });
      await loadData();
    } catch (err) {
      setError(getErrorMessage(err, t("myPropertiesPage.errors.toggleStatus")));
    } finally {
      setBusyId("");
    }
  };

  const handleDelete = async (itemId) => {
    if (!window.confirm(t("myPropertiesPage.confirmDeactivate"))) return;
    setBusyId(itemId);
    try {
      await propertiesService.softDelete(itemId);
      await loadData();
    } catch (err) {
      setError(getErrorMessage(err, t("myPropertiesPage.errors.delete")));
    } finally {
      setBusyId("");
    }
  };

  const activeItems = useMemo(
    () => items.filter((item) => item.enabled !== false),
    [items]
  );
  const normalizedSearch = String(searchText || "").trim().toLowerCase();
  const filteredItems = useMemo(() => {
    if (!normalizedSearch) return activeItems;

    return activeItems.filter((item) => {
      const haystack = [
        item.title,
        item.slug,
        item.city,
        item.state,
        item.status,
      ]
        .map((value) => String(value || "").toLowerCase())
        .join(" ");
      return haystack.includes(normalizedSearch);
    });
  }, [activeItems, normalizedSearch]);

  useEffect(() => {
    setPage(1);
  }, [normalizedSearch]);

  const effectivePageSize = useMemo(() => {
    if (pageSize === "all") return Math.max(1, filteredItems.length);
    return Math.max(1, Number(pageSize) || 5);
  }, [filteredItems.length, pageSize]);

  const totalPages = useMemo(
    () => (pageSize === "all" ? 1 : Math.max(1, Math.ceil(filteredItems.length / effectivePageSize))),
    [effectivePageSize, filteredItems.length, pageSize]
  );

  useEffect(() => {
    setPage((current) => Math.min(current, totalPages));
  }, [totalPages]);

  const paginatedItems = useMemo(() => {
    if (pageSize === "all") return filteredItems;
    const start = (page - 1) * effectivePageSize;
    return filteredItems.slice(start, start + effectivePageSize);
  }, [effectivePageSize, filteredItems, page, pageSize]);

  useEffect(() => {
    if (!focusId || filteredItems.length === 0) return;
    const targetIndex = filteredItems.findIndex((item) => item.$id === focusId);
    if (targetIndex < 0) return;
    setPage(Math.floor(targetIndex / effectivePageSize) + 1);
  }, [effectivePageSize, filteredItems, focusId]);

  useEffect(() => {
    if (loading || !focusId) return;
    const row = document.getElementById(`property-${focusId}`);
    row?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [focusId, loading, page, paginatedItems.length]);

  return (
    <section className="space-y-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
            {t("myPropertiesPage.title")}
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            {t("myPropertiesPage.subtitle")}
          </p>
        </div>
        <Link
          to={INTERNAL_ROUTES.createProperty}
          className="inline-flex min-h-11 items-center rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-700"
        >
          {t("myPropertiesPage.actions.create")}
        </Link>
      </header>

      <div className="max-w-md">
        <label className="grid gap-1 text-sm">
          <span className="inline-flex items-center gap-2 text-slate-700 dark:text-slate-200">
            <Search size={14} />
            {t("myPropertiesPage.filters.search", { defaultValue: "Buscar" })}
          </span>
          <input
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
            placeholder={t("myPropertiesPage.filters.searchPlaceholder", {
              defaultValue: "Titulo, slug, ciudad o estado",
            })}
            className="min-h-11 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 dark:border-slate-600 dark:bg-slate-800"
          />
        </label>
      </div>

      {loading ? <p className="text-sm text-slate-600 dark:text-slate-300">{t("myPropertiesPage.loading")}</p> : null}
      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200">
          {error}
        </div>
      ) : null}

      {!loading && filteredItems.length === 0 ? (
        <EmptyStatePanel
          icon={Building2}
          title={
            normalizedSearch
              ? t("myPropertiesPage.emptyFiltered", {
                  defaultValue: 'No hay resultados para "{{query}}".',
                  query: searchText.trim(),
                })
              : t("myPropertiesPage.empty")
          }
          description={t("myPropertiesPage.subtitle")}
          actionLabel={t("myPropertiesPage.actions.create")}
          actionTo={INTERNAL_ROUTES.createProperty}
        />
      ) : null}

      {!loading && filteredItems.length > 0 ? (
        <div className="min-w-0 rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
          <div className="w-full max-w-full overflow-x-auto">
            <table className="w-full min-w-[780px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                <tr>
                  <th className="px-4 py-3">{t("myPropertiesPage.table.title")}</th>
                  <th className="px-4 py-3">{t("myPropertiesPage.table.location")}</th>
                  <th className="px-4 py-3">{t("myPropertiesPage.table.status")}</th>
                  <th className="px-4 py-3">{t("myPropertiesPage.table.price")}</th>
                  <th className="px-4 py-3">{t("myPropertiesPage.table.actions")}</th>
                </tr>
              </thead>
              <tbody>
                {paginatedItems.map((item) => {
                  const isFocused = Boolean(focusId) && item.$id === focusId;

                  return (
                    <tr
                      key={item.$id}
                      id={`property-${item.$id}`}
                      className={`border-t border-slate-200 dark:border-slate-700 ${
                        isFocused ? "bg-cyan-50/70 dark:bg-cyan-900/20" : ""
                      }`}
                    >
                      <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">
                        {item.title}
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                        {item.city}, {item.state}
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                        {t(`propertyStatus.${item.status}`, { defaultValue: item.status })}
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                        {new Intl.NumberFormat(locale, {
                          style: "currency",
                          currency: item.currency || "MXN",
                          maximumFractionDigits: 0,
                        }).format(item.price || 0)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-2">
                          <Link
                            to={getInternalEditPropertyRoute(item.$id)}
                            className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium dark:border-slate-600"
                          >
                            {t("myPropertiesPage.actions.edit")}
                          </Link>
                          <button
                            type="button"
                            disabled={busyId === item.$id}
                            onClick={() => handleStatusToggle(item)}
                            className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium disabled:opacity-60 dark:border-slate-600"
                          >
                            {item.status === "published"
                              ? t("myPropertiesPage.actions.toDraft")
                              : t("myPropertiesPage.actions.publish")}
                          </button>
                          <button
                            type="button"
                            disabled={busyId === item.$id}
                            onClick={() => handleDelete(item.$id)}
                            className="rounded-md border border-red-300 px-3 py-1.5 text-xs font-medium text-red-700 disabled:opacity-60 dark:border-red-800 dark:text-red-300"
                          >
                            {t("myPropertiesPage.actions.delete")}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <TablePagination
            page={page}
            totalPages={totalPages}
            totalItems={filteredItems.length}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={(value) => {
              setPageSize(value);
              setPage(1);
            }}
          />
        </div>
      ) : null}
    </section>
  );
};

export default MyProperties;

