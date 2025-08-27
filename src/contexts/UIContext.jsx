import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

const UIContext = createContext(null);

export function UIProvider({ children }) {
  const { i18n } = useTranslation();

  // 'light' | 'dark' | 'system'
  const [theme, setTheme] = useState(
    () => localStorage.getItem("theme") || "system"
  );

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
  useEffect(() => {
    localStorage.setItem("theme", theme);
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
  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
    document.documentElement.lang = lng;
  };

  // API pública
  const value = useMemo(
    () => ({
      theme,
      effectiveTheme: getEffectiveTheme(theme),
      changeTheme: (next) => setTheme(next), // 'light' | 'dark' | 'system'
      toggleTheme: () =>
        setTheme((t) => (getEffectiveTheme(t) === "dark" ? "light" : "dark")),
      language: i18n.language,
      changeLanguage,
    }),
    [theme, i18n.language]
  );

  return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
}

export const useUI = () => {
  const ctx = useContext(UIContext);
  if (!ctx) throw new Error("useUI must be used within a UIProvider");
  return ctx;
};
