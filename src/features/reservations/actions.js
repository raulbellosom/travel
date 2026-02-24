/**
 * getReservationActions – unified action menu builder for reservations.
 *
 * Returns an array of action descriptors filtered by the reservation's
 * current status and the user's permissions.  Used identically by:
 *   • ReservationTable  (desktop rows)
 *   • ReservationCard   (mobile context-menu + swipe)
 *   • ReservationDetailPage (quick-action buttons)
 *
 * Each action:
 *   { key, label, icon, color, dangerous, handler, disabled }
 */
import {
  Eye,
  Edit2,
  CheckCircle,
  CreditCard,
  CircleCheckBig,
  X,
  Copy,
  Share2,
} from "lucide-react";

/**
 * @param {Object}   reservation       – the reservation document
 * @param {Object}   opts
 * @param {boolean}  opts.canWrite      – does the user have write permission?
 * @param {Function} opts.onView        – navigate to detail
 * @param {Function} opts.onEdit        – navigate to edit
 * @param {Function} opts.onConfirm     – mark confirmed
 * @param {Function} opts.onMarkPaid    – mark paid
 * @param {Function} opts.onComplete    – mark completed
 * @param {Function} opts.onCancel      – cancel reservation
 * @param {Function} opts.onCopyId      – copy reservation ID
 * @param {Function} opts.onShare       – share (Web Share API or fallback)
 * @param {boolean}  opts.isBusy        – currently executing action?
 * @param {Object}   opts.t             – i18next t function
 * @param {boolean}  opts.includeView   – include "Ver detalle" (default true)
 * @param {boolean}  opts.includeEdit   – include "Editar" (default true)
 * @param {boolean}  opts.includeCopy   – include "Copiar ID" (default true)
 * @returns {Array}                      – filtered list of action descriptors
 */
export function getReservationActions(reservation, opts = {}) {
  const {
    canWrite = false,
    onView,
    onEdit,
    onConfirm,
    onMarkPaid,
    onComplete,
    onCancel,
    onCopyId,
    onShare,
    isBusy = false,
    t = (k, o) => o?.defaultValue || k,
    includeView = true,
    includeEdit = true,
    includeCopy = true,
  } = opts;

  const status = reservation?.status || "";
  const actions = [];

  // ── Navigation actions ────────────────────────────────────────────────────
  if (includeView && onView) {
    actions.push({
      key: "view",
      label: t("appReservationsPage.actions.viewDetail", {
        defaultValue: "Ver detalle",
      }),
      icon: Eye,
      color: "text-slate-700 dark:text-slate-200",
      hoverBg:
        "[@media(hover:hover)]:hover:bg-slate-50 dark:[@media(hover:hover)]:hover:bg-slate-700",
      handler: () => onView(reservation.$id),
      disabled: false,
      group: "nav",
    });
  }

  if (includeEdit && canWrite && onEdit) {
    actions.push({
      key: "edit",
      label: t("appReservationsPage.actions.edit", { defaultValue: "Editar" }),
      icon: Edit2,
      color: "text-slate-700 dark:text-slate-200",
      hoverBg:
        "[@media(hover:hover)]:hover:bg-slate-50 dark:[@media(hover:hover)]:hover:bg-slate-700",
      handler: () => onEdit(reservation.$id),
      disabled: false,
      group: "nav",
    });
  }

  // ── Status-mutation actions (requires canWrite + valid status) ────────────
  if (canWrite) {
    // Confirm: only from pending or expired
    if (["pending", "expired"].includes(status) && onConfirm) {
      actions.push({
        key: "confirm",
        label: t("appReservationsPage.actions.markConfirmed", {
          defaultValue: "Confirmar",
        }),
        icon: CheckCircle,
        color: "text-cyan-700 dark:text-cyan-300",
        hoverBg:
          "[@media(hover:hover)]:hover:bg-cyan-50 dark:[@media(hover:hover)]:hover:bg-slate-700",
        handler: () => onConfirm(reservation.$id),
        disabled: isBusy,
        group: "status",
      });
    }

    // Mark paid: only from pending or confirmed
    if (["pending", "confirmed"].includes(status) && onMarkPaid) {
      actions.push({
        key: "markPaid",
        label: t("appReservationsPage.actions.markPaid", {
          defaultValue: "Marcar pagado",
        }),
        icon: CreditCard,
        color: "text-emerald-700 dark:text-emerald-300",
        hoverBg:
          "[@media(hover:hover)]:hover:bg-emerald-50 dark:[@media(hover:hover)]:hover:bg-slate-700",
        handler: () => onMarkPaid(reservation.$id),
        disabled: isBusy,
        group: "status",
      });
    }

    // Complete (without marking paid): only from confirmed
    if (status === "confirmed" && onComplete) {
      actions.push({
        key: "complete",
        label: t("appReservationsPage.actions.markCompletedOnly", {
          defaultValue: "Completar",
        }),
        icon: CircleCheckBig,
        color: "text-emerald-700 dark:text-emerald-300",
        hoverBg:
          "[@media(hover:hover)]:hover:bg-emerald-50 dark:[@media(hover:hover)]:hover:bg-slate-700",
        handler: () => onComplete(reservation.$id),
        disabled: isBusy,
        group: "status",
      });
    }

    // Cancel: only from pending or confirmed
    if (["pending", "confirmed"].includes(status) && onCancel) {
      actions.push({
        key: "cancel",
        label: t("appReservationsPage.actions.cancel", {
          defaultValue: "Cancelar",
        }),
        icon: X,
        color: "text-rose-600 dark:text-rose-400",
        hoverBg:
          "[@media(hover:hover)]:hover:bg-rose-50 dark:[@media(hover:hover)]:hover:bg-slate-700",
        handler: () => onCancel(reservation.$id),
        disabled: isBusy,
        dangerous: true,
        group: "status",
      });
    }
  }

  // ── Utility actions ───────────────────────────────────────────────────────
  if (includeCopy && onCopyId) {
    actions.push({
      key: "copyId",
      label: t("appReservationsPage.actions.copyId", {
        defaultValue: "Copiar ID",
      }),
      icon: Copy,
      color: "text-slate-500 dark:text-slate-400",
      hoverBg:
        "[@media(hover:hover)]:hover:bg-slate-50 dark:[@media(hover:hover)]:hover:bg-slate-700",
      handler: () => onCopyId(reservation.$id),
      disabled: false,
      group: "util",
      separator: true, // render border-top before this
    });
  }

  if (onShare) {
    actions.push({
      key: "share",
      label: t("appReservationsPage.actions.share", {
        defaultValue: "Compartir",
      }),
      icon: Share2,
      color: "text-slate-500 dark:text-slate-400",
      hoverBg:
        "[@media(hover:hover)]:hover:bg-slate-50 dark:[@media(hover:hover)]:hover:bg-slate-700",
      handler: () => onShare(reservation.$id),
      disabled: false,
      group: "util",
    });
  }

  return actions;
}

/**
 * Quick check helpers for swipe actions on cards.
 * Returns booleans so swipe panels only reveal valid actions.
 */
export const canConfirmReservation = (status) =>
  ["pending", "expired"].includes(status);

export const canMarkPaidReservation = (status) =>
  ["pending", "confirmed"].includes(status);

export const canCancelReservation = (status) =>
  ["pending", "confirmed"].includes(status);

export const canCompleteReservation = (status) => status === "confirmed";
