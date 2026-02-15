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
  const [theme, setTheme] = useState(() => readStoredTheme());

  const getEffectiveTheme = (t) => {
    if (t === "system") {
      return window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
    }
    return t;
  };

  // Aplicar clase `.dark` en <html>
  const applyTheme = useCallback((t) => {
    const effective = getEffectiveTheme(t);
    const root = document.documentElement;
    root.classList.toggle("dark", effective === "dark");
    root.style.colorScheme = effective;
  }, []);

  // Aplica al montar y cuando cambie 'theme'
  useLayoutEffect(() => {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
    const effective = getEffectiveTheme(theme);
    localStorage.setItem(LEGACY_THEME_STORAGE_KEY, effective);
    applyTheme(theme);

    if (theme === "system") {
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      const onChange = () => {
        const eff = getEffectiveTheme("system");
        localStorage.setItem(LEGACY_THEME_STORAGE_KEY, eff);
        applyTheme("system");
      };
      mq.addEventListener?.("change", onChange);
      return () => mq.removeEventListener?.("change", onChange);
    }
  }, [theme, applyTheme]);

  const changeLanguage = useCallback((lng) => {
    i18n.changeLanguage(lng);
    document.documentElement.lang = lng;
  }, []);

  /**
   * changeThemeAnimated — triggers a circle-expand View Transition
   * animation centred on (x, y). Used by DashboardNavbar.
   */
  const changeThemeAnimated = useCallback(async (next, { x, y } = {}) => {
    const effective = getEffectiveTheme(next);
    const root = document.documentElement;

    const apply = () => {
      root.classList.toggle("dark", effective === "dark");
      root.style.colorScheme = effective;
      localStorage.setItem(THEME_STORAGE_KEY, next);
      localStorage.setItem(LEGACY_THEME_STORAGE_KEY, effective);
    };

    if (
      !document.startViewTransition ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      x == null ||
      y == null
    ) {
      apply();
      setTheme(next);
      return;
    }

    // Inject base styles for view transition
    const baseStyleId = "theme-vt-base";
    if (!document.getElementById(baseStyleId)) {
      const style = document.createElement("style");
      style.id = baseStyleId;
      style.textContent = `
          ::view-transition-old(root),
          ::view-transition-new(root) {
            animation: none;
            mix-blend-mode: normal;
          }
        `;
      document.head.appendChild(style);
    }

    const maxRadius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y),
    );

    const transition = document.startViewTransition(() => {
      apply();
    });

    // Update React state without retriggering applyTheme
    // (apply() already handled everything synchronously)
    setTheme(next);

    try {
      await transition.ready;
      document.documentElement.animate(
        {
          clipPath: [
            `circle(0px at ${x}px ${y}px)`,
            `circle(${maxRadius}px at ${x}px ${y}px)`,
          ],
        },
        {
          duration: 500,
          easing: "ease-in-out",
          pseudoElement: "::view-transition-new(root)",
        },
      );
    } catch {
      // View transition skipped
    }
  }, []);

  const value = useMemo(
    () => ({
      theme,
      effectiveTheme: getEffectiveTheme(theme),
      changeTheme: (next) => setTheme(next),
      changeThemeAnimated,
      toggleTheme: () =>
        setTheme((t) => (getEffectiveTheme(t) === "dark" ? "light" : "dark")),
      changeLanguage,
    }),
    [theme, changeLanguage, changeThemeAnimated],
  );

  return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
}

export const useUI = () => {
  const ctx = useContext(UIContext);
  if (!ctx) throw new Error("useUI must be used within a UIProvider");
  return ctx;
};
