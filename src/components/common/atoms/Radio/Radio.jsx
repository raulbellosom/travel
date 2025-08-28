import React from "react";

/**
 * Radio – selección única en un grupo.
 * onChange(nextValue:any, event?:ChangeEvent) -> void
 */
const Radio = ({
  id,
  name,
  value,
  checked = false,
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

  // Tamaños
  const sizeStyles = {
    sm: { box: "w-4 h-4", dot: "w-2 h-2", errorMargin: "ml-6" },
    md: { box: "w-5 h-5", dot: "w-2.5 h-2.5", errorMargin: "ml-7" },
    lg: { box: "w-6 h-6", dot: "w-3 h-3", errorMargin: "ml-8" },
  };
  const s = sizeStyles[size] ?? sizeStyles.md;

  // Variantes (warning -> amber para consistencia)
  const variantStyles = {
    primary: {
      base: "border-gray-300 dark:border-gray-600",
      checked: "border-blue-600",
      dot: "bg-blue-600",
      focus: "ring-blue-500/20 dark:ring-blue-400/20",
    },
    secondary: {
      base: "border-gray-300 dark:border-gray-600",
      checked: "border-gray-500",
      dot: "bg-gray-500",
      focus: "ring-gray-500/20 dark:ring-gray-400/20",
    },
    success: {
      base: "border-gray-300 dark:border-gray-600",
      checked: "border-green-600",
      dot: "bg-green-600",
      focus: "ring-green-500/20 dark:ring-green-400/20",
    },
    warning: {
      base: "border-gray-300 dark:border-gray-600",
      checked: "border-amber-500",
      dot: "bg-amber-500",
      focus: "ring-amber-500/20 dark:ring-amber-400/20",
    },
    danger: {
      base: "border-gray-300 dark:border-gray-600",
      checked: "border-red-600",
      dot: "bg-red-600",
      focus: "ring-red-500/20 dark:ring-red-400/20",
    },
  };
  const v = variantStyles[variant] ?? variantStyles.primary;

  // Caja (circulito)
  const radioClass = [
    "relative inline-flex items-center justify-center rounded-full",
    "border-2 transition-colors duration-150",
    "bg-white dark:bg-gray-800",
    // mostrar focus ring del input (peer)
    "peer-focus-visible:ring-2 peer-focus-visible:ring-offset-2",
    "peer-disabled:opacity-50 peer-disabled:cursor-not-allowed",
    s.box,
    checked ? v.checked : v.base,
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

  const descriptionId = description ? `${inputId}-desc` : undefined;
  const errorId = error ? `${inputId}-err` : undefined;
  const ariaDescribedBy =
    [descriptionId, errorId].filter(Boolean).join(" ") || undefined;

  const handleChange = (e) => {
    if (disabled) return;
    onChange?.(value, e);
  };

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-start gap-2">
        <div className="relative">
          <input
            type="radio"
            id={inputId}
            name={name ?? "radio-group"}
            value={value}
            checked={checked}
            disabled={disabled}
            onChange={handleChange}
            className="peer sr-only"
            role="radio"
            aria-checked={!!checked}
            aria-invalid={!!error}
            aria-describedby={ariaDescribedBy}
            {...props}
          />
          <label htmlFor={inputId} className={radioClass}>
            {/* Puntito */}
            <span
              className={[
                "rounded-full transition-transform duration-150",
                s.dot,
                v.dot,
                checked ? "scale-100 opacity-100" : "scale-0 opacity-0",
              ].join(" ")}
            />
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

export default Radio;
