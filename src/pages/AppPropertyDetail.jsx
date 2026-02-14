import { useCallback, useEffect, useMemo, useState, lazy, Suspense } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  ArrowLeft,
  Bath,
  BedDouble,
  Building2,
  Calendar,
  CalendarCheck,
  CalendarClock,
  Camera,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  Eye,
  ExternalLink,
  FileText,
  Home,
  Landmark,
  Loader2,
  MapPin,
  Maximize2,
  Package,
  Pencil,
  Sparkles,
  Tag,
  Trash2,
  TrendingUp,
  Users,
  Video,
} from "lucide-react";
import Modal, { ModalFooter } from "../components/common/organisms/Modal";
import { ImageViewerModal } from "../components/common/organisms/ImageViewerModal/ImageViewerModal";
import { propertiesService } from "../services/propertiesService";
import { amenitiesService } from "../services/amenitiesService";
import { getAmenityIcon } from "../data/amenitiesCatalog";
import { getErrorMessage } from "../utils/errors";
import {
  INTERNAL_ROUTES,
  getInternalEditPropertyRoute,
  getPublicPropertyRoute,
} from "../utils/internalRoutes";

const MapDisplay = lazy(() => import("../components/common/molecules/MapDisplay"));

/**
 * InfoCard - Displays a labeled value in a card.
 */
const InfoCard = ({ label, value, icon: Icon }) => (
  <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 dark:border-slate-700 dark:bg-slate-800/50">
    <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
      {label}
    </p>
    <p className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-slate-900 dark:text-slate-100">
      {Icon && <Icon size={14} className="text-slate-500" />}
      {value}
    </p>
  </div>
);

/**
 * DetailSection - Collapsible section wrapper for organizing related fields.
 */
const DetailSection = ({ title, icon: Icon, children }) => (
  <div className="rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800/60">
    <div className="border-b border-slate-100 px-4 py-3 dark:border-slate-700">
      <div className="flex items-center gap-2">
        {Icon && <Icon className="h-4 w-4 text-cyan-500" />}
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
          {title}
        </h3>
      </div>
    </div>
    <div className="p-4">{children}</div>
  </div>
);

/**
 * FieldRow - Generic field display row.
 */
const FieldRow = ({ label, value }) => (
  <div className="flex items-start justify-between gap-4 border-b border-slate-100 py-2 last:border-0 dark:border-slate-700">
    <span className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
      {label}
    </span>
    <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
      {value || "—"}
    </span>
  </div>
);

