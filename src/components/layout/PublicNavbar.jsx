import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Menu,
  X,
  ChevronDown,
  ChevronRight,
  LogIn,
  Monitor,
  Moon,
  Sun,
} from "lucide-react";
import { motion as Motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import {
  ThemeAnimationType,
  useModeAnimation,
} from "react-theme-switch-animation";
import { cn } from "../../utils/cn";
import { useAuth } from "../../hooks/useAuth";
import { useUI } from "../../contexts/UIContext";
import BrandLogo from "../common/BrandLogo";
import UserDropdown from "../common/organisms/Navbar/UserDropdown";
import PublicSearch from "../navigation/PublicSearch";
import { buildPublicNavLinks } from "./publicNavbarConfig";
import env from "../../env";

const PublicNavbar = () => {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { theme, effectiveTheme, changeTheme, changeLanguage } = useUI();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isThemeDropdownOpen, setIsThemeDropdownOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);

  const hasHeroBehind =
    location.pathname === "/" || location.pathname.startsWith("/buscar");
  const solidNav = isScrolled || !hasHeroBehind;

  const themeDropdownRef = useRef(null);

  const languageCode = String(i18n.resolvedLanguage || i18n.language || "es")
    .toLowerCase()
    .startsWith("en")
    ? "en"
    : "es";
  const nextLanguage = languageCode === "es" ? "en" : "es";

  const currentTheme =
    theme === "light" || theme === "dark" || theme === "system"
      ? theme
      : "system";
  const ThemeIcon =
    currentTheme === "light" ? Sun : currentTheme === "dark" ? Moon : Monitor;

  const {
    ref: animRef,
    toggleSwitchTheme,
    isDarkMode,
  } = useModeAnimation({
    animationType: ThemeAnimationType.CIRCLE,
    duration: 750,
  });

  const prevIsDark = useRef(isDarkMode);
  useEffect(() => {
    if (prevIsDark.current !== isDarkMode) {
      prevIsDark.current = isDarkMode;
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
        toggleSwitchTheme();
        if (themeValue === "system") {
          changeTheme("system");
        }
      } else {
        changeTheme(themeValue);
      }

      setIsThemeDropdownOpen(false);
    },
    [changeTheme, isDarkMode, toggleSwitchTheme],
  );

  const nextThemeMobile =
    currentTheme === "system"
      ? "light"
      : currentTheme === "light"
        ? "dark"
        : "system";

  const handleThemeCycleMobile = useCallback(() => {
    changeTheme(nextThemeMobile);
  }, [changeTheme, nextThemeMobile]);

  const themes = useMemo(
    () => [
      { value: "light", name: t("theme.light"), icon: Sun },
      { value: "dark", name: t("theme.dark"), icon: Moon },
      { value: "system", name: t("theme.system"), icon: Monitor },
    ],
    [t],
  );

  const navLinks = useMemo(() => buildPublicNavLinks(t), [t]);

  useEffect(() => {
    const handleScroll = () => {
      const nextIsScrolled = window.scrollY > 20;
      setIsScrolled((previous) =>
        previous === nextIsScrolled ? previous : nextIsScrolled,
      );
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        themeDropdownRef.current &&
        !themeDropdownRef.current.contains(event.target)
      ) {
        setIsThemeDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const onLogout = useCallback(async () => {
    await logout();
    setIsMobileMenuOpen(false);
    navigate("/");
  }, [logout, navigate]);

  const onToggleLanguage = useCallback(() => {
    changeLanguage(nextLanguage);
  }, [changeLanguage, nextLanguage]);

  const circleBase =
    "inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border transition-colors";
  const circleScrolled =
    "bg-white/50 border-white/60 text-slate-700 hover:bg-white/70 backdrop-blur-sm dark:bg-slate-800/60 dark:border-slate-600/50 dark:text-slate-200 dark:hover:bg-slate-700/70";
  const circleTransparent =
    "bg-white/15 border-white/30 text-white hover:bg-white/25 backdrop-blur-sm";
  return (
    <>
      <header
        className={cn(
          "fixed top-0 left-0 right-0 z-[100] border-b transition-all duration-500",
          solidNav
            ? "border-black/[0.06] bg-white/60 py-3 backdrop-blur-xl backdrop-saturate-150 dark:border-white/[0.08] dark:bg-slate-900/70"
            : "border-transparent bg-transparent py-5",
        )}
      >
        <div className="container mx-auto px-4 md:px-6">
          <nav className="flex items-center justify-between gap-3">
            <Link
              to="/"
              className="relative z-50 flex flex-shrink-0 items-center gap-3"
            >
              <BrandLogo className="h-10 w-auto" />
              <div>
                <p
                  className={cn(
                    "text-base font-bold transition-colors sm:text-lg",
                    solidNav ? "text-slate-900 dark:text-white" : "text-white",
                  )}
                >
                  {env.app.name}
                </p>
              </div>
            </Link>

            <div className="hidden items-center space-x-1 lg:flex">
              {navLinks.map((link) => (
                <div key={link.name} className="group relative px-3 py-2">
                  <Link
                    to={link.path}
                    className={cn(
                      "flex items-center gap-1 text-sm font-semibold transition-colors",
                      solidNav
                        ? "text-slate-700 hover:text-cyan-600 dark:text-slate-200 dark:hover:text-cyan-400"
                        : "text-white/90 hover:text-white",
                    )}
                  >
                    {link.name}
                    <ChevronDown
                      size={14}
                      className="opacity-70 transition-transform duration-200 group-hover:rotate-180"
                    />
                  </Link>

                  <div className="invisible absolute top-full left-1/2 -translate-x-1/2 translate-y-2 pt-3 opacity-0 transition-all duration-200 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">
                    <div className="w-[26rem] overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-black/5 dark:bg-slate-800 dark:ring-slate-700">
                      <div className="grid grid-cols-2 gap-1 p-3">
                        {link.items.map((item) => {
                          const Icon = item.icon;
                          return (
                            <Link
                              key={item.to}
                              to={item.to}
                              className="group/item flex items-start gap-3 rounded-xl px-3 py-3 transition-colors hover:bg-cyan-50 dark:hover:bg-slate-700"
                            >
                              <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-cyan-100 text-cyan-600 transition-colors group-hover/item:bg-cyan-200 dark:bg-cyan-900/40 dark:text-cyan-400 dark:group-hover/item:bg-cyan-800/40">
                                <Icon size={18} />
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-semibold text-slate-800 dark:text-white">
                                  {item.label}
                                </p>
                                <p className="text-xs leading-snug text-slate-500 dark:text-slate-400">
                                  {item.desc}
                                </p>
                              </div>
                            </Link>
                          );
                        })}
                      </div>

                      <div className="border-t border-slate-100 px-4 py-2.5 dark:border-slate-700">
                        <Link
                          to={link.path}
                          className="flex items-center justify-between text-sm font-medium text-cyan-600 transition-colors hover:text-cyan-700 dark:text-cyan-400 dark:hover:text-cyan-300"
                        >
                          {t("client:common.viewAll", "View all")}
                          <ChevronRight size={14} />
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="hidden flex-1 items-center justify-center px-6 lg:flex">
              <PublicSearch
                variant={solidNav ? "default" : "transparent"}
                showMobileTrigger={false}
              />
            </div>

            <div className="hidden items-center gap-2 lg:flex">
              <button
                onClick={onToggleLanguage}
                className={cn(
                  circleBase,
                  solidNav ? circleScrolled : circleTransparent,
                )}
                aria-label={t("client:dashboardNavbar.toggleLanguage")}
                title={t("client:dashboardNavbar.toggleLanguage")}
              >
                <span className="text-[11px] font-semibold uppercase tracking-wide">
                  {String(nextLanguage || "en").toUpperCase()}
                </span>
              </button>

              <div className="relative" ref={themeDropdownRef}>
                <button
                  ref={animRef}
                  onClick={() => setIsThemeDropdownOpen((prev) => !prev)}
                  className={cn(
                    circleBase,
                    solidNav ? circleScrolled : circleTransparent,
                  )}
                  aria-label={t("theme.currentThemeAria", {
                    theme:
                      themes.find((item) => item.value === theme)?.name ||
                      t("theme.system"),
                  })}
                  title={
                    themes.find((item) => item.value === theme)?.name ||
                    t("theme.system")
                  }
                >
                  <ThemeIcon size={16} />
                </button>

                {isThemeDropdownOpen && (
                  <div className="absolute right-0 z-50 mt-2 w-52 overflow-hidden rounded-xl bg-white shadow-xl ring-1 ring-black/5 dark:bg-slate-800">
                    <div className="py-1" role="menu">
                      {themes.map((themeOption) => {
                        const Icon = themeOption.icon;
                        const isSelected = theme === themeOption.value;

                        return (
                          <button
                            key={themeOption.value}
                            onClick={() => handleThemeChange(themeOption.value)}
                            className={cn(
                              "flex w-full items-center gap-3 px-4 py-2.5 text-sm transition-colors",
                              isSelected
                                ? "bg-cyan-50 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400"
                                : "text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-700",
                            )}
                            role="menuitem"
                          >
                            <Icon
                              size={16}
                              className={
                                isSelected
                                  ? "text-cyan-600 dark:text-cyan-400"
                                  : ""
                              }
                            />
                            <span className="flex-1 text-left font-medium">
                              {themeOption.name}
                            </span>
                            {themeOption.value === "system" && (
                              <span className="text-[10px] text-slate-400 dark:text-slate-500">
                                {effectiveTheme === "dark"
                                  ? t("theme.dark")
                                  : t("theme.light")}
                              </span>
                            )}
                            {isSelected && (
                              <span className="text-cyan-600 dark:text-cyan-400">
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

              {user ? (
                <UserDropdown user={user} onLogout={onLogout} />
              ) : (
                <>
                  <Link
                    to="/login"
                    className={cn(
                      "flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-all",
                      solidNav
                        ? "bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
                        : "bg-white text-slate-900 shadow-md hover:bg-slate-100",
                    )}
                  >
                    <LogIn size={18} />
                    <span>{t("client:nav.login", "Log in")}</span>
                  </Link>
                  <Link
                    to="/register"
                    className="rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg transition-all hover:scale-105 hover:shadow-cyan-500/30 active:scale-95"
                  >
                    {t("client:nav.register", "Register")}
                  </Link>
                </>
              )}
            </div>

            <div className="relative z-50 flex items-center gap-1.5 lg:hidden">
              <PublicSearch
                showDesktopInput={false}
                showMobileTrigger={!isMobileMenuOpen}
                variant={solidNav ? "default" : "transparent"}
                mobileTriggerClassName={cn(
                  circleBase,
                  solidNav ? circleScrolled : circleTransparent,
                )}
                onMobileOpenChange={setIsMobileSearchOpen}
              />

              {!isMobileSearchOpen && (
                <>
                  <button
                    onClick={onToggleLanguage}
                    className={cn(
                      circleBase,
                      solidNav ? circleScrolled : circleTransparent,
                    )}
                    aria-label={t("client:dashboardNavbar.toggleLanguage")}
                  >
                    <span className="text-[10px] font-semibold uppercase tracking-wide">
                      {String(nextLanguage || "en").toUpperCase()}
                    </span>
                  </button>

                  <button
                    onClick={handleThemeCycleMobile}
                    className={cn(
                      circleBase,
                      solidNav ? circleScrolled : circleTransparent,
                    )}
                    aria-label={t("client:dashboardNavbar.toggleThemeTo", {
                      theme: t(`theme.${nextThemeMobile}`),
                    })}
                  >
                    <ThemeIcon size={15} />
                  </button>

                  {user ? (
                    <UserDropdown user={user} onLogout={onLogout} />
                  ) : (
                    <Link
                      to="/login"
                      className={cn(
                        circleBase,
                        solidNav ? circleScrolled : circleTransparent,
                      )}
                      aria-label={t("client:nav.login", "Log in")}
                    >
                      <LogIn size={18} />
                    </Link>
                  )}

                  <button
                    className={cn(
                      "rounded-lg p-1.5 transition-colors",
                      solidNav || isMobileMenuOpen
                        ? "text-slate-800 dark:text-white"
                        : "text-white",
                    )}
                    onClick={() =>
                      setIsMobileMenuOpen((previous) => !previous)
                    }
                    aria-label={t("nav.menu", "Menu")}
                  >
                    {isMobileMenuOpen ? (
                      <X size={22} />
                    ) : (
                      <Menu size={22} />
                    )}
                  </button>
                </>
              )}
            </div>
          </nav>
        </div>
      </header>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <Motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="fixed inset-0 z-200 bg-black/40 backdrop-blur-sm lg:hidden"
              onClick={() => setIsMobileMenuOpen(false)}
            />

            <Motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed top-0 right-0 bottom-0 z-210 w-[85%] max-w-md overflow-y-auto bg-white shadow-2xl dark:bg-slate-950 lg:hidden"
            >
              <div className="flex items-center justify-between border-b border-slate-100 px-6 pb-4 pt-6 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <BrandLogo className="h-9 w-auto" />
                  <p className="text-lg font-bold text-slate-900 dark:text-white">
                    {env.app.name}
                  </p>
                </div>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="flex flex-col gap-4 p-5">
                {navLinks.map((link) => (
                  <div
                    key={link.name}
                    className="border-b border-slate-100 pb-4 last:border-0 dark:border-slate-800"
                  >
                    <Link
                      to={link.path}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="mb-2.5 block text-base font-bold text-slate-900 dark:text-white"
                    >
                      {link.name}
                    </Link>
                    <div className="grid grid-cols-2 gap-1">
                      {link.items.map((item) => {
                        const Icon = item.icon;
                        return (
                          <Link
                            key={item.to}
                            to={item.to}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-[13px] text-slate-600 transition-colors hover:bg-cyan-50 dark:text-slate-300 dark:hover:bg-slate-800"
                          >
                            <Icon
                              size={15}
                              className="shrink-0 text-cyan-600 dark:text-cyan-400"
                            />
                            <span className="truncate">{item.label}</span>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </Motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default PublicNavbar;
