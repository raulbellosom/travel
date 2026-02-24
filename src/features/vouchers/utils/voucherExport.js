/**
 * Voucher QR payload builder + export utilities (PDF / Image).
 */
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas-pro";
import env from "../../../env";

/* ── QR payload helpers ────────────────────────────────────────────────── */

/**
 * Build a compact QR payload for the full-data QR code.
 * Falls back to URL if payload exceeds maxLen (QR size limit).
 */
export function buildVoucherQrPayload(
  voucher,
  reservation,
  { maxLen = 600 } = {},
) {
  const origin = env.app.url || window.location.origin;

  const compact = {
    code: voucher?.voucherCode,
    rid: reservation?.$id,
    guest: reservation?.guestName,
    in: reservation?.checkInDate?.slice(0, 10),
    out: reservation?.checkOutDate?.slice(0, 10),
    total: reservation?.totalAmount,
    cur: reservation?.currency || "MXN",
    status: reservation?.status,
    pay: reservation?.paymentStatus,
    ref: reservation?.externalRef || undefined,
  };

  const json = JSON.stringify(compact);
  if (json.length <= maxLen) return json;

  // Fallback: URL-based
  return `${origin}/voucher/${voucher?.voucherCode}`;
}

/**
 * Simple code-only QR value.
 */
export function buildVoucherCodeQr(voucher) {
  return voucher?.voucherCode || "";
}

/**
 * Shareable voucher URL.
 * @param {object} voucher
 * @param {string} [routeBase="voucher"] - localised route segment ("voucher" | "recibo")
 */
export function getVoucherUrl(voucher, routeBase = "voucher") {
  const origin = env.app.url || window.location.origin;
  return `${origin}/${routeBase}/${voucher?.voucherCode}`;
}

/* ── Export helpers ─────────────────────────────────────────────────────── */

/**
 * Export a DOM element as PNG image (high-res).
 */
export async function exportTicketToImage(element, filename = "voucher.png") {
  if (!element) return;

  const canvas = await html2canvas(element, {
    scale: 3,
    useCORS: true,
    backgroundColor: "#0f172a", // slate-900
    logging: false,
  });

  const dataUrl = canvas.toDataURL("image/png");
  const link = document.createElement("a");
  link.download = filename;
  link.href = dataUrl;
  link.click();
}

/**
 * Export a DOM element as PDF (ticket sized).
 */
export async function exportTicketToPDF(element, filename = "voucher.pdf") {
  if (!element) return;

  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    backgroundColor: "#0f172a",
    logging: false,
  });

  const imgData = canvas.toDataURL("image/png");
  const imgWidth = canvas.width;
  const imgHeight = canvas.height;

  // Use aspect ratio to determine PDF page size
  const pdfWidth = 210; // A4 mm width
  const pdfHeight = (imgHeight * pdfWidth) / imgWidth;

  const pdf = new jsPDF({
    orientation: pdfHeight > pdfWidth ? "portrait" : "landscape",
    unit: "mm",
    format: [pdfWidth, Math.max(pdfHeight, 100)],
  });

  pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
  pdf.save(filename);
}
