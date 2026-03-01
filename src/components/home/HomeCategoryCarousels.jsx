import { useEffect, useState, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { m } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Home,
  Car,
  Wrench,
  Music,
  Compass,
  CalendarHeart,
} from "lucide-react";
import { resourcesService } from "../../services/resourcesService";
import { useInstanceModulesContext } from "../../contexts/InstanceModulesContext";
import PropertyCard from "../common/molecules/PropertyCard";
import { useSwipeCarousel } from "../../hooks/useSwipeCarousel";

const ITEMS_PER_ROW = 8;
const AUTO_ADVANCE_MS = 5000;

const reduceMotion =
  typeof window !== "undefined" &&
  window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;

/* ── Row config ── */
const ROWS = [
  {
    key: "property",
    icon: Home,
    resourceType: "property",
    moduleKey: "module.resources",
  },
  {
    key: "vehicle",
    icon: Car,
    resourceType: "vehicle",
    moduleKey: "module.resources",
  },
  {
    key: "service",
    icon: Wrench,
    resourceType: "service",
    moduleKey: "module.resources",
  },
  {
    key: "music",
    icon: Music,
    resourceType: "music",
    moduleKey: "module.resources",
  },
  {
    key: "experience",
    icon: Compass,
    resourceType: "experience",
    moduleKey: "module.resources",
  },
  {
    key: "venue",
    icon: CalendarHeart,
    resourceType: "venue",
    moduleKey: "module.resources",
  },
];

/* ── Card Skeleton matching PropertyCard proportions ── */
const CardSkeleton = () => (
  <div className="w-full animate-pulse overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-700/50 dark:bg-slate-900">
    <div className="aspect-[4/3] bg-slate-200 dark:bg-slate-700" />
    <div className="space-y-3 p-4">
      <div className="h-3 w-16 rounded bg-slate-200 dark:bg-slate-700" />
      <div className="h-4 w-3/4 rounded bg-slate-200 dark:bg-slate-700" />
      <div className="h-3 w-1/2 rounded bg-slate-200 dark:bg-slate-700" />
      <div className="flex gap-4 pt-1">
        <div className="h-3 w-12 rounded bg-slate-200 dark:bg-slate-700" />
        <div className="h-3 w-12 rounded bg-slate-200 dark:bg-slate-700" />
        <div className="h-3 w-12 rounded bg-slate-200 dark:bg-slate-700" />
      </div>
      <div className="h-5 w-1/3 rounded bg-slate-200 dark:bg-slate-700" />
    </div>
  </div>
);

