import { useMemo, useEffect, useState, useCallback, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { m } from "framer-motion";
import {
  Search,
  Heart,
  Clock,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { favoritesService } from "../../services/favoritesService";
import { resourcesService } from "../../services/resourcesService";
import PropertyCard from "../common/molecules/PropertyCard";
import { useSwipeCarousel } from "../../hooks/useSwipeCarousel";

const RECENT_SEARCHES_KEY = "inmobo_recent_searches";
const FAVORITES_LIMIT = 10;
const AUTO_ADVANCE_MS = 5000;

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

const reduceMotion =
  typeof window !== "undefined" &&
  window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;

/* ── Card skeleton matching PropertyCard ── */
const CardSkeleton = () => (
  <div className="w-full animate-pulse overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-700/50 dark:bg-slate-900">
    <div className="aspect-[4/3] bg-slate-200 dark:bg-slate-700" />
    <div className="space-y-3 p-4">
      <div className="h-3 w-16 rounded bg-slate-200 dark:bg-slate-700" />
      <div className="h-4 w-3/4 rounded bg-slate-200 dark:bg-slate-700" />
      <div className="h-3 w-1/2 rounded bg-slate-200 dark:bg-slate-700" />
      <div className="h-5 w-1/3 rounded bg-slate-200 dark:bg-slate-700" />
    </div>
  </div>
);

const HomeLoggedInSection = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [recentSearches, setRecentSearches] = useState(() =>
    getRecentSearches(),
  );
  const [favResources, setFavResources] = useState([]);
  const [favLoading, setFavLoading] = useState(false);
  const [favIdx, setFavIdx] = useState(0);
  const [favVisible, setFavVisible] = useState(3);
  const autoRef = useRef(null);
  const [isPaused, setIsPaused] = useState(false);

  // Responsive visible count
  useEffect(() => {
    const update = () => {
      const w = window.innerWidth;
      if (w < 640) setFavVisible(1);
      else if (w < 1024) setFavVisible(2);
      else setFavVisible(3);
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  // Fetch favorite resources
  useEffect(() => {
    if (!user?.$id) return;
    let cancelled = false;
    (async () => {
      try {
        setFavLoading(true);
        const favDocs = await favoritesService.listByUser(user.$id, {
          limit: FAVORITES_LIMIT,
        });
        const resourceIds = favDocs.map((f) => f.resourceId).filter(Boolean);
        if (cancelled || resourceIds.length === 0) {
          if (!cancelled) setFavLoading(false);
          return;
        }
        const resources = await resourcesService.listPublicByIds(resourceIds);
        if (!cancelled) {
          setFavResources(
            (resources?.documents || resources || []).slice(0, FAVORITES_LIMIT),
          );
        }
      } catch {
        // silent
      } finally {
        if (!cancelled) setFavLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.$id]);

  const favMaxIdx = Math.max(0, favResources.length - favVisible);

  // Auto-advance (card by card, infinite loop)
  useEffect(() => {
    if (favResources.length <= favVisible || isPaused || reduceMotion) return;
    autoRef.current = setInterval(() => {
      setFavIdx((prev) => (prev >= favMaxIdx ? 0 : prev + 1));
    }, AUTO_ADVANCE_MS);
    return () => clearInterval(autoRef.current);
  }, [favResources.length, favVisible, favMaxIdx, isPaused]);

  const favPrev = useCallback(() => {
    setFavIdx((prev) => (prev <= 0 ? favMaxIdx : prev - 1));
  }, [favMaxIdx]);

  const favNext = useCallback(() => {
    setFavIdx((prev) => (prev >= favMaxIdx ? 0 : prev + 1));
  }, [favMaxIdx]);

  const swipeHandlers = useSwipeCarousel({
    onSwipeLeft: favNext,
    onSwipeRight: favPrev,
  });

  if (!user) return null;

  const hasRecent = recentSearches.length > 0;
  const hasFavs = favResources.length > 0;

  if (!hasRecent && !hasFavs && !favLoading) return null;

  const handleRecentClick = (search) => {
    const params = new URLSearchParams();
    if (search.q) params.set("q", search.q);
    if (search.resourceType) params.set("resourceType", search.resourceType);
    if (search.category) params.set("category", search.category);
    params.set("page", "1");
    navigate(`/buscar?${params.toString()}`);
  };

  const clearRecentSearches = () => {
    try {
      localStorage.removeItem(RECENT_SEARCHES_KEY);
    } catch {
      // silent
    }
    setRecentSearches([]);
  };

  return (
    <section className="bg-slate-50/60 px-4 py-10 dark:bg-slate-900/30 sm:px-6 sm:py-12">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* ── Section A: Favorites carousel ── */}
        {(hasFavs || favLoading) && (
          <m.div
            initial={reduceMotion ? false : { opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.4 }}
          >
            <div className="mb-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Heart size={18} className="fill-rose-500 text-rose-500" />
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  {t("client:homeNew.loggedIn.favoritesTitle", "Tus favoritos")}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={favPrev}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:border-slate-300 hover:text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:border-slate-600 dark:hover:text-white"
                  aria-label={t("client:common.previous", "Anterior")}
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  type="button"
                  onClick={favNext}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:border-slate-300 hover:text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:border-slate-600 dark:hover:text-white"
                  aria-label={t("client:common.next", "Siguiente")}
                >
                  <ChevronRight size={16} />
                </button>
                <Link
                  to="/mis-favoritos"
                  className="ml-1 text-sm font-semibold text-cyan-600 transition hover:text-cyan-500 dark:text-cyan-400"
                >
                  {t("client:homeNew.loggedIn.viewFavorites", "Ver favoritos")}
                </Link>
              </div>
            </div>

            <div
              className="overflow-hidden"
              style={{ touchAction: "pan-y" }}
              onPointerEnter={() => setIsPaused(true)}
              onPointerLeave={() => setIsPaused(false)}
              {...swipeHandlers}
            >
              {favLoading ? (
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {Array.from({ length: favVisible }).map((_, i) => (
                    <CardSkeleton key={i} />
                  ))}
                </div>
              ) : (
                <m.div
                  animate={{
                    x: `calc(-${favIdx} * (100% / ${favVisible} + ${20 / favVisible}px))`,
                  }}
                  transition={
                    reduceMotion
                      ? { duration: 0 }
                      : { duration: 0.45, ease: [0.25, 0.1, 0.25, 1] }
                  }
                  className="flex items-stretch"
                  style={{ gap: "20px" }}
                >
                  {favResources.map((r) => (
                    <div
                      key={r.$id}
                      className="shrink-0"
                      style={{
                        width: `calc((100% - ${(favVisible - 1) * 20}px) / ${favVisible})`,
                      }}
                    >
                      <PropertyCard
                        property={r}
                        isFavorite
                        className="h-full"
                      />
                    </div>
                  ))}
                </m.div>
              )}
            </div>
          </m.div>
        )}

        {/* ── Section B: Recent searches ── */}
        {hasRecent && (
          <m.div
            initial={reduceMotion ? false : { opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="rounded-2xl border border-slate-100 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock size={16} className="text-cyan-500" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  {t(
                    "client:homeNew.loggedIn.recentSearches",
                    "Búsquedas recientes",
                  )}
                </h3>
              </div>
              <button
                type="button"
                onClick={clearRecentSearches}
                className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300"
              >
                <X size={12} />
                {t("client:homeNew.loggedIn.clearSearches", "Limpiar")}
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {recentSearches.map((s, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleRecentClick(s)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:border-cyan-300 hover:bg-cyan-50 hover:text-cyan-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-cyan-600 dark:hover:bg-cyan-950/30"
                >
                  <Search size={12} className="shrink-0 text-slate-400" />
                  <span className="truncate">
                    {s.label || s.q || s.resourceType}
                  </span>
                </button>
              ))}
            </div>
          </m.div>
        )}
      </div>
    </section>
  );
};

export default HomeLoggedInSection;
