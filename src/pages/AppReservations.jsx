import LoadingState from "../components/common/molecules/LoadingState";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { CalendarDays, CreditCard, Filter, Search, User } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { Select } from "../components/common";
import { reservationsService } from "../services/reservationsService";
import { resourcesService } from "../services/resourcesService";
import { getErrorMessage } from "../utils/errors";
import EmptyStatePanel from "../components/common/organisms/EmptyStatePanel";
import { formatMoneyWithDenomination } from "../utils/money";

const RESERVATION_STATUSES = [
  "pending",
  "confirmed",
  "completed",
  "cancelled",
  "expired",
];
const PAYMENT_STATUSES = ["unpaid", "pending", "paid", "failed", "refunded"];
const MANUAL_FORM_INITIAL_STATE = Object.freeze({
  resourceId: "",
  scheduleType: "date_range",
  checkInDate: "",
  checkOutDate: "",
  startDateTime: "",
  endDateTime: "",
  guestName: "",
  guestEmail: "",
  guestPhone: "",
  guestCount: "1",
  baseAmount: "",
  totalAmount: "",
  currency: "MXN",
  externalRef: "",
  specialRequests: "",
  status: "pending",
  paymentStatus: "pending",
});

const AppReservations = () => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState("");
  const [reservations, setReservations] = useState([]);
  const [resources, setResources] = useState([]);
  const [filters, setFilters] = useState({
    status: "",
    paymentStatus: "",
  });
  const [manualForm, setManualForm] = useState(() => ({
    ...MANUAL_FORM_INITIAL_STATE,
  }));
  const [manualBusy, setManualBusy] = useState(false);
  const [queryFilter, setQueryFilter] = useState(() =>
    String(searchParams.get("search") || "").trim(),
  );
  const locale = i18n.language === "en" ? "en-US" : "es-MX";
  const focusId = searchParams.get("focus") || "";

  useEffect(() => {
    const nextSearch = String(searchParams.get("search") || "").trim();
    setQueryFilter((prev) => (prev === nextSearch ? prev : nextSearch));
  }, [searchParams]);

  const load = useCallback(async () => {
    if (!user?.$id) return;
    setLoading(true);
    setError("");
    try {
      const [reservationsResponse, resourcesResponse] = await Promise.all([
        reservationsService.listForOwner(user.$id, filters),
        resourcesService.listMine(user.$id),
      ]);
      setReservations(reservationsResponse.documents || []);
      setResources(resourcesResponse.documents || []);
    } catch (err) {
      setError(getErrorMessage(err, i18n.t("appReservationsPage.errors.load")));
    } finally {
      setLoading(false);
    }
  }, [filters, user?.$id, i18n]);

  useEffect(() => {
    load();
  }, [load]);

  const normalizedFilter = String(queryFilter || "")
    .trim()
    .toLowerCase();
  const filteredReservations = useMemo(() => {
    if (!normalizedFilter) return reservations;

    return reservations.filter((item) => {
      const text = [
        item.$id,
        item.resourceId || item.propertyId,
        item.guestName,
        item.guestEmail,
        item.guestPhone,
        item.status,
        item.paymentStatus,
      ]
        .map((value) => String(value || "").toLowerCase())
        .join(" ");
      return text.includes(normalizedFilter);
    });
  }, [normalizedFilter, reservations]);

  useEffect(() => {
    if (loading || !focusId) return;
    const card = document.getElementById(`reservation-${focusId}`);
    card?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [filteredReservations.length, focusId, loading]);

  const stats = useMemo(() => {
    const pending = filteredReservations.filter(
      (item) => item.status === "pending",
    ).length;
    const confirmed = filteredReservations.filter(
      (item) => item.status === "confirmed",
    ).length;
    const paid = filteredReservations.filter(
      (item) => item.paymentStatus === "paid",
    ).length;
    return {
      total: filteredReservations.length,
      pending,
      confirmed,
      paid,
    };
  }, [filteredReservations]);

  const reservationStatusOptions = useMemo(
    () => [
      { value: "", label: t("appReservationsPage.filters.all") },
      ...RESERVATION_STATUSES.map((status) => ({
        value: status,
        label: t(`reservationStatus.${status}`),
      })),
    ],
    [t],
  );

  const paymentStatusOptions = useMemo(
    () => [
      { value: "", label: t("appReservationsPage.filters.all") },
      ...PAYMENT_STATUSES.map((status) => ({
        value: status,
        label: t(`paymentStatus.${status}`),
      })),
    ],
    [t],
  );
  const resourceMap = useMemo(() => {
    const map = {};
    for (const resource of resources) {
      map[resource.$id] = resource;
    }
    return map;
  }, [resources]);
  const resourceOptions = useMemo(
    () => [
      {
        value: "",
        label: t("appReservationsPage.manual.fields.resource", {
          defaultValue: "Selecciona un recurso",
        }),
      },
      ...resources.map((resource) => ({
        value: resource.$id,
        label: resource.title || resource.$id,
      })),
    ],
    [resources, t],
  );
  const scheduleTypeOptions = useMemo(
    () => [
      {
        value: "date_range",
        label: t("client:common.enums.bookingType.date_range", {
          defaultValue: "Rango de fechas",
        }),
      },
      {
        value: "time_slot",
        label: t("client:common.enums.bookingType.time_slot", {
          defaultValue: "Horario",
        }),
      },
    ],
    [t],
  );
  const statusOptions = useMemo(
    () =>
      RESERVATION_STATUSES.map((status) => ({
        value: status,
        label: t(`reservationStatus.${status}`),
      })),
    [t],
  );
  const paymentOptions = useMemo(
    () =>
      PAYMENT_STATUSES.map((status) => ({
        value: status,
        label: t(`paymentStatus.${status}`),
      })),
    [t],
  );

  const updateReservation = async (reservationId, patch) => {
    setBusyId(reservationId);
    setError("");
    try {
      await reservationsService.updateStatus(reservationId, patch);
      await load();
    } catch (err) {
      setError(getErrorMessage(err, t("appReservationsPage.errors.update")));
    } finally {
      setBusyId("");
    }
  };

  const updateManualField = (field, value) => {
    setManualForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleCreateManualReservation = async (event) => {
    event.preventDefault();
    if (!manualForm.resourceId) {
      setError(
        t("appReservationsPage.errors.manualResourceRequired", {
          defaultValue: "Selecciona un recurso para crear la reserva manual.",
        }),
      );
      return;
    }
    if (
      manualForm.scheduleType === "date_range" &&
      (!manualForm.checkInDate || !manualForm.checkOutDate)
    ) {
      setError(
        t("appReservationsPage.errors.manualDatesRequired", {
          defaultValue: "Selecciona fecha de entrada y salida.",
        }),
      );
      return;
    }
    if (
      manualForm.scheduleType === "time_slot" &&
      (!manualForm.startDateTime || !manualForm.endDateTime)
    ) {
      setError(
        t("appReservationsPage.errors.manualSlotRequired", {
          defaultValue: "Selecciona fecha y horario de inicio/fin.",
        }),
      );
      return;
    }

    const payload = {
      resourceId: manualForm.resourceId,
      scheduleType: manualForm.scheduleType,
      status: manualForm.status,
      paymentStatus: manualForm.paymentStatus,
      currency: manualForm.currency || "MXN",
      closeLead: false,
      guestName: String(manualForm.guestName || "").trim() || undefined,
      guestEmail:
        String(manualForm.guestEmail || "").trim().toLowerCase() || undefined,
      guestPhone: String(manualForm.guestPhone || "").trim() || undefined,
      guestCount: Number(manualForm.guestCount || 1),
      externalRef: String(manualForm.externalRef || "").trim() || undefined,
      specialRequests:
        String(manualForm.specialRequests || "").trim() || undefined,
    };

    if (manualForm.scheduleType === "date_range") {
      payload.checkInDate = manualForm.checkInDate;
      payload.checkOutDate = manualForm.checkOutDate;
    } else {
      payload.startDateTime = manualForm.startDateTime;
      payload.endDateTime = manualForm.endDateTime;
    }

    if (manualForm.baseAmount !== "") {
      payload.baseAmount = Number(manualForm.baseAmount);
    }
    if (manualForm.totalAmount !== "") {
      payload.totalAmount = Number(manualForm.totalAmount);
    }

    setManualBusy(true);
    setError("");
    try {
      await reservationsService.createManualReservation(payload);
      setManualForm((prev) => ({
        ...MANUAL_FORM_INITIAL_STATE,
        resourceId: prev.resourceId,
      }));
      await load();
    } catch (err) {
      setError(
        getErrorMessage(
          err,
          t("appReservationsPage.errors.manualCreate", {
            defaultValue: "No se pudo crear la reserva manual.",
          }),
        ),
      );
    } finally {
      setManualBusy(false);
    }
  };

  return (
    <section className="space-y-5">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
          {t("appReservationsPage.title")}
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          {t("appReservationsPage.subtitle")}
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
          <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-300">
            {t("appReservationsPage.stats.total")}
          </p>
          <p className="mt-1 text-2xl font-semibold text-slate-900 dark:text-slate-100">
            {stats.total}
          </p>
        </article>
        <article className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
          <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-300">
            {t("appReservationsPage.stats.pending")}
          </p>
          <p className="mt-1 text-2xl font-semibold text-amber-600 dark:text-amber-300">
            {stats.pending}
          </p>
        </article>
        <article className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
          <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-300">
            {t("appReservationsPage.stats.confirmed")}
          </p>
          <p className="mt-1 text-2xl font-semibold text-cyan-600 dark:text-cyan-300">
            {stats.confirmed}
          </p>
        </article>
        <article className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
          <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-300">
            {t("appReservationsPage.stats.paid")}
          </p>
          <p className="mt-1 text-2xl font-semibold text-emerald-600 dark:text-emerald-300">
            {stats.paid}
          </p>
        </article>
      </div>

      <form
        onSubmit={handleCreateManualReservation}
        className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900"
      >
        <div>
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            {t("appReservationsPage.manual.title", {
              defaultValue: "Crear reserva manual",
            })}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {t("appReservationsPage.manual.subtitle", {
              defaultValue:
                "Registra reservas sin pago en plataforma o conciliadas externamente.",
            })}
          </p>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <label className="grid gap-1 text-sm md:col-span-2">
            <span>{t("appReservationsPage.manual.fields.resource")}</span>
            <Select
              value={manualForm.resourceId}
              onChange={(value) => updateManualField("resourceId", value)}
              options={resourceOptions}
              size="md"
            />
          </label>
          <label className="grid gap-1 text-sm">
            <span>{t("appReservationsPage.manual.fields.scheduleType")}</span>
            <Select
              value={manualForm.scheduleType}
              onChange={(value) => updateManualField("scheduleType", value)}
              options={scheduleTypeOptions}
              size="md"
            />
          </label>
          <label className="grid gap-1 text-sm">
            <span>{t("appReservationsPage.manual.fields.currency")}</span>
            <input
              value={manualForm.currency}
              onChange={(event) =>
                updateManualField(
                  "currency",
                  String(event.target.value || "").toUpperCase().slice(0, 3),
                )
              }
              className="min-h-11 rounded-lg border border-slate-300 bg-white px-3 py-2 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 dark:border-slate-600 dark:bg-slate-800"
            />
          </label>

          {manualForm.scheduleType === "date_range" ? (
            <>
              <label className="grid gap-1 text-sm">
                <span>{t("appReservationsPage.manual.fields.checkInDate")}</span>
                <input
                  type="date"
                  value={manualForm.checkInDate}
                  onChange={(event) =>
                    updateManualField("checkInDate", event.target.value)
                  }
                  className="min-h-11 rounded-lg border border-slate-300 bg-white px-3 py-2 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 dark:border-slate-600 dark:bg-slate-800"
                />
              </label>
              <label className="grid gap-1 text-sm">
                <span>{t("appReservationsPage.manual.fields.checkOutDate")}</span>
                <input
                  type="date"
                  value={manualForm.checkOutDate}
                  onChange={(event) =>
                    updateManualField("checkOutDate", event.target.value)
                  }
                  className="min-h-11 rounded-lg border border-slate-300 bg-white px-3 py-2 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 dark:border-slate-600 dark:bg-slate-800"
                />
              </label>
            </>
          ) : (
            <>
              <label className="grid gap-1 text-sm">
                <span>{t("appReservationsPage.manual.fields.startDateTime")}</span>
                <input
                  type="datetime-local"
                  value={manualForm.startDateTime}
                  onChange={(event) =>
                    updateManualField("startDateTime", event.target.value)
                  }
                  className="min-h-11 rounded-lg border border-slate-300 bg-white px-3 py-2 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 dark:border-slate-600 dark:bg-slate-800"
                />
              </label>
              <label className="grid gap-1 text-sm">
                <span>{t("appReservationsPage.manual.fields.endDateTime")}</span>
                <input
                  type="datetime-local"
                  value={manualForm.endDateTime}
                  onChange={(event) =>
                    updateManualField("endDateTime", event.target.value)
                  }
                  className="min-h-11 rounded-lg border border-slate-300 bg-white px-3 py-2 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 dark:border-slate-600 dark:bg-slate-800"
                />
              </label>
            </>
          )}

          <label className="grid gap-1 text-sm">
            <span>{t("appReservationsPage.manual.fields.guestName")}</span>
            <input
              value={manualForm.guestName}
              onChange={(event) =>
                updateManualField("guestName", event.target.value)
              }
              className="min-h-11 rounded-lg border border-slate-300 bg-white px-3 py-2 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 dark:border-slate-600 dark:bg-slate-800"
            />
          </label>
          <label className="grid gap-1 text-sm">
            <span>{t("appReservationsPage.manual.fields.guestEmail")}</span>
            <input
              type="email"
              value={manualForm.guestEmail}
              onChange={(event) =>
                updateManualField("guestEmail", event.target.value)
              }
              className="min-h-11 rounded-lg border border-slate-300 bg-white px-3 py-2 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 dark:border-slate-600 dark:bg-slate-800"
            />
          </label>
          <label className="grid gap-1 text-sm">
            <span>{t("appReservationsPage.manual.fields.guestPhone")}</span>
            <input
              value={manualForm.guestPhone}
              onChange={(event) =>
                updateManualField("guestPhone", event.target.value)
              }
              className="min-h-11 rounded-lg border border-slate-300 bg-white px-3 py-2 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 dark:border-slate-600 dark:bg-slate-800"
            />
          </label>
          <label className="grid gap-1 text-sm">
            <span>{t("appReservationsPage.manual.fields.guestCount")}</span>
            <input
              type="number"
              min={1}
              value={manualForm.guestCount}
              onChange={(event) =>
                updateManualField("guestCount", event.target.value)
              }
              className="min-h-11 rounded-lg border border-slate-300 bg-white px-3 py-2 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 dark:border-slate-600 dark:bg-slate-800"
            />
          </label>

          <label className="grid gap-1 text-sm">
            <span>{t("appReservationsPage.manual.fields.baseAmount")}</span>
            <input
              type="number"
              min={0}
              step="0.01"
              value={manualForm.baseAmount}
              onChange={(event) =>
                updateManualField("baseAmount", event.target.value)
              }
              className="min-h-11 rounded-lg border border-slate-300 bg-white px-3 py-2 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 dark:border-slate-600 dark:bg-slate-800"
            />
          </label>
          <label className="grid gap-1 text-sm">
            <span>{t("appReservationsPage.manual.fields.totalAmount")}</span>
            <input
              type="number"
              min={0}
              step="0.01"
              value={manualForm.totalAmount}
              onChange={(event) =>
                updateManualField("totalAmount", event.target.value)
              }
              className="min-h-11 rounded-lg border border-slate-300 bg-white px-3 py-2 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 dark:border-slate-600 dark:bg-slate-800"
            />
          </label>
          <label className="grid gap-1 text-sm">
            <span>{t("appReservationsPage.manual.fields.status")}</span>
            <Select
              value={manualForm.status}
              onChange={(value) => updateManualField("status", value)}
              options={statusOptions}
              size="md"
            />
          </label>
          <label className="grid gap-1 text-sm">
            <span>{t("appReservationsPage.manual.fields.paymentStatus")}</span>
            <Select
              value={manualForm.paymentStatus}
              onChange={(value) => updateManualField("paymentStatus", value)}
              options={paymentOptions}
              size="md"
            />
          </label>
          <label className="grid gap-1 text-sm md:col-span-2">
            <span>{t("appReservationsPage.manual.fields.externalRef")}</span>
            <input
              value={manualForm.externalRef}
              onChange={(event) =>
                updateManualField("externalRef", event.target.value)
              }
              className="min-h-11 rounded-lg border border-slate-300 bg-white px-3 py-2 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 dark:border-slate-600 dark:bg-slate-800"
            />
          </label>
          <label className="grid gap-1 text-sm md:col-span-2 xl:col-span-4">
            <span>{t("appReservationsPage.manual.fields.specialRequests")}</span>
            <textarea
              rows={2}
              value={manualForm.specialRequests}
              onChange={(event) =>
                updateManualField("specialRequests", event.target.value)
              }
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 dark:border-slate-600 dark:bg-slate-800"
            />
          </label>
        </div>
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={manualBusy}
            className="inline-flex min-h-11 items-center justify-center rounded-lg bg-cyan-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-cyan-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {manualBusy
              ? t("appReservationsPage.manual.actions.creating", {
                  defaultValue: "Creando...",
                })
              : t("appReservationsPage.manual.actions.create", {
                  defaultValue: "Crear reserva manual",
                })}
          </button>
        </div>
      </form>

      <div className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 md:grid-cols-3 dark:border-slate-700 dark:bg-slate-900">
        <label className="grid gap-1 text-sm">
          <span className="inline-flex items-center gap-2">
            <Search size={14} />
            {t("appReservationsPage.filters.search", {
              defaultValue: "Buscar",
            })}
          </span>
          <input
            value={queryFilter}
            onChange={(event) => setQueryFilter(event.target.value)}
            placeholder={t("appReservationsPage.filters.searchPlaceholder", {
              defaultValue: "Huesped, propiedad, estado o ID",
            })}
            className="min-h-11 rounded-lg border border-slate-300 bg-white px-3 py-2 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 dark:border-slate-600 dark:bg-slate-800"
          />
        </label>

        <label className="grid gap-1 text-sm">
          <span className="inline-flex items-center gap-2">
            <Filter size={14} />
            {t("appReservationsPage.filters.status")}
          </span>
          <Select
            value={filters.status}
            onChange={(value) =>
              setFilters((prev) => ({ ...prev, status: value }))
            }
            options={reservationStatusOptions}
            size="md"
          />
        </label>
        <label className="grid gap-1 text-sm">
          <span className="inline-flex items-center gap-2">
            <CreditCard size={14} />
            {t("appReservationsPage.filters.paymentStatus")}
          </span>
          <Select
            value={filters.paymentStatus}
            onChange={(value) =>
              setFilters((prev) => ({ ...prev, paymentStatus: value }))
            }
            options={paymentStatusOptions}
            size="md"
          />
        </label>
      </div>

      {loading ? <LoadingState text={t("appReservationsPage.loading")} /> : null}

      {error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200">
          {error}
        </p>
      ) : null}

      {!loading && !error && filteredReservations.length === 0 ? (
        <EmptyStatePanel
          icon={CalendarDays}
          title={t("appReservationsPage.empty")}
          description={t("appReservationsPage.subtitle")}
          compact
        />
      ) : null}

      {!loading && filteredReservations.length > 0 ? (
        <div className="grid gap-4">
          {filteredReservations.map((reservation) => {
            const isFocused = Boolean(focusId) && reservation.$id === focusId;
            const reservationResourceId =
              reservation.resourceId || reservation.propertyId;
            const reservationResourceTitle =
              resourceMap[reservationResourceId]?.title || reservationResourceId;
            const isTimeSlotReservation =
              reservation.bookingType === "time_slot" ||
              reservation.bookingType === "fixed_event";
            const scheduleStartValue =
              reservation.startDateTime || reservation.checkInDate;
            const scheduleEndValue =
              reservation.endDateTime || reservation.checkOutDate;
            const scheduleStartDate = scheduleStartValue
              ? new Date(scheduleStartValue)
              : null;
            const scheduleEndDate = scheduleEndValue
              ? new Date(scheduleEndValue)
              : null;
            const hasValidSchedule =
              scheduleStartDate &&
              scheduleEndDate &&
              !Number.isNaN(scheduleStartDate.getTime()) &&
              !Number.isNaN(scheduleEndDate.getTime());
            const scheduleLabel = hasValidSchedule
              ? isTimeSlotReservation
                ? `${scheduleStartDate.toLocaleString(locale)} - ${scheduleEndDate.toLocaleString(
                    locale,
                  )}`
                : `${scheduleStartDate.toLocaleDateString(locale)} - ${scheduleEndDate.toLocaleDateString(
                    locale,
                  )}`
              : "-";

            return (
              <article
                key={reservation.$id}
                id={`reservation-${reservation.$id}`}
                className={`rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900 ${
                  isFocused
                    ? "ring-2 ring-cyan-400/70 dark:ring-cyan-500/70"
                    : ""
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-300">
                      #{reservation.$id}
                    </p>
                    <p className="text-sm text-slate-700 dark:text-slate-200">
                      {reservationResourceTitle}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs">
                    <span className="rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                      {t(`reservationStatus.${reservation.status}`, {
                        defaultValue: reservation.status,
                      })}
                    </span>
                    <span className="rounded-full bg-cyan-100 px-3 py-1 font-semibold text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-200">
                      {t(`paymentStatus.${reservation.paymentStatus}`, {
                        defaultValue: reservation.paymentStatus,
                      })}
                    </span>
                  </div>
                </div>

                <div className="mt-3 grid gap-2 text-sm md:grid-cols-3">
                  <p className="inline-flex items-center gap-2 text-slate-600 dark:text-slate-300">
                    <User size={14} /> {reservation.guestName}
                  </p>
                  <p className="inline-flex items-center gap-2 text-slate-600 dark:text-slate-300">
                    <CalendarDays size={14} />
                    {scheduleLabel}
                  </p>
                  <p className="inline-flex items-center gap-2 text-slate-600 dark:text-slate-300">
                    <CreditCard size={14} />
                    {formatMoneyWithDenomination(Number(reservation.totalAmount || 0), {
                      locale,
                      currency: reservation.currency || "MXN",
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </p>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={busyId === reservation.$id}
                    onClick={() =>
                      updateReservation(reservation.$id, {
                        status: "confirmed",
                      })
                    }
                    className="min-h-10 rounded-lg border border-cyan-300 px-3 text-xs font-semibold text-cyan-700 transition hover:bg-cyan-50 disabled:opacity-60 dark:border-cyan-700 dark:text-cyan-300 dark:hover:bg-cyan-950/30"
                  >
                    {t("appReservationsPage.actions.markConfirmed")}
                  </button>
                  <button
                    type="button"
                    disabled={busyId === reservation.$id}
                    onClick={() =>
                      updateReservation(reservation.$id, {
                        status: "completed",
                        paymentStatus: "paid",
                      })
                    }
                    className="min-h-10 rounded-lg border border-emerald-300 px-3 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-50 disabled:opacity-60 dark:border-emerald-700 dark:text-emerald-300 dark:hover:bg-emerald-950/30"
                  >
                    {t("appReservationsPage.actions.markCompleted")}
                  </button>
                  <button
                    type="button"
                    disabled={busyId === reservation.$id}
                    onClick={() =>
                      updateReservation(reservation.$id, {
                        status: "cancelled",
                      })
                    }
                    className="min-h-10 rounded-lg border border-rose-300 px-3 text-xs font-semibold text-rose-700 transition hover:bg-rose-50 disabled:opacity-60 dark:border-rose-700 dark:text-rose-300 dark:hover:bg-rose-950/30"
                  >
                    {t("appReservationsPage.actions.cancel")}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      ) : null}
    </section>
  );
};

export default AppReservations;
