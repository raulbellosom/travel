/**
 * ReservationForm – create / edit a reservation.
 *
 * Redesigned layout:
 *   - Full-width within the available layout space
 *   - Desktop: 2-column grid (form left, summary panel right)
 *   - Mobile: single column with section cards
 *   - Sticky footer with submit button on mobile
 *   - Section cards with clear titles and professional spacing
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import dayjs from "dayjs";
import {
  AlertCircle,
  CalendarDays,
  CreditCard,
  Loader2,
  User,
  Users,
  FileText,
  Hash,
  Building2,
  Search,
  ChevronDown,
} from "lucide-react";
import { Select } from "../../../components/common";
import DateRangePicker from "./DateRangePicker";
import { ReservationStatusBadge } from "./ReservationStatusBadge";
import { formatMoney, calcNights } from "../utils";
import {
  RESERVATION_STATUSES,
  PAYMENT_STATUSES,
  CURRENCIES,
} from "../constants";

// ── Shared field wrapper ─────────────────────────────────────────────────────
const Field = ({
  label,
  required,
  children,
  error,
  hint,
  colSpan = "",
  name = "",
}) => (
  <div className={`grid gap-1 ${colSpan}`}>
    <label
      htmlFor={name || undefined}
      className="block text-sm font-medium text-slate-700 dark:text-slate-300"
    >
      {label}
      {required && <span className="ml-0.5 text-rose-500">*</span>}
    </label>
    {children}
    {error && (
      <p
        className="flex items-center gap-1 text-xs text-rose-600 dark:text-rose-400"
        role="alert"
      >
        <AlertCircle size={11} /> {error}
      </p>
    )}
    {hint && !error && <p className="text-xs text-slate-400">{hint}</p>}
  </div>
);

// ── Shared input classes ─────────────────────────────────────────────────────
const inputCls = (hasError = false) =>
  `min-h-11 w-full rounded-lg border px-3 py-2 text-sm outline-none transition
  ${
    hasError
      ? "border-rose-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20"
      : "border-slate-300 dark:border-slate-600 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
  }
  bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100`;

// ── Section card wrapper ────────────────────────────────────────────────────
const Section = ({ icon: Icon, title, children }) => (
  <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
    <div className="mb-4 flex items-center gap-2.5">
      {Icon && <Icon size={16} className="text-cyan-600 dark:text-cyan-400" />}
      <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-700 dark:text-slate-300">
        {title}
      </h3>
    </div>
    {children}
  </section>
);

// ── Summary panel (desktop sidebar) ─────────────────────────────────────────
const SummaryPanel = ({ form, resources, t }) => {
  const resource = resources.find((r) => r.$id === form.resourceId);
  const nights = calcNights(form.checkInDate, form.checkOutDate);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Resumen
        </h3>
        <dl className="space-y-3 text-sm">
          {resource && (
            <div>
              <dt className="text-xs text-slate-400">Recurso</dt>
              <dd className="font-medium text-slate-900 dark:text-slate-100">
                {resource.title}
              </dd>
            </div>
          )}
          {form.guestName && (
            <div>
              <dt className="text-xs text-slate-400">Huésped</dt>
              <dd className="font-medium text-slate-900 dark:text-slate-100">
                {form.guestName}
              </dd>
            </div>
          )}
          {Number(form.guestCount) > 0 && (
            <div>
              <dt className="text-xs text-slate-400">Huéspedes</dt>
              <dd className="font-medium text-slate-900 dark:text-slate-100">
                {form.guestCount}
              </dd>
            </div>
          )}
          {form.checkInDate && form.checkOutDate && (
            <div>
              <dt className="text-xs text-slate-400">Fechas</dt>
              <dd className="font-medium text-slate-900 dark:text-slate-100">
                {dayjs(form.checkInDate).format("DD/MM/YYYY")} →{" "}
                {dayjs(form.checkOutDate).format("DD/MM/YYYY")}
                {nights > 0 && (
                  <span className="ml-2 text-xs text-slate-500">
                    ({nights} noches)
                  </span>
                )}
              </dd>
            </div>
          )}
          {form.totalAmount && (
            <div>
              <dt className="text-xs text-slate-400">Total</dt>
              <dd className="text-lg font-bold text-slate-900 dark:text-slate-100">
                {formatMoney(form.totalAmount, form.currency || "MXN")}
              </dd>
            </div>
          )}
          <div className="flex gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <ReservationStatusBadge status={form.status} type="reservation" />
            <ReservationStatusBadge
              status={form.paymentStatus}
              type="payment"
            />
          </div>
        </dl>
      </div>

      {/* Warnings / Tips */}
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/50 dark:bg-amber-950/30">
        <p className="text-xs font-semibold text-amber-700 dark:text-amber-300">
          Nota
        </p>
        <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
          Las reservas manuales no envían notificaciones automáticas al huésped.
          Puedes compartir el voucher después de crear la reserva.
        </p>
      </div>
    </div>
  );
};

