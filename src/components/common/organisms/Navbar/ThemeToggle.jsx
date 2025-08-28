import { useTranslation } from "react-i18next";
import { useUI } from "../../../../contexts/UIContext";
import { Sun, Moon, Monitor } from "lucide-react";
import { useState, useRef, useEffect } from "react";

const ThemeToggle = () => {
  const { t } = useTranslation();
  const { theme, effectiveTheme, changeTheme } = useUI();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const themes = [
    {
      value: "light",
      name: t("theme.light"),
      icon: Sun,
      description: "Tema claro",
    },
    {
      value: "dark",
      name: t("theme.dark"),
      icon: Moon,
      description: "Tema oscuro",
    },
    {
      value: "system",
      name: t("theme.system"),
      icon: Monitor,
      description: "Seguir preferencias del sistema",
    },
  ];

  const currentTheme = themes.find((t) => t.value === theme) || themes[2];
  const CurrentIcon = currentTheme.icon;

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleThemeChange = (themeValue) => {
    changeTheme(themeValue);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center w-10 h-10 rounded-md text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        aria-label={`Current theme: ${currentTheme.name}`}
        title={currentTheme.description}
      >
        <CurrentIcon size={20} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-50">
          <div className="py-1" role="menu">
            {themes.map((themeOption) => {
              const Icon = themeOption.icon;
              const isSelected = theme === themeOption.value;

              return (
                <button
                  key={themeOption.value}
                  onClick={() => handleThemeChange(themeOption.value)}
                  className={`
                    w-full text-left px-4 py-3 text-sm transition-colors flex items-center space-x-3
                    ${
                      isSelected
                        ? "bg-indigo-50 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400"
                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                    }
                  `}
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
                    {themeOption.value === "system" && (
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {effectiveTheme === "dark"
                          ? "Actualmente oscuro"
                          : "Actualmente claro"}
                      </div>
                    )}
                  </div>
                  {isSelected && (
                    <span className="text-indigo-600 dark:text-indigo-400">
                      ✓
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default ThemeToggle;
