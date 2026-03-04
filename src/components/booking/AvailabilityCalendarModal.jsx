import { useEffect } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, m } from "framer-motion";
import { X, ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";

/**
 * AvailabilityCalendarModal
 *
 * Thin shell for the calendar booking flow.
 * - Mobile: slides up full-screen from bottom (inset-0), safe-area aware
 * - sm+: centered dialog, max-w-4xl, 92dvh, rounded-2xl
 *
 * Props:
 *   isOpen      boolean
 *   onClose     () => void
 *   onContinue  () => void   — footer "Continuar" button
 *   canContinue boolean      — enables the footer button
 *   title       string       — modal header label
 *   children    ReactNode    — calendar content owned by parent
 */
export default function AvailabilityCalendarModal({
  isOpen = false,
  onClose,
  onContinue,
  canContinue = false,
  title,
  children,
}) {
  const { t } = useTranslation();

  // Lock body scroll while open
  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen]);

  // Escape key closes the modal
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  const content = (
    <AnimatePresence>
      {isOpen && (
        <m.div
          key="cal-modal-backdrop"
          className="fixed inset-0 z-[10000] bg-black/60 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.2 } }}
          onClick={onClose}
        >
          {/* Panel: full-screen on mobile, centered dialog on sm+ */}
          <m.div
            className={[
              // Mobile: true full-screen sheet with safe area padding
              "absolute inset-0 flex flex-col overflow-hidden",
              "bg-white dark:bg-slate-900",
              // sm+: float as a centered card
              "sm:inset-auto sm:left-1/2 sm:top-1/2",
              "sm:-translate-x-1/2 sm:-translate-y-1/2",
              "sm:w-[95vw] sm:max-w-4xl lg:max-w-6xl sm:max-h-[92dvh]",
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
            aria-labelledby="cal-modal-title"
          >
            {/* ── Sticky header ── */}
            <div className="shrink-0 flex items-center justify-between gap-3 px-4 py-4 border-b border-slate-200 dark:border-slate-700 sm:px-6">
              <h2
                id="cal-modal-title"
                className="text-base font-bold text-slate-900 dark:text-white truncate"
              >
                {title ||
                  t("calendarModal.title", { defaultValue: "Disponibilidad" })}
              </h2>
              <button
                type="button"
                onClick={onClose}
                className="shrink-0 flex items-center justify-center w-9 h-9 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                aria-label={t("calendarModal.close", {
                  defaultValue: "Cerrar",
                })}
              >
                <X size={18} />
              </button>
            </div>

            {/* ── Scrollable body ── */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden overscroll-contain min-h-0 min-w-0 p-4 sm:p-6">
              {children}
            </div>

            {/* ── Sticky footer ── */}
            <div className="shrink-0 flex gap-3 px-4 py-4 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 sm:px-6 sm:rounded-b-2xl pb-[max(1rem,env(safe-area-inset-bottom))]">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 min-h-12 rounded-xl border border-slate-300 dark:border-slate-600 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
              >
                {t("calendarModal.cancel", { defaultValue: "Cancelar" })}
              </button>
              <button
                type="button"
                onClick={onContinue}
                disabled={!canContinue}
                className="flex-[2] min-h-12 inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-600 px-5 text-sm font-bold text-white transition hover:bg-cyan-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ChevronRight size={16} />
                {t("calendarModal.continue", { defaultValue: "Continuar" })}
              </button>
            </div>
          </m.div>
        </m.div>
      )}
    </AnimatePresence>
  );

  if (typeof document === "undefined") return null;
  return createPortal(content, document.body);
}
