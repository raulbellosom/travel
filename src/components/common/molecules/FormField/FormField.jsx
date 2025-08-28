import React from "react";

/**
 * FormField component that wraps form controls with label, helper text, and error states.
 * Provides consistent spacing, accessibility, and theming for form elements.
 */
const FormField = ({
  label,
  helperText,
  error,
  success,
  required = false,
  disabled = false,
  density = "comfortable",
  className = "",
  children,
  id,
  ...props
}) => {
  // Generate unique ID if not provided
  const fieldId = id || `field-${Math.random().toString(36).substr(2, 9)}`;
  const helperTextId = `${fieldId}-helper`;
  const errorId = `${fieldId}-error`;

  // Determine state
  const hasError = Boolean(error);
  const hasSuccess = Boolean(success) && !hasError;

  // Density styles
  const densityStyles = {
    comfortable: "space-y-2",
    compact: "space-y-1",
  };

  const safeDensity = densityStyles[density] ? density : "comfortable";

  // Label styles
  const labelStyles = [
    "block text-sm font-medium",
    density === "compact" ? "mb-1" : "mb-2",
    hasError
      ? "text-red-700 dark:text-red-400"
      : "text-gray-700 dark:text-gray-300",
    disabled ? "opacity-50" : "",
  ].join(" ");

  // Helper text styles
  const helperTextStyles = [
    "text-sm",
    hasError
      ? "text-red-600 dark:text-red-400"
      : hasSuccess
      ? "text-green-600 dark:text-green-400"
      : "text-gray-500 dark:text-gray-400",
  ].join(" ");

  // Error text styles
  const errorStyles = ["text-sm text-red-600 dark:text-red-400"].join(" ");

  return (
    <div className={`w-full ${safeDensity} ${className}`} {...props}>
      {/* Label */}
      {label && (
        <label htmlFor={fieldId} className={labelStyles}>
          {label}
          {required && (
            <span className="text-red-500 ml-1" aria-label="required">
              *
            </span>
          )}
        </label>
      )}

      {/* Control */}
      <div>
        {React.cloneElement(children, {
          id: fieldId,
          "aria-describedby":
            [
              helperText ? helperTextId : undefined,
              hasError ? errorId : undefined,
            ]
              .filter(Boolean)
              .join(" ") || undefined,
          "aria-invalid": hasError,
          required,
          disabled,
        })}
      </div>

      {/* Helper Text */}
      {helperText && !hasError && (
        <p id={helperTextId} className={helperTextStyles}>
          {helperText}
        </p>
      )}

      {/* Error Message */}
      {hasError && (
        <p id={errorId} className={errorStyles} role="alert">
          {error}
        </p>
      )}
    </div>
  );
};

export default FormField;
