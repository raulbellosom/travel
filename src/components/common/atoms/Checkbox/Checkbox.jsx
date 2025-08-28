import React from "react";
import { Check, Minus } from "lucide-react";

/**
 * Checkbox con estado indeterminado, accesible y theme-aware.
 * onChange(nextChecked:boolean, event?) -> void
 */
const Checkbox = ({
  id,
  name,
  checked = false,
  indeterminate = false,
  disabled = false,
  size = "md",
  variant = "primary",
  label,
  description,
  error,
  className = "",
  onChange,
  ...props
}) => {
  const autoId = React.useId();
  const inputId = id ?? autoId;
  const inputRef = React.useRef(null);

  // Actualiza la propiedad DOM 'indeterminate' cuando cambie
  React.useEffect(() => {
    if (inputRef.current) {
      inputRef.current.indeterminate = !!indeterminate && !checked;
    }
  }, [indeterminate, checked]);

  // Tamaños
  const sizeStyles = {
    sm: { box: "w-4 h-4", icon: "w-3 h-3", errorMargin: "ml-6" },
    md: { box: "w-5 h-5", icon: "w-3.5 h-3.5", errorMargin: "ml-7" },
    lg: { box: "w-6 h-6", icon: "w-4 h-4", errorMargin: "ml-8" },
  };
  const s = sizeStyles[size] ?? sizeStyles.md;

  // Variantes (unifiqué warning a amber para ser consistente con tu Toggle)
  const variantStyles = {
    primary: {
      base: "border-gray-300 dark:border-gray-600",
      checked: "bg-blue-600 border-blue-600",
      focus: "ring-blue-500/20 dark:ring-blue-400/20",
    },
    secondary: {
      base: "border-gray-300 dark:border-gray-600",
      checked: "bg-gray-500 border-gray-500",
      focus: "ring-gray-500/20 dark:ring-gray-400/20",
    },
    success: {
      base: "border-gray-300 dark:border-gray-600",
      checked: "bg-green-600 border-green-600",
      focus: "ring-green-500/20 dark:ring-green-400/20",
    },
    warning: {
      base: "border-gray-300 dark:border-gray-600",
      checked: "bg-amber-500 border-amber-500",
      focus: "ring-amber-500/20 dark:ring-amber-400/20",
    },
    danger: {
      base: "border-gray-300 dark:border-gray-600",
      checked: "bg-red-600 border-red-600",
      focus: "ring-red-500/20 dark:ring-red-400/20",
    },
  };
  const v = variantStyles[variant] ?? variantStyles.primary;

  // Estilos de la “caja”
  const boxClass = [
    "relative inline-flex items-center justify-center rounded",
    "border-2 transition-colors duration-150",
    "peer-focus-visible:ring-2 peer-focus-visible:ring-offset-2", // anillo visible desde el input
    "peer-disabled:opacity-50 peer-disabled:cursor-not-allowed",
    s.box,
    checked || (indeterminate && !checked) ? v.checked : v.base,
    `peer-focus-visible:${v.focus}`,
    error && "border-red-500 dark:border-red-400",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const labelTextClass = [
    "text-sm font-medium cursor-pointer",
    disabled && "opacity-50 cursor-not-allowed",
    error
      ? "text-red-600 dark:text-red-400"
      : "text-gray-700 dark:text-gray-300",
  ]
    .filter(Boolean)
    .join(" ");

  // Accesibilidad
  const descriptionId = description ? `${inputId}-desc` : undefined;
  const errorId = error ? `${inputId}-err` : undefined;
  const ariaDescribedBy =
    [descriptionId, errorId].filter(Boolean).join(" ") || undefined;

  const handleChange = (e) => {
    if (disabled) return;
    onChange?.(e.target.checked, e);
  };

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-start gap-2">
        <div className="relative">
          <input
            ref={inputRef}
            type="checkbox"
            id={inputId}
            name={name ?? inputId}
            checked={checked}
            disabled={disabled}
            onChange={handleChange}
            className="peer sr-only"
            role="checkbox"
            aria-checked={indeterminate ? "mixed" : !!checked}
            aria-invalid={!!error}
            aria-describedby={ariaDescribedBy}
            {...props}
          />
          <label htmlFor={inputId} className={boxClass}>
            {(checked || (indeterminate && !checked)) && (
              <span className="text-white dark:text-gray-900">
                {indeterminate && !checked ? (
                  <Minus className={s.icon} />
                ) : (
                  <Check className={s.icon} />
                )}
              </span>
            )}
          </label>
        </div>

        {(label || description) && (
          <div className="flex-1">
            {label && (
              <label htmlFor={inputId} className={labelTextClass}>
                {label}
              </label>
            )}
            {description && (
              <p
                id={descriptionId}
                className="text-xs text-gray-500 dark:text-gray-400 mt-0.5"
              >
                {description}
              </p>
            )}
          </div>
        )}
      </div>

      {error && (
        <p
          id={errorId}
          className={`text-xs text-red-600 dark:text-red-400 ${s.errorMargin}`}
        >
          {error}
        </p>
      )}
    </div>
  );
};

export default Checkbox;
