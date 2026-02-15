import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import {
  Search,
  X,
  MapPin,
  Home,
  Building2,
  Palmtree,
  Loader2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "../../utils/cn";
import { DEFAULT_AMENITIES_CATALOG } from "../../data/amenitiesCatalog";
import { propertiesService } from "../../services/propertiesService";

/**
 * Quick-suggestion categories shown when the input is empty or has a short query.
 * Each navigates to a pre-filtered URL on the public properties page.
 */
const useSuggestions = (t) => [
  {
    icon: Palmtree,
    label: t("publicSearch.suggestions.vacationRentals", "Rentas Vacacionales"),
    to: "/buscar?operationType=vacation_rental",
  },
  {
    icon: Home,
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

/* ────────────────────────────────────────────── */

const PublicSearch = ({
  showDesktopInput = true,
  showMobileTrigger = true,
  /** When rendered inside a transparent header over the hero */
  variant = "default",
}) => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [isDesktopOpen, setIsDesktopOpen] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [liveResults, setLiveResults] = useState([]);
  const [liveLoading, setLiveLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const liveSearchTimer = useRef(null);
  const desktopRef = useRef(null);
  const mobileInputRef = useRef(null);
  const dropdownRef = useRef(null);
  const suggestions = useSuggestions(t);

  // Close desktop dropdown on outside click
  useEffect(() => {
    if (!isDesktopOpen) return;
    const handler = (e) => {
      if (!desktopRef.current?.contains(e.target)) setIsDesktopOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isDesktopOpen]);

  // Debounced live property search
  useEffect(() => {
    const trimmed = query.trim();
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
  }, [query]);

  // Bilingual amenity matching — searches BOTH name_en and name_es
  const amenityMatches = useMemo(() => {
    if (query.trim().length < 2) return [];
    const q = query.trim().toLowerCase();
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
  }, [query, i18n.resolvedLanguage]);

  const doSearch = (q) => {
    const trimmed = String(q || "").trim();
    if (!trimmed) return;
    navigate(`/buscar?q=${encodeURIComponent(trimmed)}`);
    closeAll();
  };

  const closeAll = () => {
    setQuery("");
    setIsDesktopOpen(false);
    setIsMobileOpen(false);
    setLiveResults([]);
    setLiveLoading(false);
    setActiveIndex(-1);
  };

  // Build a flat list of navigable items for keyboard navigation
  const navItems = useMemo(() => {
    const items = [];
    // "Search for ..." button
    if (query.trim().length > 0) {
      items.push({ type: "search", action: () => doSearch(query) });
    }
    // Live property results
    if (query.trim().length >= 2 && !liveLoading) {
      liveResults.forEach((p) => {
        items.push({
          type: "property",
          action: () => goTo(`/propiedades/${p.slug}`),
        });
      });
    }
    // Amenity matches
    amenityMatches.forEach((a) => {
      items.push({
        type: "amenity",
        action: () => goTo(`/buscar?q=${encodeURIComponent(a.displayName)}`),
      });
    });
    // Popular suggestions
    suggestions.forEach((s) => {
      items.push({ type: "suggestion", action: () => goTo(s.to) });
    });
    return items;
  }, [query, liveResults, liveLoading, amenityMatches, suggestions]);

  // Reset active index when items change
  useEffect(() => {
    setActiveIndex(-1);
  }, [navItems.length]);

  // Scroll active item into view
  useEffect(() => {
    if (activeIndex < 0) return;
    const container = dropdownRef.current;
    if (!container) return;
    const btns = container.querySelectorAll("[data-nav-item]");
    btns[activeIndex]?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  const onKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => (i < navItems.length - 1 ? i + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => (i > 0 ? i - 1 : navItems.length - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (activeIndex >= 0 && navItems[activeIndex]) {
        navItems[activeIndex].action();
      } else {
        doSearch(query);
      }
    } else if (e.key === "Escape") {
      setIsDesktopOpen(false);
      setIsMobileOpen(false);
      setActiveIndex(-1);
    }
  };

  const goTo = (to) => {
    navigate(to);
    closeAll();
  };

  /* ── Suggestion list (reused in desktop + mobile) ── */
  // Track a running index counter across sections so keyboard nav works
  const SuggestionList = ({ compact }) => {
    let idx = query.trim().length > 0 ? 1 : 0; // "Search for" button takes slot 0 when visible

    return (
      <div ref={dropdownRef} className={cn("py-2", compact && "px-1")}>
        {/* Live property results */}
        {query.trim().length >= 2 && (
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
                      onClick={() => goTo(`/propiedades/${p.slug}`)}
                      onMouseEnter={() => setActiveIndex(myIdx)}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition",
                        activeIndex === myIdx
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

        {/* Smart amenity matches (bilingual) */}
        {amenityMatches.length > 0 && (
          <>
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
                    goTo(`/buscar?q=${encodeURIComponent(amenity.displayName)}`)
                  }
                  onMouseEnter={() => setActiveIndex(myIdx)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-700 transition dark:text-slate-300",
                    activeIndex === myIdx
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
          </>
        )}

        {/* Popular searches */}
        <p className="px-3 pb-1.5 pt-1 text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500">
          {t("publicSearch.quickFilters")}
        </p>
        {suggestions.map((s) => {
          const myIdx = idx++;
          const Icon = s.icon;
          return (
            <button
              key={s.to}
              type="button"
              data-nav-item
              onClick={() => goTo(s.to)}
              onMouseEnter={() => setActiveIndex(myIdx)}
              className={cn(
                "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-700 transition dark:text-slate-300",
                activeIndex === myIdx
                  ? "bg-cyan-50 dark:bg-slate-700"
                  : "hover:bg-cyan-50 dark:hover:bg-slate-700",
              )}
            >
              <Icon size={15} className="text-cyan-600 dark:text-cyan-400" />
              <span>{s.label}</span>
            </button>
          );
        })}
      </div>
    );
  };

  /* ── Mobile overlay ── */
  const mobileOverlay = (
    <AnimatePresence>
      {isMobileOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[95] bg-slate-950/55 p-3 backdrop-blur-sm sm:hidden"
        >
          <motion.section
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="mx-auto flex h-full w-full max-w-[34rem] flex-col overflow-hidden rounded-3xl border border-cyan-100 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-950/95"
          >
            {/* Header */}
            <header className="flex items-center gap-2 border-b border-slate-100 px-3 py-3 dark:border-slate-700">
              <label className="relative block flex-1">
                <Search
                  size={15}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-cyan-600"
                />
                <input
                  ref={mobileInputRef}
                  type="text"
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={onKeyDown}
                  placeholder={t(
                    "publicSearch.placeholder",
                    "Buscar propiedades, ciudades, características…",
                  )}
                  className="h-11 w-full rounded-2xl border border-cyan-200/90 bg-white pl-9 pr-3 text-sm text-slate-800 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/25 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                />
              </label>
              <button
                type="button"
                onClick={closeAll}
                className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 text-slate-500 dark:border-slate-700 dark:text-slate-300"
              >
                <X size={16} />
              </button>
            </header>

            {/* Body */}
            <div className="flex-1 overflow-y-auto">
              {query.trim().length > 0 ? (
                <div className="p-4">
                  <button
                    type="button"
                    onClick={() => doSearch(query)}
                    className="flex w-full items-center gap-3 rounded-xl bg-cyan-50 px-4 py-3 text-sm font-medium text-cyan-700 transition hover:bg-cyan-100 dark:bg-cyan-900/30 dark:text-cyan-400"
                  >
                    <Search size={16} />
                    <span>
                      {t("publicSearch.searchFor", "Buscar")}{" "}
                      <strong>"{query.trim()}"</strong>
                    </span>
                  </button>
                </div>
              ) : null}
              <SuggestionList compact />
            </div>
          </motion.section>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <>
      {/* ── Desktop input ── */}
      {showDesktopInput && (
        <div
          ref={desktopRef}
          className="relative hidden w-full max-w-md sm:block"
        >
          <label className="relative block">
            <Search
              size={15}
              className={cn(
                "pointer-events-none absolute left-3 top-1/2 -translate-y-1/2",
                variant === "transparent"
                  ? "text-white/70"
                  : "text-cyan-600/80 dark:text-cyan-400",
              )}
            />
            <input
              type="text"
              value={query}
              onFocus={() => setIsDesktopOpen(true)}
              onChange={(e) => {
                setQuery(e.target.value);
                setIsDesktopOpen(true);
              }}
              onKeyDown={onKeyDown}
              placeholder={t(
                "publicSearch.placeholder",
                "Buscar propiedades, ciudades…",
              )}
              className={cn(
                "h-10 w-full rounded-full pl-9 pr-3 text-sm outline-none transition",
                variant === "transparent"
                  ? "border border-white/30 bg-white/15 text-white placeholder:text-white/60 backdrop-blur-md focus:bg-white/25 focus:border-white/50"
                  : "border border-white/40 bg-white/50 text-slate-800 backdrop-blur-sm shadow-sm focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 dark:border-slate-600/50 dark:bg-slate-800/60 dark:text-slate-100",
              )}
            />
          </label>

          <AnimatePresence>
            {isDesktopOpen && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
                className="absolute right-0 top-[calc(100%+0.5rem)] z-[85] w-[min(24rem,calc(100vw-2rem))] min-w-full max-h-[calc(100vh-8rem)] overflow-y-auto overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900"
              >
                {query.trim().length > 0 && (
                  <div className="border-b border-slate-100 p-2 dark:border-slate-700">
                    <button
                      type="button"
                      data-nav-item
                      onClick={() => doSearch(query)}
                      onMouseEnter={() => setActiveIndex(0)}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-cyan-700 transition dark:text-cyan-400",
                        activeIndex === 0
                          ? "bg-cyan-50 dark:bg-slate-800"
                          : "hover:bg-cyan-50 dark:hover:bg-slate-800",
                      )}
                    >
                      <Search size={15} />
                      <span>
                        {t("publicSearch.searchFor", "Buscar")}{" "}
                        <strong>"{query.trim()}"</strong>
                      </span>
                    </button>
                  </div>
                )}
                <SuggestionList />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* ── Mobile trigger ── */}
      {showMobileTrigger && (
        <button
          type="button"
          onClick={() => {
            setIsMobileOpen(true);
            requestAnimationFrame(() => {
              requestAnimationFrame(() => mobileInputRef.current?.focus());
            });
          }}
          className="inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-white/30 bg-white/15 text-white backdrop-blur-sm transition hover:bg-white/25 sm:hidden"
          aria-label={t("publicSearch.open", "Buscar")}
        >
          <Search size={16} />
        </button>
      )}

      {/* Portal for mobile overlay */}
      {showMobileTrigger && typeof document !== "undefined"
        ? createPortal(mobileOverlay, document.body)
        : null}
    </>
  );
};

export default PublicSearch;
