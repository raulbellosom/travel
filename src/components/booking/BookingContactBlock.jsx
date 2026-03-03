import { useCallback, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Calendar,
  Clock,
  Globe,
  Mail,
  MessageCircle,
  Phone,
  Send,
  Video,
  MapPin,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Spinner } from "../common";

/* ─── Constants ────────────────────────────────────────── */

const CONTACT_CHANNELS = [
  { value: "IN_PLATFORM", icon: MessageCircle, recommended: true },
  { value: "WHATSAPP", icon: Phone, recommended: false },
  { value: "EMAIL", icon: Mail, recommended: false },
];

const MEETING_MODES = [
  { value: "ONSITE", icon: MapPin },
  { value: "CALL", icon: Phone },
  { value: "VIDEO", icon: Video },
];

/* ─── Component ────────────────────────────────────────── */

/**
 * Inline booking/contact block for resource detail pages.
 * Replaces the previous chat modal + window.prompt approach.
 *
 * Props:
 * - property: resource document
 * - isVisitRequestMode: boolean (long-term / sale)
 * - isManualBookingRequestMode: boolean (short-term manual_contact)
 * - isAuthenticated: boolean
 * - canContact: boolean (authenticated + client + verified + not owner)
 * - loginPath: string (redirect to login)
 * - registerPath: string (redirect to register)
 * - selectedDateRange: { startDate, endDate }
 * - selectedGuestCount: number
 * - onSubmit: async (payload) => void
 * - loading: boolean
 * - success: boolean (show success state)
 * - conversationId: string | null (after successful lead creation)
 * - locale: string
 */
