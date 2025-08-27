import React from "react";

/**
 * Enhanced Spinner component for loading states.
 * Supports multiple types, sizes and variants with better visual feedback.
 */
const Spinner = ({
  size = "md",
  variant = "primary",
  type = "circle",
  className = "",
  label = "Loading...",
  ...props
}) => {
  // Size styles
  const sizeStyles = {
    xs: "w-3 h-3",
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8",
    xl: "w-12 h-12",
  };

  // Variant styles with better contrast
  const variantStyles = {
    primary: "text-blue-600 dark:text-blue-400",
    secondary: "text-gray-600 dark:text-gray-400",
    success: "text-green-600 dark:text-green-400",
    warning: "text-amber-600 dark:text-amber-400",
    danger: "text-red-600 dark:text-red-400",
    white: "text-white",
    current: "text-current",
  };

  // Add validation for safe array access
  const safeSize = sizeStyles[size] ? size : "md";
  const safeVariant = variantStyles[variant] ? variant : "primary";

  // Different spinner types
  if (type === "dots") {
    return (
      <div
        className={`flex space-x-1 ${className}`}
        role="status"
        aria-label={label}
        {...props}
      >
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={`${sizeStyles[safeSize]} ${variantStyles[safeVariant]} bg-current rounded-full animate-bounce`}
            style={{
              animationDelay: `${i * 0.1}s`,
              animationDuration: "0.6s",
            }}
          />
        ))}
        <span className="sr-only">{label}</span>
      </div>
    );
  }

  if (type === "pulse") {
    return (
      <div
        className={`${sizeStyles[safeSize]} ${variantStyles[safeVariant]} bg-current rounded-full animate-pulse ${className}`}
        role="status"
        aria-label={label}
        style={{
          animationDuration: "1s",
          animationTimingFunction: "ease-in-out",
        }}
        {...props}
      >
        <span className="sr-only">{label}</span>
      </div>
    );
  }

  if (type === "bars") {
    return (
      <div
        className={`flex space-x-1 ${className}`}
        role="status"
        aria-label={label}
        {...props}
      >
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={`w-1 ${
              safeSize === "xs"
                ? "h-3"
                : safeSize === "sm"
                ? "h-4"
                : safeSize === "md"
                ? "h-6"
                : safeSize === "lg"
                ? "h-8"
                : "h-12"
            } ${variantStyles[safeVariant]} bg-current rounded-sm`}
            style={{
              animation: `spinnerBars 1.2s ease-in-out infinite`,
              animationDelay: `${i * 0.1}s`,
            }}
          />
        ))}
        <span className="sr-only">{label}</span>
      </div>
    );
  }

  // Circle spinner with much better visibility
  return (
    <div
      className={`inline-block animate-spin ${sizeStyles[safeSize]} ${className}`}
      role="status"
      aria-label={label}
      {...props}
    >
      <svg
        className="w-full h-full"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Background circle - very light */}
        <circle
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="2"
          className="opacity-20"
        />
        {/* Animated arc - much more visible */}
        <path
          d="M12 2 A10 10 0 0 1 22 12"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          className={`${variantStyles[safeVariant]} opacity-100 drop-shadow-sm`}
        />
      </svg>
      <span className="sr-only">{label}</span>
    </div>
  );
};

export default Spinner;
