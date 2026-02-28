import { useState, useEffect, useCallback, useMemo } from "react";
import { reservationsService } from "../../../services/reservationsService";
import {
  groupReservationsByDate,
  enrichReservationDates,
} from "../utils/calendarUtils";

/**
 * useCalendarReservations – fetches reservations for a given date range
 * and groups them by date for calendar rendering.
 * Supports all booking types: date_range, time_slot, fixed_event, manual_contact.
 *
 * @param {Object} opts
 * @param {string} opts.userId – owner user id
 * @param {{ start: Date, end: Date }} opts.range
 * @param {Object} opts.filters – { resourceId, resourceType, commercialMode, status, paymentStatus }
 * @param {Array} opts.resources – list of resource documents for building resourceMap
 */
export default function useCalendarReservations({
  userId,
  range,
  filters = {},
  resources = [],
} = {}) {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError("");
    try {
      const serviceFilters = {};
      if (filters.status) serviceFilters.status = filters.status;
      if (filters.paymentStatus)
        serviceFilters.paymentStatus = filters.paymentStatus;
      if (filters.resourceId) serviceFilters.resourceId = filters.resourceId;

      const res = await reservationsService.listForOwner(
        userId,
        serviceFilters,
      );
      // Enrich manual_contact reservations that lack dates (parse from specialRequests)
      const docs = (res.documents || []).map(enrichReservationDates);
      setReservations(docs);
    } catch (err) {
      setError(err?.message || "Error loading reservations");
    } finally {
      setLoading(false);
    }
  }, [userId, filters.status, filters.paymentStatus, filters.resourceId]);

  useEffect(() => {
    load();
  }, [load]);

  const refresh = useCallback(() => load(), [load]);

  // ── Resource map (id → full resource doc) ─────────────────────────────
  const resourceMap = useMemo(() => {
    const map = {};
    for (const r of resources) map[r.$id] = r;
    return map;
  }, [resources]);

  // ── Client-side filter by resourceType and commercialMode ─────────────
  const filteredReservations = useMemo(() => {
    let list = reservations;

    if (filters.resourceType) {
      list = list.filter((r) => {
        const id = r.resourceId || r.propertyId;
        const res = resourceMap[id];
        return res?.resourceType === filters.resourceType;
      });
    }

    if (filters.commercialMode) {
      list = list.filter((r) => {
        // Reservation has commercialMode directly
        if (r.commercialMode)
          return r.commercialMode === filters.commercialMode;
        // Fallback to resource
        const id = r.resourceId || r.propertyId;
        const res = resourceMap[id];
        return res?.commercialMode === filters.commercialMode;
      });
    }

    return list;
  }, [reservations, filters.resourceType, filters.commercialMode, resourceMap]);

  /** Reservations grouped by YYYY-MM-DD key */
  const eventsByDate = useMemo(
    () => groupReservationsByDate(filteredReservations),
    [filteredReservations],
  );

  /** Filter reservations visible in the current range (supports all booking types) */
  const rangeReservations = useMemo(() => {
    if (!range?.start || !range?.end) return filteredReservations;
    const start = range.start.getTime();
    const end = range.end.getTime();
    return filteredReservations.filter((r) => {
      // time_slot / fixed_event dates
      if (r.startDateTime && r.endDateTime) {
        const s = new Date(r.startDateTime).getTime();
        const e = new Date(r.endDateTime).getTime();
        if (s <= end && e >= start) return true;
      }
      // date_range / fallback dates
      if (r.checkInDate && r.checkOutDate) {
        const ci = new Date(r.checkInDate).getTime();
        const co = new Date(r.checkOutDate).getTime();
        if (ci <= end && co >= start) return true;
      }
      return false;
    });
  }, [filteredReservations, range]);

  return {
    reservations: filteredReservations,
    rangeReservations,
    eventsByDate,
    resourceMap,
    loading,
    error,
    refresh,
  };
}
