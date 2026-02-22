import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Circle,
  CircleMarker,
  MapContainer,
  Popup,
  TileLayer,
  Tooltip,
  useMap,
  useMapEvents,
} from "react-leaflet";
import { LocateFixed, Loader2, MapPin, Search } from "lucide-react";
import "leaflet/dist/leaflet.css";

import Select from "../../../components/common/atoms/Select/Select";
import Combobox from "../../../components/common/molecules/Combobox/Combobox";
import { storage } from "../../../api/appwriteClient";
import {
  DEFAULT_CENTER,
  DEFAULT_ZOOM,
  FALLBACK_TILE_OPTIONS,
  HAS_MAPBOX_TOKEN,
  TILE_LAYERS,
  TILE_OPTIONS,
} from "../../../config/map.config";
import env from "../../../env";
import useGeocoding from "../../../hooks/useGeocoding";
import { resourcesService } from "../../../services/resourcesService";
import { cn } from "../../../utils/cn";
import { getPublicPropertyRoute } from "../../../utils/internalRoutes";

const RESOURCE_TYPE_OPTIONS = [
  "property",
  "vehicle",
  "service",
  "experience",
  "venue",
];

const COMMERCIAL_MODE_OPTIONS = [
  "sale",
  "rent_long_term",
  "rent_short_term",
  "rent_hourly",
];

const RADIUS_OPTIONS_KM = [5, 10, 20, 35, 50];
const LANDING_DEFAULT_RADIUS_KM = 10;

const isDarkModeEnabled = () =>
  typeof document !== "undefined" &&
  document.documentElement.classList.contains("dark");

const toNumberOrNull = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const hasValidCoordinates = (resource) => {
  const lat = toNumberOrNull(resource?.latitude);
  const lng = toNumberOrNull(resource?.longitude);
  return lat !== null && lng !== null;
};

const toRadians = (value) => (value * Math.PI) / 180;

const distanceKmBetween = (latA, lngA, latB, lngB) => {
  const earthRadiusKm = 6371;
  const deltaLat = toRadians(latB - latA);
  const deltaLng = toRadians(lngB - lngA);

  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(toRadians(latA)) *
      Math.cos(toRadians(latB)) *
      Math.sin(deltaLng / 2) *
      Math.sin(deltaLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusKm * c;
};

const toBoundsBox = (bounds) => {
  if (!bounds) return null;
  return {
    north: bounds.getNorth(),
    south: bounds.getSouth(),
    east: bounds.getEast(),
    west: bounds.getWest(),
  };
};

const isInBounds = (resource, bounds) => {
  if (!bounds) return true;
  const lat = toNumberOrNull(resource?.latitude);
  const lng = toNumberOrNull(resource?.longitude);
  if (lat === null || lng === null) return false;

  return (
    lat <= bounds.north &&
    lat >= bounds.south &&
    lng <= bounds.east &&
    lng >= bounds.west
  );
};

const formatCurrency = (amount, currency = "MXN", locale = "es-MX") => {
  const value = Number(amount);
  if (!Number.isFinite(value) || value <= 0) return "--";

  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(value);
  } catch {
    return new Intl.NumberFormat(locale, {
      maximumFractionDigits: 0,
    }).format(value);
  }
};

const buildAddressLabel = (resource) => {
  const area = [resource?.city, resource?.state].filter(Boolean).join(", ");
  return resource?.streetAddress || area || "";
};

const coverImageFromResource = (resource) => {
  const fileId = Array.isArray(resource?.galleryImageIds)
    ? resource.galleryImageIds.find(Boolean)
    : "";

  const bucketId = env.appwrite.buckets.resourceImages;
  if (!fileId || !bucketId) return "";

  return storage.getFileView({
    bucketId,
    fileId,
  });
};

