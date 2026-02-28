/**
 * ReservationActionsMenu – unified dropdown / context menu for reservation actions.
 *
 * Uses `getReservationActions()` to render only valid actions for the
 * current status + permissions.  Renders via `createPortal` to avoid
 * overflow/clipping issues inside tables or cards.
 *
 * Used by ReservationTable, ReservationCard, and ReservationDetailPage.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { MoreVertical } from "lucide-react";
import { AnimatePresence, m } from "framer-motion";
import { useAuth } from "../../../hooks/useAuth";
import { canWriteReservations } from "../rbac";
import { getReservationActions } from "../actions";

const EMPTY_ARRAY = [];
const ReservationActionsMenu = ({
  reservation,
  busyId,
  onConfirm,
  onMarkPaid,
  onComplete,
  onCancel,
  /** Override navigate targets if needed */
  basePath = "/app/reservations",
  /** Extra actions to append */
  extraActions = EMPTY_ARRAY,
  /** Compact mode (smaller trigger) */
  compact = false,
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [menuPos, setMenuPos] = useState({ top: 0, right: 0 });
  const triggerRef = useRef(null);

  const isBusy = busyId === reservation.$id;
  const canWrite = canWriteReservations(user);

  const handleOpen = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const top = rect.bottom + 4;
      const right = window.innerWidth - rect.right;
      // Adjust if menu would go off-screen bottom
      const menuHeight = 300; // approximate max
      const adjustedTop =
        top + menuHeight > window.innerHeight
          ? Math.max(8, rect.top - menuHeight - 4)
          : top;
      setMenuPos({ top: adjustedTop, right: Math.max(8, right) });
    }
    setOpen((v) => !v);
  };

  const close = useCallback(() => setOpen(false), []);

  const copyId = () => {
    navigator.clipboard?.writeText(reservation.$id).catch(() => {});
    close();
  };

  const actions = useMemo(
    () =>
      getReservationActions(reservation, {
        canWrite,
        isBusy,
        t,
        onView: (id) => {
          close();
          navigate(`${basePath}/${id}`);
        },
        onEdit: (id) => {
          close();
          navigate(`${basePath}/${id}/edit`);
        },
        onConfirm: (id) => {
          close();
          onConfirm?.(id);
        },
        onMarkPaid: (id) => {
          close();
          onMarkPaid?.(id);
        },
        onComplete: (id) => {
          close();
          onComplete?.(id);
        },
        onCancel: (id) => {
          close();
          onCancel?.(id);
        },
        onCopyId: () => copyId(),
        includeView: true,
        includeEdit: true,
        includeCopy: true,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [reservation?.status, reservation?.$id, canWrite, isBusy],
  );

  const allActions = useMemo(
    () => [...actions, ...extraActions],
    [actions, extraActions],
  );

  const menuRef = useRef(null);

  // ── Escape key handler ──────────────────────────────────────────────────
  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === "Escape") {
        close();
        triggerRef.current?.focus();
      }
      // Arrow key navigation inside menu
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        const items = menuRef.current?.querySelectorAll(
          'button[role="menuitem"]:not(:disabled)',
        );
        if (!items?.length) return;
        const arr = Array.from(items);
        const idx = arr.indexOf(document.activeElement);
        const next =
          e.key === "ArrowDown"
            ? (idx + 1) % arr.length
            : (idx - 1 + arr.length) % arr.length;
        arr[next]?.focus();
      }
    },
    [close],
  );

  // ── Focus first item on open ────────────────────────────────────────────
  useEffect(() => {
    if (open && menuRef.current) {
      const first = menuRef.current.querySelector(
        'button[role="menuitem"]:not(:disabled)',
      );
      first?.focus();
    }
  }, [open]);

  // Touch-accessible trigger: min 44px
  const triggerSize = "h-11 w-11";

  return (
    <div>
      <button
        ref={triggerRef}
        type="button"
        onClick={handleOpen}
        aria-label="Opciones"
        aria-haspopup="menu"
        aria-expanded={open}
        className={`flex ${triggerSize} items-center justify-center rounded-lg text-slate-400 transition
          [@media(hover:hover)]:hover:bg-slate-100 [@media(hover:hover)]:hover:text-slate-700
          dark:[@media(hover:hover)]:hover:bg-slate-800 dark:[@media(hover:hover)]:hover:text-slate-200`}
      >
        <MoreVertical size={compact ? 16 : 18} />
      </button>

      {typeof document !== "undefined" &&
        createPortal(
          <AnimatePresence>
            {open && (
              <>
                {/* Invisible backdrop */}
                <div
                  className="fixed inset-0 z-[100]"
                  onClick={close}
                  aria-hidden="true"
                />
                <m.div
                  ref={menuRef}
                  role="menu"
                  aria-label="Acciones de reserva"
                  onKeyDown={handleKeyDown}
                  initial={{ opacity: 0, scale: 0.95, y: -4 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -4 }}
                  transition={{ duration: 0.12 }}
                  style={{ top: menuPos.top, right: menuPos.right }}
                  className="fixed z-[101] min-w-52 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-800"
                >
                  {allActions.map((action) => {
                    const Icon = action.icon;
                    return (
                      <button
                        key={action.key}
                        type="button"
                        role="menuitem"
                        tabIndex={-1}
                        disabled={action.disabled}
                        onClick={action.handler}
                        className={`flex min-h-11 w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm transition
                          disabled:opacity-50 disabled:cursor-not-allowed
                          ${action.color || "text-slate-700 dark:text-slate-200"}
                          ${action.hoverBg || ""}
                          ${action.separator ? "border-t border-slate-100 dark:border-slate-700" : ""}`}
                      >
                        {Icon && <Icon size={15} className="shrink-0" />}
                        {action.label}
                      </button>
                    );
                  })}
                </m.div>
              </>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </div>
  );
};

export default ReservationActionsMenu;
