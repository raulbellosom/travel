import React from "react";
import { motion } from "motion/react";

/**
 * Button component with multiple variants, sizes, and states.
 * Supports accessibility, theming, and internationalization.
 */
const Button = React.forwardRef(
  (
    {
      children,
      variant = "primary",
      size = "md",
      disabled = false,
      loading = false,
      leftIcon: LeftIcon,
      rightIcon: RightIcon,
      className = "",
      onClick,
      type = "button",
      ariaLabel,
      ariaDescribedBy,
      ...props
    },
    ref
  ) => {
    // Base styles
    const baseStyles = [
      "inline-flex items-center justify-center gap-2",
      "font-medium text-center whitespace-nowrap",
      "transition-all duration-200 ease-in-out",
      "focus:outline-none focus:ring-2 focus:ring-offset-2",
      "disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none",
      "select-none",
    ];

    // Variant styles
    const variantStyles = {
      primary: [
        "bg-brand-gradient text-white shadow-md",
        "hover:shadow-lg hover:scale-[1.02]",
        "focus:ring-blue-500",
        "active:scale-[0.98]",
      ],
      secondary: [
        "bg-white text-gray-900 border border-gray-300 shadow-sm",
        "hover:bg-gray-50 hover:border-gray-400",
        "focus:ring-blue-500",
        "dark:bg-gray-800 dark:text-white dark:border-gray-600",
        "dark:hover:bg-gray-700 dark:hover:border-gray-500",
      ],
      outline: [
        "bg-transparent text-brand-600 border border-brand-300 shadow-sm",
        "hover:bg-brand-50 hover:border-brand-400",
        "focus:ring-brand-500",
        "dark:text-brand-400 dark:border-brand-600",
        "dark:hover:bg-brand-900 dark:hover:border-brand-500",
      ],
      ghost: [
        "bg-transparent text-gray-700 border border-transparent",
        "hover:bg-gray-100 hover:text-gray-900",
        "focus:ring-blue-500",
        "dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white",
      ],
      success: [
        "bg-green-600 text-white shadow-md",
        "hover:bg-green-700 hover:shadow-lg",
        "focus:ring-green-500",
        "active:bg-green-800",
      ],
      warning: [
        "bg-amber-600 text-white shadow-md",
        "hover:bg-amber-700 hover:shadow-lg",
        "focus:ring-amber-500",
        "active:bg-amber-800",
      ],
      danger: [
        "bg-red-600 text-white shadow-md",
        "hover:bg-red-700 hover:shadow-lg",
        "focus:ring-red-500",
        "active:bg-red-800",
      ],
      tertiary: [
        "bg-transparent text-gray-700 border border-transparent",
        "hover:bg-gray-100 hover:text-gray-900",
        "focus:ring-blue-500",
        "dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white",
      ],
      destructive: [
        "bg-red-600 text-white shadow-md",
        "hover:bg-red-700 hover:shadow-lg",
        "focus:ring-red-500",
        "active:bg-red-800",
      ],
      link: [
        "bg-transparent text-blue-600 p-0 h-auto",
        "hover:text-blue-800 hover:underline",
        "focus:ring-blue-500",
        "dark:text-blue-400 dark:hover:text-blue-300",
      ],
      "icon-only": [
        "bg-transparent text-gray-600 border border-transparent p-2",
        "hover:bg-gray-100 hover:text-gray-900",
        "focus:ring-blue-500",
        "dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white",
      ],
    };

    // Validate variant exists, fallback to primary
    const safeVariant = variantStyles[variant] ? variant : "primary";

    // Size styles
    const sizeStyles = {
      xs: safeVariant === "link" ? "text-xs" : "px-2 py-1 text-xs rounded",
      sm: safeVariant === "link" ? "text-sm" : "px-3 py-1.5 text-sm rounded-md",
      md:
        safeVariant === "link" ? "text-base" : "px-4 py-2 text-base rounded-lg",
      lg: safeVariant === "link" ? "text-lg" : "px-6 py-3 text-lg rounded-xl",
      xl: safeVariant === "link" ? "text-xl" : "px-8 py-4 text-xl rounded-2xl",
    };

    // Validate size exists, fallback to md
    const safeSize = sizeStyles[size] ? size : "md";

    // Icon size based on button size
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

    const buttonContent = (
      <>
        {loading && (
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
        )}

        {!loading && LeftIcon && (
          <LeftIcon className={iconSize} aria-hidden="true" />
        )}

        {variant !== "icon-only" && (
          <span className={loading ? "opacity-0" : ""}>{children}</span>
        )}

        {!loading && RightIcon && (
          <RightIcon className={iconSize} aria-hidden="true" />
        )}
      </>
    );

    return (
      <motion.button
        ref={ref}
        type={type}
        className={buttonStyles}
        disabled={disabled || loading}
        onClick={handleClick}
        aria-label={
          ariaLabel || (variant === "icon-only" ? children : undefined)
        }
        aria-describedby={ariaDescribedBy}
        aria-busy={loading}
        whileTap={disabled || loading ? {} : { scale: 0.95 }}
        {...props}
      >
        {buttonContent}
      </motion.button>
    );
  }
);

Button.displayName = "Button";

export default Button;
