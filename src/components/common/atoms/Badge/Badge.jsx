import React from "react";

/**
 * Badge component for status indicators and labels.
 * Supports multiple variants, sizes, and icons.
 */
const Badge = ({
  children,
  variant = "info",
  size = "md",
  icon: Icon,
  className = "",
  ...props
}) => {
  // Base styles
  const baseStyles = [
    "inline-flex items-center gap-1.5 font-medium rounded-full",
    "transition-all duration-200 ease-in-out",
  ];

  // Variant styles
  const variantStyles = {
    primary: [
      "bg-brand-100 text-brand-800 border border-brand-200",
      "dark:bg-brand-900/50 dark:text-brand-300 dark:border-brand-800",
    ],
    secondary: [
      "bg-gray-100 text-gray-800 border border-gray-200",
      "dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700",
    ],
    info: [
      "bg-blue-100 text-blue-800 border border-blue-200",
      "dark:bg-blue-900/50 dark:text-blue-300 dark:border-blue-800",
    ],
    success: [
      "bg-green-100 text-green-800 border border-green-200",
      "dark:bg-green-900/50 dark:text-green-300 dark:border-green-800",
    ],
    warning: [
      "bg-amber-100 text-amber-800 border border-amber-200",
      "dark:bg-amber-900/50 dark:text-amber-300 dark:border-amber-800",
    ],
    danger: [
      "bg-red-100 text-red-800 border border-red-200",
      "dark:bg-red-900/50 dark:text-red-300 dark:border-red-800",
    ],
    outline: [
      "bg-transparent text-gray-700 border border-gray-300",
      "dark:text-gray-300 dark:border-gray-600",
    ],
    dot: [
      "bg-transparent text-gray-700 border-none pl-0",
      "dark:text-gray-300",
    ],
    brand: [
      "bg-blue-600 text-white border border-blue-600",
      "dark:bg-blue-500 dark:border-blue-500",
    ],
    premium: [
      "bg-gradient-to-r from-amber-400 to-orange-500 text-white border border-amber-400",
      "shadow-md",
    ],
    featured: [
      "bg-gradient-to-r from-purple-500 to-pink-500 text-white border border-purple-500",
      "shadow-md",
    ],
    neutral: [
      "bg-gray-100 text-gray-800 border border-gray-200",
      "dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700",
    ],
  };

  // Validate variant exists, fallback to info
  const safeVariant = variantStyles[variant] ? variant : "info";

  // Size styles
  const sizeStyles = {
    xs: "px-1.5 py-0.5 text-xs",
    sm: "px-2 py-0.5 text-xs",
    md: "px-2.5 py-1 text-sm",
    lg: "px-3 py-1.5 text-base",
    xl: "px-4 py-2 text-lg",
  };

  // Validate size exists, fallback to md
  const safeSize = sizeStyles[size] ? size : "md";

  // Icon sizes
  const iconSizes = {
    xs: "w-2.5 h-2.5",
    sm: "w-3 h-3",
    md: "w-4 h-4",
    lg: "w-5 h-5",
    xl: "w-6 h-6",
  };

  // Combine all styles
  const badgeStyles = [
    ...baseStyles,
    ...variantStyles[safeVariant],
    sizeStyles[safeSize],
    className,
  ].join(" ");

  const iconSize = iconSizes[safeSize];

  return (
    <span className={badgeStyles} {...props}>
      {Icon && <Icon className={iconSize} aria-hidden="true" />}
      {children}
    </span>
  );
};

export default Badge;
