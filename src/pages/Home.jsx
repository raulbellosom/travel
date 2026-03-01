import { lazy, Suspense } from "react";
import { useTranslation } from "react-i18next";

import { usePageSeo } from "../hooks/usePageSeo";
import { useInstanceModules } from "../hooks/useInstanceModules";
import { resolveUiMode } from "../utils/uiMode";

// New Airbnb-style Home components
import {
  HomeHero,
  HomeFeaturedCarousel,
  HomeCategoryCarousels,
  HomeQuickIdeas,
  HomeTrustBar,
  HomeLoggedInSection,
} from "../components/home";

// Lazy-loaded secondary sections for performance
const ResourceMapExplorer = lazy(
  () => import("../features/map-explorer/components/ResourceMapExplorer"),
);
const LandingTemplate = lazy(
  () =>
    import("../components/common/templates/LandingTemplate/LandingTemplate"),
);

const SectionFallback = () => (
  <div className="flex h-32 items-center justify-center">
    <div className="h-6 w-6 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent" />
  </div>
);

const Home = () => {
  const { t } = useTranslation();
  const { settings } = useInstanceModules();
  const isMarketingMode = resolveUiMode(settings) === "marketing";

  usePageSeo({
    title: t("client:home.seo.title", "Inmobo | Catálogo de Propiedades"),
    description: t(
      "client:home.seo.description",
      "Encuentra tu propiedad ideal en venta o renta.",
    ),
    robots: "index, follow",
  });

  // MARKETING SITE MODE - SaaS Landing
  if (isMarketingMode) {
    return (
      <Suspense fallback={<SectionFallback />}>
        <LandingTemplate />
      </Suspense>
    );
  }

  // --- CLIENT PORTAL LANDING (Airbnb-style redesign) ---
  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      {/* 1. Intent-driven Hero + Search Panel + Featured Deck */}
      <HomeHero />

      {/* 2. Featured / Premium carousel (right after hero) */}
      <HomeFeaturedCarousel />

      {/* 3. Map Explorer (lazy loaded) */}
      <Suspense fallback={<SectionFallback />}>
        <ResourceMapExplorer />
      </Suspense>

      {/* 4. Logged-in: favorites carousel + recent searches */}
      <HomeLoggedInSection />

      {/* 6. Category carousels: property, vehicle, service */}
      <HomeCategoryCarousels />

      {/* 7. Quick Ideas chips */}
      <HomeQuickIdeas />

      {/* 8. Trust bar (verified, secure payments, support) */}
      <HomeTrustBar />
    </div>
  );
};

export default Home;
