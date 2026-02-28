import React from "react";
import { m } from "motion/react";

/**
 * IconButton component for actions with only an icon.
 * Includes tooltip support and accessibility features.
 */
const IconButton = React.forwardRef(
  (
    {
      icon: Icon,
      variant = "ghost",
      size = "md",
      disabled = false,
      loading = false,
      tooltip,
      ariaLabel,
      className = "",
      onClick,
      type = "button",
      ...props
    },
    ref
  ) => {
    // Base styles
    const baseStyles = [
      "inline-flex items-center justify-center",
      "font-medium text-center relative",
      "transition-all duration-200 ease-in-out",
      "focus:outline-none focus:ring-2 focus:ring-offset-2",
      "disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none",
      "select-none",
    ];

    // Variant styles
    const variantStyles = {
      primary: [
        "bg-blue-600 text-white shadow-md",
        "hover:bg-blue-700 hover:shadow-lg hover:scale-105",
        "focus:ring-blue-500",
        "active:scale-95",
      ],
      secondary: [
        "bg-white text-gray-700 border border-gray-300 shadow-sm",
        "hover:bg-gray-50 hover:border-gray-400",
        "focus:ring-blue-500",
        "dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600",
        "dark:hover:bg-gray-700 dark:hover:border-gray-500",
      ],
      success: [
        "bg-green-600 text-white shadow-md",
        "hover:bg-green-700 hover:shadow-lg hover:scale-105",
        "focus:ring-green-500",
        "active:scale-95",
      ],
      warning: [
        "bg-amber-600 text-white shadow-md",
        "hover:bg-amber-700 hover:shadow-lg hover:scale-105",
        "focus:ring-amber-500",
        "active:scale-95",
      ],
      danger: [
        "bg-red-600 text-white shadow-md",
        "hover:bg-red-700 hover:shadow-lg hover:scale-105",
        "focus:ring-red-500",
        "active:scale-95",
      ],
      ghost: [
        "bg-transparent text-gray-600 border border-transparent",
        "hover:bg-gray-100 hover:text-gray-900",
        "focus:ring-blue-500",
        "dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200",
      ],
      destructive: [
        "bg-red-600 text-white shadow-md",
        "hover:bg-red-700 hover:shadow-lg",
        "focus:ring-red-500",
        "active:bg-red-800",
      ],
    };

    // Validate variant exists, fallback to primary
    const safeVariant = variantStyles[variant] ? variant : "primary";

    // Size styles - square aspect ratio
    const sizeStyles = {
      xs: "w-6 h-6 p-1 rounded",
      sm: "w-8 h-8 p-1.5 rounded-md",
      md: "w-10 h-10 p-2 rounded-lg",
      lg: "w-12 h-12 p-2.5 rounded-xl",
      xl: "w-14 h-14 p-3 rounded-2xl",
    };

    // Validate size exists, fallback to md
    const safeSize = sizeStyles[size] ? size : "md";

    // Icon sizes
    const iconSizes = {
      xs: "w-3 h-3",
      sm: "w-4 h-4",
      md: "w-5 h-5",
      lg: "w-6 h-6",
      xl: "w-7 h-7",
    };

    // Combine all styles
    const buttonStyles = [
      ...baseStyles,
      ...variantStyles[safeVariant],
      sizeStyles[safeSize],
      className,
    ].join(" ");

    const iconSize = iconSizes[safeSize];

    const handleClick = (e) => {
      if (disabled || loading) {
        e.preventDefault();
        return;
      }
      onClick?.(e);
    };

    if (!Icon && !loading) {
      console.warn("IconButton: Either icon or loading state is required");
      return null;
    }

    return (
      <m.button
        ref={ref}
        type={type}
        className={buttonStyles}
        disabled={disabled || loading}
        onClick={handleClick}
        aria-label={ariaLabel}
        title={tooltip}
        aria-busy={loading}
        whileTap={disabled || loading ? {} : { scale: 0.95 }}
        whileHover={disabled || loading ? {} : { scale: 1.05 }}
        {...props}
      >
        {loading ? (
          <svg
            className={`animate-spin ${iconSize}`}
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        ) : (
          Icon && <Icon className={iconSize} aria-hidden="true" />
        )}
      </m.button>
    );
  }
);

IconButton.displayName = "IconButton";

export default IconButton;
