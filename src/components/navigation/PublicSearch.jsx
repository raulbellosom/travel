import { useState, useRef, useEffect } from "react";
import { Search, X, MapPin, Home, Building2, Palmtree } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "../../utils/cn";

/**
 * Quick-suggestion categories shown when the input is empty or has a short query.
 * Each navigates to a pre-filtered URL on the public properties page.
 */
const useSuggestions = (t) => [
  {
    icon: Palmtree,
    label: t("publicSearch.suggestions.vacationRentals", "Rentas Vacacionales"),
    to: "/?operation=vacation_rental",
  },
  {
    icon: Home,
    label: t("publicSearch.suggestions.houses", "Casas en venta"),
    to: "/?type=house&operation=sale",
  },
  {
    icon: Building2,
    label: t("publicSearch.suggestions.apartments", "Departamentos"),
    to: "/?type=apartment",
  },
  {
    icon: MapPin,
    label: t("publicSearch.suggestions.puertoVallarta", "Puerto Vallarta"),
    to: "/?city=Puerto+Vallarta",
  },
  {
    icon: MapPin,
    label: t("publicSearch.suggestions.rivieraNayarit", "Riviera Nayarit"),
    to: "/?city=Riviera+Nayarit",
  },
];

/* ────────────────────────────────────────────── */

const PublicSearch = ({
  showDesktopInput = true,
  showMobileTrigger = true,
  /** When rendered inside a transparent header over the hero */
  variant = "default",
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [isDesktopOpen, setIsDesktopOpen] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const desktopRef = useRef(null);
  const mobileInputRef = useRef(null);
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

  const doSearch = (q) => {
    const trimmed = String(q || "").trim();
    if (!trimmed) return;
    navigate(`/?city=${encodeURIComponent(trimmed)}`);
    closeAll();
  };

  const closeAll = () => {
    setQuery("");
    setIsDesktopOpen(false);
    setIsMobileOpen(false);
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      doSearch(query);
    }
    if (e.key === "Escape") {
      setIsDesktopOpen(false);
      setIsMobileOpen(false);
    }
  };

  const goTo = (to) => {
    navigate(to);
    closeAll();
  };

  /* ── Suggestion list (reused in desktop + mobile) ── */
  const SuggestionList = ({ compact }) => (
    <div className={cn("py-2", compact && "px-1")}>
      <p className="px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500">
        {t("publicSearch.quickFilters", "Búsquedas populares")}
      </p>
      {suggestions.map((s) => {
        const Icon = s.icon;
        return (
          <button
            key={s.to}
            type="button"
            onClick={() => goTo(s.to)}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-700 transition hover:bg-cyan-50 dark:text-slate-300 dark:hover:bg-slate-700"
          >
            <Icon size={15} className="text-cyan-600 dark:text-cyan-400" />
            <span>{s.label}</span>
          </button>
        );
      })}
    </div>
  );

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
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-cyan-600/80 dark:text-cyan-400"
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
                  ? "border border-white/30 bg-white/15 text-white placeholder:text-white/60 backdrop-blur-sm focus:bg-white/25 focus:border-white/50"
                  : "border border-cyan-200/90 bg-white text-slate-800 shadow-sm focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-100",
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
                className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-[85] overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900"
              >
                {query.trim().length > 0 && (
                  <div className="border-b border-slate-100 p-2 dark:border-slate-700">
                    <button
                      type="button"
                      onClick={() => doSearch(query)}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-cyan-700 transition hover:bg-cyan-50 dark:text-cyan-400 dark:hover:bg-slate-800"
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
            setTimeout(() => mobileInputRef.current?.focus(), 50);
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
