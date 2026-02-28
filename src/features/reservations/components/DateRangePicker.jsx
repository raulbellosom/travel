/**
 * DateRangePicker – mobile-safe date range selector.
 *
 * Mobile  → opens calendar inside the global Modal (portal, scroll-lock, z-110+).
 * Desktop → inline popover anchored to the trigger.
 *
 * Design rules:
 *  - NO hover-only interactions (all tap-friendly)
 *  - pointer:fine  → compact desktop popover
 *  - pointer:coarse → global Modal with calendar content
 *  - Range selection: first tap sets start, second tap sets end
 *  - Shows two months for easier range selection
 */
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import dayjs from "dayjs";
import { AnimatePresence, m } from "framer-motion";
import { CalendarDays, ChevronLeft, ChevronRight, X } from "lucide-react";
import Modal, {
  ModalFooter,
} from "../../../components/common/organisms/Modal/Modal";

const DAYS = ["Do", "Lu", "Ma", "Mi", "Ju", "Vi", "Sá"];
const MONTHS = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

/** Build a 6-week grid of day objects for a given month */
const buildMonthGrid = (year, month) => {
  const firstDay = dayjs(new Date(year, month, 1));
  const startOffset = firstDay.day();
  const daysInMonth = firstDay.daysInMonth();
  const prevMonthDays = firstDay.subtract(1, "month").daysInMonth();
  const cells = [];

  for (let i = startOffset - 1; i >= 0; i--) {
    cells.push({
      day: prevMonthDays - i,
      thisMonth: false,
      date: firstDay.subtract(i + 1, "day"),
    });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({
      day: d,
      thisMonth: true,
      date: dayjs(new Date(year, month, d)),
    });
  }
  const remaining = 42 - cells.length;
  for (let d = 1; d <= remaining; d++) {
    cells.push({
      day: d,
      thisMonth: false,
      date: firstDay.add(1, "month").date(d),
    });
  }
  return cells;
};

