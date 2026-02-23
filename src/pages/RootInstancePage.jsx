import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Building2,
  Settings,
  Package,
  Gauge,
  CheckCircle2,
  XCircle,
  Users,
  Home,
  Calendar,
  ShieldCheck,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useInstanceModules } from "../hooks/useInstanceModules";
import { Badge, Button, Spinner } from "../components/common/atoms";
import ModulesConfigModal from "../components/root/ModulesConfigModal";

const RootInstancePage = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { settings, moduleCatalog, loading, error, saving, saveSettings } =
    useInstanceModules();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const enabledModulesCount = settings.enabledModules?.length || 0;
  const isEnabled = settings.enabled !== false;

  const getPlanBadgeVariant = (planKey) => {
    const variants = {
      starter: "default",
      pro: "info",
      elite: "success",
      custom: "warning",
    };
    return variants[planKey] || "default";
  };

  const formatModuleLabel = (key) => {
    const parts = key.split(".");
    const lastPart = parts[parts.length - 1];
    return lastPart.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  };

  return (
    <section className="space-y-6">
      {/* Header */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h1 className="inline-flex items-center gap-2 text-2xl font-semibold text-slate-900 dark:text-slate-100">
            <Building2 size={24} className="text-cyan-500" />
            {t("rootInstancePage.title", { defaultValue: "Instance Settings" })}
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            {t("rootInstancePage.subtitle", {
              defaultValue:
                "Resumen operativo de la instancia y configuración de módulos.",
            })}
          </p>
        </div>

        <Button
          variant="primary"
          iconLeft={Settings}
          onClick={() => setIsModalOpen(true)}
          disabled={loading}
        >
          {t("rootInstancePage.actions.configure", {
            defaultValue: "Configurar",
          })}
        </Button>
      </header>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Spinner size="lg" />
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200">
          {error}
        </div>
      )}

      {/* Content */}
      {!loading && !error && (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Instance Info Card */}
          <article className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900 lg:col-span-1">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">
              <Building2 size={16} className="text-cyan-500" />
              {t("rootInstancePage.info.title", { defaultValue: "Instancia" })}
            </h2>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600 dark:text-slate-400">
                  Key
                </span>
                <code className="rounded bg-slate-100 px-2 py-0.5 text-sm font-mono text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                  {settings.key || "main"}
                </code>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600 dark:text-slate-400">
                  {t("rootInstancePage.info.plan", { defaultValue: "Plan" })}
                </span>
                <Badge
                  variant={getPlanBadgeVariant(settings.planKey)}
                  size="sm"
                >
                  {(settings.planKey || "starter").toUpperCase()}
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600 dark:text-slate-400">
                  {t("rootInstancePage.info.status", {
                    defaultValue: "Estado",
                  })}
                </span>
                {isEnabled ? (
                  <span className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 size={14} />
                    {t("rootInstancePage.info.statusActive", {
                      defaultValue: "Activa",
                    })}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-sm font-medium text-red-600 dark:text-red-400">
                    <XCircle size={14} />
                    {t("rootInstancePage.info.statusInactive", {
                      defaultValue: "Inactiva",
                    })}
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600 dark:text-slate-400">
                  {t("rootInstancePage.info.activeModules", {
                    defaultValue: "Módulos activos",
                  })}
                </span>
                <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {enabledModulesCount}
                </span>
              </div>
            </div>
          </article>

          {/* Limits Card */}
          <article className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900 lg:col-span-1">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">
              <Gauge size={16} className="text-cyan-500" />
              {t("rootInstancePage.limits.title", { defaultValue: "Límites" })}
            </h2>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-cyan-50 dark:bg-cyan-950/50">
                  <Home
                    size={18}
                    className="text-cyan-600 dark:text-cyan-400"
                  />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {t("rootInstancePage.limits.resources", {
                      defaultValue: "Recursos publicados",
                    })}
                  </p>
                  <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                    {settings.limits?.maxPublishedResources ?? 0}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-950/50">
                  <Users
                    size={18}
                    className="text-emerald-600 dark:text-emerald-400"
                  />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {t("rootInstancePage.limits.staff", {
                      defaultValue: "Usuarios staff",
                    })}
                  </p>
                  <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                    {settings.limits?.maxStaffUsers ?? 0}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-50 dark:bg-amber-950/50">
                  <Calendar
                    size={18}
                    className="text-amber-600 dark:text-amber-400"
                  />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {t("rootInstancePage.limits.reservations", {
                      defaultValue: "Reservas/mes",
                    })}
                  </p>
                  <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                    {settings.limits?.maxActiveReservationsPerMonth ?? 0}
                  </p>
                </div>
              </div>
            </div>
          </article>

          {/* Active Modules Card */}
          <article className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900 lg:col-span-1">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">
              <Package size={16} className="text-cyan-500" />
              {t("rootInstancePage.modules.title", {
                defaultValue: "Módulos activos",
              })}
            </h2>

            {enabledModulesCount > 0 ? (
              <div className="flex flex-wrap gap-2">
                {settings.enabledModules?.slice(0, 8).map((moduleKey) => (
                  <Badge key={moduleKey} variant="success" size="sm">
                    {formatModuleLabel(moduleKey)}
                  </Badge>
                ))}
                {enabledModulesCount > 8 && (
                  <Badge variant="default" size="sm">
                    {t("rootInstancePage.modules.more", {
                      count: enabledModulesCount - 8,
                      defaultValue: "+{{count}} más",
                    })}
                  </Badge>
                )}
              </div>
            ) : (
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {t("rootInstancePage.modules.empty", {
                  defaultValue: "No hay módulos activos",
                })}
              </p>
            )}
          </article>
        </div>
      )}

      {/* Backend enforcement note */}
      {!loading && (
        <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900/50 dark:bg-emerald-950/30">
          <ShieldCheck
            size={18}
            className="mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-400"
          />
          <div className="text-xs text-emerald-800 dark:text-emerald-200">
            <p className="font-semibold">
              {t("rootInstancePage.note.title", {
                defaultValue: "Backend enforcement",
              })}
            </p>
            <p className="mt-1">
              {t("rootInstancePage.note.body", {
                defaultValue:
                  "create-lead: module.resources + module.leads + module.messaging.realtime. create-reservation-public: module.resources + module.booking.* + module.payments.online. create-payment-session: module.resources + module.booking.* + module.payments.online.",
              })}
            </p>
          </div>
        </div>
      )}

      {/* Modules Config Modal */}
      <ModulesConfigModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        settings={settings}
        moduleCatalog={moduleCatalog}
        saving={saving}
        onSave={saveSettings}
        userId={user?.$id}
        userRole={user?.role}
      />
    </section>
  );
};

export default RootInstancePage;
