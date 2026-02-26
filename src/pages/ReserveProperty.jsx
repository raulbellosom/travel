import SkeletonLoader from "../components/common/molecules/SkeletonLoader";
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
import { leadsService } from "../services/leadsService";
import { useAuth } from "../hooks/useAuth";
import { getErrorMessage } from "../utils/errors";
import { usePageSeo } from "../hooks/usePageSeo";
import { getResourceBehavior, parseResourceAttributes } from "../utils/resourceModel";
import { useInstanceModules } from "../hooks/useInstanceModules";
import { formatMoneyWithDenomination } from "../utils/money";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=2000&q=80";

const formatCurrency = (value, currency, locale) =>
  formatMoneyWithDenomination(value, {
    locale,
    currency: currency || "MXN",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const parseDateQueryValue = (value) => {
  const normalized = String(value || "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized)) return null;
  const parsed = new Date(`${normalized}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const ReserveProperty = () => {
  const { t, i18n } = useTranslation();
  const { slug } = useParams();
  const { user } = useAuth();
  const modulesApi = useInstanceModules();
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
  const initialDateRange = useMemo(() => {
    const params = new URLSearchParams(location.search);
    const startDate = parseDateQueryValue(params.get("checkIn"));
    const endDate = parseDateQueryValue(params.get("checkOut"));
    if (!startDate || !endDate || endDate <= startDate) {
      return { startDate: null, endDate: null };
    }
    return { startDate, endDate };
  }, [location.search]);
  const [form, setForm] = useState({
    dateRange: initialDateRange,
    guestCount: 1,
    guestName: "",
    specialRequests: "",
    provider: "stripe",
  });

  const locale = i18n.language === "en" ? "en-US" : "es-MX";
  const behavior = useMemo(
    () =>
      getResourceBehavior(property || {}, {
        isEnabled: modulesApi.isEnabled,
      }),
    [property, modulesApi.isEnabled],
  );
  const attrs = useMemo(
    () => parseResourceAttributes(property?.attributes),
    [property?.attributes],
  );
  const maxCapacity = useMemo(() => {
    switch (behavior.resourceType) {
      case "vehicle":
        return Number(attrs.vehicleSeats) || Number(property?.maxGuests) || 0;
      case "experience":
        return (
          Number(attrs.experienceMaxParticipants) ||
          Number(property?.maxGuests) ||
          0
        );
      case "venue":
        return (
          Number(attrs.venueCapacitySeated) ||
          Number(attrs.venueCapacityStanding) ||
          Number(property?.maxGuests) ||
          Number(property?.capacity) ||
          0
        );
      case "service":
        return (
          Number(attrs.chefMaxDiners) ||
          Number(attrs.cateringMaxGuests) ||
          Number(property?.maxGuests) ||
          0
        );
      case "music":
        return Number(attrs.musicMaxAudience) || 0;
      default:
        return Number(property?.maxGuests) || Number(property?.capacity) || 0;
    }
  }, [attrs, behavior.resourceType, property?.capacity, property?.maxGuests]);
  const capacityLabel = useMemo(() => {
    const keyByType = {
      property: "calendar.booking.guests",
      vehicle: "calendar.booking.passengers",
      experience: "calendar.booking.persons",
      venue: "calendar.booking.attendees",
      service: "calendar.booking.persons",
      music: "calendar.booking.persons",
    };
    const i18nKey = keyByType[behavior.resourceType] || "calendar.booking.guests";
    return t(i18nKey);
  }, [behavior.resourceType, t]);
  const rateLabel = useMemo(() => {
    const keyByPriceLabel = {
      night: "reservePropertyPage.labels.nightlyRate",
      day: "reservePropertyPage.labels.dailyRate",
      hour: "reservePropertyPage.labels.hourlyRate",
      event: "reservePropertyPage.labels.eventRate",
      person: "reservePropertyPage.labels.personRate",
      month: "reservePropertyPage.labels.monthlyRate",
      total: "reservePropertyPage.labels.baseRate",
    };
    return t(keyByPriceLabel[behavior.priceLabel] || "reservePropertyPage.labels.baseRate");
  }, [behavior.priceLabel, t]);
  const requiresSchedule = useMemo(
    () =>
      behavior.effectiveScheduleType === "date_range" ||
      behavior.effectiveScheduleType === "time_slot",
    [behavior.effectiveScheduleType],
  );
  const createLeadOnly = useMemo(
    () =>
      behavior.bookingType === "manual_contact" ||
      !behavior.requiresPayments ||
      !behavior.canUsePayments,
    [
      behavior.bookingType,
      behavior.canUsePayments,
      behavior.requiresPayments,
    ],
  );
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

  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      dateRange: initialDateRange,
    }));
  }, [initialDateRange]);

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

  const unitCount = useMemo(() => {
    if (behavior.priceLabel === "night" || behavior.priceLabel === "day") {
      return nights;
    }
    return 1;
  }, [behavior.priceLabel, nights]);

  const totals = useMemo(() => {
    const unitRate = Number(property?.price || 0);
    const effectiveCount = unitCount > 0 ? unitCount : 0;
    const baseAmount = effectiveCount * unitRate;
    return {
      unitRate,
      unitCount: effectiveCount,
      baseAmount,
      totalAmount: baseAmount,
    };
  }, [property?.price, unitCount]);

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

    if (!behavior.canOperateMode) {
      setError(
        t("reservePropertyPage.errors.moduleDisabled", {
          defaultValue:
            "El modulo de reservaciones para este recurso no esta habilitado.",
        }),
      );
      return;
    }

    if (!user) {
      navigate("/login", { replace: true, state: { from: location } });
      return;
    }

    if (!user.emailVerified) {
      setError(t("reservePropertyPage.errors.verifyEmail"));
      return;
    }

    if (
      requiresSchedule &&
      (!form.dateRange.startDate || !form.dateRange.endDate || nights < 1)
    ) {
      setError(t("reservePropertyPage.errors.invalidDates"));
      return;
    }

    if (Number(form.guestCount) < 1) {
      setError(t("reservePropertyPage.errors.invalidGuests"));
      return;
    }
    if (maxCapacity > 0 && Number(form.guestCount) > maxCapacity) {
      setError(
        t("reservePropertyPage.errors.exceedsCapacity", {
          defaultValue: "La cantidad supera la capacidad maxima permitida.",
        }),
      );
      return;
    }

    setSubmitting(true);
    try {
      if (createLeadOnly) {
        const startIso = form.dateRange.startDate
          ? new Date(form.dateRange.startDate).toISOString()
          : null;
        const endIso = form.dateRange.endDate
          ? new Date(form.dateRange.endDate).toISOString()
          : null;
        const leadMessage = t("reservePropertyPage.messages.defaultLeadMessage", {
          defaultValue:
            "Hola, me interesa este recurso. Quiero cotizar y revisar disponibilidad.",
        });

        await leadsService.createLead({
          resourceId: property.$id,
          message: leadMessage,
          meta: {
            source: "reserve_page",
            resourceTitle: property.title || "",
            resourceType: behavior.resourceType,
            category: behavior.category,
            bookingType: behavior.bookingType,
            commercialMode: behavior.commercialMode,
            guestCount: Number(form.guestCount) || 1,
            preferredStartDate: startIso,
            preferredEndDate: endIso,
            guestName: form.guestName || "",
            specialRequests: form.specialRequests || "",
          },
        });

        setSuccess(
          t("reservePropertyPage.messages.leadSent", {
            defaultValue:
              "Solicitud enviada. Te contactaran pronto para confirmar detalles.",
          }),
        );
        return;
      }

      const reservationResult =
        await reservationsService.createReservationPublic({
          resourceId: property.$id,
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
        resourceId: property.$id,
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
      <section className="mx-auto max-w-5xl px-4 pb-8 pt-24 sm:pt-28">
        <SkeletonLoader variant="detail" count={6} />
      </section>
    );
  }

  if (error && !property) {
    return (
      <section className="mx-auto max-w-5xl space-y-4 px-4 pb-8 pt-24 sm:pt-28">
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
    <section className="mx-auto max-w-6xl space-y-6 px-4 pb-6 pt-24 sm:px-6 sm:pt-28 lg:px-8">
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

          <div
            className={`grid gap-3 ${maxCapacity > 0 ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}
          >
            <div className="rounded-xl bg-slate-100 px-3 py-2 text-sm dark:bg-slate-800">
              <p className="text-xs text-slate-500 dark:text-slate-300">
                {t("client:reserveProperty.labels.operation")}
              </p>
              <p className="font-semibold text-slate-900 dark:text-slate-100">
                {t(`client:common.enums.operation.${behavior.operationType}`, {
                  defaultValue: behavior.operationType,
                })}
              </p>
            </div>
            {maxCapacity > 0 && (
              <div className="rounded-xl bg-slate-100 px-3 py-2 text-sm dark:bg-slate-800">
                <p className="text-xs text-slate-500 dark:text-slate-300">
                  {t("reservePropertyPage.labels.capacity")}
                </p>
                <p className="font-semibold text-slate-900 dark:text-slate-100">
                  {maxCapacity}
                </p>
              </div>
            )}
            <div className="rounded-xl bg-slate-100 px-3 py-2 text-sm dark:bg-slate-800">
              <p className="text-xs text-slate-500 dark:text-slate-300">
                {rateLabel}
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

          {requiresSchedule && (
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
          )}

          <label className="grid gap-1 text-sm">
            <span className="inline-flex items-center gap-2">
              <Users size={14} />
              {capacityLabel}
            </span>
            <input
              type="number"
              min={1}
              max={maxCapacity > 0 ? maxCapacity : 500}
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

          {!createLeadOnly && (
            <label className="grid gap-1 text-sm">
              <span>{t("reservePropertyPage.form.fields.provider")}</span>
              <Select
                value={form.provider}
                onChange={(value) => updateForm({ provider: value })}
                options={providerOptions}
                size="md"
                disabled={behavior.requiresPayments && !behavior.canUsePayments}
              />
            </label>
          )}

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
            {requiresSchedule && (
              <p className="flex items-center justify-between">
                <span>{t("reservePropertyPage.summary.nights")}</span>
                <strong>{nights}</strong>
              </p>
            )}
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
              : createLeadOnly
                ? t("reservePropertyPage.actions.sendRequest", {
                    defaultValue: "Enviar solicitud",
                  })
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
