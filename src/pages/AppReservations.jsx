import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { CalendarDays, CreditCard, Filter, Search, User } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { Select } from "../components/common";
import { reservationsService } from "../services/reservationsService";
import { getErrorMessage } from "../utils/errors";
import EmptyStatePanel from "../components/common/organisms/EmptyStatePanel";
import { formatMoneyWithDenomination } from "../utils/money";

const RESERVATION_STATUSES = [
  "pending",
  "confirmed",
  "completed",
  "cancelled",
  "expired",
];
const PAYMENT_STATUSES = ["unpaid", "pending", "paid", "failed", "refunded"];

const AppReservations = () => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState("");
  const [reservations, setReservations] = useState([]);
  const [filters, setFilters] = useState({
    status: "",
    paymentStatus: "",
  });
  const [queryFilter, setQueryFilter] = useState(() =>
    String(searchParams.get("search") || "").trim(),
  );
  const locale = i18n.language === "en" ? "en-US" : "es-MX";
  const focusId = searchParams.get("focus") || "";

  useEffect(() => {
    const nextSearch = String(searchParams.get("search") || "").trim();
    setQueryFilter((prev) => (prev === nextSearch ? prev : nextSearch));
  }, [searchParams]);

  const load = useCallback(async () => {
    if (!user?.$id) return;
    setLoading(true);
    setError("");
    try {
      const response = await reservationsService.listForOwner(
        user.$id,
        filters,
      );
      setReservations(response.documents || []);
    } catch (err) {
      setError(getErrorMessage(err, i18n.t("appReservationsPage.errors.load")));
    } finally {
      setLoading(false);
    }
  }, [filters, user?.$id]);

  useEffect(() => {
    load();
  }, [load]);

  const normalizedFilter = String(queryFilter || "")
    .trim()
    .toLowerCase();
  const filteredReservations = useMemo(() => {
    if (!normalizedFilter) return reservations;

    return reservations.filter((item) => {
      const text = [
        item.$id,
        item.propertyId,
        item.guestName,
        item.guestEmail,
        item.guestPhone,
        item.status,
        item.paymentStatus,
      ]
        .map((value) => String(value || "").toLowerCase())
        .join(" ");
      return text.includes(normalizedFilter);
    });
  }, [normalizedFilter, reservations]);

  useEffect(() => {
    if (loading || !focusId) return;
    const card = document.getElementById(`reservation-${focusId}`);
    card?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [filteredReservations.length, focusId, loading]);

  const stats = useMemo(() => {
    const pending = filteredReservations.filter(
      (item) => item.status === "pending",
    ).length;
    const confirmed = filteredReservations.filter(
      (item) => item.status === "confirmed",
    ).length;
    const paid = filteredReservations.filter(
      (item) => item.paymentStatus === "paid",
    ).length;
    return {
      total: filteredReservations.length,
      pending,
      confirmed,
      paid,
    };
  }, [filteredReservations]);

  const reservationStatusOptions = useMemo(
    () => [
      { value: "", label: t("appReservationsPage.filters.all") },
      ...RESERVATION_STATUSES.map((status) => ({
        value: status,
        label: t(`reservationStatus.${status}`),
      })),
    ],
    [t],
  );

  const paymentStatusOptions = useMemo(
    () => [
      { value: "", label: t("appReservationsPage.filters.all") },
      ...PAYMENT_STATUSES.map((status) => ({
        value: status,
        label: t(`paymentStatus.${status}`),
      })),
    ],
    [t],
  );

  const updateReservation = async (reservationId, patch) => {
    setBusyId(reservationId);
    setError("");
    try {
      await reservationsService.updateStatus(reservationId, patch);
      await load();
    } catch (err) {
      setError(getErrorMessage(err, t("appReservationsPage.errors.update")));
    } finally {
      setBusyId("");
    }
  };

  return (
    <section className="space-y-5">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
          {t("appReservationsPage.title")}
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          {t("appReservationsPage.subtitle")}
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
          <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-300">
            {t("appReservationsPage.stats.total")}
          </p>
          <p className="mt-1 text-2xl font-semibold text-slate-900 dark:text-slate-100">
            {stats.total}
          </p>
        </article>
        <article className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
          <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-300">
            {t("appReservationsPage.stats.pending")}
          </p>
          <p className="mt-1 text-2xl font-semibold text-amber-600 dark:text-amber-300">
            {stats.pending}
          </p>
        </article>
        <article className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
          <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-300">
            {t("appReservationsPage.stats.confirmed")}
          </p>
          <p className="mt-1 text-2xl font-semibold text-cyan-600 dark:text-cyan-300">
            {stats.confirmed}
          </p>
        </article>
        <article className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
          <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-300">
            {t("appReservationsPage.stats.paid")}
          </p>
          <p className="mt-1 text-2xl font-semibold text-emerald-600 dark:text-emerald-300">
            {stats.paid}
          </p>
        </article>
      </div>

      <div className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 md:grid-cols-3 dark:border-slate-700 dark:bg-slate-900">
        <label className="grid gap-1 text-sm">
          <span className="inline-flex items-center gap-2">
            <Search size={14} />
            {t("appReservationsPage.filters.search", {
              defaultValue: "Buscar",
            })}
          </span>
          <input
            value={queryFilter}
            onChange={(event) => setQueryFilter(event.target.value)}
            placeholder={t("appReservationsPage.filters.searchPlaceholder", {
              defaultValue: "Huesped, propiedad, estado o ID",
            })}
            className="min-h-11 rounded-lg border border-slate-300 bg-white px-3 py-2 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 dark:border-slate-600 dark:bg-slate-800"
          />
        </label>

        <label className="grid gap-1 text-sm">
          <span className="inline-flex items-center gap-2">
            <Filter size={14} />
            {t("appReservationsPage.filters.status")}
          </span>
          <Select
            value={filters.status}
            onChange={(value) =>
              setFilters((prev) => ({ ...prev, status: value }))
            }
            options={reservationStatusOptions}
            size="md"
          />
        </label>
        <label className="grid gap-1 text-sm">
          <span className="inline-flex items-center gap-2">
            <CreditCard size={14} />
            {t("appReservationsPage.filters.paymentStatus")}
          </span>
          <Select
            value={filters.paymentStatus}
            onChange={(value) =>
              setFilters((prev) => ({ ...prev, paymentStatus: value }))
            }
            options={paymentStatusOptions}
            size="md"
          />
        </label>
      </div>

      {loading ? (
        <p className="text-sm text-slate-600 dark:text-slate-300">
          {t("appReservationsPage.loading")}
        </p>
      ) : null}

      {error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200">
          {error}
        </p>
      ) : null}

      {!loading && !error && filteredReservations.length === 0 ? (
        <EmptyStatePanel
          icon={CalendarDays}
          title={t("appReservationsPage.empty")}
          description={t("appReservationsPage.subtitle")}
          compact
        />
      ) : null}

      {!loading && filteredReservations.length > 0 ? (
        <div className="grid gap-4">
          {filteredReservations.map((reservation) => {
            const isFocused = Boolean(focusId) && reservation.$id === focusId;

            return (
              <article
                key={reservation.$id}
                id={`reservation-${reservation.$id}`}
                className={`rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900 ${
                  isFocused
                    ? "ring-2 ring-cyan-400/70 dark:ring-cyan-500/70"
                    : ""
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-300">
                      #{reservation.$id}
                    </p>
                    <p className="text-sm text-slate-700 dark:text-slate-200">
                      {reservation.propertyId}
                    </p>
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

                <div className="mt-3 grid gap-2 text-sm md:grid-cols-3">
                  <p className="inline-flex items-center gap-2 text-slate-600 dark:text-slate-300">
                    <User size={14} /> {reservation.guestName}
                  </p>
                  <p className="inline-flex items-center gap-2 text-slate-600 dark:text-slate-300">
                    <CalendarDays size={14} />
                    {new Date(reservation.checkInDate).toLocaleDateString(
                      locale,
                    )}{" "}
                    -{" "}
                    {new Date(reservation.checkOutDate).toLocaleDateString(
                      locale,
                    )}
                  </p>
                  <p className="inline-flex items-center gap-2 text-slate-600 dark:text-slate-300">
                    <CreditCard size={14} />
                    {formatMoneyWithDenomination(Number(reservation.totalAmount || 0), {
                      locale,
                      currency: reservation.currency || "MXN",
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </p>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={busyId === reservation.$id}
                    onClick={() =>
                      updateReservation(reservation.$id, {
                        status: "confirmed",
                      })
                    }
                    className="min-h-10 rounded-lg border border-cyan-300 px-3 text-xs font-semibold text-cyan-700 transition hover:bg-cyan-50 disabled:opacity-60 dark:border-cyan-700 dark:text-cyan-300 dark:hover:bg-cyan-950/30"
                  >
                    {t("appReservationsPage.actions.markConfirmed")}
                  </button>
                  <button
                    type="button"
                    disabled={busyId === reservation.$id}
                    onClick={() =>
                      updateReservation(reservation.$id, {
                        status: "completed",
                        paymentStatus: "paid",
                      })
                    }
                    className="min-h-10 rounded-lg border border-emerald-300 px-3 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-50 disabled:opacity-60 dark:border-emerald-700 dark:text-emerald-300 dark:hover:bg-emerald-950/30"
                  >
                    {t("appReservationsPage.actions.markCompleted")}
                  </button>
                  <button
                    type="button"
                    disabled={busyId === reservation.$id}
                    onClick={() =>
                      updateReservation(reservation.$id, {
                        status: "cancelled",
                      })
                    }
                    className="min-h-10 rounded-lg border border-rose-300 px-3 text-xs font-semibold text-rose-700 transition hover:bg-rose-50 disabled:opacity-60 dark:border-rose-700 dark:text-rose-300 dark:hover:bg-rose-950/30"
                  >
                    {t("appReservationsPage.actions.cancel")}
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

export default AppReservations;
