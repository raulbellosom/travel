import React, { useState, useEffect } from "react";
import { m } from "motion/react";

/**
 * CurrencyInput component with locale-aware formatting and validation.
 * Supports different currencies, min/max limits, and accessibility.
 */
const CurrencyInput = React.forwardRef(
  (
    {
      label,
      placeholder,
      value,
      onChange,
      onBlur,
      onFocus,
      currency = "USD",
      locale = "en-US",
      min = 0,
      max = 999999999,
      disabled = false,
      readOnly = false,
      required = false,
      error,
      success,
      helperText,
      size = "md",
      variant = "outlined",
      className = "",
      id,
      name,
      autoComplete,
      autoFocus: _autoFocus = false,
      "aria-describedby": _ariaDescribedBy,
      ...props
    },
    ref,
  ) => {
    const [focused, setFocused] = useState(false);
    const [internalValue, setInternalValue] = useState(value ?? "");
    const [displayValue, setDisplayValue] = useState("");

    // Generate unique ID if not provided
    const inputId =
      id || `currency-input-${Math.random().toString(36).substr(2, 9)}`;
    const helperTextId = `${inputId}-helper`;
    const errorId = `${inputId}-error`;

    // Determine state
    const hasError = Boolean(error);
    const hasSuccess = Boolean(success) && !hasError;
    // Currency formatter
    const formatter = new Intl.NumberFormat(locale, {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });

    // Parse numeric value from formatted string
    const parseValue = (formattedValue) => {
      if (
        formattedValue === "" ||
        formattedValue === null ||
        formattedValue === undefined
      ) {
        return null;
      }

      // Remove currency symbols and formatting
      const cleaned = formattedValue
        .replace(/[^\d.,-]/g, "") // Keep only digits, decimal separators, and minus
        .replace(/,/g, ".") // Convert commas to dots for parsing
        .replace(/\.+/g, "."); // Remove multiple dots

      if (!cleaned || cleaned === "-" || cleaned === "." || cleaned === "-.") {
        return null;
      }

      const num = Number(cleaned);
      return Number.isFinite(num) ? num : null;
    };

    // Format value for display
    const formatValue = (num) => {
      if (num === null || num === "" || num === undefined) return "";
      return formatter.format(num);
    };

    // Update display value when value changes
    useEffect(() => {
      if (focused) return;

      const currentValue = value !== undefined ? value : internalValue;
      const numericValue =
        typeof currentValue === "number"
          ? currentValue
          : parseValue(currentValue);

      if (numericValue === null) {
        setDisplayValue("");
        return;
      }

      setDisplayValue(formatValue(numericValue));
    }, [value, internalValue, currency, locale, focused]);

    // Handle input change
    const handleChange = (e) => {
      const inputValue = e.target.value;

      // Allow empty value or values that could be valid currency
      if (inputValue === "" || /^[\d.,\s-]+$/.test(inputValue)) {
        setDisplayValue(inputValue);

        if (inputValue === "") {
          setInternalValue("");
          onChange?.("");
          return;
        }

        const numericValue = parseValue(inputValue);
        if (numericValue === null) {
          setInternalValue("");
          onChange?.("");
          return;
        }

        const clampedValue = Math.max(min, Math.min(max, numericValue));
        setInternalValue(clampedValue);
        onChange?.(clampedValue);
      }
    };

    // Handle focus/blur
    const handleFocus = (e) => {
      setFocused(true);
      const currentValue = value !== undefined ? value : internalValue;
      if (
        currentValue !== "" &&
        currentValue !== null &&
        currentValue !== undefined
      ) {
        setDisplayValue(String(currentValue));
      }
      onFocus?.(e);
    };

    const handleBlur = (e) => {
      setFocused(false);

      const parsed = parseValue(displayValue);
      if (parsed === null) {
        setDisplayValue("");
        setInternalValue("");
        onChange?.("");
        onBlur?.(e);
        return;
      }

      const clamped = Math.max(min, Math.min(max, parsed));
      const formatted = formatValue(clamped);
      setDisplayValue(formatted);
      setInternalValue(clamped);
      onChange?.(clamped);
      onBlur?.(e);
    };

    // Base styles
    const baseInputStyles = [
      "w-full border transition-all duration-200 ease-in-out",
      "focus:outline-none focus:ring-2 focus:ring-offset-1",
      "disabled:opacity-50 disabled:cursor-not-allowed",
      "read-only:bg-gray-50 read-only:cursor-default",
      "dark:read-only:bg-gray-800",
      "text-right", // Right-align currency values
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
    ].join(" ");

    return (
      <div className={`w-full ${className}`}>
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

        <m.input
          ref={ref}
          id={inputId}
          name={name}
          type="text"
          inputMode="decimal"
          value={displayValue}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          disabled={disabled}
          readOnly={readOnly}
          required={required}
          autoComplete={autoComplete}
          aria-describedby={
            [
              helperText ? helperTextId : undefined,
              hasError ? errorId : undefined,
            ]
              .filter(Boolean)
              .join(" ") || undefined
          }
          aria-invalid={hasError}
          className={inputStyles}
          {...props}
        />

        {/* Helper Text */}
        {helperText && !hasError && (
          <p id={helperTextId} className={helperTextStyles}>
            {helperText}
          </p>
        )}

        {/* Error Message */}
        {hasError && (
          <p
            id={errorId}
            className="mt-1 text-sm text-red-600 dark:text-red-400"
            role="alert"
          >
            {error}
          </p>
        )}
      </div>
    );
  },
);

CurrencyInput.displayName = "CurrencyInput";

export default CurrencyInput;
