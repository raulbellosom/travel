/**
 * ReservationsOverviewPage – /app/reservations
 *
 * KPIs │ Search + Filters │ View toggle │ Responsive list │ CTA "Nueva reserva"
 */
import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Link, useSearchParams } from "react-router-dom";
import { CalendarDays, CreditCard, Plus, RefreshCw } from "lucide-react";
import { useReservations } from "../hooks/useReservations";
import ReservationFilters from "../components/ReservationFilters";
import ReservationList from "../components/ReservationList";

// ── KPI card ─────────────────────────────────────────────────────────────────
const KpiCard = ({ label, value, valueClass = "" }) => (
  <article className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
      {label}
    </p>
    <p
      className={`mt-1 text-3xl font-bold tabular-nums ${valueClass || "text-slate-900 dark:text-slate-100"}`}
    >
      {value}
    </p>
  </article>
);

// ── Page ─────────────────────────────────────────────────────────────────────
const ReservationsOverviewPage = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const focusId = searchParams.get("focus") || "";

  const {
    reservations,
    resources,
    resourceMap,
    stats,
    loading,
    error,
    busyId,
    canSeeAll,
    locale,
    filters,
    page,
    totalPages,
    totalCount,
    pageSize,
    setPage,
    setPageSize,
    sortKey,
    sortDir,
    setSort,
    view,
    setView,
    load,
    setFilter,
    debouncedSetQuery,
    resetFilters,
    updateReservation,
  } = useReservations();

  // Scroll-to-focus after load
  const focusScrolled = useRef(false);
  useEffect(() => {
    if (loading || !focusId || focusScrolled.current) return;
    const el = document.getElementById(`reservation-${focusId}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      focusScrolled.current = true;
    }
  }, [loading, focusId, reservations]);

  // Refresh on visibility change (PWA)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") load();
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [load]);

  const handleConfirm = (id) => updateReservation(id, { status: "confirmed" });
  const handleMarkPaid = (id) =>
    updateReservation(id, { status: "completed", paymentStatus: "paid" });
  const handleCancel = (id) => updateReservation(id, { status: "cancelled" });
  const handleComplete = (id) => updateReservation(id, { status: "completed" });

  return (
    <section className="space-y-5 pb-24">
      {/* ── Header ───────────────────────────────────────────────────────── */}
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-0.5">
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
            {t("appReservationsPage.title")}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {t("appReservationsPage.subtitle")}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={load}
            disabled={loading}
            aria-label="Actualizar"
            className="flex h-11 w-11 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition
              [@media(hover:hover)]:hover:bg-slate-100 disabled:opacity-50 dark:border-slate-700 dark:text-slate-400 dark:[@media(hover:hover)]:hover:bg-slate-800"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          </button>
          <Link
            to="/app/reservations/new"
            className="flex min-h-11 items-center gap-2 rounded-xl bg-cyan-600 px-4 text-sm font-semibold text-white shadow-sm shadow-cyan-600/20 transition
              [@media(hover:hover)]:hover:bg-cyan-500 active:scale-[0.98]"
          >
            <Plus size={16} />
            <span>Nueva reserva</span>
          </Link>
        </div>
      </header>

      {/* ── KPIs ─────────────────────────────────────────────────────────── */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label={t("appReservationsPage.stats.total")}
          value={stats.total}
        />
        <KpiCard
          label={t("appReservationsPage.stats.pending")}
          value={stats.pending}
          valueClass="text-amber-600 dark:text-amber-300"
        />
        <KpiCard
          label={t("appReservationsPage.stats.confirmed")}
          value={stats.confirmed}
          valueClass="text-cyan-600 dark:text-cyan-300"
        />
        <KpiCard
          label={t("appReservationsPage.stats.paid")}
          value={stats.paid}
          valueClass="text-emerald-600 dark:text-emerald-300"
        />
      </div>

      {/* ── Error banner ─────────────────────────────────────────────────── */}
      {error ? (
        <p
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700
            dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300"
        >
          {error}
        </p>
      ) : null}

      {/* ── Search + Filters ─────────────────────────────────────────────── */}
      <div className="space-y-3">
        <ReservationFilters
          filters={filters}
          resources={resources}
          canSeeAll={canSeeAll}
          onChange={setFilter}
          onReset={resetFilters}
          onSearchChange={debouncedSetQuery}
        />
      </div>

      {/* ── List ─────────────────────────────────────────────────────────── */}
      <ReservationList
        reservations={reservations}
        resourceMap={resourceMap}
        locale={locale}
        loading={loading}
        page={page}
        totalPages={totalPages}
        totalCount={totalCount}
        pageSize={pageSize}
        busyId={busyId}
        focusId={focusId}
        onConfirm={handleConfirm}
        onMarkPaid={handleMarkPaid}
        onCancel={handleCancel}
        onComplete={handleComplete}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        sortKey={sortKey}
        sortDir={sortDir}
        onSort={setSort}
        view={view}
        onViewChange={setView}
      />
    </section>
  );
};

export default ReservationsOverviewPage;
