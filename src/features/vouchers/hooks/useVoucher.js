/**
 * useVoucher – fetches a single voucher by code, plus its reservation & resource.
 */
import { useEffect, useState, useCallback } from "react";
import { databases, Query } from "../../../api/appwriteClient";
import env from "../../../env";
import { getErrorMessage } from "../../../utils/errors";

const db = env.appwrite.databaseId;
const col = env.appwrite.collections;

export function useVoucher(code) {
  const [voucher, setVoucher] = useState(null);
  const [reservation, setReservation] = useState(null);
  const [resource, setResource] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!code) {
      setError("No voucher code provided.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

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
    } catch (err) {
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

  return { voucher, reservation, resource, loading, error, reload: load };
}

export default useVoucher;
