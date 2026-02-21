import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  MapPin,
  Pause,
  Play,
  Search,
  Star,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { storage } from "../../../../api/appwriteClient";
import env from "../../../../env";
import { propertiesService } from "../../../../services/propertiesService";
import { getAllowedCategories } from "../../../../utils/resourceTaxonomy";
import { getPublicPropertyRoute } from "../../../../utils/internalRoutes";
import fallbackImage from "../../../../assets/img/examples/house/fachada.webp";

const ROTATE_MS = 6500;
const FEATURED_LIMIT = 10;
const RESOURCE_TYPES = [
  "property",
  "vehicle",
  "service",
  "experience",
  "venue",
];

// Words cycled by the typewriter, keyed by language prefix
const TYPEWRITER_WORDS = {
  es: ["hogar", "viaje", "servicio", "experiencia", "evento"],
  en: ["home", "trip", "service", "experience", "event"],
};

/* ── Typewriter styles (injected once) ── */
const TYPEWRITER_CSS = `
@keyframes tw-blink{0%,100%{opacity:1}50%{opacity:0}}
`;
let twStyleInjected = false;

/**
 * TypewriterWord – GPU-friendly, ref-driven (no state per char).
 * Writes directly to a <span> ref so React doesn't re-render on each letter.
 */
const TypewriterWord = ({ words }) => {
  const textRef = useRef(null);

  useEffect(() => {
    if (!twStyleInjected) {
      const s = document.createElement("style");
      s.textContent = TYPEWRITER_CSS;
      document.head.appendChild(s);
      twStyleInjected = true;
    }
  }, []);

  useEffect(() => {
    let timerId = null;
    let wi = 0;
    let ci = 0;
    let phase = "typing"; // typing | hold | deleting
    let cancelled = false;

    const el = textRef.current;
    if (!el) return;

    const step = () => {
      if (cancelled) return;
      const word = words[wi % words.length];

      if (phase === "typing") {
        ci += 1;
        el.textContent = word.slice(0, ci);
        if (ci >= word.length) {
          phase = "hold";
          timerId = setTimeout(step, 2000);
        } else {
          timerId = setTimeout(step, 80);
        }
      } else if (phase === "hold") {
        phase = "deleting";
        timerId = setTimeout(step, 200);
      } else {
        ci -= 1;
        el.textContent = word.slice(0, ci);
        if (ci <= 0) {
          wi = (wi + 1) % words.length;
          phase = "typing";
          timerId = setTimeout(step, 350);
        } else {
          timerId = setTimeout(step, 45);
        }
      }
    };

    step();
    return () => {
      cancelled = true;
      clearTimeout(timerId);
    };
  }, [words]);

  return (
    <span className="relative whitespace-nowrap">
      <span
        ref={textRef}
        className="bg-linear-to-r from-cyan-400 via-sky-300 to-cyan-400 bg-clip-text text-transparent"
      />
      <span
        className="ml-0.5 inline-block h-[0.82em] w-0.75 translate-y-[0.05em] rounded-sm bg-cyan-400"
        style={{ animation: "tw-blink 0.75s step-end infinite" }}
      />
    </span>
  );
};

const getResourceImage = (resource) => {
  if (resource?.mainImageUrl) return resource.mainImageUrl;
  if (Array.isArray(resource?.images) && resource.images[0])
    return resource.images[0];

  const firstGalleryImageId = Array.isArray(resource?.galleryImageIds)
    ? resource.galleryImageIds.find(Boolean)
    : "";

  const bucketId =
    env.appwrite?.buckets?.resourceImages ||
    env.appwrite?.buckets?.propertyImages;

  if (firstGalleryImageId && bucketId) {
    return storage.getFileView({
      bucketId,
      fileId: firstGalleryImageId,
    });
  }

  return fallbackImage;
};

