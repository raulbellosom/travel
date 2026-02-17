import { cn } from "../../utils/cn";
import { Clock, Check, AlertCircle } from "lucide-react";

/**
 * Status indicator for sent messages.
 */
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
          className="ml-1 inline-block h-3 w-3 text-cyan-200"
          aria-label="Enviado"
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

/**
 * Single chat message bubble.
 * @param {{ message: object, isOwn: boolean }} props
 */
const ChatMessage = ({ message, isOwn }) => {
  const time = new Date(message.$createdAt).toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className={cn("mb-2 flex", isOwn ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[80%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed",
          isOwn
            ? "rounded-br-md bg-cyan-600 text-white dark:bg-cyan-500"
            : "rounded-bl-md bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-white",
          message.status === "failed" && "opacity-70",
        )}
      >
        {/* Sender name (only if not own message) */}
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

        {/* Body */}
        <p className="whitespace-pre-wrap break-words">{message.body}</p>

        {/* Timestamp and status */}
        <p
          className={cn(
            "mt-1 flex items-center justify-end text-[10px]",
            isOwn
              ? "text-cyan-100 dark:text-cyan-200"
              : "text-slate-400 dark:text-slate-500",
          )}
        >
          {time}
          {isOwn && <MessageStatus status={message.status} />}
        </p>
      </div>
    </div>
  );
};

export default ChatMessage;
