import SkeletonLoader from "../components/common/molecules/SkeletonLoader";
import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { m as Motion, AnimatePresence } from "framer-motion";
import {
  Search,
  X,
  SlidersHorizontal,
  ChevronDown,
  SearchX,
  Loader2,
  MapPin,
  Home,
  Building2,
  Store,
  Warehouse,
  Square,
  BedDouble,
  Bath,
  Car,
  PawPrint,
  Armchair,
  Palmtree,
  Sparkles,
  ArrowUpDown,
  Tag,
  Wrench,
  Compass,
  CalendarHeart,
  Music,
  LayoutGrid,
  Bike,
  Ship,
  Camera,
  Ticket,
  GraduationCap,
  Dumbbell,
  Users,
  TreePine,
} from "lucide-react";

import { resourcesService } from "../services/resourcesService";
import { getErrorMessage } from "../utils/errors";
import { usePageSeo } from "../hooks/usePageSeo";
import PropertyCard from "../components/common/molecules/PropertyCard";
import Button from "../components/common/atoms/Button";
import Select from "../components/common/atoms/Select";
import LazyImage from "../components/common/atoms/LazyImage";
import EmptyStatePanel from "../components/common/organisms/EmptyStatePanel";
import { DEFAULT_AMENITIES_CATALOG } from "../data/amenitiesCatalog";
import {
  CATEGORY_BY_RESOURCE_TYPE,
  COMMERCIAL_MODE_BY_RESOURCE_TYPE,
  getAllowedCommercialModes,
} from "../utils/resourceTaxonomy";

/* ─────────────────────────── constants ─────────────────────────── */

const RESOURCE_TYPE_OPTIONS = [
  {
    value: "",
    labelKey: "search.allResourceTypes",
    fallback: "All resources",
    icon: LayoutGrid,
  },
  {
    value: "property",
    labelKey: "common.enums.resourceType.property",
    fallback: "Property",
    icon: Home,
  },
  {
    value: "vehicle",
    labelKey: "common.enums.resourceType.vehicle",
    fallback: "Vehicle",
    icon: Car,
  },
  {
    value: "service",
    labelKey: "common.enums.resourceType.service",
    fallback: "Service",
    icon: Wrench,
  },
  {
    value: "music",
    labelKey: "common.enums.resourceType.music",
    fallback: "Music",
    icon: Music,
  },
  {
    value: "experience",
    labelKey: "common.enums.resourceType.experience",
    fallback: "Experience",
    icon: Compass,
  },
  {
    value: "venue",
    labelKey: "common.enums.resourceType.venue",
    fallback: "Venue",
    icon: CalendarHeart,
  },
];

const OPERATION_OPTIONS = [
  { value: "", labelKey: "search.allOperations", fallback: "All" },
  { value: "sale", labelKey: "common.enums.operation.sale", fallback: "Sale" },
  {
    value: "rent_long_term",
    labelKey: "common.enums.operation.rent_long_term",
    fallback: "Long-term rent",
  },
  {
    value: "rent_short_term",
    labelKey: "common.enums.operation.rent_short_term",
    fallback: "Short-term rent",
  },
  {
    value: "rent_hourly",
    labelKey: "common.enums.operation.rent_hourly",
    fallback: "Hourly",
  },
];

const CATEGORY_ICON_MAP = {
  house: Home,
  apartment: Building2,
  land: Square,
  commercial: Store,
  office: Building2,
  warehouse: Warehouse,
  car: Car,
  suv: Car,
  pickup: Car,
  van: Car,
  motorcycle: Bike,
  boat: Ship,
  cleaning: Wrench,
  dj: Music,
  banda: Music,
  norteno: Music,
  sierreno: Music,
  mariachi: Music,
  corridos: Music,
  corridos_tumbados: Music,
  corrido_mexicano: Music,
  regional_mexicano: Music,
  duranguense: Music,
  grupera: Music,
  cumbia: Music,
  cumbia_sonidera: Music,
  cumbia_rebajada: Music,
  salsa: Music,
  bachata: Music,
  merengue: Music,
  pop: Music,
  rock: Music,
  rock_urbano: Music,
  hip_hop: Music,
  rap: Music,
  reggaeton: Music,
  urbano_latino: Music,
  electronica: Music,
  techno: Music,
  trance: Music,
  jazz: Music,
  blues: Music,
  boleros: Music,
  trova: Music,
  instrumental: Music,
  versatil: Music,
  son_jarocho: Music,
  huapango: Music,
  sonora: Music,
  chef: Wrench,
  photography: Camera,
  catering: Wrench,
  maintenance: Wrench,
  tour: Compass,
  class: GraduationCap,
  workshop: GraduationCap,
  adventure: TreePine,
  wellness: Dumbbell,
  gastronomy: Wrench,
  event_hall: CalendarHeart,
  commercial_local: Store,
  studio: Building2,
  coworking: Users,
  meeting_room: Users,
};

