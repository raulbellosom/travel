import { useEffect, useMemo, useState, lazy, Suspense, useRef } from "react";
import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  MapPin,
  BedDouble,
  Bath,
  Landmark,
  Building2,
  Phone,
  Mail,
  Send,
  Star,
  ShieldCheck,
  Car,
  Layers,
  Calendar,
  Users,
  Clock,
  PawPrint,
  Sofa,
  Camera,
  ArrowRight,
  MessageCircle,
  ChevronRight,
  Home,
  Ruler,
  CalendarDays,
} from "lucide-react";
import env from "../env";
import { getAmenityIcon } from "../data/amenitiesCatalog";
import { amenitiesService } from "../services/amenitiesService";
import { propertiesService } from "../services/propertiesService";
import { leadsService } from "../services/leadsService";
import { executeJsonFunction } from "../utils/functions";
import { getErrorMessage } from "../utils/errors";
import Carousel from "../components/common/molecules/Carousel/Carousel";
import ImageViewerModal from "../components/common/organisms/ImageViewerModal";
import { usePageSeo } from "../hooks/usePageSeo";

const MapDisplay = lazy(
  () => import("../components/common/molecules/MapDisplay"),
);

const FALLBACK_BANNERS = [
  "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=2000&q=80",
  "https://images.unsplash.com/photo-1613977257368-707ba9348227?auto=format&fit=crop&w=2000&q=80",
  "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=2000&q=80",
];

/* ─── Helpers ──────────────────────────────────────────── */

const isSale = (op) => op === "sale";
const isRent = (op) => op === "rent";
const isVacation = (op) => op === "vacation_rental";

const getRentPeriodSuffix = (period, t) => {
  const map = {
    monthly: t("client:propertyDetail.price.perMonth"),
    yearly: t("client:propertyDetail.price.perYear"),
    weekly: t("client:propertyDetail.price.perWeek"),
  };
  return map[period] || "";
};

/* ================================================================ */

