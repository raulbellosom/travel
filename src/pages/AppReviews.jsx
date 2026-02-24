import LoadingState from "../components/common/molecules/LoadingState";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Filter, MessageSquareText, Search, Star } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { Select } from "../components/common";
import { reviewsService } from "../services/reviewsService";
import { getErrorMessage } from "../utils/errors";
import EmptyStatePanel from "../components/common/organisms/EmptyStatePanel";

const STATUSES = ["pending", "published", "rejected"];

const AppReviews = () => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState("");
  const [statusFilter, setStatusFilter] = useState(() => {
    const raw = String(searchParams.get("status") || "").trim();
    return STATUSES.includes(raw) ? raw : "";
  });
  const [queryFilter, setQueryFilter] = useState(() =>
    String(searchParams.get("search") || "").trim(),
  );
  const [reviews, setReviews] = useState([]);
  const focusId = String(searchParams.get("focus") || "").trim();

  const load = useCallback(async () => {
    if (!user?.$id) return;
    setLoading(true);
    setError("");
    try {
      const response = await reviewsService.listForModeration(user.$id, {
        status: statusFilter,
      });
      setReviews(response.documents || []);
    } catch (err) {
      setError(getErrorMessage(err, i18n.t("appReviewsPage.errors.load")));
    } finally {
      setLoading(false);
    }
  }, [statusFilter, user?.$id]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const nextSearch = String(searchParams.get("search") || "").trim();
    const nextStatusRaw = String(searchParams.get("status") || "").trim();
    const nextStatus = STATUSES.includes(nextStatusRaw) ? nextStatusRaw : "";

    setQueryFilter((prev) => (prev === nextSearch ? prev : nextSearch));
    setStatusFilter((prev) => (prev === nextStatus ? prev : nextStatus));
  }, [searchParams]);

  const normalizedFilter = String(queryFilter || "")
    .trim()
    .toLowerCase();
  const filteredReviews = useMemo(() => {
    if (!normalizedFilter) return reviews;

    return reviews.filter((review) => {
      const text = [
        review.$id,
        review.propertyId,
        review.authorName,
        review.title,
        review.comment,
        review.status,
      ]
        .map((value) => String(value || "").toLowerCase())
        .join(" ");
      return text.includes(normalizedFilter);
    });
  }, [normalizedFilter, reviews]);

  useEffect(() => {
    if (loading || !focusId) return;
    const card = document.getElementById(`review-${focusId}`);
    card?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [filteredReviews.length, focusId, loading]);

  const statusOptions = useMemo(
    () => [
      { value: "", label: t("appReviewsPage.filters.all") },
      ...STATUSES.map((status) => ({
        value: status,
        label: t(`reviewStatus.${status}`),
      })),
    ],
    [t],
  );

  const moderate = async (reviewId, status) => {
    setBusyId(reviewId);
    setError("");
    try {
      await reviewsService.moderateReview(reviewId, status);
      await load();
    } catch (err) {
      setError(getErrorMessage(err, t("appReviewsPage.errors.update")));
    } finally {
      setBusyId("");
    }
  };

  return (
    <section className="space-y-5">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
          {t("appReviewsPage.title")}
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          {t("appReviewsPage.subtitle")}
        </p>
      </header>

      <div className="grid gap-3 sm:max-w-3xl sm:grid-cols-2">
        <label className="grid gap-1 text-sm">
          <span className="inline-flex items-center gap-2">
            <Search size={14} />
            {t("appReviewsPage.filters.search", { defaultValue: "Buscar" })}
          </span>
          <input
            value={queryFilter}
            onChange={(event) => setQueryFilter(event.target.value)}
            placeholder={t("appReviewsPage.filters.searchPlaceholder", {
              defaultValue: "Autor, propiedad, estado, titulo o comentario",
            })}
            className="min-h-11 rounded-lg border border-slate-300 bg-white px-3 py-2 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 dark:border-slate-600 dark:bg-slate-800"
          />
        </label>
        <label className="grid gap-1 text-sm">
          <span className="inline-flex items-center gap-2">
            <Filter size={14} />
            {t("appReviewsPage.filters.status")}
          </span>
          <Select
            value={statusFilter}
            onChange={(value) => setStatusFilter(value)}
            options={statusOptions}
            size="md"
          />
        </label>
      </div>

      {loading ? <LoadingState text={t("appReviewsPage.loading")} /> : null}
      {error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200">
          {error}
        </p>
      ) : null}

      {!loading && !error && filteredReviews.length === 0 ? (
        <EmptyStatePanel
          icon={MessageSquareText}
          title={t("appReviewsPage.empty")}
          description={t("appReviewsPage.subtitle")}
          compact
        />
      ) : null}

      {!loading && filteredReviews.length > 0 ? (
        <div className="grid gap-4">
          {filteredReviews.map((review) => {
            const isFocused = Boolean(focusId) && review.$id === focusId;
            return (
              <article
                key={review.$id}
                id={`review-${review.$id}`}
                className={`rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900 ${
                  isFocused
                    ? "ring-2 ring-cyan-400/70 dark:ring-cyan-500/70"
                    : ""
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-300">
                      {review.propertyId}
                    </p>
                    <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {review.authorName}
                    </h2>
                  </div>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                    {t(`reviewStatus.${review.status}`, {
                      defaultValue: review.status,
                    })}
                  </span>
                </div>

                <p className="mt-2 inline-flex items-center gap-1 text-amber-500">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <Star
                      key={`${review.$id}-${index}`}
                      size={15}
                      className={
                        index < Number(review.rating || 0) ? "fill-current" : ""
                      }
                    />
                  ))}
                </p>

                {review.title ? (
                  <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {review.title}
                  </p>
                ) : null}

                <p className="mt-2 inline-flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300">
                  <MessageSquareText size={15} className="mt-0.5" />
                  <span>{review.comment}</span>
                </p>

                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={busyId === review.$id}
                    onClick={() => moderate(review.$id, "published")}
                    className="min-h-10 rounded-lg border border-emerald-300 px-3 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-50 disabled:opacity-60 dark:border-emerald-700 dark:text-emerald-300 dark:hover:bg-emerald-950/30"
                  >
                    {t("appReviewsPage.actions.publish")}
                  </button>
                  <button
                    type="button"
                    disabled={busyId === review.$id}
                    onClick={() => moderate(review.$id, "rejected")}
                    className="min-h-10 rounded-lg border border-rose-300 px-3 text-xs font-semibold text-rose-700 transition hover:bg-rose-50 disabled:opacity-60 dark:border-rose-700 dark:text-rose-300 dark:hover:bg-rose-950/30"
                  >
                    {t("appReviewsPage.actions.reject")}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      ) : null}
    </section>
  );
};

export default AppReviews;
