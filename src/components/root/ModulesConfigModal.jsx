import { useMemo, useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Save, Package, Gauge, ShieldCheck } from "lucide-react";
import { Modal } from "../common/organisms";
import { Button, Toggle, Spinner, Badge } from "../common/atoms";
import Select from "../common/atoms/Select";

const PLAN_OPTIONS = [
  { value: "starter", label: "Starter" },
  { value: "pro", label: "Pro" },
  { value: "elite", label: "Elite" },
  { value: "custom", label: "Custom" },
];

// Module categories for better organization
const MODULE_CATEGORIES = {
  core: {
    labelKey: "modulesModal.categories.core",
    defaultLabel: "Core",
    modules: [
      "module.resources",
      "module.leads",
      "module.staff",
      "module.analytics.basic",
    ],
  },
  booking: {
    labelKey: "modulesModal.categories.booking",
    defaultLabel: "Booking & Payments",
    modules: [
      "module.booking.long_term",
      "module.booking.short_term",
      "module.booking.hourly",
      "module.payments.online",
    ],
  },
  extras: {
    labelKey: "modulesModal.categories.extras",
    defaultLabel: "Extras",
    modules: [
      "module.messaging.realtime",
      "module.reviews",
      "module.calendar.advanced",
    ],
  },
};

const toPositiveInt = (value, fallback = 0) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(0, Math.trunc(parsed));
};

/**
 * Modal for configuring instance modules, plan and limits.
 * Provides a responsive, well-organized form for root users.
 */
