import {
  createContext,
  useContext,
  useLayoutEffect,
  useEffect,
  useMemo,
  useState,
  useCallback,
} from "react";
import i18n from "../i18n";
import { useAuth } from "../hooks/useAuth";

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
  const { user, preferences, updatePreferences } = useAuth();
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

  // Sync with user preferences from database when available
  useEffect(() => {
    if (preferences?.theme && preferences.theme !== theme) {
      setTheme(preferences.theme);
    }
    if (preferences?.locale && i18n.language !== preferences.locale) {
      i18n.changeLanguage(preferences.locale);
      document.documentElement.lang = preferences.locale;
    }
  }, [preferences?.theme, preferences?.locale]);

  const changeLanguage = useCallback(
    async (lng) => {
      i18n.changeLanguage(lng);
      document.documentElement.lang = lng;

      // Persist to database if user is authenticated
      if (user?.$id && updatePreferences) {
        try {
          await updatePreferences({ locale: lng });
        } catch (error) {
          console.error("Failed to persist language preference:", error);
        }
      }
    },
    [user?.$id, updatePreferences],
  );

  /**
   * changeThemeAnimated — triggers a circle-expand View Transition
   * animation centred on (x, y). Used by DashboardNavbar.
   */
  const changeThemeAnimated = useCallback(
    async (next, { x, y } = {}) => {
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

        // Persist to database if user is authenticated
        if (user?.$id && updatePreferences) {
          try {
            await updatePreferences({ theme: next });
          } catch (error) {
            console.error("Failed to persist theme preference:", error);
          }
        }

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

      // Persist to database if user is authenticated
      if (user?.$id && updatePreferences) {
        try {
          await updatePreferences({ theme: next });
        } catch (error) {
          console.error("Failed to persist theme preference:", error);
        }
      }

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
    },
    [user?.$id, updatePreferences],
  );

  const value = useMemo(
    () => ({
      theme,
      effectiveTheme: getEffectiveTheme(theme),
      changeTheme: async (next) => {
        setTheme(next);

        // Persist to database if user is authenticated
        if (user?.$id && updatePreferences) {
          try {
            await updatePreferences({ theme: next });
          } catch (error) {
            console.error("Failed to persist theme preference:", error);
          }
        }
      },
      changeThemeAnimated,
      toggleTheme: async () => {
        const newTheme = getEffectiveTheme(theme) === "dark" ? "light" : "dark";
        setTheme(newTheme);

        // Persist to database if user is authenticated
        if (user?.$id && updatePreferences) {
          try {
            await updatePreferences({ theme: newTheme });
          } catch (error) {
            console.error("Failed to persist theme preference:", error);
          }
        }
      },
      changeLanguage,
    }),
    [theme, changeLanguage, changeThemeAnimated, user?.$id, updatePreferences],
  );

  return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export const useUI = () => {
  const ctx = useContext(UIContext);
  if (!ctx) throw new Error("useUI must be used within a UIProvider");
  return ctx;
};
