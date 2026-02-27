import { useEffect, useMemo, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Star,
  MessageSquareText,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Home,
  Filter,
  Search,
  PenLine,
  ChevronDown,
  ChevronUp,
  Sparkles,
  CalendarDays,
  X,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { reviewsService } from "../services/reviewsService";
import { resourcesService } from "../services/resourcesService";
import { reservationsService } from "../services/reservationsService";
import { getErrorMessage } from "../utils/errors";
import { usePageSeo } from "../hooks/usePageSeo";
import { Select } from "../components/common";
import env from "../env";
import { executeJsonFunction } from "../utils/functions";

/* ── Helpers ──────────────────────────────────────────────────────────── */
const formatDate = (value, locale) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
};

const STATUS_ICON = {
  pending: Clock,
  published: CheckCircle2,
  rejected: XCircle,
};

const STATUS_STYLE = {
  pending: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  published: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  rejected: "bg-rose-500/10 text-rose-400 border-rose-500/20",
};

const STATUS_ACCENT = {
  pending: "bg-amber-500",
  published: "bg-emerald-500",
  rejected: "bg-rose-500",
};

const FILTER_TABS = ["all", "pending", "published", "rejected"];

/* ── Star Rating Display ──────────────────────────────────────────────── */
const StarRating = ({ rating, size = 14 }) => (
  <div className="inline-flex items-center gap-0.5">
    {Array.from({ length: 5 }).map((_, i) => (
      <Star
        key={i}
        size={size}
        className={`${
          i < Number(rating || 0)
            ? "fill-amber-400 text-amber-400"
            : "text-slate-300 dark:text-slate-600"
        } transition-colors`}
      />
    ))}
  </div>
);

/* ── Interactive Star Rating ──────────────────────────────────────────── */
const StarRatingInput = ({ value, onChange }) => {
  const [hovered, setHovered] = useState(0);
  return (
    <div
      className="inline-flex items-center gap-1"
      role="radiogroup"
      aria-label="Rating"
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          role="radio"
          aria-checked={value === star}
          aria-label={`${star} star${star > 1 ? "s" : ""}`}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          onClick={() => onChange(star)}
          className="rounded-sm p-0.5 transition-transform focus-visible:ring-2 focus-visible:ring-cyan-500 active:scale-90"
        >
          <Star
            size={28}
            className={`transition-colors ${
              star <= (hovered || value)
                ? "fill-amber-400 text-amber-400"
                : "text-slate-300 dark:text-slate-600"
            }`}
          />
        </button>
      ))}
    </div>
  );
};

/* ── Stat Pill ────────────────────────────────────────────────────────── */
const StatPill = ({
  label,
  value,
  color = "text-slate-800 dark:text-slate-100",
  active,
  onClick,
}) => (
  <button
    type="button"
    onClick={onClick}
    className={`flex items-center gap-2.5 rounded-2xl border px-4 py-3 text-left transition-all ${
      active
        ? "border-cyan-500/40 bg-cyan-500/10 shadow-sm shadow-cyan-500/5"
        : "border-slate-200 dark:border-slate-700/40 bg-slate-100 dark:bg-slate-800/40 [@media(hover:hover)]:hover:border-slate-300 [@media(hover:hover)]:dark:hover:border-slate-600/60 [@media(hover:hover)]:hover:bg-slate-200/70 [@media(hover:hover)]:dark:hover:bg-slate-800/70"
    }`}
  >
    <span className={`text-2xl font-extrabold tracking-tight ${color}`}>
      {value}
    </span>
    <span className="text-[11px] font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
      {label}
    </span>
  </button>
);

