import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { ArrowRight, Star } from "lucide-react";
import { resourcesService } from "../../../../services/resourcesService";
import PropertyCard from "../../molecules/PropertyCard";
import Button from "../../atoms/Button";

const FeaturedPropertiesSection = () => {
  const { t } = useTranslation();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    resourcesService
      .listPublic({
        limit: 3,
        filters: { featured: true, sort: "recent" },
      })
      .then((res) => {
        setProperties(res.documents || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (!loading && properties.length === 0) return null;

  return (
    <section className="bg-slate-50 py-16 dark:bg-slate-900/50">
      <div className="container mx-auto px-4 md:px-6 lg:px-8">
        <div className="mb-10 flex flex-col items-center justify-between gap-4 md:flex-row md:items-end">
          <div className="max-w-xl">
            <span className="mb-2 block text-sm font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400">
              {t("client:featured.badge", "Exclusivo")}
            </span>
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white sm:text-4xl">
              {t("client:featured.title", "Propiedades Destacadas")}
            </h2>
            <p className="mt-4 text-lg text-slate-600 dark:text-slate-300">
              {t(
                "client:featured.subtitle",
                "Una selección curada de las mejores propiedades disponibles para ti.",
              )}
            </p>
          </div>
          <Link to="/buscar?featured=true&sort=recent">
            <Button variant="outline" rightIcon={ArrowRight}>
              {t("client:featured.viewAll", "Ver todas")}
            </Button>
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
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

export default FeaturedPropertiesSection;
