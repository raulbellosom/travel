import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { LocateFixed, Loader2, MapPin, Search } from "lucide-react";

import Select from "../../../components/common/atoms/Select/Select";
import Combobox from "../../../components/common/molecules/Combobox/Combobox";
import {
  getOptimizedImage,
  getFileViewUrl,
} from "../../../utils/imageOptimization";
import { useAuth } from "../../../hooks/useAuth";
import { favoritesService } from "../../../services/favoritesService";
import {
  DEFAULT_CENTER,
  DEFAULT_ZOOM,
  GOOGLE_DARK_MAP_STYLE,
  GOOGLE_LIGHT_MAP_STYLE,
  GOOGLE_MAPS_MAP_ID,
} from "../../../config/map.config";
import env from "../../../env";
import useGeocoding from "../../../hooks/useGeocoding";
import { loadGoogleMaps } from "../../../services/googleMaps.loader";
import { resourcesService } from "../../../services/resourcesService";
import { cn } from "../../../utils/cn";
import { getPublicPropertyRoute } from "../../../utils/internalRoutes";

const RESOURCE_TYPE_OPTIONS = [
  "property",
  "vehicle",
  "service",
  "music",
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
const LANDING_DEFAULT_RADIUS_KM = 5;

// Per-type badge colors matching ResourceTypeBadge.jsx palette
const TYPE_BADGE_COLORS = {
  property: { bg: "#e0f2fe", text: "#0369a1" },
  service: { bg: "#d1fae5", text: "#065f46" },
  music: { bg: "#fae8ff", text: "#86198f" },
  vehicle: { bg: "#fef3c7", text: "#92400e" },
  experience: { bg: "#ede9fe", text: "#5b21b6" },
  venue: { bg: "#ffe4e6", text: "#9f1239" },
};

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
  // google.maps.LatLngBounds exposes toJSON() → {north,south,east,west}
  if (typeof bounds.toJSON === "function") return bounds.toJSON();
  // fallback for Leaflet-style bounds
  return {
    north: bounds.getNorthEast?.()?.lat() ?? bounds.getNorth?.(),
    south: bounds.getSouthWest?.()?.lat() ?? bounds.getSouth?.(),
    east: bounds.getNorthEast?.()?.lng() ?? bounds.getEast?.(),
    west: bounds.getSouthWest?.()?.lng() ?? bounds.getWest?.(),
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

  if (!fileId) return "";

  // Use card preset (600px/q50/webp) for map popup thumbnails.
  return getOptimizedImage(fileId, "card") || getFileViewUrl(fileId) || "";
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

const escapeHtml = (value) =>
  String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

const GoogleResourceMap = ({
  center,
  radiusKm,
  resources,
  activeResourceId,
  favoriteIds,
  language,
  locale,
  t,
  darkMode,
  onActiveResourceChange,
  onBoundsChange,
  onLoadError,
  onCenterChange,
}) => {
  const mapNodeRef = useRef(null);
  const mapRef = useRef(null);
  const infoWindowRef = useRef(null);
  const userMarkerRef = useRef(null);
  const radiusCircleRef = useRef(null);
  const idleListenerRef = useRef(null);
  const mapClickListenerRef = useRef(null);
  const onCenterChangeRef = useRef(onCenterChange);
  const markersRef = useRef(new Map());

  // Keep the callback ref fresh so the map click listener doesn't need to be re-added
  useEffect(() => {
    onCenterChangeRef.current = onCenterChange;
  }, [onCenterChange]);

  const mapOptions = useMemo(
    () => ({
      center,
      zoom: DEFAULT_ZOOM,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: true,
      gestureHandling: "greedy",
      mapId: GOOGLE_MAPS_MAP_ID || undefined,
      // styles cannot be set together with mapId — cloud console controls styling
      styles: GOOGLE_MAPS_MAP_ID
        ? undefined
        : darkMode
          ? GOOGLE_DARK_MAP_STYLE
          : GOOGLE_LIGHT_MAP_STYLE,
    }),
    [center, darkMode],
  );

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      try {
        const google = await loadGoogleMaps();
        if (!mounted || !mapNodeRef.current) return;

        if (!mapRef.current) {
          mapRef.current = new google.maps.Map(mapNodeRef.current, mapOptions);
          infoWindowRef.current = new google.maps.InfoWindow({
            headerDisabled: true,
          });
          // exposed so the inline HTML close button can call it
          window.__iwClose = () => infoWindowRef.current?.close();

          idleListenerRef.current = mapRef.current.addListener("idle", () => {
            onBoundsChange(toBoundsBox(mapRef.current?.getBounds?.()));
          });

          // Single click on the map moves the search center pin
          mapClickListenerRef.current = mapRef.current.addListener(
            "click",
            (event) => {
              const lat = event.latLng.lat();
              const lng = event.latLng.lng();
              onCenterChangeRef.current?.({ lat, lng });
            },
          );
        } else {
          mapRef.current.setOptions(mapOptions);
        }
        onLoadError("");
      } catch (error) {
        onLoadError(error?.message || "Google Maps unavailable");
      }
    };

    init();

    return () => {
      mounted = false;
    };
  }, [mapOptions, onBoundsChange, onLoadError]);

  useEffect(() => {
    if (!mapRef.current) return;
    mapRef.current.panTo(center);
  }, [center]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !window.google?.maps) return;

    const google = window.google;
    const markerPosition = new google.maps.LatLng(center.lat, center.lng);

    if (!userMarkerRef.current) {
      const dot = document.createElement("div");
      dot.style.cssText = [
        "width:14px",
        "height:14px",
        "background:#06b6d4",
        "border:2px solid #0f172a",
        "border-radius:50%",
        "box-shadow:0 1px 4px rgba(0,0,0,0.5)",
      ].join(";");
      userMarkerRef.current = new google.maps.marker.AdvancedMarkerElement({
        map,
        position: { lat: center.lat, lng: center.lng },
        title: t("client:home.mapExplorer.currentLocation", "Tu ubicacion"),
        content: dot,
      });
    } else {
      userMarkerRef.current.position = { lat: center.lat, lng: center.lng };
    }

    if (!radiusCircleRef.current) {
      radiusCircleRef.current = new google.maps.Circle({
        map,
        center: markerPosition,
        radius: radiusKm * 1000,
        fillColor: "#06b6d4",
        fillOpacity: 0.08,
        strokeColor: "#06b6d4",
        strokeWeight: 1,
        clickable: false, // let clicks pass through to the map
      });
    } else {
      radiusCircleRef.current.setCenter(markerPosition);
      radiusCircleRef.current.setRadius(radiusKm * 1000);
    }
  }, [center, radiusKm, t]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !window.google?.maps) return;
    const google = window.google;

    const nextIds = new Set(resources.map((resource) => resource.$id));

    markersRef.current.forEach((entry, resourceId) => {
      if (!nextIds.has(resourceId)) {
        entry.marker.map = null;
        entry.listeners.forEach((listener) => listener.remove());
        markersRef.current.delete(resourceId);
      }
    });

    resources.forEach((resource) => {
      const isActive = resource.$id === activeResourceId;
      const link = getPublicPropertyRoute(
        resource.slug || resource.$id,
        language,
      );

      const rt = String(resource.resourceType || "").toLowerCase();
      const typeBadgeColor = TYPE_BADGE_COLORS[rt] || {
        bg: "#f1f5f9",
        text: "#475569",
      };
      const typeLabelText = t(`client:common.enums.resourceType.${rt}`, rt);
      const catLabelText = resource.category
        ? t(
            `client:common.enums.category.${resource.category}`,
            resource.category,
          )
        : "";
      const isFav = favoriteIds instanceof Set && favoriteIds.has(resource.$id);

      const content = `
        <div style="min-width:220px;max-width:260px;font-family:system-ui,sans-serif;background:#ffffff;border-radius:8px;padding:14px 14px 12px;position:relative;">
          <button onclick="window.__iwClose()" style="position:absolute;top:8px;right:10px;background:none;border:none;cursor:pointer;font-size:18px;line-height:1;color:#94a3b8;padding:0;" title="Cerrar">&times;</button>
          <div style="display:flex;align-items:center;gap:4px;flex-wrap:wrap;margin-bottom:7px;padding-right:24px;">
            <span style="background:${typeBadgeColor.bg};color:${typeBadgeColor.text};border-radius:99px;padding:2px 8px;font-size:10px;font-weight:700;letter-spacing:0.04em;">${escapeHtml(typeLabelText)}</span>
            ${catLabelText ? `<span style="background:#f1f5f9;color:#475569;border-radius:99px;padding:2px 8px;font-size:10px;font-weight:600;">${escapeHtml(catLabelText)}</span>` : ""}
            ${resource.featured ? `<span style="background:#fef3c7;color:#92400e;border-radius:99px;padding:2px 8px;font-size:10px;font-weight:700;">&#9733; ${escapeHtml(t("client:badges.featured", "Destacado"))}</span>` : ""}
            ${isFav ? `<span style="color:#e11d48;font-size:14px;line-height:1;" title="${escapeHtml(t("client:favorites.saved", "En tus favoritos"))}">&#9829;</span>` : ""}
          </div>
          <p style="margin:0 0 4px 0;font-size:13px;font-weight:700;color:#0f172a;line-height:1.3;">${escapeHtml(resource.title)}</p>
          <p style="margin:0 0 2px 0;font-size:12px;color:#475569;">${escapeHtml(buildAddressLabel(resource) || t("client:search.unknownLocation"))}</p>
          <p style="margin:0 0 10px 0;font-size:12px;color:#64748b;">${escapeHtml(formatDistance(resource.distanceKm, t))}</p>
          <a href="${escapeHtml(link)}" style="display:inline-block;border-radius:8px;background:#0e7490;color:#ffffff;padding:5px 12px;font-size:12px;font-weight:600;text-decoration:none;letter-spacing:0.01em;">${escapeHtml(t("client:actions.viewDetails", "Ver detalles"))}</a>
        </div>
      `;

      const priceText = formatCurrency(
        resource.price,
        resource.currency,
        locale,
      );

      const existing = markersRef.current.get(resource.$id);
      if (!existing) {
        const el = document.createElement("div");
        el.style.cssText = [
          `background:${isActive ? "#22d3ee" : "#1e293b"}`,
          `color:${darkMode ? "#e2e8f0" : isActive ? "#0f172a" : "#f8fafc"}`,
          `border:2px solid ${isActive ? "#0891b2" : "#0f172a"}`,
          "border-radius:12px",
          "padding:3px 8px",
          "font-size:11px",
          "font-weight:700",
          "white-space:nowrap",
          "cursor:pointer",
          "box-shadow:0 1px 4px rgba(0,0,0,0.3)",
        ].join(";");
        el.textContent = priceText;

        const marker = new google.maps.marker.AdvancedMarkerElement({
          map,
          position: { lat: resource.latitude, lng: resource.longitude },
          title: resource.title,
          content: el,
        });

        const handleClick = () => {
          onActiveResourceChange(resource.$id);
          infoWindowRef.current?.setContent(content);
          infoWindowRef.current?.open({ map, anchor: marker });
        };
        const handleMouseover = () => {
          onActiveResourceChange(resource.$id);
        };

        // AdvancedMarkerElement requires 'gmp-click'; mouseover is a DOM event on
        // the content element.
        const gmpClickListener = marker.addListener("gmp-click", handleClick);
        el.addEventListener("mouseover", handleMouseover);

        const listeners = [
          gmpClickListener,
          {
            remove: () => el.removeEventListener("mouseover", handleMouseover),
          },
        ];

        markersRef.current.set(resource.$id, {
          marker,
          el,
          content,
          listeners,
        });
      } else {
        const el = existing.el;
        el.style.background = isActive ? "#22d3ee" : "#1e293b";
        el.style.color = darkMode
          ? "#e2e8f0"
          : isActive
            ? "#0f172a"
            : "#f8fafc";
        el.style.borderColor = isActive ? "#0891b2" : "#0f172a";
        el.textContent = priceText;
        existing.content = content;
      }
    });
  }, [
    activeResourceId,
    darkMode,
    favoriteIds,
    language,
    locale,
    onActiveResourceChange,
    resources,
    t,
  ]);

  useEffect(() => {
    if (!activeResourceId) return;
    const active = markersRef.current.get(activeResourceId);
    if (!active || !mapRef.current || !infoWindowRef.current) return;

    infoWindowRef.current.setContent(active.content);
    infoWindowRef.current.open({
      map: mapRef.current,
      anchor: active.marker,
    });
  }, [activeResourceId]);

  useEffect(() => {
    const markersMap = markersRef.current;

    return () => {
      idleListenerRef.current?.remove();
      mapClickListenerRef.current?.remove();
      markersMap.forEach((entry) => {
        entry.listeners.forEach((listener) => listener.remove());
        entry.marker.map = null;
      });
      markersMap.clear();
      if (userMarkerRef.current) userMarkerRef.current.map = null;
      radiusCircleRef.current?.setMap(null);
      infoWindowRef.current?.close();
    };
  }, []);

  return (
    <div
      ref={mapNodeRef}
      className="h-full w-full"
      style={{ cursor: "crosshair" }}
    />
  );
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
        <p className="line-clamp-1 text-xs text-slate-500 dark:text-slate-300">
          {buildAddressLabel(resource) || t("client:search.unknownLocation")}
        </p>
        <div className="flex items-center justify-between gap-2 text-xs">
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-700 dark:bg-slate-700 dark:text-slate-200">
            {categoryLabel}
          </span>
          <span className="font-bold text-slate-900 dark:text-white">
            {formatCurrency(resource.price, resource.currency, locale)}
          </span>
        </div>
      </div>
    </Link>
  );
};

const EMPTY_OBJECT = {};
const ResourceMapExplorer = ({
  mode = "landing",
  className = "",
  initialFilters = EMPTY_OBJECT,
}) => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const isPageMode = mode === "page";
  const locale = String(i18n.resolvedLanguage || i18n.language || "es")
    .toLowerCase()
    .startsWith("en")
    ? "en-US"
    : "es-MX";
  const language = i18n.resolvedLanguage || i18n.language || "es";
  const initialResourceType = String(initialFilters.resourceType || "").trim();
  const initialCommercialMode = String(
    initialFilters.commercialMode || "",
  ).trim();
  const initialMaxPrice = String(initialFilters.maxPrice || "").trim();

  const [center, setCenter] = useState(DEFAULT_CENTER);
  const [radiusKm, setRadiusKm] = useState(LANDING_DEFAULT_RADIUS_KM);
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
  const [mapLoadError, setMapLoadError] = useState("");
  const [favoriteIds, setFavoriteIds] = useState(() => new Set());

  useEffect(() => {
    if (!user?.$id) {
      setFavoriteIds(new Set());
      return;
    }
    let cancelled = false;
    favoritesService
      .listByUser(user.$id, { limit: 500 })
      .then((docs) => {
        if (!cancelled)
          setFavoriteIds(new Set(docs.map((d) => String(d.resourceId || ""))));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [user?.$id]);

  const requestedLocationRef = useRef(false);
  const [repinning, setRepinning] = useState(false);

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
    const observer = new MutationObserver(() => {
      setDarkMode(isDarkModeEnabled());
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  const handleMapCenterChange = useCallback(
    async ({ lat, lng }) => {
      setCenter({ lat, lng });
      setRepinning(true);
      try {
        const place = await reversePlace(lat, lng);
        const label =
          place?.formattedAddress || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
        setQuery(label);
        setSelectedLocationValue(label);
        setLocationLabel(label);
      } catch {
        const label = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
        setSelectedLocationValue(label);
        setLocationLabel(label);
      } finally {
        setRepinning(false);
      }
    },
    [reversePlace],
  );

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
      setSelectedLocationValue(
        `${place.lat}:${place.lng}:${place.formattedAddress}`,
      );
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
                    <MapPin
                      size={14}
                      className="mt-0.5 shrink-0 text-cyan-600"
                    />
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
              {t("client:home.mapExplorer.activeLocation", "Ubicacion activa")}:{" "}
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
                    {t(
                      "client:home.mapExplorer.filters.commercialMode",
                      "Modo",
                    )}
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
          <div className="relative isolate overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div
              className={cn(
                "h-[420px] sm:h-[500px]",
                isPageMode && "lg:h-[620px]",
              )}
            >
              <GoogleResourceMap
                center={center}
                radiusKm={radiusKm}
                resources={resources}
                activeResourceId={activeResourceId}
                favoriteIds={favoriteIds}
                language={language}
                locale={locale}
                t={t}
                darkMode={darkMode}
                onActiveResourceChange={setActiveResourceId}
                onBoundsChange={setBounds}
                onLoadError={setMapLoadError}
                onCenterChange={handleMapCenterChange}
              />
            </div>

            {repinning && (
              <div className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center">
                <div className="flex items-center gap-2 rounded-xl bg-white/90 px-3 py-2 text-xs font-semibold text-slate-700 shadow backdrop-blur dark:bg-slate-900/90 dark:text-slate-200">
                  <Loader2 size={13} className="animate-spin" />
                  {t(
                    "client:home.mapExplorer.locating",
                    "Obteniendo ubicacion...",
                  )}
                </div>
              </div>
            )}
            <div className="pointer-events-none absolute bottom-10 left-1/2 z-20 -translate-x-1/2 rounded-xl bg-black/60 px-3 py-1.5 text-xs font-medium text-white shadow backdrop-blur">
              {t(
                "client:home.mapExplorer.clickToRepin",
                "Clic en el mapa para mover el pin de busqueda",
              )}
            </div>
            <div className="pointer-events-none absolute left-3 top-3 z-20 rounded-xl bg-white/90 px-3 py-1.5 text-xs font-semibold text-slate-700 shadow backdrop-blur dark:bg-slate-900/90 dark:text-slate-200">
              {loadingResources
                ? t("client:home.mapExplorer.loading", "Buscando recursos...")
                : t("client:home.mapExplorer.results", {
                    count: resources.length,
                    defaultValue: "{{count}} recursos en esta zona",
                  })}
            </div>
            {mapLoadError ? (
              <div className="border-t border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-900/40 dark:bg-red-900/10 dark:text-red-300">
                {mapLoadError}
              </div>
            ) : null}
          </div>

          <aside
            className={cn(
              "overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900",
              isPageMode && "flex flex-col",
            )}
          >
            <div
              className={cn(
                "flex items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-slate-800",
                isPageMode && "shrink-0",
              )}
            >
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
                isPageMode ? "flex-1" : "max-h-[360px]",
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
