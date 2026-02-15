import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * ScrollToTop Component
 *
 * Automatically scrolls to the top of the page when navigating to a new route.
 * This component should be placed inside BrowserRouter but outside Routes.
 *
 * Exceptions:
 * - Hash navigation (e.g., #section-id) is preserved for in-page navigation
 * - Can be extended to support state-based scroll position restoration
 */
const ScrollToTop = () => {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    // If there's a hash in the URL, let the browser handle scroll to that element
    if (hash) {
      // Small delay to ensure the element is rendered
      setTimeout(() => {
        const element = document.querySelector(hash);
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 100);
      return;
    }

    // Otherwise, scroll to top on route change
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "instant", // Use "instant" for immediate scroll, "smooth" for animated
    });
  }, [pathname, hash]);

  return null;
};

export default ScrollToTop;
