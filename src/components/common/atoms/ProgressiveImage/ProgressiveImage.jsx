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
 *   2. Optimised image (300-600px / q40-50 / webp) streams in with a blur
 *      filter applied so band-rendering is never visible.
 *   3. Once loaded, the blur transitions out smoothly (500ms ease-out).
 *   4. If the /preview URL fails, the component transparently retries with
 *      the raw /view URL before falling back to a placeholder icon.
 *
 * detail preset (two phase):
 *   1. Low-quality version (900px / q60) renders with a mild blur.
 *   2. IntersectionObserver fires when the element enters the viewport.
 *   3. Network quality is checked via Navigator.connection:
 *        slow-2g / 2g  → skip HD, remove blur after 2s so image is usable
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
 * preset      {string}   "thumb" | "card" | "detail" | "hero"  (default: "card")
 * aspectRatio {string}   CSS aspect-ratio value, e.g. "16/9" (default: "16/9")
 * alt         {string}   Accessible alt text.
 * className   {string}   Applied to the wrapper div (size, rounding, etc.).
 * bucketId    {string}   Appwrite bucket override (uses resourceImages bucket).
 * propertyType{string}   Passed to placeholder icon when no image is available.
 * eager       {boolean}  Skip lazy loading; force immediate fetch.
 * priority    {boolean}  Set fetchpriority="high" for above-the-fold images.
 * onLoad      {function} Called after the image loads successfully.
 * onError     {function} Called on image load failure.
 */

