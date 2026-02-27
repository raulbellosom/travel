import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Building2, Home, MapPin, Palmtree } from "lucide-react";
import { DEFAULT_AMENITIES_CATALOG } from "../../data/amenitiesCatalog";
import { resourcesService } from "../../services/resourcesService";

const SEARCH_DEBOUNCE_MS = 320;
export const PUBLIC_SEARCH_MIN_QUERY_LENGTH = 2;
const PUBLIC_SEARCH_LIVE_LIMIT = 5;
const PUBLIC_SEARCH_AMENITY_LIMIT = 4;

const BASE_SUGGESTIONS = [
  {
    icon: Palmtree,
    to: "/buscar?resourceType=property&commercialMode=rent_short_term",
    i18nKey: "publicSearch.suggestions.vacationRentals",
    defaultLabel: "Rentas Vacacionales",
  },
  {
    icon: Home,
    to: "/buscar?resourceType=property&category=house&commercialMode=sale",
    i18nKey: "publicSearch.suggestions.houses",
    defaultLabel: "Casas en venta",
  },
  {
    icon: Building2,
    to: "/buscar?resourceType=property&category=apartment",
    i18nKey: "publicSearch.suggestions.apartments",
    defaultLabel: "Departamentos",
  },
  {
    icon: MapPin,
    to: "/buscar?q=Puerto+Vallarta",
    i18nKey: "publicSearch.suggestions.puertoVallarta",
    defaultLabel: "Puerto Vallarta",
  },
  {
    icon: MapPin,
    to: "/buscar?q=Riviera+Nayarit",
    i18nKey: "publicSearch.suggestions.rivieraNayarit",
    defaultLabel: "Riviera Nayarit",
  },
];

const normalizeQuery = (value) => String(value || "").trim();

export const usePublicSearchData = ({ query, language = "es", t }) => {
  const [liveResults, setLiveResults] = useState([]);
  const [liveLoading, setLiveLoading] = useState(false);
  const requestIdRef = useRef(0);

  const trimmedQuery = useMemo(() => normalizeQuery(query), [query]);

  useEffect(() => {
    if (trimmedQuery.length < PUBLIC_SEARCH_MIN_QUERY_LENGTH) {
      requestIdRef.current += 1;
      setLiveResults([]);
      setLiveLoading(false);
      return;
    }

    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    setLiveLoading(true);

    const timerId = setTimeout(async () => {
      try {
        const response = await resourcesService.listPublic({
          page: 1,
          limit: PUBLIC_SEARCH_LIVE_LIMIT,
          filters: { search: trimmedQuery },
        });

        if (requestIdRef.current !== requestId) return;
        setLiveResults(response.documents || []);
      } catch {
        if (requestIdRef.current !== requestId) return;
        setLiveResults([]);
      } finally {
        if (requestIdRef.current === requestId) {
          setLiveLoading(false);
        }
      }
    }, SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(timerId);
  }, [trimmedQuery]);

  const amenityMatches = useMemo(() => {
    if (trimmedQuery.length < PUBLIC_SEARCH_MIN_QUERY_LENGTH) return [];

    const normalized = trimmedQuery.toLowerCase();
    return DEFAULT_AMENITIES_CATALOG.filter(
      (amenity) =>
        amenity.name_en.toLowerCase().includes(normalized) ||
        amenity.name_es.toLowerCase().includes(normalized),
    )
      .slice(0, PUBLIC_SEARCH_AMENITY_LIMIT)
      .map((amenity) => ({
        ...amenity,
        displayName: language === "en" ? amenity.name_en : amenity.name_es,
      }));
  }, [language, trimmedQuery]);

  const suggestions = useMemo(
    () =>
      BASE_SUGGESTIONS.map((suggestion) => ({
        ...suggestion,
        label: t(suggestion.i18nKey, suggestion.defaultLabel),
      })),
    [t],
  );

  const resetResults = useCallback(() => {
    requestIdRef.current += 1;
    setLiveResults([]);
    setLiveLoading(false);
  }, []);

  return {
    trimmedQuery,
    suggestions,
    liveResults,
    liveLoading,
    amenityMatches,
    resetResults,
  };
};
