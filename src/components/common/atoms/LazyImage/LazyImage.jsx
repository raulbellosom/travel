import { useEffect, useRef, useState } from "react";
import { cn } from "../../../../utils/cn";

// Keep a module-level cache so repeated mounts of the same URL don't re-animate.
const loadedSrcCache = new Set();

/**
 * LazyImage – Drop-in <img> replacement with blur-up progressive loading.
 *
 * While the image is downloading the element shows a shimmer skeleton and the
 * image pixels are rendered through a blur filter so progressive-JPEG / WebP
 * band-rendering is never visible. Once the browser fires `onLoad` the filter
 * transitions smoothly to sharp (blur-up effect).
 *
 * @param {string}   src      - Image source URL
 * @param {string}   alt      - Alt text
 * @param {string}   className- CSS classes applied to the <img>
 * @param {boolean}  eager    - Skip lazy loading (default: false)
 * @param {boolean}  fadeIn   - Enable blur-up animation (default: true)
 * @param {Function} onLoad   - Called when image finishes loading
 * @param {Function} onError  - Called on load error
 */
const LazyImage = ({
  src,
  alt = "",
  className = "",
  eager = false,
  fadeIn = true,
  onLoad,
  onError,
  style,
  ...props
}) => {
  const normalizedSrc = String(src || "").trim();

  const [isLoading, setIsLoading] = useState(() => {
    if (!normalizedSrc) return false;
    return !loadedSrcCache.has(normalizedSrc);
  });

  // Track whether we are in the "first reveal" phase (transition just fired)
  // so we can remove the skeleton class without a visual flash.
  const transitioningRef = useRef(false);

  useEffect(() => {
    if (!normalizedSrc) {
      setIsLoading(false);
      return;
    }
    setIsLoading(!loadedSrcCache.has(normalizedSrc));
  }, [normalizedSrc]);

  const handleLoad = (e) => {
    if (normalizedSrc) loadedSrcCache.add(normalizedSrc);
    transitioningRef.current = true;
    setIsLoading(false);
    onLoad?.(e);
  };

  const handleError = (e) => {
    setIsLoading(false);
    onError?.(e);
  };

  // ─── Blur-up transforms ────────────────────────────────────────────────────
  // Loading  → blurred + slightly over-scaled (hides JPEG band rendering)
  // Loaded   → sharp  + normal scale
  // The CSS transition fires when isLoading flips false.
  const blurUpStyle =
    fadeIn && isLoading
      ? {
          filter: "blur(12px) saturate(1.1)",
          transform: "scale(1.06)",
          willChange: "filter, transform",
        }
      : {
          filter: "blur(0px) saturate(1)",
          transform: "scale(1)",
        };

  return (
    <img
      src={src}
      alt={alt}
      loading={eager ? "eager" : "lazy"}
      decoding="async"
      onLoad={handleLoad}
      onError={handleError}
      className={cn(
        // Skeleton shimmer background – visible before any pixels arrive.
        fadeIn && isLoading && "img-loading-skeleton",
        // Smooth transition out of the blur-up state.
        fadeIn && "transition-[filter,transform] duration-500 ease-out",
        className,
      )}
      style={{ ...blurUpStyle, ...style }}
      {...props}
    />
  );
};

export default LazyImage;
