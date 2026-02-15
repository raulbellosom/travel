import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { propertiesService } from "../../../../services/propertiesService";
import PropertyCard from "../../molecules/PropertyCard";
import Button from "../../atoms/Button";

/**
 * Generic property grid section with title, subtitle, and filters
 * @param {Object} props
 * @param {string} props.title - Section title
 * @param {string} props.subtitle - Section subtitle
 * @param {string} props.badge - Optional badge text
 * @param {Object} props.filters - Filters to apply (propertyType, amenities, etc.)
 * @param {string} props.viewAllLink - Link for "View All" button
 * @param {number} props.limit - Number of properties to show (default 3)
 * @param {string} props.bgClass - Background class (default: "bg-white dark:bg-slate-900/30")
 */
const PropertyGridSection = ({
  title,
  subtitle,
  badge,
  filters = {},
  viewAllLink,
  limit = 3,
  bgClass = "bg-white dark:bg-slate-900/30",
}) => {
  const { t } = useTranslation();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    propertiesService
      .listPublic({
        limit,
        filters: { ...filters, sort: filters.sort || "recent" },
      })
      .then((res) => {
        setProperties(res.documents || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [limit, JSON.stringify(filters)]);

  if (!loading && properties.length === 0) return null;

  return (
    <section className={`py-16 ${bgClass}`}>
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
              <motion.div
                key={property.$id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <PropertyCard property={property} />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default PropertyGridSection;
