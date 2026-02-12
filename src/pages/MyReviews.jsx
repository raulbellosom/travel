import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { MessageSquareText, Star } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { reviewsService } from "../services/reviewsService";
import { propertiesService } from "../services/propertiesService";
import { getErrorMessage } from "../utils/errors";
import EmptyStatePanel from "../components/common/organisms/EmptyStatePanel";

const formatDate = (value, locale) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
};

const MyReviews = () => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reviews, setReviews] = useState([]);
  const [propertyNames, setPropertyNames] = useState({});
  const locale = i18n.language === "en" ? "en-US" : "es-MX";

  useEffect(() => {
    let mounted = true;
    if (!user?.$id) {
      setLoading(false);
      return () => {};
    }

    const load = async () => {
      setLoading(true);
      setError("");

      try {
        const response = await reviewsService.listMine(user.$id);
        const docs = response.documents || [];
        if (!mounted) return;
        setReviews(docs);

        const propertyIds = [...new Set(docs.map((item) => item.propertyId).filter(Boolean))];
        if (propertyIds.length === 0) {
          setPropertyNames({});
          return;
        }

        const entries = await Promise.all(
          propertyIds.map(async (propertyId) => {
            try {
              const property = await propertiesService.getById(propertyId);
              return [propertyId, property?.title || propertyId];
            } catch {
              return [propertyId, propertyId];
            }
          })
        );

        if (!mounted) return;
        setPropertyNames(Object.fromEntries(entries));
      } catch (err) {
        if (!mounted) return;
        setError(getErrorMessage(err, i18n.t("myReviewsPage.errors.load")));
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, [i18n, user?.$id]);

  const averageRating = useMemo(() => {
    if (reviews.length === 0) return 0;
    const sum = reviews.reduce((acc, item) => acc + Number(item.rating || 0), 0);
    return Math.round((sum / reviews.length) * 10) / 10;
  }, [reviews]);

  return (
    <section className="mx-auto max-w-5xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
          {t("myReviewsPage.title")}
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          {t("myReviewsPage.subtitle")}
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2">
        <article className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
          <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-300">
            {t("myReviewsPage.stats.total")}
          </p>
          <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100">{reviews.length}</p>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
          <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-300">
            {t("myReviewsPage.stats.average")}
          </p>
          <p className="mt-2 text-2xl font-bold text-amber-500 dark:text-amber-300">{averageRating}</p>
        </article>
      </div>

      {loading ? (
        <p className="text-sm text-slate-600 dark:text-slate-300">{t("myReviewsPage.loading")}</p>
      ) : null}

      {error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200">
          {error}
        </p>
      ) : null}

      {!loading && !error && reviews.length === 0 ? (
        <EmptyStatePanel
          icon={MessageSquareText}
          title={t("myReviewsPage.empty")}
          description={t("myReviewsPage.subtitle")}
        />
      ) : null}

      {!loading && !error && reviews.length > 0 ? (
        <div className="grid gap-4">
          {reviews.map((review) => (
            <article
              key={review.$id}
              className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-300">
                    {t("myReviewsPage.labels.property")}
                  </p>
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                    {propertyNames[review.propertyId] || review.propertyId}
                  </h2>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                  {t(`reviewStatus.${review.status}`, { defaultValue: review.status })}
                </span>
              </div>

              <div className="mt-3 inline-flex items-center gap-1 text-amber-500">
                {Array.from({ length: 5 }).map((_, index) => (
                  <Star
                    key={`${review.$id}-${index}`}
                    size={16}
                    className={index < Number(review.rating || 0) ? "fill-current" : ""}
                  />
                ))}
                <span className="ml-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
                  {review.rating}/5
                </span>
              </div>

              {review.title ? (
                <h3 className="mt-3 text-sm font-semibold text-slate-900 dark:text-slate-100">{review.title}</h3>
              ) : null}

              <p className="mt-2 inline-flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300">
                <MessageSquareText size={16} className="mt-0.5" />
                <span>{review.comment}</span>
              </p>

              <p className="mt-3 text-xs text-slate-500 dark:text-slate-300">
                {t("myReviewsPage.labels.created")}: {formatDate(review.$createdAt, locale)}
              </p>
            </article>
          ))}
        </div>
      ) : null}
    </section>
  );
};

export default MyReviews;
