import React, { useState } from "react";
import { motion } from "motion/react";

/**
 * TextInput component with label, helper text, error states, and prefix/suffix support.
 * Fully accessible and responsive.
 */
const TextInput = React.forwardRef(
  (
    {
      label,
      placeholder,
      value,
      onChange,
      onBlur,
      onFocus,
      type = "text",
      disabled = false,
      readOnly = false,
      required = false,
      error,
      success,
      helperText,
      leftIcon: LeftIcon,
      rightIcon: RightIcon,
      prefix,
      suffix,
      size = "md",
      variant = "outlined",
      className = "",
      id,
      name,
      autoComplete,
      autoFocus = false,
      maxLength,
      minLength,
      pattern,
      "aria-describedby": ariaDescribedBy,
      ...props
    },
    ref
  ) => {
    const [focused, setFocused] = useState(false);
    const [internalValue, setInternalValue] = useState(value || "");

    // Generate unique ID if not provided
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
    const helperTextId = `${inputId}-helper`;
    const errorId = `${inputId}-error`;

    // Determine state
    const hasError = Boolean(error);
    const hasSuccess = Boolean(success) && !hasError;
    const hasValue = Boolean(internalValue || value);

    // Base styles
    const baseInputStyles = [
      "w-full border transition-all duration-200 ease-in-out",
      "focus:outline-none focus:ring-2 focus:ring-offset-1",
      "disabled:opacity-50 disabled:cursor-not-allowed",
      "read-only:bg-gray-50 read-only:cursor-default",
      "dark:read-only:bg-gray-800",
    ];

    // Variant styles
    const variantStyles = {
      outlined: [
        "bg-white border-gray-300",
        "hover:border-gray-400",
        "focus:border-blue-500 focus:ring-blue-500",
        "dark:bg-gray-800 dark:border-gray-600",
        "dark:hover:border-gray-500 dark:focus:border-blue-400",
      ],
      filled: [
        "bg-gray-50 border-transparent",
        "hover:bg-gray-100",
        "focus:bg-white focus:border-blue-500 focus:ring-blue-500",
        "dark:bg-gray-800 dark:hover:bg-gray-700",
        "dark:focus:bg-gray-800 dark:focus:border-blue-400",
      ],
    };

    // Validate variant exists, fallback to outlined
    const safeVariant = variantStyles[variant] ? variant : "outlined";

    // Size styles
    const sizeStyles = {
      xs: "px-2 py-1 text-xs rounded",
      sm: "px-3 py-1.5 text-sm rounded-md",
      md: "px-4 py-2 text-base rounded-lg",
      lg: "px-5 py-3 text-lg rounded-xl",
      xl: "px-6 py-4 text-xl rounded-2xl",
    };

    // Validate size exists, fallback to md
    const safeSize = sizeStyles[size] ? size : "md";

    // State styles
    const stateStyles = hasError
      ? "border-red-500 focus:border-red-500 focus:ring-red-500"
      : hasSuccess
      ? "border-green-500 focus:border-green-500 focus:ring-green-500"
      : "";

    // Icon sizes
    const iconSizes = {
      xs: "w-3 h-3",
      sm: "w-4 h-4",
      md: "w-5 h-5",
      lg: "w-6 h-6",
      xl: "w-7 h-7",
    };

    // Label styles
    const labelStyles = [
      "block text-sm font-medium mb-1",
      hasError
        ? "text-red-700 dark:text-red-400"
        : "text-gray-700 dark:text-gray-300",
      disabled ? "opacity-50" : "",
    ].join(" ");

    // Helper text styles
    const helperTextStyles = [
      "mt-1 text-sm",
      hasError
        ? "text-red-600 dark:text-red-400"
        : hasSuccess
        ? "text-green-600 dark:text-green-400"
        : "text-gray-500 dark:text-gray-400",
    ].join(" ");

    // Combine input styles
    const inputStyles = [
      ...baseInputStyles,
      ...variantStyles[safeVariant],
      sizeStyles[safeSize],
      stateStyles,
      LeftIcon || prefix ? "pl-10" : "",
      RightIcon || suffix ? "pr-10" : "",
      className,
    ].join(" ");

    const handleChange = (e) => {
      const newValue = e.target.value;
      setInternalValue(newValue);
      onChange?.(e);
    };

    const handleFocus = (e) => {
      setFocused(true);
      onFocus?.(e);
    };

    const handleBlur = (e) => {
      setFocused(false);
      onBlur?.(e);
    };

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className={labelStyles}>
            {label}
            {required && (
              <span className="text-red-500 ml-1" aria-label="required">
                *
              </span>
            )}
          </label>
        )}

        <div className="relative">
          {/* Left Icon or Prefix */}
          {(LeftIcon || prefix) && (
            <div className="absolute inset-y-0 left-0 flex items-center pl-3">
              {LeftIcon && (
                <LeftIcon
                  className={`${iconSizes[safeSize]} text-gray-400`}
                  aria-hidden="true"
                />
              )}
              {prefix && (
                <span className="text-gray-500 select-none">{prefix}</span>
              )}
            </div>
          )}

          <motion.input
            ref={ref}
            id={inputId}
            name={name}
            type={type}
            value={value !== undefined ? value : internalValue}
            onChange={handleChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholder={placeholder}
            disabled={disabled}
            readOnly={readOnly}
            required={required}
            autoComplete={autoComplete}
            autoFocus={autoFocus}
            maxLength={maxLength}
            minLength={minLength}
            pattern={pattern}
            className={inputStyles}
            aria-invalid={hasError}
            aria-describedby={
              [
                ariaDescribedBy,
                helperText ? helperTextId : null,
                error ? errorId : null,
              ]
                .filter(Boolean)
                .join(" ") || undefined
            }
            whileFocus={{ scale: 1.01 }}
            transition={{ duration: 0.2 }}
            {...props}
          />

          {/* Right Icon or Suffix */}
          {(RightIcon || suffix) && (
            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
              {suffix && (
                <span className="text-gray-500 select-none">{suffix}</span>
              )}
              {RightIcon && (
                <RightIcon
                  className={`${iconSizes[safeSize]} text-gray-400`}
                  aria-hidden="true"
                />
              )}
            </div>
          )}

          {/* Success/Error Icons */}
          {(hasSuccess || hasError) && !RightIcon && !suffix && (
            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
              {hasSuccess && (
                <svg
                  className={`${iconSizes[safeSize]} text-green-500`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              )}
              {hasError && (
                <svg
                  className={`${iconSizes[safeSize]} text-red-500`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              )}
            </div>
          )}
        </div>

        {/* Helper Text or Error Message */}
        {(helperText || error) && (
          <p
            id={error ? errorId : helperTextId}
            className={helperTextStyles}
            role={error ? "alert" : undefined}
          >
            {error || helperText}
          </p>
        )}
      </div>
    );
  }
);

TextInput.displayName = "TextInput";

export default TextInput;
