import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import {
  Home,
  Building,
  Armchair,
  Briefcase,
  Warehouse,
  MapPin,
} from "lucide-react";

const CategoriesSection = () => {
  const { t } = useTranslation();

  const categories = [
    {
      id: "house",
      label: t("client:common.enums.propertyType.house", "Casas"),
      icon: Home,
      color: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
      link: "/buscar?propertyType=house",
    },
    {
      id: "apartment",
      label: t("client:common.enums.propertyType.apartment", "Departamentos"),
      icon: Building,
      color:
        "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400",
      link: "/buscar?propertyType=apartment",
    },
    {
      id: "land",
      label: t("client:common.enums.propertyType.land", "Terrenos"),
      icon: MapPin, // Using MapPin as placeholder for Land/Location
      color:
        "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400",
      link: "/buscar?propertyType=land",
    },
    {
      id: "commercial",
      label: t("client:common.enums.propertyType.commercial", "Comercial"),
      icon: Briefcase,
      color:
        "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400",
      link: "/buscar?propertyType=commercial",
    },
  ];

  return (
    <section className="py-16">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white sm:text-4xl">
            {t("client:categories.title", "Explora por Categoría")}
          </h2>
          <p className="mt-4 text-lg text-slate-600 dark:text-slate-300">
            {t(
              "client:categories.subtitle",
              "Encuentra el tipo de propiedad que se adapta a tu estilo de vida.",
            )}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:gap-8">
          {categories.map((cat, index) => {
            const Icon = cat.icon;
            return (
              <Link to={cat.link} key={cat.id} className="group">
                <motion.div
                  whileHover={{ y: -5 }}
                  className="flex flex-col items-center justify-center rounded-3xl border border-slate-100 bg-white p-6 shadow-sm transition-shadow hover:shadow-xl dark:border-slate-800 dark:bg-slate-900 sm:p-8"
                >
                  <div
                    className={`mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl text-3xl transition-transform group-hover:scale-110 ${cat.color}`}
                  >
                    <Icon size={32} />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    {cat.label}
                  </h3>
                  <p className="mt-1 text-xs font-semibold text-cyan-600 opacity-0 transition-opacity group-hover:opacity-100 dark:text-cyan-400">
                    {t("categories.view", "Ver propiedades")} &rarr;
                  </p>
                </motion.div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default CategoriesSection;