const formatDistance = (distanceKm, t) => {
  if (!Number.isFinite(distanceKm)) return "";
  if (distanceKm < 1) {
    return t("client:home.mapExplorer.distanceMeters", {
      count: Math.max(1, Math.round(distanceKm * 1000)),
      defaultValue: "{{count}} m",
    });
  }
  return t("client:home.mapExplorer.distanceKm", {
    count: Number(distanceKm.toFixed(1)),
    defaultValue: "{{count}} km",
  });
};

const MapViewportEvents = ({ onBoundsChange }) => {
  const map = useMapEvents({
    moveend: () => {
      onBoundsChange(toBoundsBox(map.getBounds()));
    },
    zoomend: () => {
      onBoundsChange(toBoundsBox(map.getBounds()));
    },
  });

  useEffect(() => {
    onBoundsChange(toBoundsBox(map.getBounds()));
  }, [map, onBoundsChange]);

  return null;
};

const MapCenterController = ({ center }) => {
  const map = useMap();
  const previous = useRef(null);

  useEffect(() => {
    const currentKey = `${center.lat.toFixed(5)}:${center.lng.toFixed(5)}`;
    if (previous.current === currentKey) return;

    previous.current = currentKey;
    map.flyTo([center.lat, center.lng], map.getZoom(), {
      duration: 0.45,
    });
  }, [center, map]);

  return null;
};
const SidebarResourceCard = ({
  resource,
  active,
  language,
  locale,
  t,
  onActivate,
}) => {
  const link = getPublicPropertyRoute(resource.slug || resource.$id, language);
  const imageUrl = coverImageFromResource(resource);

  const typeLabel = t(
    `client:common.enums.resourceType.${resource.resourceType}`,
    resource.resourceType,
  );

  const categoryLabel = t(
    `client:common.enums.category.${resource.category}`,
    typeLabel,
  );

  return (
    <Link
      to={link}
      onMouseEnter={() => onActivate(resource.$id)}
      onFocus={() => onActivate(resource.$id)}
      className={cn(
        "flex items-start gap-3 rounded-2xl border p-3 transition",
        active
          ? "border-cyan-500 bg-cyan-50 dark:border-cyan-500/70 dark:bg-cyan-900/20"
          : "border-slate-200 bg-white hover:border-cyan-300 dark:border-slate-700 dark:bg-slate-900",
      )}
    >
      <div className="h-16 w-20 shrink-0 overflow-hidden rounded-xl bg-slate-200 dark:bg-slate-700">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={resource.title}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs font-semibold text-slate-500 dark:text-slate-300">
            {typeLabel}
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1 space-y-1">
        <p className="line-clamp-1 text-sm font-semibold text-slate-900 dark:text-white">
          {resource.title}
        </p>
        <p className="line-clamp-1 text-xs text-slate-500 dark:text-slate-400">
          {buildAddressLabel(resource) || t("client:search.unknownLocation")}
        </p>
        <div className="flex items-center justify-between gap-2 text-xs">
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            {categoryLabel}
          </span>
          <span className="font-semibold text-slate-800 dark:text-slate-100">
            {formatCurrency(resource.price, resource.currency, locale)}
          </span>
        </div>
      </div>
    </Link>
  );
};