/* ── Review Card ──────────────────────────────────────────────────────── */
const ReviewCard = ({ review, propertyName, locale, t }) => {
  const [expanded, setExpanded] = useState(false);
  const status = review.status || "pending";
  const StatusIcon = STATUS_ICON[status] || Clock;
  const statusStyle = STATUS_STYLE[status] || STATUS_STYLE.pending;
  const accentColor = STATUS_ACCENT[status] || STATUS_ACCENT.pending;
  const isLongComment = (review.comment || "").length > 180;

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.25 }}
      className="group relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700/40 bg-white dark:bg-slate-800/50
                 shadow-sm transition-all
                 [@media(hover:hover)]:hover:border-slate-300 [@media(hover:hover)]:dark:hover:border-slate-600/60 [@media(hover:hover)]:hover:shadow-md
                 [@media(hover:hover)]:hover:shadow-cyan-500/5"
    >
      {/* Status accent line */}
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${accentColor}`} />

      <div className="p-4 pl-5 sm:p-5 sm:pl-6">
        {/* Top: Property + Status */}
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-base font-bold text-slate-800 dark:text-slate-100 sm:text-lg">
              {propertyName}
            </h3>
            <div className="mt-1.5 flex items-center gap-2">
              <StarRating rating={review.rating} size={14} />
              <span className="text-sm font-bold tabular-nums text-amber-500">
                {review.rating}/5
              </span>
            </div>
          </div>

          <span
            className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${statusStyle}`}
          >
            <StatusIcon className="h-3 w-3" aria-hidden="true" />
            {t(`reviewStatus.${status}`, { defaultValue: status })}
          </span>
        </div>

        {/* Title */}
        {review.title && (
          <h4 className="mt-3 text-sm font-semibold text-slate-700 dark:text-slate-200">
            {review.title}
          </h4>
        )}

        {/* Comment */}
        <div className="mt-2">
          <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            {isLongComment && !expanded
              ? `${review.comment.slice(0, 180)}…`
              : review.comment}
          </p>
          {isLongComment && (
            <button
              type="button"
              onClick={() => setExpanded(!expanded)}
              className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-cyan-500 transition-colors [@media(hover:hover)]:hover:text-cyan-400"
            >
              {expanded
                ? t("myReviewsPage.actions.readLess", {
                    defaultValue: "Read less",
                  })
                : t("myReviewsPage.actions.readMore", {
                    defaultValue: "Read more",
                  })}
              {expanded ? (
                <ChevronUp className="h-3 w-3" />
              ) : (
                <ChevronDown className="h-3 w-3" />
              )}
            </button>
          )}
        </div>

        {/* Footer: Date */}
        <div className="mt-4 flex items-center gap-3 border-t border-slate-200 dark:border-slate-700/30 pt-3">
          <span className="flex items-center gap-1.5 text-xs text-slate-400">
            <MessageSquareText className="h-3 w-3" aria-hidden="true" />
            {formatDate(review.$createdAt, locale)}
          </span>
          {review.publishedAt && status === "published" && (
            <span className="flex items-center gap-1.5 text-xs text-emerald-400">
              <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
              {formatDate(review.publishedAt, locale)}
            </span>
          )}
        </div>
      </div>
    </motion.article>
  );
};

