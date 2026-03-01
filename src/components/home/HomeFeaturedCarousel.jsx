import { useEffect, useState, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { m } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Compass,
  Star,
} from "lucide-react";
import { resourcesService } from "../../services/resourcesService";
import PropertyCard from "../common/molecules/PropertyCard";
import { useSwipeCarousel } from "../../hooks/useSwipeCarousel";

const FEATURED_LIMIT = 12;
const AUTO_ADVANCE_MS = 5000;

const reduceMotion =
  typeof window !== "undefined" &&
  window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;

/* ── Card Skeleton ── */
const CardSkeleton = () => (
  <div className="w-full animate-pulse overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-700/50 dark:bg-slate-800/60">
    <div className="aspect-[4/3] bg-slate-200 dark:bg-slate-700" />
    <div className="space-y-2.5 p-5">
      <div className="h-4 w-3/4 rounded bg-slate-200 dark:bg-slate-700" />
      <div className="h-3 w-1/2 rounded bg-slate-200 dark:bg-slate-700" />
      <div className="h-5 w-1/3 rounded bg-slate-200 dark:bg-slate-700" />
    </div>
  </div>
);

/* ── Main Infinite Carousel ── */
const HomeFeaturedCarousel = () => {
  const { t } = useTranslation();
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Carousel state
  const [currentIdx, setCurrentIdx] = useState(0);
  const [visibleCount, setVisibleCount] = useState(3);
  const containerRef = useRef(null);
  const autoRef = useRef(null);
  const [isPaused, setIsPaused] = useState(false);

  // Fetch resources
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await resourcesService.listPublic({
          limit: FEATURED_LIMIT,
          filters: { featured: true, sort: "recent" },
        });
        if (!cancelled) {
          const docs = data.documents || [];
          if (docs.length === 0) {
            const fallback = await resourcesService.listPublic({
              limit: FEATURED_LIMIT,
              filters: { sort: "recent" },
            });
            setResources(fallback.documents || []);
          } else {
            setResources(docs);
          }
        }
      } catch (err) {
        if (!cancelled) setError(err?.message || "Error");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Responsive visible count
  useEffect(() => {
    const updateVisibleCount = () => {
      const w = window.innerWidth;
      if (w < 640) setVisibleCount(1);
      else if (w < 1024) setVisibleCount(2);
      else setVisibleCount(3);
    };
    updateVisibleCount();
    window.addEventListener("resize", updateVisibleCount);
    return () => window.removeEventListener("resize", updateVisibleCount);
  }, []);

  const maxIdx = Math.max(0, resources.length - visibleCount);

  // Auto-advance (card by card, infinite loop)
  useEffect(() => {
    if (resources.length <= visibleCount || isPaused || reduceMotion) return;
    autoRef.current = setInterval(() => {
      setCurrentIdx((prev) => (prev >= maxIdx ? 0 : prev + 1));
    }, AUTO_ADVANCE_MS);
    return () => clearInterval(autoRef.current);
  }, [resources.length, visibleCount, maxIdx, isPaused]);

  const goTo = useCallback(
    (dir) => {
      setCurrentIdx((prev) => {
        if (dir === "next") return prev >= maxIdx ? 0 : prev + 1;
        return prev <= 0 ? maxIdx : prev - 1;
      });
    },
    [maxIdx],
  );

  const retry = () => {
    setError(null);
    setLoading(true);
    resourcesService
      .listPublic({
        limit: FEATURED_LIMIT,
        filters: { featured: true, sort: "recent" },
      })
      .then((data) => setResources(data.documents || []))
      .catch((err) => setError(err?.message || "Error"))
      .finally(() => setLoading(false));
  };

  const swipeHandlers = useSwipeCarousel({
    onSwipeLeft: useCallback(() => goTo("next"), [goTo]),
    onSwipeRight: useCallback(() => goTo("prev"), [goTo]),
  });

  const hasMultiplePages = resources.length > visibleCount;

  return (
    <section className="relative overflow-hidden bg-slate-50 px-4 py-14 sm:px-6 sm:py-18 lg:pt-28 dark:bg-slate-950">
      {/* Ambient glow (dark only) */}
      <div className="pointer-events-none absolute inset-0 hidden bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(14,165,233,0.12),transparent_60%)] dark:block" />

      <div className="relative z-10 mx-auto max-w-6xl">
        {/* Header */}
        <m.div
          initial={reduceMotion ? false : { opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.4 }}
          className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
        >
          <div>
            {/* Premium badge */}
            <span className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-amber-600 dark:border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-300">
              <Star
                size={12}
                className="fill-amber-500 text-amber-500 dark:fill-amber-400 dark:text-amber-400"
              />
              {t("client:homeNew.featured.badge", "Selección exclusiva")}
            </span>
            <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl dark:text-white">
              {t("client:homeNew.featured.title", "Destacados para ti")}
            </h2>
            <p className="mt-1 text-slate-500 dark:text-slate-400">
              {t(
                "client:homeNew.featured.subtitle",
                "Selección curada de los mejores recursos disponibles.",
              )}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Nav arrows */}
            {hasMultiplePages && (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => goTo("prev")}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-cyan-400/40 hover:bg-cyan-50 hover:text-cyan-600 dark:border-white/15 dark:bg-white/5 dark:text-white dark:shadow-none dark:hover:border-cyan-400/40 dark:hover:bg-white/10"
                  aria-label={t("client:common.previous", "Anterior")}
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  type="button"
                  onClick={() => goTo("next")}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-cyan-400/40 hover:bg-cyan-50 hover:text-cyan-600 dark:border-white/15 dark:bg-white/5 dark:text-white dark:shadow-none dark:hover:border-cyan-400/40 dark:hover:bg-white/10"
                  aria-label={t("client:common.next", "Siguiente")}
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            )}
          </div>
        </m.div>

        {/* Content */}
        <div
          ref={containerRef}
          onPointerEnter={() => setIsPaused(true)}
          onPointerLeave={() => setIsPaused(false)}
        >
          {/* Loading */}
          {loading && (
            <div
              className="grid gap-5"
              style={{
                gridTemplateColumns: `repeat(${visibleCount}, minmax(0, 1fr))`,
              }}
            >
              {Array.from({ length: visibleCount }).map((_, i) => (
                <CardSkeleton key={i} />
              ))}
            </div>
          )}

          {/* Error */}
          {!loading && error && (
            <div className="flex flex-col items-center gap-3 rounded-2xl border border-red-200 bg-red-50 px-6 py-10 text-center dark:border-red-500/20 dark:bg-red-950/20">
              <AlertCircle
                size={28}
                className="text-red-500 dark:text-red-400"
              />
              <p className="text-sm text-red-600 dark:text-red-300">
                {t(
                  "client:homeNew.featured.error",
                  "No pudimos cargar los destacados.",
                )}
              </p>
              <button
                type="button"
                onClick={retry}
                className="rounded-lg bg-red-100 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-200 dark:bg-red-500/20 dark:text-red-300 dark:hover:bg-red-500/30"
              >
                {t("client:homeNew.common.retry", "Reintentar")}
              </button>
            </div>
          )}

          {/* Empty */}
          {!loading && !error && resources.length === 0 && (
            <div className="flex flex-col items-center gap-3 rounded-2xl border border-slate-200 bg-white px-6 py-10 text-center dark:border-slate-700/50 dark:bg-slate-800/30">
              <Compass
                size={28}
                className="text-slate-400 dark:text-slate-500"
              />
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {t(
                  "client:homeNew.featured.empty",
                  "Aún no hay recursos destacados.",
                )}
              </p>
              <Link
                to="/buscar"
                className="rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-cyan-400"
              >
                {t("client:homeNew.featured.exploreAll", "Explorar todo")}
              </Link>
            </div>
          )}

          {/* Carousel — sliding push effect */}
          {!loading && !error && resources.length > 0 && (
            <div
              className="overflow-hidden"
              style={{ touchAction: "pan-y" }}
              {...swipeHandlers}
            >
              <m.div
                animate={{
                  x: `calc(-${currentIdx} * (100% / ${visibleCount} + ${20 / visibleCount}px))`,
                }}
                transition={
                  reduceMotion
                    ? { duration: 0 }
                    : { duration: 0.45, ease: [0.25, 0.1, 0.25, 1] }
                }
                className="flex items-stretch"
                style={{ gap: "20px" }}
              >
                {resources.map((r) => (
                  <div
                    key={r.$id}
                    className="shrink-0"
                    style={{
                      width: `calc((100% - ${(visibleCount - 1) * 20}px) / ${visibleCount})`,
                    }}
                  >
                    <PropertyCard property={r} className="h-full" />
                  </div>
                ))}
              </m.div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default HomeFeaturedCarousel;
