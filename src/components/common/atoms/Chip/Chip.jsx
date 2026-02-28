import React from "react";
import { m } from "motion/react";
import { X } from "lucide-react";

/**
 * Chip component for tags, filters, and labels.
 * Supports selection states, icons, counters, and dismissible functionality.
 */
const Chip = React.forwardRef(
  (
    {
      label,
      value,
      selected = false,
      disabled = false,
      dismissible = false,
      onClick,
      onDismiss,
      icon: Icon,
      counter,
      size = "md",
      variant = "outlined",
      color = "default",
      className = "",
      id,
      ...props
    },
    ref
  ) => {
    // Generate unique ID if not provided
    const chipId = id || `chip-${Math.random().toString(36).substr(2, 9)}`;

    // Handle click
    const handleClick = (e) => {
      if (disabled) return;
      onClick?.(value || label, e);
    };

    // Handle dismiss
    const handleDismiss = (e) => {
      e.stopPropagation();
      onDismiss?.(value || label, e);
    };

    // Size styles
    const sizeStyles = {
      xs: "px-2 py-0.5 text-xs gap-1",
      sm: "px-2.5 py-1 text-sm gap-1.5",
      md: "px-3 py-1.5 text-sm gap-2",
      lg: "px-4 py-2 text-base gap-2.5",
    };

    const safeSize = sizeStyles[size] ? size : "md";

    // Icon sizes
    const iconSizes = {
      xs: "w-3 h-3",
      sm: "w-3 h-3",
      md: "w-4 h-4",
      lg: "w-5 h-5",
    };

    // Color variants
    const colorVariants = {
      default: {
        outlined: [
          "bg-white border-gray-300 text-gray-700",
          "hover:bg-gray-50 hover:border-gray-400",
          selected && "bg-blue-50 border-blue-500 text-blue-700",
          disabled && "opacity-50 cursor-not-allowed",
          "dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300",
          "dark:hover:bg-gray-700 dark:hover:border-gray-500",
          selected &&
            "dark:bg-blue-900/20 dark:border-blue-400 dark:text-blue-300",
        ]
          .filter(Boolean)
          .join(" "),
        filled: [
          "bg-gray-100 border-transparent text-gray-800",
          "hover:bg-gray-200",
          selected && "bg-blue-500 text-white",
          disabled && "opacity-50 cursor-not-allowed",
          "dark:bg-gray-700 dark:text-gray-200",
          "dark:hover:bg-gray-600",
          selected && "dark:bg-blue-500 dark:text-white",
        ]
          .filter(Boolean)
          .join(" "),
      },
      primary: {
        outlined: [
          "bg-white border-blue-300 text-blue-700",
          "hover:bg-blue-50 hover:border-blue-400",
          selected && "bg-blue-100 border-blue-500 text-blue-800",
          disabled && "opacity-50 cursor-not-allowed",
          "dark:bg-gray-800 dark:border-blue-600 dark:text-blue-300",
          "dark:hover:bg-gray-700 dark:hover:border-blue-500",
          selected &&
            "dark:bg-blue-900/30 dark:border-blue-400 dark:text-blue-200",
        ]
          .filter(Boolean)
          .join(" "),
        filled: [
          "bg-blue-500 border-transparent text-white",
          "hover:bg-blue-600",
          selected && "bg-blue-600",
          disabled && "opacity-50 cursor-not-allowed",
          "dark:bg-blue-500 dark:text-white",
          "dark:hover:bg-blue-600",
          selected && "dark:bg-blue-600",
        ]
          .filter(Boolean)
          .join(" "),
      },
      success: {
        outlined: [
          "bg-white border-green-300 text-green-700",
          "hover:bg-green-50 hover:border-green-400",
          selected && "bg-green-100 border-green-500 text-green-800",
          disabled && "opacity-50 cursor-not-allowed",
          "dark:bg-gray-800 dark:border-green-600 dark:text-green-300",
          "dark:hover:bg-gray-700 dark:hover:border-green-500",
          selected &&
            "dark:bg-green-900/30 dark:border-green-400 dark:text-green-200",
        ]
          .filter(Boolean)
          .join(" "),
        filled: [
          "bg-green-500 border-transparent text-white",
          "hover:bg-green-600",
          selected && "bg-green-600",
          disabled && "opacity-50 cursor-not-allowed",
          "dark:bg-green-500 dark:text-white",
          "dark:hover:bg-green-600",
          selected && "dark:bg-green-600",
        ]
          .filter(Boolean)
          .join(" "),
      },
      warning: {
        outlined: [
          "bg-white border-yellow-300 text-yellow-700",
          "hover:bg-yellow-50 hover:border-yellow-400",
          selected && "bg-yellow-100 border-yellow-500 text-yellow-800",
          disabled && "opacity-50 cursor-not-allowed",
          "dark:bg-gray-800 dark:border-yellow-600 dark:text-yellow-300",
          "dark:hover:bg-gray-700 dark:hover:border-yellow-500",
          selected &&
            "dark:bg-yellow-900/30 dark:border-yellow-400 dark:text-yellow-200",
        ]
          .filter(Boolean)
          .join(" "),
        filled: [
          "bg-yellow-500 border-transparent text-white",
          "hover:bg-yellow-600",
          selected && "bg-yellow-600",
          disabled && "opacity-50 cursor-not-allowed",
          "dark:bg-yellow-500 dark:text-white",
          "dark:hover:bg-yellow-600",
          selected && "dark:bg-yellow-600",
        ]
          .filter(Boolean)
          .join(" "),
      },
      danger: {
        outlined: [
          "bg-white border-red-300 text-red-700",
          "hover:bg-red-50 hover:border-red-400",
          selected && "bg-red-100 border-red-500 text-red-800",
          disabled && "opacity-50 cursor-not-allowed",
          "dark:bg-gray-800 dark:border-red-600 dark:text-red-300",
          "dark:hover:bg-gray-700 dark:hover:border-red-500",
          selected &&
            "dark:bg-red-900/30 dark:border-red-400 dark:text-red-200",
        ]
          .filter(Boolean)
          .join(" "),
        filled: [
          "bg-red-500 border-transparent text-white",
          "hover:bg-red-600",
          selected && "bg-red-600",
          disabled && "opacity-50 cursor-not-allowed",
          "dark:bg-red-500 dark:text-white",
          "dark:hover:bg-red-600",
          selected && "dark:bg-red-600",
        ]
          .filter(Boolean)
          .join(" "),
      },
    };

    const safeColor = colorVariants[color] ? color : "default";
    const safeVariant = variant === "filled" ? "filled" : "outlined";

    // Base styles
    const baseStyles = [
      "inline-flex items-center border rounded-full font-medium transition-all duration-200",
      "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1",
      onClick && !disabled && "cursor-pointer",
      disabled && "cursor-not-allowed",
    ].join(" ");

    // Combine styles
    const chipStyles = [
      baseStyles,
      sizeStyles[safeSize],
      colorVariants[safeColor][safeVariant],
      className,
    ].join(" ");

    return (
      <m.span
        ref={ref}
        id={chipId}
        className={chipStyles}
        onClick={handleClick}
        role={onClick ? "button" : undefined}
        tabIndex={onClick && !disabled ? 0 : undefined}
        aria-pressed={selected}
        aria-disabled={disabled}
        onKeyDown={(e) => {
          if (onClick && !disabled && (e.key === "Enter" || e.key === " ")) {
            e.preventDefault();
            handleClick(e);
          }
        }}
        {...props}
      >
        {/* Icon */}
        {Icon && <Icon className={iconSizes[safeSize]} aria-hidden="true" />}

        {/* Label */}
        <span className="font-medium">{label}</span>

        {/* Counter */}
        {counter !== undefined && (
          <span className="font-semibold opacity-80">{counter}</span>
        )}

        {/* Dismiss button */}
        {dismissible && (
          <button
            type="button"
            onClick={handleDismiss}
            className={`
              ml-1 flex items-center justify-center rounded-full
              hover:bg-black/10 dark:hover:bg-white/10
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1
              transition-colors duration-200
              ${iconSizes[size] || iconSizes.md}
            `}
            aria-label={`Remove ${label}`}
          >
            <X className={iconSizes[size] || iconSizes.md} />
          </button>
        )}
      </m.span>
    );
  }
);

Chip.displayName = "Chip";

export default Chip;
