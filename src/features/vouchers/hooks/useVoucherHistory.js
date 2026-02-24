/**
 * useVoucherHistory – fetches voucher history for the current user (or all for admin/root).
 */
import { useEffect, useState, useCallback } from "react";
import { databases, Query } from "../../../api/appwriteClient";
import env from "../../../env";
import { useAuth } from "../../../hooks/useAuth";

const db = env.appwrite.databaseId;
const col = env.appwrite.collections;

/**
 * Fetches vouchers + linked reservations.
 * Admin/root see all; regular users see only their reservations.
 */
export function useVoucherHistory() {
  const { user } = useAuth();
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const role = String(user?.role || "").toLowerCase();
  const isAdmin = ["root", "admin", "owner"].includes(role);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      // 1) Determine which reservations the user can see
      let reservationIds = [];

      if (isAdmin) {
        // Admin sees all vouchers — we just fetch the latest vouchers directly
        const vRes = await databases.listDocuments({
          databaseId: db,
          collectionId: col.reservationVouchers,
          queries: [
            Query.equal("enabled", true),
            Query.orderDesc("$createdAt"),
            Query.limit(50),
          ],
        });
        const vDocs = vRes.documents || [];

        // Fetch reservations for context
        const rIds = [
          ...new Set(vDocs.map((v) => v.reservationId).filter(Boolean)),
        ];
        const reservationMap = {};
        await Promise.all(
          rIds.map(async (rid) => {
            try {
              const r = await databases.getDocument({
                databaseId: db,
                collectionId: col.reservations,
                documentId: rid,
              });
              reservationMap[rid] = r;
            } catch {
              /* skip missing */
            }
          }),
        );

        setVouchers(
          vDocs.map((v) => ({
            ...v,
            _reservation: reservationMap[v.reservationId] || null,
          })),
        );
      } else if (user?.$id) {
        // Regular user – get their reservations first, then vouchers
        const rRes = await databases.listDocuments({
          databaseId: db,
          collectionId: col.reservations,
          queries: [
            Query.equal("guestUserId", user.$id),
            Query.orderDesc("$createdAt"),
            Query.limit(100),
          ],
        });
        reservationIds = (rRes.documents || []).map((r) => r.$id);
        const reservationMap = {};
        (rRes.documents || []).forEach((r) => {
          reservationMap[r.$id] = r;
        });

        if (reservationIds.length === 0) {
          setVouchers([]);
          return;
        }

        // Fetch vouchers filtered by those reservation IDs
        const vRes = await databases.listDocuments({
          databaseId: db,
          collectionId: col.reservationVouchers,
          queries: [
            Query.equal("reservationId", reservationIds),
            Query.equal("enabled", true),
            Query.orderDesc("$createdAt"),
            Query.limit(50),
          ],
        });

        setVouchers(
          (vRes.documents || []).map((v) => ({
            ...v,
            _reservation: reservationMap[v.reservationId] || null,
          })),
        );
      } else {
        setVouchers([]);
      }
    } catch (err) {
      setError(err.message || "Error loading voucher history");
    } finally {
      setLoading(false);
    }
  }, [user?.$id, isAdmin]);

  useEffect(() => {
    load();
  }, [load]);

  return { vouchers, loading, error, reload: load, isAdmin };
}

export default useVoucherHistory;
