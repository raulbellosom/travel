import React, { useState } from "react";

/**
 * Avatar component with image fallback to initials.
 * Supports multiple sizes and status indicators.
 */
const Avatar = ({
  src,
  alt,
  name,
  size = "md",
  variant = "circular",
  status,
  className = "",
  onClick,
  ...props
}) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Generate initials from name
  const getInitials = (name) => {
    if (!name) return "?";
    return name
      .split(" ")
      .slice(0, 2)
      .map((word) => word.charAt(0).toUpperCase())
      .join("");
  };

  // Base styles
  const baseStyles = [
    "relative inline-flex items-center justify-center overflow-hidden",
    "bg-gray-100 text-gray-600 font-medium select-none",
    "dark:bg-gray-800 dark:text-gray-300",
    "transition-all duration-200 ease-in-out",
    onClick
      ? "cursor-pointer hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      : "",
  ];

  // Size styles
  const sizeStyles = {
    xs: "w-6 h-6 text-xs",
    sm: "w-8 h-8 text-sm",
    md: "w-10 h-10 text-base",
    lg: "w-12 h-12 text-lg",
    xl: "w-16 h-16 text-xl",
    "2xl": "w-20 h-20 text-2xl",
  };

  // Variant styles
  const variantStyles = {
    circular: "rounded-full",
    rounded: "rounded-lg",
    square: "rounded-none",
  };

  // Status indicator styles
  const statusStyles = {
    online: "bg-green-400 border-2 border-white dark:border-gray-800",
    offline: "bg-gray-400 border-2 border-white dark:border-gray-800",
    away: "bg-yellow-400 border-2 border-white dark:border-gray-800",
    busy: "bg-red-400 border-2 border-white dark:border-gray-800",
  };

  // Status indicator sizes
  const statusSizes = {
    xs: "w-2 h-2",
    sm: "w-2.5 h-2.5",
    md: "w-3 h-3",
    lg: "w-3.5 h-3.5",
    xl: "w-4 h-4",
    "2xl": "w-5 h-5",
  };

  // Combine avatar styles
  const safeSize = sizeStyles[size] ? size : "md";
  const safeVariant = variantStyles[variant] ? variant : "circular";

  const avatarStyles = [
    ...baseStyles,
    sizeStyles[safeSize],
    variantStyles[safeVariant],
    className,
  ].join(" ");

  const handleImageError = () => {
    setImageError(true);
  };

  const handleImageLoad = () => {
    setImageLoaded(true);
  };

  const handleClick = (e) => {
    if (onClick) {
      onClick(e);
    }
  };

  const handleKeyDown = (e) => {
    if (onClick && (e.key === "Enter" || e.key === " ")) {
      e.preventDefault();
      onClick(e);
    }
  };

  const showImage = src && !imageError && imageLoaded;
  const showInitials = !src || imageError || !imageLoaded;

  return (
    <div className="relative inline-block">
      <div
        className={avatarStyles}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        tabIndex={onClick ? 0 : undefined}
        role={onClick ? "button" : undefined}
        aria-label={alt || `Avatar for ${name}`}
        {...props}
      >
        {/* Image */}
        {src && (
          <img
            src={src}
            alt={alt || name}
            className={[
              "w-full h-full object-cover transition-opacity duration-200",
              variantStyles[safeVariant],
              showImage ? "opacity-100" : "opacity-0",
            ].join(" ")}
            onError={handleImageError}
            onLoad={handleImageLoad}
            loading="lazy"
          />
        )}

        {/* Initials fallback */}
        {showInitials && (
          <span
            className={[
              "absolute inset-0 flex items-center justify-center",
              "transition-opacity duration-200",
              showImage ? "opacity-0" : "opacity-100",
            ].join(" ")}
          >
            {getInitials(name)}
          </span>
        )}

        {/* Loading state */}
        {src && !imageLoaded && !imageError && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* Status indicator */}
      {status && (
        <span
          className={[
            "absolute bottom-0 right-0 block rounded-full",
            statusStyles[status],
            statusSizes[safeSize],
          ].join(" ")}
          aria-hidden="true"
        />
      )}
    </div>
  );
};

export default Avatar;
