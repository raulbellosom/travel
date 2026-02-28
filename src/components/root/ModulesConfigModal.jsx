import { useMemo, useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import {
  Save,
  Package,
  Gauge,
  ShieldCheck,
  Home,
  Users,
  BarChart3,
  Palette,
  Globe,
  MessageCircle,
  Calendar,
  CreditCard,
  Clock,
  Star,
  CalendarDays,
  Settings2,
  Zap,
} from "lucide-react";
import { Modal } from "../common/organisms";
import { Button, Toggle, Spinner, Badge } from "../common/atoms";
import Select from "../common/atoms/Select";

// Map module keys to Lucide icons
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

// Category visual config
const CATEGORY_STYLES = {
  core: {
    border: "border-l-cyan-500",
    dot: "bg-cyan-500",
    iconColor: "text-cyan-500",
  },
  account: {
    border: "border-l-indigo-500",
    dot: "bg-indigo-500",
    iconColor: "text-indigo-500",
  },
  booking: {
    border: "border-l-emerald-500",
    dot: "bg-emerald-500",
    iconColor: "text-emerald-500",
  },
  extras: {
    border: "border-l-amber-500",
    dot: "bg-amber-500",
    iconColor: "text-amber-500",
  },
  other: {
    border: "border-l-slate-400",
    dot: "bg-slate-400",
    iconColor: "text-slate-400",
  },
};

/**
 * Controlled number input that allows free editing (empty string, backspace)
 * and commits the parsed integer value only on blur.
 */
const LimitInput = ({ value, onChange, className }) => {
  const [raw, setRaw] = useState(String(value ?? 0));
  const isFocused = useRef(false);

  // Sync external value changes when not focused
  useEffect(() => {
    if (!isFocused.current) {
      setRaw(String(value ?? 0));
    }
  }, [value]);

  const handleFocus = () => {
    isFocused.current = true;
    // Select all on focus so the user can just type the new value
    if (raw === "0") setRaw("");
  };

  const handleChange = (e) => {
    const next = e.target.value;
    // Only allow digits (no decimals, no negatives in the raw string)
    if (next === "" || /^\d+$/.test(next)) {
      setRaw(next);
    }
  };

  const handleBlur = () => {
    isFocused.current = false;
    const parsed = raw === "" ? 0 : parseInt(raw, 10);
    const safe = Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
    setRaw(String(safe));
    onChange(safe);
  };

  return (
    <input
      type="text"
      inputMode="numeric"
      pattern="[0-9]*"
      value={raw}
      onFocus={handleFocus}
      onChange={handleChange}
      onBlur={handleBlur}
      className={className}
    />
  );
};

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
  account: {
    labelKey: "modulesModal.categories.account",
    defaultLabel: "Account & Preferences",
    modules: [
      "module.profile",
      "module.preferences.theme",
      "module.preferences.locale",
      "module.messaging.realtime",
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
    modules: ["module.reviews", "module.calendar.advanced"],
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
const EMPTY_ARRAY = [];
const ModulesConfigModal = ({
  isOpen,
  onClose,
  settings,
  moduleCatalog = EMPTY_ARRAY,
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
        leftIcon={saving ? Spinner : Save}
      >
        {saving
          ? t("modulesModal.saving", { defaultValue: "Guardando..." })
          : t("modulesModal.save", { defaultValue: "Guardar cambios" })}
      </Button>
    </div>
  );

  const formatModuleLabel = (key) => {
    const catalogLabel = moduleCatalog.find((item) => item.key === key)?.label;
    const labelFromI18n = t(
      `modulesModal.moduleLabels.${String(key || "").replaceAll(".", "_")}`,
      { defaultValue: catalogLabel || "" },
    );
    if (labelFromI18n) return labelFromI18n;

    // Fallback: convert module.resources to "Resources"
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
        <section className="space-y-3">
          <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
            <Settings2 size={14} className="text-cyan-500" />
            {t("modulesModal.plan.title", { defaultValue: "Plan" })}
          </h3>

          <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 dark:border-slate-700 dark:bg-slate-800/40">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-6">
              <div className="flex-1 space-y-1.5">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                  {t("modulesModal.plan.key", { defaultValue: "Tipo de plan" })}
                </label>
                <Select
                  value={current?.planKey || "starter"}
                  onChange={(value) => updateDraft({ planKey: value })}
                  options={PLAN_OPTIONS}
                  size="md"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                  {t("modulesModal.plan.statusLabel", {
                    defaultValue: "Estatus de la instancia",
                  })}
                </label>
                <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 sm:min-w-50 dark:border-slate-600 dark:bg-slate-800">
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`h-2.5 w-2.5 shrink-0 rounded-full ${current?.enabled !== false ? "bg-emerald-500 shadow-emerald-400/50 shadow-[0_0_6px_1px]" : "bg-slate-300 dark:bg-slate-600"}`}
                    />
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                      {t("modulesModal.plan.enabled", {
                        defaultValue: "Instancia habilitada",
                      })}
                    </span>
                  </div>
                  <Toggle
                      checked={current?.enabled !== false}
                      onChange={(checked) => updateDraft({ enabled: checked })}
                      variant="success"
                      size="sm"
                    />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Modules Section */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
              <Zap size={14} className="text-cyan-500" />
              {t("modulesModal.modules.title", { defaultValue: "Módulos" })}
            </h3>
            <Badge variant="info" size="sm">
              {enabledCount}{" "}
              {t("modulesModal.modules.enabled", { defaultValue: "activos" })}
            </Badge>
          </div>

          <div className="space-y-3">
            {Object.entries(groupedModules).map(([categoryKey, category]) => {
              const catStyle =
                CATEGORY_STYLES[categoryKey] || CATEGORY_STYLES.other;
              return (
                <div
                  key={categoryKey}
                  className={`rounded-xl border border-l-4 border-slate-200 bg-slate-50/50 p-4 dark:border-slate-700 dark:bg-slate-800/40 ${catStyle.border}`}
                >
                  <div className="mb-3 flex items-center gap-2">
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${catStyle.dot}`}
                    />
                    <h4 className="text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                      {t(category.labelKey, {
                        defaultValue: category.defaultLabel,
                      })}
                    </h4>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {category.modules.map((moduleKey) => {
                      const ModIcon = MODULE_ICONS[moduleKey] || Package;
                      const isOn = enabledSet.has(moduleKey);
                      return (
                        <button
                          key={moduleKey}
                          type="button"
                          onClick={(e) => { if (!(e.target instanceof HTMLInputElement)) handleToggle(moduleKey); }}
                          className={`flex min-w-0 items-center justify-between rounded-lg border px-3 py-2.5 text-left transition-all ${
                            isOn
                              ? "border-cyan-200 bg-cyan-50/80 dark:border-cyan-800/60 dark:bg-cyan-950/30"
                              : "border-slate-200 bg-white hover:border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:hover:border-slate-500"
                          }`}
                        >
                          <div className="flex min-w-0 items-center gap-2.5">
                            <ModIcon
                              size={15}
                              className={`shrink-0 ${isOn ? "text-cyan-500" : "text-slate-400"}`}
                            />
                            <span
                              className={`truncate text-sm font-medium ${isOn ? "text-cyan-700 dark:text-cyan-300" : "text-slate-600 dark:text-slate-300"}`}
                            >
                              {formatModuleLabel(moduleKey)}
                            </span>
                          </div>
                          <Toggle
                              checked={isOn}
                              onChange={() => handleToggle(moduleKey)}
                              size="sm"
                              variant={isOn ? "success" : "primary"}
                            />
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Limits Section */}
        <section className="space-y-3">
          <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
            <Gauge size={14} className="text-cyan-500" />
            {t("modulesModal.limits.title", { defaultValue: "Límites" })}
          </h3>

          <div className="grid gap-3 sm:grid-cols-3">
            {[
              {
                key: "maxPublishedResources",
                labelKey: "modulesModal.limits.maxResources",
                defaultLabel: "Recursos publicados",
                Icon: Home,
                value: current?.limits?.maxPublishedResources ?? 0,
                color: "text-cyan-500",
                bg: "bg-cyan-50 dark:bg-cyan-950/40",
              },
              {
                key: "maxStaffUsers",
                labelKey: "modulesModal.limits.maxStaff",
                defaultLabel: "Usuarios staff",
                Icon: Users,
                value: current?.limits?.maxStaffUsers ?? 0,
                color: "text-emerald-500",
                bg: "bg-emerald-50 dark:bg-emerald-950/40",
              },
              {
                key: "maxActiveReservationsPerMonth",
                labelKey: "modulesModal.limits.maxReservations",
                defaultLabel: "Reservas/mes",
                Icon: Calendar,
                value: current?.limits?.maxActiveReservationsPerMonth ?? 0,
                color: "text-amber-500",
                bg: "bg-amber-50 dark:bg-amber-950/40",
              },
            ].map(({ key, labelKey, defaultLabel, Icon, value, color, bg }) => (
              <div
                key={key}
                className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-800/60"
              >
                <div className="mb-2.5 flex items-center gap-2">
                  <span
                    className={`flex h-7 w-7 items-center justify-center rounded-lg ${bg}`}
                  >
                    <Icon size={14} className={color} />
                  </span>
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                    {t(labelKey, { defaultValue: defaultLabel })}
                  </label>
                </div>
                <LimitInput
                  value={value}
                  onChange={(parsed) => handleLimitChange(key, parsed)}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-900 outline-none transition focus:border-cyan-500 focus:bg-white focus:ring-2 focus:ring-cyan-500/20 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 dark:focus:bg-slate-700/60"
                />
              </div>
            ))}
          </div>
        </section>

        {/* Note */}
        <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 dark:border-emerald-900/50 dark:bg-emerald-950/30">
          <ShieldCheck
            size={16}
            className="mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-400"
          />
          <div className="text-xs text-emerald-800 dark:text-emerald-200">
            <p className="font-semibold">
              {t("modulesModal.note.title", {
                defaultValue: "Backend enforcement requerido",
              })}
            </p>
            <p className="mt-1 leading-relaxed">
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
