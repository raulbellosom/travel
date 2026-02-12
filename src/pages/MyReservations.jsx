import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { CalendarDays, CreditCard, MapPin, Users } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { reservationsService } from "../services/reservationsService";
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

const MyReservations = () => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reservations, setReservations] = useState([]);
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
        const response = await reservationsService.listMine(user.$id);
        const docs = response.documents || [];

        if (!mounted) return;
        setReservations(docs);

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
        setError(getErrorMessage(err, i18n.t("myReservationsPage.errors.load")));
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

  const totals = useMemo(() => {
    const byStatus = reservations.reduce((acc, item) => {
      const key = item.status || "pending";
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    return {
      total: reservations.length,
      pending: byStatus.pending || 0,
      confirmed: byStatus.confirmed || 0,
      completed: byStatus.completed || 0,
    };
  }, [reservations]);

  return (
    <section className="mx-auto max-w-5xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
          {t("myReservationsPage.title")}
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          {t("myReservationsPage.subtitle")}
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <article className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
          <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-300">
            {t("myReservationsPage.stats.total")}
          </p>
          <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100">{totals.total}</p>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
          <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-300">
            {t("myReservationsPage.stats.pending")}
          </p>
          <p className="mt-2 text-2xl font-bold text-amber-600 dark:text-amber-300">{totals.pending}</p>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
          <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-300">
            {t("myReservationsPage.stats.confirmed")}
          </p>
          <p className="mt-2 text-2xl font-bold text-cyan-600 dark:text-cyan-300">{totals.confirmed}</p>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
          <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-300">
            {t("myReservationsPage.stats.completed")}
          </p>
          <p className="mt-2 text-2xl font-bold text-emerald-600 dark:text-emerald-300">{totals.completed}</p>
        </article>
      </div>

      {loading ? (
        <p className="text-sm text-slate-600 dark:text-slate-300">{t("myReservationsPage.loading")}</p>
      ) : null}

      {error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200">
          {error}
        </p>
      ) : null}

      {!loading && !error && reservations.length === 0 ? (
        <EmptyStatePanel
          icon={CalendarDays}
          title={t("myReservationsPage.empty")}
          description={t("myReservationsPage.subtitle")}
        />
      ) : null}

      {!loading && !error && reservations.length > 0 ? (
        <div className="grid gap-4">
          {reservations.map((reservation) => (
            <article
              key={reservation.$id}
              className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-1">
                  <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-300">
                    {t("myReservationsPage.labels.property")}
                  </p>
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                    {propertyNames[reservation.propertyId] || reservation.propertyId}
                  </h2>
                </div>
                <div className="flex flex-wrap gap-2 text-xs">
                  <span className="rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                    {t(`reservationStatus.${reservation.status}`, {
                      defaultValue: reservation.status,
                    })}
                  </span>
                  <span className="rounded-full bg-cyan-100 px-3 py-1 font-semibold text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-200">
                    {t(`paymentStatus.${reservation.paymentStatus}`, {
                      defaultValue: reservation.paymentStatus,
                    })}
                  </span>
                </div>
              </div>

              <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
                <div className="inline-flex items-center gap-2 text-slate-600 dark:text-slate-300">
                  <CalendarDays size={14} />
                  <span>
                    {formatDate(reservation.checkInDate, locale)} -{" "}
                    {formatDate(reservation.checkOutDate, locale)}
                  </span>
                </div>
                <div className="inline-flex items-center gap-2 text-slate-600 dark:text-slate-300">
                  <Users size={14} />
                  <span>
                    {reservation.guestCount} {t("myReservationsPage.labels.guests")}
                  </span>
                </div>
                <div className="inline-flex items-center gap-2 text-slate-600 dark:text-slate-300">
                  <CreditCard size={14} />
                  <span>
                    {new Intl.NumberFormat(locale, {
                      style: "currency",
                      currency: reservation.currency || "MXN",
                    }).format(Number(reservation.totalAmount || 0))}
                  </span>
                </div>
                <div className="inline-flex items-center gap-2 text-slate-600 dark:text-slate-300">
                  <MapPin size={14} />
                  <span>{t("myReservationsPage.labels.created")}: {formatDate(reservation.$createdAt, locale)}</span>
                </div>
              </dl>
            </article>
          ))}
        </div>
      ) : null}
    </section>
  );
};

export default MyReservations;
