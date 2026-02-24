import SkeletonLoader from "../components/common/molecules/SkeletonLoader";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Filter, ShieldAlert } from "lucide-react";
import { Select } from "../components/common";
import { activityLogsService } from "../services/activityLogsService";
import { getErrorMessage } from "../utils/errors";
import EmptyStatePanel from "../components/common/organisms/EmptyStatePanel";

const SEVERITIES = ["info", "warning", "critical"];

const prettyJson = (value) => {
  if (!value) return "-";
  try {
    return JSON.stringify(JSON.parse(value), null, 2);
  } catch {
    return String(value);
  }
};

const RootActivityLog = () => {
  const { t, i18n } = useTranslation();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({
    action: "",
    actorUserId: "",
    entityType: "",
    severity: "",
    fromDate: "",
    toDate: "",
  });
  const locale = i18n.language === "en" ? "en-US" : "es-MX";

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await activityLogsService.list(filters);
      setLogs(response.documents || []);
    } catch (err) {
      setError(getErrorMessage(err, i18n.t("rootActivityPage.errors.load")));
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    load();
  }, [load]);

  const severityClass = useMemo(
    () => ({
      info: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200",
      warning:
        "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-200",
      critical:
        "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-200",
    }),
    [],
  );

  const severityOptions = useMemo(
    () => [
      { value: "", label: t("rootActivityPage.filters.all") },
      ...SEVERITIES.map((severity) => ({ value: severity, label: severity })),
    ],
    [t],
  );

  return (
    <section className="mx-auto max-w-7xl space-y-5 px-4 py-6">
      <header className="space-y-1">
        <h1 className="inline-flex items-center gap-2 text-2xl font-semibold text-slate-900 dark:text-slate-100">
          <ShieldAlert size={24} />
          {t("rootActivityPage.title")}
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          {t("rootActivityPage.subtitle")}
        </p>
      </header>

      <div className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6 dark:border-slate-700 dark:bg-slate-900">
        <label className="grid gap-1 text-sm">
          <span className="inline-flex items-center gap-2">
            <Filter size={14} />
            {t("rootActivityPage.filters.action")}
          </span>
          <input
            value={filters.action}
            onChange={(event) =>
              setFilters((prev) => ({ ...prev, action: event.target.value }))
            }
            className="min-h-11 rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 dark:border-slate-600 dark:bg-slate-800"
          />
        </label>
        <label className="grid gap-1 text-sm">
          <span>{t("rootActivityPage.filters.actorUserId")}</span>
          <input
            value={filters.actorUserId}
            onChange={(event) =>
              setFilters((prev) => ({
                ...prev,
                actorUserId: event.target.value,
              }))
            }
            className="min-h-11 rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 dark:border-slate-600 dark:bg-slate-800"
          />
        </label>
        <label className="grid gap-1 text-sm">
          <span>{t("rootActivityPage.filters.entityType")}</span>
          <input
            value={filters.entityType}
            onChange={(event) =>
              setFilters((prev) => ({
                ...prev,
                entityType: event.target.value,
              }))
            }
            className="min-h-11 rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 dark:border-slate-600 dark:bg-slate-800"
          />
        </label>
        <label className="grid gap-1 text-sm">
          <span>{t("rootActivityPage.filters.severity")}</span>
          <Select
            value={filters.severity}
            onChange={(value) =>
              setFilters((prev) => ({ ...prev, severity: value }))
            }
            options={severityOptions}
            size="md"
          />
        </label>
        <label className="grid gap-1 text-sm">
          <span>{t("rootActivityPage.filters.fromDate")}</span>
          <input
            type="date"
            value={filters.fromDate}
            onChange={(event) =>
              setFilters((prev) => ({ ...prev, fromDate: event.target.value }))
            }
            className="min-h-11 rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 dark:border-slate-600 dark:bg-slate-800"
          />
        </label>
        <label className="grid gap-1 text-sm">
          <span>{t("rootActivityPage.filters.toDate")}</span>
          <input
            type="date"
            value={filters.toDate}
            onChange={(event) =>
              setFilters((prev) => ({ ...prev, toDate: event.target.value }))
            }
            className="min-h-11 rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 dark:border-slate-600 dark:bg-slate-800"
          />
        </label>
      </div>

      {loading ? <SkeletonLoader /> : null}
      {error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200">
          {error}
        </p>
      ) : null}

      {!loading && !error && logs.length === 0 ? (
        <EmptyStatePanel
          icon={ShieldAlert}
          title={t("rootActivityPage.empty")}
          description={t("rootActivityPage.subtitle")}
          compact
        />
      ) : null}

      {!loading && logs.length > 0 ? (
        <div className="grid gap-4">
          {logs.map((log) => (
            <article
              key={log.$id}
              className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900"
            >
              <header className="flex flex-wrap items-center justify-between gap-2">
                <div className="space-y-0.5">
                  <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-300">
                    {new Date(log.$createdAt).toLocaleString(locale)}
                  </p>
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {log.action} - {log.entityType}
                  </p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    severityClass[log.severity] || severityClass.info
                  }`}
                >
                  {log.severity || "info"}
                </span>
              </header>

              <div className="grid gap-2 text-xs text-slate-600 dark:text-slate-300 md:grid-cols-3">
                <p>
                  <strong>actorUserId:</strong> {log.actorUserId || "-"}
                </p>
                <p>
                  <strong>actorRole:</strong> {log.actorRole || "-"}
                </p>
                <p>
                  <strong>entityId:</strong> {log.entityId || "-"}
                </p>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">
                    beforeData
                  </p>
                  <pre className="max-h-64 overflow-auto rounded-lg bg-slate-100 p-3 text-xs text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                    {prettyJson(log.beforeData)}
                  </pre>
                </div>
                <div>
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">
                    afterData
                  </p>
                  <pre className="max-h-64 overflow-auto rounded-lg bg-slate-100 p-3 text-xs text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                    {prettyJson(log.afterData)}
                  </pre>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : null}
    </section>
  );
};

export default RootActivityLog;
