import { useRef, useCallback } from "react";

/**
 * Lightweight touch-swipe hook for carousels.
 * Returns handlers to spread on the carousel container.
 *
 * @param {Object} opts
 * @param {() => void} opts.onSwipeLeft  — advance (next)
 * @param {() => void} opts.onSwipeRight — go back  (prev)
 * @param {number}     [opts.threshold=50] — min px to count as swipe
 * @returns {{ onTouchStart, onTouchMove, onTouchEnd }}
 */
export const useSwipeCarousel = ({
  onSwipeLeft,
  onSwipeRight,
  threshold = 50,
} = {}) => {
  const startX = useRef(0);
  const startY = useRef(0);
  const tracking = useRef(false);

  const onTouchStart = useCallback((e) => {
    const t = e.touches[0];
    startX.current = t.clientX;
    startY.current = t.clientY;
    tracking.current = true;
  }, []);

  const onTouchMove = useCallback(() => {
    // intentionally blank – we only care about start/end
  }, []);

  const onTouchEnd = useCallback(
    (e) => {
      if (!tracking.current) return;
      tracking.current = false;
      const endX = e.changedTouches[0].clientX;
      const endY = e.changedTouches[0].clientY;
      const dx = endX - startX.current;
      const dy = endY - startY.current;

      // Only trigger if horizontal movement dominates
      if (Math.abs(dx) < threshold || Math.abs(dy) > Math.abs(dx)) return;

      if (dx < 0) onSwipeLeft?.();
      else onSwipeRight?.();
    },
    [onSwipeLeft, onSwipeRight, threshold],
  );

  return { onTouchStart, onTouchMove, onTouchEnd };
};
