// src/components/DatePicker.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";

/**
 * DatePicker – Unificado (range | single)
 *
 * Props principales:
 * - mode: 'range' | 'single' (default 'range')
 * - value: { startDate:Date|null, endDate:Date|null } | Date|null
 * - onChange: (next) => void
 * - inline: boolean (si true, no se muestra trigger; el calendario queda embebido)
 * - renderTrigger: ({open,toggle,formatted}) => ReactNode (para personalizar el "handler")
 * - numberOfMonths: 1 | 2 (auto por ancho si no se pasa)
 * - pricing: { 'YYYY-MM-DD': number } (opcional)
 * - disabledDates: Date[]
 * - availableDates: Date[] (si no está vacío, sólo se permiten esas fechas)
 * - minDate: Date
 * - maxDate: Date
 * - showPrices: boolean
 * - closeOnSelect: boolean (single=true por defecto; range=false por defecto)
 * - className: string
 *
 * Accesibilidad:
 * - botón de limpiar
 * - navegación de mes
 */

export default function DatePicker({
  mode = "range",
  value = mode === "range" ? { startDate: null, endDate: null } : null,
  onChange,
  inline = false,
  renderTrigger,
  numberOfMonths: propNumberOfMonths,
  pricing = {},
  disabledDates = [],
  availableDates = [],
  minDate = new Date(),
  maxDate = null,
  showPrices = true,
  closeOnSelect: propCloseOnSelect,
  placeholder,
  className = "",
}) {
  const { i18n } = useTranslation();
  const locale = i18n.language === "es" ? "es-ES" : "en-US";

  // --- control interno vs controlado
  const isRange = mode === "range";
  const [internalRange, setInternalRange] = useState(
    isRange
      ? value || { startDate: null, endDate: null }
      : { startDate: value || null, endDate: null }
  );
  const [isOpen, setIsOpen] = useState(false);

  const range = isRange
    ? value || { startDate: null, endDate: null }
    : { startDate: value || null, endDate: null };
  const current = isControlled(value) ? range : internalRange;

  function isControlled(v) {
    // si el padre pasa value !== undefined
    return typeof v !== "undefined";
  }

  const setRange = (r) => {
    if (isControlled(value)) onChange?.(isRange ? r : r.startDate);
    else setInternalRange(r);
  };

  // cierre automático por modo
  const closeOnSelect =
    typeof propCloseOnSelect === "boolean" ? propCloseOnSelect : !isRange; // single:true, range:false

  // --- meses visibles
  const initialMonth = useMemo(() => {
    const d = current?.startDate || new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  }, [current?.startDate]); // eslint-disable-line

  const [month, setMonth] = useState(initialMonth);

  const numMonths =
    typeof propNumberOfMonths === "number"
      ? propNumberOfMonths
      : typeof window !== "undefined" && window.innerWidth < 768
      ? 1
      : 2;

  // --- click afuera cierra
  const popRef = useRef(null);
  useEffect(() => {
    if (inline) return;
    const onDoc = (e) => {
      if (popRef.current && !popRef.current.contains(e.target))
        setIsOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [inline]);

  // --- utils fechas
  const pad = (n) => (n < 10 ? `0${n}` : `${n}`);
  const keyOf = (d) =>
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const sameDay = (a, b) =>
    a &&
    b &&
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  const startOfMonth = (d) => new Date(d.getFullYear(), d.getMonth(), 1);
  const endOfMonth = (d) => new Date(d.getFullYear(), d.getMonth() + 1, 0);
  const addMonths = (d, m) => new Date(d.getFullYear(), d.getMonth() + m, 1);

  const dayNameHeaders =
    i18n.language === "es"
      ? ["Do", "Lu", "Ma", "Mi", "Ju", "Vi", "Sa"]
      : ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

  const monthTitle = (d) =>
    d.toLocaleDateString(locale, { month: "long", year: "numeric" });

  const isDisabled = (d) => {
    if (minDate && d < stripTime(minDate)) return true;
    if (maxDate && d > stripTime(maxDate)) return true;
    if (disabledDates.some((x) => sameDay(x, d))) return true;
    if (availableDates.length && !availableDates.some((x) => sameDay(x, d)))
      return true;
    return false;
  };

  const stripTime = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

  const daysInGrid = (d) => {
    const start = startOfMonth(d);
    const end = endOfMonth(d);
    const gridStart = new Date(start);
    gridStart.setDate(start.getDate() - start.getDay()); // empieza domingo
    const arr = [];
    const cur = new Date(gridStart);
    // 6 semanas visibles típicamente
    while (cur <= end || cur.getDay() !== 0) {
      arr.push(new Date(cur));
      cur.setDate(cur.getDate() + 1);
    }
    return arr;
  };

  // --- selección (single o range)
  const [hoverDate, setHoverDate] = useState(null);

  const inHoverRange = (d) => {
    if (!isRange) return false;
    const { startDate, endDate } = current;
    if (startDate && !endDate && hoverDate) {
      const a = startDate < hoverDate ? startDate : hoverDate;
      const b = startDate < hoverDate ? hoverDate : startDate;
      return d >= a && d <= b;
    }
    return false;
  };

  const inRange = (d) => {
    const { startDate, endDate } = current;
    if (!startDate || !endDate) return false;
    return d >= startDate && d <= endDate;
  };

  const pick = (d) => {
    if (isDisabled(d)) return;
    if (!isRange) {
      setRange({ startDate: d, endDate: null });
      if (closeOnSelect && !inline) setIsOpen(false);
      return;
    }
    const { startDate, endDate } = current;
    if (!startDate) {
      setRange({ startDate: d, endDate: null });
    } else if (!endDate) {
      if (sameDay(d, startDate)) {
        // reinicia si se vuelve a clickear el mismo
        setRange({ startDate: null, endDate: null });
      } else if (d < startDate) {
        setRange({ startDate: d, endDate: null });
      } else {
        setRange({ startDate, endDate: d });
      }
    } else {
      // tercer click: reinicia y arranca nuevo rango
      setRange({ startDate: d, endDate: null });
    }
  };

  const nights = useMemo(() => {
    const { startDate, endDate } = current;
    if (!startDate || !endDate) return 0;
    return Math.ceil((stripTime(endDate) - stripTime(startDate)) / 86400000);
  }, [current]);

  // --- formateo de la etiqueta (trigger)
  const fmtDay = (d) =>
    d.toLocaleDateString(locale, { month: "short", day: "numeric" });
  const formatted = useMemo(() => {
    if (!isRange) {
      return current?.startDate
        ? fmtDay(current.startDate)
        : placeholder ||
            (i18n.language === "es" ? "Selecciona fecha" : "Select date");
    }
    const { startDate, endDate } = current || {};
    if (!startDate)
      return (
        placeholder ||
        (i18n.language === "es" ? "Selecciona fechas" : "Select dates")
      );
    if (!endDate) return fmtDay(startDate);
    return `${fmtDay(startDate)} – ${fmtDay(endDate)}${
      nights
        ? `  ·  ${nights} ${
            i18n.language === "es"
              ? nights === 1
                ? "noche"
                : "noches"
              : nights === 1
              ? "night"
              : "nights"
          }`
        : ""
    }`;
  }, [current, nights, placeholder, i18n.language]);

  // --- precio
  const priceOf = (d) => pricing[keyOf(d)];

  // --- Trigger por defecto
  const DefaultTrigger = ({ open, toggle }) => (
    <button
      type="button"
      onClick={toggle}
      className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 flex items-center justify-between"
      aria-expanded={open}
    >
      <span
        className={`text-sm ${
          current?.startDate
            ? "text-gray-900 dark:text-gray-100"
            : "text-gray-500 dark:text-gray-400"
        } whitespace-nowrap truncate`}
      >
        {formatted}
      </span>
      <CalendarIcon className="w-5 h-5 text-gray-400" />
    </button>
  );

  // --- Mes (sólo grid; el título está en el header global para evitar duplicación)
  const MonthGrid = ({ base }) => {
    const days = daysInGrid(base);
    const inThisMonth = (d) => d.getMonth() === base.getMonth();

    return (
      <div
        className={`flex-shrink-0 ${
          numMonths === 1 ? "p-4 w-full" : "p-6 w-80"
        }`}
      >
        {/* Encabezados de días */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {dayNameHeaders.map((d) => (
            <div key={d} className="h-8 flex items-center justify-center">
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                {d}
              </span>
            </div>
          ))}
        </div>

        {/* Días */}
        <div className="grid grid-cols-7 gap-1">
          {days.map((d, idx) => {
            const disabled = isDisabled(d);
            const selected =
              sameDay(d, current?.startDate) ||
              (isRange && sameDay(d, current?.endDate));
            const inSelRange = inRange(d) || inHoverRange(d);
            const price = priceOf(d);

            return (
              <button
                key={idx}
                type="button"
                onClick={() => pick(d)}
                onMouseEnter={() => setHoverDate(d)}
                onMouseLeave={() => setHoverDate(null)}
                disabled={disabled}
                className={[
                  "relative h-12 w-full flex flex-col items-center justify-center rounded-lg text-sm transition-colors",
                  inThisMonth(d)
                    ? "text-gray-900 dark:text-gray-100"
                    : "text-gray-300 dark:text-gray-600",
                  disabled
                    ? "opacity-30 cursor-not-allowed line-through"
                    : "hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer",
                  selected
                    ? "bg-blue-600 text-white shadow"
                    : inSelRange
                    ? "bg-blue-100 dark:bg-blue-900/30 text-blue-900 dark:text-blue-100"
                    : "",
                ].join(" ")}
              >
                <span className="font-medium">{d.getDate()}</span>
                {showPrices && price && inThisMonth(d) && !disabled && (
                  <span className="text-[11px] text-gray-500 dark:text-gray-400">
                    ${price}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  // --- Contenido del popover (o inline)
  const CalendarPanel = (
    <div
      ref={popRef}
      className={[
        "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl",
        inline ? "w-full" : numMonths === 1 ? "w-96" : "w-[760px]",
        className,
      ].join(" ")}
    >
      {/* Header único (sin duplicar títulos en cada grid) */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-gray-100">
          <button
            type="button"
            onClick={() => setMonth(addMonths(month, -1))}
            className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
            aria-label="Previous month"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="min-w-[200px] text-center">
            {monthTitle(month)}
            {numMonths === 2 && (
              <>
                <span className="mx-2">–</span>
                {monthTitle(addMonths(month, 1))}
              </>
            )}
          </span>
          <button
            type="button"
            onClick={() => setMonth(addMonths(month, +1))}
            className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
            aria-label="Next month"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center gap-3">
          {isRange && current?.startDate && current?.endDate && (
            <span className="text-sm text-gray-600 dark:text-gray-400 font-medium px-3 py-1 bg-blue-50 dark:bg-blue-900/20 rounded-full">
              {nights}{" "}
              {i18n.language === "es"
                ? nights === 1
                  ? "noche"
                  : "noches"
                : nights === 1
                ? "night"
                : "nights"}
            </span>
          )}
          {(current?.startDate || current?.endDate) && (
            <button
              type="button"
              onClick={() => setRange({ startDate: null, endDate: null })}
              className="text-sm px-3 py-1 rounded-md border border-transparent hover:border-gray-200 dark:hover:border-gray-700 text-gray-600 dark:text-gray-300"
            >
              {i18n.language === "es" ? "Limpiar" : "Clear"}
            </button>
          )}
          {!inline && (
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Grids */}
      <div className={numMonths === 1 ? "p-2" : "flex justify-center"}>
        <MonthGrid base={month} />
        {numMonths === 2 && <MonthGrid base={addMonths(month, 1)} />}
      </div>
    </div>
  );

  // --- Render
  if (inline) {
    return CalendarPanel; // calendario embebido (sin trigger)
  }

  return (
    <div className="relative">
      {renderTrigger ? (
        renderTrigger({
          open: isOpen,
          toggle: () => setIsOpen((v) => !v),
          formatted,
          value: isRange ? current : current?.startDate,
        })
      ) : (
        <DefaultTrigger open={isOpen} toggle={() => setIsOpen((v) => !v)} />
      )}

      <AnimatePresence>
        {isOpen && (
          <motion.div
            className={`absolute z-50 mt-2 ${
              numMonths === 1 ? "left-0 w-96" : "left-0 w-[760px]"
            } max-w-[calc(100vw-2rem)]`}
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.18 }}
          >
            {CalendarPanel}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
