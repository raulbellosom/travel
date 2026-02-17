import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  MapPin,
  BedDouble,
  Bath,
  Square,
  Heart,
  ChevronLeft,
  ChevronRight,
  Home,
  Building2,
  Store,
  Warehouse,
  Star,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "../../../utils/cn";
import { storage } from "../../../api/appwriteClient";
import env from "../../../env";
import PropertyImagePlaceholder from "../atoms/PropertyImagePlaceholder";
import LazyImage from "../atoms/LazyImage";

const normalizeEnumValue = (value) =>
  String(value || "")
    .trim()
    .replace(/\s+/g, "_")
    .toLowerCase();

const humanizeEnumValue = (value) =>
  String(value || "")
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();

const PropertyCard = ({ property, className }) => {
  const { t, i18n } = useTranslation();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Build image URLs from galleryImageIds
  const images = useMemo(() => {
    // If property already has pre-processed images array (from detail pages), use it
    if (property.images && property.images.length > 0) {
      return property.images;
    }

    // Build URLs from galleryImageIds
    if (
      property.galleryImageIds &&
      Array.isArray(property.galleryImageIds) &&
      property.galleryImageIds.length > 0 &&
      env.appwrite.buckets.propertyImages
    ) {
      return property.galleryImageIds.filter(Boolean).map((fileId) =>
        storage.getFileView({
          bucketId: env.appwrite.buckets.propertyImages,
          fileId,
        }),
      );
    }

    // No images available
    return [];
  }, [property.images, property.galleryImageIds]);

  const hasImages = images.length > 0 && !imageError;

  // Logic to handle gallery navigation safely
  const handleNextImage = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (images.length > 1) {
      setCurrentImageIndex((prev) => (prev + 1) % images.length);
    }
  };

  const handlePrevImage = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (images.length > 1) {
      setCurrentImageIndex(
        (prev) => (prev - 1 + images.length) % images.length,
      );
    }
  };

  const formatPrice = (price, currency) => {
    // If we have a valid number, format it. Otherwise show something like "Consultar" or 0
    if (price === 0 || price === null || price === undefined)
      return t("client:pricing.contactForPrice");

    return new Intl.NumberFormat(i18n.language, {
      style: "currency",
      currency: currency || "MXN",
      maximumFractionDigits: 0,
    }).format(price);
  };

  // Determine property type icon
  const getPropertyIcon = (type) => {
    const normalized = normalizeEnumValue(type);
    switch (normalized) {
      case "apartment":
      case "condo":
        return Building2;
      case "land":
      case "lot":
        return Square;
      case "commercial":
      case "office":
        return Store;
      case "industrial":
      case "warehouse":
        return Warehouse;
      default:
        return Home;
    }
  };

  const propertyTypeRaw = property?.propertyType || property?.type;
  const operationRaw = property?.operationType || property?.operation;

  const formattedPropertyType = propertyTypeRaw
    ? t(
        `client:common.enums.propertyType.${normalizeEnumValue(propertyTypeRaw)}`,
        {
          defaultValue: humanizeEnumValue(propertyTypeRaw),
        },
      )
    : t("client:common.enums.propertyType.property");

  const formattedOperationType = operationRaw
    ? t(`client:common.enums.operation.${normalizeEnumValue(operationRaw)}`, {
        defaultValue: humanizeEnumValue(operationRaw),
      })
    : "";

  const isNightlyOperation =
    normalizeEnumValue(operationRaw) === "vacation_rental" ||
    normalizeEnumValue(operationRaw) === "rent_short";

  const PropertyIcon = getPropertyIcon(propertyTypeRaw);

  // Choose which area to display (built vs total)
  const displayArea = property.builtArea || property.totalArea || 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-3xl bg-white shadow-xl shadow-slate-200/50 transition-all hover:shadow-2xl hover:shadow-cyan-500/10 dark:bg-slate-900 dark:shadow-none dark:ring-1 dark:ring-white/10",
        className,
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image Carousel */}
      <div className="relative aspect-4/3 overflow-hidden bg-slate-200 dark:bg-slate-800">
        <Link
          to={`/propiedades/${property.slug || property.$id}`}
          className="block h-full w-full"
        >
          {hasImages ? (
            <>
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentImageIndex}
                  initial={{ opacity: 0, scale: 1.1 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4 }}
                  className="h-full w-full"
                >
                  <LazyImage
                    src={images[currentImageIndex]}
                    alt={property.title}
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                    onError={() => setImageError(true)}
                  />
                </motion.div>
              </AnimatePresence>

              {/* Overlay Gradient */}
              <div className="absolute inset-0 bg-linear-to-t from-slate-900/60 via-transparent to-transparent opacity-60 transition-opacity group-hover:opacity-40" />
            </>
          ) : (
            /* Beautiful placeholder with pattern */
            <PropertyImagePlaceholder
              propertyType={property.propertyType || property.type}
              iconSize={64}
            />
          )}
        </Link>

        {/* Badges */}
        <div className="absolute left-4 top-4 flex flex-col gap-2">
          {formattedOperationType && (
            <span className="inline-flex items-center rounded-lg bg-white/90 px-3 py-1 text-xs font-bold uppercase tracking-wider text-slate-900 shadow-sm backdrop-blur-sm dark:bg-slate-950/90 dark:text-white">
              {formattedOperationType}
            </span>
          )}
          {property.featured && (
            <span className="inline-flex items-center gap-1 rounded-lg bg-amber-400 px-3 py-1 text-xs font-bold uppercase tracking-wider text-amber-950 shadow-sm backdrop-blur-sm">
              <Star size={10} fill="currentColor" />{" "}
              {t("client:badges.featured", "Destacado")}
            </span>
          )}
        </div>

        {/* Favorite Button (Visual only for now) */}
        <button className="absolute right-4 top-4 rounded-full bg-white/20 p-2 text-white transition-colors hover:bg-white hover:text-rose-500 backdrop-blur-md">
          <Heart size={18} />
        </button>

        {/* Navigation Arrows */}
        {images.length > 1 && (
          <>
            <button
              onClick={handlePrevImage}
              className={cn(
                "absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 text-slate-900 shadow-lg backdrop-blur-sm transition-all hover:bg-white hover:scale-110 active:scale-95",
                // Always visible on mobile, hidden on desktop until hover
                "opacity-100 md:opacity-0 md:group-hover:opacity-100",
              )}
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={handleNextImage}
              className={cn(
                "absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 text-slate-900 shadow-lg backdrop-blur-sm transition-all hover:bg-white hover:scale-110 active:scale-95",
                // Always visible on mobile, hidden on desktop until hover
                "opacity-100 md:opacity-0 md:group-hover:opacity-100",
              )}
            >
              <ChevronRight size={18} />
            </button>

            {/* Dots */}
            <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-1.5">
              {images.slice(0, 5).map((_, idx) => (
                <div
                  key={idx}
                  className={cn(
                    "h-1.5 rounded-full transition-all shadow-sm",
                    idx === currentImageIndex
                      ? "w-4 bg-white"
                      : "w-1.5 bg-white/50 hover:bg-white/80",
                  )}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col justify-between p-5">
        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-xs font-medium text-cyan-600 dark:text-cyan-400 uppercase tracking-wide">
              <PropertyIcon size={14} />
              {formattedPropertyType}
            </span>
            {/* Rating or other metadata could go here */}
          </div>

          <Link
            to={`/propiedades/${property.slug || property.$id}`}
            className="group-hover:underline"
          >
            <h3
              className="line-clamp-1 text-lg font-bold text-slate-900 dark:text-white"
              title={property.title}
            >
              {property.title}
            </h3>
          </Link>

          <div className="mt-2 flex items-start gap-1.5 text-slate-500 dark:text-slate-400">
            <MapPin size={16} className="mt-0.5 shrink-0" />
            <p className="line-clamp-1 text-sm">
              {property.streetAddress ||
                property.address ||
                `${property.city}, ${property.state}`}
            </p>
          </div>

          {/* Features Grid */}
          <div className="mt-4 grid grid-cols-3 gap-2 border-y border-slate-100 py-3 dark:border-slate-800">
            <div className="flex flex-col items-center justify-center gap-1 text-center">
              <div className="flex items-center gap-1.5 text-slate-400 dark:text-slate-500">
                <BedDouble size={16} />
                <span className="text-xs font-medium uppercase">
                  {t("client:property.bedrooms", "Hab")}
                </span>
              </div>
              <span className="text-sm font-bold text-slate-700 dark:text-slate-200">
                {property.bedrooms || 0}
              </span>
            </div>

            <div className="flex flex-col items-center justify-center gap-1 text-center border-x border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-1.5 text-slate-400 dark:text-slate-500">
                <Bath size={16} />
                <span className="text-xs font-medium uppercase">
                  {t("client:property.bathrooms", "Baños")}
                </span>
              </div>
              <span className="text-sm font-bold text-slate-700 dark:text-slate-200">
                {property.bathrooms || 0}
              </span>
            </div>

            <div className="flex flex-col items-center justify-center gap-1 text-center">
              <div className="flex items-center gap-1.5 text-slate-400 dark:text-slate-500">
                <Square size={16} />
                <span className="text-xs font-medium uppercase">m²</span>
              </div>
              <span className="text-sm font-bold text-slate-700 dark:text-slate-200">
                {displayArea}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-end justify-between">
          <div>
            <p className="text-xs text-slate-400 font-medium uppercase mb-0.5">
              {isNightlyOperation
                ? t("client:pricing.pricePerNight", "Precio por noche")
                : t("client:pricing.label", "Precio")}
            </p>
            <p className="text-xl font-black text-slate-900 dark:text-white">
              {formatPrice(property.price, property.currency)}
            </p>
          </div>

          <Link
            to={`/propiedades/${property.slug || property.$id}`}
            className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white transition-all hover:bg-cyan-600 hover:shadow-lg active:scale-95 dark:bg-white dark:text-slate-900 dark:hover:bg-cyan-400 opacity-100 transform translate-y-0 md:opacity-0 md:translate-y-2 md:group-hover:opacity-100 md:group-hover:translate-y-0 duration-300"
          >
            {t("client:actions.viewDetails", "Ver Detalles")}
          </Link>
        </div>
      </div>
    </motion.div>
  );
};

export default PropertyCard;
