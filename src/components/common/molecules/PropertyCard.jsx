import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  MapPin,
  BedDouble,
  Bath,
  Square,
  Heart,
  Star,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "../../../utils/cn";

const normalizeEnumValue = (value) =>
  String(value || "")
    .trim()
    .replace(/\s+/g, "_")
    .toLowerCase();

const humanizeEnumValue = (value) =>
  String(value || "")
    .replace(/[_-]+/g, " ")
    .trim();

const PropertyCard = ({ property, className }) => {
  const { t, i18n } = useTranslation();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  const images =
    property.images && property.images.length > 0
      ? property.images
      : [
          property.mainImageUrl ||
            "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80",
        ];

  const nextImage = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const formatPrice = (price, currency) => {
    return new Intl.NumberFormat(i18n.language, {
      style: "currency",
      currency: currency || "USD",
      maximumFractionDigits: 0,
    }).format(price || 0);
  };

  const propertyTypeRaw = property?.propertyType || property?.type;
  const operationRaw = property?.operationType || property?.operation;
  const propertyType = normalizeEnumValue(propertyTypeRaw);
  const operationType = normalizeEnumValue(operationRaw);
  const typeLabel = propertyType
    ? t(`homePage.enums.propertyType.${propertyType}`, {
        defaultValue:
          humanizeEnumValue(propertyTypeRaw) || t("listingCard.fallbackTitle"),
      })
    : t("listingCard.fallbackTitle");
  const isNightlyOperation =
    operationType === "rent" || operationType === "vacation_rental";
  const area = property?.totalArea ?? property?.area ?? 0;

  return (
    <div
      className={cn(
        "group bg-white dark:bg-slate-900 rounded-3xl overflow-hidden border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all duration-300 relative",
        className,
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-slate-200">
        <AnimatePresence mode="wait">
          <motion.img
            key={currentImageIndex}
            src={images[currentImageIndex]}
            alt={property.title}
            className="w-full h-full object-cover"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          />
        </AnimatePresence>

        <div className="absolute top-4 left-4 flex gap-2">
          {property.isPremium && (
            <span className="bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-1 rounded-md shadow-sm uppercase tracking-wider">
              {t("badges.premium")}
            </span>
          )}
          <span className="bg-white/90 backdrop-blur-sm text-slate-800 text-xs font-bold px-2 py-1 rounded-md shadow-sm uppercase tracking-wider">
            {typeLabel}
          </span>
        </div>

        <button className="absolute top-4 right-4 p-2 rounded-full bg-white/70 hover:bg-white text-slate-600 hover:text-red-500 transition-all shadow-sm">
          <Heart size={18} />
        </button>

        {images.length > 1 && (
          <div
            className={cn(
              "absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-between px-2 transition-opacity duration-200",
              isHovered ? "opacity-100" : "opacity-0",
            )}
          >
            <button
              onClick={prevImage}
              className="p-1.5 rounded-full bg-white/80 hover:bg-white text-slate-800 shadow-lg"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={nextImage}
              className="p-1.5 rounded-full bg-white/80 hover:bg-white text-slate-800 shadow-lg"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        )}

        {images.length > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
            {images.slice(0, 5).map((_, idx) => (
              <div
                key={idx}
                className={cn(
                  "w-1.5 h-1.5 rounded-full transition-all bg-white shadow-sm",
                  currentImageIndex === idx
                    ? "w-2.5 opacity-100"
                    : "opacity-60",
                )}
              />
            ))}
          </div>
        )}
      </div>

      <Link to={`/propiedades/${property.slug}`} className="block p-5">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white line-clamp-1 group-hover:text-cyan-600 transition-colors">
            {property.title}
          </h3>
          <div className="flex items-center gap-1 text-slate-800 dark:text-slate-200 font-bold">
            <Star size={14} className="fill-yellow-400 text-yellow-400" />
            <span>{property.rating || "4.8"}</span>
          </div>
        </div>

        <div className="flex items-center gap-1 text-sm text-slate-500 dark:text-slate-400 mb-4">
          <MapPin size={14} />
          <span className="truncate">
            {property.location?.address || `${property.city}, ${property.state}`}
          </span>
        </div>

        <div className="flex items-center gap-4 mb-4 text-xs text-slate-600 dark:text-slate-300">
          <div className="flex items-center gap-1">
            <BedDouble size={16} />
            <span>
              {property.bedrooms || 0} {t("property.bedrooms")}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Bath size={16} />
            <span>
              {property.bathrooms || 0} {t("property.bathrooms")}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Square size={16} />
            <span>
              {area} {t("homePage.units.squareMeters")}
            </span>
          </div>
        </div>

        <div className="flex items-end justify-between border-t border-slate-100 dark:border-slate-800 pt-4">
          <div>
            <p className="text-xs text-slate-500 uppercase font-semibold">
              {t("listingCard.from")}
            </p>
            <p className="text-xl font-black text-cyan-600 dark:text-cyan-400">
              {formatPrice(property.price, property.currency)}
              <span className="text-xs font-normal text-slate-500 ml-1">
                {isNightlyOperation ? `/ ${t("pricing.perNight")}` : ""}
              </span>
            </p>
          </div>
          <button className="px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-sm font-bold rounded-xl opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300">
            {t("actions.viewDetails")}
          </button>
        </div>
      </Link>
    </div>
  );
};

export default PropertyCard;
