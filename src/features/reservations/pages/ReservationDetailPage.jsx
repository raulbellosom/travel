/**
 * ReservationDetailPage – /app/reservations/:id
 *
 * Redesigned with:
 *   - Full-width layout (no max-w-2xl)
 *   - Desktop: 2-column (info left, actions+voucher+resource right)
 *   - Mobile: stacked sections
 *   - Status-validated quick actions (same logic as table/cards)
 *   - Voucher section (generate/view/share)
 *   - Web Share API support with clipboard fallback
 *   - Inline edit mode toggle
 */
import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle,
  CircleCheckBig,
  Copy,
  CreditCard,
  Edit2,
  ExternalLink,
  FileText,
  Hash,
  Link2,
  Loader2,
  Mail,
  Moon,
  Phone,
  QrCode,
  Share2,
  Ticket,
  User,
  Users,
  X,
} from "lucide-react";
import { databases, Query } from "../../../api/appwriteClient";
import env from "../../../env";
import { reservationsService } from "../../../services/reservationsService";
import { resourcesService } from "../../../services/resourcesService";
import { useAuth } from "../../../hooks/useAuth";
import { getErrorMessage } from "../../../utils/errors";
import { useToast } from "../../../hooks/useToast";
import { ReservationStatusBadge } from "../components/ReservationStatusBadge";
import { formatScheduleLabel, formatMoney, calcNights } from "../utils";
import { canWriteReservations } from "../rbac";
import {
  canConfirmReservation,
  canMarkPaidReservation,
  canCancelReservation,
  canCompleteReservation,
} from "../actions";
import SkeletonLoader from "../../../components/common/molecules/SkeletonLoader";

// ── Info row component ─────────────────────────────────────────────────────
const InfoRow = ({
  icon: Icon,
  label,
  value,
  valueClass = "",
  mono = false,
}) =>
  value ? (
    <div className="flex items-start gap-3 py-3 border-b border-slate-100 dark:border-slate-800 last:border-0">
      <Icon
        size={16}
        className="mt-0.5 shrink-0 text-slate-400 dark:text-slate-500"
      />
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-slate-400 dark:text-slate-500">
          {label}
        </p>
        <p
          className={`mt-0.5 text-sm ${mono ? "font-mono" : "font-medium"} ${valueClass || "text-slate-900 dark:text-slate-100"}`}
        >
          {value}
        </p>
      </div>
    </div>
  ) : null;

// ── Section card ───────────────────────────────────────────────────────────
const SectionCard = ({ title, icon: Icon, children, className = "" }) => (
  <div
    className={`rounded-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900 ${className}`}
  >
    {title && (
      <div className="flex items-center gap-2.5 border-b border-slate-100 px-5 py-3.5 dark:border-slate-800">
        {Icon && (
          <Icon size={16} className="text-cyan-600 dark:text-cyan-400" />
        )}
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
          {title}
        </h3>
      </div>
    )}
    <div className="px-5 py-4">{children}</div>
  </div>
);

// ── Quick Action button ─────────────────────────────────────────────────────
const ActionButton = ({
  icon: Icon,
  label,
  onClick,
  disabled,
  busy,
  variant = "default",
}) => {
  const variants = {
    confirm:
      "border-cyan-300 text-cyan-700 [@media(hover:hover)]:hover:bg-cyan-50 dark:border-cyan-700 dark:text-cyan-300 dark:[@media(hover:hover)]:hover:bg-cyan-950/30",
    complete:
      "border-emerald-300 text-emerald-700 [@media(hover:hover)]:hover:bg-emerald-50 dark:border-emerald-700 dark:text-emerald-300 dark:[@media(hover:hover)]:hover:bg-emerald-950/30",
    danger:
      "border-rose-300 text-rose-700 [@media(hover:hover)]:hover:bg-rose-50 dark:border-rose-700 dark:text-rose-300 dark:[@media(hover:hover)]:hover:bg-rose-950/30",
    default:
      "border-slate-300 text-slate-700 [@media(hover:hover)]:hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:[@media(hover:hover)]:hover:bg-slate-800",
  };

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`flex min-h-10 items-center gap-1.5 rounded-lg border px-3 text-xs font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant] || variants.default}`}
    >
      {busy ? (
        <Loader2 size={13} className="animate-spin" />
      ) : (
        Icon && <Icon size={13} />
      )}
      {label}
    </button>
  );
};

