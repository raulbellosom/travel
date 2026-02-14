import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  MapPin,
  BedDouble,
  Bath,
  Landmark,
  SearchX,
  SlidersHorizontal,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { propertiesService } from "../services/propertiesService";
import { getErrorMessage } from "../utils/errors";
import { usePageSeo } from "../hooks/usePageSeo";
import { Select } from "../components/common";
import EmptyStatePanel from "../components/common/organisms/EmptyStatePanel";
import LandingTemplate from "../components/common/templates/LandingTemplate";

const STOCK_IMAGES = [
  "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=1200&q=80",
];

const getPropertyImage = (property, index) => {
  return (
    property?.mainImageUrl ||
    property?.coverImageUrl ||
    property?.thumbnailUrl ||
    STOCK_IMAGES[index % STOCK_IMAGES.length]
  );
};

const PropertyCard = ({ property, t, locale, index }) => {
  const imageUrl = getPropertyImage(property, index);

  return (
    <article className="group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl dark:border-slate-700 dark:bg-slate-900">
      <div className="relative h-52 overflow-hidden">
        <img
          src={imageUrl}
          alt={property.title || t("listingCard.fallbackTitle")}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/50 via-slate-950/10 to-transparent" />
        <span className="absolute left-3 top-3 rounded-full bg-cyan-500/90 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-white">
          {t(`homePage.enums.operation.${property.operationType}`, {
            defaultValue: property.operationType,
          })}
        </span>
      </div>

      <div className="space-y-4 p-5">
        <header className="space-y-2">
          <h3 className="line-clamp-2 text-lg font-semibold text-slate-900 dark:text-slate-100">
            {property.title}
          </h3>
          <p className="flex items-center gap-1 text-sm text-slate-500 dark:text-slate-300">
            <MapPin size={14} />
            {property.city}, {property.state}
          </p>
        </header>

        <div className="grid grid-cols-3 gap-2 rounded-xl bg-slate-100 p-2 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300">
          <span className="flex items-center gap-1">
            <BedDouble size={14} /> {property.bedrooms || 0}
          </span>
          <span className="flex items-center gap-1">
            <Bath size={14} /> {property.bathrooms || 0}
          </span>
          <span className="flex items-center gap-1">
            <Landmark size={14} /> {property.totalArea || 0}{" "}
            {t("homePage.units.squareMeters")}
          </span>
        </div>

        <div className="flex items-center justify-between gap-3">
          <strong className="text-lg font-bold text-cyan-700 dark:text-cyan-300">
            {new Intl.NumberFormat(locale, {
              style: "currency",
              currency: property.currency || "MXN",
              maximumFractionDigits: 0,
            }).format(property.price || 0)}
          </strong>
          <Link
            to={`/propiedades/${property.slug}`}
            className="inline-flex min-h-11 items-center rounded-xl bg-gradient-to-r from-cyan-500 to-sky-600 px-4 py-2 text-sm font-semibold text-white transition hover:from-cyan-400 hover:to-sky-500"
          >
            {t("homePage.viewDetail")}
          </Link>
        </div>
      </div>
    </article>
  );
};

