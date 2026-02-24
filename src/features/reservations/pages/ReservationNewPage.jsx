/**
 * ReservationNewPage – /app/reservations/new
 *
 * Full-width layout with section cards and desktop summary sidebar.
 */
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import ReservationForm from "../components/ReservationForm";
import { useReservationForm } from "../hooks/useReservationForm";
import { resourcesService } from "../../../services/resourcesService";
import { useAuth } from "../../../hooks/useAuth";

const ReservationNewPage = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [resources, setResources] = useState([]);
  const [loadingResources, setLoadingResources] = useState(true);

  // ── Load resources for the selector ──────────────────────────────────────
  useEffect(() => {
    if (!user?.$id) return;
    let mounted = true;
    setLoadingResources(true);
    resourcesService
      .listMine(user.$id)
      .then((res) => {
        if (mounted) setResources(res.documents || []);
      })
      .catch(() => {})
      .finally(() => {
        if (mounted) setLoadingResources(false);
      });
    return () => {
      mounted = false;
    };
  }, [user?.$id]);

  const { form, errors, submitting, submitError, onChange, submitCreate } =
    useReservationForm();

  return (
    <section className="space-y-6 pb-24">
      {/* ── Back nav + header ───────────────────────────────────────────── */}
      <header className="space-y-1">
        <Link
          to="/app/reservations"
          className="inline-flex min-h-11 items-center gap-1.5 text-sm text-slate-500 transition
            [@media(hover:hover)]:hover:text-slate-900 dark:[@media(hover:hover)]:hover:text-slate-100"
        >
          <ArrowLeft size={14} /> Volver a reservas
        </Link>
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
          Nueva reserva
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Registra una reserva manual o conciliada externamente.
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

      {/* ── Form (full-width, 2-col on desktop) ───────────────────────── */}
      <ReservationForm
        form={form}
        errors={errors}
        resources={resources}
        loading={loadingResources}
        submitting={submitting}
        mode="create"
        onChange={onChange}
        onSubmit={submitCreate}
      />
    </section>
  );
};

export default ReservationNewPage;