/* ── Single Category Row ── */
const CategoryRow = ({ config }) => {
  const { t } = useTranslation();
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [visibleCount, setVisibleCount] = useState(3);
  const containerRef = useRef(null);
  const autoRef = useRef(null);
  const [isPaused, setIsPaused] = useState(false);

  const Icon = config.icon;

  // Responsive visible count — fewer cards since PropertyCard is larger
  useEffect(() => {
    const update = () => {
      const w = window.innerWidth;
      if (w < 640) setVisibleCount(1);
      else if (w < 1024) setVisibleCount(2);
      else setVisibleCount(3);
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  // Fetch
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const data = await resourcesService.listPublic({
          limit: ITEMS_PER_ROW,
          filters: { resourceType: config.resourceType, sort: "recent" },
        });
        if (!cancelled) setResources(data.documents || []);
      } catch {
        // silent
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [config.resourceType]);

  const maxIdx = Math.max(0, resources.length - visibleCount);

  // Auto-advance (card by card, infinite loop)
  useEffect(() => {
    if (resources.length <= visibleCount || isPaused || reduceMotion) return;
    autoRef.current = setInterval(() => {
      setCurrentIdx((prev) => (prev >= maxIdx ? 0 : prev + 1));
    }, AUTO_ADVANCE_MS);
    return () => clearInterval(autoRef.current);
  }, [resources.length, visibleCount, maxIdx, isPaused]);

  const goPrev = useCallback(() => {
    setCurrentIdx((prev) => (prev <= 0 ? maxIdx : prev - 1));
  }, [maxIdx]);

  const goNext = useCallback(() => {
    setCurrentIdx((prev) => (prev >= maxIdx ? 0 : prev + 1));
  }, [maxIdx]);

  const swipeHandlers = useSwipeCarousel({
    onSwipeLeft: goNext,
    onSwipeRight: goPrev,
  });

  if (!loading && resources.length === 0) return null;

  const label = t(
    `client:homeNew.categoryRows.${config.key}.title`,
    t(`client:common.enums.resourceType.${config.key}`, config.key),
  );
  const description = t(
    `client:homeNew.categoryRows.${config.key}.description`,
    "",
  );
  const searchUrl = `/buscar?resourceType=${config.resourceType}`;

  return (
    <m.div
      initial={reduceMotion ? false : { opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.45 }}
      className="py-12 first:pt-0 last:pb-0"
    >
      {/* ── Section header ── */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-2xl">
          {/* Category label */}
          <div className="mb-2 flex items-center gap-2">
            <Icon size={16} className="text-cyan-600 dark:text-cyan-400" />
            <span className="text-sm font-semibold tracking-wide text-cyan-600 uppercase dark:text-cyan-400">
              {t(`client:common.enums.resourceType.${config.key}`, config.key)}
            </span>
          </div>
          {/* Big title */}
          <h3 className="text-2xl font-bold text-slate-900 sm:text-3xl dark:text-white">
            {label}
          </h3>
          {/* Description */}
          {description && (
            <p className="mt-2 text-base text-slate-500 dark:text-slate-400">
              {description}
            </p>
          )}
        </div>

        {/* CTA + arrows */}
        <div className="flex shrink-0 items-center gap-3">
          <button
            type="button"
            onClick={goPrev}
            className="hidden h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:border-slate-300 hover:text-slate-800 sm:flex dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:border-slate-600 dark:hover:text-white"
            aria-label={t("client:common.previous", "Anterior")}
          >
            <ChevronLeft size={18} />
          </button>
          <button
            type="button"
            onClick={goNext}
            className="hidden h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:border-slate-300 hover:text-slate-800 sm:flex dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:border-slate-600 dark:hover:text-white"
            aria-label={t("client:common.next", "Siguiente")}
          >
            <ChevronRight size={18} />
          </button>

          <Link
            to={searchUrl}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:text-white"
          >
            {t("client:homeNew.categoryRows.viewAll", "Ver todos")}
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>

      {/* ── Sliding carousel ── */}
      <div
        ref={containerRef}
        className="overflow-hidden"
        style={{ touchAction: "pan-y" }}
        onPointerEnter={() => setIsPaused(true)}
        onPointerLeave={() => setIsPaused(false)}
        {...swipeHandlers}
      >
        {loading ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: visibleCount }).map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        ) : (
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
        )}
      </div>

      {/* Mobile arrows (below cards) */}
      {!loading && resources.length > visibleCount && (
        <div className="mt-4 flex items-center justify-center gap-3 sm:hidden">
          <button
            type="button"
            onClick={goPrev}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400"
            aria-label={t("client:common.previous", "Anterior")}
          >
            <ChevronLeft size={18} />
          </button>
          <span className="text-xs tabular-nums text-slate-400">
            {currentIdx + 1} / {resources.length}
          </span>
          <button
            type="button"
            onClick={goNext}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400"
            aria-label={t("client:common.next", "Siguiente")}
          >
            <ChevronRight size={18} />
          </button>
        </div>
      )}
    </m.div>
  );
};

/* ── Main Section ── */
const HomeCategoryCarousels = () => {
  const { t } = useTranslation();
  const { isEnabled } = useInstanceModulesContext();

  const visibleRows = ROWS.filter(
    (r) => r.moduleKey === null || isEnabled(r.moduleKey),
  );

  if (visibleRows.length === 0) return null;

  return (
    <section className="bg-slate-50 px-4 py-14 sm:px-6 sm:py-20 dark:bg-slate-950">
      <div className="mx-auto max-w-7xl divide-y divide-slate-200/70 dark:divide-slate-800/70">
        {visibleRows.map((rowConfig) => (
          <CategoryRow key={rowConfig.key} config={rowConfig} />
        ))}
      </div>
    </section>
  );
};

export default HomeCategoryCarousels;
