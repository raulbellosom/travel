import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router-dom";

import ResourceMapExplorer from "../features/map-explorer/components/ResourceMapExplorer";
import { usePageSeo } from "../hooks/usePageSeo";

const MapExplorePage = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();

  const initialFilters = {
    resourceType: searchParams.get("resourceType") || "",
    commercialMode: searchParams.get("commercialMode") || "",
    maxPrice: searchParams.get("maxPrice") || "",
  };

  usePageSeo({
    title: t(
      "client:home.mapExplorer.seo.title",
      "Explorar recursos en mapa | Inmobo",
    ),
    description: t(
      "client:home.mapExplorer.seo.description",
      "Explora recursos cercanos por ubicacion, tipo y precio en un mapa interactivo.",
    ),
    robots: "index, follow",
  });

  return (
    <div className="pt-20 sm:pt-24">
      <ResourceMapExplorer mode="page" initialFilters={initialFilters} />
    </div>
  );
};

export default MapExplorePage;
