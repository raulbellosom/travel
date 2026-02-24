/**
 * VoucherTicket — Premium "wallet pass" style ticket card.
 *
 * Visual design inspired by Apple Wallet / Google Wallet passes:
 * - Dark card with subtle gradient border
 * - Notch cutouts on the sides
 * - Clear information hierarchy
 * - Dual QR codes
 */
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { QRCodeSVG } from "qrcode.react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Copy,
  Link2,
  Share2,
  Download,
  FileText,
  Image as ImageIcon,
  Smartphone,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Calendar,
  Moon,
  User,
  Building2,
  CreditCard,
  QrCode,
  Wallet,
} from "lucide-react";
import dayjs from "dayjs";
import { ReservationStatusBadge } from "../../reservations/components/ReservationStatusBadge";
import { calcNights, formatMoney } from "../../reservations/utils";
import {
  buildVoucherCodeQr,
  buildVoucherQrPayload,
  getVoucherUrl,
  exportTicketToImage,
  exportTicketToPDF,
} from "../utils/voucherExport";
import useToast from "../../../hooks/useToast";

/* ── Notch SVG — the semicircular cutout for ticket aesthetic ─────────── */
const TicketNotch = ({ side = "left" }) => (
  <div
    className={`absolute top-1/2 z-10 -translate-y-1/2 ${
      side === "left" ? "-left-3" : "-right-3"
    }`}
  >
    <div className="h-6 w-6 rounded-full bg-slate-100 dark:bg-slate-950 shadow-inner" />
  </div>
);

/* ── Dashed separator ─────────────────────────────────────────────────── */
const TicketDivider = () => (
  <div className="relative my-4 flex items-center px-2">
    <TicketNotch side="left" />
    <div className="w-full border-t-2 border-dashed border-slate-300/40 dark:border-slate-600/40" />
    <TicketNotch side="right" />
  </div>
);

/* ── Info row — label + value ──────────────────────────────────────────── */
const InfoRow = ({ icon: Icon, label, value, className = "" }) => (
  <div className={`flex items-start gap-3 ${className}`}>
    {Icon && (
      <Icon
        className="mt-0.5 h-4 w-4 shrink-0 text-cyan-600 dark:text-cyan-400"
        aria-hidden="true"
      />
    )}
    <div className="min-w-0">
      <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
        {label}
      </p>
      <p className="mt-0.5 text-sm font-semibold text-slate-800 dark:text-slate-100 wrap-break-word">
        {value || "—"}
      </p>
    </div>
  </div>
);

