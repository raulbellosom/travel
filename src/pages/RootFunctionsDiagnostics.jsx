import LoadingState from "../components/common/molecules/LoadingState";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { FlaskConical, RefreshCw, ShieldCheck, Wrench } from "lucide-react";
import EmptyStatePanel from "../components/common/organisms/EmptyStatePanel";
import { rootFunctionsDiagnosticsService } from "../services/rootFunctionsDiagnosticsService";

const formatDateTime = (value, locale) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString(locale);
};

const parseErrorMessage = (err, fallback) => {
  if (!err) return fallback;
  const responseMessage = String(err?.response?.message || "").trim();
  if (responseMessage) return responseMessage;
  const message = String(err?.message || "").trim();
  return message || fallback;
};

const statusClassMap = {
  ok: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200",
  warning: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-200",
  error: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-200",
};

const RootFunctionsDiagnostics = () => {
  const { t, i18n } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");
  const [includeSmoke, setIncludeSmoke] = useState(false);
  const [report, setReport] = useState({
    generatedAt: "",
    includeSmoke: false,
    summary: {
      total: 0,
      ok: 0,
      warning: 0,
      error: 0,
      smokePassed: 0,
      smokeFailed: 0,
      smokeSkipped: 0,
    },
    results: [],
  });

  const locale = i18n.language === "en" ? "en-US" : "es-MX";

  const runDiagnostics = useCallback(
    async (nextIncludeSmoke) => {
      setError("");
      setRunning(true);
      try {
        const data = await rootFunctionsDiagnosticsService.run({
          includeSmoke: nextIncludeSmoke,
        });
        setReport({
          generatedAt: data?.generatedAt || "",
          includeSmoke: Boolean(data?.includeSmoke),
          summary: data?.summary || {
            total: 0,
            ok: 0,
            warning: 0,
            error: 0,
            smokePassed: 0,
            smokeFailed: 0,
            smokeSkipped: 0,
          },
          results: Array.isArray(data?.results) ? data.results : [],
        });
      } catch (err) {
        setError(
          parseErrorMessage(err, t("rootFunctionsDiagnosticsPage.errors.load")),
        );
      } finally {
        setRunning(false);
        setLoading(false);
      }
    },
    [t],
  );

  useEffect(() => {
    runDiagnostics(false);
  }, [runDiagnostics]);

  const summaryCards = useMemo(
    () => [
      {
        key: "ok",
        label: t("rootFunctionsDiagnosticsPage.summary.ok"),
        value: report.summary.ok || 0,
        className: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-900/20 dark:text-emerald-200",
      },
      {
        key: "warning",
        label: t("rootFunctionsDiagnosticsPage.summary.warning"),
        value: report.summary.warning || 0,
        className: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/40 dark:bg-amber-900/20 dark:text-amber-200",
      },
      {
        key: "error",
        label: t("rootFunctionsDiagnosticsPage.summary.error"),
        value: report.summary.error || 0,
        className: "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/40 dark:bg-rose-900/20 dark:text-rose-200",
      },
      {
        key: "total",
        label: t("rootFunctionsDiagnosticsPage.summary.total"),
        value: report.summary.total || 0,
        className: "border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-100",
      },
    ],
    [report.summary, t],
  );

  return (
    <section className="mx-auto max-w-7xl space-y-5 px-4 py-6">
      <header className="space-y-2">
        <h1 className="inline-flex items-center gap-2 text-2xl font-semibold text-slate-900 dark:text-slate-100">
          <ShieldCheck size={24} />
          {t("rootFunctionsDiagnosticsPage.title")}
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          {t("rootFunctionsDiagnosticsPage.subtitle")}
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {t("rootFunctionsDiagnosticsPage.generatedAt", {
            value: formatDateTime(report.generatedAt, locale),
          })}
        </p>
      </header>

      <article className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <label className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-700 dark:border-slate-600 dark:text-slate-200">
            <input
              type="checkbox"
              className="h-4 w-4"
              checked={includeSmoke}
              onChange={(event) => setIncludeSmoke(event.target.checked)}
            />
            <span className="inline-flex items-center gap-2">
              <FlaskConical size={15} />
              {t("rootFunctionsDiagnosticsPage.actions.includeSmoke")}
            </span>
          </label>

          <button
            type="button"
            disabled={running}
            onClick={() => runDiagnostics(includeSmoke)}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
          >
            <RefreshCw size={16} className={running ? "animate-spin" : ""} />
            {running
              ? t("rootFunctionsDiagnosticsPage.actions.running")
              : t("rootFunctionsDiagnosticsPage.actions.run")}
          </button>
        </div>

        <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
          {report.includeSmoke
            ? t("rootFunctionsDiagnosticsPage.smoke.enabled")
            : t("rootFunctionsDiagnosticsPage.smoke.disabled")}
        </p>
      </article>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {summaryCards.map((card) => (
          <article
            key={card.key}
            className={`rounded-2xl border p-4 ${card.className}`}
          >
            <p className="text-xs uppercase tracking-wide">{card.label}</p>
            <p className="mt-1 text-2xl font-semibold">{card.value}</p>
          </article>
        ))}
      </div>

      {report.includeSmoke ? (
        <article className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-sm sm:grid-cols-3 dark:border-slate-700 dark:bg-slate-900">
          <p>
            <strong>{t("rootFunctionsDiagnosticsPage.summary.smokePassed")}:</strong>{" "}
            {report.summary.smokePassed || 0}
          </p>
          <p>
            <strong>{t("rootFunctionsDiagnosticsPage.summary.smokeFailed")}:</strong>{" "}
            {report.summary.smokeFailed || 0}
          </p>
          <p>
            <strong>{t("rootFunctionsDiagnosticsPage.summary.smokeSkipped")}:</strong>{" "}
            {report.summary.smokeSkipped || 0}
          </p>
        </article>
      ) : null}

      {loading ? <LoadingState text={t("rootFunctionsDiagnosticsPage.loading")} /> : null}

      {error ? (
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/40 dark:text-rose-200">
          {error}
        </p>
      ) : null}

      {!loading && !error && report.results.length === 0 ? (
        <EmptyStatePanel
          icon={Wrench}
          title={t("rootFunctionsDiagnosticsPage.empty")}
          description={t("rootFunctionsDiagnosticsPage.subtitle")}
          compact
        />
      ) : null}

      {!loading && report.results.length > 0 ? (
        <div className="grid gap-4">
          {report.results.map((item) => {
            const statusClass = statusClassMap[item.status] || statusClassMap.error;
            const envClass = statusClassMap[item.env?.status] || statusClassMap.error;
            const smokeClass = item.smoke?.attempted
              ? item.smoke.ok
                ? statusClassMap.ok
                : statusClassMap.error
              : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200";

            return (
              <article
                key={item.key}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900"
              >
                <header className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1">
                    <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                      {item.title}
                    </h2>
                    <p className="font-mono text-xs text-slate-500 dark:text-slate-400">
                      {item.functionId || "-"}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {item.functionIdEnvKey}
                    </p>
                  </div>
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusClass}`}
                  >
                    {t(`rootFunctionsDiagnosticsPage.status.${item.status}`)}
                  </span>
                </header>

                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs dark:border-slate-700 dark:bg-slate-800/60">
                    <p className="font-semibold text-slate-700 dark:text-slate-200">
                      {t("rootFunctionsDiagnosticsPage.cards.env")}
                    </p>
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 font-semibold ${envClass}`}
                    >
                      {t(`rootFunctionsDiagnosticsPage.status.${item.env?.status || "error"}`)}
                    </span>
                    {item.env?.missingAuthGroups?.length > 0 ? (
                      <p className="text-rose-600 dark:text-rose-300">
                        {t("rootFunctionsDiagnosticsPage.labels.missingAuth")}{" "}
                        {item.env.missingAuthGroups.join(" | ")}
                      </p>
                    ) : null}
                    {item.env?.missingRequired?.length > 0 ? (
                      <p className="text-rose-600 dark:text-rose-300">
                        {t("rootFunctionsDiagnosticsPage.labels.missingRequired")}{" "}
                        {item.env.missingRequired.join(", ")}
                      </p>
                    ) : null}
                    {item.env?.missingRecommended?.length > 0 ? (
                      <p className="text-amber-700 dark:text-amber-300">
                        {t("rootFunctionsDiagnosticsPage.labels.missingRecommended")}{" "}
                        {item.env.missingRecommended.join(", ")}
                      </p>
                    ) : null}
                  </div>

                  <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs dark:border-slate-700 dark:bg-slate-800/60">
                    <p className="font-semibold text-slate-700 dark:text-slate-200">
                      {t("rootFunctionsDiagnosticsPage.cards.smoke")}
                    </p>
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 font-semibold ${smokeClass}`}
                    >
                      {!item.smoke?.attempted
                        ? t("rootFunctionsDiagnosticsPage.smoke.notRun")
                        : item.smoke.ok
                          ? t("rootFunctionsDiagnosticsPage.smoke.passed")
                          : t("rootFunctionsDiagnosticsPage.smoke.failed")}
                    </span>
                    {item.smoke?.attempted ? (
                      <p className="text-slate-600 dark:text-slate-300">
                        {t("rootFunctionsDiagnosticsPage.labels.responseStatus")}{" "}
                        {item.smoke.responseStatusCode || 0}
                      </p>
                    ) : null}
                    {item.smoke?.message ? (
                      <p className="text-slate-600 dark:text-slate-300">{item.smoke.message}</p>
                    ) : null}
                    {item.smoke?.error ? (
                      <p className="text-rose-600 dark:text-rose-300">{item.smoke.error}</p>
                    ) : null}
                  </div>

                  <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs dark:border-slate-700 dark:bg-slate-800/60">
                    <p className="font-semibold text-slate-700 dark:text-slate-200">
                      {t("rootFunctionsDiagnosticsPage.cards.latestExecution")}
                    </p>
                    <p className="text-slate-600 dark:text-slate-300">
                      {t("rootFunctionsDiagnosticsPage.labels.executionId")}{" "}
                      {item.latestExecution?.executionId || "-"}
                    </p>
                    <p className="text-slate-600 dark:text-slate-300">
                      {t("rootFunctionsDiagnosticsPage.labels.executionStatus")}{" "}
                      {item.latestExecution?.status || "-"}
                    </p>
                    <p className="text-slate-600 dark:text-slate-300">
                      {t("rootFunctionsDiagnosticsPage.labels.responseStatus")}{" "}
                      {item.latestExecution?.responseStatusCode || 0}
                    </p>
                    <p className="text-slate-600 dark:text-slate-300">
                      {t("rootFunctionsDiagnosticsPage.labels.createdAt")}{" "}
                      {formatDateTime(item.latestExecution?.createdAt, locale)}
                    </p>
                  </div>
                </div>

                {item.errors?.length > 0 ? (
                  <div className="mt-3 space-y-1 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-200">
                    {item.errors.map((issue, idx) => (
                      <p key={`${item.key}-error-${idx}`}>
                        [{issue.code || 0}] {issue.message}
                      </p>
                    ))}
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>
      ) : null}
    </section>
  );
};

export default RootFunctionsDiagnostics;
