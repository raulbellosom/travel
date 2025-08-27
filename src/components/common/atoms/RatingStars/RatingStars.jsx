import React from "react";
import { useTranslation } from "react-i18next";
import { Star } from "lucide-react";

/**
 * RatingStars component for displaying and optionally editing ratings.
 * Supports half stars, review counts, and interactive mode.
 */
const RatingStars = ({
  rating = 0,
  maxRating = 5,
  size = "md",
  variant = "display",
  reviewCount,
  precision = 1, // 1 = whole stars, 0.5 = half stars, 0.1 = decimal
  interactive = false,
  onChange,
  className = "",
  showValue = false,
  ...props
}) => {
  const { t } = useTranslation();

  // Ensure rating is within bounds
  const clampedRating = Math.max(0, Math.min(maxRating, rating));

  // Round rating based on precision
  const roundedRating = Math.round(clampedRating / precision) * precision;

  // Size styles
  const sizeStyles = {
    xs: "w-3 h-3",
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6",
    xl: "w-8 h-8",
  };

  // Text size for value and count
  const textSizes = {
    xs: "text-xs",
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
    xl: "text-xl",
  };

  // Variant styles
  const variantStyles = {
    display: "text-amber-400",
    compact: "text-amber-400",
    detailed: "text-amber-400",
    interactive:
      "text-gray-300 hover:text-amber-400 cursor-pointer transition-colors duration-150",
  };

  const safeSize = sizeStyles[size] ? size : "md";
  const safeVariant = variantStyles[interactive ? "interactive" : variant]
    ? interactive
      ? "interactive"
      : variant
    : "display";

  const starSize = sizeStyles[safeSize];
  const textSize = textSizes[safeSize];
  const starColor = variantStyles[safeVariant];

  const handleStarClick = (starIndex) => {
    if (interactive && onChange) {
      const newRating = starIndex + 1;
      onChange(newRating);
    }
  };

  const handleStarHover = (starIndex) => {
    if (interactive) {
      // You can add hover preview functionality here
    }
  };

  const renderStar = (starIndex) => {
    const fillPercentage = Math.max(0, Math.min(1, roundedRating - starIndex));
    const isFilled = fillPercentage > 0;
    const isPartiallyFilled = fillPercentage > 0 && fillPercentage < 1;

    return (
      <div
        key={starIndex}
        className="relative inline-block"
        onClick={() => handleStarClick(starIndex)}
        onMouseEnter={() => handleStarHover(starIndex)}
      >
        {/* Background star (empty) */}
        <Star
          className={`${starSize} ${starColor} ${
            interactive ? "cursor-pointer" : ""
          }`}
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
        />

        {/* Filled star overlay */}
        {isFilled && (
          <div
            className="absolute inset-0 overflow-hidden"
            style={{ width: `${fillPercentage * 100}%` }}
          >
            <Star
              className={`${starSize} text-amber-400`}
              fill="currentColor"
              stroke="currentColor"
              strokeWidth={1.5}
            />
          </div>
        )}
      </div>
    );
  };

  const formatRating = (rating) => {
    if (precision >= 1) {
      return Math.round(rating).toString();
    } else if (precision >= 0.1) {
      return rating.toFixed(1);
    } else {
      return rating.toFixed(2);
    }
  };

  const renderContent = () => {
    switch (variant) {
      case "compact":
        return (
          <div className={`flex items-center gap-1 ${className}`}>
            <div className="flex items-center">
              {Array.from({ length: maxRating }, (_, index) =>
                renderStar(index)
              )}
            </div>
            {showValue && (
              <span
                className={`${textSize} font-medium text-gray-700 dark:text-gray-300`}
              >
                {formatRating(roundedRating)}
              </span>
            )}
            {reviewCount !== undefined && (
              <span className={`${textSize} text-gray-500 dark:text-gray-400`}>
                ({reviewCount})
              </span>
            )}
          </div>
        );

      case "detailed":
        return (
          <div className={`flex flex-col gap-1 ${className}`}>
            <div className="flex items-center gap-2">
              <div className="flex items-center">
                {Array.from({ length: maxRating }, (_, index) =>
                  renderStar(index)
                )}
              </div>
              <span
                className={`${textSize} font-semibold text-gray-900 dark:text-gray-100`}
              >
                {formatRating(roundedRating)}
              </span>
            </div>
            {reviewCount !== undefined && (
              <p className={`${textSizes.sm} text-gray-500 dark:text-gray-400`}>
                {t("rating.basedOnReviews", { count: reviewCount })}
              </p>
            )}
          </div>
        );

      default: // display
        return (
          <div className={`flex items-center gap-1 ${className}`} {...props}>
            <div className="flex items-center">
              {Array.from({ length: maxRating }, (_, index) =>
                renderStar(index)
              )}
            </div>
            {(showValue || reviewCount !== undefined) && (
              <div className="flex items-center gap-1">
                {showValue && (
                  <span
                    className={`${textSize} font-medium text-gray-700 dark:text-gray-300`}
                  >
                    {formatRating(roundedRating)}
                  </span>
                )}
                {reviewCount !== undefined && (
                  <span
                    className={`${textSize} text-gray-500 dark:text-gray-400`}
                  >
                    ({reviewCount} {t("rating.reviews")})
                  </span>
                )}
              </div>
            )}
          </div>
        );
    }
  };

  return (
    <div
      role={interactive ? "slider" : "img"}
      aria-label={
        interactive
          ? t("rating.interactiveLabel", {
              rating: roundedRating,
              max: maxRating,
            })
          : t("rating.displayLabel", { rating: roundedRating, max: maxRating })
      }
      tabIndex={interactive ? 0 : undefined}
    >
      {renderContent()}
    </div>
  );
};

export default RatingStars;
