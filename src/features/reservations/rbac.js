/**
 * Reservation RBAC helpers
 *
 * Permissions are assigned per-user from the Team panel, stored in
 * `user.scopesJson` and evaluated by `hasScope()` from utils/roles.
 *
 * Reservation scope strings (from Team.jsx SCOPE_OPTIONS):
 *   - reservations.read       → view the tab + own reservations only
 *   - reservations.read.all   → view ALL reservations (explicit grant)
 *   - reservations.write      → create / edit own reservations
 *   - reservations.write.all  → create / edit ALL reservations (explicit grant)
 *
 * root and owner always receive "*" via ROLE_DEFAULT_SCOPES, so they
 * implicitly satisfy every scope check.
 */
import { hasScope } from "../../utils/roles";

/**
 * Can this user see ALL reservations (not just their own)?
 * True for root/owner (wildcard "*") or explicit "reservations.read.all".
 */
export const canViewAllReservations = (user) => {
  const role = String(user?.role || "")
    .trim()
    .toLowerCase();
  if (role === "root" || role === "owner") return true;
  return hasScope(user, "reservations.read.all");
};

/**
 * Can this user create or update reservations?
 * Requires "reservations.write" (own) or wildcard "*" (root/owner).
 */
export const canWriteReservations = (user) => {
  return hasScope(user, "reservations.write");
};

/**
 * Can this user create or update ANY reservation (not just their own)?
 * Requires "reservations.write.all" or wildcard "*" (root/owner).
 */
export const canWriteAllReservations = (user) => {
  const role = String(user?.role || "")
    .trim()
    .toLowerCase();
  if (role === "root" || role === "owner") return true;
  return hasScope(user, "reservations.write.all");
};

/**
 * Can this user cancel a reservation?  Same gate as write.
 */
export const canCancelReservation = (user) => {
  return hasScope(user, "reservations.write");
};

/**
 * Returns the owner ID to use as a backend filter when listing reservations.
 *   root / owner / reservations.read.all  → null  (no filter, receive all)
 *   everyone else                          → user.$id (own records only)
 */
export const getOwnerQueryParam = (user) => {
  if (canViewAllReservations(user)) return null;
  return user?.$id || null;
};