// ── Page ─────────────────────────────────────────────────────────────────────
const ReservationDetailPage = () => {
  const { id } = useParams();
  const { t } = useTranslation();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [reservation, setReservation] = useState(null);
  const [resources, setResources] = useState([]);
  const [voucher, setVoucher] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionBusy, setActionBusy] = useState("");
  const [error, setError] = useState("");

  const canWrite = canWriteReservations(user);
  const locale = user?.locale === "en" ? "en-US" : "es-MX";

  // ── Load reservation + resources + voucher ────────────────────────────────
  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError("");
    try {
      const [res, resourcesRes] = await Promise.all([
        reservationsService.getById(id),
        resourcesService.listMine(user?.$id),
      ]);
      setReservation(res);
      setResources(resourcesRes.documents || []);

      // Try to fetch voucher for this reservation
      try {
        const voucherCollId = env.appwrite.collections.reservationVouchers;
        if (voucherCollId) {
          const vResult = await databases.listDocuments(
            env.appwrite.databaseId,
            voucherCollId,
            [Query.equal("reservationId", id), Query.limit(1)],
          );
          setVoucher(vResult.documents?.[0] || null);
        }
      } catch {
        // Voucher collection may not exist or user may not have access
        setVoucher(null);
      }
    } catch (err) {
      setError(getErrorMessage(err, "No se pudo cargar la reserva."));
    } finally {
      setLoading(false);
    }
  }, [id, user?.$id]);

  useEffect(() => {
    load();
  }, [load]);

  // ── Quick actions ─────────────────────────────────────────────────────────
  const quickAction = async (label, patch) => {
    setActionBusy(label);
    setError("");
    try {
      await reservationsService.updateStatus(id, patch);
      showToast({ type: "success", message: "Reserva actualizada." });
      await load();
    } catch (err) {
      const msg = getErrorMessage(err, "No se pudo actualizar la reserva.");
      setError(msg);
      showToast({ type: "error", message: msg });
    } finally {
      setActionBusy("");
    }
  };

  // ── Voucher actions ─────────────────────────────────────────────────────
  const handleGenerateVoucher = async () => {
    setActionBusy("voucher");
    try {
      const fnId = env.appwrite.functions.issueReservationVoucher;
      if (!fnId) {
        showToast({
          type: "error",
          message: "Función de recibo no configurada.",
        });
        return;
      }
      const { functions } = await import("../../../api/appwriteClient");
      const execution = await functions.createExecution(
        fnId,
        JSON.stringify({
          reservationId: id,
          resourceId: reservation?.resourceId || reservation?.propertyId || "",
        }),
        false,
      );

      // Appwrite returns 201 for the execution, but the function may fail
      if (execution.responseStatusCode && execution.responseStatusCode >= 400) {
        let errorMsg = "Error al generar recibo.";
        try {
          const body = JSON.parse(execution.responseBody);
          errorMsg = body.message || errorMsg;
        } catch {
          /* ignore parse error */
        }
        showToast({ type: "error", message: errorMsg });
        return;
      }

      showToast({
        type: "success",
        message: "Recibo generado correctamente.",
      });
      await load();
    } catch (err) {
      showToast({
        type: "error",
        message: getErrorMessage(err, "Error al generar recibo."),
      });
    } finally {
      setActionBusy("");
    }
  };

  const handleShareVoucher = async () => {
    const base = t("voucherPage.routeBase", { defaultValue: "voucher" });
    const voucherUrl = `${window.location.origin}/${base}/${voucher?.voucherCode || ""}`;
    const shareData = {
      title: `${t("voucherPage.share.title", { defaultValue: "Reservation Voucher" })} - ${reservation?.guestName || "Reserva"}`,
      text: `${t("voucherPage.share.text", { defaultValue: "Voucher" })}: ${voucher?.voucherCode || ""}`,
      url: voucherUrl,
    };

    try {
      if (navigator.share && navigator.canShare?.(shareData)) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(voucherUrl);
        showToast({
          type: "success",
          message: "Link copiado al portapapeles.",
        });
      }
    } catch {
      // User cancelled share or clipboard failed
      try {
        await navigator.clipboard.writeText(voucherUrl);
        showToast({
          type: "success",
          message: "Link copiado al portapapeles.",
        });
      } catch {
        showToast({
          type: "error",
          message: "No se pudo compartir el recibo.",
        });
      }
    }
  };

  const handleCopyId = () => {
    navigator.clipboard?.writeText(reservation?.$id || "").catch(() => {});
    showToast({ type: "success", message: "ID copiado." });
  };

  // ── Loading / error ───────────────────────────────────────────────────────
  if (loading) return <SkeletonLoader variant="detail" className="py-4" />;

  if (error && !reservation) {
    return (
      <section className="space-y-4">
        <Link
          to="/app/reservations"
          className="inline-flex min-h-11 items-center gap-1.5 text-sm text-slate-500
            [@media(hover:hover)]:hover:text-slate-900 dark:[@media(hover:hover)]:hover:text-slate-100"
        >
          <ArrowLeft size={14} /> Volver
        </Link>
        <p
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300"
        >
          {error}
        </p>
      </section>
    );
  }

  const resource = resources.find(
    (r) => r.$id === (reservation.resourceId || reservation.propertyId),
  );
  const resourceTitle = resource?.title || reservation.resourceId || "—";
  const status = reservation.status || "";
  const nights = calcNights(
    reservation.checkInDate || reservation.startDateTime,
    reservation.checkOutDate || reservation.endDateTime,
  );

  return (
    <section className="space-y-5 pb-24">
      {/* ── Back + header ─────────────────────────────────────────────────── */}
      <header className="space-y-2">
        <Link
          to="/app/reservations"
          className="inline-flex min-h-11 items-center gap-1.5 text-sm text-slate-500 transition
            [@media(hover:hover)]:hover:text-slate-900 dark:[@media(hover:hover)]:hover:text-slate-100"
        >
          <ArrowLeft size={14} /> Volver a reservas
        </Link>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100 sm:text-2xl">
              {resourceTitle}
            </h1>
            <div className="mt-1 flex items-center gap-2 text-xs text-slate-400">
              <Hash size={12} />
              <span className="font-mono">{reservation.$id}</span>
              <button
                type="button"
                onClick={handleCopyId}
                aria-label="Copiar ID"
                className="flex h-8 w-8 items-center justify-center rounded text-slate-400 transition
                  [@media(hover:hover)]:hover:bg-slate-100 [@media(hover:hover)]:hover:text-slate-600
                  dark:[@media(hover:hover)]:hover:bg-slate-800"
              >
                <Copy size={12} />
              </button>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <ReservationStatusBadge
              status={reservation.status}
              type="reservation"
            />
            <ReservationStatusBadge
              status={reservation.paymentStatus}
              type="payment"
            />
          </div>
        </div>
      </header>

      {/* ── Error banner ──────────────────────────────────────────────────── */}
      {error ? (
        <p
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300"
        >
          {error}
        </p>
      ) : null}

      {/* ── Content ─────────────────────────────────────────────────────── */}
      <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
        {/* ── Left column: info ─── */}
        <div className="space-y-5">
          {/* Guest info */}
          <SectionCard title="Huésped" icon={User}>
            <InfoRow icon={User} label="Nombre" value={reservation.guestName} />
            <InfoRow icon={Mail} label="Email" value={reservation.guestEmail} />
            <InfoRow
              icon={Phone}
              label="Teléfono"
              value={reservation.guestPhone}
            />
            <InfoRow
              icon={Users}
              label="Huéspedes"
              value={
                reservation.guestCount
                  ? `${reservation.guestCount} ${reservation.guestCount === 1 ? "huésped" : "huéspedes"}`
                  : null
              }
            />
          </SectionCard>

          {/* Booking details */}
          <SectionCard title="Detalles de reserva" icon={CalendarDays}>
            <InfoRow
              icon={CalendarDays}
              label="Fechas"
              value={formatScheduleLabel(reservation, locale)}
            />
            {nights > 0 && (
              <InfoRow
                icon={Moon}
                label="Noches"
                value={`${nights} ${nights === 1 ? "noche" : "noches"}`}
              />
            )}
            <InfoRow
              icon={CreditCard}
              label="Total"
              value={formatMoney(
                reservation.totalAmount,
                reservation.currency || "MXN",
                locale,
              )}
              valueClass="text-lg font-bold text-slate-900 dark:text-slate-100"
            />
            {reservation.baseAmount != null &&
              reservation.baseAmount !== reservation.totalAmount && (
                <InfoRow
                  icon={CreditCard}
                  label="Monto base"
                  value={formatMoney(
                    reservation.baseAmount,
                    reservation.currency || "MXN",
                    locale,
                  )}
                />
              )}
            {reservation.externalRef && (
              <InfoRow
                icon={ExternalLink}
                label="Ref. externa"
                value={reservation.externalRef}
                mono
              />
            )}
          </SectionCard>

          {/* Notes / special requests */}
          {reservation.specialRequests && (
            <SectionCard title="Notas y solicitudes" icon={FileText}>
              <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                {reservation.specialRequests}
              </p>
            </SectionCard>
          )}
        </div>

        {/* ── Right column: actions + voucher + resource ─── */}
        <div className="space-y-5">
          {/* Quick actions */}
          {canWrite && (
            <SectionCard title="Acciones" icon={CheckCircle}>
              <div className="flex flex-wrap gap-2">
                {canConfirmReservation(status) && (
                  <ActionButton
                    icon={CheckCircle}
                    label={t("appReservationsPage.actions.markConfirmed")}
                    variant="confirm"
                    onClick={() =>
                      quickAction("confirm", { status: "confirmed" })
                    }
                    disabled={!!actionBusy}
                    busy={actionBusy === "confirm"}
                  />
                )}
                {canMarkPaidReservation(status, reservation.paymentStatus) && (
                  <ActionButton
                    icon={CreditCard}
                    label="Marcar pagado"
                    variant="complete"
                    onClick={() =>
                      quickAction("markPaid", {
                        paymentStatus: "paid",
                      })
                    }
                    disabled={!!actionBusy}
                    busy={actionBusy === "markPaid"}
                  />
                )}
                {canCompleteReservation(status) && (
                  <ActionButton
                    icon={CircleCheckBig}
                    label="Completar"
                    variant="complete"
                    onClick={() =>
                      quickAction("complete", { status: "completed" })
                    }
                    disabled={!!actionBusy}
                    busy={actionBusy === "complete"}
                  />
                )}
                {canCancelReservation(status) && (
                  <ActionButton
                    icon={X}
                    label={t("appReservationsPage.actions.cancel")}
                    variant="danger"
                    onClick={() =>
                      quickAction("cancel", { status: "cancelled" })
                    }
                    disabled={!!actionBusy}
                    busy={actionBusy === "cancel"}
                  />
                )}
                <Link
                  to={`/app/reservations/${id}/edit`}
                  className="flex min-h-10 items-center gap-1.5 rounded-lg border px-3 text-xs font-semibold transition border-slate-300 text-slate-700 [@media(hover:hover)]:hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:[@media(hover:hover)]:hover:bg-slate-800"
                >
                  <Edit2 size={13} /> Editar
                </Link>
              </div>
            </SectionCard>
          )}

          {/* Voucher section */}
          <SectionCard title="Recibo" icon={Ticket}>
            {voucher ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-900/30">
                    <QrCode
                      size={24}
                      className="text-emerald-600 dark:text-emerald-400"
                    />
                  </div>
                  <div>
                    <p className="font-mono text-lg font-bold text-slate-900 dark:text-slate-100">
                      {voucher.voucherCode}
                    </p>
                    <p className="text-xs text-slate-500">
                      {voucher.status === "active" ? "Activo" : voucher.status}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <a
                    href={`/${t("voucherPage.routeBase", { defaultValue: "voucher" })}/${voucher.voucherCode}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex min-h-11 items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 transition
                        [@media(hover:hover)]:hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:[@media(hover:hover)]:hover:bg-slate-800"
                  >
                    <ExternalLink size={13} />{" "}
                    {t("myReservationsPage.actions.viewVoucher", {
                      defaultValue: "View voucher",
                    })}
                  </a>
                  <button
                    type="button"
                    onClick={handleShareVoucher}
                    className="flex min-h-11 items-center gap-1.5 rounded-lg border border-cyan-300 px-3 py-2 text-xs font-semibold text-cyan-700 transition
                        [@media(hover:hover)]:hover:bg-cyan-50 dark:border-cyan-700 dark:text-cyan-300 dark:[@media(hover:hover)]:hover:bg-cyan-950/30"
                  >
                    <Share2 size={13} /> Compartir
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const base = t("voucherPage.routeBase", {
                        defaultValue: "voucher",
                      });
                      navigator.clipboard?.writeText(
                        `${window.location.origin}/${base}/${voucher.voucherCode}`,
                      );
                      showToast({
                        type: "success",
                        message: "Link copiado.",
                      });
                    }}
                    className="flex min-h-11 items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 transition
                        [@media(hover:hover)]:hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:[@media(hover:hover)]:hover:bg-slate-800"
                  >
                    <Link2 size={13} /> Copiar link
                  </button>
                  {canWrite && (
                    <button
                      type="button"
                      disabled={actionBusy === "voucher"}
                      onClick={handleGenerateVoucher}
                      className="flex min-h-11 items-center gap-1.5 rounded-lg border border-amber-300 px-3 py-2 text-xs font-semibold text-amber-700 transition
                          [@media(hover:hover)]:hover:bg-amber-50 disabled:opacity-50 dark:border-amber-700 dark:text-amber-300"
                    >
                      {actionBusy === "voucher" && (
                        <Loader2 size={13} className="animate-spin" />
                      )}
                      <Ticket size={13} /> Regenerar
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  No se ha generado un recibo para esta reserva.
                </p>
                {reservation.paymentStatus !== "paid" && (
                  <p className="text-xs text-amber-600 dark:text-amber-400">
                    La reserva debe estar pagada para generar un recibo.
                  </p>
                )}
                {canWrite && (
                  <button
                    type="button"
                    disabled={
                      actionBusy === "voucher" ||
                      reservation.paymentStatus !== "paid"
                    }
                    onClick={handleGenerateVoucher}
                    className="flex min-h-11 items-center gap-1.5 rounded-lg bg-cyan-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition
                        [@media(hover:hover)]:hover:bg-cyan-500 active:scale-[0.98] disabled:opacity-50"
                  >
                    {actionBusy === "voucher" && (
                      <Loader2 size={13} className="animate-spin" />
                    )}
                    <Ticket size={13} /> Generar recibo
                  </button>
                )}
              </div>
            )}
          </SectionCard>

          {/* Resource card */}
          <SectionCard title="Recurso" icon={ExternalLink}>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800">
                <CalendarDays size={18} className="text-slate-500" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {resourceTitle}
                </p>
                {resource && (
                  <p className="truncate text-xs text-slate-400">
                    {resource.$id}
                  </p>
                )}
              </div>
              {resource && (
                <Link
                  to={`/app/resources/${resource.$id}`}
                  className="flex min-h-11 items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 transition
                      [@media(hover:hover)]:hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:[@media(hover:hover)]:hover:bg-slate-800"
                >
                  <ExternalLink size={11} /> Ir
                </Link>
              )}
            </div>
          </SectionCard>
        </div>
      </div>
    </section>
  );
};

export default ReservationDetailPage;
