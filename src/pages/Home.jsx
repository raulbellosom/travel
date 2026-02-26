import { useTranslation } from "react-i18next";

import env from "../env";
import { usePageSeo } from "../hooks/usePageSeo";

// Components
import HomeHeroCarousel from "../components/common/organisms/HomeHeroCarousel/HomeHeroCarousel";
import FeaturedPropertiesSection from "../components/common/organisms/FeaturedPropertiesSection/FeaturedPropertiesSection";
import CategoriesSection from "../components/common/organisms/CategoriesSection/CategoriesSection";
import ArticlesSection from "../components/common/organisms/ArticlesSection/ArticlesSection";
import PropertyGridSection from "../components/common/organisms/PropertyGridSection/PropertyGridSection";
import LandingTemplate from "../components/common/templates/LandingTemplate/LandingTemplate";
import ResourceMapExplorer from "../features/map-explorer/components/ResourceMapExplorer";

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
      <ResourceMapExplorer />
      <CategoriesSection />
      <FeaturedPropertiesSection />

      {/* Houses for Sale */}
      <PropertyGridSection
        title={t("client:home.houses.title", "Casas en Venta")}
        subtitle={t(
          "client:home.houses.subtitle",
          "Descubre casas espaciosas perfectas para tu familia.",
        )}
        filters={{ resourceType: "property", category: "house", commercialMode: "sale" }}
        viewAllLink="/buscar?resourceType=property&category=house&commercialMode=sale"
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
        filters={{ resourceType: "property", category: "apartment" }}
        viewAllLink="/buscar?resourceType=property&category=apartment"
        limit={3}
        bgClass="bg-white dark:bg-slate-900/30"
      />

      {/* Vehicles */}
      <PropertyGridSection
        title={t("client:home.vehicles.title", "Vehículos")}
        subtitle={t(
          "client:home.vehicles.subtitle",
          "Autos, SUVs, motos y más disponibles para ti.",
        )}
        filters={{ resourceType: "vehicle" }}
        viewAllLink="/buscar?resourceType=vehicle"
        limit={3}
        bgClass="bg-slate-50 dark:bg-slate-900/50"
      />

      {/* Services */}
      <PropertyGridSection
        badge={t("client:home.servicesSection.badge", "SERVICIOS")}
        title={t("client:home.servicesSection.title", "Servicios Profesionales")}
        subtitle={t(
          "client:home.servicesSection.subtitle",
          "Limpieza, chef, fotografia, catering y mas a tu alcance.",
        )}
        filters={{ resourceType: "service" }}
        viewAllLink="/buscar?resourceType=service"
        limit={3}
        bgClass="bg-white dark:bg-slate-900/30"
      />

      {/* Music */}
      <PropertyGridSection
        badge={t("client:home.musicSection.badge", "MUSICA")}
        title={t("client:home.musicSection.title", "Musica en Vivo y DJ")}
        subtitle={t(
          "client:home.musicSection.subtitle",
          "Banda, mariachi, corridos tumbados, versatil y DJ para tus eventos.",
        )}
        filters={{ resourceType: "music" }}
        viewAllLink="/buscar?resourceType=music"
        limit={3}
        bgClass="bg-slate-50 dark:bg-slate-900/50"
      />

      {/* Experiences */}
      <PropertyGridSection
        badge={t("client:home.experiencesSection.badge", "EXPERIENCIAS")}
        title={t("client:home.experiencesSection.title", "Experiencias Únicas")}
        subtitle={t(
          "client:home.experiencesSection.subtitle",
          "Tours, talleres, aventuras, bienestar y gastronomía.",
        )}
        filters={{ resourceType: "experience" }}
        viewAllLink="/buscar?resourceType=experience"
        limit={3}
        bgClass="bg-slate-50 dark:bg-slate-900/50"
      />

      {/* Venues */}
      <PropertyGridSection
        badge={t("client:home.venuesSection.badge", "SALONES")}
        title={t("client:home.venuesSection.title", "Salones y Espacios")}
        subtitle={t(
          "client:home.venuesSection.subtitle",
          "Salones de eventos, coworking, estudios y salas de juntas.",
        )}
        filters={{ resourceType: "venue" }}
        viewAllLink="/buscar?resourceType=venue"
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



