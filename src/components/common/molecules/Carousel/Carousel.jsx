import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Play, Pause } from "lucide-react";
import { IconButton } from "../../atoms";

/**
 * Carousel component for image galleries with slide transitions.
 * Perfect for property listings, product galleries, etc.
 * Features:
 * - Smooth slide transitions (no fade effects)
 * - Touch/swipe support
 * - Keyboard navigation
 * - Auto-play with manual controls
 * - Multiple display variants
 * - Responsive design
 * - Better integrated controls
 * - Support for custom overlay content (badges, buttons, etc.)
 */
const Carousel = ({
  images = [],
  autoPlay = false,
  autoPlayInterval = 3000,
  showDots = true,
  showArrows = true,
  showCounter = true,
  showPlayPause = false,
  variant = "default", // "default", "minimal", "compact", "listing"
  aspectRatio = "16/9", // "16/9", "4/3", "1/1", "3/2"
  className = "",
  onImageClick,
  onImageChange,
  children,
  ...props
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(autoPlay);
  const [direction, setDirection] = useState(0); // 1 for next, -1 for previous
  const intervalRef = useRef(null);
  const carouselRef = useRef(null);

  // Auto-play functionality
  useEffect(() => {
    if (isAutoPlaying && images.length > 1) {
      intervalRef.current = setInterval(() => {
        setDirection(1);
        setCurrentIndex((prev) => (prev + 1) % images.length);
      }, autoPlayInterval);
    } else {
      clearInterval(intervalRef.current);
    }

    return () => clearInterval(intervalRef.current);
  }, [isAutoPlaying, images.length, autoPlayInterval]);

  // Call onImageChange when index changes
  useEffect(() => {
    onImageChange?.(currentIndex, images[currentIndex]);
  }, [currentIndex, images, onImageChange]);

  // Stop auto-play on user interaction
  const handleUserInteraction = () => {
    if (autoPlay && !showPlayPause) {
      setIsAutoPlaying(false);
    }
  };

  // Navigation functions
  const goToNext = () => {
    handleUserInteraction();
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const goToPrevious = () => {
    handleUserInteraction();
    setDirection(-1);
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const goToSlide = (index) => {
    handleUserInteraction();
    setDirection(index > currentIndex ? 1 : -1);
    setCurrentIndex(index);
  };

  const toggleAutoPlay = () => {
    setIsAutoPlaying(!isAutoPlaying);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!carouselRef.current?.contains(document.activeElement)) return;

      switch (e.key) {
        case "ArrowLeft":
          e.preventDefault();
          goToPrevious();
          break;
        case "ArrowRight":
          e.preventDefault();
          goToNext();
          break;
        case " ":
          e.preventDefault();
          if (showPlayPause) {
            toggleAutoPlay();
          } else {
            onImageClick?.(images[currentIndex], currentIndex);
          }
          break;
        case "Enter":
          e.preventDefault();
          onImageClick?.(images[currentIndex], currentIndex);
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [currentIndex, images, showPlayPause, isAutoPlaying]);

  // Touch/swipe support
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);

  const handleTouchStart = (e) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) {
      goToNext();
    } else if (isRightSwipe) {
      goToPrevious();
    }
  };

  if (!images || images.length === 0) {
    return (
      <div
        className={`relative bg-black rounded-lg flex items-center justify-center ${className}`}
      >
        <span className="text-white/70">No images available</span>
      </div>
    );
  }

  const aspectRatioClasses = {
    "16/9": "aspect-video",
    "4/3": "aspect-[4/3]",
    "1/1": "aspect-square",
    "3/2": "aspect-[3/2]",
  };

  // Slide transition variants - Smooth overlapping transitions
  const slideVariants = {
    enter: (direction) => ({
      x: direction > 0 ? "100%" : "-100%",
      opacity: 1,
      zIndex: 1, // New image on top
    }),
    center: {
      x: 0,
      opacity: 1,
      zIndex: 1,
    },
    exit: (direction) => ({
      x: direction > 0 ? "-50%" : "50%", // Exit halfway instead of completely
      opacity: 0.3, // Slight fade for smooth transition
      zIndex: 0, // Old image goes behind
    }),
  };

  const slideTransition = {
    type: "tween",
    ease: "easeInOut",
    duration: 0.5, // Slightly longer for smoother transition
  };

  // Variant-specific styling
  const getVariantClasses = () => {
    switch (variant) {
      case "minimal":
        return "rounded-none";
      case "compact":
        return "rounded-lg";
      case "listing":
        return "rounded-lg shadow-sm";
      default:
        return "rounded-xl shadow-lg";
    }
  };

  const getControlsVisibility = () => {
    switch (variant) {
      case "minimal":
        return {
          showArrows: false,
          showDots: false,
          showCounter: false,
          showPlayPause: false,
        };
      case "compact":
        return {
          showArrows: showArrows && images.length > 1,
          showDots: false,
          showCounter: showCounter && images.length > 1,
          showPlayPause: false,
        };
      case "listing":
        return {
          showArrows: showArrows && images.length > 1,
          showDots: showDots && images.length > 1 && images.length <= 8,
          showCounter: showCounter && images.length > 1,
          showPlayPause: false,
        };
      default:
        return {
          showArrows: showArrows && images.length > 1,
          showDots: showDots && images.length > 1,
          showCounter: showCounter && images.length > 1,
          showPlayPause: showPlayPause && images.length > 1,
        };
    }
  };

  const controls = getControlsVisibility();

  // Filter out custom props that shouldn't be passed to DOM
  const {
    images: _images,
    autoPlay: _autoPlay,
    autoPlayInterval: _autoPlayInterval,
    showDots: _showDots,
    showArrows: _showArrows,
    showCounter: _showCounter,
    showPlayPause: _showPlayPause,
    variant: _variant,
    aspectRatio: _aspectRatio,
    onImageClick: _onImageClick,
    onImageChange: _onImageChange,
    className: _className,
    ...domProps
  } = props;

  return (
    <div
      ref={carouselRef}
      className={`relative group overflow-hidden bg-black ${
        // Changed from gray to black to prevent gray gaps
        aspectRatioClasses[aspectRatio]
      } ${getVariantClasses()} ${className}`}
      tabIndex={0}
      role="region"
      aria-label="Image carousel"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      {...domProps}
    >
      {/* Main image container with slide animation */}
      <div className="relative w-full h-full overflow-hidden">
        <AnimatePresence initial={false} custom={direction} mode="sync">
          <motion.img
            key={currentIndex}
            src={images[currentIndex]}
            alt={`Slide ${currentIndex + 1}`}
            className="absolute inset-0 w-full h-full object-cover cursor-pointer"
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={slideTransition}
            onClick={() => onImageClick?.(images[currentIndex], currentIndex)}
            loading="lazy"
            draggable={false}
          />
        </AnimatePresence>
      </div>

      {/* Navigation arrows */}
      {controls.showArrows && (
        <>
          <motion.div
            className="absolute left-3 top-1/2 -translate-y-1/2 z-10"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <button
              onClick={goToPrevious}
              className="flex items-center justify-center w-10 h-10 bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/20 rounded-full text-white transition-all duration-200 hover:shadow-lg"
              aria-label="Previous image"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          </motion.div>
          <motion.div
            className="absolute right-3 top-1/2 -translate-y-1/2 z-10"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <button
              onClick={goToNext}
              className="flex items-center justify-center w-10 h-10 bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/20 rounded-full text-white transition-all duration-200 hover:shadow-lg"
              aria-label="Next image"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </motion.div>
        </>
      )}

      {/* Dot indicators */}
      {controls.showDots && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10">
          <div className="flex gap-2 px-3 py-2 bg-black/20 backdrop-blur-md rounded-full border border-white/10">
            {images.map((_, index) => (
              <motion.button
                key={index}
                onClick={() => goToSlide(index)}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  index === currentIndex
                    ? "bg-white scale-125 shadow-lg"
                    : "bg-white/50 hover:bg-white/75"
                }`}
                whileHover={{ scale: index === currentIndex ? 1.25 : 1.1 }}
                whileTap={{ scale: 0.9 }}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </div>
      )}

      {/* Image counter with improved design */}
      {controls.showCounter && (
        <motion.div
          className="absolute top-4 right-4 z-10"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="px-3 py-1.5 bg-black/50 backdrop-blur-md text-white text-sm font-medium rounded-full border border-white/20 shadow-lg">
            <span className="font-semibold">{currentIndex + 1}</span>
            <span className="text-white/70 mx-1">/</span>
            <span className="text-white/90">{images.length}</span>
          </div>
        </motion.div>
      )}

      {/* Play/Pause button */}
      {controls.showPlayPause && (
        <motion.div
          className="absolute bottom-4 right-4 z-10"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <button
            onClick={toggleAutoPlay}
            className="flex items-center justify-center w-10 h-10 bg-black/50 hover:bg-black/60 backdrop-blur-md border border-white/20 rounded-full text-white transition-all duration-200 shadow-lg"
            aria-label={isAutoPlaying ? "Pause slideshow" : "Play slideshow"}
          >
            {isAutoPlaying ? (
              <Pause className="w-4 h-4" />
            ) : (
              <Play className="w-4 h-4 ml-0.5" />
            )}
          </button>
        </motion.div>
      )}

      {/* Custom overlay content */}
      {children}

      {/* Loading gradient overlay for better image loading UX */}
      <div className="absolute inset-0 bg-gradient-to-br from-black/20 to-black/40 animate-pulse -z-10" />
    </div>
  );
};

export default Carousel;
