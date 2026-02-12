import { useEffect, useMemo, useState } from "react";
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
} from "lucide-react";
import env from "../env";
import { getAmenityIcon } from "../data/amenitiesCatalog";
import { amenitiesService } from "../services/amenitiesService";
import { propertiesService } from "../services/propertiesService";
import { leadsService } from "../services/leadsService";
import { executeJsonFunction } from "../utils/functions";
import { getErrorMessage } from "../utils/errors";
import Carousel from "../components/common/molecules/Carousel/Carousel";
import { usePageSeo } from "../hooks/usePageSeo";

const FALLBACK_BANNERS = [
  "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=2000&q=80",
  "https://images.unsplash.com/photo-1613977257368-707ba9348227?auto=format&fit=crop&w=2000&q=80",
  "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=2000&q=80",
];

const PropertyDetail = () => {
  const { t, i18n } = useTranslation();
  const { slug } = useParams();
  const [property, setProperty] = useState(null);
  const [owner, setOwner] = useState(null);
  const [images, setImages] = useState([]);
  const [amenities, setAmenities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [leadMessage, setLeadMessage] = useState("");
  const [leadError, setLeadError] = useState("");
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
      : "Detalle de propiedad con galeria, amenidades y contacto.",
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
          throw new Error(t("propertyDetailPage.errors.notFound"));
        }

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
        setError(getErrorMessage(err, t("propertyDetailPage.errors.load")));
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

  const amount = useMemo(() => {
    if (!property) return "";
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: property.currency || "MXN",
      maximumFractionDigits: 0,
    }).format(property.price || 0);
  }, [locale, property]);

  const ownerName = useMemo(() => {
    const name = `${owner?.firstName || ""} ${owner?.lastName || ""}`.trim();
    return name || owner?.email || t("propertyDetailPage.owner.unavailable");
  }, [owner, t]);

  const gallery = useMemo(() => {
    if (images.length > 0) {
      return images.map((item) => item.url).filter(Boolean);
    }
    return [
      property?.mainImageUrl,
      property?.coverImageUrl,
      property?.thumbnailUrl,
      ...FALLBACK_BANNERS,
    ].filter(Boolean);
  }, [images, property]);

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
      setLeadMessage(t("propertyDetailPage.contact.success"));
      setForm({ name: "", email: "", phone: "", message: "" });
    } catch (err) {
      setLeadError(getErrorMessage(err, t("propertyDetailPage.contact.errors.send")));
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8">
        <p className="text-sm text-slate-600 dark:text-slate-300">{t("propertyDetailPage.loading")}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200">
          {error}
        </div>
        <Link to="/" className="mt-4 inline-block text-sm text-cyan-700 hover:underline dark:text-cyan-400">
          {t("propertyDetailPage.backHome")}
        </Link>
      </div>
    );
  }

  if (!property) return null;

  return (
    <div className="space-y-8 pb-8">
      <section className="relative h-[380px] overflow-hidden">
        <img
          src={gallery[0] || FALLBACK_BANNERS[0]}
          alt={property.title}
          className="h-full w-full object-cover"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/85 via-slate-900/45 to-cyan-700/45" />

        <div className="absolute inset-0">
          <div className="mx-auto flex h-full max-w-7xl items-end px-4 pb-8 sm:px-6 lg:px-8">
            <div className="max-w-2xl space-y-3 text-white">
              <span className="inline-flex rounded-full bg-cyan-500 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white">
                {t(`homePage.enums.operation.${property.operationType}`, {
                  defaultValue: property.operationType,
                })}
              </span>
              <h1 className="text-3xl font-bold sm:text-4xl">{property.title}</h1>
              <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-sm backdrop-blur-sm">
                <MapPin size={14} /> {property.city}, {property.state}
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto grid max-w-7xl gap-6 px-4 sm:px-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:px-8">
        <section className="space-y-6">
          <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:p-6">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-3xl font-bold text-cyan-700 dark:text-cyan-300">{amount}</p>
                <p className="text-xs text-slate-500 dark:text-slate-300">{t("propertyDetailPage.priceHint")}</p>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                <ShieldCheck size={14} /> {t("propertyDetailPage.verifiedListing")}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-4">
              <div className="rounded-xl bg-slate-100 p-3 text-sm dark:bg-slate-800">
                <p className="text-slate-500 dark:text-slate-300">{t("propertyDetailPage.stats.bedrooms")}</p>
                <p className="mt-1 inline-flex items-center gap-1 font-semibold text-slate-900 dark:text-slate-100"><BedDouble size={15} /> {property.bedrooms || 0}</p>
              </div>
              <div className="rounded-xl bg-slate-100 p-3 text-sm dark:bg-slate-800">
                <p className="text-slate-500 dark:text-slate-300">{t("propertyDetailPage.stats.bathrooms")}</p>
                <p className="mt-1 inline-flex items-center gap-1 font-semibold text-slate-900 dark:text-slate-100"><Bath size={15} /> {property.bathrooms || 0}</p>
              </div>
              <div className="rounded-xl bg-slate-100 p-3 text-sm dark:bg-slate-800">
                <p className="text-slate-500 dark:text-slate-300">{t("propertyDetailPage.stats.totalArea")}</p>
                <p className="mt-1 inline-flex items-center gap-1 font-semibold text-slate-900 dark:text-slate-100"><Landmark size={15} /> {property.totalArea || 0}</p>
              </div>
              <div className="rounded-xl bg-slate-100 p-3 text-sm dark:bg-slate-800">
                <p className="text-slate-500 dark:text-slate-300">{t("propertyDetailPage.stats.type")}</p>
                <p className="mt-1 inline-flex items-center gap-1 font-semibold text-slate-900 dark:text-slate-100"><Building2 size={15} /> {t(`homePage.enums.propertyType.${property.propertyType}`, { defaultValue: property.propertyType })}</p>
              </div>
            </div>

            <h2 className="mt-6 text-lg font-semibold text-slate-900 dark:text-slate-100">{t("propertyDetailPage.descriptionTitle")}</h2>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-700 dark:text-slate-200">
              {property.description}
            </p>

            {amenities.length > 0 ? (
              <div className="mt-6 space-y-2">
                <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                  {t("propertyDetailPage.amenitiesTitle")}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {amenities.map((amenity) => (
                    <span
                      key={amenity.$id}
                      className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                    >
                      <span aria-hidden="true">{getAmenityIcon(amenity)}</span>
                      <span>
                        {i18n.language === "es"
                          ? amenity.name_es || amenity.name_en || amenity.slug
                          : amenity.name_en || amenity.name_es || amenity.slug}
                      </span>
                    </span>
                  ))}
                </div>
              </div>
            ) : null}
          </article>

          <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:p-6">
            <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-slate-100">{t("propertyDetailPage.galleryTitle")}</h2>
            <Carousel
              images={gallery}
              showArrows
              showCounter
              showDots
              variant="default"
              className="rounded-2xl"
            />
          </article>
        </section>

        <aside className="space-y-5">
          <article className="rounded-3xl border border-cyan-200 bg-cyan-50 p-5 shadow-sm dark:border-cyan-900/50 dark:bg-cyan-950/30">
            <p className="text-sm text-cyan-700 dark:text-cyan-200">
              {t("propertyDetailPage.reserveHint", {
                defaultValue: "Reserva en línea con confirmación y voucher digital.",
              })}
            </p>
            <Link
              to={`/reservar/${property.slug}`}
              className="mt-3 inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-gradient-to-r from-cyan-500 to-sky-600 px-4 py-2 text-sm font-semibold text-white transition hover:from-cyan-400 hover:to-sky-500"
            >
              {t("propertyDetailPage.reserveCta", { defaultValue: "Reservar ahora" })}
            </Link>
          </article>

          <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">{t("propertyDetailPage.owner.title")}</h2>
            <p className="mt-2 text-lg font-semibold text-slate-900 dark:text-slate-100">{ownerName}</p>
            <p className="mt-2 inline-flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
              <Phone size={14} /> {owner?.phone || owner?.whatsappNumber || t("propertyDetailPage.owner.noPhone")}
            </p>
            <p className="mt-1 inline-flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
              <Mail size={14} /> {owner?.email || t("propertyDetailPage.owner.unavailable")}
            </p>
            <p className="mt-4 inline-flex items-center gap-1 text-sm text-amber-600 dark:text-amber-300">
              <Star size={14} fill="currentColor" /> {t("propertyDetailPage.owner.rating")}
            </p>
          </article>

          <form
            className="space-y-3 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900"
            onSubmit={onSubmitLead}
          >
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              {t("propertyDetailPage.contact.title")}
            </h2>
            <label className="grid gap-1 text-sm">
              <span>{t("propertyDetailPage.contact.fields.name")}</span>
              <input
                required
                value={form.name}
                onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                className="min-h-11 rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 dark:border-slate-600 dark:bg-slate-800"
              />
            </label>
            <label className="grid gap-1 text-sm">
              <span>{t("propertyDetailPage.contact.fields.email")}</span>
              <input
                required
                type="email"
                value={form.email}
                onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
                className="min-h-11 rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 dark:border-slate-600 dark:bg-slate-800"
              />
            </label>
            <label className="grid gap-1 text-sm">
              <span>{t("propertyDetailPage.contact.fields.phoneOptional")}</span>
              <input
                value={form.phone}
                onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))}
                className="min-h-11 rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 dark:border-slate-600 dark:bg-slate-800"
              />
            </label>
            <label className="grid gap-1 text-sm">
              <span>{t("propertyDetailPage.contact.fields.message")}</span>
              <textarea
                required
                rows={4}
                value={form.message}
                onChange={(event) => setForm((prev) => ({ ...prev, message: event.target.value }))}
                className="rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 dark:border-slate-600 dark:bg-slate-800"
              />
            </label>

            {leadError ? <p className="text-sm text-red-700 dark:text-red-300">{leadError}</p> : null}
            {leadMessage ? (
              <p className="text-sm text-emerald-700 dark:text-emerald-300">{leadMessage}</p>
            ) : null}

            <button
              type="submit"
              disabled={sending}
              className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-sky-600 px-4 py-2 text-sm font-semibold text-white transition hover:from-cyan-400 hover:to-sky-500 disabled:cursor-not-allowed disabled:opacity-70"
            >
              <Send size={14} />
              {sending ? t("propertyDetailPage.contact.actions.sending") : t("propertyDetailPage.contact.actions.send")}
            </button>
          </form>
        </aside>
      </div>
    </div>
  );
};

export default PropertyDetail;
