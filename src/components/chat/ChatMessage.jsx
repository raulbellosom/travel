import { useMemo, useState } from "react";
import { cn } from "../../utils/cn";
import { Clock, Check, CheckCheck, AlertCircle, CalendarClock } from "lucide-react";
import { useChat } from "../../contexts/ChatContext";

const getInitials = (name) => {
  if (!name) return "?";
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
};

const parsePayload = (message) => {
  if (message?.payload && typeof message.payload === "object") {
    return message.payload;
  }

  if (typeof message?.payloadJson === "string") {
    try {
      const parsed = JSON.parse(message.payloadJson);
      return parsed && typeof parsed === "object" ? parsed : null;
    } catch {
      return null;
    }
  }

  return null;
};

const formatTimeRange = (startIso, endIso, timezone) => {
  const start = new Date(startIso);
  const end = new Date(endIso);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return "Horario no disponible";
  }

  const formatter = new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: timezone || undefined,
  });

  return `${formatter.format(start)} - ${formatter.format(end)}`;
};

const getMessageStatus = (message, isOwn) => {
  if (!isOwn) return null;

  if (message.status === "failed") return "failed";
  if (
    message.status === "sending" ||
    String(message.$id || "").startsWith("temp-")
  ) {
    return "sending";
  }
  if (message.readByRecipient) return "read";
  return "delivered";
};

const MessageStatus = ({ status }) => {
  if (!status) return null;

  switch (status) {
    case "sending":
      return (
        <Clock
          className="ml-1 inline-block h-3 w-3 animate-pulse text-cyan-200"
          aria-label="Enviando..."
        />
      );
    case "sent":
      return (
        <Check
          className="ml-1 inline-block h-3 w-3 text-white/40"
          aria-label="Enviado"
        />
      );
    case "delivered":
      return (
        <CheckCheck
          className="ml-1 inline-block h-3 w-3 text-white/40"
          aria-label="Entregado"
        />
      );
    case "read":
      return (
        <CheckCheck
          className="ml-1 inline-block h-3 w-3 text-white"
          aria-label="Visto"
        />
      );
    case "failed":
      return (
        <AlertCircle
          className="ml-1 inline-block h-3 w-3 text-red-300"
          aria-label="Error al enviar"
        />
      );
    default:
      return null;
  }
};

const getProposalStatusLabel = (status) => {
  const normalized = String(status || "pending").trim().toLowerCase();
  if (normalized === "accepted") return "Aceptada";
  if (normalized === "rejected") return "Rechazada";
  if (normalized === "reschedule_requested") return "Cambio solicitado";
  return "Pendiente";
};

const getProposalTypeLabel = (proposalType) => {
  const normalized = String(proposalType || "").trim().toLowerCase();
  if (normalized === "visit") return "Propuesta de visita";
  if (normalized === "booking_manual") return "Propuesta de disponibilidad";
  return "Propuesta";
};

const getResponseLabel = (response) => {
  const normalized = String(response || "").trim().toLowerCase();
  if (normalized === "accept") return "Acepta la propuesta";
  if (normalized === "reject") return "Rechaza la propuesta";
  if (normalized === "request_change") return "Solicita cambio";
  return "Respuesta";
};

