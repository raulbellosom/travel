import React, { useState } from "react";
import { motion } from "motion/react";
import { useTranslation } from "react-i18next";
import {
  Heart,
  MapPin,
  Users,
  Home,
  Star,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

// Import our atomic components
import Button from "../../atoms/Button";
import Badge from "../../atoms/Badge";
import Avatar from "../../atoms/Avatar";
import RatingStars from "../../atoms/RatingStars";
import IconButton from "../../atoms/IconButton";
import PriceBadge from "../../molecules/PriceBadge";

/**
 * ListingCard component for displaying property/service cards.
 * Based on the landing page design from resources.
 */
const ListingCard = ({
  listing,
  variant = "default",
  size = "md",
  onCardClick,
  onFavoriteClick,
  onHostClick,
  className = "",
  ...props
}) => {
  const { t } = useTranslation();
  const [isFavorited, setIsFavorited] = useState(listing?.isFavorited || false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Handle favorite toggle
  const handleFavoriteClick = (e) => {
    e.stopPropagation(); // Prevent card click
    const newFavoriteState = !isFavorited;
    setIsFavorited(newFavoriteState);
    onFavoriteClick?.(listing.id, newFavoriteState);
  };

  // Handle card click
  const handleCardClick = () => {
    onCardClick?.(listing);
  };

  // Handle host click
  const handleHostClick = (e) => {
    e.stopPropagation();
    onHostClick?.(listing.host);
  };

  // Carousel navigation
  const handlePreviousImage = (e) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) =>
      prev === 0 ? data.images.length - 1 : prev - 1
    );
  };

  const handleNextImage = (e) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) =>
      prev === data.images.length - 1 ? 0 : prev + 1
    );
  };

  const handleImageIndicatorClick = (e, index) => {
    e.stopPropagation();
    setCurrentImageIndex(index);
  };

  // Default listing data fallback
  const defaultListing = {
    id: "1",
    title: "Beautiful Beach House",
    location: "Sayulita, Mexico",
    images: ["/placeholder-image.jpg"],
    price: 150,
    currency: "USD",
    rating: 4.8,
    reviewCount: 124,
    host: {
      name: "María García",
      avatar: null,
      verified: true,
    },
    amenities: ["Wi-Fi", "Pool", "Kitchen"],
    capacity: {
      guests: 6,
      bedrooms: 3,
      bathrooms: 2,
    },
    badges: ["premium"],
    area: 120, // m²
    ...listing,
  };

  const data = defaultListing;

  // Size variants
  const sizeVariants = {
    sm: {
      card: "max-w-sm",
      image: "h-48",
      content: "p-3",
      title: "text-base",
      price: "text-lg",
    },
    md: {
      card: "max-w-md",
      image: "h-56",
      content: "p-4",
      title: "text-lg",
      price: "text-xl",
    },
    lg: {
      card: "max-w-lg",
      image: "h-64",
      content: "p-5",
      title: "text-xl",
      price: "text-2xl",
    },
  };

  const sizes = sizeVariants[size];

  // Card base styles
  const cardStyles = [
    "bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden",
    "transition-all duration-300 ease-in-out cursor-pointer",
    "hover:shadow-xl hover:-translate-y-1",
    "border border-gray-100 dark:border-gray-700",
    sizes.card,
    className,
  ].join(" ");

  return (
    <motion.div
      className={cardStyles}
      onClick={handleCardClick}
      whileHover={{ y: -4, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2 }}
      {...props}
    >
      {/* Image Section */}
      <div
        className={`relative ${sizes.image} overflow-hidden bg-gray-200 dark:bg-gray-700`}
      >
        {/* Main Image */}
        <img
          src={data.images[currentImageIndex]}
          alt={`${data.title} - Image ${currentImageIndex + 1}`}
          className={`w-full h-full object-cover transition-all duration-300 ${
            imageLoaded ? "opacity-100 scale-100" : "opacity-0 scale-105"
          }`}
          onLoad={() => setImageLoaded(true)}
          loading="lazy"
        />

        {/* Loading skeleton */}
        {!imageLoaded && (
          <div className="absolute inset-0 bg-gray-300 dark:bg-gray-600 animate-pulse" />
        )}

        {/* Navigation Arrows - Only show if multiple images */}
        {data.images.length > 1 && (
          <>
            <button
              onClick={handlePreviousImage}
              className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-white dark:hover:bg-gray-800"
            >
              <ChevronLeft className="w-4 h-4 text-gray-800 dark:text-gray-200" />
            </button>
            <button
              onClick={handleNextImage}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-white dark:hover:bg-gray-800"
            >
              <ChevronRight className="w-4 h-4 text-gray-800 dark:text-gray-200" />
            </button>
          </>
        )}

        {/* Image Indicators - Max 5 images, positioned at bottom right */}
        {data.images.length > 1 && (
          <div className="absolute bottom-3 right-3 flex items-center gap-1">
            {data.images.slice(0, 5).map((_, index) => (
              <button
                key={index}
                onClick={(e) => handleImageIndicatorClick(e, index)}
                className={`w-2 h-2 rounded-full transition-all duration-200 ${
                  index === currentImageIndex
                    ? "bg-white scale-110"
                    : "bg-white/60 hover:bg-white/80"
                }`}
              />
            ))}
            {data.images.length > 5 && (
              <span className="text-white text-xs ml-1 bg-black/50 px-1.5 py-0.5 rounded">
                +{data.images.length - 5}
              </span>
            )}
          </div>
        )}

        {/* Current image counter */}
        {data.images.length > 1 && (
          <div className="absolute top-3 left-3 bg-black/50 text-white text-xs px-2 py-1 rounded">
            {currentImageIndex + 1} / {Math.min(data.images.length, 5)}
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          {data.badges?.includes("premium") && (
            <Badge variant="premium" size="sm">
              {t("badges.premium", "Premium")}
            </Badge>
          )}
          {data.badges?.includes("featured") && (
            <Badge variant="featured" size="sm">
              {t("badges.featured", "Featured")}
            </Badge>
          )}
        </div>

        {/* Favorite Button */}
        <div className="absolute top-3 right-3">
          <IconButton
            icon={Heart}
            variant="ghost"
            size="sm"
            onClick={handleFavoriteClick}
            className={`bg-white/80 backdrop-blur-sm hover:bg-white ${
              isFavorited ? "text-red-500" : "text-gray-600"
            }`}
            ariaLabel={
              isFavorited
                ? t("actions.removeFavorite")
                : t("actions.addFavorite")
            }
          />
        </div>

        {/* Host Info (Small Avatar) */}
        {data.host && (
          <div className="absolute bottom-3 left-3">
            <button
              onClick={handleHostClick}
              className="flex items-center gap-2 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-full px-2 py-1 text-xs hover:bg-white dark:hover:bg-gray-800 transition-colors"
            >
              <Avatar src={data.host.avatar} name={data.host.name} size="xs" />
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {data.host.name}
              </span>
              {data.host.verified && (
                <div className="w-3 h-3 bg-blue-500 rounded-full flex items-center justify-center">
                  <svg
                    className="w-2 h-2 text-white"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className={sizes.content}>
        {/* Title and Location */}
        <div className="mb-3">
          <h3
            className={`font-semibold text-gray-900 dark:text-gray-100 mb-1 line-clamp-2 ${sizes.title}`}
          >
            {data.title}
          </h3>
          <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
            <MapPin className="w-4 h-4" />
            <span className="text-sm">{data.location}</span>
          </div>
        </div>

        {/* Property Details */}
        <div className="flex items-center gap-4 mb-3 text-sm text-gray-600 dark:text-gray-400">
          <div className="flex items-center gap-1">
            <Users className="w-4 h-4" />
            <span>
              {data.capacity.guests} {t("property.guests", "guests")}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Home className="w-4 h-4" />
            <span>
              {data.capacity.bedrooms} {t("property.bedrooms", "bed")}
            </span>
          </div>
          {data.area && <span>{data.area}m²</span>}
        </div>

        {/* Rating */}
        <div className="mb-4">
          <RatingStars
            rating={data.rating}
            reviewCount={data.reviewCount}
            size="sm"
            variant="compact"
            showValue
          />
        </div>

        {/* Price and CTA */}
        <div className="flex items-center justify-between">
          <PriceBadge
            amount={data.price}
            currency={data.currency}
            period="night"
            variant="highlighted"
            size={size === "lg" ? "lg" : "md"}
          />

          <Button
            variant="primary"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleCardClick();
            }}
          >
            {t("actions.viewDetails", "View Details")}
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

export default ListingCard;
