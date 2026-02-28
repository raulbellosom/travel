import React from "react";

/**
 * Toggle/Switch component for boolean states.
 * Accessible and theme-aware with smooth animations.
 */
const Toggle = ({
  id,
  name,
  checked = false,
  disabled = false,
  size = "md",
  variant = "primary",
  label,
  description,
  error,
  className = "",
  onChange, // (nextChecked:boolean, event?:ChangeEvent) => void
  ...props
}) => {
  const autoId = React.useId();
  const inputId = id ?? autoId;

  // Size styles
  const sizeStyles = {
    sm: { track: "w-8 h-4", thumb: "w-3 h-3", translate: "translate-x-4" },
    md: { track: "w-10 h-5", thumb: "w-4 h-4", translate: "translate-x-5" },
    lg: { track: "w-12 h-6", thumb: "w-5 h-5", translate: "translate-x-6" },
  };

  // Variant styles
  const variantStyles = {
    primary: {
      off: "bg-gray-200 dark:bg-gray-700",
      on: "bg-brand-500 dark:bg-brand-600",
      focus: "ring-brand-500/20 dark:ring-brand-400/20",
    },
    success: {
      off: "bg-gray-200 dark:bg-gray-700",
      on: "bg-green-500 dark:bg-green-600",
      focus: "ring-green-500/20 dark:ring-green-400/20",
    },
    warning: {
      off: "bg-gray-200 dark:bg-gray-700",
      on: "bg-amber-500 dark:bg-amber-600",
      focus: "ring-amber-500/20 dark:ring-amber-400/20",
    },
    danger: {
      off: "bg-gray-200 dark:bg-gray-700",
      on: "bg-red-500 dark:bg-red-600",
      focus: "ring-red-500/20 dark:ring-red-400/20",
    },
  };

  const currentSize = sizeStyles[size] ?? sizeStyles.md;
  const currentVariant = variantStyles[variant] ?? variantStyles.primary;

  // Track styles
  const trackStyles = [
    "relative inline-flex items-center rounded-full transition-all duration-200",
    "focus:outline-none focus:ring-2 focus:ring-offset-2",
    "disabled:opacity-50 disabled:cursor-not-allowed",
    "cursor-pointer",
    currentSize.track,
    checked ? currentVariant.on : currentVariant.off,
    `focus:${currentVariant.focus}`,
    error && "ring-2 ring-red-500/20 dark:ring-red-400/20",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  // Thumb styles
  const thumbStyles = [
    "inline-block rounded-full bg-white shadow-md transition-transform duration-200",
    currentSize.thumb,
    checked ? currentSize.translate : "translate-x-[2px]",
  ]
    .filter(Boolean)
    .join(" ");

  // Label styles
  const labelStyles = [
    "text-sm font-medium cursor-pointer",
    disabled && "opacity-50 cursor-not-allowed",
    error
      ? "text-red-600 dark:text-red-400"
      : "text-gray-700 dark:text-gray-300",
  ]
    .filter(Boolean)
    .join(" ");

  const handleChange = (e) => {
    if (disabled) return;
    const next = e.target.checked;
    onChange?.(next, e);
  };

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-start gap-3">
        <div className="relative">
          <label htmlFor={inputId} className={trackStyles}>
            <input
              type="checkbox"
              id={inputId}
              name={name ?? inputId}
              checked={checked}
              disabled={disabled}
              onChange={handleChange}
              className="sr-only"
              role="switch"
              aria-checked={checked}
              {...props}
            />
            <span className={thumbStyles} />
          </label>
        </div>

        {(label || description) && (
          <div className="flex-1">
            {label && (
              <label htmlFor={inputId} className={labelStyles}>
                {label}
              </label>
            )}
            {description && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {description}
              </p>
            )}
          </div>
        )}
      </div>

      {error && (
        <p className="text-xs text-red-600 dark:text-red-400 ml-12">{error}</p>
      )}
    </div>
  );
};

export default Toggle;
