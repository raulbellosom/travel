import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Building2,
  Settings,
  Package,
  Gauge,
  XCircle,
  Users,
  Home,
  Calendar,
  ShieldCheck,
  Hash,
  Zap,
  BarChart3,
  CreditCard,
  MessageCircle,
  Globe,
  Palette,
  Clock,
  Star,
  CalendarDays,
  Settings2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useInstanceModules } from "../hooks/useInstanceModules";
import { Badge, Button, Spinner } from "../components/common/atoms";
import ModulesConfigModal from "../components/root/ModulesConfigModal";

// Same icon map as ModulesConfigModal for consistency
const MODULE_ICONS = {
  "module.resources": Home,
  "module.leads": Users,
  "module.staff": Users,
  "module.analytics.basic": BarChart3,
  "module.profile": Settings2,
  "module.preferences.theme": Palette,
  "module.preferences.locale": Globe,
  "module.messaging.realtime": MessageCircle,
  "module.booking.long_term": Calendar,
  "module.booking.short_term": CalendarDays,
  "module.booking.hourly": Clock,
  "module.payments.online": CreditCard,
  "module.reviews": Star,
  "module.calendar.advanced": CalendarDays,
};

// Group module keys by visual category for display
const MODULE_DISPLAY_GROUPS = {
  Core: {
    color: "text-cyan-600 dark:text-cyan-400",
    bg: "bg-cyan-50 dark:bg-cyan-950/50",
    border: "border-cyan-200 dark:border-cyan-800/50",
    keys: [
      "module.resources",
      "module.leads",
      "module.staff",
      "module.analytics.basic",
    ],
  },
  "Cuenta y Preferencias": {
    color: "text-indigo-600 dark:text-indigo-400",
    bg: "bg-indigo-50 dark:bg-indigo-950/50",
    border: "border-indigo-200 dark:border-indigo-800/50",
    keys: [
      "module.profile",
      "module.preferences.theme",
      "module.preferences.locale",
      "module.messaging.realtime",
    ],
  },
  "Reservas y Pagos": {
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-50 dark:bg-emerald-950/50",
    border: "border-emerald-200 dark:border-emerald-800/50",
    keys: [
      "module.booking.long_term",
      "module.booking.short_term",
      "module.booking.hourly",
      "module.payments.online",
    ],
  },
  Extras: {
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-50 dark:bg-amber-950/50",
    border: "border-amber-200 dark:border-amber-800/50",
    keys: ["module.reviews", "module.calendar.advanced"],
  },
};

const BACKEND_RULES = [
  {
    fn: "create-lead",
    requires: ["module.resources", "module.leads", "module.messaging.realtime"],
  },
  {
    fn: "create-reservation-public",
    requires: [
      "module.resources",
      "module.booking.*",
      "module.payments.online",
    ],
  },
  {
    fn: "create-payment-session",
    requires: [
      "module.resources",
      "module.booking.*",
      "module.payments.online",
    ],
  },
];

