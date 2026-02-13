import React, { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useTransform,
} from "motion/react";
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
export function ImageViewerModal({
  isOpen,
  onClose,
  src,
  images = [],
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
      const isDragging = stateRef.current.isDragging;
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
      <motion.div
        key="image-viewer-root"
        className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden touch-none w-screen h-[100dvh]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
      >
        <div
          className="absolute inset-0 bg-gradient-to-br from-slate-900/95 via-slate-800/90 to-cyan-900/85 backdrop-blur-3xl"
          onClick={handleClose}
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
              <div className="bg-white/10 backdrop-blur-xl px-4 py-2 rounded-2xl text-sm font-semibold border border-white/20 shadow-xl">
                <span className="text-white">{currentIndex + 1}</span>
                <span className="text-white/60 mx-1">/</span>
                <span className="text-white/80">{imageList.length}</span>
              </div>
            )}
            {!isGalleryMode && <div />}

            <div className="flex items-center gap-2">
              {scaleDisplay > 1.01 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    resetView();
                  }}
                  className="px-3 py-2 sm:px-5 sm:py-2.5 bg-cyan-500/90 hover:bg-cyan-600 rounded-2xl transition-all duration-200 border border-cyan-400/30 text-xs sm:text-sm font-bold backdrop-blur-xl flex items-center gap-2 shadow-lg hover:shadow-cyan-500/50 hover:scale-105 active:scale-95"
                >
                  <RotateCcw size={16} className="sm:w-[18px] sm:h-[18px]" />
                  <span>Restablecer Vista</span>
                </button>
              )}
              <button
                onClick={handleClose}
                className="p-2 sm:p-3 bg-white/10 hover:bg-red-500/80 rounded-2xl transition-all duration-200 border border-white/20 hover:border-red-400/50 shadow-lg hover:scale-105 active:scale-95"
                title="Cerrar (ESC)"
              >
                <X size={20} className="sm:w-6 sm:h-6" />
              </button>
            </div>
          </div>

          {/* Navigation */}
          {isGalleryMode && (
            <div className="flex-1 flex items-center justify-between pointer-events-none px-2 sm:px-4 md:px-8">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  prevImage();
                }}
                className="pointer-events-auto p-3 sm:p-4 bg-white/10 hover:bg-white/20 rounded-2xl transition-all duration-200 border border-white/20 backdrop-blur-xl shadow-xl hover:scale-110 active:scale-95"
                title="Anterior (←)"
              >
                <ChevronLeft size={24} className="sm:w-8 sm:h-8" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  nextImage();
                }}
                className="pointer-events-auto p-3 sm:p-4 bg-white/10 hover:bg-white/20 rounded-2xl transition-all duration-200 border border-white/20 backdrop-blur-xl shadow-xl hover:scale-110 active:scale-95"
                title="Siguiente (→)"
              >
                <ChevronRight size={24} className="sm:w-8 sm:h-8" />
              </button>
            </div>
          )}          

          {/* Toolbar */}
          <div className="flex flex-col items-center gap-3 pointer-events-auto">
            {isGalleryMode && (
              <div className="flex items-center gap-1.5 sm:gap-2 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-2 sm:p-2.5 max-w-[calc(100vw-2rem)] sm:max-w-full overflow-x-auto no-scrollbar shadow-2xl">
                {imageList.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentIndex(idx);
                    }}
                    className={cn(
                      "relative w-10 h-10 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-xl overflow-hidden shrink-0 transition-all duration-200",
                      "ring-2 ring-offset-2 ring-offset-transparent",
                      currentIndex === idx
                        ? "ring-cyan-400 scale-110 shadow-xl shadow-cyan-500/50"
                        : "ring-white/20 hover:ring-white/60 opacity-70 hover:opacity-100 hover:scale-105",
                    )}
                  >
                    <img
                      src={img}
                      alt={`Thumbnail ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}

            <div className="flex items-center gap-1 sm:gap-1.5 bg-white/10 backdrop-blur-2xl border border-white/20 rounded-3xl p-2 sm:p-2.5 md:p-3 shadow-2xl overflow-x-auto max-w-[calc(100vw-2rem)] sm:max-w-full">
              <ToolButton
                icon={ZoomOut}
                onClick={() => updateScale(scaleMv.get() - 0.25)}
                label="Alejar (Zoom Out)"
              />
              <div className="px-2 sm:px-3 md:px-4 min-w-[50px] sm:min-w-[60px] text-center">
                <div className="font-mono text-xs sm:text-sm md:text-base font-bold text-white bg-cyan-500/30 px-2 py-1 rounded-xl border border-cyan-400/30">
                  {Math.round(scaleDisplay * 100)}%
                </div>
              </div>
              <ToolButton
                icon={ZoomIn}
                onClick={() => updateScale(scaleMv.get() + 0.25)}
                label="Acercar (Zoom In)"
              />
              <div className="w-px h-6 sm:h-7 md:h-8 bg-white/20 mx-1 sm:mx-2" />
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
                label={isFullscreen ? "Salir Pantalla Completa" : "Pantalla Completa"}
              />
              {showDownload && (
                <>
                  <div className="w-px h-6 sm:h-7 md:h-8 bg-white/20 mx-1 sm:mx-2" />
                  <ToolButton
                    icon={Download}
                    onClick={handleDownload}
                    label="Descargar Imagen"
                  />
                </>
              )}
            </div>
          </div>
        </div>

        {/* Image Container */}
        <div
          ref={combinedContainerRef}
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
            <div className="absolute top-20 left-1/2 -translate-x-1/2 pointer-events-none z-20">
              <div className="bg-cyan-500/90 backdrop-blur-xl px-4 py-2 rounded-2xl border border-cyan-400/50 shadow-xl">
                <p className="text-white text-xs sm:text-sm font-semibold flex items-center gap-2">
                  <ZoomIn size={16} />
                  Zoom activo - Arrastra para mover
                </p>
              </div>
            </div>
          )}

          {imageList[currentIndex] || src ? (
            <motion.img
              ref={imageRef}
              src={imageList[currentIndex] || src}
              alt={alt}
              style={{
                scale: scaleMv,
                rotate: rotateMv,
                x: xMv,
                y: yMv,
                opacity: loading ? 0 : 1,
              }}
              className="max-w-full max-h-full object-contain shadow-2xl rounded-sm transition-opacity duration-300"
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
      </motion.div>
    </AnimatePresence>,
    document.body,
  );
}

function ToolButton({ icon: Icon, onClick, label, className }) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={cn(
        "p-2 sm:p-2.5 md:p-3 rounded-2xl transition-all duration-200 group",
        "text-white/80 hover:text-white hover:bg-cyan-500/50 active:bg-cyan-600/60",
        "hover:scale-110 active:scale-95 hover:shadow-lg",
        className,
      )}
      title={label}
    >
      <Icon
        size={18}
        className="sm:w-5 sm:h-5 md:w-6 md:h-6 transition-transform group-hover:scale-110"
      />
    </button>
  );
}

export default ImageViewerModal;
