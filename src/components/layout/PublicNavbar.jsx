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
  MoreHorizontal,
  Sun,
} from "lucide-react";
import { m as Motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import {
  ThemeAnimationType,
  useModeAnimation,
} from "react-theme-switch-animation";
import { cn } from "../../utils/cn";
import { useAuth } from "../../hooks/useAuth";
import { useInstanceModules } from "../../hooks/useInstanceModules";
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
  const { isEnabled } = useInstanceModules();
  const { theme, effectiveTheme, changeTheme, changeLanguage } = useUI();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isThemeDropdownOpen, setIsThemeDropdownOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  // Overflow nav: null = not yet measured (all items visible for first paint)
  const [visibleCount, setVisibleCount] = useState(null);
  const navLinksContainerRef = useRef(null);
  const itemRefs = useRef([]);
  const cachedItemWidths = useRef(null); // filled on first measurement
  const moreBtnRef = useRef(null);
  const moreDropdownRef = useRef(null);

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
  const canChangeLanguage = isEnabled("module.preferences.locale");
  const canChangeTheme = isEnabled("module.preferences.theme");

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
      if (!canChangeTheme) return;
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
    [canChangeTheme, changeTheme, isDarkMode, toggleSwitchTheme],
  );

  const nextThemeMobile =
    currentTheme === "system"
      ? "light"
      : currentTheme === "light"
        ? "dark"
        : "system";

  const handleThemeCycleMobile = useCallback(() => {
    if (!canChangeTheme) return;
    changeTheme(nextThemeMobile);
  }, [canChangeTheme, changeTheme, nextThemeMobile]);

  const themes = useMemo(
    () => [
      { value: "light", name: t("theme.light"), icon: Sun },
      { value: "dark", name: t("theme.dark"), icon: Moon },
      { value: "system", name: t("theme.system"), icon: Monitor },
    ],
    [t],
  );

  const navLinks = useMemo(() => buildPublicNavLinks(t), [t]);

  // When language changes → navLinks change → reset measurement so items re-measure
  useEffect(() => {
    cachedItemWidths.current = null;
    setVisibleCount(null);
  }, [navLinks]);

  // ── Overflow nav measurement ─────────────────────────────────────────────
  // Strategy:
  //   • When visibleCount=null all items are display:block → we read & cache widths.
  //   • When visibleCount is set, hidden items (display:none) have 0 offsetWidth,
  //     so we use cached values; only container width is re-read from the DOM.
  const recalcNavOverflow = useCallback(() => {
    const container = navLinksContainerRef.current;
    if (!container) return;

    const items = itemRefs.current.filter(Boolean);
    if (!items.length) return;

    // Build/refresh cache — only update entries that are currently visible
    if (!cachedItemWidths.current) {
      cachedItemWidths.current = new Array(items.length).fill(0);
    }
    items.forEach((el, i) => {
      if (el && el.offsetWidth > 0) {
        cachedItemWidths.current[i] = el.offsetWidth;
      }
    });

    // Need all items measured before first commit
    if (cachedItemWidths.current.some((w) => !w)) return;

    const available = container.clientWidth;
    if (!available) return;

    // Width of the "Más" chip (measured from the always-present phantom)
    const moreBtnW = (moreBtnRef.current?.offsetWidth ?? 88) + 4;
    const GAP = 4; // gap between items (space-x-1)

    let accumulated = 0;
    let count = items.length;

    for (let i = 0; i < items.length; i++) {
      const w = cachedItemWidths.current[i] + GAP;
      const hasNext = i < items.length - 1;

      if (hasNext) {
        // If adding this item would leave no room for "Más" + the rest, cut here
        if (accumulated + w + moreBtnW > available) {
          count = i;
          break;
        }
      } else {
        // Last item → no "Más" needed
        if (accumulated + w > available) {
          count = i;
          break;
        }
      }
      accumulated += w;
    }

    setVisibleCount(count);
  }, []);

  useEffect(() => {
    // Run after first paint so all item refs are populated
    const raf = requestAnimationFrame(recalcNavOverflow);
    const observer = new ResizeObserver(recalcNavOverflow);
    if (navLinksContainerRef.current)
      observer.observe(navLinksContainerRef.current);
    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
    };
  }, [recalcNavOverflow]);

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
    if (!canChangeLanguage) return;
    changeLanguage(nextLanguage);
  }, [canChangeLanguage, changeLanguage, nextLanguage]);

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
          {/*
            Desktop layout uses CSS Grid with 4 columns:
              [logo auto] [nav-links 1fr] [search 240px] [controls auto]
            The 1fr column bounds the nav-links section for measurement.
            Grid template is set via inline style to avoid Tailwind parsing issues
            with complex values. On mobile the nav is flex justify-between.
          */}
          <nav
            className="flex items-center justify-between gap-3 lg:grid lg:items-center lg:gap-3"
            style={{
              gridTemplateColumns: "auto 1fr 240px auto",
            }}
          >
            {/* ── Logo ── */}
            <Link
              to="/"
              className="relative z-50 flex shrink-0 items-center gap-2"
            >
              <BrandLogo className="h-9 w-auto" />
              <p
                className={cn(
                  "hidden text-base font-bold transition-colors sm:block sm:text-lg",
                  solidNav ? "text-slate-900 dark:text-white" : "text-white",
                )}
              >
                {env.app.name}
              </p>
            </Link>

            {/* ── Desktop nav links (1fr column) ── */}
            <div
              ref={navLinksContainerRef}
              className="hidden min-w-0 items-center gap-1 lg:flex"
            >
              {navLinks.map((link, idx) => {
                // While measuring (visibleCount=null) all items are visible.
                // After measurement, items ≥ visibleCount get display:none.
                const isHidden = visibleCount !== null && idx >= visibleCount;
                return (
                  <div
                    key={link.name}
                    ref={(el) => {
                      itemRefs.current[idx] = el;
                    }}
                    className={cn(
                      "group relative shrink-0",
                      isHidden && "hidden",
                    )}
                  >
                    <Link
                      to={link.path}
                      className={cn(
                        "flex items-center gap-1 whitespace-nowrap rounded-xl px-3 py-2 text-sm font-semibold transition-colors",
                        solidNav
                          ? "text-slate-700 hover:bg-slate-100/80 hover:text-cyan-600 dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-cyan-400"
                          : "text-white/90 hover:bg-white/10 hover:text-white",
                      )}
                    >
                      {link.name}
                      <ChevronDown
                        size={13}
                        className="opacity-60 transition-transform duration-200 group-hover:rotate-180"
                      />
                    </Link>

                    {/* Per-item dropdown */}
                    <div className="invisible absolute top-full left-1/2 z-50 -translate-x-1/2 translate-y-2 pt-3 opacity-0 transition-all duration-200 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">
                      <div className="w-[26rem] overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-black/5 dark:bg-slate-800 dark:ring-slate-700">
                        <div className="grid grid-cols-2 gap-1 p-3">
                          {link.items.map((item) => {
                            const Icon = item.icon;
                            return (
                              <Link
                                key={`${item.to}-${item.label}`}
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
                );
              })}

              {/* ── "Más" — hover trigger, same pattern as other nav items ── */}
              {visibleCount !== null && visibleCount < navLinks.length && (
                <div ref={moreDropdownRef} className="group relative shrink-0">
                  {/* Trigger — matches exactly the other nav link style */}
                  <div
                    className={cn(
                      "flex cursor-default items-center gap-1 whitespace-nowrap rounded-xl px-3 py-2 text-sm font-semibold transition-colors",
                      solidNav
                        ? "text-slate-700 hover:bg-slate-100/80 hover:text-cyan-600 dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-cyan-400"
                        : "text-white/90 hover:bg-white/10 hover:text-white",
                    )}
                  >
                    <MoreHorizontal size={15} />
                    <span>{t("client:nav.more", "Más")}</span>
                    <ChevronDown
                      size={13}
                      className="opacity-60 transition-transform duration-200 group-hover:rotate-180"
                    />
                  </div>

                  {/* Dropdown — same invisible→visible transition as other items */}
                  <div className="invisible absolute left-0 top-full z-[110] translate-y-2 pt-3 opacity-0 transition-all duration-200 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">
                    <div
                      className="overflow-y-auto rounded-2xl bg-white shadow-2xl ring-1 ring-black/5 [&::-webkit-scrollbar]:hidden dark:bg-slate-800 dark:ring-slate-700"
                      style={{
                        minWidth: "42rem",
                        maxWidth: "68rem",
                        maxHeight: "80vh",
                        scrollbarWidth: "none",
                        msOverflowStyle: "none",
                      }}
                    >
                      {/* Overflow sections grouped by category */}
                      {navLinks.slice(visibleCount).map((link, si) => (
                        <div
                          key={link.name}
                          className={cn(
                            "p-3",
                            si > 0 &&
                              "border-t border-slate-100 dark:border-slate-700",
                          )}
                        >
                          <Link
                            to={link.path}
                            className="mb-2 flex items-center justify-between rounded-lg px-2 py-1 text-[11px] font-bold uppercase tracking-widest text-slate-400 transition-colors hover:text-cyan-600 dark:text-slate-500 dark:hover:text-cyan-400"
                          >
                            <span>{link.name}</span>
                            <ChevronRight size={11} />
                          </Link>
                          <div className="grid grid-cols-3 gap-1">
                            {link.items.map((item) => {
                              const Icon = item.icon;
                              return (
                                <Link
                                  key={`${item.to}-${item.label}`}
                                  to={item.to}
                                  className="group/item flex items-start gap-2.5 rounded-xl px-2.5 py-2 transition-colors hover:bg-cyan-50 dark:hover:bg-slate-700"
                                >
                                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-cyan-100 text-cyan-600 transition-colors group-hover/item:bg-cyan-200 dark:bg-cyan-900/40 dark:text-cyan-400">
                                    <Icon size={14} />
                                  </div>
                                  <div className="min-w-0">
                                    <p className="text-xs font-semibold leading-tight text-slate-800 dark:text-white">
                                      {item.label}
                                    </p>
                                    <p className="mt-0.5 text-[11px] leading-snug text-slate-500 dark:text-slate-400">
                                      {item.desc}
                                    </p>
                                  </div>
                                </Link>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* ── Search (240px column) ── */}
            <div className="hidden lg:flex">
              <PublicSearch
                variant={solidNav ? "default" : "transparent"}
                showMobileTrigger={false}
                desktopContainerClassName="w-full max-w-full"
              />
            </div>

            {/* ── Right controls ── */}
            <div className="hidden items-center gap-2 lg:flex">
              {canChangeLanguage ? (
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
              ) : null}

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
                    <LogIn size={16} />
                    <span>{t("client:nav.login", "Log in")}</span>
                  </Link>
                  <Link
                    to="/register"
                    className="rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-2 text-sm font-bold text-white shadow-lg transition-all hover:scale-105 hover:shadow-cyan-500/30 active:scale-95"
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
                    onClick={() => setIsMobileMenuOpen((previous) => !previous)}
                    aria-label={t("nav.menu", "Menu")}
                  >
                    {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
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
              className="fixed top-0 right-0 bottom-0 z-210 w-[85%] max-w-md flex flex-col bg-white shadow-2xl dark:bg-slate-950 lg:hidden"
            >
              <div className="flex-shrink-0 flex items-center justify-between border-b border-slate-100 px-6 pb-4 pt-6 dark:border-slate-800">
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

              <div className="flex-1 overflow-y-auto flex flex-col gap-4 p-5">
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
                            key={`${item.to}-${item.label}`}
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
