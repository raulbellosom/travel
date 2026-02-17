import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  MapPin,
  Home,
  ArrowRight,
} from "lucide-react";
import { Link } from "react-router-dom";
import { propertiesService } from "../../../../services/propertiesService";
import Button from "../../atoms/Button";
import AdvancedSearch from "../../molecules/AdvancedSearch/AdvancedSearch";
import fallbackImage from "../../../../assets/img/examples/house/fachada.webp";

const HomeHeroCarousel = () => {
  const { t } = useTranslation();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch featured properties for the carousel
  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const data = await propertiesService.listPublic({
          limit: 5,
          filters: { featured: true },
        });
        setProperties(data.documents);
      } catch (error) {
        console.error("Error fetching hero properties:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchFeatured();
  }, []);

  // Auto-advance carousel
  useEffect(() => {
    if (properties.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % properties.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [properties.length]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % properties.length);
  };

  const prevSlide = () => {
    setCurrentSlide(
      (prev) => (prev - 1 + properties.length) % properties.length,
    );
  };

  if (loading) {
    return (
      <div className="relative h-[600px] w-full animate-pulse bg-slate-200 dark:bg-slate-800" />
    );
  }

  // Fallback if no properties
  const slides =
    properties.length > 0
      ? properties
      : [
          {
            $id: "fallback-1",
            mainImageUrl: fallbackImage,
            title: t("client:hero.fallback.title", "Encuentra tu hogar ideal"),
            location: "Puerto Vallarta, Jal.",
            price: 0,
          },
        ];

  const activeProperty = slides[currentSlide];

  return (
    <section className="relative h-dvh min-h-[600px] w-full overflow-hidden bg-slate-900">
      {/* Search Overlay - Positioned appropriately */}
      <div className="absolute inset-0 z-20 flex flex-col items-center justify-center pointer-events-none">
        <div className="container mx-auto px-4">
          {/* Title / Hero Text */}
          <div className="mb-8 text-center pointer-events-auto">
            <motion.h1
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="text-4xl md:text-6xl font-black text-white drop-shadow-lg mb-4"
            >
              {t("client:hero.mainTitle", "Tu próximo hogar comienza aquí")}
            </motion.h1>
            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="text-lg md:text-xl text-white/90 drop-shadow-md max-w-2xl mx-auto"
            >
              {t(
                "client:hero.subTitle",
                "Explora las mejores propiedades en venta y renta en las zonas más exclusivas.",
              )}
            </motion.p>
          </div>

          {/* Advanced Search Component */}
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="pointer-events-auto w-full max-w-4xl mx-auto"
          >
            <AdvancedSearch />
          </motion.div>
        </div>
      </div>

      {/* Background Slides */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentSlide}
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.7 }}
          className="absolute inset-0 z-0 h-full w-full"
        >
          <div className="absolute inset-0 bg-linear-to-t from-slate-900 via-slate-900/40 to-slate-900/30 z-10" />
          <img
            src={
              activeProperty &&
              activeProperty.images &&
              activeProperty.images.length > 0
                ? activeProperty.images[0]
                : activeProperty?.mainImageUrl || fallbackImage
            }
            alt={activeProperty?.title || "Property"}
            className="h-full w-full object-cover"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = fallbackImage;
            }}
          />
        </motion.div>
      </AnimatePresence>

      {/* Slide Info (Bottom Left) */}
      {properties.length > 0 && (
        <div className="absolute bottom-8 left-8 z-20 hidden md:block max-w-md">
          <motion.div
            key={`info-${currentSlide}`}
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="bg-white/10 backdrop-blur-md border border-white/20 p-6 rounded-2xl text-white"
          >
            <h3 className="text-xl font-bold truncate mb-1">
              {activeProperty.title}
            </h3>
            <div className="flex items-center gap-2 text-sm text-white/80 mb-3">
              <MapPin size={14} />
              <span className="truncate">
                {activeProperty.location ||
                  activeProperty.address ||
                  t("client:search.unknownLocation", "Unknown location")}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-black">
                {new Intl.NumberFormat("es-MX", {
                  style: "currency",
                  currency: activeProperty.currency || "USD",
                  maximumFractionDigits: 0,
                }).format(activeProperty.price)}
              </span>
              <Link
                to={`/propiedades/${activeProperty.slug || activeProperty.$id}`}
              >
                <Button
                  variant="ghost"
                  className="text-white hover:bg-white/20"
                  rightIcon={ArrowRight}
                >
                  {t("client:common.viewDetails", "Ver Detalles")}
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      )}

      {/* Navigation Controls */}
      {properties.length > 1 && (
        <div className="absolute bottom-8 right-8 z-20 flex gap-2">
          <button
            onClick={prevSlide}
            className="p-3 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20 transition-all active:scale-95"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={nextSlide}
            className="p-3 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20 transition-all active:scale-95"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      )}

      {/* Progress Indicators */}
      {properties.length > 1 && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex gap-2">
          {properties.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentSlide(idx)}
              className={`h-1.5 rounded-full transition-all ${
                idx === currentSlide
                  ? "w-8 bg-white"
                  : "w-2 bg-white/40 hover:bg-white/60"
              }`}
            />
          ))}
        </div>
      )}
    </section>
  );
};

export default HomeHeroCarousel;
