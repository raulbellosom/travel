import { useRef, useCallback, useEffect } from "react";
import { Home, Menu, Monitor, Moon, Sun } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import {
  ThemeAnimationType,
  useModeAnimation,
} from "react-theme-switch-animation";
import { useAuth } from "../../hooks/useAuth";
import { useUI } from "../../contexts/UIContext";
import BrandLogo from "../common/BrandLogo";
import GlobalSearch from "./GlobalSearch";
import DashboardUserDropdown from "./DashboardUserDropdown";

const DashboardNavbar = ({
  onMenuClick,
  desktopOffsetClass = "lg:left-72",
}) => {
  const { t, i18n } = useTranslation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { theme, changeTheme, changeLanguage } = useUI();
  const language = i18n.resolvedLanguage || i18n.language || "es";
  const currentTheme =
    theme === "light" || theme === "dark" || theme === "system"
      ? theme
      : "system";
  const nextTheme =
    currentTheme === "system"
      ? "light"
      : currentTheme === "light"
        ? "dark"
        : "system";
  const ThemeIcon =
    currentTheme === "light" ? Sun : currentTheme === "dark" ? Moon : Monitor;
  const themeToggleLabel = t("dashboardNavbar.toggleThemeTo", {
    theme: t(`theme.${nextTheme}`),
  });
  const nextLanguage = language === "es" ? "en" : "es";

  // react-theme-switch-animation for circle animation
  const {
    ref: animRef,
    toggleSwitchTheme,
    isDarkMode,
  } = useModeAnimation({
    animationType: ThemeAnimationType.CIRCLE,
    duration: 750,
  });

  // Sync the library's isDarkMode back to UIContext
  const prevIsDark = useRef(isDarkMode);
  useEffect(() => {
    if (prevIsDark.current !== isDarkMode) {
      prevIsDark.current = isDarkMode;
      changeTheme(isDarkMode ? "dark" : "light");
    }
  }, [isDarkMode, changeTheme]);

  const onToggleLanguage = () => {
    changeLanguage(nextLanguage);
  };

  const onToggleTheme = useCallback(() => {
    const willBeDark =
      nextTheme === "dark" ||
      (nextTheme === "system" &&
        window.matchMedia("(prefers-color-scheme: dark)").matches);
    const currentlyDark = isDarkMode;

    if (willBeDark !== currentlyDark) {
      // Effective theme flips → trigger the library's circle animation
      toggleSwitchTheme();
      // If "system" was chosen, persist that specific preference
      if (nextTheme === "system") {
        changeTheme("system");
      }
    } else {
      // Same effective theme → just persist preference
      changeTheme(nextTheme);
    }
  }, [nextTheme, isDarkMode, toggleSwitchTheme, changeTheme]);

  const onLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <header
      className={`fixed left-0 right-0 top-0 z-[70] border-b border-slate-200/80 bg-gradient-to-r from-slate-50/95 via-cyan-50/90 to-sky-50/90 shadow-sm backdrop-blur transition-[left] duration-300 dark:border-slate-800/80 dark:bg-[radial-gradient(circle_at_0%_0%,rgba(34,211,238,0.14),transparent_30%),radial-gradient(circle_at_100%_0%,rgba(16,185,129,0.12),transparent_34%),radial-gradient(circle_at_50%_100%,rgba(59,130,246,0.08),transparent_38%),linear-gradient(135deg,rgba(2,6,23,0.98)_0%,rgba(10,23,53,0.96)_45%,rgba(2,6,23,0.98)_100%)] ${desktopOffsetClass}`}
    >
      <div className="mx-auto grid h-[4.5rem] w-full max-w-[1520px] grid-cols-[auto_1fr_auto] items-center gap-2 px-3 sm:px-5 lg:px-8">
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={onMenuClick}
            className="inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-xl border border-slate-300 text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 lg:hidden"
            aria-label={t("dashboardNavbar.openMenu")}
          >
            <Menu size={20} />
          </button>

          <div className="flex items-center gap-2 lg:hidden">
            <BrandLogo
              size="sm"
              mode="adaptive"
              alt={t("navbar.brand")}
              className="rounded-xl"
            />
            <div className="leading-tight">
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                {t("navbar.brand")}
              </p>
              <h1 className="text-xs font-medium text-slate-600 dark:text-slate-300">
                {t("dashboardNavbar.title")}
              </h1>
            </div>
          </div>
        </div>

        <div className="hidden justify-center px-1 sm:flex">
          <GlobalSearch showMobileTrigger={false} />
        </div>

        <div className="flex items-center justify-end gap-1.5 sm:gap-2">
          <div className="sm:hidden">
            <GlobalSearch showDesktopInput={false} />
          </div>

          <button
            onClick={onToggleLanguage}
            className="inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-slate-300 text-[11px] font-semibold uppercase tracking-wide text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
            aria-label={t("dashboardNavbar.toggleLanguage")}
            title={t("dashboardNavbar.toggleLanguage")}
          >
            <span>{String(language || "es").toUpperCase()}</span>
          </button>

          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-slate-300 text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
            aria-label={t("nav.goToLanding")}
            title={t("nav.goToLanding")}
          >
            <Home size={18} />
          </a>

          <button
            ref={animRef}
            onClick={onToggleTheme}
            className="inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-slate-300 text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
            aria-label={themeToggleLabel}
            title={themeToggleLabel}
          >
            <ThemeIcon size={15} />
          </button>

          <DashboardUserDropdown
            user={user}
            onLogout={onLogout}
            showIdentity={Boolean(user)}
          />
        </div>
      </div>
    </header>
  );
};

export default DashboardNavbar;
