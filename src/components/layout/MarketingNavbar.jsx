import React, { useState, useEffect, useRef, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Menu, X, LogIn, Monitor, Moon, Sun } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
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
import env from "../../env";

const MarketingNavbar = () => {
  const { t, i18n } = useTranslation();

  const sections = [
    { id: "que-es", label: t("landing:nav.sections.whatIs", "¿Qué es?") },
    {
      id: "caracteristicas",
      label: t("landing:nav.sections.features", "Características"),
    },
    {
      id: "plataforma",
      label: t("landing:nav.sections.platform", "Plataforma"),
    },
    {
      id: "como-funciona",
      label: t("landing:nav.sections.howItWorks", "Cómo funciona"),
    },
  ];
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { theme, effectiveTheme, changeTheme, changeLanguage } = useUI();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isThemeDropdownOpen, setIsThemeDropdownOpen] = useState(false);
  const themeDropdownRef = useRef(null);

  // Language
  const languageCode = String(i18n.resolvedLanguage || i18n.language || "es")
    .toLowerCase()
    .startsWith("en")
    ? "en"
    : "es";
  const nextLanguage = languageCode === "es" ? "en" : "es";

  // Theme
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

  const themes = [
    { value: "light", name: t("theme.light"), icon: Sun },
    { value: "dark", name: t("theme.dark"), icon: Moon },
    { value: "system", name: t("theme.system"), icon: Monitor },
  ];

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileMenuOpen]);

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

  const scrollToSection = (id) => {
    setIsMobileMenuOpen(false);
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const onLogout = async () => {
    await logout();
    setIsMobileMenuOpen(false);
    navigate("/");
  };

  const onToggleLanguage = () => changeLanguage(nextLanguage);

  const circleBase =
    "inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border transition-colors";
  const circleScrolled =
    "bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-700";
  const circleTransparent =
    "bg-slate-200/50 border-slate-300/50 text-slate-700 hover:bg-slate-200/70 dark:bg-white/15 dark:border-white/30 dark:text-white dark:hover:bg-white/25 backdrop-blur-sm";
  const circleMobile =
    "bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-700";

  return (
    <>
      <header
        className={cn(
          "fixed top-0 left-0 right-0 z-[100] transition-all duration-300",
          isScrolled
            ? "bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-sm py-3"
            : "bg-transparent py-5",
        )}
      >
        <div className="container mx-auto px-4 md:px-6">
          <nav className="flex items-center justify-between gap-3">
            {/* Logo */}
            <Link
              to="/"
              className="flex-shrink-0 relative z-50 flex items-center gap-3"
            >
              <BrandLogo className="h-10 w-auto" />
              <div>
                <p
                  className={cn(
                    "text-base sm:text-lg font-bold transition-colors",
                    isScrolled
                      ? "text-slate-900 dark:text-white"
                      : "text-white",
                  )}
                >
                  {env.app.name}
                </p>
              </div>
            </Link>

            {/* Desktop Section Links */}
            <div className="hidden lg:flex items-center gap-1">
              {sections.map((s) => (
                <button
                  key={s.id}
                  onClick={() => scrollToSection(s.id)}
                  className={cn(
                    "px-4 py-2 text-sm font-semibold rounded-full transition-colors",
                    isScrolled
                      ? "text-slate-700 hover:text-cyan-600 hover:bg-cyan-50 dark:text-slate-200 dark:hover:text-cyan-400 dark:hover:bg-slate-800"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50 dark:text-white/80 dark:hover:text-white dark:hover:bg-white/10",
                  )}
                >
                  {s.label}
                </button>
              ))}
            </div>

            {/* Right Actions — Desktop */}
            <div className="hidden lg:flex items-center gap-2">
              {/* Language */}
              <button
                onClick={onToggleLanguage}
                className={cn(
                  circleBase,
                  isScrolled ? circleScrolled : circleTransparent,
                )}
                aria-label={t("dashboardNavbar.toggleLanguage")}
                title={t("dashboardNavbar.toggleLanguage")}
              >
                <span className="text-[11px] font-semibold uppercase tracking-wide">
                  {String(nextLanguage || "en").toUpperCase()}
                </span>
              </button>

              {/* Theme */}
              <div className="relative" ref={themeDropdownRef}>
                <button
                  ref={animRef}
                  onClick={() => setIsThemeDropdownOpen((prev) => !prev)}
                  className={cn(
                    circleBase,
                    isScrolled ? circleScrolled : circleTransparent,
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
                  <div className="absolute right-0 z-50 mt-2 w-52 rounded-xl bg-white shadow-xl ring-1 ring-black/5 dark:bg-slate-800 overflow-hidden">
                    <div className="py-1" role="menu">
                      {themes.map((themeOption) => {
                        const Icon = themeOption.icon;
                        const isSelected = theme === themeOption.value;
                        return (
                          <button
                            key={themeOption.value}
                            onClick={() => handleThemeChange(themeOption.value)}
                            className={cn(
                              "w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors",
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
                            <span className="font-medium flex-1 text-left">
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
                  <button
                    onClick={() => {
                      document
                        .getElementById("contacto")
                        ?.scrollIntoView({ behavior: "smooth" });
                    }}
                    className="px-5 py-2.5 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold text-sm shadow-lg hover:shadow-cyan-500/30 hover:scale-105 transition-all active:scale-95"
                  >
                    {t("landing:nav.contact", "Contacto")}
                  </button>
                </>
              )}
            </div>

            {/* Mobile hamburger */}
            <div className="flex items-center gap-2 lg:hidden relative z-50">
              <button
                className={cn(
                  "p-2 rounded-lg transition-colors",
                  isScrolled || isMobileMenuOpen
                    ? "text-slate-800 dark:text-white"
                    : "text-slate-700 dark:text-white",
                )}
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
              </button>
            </div>
          </nav>
        </div>
      </header>

      {/* Mobile Sidebar Drawer — outside header to avoid backdrop-blur clipping */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            {/* Blurred backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="fixed inset-0 z-200 bg-black/40 backdrop-blur-sm lg:hidden"
              onClick={() => setIsMobileMenuOpen(false)}
            />

            {/* Sidebar panel */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed top-0 right-0 bottom-0 z-210 w-[85%] max-w-sm bg-white dark:bg-slate-900 shadow-2xl lg:hidden overflow-y-auto"
            >
              {/* Sidebar header */}
              <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <BrandLogo className="h-9 w-auto" />
                  <p className="text-lg font-bold text-slate-900 dark:text-white">
                    {env.app.name}
                  </p>
                </div>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2 rounded-lg text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="flex flex-col gap-6 p-6">
                {/* Section links */}
                <div className="space-y-1">
                  {sections.map((s, idx) => (
                    <motion.button
                      key={s.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 + idx * 0.05 }}
                      onClick={() => scrollToSection(s.id)}
                      className="w-full text-left px-4 py-3 rounded-xl text-lg font-bold text-slate-900 dark:text-white hover:bg-cyan-50 dark:hover:bg-slate-800 transition-colors"
                    >
                      {s.label}
                    </motion.button>
                  ))}
                </div>

                {/* Language & Theme */}
                <div className="flex items-center gap-3 py-2 border-t border-slate-100 dark:border-slate-800 pt-4">
                  <button
                    onClick={onToggleLanguage}
                    className={cn(circleBase, circleMobile)}
                    aria-label={t("dashboardNavbar.toggleLanguage")}
                  >
                    <span className="text-[11px] font-semibold uppercase tracking-wide">
                      {String(nextLanguage || "en").toUpperCase()}
                    </span>
                  </button>

                  {themes.map((themeOption) => {
                    const Icon = themeOption.icon;
                    const isSelected = theme === themeOption.value;
                    return (
                      <button
                        key={themeOption.value}
                        onClick={() => handleThemeChange(themeOption.value)}
                        className={cn(
                          circleBase,
                          isSelected
                            ? "bg-cyan-100 border-cyan-300 text-cyan-700 dark:bg-cyan-900/40 dark:border-cyan-700 dark:text-cyan-400"
                            : circleMobile,
                        )}
                        aria-label={themeOption.name}
                        title={themeOption.name}
                      >
                        <Icon size={16} />
                      </button>
                    );
                  })}
                </div>

                {/* Auth buttons */}
                <div className="flex flex-col gap-4 mt-2">
                  {user ? (
                    <>
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800">
                        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                          {user?.name ||
                            t("navbar.userMenu.defaultUser", "Usuario")}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-300">
                          {user?.email}
                        </p>
                      </div>
                      <Link
                        to="/dashboard"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="w-full py-3 bg-cyan-500 rounded-xl text-white font-bold text-center"
                      >
                        {t("landing:nav.dashboard", "Mi Panel")}
                      </Link>
                      <button
                        onClick={onLogout}
                        className="w-full py-3 border border-rose-300 rounded-xl text-rose-600 font-bold text-center"
                      >
                        {t("landing:nav.logout", "Cerrar Sesión")}
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => {
                          setIsMobileMenuOpen(false);
                          document
                            .getElementById("contacto")
                            ?.scrollIntoView({ behavior: "smooth" });
                        }}
                        className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-xl text-white font-bold text-center"
                      >
                        {t("landing:nav.contact", "Contacto")}
                      </button>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default MarketingNavbar;
