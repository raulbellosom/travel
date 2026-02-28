import React, { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { m, AnimatePresence, useMotionValue } from "motion/react";
import {
  X,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Download,
  Loader2,
  Maximize2,
  Minimize2,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "../../../../utils/cn";

/**
 * A fullscreen image viewer modal with zoom, pan, rotate and mobile gestures support.
 * Refactored to use MotionValues for high-performance 60fps animations.
 */
const EMPTY_ARRAY = [];
export function ImageViewerModal({
  isOpen,
  onClose,
  src,
  images = EMPTY_ARRAY,
  initialIndex = 0,
  alt = "Image",
  showDownload = true,
  downloadFilename,
}) {
  const imageList = React.useMemo(() => {
    if (images && images.length > 0) return images;
    return src ? [src] : [];
  }, [images, src]);

  const isGalleryMode = imageList.length > 1;

  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [loading, setLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [scaleDisplay, setScaleDisplay] = useState(1); // Only for UI display

  // Motion Values for performant animations without re-renders
  const scaleMv = useMotionValue(1);
  const rotateMv = useMotionValue(0);
  const xMv = useMotionValue(0);
  const yMv = useMotionValue(0);

  // Refs for gesture tracking
  const stateRef = useRef({
    isDragging: false,
    lastTouch: { x: 0, y: 0 },
    touchStartDist: null,
    initialPinchScale: 1,
  });

  const containerRef = useRef(null);
  const imageRef = useRef(null);

  // Sync index when initialIndex changes
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex);
    }
  }, [initialIndex, isOpen]);

  // Reset view when image changes or modal opens
  useEffect(() => {
    if (!isOpen) return;

    scaleMv.set(1);
    rotateMv.set(0);
    xMv.set(0);
    yMv.set(0);
    setScaleDisplay(1);
    setLoading(true);

    stateRef.current = {
      isDragging: false,
      lastTouch: { x: 0, y: 0 },
      touchStartDist: null,
      initialPinchScale: 1,
    };
  }, [currentIndex, isOpen, scaleMv, rotateMv, xMv, yMv]);

  // Lock body scroll
  useEffect(() => {
    if (!isOpen) return;
    const scrollY = window.scrollY;
    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.left = "0";
    document.body.style.right = "0";
    document.body.style.touchAction = "none";

    return () => {
      const savedScrollY = document.body.style.top;
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.left = "";
      document.body.style.right = "";
      document.body.style.touchAction = "";
      if (savedScrollY) {
        window.scrollTo(0, parseInt(savedScrollY || "0") * -1);
      }
    };
  }, [isOpen]);

  const nextImage = useCallback(() => {
    if (!isGalleryMode) return;
    setCurrentIndex((prev) => (prev + 1) % imageList.length);
  }, [isGalleryMode, imageList.length]);

  const prevImage = useCallback(() => {
    if (!isGalleryMode) return;
    setCurrentIndex((prev) => (prev - 1 + imageList.length) % imageList.length);
  }, [isGalleryMode, imageList.length]);

  const resetView = useCallback(() => {
    scaleMv.set(1);
    rotateMv.set(0);
    xMv.set(0);
    yMv.set(0);
    setScaleDisplay(1);
  }, [scaleMv, rotateMv, xMv, yMv]);

  const updateScale = useCallback(
    (newScale) => {
      const clamped = Math.min(5, Math.max(0.5, newScale));
      scaleMv.set(clamped);
      setScaleDisplay(clamped); // Update UI
    },
    [scaleMv],
  );

  const handleWheel = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      const currentScale = scaleMv.get();
      // Regular wheel or pinch-to-zoom on trackpad
      const delta = e.ctrlKey ? -e.deltaY * 0.01 : -e.deltaY * 0.002;
      updateScale(currentScale + delta);
    },
    [scaleMv, updateScale],
  );

  // Double tap/click detection
  const lastTapRef = useRef(0);
  const handleDoubleTap = useCallback(
    (e) => {
      const now = Date.now();
      const isDouble = e?.type === "dblclick" || now - lastTapRef.current < 300;
      if (e?.type === "dblclick") e.preventDefault();

      if (isDouble) {
        if (scaleMv.get() > 1.01) {
          resetView();
        } else {
          updateScale(2.5);
        }
      }
      lastTapRef.current = now;
    },
    [scaleMv, resetView, updateScale],
  );

  const handleTouchStart = useCallback(
    (e) => {
      const now = Date.now();
      const isDoubleTap = now - lastTapRef.current < 300;

      if (e.touches.length === 2) {
        e.preventDefault();
        const dist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY,
        );
        stateRef.current.touchStartDist = dist;
        stateRef.current.initialPinchScale = scaleMv.get();
      } else if (e.touches.length === 1) {
        if (isDoubleTap) {
          e.preventDefault();
          handleDoubleTap();
          return;
        }

        stateRef.current.lastTouch = {
          x: e.touches[0].clientX,
          y: e.touches[0].clientY,
        };
        // Always allow drag start if scale > 1
        if (scaleMv.get() > 1) {
          stateRef.current.isDragging = true;
        }
      }
      lastTapRef.current = now;
    },
    [scaleMv, handleDoubleTap],
  );

  const handleTouchMove = useCallback(
    (e) => {
      const _isDragging = stateRef.current.isDragging;
      const touchStartDist = stateRef.current.touchStartDist;

      if (e.touches.length === 2 && touchStartDist) {
        e.preventDefault();
        const dist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY,
        );
        const scaleFactor = dist / touchStartDist;
        updateScale(stateRef.current.initialPinchScale * scaleFactor);
      } else if (e.touches.length === 1 && scaleMv.get() > 1) {
        // Force dragging if scale > 1 even if it didn't start that way (e.g. pinch then drag)
        e.preventDefault();

        const deltaX = e.touches[0].clientX - stateRef.current.lastTouch.x;
        const deltaY = e.touches[0].clientY - stateRef.current.lastTouch.y;

        xMv.set(xMv.get() + deltaX);
        yMv.set(yMv.get() + deltaY);

        stateRef.current.lastTouch = {
          x: e.touches[0].clientX,
          y: e.touches[0].clientY,
        };
      }
    },
    [xMv, yMv, updateScale, scaleMv],
  );

  const handleTouchEnd = useCallback(() => {
    stateRef.current.touchStartDist = null;
    stateRef.current.isDragging = false;
  }, []);

  const combinedContainerRef = useCallback(
    (node) => {
      if (containerRef.current) {
        containerRef.current.removeEventListener("wheel", handleWheel);
        containerRef.current.removeEventListener(
          "touchstart",
          handleTouchStart,
        );
        containerRef.current.removeEventListener("touchmove", handleTouchMove);
        containerRef.current.removeEventListener("touchend", handleTouchEnd);
      }
      containerRef.current = node;
      if (node) {
        node.style.touchAction = "none";
        node.addEventListener("wheel", handleWheel, { passive: false });
        node.addEventListener("touchstart", handleTouchStart, {
          passive: false,
        });
        node.addEventListener("touchmove", handleTouchMove, { passive: false });
        node.addEventListener("touchend", handleTouchEnd, { passive: false });
      }
    },
    [handleWheel, handleTouchStart, handleTouchMove, handleTouchEnd],
  );

  const handleMouseDown = useCallback(
    (e) => {
      if (scaleMv.get() > 1) {
        e.preventDefault();
        stateRef.current.lastTouch = { x: e.clientX, y: e.clientY };
        stateRef.current.isDragging = true;
        if (containerRef.current)
          containerRef.current.style.cursor = "grabbing";
      }
    },
    [scaleMv],
  );

  const handleMouseMove = useCallback(
    (e) => {
      if (stateRef.current.isDragging && scaleMv.get() > 1) {
        const deltaX = e.clientX - stateRef.current.lastTouch.x;
        const deltaY = e.clientY - stateRef.current.lastTouch.y;

        xMv.set(xMv.get() + deltaX);
        yMv.set(yMv.get() + deltaY);

        stateRef.current.lastTouch = { x: e.clientX, y: e.clientY };
      }
    },
    [scaleMv, xMv, yMv],
  );

  const handleMouseUp = useCallback(() => {
    stateRef.current.isDragging = false;
    if (containerRef.current && scaleMv.get() > 1) {
      containerRef.current.style.cursor = "grab";
    }
  }, [scaleMv]);

  const handleClose = useCallback(() => {
    resetView();
    onClose();
  }, [onClose, resetView]);

  const toggleFullscreen = useCallback(async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (err) {
      console.error(`Fullscreen error: ${err}`);
    }
  }, []);

  const handleDownload = useCallback(
    (e) => {
      e.stopPropagation();
      const currentUrl = imageList[currentIndex] || src;
      if (!currentUrl) return;
      const link = document.createElement("a");
      link.href = currentUrl;
      link.download = downloadFilename || `image-${Date.now()}.jpg`;
      link.target = "_blank";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    },
    [currentIndex, imageList, src, downloadFilename],
  );

  useEffect(() => {
    const handleKey = (e) => {
      if (!isOpen) return;
      if (e.key === "Escape") handleClose();
      if (e.key === "ArrowLeft") prevImage();
      if (e.key === "ArrowRight") nextImage();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen, handleClose, prevImage, nextImage]);

  if (!isOpen) return null;

  return createPortal(
    <AnimatePresence mode="wait">
      <m.div
        key="image-viewer-root"
        className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden touch-none w-screen h-[100dvh]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Fondo ultra transparente con efecto glass */}
        <m.div
          className="absolute inset-0 bg-gradient-to-br from-black/30 via-slate-900/40 to-cyan-950/35 backdrop-blur-md"
          onClick={handleClose}
          initial={{ backdropFilter: "blur(0px)" }}
          animate={{ backdropFilter: "blur(8px)" }}
          exit={{ backdropFilter: "blur(0px)" }}
          transition={{ duration: 0.4 }}
        />

        {/* UI Controls */}
        <div
          className="absolute inset-0 pointer-events-none flex flex-col justify-between p-2 sm:p-4 md:p-6 z-10 text-white"
          style={{
            paddingTop: "max(0.5rem, env(safe-area-inset-top))",
            paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))",
            paddingLeft: "max(0.5rem, env(safe-area-inset-left))",
            paddingRight: "max(0.5rem, env(safe-area-inset-right))",
          }}
        >
          {/* Header */}
          <div className="flex justify-between items-center pointer-events-auto">
            {isGalleryMode && (
              <m.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="relative bg-gradient-to-br from-white/15 to-white/5 backdrop-blur-2xl px-5 py-2.5 rounded-3xl text-sm font-semibold border border-white/30 shadow-2xl shadow-black/20"
                style={{
                  boxShadow:
                    "0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.2)",
                }}
              >
                <span className="text-white drop-shadow-lg">
                  {currentIndex + 1}
                </span>
                <span className="text-white/50 mx-1.5">/</span>
                <span className="text-white/90 drop-shadow-lg">
                  {imageList.length}
                </span>
              </m.div>
            )}
            {!isGalleryMode && <div />}

            <div className="flex items-center gap-2">
              {scaleDisplay > 1.01 && (
                <m.button
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    resetView();
                  }}
                  className="px-3 py-2 sm:px-5 sm:py-2.5 bg-gradient-to-br from-cyan-500/80 to-blue-600/70 hover:from-cyan-400/90 hover:to-blue-500/80 rounded-3xl transition-all duration-300 border border-cyan-300/40 text-xs sm:text-sm font-bold backdrop-blur-2xl flex items-center gap-2 shadow-2xl shadow-cyan-500/30 hover:shadow-cyan-400/50 hover:scale-105 active:scale-95"
                  style={{
                    boxShadow:
                      "0 8px 32px rgba(6,182,212,0.3), inset 0 1px 0 rgba(255,255,255,0.3)",
                  }}
                >
                  <RotateCcw
                    size={16}
                    className="sm:w-[18px] sm:h-[18px] drop-shadow"
                  />
                  <span className="drop-shadow">Restablecer Vista</span>
                </m.button>
              )}
              <m.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleClose}
                className="p-2 sm:p-3 bg-gradient-to-br from-white/15 to-white/5 hover:from-red-500/80 hover:to-red-600/70 rounded-3xl transition-all duration-300 border border-white/30 hover:border-red-400/60 backdrop-blur-2xl shadow-2xl shadow-black/20"
                style={{
                  boxShadow:
                    "0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.2)",
                }}
                title="Cerrar (ESC)"
              >
                <X size={20} className="sm:w-6 sm:h-6 drop-shadow" />
              </m.button>
            </div>
          </div>

          {/* Navigation */}
          {isGalleryMode && (
            <div className="flex-1 flex items-center justify-between pointer-events-none px-2 sm:px-4 md:px-8">
              <m.button
                whileHover={{ scale: 1.1, x: -5 }}
                whileTap={{ scale: 0.95 }}
                onClick={(e) => {
                  e.stopPropagation();
                  prevImage();
                }}
                className="pointer-events-auto p-3 sm:p-4 bg-gradient-to-br from-white/20 to-white/5 hover:from-white/30 hover:to-white/10 rounded-3xl transition-all duration-300 border border-white/30 backdrop-blur-2xl shadow-2xl shadow-black/30"
                style={{
                  boxShadow:
                    "0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.2)",
                }}
                title="Anterior (←)"
              >
                <ChevronLeft
                  size={24}
                  className="sm:w-8 sm:h-8 drop-shadow-lg"
                />
              </m.button>
              <m.button
                whileHover={{ scale: 1.1, x: 5 }}
                whileTap={{ scale: 0.95 }}
                onClick={(e) => {
                  e.stopPropagation();
                  nextImage();
                }}
                className="pointer-events-auto p-3 sm:p-4 bg-gradient-to-br from-white/20 to-white/5 hover:from-white/30 hover:to-white/10 rounded-3xl transition-all duration-300 border border-white/30 backdrop-blur-2xl shadow-2xl shadow-black/30"
                style={{
                  boxShadow:
                    "0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.2)",
                }}
                title="Siguiente (→)"
              >
                <ChevronRight
                  size={24}
                  className="sm:w-8 sm:h-8 drop-shadow-lg"
                />
              </m.button>
            </div>
          )}

          {/* Toolbar */}
          <div className="flex flex-col items-center gap-3 pointer-events-auto">
            {isGalleryMode && (
              <m.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="flex items-center gap-1.5 sm:gap-2 bg-gradient-to-br from-white/15 to-white/5 backdrop-blur-2xl border border-white/30 rounded-3xl p-2.5 sm:p-3 max-w-[calc(100vw-2rem)] sm:max-w-full overflow-x-auto no-scrollbar shadow-2xl shadow-black/30"
                style={{
                  boxShadow:
                    "0 12px 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.2)",
                }}
              >
                {imageList.map((img, idx) => (
                  <m.button
                    key={img}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentIndex(idx);
                    }}
                    className={cn(
                      "relative w-10 h-10 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-2xl overflow-hidden shrink-0 transition-all duration-300",
                      "ring-2 ring-offset-2 ring-offset-transparent backdrop-blur-sm",
                      currentIndex === idx
                        ? "ring-cyan-400/80 scale-110 shadow-2xl shadow-cyan-500/60"
                        : "ring-white/30 hover:ring-white/70 opacity-60 hover:opacity-100",
                    )}
                    style={
                      currentIndex === idx
                        ? {
                            boxShadow:
                              "0 0 30px rgba(34,211,238,0.6), inset 0 0 20px rgba(34,211,238,0.2)",
                          }
                        : {}
                    }
                  >
                    <img
                      src={img}
                      alt={`Thumbnail ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                    {currentIndex === idx && (
                      <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/20 to-blue-500/20 pointer-events-none" />
                    )}
                  </m.button>
                ))}
              </m.div>
            )}

            <m.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex items-center gap-1 sm:gap-1.5 bg-gradient-to-br from-white/15 to-white/5 backdrop-blur-2xl border border-white/30 rounded-3xl p-2.5 sm:p-3 md:p-3.5 shadow-2xl shadow-black/30 overflow-x-auto max-w-[calc(100vw-2rem)] sm:max-w-full"
              style={{
                boxShadow:
                  "0 12px 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.2)",
              }}
            >
              <ToolButton
                icon={ZoomOut}
                onClick={() => updateScale(scaleMv.get() - 0.25)}
                label="Alejar (Zoom Out)"
              />
              <div className="px-2 sm:px-3 md:px-4 min-w-[50px] sm:min-w-[60px] text-center">
                <div className="font-mono text-xs sm:text-sm md:text-base font-bold text-white bg-gradient-to-br from-cyan-500/40 to-blue-600/30 px-3 py-1.5 rounded-2xl border border-cyan-400/40 backdrop-blur-xl shadow-lg">
                  {Math.round(scaleDisplay * 100)}%
                </div>
              </div>
              <ToolButton
                icon={ZoomIn}
                onClick={() => updateScale(scaleMv.get() + 0.25)}
                label="Acercar (Zoom In)"
              />
              <div className="w-px h-6 sm:h-7 md:h-8 bg-gradient-to-b from-transparent via-white/40 to-transparent mx-1 sm:mx-2" />
              <ToolButton
                icon={RotateCw}
                onClick={() => rotateMv.set(rotateMv.get() + 90)}
                label="Rotar 90°"
              />
              <ToolButton
                icon={RotateCcw}
                onClick={resetView}
                label="Restablecer Vista"
              />
              <ToolButton
                icon={isFullscreen ? Minimize2 : Maximize2}
                onClick={toggleFullscreen}
                label={
                  isFullscreen ? "Salir Pantalla Completa" : "Pantalla Completa"
                }
              />
              {showDownload && (
                <>
                  <div className="w-px h-6 sm:h-7 md:h-8 bg-gradient-to-b from-transparent via-white/40 to-transparent mx-1 sm:mx-2" />
                  <ToolButton
                    icon={Download}
                    onClick={handleDownload}
                    label="Descargar Imagen"
                  />
                </>
              )}
            </m.div>
          </div>
        </div>

        {/* Image Container */}
        <div
          ref={combinedContainerRef}
          role="button"
          tabIndex={0}
          aria-label="Image viewer"
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              handleDoubleTap(e);
            }
          }}
          className="absolute inset-0 flex items-center justify-center px-2 py-4 pb-32 sm:px-6 sm:pb-36 md:p-12 md:pb-40 pointer-events-auto select-none touch-none cursor-grab active:cursor-grabbing"
          style={{
            paddingBottom:
              "max(8rem, calc(8rem + env(safe-area-inset-bottom)))",
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onDoubleClick={handleDoubleTap}
        >
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <Loader2 size={48} className="animate-spin text-white/30" />
            </div>
          )}

          {/* Zoom Indicator */}
          {!loading && scaleDisplay > 1.01 && (
            <m.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-20 left-1/2 -translate-x-1/2 pointer-events-none z-20"
            >
              <div
                className="bg-gradient-to-br from-cyan-500/90 to-blue-600/80 backdrop-blur-2xl px-5 py-2.5 rounded-3xl border border-cyan-300/60 shadow-2xl"
                style={{
                  boxShadow:
                    "0 8px 32px rgba(6,182,212,0.5), inset 0 1px 0 rgba(255,255,255,0.3)",
                }}
              >
                <p className="text-white text-xs sm:text-sm font-semibold flex items-center gap-2 drop-shadow-lg">
                  <ZoomIn size={16} />
                  Zoom activo - Arrastra para mover
                </p>
              </div>
            </m.div>
          )}

          {imageList[currentIndex] || src ? (
            <m.img
              key={currentIndex} // Fuerza recreación al cambiar de imagen
              ref={imageRef}
              src={imageList[currentIndex] || src}
              alt={alt}
              initial={{
                opacity: 0,
                scale: 0.9,
                filter: "blur(10px)",
              }}
              animate={{
                opacity: loading ? 0 : 1,
                scale: 1,
                filter: "blur(0px)",
              }}
              exit={{
                opacity: 0,
                scale: 0.95,
                filter: "blur(8px)",
              }}
              transition={{
                duration: 0.4,
                ease: [0.25, 0.1, 0.25, 1], // Cubic bezier para suavidad
              }}
              style={{
                scale: scaleMv,
                rotate: rotateMv,
                x: xMv,
                y: yMv,
                boxShadow:
                  "0 25px 80px rgba(0,0,0,0.5), 0 10px 40px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.1)",
              }}
              className="max-w-full max-h-full object-contain rounded-2xl transition-opacity duration-300"
              draggable={false}
              onLoad={() => setLoading(false)}
              onError={() => setLoading(false)}
            />
          ) : (
            !loading && (
              <div className="text-white/50 flex flex-col items-center gap-2">
                <Maximize2 size={48} className="opacity-50" />
                <p>No Image Available</p>
              </div>
            )
          )}
        </div>
      </m.div>
    </AnimatePresence>,
    document.body,
  );
}

function ToolButton({ icon: Icon, onClick, label, className }) {
  return (
    <m.button
      whileHover={{ scale: 1.15, y: -2 }}
      whileTap={{ scale: 0.9 }}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={cn(
        "p-2 sm:p-2.5 md:p-3 rounded-2xl transition-all duration-300 group relative",
        "text-white/90 hover:text-white hover:bg-gradient-to-br hover:from-cyan-500/50 hover:to-blue-600/40",
        "hover:shadow-xl hover:shadow-cyan-500/30",
        className,
      )}
      title={label}
    >
      <Icon
        size={18}
        className="sm:w-5 sm:h-5 md:w-6 md:h-6 transition-transform group-hover:scale-110 drop-shadow-lg"
      />
      {/* Efecto de brillo en hover */}
      <m.div
        className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.3)",
        }}
      />
    </m.button>
  );
}

export default ImageViewerModal;
