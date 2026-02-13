import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  ArrowLeft,
  Bath,
  BedDouble,
  CalendarClock,
  Eye,
  ImageIcon,
  Landmark,
  Loader2,
  MapPin,
  Pencil,
  Tag,
  Trash2,
  Users,
} from "lucide-react";
import Modal, { ModalFooter } from "../components/common/organisms/Modal";
import { propertiesService } from "../services/propertiesService";
import { getErrorMessage } from "../utils/errors";
import {
  INTERNAL_ROUTES,
  getInternalEditPropertyRoute,
} from "../utils/internalRoutes";

const AppPropertyDetail = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();

  const [property, setProperty] = useState(null);
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

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

      setProperty(doc);
      setImages(Array.isArray(gallery) ? gallery : []);
    } catch (err) {
      setError(getErrorMessage(err, t("appPropertyDetailPage.errors.load")));
      setProperty(null);
      setImages([]);
    } finally {
      setLoading(false);
    }
  }, [id, t]);

  useEffect(() => {
    loadProperty();
  }, [loadProperty]);

  const heroImage = useMemo(() => {
    return (
      images[0]?.url ||
      property?.mainImageUrl ||
      property?.coverImageUrl ||
      property?.thumbnailUrl ||
      ""
    );
  }, [
    images,
    property?.coverImageUrl,
    property?.mainImageUrl,
    property?.thumbnailUrl,
  ]);

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

  return (
    <section className="space-y-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
            {property.title}
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            {property.slug} -{" "}
            {t(`propertyStatus.${property.status}`, {
              defaultValue: property.status,
            })}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            to={INTERNAL_ROUTES.myProperties}
            className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <ArrowLeft size={14} />
            {t("appPropertyDetailPage.actions.backToList")}
          </Link>
          <Link
            to={getInternalEditPropertyRoute(property.$id)}
            className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-sky-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-sky-700"
          >
            <Pencil size={14} />
            {t("myPropertiesPage.actions.edit")}
          </Link>
          <button
            type="button"
            onClick={() => setIsDeleteModalOpen(true)}
            className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-red-300 px-3 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-50 dark:border-red-900/60 dark:text-red-300 dark:hover:bg-red-950/40"
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

      <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
        <div className="grid gap-0 lg:grid-cols-[1.1fr_minmax(0,1fr)]">
          <div className="relative min-h-64 bg-slate-100 dark:bg-slate-800">
            {heroImage ? (
              <img
                src={heroImage}
                alt={property.title}
                className="h-full w-full object-cover"
                loading="lazy"
              />
            ) : (
              <div className="grid h-full min-h-64 place-items-center text-sm text-slate-500 dark:text-slate-300">
                {t("appPropertyDetailPage.noImage")}
              </div>
            )}
          </div>

          <div className="space-y-4 p-4 sm:p-5">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/50">
                <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-300">
                  {t("myPropertiesPage.table.price")}
                </p>
                <p className="mt-1 text-lg font-semibold text-slate-900 dark:text-slate-100">
                  {formattedPrice}
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/50">
                <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-300">
                  {t("myPropertiesPage.table.location")}
                </p>
                <p className="mt-1 inline-flex items-center gap-1 font-semibold text-slate-900 dark:text-slate-100">
                  <MapPin size={14} />
                  {property.city}, {property.state}
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/50">
                <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-300">
                  {t("myPropertiesPage.table.type")}
                </p>
                <p className="mt-1 inline-flex items-center gap-1 font-semibold text-slate-900 dark:text-slate-100">
                  <Tag size={14} />
                  {t(`homePage.enums.propertyType.${property.propertyType}`, {
                    defaultValue: property.propertyType,
                  })}
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/50">
                <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-300">
                  {t("myPropertiesPage.table.operation")}
                </p>
                <p className="mt-1 font-semibold text-slate-900 dark:text-slate-100">
                  {t(`homePage.enums.operation.${property.operationType}`, {
                    defaultValue: property.operationType,
                  })}
                </p>
              </div>
            </div>

            <div className="grid gap-2 sm:grid-cols-3">
              <div className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700">
                <BedDouble size={14} />
                <span>{property.bedrooms || 0}</span>
              </div>
              <div className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700">
                <Bath size={14} />
                <span>{property.bathrooms || 0}</span>
              </div>
              <div className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700">
                <Users size={14} />
                <span>{property.maxGuests || 0}</span>
              </div>
            </div>

            <div className="grid gap-2 sm:grid-cols-3">
              <div className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700">
                <Eye size={14} />
                <span>
                  {t("myPropertiesPage.table.views")}:{" "}
                  {Number(property.views || 0)}
                </span>
              </div>
              <div className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700">
                <Landmark size={14} />
                <span>
                  {t("myPropertiesPage.table.leads")}:{" "}
                  {Number(property.contactCount || 0)}
                </span>
              </div>
              <div className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700">
                <CalendarClock size={14} />
                <span>
                  {t("myPropertiesPage.table.reservations")}:{" "}
                  {Number(property.reservationCount || 0)}
                </span>
              </div>
            </div>

            <div className="grid gap-2 text-xs text-slate-500 dark:text-slate-300 sm:grid-cols-2">
              <p>
                {t("myPropertiesPage.table.createdAt")}:{" "}
                {formatDate(property.$createdAt)}
              </p>
              <p>
                {t("myPropertiesPage.table.updatedAt")}:{" "}
                {formatDate(property.$updatedAt)}
              </p>
            </div>
          </div>
        </div>
      </article>

      <article className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
        <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
          {t("appPropertyDetailPage.descriptionTitle")}
        </h2>
        <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-300">
          {property.description || t("appPropertyDetailPage.noDescription")}
        </p>
      </article>

      {images.length > 0 ? (
        <article className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
          <h2 className="mb-3 inline-flex items-center gap-2 text-base font-semibold text-slate-900 dark:text-slate-100">
            <ImageIcon size={16} />
            {t("appPropertyDetailPage.galleryTitle")}
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {images.map((image) => (
              <div
                key={image.$id || image.fileId}
                className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800"
              >
                <div className="relative aspect-video">
                  <img
                    src={image.url}
                    alt={image.altText || property.title}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                </div>
              </div>
            ))}
          </div>
        </article>
      ) : null}

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
    </section>
  );
};

export default AppPropertyDetail;
