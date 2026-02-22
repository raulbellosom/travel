import React, { useState, useMemo, useCallback, useEffect } from "react";
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
  Car,
  Bike,
  Ship,
  Wrench,
  Camera,
  UtensilsCrossed,
  Compass,
  Ticket,
  Dumbbell,
  GraduationCap,
  TreePine,
  CalendarHeart,
  Users,
  Clock,
  Armchair,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { cn } from "../../../utils/cn";
import { storage } from "../../../api/appwriteClient";
import env from "../../../env";
import PropertyImagePlaceholder from "../atoms/PropertyImagePlaceholder";
import LazyImage from "../atoms/LazyImage";
import { getResourceBehavior } from "../../../utils/resourceModel";
import { getPublicPropertyRoute } from "../../../utils/internalRoutes";
import { formatMoneyParts } from "../../../utils/money";
import { useAuth } from "../../../hooks/useAuth";
import { favoritesService } from "../../../services/favoritesService";

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

const PropertyCard = ({
  property,
  className,
  isFavorite,
  onFavoriteToggle,
}) => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imageError, setImageError] = useState(false);
  const [favorited, setFavorited] = useState(() => isFavorite ?? false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);

  // Sync isFavorite prop, or fetch from service when user is logged in
  // and the prop wasn't explicitly provided (e.g. search/landing pages)
  useEffect(() => {
    if (isFavorite !== undefined) {
      setFavorited(Boolean(isFavorite));
      return;
    }
    if (!user?.$id || !property?.$id) return;
    let cancelled = false;
    favoritesService
      .isFavorite(user.$id, property.$id)
      .then((result) => {
        if (!cancelled) setFavorited(Boolean(result));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFavorite, user?.$id, property?.$id]);
  const _MOTION = motion;
  const resource = useMemo(() => getResourceBehavior(property), [property]);

  const handleFavoriteClick = useCallback(
    async (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (!user?.$id || favoriteLoading) return;
      const prevFavorited = favorited;
      setFavorited((v) => !v);
      setFavoriteLoading(true);
      try {
        const result = await favoritesService.toggleFavorite({
          userId: user.$id,
          resourceId: property.$id,
          resourceSlug: property.slug || "",
          resourceTitle: property.title || property.name || "",
          resourceOwnerUserId: property.userId || property.ownerUserId || "",
        });
        setFavorited(result.isFavorite);
        if (!result.isFavorite && typeof onFavoriteToggle === "function") {
          onFavoriteToggle(property.$id);
        }
      } catch {
        setFavorited(prevFavorited);
      } finally {
        setFavoriteLoading(false);
      }
    },
    [user, favoriteLoading, favorited, property, onFavoriteToggle],
  );
  const publicDetailPath = getPublicPropertyRoute(
    property.slug || property.$id,
    i18n.resolvedLanguage || i18n.language,
  );

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

  const priceParts = useMemo(() => {
    if (
      property.price === 0 ||
      property.price === null ||
      property.price === undefined
    ) {
      return null;
    }
    return formatMoneyParts(property.price, {
      locale: i18n.language === "en" ? "en-US" : "es-MX",
      currency: property.currency || "MXN",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }, [i18n.language, property.currency, property.price]);

  // Determine icon based on resource type and category
  const getResourceIcon = (resourceType, category) => {
    const type = normalizeEnumValue(resourceType);
    const cat = normalizeEnumValue(category);

    switch (type) {
      case "vehicle":
        if (cat === "motorcycle") return Bike;
        if (cat === "boat") return Ship;
        return Car;
      case "service":
        if (cat === "photography") return Camera;
        if (cat === "chef" || cat === "catering") return UtensilsCrossed;
        return Wrench;
      case "experience":
        if (cat === "tour") return Compass;
        if (cat === "adventure") return TreePine;
        if (cat === "wellness") return Dumbbell;
        if (cat === "class" || cat === "workshop") return GraduationCap;
        return Ticket;
      case "venue":
        if (cat === "event_hall") return CalendarHeart;
        if (cat === "coworking" || cat === "meeting_room") return Users;
        return Store;
      default: // property
        if (cat === "apartment" || cat === "condo") return Building2;
        if (cat === "land" || cat === "lot") return Square;
        if (cat === "commercial" || cat === "office") return Store;
        if (cat === "warehouse" || cat === "industrial") return Warehouse;
        return Home;
    }
  };

  const resourceType = resource?.resourceType || "property";
  const propertyTypeRaw =
    resource?.category || property?.propertyType || property?.type;
  // Use commercialMode from resource behavior for more accurate operation label
  const commercialModeRaw =
    resource?.commercialMode ||
    resource?.operationType ||
    property?.operationType ||
    property?.operation;

  // Format the category label using the category enum
  const formattedCategory = propertyTypeRaw
    ? t(`client:common.enums.category.${normalizeEnumValue(propertyTypeRaw)}`, {
        defaultValue: t(
          `client:common.enums.propertyType.${normalizeEnumValue(propertyTypeRaw)}`,
          { defaultValue: humanizeEnumValue(propertyTypeRaw) },
        ),
      })
    : t(
        `client:common.enums.resourceType.${normalizeEnumValue(resourceType)}`,
        {
          defaultValue: humanizeEnumValue(resourceType),
        },
      );

  const formattedOperationType = commercialModeRaw
    ? t(
        `client:common.enums.operation.${normalizeEnumValue(commercialModeRaw)}`,
        {
          defaultValue: humanizeEnumValue(commercialModeRaw),
        },
      )
    : "";

  // Price label based on pricing model
  const pricingModel = resource?.pricingModel || "fixed_total";
  const priceLabelMap = {
    per_night: "client:pricing.pricePerNight",
    per_day: "client:pricing.pricePerDay",
    per_hour: "client:pricing.pricePerHour",
    per_month: "client:pricing.pricePerMonth",
    per_person: "client:pricing.pricePerPerson",
    per_event: "client:pricing.pricePerEvent",
    per_m2: "client:pricing.pricePerM2",
  };
  const priceDisplayLabel = priceLabelMap[pricingModel]
    ? t(priceLabelMap[pricingModel])
    : t("client:pricing.label", "Precio");

  const ResourceIcon = getResourceIcon(resourceType, propertyTypeRaw);

  // Color-coded operation badge — uses actual taxonomy values from resourceTaxonomy.js
  const operationBadgeClass = useMemo(() => {
    const mode = normalizeEnumValue(commercialModeRaw);
    if (mode === "sale") return "bg-emerald-500 text-white";
    if (mode === "rent_long_term") return "bg-blue-500 text-white";
    if (mode === "rent_short_term") return "bg-orange-500 text-white";
    if (mode === "rent_hourly") return "bg-violet-500 text-white";
    if (mode === "rent_monthly") return "bg-sky-500 text-white";
    if (mode === "rent_per_person" || mode === "per_person")
      return "bg-pink-500 text-white";
    // legacy / fallback aliases
    if (mode === "rent" || mode === "renta") return "bg-blue-500 text-white";
    if (mode === "venta") return "bg-emerald-500 text-white";
    return "bg-slate-700/80 text-white";
  }, [commercialModeRaw]);

  // Choose which area to display (built vs total)
  const displayArea = property.builtArea || property.totalArea || 0;

  // Determine which features to show based on resource type
  const isProperty = resourceType === "property";
  const isVehicle = resourceType === "vehicle";
  const isService = resourceType === "service";
  const isExperience = resourceType === "experience";
  const isVenue = resourceType === "venue";

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
    >
      {/* Image Carousel */}
      <div className="relative aspect-4/3 overflow-hidden bg-slate-200 dark:bg-slate-800">
        <Link to={publicDetailPath} className="block h-full w-full">
          {hasImages ? (
            <>
              {/* Sliding container */}
              <div
                className="flex h-full transition-transform duration-500 ease-out"
                style={{
                  transform: `translateX(-${currentImageIndex * 100}%)`,
                }}
              >
                {images.map((imgSrc, idx) => (
                  <div key={idx} className="h-full w-full shrink-0">
                    <LazyImage
                      src={imgSrc}
                      alt={`${property.title} ${idx + 1}`}
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                      onError={() => setImageError(true)}
                      eager={idx === 0}
                    />
                  </div>
                ))}
              </div>

              {/* Overlay Gradient */}
              <div className="absolute inset-0 bg-linear-to-t from-slate-900/60 via-transparent to-transparent opacity-60 transition-opacity group-hover:opacity-40 pointer-events-none" />
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
        <div className="absolute left-3 top-3 flex flex-col gap-1.5">
          {formattedOperationType && (
            <span
              className={`inline-flex items-center rounded-md px-2.5 py-1 text-[11px] font-bold uppercase tracking-widest shadow-md backdrop-blur-sm ${operationBadgeClass}`}
            >
              {formattedOperationType}
            </span>
          )}
          {property.featured && (
            <span className="inline-flex items-center gap-1 rounded-md bg-gradient-to-r from-amber-400 to-yellow-300 px-2.5 py-1 text-[11px] font-bold uppercase tracking-widest text-amber-900 shadow-md">
              <Star size={9} fill="currentColor" />
              {t("client:badges.featured", "Destacado")}
            </span>
          )}
        </div>

        {/* Favorite Button */}
        <button
          onClick={handleFavoriteClick}
          disabled={favoriteLoading}
          aria-label={
            favorited
              ? t("client:favorites.remove", "Quitar de favoritos")
              : t("client:favorites.add", "Añadir a favoritos")
          }
          className={cn(
            "absolute right-4 top-4 rounded-full p-2 backdrop-blur-md transition-all",
            favorited
              ? "bg-rose-500 text-white hover:bg-rose-600"
              : "bg-white/20 text-white hover:bg-white hover:text-rose-500",
            favoriteLoading && "opacity-60 cursor-wait",
          )}
        >
          <Heart size={18} fill={favorited ? "currentColor" : "none"} />
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
              <ResourceIcon size={14} />
              {formattedCategory}
            </span>
            {/* Rating or other metadata could go here */}
          </div>

          <Link to={publicDetailPath} className="group-hover:underline">
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

          {/* Features Grid — type-aware */}
          <div className="mt-4 grid grid-cols-3 gap-2 border-y border-slate-100 py-3 dark:border-slate-800">
            {isProperty && (
              <>
                <div className="flex flex-col items-center justify-center gap-1 text-center">
                  <div className="flex items-center gap-1.5 text-slate-400 dark:text-slate-500">
                    <BedDouble size={16} />
                    <span className="text-xs font-medium uppercase">
                      {t("client:property.bedrooms", "Recámaras")}
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
              </>
            )}

            {isVehicle && (
              <>
                <div className="flex flex-col items-center justify-center gap-1 text-center">
                  <div className="flex items-center gap-1.5 text-slate-400 dark:text-slate-500">
                    <Car size={16} />
                    <span className="text-xs font-medium uppercase">
                      {t("client:resource.type", "Tipo")}
                    </span>
                  </div>
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-200">
                    {formattedCategory}
                  </span>
                </div>

                <div className="flex flex-col items-center justify-center gap-1 text-center border-x border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-1.5 text-slate-400 dark:text-slate-500">
                    <Users size={16} />
                    <span className="text-xs font-medium uppercase">
                      {t("client:resource.passengers", "Pasajeros")}
                    </span>
                  </div>
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-200">
                    {property.maxGuests || "—"}
                  </span>
                </div>

                <div className="flex flex-col items-center justify-center gap-1 text-center">
                  <div className="flex items-center gap-1.5 text-slate-400 dark:text-slate-500">
                    <Armchair size={16} />
                    <span className="text-xs font-medium uppercase">
                      {t("client:resource.mode", "Modo")}
                    </span>
                  </div>
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-200 text-[11px]">
                    {formattedOperationType || "—"}
                  </span>
                </div>
              </>
            )}

            {isService && (
              <>
                <div className="flex flex-col items-center justify-center gap-1 text-center">
                  <div className="flex items-center gap-1.5 text-slate-400 dark:text-slate-500">
                    <Wrench size={16} />
                    <span className="text-xs font-medium uppercase">
                      {t("client:resource.type", "Tipo")}
                    </span>
                  </div>
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-200">
                    {formattedCategory}
                  </span>
                </div>

                <div className="flex flex-col items-center justify-center gap-1 text-center border-x border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-1.5 text-slate-400 dark:text-slate-500">
                    <Clock size={16} />
                    <span className="text-xs font-medium uppercase">
                      {t("client:resource.duration", "Duración")}
                    </span>
                  </div>
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-200">
                    {property.slotDurationMinutes
                      ? `${property.slotDurationMinutes} min`
                      : "—"}
                  </span>
                </div>

                <div className="flex flex-col items-center justify-center gap-1 text-center">
                  <div className="flex items-center gap-1.5 text-slate-400 dark:text-slate-500">
                    <MapPin size={16} />
                    <span className="text-xs font-medium uppercase">
                      {t("client:resource.location", "Lugar")}
                    </span>
                  </div>
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-200">
                    {property.city || "—"}
                  </span>
                </div>
              </>
            )}

            {isExperience && (
              <>
                <div className="flex flex-col items-center justify-center gap-1 text-center">
                  <div className="flex items-center gap-1.5 text-slate-400 dark:text-slate-500">
                    <Ticket size={16} />
                    <span className="text-xs font-medium uppercase">
                      {t("client:resource.type", "Tipo")}
                    </span>
                  </div>
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-200">
                    {formattedCategory}
                  </span>
                </div>

                <div className="flex flex-col items-center justify-center gap-1 text-center border-x border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-1.5 text-slate-400 dark:text-slate-500">
                    <Users size={16} />
                    <span className="text-xs font-medium uppercase">
                      {t("client:resource.maxGuests", "Máx.")}
                    </span>
                  </div>
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-200">
                    {property.maxGuests || "—"}
                  </span>
                </div>

                <div className="flex flex-col items-center justify-center gap-1 text-center">
                  <div className="flex items-center gap-1.5 text-slate-400 dark:text-slate-500">
                    <Clock size={16} />
                    <span className="text-xs font-medium uppercase">
                      {t("client:resource.duration", "Duración")}
                    </span>
                  </div>
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-200">
                    {property.slotDurationMinutes
                      ? `${property.slotDurationMinutes} min`
                      : "—"}
                  </span>
                </div>
              </>
            )}

            {isVenue && (
              <>
                <div className="flex flex-col items-center justify-center gap-1 text-center">
                  <div className="flex items-center gap-1.5 text-slate-400 dark:text-slate-500">
                    <Store size={16} />
                    <span className="text-xs font-medium uppercase">
                      {t("client:resource.type", "Tipo")}
                    </span>
                  </div>
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-200">
                    {formattedCategory}
                  </span>
                </div>

                <div className="flex flex-col items-center justify-center gap-1 text-center border-x border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-1.5 text-slate-400 dark:text-slate-500">
                    <Users size={16} />
                    <span className="text-xs font-medium uppercase">
                      {t("client:resource.capacity", "Capacidad")}
                    </span>
                  </div>
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-200">
                    {property.maxGuests || "—"}
                  </span>
                </div>

                <div className="flex flex-col items-center justify-center gap-1 text-center">
                  <div className="flex items-center gap-1.5 text-slate-400 dark:text-slate-500">
                    <Square size={16} />
                    <span className="text-xs font-medium uppercase">m²</span>
                  </div>
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-200">
                    {displayArea || "—"}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="mt-4 flex items-end justify-between">
          <div>
            <p className="text-xs text-slate-400 font-medium uppercase mb-0.5">
              {priceDisplayLabel}
            </p>
            <p className="text-xl font-black text-slate-900 dark:text-white">
              {priceParts ? (
                <>
                  <span>{priceParts.main}</span>
                  <span className="ml-0.5 align-top text-xs font-semibold opacity-85">
                    {priceParts.decimals}
                  </span>
                  <span className="ml-1 text-xs font-semibold opacity-85">
                    {priceParts.denomination}
                  </span>
                </>
              ) : (
                t("client:pricing.contactForPrice")
              )}
            </p>
          </div>

          <Link
            to={publicDetailPath}
            className="whitespace-nowrap rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white transition-all hover:bg-cyan-600 hover:shadow-lg active:scale-95 dark:bg-white dark:text-slate-900 dark:hover:bg-cyan-400 opacity-100 transform translate-y-0 md:opacity-0 md:translate-y-2 md:group-hover:opacity-100 md:group-hover:translate-y-0 duration-300"
          >
            {t("client:actions.viewDetails", "Ver detalles")}
          </Link>
        </div>
      </div>
    </motion.div>
  );
};

export default PropertyCard;
