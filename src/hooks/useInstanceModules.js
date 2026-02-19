import { useCallback, useEffect, useMemo, useState } from "react";
import { instanceSettingsService } from "../services/instanceSettingsService";

export const useInstanceModules = () => {
  const [settings, setSettings] = useState(() =>
    instanceSettingsService.getDefaults(),
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const nextSettings = await instanceSettingsService.getMain();
      setSettings(nextSettings);
      return nextSettings;
    } catch (err) {
      setError(String(err?.message || "No se pudo cargar instance_settings."));
      const defaults = instanceSettingsService.getDefaults();
      setSettings(defaults);
      return defaults;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const isEnabled = useCallback(
    (moduleKey) => {
      const key = String(moduleKey || "").trim();
      if (!key) return true;
      const enabledModules = Array.isArray(settings.enabledModules)
        ? settings.enabledModules
        : [];
      return enabledModules.includes(key);
    },
    [settings.enabledModules],
  );

  const getLimit = useCallback(
    (limitKey, fallbackValue = null) => {
      const key = String(limitKey || "").trim();
      if (!key) return fallbackValue;
      const rawValue = settings.limits?.[key];
      return rawValue === undefined || rawValue === null ? fallbackValue : rawValue;
    },
    [settings.limits],
  );

  const assertEnabled = useCallback(
    (moduleKey, message = "") => {
      if (isEnabled(moduleKey)) return { ok: true };
      return {
        ok: false,
        code: "MODULE_DISABLED",
        moduleKey,
        message:
          message ||
          "Este modulo no esta habilitado para esta instancia.",
      };
    },
    [isEnabled],
  );

  const saveSettings = useCallback(
    async (nextData, actor) => {
      setSaving(true);
      setError("");
      try {
        const saved = await instanceSettingsService.saveMain(nextData, actor);
        setSettings(saved);
        return saved;
      } catch (err) {
        setError(String(err?.message || "No se pudo guardar instance_settings."));
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [],
  );

  const modules = useMemo(
    () => (Array.isArray(settings.enabledModules) ? settings.enabledModules : []),
    [settings.enabledModules],
  );
  const limits = useMemo(() => settings.limits || {}, [settings.limits]);

  return {
    settings,
    modules,
    limits,
    loading,
    saving,
    error,
    isEnabled,
    getLimit,
    assertEnabled,
    refresh,
    saveSettings,
    moduleCatalog: instanceSettingsService.getModuleCatalog(),
  };
};
