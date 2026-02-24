/**
 * useVoucher – fetches a single voucher by code, plus its reservation & resource.
 *
 * Offline support:
 *   On successful fetch → caches {voucher, reservation, resource} in localStorage.
 *   On network failure  → serves cached data when available & sets isOffline=true.
 *   Cache TTL: 30 days per voucher code.
 */
import { useEffect, useState, useCallback } from "react";
import { databases, Query } from "../../../api/appwriteClient";
import env from "../../../env";
import { getErrorMessage } from "../../../utils/errors";

const db = env.appwrite.databaseId;
const col = env.appwrite.collections;

/* ── localStorage helpers ─────────────────────────────────────────────── */
const CACHE_PREFIX = "inmobo_voucher_";
const CACHE_TTL = 30 * 24 * 60 * 60 * 1000; // 30 days

function cacheKey(code) {
  return `${CACHE_PREFIX}${String(code).trim().toUpperCase()}`;
}

function writeCache(code, data) {
  try {
    const payload = { ts: Date.now(), ...data };
    localStorage.setItem(cacheKey(code), JSON.stringify(payload));
  } catch {
    /* Storage full or unavailable — silently ignore */
  }
}

function readCache(code) {
  try {
    const raw = localStorage.getItem(cacheKey(code));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (Date.now() - parsed.ts > CACHE_TTL) {
      localStorage.removeItem(cacheKey(code));
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

/* ── Hook ─────────────────────────────────────────────────────────────── */
export function useVoucher(code) {
  const [voucher, setVoucher] = useState(null);
  const [reservation, setReservation] = useState(null);
  const [resource, setResource] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isOffline, setIsOffline] = useState(false);

  const load = useCallback(async () => {
    if (!code) {
      setError("No voucher code provided.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");
    setIsOffline(false);

    try {
      const vRes = await databases.listDocuments({
        databaseId: db,
        collectionId: col.reservationVouchers,
        queries: [
          Query.equal("voucherCode", String(code).trim().toUpperCase()),
          Query.equal("enabled", true),
          Query.limit(1),
        ],
      });

      const doc = vRes.documents?.[0];
      if (!doc) throw new Error("NOT_FOUND");

      const resDoc = await databases.getDocument({
        databaseId: db,
        collectionId: col.reservations,
        documentId: doc.reservationId,
      });

      let resResource = null;
      const resourceId = resDoc?.resourceId || resDoc?.propertyId;
      if (resourceId) {
        resResource = await databases
          .getDocument({
            databaseId: db,
            collectionId: col.resources,
            documentId: resourceId,
          })
          .catch(() => null);
      }

      setVoucher(doc);
      setReservation(resDoc);
      setResource(resResource);

      // Persist to cache for offline use
      writeCache(code, {
        voucher: doc,
        reservation: resDoc,
        resource: resResource,
      });
    } catch (err) {
      // If network error, try to serve from cache
      if (err.message !== "NOT_FOUND") {
        const cached = readCache(code);
        if (cached?.voucher) {
          setVoucher(cached.voucher);
          setReservation(cached.reservation);
          setResource(cached.resource);
          setIsOffline(true);
          setLoading(false);
          return;
        }
      }

      setError(
        err.message === "NOT_FOUND"
          ? "NOT_FOUND"
          : getErrorMessage(err, "Error loading voucher"),
      );
    } finally {
      setLoading(false);
    }
  }, [code]);

  useEffect(() => {
    let mounted = true;
    load().then(() => {
      if (!mounted) return;
    });
    return () => {
      mounted = false;
    };
  }, [load]);

  return {
    voucher,
    reservation,
    resource,
    loading,
    error,
    isOffline,
    reload: load,
  };
}

export default useVoucher;