const ChatMessage = ({
  message,
  isOwn,
  showOwnAvatar = false,
  ownAvatarUrl = "",
  ownAvatarLabel = "",
}) => {
  const { respondToProposal, canWriteMessaging, chatRole } = useChat();
  const [isResponding, setIsResponding] = useState(false);
  const messageStatus = getMessageStatus(message, isOwn);
  const kind = String(message?.kind || "text").trim().toLowerCase() || "text";
  const payload = useMemo(() => parsePayload(message), [message]);

  const time = new Date(message.$createdAt).toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });

  const proposalStatus = String(payload?.status || "pending")
    .trim()
    .toLowerCase();
  const canRespondToProposal =
    kind === "proposal" &&
    !isOwn &&
    chatRole === "client" &&
    canWriteMessaging &&
    proposalStatus === "pending";

  const handleProposalResponse = async (response) => {
    if (!canRespondToProposal || isResponding) return;

    let comment;
    if (response === "request_change") {
      comment =
        window.prompt("Indica el ajuste que necesitas", "") || undefined;
    }

    setIsResponding(true);
    try {
      await respondToProposal({
        proposalMessageId: message.$id,
        response,
        comment,
      });
    } catch (err) {
      const text = String(err?.message || "No se pudo responder la propuesta.");
      window.alert(text);
    } finally {
      setIsResponding(false);
    }
  };

  const bubbleBaseClass = isOwn
    ? "rounded-br-md bg-cyan-600 text-white dark:bg-cyan-500"
    : "rounded-bl-md bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-white";

  const renderProposalCard = () => {
    const proposalType = getProposalTypeLabel(payload?.proposalType);
    const timeRange = formatTimeRange(
      payload?.timeStart,
      payload?.timeEnd,
      payload?.timezone,
    );

    return (
      <div className="mt-1 rounded-xl border border-slate-200 bg-white/90 p-2.5 text-xs text-slate-700 dark:border-slate-600 dark:bg-slate-900/60 dark:text-slate-200">
        <p className="font-semibold">{proposalType}</p>
        <p className="mt-1 inline-flex items-center gap-1">
          <CalendarClock size={12} />
          {timeRange}
        </p>
        {payload?.meetingType && (
          <p className="mt-1">Tipo: {payload.meetingType === "on_site" ? "Presencial" : "Video llamada"}</p>
        )}
        {payload?.location && <p className="mt-1">Lugar: {payload.location}</p>}
        <p className="mt-1.5 font-medium">Estado: {getProposalStatusLabel(payload?.status)}</p>

        {canRespondToProposal && (
          <div className="mt-2 grid grid-cols-3 gap-1.5">
            <button
              type="button"
              onClick={() => handleProposalResponse("accept")}
              disabled={isResponding}
              className="rounded-md bg-emerald-600 px-2 py-1 text-[11px] font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-60"
            >
              Aceptar
            </button>
            <button
              type="button"
              onClick={() => handleProposalResponse("reject")}
              disabled={isResponding}
              className="rounded-md bg-rose-600 px-2 py-1 text-[11px] font-semibold text-white transition hover:bg-rose-500 disabled:opacity-60"
            >
              Rechazar
            </button>
            <button
              type="button"
              onClick={() => handleProposalResponse("request_change")}
              disabled={isResponding}
              className="rounded-md bg-amber-500 px-2 py-1 text-[11px] font-semibold text-slate-900 transition hover:bg-amber-400 disabled:opacity-60"
            >
              Pedir cambio
            </button>
          </div>
        )}
      </div>
    );
  };

  const renderProposalResponse = () => {
    const label = getResponseLabel(payload?.response);
    return (
      <div className="mt-1 rounded-xl border border-slate-200 bg-white/90 p-2 text-xs text-slate-700 dark:border-slate-600 dark:bg-slate-900/60 dark:text-slate-200">
        <p className="font-semibold">{label}</p>
        {payload?.comment && <p className="mt-1">{payload.comment}</p>}
        {Array.isArray(payload?.suggestedSlots) && payload.suggestedSlots.length > 0 && (
          <p className="mt-1">Slots sugeridos: {payload.suggestedSlots.length}</p>
        )}
      </div>
    );
  };

  return (
    <div className={cn("mb-2 flex", isOwn ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[86%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed",
          bubbleBaseClass,
          messageStatus === "failed" && "opacity-70",
        )}
      >
        {!isOwn && message.senderName && (
          <p
            className={cn(
              "mb-0.5 text-[11px] font-semibold",
              "text-slate-500 dark:text-slate-400",
            )}
          >
            {message.senderName}
          </p>
        )}

        <p className="whitespace-pre-wrap break-words">{message.body}</p>

        {kind === "proposal" && renderProposalCard()}
        {kind === "proposal_response" && renderProposalResponse()}

        <p
          className={cn(
            "mt-1 flex items-center justify-end text-[10px]",
            isOwn
              ? "text-cyan-100 dark:text-cyan-200"
              : "text-slate-400 dark:text-slate-500",
          )}
        >
          {time}
          {isOwn && <MessageStatus status={messageStatus} />}
        </p>
      </div>

      {isOwn && showOwnAvatar && (
        <div className="ml-1.5 flex items-end">
          {ownAvatarUrl ? (
            <img
              src={ownAvatarUrl}
              alt={ownAvatarLabel || message.senderName || "Me"}
              className="h-6 w-6 rounded-full object-cover ring-1 ring-white/70 dark:ring-slate-900/70"
            />
          ) : (
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-cyan-700 text-[9px] font-bold text-white dark:bg-cyan-600">
              {getInitials(ownAvatarLabel || message.senderName || "Me")}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ChatMessage;
