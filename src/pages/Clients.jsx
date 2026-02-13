import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router-dom";
import { Users } from "lucide-react";
import { Select, TablePagination } from "../components/common";
import { clientsService } from "../services/clientsService";
import { getErrorMessage } from "../utils/errors";
import EmptyStatePanel from "../components/common/organisms/EmptyStatePanel";

const Clients = () => {
  const { t, i18n } = useTranslation();
  const [searchParams] = useSearchParams();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pageSize, setPageSize] = useState(5);
  const [meta, setMeta] = useState({
    total: 0,
    totalPages: 1,
    page: 1,
    truncated: false,
  });
  const [filters, setFilters] = useState({
    search: String(searchParams.get("search") || "").trim(),
    enabled: "all",
    createdFrom: "",
    createdTo: "",
    page: 1,
  });
  const focusId = String(searchParams.get("focus") || "").trim();

  const locale = i18n.language === "es" ? "es-MX" : "en-US";

  const loadClients = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await clientsService.listClients({
        search: filters.search,
        enabled: filters.enabled,
        createdFrom: filters.createdFrom,
        createdTo: filters.createdTo,
        page: filters.page,
        limit: pageSize,
      });
      setItems(response.documents || []);
      setMeta({
        total: response.total || 0,
        totalPages: response.totalPages || 1,
        page: response.page || 1,
        truncated: Boolean(response.truncated),
      });
    } catch (err) {
      setError(getErrorMessage(err, i18n.t("clientsPage.errors.load", { defaultValue: "No se pudieron cargar los clientes." })));
    } finally {
      setLoading(false);
    }
  }, [filters.createdFrom, filters.createdTo, filters.enabled, filters.page, filters.search, i18n, pageSize]);

  useEffect(() => {
    loadClients();
  }, [loadClients]);

  useEffect(() => {
    const nextSearch = String(searchParams.get("search") || "").trim();
    setFilters((prev) => (prev.search === nextSearch ? prev : { ...prev, search: nextSearch, page: 1 }));
  }, [searchParams]);

  useEffect(() => {
    if (loading || !focusId) return;
    const row = document.getElementById(`client-${focusId}`);
    row?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [focusId, items.length, loading]);

  const summary = useMemo(() => {
    return t("clientsPage.summary", {
      defaultValue: "Clientes registrados: {{total}}",
      total: meta.total,
    });
  }, [meta.total, t]);

  const statusOptions = useMemo(
    () => [
      { value: "all", label: t("clientsPage.filters.all", { defaultValue: "Todos" }) },
      {
        value: "enabled",
        label: t("clientsPage.filters.enabled", { defaultValue: "Activos" }),
      },
      {
        value: "disabled",
        label: t("clientsPage.filters.disabled", { defaultValue: "Inactivos" }),
      },
    ],
    [t]
  );

  const onFilterChange = (field, value) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value,
      page: field === "page" ? value : 1,
    }));
  };

  return (
    <section className="space-y-5">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
          {t("clientsPage.title", { defaultValue: "Clientes" })}
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-300">{summary}</p>
      </header>

      <div className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900 sm:grid-cols-2 xl:grid-cols-4">
        <label className="grid gap-1 text-sm">
          <span>{t("clientsPage.filters.search", { defaultValue: "Buscar" })}</span>
          <input
            value={filters.search}
            onChange={(event) => onFilterChange("search", event.target.value)}
            placeholder={t("clientsPage.filters.searchPlaceholder", {
              defaultValue: "Nombre, email o telefono",
            })}
            className="min-h-11 rounded-lg border border-slate-300 bg-white px-3 py-2 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100 dark:border-slate-600 dark:bg-slate-800 dark:focus:border-sky-400 dark:focus:ring-sky-900/50"
          />
        </label>

        <label className="grid gap-1 text-sm">
          <span>{t("clientsPage.filters.status", { defaultValue: "Estado" })}</span>
          <Select
            value={filters.enabled}
            onChange={(value) => onFilterChange("enabled", value)}
            options={statusOptions}
            size="md"
          />
        </label>

        <label className="grid gap-1 text-sm">
          <span>{t("clientsPage.filters.createdFrom", { defaultValue: "Desde" })}</span>
          <input
            type="date"
            value={filters.createdFrom}
            onChange={(event) => onFilterChange("createdFrom", event.target.value)}
            className="min-h-11 rounded-lg border border-slate-300 bg-white px-3 py-2 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100 dark:border-slate-600 dark:bg-slate-800 dark:focus:border-sky-400 dark:focus:ring-sky-900/50"
          />
        </label>

        <label className="grid gap-1 text-sm">
          <span>{t("clientsPage.filters.createdTo", { defaultValue: "Hasta" })}</span>
          <input
            type="date"
            value={filters.createdTo}
            onChange={(event) => onFilterChange("createdTo", event.target.value)}
            className="min-h-11 rounded-lg border border-slate-300 bg-white px-3 py-2 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100 dark:border-slate-600 dark:bg-slate-800 dark:focus:border-sky-400 dark:focus:ring-sky-900/50"
          />
        </label>
      </div>

      {loading ? (
        <p className="text-sm text-slate-600 dark:text-slate-300">
          {t("clientsPage.loading", { defaultValue: "Cargando clientes..." })}
        </p>
      ) : null}

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200">
          {error}
        </div>
      ) : null}

      {!loading && meta.truncated ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-300">
          {t("clientsPage.messages.truncated", {
            defaultValue: "Se aplico un limite de escaneo. Ajusta filtros para resultados mas precisos.",
          })}
        </div>
      ) : null}

      {!loading && items.length === 0 ? (
        <EmptyStatePanel
          icon={Users}
          title={t("clientsPage.empty", { defaultValue: "No hay clientes para mostrar." })}
          description={summary}
          compact
        />
      ) : null}

      {!loading && items.length > 0 ? (
        <div className="min-w-0 space-y-3">
          <div className="w-full max-w-full overflow-x-auto rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                <tr>
                  <th className="px-4 py-3">{t("clientsPage.table.client", { defaultValue: "Cliente" })}</th>
                  <th className="px-4 py-3">{t("clientsPage.table.email", { defaultValue: "Email" })}</th>
                  <th className="px-4 py-3">{t("clientsPage.table.phone", { defaultValue: "Telefono" })}</th>
                  <th className="px-4 py-3">{t("clientsPage.table.status", { defaultValue: "Estado" })}</th>
                  <th className="px-4 py-3">{t("clientsPage.table.createdAt", { defaultValue: "Registro" })}</th>
                </tr>
              </thead>
              <tbody>
                {items.map((client) => {
                  const fullName = `${client.firstName || ""} ${client.lastName || ""}`.trim();
                  const isFocused = Boolean(focusId) && client.$id === focusId;
                  return (
                    <tr
                      key={client.$id}
                      id={`client-${client.$id}`}
                      className={`border-t border-slate-200 dark:border-slate-700 ${
                        isFocused ? "bg-cyan-50/70 dark:bg-cyan-900/20" : ""
                      }`}
                    >
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-900 dark:text-slate-100">
                          {fullName || t("clientsPage.table.noName", { defaultValue: "Sin nombre" })}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-300">{client.$id}</p>
                      </td>
                      <td className="px-4 py-3 text-slate-700 dark:text-slate-200">{client.email || "-"}</td>
                      <td className="px-4 py-3 text-slate-700 dark:text-slate-200">{client.phone || "-"}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                            client.enabled
                              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                              : "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200"
                          }`}
                        >
                          {client.enabled
                            ? t("clientsPage.status.enabled", { defaultValue: "Activo" })
                            : t("clientsPage.status.disabled", { defaultValue: "Inactivo" })}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-700 dark:text-slate-200">
                        {new Date(client.$createdAt).toLocaleString(locale)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <TablePagination
            page={meta.page}
            totalPages={meta.totalPages}
            totalItems={meta.total}
            pageSize={pageSize}
            onPageChange={(value) => onFilterChange("page", value)}
            onPageSizeChange={(value) => {
              setPageSize(value);
              onFilterChange("page", 1);
            }}
          />
        </div>
      ) : null}
    </section>
  );
};

export default Clients;
