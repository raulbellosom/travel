import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { reservationsService } from "../../../services/reservationsService";
import { resourcesService } from "../../../services/resourcesService";
import { useAuth } from "../../../hooks/useAuth";
import { getErrorMessage } from "../../../utils/errors";
import { canViewAllReservations, getOwnerQueryParam } from "../rbac";
import { debounce } from "../utils";
import { FILTER_PARAMS } from "../constants";

export const useReservations = () => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  // ── URL-driven filters ────────────────────────────────────────────────────
  const urlQuery = searchParams.get(FILTER_PARAMS.query) || "";
  const urlStatus = searchParams.get(FILTER_PARAMS.status) || "";
  const urlPaymentStatus = searchParams.get(FILTER_PARAMS.paymentStatus) || "";
  const urlResourceId = searchParams.get(FILTER_PARAMS.resourceId) || "";
  const urlFrom = searchParams.get(FILTER_PARAMS.from) || "";
  const urlTo = searchParams.get(FILTER_PARAMS.to) || "";
  const urlPage = Number(searchParams.get(FILTER_PARAMS.page)) || 1;
  const urlSort = searchParams.get(FILTER_PARAMS.sort) || "checkIn";
  const urlSortDir = searchParams.get(FILTER_PARAMS.sortDir) || "desc";
  const urlPageSize = searchParams.get(FILTER_PARAMS.pageSize) || "20";
  const urlView = searchParams.get(FILTER_PARAMS.view) || "auto";

  // Local state
  const [reservations, setReservations] = useState([]);
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState("");

  // Track mounted state to avoid state-updates after unmount
  const mountedRef = useRef(true);
  useEffect(
    () => () => {
      mountedRef.current = false;
    },
    [],
  );

  const canSeeAll = useMemo(() => canViewAllReservations(user), [user]);

  // ── Load data ─────────────────────────────────────────────────────────────
  const load = useCallback(async () => {
    if (!user?.$id) {
      if (mountedRef.current) setLoading(false);
      return;
    }
    setLoading(true);
    setError("");

    try {
      const ownerParam = getOwnerQueryParam(user);
      const [resResult, resourcesResult] = await Promise.all([
        reservationsService.listForOwner(ownerParam, {
          status: urlStatus,
          paymentStatus: urlPaymentStatus,
          resourceId: urlResourceId,
        }),
        resourcesService.listMine(user.$id),
      ]);

      if (!mountedRef.current) return;
      setReservations(resResult.documents || []);
      setResources(resourcesResult.documents || []);
    } catch (err) {
      if (!mountedRef.current) return;
      setError(getErrorMessage(err, t("appReservationsPage.errors.load")));
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [user?.$id, canSeeAll, urlStatus, urlPaymentStatus, urlResourceId, t]);

  useEffect(() => {
    mountedRef.current = true; // Re-assert on each load cycle (prevents Strict Mode stuck-loading)
    load();
  }, [load]);

  // ── Client-side text filter + search ─────────────────────────────────────
  const normalizedQuery = urlQuery.trim().toLowerCase();
  const filteredReservations = useMemo(() => {
    let list = reservations;

    if (normalizedQuery) {
      list = list.filter((item) => {
        const haystack = [
          item.$id,
          item.resourceId || item.propertyId,
          item.guestName,
          item.guestEmail,
          item.guestPhone,
          item.status,
          item.paymentStatus,
          item.externalRef,
        ]
          .map((v) => String(v || "").toLowerCase())
          .join(" ");
        return haystack.includes(normalizedQuery);
      });
    }

    if (urlFrom) {
      list = list.filter((item) => {
        const start = item.checkInDate || item.startDateTime;
        return start && start >= urlFrom;
      });
    }
    if (urlTo) {
      list = list.filter((item) => {
        const end = item.checkOutDate || item.endDateTime;
        return end && end <= urlTo;
      });
    }

    return list;
  }, [reservations, normalizedQuery, urlFrom, urlTo]);

  // ── Client-side sort ─────────────────────────────────────────────────────
  const sortedReservations = useMemo(() => {
    const list = [...filteredReservations];
    list.sort((a, b) => {
      let aVal, bVal;
      switch (urlSort) {
        case "guestName":
          aVal = (a.guestName || "").toLowerCase();
          bVal = (b.guestName || "").toLowerCase();
          break;
        case "status":
          aVal = a.status || "";
          bVal = b.status || "";
          break;
        case "paymentStatus":
          aVal = a.paymentStatus || "";
          bVal = b.paymentStatus || "";
          break;
        case "amount":
          aVal = Number(a.totalAmount) || 0;
          bVal = Number(b.totalAmount) || 0;
          break;
        default: // "checkIn"
          aVal = a.checkInDate || a.startDateTime || "";
          bVal = b.checkInDate || b.startDateTime || "";
      }
      if (aVal < bVal) return urlSortDir === "asc" ? -1 : 1;
      if (aVal > bVal) return urlSortDir === "asc" ? 1 : -1;
      return 0;
    });
    return list;
  }, [filteredReservations, urlSort, urlSortDir]);

  // ── Pagination ────────────────────────────────────────────────────────────
  const effectivePageSize =
    urlPageSize === "all"
      ? Math.max(1, sortedReservations.length)
      : Math.max(1, Number(urlPageSize) || 20);
  const totalPages = Math.max(
    1,
    urlPageSize === "all"
      ? 1
      : Math.ceil(sortedReservations.length / effectivePageSize),
  );
  const safePage = Math.min(Math.max(1, urlPage), totalPages);
  const paginatedReservations = useMemo(() => {
    if (urlPageSize === "all") return sortedReservations;
    return sortedReservations.slice(
      (safePage - 1) * effectivePageSize,
      safePage * effectivePageSize,
    );
  }, [sortedReservations, safePage, effectivePageSize, urlPageSize]);

  // ── KPI stats ─────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    let pending = 0;
    let confirmed = 0;
    let paid = 0;
    for (const r of filteredReservations) {
      if (r.status === "pending") pending++;
      else if (r.status === "confirmed") confirmed++;
      if (r.paymentStatus === "paid") paid++;
    }
    return { total: filteredReservations.length, pending, confirmed, paid };
  }, [filteredReservations]);

  // ── Resource map (id → title) ─────────────────────────────────────────────
  const resourceMap = useMemo(() => {
    const map = {};
    for (const r of resources) map[r.$id] = r;
    return map;
  }, [resources]);

  // ── Filter mutation helpers ───────────────────────────────────────────────
  const setFilter = useCallback(
    (key, value) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (value) next.set(key, value);
          else next.delete(key);
          next.delete(FILTER_PARAMS.page); // reset page on filter change
          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  // Debounced search query setter
  const debouncedSetQuery = useMemo(
    () => debounce((value) => setFilter(FILTER_PARAMS.query, value), 300),
    [setFilter],
  );
  useEffect(() => () => debouncedSetQuery.cancel(), [debouncedSetQuery]);

  const setPage = useCallback(
    (p) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (p > 1) next.set(FILTER_PARAMS.page, String(p));
          else next.delete(FILTER_PARAMS.page);
          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  const setSort = useCallback(
    (key) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          const currentSort = next.get(FILTER_PARAMS.sort) || "checkIn";
          const currentDir = next.get(FILTER_PARAMS.sortDir) || "desc";
          if (currentSort === key) {
            next.set(
              FILTER_PARAMS.sortDir,
              currentDir === "asc" ? "desc" : "asc",
            );
          } else {
            next.set(FILTER_PARAMS.sort, key);
            next.set(FILTER_PARAMS.sortDir, "asc");
          }
          next.delete(FILTER_PARAMS.page);
          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  const setPageSize = useCallback(
    (value) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.set(
            FILTER_PARAMS.pageSize,
            value === "all" ? "all" : String(value),
          );
          next.delete(FILTER_PARAMS.page);
          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  const resetFilters = useCallback(() => {
    setSearchParams({}, { replace: true });
  }, [setSearchParams]);

  // ── Single-reservation mutation ───────────────────────────────────────────
  const updateReservation = useCallback(
    async (reservationId, patch) => {
      setBusyId(reservationId);
      setError("");
      try {
        await reservationsService.updateStatus(reservationId, patch);
        await load();
      } catch (err) {
        setError(getErrorMessage(err, t("appReservationsPage.errors.update")));
      } finally {
        if (mountedRef.current) setBusyId("");
      }
    },
    [load, t],
  );

  // ── View toggle ─────────────────────────────────────────────────────────
  const setView = useCallback(
    (value) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (value && value !== "auto") next.set(FILTER_PARAMS.view, value);
          else next.delete(FILTER_PARAMS.view);
          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  const locale = i18n.language === "en" ? "en-US" : "es-MX";

  return {
    // Data
    reservations: paginatedReservations,
    allFiltered: filteredReservations,
    resources,
    resourceMap,
    stats,
    // UI state
    loading,
    error,
    busyId,
    canSeeAll,
    locale,
    // Filters (current values)
    filters: {
      query: urlQuery,
      status: urlStatus,
      paymentStatus: urlPaymentStatus,
      resourceId: urlResourceId,
      from: urlFrom,
      to: urlTo,
    },
    // Pagination
    page: safePage,
    totalPages,
    totalCount: filteredReservations.length,
    pageSize: urlPageSize === "all" ? "all" : Number(urlPageSize) || 20,
    setPage,
    setPageSize,
    // Sort
    sortKey: urlSort,
    sortDir: urlSortDir,
    setSort,
    // View
    view: urlView,
    setView,
    // Actions
    load,
    setFilter,
    debouncedSetQuery,
    resetFilters,
    updateReservation,
  };
};
