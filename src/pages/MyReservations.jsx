import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  CalendarDays,
  CreditCard,
  Moon,
  Users,
  Ticket,
  ChevronRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Home,
  Filter,
  Search,
} from "lucide-react";
import dayjs from "dayjs";
import { useAuth } from "../hooks/useAuth";
import { reservationsService } from "../services/reservationsService";
import { propertiesService } from "../services/propertiesService";
import { databases, Query } from "../api/appwriteClient";
import env from "../env";
import { getErrorMessage } from "../utils/errors";
import { formatMoneyWithDenomination } from "../utils/money";
import { usePageSeo } from "../hooks/usePageSeo";

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

const calcNights = (checkIn, checkOut) => {
  if (!checkIn || !checkOut) return 0;
  return Math.max(0, dayjs(checkOut).diff(dayjs(checkIn), "day"));
};

const STATUS_ICON = {
  pending: Clock,
  confirmed: CheckCircle2,
  completed: CheckCircle2,
  cancelled: XCircle,
  expired: AlertCircle,
};

const STATUS_STYLE = {
  pending: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  confirmed: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
  completed: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  cancelled: "bg-rose-500/10 text-rose-400 border-rose-500/20",
  expired: "bg-slate-500/10 text-slate-400 border-slate-500/20",
};

const PAYMENT_STYLE = {
  unpaid: "bg-orange-500/10 text-orange-400",
  pending: "bg-amber-500/10 text-amber-400",
  paid: "bg-emerald-500/10 text-emerald-400",
  failed: "bg-rose-500/10 text-rose-400",
  refunded: "bg-purple-500/10 text-purple-400",
};

const FILTER_TABS = ["all", "pending", "confirmed", "completed", "cancelled"];

/* ── Stat Card ────────────────────────────────────────────────────────── */
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

/* ── Reservation Card ─────────────────────────────────────────────────── */
const ReservationCard = ({
  reservation,
  propertyName,
  locale,
  t,
  voucherCode,
}) => {
  const nights = calcNights(reservation.checkInDate, reservation.checkOutDate);
  const status = reservation.status || "pending";
  const paymentStatus = reservation.paymentStatus || "pending";
  const StatusIcon = STATUS_ICON[status] || Clock;
  const statusStyle = STATUS_STYLE[status] || STATUS_STYLE.pending;
  const payStyle = PAYMENT_STYLE[paymentStatus] || PAYMENT_STYLE.pending;

  const hasVoucher = !!voucherCode;
  const isPast =
    reservation.checkOutDate &&
    dayjs(reservation.checkOutDate).isBefore(dayjs());

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
      <div
        className={`absolute left-0 top-0 bottom-0 w-1 ${
          status === "confirmed"
            ? "bg-cyan-500"
            : status === "completed"
              ? "bg-emerald-500"
              : status === "cancelled"
                ? "bg-rose-500"
                : status === "expired"
                  ? "bg-slate-500"
                  : "bg-amber-500"
        }`}
      />

      <div className="p-4 pl-5 sm:p-5 sm:pl-6">
        {/* Top: Property + Status */}
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-base font-bold text-slate-800 dark:text-slate-100 sm:text-lg">
              {propertyName}
            </h3>
            <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
              <CalendarDays className="h-3 w-3" aria-hidden="true" />
              <span>{formatDate(reservation.$createdAt, locale)}</span>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1.5">
            <span
              className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${statusStyle}`}
            >
              <StatusIcon className="h-3 w-3" aria-hidden="true" />
              {t(`reservationStatus.${status}`, { defaultValue: status })}
            </span>
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ${payStyle}`}
            >
              {t(`paymentStatus.${paymentStatus}`, {
                defaultValue: paymentStatus,
              })}
            </span>
          </div>
        </div>

        {/* Info grid */}
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <InfoCell
            icon={CalendarDays}
            label={t("myReservationsPage.labels.checkIn", {
              defaultValue: "Check-in",
            })}
            value={formatDate(reservation.checkInDate, locale)}
          />
          <InfoCell
            icon={CalendarDays}
            label={t("myReservationsPage.labels.checkOut", {
              defaultValue: "Check-out",
            })}
            value={formatDate(reservation.checkOutDate, locale)}
          />
          <InfoCell
            icon={Moon}
            label={t("myReservationsPage.labels.nights", {
              defaultValue: "Nights",
            })}
            value={String(nights)}
          />
          <InfoCell
            icon={CreditCard}
            label={t("myReservationsPage.labels.total", {
              defaultValue: "Total",
            })}
            value={formatMoneyWithDenomination(
              Number(reservation.totalAmount || 0),
              {
                locale,
                currency: reservation.currency || "MXN",
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              },
            )}
          />
        </div>

        {/* Guests */}
        {reservation.guestCount && (
          <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-400">
            <Users className="h-3 w-3" aria-hidden="true" />
            <span>
              {reservation.guestCount} {t("myReservationsPage.labels.guests")}
            </span>
          </div>
        )}

        {/* Actions row */}
        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-200 dark:border-slate-700/30 pt-3">
          {hasVoucher && (
            <Link
              to={`/${t("voucherPage.routeBase", { defaultValue: "voucher" })}/${voucherCode}`}
              className="ml-auto inline-flex items-center gap-1.5 rounded-xl bg-cyan-600/90 px-3.5 py-2 text-xs font-semibold text-white
                         shadow-sm transition-all
                         [@media(hover:hover)]:hover:bg-cyan-500 [@media(hover:hover)]:hover:shadow-cyan-500/20"
              aria-label={t("myReservationsPage.actions.viewVoucher", {
                defaultValue: "View voucher",
              })}
            >
              <Ticket className="h-3.5 w-3.5" aria-hidden="true" />
              {t("myReservationsPage.actions.viewVoucher", {
                defaultValue: "View voucher",
              })}
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          )}

          {!hasVoucher &&
            (status === "confirmed" || status === "completed") && (
              <span className="ml-auto inline-flex items-center gap-1.5 rounded-xl bg-slate-200/60 dark:bg-slate-700/40 px-3 py-2 text-[11px] font-medium text-slate-500">
                <Ticket className="h-3.5 w-3.5" aria-hidden="true" />
                {t("myReservationsPage.actions.voucherPending", {
                  defaultValue: "Voucher pending",
                })}
              </span>
            )}
        </div>
      </div>
    </motion.article>
  );
};

