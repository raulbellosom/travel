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
  Home as HomeIcon,
  Building2,
  Landmark,
  Warehouse,
  Hotel,
  Castle,
  Palmtree,
  BadgeDollarSign,
  Search,
  MapPin,
  Loader2,
} from "lucide-react";
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
import PublicSearch from "../navigation/PublicSearch";
import { DEFAULT_AMENITIES_CATALOG } from "../../data/amenitiesCatalog";
import { propertiesService } from "../../services/propertiesService";
import env from "../../env";

const PublicNavbar = () => {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { theme, effectiveTheme, changeTheme, changeLanguage } = useUI();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Only the homepage and search page have dark hero backgrounds behind the navbar.
  // On every other page the unscrolled transparent style would show white text on
  // a white/light background, making it invisible.  `solidNav` forces the
  // opaque / dark-text style whenever the page lacks a hero.
  const hasHeroBehind =
    location.pathname === "/" || location.pathname.startsWith("/buscar");
  const solidNav = isScrolled || !hasHeroBehind;
  const [isThemeDropdownOpen, setIsThemeDropdownOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [liveResults, setLiveResults] = useState([]);
  const [liveLoading, setLiveLoading] = useState(false);
  const [mobileActiveIndex, setMobileActiveIndex] = useState(-1);
  const liveSearchTimer = useRef(null);
  const themeDropdownRef = useRef(null);
  const mobileSearchInputRef = useRef(null);
  const mobileDropdownRef = useRef(null);

  // Language
  const language = i18n.resolvedLanguage || i18n.language || "es";
  const nextLanguage = language === "es" ? "en" : "es";

  // Theme
  const currentTheme =
    theme === "light" || theme === "dark" || theme === "system"
      ? theme
      : "system";
  const ThemeIcon =
    currentTheme === "light" ? Sun : currentTheme === "dark" ? Moon : Monitor;

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

  // Handle scroll effect for glassmorphism
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  // Close theme dropdown on outside click
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

  // Search suggestions
  const searchSuggestions = [
    {
      icon: Palmtree,
      label: t(
        "publicSearch.suggestions.vacationRentals",
        "Rentas Vacacionales",
      ),
      to: "/buscar?operationType=vacation_rental",
    },
    {
      icon: HomeIcon,
      label: t("publicSearch.suggestions.houses", "Casas en venta"),
      to: "/buscar?propertyType=house&operationType=sale",
    },
    {
      icon: Building2,
      label: t("publicSearch.suggestions.apartments", "Departamentos"),
      to: "/buscar?propertyType=apartment",
    },
    {
      icon: MapPin,
      label: t("publicSearch.suggestions.puertoVallarta", "Puerto Vallarta"),
      to: "/buscar?q=Puerto+Vallarta",
    },
    {
      icon: MapPin,
      label: t("publicSearch.suggestions.rivieraNayarit", "Riviera Nayarit"),
      to: "/buscar?q=Riviera+Nayarit",
    },
  ];

  // Debounced live property search
  useEffect(() => {
    const trimmed = searchQuery.trim();
    if (trimmed.length < 2) {
      setLiveResults([]);
      setLiveLoading(false);
      return;
    }
    setLiveLoading(true);
    clearTimeout(liveSearchTimer.current);
    liveSearchTimer.current = setTimeout(() => {
      propertiesService
        .listPublic({ page: 1, limit: 5, filters: { search: trimmed } })
        .then((res) => setLiveResults(res.documents || []))
        .catch(() => setLiveResults([]))
        .finally(() => setLiveLoading(false));
    }, 350);
    return () => clearTimeout(liveSearchTimer.current);
  }, [searchQuery]);

  // Bilingual amenity matching — searches BOTH name_en and name_es
  const amenityMatches = useMemo(() => {
    if (searchQuery.trim().length < 2) return [];
    const q = searchQuery.trim().toLowerCase();
    const lang = i18n.resolvedLanguage || "es";
    return DEFAULT_AMENITIES_CATALOG.filter(
      (a) =>
        a.name_en.toLowerCase().includes(q) ||
        a.name_es.toLowerCase().includes(q),
    )
      .slice(0, 4)
      .map((a) => ({
        ...a,
        displayName: lang === "en" ? a.name_en : a.name_es,
      }));
  }, [searchQuery, i18n.resolvedLanguage]);

  // Focus search input when opened
  useEffect(() => {
    if (isMobileSearchOpen && mobileSearchInputRef.current) {
      // Use requestAnimationFrame for reliable focus after animation
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          mobileSearchInputRef.current?.focus();
        });
      });
    }
  }, [isMobileSearchOpen]);

  // Close suggestions on clicks outside
  useEffect(() => {
    if (!isMobileSearchOpen || !showSuggestions) return;

    const handleClickOutside = (e) => {
      // Check if click is outside search input and suggestions
      if (
        mobileSearchInputRef.current &&
        !mobileSearchInputRef.current.contains(e.target) &&
        !e.target.closest("[data-search-suggestions]")
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isMobileSearchOpen, showSuggestions]);

  // Handle search
  const handleMobileSearch = () => {
    const trimmed = searchQuery.trim();
    if (!trimmed) return;
    navigate(`/buscar?q=${encodeURIComponent(trimmed)}`);
    closeMobileSearch();
  };

  // Build flat list of navigable items for keyboard navigation
  const mobileNavItems = useMemo(() => {
    const items = [];
    // "Search for ..." button
    if (searchQuery.trim().length > 0) {
      items.push({ type: "search", action: () => handleMobileSearch() });
    }
    // Live property results
    if (searchQuery.trim().length >= 2 && !liveLoading) {
      liveResults.forEach((p) => {
        items.push({
          type: "property",
          action: () => navigateToSuggestion(`/propiedades/${p.slug}`),
        });
      });
    }
    // Amenity matches
    amenityMatches.forEach((a) => {
      items.push({
        type: "amenity",
        action: () =>
          navigateToSuggestion(
            `/buscar?q=${encodeURIComponent(a.displayName)}`,
          ),
      });
    });
    // Popular suggestions
    searchSuggestions.forEach((s) => {
      items.push({
        type: "suggestion",
        action: () => navigateToSuggestion(s.to),
      });
    });
    return items;
  }, [
    searchQuery,
    liveResults,
    liveLoading,
    amenityMatches,
    searchSuggestions,
  ]);

  // Reset active index when items change
  useEffect(() => {
    setMobileActiveIndex(-1);
  }, [mobileNavItems.length]);

  // Scroll active item into view
  useEffect(() => {
    if (mobileActiveIndex < 0) return;
    const container = mobileDropdownRef.current;
    if (!container) return;
    const btns = container.querySelectorAll("[data-nav-item]");
    btns[mobileActiveIndex]?.scrollIntoView({ block: "nearest" });
  }, [mobileActiveIndex]);

  const handleSearchKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setMobileActiveIndex((i) => (i < mobileNavItems.length - 1 ? i + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setMobileActiveIndex((i) => (i > 0 ? i - 1 : mobileNavItems.length - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (mobileActiveIndex >= 0 && mobileNavItems[mobileActiveIndex]) {
        mobileNavItems[mobileActiveIndex].action();
      } else {
        handleMobileSearch();
      }
    } else if (e.key === "Escape") {
      closeMobileSearch();
    }
  };

  const closeMobileSearch = () => {
    setIsMobileSearchOpen(false);
    setSearchQuery("");
    setShowSuggestions(false);
    setLiveResults([]);
    setLiveLoading(false);
    setMobileActiveIndex(-1);
  };

  const navigateToSuggestion = (to) => {
    navigate(to);
    closeMobileSearch();
  };

  const navLinks = [
    {
      name: t("nav.realEstate", "Bienes Raíces"),
      path: "/buscar?operationType=sale",
      items: [
        {
          icon: HomeIcon,
          label: t("nav.dropdown.houses", "Casas"),
          desc: t(
            "nav.dropdown.housesDesc",
            "Casas en venta en las mejores zonas",
          ),
          to: "/buscar?operationType=sale&propertyType=house",
        },
        {
          icon: Building2,
          label: t("nav.dropdown.apartments", "Departamentos"),
          desc: t("nav.dropdown.apartmentsDesc", "Departamentos y condominios"),
          to: "/buscar?operationType=sale&propertyType=apartment",
        },
        {
          icon: Landmark,
          label: t("nav.dropdown.land", "Terrenos"),
          desc: t("nav.dropdown.landDesc", "Terrenos listos para construir"),
          to: "/buscar?operationType=sale&propertyType=land",
        },
        {
          icon: Warehouse,
          label: t("nav.dropdown.commercial", "Comercial"),
          desc: t(
            "nav.dropdown.commercialDesc",
            "Locales y oficinas comerciales",
          ),
          to: "/buscar?operationType=sale&propertyType=commercial",
        },
      ],
    },
    {
      name: t("nav.vacation", "Rentas Vacacionales"),
      path: "/buscar?operationType=vacation_rental",
      items: [
        {
          icon: Hotel,
          label: t("nav.dropdown.hotels", "Hoteles"),
          desc: t(
            "nav.dropdown.hotelsDesc",
            "Alojamiento en hoteles de la zona",
          ),
          to: "/buscar?operationType=vacation_rental",
        },
        {
          icon: Castle,
          label: t("nav.dropdown.condos", "Condominios"),
          desc: t(
            "nav.dropdown.condosDesc",
            "Condominios para estancias cortas",
          ),
          to: "/buscar?operationType=vacation_rental&propertyType=apartment",
        },
        {
          icon: Palmtree,
          label: t("nav.dropdown.villas", "Villas"),
          desc: t("nav.dropdown.villasDesc", "Villas de lujo para vacaciones"),
          to: "/buscar?operationType=vacation_rental&propertyType=house",
        },
        {
          icon: BadgeDollarSign,
          label: t("nav.dropdown.budget", "Económicas"),
          desc: t("nav.dropdown.budgetDesc", "Opciones accesibles para todos"),
          to: "/buscar?operationType=vacation_rental&sort=price-asc",
        },
      ],
    },
  ];

  const onLogout = async () => {
    await logout();
    setIsMobileMenuOpen(false);
    navigate("/");
  };

  const onToggleLanguage = () => {
    changeLanguage(nextLanguage);
  };

  // Shared circle button classes
  const circleBase =
    "inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border transition-colors";
  const circleScrolled =
    "bg-white/50 border-white/60 text-slate-700 hover:bg-white/70 backdrop-blur-sm dark:bg-slate-800/60 dark:border-slate-600/50 dark:text-slate-200 dark:hover:bg-slate-700/70";
  const circleTransparent =
    "bg-white/15 border-white/30 text-white hover:bg-white/25 backdrop-blur-sm";
  const circleMobile =
    "bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-700";

  return (
    <>
      <header
        className={cn(
          "fixed top-0 left-0 right-0 z-[100] transition-all duration-500 border-b",
          solidNav
            ? "bg-white/60 dark:bg-slate-900/70 backdrop-blur-xl backdrop-saturate-150 border-black/[0.06] dark:border-white/[0.08] py-3"
            : "bg-transparent border-transparent py-5",
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
                    solidNav ? "text-slate-900 dark:text-white" : "text-white",
                  )}
                >
                  {env.app.name}
                </p>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center space-x-1">
              {navLinks.map((link) => (
                <div key={link.name} className="relative group px-3 py-2">
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
                      className="opacity-70 group-hover:rotate-180 transition-transform duration-200"
                    />
                  </Link>

                  {/* Rich Dropdown */}
                  <div className="absolute top-full left-1/2 -translate-x-1/2 pt-3 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 translate-y-2 group-hover:translate-y-0">
                    <div className="w-[26rem] rounded-2xl bg-white shadow-2xl ring-1 ring-black/5 dark:bg-slate-800 dark:ring-slate-700 overflow-hidden">
                      <div className="grid grid-cols-2 gap-1 p-3">
                        {link.items.map((item) => {
                          const Icon = item.icon;
                          return (
                            <Link
                              key={item.to}
                              to={item.to}
                              className="flex items-start gap-3 rounded-xl px-3 py-3 transition-colors hover:bg-cyan-50 dark:hover:bg-slate-700 group/item"
                            >
                              <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-cyan-100 text-cyan-600 dark:bg-cyan-900/40 dark:text-cyan-400 transition-colors group-hover/item:bg-cyan-200 dark:group-hover/item:bg-cyan-800/40">
                                <Icon size={18} />
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-semibold text-slate-800 dark:text-white">
                                  {item.label}
                                </p>
                                <p className="text-xs text-slate-500 dark:text-slate-400 leading-snug">
                                  {item.desc}
                                </p>
                              </div>
                            </Link>
                          );
                        })}
                      </div>

                      <div className="border-t border-slate-100 dark:border-slate-700 px-4 py-2.5">
                        <Link
                          to={link.path}
                          className="flex items-center justify-between text-sm font-medium text-cyan-600 hover:text-cyan-700 dark:text-cyan-400 dark:hover:text-cyan-300 transition-colors"
                        >
                          {t("common.viewAll", "Ver todos")}
                          <ChevronRight size={14} />
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Search Bar - Desktop */}
            <div className="hidden flex-1 items-center justify-center px-6 lg:flex">
              <PublicSearch
                variant={solidNav ? "default" : "transparent"}
                showMobileTrigger={false}
              />
            </div>

            {/* Right Actions — Desktop */}
            <div className="hidden lg:flex items-center gap-2">
              {/* Language Circle */}
              <button
                onClick={onToggleLanguage}
                className={cn(
                  circleBase,
                  solidNav ? circleScrolled : circleTransparent,
                )}
                aria-label={t("dashboardNavbar.toggleLanguage")}
                title={t("dashboardNavbar.toggleLanguage")}
              >
                <span className="text-[11px] font-semibold uppercase tracking-wide">
                  {String(nextLanguage || "en").toUpperCase()}
                </span>
              </button>

              {/* Theme Circle with Dropdown */}
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
                  <Link
                    to="/login"
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-full font-semibold transition-all text-sm",
                      solidNav
                        ? "bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
                        : "bg-white text-slate-900 hover:bg-slate-100 shadow-md",
                    )}
                  >
                    <LogIn size={18} />
                    <span>{t("nav.login", "Iniciar Sesión")}</span>
                  </Link>
                  <Link
                    to="/register"
                    className="px-5 py-2.5 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold text-sm shadow-lg hover:shadow-cyan-500/30 hover:scale-105 transition-all active:scale-95"
                  >
                    {t("nav.register", "Registrarse")}
                  </Link>
                </>
              )}
            </div>

            {/* Mobile Actions (search icon + hamburger) */}
            <div className="flex items-center gap-2 lg:hidden relative z-50">
              {/* Mobile Search - Animated expand/collapse */}
              <AnimatePresence mode="wait">
                {!isMobileSearchOpen ? (
                  <motion.button
                    key="search-button"
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    onClick={() => {
                      setIsMobileSearchOpen(true);
                      setShowSuggestions(true);
                    }}
                    className={cn(
                      circleBase,
                      solidNav ? circleScrolled : circleTransparent,
                    )}
                    aria-label={t("publicSearch.open", "Buscar")}
                  >
                    <Search size={16} />
                  </motion.button>
                ) : (
                  <motion.div
                    key="search-input"
                    initial={{ width: 40, opacity: 0 }}
                    animate={{ width: "calc(100vw - 80px)", opacity: 1 }}
                    exit={{ width: 40, opacity: 0 }}
                    transition={{ duration: 0.2, ease: "easeInOut" }}
                    className="absolute right-0 flex items-center gap-2"
                  >
                    <div className="relative flex-1">
                      <Search
                        size={16}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-cyan-600 dark:text-cyan-400"
                      />
                      <input
                        ref={mobileSearchInputRef}
                        type="text"
                        autoFocus
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={handleSearchKeyDown}
                        onFocus={() => setShowSuggestions(true)}
                        placeholder={t(
                          "publicSearch.placeholder",
                          "Buscar propiedades, ciudades…",
                        )}
                        className="h-10 w-full rounded-full border border-cyan-200/90 bg-white pl-9 pr-3 text-base text-slate-800 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/25 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                      />
                    </div>
                    <button
                      onClick={closeMobileSearch}
                      className={cn(
                        circleBase,
                        solidNav ? circleScrolled : circleTransparent,
                      )}
                      aria-label={t("common.close", "Cerrar")}
                    >
                      <X size={16} />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Hamburger menu */}
              {!isMobileSearchOpen && (
                <button
                  className={cn(
                    "p-2 rounded-lg transition-colors",
                    solidNav || isMobileMenuOpen
                      ? "text-slate-800 dark:text-white"
                      : "text-white",
                  )}
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                >
                  {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
                </button>
              )}
            </div>
          </nav>
        </div>
      </header>

      {/* Mobile Search Suggestions Dropdown */}
      <AnimatePresence>
        {isMobileSearchOpen && showSuggestions && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="fixed left-0 right-0 z-[90] mx-4 mt-2 lg:hidden"
            style={{
              top: isScrolled
                ? "calc(3rem + 0.75rem + 8px)"
                : "calc(5rem + 1.25rem + 8px)",
            }}
            data-search-suggestions
          >
            <div
              ref={mobileDropdownRef}
              className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900 max-h-[60vh] overflow-y-auto"
            >
              {/* Search button for current query */}
              {(() => {
                let idx = 0;
                const hasQuery = searchQuery.trim().length > 0;
                const hasLiveSearch = searchQuery.trim().length >= 2;

                return (
                  <>
                    {hasQuery && (
                      <div className="border-b border-slate-100 p-2 dark:border-slate-700">
                        <button
                          type="button"
                          data-nav-item
                          onClick={handleMobileSearch}
                          onMouseEnter={() => setMobileActiveIndex(0)}
                          className={cn(
                            "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-cyan-700 transition dark:text-cyan-400",
                            mobileActiveIndex === 0
                              ? "bg-cyan-100 dark:bg-cyan-900/50"
                              : "bg-cyan-50 hover:bg-cyan-100 dark:bg-cyan-900/30 dark:hover:bg-cyan-900/50",
                          )}
                        >
                          <Search size={15} />
                          <span>
                            {t("publicSearch.searchFor")}{" "}
                            <strong>"{searchQuery.trim()}"</strong>
                          </span>
                        </button>
                      </div>
                    )}
                    {hasQuery && (idx = 1)}

                    {/* Live property results */}
                    {hasLiveSearch && (
                      <div className="border-b border-slate-100 dark:border-slate-700">
                        {liveLoading ? (
                          <div className="flex items-center justify-center gap-2 py-4 text-xs text-slate-400">
                            <Loader2 size={14} className="animate-spin" />
                            {t("publicSearch.searching")}
                          </div>
                        ) : liveResults.length > 0 ? (
                          <div className="py-1.5">
                            <p className="px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                              {t("publicSearch.properties")}
                            </p>
                            {liveResults.map((p) => {
                              const myIdx = idx++;
                              const img =
                                p.images?.[0] ||
                                p.mainImageUrl ||
                                "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=200&q=60";
                              return (
                                <button
                                  key={p.$id}
                                  type="button"
                                  data-nav-item
                                  onClick={() =>
                                    navigateToSuggestion(
                                      `/propiedades/${p.slug}`,
                                    )
                                  }
                                  onMouseEnter={() =>
                                    setMobileActiveIndex(myIdx)
                                  }
                                  className={cn(
                                    "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition",
                                    mobileActiveIndex === myIdx
                                      ? "bg-cyan-50 dark:bg-slate-700"
                                      : "hover:bg-cyan-50 dark:hover:bg-slate-700",
                                  )}
                                >
                                  <img
                                    src={img}
                                    alt={p.title}
                                    className="h-11 w-14 shrink-0 rounded-lg object-cover"
                                  />
                                  <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">
                                      {p.title}
                                    </p>
                                    <p className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                                      <MapPin size={10} />
                                      {p.city}
                                    </p>
                                  </div>
                                  <span className="shrink-0 text-xs font-bold text-cyan-700 dark:text-cyan-400">
                                    {new Intl.NumberFormat(i18n.language, {
                                      style: "currency",
                                      currency: p.currency || "MXN",
                                      maximumFractionDigits: 0,
                                    }).format(p.price || 0)}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        ) : (
                          <p className="px-3 py-3 text-center text-xs text-slate-400 dark:text-slate-500">
                            {t("publicSearch.noResults")}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Smart amenity matches */}
                    {amenityMatches.length > 0 && (
                      <div className="border-b border-slate-100 py-2 dark:border-slate-700">
                        <p className="px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                          {t("publicSearch.matchingAmenities")}
                        </p>
                        {amenityMatches.map((amenity) => {
                          const myIdx = idx++;
                          return (
                            <button
                              key={amenity.slug}
                              type="button"
                              data-nav-item
                              onClick={() =>
                                navigateToSuggestion(
                                  `/buscar?q=${encodeURIComponent(amenity.displayName)}`,
                                )
                              }
                              onMouseEnter={() => setMobileActiveIndex(myIdx)}
                              className={cn(
                                "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-700 transition dark:text-slate-300",
                                mobileActiveIndex === myIdx
                                  ? "bg-cyan-50 dark:bg-slate-700"
                                  : "hover:bg-cyan-50 dark:hover:bg-slate-700",
                              )}
                            >
                              <Search
                                size={13}
                                className="text-cyan-600 dark:text-cyan-400"
                              />
                              <span>
                                {t("publicSearch.propertiesWith")}{" "}
                                <strong>{amenity.displayName}</strong>
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* Popular searches */}
                    <div className="py-2">
                      <p className="px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                        {t("publicSearch.quickFilters", "Búsquedas populares")}
                      </p>
                      {searchSuggestions.map((suggestion) => {
                        const myIdx = idx++;
                        const Icon = suggestion.icon;
                        return (
                          <button
                            key={suggestion.to}
                            type="button"
                            data-nav-item
                            onClick={() => navigateToSuggestion(suggestion.to)}
                            onMouseEnter={() => setMobileActiveIndex(myIdx)}
                            className={cn(
                              "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-700 transition dark:text-slate-300",
                              mobileActiveIndex === myIdx
                                ? "bg-cyan-50 dark:bg-slate-700"
                                : "hover:bg-cyan-50 dark:hover:bg-slate-700",
                            )}
                          >
                            <Icon
                              size={15}
                              className="text-cyan-600 dark:text-cyan-400"
                            />
                            <span>{suggestion.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </>
                );
              })()}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
              className="fixed top-0 right-0 bottom-0 z-210 w-[85%] max-w-md bg-white dark:bg-slate-950 shadow-2xl lg:hidden overflow-y-auto"
            >
              {/* Sidebar header */}
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

              <div className="flex flex-col gap-6 p-6">
                {/* Mobile Search */}
                <div className="mb-2">
                  <PublicSearch
                    showDesktopInput={false}
                    showMobileTrigger={false}
                  />
                  {/* We manually render a visible input for mobile sidebar if PublicSearch doesn't handle it well inline. 
                         Actually PublicSearch has a mobile overlay mode, but here we want it IN the sidebar?
                         The previous PublicNavbar didn't have search in menu. 
                         Let's just use the PublicSearch input style or rely on its mobile trigger behavior?
                         The user wants "Sidebar". 
                         Let's inspect PublicSearch again. It has `showDesktopInput` and `showMobileTrigger`.
                         If I want it embedded in the sidebar, I might need to adjust PublicSearch or just mock it here.
                         For now, let's leave it out or add a simple button to open the search overlay.
                     */}
                </div>

                {navLinks.map((link) => (
                  <div
                    key={link.name}
                    className="border-b border-slate-100 pb-4 dark:border-slate-800"
                  >
                    <Link
                      to={link.path}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="mb-3 block text-xl font-bold text-slate-900 dark:text-white"
                    >
                      {link.name}
                    </Link>
                    <div className="grid grid-cols-1 gap-2">
                      {link.items.map((item) => {
                        const Icon = item.icon;
                        return (
                          <Link
                            key={item.to}
                            to={item.to}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-600 transition-colors hover:bg-cyan-50 dark:text-slate-300 dark:hover:bg-slate-800"
                          >
                            <Icon
                              size={18}
                              className="shrink-0 text-cyan-600 dark:text-cyan-400"
                            />
                            <span>{item.label}</span>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                ))}

                {/* Language & Theme */}
                <div className="flex items-center gap-3 border-t border-slate-100 pt-4 dark:border-slate-800">
                  <button
                    onClick={onToggleLanguage}
                    className={cn(circleBase, circleMobile)}
                    aria-label={t("client:navbar.toggleLanguage")}
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
                            ? "border-cyan-300 bg-cyan-100 text-cyan-700 dark:border-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-400"
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

                <div className="mt-2 flex flex-col gap-4">
                  {user ? (
                    <>
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800">
                        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                          {user?.name ||
                            t("client:navbar.userMenu.defaultUser", "Usuario")}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-300">
                          {user?.email}
                        </p>
                      </div>
                      <Link
                        to="/perfil"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="w-full rounded-xl bg-slate-100 py-3 text-center font-bold text-slate-900 dark:bg-slate-800 dark:text-white"
                      >
                        {t("client:navbar.userMenu.profile", "Editar Perfil")}
                      </Link>
                      <Link
                        to="/dashboard"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="w-full rounded-xl bg-cyan-500 py-3 text-center font-bold text-white"
                      >
                        {t("client:nav.dashboard", "Mi Panel")}
                      </Link>
                      <button
                        onClick={onLogout}
                        className="w-full rounded-xl border border-rose-300 py-3 text-center font-bold text-rose-600"
                      >
                        {t("client:nav.logout", "Cerrar Sesión")}
                      </button>
                    </>
                  ) : (
                    <>
                      <Link
                        to="/login"
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-100 py-3 text-center font-bold text-slate-900 dark:bg-slate-800 dark:text-white"
                      >
                        <LogIn size={20} />{" "}
                        {t("client:nav.login", "Iniciar Sesión")}
                      </Link>
                      <Link
                        to="/register"
                        className="w-full rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 py-3 text-center font-bold text-white"
                      >
                        {t("client:nav.register", "Registrarse")}
                      </Link>
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

export default PublicNavbar;
