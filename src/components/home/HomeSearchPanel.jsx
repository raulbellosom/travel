import { useState, useMemo, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { m, AnimatePresence } from "framer-motion";
import { Search } from "lucide-react";
import {
  Home,
  Palmtree,
  Car,
  Wrench,
  Compass,
  Music,
  LayoutGrid,
} from "lucide-react";
import { useInstanceModulesContext } from "../../contexts/InstanceModulesContext";

/* ── Module key mapping: resourceType → required module key ── */
const VERTICAL_MODULE_MAP = {
  property: "module.resources",
  vehicle: "module.resources",
  service: "module.resources",
  music: "module.resources",
  experience: "module.resources",
  venue: "module.resources",
};

/* ── Vertical tabs config ── */
const VERTICALS = [
  { key: "all", icon: LayoutGrid, moduleKey: null },
  { key: "property", icon: Home, moduleKey: "module.resources" },
  { key: "vacation", icon: Palmtree, moduleKey: "module.booking.short_term" },
  { key: "vehicle", icon: Car, moduleKey: "module.resources" },
  { key: "service", icon: Wrench, moduleKey: "module.resources" },
  { key: "experience", icon: Compass, moduleKey: "module.resources" },
  { key: "music", icon: Music, moduleKey: "module.resources" },
];

/* ── Helpers ── */
const RECENT_SEARCHES_KEY = "inmobo_recent_searches";

const getRecentSearches = () => {
  try {
    return JSON.parse(localStorage.getItem(RECENT_SEARCHES_KEY) || "[]").slice(
      0,
      5,
    );
  } catch {
    return [];
  }
};

const saveRecentSearch = (searchObj) => {
  try {
    const existing = getRecentSearches();
    const filtered = existing.filter(
      (s) => s.q !== searchObj.q || s.resourceType !== searchObj.resourceType,
    );
    const updated = [searchObj, ...filtered].slice(0, 5);
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
  } catch {
    // localStorage might be full or disabled
  }
};

const reduceMotion =
  typeof window !== "undefined" &&
  window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;

const tabVariants = {
  hidden: { opacity: 0, y: 6 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: reduceMotion ? 0 : 0.2 },
  },
  exit: {
    opacity: 0,
    y: -4,
    transition: { duration: reduceMotion ? 0 : 0.12 },
  },
};

