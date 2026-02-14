import {
  createContext,
  useContext,
  useLayoutEffect,
  useMemo,
  useState,
  useCallback,
} from "react";
import i18n from "../i18n";

const UIContext = createContext(null);
const THEME_STORAGE_KEY = "ui.theme.mode";
const LEGACY_THEME_STORAGE_KEY = "theme";

const readStoredTheme = () => {
  const nextStored = localStorage.getItem(THEME_STORAGE_KEY);
  if (
    nextStored === "light" ||
    nextStored === "dark" ||
    nextStored === "system"
  ) {
    return nextStored;
  }

  const legacyStored = localStorage.getItem(LEGACY_THEME_STORAGE_KEY);
  if (
    legacyStored === "light" ||
    legacyStored === "dark" ||
    legacyStored === "system"
  ) {
    return legacyStored;
  }

  return "system";
};

export function UIProvider({ children }) {
  // 'light' | 'dark' | 'system'
  const [theme, setTheme] = useState(() => readStoredTheme());

  // Tema efectivo (considera el sistema si eligió 'system')
  const getEffectiveTheme = (t) => {
    if (t === "system") {
      return window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
    }
    return t;
  };

  // Aplicar clase `.dark` en <html> y (opcional) data-theme
  const applyTheme = (t) => {
    const effective = getEffectiveTheme(t);
    const root = document.documentElement;
    root.classList.toggle("dark", effective === "dark");
    // Si quieres exponer un atributo para tus propios estilos (no para Tailwind):
    // root.setAttribute("data-theme", effective);
    // color-scheme ayuda con selects/scrollbars nativos:
    root.style.colorScheme = effective;
  };

  // Aplica al montar y cuando cambie 'theme'
  useLayoutEffect(() => {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
    applyTheme(theme);

    // Si es 'system', escucha cambios del SO
    if (theme === "system") {
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      const onChange = () => applyTheme("system");
      mq.addEventListener?.("change", onChange);
      return () => mq.removeEventListener?.("change", onChange);
    }
  }, [theme]);

  // Language management
  const changeLanguage = useCallback((lng) => {
    i18n.changeLanguage(lng);
    document.documentElement.lang = lng;
  }, []);

  // API pública
  const value = useMemo(
    () => ({
      theme,
      effectiveTheme: getEffectiveTheme(theme),
      changeTheme: (next) => setTheme(next), // 'light' | 'dark' | 'system'
      toggleTheme: () =>
        setTheme((t) => (getEffectiveTheme(t) === "dark" ? "light" : "dark")),
      changeLanguage,
    }),
    [theme, changeLanguage],
  );

  return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
}

export const useUI = () => {
  const ctx = useContext(UIContext);
  if (!ctx) throw new Error("useUI must be used within a UIProvider");
  return ctx;
};
