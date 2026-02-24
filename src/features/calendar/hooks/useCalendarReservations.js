import { useState, useEffect, useCallback, useMemo } from "react";
import { reservationsService } from "../../../services/reservationsService";
import { groupReservationsByDate } from "../utils/calendarUtils";

/**
 * useCalendarReservations – fetches reservations for a given date range
 * and groups them by date for calendar rendering.
 *
 * @param {Object} opts
 * @param {string} opts.userId – owner user id
 * @param {{ start: Date, end: Date }} opts.range
 * @param {Object} opts.filters – { propertyId, status, paymentStatus }
 */
export default function useCalendarReservations({
  userId,
  range,
  filters = {},
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
      if (filters.propertyId) serviceFilters.resourceId = filters.propertyId;

      const res = await reservationsService.listForOwner(
        userId,
        serviceFilters,
      );
      setReservations(res.documents || []);
    } catch (err) {
      setError(err?.message || "Error loading reservations");
    } finally {
      setLoading(false);
    }
  }, [userId, filters.status, filters.paymentStatus, filters.propertyId]);

  useEffect(() => {
    load();
  }, [load]);

  const refresh = useCallback(() => load(), [load]);

  /** Reservations grouped by YYYY-MM-DD key */
  const eventsByDate = useMemo(
    () => groupReservationsByDate(reservations),
    [reservations],
  );

  /** Filter reservations visible in the current range */
  const rangeReservations = useMemo(() => {
    if (!range?.start || !range?.end) return reservations;
    const start = range.start.getTime();
    const end = range.end.getTime();
    return reservations.filter((r) => {
      const ci = new Date(r.checkInDate).getTime();
      const co = new Date(r.checkOutDate).getTime();
      return ci <= end && co >= start;
    });
  }, [reservations, range]);

  return {
    reservations,
    rangeReservations,
    eventsByDate,
    loading,
    error,
    refresh,
  };
}