import { useCallback, useEffect, useRef, useState, memo } from "react";
import { cn } from "../../../../utils/cn";
import {
  getOptimizedImage,
  getFileViewUrl,
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

// Maximum time (ms) to wait for the preview URL before trying the fallback.
const PREVIEW_TIMEOUT_MS = 6000;

// Time (ms) to wait before removing blur on detail preset when HD is skipped.
const DETAIL_BLUR_REMOVE_MS = 2000;

// Maximum time (ms) to wait for the HD image before giving up and removing blur.
const HD_LOAD_TIMEOUT_MS = 8000;

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
  priority = false,
  onLoad,
  onError,
}) {
  const isDetailPreset = preset === "detail";

  // Resolve preset names for each quality tier.
  const lowPreset = isDetailPreset ? "detail-low" : preset;
  const highPreset = isDetailPreset ? "detail-hd" : null;

  // Build stable, cacheable URLs. If fileId is absent, fall back to the raw src.
  const previewUrl = fileId
    ? getOptimizedImage(fileId, lowPreset, bucketId)
    : "";
  const viewUrl = fileId ? getFileViewUrl(fileId, bucketId) : "";
  const externalSrc = String(src || "");
  const highUrl =
    fileId && highPreset ? getOptimizedImage(fileId, highPreset, bucketId) : "";

  // The effective URL to load — starts with preview, falls back to view, then src.
  const primaryUrl = previewUrl || viewUrl || externalSrc;

  // ─── State ──────────────────────────────────────────────────────────────────

  const [activeSrc, setActiveSrc] = useState(() => primaryUrl);
  const [lowLoaded, setLowLoaded] = useState(
    () => loadedUrlCache.has(primaryUrl) || loadedUrlCache.has(viewUrl),
  );
  const [highLoaded, setHighLoaded] = useState(() =>
    loadedUrlCache.has(highUrl),
  );
  const [highSrc, setHighSrc] = useState(() =>
    loadedUrlCache.has(highUrl) ? highUrl : "",
  );
  const [hasError, setHasError] = useState(false);
  // When HD is skipped (slow network) or unavailable, remove the detail blur
  // so the low-q image is at least fully visible.
  const [detailBlurRemoved, setDetailBlurRemoved] = useState(false);

  // ─── Refs ────────────────────────────────────────────────────────────────────

  const containerRef = useRef(null);
  const observerRef = useRef(null);
  const hdTimerRef = useRef(null);
  const timeoutRef = useRef(null);
  const blurTimerRef = useRef(null);
  const mountedRef = useRef(true);
  const fallbackAttemptedRef = useRef(false);

  // ─── Image event handlers ────────────────────────────────────────────────────

  const handleLowLoad = useCallback(() => {
    if (!mountedRef.current) return;
    loadedUrlCache.add(activeSrc);
    setLowLoaded(true);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    onLoad?.();
  }, [activeSrc, onLoad]);

  const handleLowError = useCallback(() => {
    if (!mountedRef.current) return;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    // Fallback chain: preview → view → src → placeholder
    if (!fallbackAttemptedRef.current) {
      fallbackAttemptedRef.current = true;
      const fallback =
        activeSrc === previewUrl && viewUrl ? viewUrl : externalSrc;
      if (fallback && fallback !== activeSrc) {
        setActiveSrc(fallback);
        return; // retry with fallback URL instead of showing placeholder
      }
    }

    setHasError(true);
    onError?.();
  }, [activeSrc, previewUrl, viewUrl, externalSrc, onError]);

  const handleHighLoad = useCallback(() => {
    if (!mountedRef.current) return;
    loadedUrlCache.add(highUrl);
    setHighLoaded(true);
  }, [highUrl]);

  // If the HD image fails to load, remove the blur from the low-q layer
  // so the user at least sees a clear (though lower resolution) image.
  const handleHighError = useCallback(() => {
    if (!mountedRef.current) return;
    setDetailBlurRemoved(true);
  }, []);

  // ─── Preview timeout ────────────────────────────────────────────────────────
  // If the preview URL doesn't load within PREVIEW_TIMEOUT_MS, fall back to
  // the view URL so the user at least sees the original image.

  useEffect(() => {
    if (lowLoaded || !primaryUrl || !previewUrl || !viewUrl) return;

    timeoutRef.current = setTimeout(() => {
      if (!mountedRef.current || lowLoaded) return;
      if (!fallbackAttemptedRef.current) {
        fallbackAttemptedRef.current = true;
        setActiveSrc(viewUrl);
      }
    }, PREVIEW_TIMEOUT_MS);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Detail blur removal safety net ────────────────────────────────────────
  // Remove blur(6px) from the low-q layer when:
  //   • slow network → HD skipped entirely (after DETAIL_BLUR_REMOVE_MS)
  //   • normal network → HD hasn't loaded after HD_LOAD_TIMEOUT_MS
  // This guarantees the image is always usable even if the HD request stalls.

  useEffect(() => {
    if (!isDetailPreset || !lowLoaded || highLoaded || detailBlurRemoved)
      return;

    // On slow networks HD is skipped — remove blur quickly.
    // On fast networks give HD a generous window, then remove blur anyway.
    const delay = !shouldLoadHD() ? DETAIL_BLUR_REMOVE_MS : HD_LOAD_TIMEOUT_MS;

    blurTimerRef.current = setTimeout(() => {
      if (mountedRef.current && !highLoaded) setDetailBlurRemoved(true);
    }, delay);

    return () => {
      if (blurTimerRef.current) clearTimeout(blurTimerRef.current);
    };
  }, [isDetailPreset, lowLoaded, highLoaded, detailBlurRemoved]);

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
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (blurTimerRef.current) clearTimeout(blurTimerRef.current);
    };
  }, []);

  // ─── Style computation ───────────────────────────────────────────────────────

  const TRANSITION_BASE = "opacity 500ms ease-out, filter 600ms ease-out";

  const getLowStyle = () => {
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
      // HD loaded — fade out low-q layer.
      return {
        opacity: 0,
        transition: TRANSITION_BASE,
        willChange: "opacity",
      };
    }

    if (isDetailPreset && !detailBlurRemoved) {
      // Priority images are above-the-fold — show low-q sharp immediately.
      // HD will silently upgrade in the background.
      if (priority) {
        return { opacity: 1, filter: "blur(0px)", transition: TRANSITION_BASE };
      }
      // Low-q loaded, HD not yet — show with mild blur.
      return {
        opacity: 1,
        filter: "blur(6px)",
        transition: TRANSITION_BASE,
        willChange: "filter",
      };
    }

    // Card / thumb OR detail with blur removed: sharp and fully visible.
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

  const aspectRatioStyle = aspectRatio ? { aspectRatio } : {};

  // No usable source → show icon placeholder.
  if ((!fileId && !src) || hasError) {
    return (
      <div
        className={cn(
          "relative overflow-hidden bg-slate-100 dark:bg-slate-800",
          className,
        )}
        style={aspectRatioStyle}
        aria-label={alt || undefined}
      >
        <PropertyImagePlaceholder propertyType={propertyType} iconSize={32} />
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative overflow-hidden bg-slate-100 dark:bg-slate-800",
        className,
      )}
      style={aspectRatioStyle}
    >
      {/* Skeleton shimmer — visible until the first byte of pixel data arrives */}
      {!lowLoaded && (
        <div
          className="absolute inset-0 img-loading-skeleton"
          aria-hidden="true"
        />
      )}

      {/* Low-quality / primary layer ──────────────────────────────────────── */}
      <img
        src={activeSrc}
        alt={alt}
        loading={eager || priority ? "eager" : "lazy"}
        decoding={priority ? "sync" : "async"}
        {...(priority ? { fetchpriority: "high" } : {})}
        onLoad={handleLowLoad}
        onError={handleLowError}
        className="absolute inset-0 h-full w-full object-cover"
        style={getLowStyle()}
        aria-hidden={isDetailPreset && highLoaded ? "true" : undefined}
      />

      {/* High-quality layer ─────────────────────────────────────────────────── */}
      {highSrc && (
        <img
          src={highSrc}
          alt={alt}
          decoding="async"
          onLoad={handleHighLoad}
          onError={handleHighError}
          className="absolute inset-0 h-full w-full object-cover"
          style={getHighStyle()}
        />
      )}
    </div>
  );
});

export default ProgressiveImage;