export default function BookingContactBlock({
  property,
  isVisitRequestMode = false,
  isManualBookingRequestMode = false,
  isAuthenticated = false,
  canContact = false,
  loginPath = "/login",
  registerPath = "/register",
  selectedDateRange = {},
  selectedGuestCount = 1,
  onSubmit,
  loading = false,
  success = false,
  conversationId = null,
  locale = "es-MX",
}) {
  const { t } = useTranslation();

  // ── State ──
  const [channel, setChannel] = useState("IN_PLATFORM");
  const [message, setMessage] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [expanded, setExpanded] = useState(true);

  // Meeting request state (for long-term / visit)
  const [meetingDate, setMeetingDate] = useState("");
  const [meetingTime, setMeetingTime] = useState("10:00");
  const [meetingMode, setMeetingMode] = useState("ONSITE");
  const [meetingDuration, setMeetingDuration] = useState(30);

  // Availability inquiry date range (for short-term manual_contact)
  const [inquiryDateFrom, setInquiryDateFrom] = useState(
    selectedDateRange?.startDate
      ? formatDateInput(selectedDateRange.startDate)
      : "",
  );
  const [inquiryDateTo, setInquiryDateTo] = useState(
    selectedDateRange?.endDate
      ? formatDateInput(selectedDateRange.endDate)
      : "",
  );

  // ── Derived ──
  const intent = useMemo(() => {
    if (isVisitRequestMode) return "SCHEDULE_MEETING";
    if (isManualBookingRequestMode) return "AVAILABILITY_INQUIRY";
    return "GENERAL_INQUIRY";
  }, [isVisitRequestMode, isManualBookingRequestMode]);

  const channelLabel = useCallback(
    (value) => {
      const labels = {
        IN_PLATFORM: t("bookingBlock.channel.inPlatform", {
          defaultValue: "Mensajería interna",
        }),
        WHATSAPP: "WhatsApp",
        EMAIL: t("bookingBlock.channel.email", {
          defaultValue: "Correo electrónico",
        }),
      };
      return labels[value] || value;
    },
    [t],
  );

  const meetingModeLabel = useCallback(
    (value) => {
      const labels = {
        ONSITE: t("bookingBlock.meetingMode.onsite", {
          defaultValue: "Presencial",
        }),
        CALL: t("bookingBlock.meetingMode.call", {
          defaultValue: "Llamada",
        }),
        VIDEO: t("bookingBlock.meetingMode.video", {
          defaultValue: "Videollamada",
        }),
      };
      return labels[value] || value;
    },
    [t],
  );

  const intentLabel = useMemo(() => {
    const labels = {
      GENERAL_INQUIRY: t("bookingBlock.intent.generalInquiry", {
        defaultValue: "Consulta general",
      }),
      SCHEDULE_MEETING: t("bookingBlock.intent.scheduleMeeting", {
        defaultValue: "Agendar visita",
      }),
      AVAILABILITY_INQUIRY: t("bookingBlock.intent.availabilityInquiry", {
        defaultValue: "Consulta de disponibilidad",
      }),
    };
    return labels[intent] || intent;
  }, [intent, t]);

  const defaultMessage = useMemo(() => {
    const title = property?.title || "";
    if (intent === "SCHEDULE_MEETING") {
      return t("bookingBlock.defaultMessage.scheduleMeeting", {
        defaultValue: `Hola, me interesa "${title}". Me gustaría agendar una visita.`,
      });
    }
    if (intent === "AVAILABILITY_INQUIRY") {
      return t("bookingBlock.defaultMessage.availabilityInquiry", {
        defaultValue: `Hola, me interesa "${title}". Quiero confirmar disponibilidad y condiciones.`,
      });
    }
    return t("bookingBlock.defaultMessage.generalInquiry", {
      defaultValue: `Hola, me interesa "${title}". Quiero más información.`,
    });
  }, [intent, property?.title, t]);

  // Pre-fill message on first render if empty
  const effectiveMessage = message || defaultMessage;

  // ── Validation ──
  const canSubmit = useMemo(() => {
    if (!canContact || loading || success) return false;
    if (!effectiveMessage.trim()) return false;
    if (channel === "WHATSAPP" && !contactPhone.trim()) return false;
    if (channel === "EMAIL" && !contactEmail.trim()) return false;
    if (intent === "SCHEDULE_MEETING" && !meetingDate) return false;
    if (
      intent === "AVAILABILITY_INQUIRY" &&
      (!inquiryDateFrom || !inquiryDateTo)
    )
      return false;
    return true;
  }, [
    canContact,
    loading,
    success,
    effectiveMessage,
    channel,
    contactPhone,
    contactEmail,
    intent,
    meetingDate,
    inquiryDateFrom,
    inquiryDateTo,
  ]);

  // ── Submit ──
  const handleSubmit = useCallback(async () => {
    if (!canSubmit || !onSubmit) return;

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
        from: inquiryDateFrom
          ? new Date(inquiryDateFrom).toISOString()
          : undefined,
        to: inquiryDateTo ? new Date(inquiryDateTo).toISOString() : undefined,
      };
    }

    if (intent === "SCHEDULE_MEETING") {
      const meetingDateTime =
        meetingDate && meetingTime
          ? new Date(`${meetingDate}T${meetingTime}:00`)
          : null;
      payload.meetingRequest = {
        at: meetingDateTime ? meetingDateTime.toISOString() : undefined,
        mode: meetingMode,
        durationMins: meetingDuration,
      };
    }

    await onSubmit(payload);
  }, [
    canSubmit,
    onSubmit,
    channel,
    intent,
    effectiveMessage,
    contactPhone,
    contactEmail,
    inquiryDateFrom,
    inquiryDateTo,
    meetingDate,
    meetingTime,
    meetingMode,
    meetingDuration,
  ]);

  // ── Success state ──
  if (success) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 dark:border-emerald-800/50 dark:bg-emerald-950/30">
        <div className="flex items-center gap-3">
          <CheckCircle2
            size={24}
            className="shrink-0 text-emerald-600 dark:text-emerald-400"
          />
          <div>
            <p className="font-semibold text-emerald-800 dark:text-emerald-200">
              {t("bookingBlock.success.title", {
                defaultValue: "¡Mensaje enviado!",
              })}
            </p>
            <p className="mt-1 text-sm text-emerald-700 dark:text-emerald-300">
              {channel === "IN_PLATFORM"
                ? t("bookingBlock.success.inPlatform", {
                    defaultValue:
                      "Se creó tu conversación. El agente te responderá pronto.",
                  })
                : channel === "WHATSAPP"
                  ? t("bookingBlock.success.whatsapp", {
                      defaultValue:
                        "Tu solicitud fue registrada. El agente te contactará por WhatsApp. También puedes dar seguimiento desde la plataforma.",
                    })
                  : t("bookingBlock.success.email", {
                      defaultValue:
                        "Tu solicitud fue registrada. El agente te contactará por correo. También puedes dar seguimiento desde la plataforma.",
                    })}
            </p>
          </div>
        </div>
        {conversationId && (
          <Link
            to={`/mis-conversaciones?focus=${conversationId}`}
            className="mt-3 inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500"
          >
            <MessageCircle size={14} />
            {t("bookingBlock.success.openConversation", {
              defaultValue: "Ver conversación",
            })}
          </Link>
        )}
      </div>
    );
  }

  // ── Unauthenticated state ──
  if (!isAuthenticated) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800/60">
        <div className="text-center">
          <Globe
            size={32}
            className="mx-auto mb-3 text-cyan-500 dark:text-cyan-400"
          />
          <p className="font-semibold text-slate-900 dark:text-white">
            {t("bookingBlock.auth.title", {
              defaultValue: "¿Te interesa este recurso?",
            })}
          </p>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            {t("bookingBlock.auth.description", {
              defaultValue:
                "Inicia sesión o regístrate para enviar un mensaje al agente.",
            })}
          </p>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-center">
            <Link
              to={loginPath}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-cyan-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-cyan-500"
            >
              <MessageCircle size={16} />
              {t("bookingBlock.auth.login", {
                defaultValue: "Iniciar sesión",
              })}
            </Link>
            <Link
              to={registerPath}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              {t("bookingBlock.auth.register", {
                defaultValue: "Registrarse",
              })}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ── Main form ──
  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800/60">
      {/* Header */}
      <button
        type="button"
        onClick={() => setExpanded((prev) => !prev)}
        className="flex w-full items-center justify-between px-5 py-4"
      >
        <div className="flex items-center gap-2">
          <MessageCircle
            size={20}
            className="text-cyan-600 dark:text-cyan-400"
          />
          <span className="text-base font-bold text-slate-900 dark:text-white">
            {t("bookingBlock.title", {
              defaultValue: "Contactar agente",
            })}
          </span>
          <span className="ml-2 rounded-full bg-cyan-100 px-2 py-0.5 text-xs font-medium text-cyan-700 dark:bg-cyan-900/50 dark:text-cyan-300">
            {intentLabel}
          </span>
        </div>
        {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
      </button>

      {expanded && (
        <div className="space-y-4 border-t border-slate-100 px-5 pb-5 pt-4 dark:border-slate-700">
          {/* ── Channel selector ── */}
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {t("bookingBlock.channelLabel", {
                defaultValue: "Canal de contacto preferido",
              })}
            </label>
            <div className="grid grid-cols-3 gap-2">
              {CONTACT_CHANNELS.map((ch) => {
                const Icon = ch.icon;
                const isActive = channel === ch.value;
                return (
                  <button
                    key={ch.value}
                    type="button"
                    onClick={() => setChannel(ch.value)}
                    className={`relative flex flex-col items-center gap-1.5 rounded-xl border-2 px-3 py-3 text-xs font-medium transition ${
                      isActive
                        ? "border-cyan-500 bg-cyan-50 text-cyan-700 dark:border-cyan-400 dark:bg-cyan-950/40 dark:text-cyan-300"
                        : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:border-slate-600"
                    }`}
                  >
                    <Icon size={18} />
                    <span>{channelLabel(ch.value)}</span>
                    {ch.recommended && (
                      <span className="absolute -top-1.5 right-1 rounded-full bg-cyan-600 px-1.5 py-0.5 text-[9px] font-bold text-white">
                        {t("bookingBlock.recommended", {
                          defaultValue: "Recomendado",
                        })}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Extra contact fields per channel ── */}
          {channel === "WHATSAPP" && (
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-400">
                {t("bookingBlock.whatsappPhone", {
                  defaultValue: "Tu número de WhatsApp",
                })}
              </label>
              <div className="flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2.5 dark:border-slate-600 dark:bg-slate-900">
                <Phone size={16} className="shrink-0 text-green-600" />
                <input
                  type="tel"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  placeholder="+52 55 1234 5678"
                  className="w-full bg-transparent text-sm outline-none"
                  maxLength={20}
                />
              </div>
            </div>
          )}

          {channel === "EMAIL" && (
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-400">
                {t("bookingBlock.emailAddress", {
                  defaultValue: "Tu correo electrónico",
                })}
              </label>
              <div className="flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2.5 dark:border-slate-600 dark:bg-slate-900">
                <Mail size={16} className="shrink-0 text-blue-600" />
                <input
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="tu@email.com"
                  className="w-full bg-transparent text-sm outline-none"
                  maxLength={120}
                />
              </div>
            </div>
          )}

          {/* ── Meeting proposal (long-term / visit) ── */}
          {intent === "SCHEDULE_MEETING" && (
            <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-800/50 dark:bg-blue-950/30">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                {t("bookingBlock.meetingSection.title", {
                  defaultValue: "Propuesta de visita",
                })}
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
                    {t("bookingBlock.meetingSection.date", {
                      defaultValue: "Fecha",
                    })}
                  </label>
                  <div className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 dark:border-slate-600 dark:bg-slate-900">
                    <Calendar size={14} className="shrink-0 text-blue-500" />
                    <input
                      type="date"
                      value={meetingDate}
                      onChange={(e) => setMeetingDate(e.target.value)}
                      min={formatDateInput(new Date())}
                      className="w-full bg-transparent text-sm outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
                    {t("bookingBlock.meetingSection.time", {
                      defaultValue: "Hora",
                    })}
                  </label>
                  <div className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 dark:border-slate-600 dark:bg-slate-900">
                    <Clock size={14} className="shrink-0 text-blue-500" />
                    <input
                      type="time"
                      value={meetingTime}
                      onChange={(e) => setMeetingTime(e.target.value)}
                      className="w-full bg-transparent text-sm outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-3">
                <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
                  {t("bookingBlock.meetingSection.mode", {
                    defaultValue: "Modalidad",
                  })}
                </label>
                <div className="flex gap-2">
                  {MEETING_MODES.map((mm) => {
                    const Icon = mm.icon;
                    const isActive = meetingMode === mm.value;
                    return (
                      <button
                        key={mm.value}
                        type="button"
                        onClick={() => setMeetingMode(mm.value)}
                        className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition ${
                          isActive
                            ? "border-blue-500 bg-blue-100 text-blue-700 dark:border-blue-400 dark:bg-blue-900/40 dark:text-blue-300"
                            : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400"
                        }`}
                      >
                        <Icon size={14} />
                        {meetingModeLabel(mm.value)}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="mt-3">
                <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
                  {t("bookingBlock.meetingSection.duration", {
                    defaultValue: "Duración (min)",
                  })}
                </label>
                <select
                  value={meetingDuration}
                  onChange={(e) => setMeetingDuration(Number(e.target.value))}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none dark:border-slate-600 dark:bg-slate-900"
                >
                  <option value={15}>15 min</option>
                  <option value={30}>30 min</option>
                  <option value={45}>45 min</option>
                  <option value={60}>60 min</option>
                  <option value={90}>90 min</option>
                </select>
              </div>
            </div>
          )}

          {/* ── Availability inquiry dates (short-term manual_contact) ── */}
          {intent === "AVAILABILITY_INQUIRY" && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-800/50 dark:bg-amber-950/30">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                {t("bookingBlock.availabilitySection.title", {
                  defaultValue: "Consulta de disponibilidad",
                })}
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
                    {t("bookingBlock.availabilitySection.from", {
                      defaultValue: "Check-in",
                    })}
                  </label>
                  <div className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 dark:border-slate-600 dark:bg-slate-900">
                    <Calendar size={14} className="shrink-0 text-amber-500" />
                    <input
                      type="date"
                      value={inquiryDateFrom}
                      onChange={(e) => setInquiryDateFrom(e.target.value)}
                      min={formatDateInput(new Date())}
                      className="w-full bg-transparent text-sm outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
                    {t("bookingBlock.availabilitySection.to", {
                      defaultValue: "Check-out",
                    })}
                  </label>
                  <div className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 dark:border-slate-600 dark:bg-slate-900">
                    <Calendar size={14} className="shrink-0 text-amber-500" />
                    <input
                      type="date"
                      value={inquiryDateTo}
                      onChange={(e) => setInquiryDateTo(e.target.value)}
                      min={inquiryDateFrom || formatDateInput(new Date())}
                      className="w-full bg-transparent text-sm outline-none"
                    />
                  </div>
                </div>
              </div>
              {selectedGuestCount > 0 && (
                <p className="mt-2 text-xs text-amber-700 dark:text-amber-300">
                  {t("bookingBlock.availabilitySection.guests", {
                    defaultValue: "Huéspedes: {{count}}",
                    count: selectedGuestCount,
                  })}
                </p>
              )}
            </div>
          )}

          {/* ── Message textarea ── */}
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-400">
              {t("bookingBlock.messageLabel", {
                defaultValue: "Tu mensaje",
              })}
            </label>
            <textarea
              className="w-full resize-y rounded-xl border border-slate-300 bg-white p-3 text-sm text-slate-800 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-cyan-400 dark:focus:ring-cyan-400"
              rows={3}
              placeholder={t("bookingBlock.messagePlaceholder", {
                defaultValue: "Escribe tu mensaje aquí...",
              })}
              value={message || defaultMessage}
              onChange={(e) => setMessage(e.target.value)}
              disabled={loading}
              maxLength={2000}
            />
          </div>

          {/* ── System notice for external channels ── */}
          {channel !== "IN_PLATFORM" && (
            <div className="rounded-lg bg-slate-100 px-3 py-2 text-xs text-slate-600 dark:bg-slate-700/50 dark:text-slate-400">
              {t("bookingBlock.externalChannelNotice", {
                defaultValue:
                  "Se creará también una conversación interna para seguimiento. El agente te contactará por el canal elegido.",
              })}
            </div>
          )}

          {/* ── Submit button ── */}
          {canContact ? (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-cyan-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-cyan-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? <Spinner size="xs" /> : <Send size={16} />}
              {loading
                ? t("bookingBlock.submitting", {
                    defaultValue: "Enviando...",
                  })
                : t("bookingBlock.submit", {
                    defaultValue: "Enviar mensaje",
                  })}
            </button>
          ) : (
            <p className="text-center text-xs text-slate-500 dark:text-slate-400">
              {t("bookingBlock.cannotContact", {
                defaultValue:
                  "Solo clientes verificados pueden contactar al agente.",
              })}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── Helpers ──────────────────────────────────────────── */

function formatDateInput(date) {
  if (!date) return "";
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().split("T")[0];
}
