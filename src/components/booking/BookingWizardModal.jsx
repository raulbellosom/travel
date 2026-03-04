import { useState, useMemo, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import { AnimatePresence, m } from "framer-motion";
import {
  X,
  Calendar,
  Users,
  Moon,
  Clock,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Send,
  MessageCircle,
  Phone,
  Mail,
  MapPin,
  Video,
  Info,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { Spinner } from "../common";

/* ─── Constants ─────────────────────────────────────────── */

const CHANNELS = [
  { value: "IN_PLATFORM", icon: MessageCircle, recommended: true },
  { value: "WHATSAPP", icon: Phone },
  { value: "EMAIL", icon: Mail },
];

const MEETING_MODES = [
  { value: "ONSITE", icon: MapPin },
  { value: "CALL", icon: Phone },
  { value: "VIDEO", icon: Video },
];

const DURATIONS = [15, 30, 45, 60, 90];

/* ─── Helpers ───────────────────────────────────────────── */

function fmtDate(date, locale = "es-MX") {
  if (!date) return "";
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString(locale, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function fmtTime(date, locale = "es-MX") {
  if (!date) return "";
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleTimeString(locale, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

function toIso(date) {
  if (!date) return undefined;
  const d = date instanceof Date ? date : new Date(date);
  return isNaN(d.getTime()) ? undefined : d.toISOString();
}

/* ─── Component ─────────────────────────────────────────── */

/**
 * BookingWizardModal
 *
 * 2-step wizard for the manual_contact booking flow:
 *   Step 0 — Calendar: embedded calendar/slot selection (via calendarContent prop)
 *            Falls back to a static summary if calendarContent is not provided.
 *   Step 1 — Details: dynamic fields based on intent + channel/message
 *
 * On final submit calls onSubmit(payload) which maps directly to
 * PropertyDetail.handleBookingBlockSubmit (same payload shape as
 * BookingContactBlock).
 *
 * Props:
 *   isOpen                boolean
 *   onClose               () => void
 *   onSubmit              async (payload) => void
 *   loading               boolean   — from bookingBlockLoading
 *   success               boolean   — from bookingBlockSuccess
 *   conversationId        string|null
 *   property              object    — resource document
 *   isVisitRequestMode    boolean
 *   isManualBookingRequestMode  boolean
 *   selectedDateRange     { startDate: Date|null, endDate: Date|null }
 *   selectedGuestCount    number
 *   selectedTimeSlot      object|null
 *   hourRangeSlot         object|null
 *   locale                string
 *   calendarContent       ReactNode|null — replaces step 0 summary with embedded calendar
 *   calendarCanContinue   boolean        — enables "Siguiente" on step 0 when calendar is shown
 *   onCalendarContinue    () => void     — called when user clicks "Siguiente" on step 0 calendar
 */
export default function BookingWizardModal({
  isOpen = false,
  onClose,
  onSubmit,
  loading = false,
  success = false,
  conversationId = null,
  property,
  isVisitRequestMode = false,
  isManualBookingRequestMode = false,
  selectedDateRange = {},
  selectedGuestCount = 1,
  selectedTimeSlot = null,
  hourRangeSlot = null,
  locale = "es-MX",
  calendarContent = null,
  calendarCanContinue = false,
  onCalendarContinue,
}) {
  const { t } = useTranslation();

  /* ── Wizard state ── */
  const [step, setStep] = useState(0);
  const [channel, setChannel] = useState("IN_PLATFORM");
  const [message, setMessage] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [meetingDate, setMeetingDate] = useState("");
  const [meetingTime, setMeetingTime] = useState("10:00");
  const [meetingMode, setMeetingMode] = useState("ONSITE");
  const [meetingDuration, setMeetingDuration] = useState(30);

  /* Reset on open */
  useEffect(() => {
    if (!isOpen) return;
    setStep(0);
    setChannel("IN_PLATFORM");
    setMessage("");
    setContactPhone("");
    setContactEmail("");
    setMeetingDate("");
    setMeetingTime("10:00");
    setMeetingMode("ONSITE");
    setMeetingDuration(30);
  }, [isOpen]);

  /* Scroll lock */
  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen]);

  /* Escape key */
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => {
      if (e.key === "Escape" && !loading) onClose?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, loading, onClose]);

  /* ── Derived ── */
  const intent = useMemo(() => {
    if (isVisitRequestMode) return "SCHEDULE_MEETING";
    if (isManualBookingRequestMode) return "AVAILABILITY_INQUIRY";
    return "GENERAL_INQUIRY";
  }, [isVisitRequestMode, isManualBookingRequestMode]);

  const TOTAL_STEPS = 2;

  const hasDateRange = Boolean(
    selectedDateRange?.startDate && selectedDateRange?.endDate,
  );

  const nights = useMemo(() => {
    if (!hasDateRange) return 0;
    const ms =
      new Date(selectedDateRange.endDate) -
      new Date(selectedDateRange.startDate);
    return Math.ceil(ms / (86400 * 1000));
  }, [hasDateRange, selectedDateRange?.endDate, selectedDateRange?.startDate]);

  const defaultMessage = useMemo(() => {
    const title = property?.title || "";
    const parts = [`Hola, me interesa "${title}".`];

    // Date / time details
    const slot = selectedTimeSlot || hourRangeSlot;
    if (slot?.startDateTime && slot?.endDateTime) {
      const startD = fmtDate(slot.startDateTime, locale);
      const startT = fmtTime(slot.startDateTime, locale);
      const endT = fmtTime(slot.endDateTime, locale);
      parts.push(`Fecha: ${startD}, de ${startT} a ${endT}.`);
    } else if (hasDateRange) {
      const from = fmtDate(selectedDateRange.startDate, locale);
      const to = fmtDate(selectedDateRange.endDate, locale);
      if (nights > 0) {
        parts.push(
          `Fechas: ${from} – ${to} (${nights} ${nights === 1 ? "noche" : "noches"}).`,
        );
      } else {
        parts.push(`Fechas: ${from} – ${to}.`);
      }
    }

    // Guest count
    if (selectedGuestCount > 0) {
      parts.push(`Personas: ${selectedGuestCount}.`);
    }

    // Intent-specific closing
    if (intent === "SCHEDULE_MEETING") {
      parts.push("Me gustaría agendar una visita.");
    } else if (intent === "AVAILABILITY_INQUIRY") {
      parts.push("Quiero confirmar disponibilidad y condiciones.");
    } else {
      parts.push("¿Me pueden dar más información?");
    }

    return parts.join(" ");
  }, [
    intent,
    property?.title,
    selectedTimeSlot,
    hourRangeSlot,
    hasDateRange,
    selectedDateRange?.startDate,
    selectedDateRange?.endDate,
    selectedGuestCount,
    nights,
    locale,
  ]);

  const effectiveMessage = message || defaultMessage;

  const canProceed = useMemo(() => {
    if (step === 0) {
      // When calendar content is embedded, use calendarCanContinue
      if (calendarContent) return calendarCanContinue;
      return true; // fallback summary step
    }
    if (step !== 1) return true;
    if (!effectiveMessage.trim()) return false;
    if (channel === "WHATSAPP" && !contactPhone.trim()) return false;
    if (channel === "EMAIL" && !contactEmail.trim()) return false;
    if (intent === "SCHEDULE_MEETING" && !meetingDate) return false;
    return true;
  }, [
    step,
    calendarContent,
    calendarCanContinue,
    effectiveMessage,
    channel,
    contactPhone,
    contactEmail,
    intent,
    meetingDate,
  ]);

  /* ── Submit ── */
  const handleSubmit = useCallback(async () => {
    if (!canProceed || loading) return;
    const payload = {
      channel,
      intent,
      message: effectiveMessage.trim(),
      contact: {
        phone: contactPhone.trim() || undefined,
        email: contactEmail.trim() || undefined,
      },
    };
    if (intent === "AVAILABILITY_INQUIRY") {
      payload.dateRange = {
        from: toIso(selectedDateRange?.startDate),
        to: toIso(selectedDateRange?.endDate),
      };
    }
    if (intent === "SCHEDULE_MEETING") {
      const dt =
        meetingDate && meetingTime
          ? new Date(`${meetingDate}T${meetingTime}:00`)
          : null;
      payload.meetingRequest = {
        at: dt?.toISOString(),
        mode: meetingMode,
        durationMins: meetingDuration,
      };
    }
    await onSubmit?.(payload);
  }, [
    canProceed,
    loading,
    channel,
    intent,
    effectiveMessage,
    contactPhone,
    contactEmail,
    selectedDateRange,
    meetingDate,
    meetingTime,
    meetingMode,
    meetingDuration,
    onSubmit,
  ]);

  /* ── Channel label helper ── */
  const channelLabel = (v) =>
    ({
      IN_PLATFORM: t("bookingWizard.channel.inPlatform", {
        defaultValue: "Mensajería interna",
      }),
      WHATSAPP: "WhatsApp",
      EMAIL: t("bookingWizard.channel.email", {
        defaultValue: "Correo electrónico",
      }),
    })[v] || v;

  const meetingModeLabel = (v) =>
    ({
      ONSITE: t("bookingWizard.meetingMode.onsite", {
        defaultValue: "Presencial",
      }),
      CALL: t("bookingWizard.meetingMode.call", { defaultValue: "Llamada" }),
      VIDEO: t("bookingWizard.meetingMode.video", {
        defaultValue: "Videollamada",
      }),
    })[v] || v;

  /* ── Portal guard ── */
  if (typeof document === "undefined") return null;

  const content = (
    <AnimatePresence>
      {isOpen && (
        <m.div
          key="wizard-backdrop"
          className="fixed inset-0 z-[10010] bg-black/60 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.2 } }}
          onClick={!loading ? onClose : undefined}
        >
          {/* Panel: full-screen mobile → centered sm+ */}
          <m.div
            className={[
              "absolute inset-0 flex flex-col",
              "bg-white dark:bg-slate-900",
              "sm:inset-auto sm:left-1/2 sm:top-1/2",
              "sm:-translate-x-1/2 sm:-translate-y-1/2",
              calendarContent && step === 0
                ? "sm:w-[95vw] sm:max-w-4xl lg:max-w-6xl sm:max-h-[92dvh]"
                : "sm:w-full sm:max-w-lg sm:max-h-[90dvh]",
              "sm:rounded-2xl sm:shadow-2xl",
            ].join(" ")}
            initial={{ y: "100%", opacity: 0.85 }}
            animate={{
              y: 0,
              opacity: 1,
              transition: { type: "spring", damping: 28, stiffness: 260 },
            }}
            exit={{
              y: "100%",
              opacity: 0,
              transition: { duration: 0.22, ease: "easeIn" },
            }}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="wizard-title"
          >
            {/* ── Sticky header ── */}
            <div className="shrink-0 flex items-center gap-2 px-4 py-4 border-b border-slate-200 dark:border-slate-700 sm:px-6">
              {step > 0 && !success && (
                <button
                  type="button"
                  onClick={() => setStep((s) => s - 1)}
                  disabled={loading}
                  className="flex items-center justify-center w-9 h-9 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                  aria-label={t("bookingWizard.back", {
                    defaultValue: "Volver",
                  })}
                >
                  <ChevronLeft size={18} />
                </button>
              )}
              <div className="flex-1 min-w-0">
                <h2
                  id="wizard-title"
                  className="text-base font-bold text-slate-900 dark:text-white truncate"
                >
                  {success
                    ? t("bookingWizard.success.heading", {
                        defaultValue: "¡Solicitud enviada!",
                      })
                    : step === 0
                      ? calendarContent
                        ? t("bookingWizard.step0.calendarHeading", {
                            defaultValue: "Selecciona fechas y detalles",
                          })
                        : t("bookingWizard.step0.heading", {
                            defaultValue: "Tu solicitud",
                          })
                      : t("bookingWizard.step1.heading", {
                          defaultValue: "Contactar agente",
                        })}
                </h2>
                {!success && (
                  <div className="flex items-center gap-1 mt-1">
                    {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
                      <span
                        key={i}
                        className={`block h-1.5 rounded-full transition-all ${
                          i === step
                            ? "w-4 bg-cyan-500"
                            : i < step
                              ? "w-1.5 bg-cyan-300 dark:bg-cyan-700"
                              : "w-1.5 bg-slate-200 dark:bg-slate-700"
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="shrink-0 flex items-center justify-center w-9 h-9 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition disabled:opacity-50"
                aria-label={t("bookingWizard.close", {
                  defaultValue: "Cerrar",
                })}
              >
                <X size={18} />
              </button>
            </div>

            {/* ── Scrollable body ── */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden overscroll-contain min-h-0 p-4 sm:p-6 space-y-4">
              {/* ── Success ── */}
              {success ? (
                <div className="flex flex-col items-center justify-center py-10 text-center gap-4">
                  <CheckCircle2
                    size={52}
                    className="text-emerald-500 dark:text-emerald-400"
                  />
                  <p className="text-lg font-bold text-slate-900 dark:text-white">
                    {t("bookingWizard.success.heading", {
                      defaultValue: "¡Solicitud enviada!",
                    })}
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-400 max-w-xs">
                    {channel === "IN_PLATFORM"
                      ? t("bookingWizard.success.inPlatform", {
                          defaultValue:
                            "Se creó tu conversación. El agente te responderá pronto.",
                        })
                      : channel === "WHATSAPP"
                        ? t("bookingWizard.success.whatsapp", {
                            defaultValue:
                              "Solicitud registrada. El agente te contactará por WhatsApp.",
                          })
                        : t("bookingWizard.success.email", {
                            defaultValue:
                              "Solicitud registrada. El agente te contactará por correo.",
                          })}
                  </p>
                </div>
              ) : step === 0 ? (
                calendarContent ? (
                  /* ── Step 0: Embedded calendar ── */
                  <div className="min-w-0 overflow-hidden">
                    {calendarContent}
                  </div>
                ) : (
                  /* ── Step 0: Summary fallback (no calendar) ── */
                  <div className="space-y-4">
                    {/* Intent badge */}
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-cyan-100 px-3 py-1 text-xs font-semibold text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300">
                        {intent === "SCHEDULE_MEETING"
                          ? t("bookingWizard.intent.scheduleMeeting", {
                              defaultValue: "Agendar visita",
                            })
                          : intent === "AVAILABILITY_INQUIRY"
                            ? t("bookingWizard.intent.availabilityInquiry", {
                                defaultValue: "Consulta de disponibilidad",
                              })
                            : t("bookingWizard.intent.generalInquiry", {
                                defaultValue: "Consulta general",
                              })}
                      </span>
                    </div>

                    {/* No selection */}
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/40">
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        {t("bookingWizard.noDates", {
                          defaultValue:
                            "Sin fechas específicas. El agente te ayudará a encontrar disponibilidad.",
                        })}
                      </p>
                    </div>

                    {/* Info note */}
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                      {t("bookingWizard.step0.note", {
                        defaultValue:
                          "El agente revisará tu solicitud y te responderá a la brevedad. Puedes ajustar tu mensaje en el siguiente paso.",
                      })}
                    </p>
                  </div>
                )
              ) : (
                /* ── Step 1: Details form ── */
                <div className="space-y-5">
                  {/* Meeting fields (SCHEDULE_MEETING only) */}
                  {intent === "SCHEDULE_MEETING" && (
                    <div className="space-y-4 rounded-xl border border-blue-100 bg-blue-50 p-4 dark:border-blue-900/40 dark:bg-blue-950/20">
                      <p className="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                        {t("bookingWizard.meetingSection.title", {
                          defaultValue: "Datos de la visita",
                        })}
                      </p>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div>
                          <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
                            {t("bookingWizard.meetingSection.date", {
                              defaultValue: "Fecha preferida",
                            })}
                          </label>
                          <input
                            type="date"
                            value={meetingDate}
                            onChange={(e) => setMeetingDate(e.target.value)}
                            min={new Date().toISOString().split("T")[0]}
                            className="w-full min-h-10 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 dark:border-slate-600 dark:bg-slate-900"
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
                            {t("bookingWizard.meetingSection.time", {
                              defaultValue: "Hora",
                            })}
                          </label>
                          <input
                            type="time"
                            value={meetingTime}
                            onChange={(e) => setMeetingTime(e.target.value)}
                            className="w-full min-h-10 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 dark:border-slate-600 dark:bg-slate-900"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="mb-1.5 block text-xs font-medium text-slate-600 dark:text-slate-400">
                          {t("bookingWizard.meetingSection.mode", {
                            defaultValue: "Modalidad",
                          })}
                        </label>
                        <div className="flex gap-2">
                          {MEETING_MODES.map((mm) => {
                            const Icon = mm.icon;
                            return (
                              <button
                                key={mm.value}
                                type="button"
                                onClick={() => setMeetingMode(mm.value)}
                                className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition ${
                                  meetingMode === mm.value
                                    ? "border-blue-500 bg-blue-100 text-blue-700 dark:border-blue-400 dark:bg-blue-900/40 dark:text-blue-300"
                                    : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400"
                                }`}
                              >
                                <Icon size={13} />
                                {meetingModeLabel(mm.value)}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
                          {t("bookingWizard.meetingSection.duration", {
                            defaultValue: "Duración (min)",
                          })}
                        </label>
                        <select
                          value={meetingDuration}
                          onChange={(e) =>
                            setMeetingDuration(Number(e.target.value))
                          }
                          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none dark:border-slate-600 dark:bg-slate-900"
                        >
                          {DURATIONS.map((d) => (
                            <option key={d} value={d}>
                              {d} min
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}

                  {/* Channel selector */}
                  <div>
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      {t("bookingWizard.channelLabel", {
                        defaultValue: "Canal de contacto preferido",
                      })}
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {CHANNELS.map((ch) => {
                        const Icon = ch.icon;
                        const isActive = channel === ch.value;
                        return (
                          <button
                            key={ch.value}
                            type="button"
                            onClick={() => setChannel(ch.value)}
                            className={`relative flex flex-col items-center gap-1.5 rounded-xl border-2 px-2 py-3 text-xs font-medium transition ${
                              isActive
                                ? "border-cyan-500 bg-cyan-50 text-cyan-700 dark:border-cyan-400 dark:bg-cyan-950/40 dark:text-cyan-300"
                                : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400"
                            }`}
                          >
                            <Icon size={17} />
                            <span className="text-center leading-tight">
                              {channelLabel(ch.value)}
                            </span>
                            {ch.recommended && (
                              <span className="absolute -top-1.5 right-1 rounded-full bg-cyan-600 px-1.5 py-0.5 text-[9px] font-bold text-white">
                                {t("bookingWizard.recommended", {
                                  defaultValue: "Rec.",
                                })}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Conditional contact fields */}
                  {channel === "WHATSAPP" && (
                    <div>
                      <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
                        {t("bookingWizard.phone", {
                          defaultValue: "Número de WhatsApp *",
                        })}
                      </label>
                      <input
                        type="tel"
                        value={contactPhone}
                        onChange={(e) => setContactPhone(e.target.value)}
                        placeholder="+52 55 1234 5678"
                        className="w-full min-h-10 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 dark:border-slate-700 dark:bg-slate-900"
                      />
                    </div>
                  )}
                  {channel === "EMAIL" && (
                    <div>
                      <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
                        {t("bookingWizard.email", {
                          defaultValue: "Correo electrónico *",
                        })}
                      </label>
                      <input
                        type="email"
                        value={contactEmail}
                        onChange={(e) => setContactEmail(e.target.value)}
                        placeholder="tucorreo@ejemplo.com"
                        className="w-full min-h-10 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 dark:border-slate-700 dark:bg-slate-900"
                      />
                    </div>
                  )}

                  {/* Message */}
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-400">
                      {t("bookingWizard.messageLabel", {
                        defaultValue: "Tu mensaje",
                      })}
                    </label>
                    <textarea
                      rows={4}
                      value={message || defaultMessage}
                      onChange={(e) => setMessage(e.target.value)}
                      disabled={loading}
                      maxLength={2000}
                      className="w-full resize-y rounded-xl border border-slate-300 bg-white p-3 text-sm text-slate-800 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                    />
                    {channel !== "IN_PLATFORM" && (
                      <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                        {t("bookingWizard.externalChannelNotice", {
                          defaultValue:
                            "Se creará también una conversación interna para seguimiento.",
                        })}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* ── Sticky footer ── */}
            {success ? (
              <div className="shrink-0 flex flex-col gap-2 px-4 py-4 border-t border-slate-200 dark:border-slate-700 sm:px-6 sm:rounded-b-2xl">
                {conversationId && (
                  <Link
                    to={`/mis-conversaciones?focus=${conversationId}`}
                    className="flex w-full min-h-12 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 text-sm font-bold text-white transition hover:bg-emerald-500"
                    onClick={onClose}
                  >
                    <MessageCircle size={16} />
                    {t("bookingWizard.success.viewConversation", {
                      defaultValue: "Ver conversación",
                    })}
                  </Link>
                )}
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full min-h-11 rounded-xl border border-slate-300 dark:border-slate-600 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                >
                  {t("bookingWizard.success.close", { defaultValue: "Cerrar" })}
                </button>
              </div>
            ) : (
              <div className="shrink-0 flex gap-3 px-4 py-4 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 sm:px-6 sm:rounded-b-2xl">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={loading}
                  className="flex-1 min-h-12 rounded-xl border border-slate-300 dark:border-slate-600 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition disabled:opacity-50"
                >
                  {t("bookingWizard.cancel", { defaultValue: "Cancelar" })}
                </button>
                {step < TOTAL_STEPS - 1 ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (step === 0 && calendarContent && onCalendarContinue) {
                        onCalendarContinue();
                      }
                      setStep((s) => s + 1);
                    }}
                    disabled={!canProceed}
                    className="flex-[2] min-h-12 inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-600 px-5 text-sm font-bold text-white transition hover:bg-cyan-500 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {t("bookingWizard.next", { defaultValue: "Siguiente" })}
                    <ChevronRight size={16} />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={!canProceed || loading}
                    className="flex-[2] min-h-12 inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-600 px-5 text-sm font-bold text-white transition hover:bg-cyan-500 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {loading ? <Spinner size="xs" /> : <Send size={16} />}
                    {t("bookingWizard.submit", {
                      defaultValue: "Enviar solicitud",
                    })}
                  </button>
                )}
              </div>
            )}
          </m.div>
        </m.div>
      )}
    </AnimatePresence>
  );

  return createPortal(content, document.body);
}