/* ── Write Review Modal ───────────────────────────────────────────────── */
const WriteReviewForm = ({
  allReservations,
  reviewedReservationIds,
  propertyNames,
  locale,
  t,
  onSubmit,
  onClose,
  submitting,
  submitError,
}) => {
  const [selectedReservation, setSelectedReservation] = useState("");
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");

  const selected = allReservations.find((r) => r.$id === selectedReservation);
  const isAlreadyReviewed = reviewedReservationIds.has(selectedReservation);

  // Build options for the Select component
  const reservationOptions = useMemo(() => {
    // Show all reservations that are completed/confirmed+paid
    const eligible = allReservations.filter((r) => {
      return (
        (r.status === "completed" || r.status === "confirmed") &&
        r.paymentStatus === "paid"
      );
    });

    return eligible.map((r) => {
      const propName =
        propertyNames[r.resourceId || r.propertyId] ||
        r.resourceId ||
        r.propertyId;
      const dateStr = formatDate(r.checkInDate, locale);
      const reviewed = reviewedReservationIds.has(r.$id);

      return {
        value: r.$id,
        label: propName,
        description: reviewed
          ? `${dateStr} · ✅ ${t("myReviewsPage.writeReview.alreadyReviewed", { defaultValue: "Already reviewed" })}`
          : dateStr,
        icon: reviewed ? CheckCircle2 : CalendarDays,
      };
    });
  }, [allReservations, propertyNames, reviewedReservationIds, locale, t]);

  const canSubmit =
    selectedReservation &&
    !isAlreadyReviewed &&
    rating >= 1 &&
    rating <= 5 &&
    comment.trim().length >= 10 &&
    !submitting;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    onSubmit({
      resourceId: selected?.resourceId || selected?.propertyId,
      reservationId: selectedReservation,
      rating,
      title: title.trim() || undefined,
      comment: comment.trim(),
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
      className="rounded-2xl border border-cyan-500/30 bg-linear-to-br from-cyan-500/5 via-transparent to-transparent
                 dark:from-cyan-500/10 p-5 sm:p-6 shadow-sm shadow-cyan-500/5"
    >
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-400">
            <PenLine className="h-4 w-4" />
          </div>
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
            {t("myReviewsPage.writeReview.title", {
              defaultValue: "Write a review",
            })}
          </h3>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-1.5 text-slate-400 transition-colors [@media(hover:hover)]:hover:bg-slate-200/60 [@media(hover:hover)]:hover:text-slate-600 dark:[@media(hover:hover)]:hover:bg-slate-700"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Reservation selector */}
        <div className="space-y-1.5">
          <Select
            label={t("myReviewsPage.writeReview.selectReservation", {
              defaultValue: "Select reservation",
            })}
            placeholder={t("myReviewsPage.writeReview.choosePlaceholder", {
              defaultValue: "— Choose a reservation —",
            })}
            value={selectedReservation}
            onChange={(val) => setSelectedReservation(val)}
            options={reservationOptions}
            size="md"
          />
          {isAlreadyReviewed && selectedReservation && (
            <p className="flex items-center gap-1.5 text-xs text-amber-500">
              <AlertCircle className="h-3 w-3" />
              {t("myReviewsPage.writeReview.alreadyReviewedHint", {
                defaultValue:
                  "This reservation already has a review. Choose another one.",
              })}
            </p>
          )}
        </div>

        {/* Rating */}
        <div className="space-y-1.5">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {t("myReviewsPage.writeReview.rating", {
              defaultValue: "Rating",
            })}
          </span>
          <StarRatingInput value={rating} onChange={setRating} />
        </div>

        {/* Title (optional) */}
        <label className="block space-y-1.5">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {t("myReviewsPage.writeReview.titleLabel", {
              defaultValue: "Title (optional)",
            })}
          </span>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={160}
            placeholder={t("myReviewsPage.writeReview.titlePlaceholder", {
              defaultValue: "Summarize your experience...",
            })}
            className="w-full rounded-xl border border-slate-200 dark:border-slate-700/40 bg-white dark:bg-slate-800/50
                       py-2.5 px-3 text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 outline-none transition-colors
                       focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20"
          />
        </label>

        {/* Comment */}
        <label className="block space-y-1.5">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {t("myReviewsPage.writeReview.comment", {
              defaultValue: "Your review",
            })}
          </span>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            maxLength={3000}
            rows={4}
            placeholder={t("myReviewsPage.writeReview.commentPlaceholder", {
              defaultValue: "Share your experience (at least 10 characters)...",
            })}
            className="w-full resize-none rounded-xl border border-slate-200 dark:border-slate-700/40 bg-white dark:bg-slate-800/50
                       py-2.5 px-3 text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 outline-none transition-colors
                       focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20"
          />
          <span className="text-[10px] text-slate-400">
            {comment.length}/3000
          </span>
        </label>

        {/* Error */}
        {submitError && (
          <div className="flex items-center gap-2 rounded-xl border border-red-200 dark:border-red-900/40 bg-red-50 dark:bg-red-950/30 px-4 py-2.5">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
            <p className="text-xs text-red-600 dark:text-red-300">
              {submitError}
            </p>
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={!canSubmit}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-600 py-3 text-sm font-semibold text-white shadow
                     transition-all [@media(hover:hover)]:hover:bg-cyan-500 active:scale-[0.98]
                     disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
        >
          {submitting ? (
            <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
          {submitting
            ? t("myReviewsPage.writeReview.submitting", {
                defaultValue: "Submitting...",
              })
            : t("myReviewsPage.writeReview.submit", {
                defaultValue: "Submit review",
              })}
        </button>
      </form>
    </motion.div>
  );
};

/* ── Main Page ────────────────────────────────────────────────────────── */
const MyReviews = () => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reviews, setReviews] = useState([]);
  const [propertyNames, setPropertyNames] = useState({});
  const [activeFilter, setActiveFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [allReservations, setAllReservations] = useState([]);
  const [reviewedReservationIds, setReviewedReservationIds] = useState(
    new Set(),
  );
  const [showWriteForm, setShowWriteForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const locale = i18n.language === "en" ? "en-US" : "es-MX";

  usePageSeo({
    title: `Inmobo | ${t("myReviewsPage.title")}`,
    description: t("myReviewsPage.subtitle"),
    robots: "noindex, nofollow",
  });

  const load = useCallback(async () => {
    if (!user?.$id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");

    try {
      // Fetch reviews and reservations in parallel
      const [reviewsRes, reservationsRes] = await Promise.all([
        reviewsService.listMine(user.$id),
        reservationsService.listMine(user.$id),
      ]);
      const docs = reviewsRes.documents || [];
      const fetchedReservations = reservationsRes.documents || [];
      setReviews(docs);
      setAllReservations(fetchedReservations);

      // Compute reviewed reservation IDs
      const reviewedIds = new Set(
        docs.map((r) => r.reservationId).filter(Boolean),
      );
      setReviewedReservationIds(reviewedIds);

      // Collect all property IDs from reviews + reservations
      const allPropertyIds = [
        ...new Set([
          ...docs
            .map((item) => item.resourceId || item.propertyId)
            .filter(Boolean),
          ...fetchedReservations
            .map((r) => r.resourceId || r.propertyId)
            .filter(Boolean),
        ]),
      ];

      if (allPropertyIds.length > 0) {
        const entries = await Promise.all(
          allPropertyIds.map(async (propertyId) => {
            try {
              const property = await resourcesService.getById(propertyId);
              return [propertyId, property?.title || propertyId];
            } catch {
              return [propertyId, propertyId];
            }
          }),
        );
        setPropertyNames(Object.fromEntries(entries));
      } else {
        setPropertyNames({});
      }
    } catch (err) {
      setError(getErrorMessage(err, t("myReviewsPage.errors.load")));
    } finally {
      setLoading(false);
    }
  }, [user?.$id, t]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSubmitReview = useCallback(
    async (data) => {
      setSubmitting(true);
      setSubmitError("");
      try {
        const functionId = env.appwrite.functions.createReview;
        if (!functionId) {
          throw new Error("Review function not configured");
        }
        await executeJsonFunction(functionId, data);
        setShowWriteForm(false);
        // Reload
        await load();
      } catch (err) {
        setSubmitError(
          getErrorMessage(
            err,
            t("myReviewsPage.errors.submit", {
              defaultValue: "Could not submit your review.",
            }),
          ),
        );
      } finally {
        setSubmitting(false);
      }
    },
    [load, t],
  );

  const totals = useMemo(() => {
    const byStatus = reviews.reduce((acc, item) => {
      const key = item.status || "pending";
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    return {
      total: reviews.length,
      pending: byStatus.pending || 0,
      published: byStatus.published || 0,
      rejected: byStatus.rejected || 0,
    };
  }, [reviews]);

  const averageRating = useMemo(() => {
    if (reviews.length === 0) return 0;
    const sum = reviews.reduce(
      (acc, item) => acc + Number(item.rating || 0),
      0,
    );
    return Math.round((sum / reviews.length) * 10) / 10;
  }, [reviews]);

  const filtered = useMemo(() => {
    let list = reviews;

    // Status filter
    if (activeFilter !== "all") {
      list = list.filter((r) => r.status === activeFilter);
    }

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((r) => {
        const name = propertyNames[r.resourceId || r.propertyId] || "";
        return (
          name.toLowerCase().includes(q) ||
          (r.title || "").toLowerCase().includes(q) ||
          (r.comment || "").toLowerCase().includes(q) ||
          (r.authorName || "").toLowerCase().includes(q) ||
          (r.status || "").toLowerCase().includes(q)
        );
      });
    }

    return list;
  }, [reviews, activeFilter, searchQuery, propertyNames]);

  // Whether there are any reservations eligible for new reviews
  const hasEligibleReservations = useMemo(() => {
    return allReservations.some((r) => {
      const isEligible =
        (r.status === "completed" || r.status === "confirmed") &&
        r.paymentStatus === "paid";
      return isEligible;
    });
  }, [allReservations]);

  return (
    <div className="min-h-screen pt-20 pb-12 sm:pt-24">
      <section className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        {/* ── Header ─────────────────────────────────────── */}
        <header className="mb-6">
          {/* Breadcrumb */}
          <nav className="mb-3 flex items-center gap-2 text-xs text-slate-500">
            <Link
              to="/"
              className="inline-flex items-center gap-1 rounded-lg px-2 py-1 font-medium transition-colors
                         [@media(hover:hover)]:hover:bg-slate-200/60 [@media(hover:hover)]:dark:hover:bg-slate-800/60 [@media(hover:hover)]:hover:text-cyan-500 [@media(hover:hover)]:dark:hover:text-cyan-300"
            >
              <Home className="h-3.5 w-3.5" aria-hidden="true" />
              {t("voucherPage.breadcrumb.home", { defaultValue: "Inicio" })}
            </Link>
            <span className="text-slate-600">/</span>
            <span className="font-medium text-slate-700 dark:text-slate-300">
              {t("myReviewsPage.title")}
            </span>
          </nav>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400">
                <Star className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 sm:text-2xl">
                  {t("myReviewsPage.title")}
                </h1>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400 sm:text-sm">
                  {t("myReviewsPage.subtitle")}
                </p>
              </div>
            </div>

            {/* Write review CTA */}
            {hasEligibleReservations && !showWriteForm && (
              <button
                type="button"
                onClick={() => setShowWriteForm(true)}
                className="flex items-center gap-2 rounded-xl bg-cyan-600 px-4 py-2.5 text-sm font-semibold text-white shadow
                           transition-all [@media(hover:hover)]:hover:bg-cyan-500 active:scale-[0.98]"
              >
                <PenLine className="h-4 w-4" />
                {t("myReviewsPage.actions.writeReview", {
                  defaultValue: "Write a review",
                })}
              </button>
            )}
          </div>
        </header>

        {/* ── Stats row ──────────────────────────────────── */}
        <div className="mb-4 flex flex-wrap gap-2">
          <StatPill
            label={t("myReviewsPage.stats.total")}
            value={totals.total}
            active={activeFilter === "all"}
            onClick={() => setActiveFilter("all")}
          />
          <StatPill
            label={t("myReviewsPage.stats.pending")}
            value={totals.pending}
            color="text-amber-400"
            active={activeFilter === "pending"}
            onClick={() => setActiveFilter("pending")}
          />
          <StatPill
            label={t("myReviewsPage.stats.published")}
            value={totals.published}
            color="text-emerald-400"
            active={activeFilter === "published"}
            onClick={() => setActiveFilter("published")}
          />
          <StatPill
            label={t("myReviewsPage.stats.rejected")}
            value={totals.rejected}
            color="text-rose-400"
            active={activeFilter === "rejected"}
            onClick={() => setActiveFilter("rejected")}
          />
        </div>

        {/* Average rating display */}
        {reviews.length > 0 && (
          <div className="mb-6 flex items-center gap-3 rounded-2xl border border-amber-500/20 bg-amber-500/5 px-4 py-3">
            <StarRating rating={Math.round(averageRating)} size={16} />
            <span className="text-lg font-bold tabular-nums text-amber-500">
              {averageRating}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {t("myReviewsPage.stats.average")}
            </span>
          </div>
        )}

        {/* ── Write Review Form ──────────────────────────── */}
        <AnimatePresence>
          {showWriteForm && (
            <div className="mb-6">
              <WriteReviewForm
                allReservations={allReservations}
                reviewedReservationIds={reviewedReservationIds}
                propertyNames={propertyNames}
                locale={locale}
                t={t}
                onSubmit={handleSubmitReview}
                onClose={() => {
                  setShowWriteForm(false);
                  setSubmitError("");
                }}
                submitting={submitting}
                submitError={submitError}
              />
            </div>
          )}
        </AnimatePresence>

        {/* ── Search ─────────────────────────────────────── */}
        {reviews.length > 3 && (
          <div className="relative mb-5">
            <Search
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
              aria-hidden="true"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t("myReviewsPage.searchPlaceholder", {
                defaultValue: "Search by property, title, comment...",
              })}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700/40 bg-white dark:bg-slate-800/40 py-2.5 pl-9 pr-4
                         text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 outline-none transition-colors
                         focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20"
            />
          </div>
        )}

        {/* ── Loading skeleton ───────────────────────────── */}
        {loading && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-36 animate-pulse rounded-2xl border border-slate-200 dark:border-slate-700/30 bg-slate-100 dark:bg-slate-800/40"
              />
            ))}
          </div>
        )}

        {/* ── Error ──────────────────────────────────────── */}
        {!loading && error && (
          <div className="flex items-center gap-3 rounded-2xl border border-red-200 dark:border-red-900/40 bg-red-50 dark:bg-red-950/30 px-5 py-4">
            <AlertCircle className="h-5 w-5 shrink-0 text-red-400" />
            <p className="text-sm text-red-600 dark:text-red-300">{error}</p>
          </div>
        )}

        {/* ── Empty state ────────────────────────────────── */}
        {!loading && !error && reviews.length === 0 && (
          <div className="flex flex-col items-center gap-4 rounded-3xl border border-dashed border-slate-300 dark:border-slate-700/40 bg-slate-50 dark:bg-slate-800/20 px-6 py-16 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-200/60 dark:bg-slate-800/60 text-slate-400 dark:text-slate-500">
              <MessageSquareText className="h-8 w-8" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-600 dark:text-slate-300">
                {t("myReviewsPage.empty")}
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                {t("myReviewsPage.emptyDesc", {
                  defaultValue: "When you leave a review, it will appear here.",
                })}
              </p>
            </div>
            {hasEligibleReservations && (
              <button
                type="button"
                onClick={() => setShowWriteForm(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-4 py-2.5 text-sm font-semibold text-white shadow
                           transition-colors [@media(hover:hover)]:hover:bg-cyan-500"
              >
                <PenLine className="h-4 w-4" />
                {t("myReviewsPage.actions.writeReview", {
                  defaultValue: "Write a review",
                })}
              </button>
            )}
            {!hasEligibleReservations && (
              <Link
                to="/"
                className="inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-4 py-2.5 text-sm font-semibold text-white shadow
                           transition-colors [@media(hover:hover)]:hover:bg-cyan-500"
              >
                {t("myReviewsPage.actions.explore", {
                  defaultValue: "Explore properties",
                })}
              </Link>
            )}
          </div>
        )}

        {/* ── No results for filter ──────────────────────── */}
        {!loading && !error && reviews.length > 0 && filtered.length === 0 && (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700/40 bg-slate-50 dark:bg-slate-800/20 px-6 py-10 text-center">
            <Filter className="h-6 w-6 text-slate-500" />
            <p className="text-sm text-slate-400">
              {t("myReviewsPage.noResults", {
                defaultValue: "No reviews match your filter.",
              })}
            </p>
            <button
              type="button"
              onClick={() => {
                setActiveFilter("all");
                setSearchQuery("");
              }}
              className="text-xs font-semibold text-cyan-400 transition-colors [@media(hover:hover)]:hover:text-cyan-300"
            >
              {t("myReviewsPage.actions.clearFilters", {
                defaultValue: "Clear filters",
              })}
            </button>
          </div>
        )}

        {/* ── Review list ────────────────────────────────── */}
        {!loading && !error && filtered.length > 0 && (
          <AnimatePresence mode="popLayout">
            <div className="flex flex-col gap-3">
              {filtered.map((review) => (
                <ReviewCard
                  key={review.$id}
                  review={review}
                  propertyName={
                    propertyNames[review.resourceId || review.propertyId] ||
                    review.resourceId ||
                    review.propertyId
                  }
                  locale={locale}
                  t={t}
                />
              ))}
            </div>
          </AnimatePresence>
        )}

        {/* ── Footer hint ────────────────────────────────── */}
        {!loading && filtered.length > 0 && (
          <p className="mt-6 text-center text-[11px] text-slate-600">
            {t("myReviewsPage.footerHint", {
              defaultValue: "Showing {{count}} review(s)",
              count: filtered.length,
            })}
          </p>
        )}
      </section>
    </div>
  );
};

export default MyReviews;
