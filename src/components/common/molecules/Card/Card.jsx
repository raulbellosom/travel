import React from "react";
import { m } from "framer-motion";
import clsx from "clsx";

/**
 * Card component - Basic container with shadow and rounded corners
 */
const Card = ({
  children,
  className = "",
  variant = "default",
  size = "md",
  hover = false,
  onClick,
  ...props
}) => {
  const variants = {
    default:
      "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700",
    elevated: "bg-white dark:bg-gray-800 shadow-lg",
    outlined:
      "bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600",
  };

  const sizes = {
    sm: "p-4",
    md: "p-6",
    lg: "p-8",
  };

  const baseStyles = [
    "rounded-lg",
    "transition-all",
    "duration-200",
    variants[variant],
    sizes[size],
  ];

  const hoverStyles = hover
    ? [
        "hover:shadow-lg",
        "hover:shadow-gray-200/50",
        "dark:hover:shadow-gray-900/50",
        "hover:-translate-y-1",
        "cursor-pointer",
      ]
    : [];

  const cardStyles = clsx([...baseStyles, ...hoverStyles, className]);

  const Component = onClick ? m.div : "div";

  return (
    <Component
      className={cardStyles}
      onClick={onClick}
      whileHover={onClick ? { y: -2 } : undefined}
      whileTap={onClick ? { scale: 0.98 } : undefined}
      {...props}
    >
      {children}
    </Component>
  );
};

export default Card;
