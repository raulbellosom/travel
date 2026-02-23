/**
 * ProgressiveImage
 *
 * Two-phase image loading component that eliminates bandwidth bottlenecks while
 * keeping layout stable and providing a smooth visual reveal on every device.
 *
 * How it works
 * ─────────────
 * card / thumb presets (single phase):
 *   1. Container renders immediately at fixed aspect-ratio → no CLS.
 *   2. Low-quality image (400-600px / q40-50 / webp) streams in with a blur
 *      filter applied so JPEG band-rendering is never visible.
 *   3. Once loaded, the blur transitions out smoothly (500ms ease-out).
 *
 * detail preset (two phase):
 *   1. Low-quality version (900px / q60) renders with a mild blur.
 *   2. IntersectionObserver fires when the element enters the viewport.
 *   3. Network quality is checked via Navigator.connection:
 *        slow-2g / 2g  → skip HD entirely
 *        3g            → delay HD request by 1500ms
 *        4g / unknown  → load HD immediately
 *   4. HD version (1400px / q80) loads in a transparent layer.
 *   5. When HD finishes streaming, it fades in (700ms) while the low-q layer
 *      fades out — the blur vanishes as the sharp layer replaces it.
 *
 * CLS prevention
 * ──────────────
 * The wrapper div uses CSS aspect-ratio to reserve space before any image data
 * arrives. Both image layers are positioned absolutely within the wrapper so
 * they never influence document flow.
 *
 * Props
 * ─────
 * fileId      {string}   Appwrite file $id — drives URL generation.
 * src         {string}   Fallback URL when fileId is unavailable.
 * preset      {string}   "thumb" | "card" | "detail"  (default: "card")
 * aspectRatio {string}   CSS aspect-ratio value, e.g. "16/9" (default: "16/9")
 * alt         {string}   Accessible alt text.
 * className   {string}   Applied to the wrapper div (size, rounding, etc.).
 * bucketId    {string}   Appwrite bucket override (uses resourceImages bucket).
 * propertyType{string}   Passed to placeholder icon when no image is available.
 * eager       {boolean}  Skip lazy loading; force immediate fetch.
 * onLoad      {function} Called after the low-quality image loads successfully.
 * onError     {function} Called on image load failure.
 */

import { useCallback, useEffect, useRef, useState, memo } from "react";
import { cn } from "../../../../utils/cn";
import {
  getOptimizedImage,
  shouldLoadHD,
  getHDDelay,
} from "../../../../utils/imageOptimization";
import PropertyImagePlaceholder from "../PropertyImagePlaceholder";

// Module-level set so repeated mounts of the same URL skip the reveal
// animation (image is already in the browser disk/memory cache).
const loadedUrlCache = new Set();

// Respect OS-level accessibility preference — check once at module load.
const prefersReducedMotion =
  typeof window !== "undefined"
    ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
    : false;

