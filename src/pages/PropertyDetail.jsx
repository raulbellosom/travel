import {
  useEffect,
  useMemo,
  useState,
  useCallback,
  lazy,
  Suspense,
} from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin,
  BedDouble,
  Bath,
  Landmark,
  Building2,
  Phone,
  Mail,
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
  ArrowLeft,
  ArrowRight,
  MessageCircle,
  ChevronRight,
  Home,
  Ruler,
  CalendarDays,
  Wrench,
  Compass,
  Bike,
  Ship,
  Armchair,
  LayoutGrid,
  CalendarHeart,
  Ticket,
  GraduationCap,
  Dumbbell,
  TreePine,
  UtensilsCrossed,
  Tag,
  Heart,
  Share2,
} from "lucide-react";
import env from "../env";
import { getAmenityIcon } from "../data/amenitiesCatalog";
import { amenitiesService } from "../services/amenitiesService";
import { propertiesService } from "../services/propertiesService";
import { profileService } from "../services/profileService";
import { executeJsonFunction } from "../utils/functions";
import { getErrorMessage } from "../utils/errors";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "../hooks/useToast";
import { useChat } from "../contexts/ChatContext";
import { Spinner } from "../components/common";
import Carousel from "../components/common/molecules/Carousel/Carousel";
import ImageViewerModal from "../components/common/organisms/ImageViewerModal";
import ProgressiveImage from "../components/common/atoms/ProgressiveImage";
import { usePageSeo } from "../hooks/usePageSeo";
import { getResourceBehavior } from "../utils/resourceModel";
import { useInstanceModules } from "../hooks/useInstanceModules";
import { buildPathFromLocation } from "../utils/authRedirect";
import { formatMoneyParts } from "../utils/money";
import { favoritesService } from "../services/favoritesService";

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
const isHourly = (op) => op === "rent_hourly";
const _MOTION = motion;

/* ================================================================ */

