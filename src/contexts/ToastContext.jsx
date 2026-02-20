import { createContext, useCallback, useEffect, useRef, useState } from "react";
import { CheckCircle2, Info, TriangleAlert, X, XCircle } from "lucide-react";

const ToastContext = createContext(null);

const DEFAULT_DURATION_MS = 5000;

const getToastVisuals = (type = "info") => {
  switch (type) {
    case "success":
      return {
        icon: CheckCircle2,
        containerClassName:
          "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800/60 dark:bg-emerald-950/50 dark:text-emerald-200",
        iconClassName: "text-emerald-600 dark:text-emerald-400",
      };
    case "error":
      return {
        icon: XCircle,
        containerClassName:
          "border-red-200 bg-red-50 text-red-800 dark:border-red-800/60 dark:bg-red-950/50 dark:text-red-200",
        iconClassName: "text-red-600 dark:text-red-400",
      };
    case "warning":
      return {
        icon: TriangleAlert,
        containerClassName:
          "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800/60 dark:bg-amber-950/50 dark:text-amber-200",
        iconClassName: "text-amber-600 dark:text-amber-400",
      };
    default:
      return {
        icon: Info,
        containerClassName:
          "border-cyan-200 bg-cyan-50 text-cyan-800 dark:border-cyan-800/60 dark:bg-cyan-950/50 dark:text-cyan-200",
        iconClassName: "text-cyan-600 dark:text-cyan-400",
      };
  }
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const timersRef = useRef(new Map());

  const dismissToast = useCallback((toastId) => {
    const id = String(toastId || "").trim();
    if (!id) return;

    const timerId = timersRef.current.get(id);
    if (timerId) {
      window.clearTimeout(timerId);
      timersRef.current.delete(id);
    }

    setToasts((previous) => previous.filter((item) => item.id !== id));
  }, []);

  const showToast = useCallback(
    ({
      type = "info",
      title = "",
      message = "",
      durationMs = DEFAULT_DURATION_MS,
      dismissible = true,
    } = {}) => {
      const normalizedMessage = String(message || "").trim();
      const normalizedTitle = String(title || "").trim();
      if (!normalizedMessage && !normalizedTitle) return "";

      const id = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
      const toast = {
        id,
        type,
        title: normalizedTitle,
        message: normalizedMessage,
        dismissible: dismissible !== false,
      };

      setToasts((previous) => [...previous, toast]);

      if (durationMs > 0) {
        const timeoutId = window.setTimeout(() => {
          dismissToast(id);
        }, durationMs);
        timersRef.current.set(id, timeoutId);
      }

      return id;
    },
    [dismissToast],
  );

  const clearToasts = useCallback(() => {
    timersRef.current.forEach((timerId) => window.clearTimeout(timerId));
    timersRef.current.clear();
    setToasts([]);
  }, []);

  useEffect(
    () => () => {
      timersRef.current.forEach((timerId) => window.clearTimeout(timerId));
      timersRef.current.clear();
    },
    [],
  );

  return (
    <ToastContext.Provider
      value={{
        toasts,
        showToast,
        dismissToast,
        clearToasts,
      }}
    >
      {children}
      <div className="pointer-events-none fixed right-4 top-4 z-[180] flex w-[min(92vw,420px)] flex-col gap-2">
        {toasts.map((toast) => {
          const visuals = getToastVisuals(toast.type);
          const Icon = visuals.icon;

          return (
            <article
              key={toast.id}
              role={toast.type === "error" ? "alert" : "status"}
              className={`pointer-events-auto rounded-xl border p-3 shadow-lg backdrop-blur-sm ${visuals.containerClassName}`}
            >
              <div className="flex items-start gap-2">
                <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${visuals.iconClassName}`} />
                <div className="min-w-0 flex-1">
                  {toast.title ? (
                    <p className="text-sm font-semibold">{toast.title}</p>
                  ) : null}
                  {toast.message ? (
                    <p className="text-sm leading-snug opacity-95">{toast.message}</p>
                  ) : null}
                </div>
                {toast.dismissible ? (
                  <button
                    type="button"
                    onClick={() => dismissToast(toast.id)}
                    className="rounded-md p-1 opacity-75 transition hover:bg-black/5 hover:opacity-100 dark:hover:bg-white/10"
                    aria-label="Dismiss toast"
                  >
                    <X className="h-4 w-4" />
                  </button>
                ) : null}
              </div>
            </article>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export default ToastContext;
