import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Save, SlidersHorizontal, ShieldCheck, X } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useInstanceModules } from "../hooks/useInstanceModules";
import Select from "../components/common/atoms/Select";
import { useToast } from "../hooks/useToast";

const PLAN_OPTIONS = [
  { value: "starter", label: "Starter" },
  { value: "pro", label: "Pro" },
  { value: "elite", label: "Elite" },
  { value: "custom", label: "Custom" },
];

const toPositiveInt = (value, fallback = 0) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(0, Math.trunc(parsed));
};

const RootModulesPage = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { showToast } = useToast();
  const {
    settings,
    moduleCatalog,
    loading,
    saving,
    error,
    saveSettings,
  } = useInstanceModules();

  const [draft, setDraft] = useState(null);
  const [dismissedError, setDismissedError] = useState(false);
  const current = draft || settings;

  const enabledSet = useMemo(
    () => new Set(current.enabledModules || []),
    [current.enabledModules],
  );

  const updateDraft = (patch) => {
    setDraft((prev) => ({
      ...(prev || settings),
      ...patch,
    }));
  };

  const handleToggle = (moduleKey) => {
    const next = new Set(enabledSet);
    if (next.has(moduleKey)) next.delete(moduleKey);
    else next.add(moduleKey);
    updateDraft({ enabledModules: Array.from(next) });
  };

  const handleLimitChange = (limitKey, nextValue) => {
    updateDraft({
      limits: {
        ...(current.limits || {}),
        [limitKey]: toPositiveInt(nextValue, 0),
      },
    });
  };

  const handleSave = async (event) => {
    event.preventDefault();
    try {
      await saveSettings(
        {
          planKey: current.planKey,
          enabledModules: current.enabledModules,
          limits: current.limits,
          enabled: current.enabled !== false,
        },
        {
          actorUserId: user?.$id || "",
          actorRole: user?.role || "root",
        },
      );
      setDraft(null);
      showToast({
        type: "success",
        title: t("rootModulesPage.title", { defaultValue: "Modules & Plan" }),
        message: t("rootModulesPage.actions.saved", {
          defaultValue: "Configuracion guardada correctamente.",
        }),
      });
    } catch {
      // Error state is handled by useInstanceModules and rendered below.
    }
  };

  useEffect(() => {
    setDismissedError(false);
  }, [error]);

  useEffect(() => {
    if (!error) return;
    showToast({
      type: "error",
      title: t("rootModulesPage.title", { defaultValue: "Modules & Plan" }),
      message: error,
      durationMs: 7000,
    });
  }, [error, showToast, t]);

  return (
    <section className="space-y-5">
      <header className="space-y-1">
        <h1 className="inline-flex items-center gap-2 text-2xl font-semibold text-slate-900 dark:text-slate-100">
          <SlidersHorizontal size={24} />
          {t("rootModulesPage.title", { defaultValue: "Modules & Plan" })}
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          {t("rootModulesPage.subtitle", {
            defaultValue:
              "Controla modules habilitados y limites comerciales de la instancia.",
          })}
        </p>
      </header>

      {loading ? (
        <p className="text-sm text-slate-600 dark:text-slate-300">
          {t("common.loading")}
        </p>
      ) : null}

      {error && !dismissedError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200">
          <div className="flex items-start justify-between gap-3">
            <p className="break-words">{error}</p>
            <button
              type="button"
              onClick={() => setDismissedError(true)}
              className="rounded-md p-1 opacity-80 transition hover:bg-red-100 hover:opacity-100 dark:hover:bg-red-900/40"
              aria-label={t("common.close", { defaultValue: "Cerrar" })}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : null}

      {!loading ? (
        <form onSubmit={handleSave} className="space-y-4">
          <article className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">
              {t("rootModulesPage.plan.title", { defaultValue: "Plan" })}
            </h2>
            <div className="grid gap-3 md:grid-cols-2">
              <label className="grid gap-1 text-sm">
                <span className="text-slate-700 dark:text-slate-200">
                  {t("rootModulesPage.plan.key", { defaultValue: "Plan key" })}
                </span>
                <Select
                  value={current.planKey || "starter"}
                  onChange={(value) => updateDraft({ planKey: value })}
                  options={PLAN_OPTIONS}
                  size="md"
                />
              </label>
              <label className="inline-flex min-h-11 cursor-pointer items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                <span>
                  {t("rootModulesPage.plan.enabled", {
                    defaultValue: "Instancia habilitada",
                  })}
                </span>
                <input
                  type="checkbox"
                  checked={current.enabled !== false}
                  onChange={(event) =>
                    updateDraft({ enabled: event.target.checked })
                  }
                  className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500 dark:border-slate-600"
                />
              </label>
            </div>
          </article>

          <article className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">
              {t("rootModulesPage.modules.title", {
                defaultValue: "Enabled Modules",
              })}
            </h2>
            <div className="grid gap-2 md:grid-cols-2">
              {moduleCatalog.map((moduleItem) => (
                <label
                  key={moduleItem.key}
                  className="inline-flex min-h-11 cursor-pointer items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                >
                  <span className="font-mono text-xs md:text-sm">
                    {moduleItem.key}
                  </span>
                  <input
                    type="checkbox"
                    checked={enabledSet.has(moduleItem.key)}
                    onChange={() => handleToggle(moduleItem.key)}
                    className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500 dark:border-slate-600"
                  />
                </label>
              ))}
            </div>
          </article>

          <article className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">
              {t("rootModulesPage.limits.title", { defaultValue: "Limits" })}
            </h2>
            <div className="grid gap-3 md:grid-cols-3">
              <label className="grid gap-1 text-sm">
                <span className="text-slate-700 dark:text-slate-200">
                  maxPublishedResources
                </span>
                <input
                  type="number"
                  min={0}
                  value={current.limits?.maxPublishedResources ?? 0}
                  onChange={(event) =>
                    handleLimitChange("maxPublishedResources", event.target.value)
                  }
                  className="min-h-11 rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                />
              </label>
              <label className="grid gap-1 text-sm">
                <span className="text-slate-700 dark:text-slate-200">
                  maxStaffUsers
                </span>
                <input
                  type="number"
                  min={0}
                  value={current.limits?.maxStaffUsers ?? 0}
                  onChange={(event) =>
                    handleLimitChange("maxStaffUsers", event.target.value)
                  }
                  className="min-h-11 rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                />
              </label>
              <label className="grid gap-1 text-sm">
                <span className="text-slate-700 dark:text-slate-200">
                  maxActiveReservationsPerMonth
                </span>
                <input
                  type="number"
                  min={0}
                  value={current.limits?.maxActiveReservationsPerMonth ?? 0}
                  onChange={(event) =>
                    handleLimitChange(
                      "maxActiveReservationsPerMonth",
                      event.target.value,
                    )
                  }
                  className="min-h-11 rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                />
              </label>
            </div>
          </article>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
            >
              {saving ? (
                t("rootModulesPage.actions.saving", { defaultValue: "Saving..." })
              ) : (
                <>
                  <Save size={16} />
                  {t("rootModulesPage.actions.save", {
                    defaultValue: "Guardar cambios",
                  })}
                </>
              )}
            </button>
          </div>
        </form>
      ) : null}

      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-200">
        <p className="inline-flex items-center gap-2 font-semibold">
          <ShieldCheck size={14} />
          {t("rootModulesPage.note.title", {
            defaultValue: "Backend enforcement requerido",
          })}
        </p>
        <p className="mt-1">
          {t("rootModulesPage.note.body", {
            defaultValue:
              "Los toggles de este panel deben estar reflejados en Functions con bloqueo 403 MODULE_DISABLED.",
          })}
        </p>
      </div>
    </section>
  );
};

export default RootModulesPage;
