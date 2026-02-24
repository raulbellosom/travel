/**
 * ReservationEditPage – /app/reservations/:id/edit
 *
 * Dedicated edit page for a reservation.
 * Loads reservation + resources, pre-populates form, and saves changes.
 */
import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft } from "lucide-react";
import { reservationsService } from "../../../services/reservationsService";
import { resourcesService } from "../../../services/resourcesService";
import { clientsService } from "../../../services/clientsService";
import { useAuth } from "../../../hooks/useAuth";
import { getErrorMessage } from "../../../utils/errors";
import { useToast } from "../../../hooks/useToast";
import { useReservationForm } from "../hooks/useReservationForm";
import ReservationForm from "../components/ReservationForm";
import SkeletonLoader from "../../../components/common/molecules/SkeletonLoader";

const ReservationEditPage = () => {
  const { id } = useParams();
  const { t } = useTranslation();
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [reservation, setReservation] = useState(null);
  const [resources, setResources] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const isRoot =
    String(user?.role || "")
      .trim()
      .toLowerCase() === "root";

  // ── Load reservation + resources (+ clients for root) ─────────────────────
  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError("");
    try {
      const promises = [
        reservationsService.getById(id),
        resourcesService.listMine(user?.$id),
      ];
      // Root can reassign guest → load client list
      if (isRoot) {
        promises.push(
          clientsService.listClients({ limit: 500 }).catch(() => ({
            documents: [],
          })),
        );
      }
      const [res, resourcesRes, clientsRes] = await Promise.all(promises);
      setReservation(res);
      setResources(resourcesRes.documents || []);
      if (clientsRes) setClients(clientsRes.documents || []);
    } catch (err) {
      setError(getErrorMessage(err, "No se pudo cargar la reserva."));
    } finally {
      setLoading(false);
    }
  }, [id, user?.$id, isRoot]);

  useEffect(() => {
    load();
  }, [load]);

  // ── Form hook ─────────────────────────────────────────────────────────────
  const {
    form,
    errors: formErrors,
    submitting,
    submitError,
    onChange,
    submitUpdate,
  } = useReservationForm(
    reservation
      ? {
          resourceId: reservation.resourceId || reservation.propertyId || "",
          scheduleType:
            reservation.bookingType === "time_slot"
              ? "time_slot"
              : "date_range",
          checkInDate: reservation.checkInDate || "",
          checkOutDate: reservation.checkOutDate || "",
          startDateTime: reservation.startDateTime || "",
          endDateTime: reservation.endDateTime || "",
          guestName: reservation.guestName || "",
          guestEmail: reservation.guestEmail || "",
          guestPhone: reservation.guestPhone || "",
          guestCount: String(reservation.guestCount ?? "1"),
          baseAmount:
            reservation.baseAmount != null
              ? String(reservation.baseAmount)
              : "",
          totalAmount:
            reservation.totalAmount != null
              ? String(reservation.totalAmount)
              : "",
          currency: reservation.currency || "MXN",
          externalRef: reservation.externalRef || "",
          specialRequests: reservation.specialRequests || "",
          status: reservation.status || "pending",
          paymentStatus: reservation.paymentStatus || "pending",
        }
      : {},
  );

  const handleSubmit = async (e) => {
    await submitUpdate(e, id);
    if (!submitError) {
      showToast({ type: "success", message: "Reserva actualizada." });
      navigate(`/app/reservations/${id}`);
    }
  };

  // ── Loading / error states ────────────────────────────────────────────────
  if (loading) return <SkeletonLoader variant="detail" className="py-4" />;

  if (error && !reservation) {
    return (
      <section className="space-y-4">
        <Link
          to="/app/reservations"
          className="inline-flex min-h-11 items-center gap-1.5 text-sm text-slate-500
            [@media(hover:hover)]:hover:text-slate-900 dark:[@media(hover:hover)]:hover:text-slate-100"
        >
          <ArrowLeft size={14} /> Volver
        </Link>
        <p
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300"
        >
          {error}
        </p>
      </section>
    );
  }

  const resourceTitle =
    resources.find(
      (r) => r.$id === (reservation.resourceId || reservation.propertyId),
    )?.title ||
    reservation.resourceId ||
    "Reserva";

  return (
    <section className="space-y-6 pb-24">
      {/* ── Back nav + header ───────────────────────────────────────────── */}
      <header className="space-y-1">
        <Link
          to={`/app/reservations/${id}`}
          className="inline-flex min-h-11 items-center gap-1.5 text-sm text-slate-500 transition
            [@media(hover:hover)]:hover:text-slate-900 dark:[@media(hover:hover)]:hover:text-slate-100"
        >
          <ArrowLeft size={14} /> Volver a detalle
        </Link>
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
          Editar reserva
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {resourceTitle}
        </p>
      </header>

      {/* ── Submit error ───────────────────────────────────────────────── */}
      {submitError ? (
        <p
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700
            dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300"
        >
          {submitError}
        </p>
      ) : null}

      {/* ── Form ───────────────────────────────────────────────────────── */}
      <ReservationForm
        form={form}
        errors={formErrors}
        resources={resources}
        clients={clients}
        loading={false}
        submitting={submitting}
        mode="edit"
        isRoot={isRoot}
        onChange={onChange}
        onSubmit={handleSubmit}
      />
    </section>
  );
};

export default ReservationEditPage;
