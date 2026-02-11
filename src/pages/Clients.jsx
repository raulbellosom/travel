import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { clientsService } from "../services/clientsService";
import { getErrorMessage } from "../utils/errors";

const LIMIT = 20;

const Clients = () => {
  const { t, i18n } = useTranslation();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [meta, setMeta] = useState({
    total: 0,
    totalPages: 1,
    page: 1,
    truncated: false,
  });
  const [filters, setFilters] = useState({
    search: "",
    enabled: "all",
    createdFrom: "",
    createdTo: "",
    page: 1,
  });

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
        limit: LIMIT,
      });
      setItems(response.documents || []);
      setMeta({
        total: response.total || 0,
        totalPages: response.totalPages || 1,
        page: response.page || 1,
        truncated: Boolean(response.truncated),
      });
    } catch (err) {
      setError(getErrorMessage(err, t("clientsPage.errors.load", { defaultValue: "No se pudieron cargar los clientes." })));
    } finally {
      setLoading(false);
    }
  }, [filters.createdFrom, filters.createdTo, filters.enabled, filters.page, filters.search, t]);

  useEffect(() => {
    loadClients();
  }, [loadClients]);

  const summary = useMemo(() => {
    return t("clientsPage.summary", {
      defaultValue: "Clientes registrados: {{total}}",
      total: meta.total,
    });
  }, [meta.total, t]);

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
          <select
            value={filters.enabled}
            onChange={(event) => onFilterChange("enabled", event.target.value)}
            className="min-h-11 rounded-lg border border-slate-300 bg-white px-3 py-2 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100 dark:border-slate-600 dark:bg-slate-800 dark:focus:border-sky-400 dark:focus:ring-sky-900/50"
          >
            <option value="all">{t("clientsPage.filters.all", { defaultValue: "Todos" })}</option>
            <option value="enabled">{t("clientsPage.filters.enabled", { defaultValue: "Activos" })}</option>
            <option value="disabled">{t("clientsPage.filters.disabled", { defaultValue: "Inactivos" })}</option>
          </select>
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
        <div className="rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
          {t("clientsPage.empty", { defaultValue: "No hay clientes para mostrar." })}
        </div>
      ) : null}

      {!loading && items.length > 0 ? (
        <div className="space-y-3">
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
            <table className="min-w-full text-left text-sm">
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
                  return (
                    <tr key={client.$id} className="border-t border-slate-200 dark:border-slate-700">
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

          <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-600 dark:text-slate-300">
            <span>
              {t("clientsPage.pagination.pageOf", {
                defaultValue: "Pagina {{page}} de {{totalPages}}",
                page: meta.page,
                totalPages: meta.totalPages,
              })}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={meta.page <= 1}
                onClick={() => onFilterChange("page", meta.page - 1)}
                className="min-h-11 rounded-lg border border-slate-300 px-3 py-2 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-600"
              >
                {t("clientsPage.pagination.previous", { defaultValue: "Anterior" })}
              </button>
              <button
                type="button"
                disabled={meta.page >= meta.totalPages}
                onClick={() => onFilterChange("page", meta.page + 1)}
                className="min-h-11 rounded-lg border border-slate-300 px-3 py-2 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-600"
              >
                {t("clientsPage.pagination.next", { defaultValue: "Siguiente" })}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
};

export default Clients;