/** Build category options dynamically based on selected resource type */
const buildCategoryOptions = (resourceType, t) => {
  const categories = resourceType
    ? CATEGORY_BY_RESOURCE_TYPE[resourceType] || []
    : Object.values(CATEGORY_BY_RESOURCE_TYPE).flat();

  const options = [
    {
      value: "",
      labelKey: "search.allCategories",
      fallback: t("client:search.allCategories", "All categories"),
      icon: LayoutGrid,
    },
  ];

  const seen = new Set();
  categories.forEach((cat) => {
    if (seen.has(cat)) return;
    seen.add(cat);
    options.push({
      value: cat,
      label: t(`client:common.enums.category.${cat}`, cat),
      icon:
        resourceType === "music" && cat === "house"
          ? Music
          : CATEGORY_ICON_MAP[cat] || LayoutGrid,
    });
  });

  return options;
};

const buildCommercialModeOptions = (resourceType, category, t) => {
  const modes = resourceType
    ? getAllowedCommercialModes(resourceType, category)
    : Array.from(
        new Set(Object.values(COMMERCIAL_MODE_BY_RESOURCE_TYPE).flat()),
      );
  return [
    {
      value: "",
      label: t("client:search.allOperations", "Todas"),
    },
    ...modes.map((mode) => ({
      value: mode,
      label: t(`client:common.enums.operation.${mode}`, mode),
    })),
  ];
};

const BEDROOM_OPTIONS = [
  { value: "", labelKey: "search.anyOption", label: "Cualquiera" },
  { value: "1", label: "1+" },
  { value: "2", label: "2+" },
  { value: "3", label: "3+" },
  { value: "4", label: "4+" },
];

const BATHROOM_OPTIONS = [
  { value: "", labelKey: "search.anyOption", label: "Cualquiera" },
  { value: "1", label: "1+" },
  { value: "2", label: "2+" },
  { value: "3", label: "3+" },
  { value: "4", label: "4+" },
];

const PARKING_OPTIONS = [
  { value: "", labelKey: "search.anyOption", label: "Cualquiera" },
  { value: "1", label: "1+" },
  { value: "2", label: "2+" },
  { value: "3", label: "3+" },
];

const FURNISHED_OPTIONS = [
  { value: "", labelKey: "search.anyOption", fallback: "Cualquiera" },
  { value: "furnished", labelKey: "search.furnished", fallback: "Furnished" },
  {
    value: "semi_furnished",
    labelKey: "search.semiFurnished",
    fallback: "Semi-furnished",
  },
  {
    value: "unfurnished",
    labelKey: "search.unfurnished",
    fallback: "Unfurnished",
  },
];

const SORT_OPTIONS = [
  { value: "recent", labelKey: "search.sortRecent", fallback: "Most recent" },
  {
    value: "price-asc",
    labelKey: "search.sortPriceAsc",
    fallback: "Price: low to high",
  },
  {
    value: "price-desc",
    labelKey: "search.sortPriceDesc",
    fallback: "Price: high to low",
  },
];

const PRICE_PRESETS = [
  { label: "Hasta $500K", min: "", max: "500000" },
  { label: "$500K - $1M", min: "500000", max: "1000000" },
  { label: "$1M - $3M", min: "1000000", max: "3000000" },
  { label: "$3M - $5M", min: "3000000", max: "5000000" },
  { label: "$5M - $10M", min: "5000000", max: "10000000" },
  { label: "Más de $10M", min: "10000000", max: "" },
];

/* ─────────────────────── helper components ─────────────────────── */

/** Chip shown for each active filter */
const FilterChip = ({ label, onRemove }) => (
  <Motion.button
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 0.9 }}
    type="button"
    onClick={onRemove}
    className="inline-flex items-center gap-1.5 rounded-full bg-cyan-50 px-3 py-1.5 text-xs font-semibold text-cyan-700 transition hover:bg-cyan-100 dark:bg-cyan-900/30 dark:text-cyan-400 dark:hover:bg-cyan-900/50"
  >
    <span>{label}</span>
    <X size={12} />
  </Motion.button>
);

