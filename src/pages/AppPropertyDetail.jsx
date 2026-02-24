import LoadingState from "../components/common/molecules/LoadingState";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  lazy,
  Suspense,
} from "react";
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
  CheckCircle2,
  DollarSign,
  Eye,
  ExternalLink,
  FileText,
  Home,
  Inbox,
  Landmark,
  Loader2,
  MapPin,
  Maximize2,
  Package,
  Pencil,
  Sparkles,
  Star,
  Tag,
  Trash2,
  TrendingUp,
  Users,
  Video,
} from "lucide-react";
import Modal, { ModalFooter } from "../components/common/organisms/Modal";
import Select from "../components/common/atoms/Select/Select";
import Carousel from "../components/common/molecules/Carousel/Carousel";
import { ImageViewerModal } from "../components/common/organisms/ImageViewerModal/ImageViewerModal";
import { propertiesService } from "../services/propertiesService";
import { amenitiesService } from "../services/amenitiesService";
import { staffService } from "../services/staffService";
import { leadsService } from "../services/leadsService";
import { useAuth } from "../hooks/useAuth";
import { hasRoleAtLeast, hasScope } from "../utils/roles";
import { getAmenityIcon } from "../data/amenitiesCatalog";
import { getErrorMessage } from "../utils/errors";
import {
  INTERNAL_ROUTES,
  getInternalEditPropertyRoute,
  getPublicPropertyRoute,
} from "../utils/internalRoutes";
import { formatMoneyWithDenomination } from "../utils/money";

const MapDisplay = lazy(
  () => import("../components/common/molecules/MapDisplay"),
);

/** InfoCard — small labeled metric tile */
const InfoCard = ({ label, value, icon: Icon, accent = false }) => (
  <div
    className={`rounded-xl border px-3 py-2.5 ${
      accent
        ? "border-cyan-200 bg-cyan-50 dark:border-cyan-800/40 dark:bg-cyan-950/30"
        : "border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/50"
    }`}
  >
    <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
      {label}
    </p>
    <p
      className={`mt-1 flex items-center gap-1.5 text-sm font-semibold ${
        accent
          ? "text-cyan-700 dark:text-cyan-300"
          : "text-slate-900 dark:text-slate-100"
      }`}
    >
      {Icon && (
        <Icon
          size={14}
          className={accent ? "text-cyan-500" : "text-slate-500"}
        />
      )}
      {value}
    </p>
  </div>
);

/** StatPill — large centered stat for the metrics grid */
const StatPill = ({ label, value, icon: Icon, color = "slate" }) => {
  const colors = {
    slate: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
    cyan: "bg-cyan-50 text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-300",
    amber:
      "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
    green:
      "bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-300",
  };
  return (
    <div
      className={`flex flex-col items-center justify-center rounded-xl p-3 text-center ${colors[color]}`}
    >
      {Icon && <Icon size={18} className="mb-1 opacity-70" />}
      <p className="text-xl font-bold leading-none">{value}</p>
      <p className="mt-1 text-xs opacity-75">{label}</p>
    </div>
  );
};

/** SectionCard — card container with optional title/icon header */
const SectionCard = ({ title, icon: Icon, children, className = "" }) => (
  <div
    className={`rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800/60 ${className}`}
  >
    {title && (
      <div className="border-b border-slate-100 px-4 py-3 dark:border-slate-700/60">
        <div className="flex items-center gap-2">
          {Icon && <Icon className="h-4 w-4 text-cyan-500" />}
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            {title}
          </h3>
        </div>
      </div>
    )}
    <div className="p-4">{children}</div>
  </div>
);

/** LeadStatusBadge */
const LEAD_STATUS_COLORS = {
  new: "bg-sky-100 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300",
  contacted:
    "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
  closed_won:
    "bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-300",
  closed_lost:
    "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
};
const LeadStatusBadge = ({ status }) => (
  <span
    className={`inline-flex shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${LEAD_STATUS_COLORS[status] || LEAD_STATUS_COLORS.new}`}
  >
    {status}
  </span>
);

