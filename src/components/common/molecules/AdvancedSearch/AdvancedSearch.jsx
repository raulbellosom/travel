import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import {
  MapPin,
  Home,
  DollarSign,
  SlidersHorizontal,
  BedDouble,
  Bath,
  Building2,
  Warehouse,
  Store,
  Square,
} from "lucide-react";
import { m, AnimatePresence } from "framer-motion";
import Button from "../../atoms/Button";
import Select from "../../atoms/Select/Select";

const AdvancedSearch = ({ className = "" }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("sale"); // sale, rent, vacation
  const [showFilters, setShowFilters] = useState(false);

  const [filters, setFilters] = useState({
    location: "",
    type: "",
    minPrice: "",
    maxPrice: "",
    bedrooms: "",
    bathrooms: "",
  });

  const operationTabs = [
    { id: "sale", label: t("client:common.enums.operation.sale", "Venta") },
    { id: "rent", label: t("client:common.enums.operation.rent", "Renta") },
    {
      id: "vacation_rental",
      label: t(
        "client:common.enums.operation.vacation_rental",
        "Rentas Vacacionales",
      ),
    },
  ];

  const propertyTypeOptions = [
    {
      value: "",
      label: t("client:search.allTypes", "Todos los tipos"),
      icon: Home,
    },
    {
      value: "house",
      label: t("client:common.enums.propertyType.house", "Casa"),
      icon: Home,
    },
    {
      value: "apartment",
      label: t("client:common.enums.propertyType.apartment", "Departamento"),
      icon: Building2,
    },
    {
      value: "land",
      label: t("client:common.enums.propertyType.land", "Terreno"),
      icon: Square,
    },
    {
      value: "commercial",
      label: t("client:common.enums.propertyType.commercial", "Comercial"),
      icon: Store,
    },
    {
      value: "industrial",
      label: t("client:common.enums.propertyType.industrial", "Industrial"),
      icon: Warehouse,
    },
  ];

  const bedroomOptions = [
    { value: "", label: t("client:search.anyOption", "Any") },
    { value: "1", label: "1+" },
    { value: "2", label: "2+" },
    { value: "3", label: "3+" },
    { value: "4", label: "4+" },
  ];

  const bathroomOptions = [
    { value: "", label: t("client:search.anyOption", "Any") },
    { value: "1", label: "1+" },
    { value: "2", label: "2+" },
    { value: "3", label: "3+" },
  ];

  const handleSearch = () => {
    const params = new URLSearchParams();
    params.set("page", "1");
    if (activeTab) params.set("operationType", activeTab);
    if (filters.location) params.set("q", filters.location);
    if (filters.type) params.set("propertyType", filters.type);
    if (filters.minPrice) params.set("minPrice", filters.minPrice);
    if (filters.maxPrice) params.set("maxPrice", filters.maxPrice);
    if (filters.bedrooms) params.set("bedrooms", filters.bedrooms);

    navigate(`/buscar?${params.toString()}`);
  };

  return (
    <div
      className={`rounded-3xl bg-white shadow-2xl dark:bg-slate-900/90 dark:backdrop-blur-md dark:border dark:border-white/10 overflow-visible ${className}`}
    >
      {/* Tabs */}
      <div className="flex border-b border-slate-100 dark:border-slate-800">
        {operationTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`relative flex-1 py-4 text-sm font-bold transition-colors ${
              activeTab === tab.id
                ? "text-cyan-600 dark:text-cyan-400"
                : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300"
            }`}
          >
            {tab.label}
            {activeTab === tab.id && (
              <m.div
                layoutId="activeTabIndicator"
                className="absolute bottom-0 left-0 right-0 h-1 bg-cyan-600 dark:bg-cyan-400 rounded-t-full"
              />
            )}
          </button>
        ))}
      </div>

      {/* Main Inputs */}
      <div className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
        {/* Location Input */}
        <div className="md:col-span-1 space-y-1.5 container-input">
          <label htmlFor="search-location" className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 ml-1">
            {t("client:search.location", "Ubicación")}
          </label>
          <div className="relative group">
            <MapPin
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-cyan-500 transition-colors z-10"
            />
            <input
              id="search-location"
              type="text"
              placeholder={t(
                "client:search.locationPlaceholder",
                "Ciudad, Zona o Código Postal",
              )}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm font-semibold text-slate-800 placeholder:text-slate-400 focus:border-cyan-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-cyan-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-cyan-400 dark:focus:bg-slate-800 transition-all"
              value={filters.location}
              onChange={(e) =>
                setFilters({ ...filters, location: e.target.value })
              }
            />
          </div>
        </div>

        {/* Property Type */}
        <div className="md:col-span-1 space-y-1.5 container-select">
          <label htmlFor="search-type" className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 ml-1">
            {t("client:search.type", "Tipo de Propiedad")}
          </label>
          <Select
            id="search-type"
            options={propertyTypeOptions}
            value={filters.type}
            onChange={(val) => setFilters({ ...filters, type: val })}
            placeholder={t("client:search.allTypes", "Todos los tipos")}
            className="w-full"
            variant="filled" // Using filled to match the input style
          />
        </div>

        {/* Price Range / Filters Toggle */}
        <div className="md:col-span-1 flex gap-2">
          <div className="flex-1 space-y-1.5 container-input">
            <label htmlFor="search-max-price" className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 ml-1">
              {t("client:search.price", "Precio Máx")}
            </label>
            <div className="relative group">
              <DollarSign
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-green-500 transition-colors z-10"
              />
              <input
                id="search-max-price"
                type="number"
                placeholder={t("client:search.price", "Max...")}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-9 pr-2 text-sm font-semibold text-slate-800 placeholder:text-slate-400 focus:border-green-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-green-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white transition-all"
                value={filters.maxPrice}
                onChange={(e) =>
                  setFilters({ ...filters, maxPrice: e.target.value })
                }
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <div className="invisible text-xs font-bold uppercase">
              Filters
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex h-[46px] w-[46px] items-center justify-center rounded-xl border transition-all ${showFilters ? "bg-cyan-50 border-cyan-200 text-cyan-600 dark:bg-cyan-900/20 dark:border-cyan-700 dark:text-cyan-400" : "bg-slate-50 border-slate-200 text-slate-500 hover:border-slate-300 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400"}`}
            >
              <SlidersHorizontal size={20} />
            </button>
          </div>
        </div>

        {/* Search Button */}
        <div className="md:col-span-1">
          <div className="invisible text-xs font-bold uppercase block mb-1.5">
            Search
          </div>
          <Button
            onClick={handleSearch}
            size="lg"
            className="w-full h-[46px] text-base shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40"
          >
            {t("client:search.button", "Buscar")}
          </Button>
        </div>
      </div>

      {/* Expanded Filters */}
      <AnimatePresence>
        {showFilters && (
          <m.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-slate-100 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-900/50"
          >
            <div className="p-4 sm:p-6 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-1.5 container-input">
                <label htmlFor="search-min-price" className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  {t("client:search.minPrice", "Precio Mínimo")}
                </label>
                <input
                  id="search-min-price"
                  type="number"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
                  value={filters.minPrice}
                  onChange={(e) =>
                    setFilters({ ...filters, minPrice: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1.5 container-select">
                <label htmlFor="search-bedrooms" className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  {t("client:search.bedrooms", "Habitaciones")}
                </label>
                <Select
                  id="search-bedrooms"
                  options={bedroomOptions}
                  value={filters.bedrooms}
                  onChange={(val) => setFilters({ ...filters, bedrooms: val })}
                  placeholder={t("client:search.anyOption", "Any")}
                  size="sm"
                />
              </div>
              <div className="space-y-1.5 container-select">
                <label htmlFor="search-bathrooms" className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  {t("client:search.bathrooms", "Baños")}
                </label>
                <Select
                  id="search-bathrooms"
                  options={bathroomOptions}
                  value={filters.bathrooms}
                  onChange={(val) => setFilters({ ...filters, bathrooms: val })}
                  placeholder={t("client:search.anyOption", "Any")}
                  size="sm"
                />
              </div>
            </div>
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdvancedSearch;