const HomeSearchPanel = ({ variant = "hero", className = "" }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isEnabled } = useInstanceModulesContext();

  const [query, setQuery] = useState("");
  const [activeVertical, setActiveVertical] = useState("all");
  const [showRecent, setShowRecent] = useState(false);

  /* ── Drag-to-scroll for pills ── */
  const pillsRef = useRef(null);
  const dragState = useRef({ isDown: false, startX: 0, scrollLeft: 0 });

  const onPillsPointerDown = useCallback((e) => {
    const el = pillsRef.current;
    if (!el) return;
    dragState.current = {
      isDown: true,
      startX: e.pageX - el.offsetLeft,
      scrollLeft: el.scrollLeft,
    };
    el.style.cursor = "grabbing";
    el.setPointerCapture(e.pointerId);
  }, []);
  const onPillsPointerUp = useCallback(() => {
    dragState.current.isDown = false;
    if (pillsRef.current) pillsRef.current.style.cursor = "grab";
  }, []);
  const onPillsPointerMove = useCallback((e) => {
    if (!dragState.current.isDown) return;
    e.preventDefault();
    const el = pillsRef.current;
    const x = e.pageX - el.offsetLeft;
    el.scrollLeft =
      dragState.current.scrollLeft - (x - dragState.current.startX);
  }, []);

  /* ── Filter verticals by module gating ── */
  const visibleVerticals = useMemo(
    () =>
      VERTICALS.filter((v) => v.moduleKey === null || isEnabled(v.moduleKey)),
    [isEnabled],
  );

  const resourceTypeForSearch =
    activeVertical === "all"
      ? ""
      : activeVertical === "vacation"
        ? "property"
        : activeVertical;

  const recentSearches = useMemo(() => getRecentSearches(), []);

  /* ── Submit search ── */
  const handleSubmit = useCallback(
    (e) => {
      e.preventDefault();
      const params = new URLSearchParams();
      if (query.trim()) params.set("q", query.trim());
      if (resourceTypeForSearch)
        params.set("resourceType", resourceTypeForSearch);

      // Vacation-specific: add short_term commercial mode
      if (activeVertical === "vacation") {
        params.set("commercialMode", "short_term_rental");
      }

      params.set("page", "1");

      // Save to recent searches
      saveRecentSearch({
        q: query.trim(),
        resourceType: resourceTypeForSearch,
        label:
          query.trim() ||
          (resourceTypeForSearch
            ? t(
                `client:common.enums.resourceType.${resourceTypeForSearch}`,
                resourceTypeForSearch,
              )
            : t("client:homeNew.verticals.all", "Todo")),
      });

      navigate(`/buscar?${params.toString()}`);
    },
    [query, resourceTypeForSearch, activeVertical, navigate, t],
  );

  /* ── Quick fill from recent search ── */
  const handleRecentClick = useCallback(
    (search) => {
      setQuery(search.q || "");
      setShowRecent(false);
      const params = new URLSearchParams();
      if (search.q) params.set("q", search.q);
      if (search.resourceType) params.set("resourceType", search.resourceType);
      if (search.category) params.set("category", search.category);
      params.set("page", "1");
      navigate(`/buscar?${params.toString()}`);
    },
    [navigate],
  );

  const isHero = variant === "hero";

  return (
    <div className={`w-full ${className}`}>
      {/* ── Vertical Tabs ── */}
      <div
        ref={pillsRef}
        onPointerDown={onPillsPointerDown}
        onPointerUp={onPillsPointerUp}
        onPointerLeave={onPillsPointerUp}
        onPointerMove={onPillsPointerMove}
        className="mb-3 flex cursor-grab items-center gap-1 overflow-x-auto pb-1 select-none sm:gap-2"
        style={{
          scrollbarWidth: "none",
          msOverflowStyle: "none",
          WebkitOverflowScrolling: "touch",
        }}
      >
        {visibleVerticals.map((v) => {
          const Icon = v.icon;
          const isActive = v.key === activeVertical;
          return (
            <button
              key={v.key}
              type="button"
              onClick={() => setActiveVertical(v.key)}
              className={`relative flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2.5 text-sm font-medium transition-all duration-200 sm:px-4 sm:py-2.5 ${
                isActive
                  ? isHero
                    ? "bg-white text-slate-900 shadow-lg shadow-black/10"
                    : "bg-brand-gradient text-white shadow-lg shadow-cyan-500/25"
                  : isHero
                    ? "bg-white/15 text-white/90 hover:bg-white/25"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
              }`}
              aria-pressed={isActive}
            >
              <Icon size={16} />
              <span className="whitespace-nowrap">
                {v.key === "all"
                  ? t("client:homeNew.verticals.all", "Todo")
                  : v.key === "vacation"
                    ? t("client:homeNew.verticals.vacation", "Vacacional")
                    : t(`client:common.enums.resourceType.${v.key}`, v.key)}
              </span>
              {isActive && !reduceMotion && (
                <m.div
                  layoutId="active-vertical-pill"
                  className="absolute inset-0 rounded-full"
                  style={{ zIndex: -1 }}
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* ── Search Form ── */}
      <form
        onSubmit={handleSubmit}
        className={`rounded-2xl p-3 sm:p-4 ${
          isHero
            ? "border border-white/20 bg-white/12 backdrop-blur-xl"
            : "border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900"
        }`}
      >
        <AnimatePresence mode="wait">
          <m.div
            key={activeVertical}
            variants={tabVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="flex gap-2 sm:gap-3"
          >
            {/* Primary input */}
            <div className="relative min-w-0 flex-1">
              <Search
                className={`pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 ${
                  isHero ? "text-white/70" : "text-slate-400"
                }`}
                size={18}
              />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => setShowRecent(true)}
                onBlur={() => setTimeout(() => setShowRecent(false), 200)}
                placeholder={t(
                  "client:homeNew.search.placeholder",
                  "Ciudad, zona o qué buscas...",
                )}
                className={`h-14 w-full rounded-xl pl-10 pr-3 text-base outline-none transition sm:h-13 ${
                  isHero
                    ? "border border-white/30 bg-white/15 text-white placeholder:text-white/60 focus:border-cyan-300 focus:bg-white/20"
                    : "border border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:border-cyan-500 focus:bg-white dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500"
                }`}
                aria-label={t(
                  "client:homeNew.search.ariaLabel",
                  "Buscar recursos",
                )}
              />

              {/* Recent searches dropdown */}
              {showRecent && recentSearches.length > 0 && (
                <div className="absolute left-0 right-0 top-full z-50 mt-1 rounded-xl border border-slate-200 bg-white p-2 shadow-xl dark:border-slate-700 dark:bg-slate-900">
                  <p className="mb-1 px-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                    {t(
                      "client:homeNew.search.recentSearches",
                      "Búsquedas recientes",
                    )}
                  </p>
                  {recentSearches.map((s, i) => (
                    <button
                      key={i}
                      type="button"
                      onMouseDown={() => handleRecentClick(s)}
                      className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm text-slate-700 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                    >
                      <Search size={14} className="shrink-0 text-slate-400" />
                      <span className="truncate">
                        {s.label || s.q || s.resourceType}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Submit button */}
            <button
              type="submit"
              className="flex h-14 shrink-0 items-center justify-center gap-2 rounded-xl bg-cyan-500 px-6 text-base font-bold text-white shadow-lg shadow-cyan-500/25 transition hover:bg-cyan-400 active:scale-[0.97] sm:h-13"
            >
              <Search size={16} />
              {t("client:search.button", "Buscar")}
            </button>
          </m.div>
        </AnimatePresence>
      </form>
    </div>
  );
};

export default HomeSearchPanel;