const PropertyDetail = () => {
  const { t, i18n } = useTranslation();
  const { slug } = useParams();
  const contactRef = useRef(null);
  const [heroSlide, setHeroSlide] = useState(0);

  const [property, setProperty] = useState(null);
  const [owner, setOwner] = useState(null);
  const [images, setImages] = useState([]);
  const [amenities, setAmenities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [leadMessage, setLeadMessage] = useState("");
  const [leadError, setLeadError] = useState("");
  const [imageViewer, setImageViewer] = useState({
    isOpen: false,
    initialIndex: 0,
  });
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });

  const locale = i18n.language === "es" ? "es-MX" : "en-US";

  usePageSeo({
    title: property?.title
      ? `${property.title} | Inmobo`
      : "Inmobo | Detalle de propiedad",
    description: property?.description
      ? String(property.description).slice(0, 155)
      : "Detalle de propiedad con galería, amenidades y contacto.",
    robots: "index, follow",
  });

  /* ─── Data loading ───────────────────────────────────── */

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError("");

    propertiesService
      .getPublicBySlug(slug)
      .then(async (doc) => {
        if (!doc) throw new Error(t("client:propertyDetail.errors.notFound"));

        const [ownerDoc, imageDocs, amenityDocs] = await Promise.all([
          propertiesService.getOwnerProfile(doc.ownerUserId).catch(() => null),
          propertiesService.listImages(doc.$id).catch(() => []),
          amenitiesService.listForProperty(doc.$id).catch(() => []),
        ]);

        if (!mounted) return;
        setProperty(doc);
        setOwner(ownerDoc);
        setImages(imageDocs || []);
        setAmenities(amenityDocs || []);
      })
      .catch((err) => {
        if (!mounted) return;
        setError(getErrorMessage(err, t("client:propertyDetail.errors.load")));
      })
      .finally(() => {
        if (!mounted) return;
        setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [slug, t]);

  useEffect(() => {
    if (!property || !env.appwrite.functions.propertyViewCounter) return;
    executeJsonFunction(env.appwrite.functions.propertyViewCounter, {
      propertyId: property.$id,
    }).catch(() => {});
  }, [property]);

  /* ─── Computed values ────────────────────────────────── */

  const opType = property?.operationType;

  const amount = useMemo(() => {
    if (!property) return "";
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: property.currency || "MXN",
      maximumFractionDigits: 0,
    }).format(property.price || 0);
  }, [locale, property]);

  const priceSuffix = useMemo(() => {
    if (!property) return "";
    if (isVacation(opType)) return t("client:propertyDetail.price.perNight");
    if (isRent(opType)) return getRentPeriodSuffix(property.rentPeriod, t);
    return "";
  }, [opType, property, t]);

  const priceLabel = useMemo(() => {
    if (!property) return "";
    if (isSale(opType)) return t("client:propertyDetail.price.sale");
    if (isRent(opType)) return t("client:propertyDetail.price.rent");
    return t("client:propertyDetail.price.vacationRental");
  }, [opType, property, t]);

  const ownerName = useMemo(() => {
    const name = `${owner?.firstName || ""} ${owner?.lastName || ""}`.trim();
    return name || owner?.email || t("client:propertyDetail.owner.unavailable");
  }, [owner, t]);

  const gallery = useMemo(() => {
    if (images.length > 0)
      return images.map((item) => item.url).filter(Boolean);
    return [
      property?.mainImageUrl,
      property?.coverImageUrl,
      property?.thumbnailUrl,
      ...FALLBACK_BANNERS,
    ].filter(Boolean);
  }, [images, property]);

  /* ─── Mobile hero auto-slide ─────────────────────────── */
  useEffect(() => {
    if (gallery.length <= 1) return;
    const total = Math.min(gallery.length, 6);
    const timer = setInterval(() => {
      setHeroSlide((prev) => (prev + 1) % total);
    }, 4000);
    return () => clearInterval(timer);
  }, [gallery.length]);

  const operationBadge = useMemo(() => {
    if (!property) return { color: "bg-cyan-500", label: "" };
    if (isSale(opType))
      return {
        color: "bg-emerald-500",
        label: t("client:common.enums.operation.sale"),
      };
    if (isRent(opType))
      return {
        color: "bg-blue-500",
        label: t("client:common.enums.operation.rent"),
      };
    return {
      color: "bg-amber-500",
      label: t("client:common.enums.operation.vacation_rental"),
    };
  }, [opType, property, t]);

  /* ─── Handlers ───────────────────────────────────────── */

  const openImageViewer = (_url, index) =>
    setImageViewer({ isOpen: true, initialIndex: index });

  const closeImageViewer = () =>
    setImageViewer({ isOpen: false, initialIndex: 0 });

  const scrollToContact = () =>
    contactRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });

  const onSubmitLead = async (event) => {
    event.preventDefault();
    if (!property) return;
    setSending(true);
    setLeadMessage("");
    setLeadError("");

    try {
      await leadsService.createPublicLead({
        propertyId: property.$id,
        name: form.name,
        email: form.email,
        phone: form.phone,
        message: form.message,
      });
      setLeadMessage(t("client:propertyDetail.contact.success"));
      setForm({ name: "", email: "", phone: "", message: "" });
    } catch (err) {
      setLeadError(
        getErrorMessage(err, t("client:propertyDetail.contact.errors.send")),
      );
    } finally {
      setSending(false);
    }
  };

  /* ─── Loading / Error states ─────────────────────────── */

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 pt-24 pb-12 sm:px-6 lg:px-8">
        {/* Skeleton hero */}
        <div className="mb-8 grid gap-2 md:grid-cols-[2fr_1fr] md:grid-rows-2">
          <div className="row-span-2 h-80 animate-pulse rounded-2xl bg-slate-200 md:h-105 dark:bg-slate-800" />
          <div className="hidden h-52 animate-pulse rounded-2xl bg-slate-200 md:block dark:bg-slate-800" />
          <div className="hidden h-52 animate-pulse rounded-2xl bg-slate-200 md:block dark:bg-slate-800" />
        </div>
        {/* Skeleton content */}
        <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
          <div className="space-y-4">
            <div className="h-8 w-3/4 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-800" />
            <div className="h-5 w-1/2 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-800" />
            <div className="h-40 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800" />
          </div>
          <div className="hidden space-y-4 lg:block">
            <div className="h-52 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800" />
            <div className="h-40 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-4xl px-4 pt-24 pb-12">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center dark:border-red-900/50 dark:bg-red-950/40">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/40">
            <Home size={24} className="text-red-500" />
          </div>
          <p className="text-lg font-semibold text-red-700 dark:text-red-200">
            {error}
          </p>
          <Link
            to="/"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-red-700"
          >
            {t("client:propertyDetail.backHome")}
          </Link>
        </div>
      </div>
    );
  }

  if (!property) return null;

  /* ─── Render ─────────────────────────────────────────── */

  return (
    <div className="pb-12 md:pt-20">
      {/* ── Mobile Hero Cover (auto-sliding) ──────────────── */}
      <section className="relative md:hidden">
        <div className="relative aspect-[4/3] w-full overflow-hidden">
          {/* Slides */}
          {gallery.slice(0, 6).map((url, i) => (
            <img
              key={url + i}
              src={url || FALLBACK_BANNERS[0]}
              alt={`${property.title} ${i + 1}`}
              className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${
                i === heroSlide ? "opacity-100" : "opacity-0"
              }`}
              loading={i === 0 ? "eager" : "lazy"}
            />
          ))}

          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/30 to-transparent" />

          {/* Bottom overlay content */}
          <div className="absolute right-0 bottom-0 left-0 flex flex-col gap-3 px-4 pb-4">
            {/* Title row: badge + title */}
            <div>
              <span
                className={`${operationBadge.color} mb-1.5 inline-flex rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-white shadow-lg`}
              >
                {operationBadge.label}
              </span>
              <h1 className="text-lg font-bold leading-snug text-white drop-shadow-lg sm:text-xl">
                {property.title}
              </h1>
              <p className="mt-1 flex items-center gap-1.5 text-[13px] text-white/90">
                <MapPin size={13} className="shrink-0" />
                {[property.neighborhood, property.city, property.state]
                  .filter(Boolean)
                  .join(", ")}
              </p>
            </div>

            {/* Gallery button - own row, no overlap */}
            <button
              type="button"
              onClick={() => openImageViewer(gallery[heroSlide], heroSlide)}
              className="inline-flex w-fit items-center gap-2 self-end rounded-full bg-white/90 px-3.5 py-1.5 text-xs font-semibold text-slate-800 shadow-lg backdrop-blur-sm transition active:scale-95"
            >
              <Camera size={14} />
              {gallery.length} {t("client:propertyDetail.viewAllPhotos")}
            </button>
          </div>

          {/* Slide indicators */}
          {gallery.length > 1 && (
            <div className="absolute right-0 bottom-1.5 left-0 flex justify-center gap-1.5">
              {gallery.slice(0, 6).map((_, i) => (
                <span
                  key={i}
                  className={`h-1 rounded-full transition-all duration-300 ${
                    i === heroSlide ? "w-4 bg-white" : "w-1 bg-white/50"
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── Breadcrumb ────────────────────────────────── */}
      <nav
        aria-label="breadcrumb"
        className="mx-auto max-w-7xl px-4 py-3 sm:px-6 md:py-4 lg:px-8"
      >
        <ol className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400">
          <li>
            <Link
              to="/"
              className="transition hover:text-cyan-600 dark:hover:text-cyan-400"
            >
              {t("client:propertyDetail.breadcrumb.home")}
            </Link>
          </li>
          <ChevronRight size={14} className="shrink-0" />
          <li>
            <Link
              to="/"
              className="transition hover:text-cyan-600 dark:hover:text-cyan-400"
            >
              {t("client:propertyDetail.breadcrumb.properties")}
            </Link>
          </li>
          <ChevronRight size={14} className="shrink-0" />
          <li className="truncate font-medium text-slate-800 dark:text-slate-200">
            {property.title}
          </li>
        </ol>
      </nav>

      {/* ── Desktop Image Gallery Grid ──────────────────── */}
      <section className="mx-auto hidden max-w-7xl px-4 sm:px-6 md:block lg:px-8">
        <div className="relative overflow-hidden rounded-2xl md:rounded-3xl">
          {/* Desktop: grid gallery */}
          <div className="grid md:grid-cols-4 md:grid-rows-2 md:gap-2">
            {/* Main large image */}
            <button
              type="button"
              className="col-span-2 row-span-2 cursor-pointer overflow-hidden focus:outline-none focus-visible:ring-4 focus-visible:ring-cyan-500/50"
              style={{ aspectRatio: "4/3" }}
              onClick={() => openImageViewer(gallery[0], 0)}
              aria-label={t("client:propertyDetail.viewAllPhotos")}
            >
              <img
                src={gallery[0] || FALLBACK_BANNERS[0]}
                alt={property.title}
                className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
                loading="eager"
              />
            </button>

            {/* Secondary images */}
            {gallery.slice(1, 5).map((url, i) => (
              <button
                key={url + i}
                type="button"
                className="relative cursor-pointer overflow-hidden focus:outline-none focus-visible:ring-4 focus-visible:ring-cyan-500/50"
                style={{ aspectRatio: "4/3" }}
                onClick={() => openImageViewer(url, i + 1)}
              >
                <img
                  src={url}
                  alt={`${property.title} ${i + 2}`}
                  className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
                  loading="lazy"
                />
                {/* "View all photos" overlay on last image */}
                {i === 3 && gallery.length > 5 && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 transition hover:bg-black/40">
                    <span className="flex items-center gap-2 text-sm font-semibold text-white">
                      <Camera size={18} />+{gallery.length - 5}
                    </span>
                  </div>
                )}
              </button>
            ))}
          </div>

          {/* View all photos button (absolute) */}
          <button
            type="button"
            onClick={() => openImageViewer(gallery[0], 0)}
            className="absolute bottom-4 right-4 hidden items-center gap-2 rounded-xl bg-white/90 px-4 py-2 text-sm font-medium text-slate-800 shadow-lg backdrop-blur-sm transition hover:bg-white md:inline-flex dark:bg-slate-900/90 dark:text-slate-100 dark:hover:bg-slate-900"
          >
            <Camera size={16} />
            {t("client:propertyDetail.viewAllPhotos")} ({gallery.length})
          </button>
        </div>
      </section>

      {/* ── Main Content ────────────────────────────────── */}
      <div className="mx-auto mt-6 max-w-7xl px-4 sm:px-6 lg:mt-8 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
          {/* ── Left Column ─────────────────────────────── */}
          <div className="min-w-0 space-y-8">
            {/* Title + Location + Badge row (desktop only – on mobile it's in the hero) */}
            <div className="hidden space-y-3 md:block">
              <div className="flex flex-wrap items-center gap-3">
                <span
                  className={`${operationBadge.color} inline-flex rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider text-white`}
                >
                  {operationBadge.label}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
                  <ShieldCheck size={13} />
                  {t("client:propertyDetail.verifiedListing")}
                </span>
              </div>

              <h1 className="text-2xl font-bold leading-tight text-slate-900 sm:text-3xl lg:text-4xl dark:text-white">
                {property.title}
              </h1>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-600 dark:text-slate-300">
                <span className="inline-flex items-center gap-1.5">
                  <MapPin
                    size={16}
                    className="text-cyan-600 dark:text-cyan-400"
                  />
                  {[property.neighborhood, property.city, property.state]
                    .filter(Boolean)
                    .join(", ")}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Building2
                    size={16}
                    className="text-cyan-600 dark:text-cyan-400"
                  />
                  {t(
                    `client:common.enums.propertyType.${property.propertyType}`,
                    { defaultValue: property.propertyType },
                  )}
                </span>
              </div>
            </div>

            {/* Mobile: verified badge (title/location already in hero) */}
            <div className="flex items-center gap-2 md:hidden">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
                <ShieldCheck size={13} />
                {t("client:propertyDetail.verifiedListing")}
              </span>
            </div>

            {/* ── Price bar (mobile only – on desktop it's in sidebar) ── */}
            <div className="lg:hidden">
              <PriceCard
                t={t}
                amount={amount}
                priceSuffix={priceSuffix}
                priceLabel={priceLabel}
                property={property}
                opType={opType}
                scrollToContact={scrollToContact}
              />
            </div>

            {/* ── Quick Stats Grid ──────────────────────── */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              <StatCard
                icon={BedDouble}
                label={t("client:propertyDetail.stats.bedrooms")}
                value={property.bedrooms}
              />
              <StatCard
                icon={Bath}
                label={t("client:propertyDetail.stats.bathrooms")}
                value={property.bathrooms}
              />
              {property.totalArea > 0 && (
                <StatCard
                  icon={Ruler}
                  label={t("client:propertyDetail.stats.totalArea")}
                  value={`${property.totalArea} m²`}
                />
              )}
              {property.builtArea > 0 && (
                <StatCard
                  icon={Landmark}
                  label={t("client:propertyDetail.stats.builtArea")}
                  value={`${property.builtArea} m²`}
                />
              )}
              {property.parkingSpaces > 0 && (
                <StatCard
                  icon={Car}
                  label={t("client:propertyDetail.stats.parkingSpaces")}
                  value={property.parkingSpaces}
                />
              )}
              {property.floors > 0 && !isVacation(opType) && (
                <StatCard
                  icon={Layers}
                  label={t("client:propertyDetail.stats.floors")}
                  value={property.floors}
                />
              )}
              {property.yearBuilt && isSale(opType) && (
                <StatCard
                  icon={CalendarDays}
                  label={t("client:propertyDetail.stats.yearBuilt")}
                  value={property.yearBuilt}
                />
              )}
              {isVacation(opType) && property.maxGuests > 0 && (
                <StatCard
                  icon={Users}
                  label={t("client:propertyDetail.stats.maxGuests")}
                  value={property.maxGuests}
                />
              )}
            </div>

            {/* ── Description ───────────────────────────── */}
            <section>
              <SectionHeading>
                {t("client:propertyDetail.descriptionTitle")}
              </SectionHeading>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700 sm:text-base dark:text-slate-300">
                {property.description}
              </p>
            </section>

            {/* ── Type-specific details ─────────────────── */}
            {(isRent(opType) || isVacation(opType)) && (
              <section className="rounded-2xl border border-slate-200 bg-linear-to-br from-slate-50 to-white p-5 sm:p-6 dark:border-slate-700 dark:from-slate-900 dark:to-slate-800/60">
                <SectionHeading className="mt-0!">
                  {isRent(opType)
                    ? t("client:propertyDetail.sections.rentalTerms")
                    : t("client:propertyDetail.sections.vacationRules")}
                </SectionHeading>

                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  {/* Rental-specific */}
                  {isRent(opType) && (
                    <>
                      {property.rentPeriod && (
                        <DetailRow
                          icon={Calendar}
                          label={t("client:propertyDetail.rental.period")}
                          value={t(
                            `client:propertyDetail.rental.${property.rentPeriod}`,
                          )}
                        />
                      )}
                      {property.furnished && (
                        <DetailRow
                          icon={Sofa}
                          label={t("client:propertyDetail.stats.furnished")}
                          value={t(
                            `client:propertyDetail.furnishedStatus.${property.furnished}`,
                          )}
                        />
                      )}
                      <DetailRow
                        icon={PawPrint}
                        label={t("client:propertyDetail.stats.petsAllowed")}
                        value={
                          property.petsAllowed
                            ? t("client:propertyDetail.petsStatus.allowed")
                            : t("client:propertyDetail.petsStatus.notAllowed")
                        }
                      />
                    </>
                  )}

                  {/* Vacation-specific */}
                  {isVacation(opType) && (
                    <>
                      {property.maxGuests > 0 && (
                        <DetailRow
                          icon={Users}
                          label={t(
                            "client:propertyDetail.vacation.maxGuestsLabel",
                          )}
                          value={`${property.maxGuests} ${t("client:propertyDetail.vacation.guests")}`}
                        />
                      )}
                      {property.checkInTime && (
                        <DetailRow
                          icon={Clock}
                          label={t("client:propertyDetail.vacation.checkIn")}
                          value={property.checkInTime}
                        />
                      )}
                      {property.checkOutTime && (
                        <DetailRow
                          icon={Clock}
                          label={t("client:propertyDetail.vacation.checkOut")}
                          value={property.checkOutTime}
                        />
                      )}
                      {property.minStayNights > 0 && (
                        <DetailRow
                          icon={Calendar}
                          label={t("client:propertyDetail.vacation.minStay")}
                          value={`${property.minStayNights} ${property.minStayNights === 1 ? t("client:propertyDetail.vacation.night") : t("client:propertyDetail.vacation.nights")}`}
                        />
                      )}
                      {property.maxStayNights > 0 && (
                        <DetailRow
                          icon={Calendar}
                          label={t("client:propertyDetail.vacation.maxStay")}
                          value={`${property.maxStayNights} ${t("client:propertyDetail.vacation.nights")}`}
                        />
                      )}
                      {property.furnished && (
                        <DetailRow
                          icon={Sofa}
                          label={t("client:propertyDetail.stats.furnished")}
                          value={t(
                            `client:propertyDetail.furnishedStatus.${property.furnished}`,
                          )}
                        />
                      )}
                      <DetailRow
                        icon={PawPrint}
                        label={t("client:propertyDetail.stats.petsAllowed")}
                        value={
                          property.petsAllowed
                            ? t("client:propertyDetail.petsStatus.allowed")
                            : t("client:propertyDetail.petsStatus.notAllowed")
                        }
                      />
                    </>
                  )}
                </div>
              </section>
            )}

            {/* Sale-specific features */}
            {isSale(opType) && (property.furnished || property.yearBuilt) && (
              <section className="rounded-2xl border border-slate-200 bg-linear-to-br from-slate-50 to-white p-5 sm:p-6 dark:border-slate-700 dark:from-slate-900 dark:to-slate-800/60">
                <SectionHeading className="mt-0!">
                  {t("client:propertyDetail.sections.features")}
                </SectionHeading>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  {property.yearBuilt && (
                    <DetailRow
                      icon={CalendarDays}
                      label={t("client:propertyDetail.stats.yearBuilt")}
                      value={property.yearBuilt}
                    />
                  )}
                  {property.furnished && (
                    <DetailRow
                      icon={Sofa}
                      label={t("client:propertyDetail.stats.furnished")}
                      value={t(
                        `client:propertyDetail.furnishedStatus.${property.furnished}`,
                      )}
                    />
                  )}
                </div>
              </section>
            )}

            {/* ── Amenities ─────────────────────────────── */}
            {amenities.length > 0 && (
              <section>
                <SectionHeading>
                  {t("client:propertyDetail.amenitiesTitle")}
                </SectionHeading>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
                  {amenities.map((amenity) => (
                    <div
                      key={amenity.$id}
                      className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm transition hover:border-cyan-300 hover:shadow-sm dark:border-slate-700 dark:bg-slate-800/60 dark:hover:border-cyan-700"
                    >
                      <span
                        aria-hidden="true"
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-base dark:bg-slate-700"
                      >
                        {getAmenityIcon(amenity)}
                      </span>
                      <span className="line-clamp-2 text-slate-700 dark:text-slate-200">
                        {i18n.language === "es"
                          ? amenity.name_es || amenity.name_en || amenity.slug
                          : amenity.name_en || amenity.name_es || amenity.slug}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* ── Location Map ──────────────────────────── */}
            {property.latitude && property.longitude && (
              <section>
                <SectionHeading icon={MapPin}>
                  {t("client:propertyDetail.sections.location")}
                </SectionHeading>
                <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700">
                  <Suspense
                    fallback={
                      <div className="flex h-80 items-center justify-center bg-slate-100 text-sm text-slate-500 dark:bg-slate-800">
                        {t("client:common.loading")}
                      </div>
                    }
                  >
                    <MapDisplay
                      latitude={property.latitude}
                      longitude={property.longitude}
                      label={`${property.city || ""}, ${property.state || ""}`}
                      height="320px"
                    />
                  </Suspense>
                </div>
                <p className="mt-3 flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                  <MapPin size={14} className="text-cyan-600" />
                  {[
                    property.streetAddress,
                    property.neighborhood,
                    property.city,
                    property.state,
                    property.postalCode,
                  ]
                    .filter(Boolean)
                    .join(", ")}
                </p>
              </section>
            )}

            {/* ── Gallery (extra photos carousel) ─────── */}
            {gallery.length > 1 && (
              <section>
                <SectionHeading icon={Camera}>
                  {t("client:propertyDetail.galleryTitle")}
                </SectionHeading>
                <Carousel
                  images={gallery}
                  showArrows
                  showCounter
                  showDots
                  variant="default"
                  className="rounded-2xl"
                  onImageClick={openImageViewer}
                />
              </section>
            )}
          </div>

          {/* ── Right Sidebar ───────────────────────────── */}
          <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
            {/* ── Price + CTA card (desktop only) ─────── */}
            <div className="hidden lg:block">
              <PriceCard
                t={t}
                amount={amount}
                priceSuffix={priceSuffix}
                priceLabel={priceLabel}
                property={property}
                opType={opType}
                scrollToContact={scrollToContact}
              />
            </div>

            {/* ── Agent Card ────────────────────────────── */}
            <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                {t("client:propertyDetail.owner.title")}
              </h2>

              <div className="flex items-center gap-4">
                {/* Avatar */}
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-cyan-500 to-blue-600 text-lg font-bold text-white">
                  {(owner?.firstName?.[0] || "A").toUpperCase()}
                  {(owner?.lastName?.[0] || "").toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-lg font-semibold text-slate-900 dark:text-white">
                    {ownerName}
                  </p>
                  <p className="mt-0.5 inline-flex items-center gap-1 text-xs font-medium text-amber-600 dark:text-amber-400">
                    <Star size={12} fill="currentColor" />
                    {t("client:propertyDetail.owner.rating")}
                  </p>
                </div>
              </div>

              <div className="mt-4 space-y-2 border-t border-slate-100 pt-4 text-sm dark:border-slate-800">
                {(owner?.phone || owner?.whatsappNumber) && (
                  <a
                    href={`tel:${owner?.phoneCountryCode || ""}${owner?.phone || owner?.whatsappNumber || ""}`}
                    className="flex items-center gap-2.5 text-slate-600 transition hover:text-cyan-600 dark:text-slate-300 dark:hover:text-cyan-400"
                  >
                    <Phone size={15} />
                    {owner?.phoneCountryCode || ""}{" "}
                    {owner?.phone || owner?.whatsappNumber}
                  </a>
                )}
                {owner?.whatsappNumber && (
                  <a
                    href={`https://wa.me/${(owner?.whatsappCountryCode || "").replace("+", "")}${owner.whatsappNumber}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2.5 text-slate-600 transition hover:text-emerald-600 dark:text-slate-300 dark:hover:text-emerald-400"
                  >
                    <MessageCircle size={15} />
                    {t("client:propertyDetail.owner.whatsapp")}
                  </a>
                )}
                {owner?.email && (
                  <a
                    href={`mailto:${owner.email}`}
                    className="flex items-center gap-2.5 text-slate-600 transition hover:text-cyan-600 dark:text-slate-300 dark:hover:text-cyan-400"
                  >
                    <Mail size={15} />
                    <span className="truncate">{owner.email}</span>
                  </a>
                )}
              </div>
            </article>

            {/* ── Contact Form ──────────────────────────── */}
            <form
              ref={contactRef}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900"
              onSubmit={onSubmitLead}
            >
              <h2 className="mb-4 text-base font-semibold text-slate-900 dark:text-white">
                {t("client:propertyDetail.contact.title")}
              </h2>

              <div className="space-y-3">
                <InputField
                  label={t("client:propertyDetail.contact.fields.name")}
                  required
                  value={form.name}
                  onChange={(v) => setForm((p) => ({ ...p, name: v }))}
                />
                <InputField
                  label={t("client:propertyDetail.contact.fields.email")}
                  type="email"
                  required
                  value={form.email}
                  onChange={(v) => setForm((p) => ({ ...p, email: v }))}
                />
                <InputField
                  label={t(
                    "client:propertyDetail.contact.fields.phoneOptional",
                  )}
                  value={form.phone}
                  onChange={(v) => setForm((p) => ({ ...p, phone: v }))}
                />
                <label className="grid gap-1.5 text-sm">
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    {t("client:propertyDetail.contact.fields.message")}
                  </span>
                  <textarea
                    required
                    rows={4}
                    value={form.message}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, message: e.target.value }))
                    }
                    className="rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:focus:border-cyan-400"
                  />
                </label>
              </div>

              {leadError && (
                <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
                  {leadError}
                </p>
              )}
              {leadMessage && (
                <p className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                  {leadMessage}
                </p>
              )}

              <button
                type="submit"
                disabled={sending}
                className="mt-4 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
              >
                <Send size={15} />
                {sending
                  ? t("client:propertyDetail.contact.actions.sending")
                  : t("client:propertyDetail.contact.actions.send")}
              </button>
            </form>
          </aside>
        </div>
      </div>

      {/* ── Image Viewer Modal ──────────────────────────── */}
      <ImageViewerModal
        isOpen={imageViewer.isOpen}
        onClose={closeImageViewer}
        images={gallery}
        initialIndex={imageViewer.initialIndex}
        alt={property.title}
        showDownload
      />
    </div>
  );
};

/* ─── Sub-components ──────────────────────────────────── */

/** Reusable stat card for quick stats grid */
function StatCard({ icon: Icon, label, value }) {
  if (value === undefined || value === null || value === 0) return null;
  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3.5 transition hover:border-slate-300 hover:shadow-sm dark:border-slate-700 dark:bg-slate-800/60 dark:hover:border-slate-600">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-cyan-50 text-cyan-600 dark:bg-cyan-950/40 dark:text-cyan-400">
        <Icon size={20} />
      </div>
      <div>
        <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
        <p className="text-sm font-bold text-slate-900 dark:text-white">
          {value}
        </p>
      </div>
    </div>
  );
}

/** Section heading */
function SectionHeading({ children, icon: Icon, className = "" }) {
  return (
    <h2
      className={`mb-4 flex items-center gap-2 text-lg font-bold text-slate-900 sm:text-xl dark:text-white ${className}`}
    >
      {Icon && <Icon size={20} className="text-cyan-600 dark:text-cyan-400" />}
      {children}
    </h2>
  );
}

/** Detail row for type-specific sections */
function DetailRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-white/60 px-4 py-3 dark:bg-slate-800/40">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-cyan-50 text-cyan-600 dark:bg-cyan-950/40 dark:text-cyan-400">
        <Icon size={18} />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
        <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">
          {value}
        </p>
      </div>
    </div>
  );
}

/** Reusable input field */
function InputField({
  label,
  type = "text",
  required = false,
  value,
  onChange,
}) {
  return (
    <label className="grid gap-1.5 text-sm">
      <span className="font-medium text-slate-700 dark:text-slate-300">
        {label}
      </span>
      <input
        type={type}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="min-h-11 rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:focus:border-cyan-400"
      />
    </label>
  );
}

/** Price + CTA card – adapts per operationType */
function PriceCard({
  t,
  amount,
  priceSuffix,
  priceLabel,
  property,
  opType,
  scrollToContact,
}) {
  const ctaKey = isSale(opType)
    ? "sale"
    : isRent(opType)
      ? "rent"
      : "vacationRental";

  // Background and accent colors per type
  const styles = {
    sale: {
      bg: "border-emerald-200 bg-linear-to-br from-emerald-50 to-white dark:border-emerald-900/50 dark:from-emerald-950/30 dark:to-slate-900",
      btn: "bg-emerald-600 hover:bg-emerald-500 dark:bg-emerald-500 dark:hover:bg-emerald-400",
      priceColor: "text-emerald-700 dark:text-emerald-300",
    },
    rent: {
      bg: "border-blue-200 bg-linear-to-br from-blue-50 to-white dark:border-blue-900/50 dark:from-blue-950/30 dark:to-slate-900",
      btn: "bg-blue-600 hover:bg-blue-500 dark:bg-blue-500 dark:hover:bg-blue-400",
      priceColor: "text-blue-700 dark:text-blue-300",
    },
    vacationRental: {
      bg: "border-amber-200 bg-linear-to-br from-amber-50 to-white dark:border-amber-900/50 dark:from-amber-950/30 dark:to-slate-900",
      btn: "bg-linear-to-r from-cyan-500 to-sky-600 hover:from-cyan-400 hover:to-sky-500",
      priceColor: "text-amber-700 dark:text-amber-300",
    },
  };

  const s = styles[ctaKey];

  return (
    <article className={`rounded-2xl border p-5 shadow-sm ${s.bg}`}>
      {/* Price */}
      <div className="mb-1">
        <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
          {priceLabel}
        </p>
        <p className={`mt-1 text-3xl font-extrabold ${s.priceColor}`}>
          {amount}
          {priceSuffix && (
            <span className="text-lg font-semibold opacity-70">
              {priceSuffix}
            </span>
          )}
        </p>
        {property.priceNegotiable && (
          <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">
            {t("client:propertyDetail.price.negotiable")}
          </p>
        )}
      </div>

      {/* Hint */}
      <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
        {t(`client:propertyDetail.cta.${ctaKey}.hint`)}
      </p>

      {/* CTA Button */}
      {isVacation(opType) ? (
        <Link
          to={`/reservar/${property.slug}`}
          className={`mt-4 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold text-white transition ${s.btn}`}
        >
          {t(`client:propertyDetail.cta.${ctaKey}.button`)}
          <ArrowRight size={16} />
        </Link>
      ) : (
        <button
          type="button"
          onClick={scrollToContact}
          className={`mt-4 inline-flex min-h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold text-white transition ${s.btn}`}
        >
          {t(`client:propertyDetail.cta.${ctaKey}.button`)}
          <ArrowRight size={16} />
        </button>
      )}
    </article>
  );
}

export default PropertyDetail;