/* ── Info cell inside card ─────────────────────────────────────────────── */
const InfoCell = ({ icon: Icon, label, value }) => (
  <div className="flex items-start gap-2">
    <Icon
      className="mt-0.5 h-3.5 w-3.5 shrink-0 text-cyan-500/70 dark:text-cyan-400/70"
      aria-hidden="true"
    />
    <div className="min-w-0">
      <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500">
        {label}
      </p>
      <p className="mt-0.5 text-sm font-semibold text-slate-700 dark:text-slate-200">
        {value}
      </p>
    </div>
  </div>
);

/* ── Main page ────────────────────────────────────────────────────────── */
const MyReservations = () => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reservations, setReservations] = useState([]);
  const [propertyNames, setPropertyNames] = useState({});
  const [voucherMap, setVoucherMap] = useState({}); // reservationId → voucherCode
  const [activeFilter, setActiveFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const locale = i18n.language === "en" ? "en-US" : "es-MX";

  usePageSeo({
    title: `Inmobo | ${t("myReservationsPage.title")}`,
    description: t("myReservationsPage.subtitle"),
    robots: "noindex, nofollow",
  });

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

        // Fetch property names
        const propertyIds = [
          ...new Set(docs.map((r) => r.propertyId).filter(Boolean)),
        ];
        const nameEntries = await Promise.all(
          propertyIds.map(async (pid) => {
            try {
              const p = await propertiesService.getById(pid);
              return [pid, p?.title || pid];
            } catch {
              return [pid, pid];
            }
          }),
        );
        if (!mounted) return;
        setPropertyNames(Object.fromEntries(nameEntries));

        // Fetch vouchers for these reservations
        const resIds = docs.map((r) => r.$id).filter(Boolean);
        if (resIds.length > 0 && env.appwrite.collections.reservationVouchers) {
          try {
            const vRes = await databases.listDocuments(
              env.appwrite.databaseId,
              env.appwrite.collections.reservationVouchers,
              [
                Query.equal("reservationId", resIds),
                Query.equal("enabled", true),
                Query.limit(100),
              ],
            );
            const map = {};
            (vRes.documents || []).forEach((v) => {
              map[v.reservationId] = v.voucherCode;
            });
            if (mounted) setVoucherMap(map);
          } catch {
            // Voucher fetch is non-critical
          }
        }
      } catch (err) {
        if (!mounted) return;
        setError(getErrorMessage(err, t("myReservationsPage.errors.load")));
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, [user?.$id, t]);

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
      cancelled: byStatus.cancelled || 0,
    };
  }, [reservations]);

  const filtered = useMemo(() => {
    let list = reservations;

    // Status filter
    if (activeFilter !== "all") {
      list = list.filter((r) => r.status === activeFilter);
    }

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((r) => {
        const name = propertyNames[r.propertyId] || "";
        return (
          name.toLowerCase().includes(q) ||
          (r.guestName || "").toLowerCase().includes(q) ||
          (r.$id || "").toLowerCase().includes(q) ||
          (r.status || "").toLowerCase().includes(q)
        );
      });
    }

    return list;
  }, [reservations, activeFilter, searchQuery, propertyNames]);

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
              {t("myReservationsPage.title")}
            </span>
          </nav>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400">
                <CalendarDays className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 sm:text-2xl">
                  {t("myReservationsPage.title")}
                </h1>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400 sm:text-sm">
                  {t("myReservationsPage.subtitle")}
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* ── Stats row ──────────────────────────────────── */}
        <div className="mb-6 flex flex-wrap gap-2">
          <StatPill
            label={t("myReservationsPage.stats.total")}
            value={totals.total}
            active={activeFilter === "all"}
            onClick={() => setActiveFilter("all")}
          />
          <StatPill
            label={t("myReservationsPage.stats.pending")}
            value={totals.pending}
            color="text-amber-400"
            active={activeFilter === "pending"}
            onClick={() => setActiveFilter("pending")}
          />
          <StatPill
            label={t("myReservationsPage.stats.confirmed")}
            value={totals.confirmed}
            color="text-cyan-400"
            active={activeFilter === "confirmed"}
            onClick={() => setActiveFilter("confirmed")}
          />
          <StatPill
            label={t("myReservationsPage.stats.completed")}
            value={totals.completed}
            color="text-emerald-400"
            active={activeFilter === "completed"}
            onClick={() => setActiveFilter("completed")}
          />
        </div>

        {/* ── Search ─────────────────────────────────────── */}
        {reservations.length > 3 && (
          <div className="relative mb-5">
            <Search
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
              aria-hidden="true"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t("myReservationsPage.searchPlaceholder", {
                defaultValue: "Search by property, name...",
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
                className="h-40 animate-pulse rounded-2xl border border-slate-200 dark:border-slate-700/30 bg-slate-100 dark:bg-slate-800/40"
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
        {!loading && !error && reservations.length === 0 && (
          <div className="flex flex-col items-center gap-4 rounded-3xl border border-dashed border-slate-300 dark:border-slate-700/40 bg-slate-50 dark:bg-slate-800/20 px-6 py-16 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-200/60 dark:bg-slate-800/60 text-slate-400 dark:text-slate-500">
              <CalendarDays className="h-8 w-8" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-600 dark:text-slate-300">
                {t("myReservationsPage.empty")}
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                {t("myReservationsPage.emptyDesc", {
                  defaultValue:
                    "When you make a reservation, it will appear here.",
                })}
              </p>
            </div>
            <Link
              to="/"
              className="inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-4 py-2.5 text-sm font-semibold text-white shadow
                         transition-colors [@media(hover:hover)]:hover:bg-cyan-500"
            >
              {t("myReservationsPage.actions.explore", {
                defaultValue: "Explore properties",
              })}
            </Link>
          </div>
        )}

        {/* ── No results for filter ──────────────────────── */}
        {!loading &&
          !error &&
          reservations.length > 0 &&
          filtered.length === 0 && (
            <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700/40 bg-slate-50 dark:bg-slate-800/20 px-6 py-10 text-center">
              <Filter className="h-6 w-6 text-slate-500" />
              <p className="text-sm text-slate-400">
                {t("myReservationsPage.noResults", {
                  defaultValue: "No reservations match your filter.",
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
                {t("myReservationsPage.actions.clearFilters", {
                  defaultValue: "Clear filters",
                })}
              </button>
            </div>
          )}

        {/* ── Reservation list ───────────────────────────── */}
        {!loading && !error && filtered.length > 0 && (
          <AnimatePresence mode="popLayout">
            <div className="flex flex-col gap-3">
              {filtered.map((reservation) => (
                <ReservationCard
                  key={reservation.$id}
                  reservation={reservation}
                  propertyName={
                    propertyNames[reservation.propertyId] ||
                    reservation.propertyId
                  }
                  locale={locale}
                  t={t}
                  voucherCode={voucherMap[reservation.$id] || null}
                />
              ))}
            </div>
          </AnimatePresence>
        )}

        {/* ── Footer hint ────────────────────────────────── */}
        {!loading && filtered.length > 0 && (
          <p className="mt-6 text-center text-[11px] text-slate-600">
            {t("myReservationsPage.footerHint", {
              defaultValue: "Showing {{count}} reservation(s)",
              count: filtered.length,
            })}
          </p>
        )}
      </section>
    </div>
  );
};

export default MyReservations;