const ProgressiveImage = memo(function ProgressiveImage({
  fileId,
  src,
  preset = "card",
  aspectRatio = "16/9",
  alt = "",
  className = "",
  bucketId,
  propertyType,
  eager = false,
  onLoad,
  onError,
}) {
  const isDetailPreset = preset === "detail";

  // Resolve preset names for each quality tier.
  const lowPreset = isDetailPreset ? "detail-low" : preset;
  const highPreset = isDetailPreset ? "detail-hd" : null;

  // Build stable, cacheable URLs. If fileId is absent, fall back to the raw src.
  const lowUrl = fileId
    ? getOptimizedImage(fileId, lowPreset, bucketId)
    : String(src || "");
  const highUrl =
    fileId && highPreset ? getOptimizedImage(fileId, highPreset, bucketId) : "";

  // ─── State ──────────────────────────────────────────────────────────────────

  // Initialise from cache to skip animation when the image is already loaded.
  const [lowLoaded, setLowLoaded] = useState(() => loadedUrlCache.has(lowUrl));
  const [highLoaded, setHighLoaded] = useState(() =>
    loadedUrlCache.has(highUrl),
  );
  const [highSrc, setHighSrc] = useState(() =>
    loadedUrlCache.has(highUrl) ? highUrl : "",
  );
  const [hasError, setHasError] = useState(false);

  // ─── Refs ────────────────────────────────────────────────────────────────────

  const containerRef = useRef(null);
  const observerRef = useRef(null);
  const hdTimerRef = useRef(null);
  const mountedRef = useRef(true);

  // ─── Image event handlers ────────────────────────────────────────────────────

  const handleLowLoad = useCallback(() => {
    if (!mountedRef.current) return;
    loadedUrlCache.add(lowUrl);
    setLowLoaded(true);
    onLoad?.();
  }, [lowUrl, onLoad]);

  const handleLowError = useCallback(() => {
    if (!mountedRef.current) return;
    setHasError(true);
    onError?.();
  }, [onError]);

  const handleHighLoad = useCallback(() => {
    if (!mountedRef.current) return;
    loadedUrlCache.add(highUrl);
    setHighLoaded(true);
  }, [highUrl]);

  // ─── HD trigger ─────────────────────────────────────────────────────────────

  const triggerHD = useCallback(() => {
    if (!highUrl || !mountedRef.current) return;

    // Already cached — reveal immediately without another network request.
    if (loadedUrlCache.has(highUrl)) {
      setHighSrc(highUrl);
      setHighLoaded(true);
      return;
    }

    // Skip HD on constrained connections.
    if (!shouldLoadHD()) return;

    const delay = getHDDelay();
    hdTimerRef.current = setTimeout(() => {
      if (mountedRef.current) setHighSrc(highUrl);
    }, delay);
  }, [highUrl]);

  // ─── IntersectionObserver for HD ────────────────────────────────────────────

  useEffect(() => {
    if (!highUrl) return;

    if (eager) {
      triggerHD();
      return;
    }

    const el = containerRef.current;
    if (!el) return;

    // Start loading 200px before the element enters the viewport to give the
    // HD image time to stream in before it becomes visible.
    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          observerRef.current?.disconnect();
          triggerHD();
        }
      },
      { rootMargin: "200px 0px", threshold: 0 },
    );

    observerRef.current.observe(el);

    return () => {
      observerRef.current?.disconnect();
    };
  }, [highUrl, eager, triggerHD]);

  // ─── Cleanup on unmount ─────────────────────────────────────────────────────

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      observerRef.current?.disconnect();
      if (hdTimerRef.current) clearTimeout(hdTimerRef.current);
    };
  }, []);

  // ─── Style computation ───────────────────────────────────────────────────────
  //
  // Blur values are applied via inline style (not Tailwind) because we need
  // arbitrary pixel values that change based on runtime state.

  const TRANSITION_BASE = "opacity 500ms ease-out, filter 600ms ease-out";

  const getLowStyle = () => {
    // Skip all animation for users who prefer reduced motion.
    if (prefersReducedMotion) {
      return { opacity: lowLoaded ? 1 : 0 };
    }

    if (!lowLoaded) {
      return {
        opacity: 0,
        filter: "blur(20px)",
        transition: TRANSITION_BASE,
        willChange: "opacity, filter",
      };
    }

    if (isDetailPreset && highLoaded) {
      return {
        opacity: 0,
        filter: "blur(6px)",
        transition: TRANSITION_BASE,
        willChange: "opacity, filter",
      };
    }

    if (isDetailPreset) {
      return {
        opacity: 1,
        filter: "blur(6px)",
        transition: TRANSITION_BASE,
        willChange: "opacity, filter",
      };
    }

    // Card / thumb: sharp and fully visible. Release willChange hint.
    return { opacity: 1, filter: "blur(0px)", transition: TRANSITION_BASE };
  };

  const getHighStyle = () => {
    if (prefersReducedMotion) {
      return { opacity: highLoaded ? 1 : 0 };
    }
    return {
      opacity: highLoaded ? 1 : 0,
      transition: "opacity 700ms ease-out",
      willChange: highLoaded ? "auto" : "opacity",
    };
  };

  // ─── Render ──────────────────────────────────────────────────────────────────

  // No usable source → show icon placeholder.
  if ((!fileId && !src) || hasError) {
    return (
      <div
        className={cn(
          "relative overflow-hidden bg-slate-100 dark:bg-slate-800",
          className,
        )}
        style={{ aspectRatio }}
        aria-label={alt || undefined}
      >
        <PropertyImagePlaceholder propertyType={propertyType} iconSize={32} />
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      // The aspect-ratio on the wrapper guarantees the space is reserved in the
      // document before any image bytes arrive → zero CLS contribution.
      className={cn(
        "relative overflow-hidden bg-slate-100 dark:bg-slate-800",
        className,
      )}
      style={{ aspectRatio }}
    >
      {/* Skeleton shimmer — visible until the first byte of pixel data arrives */}
      {!lowLoaded && (
        <div
          className="absolute inset-0 img-loading-skeleton"
          aria-hidden="true"
        />
      )}

      {/* Low-quality layer ─────────────────────────────────────────────────── */}
      <img
        src={lowUrl}
        alt={alt}
        loading={eager ? "eager" : "lazy"}
        decoding="async"
        onLoad={handleLowLoad}
        onError={handleLowError}
        className="absolute inset-0 h-full w-full object-cover"
        style={getLowStyle()}
        // Screen-readers get the alt from the wrapper or the HD layer; hide
        // the low-q duplicate once HD takes over.
        aria-hidden={isDetailPreset && highLoaded ? "true" : undefined}
      />

      {/* High-quality layer ─────────────────────────────────────────────────── */}
      {highSrc && (
        <img
          src={highSrc}
          alt={alt}
          decoding="async"
          onLoad={handleHighLoad}
          className="absolute inset-0 h-full w-full object-cover"
          style={getHighStyle()}
        />
      )}
    </div>
  );
});

export default ProgressiveImage;
