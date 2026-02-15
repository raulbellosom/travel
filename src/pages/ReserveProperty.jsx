import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { AlertCircle, CalendarDays, CreditCard, Users } from "lucide-react";
import Carousel from "../components/common/molecules/Carousel/Carousel";
import ImageViewerModal from "../components/common/organisms/ImageViewerModal";
import DateRangePicker from "../components/common/molecules/DateRangePicker";
import { Select } from "../components/common";
import { propertiesService } from "../services/propertiesService";
import { reservationsService } from "../services/reservationsService";
import { useAuth } from "../hooks/useAuth";
import { getErrorMessage } from "../utils/errors";
import { usePageSeo } from "../hooks/usePageSeo";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=2000&q=80";

const formatCurrency = (value, currency, locale) =>
  new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currency || "MXN",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

const ReserveProperty = () => {
  const { t, i18n } = useTranslation();
  const { slug } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [property, setProperty] = useState(null);
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [imageViewer, setImageViewer] = useState({
    isOpen: false,
    initialIndex: 0,
  });
  const [form, setForm] = useState({
    dateRange: { startDate: null, endDate: null },
    guestCount: 1,
    guestName: "",
    specialRequests: "",
    provider: "stripe",
  });

  const locale = i18n.language === "en" ? "en-US" : "es-MX";
  usePageSeo({
    title: property?.title
      ? `${property.title} | Reservar`
      : "Inmobo | Reservar propiedad",
    description:
      "Flujo de reserva con seleccion de fechas, huespedes y pago seguro.",
    robots: "index, follow",
  });

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError("");

    propertiesService
      .getPublicBySlug(slug)
      .then(async (doc) => {
        if (!doc) {
          throw new Error(t("reservePropertyPage.errors.notFound"));
        }

        const gallery = await propertiesService
          .listImages(doc.$id)
          .catch(() => []);
        if (!mounted) return;
        setProperty(doc);
        setImages(gallery || []);
      })
      .catch((err) => {
        if (!mounted) return;
        setError(getErrorMessage(err, t("reservePropertyPage.errors.load")));
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [slug, t]);

  const galleryUrls = useMemo(() => {
    const urls = (images || []).map((item) => item.url).filter(Boolean);
    if (urls.length > 0) return urls;
    return [
      property?.mainImageUrl,
      property?.coverImageUrl,
      FALLBACK_IMAGE,
    ].filter(Boolean);
  }, [images, property]);

  const openImageViewer = (imageUrl, index) => {
    setImageViewer({ isOpen: true, initialIndex: index });
  };

  const closeImageViewer = () => {
    setImageViewer({ isOpen: false, initialIndex: 0 });
  };

  const nights = useMemo(() => {
    const start = form.dateRange.startDate;
    const end = form.dateRange.endDate;
    if (!start || !end) return 0;
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diff = endDate.getTime() - startDate.getTime();
    if (Number.isNaN(diff) || diff <= 0) return 0;
    return Math.ceil(diff / (24 * 60 * 60 * 1000));
  }, [form.dateRange.endDate, form.dateRange.startDate]);

  const totals = useMemo(() => {
    const nightlyRate = Number(property?.price || 0);
    const baseAmount = nights * nightlyRate;
    return {
      nightlyRate,
      baseAmount,
      totalAmount: baseAmount,
    };
  }, [nights, property?.price]);

  const providerOptions = useMemo(
    () => [
      { value: "stripe", label: "Stripe" },
      { value: "mercadopago", label: "Mercado Pago" },
    ],
    [],
  );

  const updateForm = (patch) => {
    setForm((prev) => ({ ...prev, ...patch }));
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    if (!property) return;
    setError("");
    setSuccess("");

    if (!user) {
      navigate("/login", { replace: true, state: { from: location } });
      return;
    }

    if (!user.emailVerified) {
      setError(t("reservePropertyPage.errors.verifyEmail"));
      return;
    }

    if (!form.dateRange.startDate || !form.dateRange.endDate || nights < 1) {
      setError(t("reservePropertyPage.errors.invalidDates"));
      return;
    }

    if (Number(form.guestCount) < 1) {
      setError(t("reservePropertyPage.errors.invalidGuests"));
      return;
    }

    setSubmitting(true);
    try {
      const reservationResult =
        await reservationsService.createReservationPublic({
          propertyId: property.$id,
          checkInDate: new Date(form.dateRange.startDate).toISOString(),
          checkOutDate: new Date(form.dateRange.endDate).toISOString(),
          guestCount: Number(form.guestCount),
          guestName: form.guestName || user.name || "",
          guestEmail: user.email,
          specialRequests: form.specialRequests || "",
        });

      const reservationId = reservationResult?.body?.data?.reservationId;
      if (!reservationId) {
        throw new Error(t("reservePropertyPage.errors.missingReservation"));
      }

      const paymentResult = await reservationsService.createPaymentSession({
        reservationId,
        provider: form.provider,
        guestEmail: user.email,
      });

      const checkoutUrl = paymentResult?.body?.data?.checkoutUrl;
      if (!checkoutUrl) {
        throw new Error(t("reservePropertyPage.errors.missingCheckout"));
      }

      setSuccess(t("reservePropertyPage.messages.redirecting"));
      window.location.assign(checkoutUrl);
    } catch (err) {
      setError(getErrorMessage(err, t("reservePropertyPage.errors.create")));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <section className="mx-auto max-w-5xl px-4 py-8">
        <p className="text-sm text-slate-600 dark:text-slate-300">
          {t("reservePropertyPage.loading")}
        </p>
      </section>
    );
  }

  if (error && !property) {
    return (
      <section className="mx-auto max-w-5xl space-y-4 px-4 py-8">
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200">
          {error}
        </p>
        <Link
          to="/"
          className="text-sm font-semibold text-cyan-700 hover:underline dark:text-cyan-300"
        >
          {t("reservePropertyPage.actions.backToHome")}
        </Link>
      </section>
    );
  }

  if (!property) return null;

  return (
    <section className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
          {t("reservePropertyPage.title")}
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          {property.title} - {property.city}, {property.state}
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <article className="space-y-4 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <Carousel
            images={galleryUrls}
            showArrows
            showCounter
            showDots
            variant="default"
            className="rounded-2xl"
            onImageClick={openImageViewer}
          />

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl bg-slate-100 px-3 py-2 text-sm dark:bg-slate-800">
              <p className="text-xs text-slate-500 dark:text-slate-300">
                {t("client:reserveProperty.labels.operation")}
              </p>
              <p className="font-semibold text-slate-900 dark:text-slate-100">
                {t(`client:common.enums.operation.${property.operationType}`, {
                  defaultValue: property.operationType,
                })}
              </p>
            </div>
            <div className="rounded-xl bg-slate-100 px-3 py-2 text-sm dark:bg-slate-800">
              <p className="text-xs text-slate-500 dark:text-slate-300">
                {t("client:reserveProperty.labels.maxGuests")}
              </p>
              <p className="font-semibold text-slate-900 dark:text-slate-100">
                {property.maxGuests || "-"}
              </p>
            </div>
            <div className="rounded-xl bg-slate-100 px-3 py-2 text-sm dark:bg-slate-800">
              <p className="text-xs text-slate-500 dark:text-slate-300">
                {t("client:reserveProperty.labels.nightlyRate")}
              </p>
              <p className="font-semibold text-slate-900 dark:text-slate-100">
                {formatCurrency(property.price, property.currency, locale)}
              </p>
            </div>
          </div>
        </article>

        <form
          onSubmit={onSubmit}
          className="space-y-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900"
        >
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            {t("reservePropertyPage.form.title")}
          </h2>

          <label className="grid gap-1 text-sm">
            <span className="inline-flex items-center gap-2">
              <CalendarDays size={14} />
              {t("reservePropertyPage.form.fields.dateRange")}
            </span>
            <DateRangePicker
              mode="range"
              value={form.dateRange}
              onChange={(nextRange) => updateForm({ dateRange: nextRange })}
              minDate={new Date()}
            />
          </label>

          <label className="grid gap-1 text-sm">
            <span className="inline-flex items-center gap-2">
              <Users size={14} />
              {t("reservePropertyPage.form.fields.guestCount")}
            </span>
            <input
              type="number"
              min={1}
              max={property.maxGuests || 500}
              value={form.guestCount}
              onChange={(event) =>
                updateForm({ guestCount: Number(event.target.value || 1) })
              }
              className="min-h-11 rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 dark:border-slate-600 dark:bg-slate-800"
            />
          </label>

          <label className="grid gap-1 text-sm">
            <span>
              {t("reservePropertyPage.form.fields.guestNameOptional")}
            </span>
            <input
              value={form.guestName}
              onChange={(event) =>
                updateForm({ guestName: event.target.value })
              }
              className="min-h-11 rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 dark:border-slate-600 dark:bg-slate-800"
            />
          </label>

          <label className="grid gap-1 text-sm">
            <span>{t("reservePropertyPage.form.fields.provider")}</span>
            <Select
              value={form.provider}
              onChange={(value) => updateForm({ provider: value })}
              options={providerOptions}
              size="md"
            />
          </label>

          <label className="grid gap-1 text-sm">
            <span>
              {t("reservePropertyPage.form.fields.specialRequestsOptional")}
            </span>
            <textarea
              rows={3}
              value={form.specialRequests}
              onChange={(event) =>
                updateForm({ specialRequests: event.target.value })
              }
              className="rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 dark:border-slate-600 dark:bg-slate-800"
            />
          </label>

          <div className="rounded-2xl bg-slate-100 p-3 text-sm dark:bg-slate-800">
            <p className="flex items-center justify-between">
              <span>{t("reservePropertyPage.summary.nights")}</span>
              <strong>{nights}</strong>
            </p>
            <p className="mt-1 flex items-center justify-between">
              <span>{t("reservePropertyPage.summary.baseAmount")}</span>
              <strong>
                {formatCurrency(totals.baseAmount, property.currency, locale)}
              </strong>
            </p>
            <p className="mt-1 flex items-center justify-between border-t border-slate-300 pt-2 font-semibold dark:border-slate-700">
              <span>{t("reservePropertyPage.summary.total")}</span>
              <strong>
                {formatCurrency(totals.totalAmount, property.currency, locale)}
              </strong>
            </p>
          </div>

          {error ? (
            <p className="inline-flex w-full items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200">
              <AlertCircle size={16} className="mt-0.5" />
              <span>{error}</span>
            </p>
          ) : null}

          {success ? (
            <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-200">
              {success}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={submitting}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-linear-to-r from-cyan-600 to-blue-600 px-6 py-4 font-bold text-white shadow-lg shadow-cyan-900/20 transition-all hover:shadow-cyan-900/40 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
          >
            <CreditCard size={16} />
            {submitting
              ? t("reservePropertyPage.actions.processing")
              : t("reservePropertyPage.actions.payAndConfirm")}
          </button>
        </form>
      </div>

      <ImageViewerModal
        isOpen={imageViewer.isOpen}
        onClose={closeImageViewer}
        images={galleryUrls}
        initialIndex={imageViewer.initialIndex}
        alt={property.title}
        showDownload
      />
    </section>
  );
};

export default ReserveProperty;
