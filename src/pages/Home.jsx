import React, { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { SearchX, Loader2 } from "lucide-react";

import env from "../env";
import { propertiesService } from "../services/propertiesService";
import { getErrorMessage } from "../utils/errors";
import { usePageSeo } from "../hooks/usePageSeo";

// Components
import HomeHeroCarousel from "../components/common/organisms/HomeHeroCarousel/HomeHeroCarousel";
import FeaturedPropertiesSection from "../components/common/organisms/FeaturedPropertiesSection/FeaturedPropertiesSection";
import CategoriesSection from "../components/common/organisms/CategoriesSection/CategoriesSection";
import ArticlesSection from "../components/common/organisms/ArticlesSection/ArticlesSection";
import PropertyCard from "../components/common/molecules/PropertyCard";
import Button from "../components/common/atoms/Button";
import EmptyStatePanel from "../components/common/organisms/EmptyStatePanel";
import LandingTemplate from "../components/common/templates/LandingTemplate/LandingTemplate";
import LoadingSpinner from "../components/loaders/LoadingSpinner";

const Home = () => {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [properties, setProperties] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  usePageSeo({
    title: t("client:home.seo.title", "Inmobo | Catálogo de Propiedades"),
    description: t(
      "client:home.seo.description",
      "Encuentra tu propiedad ideal en venta o renta.",
    ),
    robots: "index, follow",
  });

  // MARKETING SITE MODE - SaaS Landing
  if (env.features.marketingSite) {
    return <LandingTemplate />;
  }

  // --- CLIENT PORTAL LOGIC ---

  const filters = useMemo(() => {
    return {
      page: Number(searchParams.get("page") || "1"),
      limit: 12,
      city:
        searchParams.get("location") ||
        searchParams.get("city") ||
        searchParams.get("search"),
      operationType: searchParams.get("operationType"),
      propertyType: searchParams.get("propertyType"),
      minPrice: searchParams.get("minPrice"),
      maxPrice: searchParams.get("maxPrice"),
      bedrooms: searchParams.get("bedrooms"),
      featured: searchParams.get("featured") === "true",
      sort: searchParams.get("sort") || "recent",
    };
  }, [searchParams]);

  // Determine if we are in "Search Mode" vs "Layout Mode"
  // Search Mode is active if there are any filters applied (except page)
  const isSearchMode = useMemo(() => {
    const keys = Array.from(searchParams.keys());
    return keys.some((k) => k !== "page");
  }, [searchParams]);

  const fetchProperties = () => {
    setLoading(true);
    setError(null);

    const cleanFilters = Object.fromEntries(
      Object.entries(filters).filter(
        ([_, v]) => v !== undefined && v !== null && v !== "",
      ),
    );

    propertiesService
      .listPublic({ ...cleanFilters })
      .then((data) => {
        setProperties(data.documents);
        setTotal(data.total);
        setTotalPages(Math.ceil(data.total / (cleanFilters.limit || 12)));
      })
      .catch((err) => {
        setError(getErrorMessage(err, t("client:common.errorLoading")));
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchProperties();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const updateFilter = (key, value) => {
    const current = new URLSearchParams(searchParams);
    if (value) current.set(key, value);
    else current.delete(key);

    if (key !== "page") current.set("page", "1");

    setSearchParams(current);

    // Scroll to results if searching
    if (key === "page" || isSearchMode) {
      document
        .getElementById("properties-results")
        ?.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* 
        Layout Strategy:
        1. Always show Hero Carousel (which has the search bar).
        2. If NOT in search mode (Landing view): Show Categories -> Featured -> Articles.
        3. If in Search Mode: Show Results Grid immediately after Hero.
      */}

      <HomeHeroCarousel />

      {!isSearchMode && (
        <>
          <CategoriesSection />
          <FeaturedPropertiesSection />
        </>
      )}

      {/* Main Search Results Area */}
      {/* Defined as ID for scrolling anchor */}
      <section
        id="properties-results"
        className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8"
      >
        {/* Results Header */}
        <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between border-b border-slate-200 dark:border-slate-800 pb-6">
          <div>
            <motion.h2
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-3xl font-extrabold text-slate-900 dark:text-white"
            >
              {isSearchMode
                ? t(
                    "client:home.headings.searchResults",
                    "Resultados de búsqueda",
                  )
                : t(
                    "client:home.headings.latestProperties",
                    "Propiedades Recientes",
                  )}
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="mt-2 text-slate-500 dark:text-slate-400"
            >
              {loading
                ? t("client:home.status.searching", "Buscando propiedades...")
                : t("client:home.status.totalProperties", {
                    count: total,
                    defaultValue: `${total} propiedades disponibles`,
                  })}
            </motion.p>
          </div>

          {/* Sort Controls could go here */}
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex min-h-[400px] items-center justify-center">
            <LoadingSpinner
              size="lg"
              message={t(
                "client:home.status.loadingCatalog",
                "Cargando catálogo...",
              )}
            />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center gap-6 rounded-3xl border border-dashed border-red-200 bg-red-50/50 py-20 text-center dark:border-red-900/30 dark:bg-red-900/10">
            <h3 className="text-xl font-bold text-red-800 dark:text-red-400">
              {t("client:common.errorLoading", "Ocurrió un error al cargar")}
            </h3>
            <p className="text-red-600 dark:text-red-300/70 max-w-md mx-auto">
              {error}
            </p>
            <Button
              onClick={fetchProperties}
              variant="primary"
              className="bg-red-600 hover:bg-red-700"
            >
              {t("client:common.retry", "Reintentar")}
            </Button>
          </div>
        ) : properties.length === 0 ? (
          <div className="py-12">
            <EmptyStatePanel
              icon={SearchX}
              title={t(
                "client:home.empty.title",
                "No encontramos propiedades con esos filtros",
              )}
              description={t(
                "client:home.empty.description",
                "Intenta ampliar tu búsqueda reduciendo los filtros o buscando en otra ubicación.",
              )}
              action={
                <Button
                  onClick={() => setSearchParams(new URLSearchParams())}
                  variant="outline"
                  className="mt-4"
                >
                  {t(
                    "client:home.actions.clearFilters",
                    "Ver todas las propiedades",
                  )}
                </Button>
              }
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {properties.map((property, index) => (
              <motion.div
                key={property.$id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <PropertyCard property={property} />
              </motion.div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="mt-16 flex justify-center gap-2">
            <button
              onClick={() => updateFilter("page", String(filters.page - 1))}
              disabled={filters.page <= 1}
              className="flex h-12 w-12 items-center justify-center rounded-xl border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50 hover:shadow-lg transition-all dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800"
            >
              &lt;
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
              // Logic to hide pages if too many
              if (
                totalPages > 7 &&
                Math.abs(p - filters.page) > 2 &&
                p !== 1 &&
                p !== totalPages
              ) {
                if (Math.abs(p - filters.page) === 3)
                  return (
                    <span
                      key={p}
                      className="px-1 self-end text-slate-400 font-bold mb-2"
                    >
                      ...
                    </span>
                  );
                return null;
              }
              return (
                <button
                  key={p}
                  onClick={() => updateFilter("page", String(p))}
                  className={`flex h-12 w-12 items-center justify-center rounded-xl font-bold transition-all ${
                    p === filters.page
                      ? "bg-cyan-600 text-white shadow-xl shadow-cyan-600/30 scale-110"
                      : "bg-white text-slate-600 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800"
                  }`}
                >
                  {p}
                </button>
              );
            })}
            <button
              onClick={() => updateFilter("page", String(filters.page + 1))}
              disabled={filters.page >= totalPages}
              className="flex h-12 w-12 items-center justify-center rounded-xl border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50 hover:shadow-lg transition-all dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800"
            >
              &gt;
            </button>
          </div>
        )}
      </section>

      {/* Articles Section - Only on Landing View */}
      {!isSearchMode && <ArticlesSection />}
    </div>
  );
};

export default Home;
