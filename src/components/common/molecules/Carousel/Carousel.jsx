import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { IconButton } from "../../atoms";

/**
 * Carousel component for image galleries.
 * Perfect for property listings, product galleries, etc.
 * Features:
 * - Touch/swipe support
 * - Keyboard navigation
 * - Auto-play option
 * - Dot indicators
 * - Responsive design
 */
const Carousel = ({
  images = [],
  autoPlay = false,
  autoPlayInterval = 3000,
  showDots = true,
  showArrows = true,
  aspectRatio = "16/9", // "16/9", "4/3", "1/1", "3/2"
  className = "",
  onImageClick,
  ...props
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(autoPlay);
  const intervalRef = useRef(null);
  const carouselRef = useRef(null);

  // Auto-play functionality
  useEffect(() => {
    if (isAutoPlaying && images.length > 1) {
      intervalRef.current = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % images.length);
      }, autoPlayInterval);
    } else {
      clearInterval(intervalRef.current);
    }

    return () => clearInterval(intervalRef.current);
  }, [isAutoPlaying, images.length, autoPlayInterval]);

  // Stop auto-play on user interaction
  const handleUserInteraction = () => {
    setIsAutoPlaying(false);
  };

  // Navigation functions
  const goToNext = () => {
    handleUserInteraction();
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const goToPrevious = () => {
    handleUserInteraction();
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const goToSlide = (index) => {
    handleUserInteraction();
    setCurrentIndex(index);
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
        case "Enter":
          e.preventDefault();
          onImageClick?.(images[currentIndex], currentIndex);
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [currentIndex, images]);

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
        className={`relative bg-gray-200 dark:bg-gray-800 rounded-lg flex items-center justify-center ${className}`}
      >
        <span className="text-gray-500 dark:text-gray-400">
          No images available
        </span>
      </div>
    );
  }

  const aspectRatioClasses = {
    "16/9": "aspect-video",
    "4/3": "aspect-[4/3]",
    "1/1": "aspect-square",
    "3/2": "aspect-[3/2]",
  };

  // Filter out custom props that shouldn't be passed to DOM
  const {
    images: _images,
    autoPlay: _autoPlay,
    autoPlayInterval: _autoPlayInterval,
    showDots: _showDots,
    showArrows: _showArrows,
    showThumbnails: _showThumbnails,
    showCounter: _showCounter,
    aspectRatio: _aspectRatio,
    onImageClick: _onImageClick,
    onImageChange: _onImageChange,
    className: _className,
    ...domProps
  } = props;

  return (
    <div
      ref={carouselRef}
      className={`relative group overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800 ${aspectRatioClasses[aspectRatio]} ${className}`}
      tabIndex={0}
      role="region"
      aria-label="Image carousel"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      {...domProps}
    >
      {/* Main image container */}
      <div className="relative w-full h-full">
        <AnimatePresence mode="wait">
          <motion.img
            key={currentIndex}
            src={images[currentIndex]}
            alt={`Slide ${currentIndex + 1}`}
            className="absolute inset-0 w-full h-full object-cover cursor-pointer"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={() => onImageClick?.(images[currentIndex], currentIndex)}
            loading="lazy"
          />
        </AnimatePresence>

        {/* Loading state overlay */}
        <div className="absolute inset-0 bg-gray-200 dark:bg-gray-700 animate-pulse" />
      </div>

      {/* Navigation arrows - always visible for better UX */}
      {showArrows && images.length > 1 && (
        <>
          <div className="absolute left-2 top-1/2 -translate-y-1/2 transition-opacity duration-200">
            <IconButton
              icon={ChevronLeft}
              variant="secondary"
              size="sm"
              onClick={goToPrevious}
              className="bg-white/90 hover:bg-white shadow-lg backdrop-blur-sm border border-gray-200"
              aria-label="Previous image"
            />
          </div>
          <div className="absolute right-2 top-1/2 -translate-y-1/2 transition-opacity duration-200">
            <IconButton
              icon={ChevronRight}
              variant="secondary"
              size="sm"
              onClick={goToNext}
              className="bg-white/90 hover:bg-white shadow-lg backdrop-blur-sm border border-gray-200"
              aria-label="Next image"
            />
          </div>
        </>
      )}

      {/* Dot indicators - max 5 dots, aligned to bottom right */}
      {showDots && images.length > 1 && (
        <div className="absolute bottom-3 right-3 flex gap-1.5">
          {(() => {
            const totalImages = images.length;
            const maxDots = Math.min(5, totalImages);

            if (totalImages <= 5) {
              // Show all dots if 5 or fewer images
              return images.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToSlide(index)}
                  className={`w-2 h-2 rounded-full transition-all duration-200 ${
                    index === currentIndex
                      ? "bg-white shadow-lg scale-125"
                      : "bg-white/60 hover:bg-white/80"
                  }`}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ));
            } else {
              // Show smart dots for more than 5 images
              const dotsToShow = [];
              const half = Math.floor(maxDots / 2);

              let start = Math.max(0, currentIndex - half);
              let end = Math.min(totalImages - 1, start + maxDots - 1);

              // Adjust start if we're near the end
              if (end - start < maxDots - 1) {
                start = Math.max(0, end - maxDots + 1);
              }

              for (let i = start; i <= end; i++) {
                dotsToShow.push(
                  <button
                    key={i}
                    onClick={() => goToSlide(i)}
                    className={`w-2 h-2 rounded-full transition-all duration-200 ${
                      i === currentIndex
                        ? "bg-white shadow-lg scale-125"
                        : "bg-white/60 hover:bg-white/80"
                    }`}
                    aria-label={`Go to slide ${i + 1}`}
                  />
                );
              }

              return dotsToShow;
            }
          })()}
        </div>
      )}

      {/* Image counter */}
      {images.length > 1 && (
        <div className="absolute top-3 right-3 bg-black/50 text-white text-xs px-2 py-1 rounded-full backdrop-blur-sm">
          {currentIndex + 1} / {images.length}
        </div>
      )}
    </div>
  );
};

export default Carousel;
