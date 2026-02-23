import { useEffect, useLayoutEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * ScrollToTop Component
 *
 * Automatically scrolls to the top of the page when navigating to a new route.
 * This component should be placed inside BrowserRouter but outside Routes.
 *
 * Uses useLayoutEffect so the scroll happens synchronously before the browser
 * paints — this prevents the brief "flash" of the previous scroll position
 * that occurs when navigating back (navigate(-1)).
 *
 * Exceptions:
 * - Hash navigation (e.g., #section-id) is preserved for in-page navigation
 */

// Disable the browser's native scroll restoration so it doesn't fight with us.
if (typeof window !== "undefined" && "scrollRestoration" in window.history) {
  window.history.scrollRestoration = "manual";
}

const ScrollToTop = () => {
  const { pathname, hash } = useLocation();

  // useLayoutEffect fires synchronously after DOM mutations but before paint,
  // so the page never visually "flashes" at its stored scroll position.
  useLayoutEffect(() => {
    if (hash) return; // hash links handled below
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [pathname, hash]);

  // Hash navigation: wait for element to render, then scroll into view.
  useEffect(() => {
    if (!hash) return;
    const id = hash.slice(1); // strip leading #
    const el = document.getElementById(id) ?? document.querySelector(hash);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    // Element not yet in DOM — retry once after a short delay.
    const timer = setTimeout(() => {
      const delayed =
        document.getElementById(id) ?? document.querySelector(hash);
      delayed?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 120);
    return () => clearTimeout(timer);
  }, [pathname, hash]);

  return null;
};

export default ScrollToTop;
