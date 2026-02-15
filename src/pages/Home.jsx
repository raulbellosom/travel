import React, { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";

import env from "../env";
import { propertiesService } from "../services/propertiesService";
import { getErrorMessage } from "../utils/errors";
import { usePageSeo } from "../hooks/usePageSeo";

// Components
import HomeHeroCarousel from "../components/common/organisms/HomeHeroCarousel/HomeHeroCarousel";
import FeaturedPropertiesSection from "../components/common/organisms/FeaturedPropertiesSection/FeaturedPropertiesSection";
import CategoriesSection from "../components/common/organisms/CategoriesSection/CategoriesSection";
import ArticlesSection from "../components/common/organisms/ArticlesSection/ArticlesSection";
import PropertyGridSection from "../components/common/organisms/PropertyGridSection/PropertyGridSection";
import LandingTemplate from "../components/common/templates/LandingTemplate/LandingTemplate";

const Home = () => {
  const { t } = useTranslation();

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

  // --- CLIENT PORTAL LANDING ---
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <HomeHeroCarousel />
      <CategoriesSection />
      <FeaturedPropertiesSection />

      {/* Houses for Sale */}
      <PropertyGridSection
        title={t("client:home.houses.title", "Casas en Venta")}
        subtitle={t(
          "client:home.houses.subtitle",
          "Descubre casas espaciosas perfectas para tu familia.",
        )}
        filters={{ propertyType: "house", operationType: "sale" }}
        viewAllLink="/buscar?propertyType=house&operationType=sale"
        limit={3}
        bgClass="bg-slate-50 dark:bg-slate-900/50"
      />

      {/* Apartments */}
      <PropertyGridSection
        title={t("client:home.apartments.title", "Departamentos")}
        subtitle={t(
          "client:home.apartments.subtitle",
          "Espacios modernos y cómodos en las mejores ubicaciones.",
        )}
        filters={{ propertyType: "apartment" }}
        viewAllLink="/buscar?propertyType=apartment"
        limit={3}
        bgClass="bg-white dark:bg-slate-900/30"
      />

      {/* Properties with Pool */}
      <PropertyGridSection
        badge={t("client:home.amenities.badge", "AMENIDADES")}
        title={t("client:home.pool.title", "Propiedades con Alberca")}
        subtitle={t(
          "client:home.pool.subtitle",
          "Disfruta del lujo de tu propia alberca.",
        )}
        filters={{ amenities: ["pool"] }}
        viewAllLink="/buscar?amenities=pool"
        limit={3}
        bgClass="bg-slate-50 dark:bg-slate-900/50"
      />

      {/* Ocean View Properties */}
      <PropertyGridSection
        badge={t("client:home.amenities.badge", "AMENIDADES")}
        title={t("client:home.oceanView.title", "Vista al Mar")}
        subtitle={t(
          "client:home.oceanView.subtitle",
          "Despierta con las mejores vistas panorámicas al océano.",
        )}
        filters={{ amenities: ["ocean-view"] }}
        viewAllLink="/buscar?amenities=ocean-view"
        limit={3}
        bgClass="bg-white dark:bg-slate-900/30"
      />

      <ArticlesSection />
    </div>
  );
};

export default Home;