/** Single calendar month grid */
const MonthGrid = ({
  year,
  month,
  startDate,
  endDate,
  hoverDate,
  onDayClick,
  onDayHover,
  minDate,
  maxDate,
}) => {
  const cells = useMemo(() => buildMonthGrid(year, month), [year, month]);

  return (
    <div className="min-w-70 select-none">
      <div className="mb-2 grid grid-cols-7 text-center text-[10px] font-semibold uppercase tracking-wide text-slate-400">
        {DAYS.map((d) => (
          <span key={d}>{d}</span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-y-0.5">
        {cells.map((cell) => {
          const iso = cell.date.format("YYYY-MM-DD");
          const isStart = startDate === iso;
          const isEnd = endDate === iso;
          const isInRange =
            startDate && endDate && iso > startDate && iso < endDate;
          const isHovered =
            startDate &&
            !endDate &&
            hoverDate &&
            iso > startDate &&
            iso <= hoverDate;
          const isToday = cell.date.isSame(dayjs(), "day");
          const isDisabled =
            !cell.thisMonth ||
            (minDate && iso < minDate) ||
            (maxDate && iso > maxDate);

          let bgClass = "";
          if (isStart || isEnd) {
            bgClass = "bg-cyan-600 text-white font-semibold";
          } else if (isInRange || isHovered) {
            bgClass =
              "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-200";
          } else if (isToday) {
            bgClass = "ring-2 ring-cyan-400 ring-offset-1";
          }

          return (
            <button
              key={iso}
              type="button"
              disabled={isDisabled}
              onClick={() => !isDisabled && onDayClick(iso)}
              onPointerEnter={() => !isDisabled && onDayHover?.(iso)}
              aria-label={cell.date.format("DD MMMM YYYY")}
              aria-pressed={isStart || isEnd}
              className={`flex h-9 w-full items-center justify-center rounded-lg text-sm transition
                ${isDisabled ? "cursor-not-allowed text-slate-300 dark:text-slate-600" : "cursor-pointer"}
                ${bgClass}
                ${
                  !isDisabled &&
                  !isStart &&
                  !isEnd &&
                  !isInRange &&
                  !isHovered &&
                  !isToday
                    ? "text-slate-700 dark:text-slate-200 [@media(hover:hover)]:hover:bg-slate-100 [@media(hover:hover)]:dark:hover:bg-slate-800"
                    : ""
                }`}
            >
              {cell.day}
            </button>
          );
        })}
      </div>
    </div>
  );
};

/** Shared calendar content used in both popover and modal */
const CalendarContent = ({
  viewMonth,
  secondMonth,
  startDate,
  endDate,
  hoverDate,
  handleDayClick,
  setHoverDate,
  prevMonth,
  nextMonth,
  minDate,
  maxDate,
}) => (
  <>
    <div className="mb-3 flex items-center justify-between">
      <button
        type="button"
        onClick={prevMonth}
        aria-label="Mes anterior"
        className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition
          [@media(hover:hover)]:hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300"
      >
        <ChevronLeft size={18} />
      </button>
      <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
        {MONTHS[viewMonth.month]} {viewMonth.year}
        <span className="mx-3 text-slate-400">·</span>
        {MONTHS[secondMonth.month]} {secondMonth.year}
      </span>
      <button
        type="button"
        onClick={nextMonth}
        aria-label="Mes siguiente"
        className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition
          [@media(hover:hover)]:hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300"
      >
        <ChevronRight size={18} />
      </button>
    </div>

    <div className="flex flex-col gap-6 md:flex-row">
      <MonthGrid
        {...viewMonth}
        startDate={startDate}
        endDate={endDate}
        hoverDate={hoverDate}
        onDayClick={handleDayClick}
        onDayHover={setHoverDate}
        minDate={minDate}
        maxDate={maxDate}
      />
      <MonthGrid
        {...secondMonth}
        startDate={startDate}
        endDate={endDate}
        hoverDate={hoverDate}
        onDayClick={handleDayClick}
        onDayHover={setHoverDate}
        minDate={minDate}
        maxDate={maxDate}
      />
    </div>

    <p className="mt-4 border-t border-slate-100 pt-3 text-center text-xs text-slate-400 dark:border-slate-800">
      {!startDate
        ? "Toca para seleccionar fecha de entrada"
        : !endDate
          ? "Toca para seleccionar fecha de salida"
          : `${dayjs(startDate).format("DD/MM/YYYY")} → ${dayjs(endDate).format("DD/MM/YYYY")}`}
    </p>
  </>
);

/**
 * DateRangePicker
 */
const DateRangePicker = ({
  startDate = "",
  endDate = "",
  onChange,
  minDate,
  maxDate,
  placeholder = "Seleccionar rango de fechas",
  className = "",
  disabled = false,
}) => {
  const [open, setOpen] = useState(false);
  const [hoverDate, setHoverDate] = useState(null);
  const [viewMonth, setViewMonth] = useState(() => {
    const base = startDate ? dayjs(startDate) : dayjs();
    return { year: base.year(), month: base.month() };
  });

  const containerRef = useRef(null);
  const panelRef = useRef(null);

  const [isMobile, setIsMobile] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(max-width: 767px)").matches,
  );
  const [flipRight, setFlipRight] = useState(false);
  const [flipUp, setFlipUp] = useState(false);

  // ── Selection logic ────────────────────────────────────────────────────────
  const handleDayClick = useCallback(
    (iso) => {
      if (!startDate || (startDate && endDate)) {
        onChange?.(iso, "");
      } else if (iso < startDate) {
        onChange?.(iso, startDate);
        if (!isMobile) setOpen(false);
      } else {
        onChange?.(startDate, iso);
        if (!isMobile) setOpen(false);
      }
      setHoverDate(null);
    },
    [startDate, endDate, onChange, isMobile],
  );

  // ── Navigation ─────────────────────────────────────────────────────────────
  const prevMonth = () =>
    setViewMonth(({ year, month }) => {
      if (month === 0) return { year: year - 1, month: 11 };
      return { year, month: month - 1 };
    });

  const nextMonth = () =>
    setViewMonth(({ year, month }) => {
      if (month === 11) return { year: year + 1, month: 0 };
      return { year, month: month + 1 };
    });

  const secondMonth = useMemo(() => {
    if (viewMonth.month === 11) return { year: viewMonth.year + 1, month: 0 };
    return { year: viewMonth.year, month: viewMonth.month + 1 };
  }, [viewMonth.year, viewMonth.month]);

  // ── Close on outside click (desktop popover only) ──────────────────────────
  useEffect(() => {
    if (!open || isMobile) return;
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("pointerdown", handler);
    return () => document.removeEventListener("pointerdown", handler);
  }, [open, isMobile]);

  // ── Mobile detection ──────────────────────────────────────────────────────
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const handler = (e) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  // ── Desktop: smart positioning ──────────────────────────────────────────
  useLayoutEffect(() => {
    if (!open || isMobile || !panelRef.current) return;
    setFlipRight(false);
    setFlipUp(false);
    const id = requestAnimationFrame(() => {
      if (!panelRef.current) return;
      const r = panelRef.current.getBoundingClientRect();
      setFlipRight(r.right > window.innerWidth - 8);
      setFlipUp(r.bottom > window.innerHeight - 8);
    });
    return () => cancelAnimationFrame(id);
  }, [open, isMobile]);

  // ── Display string ─────────────────────────────────────────────────────────
  const displayValue = (() => {
    if (startDate && endDate)
      return `${dayjs(startDate).format("DD/MM/YYYY")} → ${dayjs(endDate).format("DD/MM/YYYY")}`;
    if (startDate) return `${dayjs(startDate).format("DD/MM/YYYY")} → …`;
    return "";
  })();

  const clearRange = (e) => {
    e.stopPropagation();
    onChange?.("", "");
    setHoverDate(null);
  };

  const calendarProps = {
    viewMonth,
    secondMonth,
    startDate,
    endDate,
    hoverDate,
    handleDayClick,
    setHoverDate,
    prevMonth,
    nextMonth,
    minDate,
    maxDate,
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* ── Trigger ── */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        aria-label="Seleccionar rango de fechas"
        aria-expanded={open}
        aria-haspopup="dialog"
        className={`flex min-h-11 w-full items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm transition
          ${disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"}
          ${open ? "border-cyan-500 ring-2 ring-cyan-500/20" : "border-slate-300 dark:border-slate-600"}
          bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200`}
      >
        <CalendarDays size={16} className="shrink-0 text-slate-400" />
        <span className={`flex-1 ${!displayValue ? "text-slate-400" : ""}`}>
          {displayValue || placeholder}
        </span>
        {(startDate || endDate) && (
          <span
            role="button"
            tabIndex={0}
            onClick={clearRange}
            onKeyDown={(e) =>
              (e.key === "Enter" || e.key === " ") && clearRange(e)
            }
            aria-label="Limpiar fechas"
            className="flex h-7 w-7 items-center justify-center rounded-full text-slate-400 transition
              [@media(hover:hover)]:hover:bg-slate-200 [@media(hover:hover)]:hover:text-slate-700
              dark:[@media(hover:hover)]:hover:bg-slate-600"
          >
            <X size={12} />
          </span>
        )}
      </button>

      {/* ── Mobile: Global Modal calendar ── */}
      {isMobile && (
        <Modal
          isOpen={open}
          onClose={() => setOpen(false)}
          title="Seleccionar fechas"
          size="md"
          closeOnEscape
          closeOnBackdrop
          showCloseButton
          footer={
            <ModalFooter>
              <button
                type="button"
                onClick={() => {
                  onChange?.("", "");
                  setOpen(false);
                }}
                className="flex-1 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 dark:border-slate-700 dark:text-slate-300"
              >
                Limpiar
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex-1 rounded-lg bg-cyan-600 px-4 py-2.5 text-sm font-medium text-white"
              >
                Aplicar
              </button>
            </ModalFooter>
          }
        >
          <CalendarContent {...calendarProps} />
        </Modal>
      )}

      {/* ── Desktop: Popover ── */}
      {!isMobile && (
        <AnimatePresence>
          {open && (
            <m.div
              ref={panelRef}
              role="dialog"
              aria-label="Seleccionar rango de fechas"
              aria-modal="true"
              initial={{ opacity: 0, scale: 0.97, y: -6 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: -6 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              className={[
                "absolute z-50 top-[calc(100%+6px)]",
                "rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl",
                "dark:border-slate-700 dark:bg-slate-900",
                flipRight ? "right-0 left-auto" : "left-0 right-auto",
                flipUp ? "top-auto! bottom-[calc(100%+6px)]!" : "",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              <CalendarContent {...calendarProps} />
            </m.div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
};

export default DateRangePicker;
