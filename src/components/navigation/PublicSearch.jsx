import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { Search, X, MapPin, Home } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { createPortal } from "react-dom";
import { AnimatePresence, motion as Motion } from "framer-motion";
import { storage } from "../../api/appwriteClient";
import env from "../../env";
import { cn } from "../../utils/cn";
import { getPublicPropertyRoute } from "../../utils/internalRoutes";
import LazyImage from "../common/atoms/LazyImage";
import {
  PUBLIC_SEARCH_MIN_QUERY_LENGTH,
  usePublicSearchData,
} from "./usePublicSearchData";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=200&q=60";

const PublicSearch = ({
  showDesktopInput = true,
  showMobileTrigger = true,
  variant = "default",
  showDesktopInputOnMobile = false,
  desktopContainerClassName = "",
  mobileTriggerClassName = "",
  onMobileOpenChange,
}) => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [isDesktopOpen, setIsDesktopOpen] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const desktopRef = useRef(null);
  const mobileInputRef = useRef(null);
  const dropdownRef = useRef(null);
  const formattersRef = useRef(new Map());

  const language = i18n.resolvedLanguage || i18n.language || "es";
  const {
    trimmedQuery,
    suggestions,
    liveResults,
    liveLoading,
    amenityMatches,
    resetResults,
  } = usePublicSearchData({
    query,
    language,
    t,
  });

  useEffect(() => {
    onMobileOpenChange?.(isMobileOpen);
  }, [isMobileOpen, onMobileOpenChange]);

  useEffect(() => {
    formattersRef.current.clear();
  }, [language]);

  useEffect(() => {
    if (!isDesktopOpen) return;
    const handleOutsideClick = (event) => {
      if (!desktopRef.current?.contains(event.target)) {
        setIsDesktopOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [isDesktopOpen]);

  const formatPrice = useCallback(
    (value, currency = "MXN") => {
      const normalizedCurrency = String(currency || "MXN")
        .trim()
        .toUpperCase();
      const cacheKey = `${language}:${normalizedCurrency}`;

      let formatter = formattersRef.current.get(cacheKey);
      if (!formatter) {
        try {
          formatter = new Intl.NumberFormat(language, {
            style: "currency",
            currency: normalizedCurrency,
            maximumFractionDigits: 0,
          });
        } catch {
          formatter = new Intl.NumberFormat(language, {
            style: "currency",
            currency: "MXN",
            maximumFractionDigits: 0,
          });
        }
        formattersRef.current.set(cacheKey, formatter);
      }

      return formatter.format(Number(value) || 0);
    },
    [language],
  );

  const getPropertyImage = useCallback((property) => {
    if (property?.images?.[0]) return String(property.images[0]);
    if (property?.mainImageUrl) return String(property.mainImageUrl);

    const firstImageId = property?.galleryImageIds?.[0];
    const bucketId = env.appwrite.buckets.propertyImages;
    if (firstImageId && bucketId) {
      return storage.getFileView({
        bucketId,
        fileId: firstImageId,
      });
    }

    return FALLBACK_IMAGE;
  }, []);

  const decoratedLiveResults = useMemo(
    () =>
      liveResults.map((property) => ({
        ...property,
        previewImage: getPropertyImage(property),
        formattedPrice: formatPrice(property.price, property.currency),
      })),
    [formatPrice, getPropertyImage, liveResults],
  );

  const closeAll = useCallback(() => {
    setQuery("");
    setIsDesktopOpen(false);
    setIsMobileOpen(false);
    setActiveIndex(-1);
    resetResults();
  }, [resetResults]);

  const goTo = useCallback(
    (to) => {
      navigate(to);
      closeAll();
    },
    [closeAll, navigate],
  );

  const doSearch = useCallback(
    (value) => {
      const nextQuery = String(value || "").trim();
      if (!nextQuery) return;
      goTo(`/buscar?q=${encodeURIComponent(nextQuery)}`);
    },
    [goTo],
  );

  const navItems = useMemo(() => {
    const items = [];

    if (trimmedQuery.length > 0) {
      items.push({ type: "search", action: () => doSearch(trimmedQuery) });
    }

    if (
      trimmedQuery.length >= PUBLIC_SEARCH_MIN_QUERY_LENGTH &&
      !liveLoading
    ) {
      decoratedLiveResults.forEach((property) => {
        items.push({
          type: "property",
          action: () => goTo(getPublicPropertyRoute(property.slug, language)),
        });
      });
    }

    amenityMatches.forEach((amenity) => {
      items.push({
        type: "amenity",
        action: () =>
          goTo(`/buscar?q=${encodeURIComponent(amenity.displayName)}`),
      });
    });

    suggestions.forEach((suggestion) => {
      items.push({ type: "suggestion", action: () => goTo(suggestion.to) });
    });

    return items;
  }, [
    amenityMatches,
    decoratedLiveResults,
    doSearch,
    goTo,
    liveLoading,
    suggestions,
    trimmedQuery,
  ]);

  useEffect(() => {
    setActiveIndex(-1);
  }, [navItems.length]);

  useEffect(() => {
    if (activeIndex < 0) return;
    const container = dropdownRef.current;
    if (!container) return;
    const navButtons = container.querySelectorAll("[data-nav-item]");
    navButtons[activeIndex]?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  const onKeyDown = useCallback(
    (event) => {
      if (event.key === "ArrowDown") {
        event.preventDefault();
        setActiveIndex((prev) => (prev < navItems.length - 1 ? prev + 1 : 0));
        return;
      }

      if (event.key === "ArrowUp") {
        event.preventDefault();
        setActiveIndex((prev) => (prev > 0 ? prev - 1 : navItems.length - 1));
        return;
      }

      if (event.key === "Enter") {
        event.preventDefault();
        if (activeIndex >= 0 && navItems[activeIndex]) {
          navItems[activeIndex].action();
        } else {
          doSearch(trimmedQuery);
        }
        return;
      }

      if (event.key === "Escape") {
        closeAll();
      }
    },
    [activeIndex, closeAll, doSearch, navItems, trimmedQuery],
  );

  const SuggestionList = ({ compact = false }) => {
    let indexOffset = trimmedQuery.length > 0 ? 1 : 0;

    return (
      <div ref={dropdownRef} className={cn("py-2", compact && "px-1")}>
        {trimmedQuery.length >= PUBLIC_SEARCH_MIN_QUERY_LENGTH && (
          <div className="border-b border-slate-100 dark:border-slate-700">
            {liveLoading ? (
              <div className="flex items-center justify-center gap-2 py-4 text-xs text-slate-400">
                <Search size={14} className="animate-pulse" />
                {t("publicSearch.searching")}
              </div>
            ) : decoratedLiveResults.length > 0 ? (
              <div className="py-1.5">
                <p className="px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                  {t("publicSearch.properties")}
                </p>
                {decoratedLiveResults.map((property) => {
                  const currentIndex = indexOffset++;
                  return (
                    <button
                      key={property.$id}
                      type="button"
                      data-nav-item
                      onClick={() =>
                        goTo(getPublicPropertyRoute(property.slug, language))
                      }
                      onMouseEnter={() => setActiveIndex(currentIndex)}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition",
                        activeIndex === currentIndex
                          ? "bg-cyan-50 dark:bg-slate-700"
                          : "hover:bg-cyan-50 dark:hover:bg-slate-700",
                      )}
                    >
                      <LazyImage
                        src={property.previewImage}
                        alt={property.title}
                        className="h-11 w-14 shrink-0 rounded-lg object-cover"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">
                          {property.title}
                        </p>
                        <p className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                          <MapPin size={10} />
                          {property.city}
                        </p>
                      </div>
                      <span className="shrink-0 text-xs font-bold text-cyan-700 dark:text-cyan-400">
                        {property.formattedPrice}
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

        {amenityMatches.length > 0 && (
          <>
            <p className="px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500">
              {t("publicSearch.matchingAmenities")}
            </p>
            {amenityMatches.map((amenity) => {
              const currentIndex = indexOffset++;
              return (
                <button
                  key={amenity.slug}
                  type="button"
                  data-nav-item
                  onClick={() =>
                    goTo(`/buscar?q=${encodeURIComponent(amenity.displayName)}`)
                  }
                  onMouseEnter={() => setActiveIndex(currentIndex)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-700 transition dark:text-slate-300",
                    activeIndex === currentIndex
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

        <p className="px-3 pb-1.5 pt-1 text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500">
          {t("publicSearch.quickFilters")}
        </p>
        {suggestions.map((suggestion) => {
          const currentIndex = indexOffset++;
          const Icon = suggestion.icon;
          return (
            <button
              key={suggestion.to}
              type="button"
              data-nav-item
              onClick={() => goTo(suggestion.to)}
              onMouseEnter={() => setActiveIndex(currentIndex)}
              className={cn(
                "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-700 transition dark:text-slate-300",
                activeIndex === currentIndex
                  ? "bg-cyan-50 dark:bg-slate-700"
                  : "hover:bg-cyan-50 dark:hover:bg-slate-700",
              )}
            >
              <Icon size={15} className="text-cyan-600 dark:text-cyan-400" />
              <span>{suggestion.label}</span>
            </button>
          );
        })}
      </div>
    );
  };

  const mobileOverlay = (
    <AnimatePresence>
      {isMobileOpen && (
        <Motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[110] bg-slate-950/55 p-3 backdrop-blur-sm sm:hidden"
        >
          <Motion.section
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="mx-auto flex h-full w-full max-w-[34rem] flex-col overflow-hidden rounded-3xl border border-cyan-100 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-950/95"
          >
            <header className="flex items-center gap-2 border-b border-slate-100 px-3 py-3 dark:border-slate-700">
              <label className="relative block flex-1">
                <Search
                  size={15}
                  className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 text-cyan-600"
                />
                <input
                  ref={mobileInputRef}
                  type="text"
                  autoFocus
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  onKeyDown={onKeyDown}
                  placeholder={t(
                    "publicSearch.placeholder",
                    "Buscar propiedades, ciudades, caracteristicas...",
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

            <div className="flex-1 overflow-y-auto">
              {trimmedQuery.length > 0 ? (
                <div className="p-4">
                  <button
                    type="button"
                    onClick={() => doSearch(trimmedQuery)}
                    className="flex w-full items-center gap-3 rounded-xl bg-cyan-50 px-4 py-3 text-sm font-medium text-cyan-700 transition hover:bg-cyan-100 dark:bg-cyan-900/30 dark:text-cyan-400"
                  >
                    <Search size={16} />
                    <span>
                      {t("publicSearch.searchFor", "Buscar")}{" "}
                      <strong>"{trimmedQuery}"</strong>
                    </span>
                  </button>
                </div>
              ) : null}
              <SuggestionList compact />
            </div>
          </Motion.section>
        </Motion.div>
      )}
    </AnimatePresence>
  );

  const mobileTriggerBaseClass =
    variant === "transparent"
      ? "inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-white/30 bg-white/15 text-white backdrop-blur-sm transition hover:bg-white/25 sm:hidden"
      : "inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 backdrop-blur-sm transition hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 sm:hidden";

  return (
    <>
      {showDesktopInput && (
        <div
          ref={desktopRef}
          className={cn(
            "relative w-full max-w-md",
            !showDesktopInputOnMobile && "hidden sm:block",
            desktopContainerClassName,
          )}
        >
          <label className="relative block">
            <Search
              size={15}
              className={cn(
                "pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2",
                variant === "transparent"
                  ? "text-white/70"
                  : "text-cyan-600/80 dark:text-cyan-400",
              )}
            />
            <input
              type="text"
              value={query}
              onFocus={() => setIsDesktopOpen(true)}
              onChange={(event) => {
                setQuery(event.target.value);
                setIsDesktopOpen(true);
              }}
              onKeyDown={onKeyDown}
              placeholder={t(
                "publicSearch.placeholder",
                "Buscar propiedades, ciudades...",
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
              <Motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
                className="absolute right-0 top-[calc(100%+0.5rem)] z-[85] w-[min(24rem,calc(100vw-2rem))] min-w-full max-h-[calc(100vh-8rem)] overflow-y-auto overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900"
              >
                {trimmedQuery.length > 0 && (
                  <div className="border-b border-slate-100 p-2 dark:border-slate-700">
                    <button
                      type="button"
                      data-nav-item
                      onClick={() => doSearch(trimmedQuery)}
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
                        <strong>"{trimmedQuery}"</strong>
                      </span>
                    </button>
                  </div>
                )}
                <SuggestionList />
              </Motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {showMobileTrigger && (
        <button
          type="button"
          onClick={() => {
            setIsMobileOpen(true);
            requestAnimationFrame(() => {
              requestAnimationFrame(() => mobileInputRef.current?.focus());
            });
          }}
          className={cn(mobileTriggerBaseClass, mobileTriggerClassName)}
          aria-label={t("publicSearch.open", "Buscar")}
        >
          <Search size={16} />
        </button>
      )}

      {showMobileTrigger && typeof document !== "undefined"
        ? createPortal(mobileOverlay, document.body)
        : null}
    </>
  );
};

export default PublicSearch;
