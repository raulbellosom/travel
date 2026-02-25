import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Users, ChevronDown, Minus, Plus } from "lucide-react";

/**
 * GuestSelector – dropdown stepper for selecting number of guests/passengers/persons.
 *
 * @param {Object}   props
 * @param {string}   props.label           – Display label (e.g. "Huéspedes", "Pasajeros")
 * @param {number}   props.value           – Currently selected count
 * @param {number}   props.min             – Minimum allowed (default 1)
 * @param {number}   props.max             – Maximum allowed
 * @param {Function} props.onChange         – Called with the new count
 * @param {string}   [props.resourceType]  – Optional resource type for icon customisation
 */
export default function GuestSelector({
  label,
  value = 1,
  min = 1,
  max = 20,
  onChange,
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const increment = () => {
    if (value < max) onChange?.(value + 1);
  };
  const decrement = () => {
    if (value > min) onChange?.(value - 1);
  };

  return (
    <div ref={ref} className="relative">
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={[
          "flex w-full items-center justify-between gap-2 rounded-xl border px-3 py-2.5 text-sm transition",
          open
            ? "border-cyan-500 bg-cyan-50/50 ring-2 ring-cyan-500/20 dark:border-cyan-500 dark:bg-cyan-950/30"
            : "border-slate-200 bg-white hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-slate-600",
        ].join(" ")}
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <span className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
          <Users className="h-4 w-4 text-slate-400 dark:text-slate-500" />
          <span className="font-medium">{value}</span>
          <span className="text-slate-500 dark:text-slate-400">{label}</span>
        </span>
        <ChevronDown
          className={[
            "h-4 w-4 text-slate-400 transition-transform duration-200",
            open ? "rotate-180" : "",
          ].join(" ")}
        />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute left-0 right-0 top-full z-20 mt-1 rounded-xl border border-slate-200 bg-white p-3 shadow-lg dark:border-slate-700 dark:bg-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
              {label}
            </span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={decrement}
                disabled={value <= min}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-300 text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-300 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700 dark:disabled:border-slate-700 dark:disabled:text-slate-600"
                aria-label={t("common.decrease", { defaultValue: "Disminuir" })}
              >
                <Minus className="h-3.5 w-3.5" />
              </button>

              <span className="w-8 text-center text-sm font-semibold text-slate-900 dark:text-slate-100">
                {value}
              </span>

              <button
                type="button"
                onClick={increment}
                disabled={value >= max}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-300 text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-300 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700 dark:disabled:border-slate-700 dark:disabled:text-slate-600"
                aria-label={t("common.increase", { defaultValue: "Aumentar" })}
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {max && (
            <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">
              {t("calendar.booking.maxGuests", { count: max })}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