const Home = () => {
  const { t, i18n } = useTranslation();
  usePageSeo({
    title: "Inmobo | Catalogo de propiedades",
    description: "Explora propiedades para venta, renta y renta vacacional.",
    robots: "index, follow",
  });
  const [searchParams, setSearchParams] = useSearchParams();
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const locale = i18n.language === "es" ? "es-MX" : "en-US";
  const page = Number(searchParams.get("page") || 1);
  const filters = useMemo(
    () => ({
      city: searchParams.get("city") || "",
      propertyType: searchParams.get("type") || "",
      operationType: searchParams.get("operation") || "",
      minPrice: searchParams.get("minPrice") || "",
      maxPrice: searchParams.get("maxPrice") || "",
      bedrooms: searchParams.get("bedrooms") || "",
      sort: searchParams.get("sort") || "recent",
    }),
    [searchParams],
  );

  // Check if any filters are active (excluding default sort)
  const hasActiveFilters = useMemo(() => {
    return !!(
      filters.city ||
      filters.propertyType ||
      filters.operationType ||
      filters.minPrice ||
      filters.maxPrice ||
      filters.bedrooms ||
      (filters.sort && filters.sort !== "recent") ||
      page > 1
    );
  }, [filters, page]);

  // Fetch featured properties for Landing Page
  const [featuredProperties, setFeaturedProperties] = useState([]);

  useEffect(() => {
    // Only fetch featured if we are on the landing view (no filters)
    if (!hasActiveFilters) {
      propertiesService
        .listPublic({
          limit: 6,
          filters: { featured: true, sort: "recent" },
        })
        .then((res) => {
          setFeaturedProperties(res.documents || []);
        })
        .catch(() => {
          // Silent fail for featured - we have fallbacks in the template
        });
    }
  }, [hasActiveFilters]);

  // Show landing page if no filters are active
  if (!hasActiveFilters) {
    return <LandingTemplate featuredProperties={featuredProperties} />;
  }

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError("");

    propertiesService
      .listPublic({
        page,
        limit: 12,
        filters,
      })
      .then((response) => {
        if (!mounted) return;
        setItems(response.documents || []);
        setTotal(response.total || 0);
      })
      .catch((err) => {
        if (!mounted) return;
        setError(
          getErrorMessage(err, i18n.t("homePage.errors.loadProperties")),
        );
      })
      .finally(() => {
        if (!mounted) return;
        setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [filters, page, i18n]);

  const updateFilter = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (!value) next.delete(key);
    else next.set(key, value);
    if (key !== "page") next.set("page", "1");
    setSearchParams(next);
  };

  const totalPages = Math.max(1, Math.ceil(total / 12));

  const propertyTypeOptions = useMemo(
    () => [
      { value: "", label: t("homePage.filters.all") },
      { value: "house", label: t("homePage.enums.propertyType.house") },
      { value: "apartment", label: t("homePage.enums.propertyType.apartment") },
      { value: "land", label: t("homePage.enums.propertyType.land") },
      {
        value: "commercial",
        label: t("homePage.enums.propertyType.commercial"),
      },
      { value: "office", label: t("homePage.enums.propertyType.office") },
      { value: "warehouse", label: t("homePage.enums.propertyType.warehouse") },
    ],
    [t],
  );

  const operationOptions = useMemo(
    () => [
      { value: "", label: t("homePage.filters.allOperations") },
      { value: "sale", label: t("homePage.enums.operation.sale") },
      { value: "rent", label: t("homePage.enums.operation.rent") },
      {
        value: "vacation_rental",
        label: t("homePage.enums.operation.vacation_rental"),
      },
    ],
    [t],
  );

  const sortOptions = useMemo(
    () => [
      { value: "recent", label: t("homePage.sort.recent") },
      { value: "price-asc", label: t("homePage.sort.priceAsc") },
      { value: "price-desc", label: t("homePage.sort.priceDesc") },
    ],
    [t],
  );

  return (
    <div className="pb-12">
      <section className="relative overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=2000&q=80"
          alt="Real estate banner"
          className="h-[380px] w-full object-cover"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/80 via-slate-900/55 to-cyan-700/55" />
        <div className="absolute inset-0">
          <div className="mx-auto flex h-full max-w-7xl items-end px-4 pb-10 sm:px-6 lg:px-8">
            <div className="max-w-2xl space-y-4 text-white">
              <span className="inline-flex rounded-full bg-cyan-500/85 px-3 py-1 text-xs font-semibold uppercase tracking-wide">
                {t("homePage.heroBadge")}
              </span>
              <h1 className="text-4xl font-bold leading-tight sm:text-5xl">
                {t("homePage.catalogTitle")}
              </h1>
              <p className="text-sm text-white/90 sm:text-base">
                {t("homePage.catalogSubtitle")}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="relative z-10 mx-auto -mt-10 max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-xl dark:border-slate-700 dark:bg-slate-900 sm:p-5">
          <div className="mb-4 inline-flex items-center gap-2 rounded-xl bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-700 dark:bg-slate-800 dark:text-slate-200">
            <SlidersHorizontal size={14} /> {t("homePage.filters.title")}
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
            <label className="grid gap-1 text-sm xl:col-span-1">
              <span>{t("homePage.filters.city")}</span>
              <input
                value={filters.city}
                onChange={(event) => updateFilter("city", event.target.value)}
                className="min-h-11 rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 dark:border-slate-600 dark:bg-slate-800"
              />
            </label>

            <label className="grid gap-1 text-sm xl:col-span-1">
              <span>{t("homePage.filters.propertyType")}</span>
              <Select
                value={filters.propertyType}
                onChange={(value) => updateFilter("type", value)}
                options={propertyTypeOptions}
                size="md"
              />
            </label>

            <label className="grid gap-1 text-sm xl:col-span-1">
              <span>{t("homePage.filters.operation")}</span>
              <Select
                value={filters.operationType}
                onChange={(value) => updateFilter("operation", value)}
                options={operationOptions}
                size="md"
              />
            </label>

            <label className="grid gap-1 text-sm xl:col-span-1">
              <span>{t("homePage.filters.minPrice")}</span>
              <input
                type="number"
                min="0"
                value={filters.minPrice}
                onChange={(event) =>
                  updateFilter("minPrice", event.target.value)
                }
                className="min-h-11 rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 dark:border-slate-600 dark:bg-slate-800"
              />
            </label>

            <label className="grid gap-1 text-sm xl:col-span-1">
              <span>{t("homePage.filters.maxPrice")}</span>
              <input
                type="number"
                min="0"
                value={filters.maxPrice}
                onChange={(event) =>
                  updateFilter("maxPrice", event.target.value)
                }
                className="min-h-11 rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 dark:border-slate-600 dark:bg-slate-800"
              />
            </label>

            <label className="grid gap-1 text-sm xl:col-span-1">
              <span>{t("homePage.filters.sort")}</span>
              <Select
                value={filters.sort}
                onChange={(value) => updateFilter("sort", value)}
                options={sortOptions}
                size="md"
              />
            </label>
          </div>
        </div>
      </section>

      <section className="mx-auto mt-6 max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-4 flex flex-wrap gap-2">
          {["sale", "rent", "vacation_rental"].map((operationKey) => (
            <button
              key={operationKey}
              type="button"
              onClick={() =>
                updateFilter(
                  "operation",
                  filters.operationType === operationKey ? "" : operationKey,
                )
              }
              className={`inline-flex min-h-9 items-center rounded-full px-3 py-1 text-xs font-semibold transition ${
                filters.operationType === operationKey
                  ? "bg-cyan-500 text-white"
                  : "bg-slate-200 text-slate-700 hover:bg-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              }`}
            >
              {t(`homePage.enums.operation.${operationKey}`)}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="text-sm text-slate-600 dark:text-slate-300">
            {t("homePage.loading")}
          </p>
        ) : null}

        {error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200">
            {error}
          </div>
        ) : null}

        {!loading && !error && items.length === 0 ? (
          <EmptyStatePanel
            icon={SearchX}
            title={t("homePage.emptyFiltered")}
            description={t("homePage.catalogSubtitle")}
          />
        ) : null}

        {!loading && !error && items.length > 0 ? (
          <>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {items.map((property, index) => (
                <PropertyCard
                  key={property.$id}
                  property={property}
                  t={t}
                  locale={locale}
                  index={index}
                />
              ))}
            </div>

            <div className="mt-8 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-600 dark:text-slate-300">
              <span>
                {t("homePage.pagination.pageOf", { page, totalPages })}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => updateFilter("page", String(page - 1))}
                  className="min-h-11 rounded-xl border border-slate-300 px-3 py-2 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-600"
                >
                  {t("homePage.pagination.previous")}
                </button>
                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => updateFilter("page", String(page + 1))}
                  className="min-h-11 rounded-xl border border-slate-300 px-3 py-2 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-600"
                >
                  {t("homePage.pagination.next")}
                </button>
              </div>
            </div>
          </>
        ) : null}
      </section>
    </div>
  );
};

export default Home;