const ModulesConfigModal = ({
  isOpen,
  onClose,
  settings,
  moduleCatalog = [],
  saving,
  onSave,
  userId,
  userRole,
}) => {
  const { t } = useTranslation();
  const [draft, setDraft] = useState(null);

  // Reset draft when modal opens with new settings
  useEffect(() => {
    if (isOpen) {
      setDraft(null);
    }
  }, [isOpen, settings]);

  const current = draft || settings;

  const enabledSet = useMemo(
    () => new Set(current?.enabledModules || []),
    [current?.enabledModules],
  );

  // Group modules by category
  const groupedModules = useMemo(() => {
    const catalogKeys = new Set(moduleCatalog.map((m) => m.key));
    const groups = {};

    Object.entries(MODULE_CATEGORIES).forEach(([categoryKey, category]) => {
      const filteredModules = category.modules.filter((key) =>
        catalogKeys.has(key),
      );
      if (filteredModules.length > 0) {
        groups[categoryKey] = {
          ...category,
          modules: filteredModules,
        };
      }
    });

    // Add uncategorized modules
    const categorizedKeys = new Set(
      Object.values(MODULE_CATEGORIES).flatMap((c) => c.modules),
    );
    const uncategorized = moduleCatalog
      .filter((m) => !categorizedKeys.has(m.key))
      .map((m) => m.key);

    if (uncategorized.length > 0) {
      groups.other = {
        labelKey: "modulesModal.categories.other",
        defaultLabel: "Other",
        modules: uncategorized,
      };
    }

    return groups;
  }, [moduleCatalog]);

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
        ...(current?.limits || {}),
        [limitKey]: toPositiveInt(nextValue, 0),
      },
    });
  };

  const handleSave = async () => {
    await onSave?.(
      {
        planKey: current.planKey,
        enabledModules: current.enabledModules,
        limits: current.limits,
        enabled: current.enabled !== false,
      },
      {
        actorUserId: userId || "",
        actorRole: userRole || "root",
      },
    );
    setDraft(null);
    onClose?.();
  };

  const enabledCount = current?.enabledModules?.length || 0;

  const footer = (
    <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
      <Button variant="ghost" onClick={onClose} disabled={saving}>
        {t("common.cancel", { defaultValue: "Cancelar" })}
      </Button>
      <Button
        variant="primary"
        onClick={handleSave}
        disabled={saving}
        iconLeft={saving ? Spinner : Save}
      >
        {saving
          ? t("modulesModal.saving", { defaultValue: "Guardando..." })
          : t("modulesModal.save", { defaultValue: "Guardar cambios" })}
      </Button>
    </div>
  );

  const formatModuleLabel = (key) => {
    // Convert module.resources to "Resources"
    const parts = key.split(".");
    const lastPart = parts[parts.length - 1];
    return lastPart.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t("modulesModal.title", {
        defaultValue: "Configurar Plan y Módulos",
      })}
      description={t("modulesModal.description", {
        defaultValue:
          "Administra los módulos habilitados y límites de la instancia.",
      })}
      size="lg"
      footer={footer}
    >
      <div className="space-y-6">
        {/* Plan Section */}
        <section className="space-y-4">
          <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">
            <Package size={16} className="text-cyan-500" />
            {t("modulesModal.plan.title", { defaultValue: "Plan" })}
          </h3>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
                {t("modulesModal.plan.key", { defaultValue: "Tipo de plan" })}
              </label>
              <Select
                value={current?.planKey || "starter"}
                onChange={(value) => updateDraft({ planKey: value })}
                options={PLAN_OPTIONS}
                size="md"
              />
            </div>

            <div className="flex items-end">
              <Toggle
                checked={current?.enabled !== false}
                onChange={(checked) => updateDraft({ enabled: checked })}
                label={t("modulesModal.plan.enabled", {
                  defaultValue: "Instancia habilitada",
                })}
                variant="success"
                size="md"
              />
            </div>
          </div>
        </section>

        {/* Modules Section */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">
              <Package size={16} className="text-cyan-500" />
              {t("modulesModal.modules.title", { defaultValue: "Módulos" })}
            </h3>
            <Badge variant="info" size="sm">
              {enabledCount}{" "}
              {t("modulesModal.modules.enabled", { defaultValue: "activos" })}
            </Badge>
          </div>

          <div className="space-y-4">
            {Object.entries(groupedModules).map(([categoryKey, category]) => (
              <div
                key={categoryKey}
                className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 dark:border-slate-700 dark:bg-slate-800/50"
              >
                <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  {t(category.labelKey, {
                    defaultValue: category.defaultLabel,
                  })}
                </h4>
                <div className="grid gap-3 sm:grid-cols-2">
                  {category.modules.map((moduleKey) => (
                    <div
                      key={moduleKey}
                      className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2.5 transition-colors hover:border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:hover:border-slate-500"
                    >
                      <span className="text-sm text-slate-700 dark:text-slate-200">
                        {formatModuleLabel(moduleKey)}
                      </span>
                      <Toggle
                        checked={enabledSet.has(moduleKey)}
                        onChange={() => handleToggle(moduleKey)}
                        size="sm"
                        variant={
                          enabledSet.has(moduleKey) ? "success" : "primary"
                        }
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Limits Section */}
        <section className="space-y-4">
          <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">
            <Gauge size={16} className="text-cyan-500" />
            {t("modulesModal.limits.title", { defaultValue: "Límites" })}
          </h3>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-600 dark:text-slate-300">
                {t("modulesModal.limits.maxResources", {
                  defaultValue: "Recursos publicados",
                })}
              </label>
              <input
                type="number"
                min={0}
                value={current?.limits?.maxPublishedResources ?? 0}
                onChange={(e) =>
                  handleLimitChange("maxPublishedResources", e.target.value)
                }
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-600 dark:text-slate-300">
                {t("modulesModal.limits.maxStaff", {
                  defaultValue: "Usuarios staff",
                })}
              </label>
              <input
                type="number"
                min={0}
                value={current?.limits?.maxStaffUsers ?? 0}
                onChange={(e) =>
                  handleLimitChange("maxStaffUsers", e.target.value)
                }
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-600 dark:text-slate-300">
                {t("modulesModal.limits.maxReservations", {
                  defaultValue: "Reservas/mes",
                })}
              </label>
              <input
                type="number"
                min={0}
                value={current?.limits?.maxActiveReservationsPerMonth ?? 0}
                onChange={(e) =>
                  handleLimitChange(
                    "maxActiveReservationsPerMonth",
                    e.target.value,
                  )
                }
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>
          </div>
        </section>

        {/* Note */}
        <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900/50 dark:bg-emerald-950/30">
          <ShieldCheck
            size={18}
            className="mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-400"
          />
          <div className="text-xs text-emerald-800 dark:text-emerald-200">
            <p className="font-semibold">
              {t("modulesModal.note.title", {
                defaultValue: "Backend enforcement requerido",
              })}
            </p>
            <p className="mt-1">
              {t("modulesModal.note.body", {
                defaultValue:
                  "Los cambios deben estar reflejados en Functions con bloqueo 403 MODULE_DISABLED.",
              })}
            </p>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default ModulesConfigModal;