const HomeHeroCarousel = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const [currentSlide, setCurrentSlide] = useState(0);
  const [featuredResources, setFeaturedResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [query, setQuery] = useState("");
  const [resourceType, setResourceType] = useState("property");
  const [category, setCategory] = useState("");
  // Tracks whether the current slide's background image has finished loading
  // so we can transition from blurred → sharp (blur-up effect).
  const [bgImgLoaded, setBgImgLoaded] = useState(false);
  const progressRef = useRef(0);
  const lastTimestampRef = useRef(null);
  const animationFrameRef = useRef(null);

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const data = await propertiesService.listPublic({
          limit: FEATURED_LIMIT,
          filters: { featured: true, sort: "recent" },
        });
        setFeaturedResources(data.documents || []);
      } catch {
        setFeaturedResources([]);
      } finally {
        setLoading(false);
      }
    };

    fetchFeatured();
  }, []);

  // ─── Progress bar driven by ref + CSS transition (no react re-render per frame) ───
  const progressBarRef = useRef(null);
  const progressFillRef = useRef(null);

  const categories = useMemo(
    () => getAllowedCategories(resourceType),
    [resourceType],
  );

  const hasFeaturedResources = featuredResources.length > 0;
  const hasMultipleFeatured = featuredResources.length > 1;

  const slides = hasFeaturedResources
    ? featuredResources
    : [
        {
          $id: "featured-placeholder",
          mainImageUrl: fallbackImage,
          title: t(
            "client:hero.fallback.title",
            "Encuentra tu próximo recurso ideal",
          ),
          city: "",
          state: "",
          resourceType: "property",
          category: "house",
          featured: false,
        },
      ];

  const safeCurrent =
    ((currentSlide % slides.length) + slides.length) % slides.length;
  const activeResource = slides[safeCurrent] || slides[0];

  // Reset blur state whenever the active slide changes.
  useEffect(() => {
    setBgImgLoaded(false);
  }, [activeResource?.$id]);

  /* ── Carousel timer: CSS transition drives bars, no per-frame React renders ── */
  const animateBars = useCallback((action) => {
    const els = [progressBarRef.current, progressFillRef.current].filter(
      Boolean,
    );
    if (action === "freeze") {
      els.forEach((el) => {
        const cur = getComputedStyle(el).transform;
        el.style.transition = "none";
        el.style.transform = cur;
      });
    } else if (action === "reset") {
      els.forEach((el) => {
        el.style.transition = "none";
        el.style.transform = "scaleX(0)";
      });
    } else {
      // "start"
      els.forEach((el) => {
        el.style.transition = "none";
        el.style.transform = "scaleX(0)";
        void el.offsetWidth;
        el.style.transition = `transform ${ROTATE_MS}ms linear`;
        el.style.transform = "scaleX(1)";
      });
    }
  }, []);

  useEffect(() => {
    if (!hasMultipleFeatured || isPaused) {
      animateBars("freeze");
      if (animationFrameRef.current)
        cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
      lastTimestampRef.current = null;
      if (!hasMultipleFeatured) {
        progressRef.current = 0;
        animateBars("reset");
      }
      return undefined;
    }

    animateBars("start");

    const id = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
      animateBars("start");
    }, ROTATE_MS);

    return () => clearInterval(id);
  }, [hasMultipleFeatured, isPaused, slides.length, animateBars]);

  const submitSearch = (event) => {
    event.preventDefault();
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    if (resourceType) params.set("resourceType", resourceType);
    if (category) params.set("category", category);
    params.set("page", "1");
    navigate(`/buscar?${params.toString()}`);
  };

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
    animateBars("start");
  }, [slides.length, animateBars]);

  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
    animateBars("start");
  }, [slides.length, animateBars]);

  if (loading) {
    return (
      <div className="relative min-h-dvh w-full animate-pulse bg-slate-200 dark:bg-slate-800" />
    );
  }

  return (
    <section className="relative min-h-dvh w-full overflow-hidden bg-slate-950">
      {/* Floating orb CSS animation (GPU-composited, zero JS) */}
      <style>{`
        @keyframes hero-float-up{0%,100%{transform:translate3d(0,0,0)}50%{transform:translate3d(0,-10px,0)}}
        @keyframes hero-float-down{0%,100%{transform:translate3d(0,0,0)}50%{transform:translate3d(0,10px,0)}}
        .hero-orb-a{animation:hero-float-up 6s ease-in-out infinite;will-change:transform}
        .hero-orb-b{animation:hero-float-down 7s ease-in-out infinite;will-change:transform}
      `}</style>

      <div className="absolute inset-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeResource?.$id || safeCurrent}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            className="absolute inset-0"
          >
            <img
              src={getResourceImage(activeResource)}
              alt={activeResource?.title || "Featured"}
              className="h-full w-full object-cover will-change-[filter] transition-[filter] duration-700 ease-out"
              style={{ filter: bgImgLoaded ? "blur(0px)" : "blur(16px)" }}
              onError={(event) => {
                event.target.onerror = null;
                event.target.src = fallbackImage;
                setBgImgLoaded(true);
              }}
              onLoad={() => setBgImgLoaded(true)}
            />
          </motion.div>
        </AnimatePresence>

        {hasFeaturedResources ? (
          <>
            <div className="absolute inset-0 bg-linear-to-b from-slate-950/68 via-slate-950/50 to-slate-950/85" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(34,211,238,0.25),transparent_45%),radial-gradient(circle_at_78%_30%,rgba(14,165,233,0.20),transparent_42%),radial-gradient(circle_at_50%_100%,rgba(2,132,199,0.24),transparent_40%)]" />
            <div className="hero-orb-a absolute -left-20 top-24 h-60 w-60 rounded-full bg-cyan-400/16 blur-3xl" />
            <div className="hero-orb-b absolute -right-16 bottom-24 h-56 w-56 rounded-full bg-sky-500/15 blur-3xl" />
          </>
        ) : (
          <div className="absolute inset-0 bg-linear-to-b from-slate-950/85 via-slate-950/70 to-slate-950/92" />
        )}
      </div>

      <div className="relative z-10 mx-auto flex min-h-dvh w-full max-w-7xl flex-col justify-center px-4 pb-8 pt-24 sm:px-6 sm:pb-10 sm:pt-28">
        <div className="max-w-3xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-cyan-300/45 bg-cyan-400/16 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-cyan-100">
            <Star size={12} />
            {t("client:featured.badge", "Exclusivo")}
          </span>
          <h1 className="mt-4 text-4xl font-black leading-[1.05] text-white sm:text-5xl lg:text-6xl">
            {t("client:hero.titlePrefix", "Aquí comienza")}{" "}
            <br className="hidden sm:block" />
            {t("client:hero.titleSuffix", "tu próximo")}{" "}
            <TypewriterWord
              words={
                TYPEWRITER_WORDS[i18n.language?.split("-")[0]] ??
                TYPEWRITER_WORDS.es
              }
            />
          </h1>
          <p className="mt-3 max-w-2xl text-base text-white/85 sm:text-lg">
            {t(
              "client:hero.subTitle",
              "Descubre propiedades, vehículos, servicios, experiencias y más en las mejores zonas.",
            )}
          </p>
        </div>

        <form
          onSubmit={submitSearch}
          className="mt-7 w-full rounded-3xl border border-white/20 bg-white/12 p-3 backdrop-blur-xl sm:p-4"
        >
          <div className="grid gap-2 sm:gap-3 md:grid-cols-[1fr_190px_220px_140px]">
            <label className="relative">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/70"
                size={16}
              />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={t(
                  "client:search.inputPlaceholder",
                  "Buscar por título, ciudad o palabra clave",
                )}
                className="h-11 w-full rounded-2xl border border-white/30 bg-white/15 pl-9 pr-3 text-sm text-white placeholder:text-white/70 outline-none transition focus:border-cyan-300 focus:bg-white/20"
              />
            </label>

            <select
              value={resourceType}
              onChange={(event) => {
                const next = event.target.value;
                setResourceType(next);
                setCategory("");
              }}
              className="h-11 rounded-2xl border border-white/30 bg-white/15 px-3 text-sm font-semibold text-white outline-none"
            >
              {RESOURCE_TYPES.map((type) => (
                <option key={type} value={type} className="text-slate-900">
                  {t(`client:common.enums.resourceType.${type}`, type)}
                </option>
              ))}
            </select>

            <select
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              className="h-11 rounded-2xl border border-white/30 bg-white/15 px-3 text-sm font-semibold text-white outline-none"
            >
              <option value="" className="text-slate-900">
                {t("client:search.allCategories", "Todas las categorías")}
              </option>
              {categories.map((cat) => (
                <option key={cat} value={cat} className="text-slate-900">
                  {t(`client:common.enums.category.${cat}`, cat)}
                </option>
              ))}
            </select>

            <button
              type="submit"
              className="h-11 rounded-2xl bg-cyan-500 px-4 text-sm font-bold text-white transition hover:bg-cyan-400"
            >
              {t("client:search.button", "Buscar")}
            </button>
          </div>
        </form>

        <div className="mt-4 space-y-3">
          <AnimatePresence mode="wait">
            <motion.article
              key={activeResource?.$id || safeCurrent}
              initial={{ opacity: 0, y: 10, scale: 0.99 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="relative overflow-hidden rounded-2xl border border-white/20 bg-slate-950/40 p-4 backdrop-blur-md sm:p-5"
            >
              {hasMultipleFeatured ? (
                <div
                  className="pointer-events-none absolute inset-0 bg-linear-to-r from-cyan-400/20 via-sky-400/12 to-transparent will-change-transform"
                  ref={progressFillRef}
                  style={{
                    transformOrigin: "left center",
                    transform: "scaleX(0)",
                  }}
                />
              ) : (
                <div className="pointer-events-none absolute inset-0 bg-linear-to-r from-cyan-400/12 via-sky-400/8 to-transparent" />
              )}

              <div className="absolute inset-x-0 bottom-0 h-0.5 bg-white/10" />
              {hasMultipleFeatured && (
                <div
                  className="absolute inset-x-0 bottom-0 h-0.5 bg-cyan-300 will-change-transform"
                  ref={progressBarRef}
                  style={{
                    transformOrigin: "left center",
                    transform: "scaleX(0)",
                  }}
                />
              )}

              <div className="relative z-10 mb-2 flex flex-wrap items-center gap-2">
                <span className="inline-flex rounded-full border border-cyan-300/45 bg-cyan-400/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-cyan-100">
                  {t(
                    `client:common.enums.resourceType.${activeResource.resourceType || "property"}`,
                    activeResource.resourceType || "Property",
                  )}
                </span>
                {activeResource.category && (
                  <span className="inline-flex rounded-full border border-white/25 bg-white/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/90">
                    {t(
                      `client:common.enums.category.${activeResource.category}`,
                      activeResource.category,
                    )}
                  </span>
                )}
              </div>

              <div className="relative z-10 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div className="flex min-w-0 items-start gap-3">
                  <img
                    src={getResourceImage(activeResource)}
                    alt={activeResource?.title || "Featured resource"}
                    className="h-16 w-24 shrink-0 rounded-lg border border-white/20 object-cover sm:h-18 sm:w-28"
                    onError={(event) => {
                      event.target.onerror = null;
                      event.target.src = fallbackImage;
                    }}
                  />
                  <div className="min-w-0">
                    <p className="line-clamp-2 text-lg font-extrabold text-white sm:text-xl">
                      {activeResource?.title || ""}
                    </p>
                    {(activeResource?.city || activeResource?.state) && (
                      <p className="mt-1 inline-flex items-center gap-1.5 text-sm text-white/80">
                        <MapPin size={14} className="text-cyan-300" />
                        {[activeResource.city, activeResource.state]
                          .filter(Boolean)
                          .join(", ")}
                      </p>
                    )}
                  </div>
                </div>

                {activeResource?.slug && (
                  <Link
                    to={getPublicPropertyRoute(
                      activeResource.slug,
                      i18n.resolvedLanguage || i18n.language,
                    )}
                    className="inline-flex w-fit items-center justify-center rounded-xl border border-white/35 bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.12em] text-white transition hover:bg-white/20"
                  >
                    {t("client:actions.viewDetails", "Ver detalles")}
                  </Link>
                )}
              </div>
            </motion.article>
          </AnimatePresence>

          {hasMultipleFeatured && (
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/75">
                {safeCurrent + 1} / {slides.length}
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={prevSlide}
                  className="rounded-full border border-white/35 bg-white/10 p-2 text-white transition hover:bg-white/20"
                  aria-label={t("client:common.previous", "Anterior")}
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => setIsPaused((prev) => !prev)}
                  className="rounded-full border border-white/35 bg-white/10 p-2 text-white transition hover:bg-white/20"
                  aria-label={
                    isPaused
                      ? t("client:common.resume", "Reanudar")
                      : t("client:common.pause", "Pausar")
                  }
                >
                  {isPaused ? <Play size={16} /> : <Pause size={16} />}
                </button>
                <button
                  type="button"
                  onClick={nextSlide}
                  className="rounded-full border border-white/35 bg-white/10 p-2 text-white transition hover:bg-white/20"
                  aria-label={t("client:common.next", "Siguiente")}
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default HomeHeroCarousel;