const RootInstancePage = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { settings, moduleCatalog, loading, error, saving, saveSettings } =
    useInstanceModules();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [backendExpanded, setBackendExpanded] = useState(false);

  const enabledModulesCount = settings.enabledModules?.length || 0;
  const isEnabled = settings.enabled !== false;
  const enabledSet = new Set(settings.enabledModules || []);

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

  const limitItems = [
    {
      key: "maxPublishedResources",
      label: t("rootInstancePage.limits.resources", {
        defaultValue: "Recursos publicados",
      }),
      value: settings.limits?.maxPublishedResources ?? 0,
      Icon: Home,
      color: "text-cyan-600 dark:text-cyan-400",
      bg: "bg-cyan-50 dark:bg-cyan-950/40",
      ring: "ring-cyan-200 dark:ring-cyan-800/50",
    },
    {
      key: "maxStaffUsers",
      label: t("rootInstancePage.limits.staff", {
        defaultValue: "Usuarios staff",
      }),
      value: settings.limits?.maxStaffUsers ?? 0,
      Icon: Users,
      color: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-50 dark:bg-emerald-950/40",
      ring: "ring-emerald-200 dark:ring-emerald-800/50",
    },
    {
      key: "maxActiveReservationsPerMonth",
      label: t("rootInstancePage.limits.reservations", {
        defaultValue: "Reservas/mes",
      }),
      value: settings.limits?.maxActiveReservationsPerMonth ?? 0,
      Icon: Calendar,
      color: "text-amber-600 dark:text-amber-400",
      bg: "bg-amber-50 dark:bg-amber-950/40",
      ring: "ring-amber-200 dark:ring-amber-800/50",
    },
  ];

  return (
    <section className="space-y-6">
      {/* Header */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h1 className="inline-flex items-center gap-2 text-2xl font-semibold text-slate-900 dark:text-slate-100">
            <Building2 size={24} className="text-cyan-500" />
            {t("rootInstancePage.title", {
              defaultValue: "Configuración de Instancia",
            })}
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
          leftIcon={Settings}
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
        <>
          {/* Top row: Instance info + Limits */}
          <div className="grid gap-4 lg:grid-cols-5">
            {/* Instance Info Card — takes 2 cols */}
            <article className="rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900 lg:col-span-2">
              <div className="border-b border-slate-100 px-5 py-4 dark:border-slate-800">
                <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                  <Building2 size={13} className="text-cyan-500" />
                  {t("rootInstancePage.info.title", {
                    defaultValue: "Instancia",
                  })}
                </h2>
              </div>

              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {/* Key */}
                <div className="flex items-center justify-between px-5 py-3.5">
                  <span className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                    <Hash size={13} className="opacity-60" />
                    Key
                  </span>
                  <code className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-xs text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                    {settings.key || "main"}
                  </code>
                </div>

                {/* Plan */}
                <div className="flex items-center justify-between px-5 py-3.5">
                  <span className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                    <Package size={13} className="opacity-60" />
                    {t("rootInstancePage.info.plan", { defaultValue: "Plan" })}
                  </span>
                  <Badge
                    variant={getPlanBadgeVariant(settings.planKey)}
                    size="sm"
                  >
                    {(settings.planKey || "starter").toUpperCase()}
                  </Badge>
                </div>

                {/* Status */}
                <div className="flex items-center justify-between px-5 py-3.5">
                  <span className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                    <Zap size={13} className="opacity-60" />
                    {t("rootInstancePage.info.status", {
                      defaultValue: "Estado",
                    })}
                  </span>
                  {isEnabled ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:ring-emerald-800/50">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_5px_1px] shadow-emerald-400/60" />
                      {t("rootInstancePage.info.statusActive", {
                        defaultValue: "Activa",
                      })}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700 ring-1 ring-red-200 dark:bg-red-950/40 dark:text-red-400 dark:ring-red-800/50">
                      <XCircle size={12} />
                      {t("rootInstancePage.info.statusInactive", {
                        defaultValue: "Inactiva",
                      })}
                    </span>
                  )}
                </div>

                {/* Active modules count */}
                <div className="flex items-center justify-between px-5 py-3.5">
                  <span className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                    <Settings2 size={13} className="opacity-60" />
                    {t("rootInstancePage.info.activeModules", {
                      defaultValue: "Módulos activos",
                    })}
                  </span>
                  <span className="rounded-full bg-cyan-50 px-2.5 py-0.5 text-xs font-bold text-cyan-700 ring-1 ring-cyan-200 dark:bg-cyan-950/40 dark:text-cyan-400 dark:ring-cyan-800/50">
                    {enabledModulesCount}
                  </span>
                </div>
              </div>
            </article>

            {/* Limits Card — takes 3 cols */}
            <article className="rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900 lg:col-span-3">
              <div className="border-b border-slate-100 px-5 py-4 dark:border-slate-800">
                <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                  <Gauge size={13} className="text-cyan-500" />
                  {t("rootInstancePage.limits.title", {
                    defaultValue: "Límites",
                  })}
                </h2>
              </div>

              <div className="grid grid-cols-3 divide-x divide-slate-100 dark:divide-slate-800">
                {limitItems.map(
                  ({ key, label, value, Icon, color, bg, ring }) => (
                    <div
                      key={key}
                      className="flex flex-col items-center justify-center gap-2 px-3 py-6 text-center"
                    >
                      <span
                        className={`flex h-10 w-10 items-center justify-center rounded-xl ring-1 ${bg} ${ring}`}
                      >
                        <Icon size={18} className={color} />
                      </span>
                      <p className="text-2xl font-bold tabular-nums text-slate-900 dark:text-slate-100">
                        {value}
                      </p>
                      <p className="text-[11px] leading-tight text-slate-500 dark:text-slate-400">
                        {label}
                      </p>
                    </div>
                  ),
                )}
              </div>
            </article>
          </div>

          {/* Modules Card */}
          <article className="rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
            <div className="border-b border-slate-100 px-5 py-4 dark:border-slate-800">
              <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                <Package size={13} className="text-cyan-500" />
                {t("rootInstancePage.modules.title", {
                  defaultValue: "Módulos activos",
                })}
              </h2>
            </div>

            {enabledModulesCount > 0 ? (
              <div className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-4">
                {Object.entries(MODULE_DISPLAY_GROUPS).map(
                  ([groupName, group]) => {
                    const activeInGroup = group.keys.filter((k) =>
                      enabledSet.has(k),
                    );
                    return (
                      <div key={groupName} className="space-y-2">
                        <p
                          className={`text-[10px] font-bold uppercase tracking-widest ${group.color}`}
                        >
                          {groupName}
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {group.keys.map((moduleKey) => {
                            const ModIcon = MODULE_ICONS[moduleKey] || Package;
                            const isActive = enabledSet.has(moduleKey);
                            return (
                              <span
                                key={moduleKey}
                                className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[11px] font-medium transition-opacity ${
                                  isActive
                                    ? `${group.bg} ${group.border} ${group.color}`
                                    : "border-slate-100 bg-slate-50 text-slate-400 opacity-50 dark:border-slate-800 dark:bg-slate-800/60"
                                }`}
                              >
                                <ModIcon size={10} />
                                {formatModuleLabel(moduleKey)}
                              </span>
                            );
                          })}
                          {/* Any extra keys not in standard groups */}
                          {settings.enabledModules
                            ?.filter(
                              (k) =>
                                !Object.values(MODULE_DISPLAY_GROUPS).some(
                                  (g) => g.keys.includes(k),
                                ) && groupName === "Extras",
                            )
                            .map((moduleKey) => (
                              <span
                                key={moduleKey}
                                className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[11px] font-medium ${group.bg} ${group.border} ${group.color}`}
                              >
                                <Package size={10} />
                                {formatModuleLabel(moduleKey)}
                              </span>
                            ))}
                        </div>
                      </div>
                    );
                  },
                )}
              </div>
            ) : (
              <p className="px-5 py-8 text-center text-sm text-slate-500 dark:text-slate-400">
                {t("rootInstancePage.modules.empty", {
                  defaultValue: "No hay módulos activos",
                })}
              </p>
            )}
          </article>

          {/* Backend Enforcement Rules — collapsible */}
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 dark:border-emerald-900/50 dark:bg-emerald-950/30">
            <button
              type="button"
              onClick={() => setBackendExpanded((p) => !p)}
              className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left"
            >
              <div className="flex items-center gap-2.5">
                <ShieldCheck
                  size={16}
                  className="shrink-0 text-emerald-600 dark:text-emerald-400"
                />
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                  {t("rootInstancePage.note.title", {
                    defaultValue: "Backend Enforcement",
                  })}
                </span>
              </div>
              {backendExpanded ? (
                <ChevronUp
                  size={14}
                  className="shrink-0 text-emerald-600 dark:text-emerald-400"
                />
              ) : (
                <ChevronDown
                  size={14}
                  className="shrink-0 text-emerald-600 dark:text-emerald-400"
                />
              )}
            </button>

            {backendExpanded && (
              <div className="divide-y divide-emerald-200/60 border-t border-emerald-200 px-4 pb-4 dark:divide-emerald-900/40 dark:border-emerald-900/50">
                {BACKEND_RULES.map((rule) => (
                  <div
                    key={rule.fn}
                    className="flex flex-wrap items-start gap-3 py-3"
                  >
                    <code className="shrink-0 rounded bg-emerald-100 px-2 py-0.5 font-mono text-[11px] font-semibold text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300">
                      {rule.fn}
                    </code>
                    <div className="flex flex-1 flex-wrap gap-1.5">
                      {rule.requires.map((req) => (
                        <span
                          key={req}
                          className="rounded border border-emerald-200 bg-white/60 px-1.5 py-0.5 font-mono text-[10px] text-emerald-700 dark:border-emerald-800/50 dark:bg-emerald-950/40 dark:text-emerald-400"
                        >
                          {req}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
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
