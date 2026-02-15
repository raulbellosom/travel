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
      <ArticlesSection />
    </div>
  );
};

export default Home;