/** FieldRow - Generic key/value display row */
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
  const { user } = useAuth();

  const canAssignStaff = useMemo(
    () => hasRoleAtLeast(user?.role, "owner"),
    [user?.role],
  );
  const canReadLeads = useMemo(() => hasScope(user, "leads.read"), [user]);

  const [property, setProperty] = useState(null);
  const [images, setImages] = useState([]);
  const [amenities, setAmenities] = useState([]);
  const [resourceLeads, setResourceLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isImageViewerOpen, setIsImageViewerOpen] = useState(false);
  const [imageViewerIndex, setImageViewerIndex] = useState(0);

  // Staff assignment state (root/owner only)
  const [staffList, setStaffList] = useState([]);
  const [staffLoading, setStaffLoading] = useState(false);
  const [staffSaving, setStaffSaving] = useState(false);
  const [selectedResponsibleId, setSelectedResponsibleId] = useState("");

  const locale = i18n.language === "es" ? "es-MX" : "en-US";

  const loadProperty = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError("");

    try {
      const [doc, gallery] = await Promise.all([
        propertiesService.getById(id),
        propertiesService.listImages(id).catch(() => []),
      ]);

      if (!doc || doc.enabled === false) {
        throw new Error(t("appPropertyDetailPage.errors.notFound"));
      }

      const [propertyAmenities, leadsResp] = await Promise.all([
        amenitiesService.getBySlugs(doc.amenities || []).catch(() => []),
        canReadLeads
          ? leadsService
              .listMine(null, { resourceId: id })
              .catch(() => ({ documents: [] }))
          : Promise.resolve({ documents: [] }),
      ]);

      setProperty(doc);
      setImages(Array.isArray(gallery) ? gallery : []);
      setAmenities(Array.isArray(propertyAmenities) ? propertyAmenities : []);
      setResourceLeads(leadsResp?.documents || []);
    } catch (err) {
      setError(getErrorMessage(err, t("appPropertyDetailPage.errors.load")));
      setProperty(null);
      setImages([]);
      setAmenities([]);
    } finally {
      setLoading(false);
    }
  }, [id, t, canReadLeads]);

  useEffect(() => {
    loadProperty();
  }, [loadProperty]);

  // Load staff list for assignment (root/owner only)
  const loadStaffList = useCallback(async () => {
    if (!canAssignStaff) return;
    setStaffLoading(true);
    try {
      setStaffList((await staffService.listStaff()) || []);
    } catch {
      setStaffList([]);
    } finally {
      setStaffLoading(false);
    }
  }, [canAssignStaff]);

  useEffect(() => {
    if (canAssignStaff) loadStaffList();
  }, [canAssignStaff, loadStaffList]);

  useEffect(() => {
    setSelectedResponsibleId(property?.ownerUserId || "");
  }, [property?.ownerUserId]);

  const handleSaveResponsibleAgent = async () => {
    if (!property?.$id || staffSaving || !selectedResponsibleId) return;
    setStaffSaving(true);
    try {
      await propertiesService.updateResponsibleAgent(
        property.$id,
        selectedResponsibleId,
      );
      setProperty((prev) =>
        prev ? { ...prev, ownerUserId: selectedResponsibleId } : prev,
      );
    } catch (err) {
      setError(
        getErrorMessage(
          err,
          t("appPropertyDetailPage.errors.saveResponsible", {
            defaultValue: "No se pudo cambiar el agente responsable.",
          }),
        ),
      );
    } finally {
      setStaffSaving(false);
    }
  };

  const hasResponsibleChanges = useMemo(
    () => (property?.ownerUserId || "") !== selectedResponsibleId,
    [property?.ownerUserId, selectedResponsibleId],
  );

  const formattedPrice = useMemo(() => {
    if (!property) return "-";
    return formatMoneyWithDenomination(property.price || 0, {
      locale,
      currency: property.currency || "MXN",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
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

  const carouselImages = useMemo(() => images.map((img) => img.url), [images]);

  const openViewer = (idx) => {
    setImageViewerIndex(idx);
    setIsImageViewerOpen(true);
  };

  const leadCounts = useMemo(() => {
    const total = resourceLeads.length;
    const newLeads = resourceLeads.filter((l) => l.status === "new").length;
    const won = resourceLeads.filter((l) => l.status === "closed_won").length;
    return { total, newLeads, won };
  }, [resourceLeads]);

  // ── Loading state ─────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <p className="inline-flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
          <Loader2 size={16} className="animate-spin text-cyan-500" />
          <LoadingState text={t("appPropertyDetailPage.loading")} />
        </p>
      </div>
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
  const publicUrl = getPublicPropertyRoute(
    property.slug,
    i18n.resolvedLanguage || i18n.language,
  );

  return (
    <section className="space-y-5">
      {/* ── Header ──────────────────────────────────────── */}
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          {/* Back breadcrumb */}
          <div className="mb-2">
            <Link
              to={INTERNAL_ROUTES.myProperties}
              className="inline-flex items-center gap-1 text-xs text-slate-500 transition hover:text-cyan-600 dark:text-slate-400 dark:hover:text-cyan-400"
            >
              <ArrowLeft size={12} />
              {t("appPropertyDetailPage.actions.backToList")}
            </Link>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 sm:text-2xl">
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
            {property.featured && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
                <Star size={11} className="fill-current" />
                {t("appPropertyDetailPage.featured", "Destacado")}
              </span>
            )}
          </div>

          {/* Price + slug + external link */}
          <div className="mt-1.5 flex flex-wrap items-center gap-3">
            <p className="text-xl font-bold text-cyan-600 dark:text-cyan-400">
              {formattedPrice}
              {property.pricePerUnit && property.pricePerUnit !== "total" && (
                <span className="ml-1 text-sm font-normal text-slate-500">
                  /{" "}
                  {t(
                    `propertyForm.options.pricePerUnit.${property.pricePerUnit}`,
                    { defaultValue: property.pricePerUnit },
                  )}
                </span>
              )}
              {property.priceNegotiable && (
                <span className="ml-2 text-xs font-medium text-amber-600 dark:text-amber-400">
                  ({t("propertyForm.fields.priceNegotiable")})
                </span>
              )}
            </p>
            <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
              <span>/{property.slug}</span>
              {property.status === "published" && (
                <a
                  href={publicUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium text-cyan-600 transition hover:bg-cyan-50 dark:text-cyan-400 dark:hover:bg-cyan-900/20"
                >
                  <ExternalLink size={12} />
                  {t("appPropertyDetailPage.viewPublic", "Ver en landing")}
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <Link
            to={getInternalEditPropertyRoute(property.$id)}
            className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-lg bg-cyan-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-cyan-700"
          >
            <Pencil size={14} />
            {t("myPropertiesPage.actions.edit")}
          </Link>
          <button
            type="button"
            onClick={() => setIsDeleteModalOpen(true)}
            className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-lg border border-red-300 px-3 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-50 dark:border-red-900/60 dark:text-red-300 dark:hover:bg-red-950/40"
          >
            <Trash2 size={14} />
            {t("myPropertiesPage.actions.delete")}
          </button>
        </div>
      </header>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200">
          {error}
        </div>
      ) : null}

      {/* ── Two-column layout ──────────────────────────── */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3 lg:items-start">
        {/* ── Left column (main content) ──────────────── */}
        <div className="space-y-5 lg:col-span-2">
          {/* Carousel with push/slide animation */}
          {carouselImages.length > 0 ? (
            <div className="overflow-hidden rounded-2xl shadow-sm">
              <Carousel
                images={carouselImages}
                showArrows
                showCounter
                showDots={carouselImages.length <= 12}
                variant="default"
                aspectRatio="16/9"
                className="rounded-2xl"
                onImageClick={(_, idx) => openViewer(idx)}
              />
            </div>
          ) : (
            <div className="flex aspect-video w-full items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 text-slate-400 dark:border-slate-700 dark:bg-slate-800/40">
              <div className="text-center">
                <Camera size={32} className="mx-auto mb-2 opacity-40" />
                <p className="text-sm">
                  {t("appPropertyDetailPage.noImages", "Sin imágenes")}
                </p>
              </div>
            </div>
          )}

          {/* Description */}
          <SectionCard
            title={t("appPropertyDetailPage.sections.description")}
            icon={FileText}
          >
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700 dark:text-slate-300">
              {property.description || t("appPropertyDetailPage.noDescription")}
            </p>
          </SectionCard>

          {/* Features */}
          <SectionCard
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
              {property.parkingSpaces != null && (
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
          </SectionCard>

          {/* Rental Terms (rent only) */}
          {isRent && (
            <SectionCard
              title={t("appPropertyDetailPage.sections.rentalTerms")}
              icon={FileText}
            >
              <div className="space-y-1">
                {property.rentPeriod && (
                  <FieldRow
                    label={t("propertyForm.fields.rentPeriod")}
                    value={t(
                      `propertyForm.options.rentPeriod.${property.rentPeriod}`,
                      { defaultValue: property.rentPeriod },
                    )}
                  />
                )}
                {property.furnished && (
                  <FieldRow
                    label={t("propertyForm.fields.furnished")}
                    value={t(
                      `propertyForm.options.furnished.${property.furnished}`,
                      { defaultValue: property.furnished },
                    )}
                  />
                )}
                <FieldRow
                  label={t("propertyForm.fields.petsAllowed")}
                  value={
                    property.petsAllowed ? t("common.yes") : t("common.no")
                  }
                />
              </div>
            </SectionCard>
          )}

          {/* Vacation Rules (vacation_rental only) */}
          {isVacationRental && (
            <SectionCard
              title={t("appPropertyDetailPage.sections.vacationRules")}
              icon={CalendarCheck}
            >
              <div className="space-y-1">
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
                      { defaultValue: property.furnished },
                    )}
                  />
                )}
                <FieldRow
                  label={t("propertyForm.fields.petsAllowed")}
                  value={
                    property.petsAllowed ? t("common.yes") : t("common.no")
                  }
                />
              </div>
            </SectionCard>
          )}

          {/* Amenities */}
          {amenities.length > 0 && (
            <SectionCard
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
                        <IconComponent size={15} className="text-cyan-500" />
                      )}
                      <span className="text-slate-700 dark:text-slate-300">
                        {i18n.language === "es"
                          ? amenity.name_es
                          : amenity.name_en}
                      </span>
                    </div>
                  );
                })}
              </div>
            </SectionCard>
          )}

          {/* Location */}
          <SectionCard
            title={t("appPropertyDetailPage.sections.location")}
            icon={MapPin}
          >
            <div className="space-y-1">
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
            </div>
            {property.latitude && property.longitude && (
              <div className="mt-4">
                <Suspense
                  fallback={
                    <div className="flex h-50 items-center justify-center rounded-xl bg-slate-100 text-sm text-slate-500 dark:bg-slate-800">
                      <LoadingState text={t("common.loading")} />
                    </div>
                  }
                >
                  <MapDisplay
                    latitude={property.latitude}
                    longitude={property.longitude}
                    label={`${property.city || ""}, ${property.state || ""}`}
                    height="200px"
                    className="rounded-xl"
                  />
                </Suspense>
              </div>
            )}
          </SectionCard>

          {/* Multimedia */}
          {(property.videoUrl || property.virtualTourUrl) && (
            <SectionCard
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
                        className="break-all text-cyan-600 hover:underline dark:text-cyan-400"
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
                        className="break-all text-cyan-600 hover:underline dark:text-cyan-400"
                      >
                        {property.virtualTourUrl}
                      </a>
                    }
                  />
                )}
              </div>
            </SectionCard>
          )}

          {/* Leads mini-list — shown on mobile/tablet only (sidebar shows it on desktop) */}
          {canReadLeads && resourceLeads.length > 0 && (
            <div className="lg:hidden">
              <SectionCard
                title={t("leadsPage.title", "Leads")}
                icon={Landmark}
              >
                <div className="space-y-2">
                  {resourceLeads.slice(0, 5).map((lead) => (
                    <div
                      key={lead.$id}
                      className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-700"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-100">
                          {lead.name || lead.email}
                        </p>
                        <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                          {lead.email}
                        </p>
                      </div>
                      <LeadStatusBadge status={lead.status} />
                    </div>
                  ))}
                  {resourceLeads.length > 5 && (
                    <Link
                      to={`${INTERNAL_ROUTES.leads}?search=${encodeURIComponent(property.title)}`}
                      className="block text-center text-xs text-cyan-600 hover:underline dark:text-cyan-400"
                    >
                      {t("dashboardPage.recentLeads.viewAll")} (
                      {resourceLeads.length})
                    </Link>
                  )}
                </div>
              </SectionCard>
            </div>
          )}
        </div>

        {/* ── Right sidebar ─────────────────────────────── */}
        <div className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          {/* Quick info card */}
          <SectionCard>
            <div className="grid grid-cols-2 gap-2">
              <InfoCard
                label={t("propertyForm.fields.propertyType")}
                value={t(
                  `propertyForm.options.propertyType.${property.propertyType}`,
                  { defaultValue: property.propertyType },
                )}
                icon={Building2}
              />
              <InfoCard
                label={t("propertyForm.fields.operationType")}
                value={t(
                  `propertyForm.options.operationType.${property.operationType}`,
                  { defaultValue: property.operationType },
                )}
                icon={Tag}
              />
              <InfoCard
                label={t("myPropertiesPage.table.location")}
                value={property.city || "—"}
                icon={MapPin}
              />
              <InfoCard
                label={t("propertyForm.fields.currency")}
                value={property.currency || "MXN"}
                icon={DollarSign}
                accent
              />
            </div>
            <div className="mt-3 space-y-0">
              <FieldRow
                label={t("myPropertiesPage.table.createdAt")}
                value={formatDate(property.$createdAt)}
              />
              <FieldRow
                label={t("myPropertiesPage.table.updatedAt")}
                value={formatDate(property.$updatedAt)}
              />
            </div>
          </SectionCard>

          {/* Statistics */}
          <SectionCard
            title={t("appPropertyDetailPage.sections.statistics")}
            icon={TrendingUp}
          >
            <div className="grid grid-cols-3 gap-2">
              <StatPill
                label={t("myPropertiesPage.table.views")}
                value={Number(property.views || 0)}
                icon={Eye}
                color="slate"
              />
              <StatPill
                label={t("myPropertiesPage.table.leads")}
                value={Number(property.contactCount || 0)}
                icon={Landmark}
                color="cyan"
              />
              <StatPill
                label={t("myPropertiesPage.table.reservations")}
                value={Number(property.reservationCount || 0)}
                icon={CalendarClock}
                color="amber"
              />
            </div>
          </SectionCard>

          {/* Leads panel (desktop only) */}
          {canReadLeads && (
            <SectionCard title={t("leadsPage.title", "Leads")} icon={Landmark}>
              {resourceLeads.length === 0 ? (
                <div className="flex flex-col items-center py-4 text-center text-sm text-slate-400 dark:text-slate-500">
                  <Inbox size={24} className="mb-2 opacity-50" />
                  <p>{t("leadsPage.empty", "No hay leads aún.")}</p>
                </div>
              ) : (
                <>
                  {/* Counts */}
                  <div className="mb-3 grid grid-cols-3 gap-2">
                    <StatPill
                      label={t("leadsPage.metrics.total")}
                      value={leadCounts.total}
                      icon={Users}
                      color="slate"
                    />
                    <StatPill
                      label={t("leadsPage.metrics.new")}
                      value={leadCounts.newLeads}
                      icon={Sparkles}
                      color="cyan"
                    />
                    <StatPill
                      label={t("leadsPage.metrics.won")}
                      value={leadCounts.won}
                      icon={CheckCircle2}
                      color="green"
                    />
                  </div>
                  {/* Recent leads */}
                  <div className="space-y-2">
                    {resourceLeads.slice(0, 4).map((lead) => (
                      <div
                        key={lead.$id}
                        className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-700"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-medium text-slate-800 dark:text-slate-100">
                            {lead.name || lead.email}
                          </p>
                          <p className="truncate text-[11px] text-slate-500">
                            {formatDate(lead.$createdAt)}
                          </p>
                        </div>
                        <LeadStatusBadge status={lead.status} />
                      </div>
                    ))}
                    {resourceLeads.length > 4 && (
                      <Link
                        to={`${INTERNAL_ROUTES.leads}?search=${encodeURIComponent(property.title)}`}
                        className="block text-center text-xs text-cyan-600 hover:underline dark:text-cyan-400"
                      >
                        {t("dashboardPage.recentLeads.viewAll")} (
                        {resourceLeads.length})
                      </Link>
                    )}
                  </div>
                </>
              )}
            </SectionCard>
          )}

          {/* Responsible Agent Assignment (root/owner only) */}
          {canAssignStaff && (
            <SectionCard
              title={t("appPropertyDetailPage.sections.responsibleAgent", {
                defaultValue: "Agente Responsable",
              })}
              icon={Users}
            >
              <p className="mb-3 text-xs text-slate-600 dark:text-slate-400">
                {t("appPropertyDetailPage.responsibleAgent.description", {
                  defaultValue:
                    "Selecciona el usuario responsable de gestionar esta propiedad.",
                })}
              </p>

              {staffLoading ? (
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <Loader2 size={14} className="animate-spin" />
                  <LoadingState text={t("common.loading")} />
                </div>
              ) : staffList.length === 0 ? (
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {t("appPropertyDetailPage.responsibleAgent.noStaff", {
                    defaultValue: "No hay usuarios staff registrados.",
                  })}
                </p>
              ) : (
                <>
                  <Select
                    value={selectedResponsibleId}
                    onChange={(val) => setSelectedResponsibleId(val)}
                    disabled={staffSaving}
                    placeholder={t(
                      "appPropertyDetailPage.responsibleAgent.selectPlaceholder",
                      { defaultValue: "Selecciona un agente..." },
                    )}
                    options={staffList.map((staff) => ({
                      value: staff.$id,
                      label: `${staff.firstName} ${staff.lastName}${staff.$id === property?.ownerUserId ? ` (${t("appPropertyDetailPage.responsibleAgent.current", { defaultValue: "Actual" })})` : ""}`,
                      description: `${staff.email} • ${staff.role}`,
                    }))}
                  />
                  {hasResponsibleChanges && (
                    <div className="mt-3">
                      <button
                        type="button"
                        onClick={handleSaveResponsibleAgent}
                        disabled={staffSaving || !selectedResponsibleId}
                        className="inline-flex w-full min-h-9 items-center justify-center gap-2 rounded-lg bg-sky-600 px-3 text-sm font-semibold text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {staffSaving && (
                          <Loader2 size={14} className="animate-spin" />
                        )}
                        {t("appPropertyDetailPage.responsibleAgent.save", {
                          defaultValue: "Cambiar responsable",
                        })}
                      </button>
                    </div>
                  )}
                </>
              )}
            </SectionCard>
          )}
        </div>
      </div>

      {/* ── Delete Modal ─────────────────────────────────── */}
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

      {/* ── Image Viewer Modal ───────────────────────────── */}
      <ImageViewerModal
        isOpen={isImageViewerOpen}
        onClose={() => setIsImageViewerOpen(false)}
        images={images.map((img) => img.url)}
        initialIndex={imageViewerIndex}
        alt={property?.title || "Property image"}
        showDownload={true}
        downloadFilename={`${property?.slug || "property"}-${imageViewerIndex + 1}.jpg`}
      />
    </section>
  );
};

export default AppPropertyDetail;
