import { useEffect, useRef, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Check, Monitor, Moon, Sun } from "lucide-react";
import {
  ThemeAnimationType,
  useModeAnimation,
} from "react-theme-switch-animation";
import { useUI } from "../../../../contexts/UIContext";

const ThemeToggle = () => {
  const { t } = useTranslation();
  const { theme, effectiveTheme, changeTheme } = useUI();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  /**
   * react-theme-switch-animation manages its own internal dark mode state.
   * We do NOT pass `isDarkMode` or `onDarkModeChange` so the library
   * fully owns the toggle and class management inside its View Transition.
   */
  const {
    ref: animRef,
    toggleSwitchTheme,
    isDarkMode,
  } = useModeAnimation({
    animationType: ThemeAnimationType.CIRCLE,
    duration: 750,
  });

  const themes = [
    {
      value: "light",
      name: t("theme.light"),
      icon: Sun,
      description: t("theme.descriptions.light"),
    },
    {
      value: "dark",
      name: t("theme.dark"),
      icon: Moon,
      description: t("theme.descriptions.dark"),
    },
    {
      value: "system",
      name: t("theme.system"),
      icon: Monitor,
      description: t("theme.descriptions.system"),
    },
  ];

  const currentTheme = themes.find((item) => item.value === theme) || themes[2];
  const CurrentIcon = currentTheme.icon;

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Sync the library's isDarkMode back to UIContext for persistence
  const prevIsDark = useRef(isDarkMode);
  useEffect(() => {
    if (prevIsDark.current !== isDarkMode) {
      prevIsDark.current = isDarkMode;
      // Just persist the preference; the library already toggled the class
      changeTheme(isDarkMode ? "dark" : "light");
    }
  }, [isDarkMode, changeTheme]);

  const handleThemeChange = useCallback(
    (themeValue) => {
      const willBeDark =
        themeValue === "dark" ||
        (themeValue === "system" &&
          window.matchMedia("(prefers-color-scheme: dark)").matches);

      const currentlyDark = isDarkMode;

      if (willBeDark !== currentlyDark) {
        // Effective theme flips → trigger the library's circle animation
        toggleSwitchTheme();
        // If "system" was chosen, persist that specific preference
        if (themeValue === "system") {
          changeTheme("system");
        }
      } else {
        // Same effective theme → just persist preference
        changeTheme(themeValue);
      }

      setIsOpen(false);
    },
    [changeTheme, isDarkMode, toggleSwitchTheme],
  );

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        ref={animRef}
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex h-10 w-10 items-center justify-center rounded-md text-gray-700 transition-colors hover:bg-gray-50 hover:text-indigo-600 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-indigo-400"
        aria-label={t("theme.currentThemeAria", {
          theme: currentTheme.name,
        })}
        title={currentTheme.description}
      >
        <CurrentIcon size={20} />
      </button>

      {isOpen ? (
        <div className="absolute right-0 z-50 mt-2 w-56 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 dark:bg-gray-800">
          <div className="py-1" role="menu">
            {themes.map((themeOption) => {
              const Icon = themeOption.icon;
              const isSelected = theme === themeOption.value;

              return (
                <button
                  key={themeOption.value}
                  onClick={() => handleThemeChange(themeOption.value)}
                  className={`w-full space-x-3 px-4 py-3 text-left text-sm transition-colors ${
                    isSelected
                      ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-900 dark:text-indigo-400"
                      : "text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700"
                  } flex items-center`}
                  role="menuitem"
                >
                  <Icon
                    size={18}
                    className={
                      isSelected ? "text-indigo-600 dark:text-indigo-400" : ""
                    }
                  />
                  <div className="flex-1">
                    <div className="font-medium">{themeOption.name}</div>
                    {themeOption.value === "system" ? (
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {t("theme.currentEffective", {
                          mode:
                            effectiveTheme === "dark"
                              ? t("theme.dark")
                              : t("theme.light"),
                        })}
                      </div>
                    ) : null}
                  </div>
                  {isSelected ? (
                    <span className="text-indigo-600 dark:text-indigo-400">
                      <Check size={16} />
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default ThemeToggle;
