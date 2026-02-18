import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Building2, Settings } from "lucide-react";
import { useInstanceModules } from "../hooks/useInstanceModules";
import { INTERNAL_ROUTES } from "../utils/internalRoutes";

const RootInstancePage = () => {
  const { t } = useTranslation();
  const { settings, loading, error } = useInstanceModules();

  return (
    <section className="space-y-5">
      <header className="space-y-1">
        <h1 className="inline-flex items-center gap-2 text-2xl font-semibold text-slate-900 dark:text-slate-100">
          <Building2 size={24} />
          {t("rootInstancePage.title", { defaultValue: "Instance Settings" })}
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          {t("rootInstancePage.subtitle", {
            defaultValue:
              "Resumen operativo de la instancia y acceso a configuracion de modulos.",
          })}
        </p>
      </header>

      {loading ? (
        <p className="text-sm text-slate-600 dark:text-slate-300">
          {t("common.loading")}
        </p>
      ) : null}

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200">
          {error}
        </div>
      ) : null}

      {!loading ? (
        <article className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
          <div className="grid gap-2 text-sm md:grid-cols-2">
            <p className="text-slate-700 dark:text-slate-200">
              <strong>key:</strong> {settings.key}
            </p>
            <p className="text-slate-700 dark:text-slate-200">
              <strong>planKey:</strong> {settings.planKey}
            </p>
            <p className="text-slate-700 dark:text-slate-200">
              <strong>enabled:</strong> {settings.enabled !== false ? "true" : "false"}
            </p>
            <p className="text-slate-700 dark:text-slate-200">
              <strong>enabledModules:</strong> {settings.enabledModules?.length || 0}
            </p>
          </div>

          <div className="mt-4 flex justify-end">
            <Link
              to={INTERNAL_ROUTES.rootModules}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
            >
              <Settings size={16} />
              {t("rootInstancePage.actions.manageModules", {
                defaultValue: "Manage modules",
              })}
            </Link>
          </div>
        </article>
      ) : null}
    </section>
  );
};

export default RootInstancePage;