const AppPropertyDetail = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();

  const [property, setProperty] = useState(null);
  const [images, setImages] = useState([]);
  const [amenities, setAmenities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isImageViewerOpen, setIsImageViewerOpen] = useState(false);

  const locale = i18n.language === "es" ? "es-MX" : "en-US";

  const loadProperty = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError("");

    try {
      const [doc, gallery, amenitiesData] = await Promise.all([
        propertiesService.getById(id),
        propertiesService.listImages(id).catch(() => []),
        amenitiesService.listForProperty(id).catch(() => []),
      ]);

      if (!doc || doc.enabled === false) {
        throw new Error(t("appPropertyDetailPage.errors.notFound"));
      }

      setProperty(doc);
      setImages(Array.isArray(gallery) ? gallery : []);
      setAmenities(Array.isArray(amenitiesData) ? amenitiesData : []);
    } catch (err) {
      setError(getErrorMessage(err, t("appPropertyDetailPage.errors.load")));
      setProperty(null);
      setImages([]);
      setAmenities([]);
    } finally {
      setLoading(false);
    }
  }, [id, t]);

  useEffect(() => {
    loadProperty();
  }, [loadProperty]);

  const formattedPrice = useMemo(() => {
    if (!property) return "-";
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: property.currency || "MXN",
      maximumFractionDigits: 0,
    }).format(property.price || 0);
  }, [locale, property]);

  const formatDate = useCallback(
    (value) => {
      if (!value) return "-";
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) return "-";
      return new Intl.DateTimeFormat(locale, {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(date);
    },
    [locale],
  );

  const handleDelete = async () => {
    if (!property?.$id || deleting) return;

    setDeleting(true);
    setError("");
    try {
      await propertiesService.softDelete(property.$id);
      setIsDeleteModalOpen(false);
      navigate(INTERNAL_ROUTES.myProperties, { replace: true });
    } catch (err) {
      setError(getErrorMessage(err, t("myPropertiesPage.errors.delete")));
    } finally {
      setDeleting(false);
    }
  };

  const nextImage = () => {
    if (images.length === 0) return;
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    if (images.length === 0) return;
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  if (loading) {
    return (
      <p className="inline-flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
        <Loader2 size={14} className="animate-spin" />
        {t("appPropertyDetailPage.loading")}
      </p>
    );
  }

  if (!property) {
    return (
      <section className="space-y-4">
        {error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200">
            {error}
          </div>
        ) : null}
        <Link
          to={INTERNAL_ROUTES.myProperties}
          className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          <ArrowLeft size={14} />
          {t("appPropertyDetailPage.actions.backToList")}
        </Link>
      </section>
    );
  }

  const isRent = property.operationType === "rent";
  const isVacationRental = property.operationType === "vacation_rental";
  const isSale = property.operationType === "sale";

  return (
    <section className="space-y-4">
      {/* Header */}
      <header className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {property.title}
            </h1>
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                property.status === "published"
                  ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                  : property.status === "draft"
                    ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"
                    : "bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300"
              }`}
            >
              {t(`propertyStatus.${property.status}`, {
                defaultValue: property.status,
              })}
            </span>
          </div>
          <div className="mt-1 flex items-center gap-2">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              /{property.slug}
            </p>
            {property.status === "published" && (
              <a
                href={getPublicPropertyRoute(property.slug)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-cyan-600 transition hover:bg-cyan-50 dark:text-cyan-400 dark:hover:bg-cyan-900/20"
                title={t(
                  "appPropertyDetailPage.viewPublic",
                  "Ver en landing pública",
                )}
              >
                <ExternalLink className="h-3.5 w-3.5" />
                <span>{t("appPropertyDetailPage.viewPublic", "Ver en landing")}</span>
              </a>
            )}
          </div>
          <p className="mt-2 text-2xl font-bold text-cyan-600 dark:text-cyan-400">
            {formattedPrice}
            {property.pricePerUnit && property.pricePerUnit !== "total" && (
              <span className="ml-1 text-sm font-normal text-slate-500">
                /{" "}
                {t(
                  `propertyForm.options.pricePerUnit.${property.pricePerUnit}`,
                  {
                    defaultValue: property.pricePerUnit,
                  },
                )}
              </span>
            )}
            {property.priceNegotiable && (
              <span className="ml-2 text-xs font-medium text-amber-600 dark:text-amber-400">
                ({t("propertyForm.fields.priceNegotiable")})
              </span>
            )}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            to={INTERNAL_ROUTES.myProperties}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <ArrowLeft size={16} />
            {t("appPropertyDetailPage.actions.backToList")}
          </Link>
          <Link
            to={getInternalEditPropertyRoute(property.$id)}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-cyan-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-cyan-700"
          >
            <Pencil size={16} />
            {t("myPropertiesPage.actions.edit")}
          </Link>
          <button
            type="button"
            onClick={() => setIsDeleteModalOpen(true)}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-red-300 px-4 py-2.5 text-sm font-semibold text-red-700 transition hover:bg-red-50 dark:border-red-900/60 dark:text-red-300 dark:hover:bg-red-950/40"
          >
            <Trash2 size={16} />
            {t("myPropertiesPage.actions.delete")}
          </button>
        </div>
      </header>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200">
          {error}
        </div>
      ) : null}

      {/* Image Carousel */}
      {images.length > 0 && (
        <div className="space-y-3">
          {/* Main Image */}
          <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 dark:border-slate-700 dark:bg-slate-800">
            <div className="relative flex items-center justify-center bg-slate-50 dark:bg-slate-900" style={{ minHeight: "400px", maxHeight: "500px" }}>
              <img
                src={images[currentImageIndex]?.url}
                alt={images[currentImageIndex]?.altText || property.title}
                className="h-full w-full cursor-pointer object-contain"
                style={{ maxHeight: "500px" }}
                onClick={() => setIsImageViewerOpen(true)}
              />
              {/* Zoom overlay */}
              <button
                type="button"
                onClick={() => setIsImageViewerOpen(true)}
                className="absolute right-3 top-3 rounded-full bg-black/50 p-2 text-white opacity-0 transition hover:bg-black/70 group-hover:opacity-100"
                aria-label={t("appPropertyDetailPage.zoomImage", "Ver imagen completa")}
              >
                <Maximize2 size={18} />
              </button>
              {/* Navigation arrows */}
              {images.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={prevImage}
                    className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white transition hover:bg-black/70"
                    aria-label="Previous image"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <button
                    type="button"
                    onClick={nextImage}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white transition hover:bg-black/70"
                    aria-label="Next image"
                  >
                    <ChevronRight size={20} />
                  </button>
                </>
              )}
              {/* Counter */}
              <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-black/50 px-3 py-1.5">
                <Camera size={12} className="text-white" />
                <span className="text-xs font-medium text-white">
                  {currentImageIndex + 1} / {images.length}
                </span>
              </div>
            </div>
          </div>

          {/* Thumbnail Strip */}
          {images.length > 1 && (
            <div className="scrollbar-thin scrollbar-track-slate-100 scrollbar-thumb-slate-300 flex gap-2 overflow-x-auto pb-2 dark:scrollbar-track-slate-800 dark:scrollbar-thumb-slate-600">
              {images.map((image, idx) => (
                <button
                  key={image.$id || idx}
                  type="button"
                  onClick={() => setCurrentImageIndex(idx)}
                  className={`shrink-0 overflow-hidden rounded-lg border-2 transition ${
                    idx === currentImageIndex
                      ? "border-cyan-500 ring-2 ring-cyan-500/30"
                      : "border-slate-200 hover:border-slate-300 dark:border-slate-700 dark:hover:border-slate-600"
                  }`}
                  style={{ width: "100px", height: "75px" }}
                >
                  <img
                    src={image.url}
                    alt={image.altText || `Thumbnail ${idx + 1}`}
                    className="h-full w-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Quick Info Grid */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <InfoCard
          label={t("propertyForm.fields.propertyType")}
          value={t(
            `propertyForm.options.propertyType.${property.propertyType}`,
            {
              defaultValue: property.propertyType,
            },
          )}
          icon={Building2}
        />
        <InfoCard
          label={t("propertyForm.fields.operationType")}
          value={t(
            `propertyForm.options.operationType.${property.operationType}`,
            {
              defaultValue: property.operationType,
            },
          )}
          icon={Tag}
        />
        <InfoCard
          label={t("myPropertiesPage.table.location")}
          value={`${property.city}, ${property.state}`}
          icon={MapPin}
        />
        <InfoCard
          label={t("propertyForm.fields.currency")}
          value={property.currency || "MXN"}
          icon={DollarSign}
        />
      </div>

      {/* Description Section */}
      <DetailSection
        title={t("appPropertyDetailPage.sections.description")}
        icon={FileText}
      >
        <p className="whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-300">
          {property.description || t("appPropertyDetailPage.noDescription")}
        </p>
      </DetailSection>

      {/* Location Details */}
      <DetailSection
        title={t("appPropertyDetailPage.sections.location")}
        icon={MapPin}
      >
        <div className="space-y-2">
          <FieldRow
            label={t("propertyForm.fields.country")}
            value={property.country}
          />
          <FieldRow
            label={t("propertyForm.fields.state")}
            value={property.state}
          />
          <FieldRow
            label={t("propertyForm.fields.city")}
            value={property.city}
          />
          {property.neighborhood && (
            <FieldRow
              label={t("propertyForm.fields.neighborhood")}
              value={property.neighborhood}
            />
          )}
          {property.streetAddress && (
            <FieldRow
              label={t("propertyForm.fields.streetAddress")}
              value={property.streetAddress}
            />
          )}
          {property.postalCode && (
            <FieldRow
              label={t("propertyForm.fields.postalCode")}
              value={property.postalCode}
            />
          )}
          {(property.latitude || property.longitude) && (
            <FieldRow
              label={t("propertyForm.fields.coordinates")}
              value={`${property.latitude || 0}, ${property.longitude || 0}`}
            />
          )}
          {property.latitude && property.longitude && (
            <div className="col-span-full mt-2">
              <Suspense
                fallback={
                  <div className="flex h-[220px] items-center justify-center rounded-xl bg-slate-100 text-sm text-slate-500 dark:bg-slate-800">
                    {t("common.loading")}
                  </div>
                }
              >
                <MapDisplay
                  latitude={property.latitude}
                  longitude={property.longitude}
                  label={`${property.city || ""}, ${property.state || ""}`}
                  height="220px"
                  className="rounded-xl"
                />
              </Suspense>
            </div>
          )}
        </div>
      </DetailSection>

      {/* Features Section */}
      <DetailSection
        title={t("appPropertyDetailPage.sections.features")}
        icon={Home}
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <InfoCard
            label={t("propertyForm.fields.bedrooms")}
            value={property.bedrooms || 0}
            icon={BedDouble}
          />
          <InfoCard
            label={t("propertyForm.fields.bathrooms")}
            value={property.bathrooms || 0}
            icon={Bath}
          />
          {property.parkingSpaces !== undefined &&
            property.parkingSpaces !== null && (
              <InfoCard
                label={t("propertyForm.fields.parkingSpaces")}
                value={property.parkingSpaces}
                icon={Package}
              />
            )}
          {property.totalArea && (
            <InfoCard
              label={t("propertyForm.fields.totalArea")}
              value={`${property.totalArea} m²`}
              icon={Maximize2}
            />
          )}
          {property.builtArea && (
            <InfoCard
              label={t("propertyForm.fields.builtArea")}
              value={`${property.builtArea} m²`}
              icon={Building2}
            />
          )}
          {property.floors && (
            <InfoCard
              label={t("propertyForm.fields.floors")}
              value={property.floors}
              icon={Building2}
            />
          )}
          {property.yearBuilt && (
            <InfoCard
              label={t("propertyForm.fields.yearBuilt")}
              value={property.yearBuilt}
              icon={Calendar}
            />
          )}
          {isVacationRental && property.maxGuests && (
            <InfoCard
              label={t("propertyForm.fields.maxGuests")}
              value={property.maxGuests}
              icon={Users}
            />
          )}
        </div>
      </DetailSection>

      {/* Rental Terms (rent only) */}
      {isRent && (
        <DetailSection
          title={t("appPropertyDetailPage.sections.rentalTerms")}
          icon={FileText}
        >
          <div className="space-y-2">
            {property.rentPeriod && (
              <FieldRow
                label={t("propertyForm.fields.rentPeriod")}
                value={t(
                  `propertyForm.options.rentPeriod.${property.rentPeriod}`,
                  {
                    defaultValue: property.rentPeriod,
                  },
                )}
              />
            )}
            {property.furnished && (
              <FieldRow
                label={t("propertyForm.fields.furnished")}
                value={t(
                  `propertyForm.options.furnished.${property.furnished}`,
                  {
                    defaultValue: property.furnished,
                  },
                )}
              />
            )}
            <FieldRow
              label={t("propertyForm.fields.petsAllowed")}
              value={property.petsAllowed ? t("common.yes") : t("common.no")}
            />
          </div>
        </DetailSection>
      )}

      {/* Vacation Rules (vacation_rental only) */}
      {isVacationRental && (
        <DetailSection
          title={t("appPropertyDetailPage.sections.vacationRules")}
          icon={CalendarCheck}
        >
          <div className="space-y-2">
            {property.minStayNights && (
              <FieldRow
                label={t("propertyForm.fields.minStayNights")}
                value={`${property.minStayNights} ${property.minStayNights === 1 ? t("common.night") : t("common.nights")}`}
              />
            )}
            {property.maxStayNights && (
              <FieldRow
                label={t("propertyForm.fields.maxStayNights")}
                value={`${property.maxStayNights} ${property.maxStayNights === 1 ? t("common.night") : t("common.nights")}`}
              />
            )}
            {property.checkInTime && (
              <FieldRow
                label={t("propertyForm.fields.checkInTime")}
                value={property.checkInTime}
              />
            )}
            {property.checkOutTime && (
              <FieldRow
                label={t("propertyForm.fields.checkOutTime")}
                value={property.checkOutTime}
              />
            )}
            {property.furnished && (
              <FieldRow
                label={t("propertyForm.fields.furnished")}
                value={t(
                  `propertyForm.options.furnished.${property.furnished}`,
                  {
                    defaultValue: property.furnished,
                  },
                )}
              />
            )}
            <FieldRow
              label={t("propertyForm.fields.petsAllowed")}
              value={property.petsAllowed ? t("common.yes") : t("common.no")}
            />
          </div>
        </DetailSection>
      )}

      {/* Amenities */}
      {amenities.length > 0 && (
        <DetailSection
          title={t("appPropertyDetailPage.sections.amenities")}
          icon={Sparkles}
        >
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {amenities.map((amenity) => {
              const IconComponent = getAmenityIcon(amenity.slug);
              return (
                <div
                  key={amenity.$id}
                  className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700"
                >
                  {IconComponent && (
                    <IconComponent size={16} className="text-cyan-500" />
                  )}
                  <span className="text-slate-700 dark:text-slate-300">
                    {i18n.language === "es" ? amenity.name_es : amenity.name_en}
                  </span>
                </div>
              );
            })}
          </div>
        </DetailSection>
      )}

      {/* Multimedia */}
      {(property.videoUrl || property.virtualTourUrl) && (
        <DetailSection
          title={t("appPropertyDetailPage.sections.multimedia")}
          icon={Video}
        >
          <div className="space-y-2">
            {property.videoUrl && (
              <FieldRow
                label={t("propertyForm.fields.videoUrl")}
                value={
                  <a
                    href={property.videoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-cyan-600 hover:underline dark:text-cyan-400"
                  >
                    {property.videoUrl}
                  </a>
                }
              />
            )}
            {property.virtualTourUrl && (
              <FieldRow
                label={t("propertyForm.fields.virtualTourUrl")}
                value={
                  <a
                    href={property.virtualTourUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-cyan-600 hover:underline dark:text-cyan-400"
                  >
                    {property.virtualTourUrl}
                  </a>
                }
              />
            )}
          </div>
        </DetailSection>
      )}

      {/* Statistics */}
      <DetailSection
        title={t("appPropertyDetailPage.sections.statistics")}
        icon={TrendingUp}
      >
        <div className="grid gap-3 sm:grid-cols-3">
          <InfoCard
            label={t("myPropertiesPage.table.views")}
            value={Number(property.views || 0)}
            icon={Eye}
          />
          <InfoCard
            label={t("myPropertiesPage.table.leads")}
            value={Number(property.contactCount || 0)}
            icon={Landmark}
          />
          <InfoCard
            label={t("myPropertiesPage.table.reservations")}
            value={Number(property.reservationCount || 0)}
            icon={CalendarClock}
          />
        </div>
        <div className="mt-3 grid gap-2 text-xs text-slate-500 dark:text-slate-400 sm:grid-cols-2">
          <FieldRow
            label={t("myPropertiesPage.table.createdAt")}
            value={formatDate(property.$createdAt)}
          />
          <FieldRow
            label={t("myPropertiesPage.table.updatedAt")}
            value={formatDate(property.$updatedAt)}
          />
        </div>
      </DetailSection>

      {/* Delete Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          if (!deleting) setIsDeleteModalOpen(false);
        }}
        closeOnBackdrop={!deleting}
        closeOnEscape={!deleting}
        title={t("myPropertiesPage.deleteModal.title")}
        description={t("myPropertiesPage.deleteModal.description", {
          title: property.title,
        })}
        size="sm"
        footer={
          <ModalFooter>
            <button
              type="button"
              onClick={() => setIsDeleteModalOpen(false)}
              disabled={deleting}
              className="inline-flex min-h-10 items-center justify-center rounded-lg border border-slate-300 px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              {t("common.cancel")}
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="inline-flex min-h-10 items-center justify-center rounded-lg bg-red-600 px-3 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {deleting ? (
                <Loader2 size={14} className="mr-2 animate-spin" />
              ) : null}
              {t("myPropertiesPage.deleteModal.confirm")}
            </button>
          </ModalFooter>
        }
      >
        <div className="text-sm text-slate-600 dark:text-slate-400">
          {t("myPropertiesPage.deleteModal.warning", {
            defaultValue:
              "Esta acción desactivará la propiedad para que no sea visible públicamente.",
          })}
        </div>
      </Modal>

      {/* Image Viewer Modal */}
      <ImageViewerModal
        isOpen={isImageViewerOpen}
        onClose={() => setIsImageViewerOpen(false)}
        images={images.map((img) => img.url)}
        initialIndex={currentImageIndex}
        alt={property?.title || "Property image"}
        showDownload={true}
        downloadFilename={`${property?.slug || "property"}-${currentImageIndex + 1}.jpg`}
      />
    </section>
  );
};

export default AppPropertyDetail;
