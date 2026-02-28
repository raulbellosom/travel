/**
 * VoucherPage —  /voucher/:code  |  /recibo/:code
 *
 * Redesigned voucher view: premium ticket + history panel.
 *
 * Layout:
 *   Mobile  → Ticket top, history below (accordion)
 *   Desktop → 2-column: ticket left, history right
 *
 * Public route (no auth required for single voucher view).
 * History panel only appears for authenticated users.
 */
import { useState, useCallback } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { m } from "framer-motion";
import { ArrowLeft, Ticket, Home, WifiOff } from "lucide-react";
import SkeletonLoader from "../../../components/common/molecules/SkeletonLoader";
import { usePageSeo } from "../../../hooks/usePageSeo";
import { useAuth } from "../../../hooks/useAuth";
import useVoucher from "../hooks/useVoucher";
import useVoucherHistory from "../hooks/useVoucherHistory";
import VoucherTicket from "../components/VoucherTicket";
import VoucherHistoryPanel from "../components/VoucherHistoryPanel";

/* ── Shared page header ───────────────────────────────────────────────── */
const PageHeader = ({ t, code, navigate }) => (
  <header className="mb-6">
    {/* Breadcrumb / back nav */}
    <nav className="mb-3 flex items-center gap-2 text-xs text-slate-500">
      <Link
        to="/"
        className="inline-flex items-center gap-1 rounded-lg px-2 py-1 font-medium transition-colors
                   [@media(hover:hover)]:hover:bg-slate-200/60 dark:[@media(hover:hover)]:hover:bg-slate-800/60 [@media(hover:hover)]:hover:text-cyan-600 dark:[@media(hover:hover)]:hover:text-cyan-300"
      >
        <Home className="h-3.5 w-3.5" aria-hidden="true" />
        {t("voucherPage.breadcrumb.home", { defaultValue: "Home" })}
      </Link>
      <span className="text-slate-400 dark:text-slate-600">/</span>
      <Link
        to="/my-reservations"
        className="rounded-lg px-2 py-1 font-medium transition-colors
                   [@media(hover:hover)]:hover:bg-slate-200/60 dark:[@media(hover:hover)]:hover:bg-slate-800/60 [@media(hover:hover)]:hover:text-cyan-600 dark:[@media(hover:hover)]:hover:text-cyan-300"
      >
        {t("voucherPage.breadcrumb.myReservations", {
          defaultValue: "My reservations",
        })}
      </Link>
      <span className="text-slate-400 dark:text-slate-600">/</span>
      <span className="font-medium text-slate-700 dark:text-slate-300">
        {t("voucherPage.breadcrumb.voucher", { defaultValue: "Voucher" })}
      </span>
    </nav>

    {/* Title block */}
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
          <Ticket className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 sm:text-2xl">
            {t("voucherPage.title")}
          </h1>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400 sm:text-sm">
            {t("voucherPage.subtitle")}
          </p>
        </div>
      </div>

      {/* Back button — more visible on desktop */}
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="hidden items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700/50 bg-white dark:bg-slate-800/60
                   px-3.5 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 shadow-sm transition-colors
                   [@media(hover:hover)]:hover:border-cyan-500/30 [@media(hover:hover)]:hover:text-cyan-600 dark:[@media(hover:hover)]:hover:text-cyan-300
                   sm:inline-flex"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        {t("voucherPage.actions.backHome")}
      </button>
    </div>

    {/* Current voucher code pill */}
    {code && (
      <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-slate-100 dark:bg-slate-800/60 px-3 py-1 text-[11px] text-slate-500 dark:text-slate-400">
        <span className="font-medium text-slate-500">
          {t("voucherPage.labels.code")}:
        </span>
        <span className="font-mono font-semibold text-cyan-600 dark:text-cyan-300">
          {code}
        </span>
      </div>
    )}
  </header>
);

