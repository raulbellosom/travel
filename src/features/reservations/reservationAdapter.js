/**
 * Reservation Adapter
 *
 * Canonical mapping between the frontend reservation model and the
 * Appwrite `reservations` collection. The Appwrite schema is the source
 * of truth — field names match 1:1. This module provides helpers to
 * extract computed/derived values and to build clean payloads.
 *
 * Time window rules:
 *   - Stay-based (bookingType=date_range): checkInDate + checkOutDate; nights computed.
 *   - Time-based (bookingType=time_slot|fixed_event): startDateTime + endDateTime; nights=0.
 *   - Manual (bookingType=manual_contact): either pair, determined by scheduleType.
 */

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Returns the effective start date/time string from a reservation document.
 */
export const getEffectiveStart = (reservation) =>
  reservation?.startDateTime || reservation?.checkInDate || null;

/**
 * Returns the effective end date/time string from a reservation document.
 */
export const getEffectiveEnd = (reservation) =>
  reservation?.endDateTime || reservation?.checkOutDate || null;

/**
 * Returns true when the reservation uses time-based window.
 */
export const isTimeBased = (reservation) => {
  const bt = reservation?.bookingType;
  return bt === "time_slot" || bt === "fixed_event";
};

/**
 * Returns true when the reservation uses stay-based (date_range) window.
 */
export const isStayBased = (reservation) =>
  reservation?.bookingType === "date_range";

// ─── Payload builders ───────────────────────────────────────────────────────

/**
 * Builds a clean payload object for `create-reservation-public` function.
 * Only includes fields the function expects.
 */
export const toPublicReservationPayload = ({
  resourceId,
  checkInDate,
  checkOutDate,
  startDateTime,
  endDateTime,
  guestCount,
  guestName,
  guestEmail,
  guestPhone,
  specialRequests,
  currency,
  clientRequestId,
  feesAmount,
  taxAmount,
}) => {
  const payload = { resourceId, guestCount: Number(guestCount || 1) };

  if (checkInDate) payload.checkInDate = checkInDate;
  if (checkOutDate) payload.checkOutDate = checkOutDate;
  if (startDateTime) payload.startDateTime = startDateTime;
  if (endDateTime) payload.endDateTime = endDateTime;
  if (guestName) payload.guestName = String(guestName).trim();
  if (guestEmail) payload.guestEmail = String(guestEmail).trim().toLowerCase();
  if (guestPhone) payload.guestPhone = String(guestPhone).trim();
  if (specialRequests) payload.specialRequests = String(specialRequests).trim();
  if (currency) payload.currency = currency;
  if (clientRequestId) payload.clientRequestId = clientRequestId;
  if (feesAmount) payload.feesAmount = Number(feesAmount);
  if (taxAmount) payload.taxAmount = Number(taxAmount);

  return payload;
};

/**
 * Builds a clean payload object for `create-reservation-manual` function.
 */
export const toManualReservationPayload = ({
  resourceId,
  leadId,
  scheduleType,
  checkInDate,
  checkOutDate,
  startDateTime,
  endDateTime,
  guestUserId,
  guestName,
  guestEmail,
  guestPhone,
  guestCount,
  units,
  baseAmount,
  feesAmount,
  taxAmount,
  totalAmount,
  currency,
  status,
  paymentStatus,
  externalRef,
  specialRequests,
  bookingType,
  closeLead,
}) => {
  const payload = { resourceId };

  if (leadId) payload.leadId = leadId;
  if (scheduleType) payload.scheduleType = scheduleType;
  if (bookingType) payload.bookingType = bookingType;
  if (checkInDate) payload.checkInDate = checkInDate;
  if (checkOutDate) payload.checkOutDate = checkOutDate;
  if (startDateTime) payload.startDateTime = startDateTime;
  if (endDateTime) payload.endDateTime = endDateTime;
  if (guestUserId) payload.guestUserId = guestUserId;
  if (guestName) payload.guestName = String(guestName).trim();
  if (guestEmail) payload.guestEmail = String(guestEmail).trim().toLowerCase();
  if (guestPhone) payload.guestPhone = String(guestPhone).trim();
  if (guestCount != null) payload.guestCount = Number(guestCount);
  if (units != null) payload.units = Number(units);
  if (baseAmount != null) payload.baseAmount = Number(baseAmount);
  if (feesAmount != null) payload.feesAmount = Number(feesAmount);
  if (taxAmount != null) payload.taxAmount = Number(taxAmount);
  if (totalAmount != null) payload.totalAmount = Number(totalAmount);
  if (currency) payload.currency = currency;
  if (status) payload.status = status;
  if (paymentStatus) payload.paymentStatus = paymentStatus;
  if (externalRef) payload.externalRef = String(externalRef).trim();
  if (specialRequests) payload.specialRequests = String(specialRequests).trim();
  if (closeLead !== undefined) payload.closeLead = Boolean(closeLead);

  return payload;
};

/**
 * Extracts a summary object from an Appwrite reservation document,
 * useful for display components (cards, lists, detail views).
 */
export const toReservationSummary = (doc) => {
  if (!doc) return null;
  return {
    id: doc.$id,
    resourceId: doc.resourceId,
    resourceOwnerUserId: doc.resourceOwnerUserId,
    guestUserId: doc.guestUserId,
    guestName: doc.guestName || "",
    guestEmail: doc.guestEmail || "",
    guestPhone: doc.guestPhone || "",
    commercialMode: doc.commercialMode || "",
    bookingType: doc.bookingType || "",
    effectiveStart: getEffectiveStart(doc),
    effectiveEnd: getEffectiveEnd(doc),
    checkInDate: doc.checkInDate || null,
    checkOutDate: doc.checkOutDate || null,
    startDateTime: doc.startDateTime || null,
    endDateTime: doc.endDateTime || null,
    guestCount: doc.guestCount ?? 1,
    units: doc.units ?? 1,
    nights: doc.nights ?? 0,
    baseAmount: doc.baseAmount ?? 0,
    feesAmount: doc.feesAmount ?? 0,
    taxAmount: doc.taxAmount ?? 0,
    totalAmount: doc.totalAmount ?? 0,
    currency: doc.currency || "MXN",
    status: doc.status || "pending",
    paymentStatus: doc.paymentStatus || "unpaid",
    paymentProvider: doc.paymentProvider || "manual",
    externalRef: doc.externalRef || "",
    specialRequests: doc.specialRequests || "",
    holdExpiresAt: doc.holdExpiresAt || null,
    enabled: doc.enabled !== false,
    createdAt: doc.$createdAt || null,
    updatedAt: doc.$updatedAt || null,
  };
};