const VoucherTicket = ({ voucher, reservation, resource }) => {
  const { t, i18n } = useTranslation();
  const { showToast } = useToast();
  const ticketRef = useRef(null);
  const exportRef = useRef(null);
  const [qrTab, setQrTab] = useState("code"); // "code" | "data"
  const [showQr, setShowQr] = useState(true);
  const [exporting, setExporting] = useState(false);

  const locale = i18n.language === "en" ? "en-US" : "es-MX";
  const nights = calcNights(
    reservation?.checkInDate,
    reservation?.checkOutDate,
  );
  const routeBase = t("voucherPage.routeBase", { defaultValue: "voucher" });
  const voucherUrl = getVoucherUrl(voucher, routeBase);
  const codeQr = buildVoucherCodeQr(voucher);
  const dataQr = buildVoucherQrPayload(voucher, reservation);

  /* ── Clipboard / Share helpers ────────────────────────────────────────── */
  const copyToClipboard = async (text, label) => {
    try {
      await navigator.clipboard.writeText(text);
      showToast(
        t("voucherPage.toast.copied", {
          item: label,
          defaultValue: `${label} copied`,
        }),
        "success",
      );
    } catch {
      showToast(
        t("voucherPage.toast.copyFailed", { defaultValue: "Copy failed" }),
        "error",
      );
    }
  };

  const handleShare = async () => {
    const shareData = {
      title: t("voucherPage.share.title", {
        defaultValue: "Reservation Voucher",
      }),
      text: `${t("voucherPage.share.text", { defaultValue: "Voucher" })}: ${voucher.voucherCode}`,
      url: voucherUrl,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {
        /* user cancelled */
      }
    } else {
      copyToClipboard(voucherUrl, "Link");
    }
  };

  /* ── Export handlers ──────────────────────────────────────────────────── */
  const handleExportPDF = async () => {
    setExporting(true);
    try {
      await exportTicketToPDF(
        exportRef.current,
        `${routeBase}-${voucher.voucherCode}.pdf`,
      );
      showToast(
        t("voucherPage.toast.exportPdf", { defaultValue: "PDF downloaded" }),
        "success",
      );
    } catch {
      showToast(
        t("voucherPage.toast.exportFailed", { defaultValue: "Export failed" }),
        "error",
      );
    } finally {
      setExporting(false);
    }
  };

  const handleExportImage = async () => {
    setExporting(true);
    try {
      await exportTicketToImage(
        exportRef.current,
        `${routeBase}-${voucher.voucherCode}.png`,
      );
      showToast(
        t("voucherPage.toast.exportImage", {
          defaultValue: "Image downloaded",
        }),
        "success",
      );
    } catch {
      showToast(
        t("voucherPage.toast.exportFailed", { defaultValue: "Export failed" }),
        "error",
      );
    } finally {
      setExporting(false);
    }
  };

  if (!voucher || !reservation) return null;

  return (
    <div className="flex flex-col gap-6">
      {/* ══════════════ THE TICKET (visible + export) ══════════════ */}
      <div ref={ticketRef}>
        <div
          ref={exportRef}
          className="relative mx-auto w-full max-w-md overflow-hidden rounded-3xl
                     border border-slate-200 dark:border-slate-700/60 bg-white dark:bg-linear-to-b dark:from-slate-800 dark:via-slate-850
                     dark:to-slate-900 shadow-xl dark:shadow-2xl dark:shadow-cyan-500/5"
        >
          {/* ── Header — branding stripe ───────────────────────── */}
          <div className="relative bg-linear-to-r from-cyan-600 to-cyan-500 px-5 py-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-100/80">
                  {t("voucherPage.ticket.headerLabel", {
                    defaultValue: "Reservation Voucher",
                  })}
                </p>
                <h2 className="mt-0.5 text-lg font-extrabold text-white tracking-tight">
                  {resource?.title ||
                    resource?.name ||
                    t("voucherPage.labels.property")}
                </h2>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
                <Building2 className="h-5 w-5 text-white" />
              </div>
            </div>
          </div>

          {/* ── Voucher code ───────────────────────────────────── */}
          <div className="px-5 pt-5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-500 dark:text-slate-400">
              {t("voucherPage.labels.code")}
            </p>
            <div className="mt-1 flex items-center gap-2">
              <p className="font-mono text-xl font-extrabold tracking-wider text-cyan-600 dark:text-cyan-300 sm:text-2xl">
                {voucher.voucherCode}
              </p>
              <button
                type="button"
                onClick={() =>
                  copyToClipboard(
                    voucher.voucherCode,
                    t("voucherPage.labels.code"),
                  )
                }
                className="shrink-0 rounded-lg p-1.5 text-slate-400 transition-colors
                           [@media(hover:hover)]:hover:bg-slate-200 dark:[@media(hover:hover)]:hover:bg-slate-700 [@media(hover:hover)]:hover:text-cyan-600 dark:[@media(hover:hover)]:hover:text-cyan-300"
                aria-label={t("voucherPage.actions.copyCode", {
                  defaultValue: "Copy voucher code",
                })}
              >
                <Copy className="h-4 w-4" />
              </button>
            </div>
          </div>

          <TicketDivider />

          {/* ── Info grid ──────────────────────────────────────── */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-4 px-5">
            <InfoRow
              icon={User}
              label={t("voucherPage.labels.guest")}
              value={reservation.guestName}
            />
            <InfoRow
              icon={Calendar}
              label={t("voucherPage.labels.dates")}
              value={`${dayjs(reservation.checkInDate).format("DD/MM/YYYY")} – ${dayjs(reservation.checkOutDate).format("DD/MM/YYYY")}`}
            />
            <InfoRow
              icon={Moon}
              label={t("voucherPage.labels.nights", { defaultValue: "Nights" })}
              value={String(nights)}
            />
            <InfoRow
              icon={CreditCard}
              label={t("voucherPage.labels.total")}
              value={formatMoney(
                reservation.totalAmount,
                reservation.currency || "MXN",
                locale,
              )}
            />
          </div>

          {/* ── Status badges ──────────────────────────────────── */}
          <div className="mt-4 flex flex-wrap items-center gap-2 px-5">
            <ReservationStatusBadge
              status={reservation.status}
              type="reservation"
            />
            <ReservationStatusBadge
              status={reservation.paymentStatus}
              type="payment"
            />
          </div>

          {reservation.specialRequests && (
            <div className="mt-3 px-5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-500 dark:text-slate-400">
                {t("voucherPage.labels.notes", { defaultValue: "Notes" })}
              </p>
              <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-300">
                {reservation.specialRequests}
              </p>
            </div>
          )}

          <TicketDivider />

          {/* ── QR Codes section ───────────────────────────────── */}
          <div className="px-5 pb-5">
            {/* Toggle */}
            <button
              type="button"
              onClick={() => setShowQr((prev) => !prev)}
              className="mb-3 flex w-full items-center justify-between rounded-xl bg-slate-100/80 dark:bg-slate-800/60
                         px-3 py-2.5 text-left text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors
                         [@media(hover:hover)]:hover:bg-slate-200/80 dark:[@media(hover:hover)]:hover:bg-slate-700/60"
              aria-expanded={showQr}
              aria-label={t("voucherPage.actions.toggleQr", {
                defaultValue: "Toggle QR codes",
              })}
            >
              <span className="flex items-center gap-2">
                <QrCode className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
                {t("voucherPage.labels.qrSection", {
                  defaultValue: "QR Codes",
                })}
              </span>
              {showQr ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>

            <AnimatePresence>
              {showQr && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="overflow-hidden"
                >
                  {/* QR Tab switcher */}
                  <div className="mb-3 flex rounded-xl bg-slate-100 dark:bg-slate-800/80 p-1">
                    <button
                      type="button"
                      onClick={() => setQrTab("code")}
                      className={`flex-1 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                        qrTab === "code"
                          ? "bg-cyan-600 text-white shadow"
                          : "text-slate-500 dark:text-slate-400 [@media(hover:hover)]:hover:text-slate-700 dark:[@media(hover:hover)]:hover:text-slate-200"
                      }`}
                      aria-label={t("voucherPage.labels.qrCode", {
                        defaultValue: "QR code voucher",
                      })}
                    >
                      {t("voucherPage.labels.qrCodeTab", {
                        defaultValue: "Code",
                      })}
                    </button>
                    <button
                      type="button"
                      onClick={() => setQrTab("data")}
                      className={`flex-1 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                        qrTab === "data"
                          ? "bg-cyan-600 text-white shadow"
                          : "text-slate-500 dark:text-slate-400 [@media(hover:hover)]:hover:text-slate-700 dark:[@media(hover:hover)]:hover:text-slate-200"
                      }`}
                      aria-label={t("voucherPage.labels.qrData", {
                        defaultValue: "QR with full data",
                      })}
                    >
                      {t("voucherPage.labels.qrDataTab", {
                        defaultValue: "Full data",
                      })}
                    </button>
                  </div>

                  {/* QR display */}
                  <div className="flex flex-col items-center gap-2">
                    <div className="rounded-2xl bg-white p-3 shadow-lg">
                      <QRCodeSVG
                        value={qrTab === "code" ? codeQr : dataQr}
                        size={160}
                        level="M"
                        includeMargin={false}
                      />
                    </div>
                    <p className="text-[10px] text-slate-500">
                      {qrTab === "code"
                        ? t("voucherPage.labels.qrCodeDesc", {
                            defaultValue: "Scan to read voucher code",
                          })
                        : t("voucherPage.labels.qrDataDesc", {
                            defaultValue: "Scan for full reservation details",
                          })}
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* ══════════════ ACTIONS BAR ══════════════ */}
      <div className="mx-auto flex w-full max-w-md flex-wrap items-center justify-center gap-2">
        <ActionBtn
          icon={Copy}
          label={t("voucherPage.actions.copyCode", {
            defaultValue: "Copy code",
          })}
          onClick={() =>
            copyToClipboard(voucher.voucherCode, t("voucherPage.labels.code"))
          }
        />
        <ActionBtn
          icon={Link2}
          label={t("voucherPage.actions.copyLink", {
            defaultValue: "Copy link",
          })}
          onClick={() => copyToClipboard(voucherUrl, "Link")}
        />
        <ActionBtn
          icon={Share2}
          label={t("voucherPage.actions.share", { defaultValue: "Share" })}
          onClick={handleShare}
        />
        <ActionBtn
          icon={FileText}
          label={t("voucherPage.actions.exportPdf", { defaultValue: "PDF" })}
          onClick={handleExportPDF}
          disabled={exporting}
        />
        <ActionBtn
          icon={ImageIcon}
          label={t("voucherPage.actions.exportImage", {
            defaultValue: "Image",
          })}
          onClick={handleExportImage}
          disabled={exporting}
        />
      </div>

      {/* ══════════════ WALLET SECTION ══════════════ */}
      <WalletSection t={t} />
    </div>
  );
};

/* ── Small action button ───────────────────────────────────────────────── */
const ActionBtn = ({ icon: Icon, label, onClick, disabled = false }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700/60
               bg-white dark:bg-slate-800/80 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 shadow-sm
               transition-all disabled:cursor-not-allowed disabled:opacity-40
               [@media(hover:hover)]:hover:border-cyan-500/40 [@media(hover:hover)]:hover:bg-slate-50 dark:[@media(hover:hover)]:hover:bg-slate-700"
    aria-label={label}
  >
    <Icon className="h-3.5 w-3.5" aria-hidden="true" />
    <span className="hidden sm:inline">{label}</span>
  </button>
);

/* ── Wallet section — prepared for future Apple/Google Wallet ──────────── */
const WalletSection = ({ t }) => (
  <div className="mx-auto w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-700/40 bg-slate-50 dark:bg-slate-800/40 p-4">
    <div className="flex items-center gap-2 mb-3">
      <Wallet className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
      <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
        {t("voucherPage.wallet.title", { defaultValue: "Digital Wallet" })}
      </h3>
    </div>

    <div className="space-y-2">
      {/* Apple Wallet — coming soon */}
      <WalletButton
        label={t("voucherPage.wallet.apple", {
          defaultValue: "Add to Apple Wallet",
        })}
        sublabel={t("voucherPage.wallet.comingSoon", {
          defaultValue: "Coming soon",
        })}
        disabled
      />
      {/* Google Wallet — coming soon */}
      <WalletButton
        label={t("voucherPage.wallet.google", {
          defaultValue: "Save to Google Wallet",
        })}
        sublabel={t("voucherPage.wallet.comingSoon", {
          defaultValue: "Coming soon",
        })}
        disabled
      />
      {/* PWA install hint */}
      <div className="mt-2 flex items-start gap-2 rounded-xl bg-slate-100 dark:bg-slate-700/30 px-3 py-2.5">
        <Smartphone className="mt-0.5 h-4 w-4 shrink-0 text-cyan-600 dark:text-cyan-400" />
        <p className="text-[11px] leading-relaxed text-slate-600 dark:text-slate-400">
          {t("voucherPage.wallet.pwaHint", {
            defaultValue:
              "You can add this app to your home screen for quick access to your vouchers.",
          })}
        </p>
      </div>
    </div>
  </div>
);

const WalletButton = ({ label, sublabel, disabled }) => (
  <button
    type="button"
    disabled={disabled}
    className="flex w-full items-center justify-between rounded-xl border border-slate-200 dark:border-slate-600/40
               bg-white dark:bg-slate-800/60 px-4 py-3 text-left transition-colors
               disabled:cursor-not-allowed disabled:opacity-50
               [@media(hover:hover)]:hover:bg-slate-50 dark:[@media(hover:hover)]:hover:bg-slate-700/60"
    aria-label={label}
  >
    <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
      {label}
    </span>
    {sublabel && (
      <span className="rounded-full bg-cyan-900/40 px-2 py-0.5 text-[10px] font-medium text-cyan-300">
        {sublabel}
      </span>
    )}
  </button>
);

export default VoucherTicket;
