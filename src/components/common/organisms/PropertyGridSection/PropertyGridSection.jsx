import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { m } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { resourcesService } from "../../../../services/resourcesService";
import PropertyCard from "../../molecules/PropertyCard";
import Button from "../../atoms/Button";

/**
 * Generic property grid section with title, subtitle, and filters.
 *
 * Data fetching is deferred until the section is within 400px of the viewport,
 * so below-the-fold sections on the Home page don't fire API calls or trigger
 * image downloads until the user scrolls near them.
 *
 * @param {Object} props
 * @param {string} props.title - Section title
 * @param {string} props.subtitle - Section subtitle
 * @param {string} props.badge - Optional badge text
 * @param {Object} props.filters - Filters to apply (propertyType, amenities, etc.)
 * @param {string} props.viewAllLink - Link for "View All" button
 * @param {number} props.limit - Number of properties to show (default 3)
 * @param {string} props.bgClass - Background class (default: "bg-white dark:bg-slate-900/30")
 * @param {boolean} props.eager - Skip lazy loading, fetch immediately (default: false)
 */
const EMPTY_OBJECT = {};
const PropertyGridSection = ({
  title,
  subtitle,
  badge,
  filters = EMPTY_OBJECT,
  viewAllLink,
  limit = 3,
  bgClass = "bg-white dark:bg-slate-900/30",
  eager = false,
}) => {
  const { t } = useTranslation();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isNearViewport, setIsNearViewport] = useState(eager);
  const sectionRef = useRef(null);

  // ─── Viewport proximity detection ──────────────────────────────────────────
  // Observe the section wrapper. Once it enters a 400px margin from the
  // viewport, flip `isNearViewport` and disconnect — data will start fetching.
  useEffect(() => {
    if (eager || isNearViewport) return;

    const el = sectionRef.current;
    if (!el) {
      setIsNearViewport(true); // safety fallback
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsNearViewport(true);
          observer.disconnect();
        }
      },
      { rootMargin: "400px 0px", threshold: 0 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [eager, isNearViewport]);

  // ─── Fetch data only when the section is near the viewport ─────────────────
  useEffect(() => {
    if (!isNearViewport) return;

    resourcesService
      .listPublic({
        limit,
        filters: { ...filters, sort: filters.sort || "recent" },
      })
      .then((res) => {
        setProperties(res.documents || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isNearViewport, limit, JSON.stringify(filters)]);

  if (!loading && properties.length === 0) return null;

  return (
    <section ref={sectionRef} className={`py-16 ${bgClass}`}>
      <div className="container mx-auto px-4 md:px-6 lg:px-8">
        <div className="mb-10 flex flex-col items-center justify-between gap-4 md:flex-row md:items-end">
          <div className="max-w-xl">
            {badge && (
              <span className="mb-2 block text-sm font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400">
                {badge}
              </span>
            )}
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white sm:text-4xl">
              {title}
            </h2>
            {subtitle && (
              <p className="mt-4 text-lg text-slate-600 dark:text-slate-300">
                {subtitle}
              </p>
            )}
          </div>
          {viewAllLink && (
            <Link to={viewAllLink}>
              <Button variant="outline" rightIcon={ArrowRight}>
                {t("client:common.viewAll", "Ver todas")}
              </Button>
            </Link>
          )}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: limit }).map((_, i) => (
              <div
                key={i}
                className="h-[400px] animate-pulse rounded-3xl bg-slate-200 dark:bg-slate-800"
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {properties.map((property, index) => (
              <m.div
                key={property.$id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <PropertyCard property={property} />
              </m.div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default PropertyGridSection;