const VoucherPage = () => {
  const { t } = useTranslation();
  const { code } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const { voucher, reservation, resource, loading, error, isOffline } =
    useVoucher(code);

  const {
    vouchers: historyVouchers,
    loading: historyLoading,
    error: historyError,
    reload: reloadHistory,
  } = useVoucherHistory();

  const [_selectedVoucher, setSelectedVoucher] = useState(null);

  usePageSeo({
    title: `Inmobo | ${t("voucherPage.title")}`,
    description: t("voucherPage.subtitle"),
    robots: "noindex, nofollow",
  });

  const handleSelectFromHistory = useCallback(
    (v) => {
      if (v.voucherCode && v.voucherCode !== code) {
        const base = t("voucherPage.routeBase", { defaultValue: "voucher" });
        navigate(`/${base}/${v.voucherCode}`, { replace: false });
      }
      setSelectedVoucher(v);
    },
    [code, navigate, t],
  );

  const isAuthenticated = !!user;

  /* ── Loading state ──────────────────────────────────────────────────── */
  if (loading) {
    return (
      <div className="min-h-screen pt-20 pb-12 sm:pt-24">
        <section className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <PageHeader t={t} code={code} navigate={navigate} />
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
            {/* Ticket skeleton */}
            <div className="w-full lg:flex-1 lg:max-w-lg">
              <div className="animate-pulse space-y-4">
                {/* Header bar */}
                <div className="h-14 rounded-t-2xl bg-linear-to-r from-cyan-600/30 to-sky-700/30" />
                {/* Card body */}
                <div className="space-y-3 rounded-b-3xl border border-slate-200 dark:border-slate-700/40 bg-slate-50 dark:bg-slate-800/60 p-5">
                  <div className="h-5 w-3/4 rounded bg-slate-200 dark:bg-slate-700/70" />
                  <div className="h-8 w-full rounded-lg bg-slate-200 dark:bg-slate-700/60" />
                  <div className="grid grid-cols-2 gap-3">
                    <div className="h-12 rounded-lg bg-slate-200 dark:bg-slate-700/50" />
                    <div className="h-12 rounded-lg bg-slate-200 dark:bg-slate-700/50" />
                    <div className="h-12 rounded-lg bg-slate-200 dark:bg-slate-700/50" />
                    <div className="h-12 rounded-lg bg-slate-200 dark:bg-slate-700/50" />
                  </div>
                  <div className="flex gap-2 pt-2">
                    <div className="h-7 w-24 rounded-full bg-slate-200 dark:bg-slate-700/50" />
                    <div className="h-7 w-20 rounded-full bg-slate-200 dark:bg-slate-700/50" />
                  </div>
                  <div className="h-16 rounded-xl bg-slate-200 dark:bg-slate-700/40" />
                </div>
                {/* Actions bar */}
                <div className="flex gap-2">
                  <div className="h-10 flex-1 rounded-xl bg-slate-200 dark:bg-slate-700/40" />
                  <div className="h-10 flex-1 rounded-xl bg-slate-200 dark:bg-slate-700/40" />
                  <div className="h-10 flex-1 rounded-xl bg-slate-200 dark:bg-slate-700/40" />
                </div>
              </div>
            </div>
            {/* History skeleton */}
            <div className="w-full lg:w-80 xl:w-96">
              <div className="animate-pulse rounded-2xl border border-slate-200 dark:border-slate-700/40 bg-slate-50 dark:bg-slate-800/40 p-4 space-y-3">
                <div className="h-6 w-32 rounded bg-slate-200 dark:bg-slate-700/60" />
                <div className="h-20 rounded-xl bg-slate-200 dark:bg-slate-700/40" />
                <div className="h-20 rounded-xl bg-slate-200 dark:bg-slate-700/40" />
              </div>
            </div>
          </div>
        </section>
      </div>
    );
  }

  /* ── Error state ────────────────────────────────────────────────────── */
  if (error || !voucher || !reservation) {
    return (
      <div className="min-h-screen pt-20 pb-12 sm:pt-24">
        <section className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <PageHeader t={t} code={code} navigate={navigate} />
          <div className="mx-auto max-w-md space-y-4">
            <div className="flex flex-col items-center gap-4 rounded-3xl border border-slate-200 dark:border-slate-700/40 bg-white dark:bg-slate-800/30 px-6 py-12 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-100 dark:bg-red-950/40 text-red-500 dark:text-red-400">
                <Ticket className="h-8 w-8" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200">
                  {error === "NOT_FOUND"
                    ? t("voucherPage.errors.notFound")
                    : t("voucherPage.errors.load")}
                </h2>
                <p className="mt-1 text-sm text-slate-400">
                  {error === "NOT_FOUND"
                    ? t("voucherPage.errors.notFoundDesc", {
                        defaultValue:
                          "The voucher code may be incorrect or the voucher is no longer available.",
                      })
                    : error}
                </p>
              </div>
              <Link
                to="/mis-reservas"
                className="inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-4 py-2.5 text-sm font-semibold text-white shadow
                           transition-colors [@media(hover:hover)]:hover:bg-cyan-500"
              >
                <ArrowLeft className="h-4 w-4" />
                {t("voucherPage.breadcrumb.myReservations", {
                  defaultValue: "My reservations",
                })}
              </Link>
            </div>

            {/* Still show history if authenticated */}
            {isAuthenticated && historyVouchers.length > 0 && (
              <div className="mt-6 rounded-2xl border border-slate-200 dark:border-slate-700/40 bg-slate-50 dark:bg-slate-800/20 p-4">
                <VoucherHistoryPanel
                  vouchers={historyVouchers}
                  loading={historyLoading}
                  error={historyError}
                  onSelect={handleSelectFromHistory}
                  onReload={reloadHistory}
                  selectedCode={code}
                />
              </div>
            )}
          </div>
        </section>
      </div>
    );
  }

  /* ── Success state ──────────────────────────────────────────────────── */
  return (
    <div className="min-h-screen pt-20 pb-12 sm:pt-24">
      <section className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <PageHeader t={t} code={code} navigate={navigate} />
        {isOffline && (
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-amber-200 dark:border-amber-800/40 bg-amber-50 dark:bg-amber-950/30 px-4 py-2.5 text-xs font-medium text-amber-700 dark:text-amber-300">
            <WifiOff className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            {t("voucherPage.offlineBanner", {
              defaultValue:
                "Showing cached version — you appear to be offline.",
            })}
          </div>
        )}

        {/* 2-column on lg, stacked on mobile */}
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
          {/* ── Left: Ticket ────────────────────────────────── */}
          <m.div
            className="w-full lg:flex-1 lg:max-w-lg"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <VoucherTicket
              voucher={voucher}
              reservation={reservation}
              resource={resource}
            />
          </m.div>

          {/* ── Right: History ──────────────────────────────── */}
          {isAuthenticated && (
            <m.div
              className="w-full lg:w-80 xl:w-96"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              <div className="rounded-2xl border border-slate-200 dark:border-slate-700/40 bg-slate-50 dark:bg-slate-800/20 p-4">
                <VoucherHistoryPanel
                  vouchers={historyVouchers}
                  loading={historyLoading}
                  error={historyError}
                  onSelect={handleSelectFromHistory}
                  onReload={reloadHistory}
                  selectedCode={code}
                />
              </div>
            </m.div>
          )}
        </div>
      </section>
    </div>
  );
};

export default VoucherPage;