// ── Client combobox for root guest reassignment ─────────────────────────────
const ClientCombobox = ({ clients, value, onChange }) => {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);

  // Close on click outside
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const filtered = useMemo(() => {
    if (!search.trim()) return clients;
    const q = search.toLowerCase();
    return clients.filter((c) => {
      const full =
        `${c.firstName || ""} ${c.lastName || ""} ${c.email || ""}`.toLowerCase();
      return full.includes(q);
    });
  }, [clients, search]);

  const selectedLabel = useMemo(() => {
    if (!value) return "";
    const match = clients.find((c) => c.email === value);
    if (!match) return value;
    return `${match.firstName || ""} ${match.lastName || ""} (${match.email})`.trim();
  }, [clients, value]);

  return (
    <div className="relative" ref={wrapperRef}>
      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
        Seleccionar cliente
      </label>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex min-h-11 w-full items-center justify-between gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-left transition
          focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20
          dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
      >
        <span
          className={
            value ? "text-slate-900 dark:text-slate-100" : "text-slate-400"
          }
        >
          {selectedLabel || "Buscar y seleccionar un cliente…"}
        </span>
        <ChevronDown
          size={14}
          className={`shrink-0 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute z-30 mt-1 w-full rounded-xl border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900">
          {/* Search input */}
          <div className="flex items-center gap-2 border-b border-slate-100 px-3 py-2 dark:border-slate-800">
            <Search size={14} className="text-slate-400" />
            <input
              type="text"
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nombre o email…"
              className="flex-1 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400 dark:text-slate-100"
            />
          </div>

          {/* Options list */}
          <ul className="max-h-56 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <li className="px-3 py-2 text-xs text-slate-400">
                Sin resultados
              </li>
            ) : (
              filtered.map((client) => {
                const fullName =
                  `${client.firstName || ""} ${client.lastName || ""}`.trim();
                const isSelected = client.email === value;
                return (
                  <li key={client.$id}>
                    <button
                      type="button"
                      onClick={() => {
                        onChange(client);
                        setOpen(false);
                        setSearch("");
                      }}
                      className={`flex w-full flex-col gap-0.5 px-3 py-2 text-left text-sm transition
                        [@media(hover:hover)]:hover:bg-slate-50 dark:[@media(hover:hover)]:hover:bg-slate-800
                        ${isSelected ? "bg-cyan-50 dark:bg-cyan-950/30" : ""}`}
                    >
                      <span className="font-medium text-slate-900 dark:text-slate-100">
                        {fullName || "Sin nombre"}
                      </span>
                      <span className="text-xs text-slate-400">
                        {client.email || "—"}
                        {client.phone ? ` · ${client.phone}` : ""}
                      </span>
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

// ── Main component ───────────────────────────────────────────────────────────
const ReservationForm = ({
  form,
  errors = {},
  resources = [],
  clients = [],
  loading = false,
  submitting = false,
  mode = "create",
  isRoot = false,
  onChange,
  onSubmit,
}) => {
  const { t } = useTranslation();

  const resourceOptions = useMemo(
    () => [
      { value: "", label: "Selecciona un recurso" },
      ...resources.map((r) => ({ value: r.$id, label: r.title || r.$id })),
    ],
    [resources],
  );

  const scheduleTypeOptions = [
    { value: "date_range", label: "Rango de fechas" },
    { value: "time_slot", label: "Horario (hora/turno)" },
  ];

  const currencyOptions = CURRENCIES.map((c) => ({ value: c, label: c }));

  const statusOptions = RESERVATION_STATUSES.map((s) => ({
    value: s,
    label: t(`reservationStatus.${s}`, { defaultValue: s }),
  }));

  const paymentOptions = PAYMENT_STATUSES.map((s) => ({
    value: s,
    label: t(`paymentStatus.${s}`, { defaultValue: s }),
  }));

  const isEdit = mode === "edit";
  const guestReadOnly = isEdit;
  const submitLabel = submitting
    ? isEdit
      ? "Guardando…"
      : "Creando…"
    : isEdit
      ? "Guardar cambios"
      : "Crear reserva";

  return (
    <form onSubmit={onSubmit} noValidate>
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* ── Left column: form sections ─── */}
        <div className="space-y-5">
          {/* 1. Resource */}
          <Section icon={Building2} title="Recurso">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Recurso"
                required
                error={errors.resourceId}
                colSpan="sm:col-span-2"
              >
                <Select
                  value={form.resourceId}
                  onChange={(v) => onChange("resourceId", v)}
                  options={resourceOptions}
                  size="md"
                  disabled={loading}
                />
              </Field>
              <Field label="Tipo de agenda" error={errors.scheduleType}>
                <Select
                  value={form.scheduleType}
                  onChange={(v) => onChange("scheduleType", v)}
                  options={scheduleTypeOptions}
                  size="md"
                  disabled={loading}
                />
              </Field>
              <Field label="Moneda" error={errors.currency}>
                <Select
                  value={form.currency}
                  onChange={(v) => onChange("currency", v)}
                  options={currencyOptions}
                  size="md"
                  disabled={loading}
                />
              </Field>
            </div>
          </Section>

          {/* 2. Dates */}
          <Section icon={CalendarDays} title="Fechas">
            {form.scheduleType === "date_range" ? (
              <Field
                label="Rango de fechas"
                required
                error={errors.checkInDate || errors.checkOutDate}
              >
                <DateRangePicker
                  startDate={form.checkInDate}
                  endDate={form.checkOutDate}
                  onChange={(from, to) => {
                    onChange("checkInDate", from);
                    onChange("checkOutDate", to);
                  }}
                  minDate={new Date().toISOString().slice(0, 10)}
                  disabled={loading}
                />
              </Field>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  label="Inicio"
                  required
                  error={errors.startDateTime}
                  name="startDateTime"
                >
                  <input
                    id="startDateTime"
                    type="datetime-local"
                    value={form.startDateTime}
                    onChange={(e) => onChange("startDateTime", e.target.value)}
                    disabled={loading}
                    className={inputCls(!!errors.startDateTime)}
                  />
                </Field>
                <Field
                  label="Fin"
                  required
                  error={errors.endDateTime}
                  name="endDateTime"
                >
                  <input
                    id="endDateTime"
                    type="datetime-local"
                    value={form.endDateTime}
                    onChange={(e) => onChange("endDateTime", e.target.value)}
                    disabled={loading}
                    className={inputCls(!!errors.endDateTime)}
                  />
                </Field>
              </div>
            )}
          </Section>

          {/* 3. Guest */}
          <Section icon={User} title="Huésped">
            {isEdit && isRoot && clients.length > 0 ? (
              /* ── Root combobox: select or reassign guest from client list ── */
              <div className="space-y-4">
                <ClientCombobox
                  clients={clients}
                  value={form.guestEmail}
                  onChange={(client) => {
                    const fullName =
                      `${client.firstName || ""} ${client.lastName || ""}`.trim();
                    onChange("guestName", fullName);
                    onChange("guestEmail", client.email || "");
                    onChange("guestPhone", client.phone || "");
                  }}
                />
                {/* Show current selection as plain text summary */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="grid gap-1">
                    <span className="text-xs font-medium text-slate-400 dark:text-slate-500">
                      Nombre
                    </span>
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                      {form.guestName || "—"}
                    </p>
                  </div>
                  <div className="grid gap-1">
                    <span className="text-xs font-medium text-slate-400 dark:text-slate-500">
                      Email
                    </span>
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                      {form.guestEmail || "—"}
                    </p>
                  </div>
                  <div className="grid gap-1">
                    <span className="text-xs font-medium text-slate-400 dark:text-slate-500">
                      Teléfono
                    </span>
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                      {form.guestPhone || "—"}
                    </p>
                  </div>
                  <Field
                    label="N° de huéspedes"
                    error={errors.guestCount}
                    name="guestCount"
                  >
                    <input
                      id="guestCount"
                      type="number"
                      min={1}
                      inputMode="numeric"
                      value={form.guestCount}
                      onChange={(e) => onChange("guestCount", e.target.value)}
                      disabled={loading}
                      className={inputCls(!!errors.guestCount)}
                    />
                  </Field>
                </div>
              </div>
            ) : guestReadOnly ? (
              /* ── Read-only display in edit mode (non-root) ── */
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-1">
                  <span className="text-xs font-medium text-slate-400 dark:text-slate-500">
                    Nombre
                  </span>
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                    {form.guestName || "—"}
                  </p>
                </div>
                <div className="grid gap-1">
                  <span className="text-xs font-medium text-slate-400 dark:text-slate-500">
                    Email
                  </span>
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                    {form.guestEmail || "—"}
                  </p>
                </div>
                <div className="grid gap-1">
                  <span className="text-xs font-medium text-slate-400 dark:text-slate-500">
                    Teléfono
                  </span>
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                    {form.guestPhone || "—"}
                  </p>
                </div>
                <Field
                  label="N° de huéspedes"
                  error={errors.guestCount}
                  name="guestCount"
                >
                  <input
                    id="guestCount"
                    type="number"
                    min={1}
                    inputMode="numeric"
                    value={form.guestCount}
                    onChange={(e) => onChange("guestCount", e.target.value)}
                    disabled={loading}
                    className={inputCls(!!errors.guestCount)}
                  />
                </Field>
              </div>
            ) : (
              /* ── Editable fields (create mode or root) ── */
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Nombre" error={errors.guestName} name="guestName">
                  <input
                    id="guestName"
                    type="text"
                    autoComplete="name"
                    value={form.guestName}
                    onChange={(e) => onChange("guestName", e.target.value)}
                    disabled={loading}
                    className={inputCls(!!errors.guestName)}
                  />
                </Field>
                <Field
                  label="Email"
                  error={errors.guestEmail}
                  name="guestEmail"
                >
                  <input
                    id="guestEmail"
                    type="email"
                    autoComplete="email"
                    inputMode="email"
                    value={form.guestEmail}
                    onChange={(e) => onChange("guestEmail", e.target.value)}
                    disabled={loading}
                    className={inputCls(!!errors.guestEmail)}
                  />
                </Field>
                <Field
                  label="Teléfono"
                  error={errors.guestPhone}
                  name="guestPhone"
                >
                  <input
                    id="guestPhone"
                    type="tel"
                    autoComplete="tel"
                    inputMode="tel"
                    value={form.guestPhone}
                    onChange={(e) => onChange("guestPhone", e.target.value)}
                    disabled={loading}
                    className={inputCls(!!errors.guestPhone)}
                  />
                </Field>
                <Field
                  label="N° de huéspedes"
                  error={errors.guestCount}
                  name="guestCount"
                >
                  <input
                    id="guestCount"
                    type="number"
                    min={1}
                    inputMode="numeric"
                    value={form.guestCount}
                    onChange={(e) => onChange("guestCount", e.target.value)}
                    disabled={loading}
                    className={inputCls(!!errors.guestCount)}
                  />
                </Field>
              </div>
            )}
          </Section>

          {/* 4. Amounts */}
          <Section icon={CreditCard} title="Montos">
            <div className="grid items-start gap-4 sm:grid-cols-2">
              <Field
                label="Monto base"
                error={errors.baseAmount}
                name="baseAmount"
              >
                <input
                  id="baseAmount"
                  type="number"
                  min={0}
                  step="0.01"
                  inputMode="decimal"
                  value={form.baseAmount}
                  onChange={(e) => onChange("baseAmount", e.target.value)}
                  disabled={loading}
                  className={inputCls(!!errors.baseAmount)}
                />
              </Field>
              <Field
                label="Monto total"
                error={errors.totalAmount}
                hint="Incluye impuestos, extras, etc."
                name="totalAmount"
              >
                <input
                  id="totalAmount"
                  type="number"
                  min={0}
                  step="0.01"
                  inputMode="decimal"
                  value={form.totalAmount}
                  onChange={(e) => onChange("totalAmount", e.target.value)}
                  disabled={loading}
                  className={inputCls(!!errors.totalAmount)}
                />
              </Field>
            </div>
          </Section>

          {/* 5. Status */}
          <Section icon={Hash} title="Estado">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Estado de reserva" error={errors.status}>
                <Select
                  value={form.status}
                  onChange={(v) => onChange("status", v)}
                  options={statusOptions}
                  size="md"
                  disabled={loading}
                />
              </Field>
              <Field label="Estado de pago" error={errors.paymentStatus}>
                <Select
                  value={form.paymentStatus}
                  onChange={(v) => onChange("paymentStatus", v)}
                  options={paymentOptions}
                  size="md"
                  disabled={loading}
                />
              </Field>
            </div>
          </Section>

          {/* 6. Extras */}
          <Section icon={FileText} title="Extras">
            <div className="grid gap-4">
              <Field
                label="Referencia externa"
                error={errors.externalRef}
                hint="Folio de otra plataforma (Airbnb, Booking, etc.)"
                name="externalRef"
              >
                <input
                  id="externalRef"
                  type="text"
                  value={form.externalRef}
                  onChange={(e) => onChange("externalRef", e.target.value)}
                  disabled={loading}
                  className={inputCls(!!errors.externalRef)}
                />
              </Field>
              <Field
                label="Notas internas / solicitudes"
                error={errors.specialRequests}
                name="specialRequests"
              >
                <textarea
                  id="specialRequests"
                  rows={3}
                  value={form.specialRequests}
                  onChange={(e) => onChange("specialRequests", e.target.value)}
                  disabled={loading}
                  className={`${inputCls(!!errors.specialRequests)} resize-y`}
                />
              </Field>
            </div>
          </Section>
        </div>

        {/* ── Right column: summary panel (desktop only) ─── */}
        <div className="hidden lg:block">
          <div className="sticky top-[5.5rem]">
            <SummaryPanel form={form} resources={resources} t={t} />
          </div>
        </div>
      </div>

      {/* ── Sticky submit footer ─── */}
      <div className="sticky bottom-0 z-10 mt-6 -mx-1 px-1 pb-4 pt-4">
        <button
          type="submit"
          disabled={submitting || loading}
          className="flex w-full min-h-12 items-center justify-center gap-2 rounded-xl bg-cyan-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-cyan-600/30 transition
            [@media(hover:hover)]:hover:bg-cyan-500 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60
            sm:w-auto sm:ml-auto sm:min-h-11"
        >
          {submitting && <Loader2 size={16} className="animate-spin" />}
          {submitLabel}
        </button>
      </div>
    </form>
  );
};

export default ReservationForm;
