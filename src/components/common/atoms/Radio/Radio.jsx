import React from "react";

/**
 * Radio component for single selection from a group.
 * Accessible and theme-aware.
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
  // Size styles
  const sizeStyles = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6",
  };

  // Dot size styles
  const dotSizeStyles = {
    sm: "w-2 h-2",
    md: "w-2.5 h-2.5",
    lg: "w-3 h-3",
  };

  // Variant styles
  const variantStyles = {
    primary: {
      base: "border-gray-300 dark:border-gray-600",
      checked: "border-blue-500 dark:border-blue-600",
      dot: "bg-blue-500 dark:bg-blue-600",
      focus: "ring-blue-500/20 dark:ring-blue-400/20",
    },
    secondary: {
      base: "border-gray-300 dark:border-gray-600",
      checked: "border-gray-500 dark:border-gray-400",
      dot: "bg-gray-500 dark:bg-gray-400",
      focus: "ring-gray-500/20 dark:ring-gray-400/20",
    },
    success: {
      base: "border-gray-300 dark:border-gray-600",
      checked: "border-green-500 dark:border-green-600",
      dot: "bg-green-500 dark:bg-green-600",
      focus: "ring-green-500/20 dark:ring-green-400/20",
    },
    warning: {
      base: "border-gray-300 dark:border-gray-600",
      checked: "border-yellow-500 dark:border-yellow-600",
      dot: "bg-yellow-500 dark:bg-yellow-600",
      focus: "ring-yellow-500/20 dark:ring-yellow-400/20",
    },
    danger: {
      base: "border-gray-300 dark:border-gray-600",
      checked: "border-red-500 dark:border-red-600",
      dot: "bg-red-500 dark:bg-red-600",
      focus: "ring-red-500/20 dark:ring-red-400/20",
    },
  };

  const safeSize = sizeStyles[size] ? size : "md";
  const safeVariant = variantStyles[variant] ? variant : "primary";
  const currentVariant = variantStyles[safeVariant];

  // Radio styles
  const radioStyles = [
    "relative inline-flex items-center justify-center",
    "border-2 rounded-full transition-all duration-200",
    "focus:outline-none focus:ring-2 focus:ring-offset-2",
    "disabled:opacity-50 disabled:cursor-not-allowed",
    "cursor-pointer bg-white dark:bg-gray-800",
    sizeStyles[safeSize],
    checked ? currentVariant.checked : currentVariant.base,
    `focus:${currentVariant.focus}`,
    error && "border-red-500 dark:border-red-400",
    className,
  ].join(" ");

  // Label styles
  const labelStyles = [
    "text-sm font-medium cursor-pointer",
    disabled && "opacity-50 cursor-not-allowed",
    error
      ? "text-red-600 dark:text-red-400"
      : "text-gray-700 dark:text-gray-300",
  ].join(" ");

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-start gap-2">
        <div className="relative">
          <input
            type="radio"
            id={id}
            name={name}
            value={value}
            checked={checked}
            disabled={disabled}
            onChange={onChange}
            className="sr-only"
            {...props}
          />
          <label htmlFor={id} className={radioStyles}>
            {checked && (
              <span
                className={`
                rounded-full transition-all duration-200
                ${dotSizeStyles[safeSize]}
                ${currentVariant.dot}
              `}
              />
            )}
          </label>
        </div>

        {label && (
          <div className="flex-1">
            <label htmlFor={id} className={labelStyles}>
              {label}
            </label>
            {description && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {description}
              </p>
            )}
          </div>
        )}
      </div>

      {error && (
        <p className="text-xs text-red-600 dark:text-red-400 ml-7">{error}</p>
      )}
    </div>
  );
};

export default Radio;