const PropertyDetail = () => {
  const { t, i18n } = useTranslation();
  const { slug } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { showToast } = useToast();
  const { startConversation, isAuthenticated: isChatAuth } = useChat();
  const modulesApi = useInstanceModules();
  const [heroSlide, setHeroSlide] = useState(0);

  const [property, setProperty] = useState(null);
  const [owner, setOwner] = useState(null);
  const [images, setImages] = useState([]);
  const [amenities, setAmenities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [chatOpened, setChatOpened] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [imageViewer, setImageViewer] = useState({
    isOpen: false,
    initialIndex: 0,
  });

  const locale = i18n.language === "es" ? "es-MX" : "en-US";
  const resourceBehavior = useMemo(
    () =>
      getResourceBehavior(property || {}, {
        isEnabled: modulesApi.isEnabled,
      }),
    [property, modulesApi.isEnabled],
  );

  usePageSeo({
    title: property?.title
      ? `${property.title} | Inmobo`
      : "Inmobo | Detalle de recurso",
    description: property?.description
      ? String(property.description).slice(0, 155)
      : "Detalle de recurso con galería, amenidades y contacto.",
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
          amenitiesService.getBySlugs(doc.amenities || []).catch(() => []),
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
      resourceId: property.$id,
      propertyId: property.$id,
    }).catch(() => {});
  }, [property]);

  /* ─── Computed values ────────────────────────────────── */

  const opType = resourceBehavior.operationType;

  const amountParts = useMemo(
    () =>
      formatMoneyParts(property?.price || 0, {
        locale,
        currency: property?.currency || "MXN",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
    [locale, property?.currency, property?.price],
  );

  const priceSuffix = useMemo(() => {
    if (!property) return "";
    const pm = resourceBehavior.pricingModel;
    const suffixMap = {
      per_month: t("client:pricing.perMonth", { defaultValue: " /mes" }),
      per_night: t("client:pricing.perNight", { defaultValue: " /noche" }),
      per_day: t("client:pricing.perDay", { defaultValue: " /día" }),
      per_hour: t("client:pricing.perHour", { defaultValue: " /hora" }),
      per_person: t("client:pricing.perPerson", { defaultValue: " /persona" }),
      per_event: t("client:pricing.perEvent", { defaultValue: " /evento" }),
      per_m2: t("client:pricing.perM2", { defaultValue: " /m²" }),
    };
    return suffixMap[pm] || "";
  }, [property, resourceBehavior.pricingModel, t]);

  const priceLabel = useMemo(() => {
    if (!property) return "";
    const pm = resourceBehavior.pricingModel;
    const labelMap = {
      total: t("client:common.enums.pricingModel.total", {
        defaultValue: "Precio total",
      }),
      per_month: t("client:common.enums.pricingModel.per_month", {
        defaultValue: "Precio mensual",
      }),
      per_night: t("client:common.enums.pricingModel.per_night", {
        defaultValue: "Precio por noche",
      }),
      per_day: t("client:common.enums.pricingModel.per_day", {
        defaultValue: "Precio por día",
      }),
      per_hour: t("client:common.enums.pricingModel.per_hour", {
        defaultValue: "Precio por hora",
      }),
      per_person: t("client:common.enums.pricingModel.per_person", {
        defaultValue: "Precio por persona",
      }),
      per_event: t("client:common.enums.pricingModel.per_event", {
        defaultValue: "Precio por evento",
      }),
      per_m2: t("client:common.enums.pricingModel.per_m2", {
        defaultValue: "Precio por m²",
      }),
    };
    return labelMap[pm] || labelMap.total;
  }, [property, resourceBehavior.pricingModel, t]);

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

  // Parallel array of Appwrite fileIds for each gallery entry.
  // Used by ProgressiveImage to generate optimised preview URLs.
  const galleryFileIds = useMemo(
    () => (images.length > 0 ? images.map((item) => item.fileId || null) : []),
    [images],
  );

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
    if (isHourly(opType))
      return {
        color: "bg-indigo-500",
        label: t("client:common.enums.operation.rent_hourly", {
          defaultValue: "Renta por hora",
        }),
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

  const isCtaBlocked = useMemo(() => {
    return (
      !resourceBehavior.canOperateMode ||
      (resourceBehavior.requiresPayments && !resourceBehavior.canUsePayments)
    );
  }, [
    resourceBehavior.canOperateMode,
    resourceBehavior.canUsePayments,
    resourceBehavior.requiresPayments,
  ]);

  const authReturnPath = useMemo(
    () => buildPathFromLocation(location),
    [location],
  );

  const authRedirectQuery = useMemo(
    () =>
      authReturnPath ? `?redirect=${encodeURIComponent(authReturnPath)}` : "",
    [authReturnPath],
  );

  const registerToChatPath = useMemo(
    () => `/register${authRedirectQuery}`,
    [authRedirectQuery],
  );

  const loginToChatPath = useMemo(
    () => `/login${authRedirectQuery}`,
    [authRedirectQuery],
  );

  const handleGoBack = useCallback(() => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      navigate(-1);
      return;
    }
    navigate(
      `/buscar?resourceType=${encodeURIComponent(resourceBehavior.resourceType)}&page=1`,
      { replace: true },
    );
  }, [navigate, resourceBehavior.resourceType]);

  useEffect(() => {
    let cancelled = false;

    if (!user?.$id || !property?.$id) {
      setIsFavorite(false);
      return () => {
        cancelled = true;
      };
    }

    favoritesService
      .isFavorite(user.$id, property.$id)
      .then((value) => {
        if (!cancelled) setIsFavorite(Boolean(value));
      })
      .catch(() => {
        if (!cancelled) setIsFavorite(false);
      });

    return () => {
      cancelled = true;
    };
  }, [property?.$id, user?.$id]);

  /* ─── Handlers ───────────────────────────────────────── */

  const openImageViewer = (_url, index) =>
    setImageViewer({ isOpen: true, initialIndex: index });

  const closeImageViewer = () =>
    setImageViewer({ isOpen: false, initialIndex: 0 });

  const handleShare = useCallback(async () => {
    if (!property) return;

    const shareUrl = typeof window !== "undefined" ? window.location.href : "";

    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({
          title: property.title,
          text: property.description || property.title,
          url: shareUrl,
        });
        return;
      }
    } catch {
      // Use clipboard fallback.
    }

    try {
      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl);
        showToast({
          type: "success",
          message: t("client:propertyDetail.share.copied", {
            defaultValue: "Enlace copiado al portapapeles.",
          }),
        });
      }
    } catch (error) {
      showToast({
        type: "error",
        message: getErrorMessage(
          error,
          t("client:propertyDetail.share.error", {
            defaultValue: "No se pudo compartir este recurso.",
          }),
        ),
      });
    }
  }, [property, showToast, t]);

  const handleToggleFavorite = useCallback(async () => {
    if (!property) return;

    if (!user?.$id) {
      navigate(`/register${authRedirectQuery}`);
      return;
    }
    if (favoriteLoading) return;

    setFavoriteLoading(true);
    try {
      const result = await favoritesService.toggleFavorite({
        userId: user.$id,
        resourceId: property.$id,
        resourceSlug: property.slug,
        resourceTitle: property.title,
        resourceOwnerUserId: property.ownerUserId,
      });
      setIsFavorite(result.isFavorite);
      showToast({
        type: "success",
        message: result.isFavorite
          ? t("actions.addFavorite", { defaultValue: "Agregado a favoritos" })
          : t("actions.removeFavorite", {
              defaultValue: "Quitado de favoritos",
            }),
      });
    } catch (error) {
      showToast({
        type: "error",
        message: getErrorMessage(
          error,
          t("client:propertyDetail.favorites.error", {
            defaultValue: "No se pudo actualizar favoritos.",
          }),
        ),
      });
    } finally {
      setFavoriteLoading(false);
    }
  }, [
    authRedirectQuery,
    favoriteLoading,
    navigate,
    property,
    showToast,
    t,
    user?.$id,
  ]);

  /** Owner avatar URL (from users collection if it stores avatarFileId) */
  const ownerAvatarUrl = useMemo(() => {
    if (!owner?.avatarFileId) return "";
    return profileService.getAvatarViewUrl(owner.avatarFileId);
  }, [owner?.avatarFileId]);

  /** Open chat with property agent — animated transition */
  const handleOpenChat = useCallback(async () => {
    if (!property || !isChatAuth || chatLoading) return;
    const isClient = user?.role === "client";
    const isVerified = Boolean(user?.emailVerified);
    if (!isClient || !isVerified) return;
    if (user?.$id === property.ownerUserId) return;

    setChatLoading(true);
    try {
      await startConversation({
        resourceId: property.$id,
        resourceTitle: property.title,
        ownerUserId: property.ownerUserId,
        ownerName: owner?.firstName
          ? `${owner.firstName} ${owner.lastName || ""}`.trim()
          : owner?.email || "",
      });
      setChatOpened(true);
    } catch (err) {
      console.error("Failed to start conversation:", err);
    } finally {
      setChatLoading(false);
    }
  }, [property, owner, user, isChatAuth, startConversation, chatLoading]);

  /* ─── Loading / Error states ─────────────────────────── */

  if (loading) {
    return (
      <div className="pb-12 md:pt-20">
        {/* Mobile Hero Skeleton */}
        <div className="relative aspect-4/3 w-full animate-pulse bg-slate-200 md:hidden dark:bg-slate-800" />

        {/* Breadcrumb Skeleton */}
        <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 md:py-4 lg:px-8">
          <div className="flex items-center gap-2">
            <div className="h-4 w-12 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
            <div className="h-4 w-1 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
            <div className="h-4 w-20 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
            <div className="h-4 w-1 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
            <div className="h-4 w-32 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
          </div>
        </div>

        {/* Desktop Gallery Skeleton */}
        <div className="mx-auto hidden max-w-7xl px-4 sm:px-6 md:block lg:px-8">
          <div className="grid gap-2 md:grid-cols-4 md:grid-rows-2">
            <div className="col-span-2 row-span-2 aspect-4/3 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800" />
            <div className="aspect-4/3 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800" />
            <div className="aspect-4/3 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800" />
            <div className="aspect-4/3 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800" />
            <div className="aspect-4/3 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800" />
          </div>
        </div>

        {/* Main Content Skeleton */}
        <div className="mx-auto mt-6 max-w-7xl px-4 sm:px-6 lg:mt-8 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
            {/* Left Column */}
            <div className="space-y-6">
              {/* Desktop Title Area */}
              <div className="hidden space-y-3 md:block">
                <div className="flex gap-3">
                  <div className="h-6 w-20 animate-pulse rounded-full bg-slate-200 dark:bg-slate-800" />
                  <div className="h-6 w-32 animate-pulse rounded-full bg-slate-200 dark:bg-slate-800" />
                </div>
                <div className="h-10 w-3/4 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-800" />
                <div className="flex gap-4">
                  <div className="h-5 w-40 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
                  <div className="h-5 w-32 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
                </div>
              </div>

              {/* Mobile Verified Badge */}
              <div className="md:hidden">
                <div className="h-7 w-32 animate-pulse rounded-full bg-slate-200 dark:bg-slate-800" />
              </div>

              {/* Mobile Price Card Skeleton */}
              <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5 lg:hidden dark:border-slate-800 dark:bg-slate-900">
                <div className="space-y-2">
                  <div className="h-4 w-24 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
                  <div className="h-10 w-48 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-800" />
                  <div className="h-4 w-32 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
                </div>
                <div className="h-12 w-full animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800" />
              </div>

              {/* Stats Grid Skeleton */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                {[...Array(6)].map((_, i) => (
                  <div
                    key={i}
                    className="space-y-2 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
                  >
                    <div className="h-6 w-6 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
                    <div className="h-4 w-16 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
                    <div className="h-6 w-12 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
                  </div>
                ))}
              </div>

              {/* Description Skeleton */}
              <div className="space-y-3">
                <div className="h-6 w-32 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
                <div className="space-y-2">
                  <div className="h-4 w-full animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
                  <div className="h-4 w-full animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
                  <div className="h-4 w-3/4 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
                </div>
              </div>
            </div>

            {/* Right Sidebar Skeleton (Desktop) */}
            <div className="hidden space-y-6 lg:block">
              <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
                <div className="space-y-2">
                  <div className="h-4 w-24 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
                  <div className="h-10 w-48 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-800" />
                  <div className="h-4 w-32 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
                </div>
                <div className="h-12 w-full animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800" />
              </div>
              <div className="h-64 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800" />
            </div>
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
    <div className="pb-12 pt-16 md:pt-20">
      {/* ── Mobile Hero Cover (auto-sliding) ──────────────── */}
      <section className="relative md:hidden">
        <div className="relative aspect-4/3 w-full overflow-hidden">
          <button
            type="button"
            onClick={handleGoBack}
            className="absolute left-3 top-3 z-30 inline-flex items-center gap-1.5 rounded-full bg-black/45 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-sm transition hover:bg-black/60"
          >
            <ArrowLeft size={14} />
            {t("chat.actions.back", { defaultValue: "Volver" })}
          </button>

          {/* Sliding container */}
          <div
            className="flex h-full transition-transform duration-500 ease-out"
            style={{ transform: `translateX(-${heroSlide * 100}%)` }}
          >
            {gallery.slice(0, 6).map((url, i) => (
              <div key={url + i} className="h-full w-full shrink-0">
                <ProgressiveImage
                  fileId={galleryFileIds[i] || null}
                  src={url || FALLBACK_BANNERS[0]}
                  preset={i === 0 ? "detail" : "card"}
                  aspectRatio={null}
                  alt={`${property.title} ${i + 1}`}
                  className="h-full w-full"
                  eager
                />
              </div>
            ))}
          </div>

          {/* Gradient overlay */}
          <div className="absolute inset-0 z-20 bg-linear-to-t from-black/70 via-black/30 to-transparent pointer-events-none" />

          {/* Bottom overlay content */}
          <div className="absolute right-0 bottom-0 left-0 z-30 flex flex-col gap-3 px-4 pb-4">
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
            <div className="absolute right-0 bottom-1.5 left-0 z-30 flex justify-center gap-1.5">
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
              to={`/buscar?resourceType=${resourceBehavior.resourceType}&page=1`}
              className="transition hover:text-cyan-600 dark:hover:text-cyan-400"
            >
              {t("client:propertyDetail.breadcrumb.resources", {
                defaultValue: t("client:propertyDetail.breadcrumb.properties"),
              })}
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
          <button
            type="button"
            onClick={handleGoBack}
            className="absolute left-4 top-4 z-30 inline-flex items-center gap-2 rounded-xl bg-white/90 px-3.5 py-2 text-sm font-semibold text-slate-800 shadow-lg backdrop-blur-sm transition hover:bg-white dark:bg-slate-900/90 dark:text-slate-100 dark:hover:bg-slate-900"
          >
            <ArrowLeft size={16} />
            {t("chat.actions.back", { defaultValue: "Volver" })}
          </button>

          {/* Dynamic Masonry Grid based on image count */}
          {gallery.length === 1 && (
            // 1 imagen: Full width con altura controlada
            <div className="grid grid-cols-1 h-[400px]">
              <button
                type="button"
                className="relative h-full cursor-pointer overflow-hidden focus:outline-none focus-visible:ring-4 focus-visible:ring-cyan-500/50 group"
                onClick={() => openImageViewer(gallery[0], 0)}
                aria-label={property.title}
              >
                <ProgressiveImage
                  fileId={galleryFileIds[0] || null}
                  src={gallery[0] || FALLBACK_BANNERS[0]}
                  preset="detail"
                  aspectRatio={null}
                  alt={property.title}
                  className="h-full w-full"
                  eager
                />
                <div className="absolute inset-0 bg-black/0 transition-colors duration-300 group-hover:bg-black/10" />
              </button>
            </div>
          )}

          {gallery.length === 2 && (
            // 2 imágenes: Dos columnas iguales con altura controlada
            <div className="grid grid-cols-2 gap-2 h-[400px]">
              {gallery.slice(0, 2).map((url, i) => (
                <button
                  key={url + i}
                  type="button"
                  className="relative h-full cursor-pointer overflow-hidden focus:outline-none focus-visible:ring-4 focus-visible:ring-cyan-500/50 group"
                  onClick={() => openImageViewer(url, i)}
                  aria-label={
                    i === 0 ? property.title : `${property.title} ${i + 1}`
                  }
                >
                  <ProgressiveImage
                    fileId={galleryFileIds[i] || null}
                    src={url || FALLBACK_BANNERS[0]}
                    preset={i === 0 ? "detail" : "card"}
                    aspectRatio={null}
                    alt={
                      i === 0 ? property.title : `${property.title} ${i + 1}`
                    }
                    className="h-full w-full"
                    eager={i === 0}
                  />
                  <div className="absolute inset-0 bg-black/0 transition-colors duration-300 group-hover:bg-black/10" />
                </button>
              ))}
            </div>
          )}

          {gallery.length === 3 && (
            // 3 imágenes: 1 grande izquierda + 2 apiladas derecha (altura controlada)
            <div className="grid grid-cols-2 grid-rows-2 gap-2 h-[400px]">
              {/* Imagen principal (2 filas) */}
              <button
                type="button"
                className="relative col-span-1 row-span-2 cursor-pointer overflow-hidden focus:outline-none focus-visible:ring-4 focus-visible:ring-cyan-500/50 group"
                onClick={() => openImageViewer(gallery[0], 0)}
                aria-label={property.title}
              >
                <ProgressiveImage
                  fileId={galleryFileIds[0] || null}
                  src={gallery[0] || FALLBACK_BANNERS[0]}
                  preset="detail"
                  aspectRatio={null}
                  alt={property.title}
                  className="h-full w-full"
                  eager
                />
                <div className="absolute inset-0 bg-black/0 transition-colors duration-300 group-hover:bg-black/10" />
              </button>

              {/* 2 imágenes apiladas */}
              {gallery.slice(1, 3).map((url, i) => (
                <button
                  key={url + i}
                  type="button"
                  className="relative col-span-1 row-span-1 cursor-pointer overflow-hidden focus:outline-none focus-visible:ring-4 focus-visible:ring-cyan-500/50 group"
                  onClick={() => openImageViewer(url, i + 1)}
                  aria-label={`${property.title} ${i + 2}`}
                >
                  <ProgressiveImage
                    fileId={galleryFileIds[i + 1] || null}
                    src={url || FALLBACK_BANNERS[0]}
                    preset="card"
                    aspectRatio={null}
                    alt={`${property.title} ${i + 2}`}
                    className="h-full w-full"
                  />
                  <div className="absolute inset-0 bg-black/0 transition-colors duration-300 group-hover:bg-black/10" />
                </button>
              ))}
            </div>
          )}

          {gallery.length === 4 && (
            // 4 imágenes: Grid 2x2 simétrico con altura controlada
            <div className="grid grid-cols-2 grid-rows-2 gap-2 h-[400px]">
              {gallery.slice(0, 4).map((url, i) => (
                <button
                  key={url + i}
                  type="button"
                  className="relative cursor-pointer overflow-hidden focus:outline-none focus-visible:ring-4 focus-visible:ring-cyan-500/50 group"
                  onClick={() => openImageViewer(url, i)}
                  aria-label={
                    i === 0 ? property.title : `${property.title} ${i + 1}`
                  }
                >
                  <ProgressiveImage
                    fileId={galleryFileIds[i] || null}
                    src={url || FALLBACK_BANNERS[0]}
                    preset={i === 0 ? "detail" : "card"}
                    aspectRatio={null}
                    alt={
                      i === 0 ? property.title : `${property.title} ${i + 1}`
                    }
                    className="h-full w-full"
                    eager={i === 0}
                  />
                  <div className="absolute inset-0 bg-black/0 transition-colors duration-300 group-hover:bg-black/10" />
                </button>
              ))}
            </div>
          )}

          {gallery.length >= 5 && (
            // 5+ imágenes: Layout estilo Airbnb con altura controlada
            <div className="grid grid-cols-4 grid-rows-2 gap-2 h-[400px]">
              {/* Imagen principal (2 columnas x 2 filas) */}
              <button
                type="button"
                className="relative col-span-2 row-span-2 cursor-pointer overflow-hidden focus:outline-none focus-visible:ring-4 focus-visible:ring-cyan-500/50 group"
                onClick={() => openImageViewer(gallery[0], 0)}
                aria-label={property.title}
              >
                <ProgressiveImage
                  fileId={galleryFileIds[0] || null}
                  src={gallery[0] || FALLBACK_BANNERS[0]}
                  preset="detail"
                  aspectRatio={null}
                  alt={property.title}
                  className="h-full w-full"
                  eager
                />
                <div className="absolute inset-0 bg-black/0 transition-colors duration-300 group-hover:bg-black/10" />
              </button>

              {/* 4 imágenes secundarias (2 columnas x 2 filas del lado derecho) */}
              {gallery.slice(1, 5).map((url, i) => (
                <button
                  key={url + i}
                  type="button"
                  className="relative col-span-1 row-span-1 cursor-pointer overflow-hidden focus:outline-none focus-visible:ring-4 focus-visible:ring-cyan-500/50 group"
                  onClick={() => openImageViewer(url, i + 1)}
                  aria-label={`${property.title} ${i + 2}`}
                >
                  <ProgressiveImage
                    fileId={galleryFileIds[i + 1] || null}
                    src={url || FALLBACK_BANNERS[0]}
                    preset="card"
                    aspectRatio={null}
                    alt={`${property.title} ${i + 2}`}
                    className="h-full w-full"
                  />

                  {/* Overlay en la última imagen si hay más fotos */}
                  {i === 3 && gallery.length > 5 && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/60 transition group-hover:bg-black/50">
                      <span className="flex items-center gap-2 text-lg font-semibold text-white">
                        <Camera size={20} />+{gallery.length - 5}
                      </span>
                    </div>
                  )}

                  <div className="absolute inset-0 bg-black/0 transition-colors duration-300 group-hover:bg-black/10" />
                </button>
              ))}
            </div>
          )}

          {/* View all photos button (absolute) */}
          {gallery.length > 1 && (
            <button
              type="button"
              onClick={() => openImageViewer(gallery[0], 0)}
              className="absolute bottom-4 right-4 hidden items-center gap-2 rounded-xl bg-white/90 px-4 py-2 text-sm font-medium text-slate-800 shadow-lg backdrop-blur-sm transition hover:bg-white md:inline-flex dark:bg-slate-900/90 dark:text-slate-100 dark:hover:bg-slate-900"
            >
              <Camera size={16} />
              {t("client:propertyDetail.viewAllPhotos")} ({gallery.length})
            </button>
          )}
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
                  <Tag size={16} className="text-cyan-600 dark:text-cyan-400" />
                  {t(
                    `client:common.enums.category.${resourceBehavior.category}`,
                    { defaultValue: resourceBehavior.category },
                  )}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <LayoutGrid
                    size={16}
                    className="text-cyan-600 dark:text-cyan-400"
                  />
                  {t(
                    `client:common.enums.resourceType.${resourceBehavior.resourceType}`,
                    { defaultValue: resourceBehavior.resourceType },
                  )}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleShare}
                  className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  <Share2 size={15} />
                  {t("client:propertyDetail.share.action", {
                    defaultValue: "Compartir",
                  })}
                </button>
                <button
                  type="button"
                  onClick={handleToggleFavorite}
                  disabled={favoriteLoading}
                  className={`inline-flex min-h-10 items-center gap-2 rounded-xl border px-3.5 py-2 text-sm font-semibold transition ${
                    isFavorite
                      ? "border-rose-300 bg-rose-50 text-rose-700 hover:bg-rose-100 dark:border-rose-800/70 dark:bg-rose-950/30 dark:text-rose-300"
                      : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                  } disabled:cursor-not-allowed disabled:opacity-60`}
                >
                  <Heart
                    size={15}
                    className={isFavorite ? "fill-current" : ""}
                  />
                  {isFavorite
                    ? t("actions.removeFavorite", {
                        defaultValue: "Quitar de favoritos",
                      })
                    : t("actions.addFavorite", {
                        defaultValue: "Agregar a favoritos",
                      })}
                </button>
              </div>
            </div>

            {/* Mobile: verified badge (title/location already in hero) */}
            <div className="flex items-center gap-2 md:hidden">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
                <ShieldCheck size={13} />
                {t("client:propertyDetail.verifiedListing")}
              </span>
              <button
                type="button"
                onClick={handleShare}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                aria-label={t("client:propertyDetail.share.action", {
                  defaultValue: "Compartir",
                })}
              >
                <Share2 size={14} />
              </button>
              <button
                type="button"
                onClick={handleToggleFavorite}
                disabled={favoriteLoading}
                className={`inline-flex h-8 w-8 items-center justify-center rounded-full border transition ${
                  isFavorite
                    ? "border-rose-300 bg-rose-50 text-rose-700 dark:border-rose-800/70 dark:bg-rose-950/30 dark:text-rose-300"
                    : "border-slate-300 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                } disabled:cursor-not-allowed disabled:opacity-60`}
                aria-label={
                  isFavorite
                    ? t("actions.removeFavorite", {
                        defaultValue: "Quitar de favoritos",
                      })
                    : t("actions.addFavorite", {
                        defaultValue: "Agregar a favoritos",
                      })
                }
              >
                <Heart size={14} className={isFavorite ? "fill-current" : ""} />
              </button>
            </div>

            {/* ── Price bar (mobile only – on desktop it's in sidebar) ── */}
            <div className="lg:hidden">
              <PriceCard
                t={t}
                amountParts={amountParts}
                priceSuffix={priceSuffix}
                priceLabel={priceLabel}
                property={property}
                opType={opType}
                bookingType={resourceBehavior.bookingType}
                isCtaBlocked={isCtaBlocked}
                onContactAgent={handleOpenChat}
                canChat={
                  isChatAuth &&
                  user?.role === "client" &&
                  Boolean(user?.emailVerified) &&
                  user?.$id !== property.ownerUserId
                }
                chatLoading={chatLoading}
              />
            </div>

            {/* ── Quick Stats Grid ──────────────────────── */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {/* ── Property stats ── */}
              {resourceBehavior.resourceType === "property" && (
                <>
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
                </>
              )}

              {/* ── Vehicle stats ── */}
              {resourceBehavior.resourceType === "vehicle" && (
                <>
                  <StatCard
                    icon={Car}
                    label={t("client:resource.type", { defaultValue: "Tipo" })}
                    value={t(
                      `client:common.enums.category.${resourceBehavior.category}`,
                      { defaultValue: resourceBehavior.category },
                    )}
                  />
                  {property.maxGuests > 0 && (
                    <StatCard
                      icon={Users}
                      label={t("client:resource.passengers", {
                        defaultValue: "Pasajeros",
                      })}
                      value={property.maxGuests}
                    />
                  )}
                  {property.totalArea > 0 && (
                    <StatCard
                      icon={Ruler}
                      label={t("client:propertyDetail.stats.totalArea")}
                      value={`${property.totalArea} m²`}
                    />
                  )}
                  <StatCard
                    icon={LayoutGrid}
                    label={t("client:resource.mode", {
                      defaultValue: "Modalidad",
                    })}
                    value={t(
                      `client:common.enums.operation.${resourceBehavior.commercialMode}`,
                      { defaultValue: resourceBehavior.commercialMode },
                    )}
                  />
                </>
              )}

              {/* ── Service stats ── */}
              {resourceBehavior.resourceType === "service" && (
                <>
                  <StatCard
                    icon={Wrench}
                    label={t("client:resource.type", { defaultValue: "Tipo" })}
                    value={t(
                      `client:common.enums.category.${resourceBehavior.category}`,
                      { defaultValue: resourceBehavior.category },
                    )}
                  />
                  <StatCard
                    icon={Clock}
                    label={t("client:resource.duration", {
                      defaultValue: "Duración",
                    })}
                    value={
                      property.minStayNights
                        ? `${property.minStayNights}h`
                        : "—"
                    }
                  />
                  <StatCard
                    icon={MapPin}
                    label={t("client:resource.location", {
                      defaultValue: "Ubicación",
                    })}
                    value={property.city || property.state || "—"}
                  />
                </>
              )}

              {/* ── Experience stats ── */}
              {resourceBehavior.resourceType === "experience" && (
                <>
                  <StatCard
                    icon={Compass}
                    label={t("client:resource.type", { defaultValue: "Tipo" })}
                    value={t(
                      `client:common.enums.category.${resourceBehavior.category}`,
                      { defaultValue: resourceBehavior.category },
                    )}
                  />
                  {property.maxGuests > 0 && (
                    <StatCard
                      icon={Users}
                      label={t("client:resource.maxGuests", {
                        defaultValue: "Máx. personas",
                      })}
                      value={property.maxGuests}
                    />
                  )}
                  <StatCard
                    icon={Clock}
                    label={t("client:resource.duration", {
                      defaultValue: "Duración",
                    })}
                    value={
                      property.minStayNights
                        ? `${property.minStayNights}h`
                        : "—"
                    }
                  />
                  <StatCard
                    icon={MapPin}
                    label={t("client:resource.location", {
                      defaultValue: "Ubicación",
                    })}
                    value={property.city || property.state || "—"}
                  />
                </>
              )}

              {/* ── Venue stats ── */}
              {resourceBehavior.resourceType === "venue" && (
                <>
                  <StatCard
                    icon={CalendarHeart}
                    label={t("client:resource.type", { defaultValue: "Tipo" })}
                    value={t(
                      `client:common.enums.category.${resourceBehavior.category}`,
                      { defaultValue: resourceBehavior.category },
                    )}
                  />
                  {property.maxGuests > 0 && (
                    <StatCard
                      icon={Users}
                      label={t("client:resource.capacity", {
                        defaultValue: "Capacidad",
                      })}
                      value={property.maxGuests}
                    />
                  )}
                  {property.totalArea > 0 && (
                    <StatCard
                      icon={Ruler}
                      label={t("client:propertyDetail.stats.totalArea")}
                      value={`${property.totalArea} m²`}
                    />
                  )}
                  <StatCard
                    icon={MapPin}
                    label={t("client:resource.location", {
                      defaultValue: "Ubicación",
                    })}
                    value={property.city || property.state || "—"}
                  />
                </>
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
            {resourceBehavior.resourceType === "property" &&
              (isRent(opType) || isVacation(opType)) && (
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
            {resourceBehavior.resourceType === "property" &&
              isSale(opType) &&
              (property.furnished || property.yearBuilt) && (
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
                <div className="rounded-2xl border border-slate-200 bg-white p-3 sm:p-4 dark:border-slate-700 dark:bg-slate-900/60">
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {amenities.map((amenity) => {
                      const AmenityIconComp = getAmenityIcon(amenity);
                      return (
                        <div
                          key={amenity.$id}
                          className="flex items-center gap-2.5 px-2 py-1.5 text-sm"
                        >
                          <span
                            aria-hidden="true"
                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-base dark:bg-slate-700"
                          >
                            <AmenityIconComp
                              size={16}
                              className="text-cyan-500 dark:text-cyan-400"
                            />
                          </span>
                          <span className="line-clamp-2 text-slate-700 dark:text-slate-200">
                            {i18n.language === "es"
                              ? amenity.name_es ||
                                amenity.name_en ||
                                amenity.slug
                              : amenity.name_en ||
                                amenity.name_es ||
                                amenity.slug}
                          </span>
                        </div>
                      );
                    })}
                  </div>
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
                <a
                  href={`geo:${property.latitude},${property.longitude}?q=${encodeURIComponent(
                    [
                      property.streetAddress,
                      property.neighborhood,
                      property.city,
                      property.state,
                      property.postalCode,
                    ]
                      .filter(Boolean)
                      .join(", "),
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 flex items-center gap-2 text-sm text-slate-500 hover:text-cyan-600 dark:text-slate-400 dark:hover:text-cyan-400 transition-colors group"
                  title={t(
                    "client:propertyDetail.openInMaps",
                    "Abrir en mapas",
                  )}
                >
                  <MapPin size={14} className="text-cyan-600 shrink-0" />
                  <span className="group-hover:underline">
                    {[
                      property.streetAddress,
                      property.neighborhood,
                      property.city,
                      property.state,
                      property.postalCode,
                    ]
                      .filter(Boolean)
                      .join(", ")}
                  </span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="shrink-0 opacity-50 group-hover:opacity-100"
                  >
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                    <polyline points="15 3 21 3 21 9" />
                    <line x1="10" y1="14" x2="21" y2="3" />
                  </svg>
                </a>
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
                amountParts={amountParts}
                priceSuffix={priceSuffix}
                priceLabel={priceLabel}
                property={property}
                opType={opType}
                bookingType={resourceBehavior.bookingType}
                isCtaBlocked={isCtaBlocked}
                onContactAgent={handleOpenChat}
                canChat={
                  isChatAuth &&
                  user?.role === "client" &&
                  Boolean(user?.emailVerified) &&
                  user?.$id !== property.ownerUserId
                }
                chatLoading={chatLoading}
              />
            </div>

            {/* ── Calendar placeholder ───────────────── */}
            {resourceBehavior.requiresCalendar &&
              resourceBehavior.canOperateMode && (
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                  <h2 className="mb-3 flex items-center gap-2 text-base font-semibold text-slate-900 dark:text-white">
                    <Calendar
                      size={18}
                      className="text-cyan-600 dark:text-cyan-400"
                    />
                    {t("client:propertyDetail.calendar.title")}
                  </h2>
                  <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center dark:border-slate-600 dark:bg-slate-800/50">
                    <Calendar
                      size={32}
                      className="mb-2 text-slate-300 dark:text-slate-600"
                    />
                    <p className="text-sm text-slate-400 dark:text-slate-500">
                      {t("client:propertyDetail.calendar.placeholder")}
                    </p>
                  </div>
                </div>
              )}

            {/* ── Agent Card (with integrated chat) ────── */}
            <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
              <div className="p-5">
                <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  {t("client:propertyDetail.owner.title")}
                </h2>

                <div className="flex items-center gap-4">
                  {/* Owner Avatar */}
                  {ownerAvatarUrl ? (
                    <img
                      src={ownerAvatarUrl}
                      alt={ownerName}
                      className="h-14 w-14 shrink-0 rounded-full object-cover ring-2 ring-cyan-100 dark:ring-cyan-900"
                    />
                  ) : (
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-cyan-500 to-blue-600 text-lg font-bold text-white">
                      {(owner?.firstName?.[0] || "A").toUpperCase()}
                      {(owner?.lastName?.[0] || "").toUpperCase()}
                    </div>
                  )}
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
              </div>

              {/* ── Integrated chat button ──────────── */}
              <AnimatePresence mode="wait">
                {chatOpened ? (
                  /* Success state after chat opened */
                  <motion.div
                    key="chat-success"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.35, ease: "easeOut" }}
                    className="border-t border-emerald-200 bg-emerald-50 px-5 py-4 dark:border-emerald-900/50 dark:bg-emerald-950/30"
                  >
                    <div className="flex items-center gap-3">
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{
                          type: "spring",
                          stiffness: 400,
                          damping: 15,
                          delay: 0.15,
                        }}
                        className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500 text-white"
                      >
                        <MessageCircle size={18} />
                      </motion.div>
                      <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.25 }}
                      >
                        <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                          {t("client:propertyDetail.agent.chatOpened")}
                        </p>
                        <p className="text-xs text-emerald-600/70 dark:text-emerald-400/70">
                          {t("client:propertyDetail.agent.chatOpenedHint")}
                        </p>
                      </motion.div>
                    </div>
                  </motion.div>
                ) : isChatAuth &&
                  user?.role === "client" &&
                  user?.emailVerified &&
                  user?.$id !== property.ownerUserId ? (
                  /* Chat button for verified clients */
                  <motion.div
                    key="chat-button"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="border-t border-slate-100 dark:border-slate-800"
                  >
                    <button
                      type="button"
                      onClick={handleOpenChat}
                      disabled={chatLoading}
                      className="group flex w-full cursor-pointer items-center justify-center gap-2.5 px-5 py-4 text-sm font-semibold text-cyan-700 transition-colors hover:bg-cyan-50 disabled:cursor-not-allowed disabled:opacity-50 dark:text-cyan-400 dark:hover:bg-cyan-950/30"
                    >
                      {chatLoading ? (
                        <Spinner size="xs" />
                      ) : (
                        <motion.span
                          className="inline-flex"
                          whileHover={{ scale: 1.15, rotate: -8 }}
                          transition={{ type: "spring", stiffness: 400 }}
                        >
                          <MessageCircle size={16} />
                        </motion.span>
                      )}
                      {t("client:propertyDetail.agent.startChat")}
                    </button>
                  </motion.div>
                ) : !isChatAuth ? (
                  /* Not logged in */
                  <div className="border-t border-slate-100 px-5 py-4 dark:border-slate-800">
                    <Link
                      to={registerToChatPath}
                      state={{ from: location }}
                      className="flex w-full items-center justify-center gap-2 rounded-lg text-sm font-medium text-slate-500 transition-colors hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800/50"
                    >
                      <MessageCircle size={15} />
                      {t("client:propertyDetail.agent.loginToChat")}
                    </Link>
                    <Link
                      to={loginToChatPath}
                      state={{ from: location }}
                      className="mt-2 block text-center text-xs font-medium text-cyan-600 transition-colors hover:text-cyan-500 dark:text-cyan-400 dark:hover:text-cyan-300"
                    >
                      {t("loginPage.actions.submit", {
                        defaultValue: "Iniciar sesión",
                      })}
                    </Link>
                  </div>
                ) : null}
              </AnimatePresence>
            </article>
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
  const IconComp = Icon;
  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3.5 transition hover:border-slate-300 hover:shadow-sm dark:border-slate-700 dark:bg-slate-800/60 dark:hover:border-slate-600">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-cyan-50 text-cyan-600 dark:bg-cyan-950/40 dark:text-cyan-400">
        <IconComp size={20} />
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
  const IconComp = Icon;
  return (
    <div className="flex items-center gap-3 rounded-xl bg-white/60 px-4 py-3 dark:bg-slate-800/40">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-cyan-50 text-cyan-600 dark:bg-cyan-950/40 dark:text-cyan-400">
        <IconComp size={18} />
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

/** Price + CTA card – adapts per operationType */
function PriceCard({
  t,
  amountParts,
  priceSuffix,
  priceLabel,
  property,
  opType,
  bookingType,
  isCtaBlocked,
  onContactAgent,
  canChat,
  chatLoading,
}) {
  const ctaKey = isSale(opType)
    ? "sale"
    : isHourly(opType)
      ? "hourly"
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
    hourly: {
      bg: "border-indigo-200 bg-linear-to-br from-indigo-50 to-white dark:border-indigo-900/50 dark:from-indigo-950/30 dark:to-slate-900",
      btn: "bg-linear-to-r from-indigo-500 to-cyan-600 hover:from-indigo-400 hover:to-cyan-500",
      priceColor: "text-indigo-700 dark:text-indigo-300",
    },
  };

  const s = styles[ctaKey] || styles.sale;
  const isBookFlow = bookingType && bookingType !== "manual_contact";
  const ctaLabel =
    ctaKey === "hourly"
      ? t("client:propertyDetail.cta.hourly.button", {
          defaultValue: "Reservar horario",
        })
      : t(`client:propertyDetail.cta.${ctaKey}.button`);
  const ctaHint =
    ctaKey === "hourly"
      ? t("client:propertyDetail.cta.hourly.hint", {
          defaultValue: "Confirma disponibilidad por bloques de tiempo.",
        })
      : t(`client:propertyDetail.cta.${ctaKey}.hint`);

  return (
    <article className={`rounded-2xl border p-5 shadow-sm ${s.bg}`}>
      {/* Price */}
      <div className="mb-1">
        <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
          {priceLabel}
        </p>
        <p className={`mt-1 text-3xl font-extrabold ${s.priceColor}`}>
          <span>{amountParts?.main || "$0"}</span>
          <span className="ml-0.5 align-top text-base font-semibold opacity-85">
            {amountParts?.decimals || ".00"}
          </span>
          <span className="ml-1 text-sm font-semibold opacity-85">
            {amountParts?.denomination || property.currency || "MXN"}
          </span>
          {priceSuffix && (
            <span className="ml-2 text-lg font-semibold opacity-70">
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

      {!isCtaBlocked && (
        <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
          {ctaHint}
        </p>
      )}

      {/* CTA Button */}
      {!isCtaBlocked &&
        (isBookFlow ? (
          <Link
            to={`/reservar/${property.slug}`}
            className={`mt-4 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold text-white transition ${s.btn}`}
          >
            {ctaLabel}
            <ArrowRight size={16} />
          </Link>
        ) : (
          <button
            type="button"
            onClick={canChat ? onContactAgent : undefined}
            disabled={chatLoading || !canChat}
            className={`mt-4 inline-flex min-h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold text-white transition disabled:cursor-not-allowed disabled:opacity-60 ${s.btn}`}
          >
            {chatLoading ? <Spinner size="xs" /> : <MessageCircle size={16} />}
            {ctaLabel}
          </button>
        ))}
    </article>
  );
}

export default PropertyDetail;
