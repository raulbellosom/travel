import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { motion } from "motion/react";
import Button from "../../atoms/Button";
import ListingCard from "../ListingCard";
import Spinner from "../../atoms/Spinner";
import { propertiesService } from "../../../../services/propertiesService";
import { storage } from "../../../../api/appwriteClient";
import env from "../../../../env";
import { getErrorMessage } from "../../../../utils/errors";
import { getPublicPropertyRoute } from "../../../../utils/internalRoutes";

/**
 * PropertyShowcaseSection - Featured properties grid display
 * Mobile-first responsive design
 */
const PropertyShowcaseSection = ({ className = "", limit = 6 }) => {
  const { t, i18n } = useTranslation();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError("");

    propertiesService
      .listPublic({
        page: 1,
        limit,
        filters: { sort: "recent" },
      })
      .then((response) => {
        if (!mounted) return;
        setProperties(response.documents || []);
      })
      .catch((err) => {
        if (!mounted) return;
        setError(
          getErrorMessage(err, t("landing.propertyShowcase.errorLoading")),
        );
      })
      .finally(() => {
        if (!mounted) return;
        setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [limit, t]);

  const handleCardClick = (property) => {
    // Navigation handled by Link in ListingCard
  };

  return (
    <section
      className={`bg-white py-16 dark:bg-slate-950 sm:py-20 lg:py-24 ${className}`}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-12 flex flex-col items-center justify-between gap-4 sm:flex-row lg:mb-16"
        >
          <div>
            <h2 className="mb-2 text-3xl font-extrabold text-slate-900 dark:text-white sm:text-4xl lg:text-5xl">
              {t("landing.propertyShowcase.sectionTitle")}
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-300">
              {t("landing.propertyShowcase.sectionSubtitle")}
            </p>
          </div>
          <Link to="/">
            <Button variant="outline" rightIcon={ArrowRight}>
              {t("landing.propertyShowcase.viewAll")}
            </Button>
          </Link>
        </motion.div>

        {/* Loading State */}
        {loading && (
          <div className="flex min-h-[400px] items-center justify-center">
            <div className="text-center">
              <Spinner size="lg" />
              <p className="mt-4 text-slate-600 dark:text-slate-300">
                {t("landing.propertyShowcase.loading")}
              </p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="flex min-h-[400px] items-center justify-center">
            <div className="text-center">
              <p className="text-red-600 dark:text-red-400">{error}</p>
            </div>
          </div>
        )}

        {/* Properties Grid */}
        {!loading && !error && properties.length > 0 && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8">
            {properties.map((property, index) => {
              // Build images array from galleryImageIds - using regular function, not useMemo
              const propertyImages =
                property.galleryImageIds &&
                property.galleryImageIds.length > 0 &&
                env.appwrite.buckets.propertyImages
                  ? property.galleryImageIds.map((fileId) =>
                      storage.getFileView({
                        bucketId: env.appwrite.buckets.propertyImages,
                        fileId,
                      }),
                    )
                  : [];

              return (
                <motion.div
                  key={property.$id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <Link
                    to={getPublicPropertyRoute(
                      property.slug,
                      i18n.resolvedLanguage || i18n.language,
                    )}
                    className="block h-full"
                  >
                    <ListingCard
                      listing={{
                        ...property,
                        images: propertyImages,
                        location: `${property.city}, ${property.state}`,
                      }}
                      onCardClick={handleCardClick}
                      className="h-full transition hover:shadow-xl"
                    />
                  </Link>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && properties.length === 0 && (
          <div className="flex min-h-[400px] items-center justify-center">
            <div className="text-center">
              <p className="text-lg text-slate-600 dark:text-slate-300">
                {t("landing.propertyShowcase.noProperties")}
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default PropertyShowcaseSection;
