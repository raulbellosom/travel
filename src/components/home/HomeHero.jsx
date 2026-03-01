import { useEffect, useRef, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { m, AnimatePresence } from "framer-motion";
import { Star, ChevronLeft, ChevronRight, MapPin } from "lucide-react";
import { resourcesService } from "../../services/resourcesService";
import {
  getOptimizedImage,
  getFileViewUrl,
} from "../../utils/imageOptimization";
import { getPublicPropertyRoute } from "../../utils/internalRoutes";
import ProgressiveImage from "../common/atoms/ProgressiveImage";
import PropertyCard from "../common/molecules/PropertyCard";
import fallbackImage from "../../assets/img/examples/house/fachada.webp";
import HomeSearchPanel from "./HomeSearchPanel";

const ROTATE_MS = 5000;
const FEATURED_LIMIT = 8;
const DECK_VISIBLE = 3;

/* ── Typewriter ── */
const TYPEWRITER_WORDS = {
  es: ["hogar", "viaje", "servicio", "música", "experiencia", "evento"],
  en: ["home", "trip", "service", "music", "experience", "event"],
};

const TYPEWRITER_CSS = `@keyframes tw-blink{0%,100%{opacity:1}50%{opacity:0}}`;
let twStyleInjected = false;

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
    let phase = "typing";
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

/* ── Image helper ── */
const getResourceImage = (resource) => {
  if (resource?.mainImageUrl) return resource.mainImageUrl;
  if (Array.isArray(resource?.images) && resource.images[0])
    return resource.images[0];
  const fid = Array.isArray(resource?.galleryImageIds)
    ? resource.galleryImageIds.find(Boolean)
    : "";
  if (fid) {
    const optimized = getOptimizedImage(fid, "hero");
    return optimized || getFileViewUrl(fid) || fallbackImage;
  }
  return fallbackImage;
};

const reduceMotion =
  typeof window !== "undefined" &&
  window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;

/* ── Compact mobile card for hero (horizontal layout) ── */
const MobileHeroCard = ({ resource, lang }) => {
  const { t } = useTranslation();
  const slug = resource?.slug;
  const route = slug ? getPublicPropertyRoute(slug, lang) : "#";
  const fileId =
    resource?.galleryImageIds?.[0] || resource?.mainImageFileId || null;
  const fallbackSrc =
    resource?.images?.[0] ||
    resource?.thumbnailUrl ||
    resource?.mainImageUrl ||
    resource?.coverImageUrl ||
    "";
  const resType = resource?.resourceType || "property";
  const category = resource?.category || "";

  return (
    <Link
      to={route}
      className="group flex items-stretch overflow-hidden rounded-2xl border border-white/10 bg-white/10 shadow-lg backdrop-blur-md transition hover:bg-white/15"
    >
      {/* Thumbnail */}
      <div className="relative w-28 shrink-0 overflow-hidden sm:w-32">
        <ProgressiveImage
          fileId={fileId}
          src={fallbackSrc}
          preset="thumb"
          aspectRatio="1/1"
          alt={resource?.title || ""}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        {/* Badges */}
        <div className="absolute left-1.5 top-1.5 flex flex-wrap gap-1">
          <span className="rounded bg-cyan-600/90 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider text-white backdrop-blur-sm">
            {t(`client:common.enums.resourceType.${resType}`, resType)}
          </span>
          {category && (
            <span className="rounded bg-white/25 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider text-white backdrop-blur-sm">
              {t(`client:common.enums.category.${category}`, category)}
            </span>
          )}
        </div>
      </div>
      {/* Info */}
      <div className="flex flex-1 flex-col justify-center gap-1.5 px-3 py-2.5">
        <h4 className="line-clamp-2 text-sm font-bold leading-snug text-white">
          {resource?.title || ""}
        </h4>
        {(resource?.city || resource?.state) && (
          <p className="flex items-center gap-1 truncate text-[11px] text-white/60">
            <MapPin size={10} className="shrink-0 text-cyan-400" />
            {[resource.city, resource.state].filter(Boolean).join(", ")}
          </p>
        )}
        <span className="inline-flex w-fit rounded-lg bg-cyan-500/90 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-white transition group-hover:bg-cyan-400">
          {t("client:homeNew.hero.viewDetails", "Ver detalles")}
        </span>
      </div>
    </Link>
  );
};

/* ── Deck skeleton ── */
const DeckSkeleton = () => (
  <div className="relative h-[420px] w-full sm:h-[440px]">
    {[0, 1, 2].map((i) => (
      <div
        key={i}
        className="absolute left-0 right-0 animate-pulse rounded-2xl border border-white/10 bg-white/80 shadow-xl backdrop-blur-sm dark:bg-slate-800/80"
        style={{
          top: `${i * 14}px`,
          transform: `scale(${1 - i * 0.04})`,
          zIndex: 3 - i,
          opacity: 1 - i * 0.2,
        }}
      >
        <div className="aspect-[4/3] rounded-t-2xl bg-slate-200 dark:bg-slate-700" />
        <div className="space-y-2.5 px-4 py-3">
          <div className="h-3 w-16 rounded bg-slate-200 dark:bg-slate-700" />
          <div className="h-4 w-3/4 rounded bg-slate-200 dark:bg-slate-700" />
          <div className="h-3 w-1/2 rounded bg-slate-200 dark:bg-slate-700" />
          <div className="h-5 w-1/3 rounded bg-slate-200 dark:bg-slate-700" />
        </div>
      </div>
    ))}
  </div>
);

const HomeHero = () => {
  const { t, i18n } = useTranslation();
  const [featured, setFeatured] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeIdx, setActiveIdx] = useState(0);
  const [bgImages, setBgImages] = useState([fallbackImage]);
  const [currentBg, setCurrentBg] = useState(0);
  const [bgLoaded, setBgLoaded] = useState(false);

  const langKey = i18n.language?.split("-")[0] || "es";
  const lang = i18n.resolvedLanguage || i18n.language;

  // Fetch featured resources
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await resourcesService.listPublic({
          limit: FEATURED_LIMIT,
          filters: { featured: true, sort: "recent" },
        });
        const docs = data.documents || [];
        if (!cancelled) {
          if (docs.length === 0) {
            const fallbackData = await resourcesService.listPublic({
              limit: FEATURED_LIMIT,
              filters: { sort: "recent" },
            });
            setFeatured(fallbackData.documents || []);
          } else {
            setFeatured(docs);
          }
          const imgs = (docs.length > 0 ? docs : [])
            .map((r) => getResourceImage(r))
            .filter(Boolean);
          if (imgs.length > 0) setBgImages(imgs);
        }
      } catch {
        // keep fallback
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Auto-rotate deck cards
  useEffect(() => {
    if (featured.length <= 1) return;
    const id = setInterval(() => {
      setActiveIdx((prev) => (prev + 1) % featured.length);
    }, ROTATE_MS);
    return () => clearInterval(id);
  }, [featured.length]);

  // Sync background with deck
  useEffect(() => {
    if (bgImages.length <= 1) return;
    setCurrentBg(activeIdx % bgImages.length);
    setBgLoaded(false);
  }, [activeIdx, bgImages.length]);

  const hasFeatured = featured.length > 0;

  // Build deck cards (stacked)
  const getDeckCards = useCallback(() => {
    if (featured.length === 0) return [];
    const cards = [];
    for (let i = 0; i < Math.min(DECK_VISIBLE, featured.length); i++) {
      const idx = (activeIdx + i) % featured.length;
      cards.push({ resource: featured[idx], stackPosition: i });
    }
    return cards;
  }, [featured, activeIdx]);

  return (
    <section className="relative w-full overflow-x-clip bg-slate-950">
      {/* Background image */}
      <div className="absolute inset-0">
        <m.img
          key={currentBg}
          src={bgImages[currentBg % bgImages.length]}
          alt=""
          aria-hidden="true"
          initial={reduceMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="h-full w-full object-cover transition-[filter] duration-700 ease-out will-change-[filter]"
          style={{ filter: bgLoaded ? "blur(0px)" : "blur(16px)" }}
          fetchpriority="high"
          loading="eager"
          decoding="async"
          onLoad={() => setBgLoaded(true)}
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = fallbackImage;
            setBgLoaded(true);
          }}
        />
      </div>

      {/* Overlays */}
      <div className="absolute inset-0 bg-linear-to-b from-slate-950/70 via-slate-950/55 to-slate-950/90" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(34,211,238,0.15),transparent_45%),radial-gradient(circle_at_80%_80%,rgba(14,165,233,0.12),transparent_42%)]" />

      {/* Main content — 2-col on lg */}
      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 pb-10 pt-24 sm:px-6 sm:pb-14 sm:pt-28 lg:flex-row lg:items-center lg:gap-10 lg:pb-16 lg:pt-32">
        {/* Left: headline + search */}
        <div className="flex-1 lg:max-w-[52%]">
          {/* Badge */}
          <m.span
            initial={reduceMotion ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.4 }}
            className="mb-4 inline-flex w-fit items-center gap-2 rounded-full border border-cyan-300/40 bg-cyan-400/15 px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-cyan-100"
          >
            <Star size={12} />
            {t("client:featured.badge", "Exclusivo")}
          </m.span>

          {/* Headline */}
          <m.h1
            initial={reduceMotion ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.5 }}
            className="max-w-lg text-3xl font-black leading-[1.08] text-white sm:text-4xl lg:text-[2.75rem] xl:text-5xl"
          >
            {t("client:homeNew.hero.headline", "¿Qué estás planeando hoy?")}{" "}
            <br className="hidden sm:block" />
            <TypewriterWord
              words={TYPEWRITER_WORDS[langKey] ?? TYPEWRITER_WORDS.es}
            />
          </m.h1>

          {/* Subheadline */}
          <m.p
            initial={reduceMotion ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.4 }}
            className="mt-3 max-w-md text-base text-white/80 sm:text-lg"
          >
            {t(
              "client:homeNew.hero.subheadline",
              "Encuentra lugares, experiencias y servicios cerca de ti.",
            )}
          </m.p>

          {/* Search Panel */}
          <m.div
            initial={reduceMotion ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.5 }}
            className="mt-7 w-full"
          >
            <HomeSearchPanel variant="hero" />
          </m.div>
        </div>

        {/* Right: Featured deck (desktop) */}
        <m.div
          initial={reduceMotion ? false : { opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="hidden w-full max-w-md shrink-0 self-end lg:block lg:-mb-20 xl:max-w-[440px]"
        >
          {loading && <DeckSkeleton />}

          {!loading && hasFeatured && (
            <div className="relative" style={{ height: "460px" }}>
              <AnimatePresence mode="popLayout">
                {getDeckCards().map(({ resource, stackPosition }) => (
                  <m.div
                    key={resource.$id}
                    initial={
                      reduceMotion ? false : { opacity: 0, y: 20, scale: 0.95 }
                    }
                    animate={{
                      opacity: 1 - stackPosition * 0.15,
                      y: stackPosition * 14,
                      scale: 1 - stackPosition * 0.04,
                      zIndex: DECK_VISIBLE - stackPosition,
                    }}
                    exit={
                      reduceMotion
                        ? { opacity: 0 }
                        : { opacity: 0, y: -20, scale: 1.02 }
                    }
                    transition={{
                      duration: reduceMotion ? 0 : 0.4,
                      ease: "easeOut",
                    }}
                    className="absolute left-0 right-0"
                    style={{ zIndex: DECK_VISIBLE - stackPosition }}
                  >
                    <PropertyCard property={resource} />
                  </m.div>
                ))}
              </AnimatePresence>

              {/* Navigation arrows — on card sides */}
              {featured.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() =>
                      setActiveIdx(
                        (prev) =>
                          (prev - 1 + featured.length) % featured.length,
                      )
                    }
                    className="absolute -left-5 top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/25 bg-black/40 text-white shadow-lg backdrop-blur-md transition hover:bg-black/60"
                    aria-label="Anterior"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setActiveIdx((prev) => (prev + 1) % featured.length)
                    }
                    className="absolute -right-5 top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/25 bg-black/40 text-white shadow-lg backdrop-blur-md transition hover:bg-black/60"
                    aria-label="Siguiente"
                  >
                    <ChevronRight size={18} />
                  </button>
                </>
              )}
            </div>
          )}
        </m.div>
      </div>

      {/* Mobile: single-card fade carousel */}
      {!loading && hasFeatured && (
        <div className="relative z-10 px-4 pb-8 lg:hidden">
          <div className="mx-auto max-w-6xl">
            {/* Single card with fade */}
            <div className="relative">
              <AnimatePresence mode="wait">
                <m.div
                  key={featured[activeIdx]?.$id}
                  initial={reduceMotion ? false : { opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={reduceMotion ? undefined : { opacity: 0 }}
                  transition={{ duration: 0.35 }}
                >
                  <MobileHeroCard resource={featured[activeIdx]} lang={lang} />
                </m.div>
              </AnimatePresence>
            </div>

            {/* Counter + nav */}
            {featured.length > 1 && (
              <div className="mt-3 flex items-center justify-between">
                <span className="text-[11px] tabular-nums text-white/40">
                  {activeIdx + 1} / {featured.length}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setActiveIdx(
                        (prev) =>
                          (prev - 1 + featured.length) % featured.length,
                      )
                    }
                    className="flex h-7 w-7 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white/70 backdrop-blur-sm transition hover:bg-white/20"
                    aria-label="Anterior"
                  >
                    <ChevronLeft size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setActiveIdx((prev) => (prev + 1) % featured.length)
                    }
                    className="flex h-7 w-7 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white/70 backdrop-blur-sm transition hover:bg-white/20"
                    aria-label="Siguiente"
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
};

export default HomeHero;
