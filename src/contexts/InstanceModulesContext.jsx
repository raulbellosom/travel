import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { instanceSettingsService } from "../services/instanceSettingsService";
import { useAuth } from "../hooks/useAuth";

// eslint-disable-next-line react-refresh/only-export-components
export const InstanceModulesContext = createContext(null);

// eslint-disable-next-line react-refresh/only-export-components
export const useInstanceModulesContext = () => {
  const context = useContext(InstanceModulesContext);
  if (!context) {
    throw new Error(
      "useInstanceModulesContext must be used within InstanceModulesProvider",
    );
  }
  return context;
};

export function InstanceModulesProvider({ children }) {
  const { user, loading: authLoading } = useAuth();
  const [settings, setSettings] = useState(() =>
    instanceSettingsService.getDefaults(),
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const role = String(user?.role || "")
    .trim()
    .toLowerCase();
  const isRootUser = role === "root";

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
    if (authLoading) return;
    refresh();
  }, [authLoading, refresh]);

  const isEnabled = useCallback(
    (moduleKey) => {
      if (isRootUser) return true;
      if (settings.enabled === false) return false;
      const key = String(moduleKey || "").trim();
      if (!key) return true;
      const enabledModules = Array.isArray(settings.enabledModules)
        ? settings.enabledModules
        : [];
      return enabledModules.includes(key);
    },
    [isRootUser, settings.enabled, settings.enabledModules],
  );

  const getLimit = useCallback(
    (limitKey, fallbackValue = null) => {
      const key = String(limitKey || "").trim();
      if (!key) return fallbackValue;
      const rawValue = settings.limits?.[key];
      return rawValue === undefined || rawValue === null
        ? fallbackValue
        : rawValue;
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
          message || "Este modulo no esta habilitado para esta instancia.",
      };
    },
    [isEnabled],
  );

  const saveSettings = useCallback(
    async (nextData, actor) => {
      if (!isRootUser) {
        const accessError = new Error(
          "Solo root puede modificar instance_settings.",
        );
        accessError.code = "FORBIDDEN";
        setError(accessError.message);
        throw accessError;
      }

      setSaving(true);
      setError("");
      try {
        const saved = await instanceSettingsService.saveMain(nextData, actor);
        setSettings(saved);
        return saved;
      } catch (err) {
        setError(
          String(err?.message || "No se pudo guardar instance_settings."),
        );
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [isRootUser],
  );

  const modules = useMemo(
    () =>
      Array.isArray(settings.enabledModules) ? settings.enabledModules : [],
    [settings.enabledModules],
  );
  const limits = useMemo(() => settings.limits || {}, [settings.limits]);

  const value = useMemo(
    () => ({
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
      isRootUser,
    }),
    [
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
      isRootUser,
    ],
  );

  return (
    <InstanceModulesContext.Provider value={value}>
      {children}
    </InstanceModulesContext.Provider>
  );
}