/** Select-style dropdown filter */
const FilterSelect = ({ label, value, options, onChange, icon: Icon }) => (
  <div className="space-y-1.5">
    <label className="ml-1 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
      {Icon && <Icon size={13} className="mr-1 inline" />}
      {label}
    </label>
    <Select
      value={value}
      onChange={onChange}
      options={options}
      size="sm"
      variant="outlined"
    />
  </div>
);

/* ═════════════════════════ MAIN COMPONENT ═════════════════════════ */
const FiltersContent = ({
  onClose,
  filters,
  tResourceTypes,
  tOperations,
  tCategories,
  tFurnished,
  updateFilters,
  updateFilter,
  clearAllFilters,
  showPropertyFilters,
  activeFilterCount,
  t,
}) => (
  <div className="space-y-6">
    <FilterSelect
      label={t("client:search.resourceType")}
      value={filters.resourceType}
      options={tResourceTypes}
      onChange={(v) => {
        updateFilters({
          resourceType: v,
          category: "",
          propertyType: "",
          commercialMode: "",
          operationType: "",
        });
      }}
      icon={LayoutGrid}
    />
    <FilterSelect
      label={t("client:search.operationType")}
      value={filters.commercialMode}
      options={tOperations}
      onChange={(v) => {
        updateFilters({ commercialMode: v, operationType: "" });
      }}
    />
    <FilterSelect
      label={t("client:search.category")}
      value={filters.category}
      options={tCategories}
      onChange={(v) => {
        const allowedModes = buildCommercialModeOptions(
          filters.resourceType,
          v,
          t,
        )
          .map((option) => option.value)
          .filter(Boolean);
        const nextCommercialMode = allowedModes.includes(filters.commercialMode)
          ? filters.commercialMode
          : "";
        updateFilters({
          category: v,
          propertyType: "",
          commercialMode: nextCommercialMode,
          operationType: "",
        });
      }}
      icon={Home}
    />
    <div className="space-y-2">
      <label className="ml-1 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
        {t("client:search.priceRange")}
      </label>
      <div className="flex gap-2">
        <input
          type="number"
          placeholder={t("client:search.minPricePlaceholder")}
          value={filters.minPrice}
          onChange={(e) => updateFilter("minPrice", e.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 transition focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
        />
        <span className="self-center text-slate-400">—</span>
        <input
          type="number"
          placeholder={t("client:search.maxPricePlaceholder")}
          value={filters.maxPrice}
          onChange={(e) => updateFilter("maxPrice", e.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 transition focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
        />
      </div>
      <div className="flex flex-wrap gap-1.5 pt-1">
        {PRICE_PRESETS.map((p) => {
          const isActive =
            filters.minPrice === p.min && filters.maxPrice === p.max;
          return (
            <button
              key={p.label}
              type="button"
              onClick={() =>
                updateFilters({
                  minPrice: isActive ? "" : p.min,
                  maxPrice: isActive ? "" : p.max,
                })
              }
              className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition ${
                isActive
                  ? "bg-cyan-600 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600 dark:hover:text-white"
              }`}
            >
              {p.label}
            </button>
          );
        })}
      </div>
    </div>
    {showPropertyFilters && (
      <div className="space-y-2">
        <label className="ml-1 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          <BedDouble size={13} className="mr-1 inline" />
          {t("client:search.bedrooms")}
        </label>
        <div className="flex gap-1.5">
          {BEDROOM_OPTIONS.map((o) => {
            const isActive = filters.bedrooms === o.value;
            return (
              <button
                key={o.value}
                type="button"
                onClick={() =>
                  updateFilter("bedrooms", isActive ? "" : o.value)
                }
                className={`flex-1 rounded-lg py-2 text-xs font-bold transition ${
                  isActive
                    ? "bg-cyan-600 text-white shadow-sm"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600 dark:hover:text-white"
                }`}
              >
                {o.labelKey ? t(`client:${o.labelKey}`) : o.label}
              </button>
            );
          })}
        </div>
      </div>
    )}
    {showPropertyFilters && (
      <div className="space-y-2">
        <label className="ml-1 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          <Bath size={13} className="mr-1 inline" />
          {t("client:search.bathrooms")}
        </label>
        <div className="flex gap-1.5">
          {BATHROOM_OPTIONS.map((o) => {
            const isActive = filters.bathrooms === o.value;
            return (
              <button
                key={o.value}
                type="button"
                onClick={() =>
                  updateFilter("bathrooms", isActive ? "" : o.value)
                }
                className={`flex-1 rounded-lg py-2 text-xs font-bold transition ${
                  isActive
                    ? "bg-cyan-600 text-white shadow-sm"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600 dark:hover:text-white"
                }`}
              >
                {o.labelKey ? t(`client:${o.labelKey}`) : o.label}
              </button>
            );
          })}
        </div>
      </div>
    )}
    {(showPropertyFilters || filters.resourceType === "venue") && (
      <div className="space-y-2">
        <label className="ml-1 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          <Car size={13} className="mr-1 inline" />
          {t("client:search.parking")}
        </label>
        <div className="flex gap-1.5">
          {PARKING_OPTIONS.map((o) => {
            const isActive = filters.parkingSpaces === o.value;
            return (
              <button
                key={o.value}
                type="button"
                onClick={() =>
                  updateFilter("parkingSpaces", isActive ? "" : o.value)
                }
                className={`flex-1 rounded-lg py-2 text-xs font-bold transition ${
                  isActive
                    ? "bg-cyan-600 text-white shadow-sm"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600 dark:hover:text-white"
                }`}
              >
                {o.labelKey ? t(`client:${o.labelKey}`) : o.label}
              </button>
            );
          })}
        </div>
      </div>
    )}
    {showPropertyFilters && (
      <FilterSelect
        label={t("client:search.furnished")}
        value={filters.furnished}
        options={tFurnished}
        onChange={(v) => updateFilter("furnished", v)}
        icon={Armchair}
      />
    )}
    <div className="space-y-3">
      <label className="flex cursor-pointer items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 transition hover:border-cyan-300 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-cyan-500">
        <span className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
          <PawPrint size={16} className="text-amber-500" />
          {t("client:search.petsAllowed")}
        </span>
        <input
          type="checkbox"
          checked={filters.petsAllowed}
          onChange={(e) =>
            updateFilter("petsAllowed", e.target.checked ? "true" : "")
          }
          className="h-5 w-5 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
        />
      </label>
      <label className="flex cursor-pointer items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 transition hover:border-cyan-300 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-cyan-500">
        <span className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
          <Sparkles size={16} className="text-yellow-500" />
          {t("client:search.featured")}
        </span>
        <input
          type="checkbox"
          checked={filters.featured}
          onChange={(e) =>
            updateFilter("featured", e.target.checked ? "true" : "")
          }
          className="h-5 w-5 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
        />
      </label>
    </div>
    {activeFilterCount > 0 && (
      <button
        type="button"
        onClick={() => {
          clearAllFilters();
          onClose?.();
        }}
        className="w-full rounded-xl border border-red-200 py-2.5 text-sm font-bold text-red-600 transition hover:bg-red-50 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-900/20"
      >
        {t("client:search.clearAll")}
      </button>
    )}
  </div>
);

const SearchPage = () => {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const searchInputRef = useRef(null);

  // ── UI state ──
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [properties, setProperties] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  const [localSearch, setLocalSearch] = useState(searchParams.get("q") || "");

  // ── SEO ──
  usePageSeo({
    title: t("client:search.seo.title"),
    description: t("client:search.seo.description"),
    robots: "index, follow",
  });

  // ── Parse filters from URL ──
  const filters = useMemo(() => {
    return {
      page: Number(searchParams.get("page") || "1"),
      limit: 12,
      search: searchParams.get("q") || "",
      city: searchParams.get("city") || "",
      state: searchParams.get("state") || "",
      resourceType: searchParams.get("resourceType") || "",
      commercialMode:
        searchParams.get("commercialMode") ||
        searchParams.get("operationType") ||
        "",
      category:
        searchParams.get("category") || searchParams.get("propertyType") || "",
      minPrice: searchParams.get("minPrice") || "",
      maxPrice: searchParams.get("maxPrice") || "",
      bedrooms: searchParams.get("bedrooms") || "",
      bathrooms: searchParams.get("bathrooms") || "",
      parkingSpaces: searchParams.get("parkingSpaces") || "",
      furnished: searchParams.get("furnished") || "",
      petsAllowed: searchParams.get("petsAllowed") === "true",
      featured: searchParams.get("featured") === "true",
      sort: searchParams.get("sort") || "recent",
    };
  }, [searchParams]);

  // Keep local search in sync with URL
  useEffect(() => {
    setLocalSearch(filters.search);
  }, [filters.search]);

  // ── Count active filters (excluding search, page, sort) ──
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.resourceType) count++;
    if (filters.commercialMode) count++;
    if (filters.category) count++;
    if (filters.city) count++;
    if (filters.state) count++;
    if (filters.minPrice) count++;
    if (filters.maxPrice) count++;
    if (filters.bedrooms) count++;
    if (filters.bathrooms) count++;
    if (filters.parkingSpaces) count++;
    if (filters.furnished) count++;
    if (filters.petsAllowed) count++;
    if (filters.featured) count++;
    return count;
  }, [filters]);

  const hasAnyFilter = useMemo(() => {
    return filters.search || activeFilterCount > 0;
  }, [filters.search, activeFilterCount]);

  // ── Fetch properties ──
  const fetchProperties = useCallback(() => {
    setLoading(true);
    setError(null);

    const cleanFilters = Object.fromEntries(
      Object.entries(filters).filter(
        ([, v]) => v !== undefined && v !== null && v !== "" && v !== false,
      ),
    );

    // Separate page/limit from filter parameters
    const { page, limit, ...filterParams } = cleanFilters;

    resourcesService
      .listPublic({ page, limit, filters: filterParams })
      .then((data) => {
        setProperties(data.documents || []);
        setTotal(data.total || 0);
        setTotalPages(Math.ceil((data.total || 0) / (filters.limit || 12)));
      })
      .catch((err) => {
        setError(getErrorMessage(err, t("client:common.errorLoading")));
      })
      .finally(() => setLoading(false));
  }, [filters, t]);

  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

  // ── URL param helpers ──
  const updateFilter = useCallback(
    (key, value) => {
      const params = new URLSearchParams(searchParams);
      if (value) params.set(key, value);
      else params.delete(key);
      if (key !== "page") params.set("page", "1");
      setSearchParams(params, { replace: true });
    },
    [searchParams, setSearchParams],
  );

  const updateFilters = useCallback(
    (updates) => {
      const params = new URLSearchParams(searchParams);
      Object.entries(updates).forEach(([key, value]) => {
        if (value) params.set(key, value);
        else params.delete(key);
      });
      params.set("page", "1");
      setSearchParams(params, { replace: true });
    },
    [searchParams, setSearchParams],
  );

  const clearAllFilters = useCallback(() => {
    setSearchParams(new URLSearchParams(), { replace: true });
    setLocalSearch("");
  }, [setSearchParams]);

  const handleSearchSubmit = useCallback(
    (e) => {
      e?.preventDefault?.();
      updateFilter("q", localSearch.trim());
    },
    [localSearch, updateFilter],
  );

  // ── Active filter chips data ──
  const activeChips = useMemo(() => {
    const chips = [];
    if (filters.search)
      chips.push({
        key: "q",
        label: `"${filters.search}"`,
      });
    if (filters.resourceType) {
      const rt = RESOURCE_TYPE_OPTIONS.find(
        (o) => o.value === filters.resourceType,
      );
      chips.push({
        key: "resourceType",
        label: rt
          ? t(`client:${rt.labelKey}`, rt.fallback)
          : filters.resourceType,
      });
    }
    if (filters.commercialMode) {
      const op = OPERATION_OPTIONS.find(
        (o) => o.value === filters.commercialMode,
      );
      chips.push({
        key: "commercialMode",
        label: op
          ? t(`client:${op.labelKey}`, op.fallback)
          : filters.commercialMode,
      });
    }
    if (filters.category)
      chips.push({
        key: "category",
        label: t(
          `client:common.enums.category.${filters.category}`,
          filters.category,
        ),
      });
    if (filters.city) chips.push({ key: "city", label: filters.city });
    if (filters.state) chips.push({ key: "state", label: filters.state });
    if (filters.minPrice)
      chips.push({
        key: "minPrice",
        label: `Min: $${Number(filters.minPrice).toLocaleString()}`,
      });
    if (filters.maxPrice)
      chips.push({
        key: "maxPrice",
        label: `Max: $${Number(filters.maxPrice).toLocaleString()}`,
      });
    if (filters.bedrooms)
      chips.push({
        key: "bedrooms",
        label: `${filters.bedrooms}+ ${t("client:search.bedrooms")}`,
      });
    if (filters.bathrooms)
      chips.push({
        key: "bathrooms",
        label: `${filters.bathrooms}+ ${t("client:search.bathrooms")}`,
      });
    if (filters.parkingSpaces)
      chips.push({
        key: "parkingSpaces",
        label: `${filters.parkingSpaces}+ ${t("client:search.parking")}`,
      });
    if (filters.furnished) {
      const f = FURNISHED_OPTIONS.find((o) => o.value === filters.furnished);
      chips.push({
        key: "furnished",
        label: f ? t(`client:${f.labelKey}`, f.fallback) : filters.furnished,
      });
    }
    if (filters.petsAllowed)
      chips.push({
        key: "petsAllowed",
        label: t("client:search.petsAllowed"),
      });
    if (filters.featured)
      chips.push({
        key: "featured",
        label: t("client:search.featured"),
      });
    return chips;
  }, [filters, t]);

  // ── Translated options ──
  const tResourceTypes = RESOURCE_TYPE_OPTIONS.map((o) => ({
    ...o,
    label: t(`client:${o.labelKey}`, o.fallback),
  }));
  const tOperations = useMemo(
    () => buildCommercialModeOptions(filters.resourceType, filters.category, t),
    [filters.category, filters.resourceType, t],
  );
  const tCategories = useMemo(
    () => buildCategoryOptions(filters.resourceType, t),
    [filters.resourceType, t],
  );
  const tSortOptions = SORT_OPTIONS.map((o) => ({
    ...o,
    label: t(`client:${o.labelKey}`, o.fallback),
  }));
  const tFurnished = FURNISHED_OPTIONS.map((o) => ({
    ...o,
    label: t(`client:${o.labelKey}`, o.fallback),
  }));

  // Determine if property-specific filters should show
  const showPropertyFilters =
    !filters.resourceType || filters.resourceType === "property";

  /* ═══════════════════════════ RENDER ═══════════════════════════ */

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* ─── Search Hero Banner ─── */}
      <section className="relative overflow-hidden pb-8 pt-28 sm:pt-32 sm:pb-10">
        {/* Background image with overlay */}
        <div className="absolute inset-0 z-0">
          <LazyImage
            src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=2400&q=80"
            alt=""
            className="h-full w-full object-cover"
            eager={true}
          />
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900/90 via-cyan-950/85 to-slate-900/90" />
        </div>

        {/* Decorative blobs */}
        <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-cyan-500/10 blur-3xl z-[1]" />
        <div className="absolute -left-20 bottom-0 h-56 w-56 rounded-full bg-blue-500/10 blur-3xl z-[1]" />

        <div className="container relative mx-auto px-4 sm:px-6">
          <Motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-2 text-center text-2xl font-extrabold text-white sm:text-3xl"
          >
            {t("client:search.heroTitle")}
          </Motion.h1>
          <Motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="mx-auto mb-6 max-w-lg text-center text-sm text-slate-300 sm:text-base"
          >
            {t("client:search.heroSubtitle")}
          </Motion.p>

          {/* Search bar */}
          <Motion.form
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            onSubmit={handleSearchSubmit}
            className="mx-auto flex max-w-2xl gap-2"
          >
            <div className="relative flex-1">
              <Search
                size={18}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                ref={searchInputRef}
                type="text"
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
                placeholder={t("client:search.inputPlaceholder")}
                className="h-12 w-full rounded-2xl border border-white/20 bg-white/10 pl-11 pr-4 text-base text-white placeholder:text-white/50 backdrop-blur-sm transition focus:border-cyan-400 focus:bg-white/15 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 sm:h-14 sm:text-base"
              />
            </div>
            <Button
              type="submit"
              className="h-12 rounded-2xl px-6 text-sm font-bold shadow-lg shadow-cyan-600/30 sm:h-14 sm:px-8 sm:text-base"
            >
              {t("client:search.button")}
            </Button>
          </Motion.form>

          {/* Resource type quick tabs */}
          <Motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15 }}
            className="mx-auto mt-5 flex max-w-2xl flex-wrap justify-center gap-2"
          >
            {RESOURCE_TYPE_OPTIONS.map((rt) => {
              const isActive = filters.resourceType === rt.value;
              const Icon = rt.icon;
              return (
                <button
                  key={rt.value}
                  type="button"
                  onClick={() =>
                    updateFilters({
                      resourceType: rt.value,
                      category: "",
                      propertyType: "",
                      commercialMode: "",
                      operationType: "",
                    })
                  }
                  className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-bold transition sm:text-sm ${
                    isActive
                      ? "bg-cyan-500 text-white shadow-md shadow-cyan-500/30"
                      : "bg-white/10 text-white/80 hover:bg-white/20"
                  }`}
                >
                  {Icon && <Icon size={14} />}
                  {t(`client:${rt.labelKey}`, rt.fallback)}
                </button>
              );
            })}
          </Motion.div>
        </div>
      </section>

      {/* ─── Main Content ─── */}
      <div className="w-full px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
        <div className="flex gap-6 xl:gap-8">
          {/* ── Desktop Sidebar ── */}
          <aside className="hidden w-64 shrink-0 lg:block">
            <div className="sticky top-24 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <h3 className="mb-5 flex items-center gap-2 text-sm font-bold text-slate-800 dark:text-slate-200">
                <SlidersHorizontal size={16} className="text-cyan-600" />
                {t("client:search.filters")}
                {activeFilterCount > 0 && (
                  <span className="ml-auto rounded-full bg-cyan-100 px-2 py-0.5 text-[10px] font-bold text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-400">
                    {activeFilterCount}
                  </span>
                )}
              </h3>
              <FiltersContent
                filters={filters}
                tResourceTypes={tResourceTypes}
                tOperations={tOperations}
                tCategories={tCategories}
                tFurnished={tFurnished}
                updateFilters={updateFilters}
                updateFilter={updateFilter}
                clearAllFilters={clearAllFilters}
                showPropertyFilters={showPropertyFilters}
                activeFilterCount={activeFilterCount}
                t={t}
              />
            </div>
          </aside>

          {/* ── Results Area ── */}
          <main className="min-w-0 flex-1">
            {/* Mobile: quick filters + "Más filtros" button */}
            <div className="mb-4 flex flex-wrap items-center gap-2 lg:hidden">
              {/* Quick resource type pills */}
              <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
                {RESOURCE_TYPE_OPTIONS.map((rt) => {
                  const isActive = filters.resourceType === rt.value;
                  const Icon = rt.icon;
                  return (
                    <button
                      key={rt.value}
                      type="button"
                      onClick={() =>
                        updateFilters({
                          resourceType: isActive ? "" : rt.value,
                          category: "",
                          propertyType: "",
                          commercialMode: "",
                          operationType: "",
                        })
                      }
                      className={`flex items-center gap-1 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-bold transition ${
                        isActive
                          ? "bg-cyan-600 text-white"
                          : "bg-white text-slate-600 shadow-sm hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-white"
                      }`}
                    >
                      {Icon && <Icon size={12} />}
                      {t(`client:${rt.labelKey}`, rt.fallback)}
                    </button>
                  );
                })}
              </div>

              {/* More filters button */}
              <button
                type="button"
                onClick={() => setIsMobileFiltersOpen(true)}
                className="ml-auto flex items-center gap-1.5 rounded-full bg-white px-3.5 py-1.5 text-xs font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-white"
              >
                <SlidersHorizontal size={14} />
                {t("client:search.moreFilters")}
                {activeFilterCount > 0 && (
                  <span className="rounded-full bg-cyan-600 px-1.5 py-0.5 text-[10px] text-white">
                    {activeFilterCount}
                  </span>
                )}
              </button>
            </div>

            {/* Active filter chips */}
            <AnimatePresence>
              {activeChips.length > 0 && (
                <Motion.div
                  initial={{ opacity: 0, scaleY: 0.95 }}
                  animate={{ opacity: 1, scaleY: 1 }}
                  exit={{ opacity: 0, scaleY: 0.95 }}
                  style={{ transformOrigin: "top" }}
                  className="mb-4 flex flex-wrap items-center gap-2"
                >
                  <Tag size={14} className="text-slate-400" />
                  {activeChips.map((chip) => (
                    <FilterChip
                      key={chip.key}
                      label={chip.label}
                      onRemove={() => updateFilter(chip.key, "")}
                    />
                  ))}
                  {activeChips.length > 1 && (
                    <button
                      type="button"
                      onClick={clearAllFilters}
                      className="text-xs font-semibold text-red-500 hover:text-red-600"
                    >
                      {t("client:search.clearAll")}
                    </button>
                  )}
                </Motion.div>
              )}
            </AnimatePresence>

            {/* Results header: count + sort */}
            <div className="mb-6 flex items-center justify-between border-b border-slate-200 pb-4 dark:border-slate-800">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {loading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 size={14} className="animate-spin" />
                    {t("client:search.searching")}
                  </span>
                ) : (
                  <span>
                    <strong className="text-slate-900 dark:text-white">
                      {total}
                    </strong>{" "}
                    {t("client:search.resultsLabel", "resultados")}
                  </span>
                )}
              </p>

              {/* Sort dropdown */}
              <div className="flex items-center gap-2">
                <ArrowUpDown size={14} className="text-slate-400" />
                <Select
                  value={filters.sort}
                  onChange={(value) => updateFilter("sort", value)}
                  options={tSortOptions.map((option) => ({
                    value: option.value,
                    label: option.label,
                  }))}
                  size="sm"
                  className="min-w-[190px]"
                />
              </div>
            </div>

            {/* Results */}
            {loading ? (
              <SkeletonLoader
                variant="cards"
                count={9}
                className="min-h-[400px]"
              />
            ) : error ? (
              <div className="flex flex-col items-center justify-center gap-6 rounded-3xl border border-dashed border-red-200 bg-red-50/50 py-20 text-center dark:border-red-900/30 dark:bg-red-900/10">
                <h3 className="text-xl font-bold text-red-800 dark:text-red-400">
                  {t("client:common.errorLoading")}
                </h3>
                <p className="mx-auto max-w-md text-red-600 dark:text-red-300/70">
                  {error}
                </p>
                <Button
                  onClick={fetchProperties}
                  variant="primary"
                  className="bg-red-600 hover:bg-red-700"
                >
                  {t("client:common.retry")}
                </Button>
              </div>
            ) : properties.length === 0 ? (
              <div className="py-12">
                <EmptyStatePanel
                  icon={SearchX}
                  title={t("client:search.empty.title")}
                  description={
                    hasAnyFilter
                      ? t("client:search.empty.descFiltered")
                      : t("client:search.empty.descDefault")
                  }
                  action={
                    hasAnyFilter && (
                      <Button
                        onClick={clearAllFilters}
                        variant="outline"
                        className="mt-4"
                      >
                        {t("client:search.clearAll")}
                      </Button>
                    )
                  }
                />
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
                {properties.map((property, index) => (
                  <Motion.div
                    key={property.$id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                  >
                    <PropertyCard property={property} />
                  </Motion.div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {!loading && totalPages > 1 && (
              <div className="mt-12 flex justify-center gap-2">
                <button
                  onClick={() => updateFilter("page", String(filters.page - 1))}
                  disabled={filters.page <= 1}
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 transition dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800"
                >
                  &lt;
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (p) => {
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
                            className="mb-1 self-end px-1 font-bold text-slate-400"
                          >
                            …
                          </span>
                        );
                      return null;
                    }
                    return (
                      <button
                        key={p}
                        onClick={() => updateFilter("page", String(p))}
                        className={`flex h-10 w-10 items-center justify-center rounded-xl text-sm font-bold transition ${
                          p === filters.page
                            ? "bg-cyan-600 text-white shadow-lg shadow-cyan-600/30 scale-110"
                            : "bg-white text-slate-600 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-400"
                        }`}
                      >
                        {p}
                      </button>
                    );
                  },
                )}
                <button
                  onClick={() => updateFilter("page", String(filters.page + 1))}
                  disabled={filters.page >= totalPages}
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 transition dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800"
                >
                  &gt;
                </button>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* ─── Mobile Filters Drawer ─── */}
      <AnimatePresence>
        {isMobileFiltersOpen && (
          <>
            {/* Backdrop */}
            <Motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileFiltersOpen(false)}
              className="fixed inset-0 z-[110] bg-black/50 backdrop-blur-sm lg:hidden"
            />
            {/* Drawer */}
            <Motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed inset-y-0 right-0 z-[111] flex w-full max-w-sm flex-col bg-white shadow-2xl dark:bg-slate-900 lg:hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-800">
                <h3 className="flex items-center gap-2 text-base font-bold text-slate-900 dark:text-white">
                  <SlidersHorizontal size={18} className="text-cyan-600" />
                  {t("client:search.filters")}
                </h3>
                <button
                  type="button"
                  onClick={() => setIsMobileFiltersOpen(false)}
                  className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Scrollable content */}
              <div className="flex-1 overflow-y-auto px-5 py-5">
                <FiltersContent
                  onClose={() => setIsMobileFiltersOpen(false)}
                  filters={filters}
                  tResourceTypes={tResourceTypes}
                  tOperations={tOperations}
                  tCategories={tCategories}
                  tFurnished={tFurnished}
                  updateFilters={updateFilters}
                  updateFilter={updateFilter}
                  clearAllFilters={clearAllFilters}
                  showPropertyFilters={showPropertyFilters}
                  activeFilterCount={activeFilterCount}
                  t={t}
                />
              </div>

              {/* Footer */}
              <div className="border-t border-slate-200 px-5 py-4 dark:border-slate-800">
                <Button
                  onClick={() => setIsMobileFiltersOpen(false)}
                  className="w-full"
                  size="lg"
                >
                  {t("client:search.showResults")} ({total})
                </Button>
              </div>
            </Motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SearchPage;
