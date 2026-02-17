import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
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
} from "lucide-react";

import { propertiesService } from "../services/propertiesService";
import { getErrorMessage } from "../utils/errors";
import { usePageSeo } from "../hooks/usePageSeo";
import PropertyCard from "../components/common/molecules/PropertyCard";
import Button from "../components/common/atoms/Button";
import Select from "../components/common/atoms/Select";
import LazyImage from "../components/common/atoms/LazyImage";
import EmptyStatePanel from "../components/common/organisms/EmptyStatePanel";
import LoadingSpinner from "../components/loaders/LoadingSpinner";
import { DEFAULT_AMENITIES_CATALOG } from "../data/amenitiesCatalog";

/* ─────────────────────────── constants ─────────────────────────── */

const OPERATION_OPTIONS = [
  { value: "", labelKey: "search.allOperations", fallback: "All" },
  { value: "sale", labelKey: "common.enums.operation.sale", fallback: "Sale" },
  { value: "rent", labelKey: "common.enums.operation.rent", fallback: "Rent" },
  {
    value: "vacation_rental",
    labelKey: "common.enums.operation.vacation_rental",
    fallback: "Vacation",
  },
];

const PROPERTY_TYPE_OPTIONS = [
  { value: "", labelKey: "search.allTypes", fallback: "All", icon: Home },
  {
    value: "house",
    labelKey: "common.enums.propertyType.house",
    fallback: "House",
    icon: Home,
  },
  {
    value: "apartment",
    labelKey: "common.enums.propertyType.apartment",
    fallback: "Apartment",
    icon: Building2,
  },
  {
    value: "land",
    labelKey: "common.enums.propertyType.land",
    fallback: "Land",
    icon: Square,
  },
  {
    value: "commercial",
    labelKey: "common.enums.propertyType.commercial",
    fallback: "Commercial",
    icon: Store,
  },
  {
    value: "office",
    labelKey: "common.enums.propertyType.office",
    fallback: "Office",
    icon: Building2,
  },
  {
    value: "warehouse",
    labelKey: "common.enums.propertyType.warehouse",
    fallback: "Warehouse",
    icon: Warehouse,
  },
];

const BEDROOM_OPTIONS = [
  { value: "", labelKey: "search.anyOption", label: "Cualquiera" },
  { value: "1", label: "1+" },
  { value: "2", label: "2+" },
  { value: "3", label: "3+" },
  { value: "4", label: "4+" },
  { value: "5", label: "5+" },
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
  { value: "", labelKey: "search.any", fallback: "Any" },
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
  <motion.button
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 0.9 }}
    type="button"
    onClick={onRemove}
    className="inline-flex items-center gap-1.5 rounded-full bg-cyan-50 px-3 py-1.5 text-xs font-semibold text-cyan-700 transition hover:bg-cyan-100 dark:bg-cyan-900/30 dark:text-cyan-400 dark:hover:bg-cyan-900/50"
  >
    <span>{label}</span>
    <X size={12} />
  </motion.button>
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

