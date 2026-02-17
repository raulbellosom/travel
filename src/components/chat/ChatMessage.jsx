import { cn } from "../../utils/cn";

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

        {/* Timestamp */}
        <p
          className={cn(
            "mt-1 text-right text-[10px]",
            isOwn
              ? "text-cyan-100 dark:text-cyan-200"
              : "text-slate-400 dark:text-slate-500",
          )}
        >
          {time}
        </p>
      </div>
    </div>
  );
};

export default ChatMessage;
