import { useEffect, useState } from "react";
import { cn } from "../../../../utils/cn";

// Keep a module-level cache so repeated mounts of the same URL don't fade in again.
const loadedSrcCache = new Set();

/**
 * LazyImage - Image component with lazy loading and smooth fade-in effect
 * This component is a drop-in replacement for <img> tag without altering layout
 * @param {string} src - Image source URL
 * @param {string} alt - Alt text for the image
 * @param {string} className - CSS classes for the img element
 * @param {boolean} eager - Load image eagerly instead of lazy (default: false)
 * @param {Function} onLoad - Callback when image loads
 * @param {Function} onError - Callback when image fails to load
 */
const LazyImage = ({
  src,
  alt = "",
  className = "",
  eager = false,
  fadeIn = true,
  onLoad,
  onError,
  ...props
}) => {
  const normalizedSrc = String(src || "").trim();
  const [isLoading, setIsLoading] = useState(() => {
    if (!normalizedSrc) return false;
    return !loadedSrcCache.has(normalizedSrc);
  });

  useEffect(() => {
    if (!normalizedSrc) {
      setIsLoading(false);
      return;
    }
    setIsLoading(!loadedSrcCache.has(normalizedSrc));
  }, [normalizedSrc]);

  const handleLoad = (e) => {
    if (normalizedSrc) loadedSrcCache.add(normalizedSrc);
    setIsLoading(false);
    onLoad?.(e);
  };

  const handleError = (e) => {
    setIsLoading(false);
    onError?.(e);
  };

  return (
    <img
      src={src}
      alt={alt}
      loading={eager ? "eager" : "lazy"}
      onLoad={handleLoad}
      onError={handleError}
      className={cn(
        fadeIn ? "transition-opacity duration-300" : "",
        fadeIn && isLoading ? "opacity-0" : "opacity-100",
        className,
      )}
      {...props}
    />
  );
};

export default LazyImage;