const SearchPage = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const searchInputRef = useRef(null);
  const mobileSearchInputRef = useRef(null);

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
      operationType: searchParams.get("operationType") || "",
      propertyType: searchParams.get("propertyType") || "",
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
    if (filters.operationType) count++;
    if (filters.propertyType) count++;
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

    propertiesService
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
    if (filters.operationType) {
      const op = OPERATION_OPTIONS.find(
        (o) => o.value === filters.operationType,
      );
      chips.push({
        key: "operationType",
        label: op
          ? t(`client:${op.labelKey}`, op.fallback)
          : filters.operationType,
      });
    }
    if (filters.propertyType) {
      const pt = PROPERTY_TYPE_OPTIONS.find(
        (o) => o.value === filters.propertyType,
      );
      chips.push({
        key: "propertyType",
        label: pt
          ? t(`client:${pt.labelKey}`, pt.fallback)
          : filters.propertyType,
      });
    }
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
  const tOperations = OPERATION_OPTIONS.map((o) => ({
    ...o,
    label: t(`client:${o.labelKey}`, o.fallback),
  }));
  const tPropertyTypes = PROPERTY_TYPE_OPTIONS.map((o) => ({
    ...o,
    label: t(`client:${o.labelKey}`, o.fallback),
  }));
  const tSortOptions = SORT_OPTIONS.map((o) => ({
    ...o,
    label: t(`client:${o.labelKey}`, o.fallback),
  }));
  const tFurnished = FURNISHED_OPTIONS.map((o) => ({
    ...o,
    label: t(`client:${o.labelKey}`, o.fallback),
  }));

  /* ──────────────────── FILTER SIDEBAR (shared) ──────────────────── */

  const FiltersContent = ({ onClose }) => (
    <div className="space-y-6">
      {/* Tipo de operación */}
      <FilterSelect
        label={t("client:search.operationType")}
        value={filters.operationType}
        options={tOperations}
        onChange={(v) => updateFilter("operationType", v)}
      />

      {/* Tipo de propiedad */}
      <FilterSelect
        label={t("client:search.propertyType")}
        value={filters.propertyType}
        options={tPropertyTypes}
        onChange={(v) => updateFilter("propertyType", v)}
        icon={Home}
      />

      {/* Rango de precio */}
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
        {/* Quick price presets */}
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

      {/* Recámaras */}
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

      {/* Baños */}
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

      {/* Estacionamiento */}
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

      {/* Amueblado */}
      <FilterSelect
        label={t("client:search.furnished")}
        value={filters.furnished}
        options={tFurnished}
        onChange={(v) => updateFilter("furnished", v)}
        icon={Armchair}
      />

      {/* Toggles */}
      <div className="space-y-3">
        {/* Mascotas */}
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

        {/* Destacadas */}
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

      {/* Clear all */}
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
          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-2 text-center text-2xl font-extrabold text-white sm:text-3xl"
          >
            {t("client:search.heroTitle")}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="mx-auto mb-6 max-w-lg text-center text-sm text-slate-300 sm:text-base"
          >
            {t("client:search.heroSubtitle")}
          </motion.p>

          {/* Search bar */}
          <motion.form
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
          </motion.form>

          {/* Operation type quick tabs */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15 }}
            className="mx-auto mt-5 flex max-w-lg justify-center gap-2"
          >
            {OPERATION_OPTIONS.map((op) => {
              const isActive = filters.operationType === op.value;
              return (
                <button
                  key={op.value}
                  type="button"
                  onClick={() => updateFilter("operationType", op.value)}
                  className={`rounded-full px-4 py-1.5 text-xs font-bold transition sm:text-sm ${
                    isActive
                      ? "bg-cyan-500 text-white shadow-md shadow-cyan-500/30"
                      : "bg-white/10 text-white/80 hover:bg-white/20"
                  }`}
                >
                  {t(`client:${op.labelKey}`, op.fallback)}
                </button>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* ─── Main Content ─── */}
      <div className="container mx-auto px-4 py-6 sm:px-6 sm:py-8 lg:py-10">
        <div className="flex gap-8">
          {/* ── Desktop Sidebar ── */}
          <aside className="hidden w-72 shrink-0 lg:block">
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
              <FiltersContent />
            </div>
          </aside>

          {/* ── Results Area ── */}
          <main className="min-w-0 flex-1">
            {/* Mobile: quick filters + "Más filtros" button */}
            <div className="mb-4 flex flex-wrap items-center gap-2 lg:hidden">
              {/* Quick property type pills */}
              <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
                {PROPERTY_TYPE_OPTIONS.slice(0, 5).map((pt) => {
                  const isActive = filters.propertyType === pt.value;
                  return (
                    <button
                      key={pt.value}
                      type="button"
                      onClick={() =>
                        updateFilter("propertyType", isActive ? "" : pt.value)
                      }
                      className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-bold transition ${
                        isActive
                          ? "bg-cyan-600 text-white"
                          : "bg-white text-slate-600 shadow-sm hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-white"
                      }`}
                    >
                      {t(`client:${pt.labelKey}`, pt.fallback)}
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
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
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
                </motion.div>
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
                    {t("client:search.resultsCount")}
                  </span>
                )}
              </p>

              {/* Sort dropdown */}
              <div className="flex items-center gap-2">
                <ArrowUpDown size={14} className="text-slate-400" />
                <select
                  value={filters.sort}
                  onChange={(e) => updateFilter("sort", e.target.value)}
                  className="appearance-none rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition focus:border-cyan-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:focus:border-cyan-400"
                >
                  {tSortOptions.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Results */}
            {loading ? (
              <div className="flex min-h-[400px] items-center justify-center">
                <LoadingSpinner
                  size="lg"
                  message={t("client:search.loadingResults")}
                />
              </div>
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
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {properties.map((property, index) => (
                  <motion.div
                    key={property.$id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                  >
                    <PropertyCard property={property} />
                  </motion.div>
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
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileFiltersOpen(false)}
              className="fixed inset-0 z-[110] bg-black/50 backdrop-blur-sm lg:hidden"
            />
            {/* Drawer */}
            <motion.div
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
                <FiltersContent onClose={() => setIsMobileFiltersOpen(false)} />
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
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SearchPage;