const ResourceMapExplorer = ({
  mode = "landing",
  className = "",
  initialFilters = {},
}) => {
  const { t, i18n } = useTranslation();
  const isPageMode = mode === "page";
  const locale =
    String(i18n.resolvedLanguage || i18n.language || "es")
      .toLowerCase()
      .startsWith("en")
      ? "en-US"
      : "es-MX";
  const language = i18n.resolvedLanguage || i18n.language || "es";
  const initialResourceType = String(initialFilters.resourceType || "").trim();
  const initialCommercialMode = String(initialFilters.commercialMode || "").trim();
  const initialMaxPrice = String(initialFilters.maxPrice || "").trim();

  const [center, setCenter] = useState(DEFAULT_CENTER);
  const [radiusKm, setRadiusKm] = useState(
    isPageMode ? 20 : LANDING_DEFAULT_RADIUS_KM,
  );
  const [resourceType, setResourceType] = useState(initialResourceType);
  const [commercialMode, setCommercialMode] = useState(initialCommercialMode);
  const [maxPrice, setMaxPrice] = useState(initialMaxPrice);
  const [onlyFeatured, setOnlyFeatured] = useState(false);

  const [query, setQuery] = useState("");
  const [selectedLocationValue, setSelectedLocationValue] = useState("");
  const [locationLabel, setLocationLabel] = useState("");
  const [geolocating, setGeolocating] = useState(false);
  const [locationError, setLocationError] = useState("");

  const [resources, setResources] = useState([]);
  const [loadingResources, setLoadingResources] = useState(false);
  const [resourcesError, setResourcesError] = useState("");
  const [bounds, setBounds] = useState(null);
  const [activeResourceId, setActiveResourceId] = useState("");

  const [darkMode, setDarkMode] = useState(isDarkModeEnabled);
  const [useFallbackTiles, setUseFallbackTiles] = useState(!HAS_MAPBOX_TOKEN);

  const requestedLocationRef = useRef(false);

  const {
    results: placeResults,
    search: searchPlaces,
    reverse: reversePlace,
    loading: searchingPlaces,
    clearResults,
  } = useGeocoding({
    debounceMs: 250,
    minLength: 2,
  });

  useEffect(() => {
    setResourceType(initialResourceType);
    setCommercialMode(initialCommercialMode);
    setMaxPrice(initialMaxPrice);
  }, [initialCommercialMode, initialMaxPrice, initialResourceType]);

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setDarkMode(isDarkModeEnabled());
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  const requestUserLocation = useCallback(
    (auto = false) => {
      if (!env.features.geolocation) return;

      if (!navigator?.geolocation) {
        if (!auto) {
          setLocationError(
            t(
              "client:home.mapExplorer.geo.notSupported",
              "Tu navegador no soporta geolocalizacion.",
            ),
          );
        }
        return;
      }

      setGeolocating(true);
      setLocationError("");

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const nextCenter = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };

          setCenter(nextCenter);

          try {
            const place = await reversePlace(nextCenter.lat, nextCenter.lng);
            if (place?.formattedAddress) {
              setQuery(place.formattedAddress);
              setSelectedLocationValue(place.formattedAddress);
              setLocationLabel(place.formattedAddress);
            } else {
              const fallbackLabel = `${nextCenter.lat.toFixed(5)}, ${nextCenter.lng.toFixed(5)}`;
              setSelectedLocationValue(fallbackLabel);
              setLocationLabel(fallbackLabel);
            }
          } catch {
            const fallbackLabel = `${nextCenter.lat.toFixed(5)}, ${nextCenter.lng.toFixed(5)}`;
            setSelectedLocationValue(fallbackLabel);
            setLocationLabel(fallbackLabel);
          } finally {
            setGeolocating(false);
          }
        },
        (error) => {
          const denied = error?.code === 1;
          setLocationError(
            denied
              ? t(
                  "client:home.mapExplorer.geo.denied",
                  "Activa permisos de ubicacion para explorar recursos cercanos.",
                )
              : t(
                  "client:home.mapExplorer.geo.error",
                  "No pudimos obtener tu ubicacion actual.",
                ),
          );
          setGeolocating(false);
        },
        {
          enableHighAccuracy: true,
          timeout: 12000,
          maximumAge: 120000,
        },
      );
    },
    [reversePlace, t],
  );

  useEffect(() => {
    if (!env.features.geolocation || requestedLocationRef.current) return;
    requestedLocationRef.current = true;
    requestUserLocation(true);
  }, [requestUserLocation]);

  const onQueryChange = useCallback(
    (nextValue) => {
      setQuery(nextValue);
      searchPlaces(nextValue, {
        country: "",
        bounds: null,
        limit: 8,
      });
    },
    [searchPlaces],
  );

  const onPlaceSelected = useCallback(
    (place) => {
      const formatted =
        place?.formattedAddress ||
        [place?.city, place?.state, place?.country].filter(Boolean).join(", ");

      setCenter({ lat: place.lat, lng: place.lng });
      setQuery(formatted);
      setSelectedLocationValue(`${place.lat}:${place.lng}:${place.formattedAddress}`);
      setLocationLabel(formatted);
      setLocationError("");
      clearResults();
    },
    [clearResults],
  );

  const onLocationComboboxChange = useCallback(
    (nextValue) => {
      if (!nextValue) {
        setSelectedLocationValue("");
        clearResults();
        return;
      }

      setSelectedLocationValue(nextValue);

      const selectedPlace = placeResults.find(
        (place) =>
          `${place.lat}:${place.lng}:${place.formattedAddress}` === nextValue,
      );
      if (selectedPlace) {
        onPlaceSelected(selectedPlace);
      }
    },
    [clearResults, onPlaceSelected, placeResults],
  );

  const fetchResources = useCallback(async () => {
    setLoadingResources(true);
    setResourcesError("");

    const filters = {};
    if (resourceType) filters.resourceType = resourceType;
    if (commercialMode) filters.commercialMode = commercialMode;
    if (onlyFeatured) filters.featured = true;
    if (maxPrice) filters.maxPrice = maxPrice;

    try {
      const response = await resourcesService.listPublic({
        page: 1,
        limit: isPageMode ? 200 : 120,
        filters,
      });

      const resourcesWithCoordinates = (response.documents || [])
        .filter(hasValidCoordinates)
        .map((resource) => {
          const latitude = Number(resource.latitude);
          const longitude = Number(resource.longitude);
          return {
            ...resource,
            latitude,
            longitude,
            distanceKm: distanceKmBetween(
              center.lat,
              center.lng,
              latitude,
              longitude,
            ),
          };
        })
        .filter((resource) => resource.distanceKm <= radiusKm)
        .sort((left, right) => {
          if (left.distanceKm !== right.distanceKm) {
            return left.distanceKm - right.distanceKm;
          }
          return Number(right.featured) - Number(left.featured);
        });

      setResources(resourcesWithCoordinates);

      setActiveResourceId((current) => {
        if (
          current &&
          resourcesWithCoordinates.some((resource) => resource.$id === current)
        ) {
          return current;
        }
        return resourcesWithCoordinates[0]?.$id || "";
      });
    } catch (error) {
      setResourcesError(
        error?.message ||
          t(
            "client:home.mapExplorer.errors.load",
            "No pudimos cargar recursos para esta zona.",
          ),
      );
    } finally {
      setLoadingResources(false);
    }
  }, [
    center.lat,
    center.lng,
    commercialMode,
    isPageMode,
    maxPrice,
    onlyFeatured,
    radiusKm,
    resourceType,
    t,
  ]);

  useEffect(() => {
    fetchResources();
  }, [fetchResources]);

  const visibleResources = useMemo(
    () => resources.filter((resource) => isInBounds(resource, bounds)),
    [resources, bounds],
  );

  const sidebarResources = useMemo(() => {
    const source = visibleResources.length > 0 ? visibleResources : resources;
    return source.slice(0, isPageMode ? 16 : 6);
  }, [isPageMode, resources, visibleResources]);

  const resourceTypeOptions = useMemo(
    () => [
      {
        value: "",
        label: t("client:home.mapExplorer.filters.allResourceTypes", "Todos"),
      },
      ...RESOURCE_TYPE_OPTIONS.map((value) => ({
        value,
        label: t(`client:common.enums.resourceType.${value}`, value),
      })),
    ],
    [t],
  );

  const commercialModeOptions = useMemo(
    () => [
      {
        value: "",
        label: t("client:home.mapExplorer.filters.allModes", "Todos"),
      },
      ...COMMERCIAL_MODE_OPTIONS.map((value) => ({
        value,
        label: t(`client:common.enums.commercialMode.${value}`, value),
      })),
    ],
    [t],
  );
  const locationOptions = useMemo(
    () =>
      placeResults.map((place) => ({
        value: `${place.lat}:${place.lng}:${place.formattedAddress}`,
        label: place.formattedAddress,
        place,
      })),
    [placeResults],
  );
  const radiusOptions = useMemo(
    () =>
      RADIUS_OPTIONS_KM.map((value) => ({
        value: String(value),
        label: `${value} km`,
      })),
    [],
  );

  const tileConfig = useFallbackTiles
    ? TILE_LAYERS.fallback
    : darkMode
      ? TILE_LAYERS.dark
      : TILE_LAYERS.light;

  const tileOptions = useFallbackTiles ? FALLBACK_TILE_OPTIONS : TILE_OPTIONS;

  return (
    <section
      className={cn(
        "relative overflow-hidden bg-gradient-to-b from-white via-cyan-50/40 to-slate-100/70 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900",
        className,
      )}
    >
      <div className="container mx-auto space-y-5 px-4 py-10 sm:px-6 sm:py-12">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-700 dark:text-cyan-300">
              {t("client:home.mapExplorer.badge", "EXPLORA CERCA DE TI")}
            </p>
            <h2 className="mt-2 text-2xl font-black text-slate-900 dark:text-white sm:text-3xl">
              {isPageMode
                ? t(
                    "client:home.mapExplorer.pageTitle",
                    "Explora recursos en mapa interactivo",
                  )
                : t(
                    "client:home.mapExplorer.title",
                    "Encuentra recursos cerca de tu ubicacion",
                  )}
            </h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 sm:text-base">
              {isPageMode
                ? t(
                    "client:home.mapExplorer.pageSubtitle",
                    "Busca por direccion, ciudad o zona y aplica filtros para ver solo lo que necesitas.",
                  )
                : t(
                    "client:home.mapExplorer.subtitle",
                    "Mostramos recursos publicados con precio en el mapa para que compares rapido por zona.",
                  )}
            </p>
          </div>

          {!isPageMode && (
            <Link
              to="/explorar-mapa"
              className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-cyan-600 dark:bg-white dark:text-slate-900 dark:hover:bg-cyan-300"
            >
              {t(
                "client:home.mapExplorer.actions.openExplorer",
                "Abrir explorador completo",
              )}
            </Link>
          )}
        </div>
        <div className="space-y-3 rounded-2xl border border-slate-200 bg-white/80 p-4 backdrop-blur dark:border-slate-800 dark:bg-slate-900/80">
          <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
            <div className="relative">
              <Search
                size={16}
                className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 text-slate-500 dark:text-slate-400"
              />
              <Combobox
                options={locationOptions}
                value={selectedLocationValue}
                onChange={onLocationComboboxChange}
                onInputChange={onQueryChange}
                placeholder={t(
                  "client:home.mapExplorer.locationPlaceholder",
                  "Buscar calle, zona, ciudad o pais",
                )}
                noResultsText={t(
                  "client:home.mapExplorer.empty",
                  "No encontramos recursos con estos filtros en el radio actual.",
                )}
                inputClassName="h-11 w-full rounded-xl border border-slate-300 bg-white pl-9 pr-3 text-sm text-slate-700 transition focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                maxResults={8}
                renderOption={(option) => (
                  <div className="flex items-start gap-2">
                    <MapPin size={14} className="mt-0.5 shrink-0 text-cyan-600" />
                    <span className="line-clamp-2">{option.label}</span>
                  </div>
                )}
              />
            </div>

            <button
              type="button"
              onClick={() => requestUserLocation(false)}
              disabled={geolocating || !env.features.geolocation}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
            >
              {geolocating ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <LocateFixed size={16} />
              )}
              <span>
                {t(
                  "client:home.mapExplorer.actions.useMyLocation",
                  "Usar mi ubicacion",
                )}
              </span>
            </button>
          </div>

          {locationLabel && (
            <p className="text-xs text-slate-600 dark:text-slate-300">
              {t("client:home.mapExplorer.activeLocation", "Ubicacion activa")}: {" "}
              {locationLabel}
            </p>
          )}
          {locationError && (
            <p className="text-xs text-red-600 dark:text-red-400">
              {locationError}
            </p>
          )}
          {searchingPlaces && query.trim().length >= 2 && (
            <p className="text-xs text-slate-500 dark:text-slate-300">
              {t(
                "client:home.mapExplorer.searchingLocations",
                "Buscando ubicaciones...",
              )}
            </p>
          )}

          {isPageMode ? (
            <>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                <label className="flex flex-col gap-1">
                  <span className="text-[11px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    {t("client:home.mapExplorer.filters.radius", "Radio")}
                  </span>
                  <Select
                    value={String(radiusKm)}
                    onChange={(value) => setRadiusKm(Number(value))}
                    options={radiusOptions}
                    size="sm"
                    className="h-10"
                  />
                </label>

                <label className="flex flex-col gap-1">
                  <span className="text-[11px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    {t(
                      "client:home.mapExplorer.filters.resourceType",
                      "Tipo de recurso",
                    )}
                  </span>
                  <Select
                    value={resourceType}
                    onChange={(value) => setResourceType(value)}
                    options={resourceTypeOptions}
                    size="sm"
                    className="h-10"
                  />
                </label>

                <label className="flex flex-col gap-1">
                  <span className="text-[11px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    {t("client:home.mapExplorer.filters.commercialMode", "Modo")}
                  </span>
                  <Select
                    value={commercialMode}
                    onChange={(value) => setCommercialMode(value)}
                    options={commercialModeOptions}
                    size="sm"
                    className="h-10"
                  />
                </label>

                <label className="flex flex-col gap-1">
                  <span className="text-[11px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    {t(
                      "client:home.mapExplorer.filters.maxPrice",
                      "Precio maximo",
                    )}
                  </span>
                  <input
                    type="number"
                    min="0"
                    value={maxPrice}
                    onChange={(event) => setMaxPrice(event.target.value)}
                    placeholder={t(
                      "client:home.mapExplorer.filters.anyPrice",
                      "Sin limite",
                    )}
                    className="h-10 rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                  />
                </label>
              </div>

              <label className="inline-flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
                <input
                  type="checkbox"
                  checked={onlyFeatured}
                  onChange={(event) => setOnlyFeatured(event.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-cyan-600"
                />
                {t(
                  "client:home.mapExplorer.filters.onlyFeatured",
                  "Solo destacados",
                )}
              </label>
            </>
          ) : null}
        </div>

        <div
          className={cn(
            "grid gap-4",
            isPageMode
              ? "lg:grid-cols-[minmax(0,1fr)_21rem]"
              : "lg:grid-cols-[minmax(0,1fr)_19rem]",
          )}
        >
          <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className={cn("h-[420px] sm:h-[500px]", isPageMode && "lg:h-[620px]")}>
              <MapContainer
                center={[center.lat, center.lng]}
                zoom={DEFAULT_ZOOM}
                scrollWheelZoom={true}
                style={{ height: "100%", width: "100%", zIndex: 0 }}
              >
                <TileLayer
                  attribution={tileConfig.attribution}
                  url={tileConfig.url}
                  tileSize={tileOptions.tileSize}
                  zoomOffset={tileOptions.zoomOffset}
                  maxZoom={tileOptions.maxZoom}
                  eventHandlers={{
                    tileerror: () => {
                      setUseFallbackTiles(true);
                    },
                  }}
                />

                <MapCenterController center={center} />
                <MapViewportEvents onBoundsChange={setBounds} />

                <Circle
                  center={[center.lat, center.lng]}
                  radius={radiusKm * 1000}
                  pathOptions={{
                    color: "#06b6d4",
                    fillColor: "#06b6d4",
                    fillOpacity: 0.08,
                    weight: 1,
                  }}
                />

                <CircleMarker
                  center={[center.lat, center.lng]}
                  radius={7}
                  pathOptions={{
                    color: "#0f172a",
                    fillColor: "#06b6d4",
                    fillOpacity: 1,
                    weight: 2,
                  }}
                >
                  <Tooltip direction="bottom" offset={[0, 10]}>
                    {t(
                      "client:home.mapExplorer.currentLocation",
                      "Tu ubicacion",
                    )}
                  </Tooltip>
                </CircleMarker>
                {resources.map((resource) => {
                  const isActive = resource.$id === activeResourceId;
                  const link = getPublicPropertyRoute(
                    resource.slug || resource.$id,
                    language,
                  );

                  return (
                    <CircleMarker
                      key={resource.$id}
                      center={[resource.latitude, resource.longitude]}
                      radius={isActive ? 8 : 7}
                      pathOptions={{
                        color: isActive ? "#0891b2" : "#0f172a",
                        fillColor: isActive ? "#22d3ee" : "#1e293b",
                        fillOpacity: 0.95,
                        weight: isActive ? 2 : 1,
                      }}
                      eventHandlers={{
                        click: () => setActiveResourceId(resource.$id),
                        mouseover: () => setActiveResourceId(resource.$id),
                      }}
                    >
                      <Tooltip
                        permanent
                        direction="top"
                        offset={[0, -10]}
                        className={cn(
                          "resource-map-price-tooltip",
                          isActive && "resource-map-price-tooltip--active",
                        )}
                      >
                        {formatCurrency(resource.price, resource.currency, locale)}
                      </Tooltip>

                      <Popup>
                        <div className="space-y-1">
                          <p className="text-sm font-semibold">{resource.title}</p>
                          <p className="text-xs text-slate-500">
                            {buildAddressLabel(resource) ||
                              t("client:search.unknownLocation")}
                          </p>
                          <p className="text-xs text-slate-600">
                            {formatDistance(resource.distanceKm, t)}
                          </p>
                          <Link
                            to={link}
                            className="inline-flex rounded-lg bg-slate-900 px-2.5 py-1 text-xs font-semibold text-white"
                          >
                            {t("client:actions.viewDetails", "Ver detalles")}
                          </Link>
                        </div>
                      </Popup>
                    </CircleMarker>
                  );
                })}
              </MapContainer>
            </div>

            <div className="pointer-events-none absolute right-3 top-3 z-[1000] rounded-xl bg-white/90 px-3 py-1.5 text-xs font-semibold text-slate-700 shadow backdrop-blur dark:bg-slate-900/90 dark:text-slate-200">
              {loadingResources
                ? t("client:home.mapExplorer.loading", "Buscando recursos...")
                : t("client:home.mapExplorer.results", {
                    count: resources.length,
                    defaultValue: "{{count}} recursos en esta zona",
                  })}
            </div>
          </div>

          <aside className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-slate-800">
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                  {t(
                    "client:home.mapExplorer.sidebarTitle",
                    "Recursos en pantalla",
                  )}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {t("client:home.mapExplorer.sidebarCount", {
                    count: visibleResources.length,
                    defaultValue: "{{count}} visibles",
                  })}
                </p>
              </div>
            </div>

            <div
              className={cn(
                "space-y-2 overflow-y-auto p-3",
                isPageMode ? "max-h-[560px]" : "max-h-[360px]",
              )}
            >
              {loadingResources ? (
                <div className="flex items-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-3 py-4 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-800/40 dark:text-slate-300">
                  <Loader2 size={16} className="animate-spin" />
                  {t("client:home.mapExplorer.loading", "Buscando recursos...")}
                </div>
              ) : resourcesError ? (
                <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-900/10 dark:text-red-300">
                  {resourcesError}
                </div>
              ) : sidebarResources.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-3 py-4 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-800/40 dark:text-slate-300">
                  {t(
                    "client:home.mapExplorer.empty",
                    "No encontramos recursos con estos filtros en el radio actual.",
                  )}
                </div>
              ) : (
                sidebarResources.map((resource) => (
                  <SidebarResourceCard
                    key={resource.$id}
                    resource={resource}
                    active={resource.$id === activeResourceId}
                    language={language}
                    locale={locale}
                    t={t}
                    onActivate={setActiveResourceId}
                  />
                ))
              )}
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
};

export default ResourceMapExplorer;

