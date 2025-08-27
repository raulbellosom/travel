import { createContext, useContext, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

const UIContext = createContext(null);

export function UIProvider({ children }) {
  const { i18n } = useTranslation();

  // Theme management con soporte para 'system'
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem("theme");
    return saved || "system";
  });

  // Función para obtener el tema efectivo
  const getEffectiveTheme = (currentTheme) => {
    if (currentTheme === "system") {
      return window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
    }
    return currentTheme;
  };

  // Aplicar tema al DOM
  useEffect(() => {
    const effectiveTheme = getEffectiveTheme(theme);
    const root = document.documentElement;

    root.classList.remove("light", "dark");
    root.classList.add(effectiveTheme);

    // Para mejor SEO y accesibilidad
    root.setAttribute("data-theme", effectiveTheme);

    // Guardar en localStorage
    localStorage.setItem("theme", theme);
  }, [theme]);

  // Escuchar cambios en preferencias del sistema
  useEffect(() => {
    if (theme === "system") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

      const handleChange = () => {
        const effectiveTheme = getEffectiveTheme("system");
        const root = document.documentElement;

        root.classList.remove("light", "dark");
        root.classList.add(effectiveTheme);
        root.setAttribute("data-theme", effectiveTheme);
      };

      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    }
  }, [theme]);

  // Language management
  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);

    // Para SEO: actualizar lang attribute
    document.documentElement.lang = lng;

    // Opcional: actualizar meta tags para SEO
    const existingMeta = document.querySelector('meta[name="language"]');
    if (existingMeta) {
      existingMeta.setAttribute("content", lng);
    } else {
      const meta = document.createElement("meta");
      meta.name = "language";
      meta.content = lng;
      document.head.appendChild(meta);
    }
  };

  // Theme management functions
  const changeTheme = (newTheme) => {
    setTheme(newTheme);
  };

  const toggleTheme = () => {
    const effectiveTheme = getEffectiveTheme(theme);
    setTheme(effectiveTheme === "dark" ? "light" : "dark");
  };

  const value = {
    // Theme
    theme,
    effectiveTheme: getEffectiveTheme(theme),
    changeTheme,
    toggleTheme,

    // Language
    language: i18n.language,
    changeLanguage,

    // Utility
    isSystemTheme: theme === "system",
  };

  return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
}

export const useUI = () => {
  const context = useContext(UIContext);

  if (!context) {
    throw new Error("useUI must be used within a UIProvider");
  }

  return context;
};
