import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Building2,
  CheckCircle2,
  EllipsisVertical,
  FileText,
  Loader2,
  Pencil,
  Search,
  Trash2,
} from "lucide-react";
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
  const [rowActionMenu, setRowActionMenu] = useState(null);
  const focusId = String(searchParams.get("focus") || "").trim();
  const rowActionMenuRef = useRef(null);
  const rowActionTriggerRefs = useRef({});

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
    closeRowActionMenu();
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
    closeRowActionMenu();
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

  const rowActionItem = useMemo(
    () => paginatedItems.find((item) => item.$id === rowActionMenu?.propertyId) || null,
    [paginatedItems, rowActionMenu?.propertyId]
  );

  const closeRowActionMenu = useCallback(() => {
    setRowActionMenu(null);
  }, []);

  useEffect(() => {
    if (rowActionMenu && !rowActionItem) {
      closeRowActionMenu();
    }
  }, [closeRowActionMenu, rowActionItem, rowActionMenu]);

  const openRowActionMenu = (event, propertyId, triggerId = propertyId) => {
    if (typeof window === "undefined") return;

    const triggerRect = event.currentTarget.getBoundingClientRect();
    const horizontalPadding = 8;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const menuWidth = Math.min(240, viewportWidth - horizontalPadding * 2);
    const estimatedMenuHeight = 144;
    const gap = 6;
    const canOpenDown =
      triggerRect.bottom + gap + estimatedMenuHeight <= viewportHeight - horizontalPadding;
    const top = canOpenDown
      ? triggerRect.bottom + gap
      : Math.max(horizontalPadding, triggerRect.top - estimatedMenuHeight - gap);
    const left = Math.max(
      horizontalPadding,
      Math.min(
        triggerRect.right - menuWidth,
        viewportWidth - menuWidth - horizontalPadding
      )
    );

    setRowActionMenu((previous) =>
      previous?.propertyId === propertyId && previous?.triggerId === triggerId
        ? null
        : {
            propertyId,
            triggerId,
            top,
            left,
            width: menuWidth,
          }
    );
  };

  useEffect(() => {
    if (!rowActionMenu) return;

    const closeOnOutsideClick = (event) => {
      const menuElement = rowActionMenuRef.current;
      const triggerElement = rowActionTriggerRefs.current[rowActionMenu.triggerId];
      if (menuElement?.contains(event.target) || triggerElement?.contains(event.target)) {
        return;
      }
      closeRowActionMenu();
    };

    const closeOnEscape = (event) => {
      if (event.key === "Escape") {
        closeRowActionMenu();
      }
    };

    const closeOnViewportChange = () => closeRowActionMenu();

    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("touchstart", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    window.addEventListener("resize", closeOnViewportChange);
    window.addEventListener("scroll", closeOnViewportChange, true);

    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      document.removeEventListener("touchstart", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
      window.removeEventListener("resize", closeOnViewportChange);
      window.removeEventListener("scroll", closeOnViewportChange, true);
    };
  }, [closeRowActionMenu, rowActionMenu]);

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

  const renderRowActionTrigger = (item, triggerId) => (
    <button
      ref={(element) => {
        if (element) {
          rowActionTriggerRefs.current[triggerId] = element;
          return;
        }
        delete rowActionTriggerRefs.current[triggerId];
      }}
      type="button"
      onClick={(event) => openRowActionMenu(event, item.$id, triggerId)}
      disabled={busyId === item.$id}
      aria-label={t("myPropertiesPage.actions.openMenu", {
        defaultValue: "Abrir menu de acciones",
      })}
      aria-haspopup="menu"
      aria-expanded={rowActionMenu?.propertyId === item.$id}
      className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-300 text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
    >
      <EllipsisVertical size={16} />
    </button>
  );

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
                        {renderRowActionTrigger(item, `table-${item.$id}`)}
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

      {rowActionMenu && rowActionItem && typeof document !== "undefined"
        ? createPortal(
            <div
              ref={rowActionMenuRef}
              role="menu"
              aria-label={t("myPropertiesPage.actions.menuLabel", {
                defaultValue: "Acciones de la propiedad",
              })}
              className="fixed z-[130] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900"
              style={{
                top: `${rowActionMenu.top}px`,
                left: `${rowActionMenu.left}px`,
                width: `${rowActionMenu.width}px`,
              }}
            >
              <div className="p-1.5">
                <Link
                  role="menuitem"
                  to={getInternalEditPropertyRoute(rowActionItem.$id)}
                  onClick={closeRowActionMenu}
                  className="inline-flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:text-slate-100 dark:hover:bg-slate-800"
                >
                  <Pencil size={15} />
                  {t("myPropertiesPage.actions.edit")}
                </Link>

                <button
                  type="button"
                  role="menuitem"
                  onClick={() => handleStatusToggle(rowActionItem)}
                  disabled={busyId === rowActionItem.$id}
                  className="inline-flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60 dark:text-slate-100 dark:hover:bg-slate-800"
                >
                  {busyId === rowActionItem.$id ? (
                    <Loader2 size={15} className="animate-spin" />
                  ) : rowActionItem.status === "published" ? (
                    <FileText size={15} />
                  ) : (
                    <CheckCircle2 size={15} />
                  )}
                  {rowActionItem.status === "published"
                    ? t("myPropertiesPage.actions.toDraft")
                    : t("myPropertiesPage.actions.publish")}
                </button>

                <button
                  type="button"
                  role="menuitem"
                  onClick={() => handleDelete(rowActionItem.$id)}
                  disabled={busyId === rowActionItem.$id}
                  className="inline-flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60 dark:text-red-300 dark:hover:bg-red-950/40"
                >
                  <Trash2 size={15} />
                  {t("myPropertiesPage.actions.delete")}
                </button>
              </div>
            </div>,
            document.body
          )
        : null}
    </section>
  );
};

export default MyProperties;



