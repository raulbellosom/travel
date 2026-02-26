import React, { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import { Minus, Plus } from "lucide-react";

/**
 * NumberInput component with stepper buttons, min/max limits, and accessibility.
 * Supports integers and decimals with customizable formatting.
 */
const NumberInput = React.forwardRef(
  (
    {
      label,
      placeholder,
      value,
      onChange,
      onBlur,
      onFocus,
      min = 0,
      max = 999999,
      step = 1,
      precision = 0, // Number of decimal places
      disabled = false,
      readOnly = false,
      required = false,
      error,
      success,
      helperText,
      size = "md",
      variant = "outlined",
      showStepper = true,
      className = "",
      id,
      name,
      autoComplete,
      autoFocus = false,
      "aria-describedby": ariaDescribedBy,
      ...props
    },
    ref
  ) => {
    const [focused, setFocused] = useState(false);
    const [inputValue, setInputValue] = useState("");

    // Generate unique ID if not provided
    const inputId =
      id || `number-input-${Math.random().toString(36).substr(2, 9)}`;
    const helperTextId = `${inputId}-helper`;
    const errorId = `${inputId}-error`;

    // Determine state
    const hasError = Boolean(error);
    const hasSuccess = Boolean(success) && !hasError;
    const parseNumber = (rawValue) => {
      if (
        rawValue === "" ||
        rawValue === null ||
        rawValue === undefined ||
        rawValue === "-" ||
        rawValue === "." ||
        rawValue === "-." ||
        rawValue === "," ||
        rawValue === "-,"
      ) {
        return null;
      }

      const normalized = String(rawValue).replace(",", ".");
      const parsed = Number(normalized);
      return Number.isFinite(parsed) ? parsed : null;
    };

    const formatValue = (rawValue) => {
      const parsed = parseNumber(rawValue);
      if (parsed === null) return "";
      return precision > 0 ? parsed.toFixed(precision) : String(parsed);
    };

    useEffect(() => {
      if (focused) return;
      setInputValue(formatValue(value));
    }, [value, precision, focused]);

    // Handle input change
    const handleChange = (e) => {
      const newValue = e.target.value;

      // Allow empty value or valid number patterns
      if (newValue === "" || /^-?\d*(?:[.,]\d*)?$/.test(newValue)) {
        setInputValue(newValue);
        onChange?.(newValue.replace(",", "."));
      }
    };

    // Handle stepper buttons
    const handleIncrement = () => {
      const current = parseNumber(inputValue) ?? Math.max(Number(min) || 0, 0);
      const newValue = Math.min(current + step, max);
      const formatted = formatValue(newValue);
      setInputValue(formatted);
      onChange?.(formatted);
    };

    const handleDecrement = () => {
      const current = parseNumber(inputValue) ?? Math.max(Number(min) || 0, 0);
      const newValue = Math.max(current - step, min);
      const formatted = formatValue(newValue);
      setInputValue(formatted);
      onChange?.(formatted);
    };

    // Handle focus/blur
    const handleFocus = (e) => {
      setFocused(true);
      onFocus?.(e);
    };

    const handleBlur = (e) => {
      setFocused(false);

      const parsed = parseNumber(inputValue);
      if (parsed === null) {
        setInputValue("");
        onChange?.("");
        onBlur?.(e);
        return;
      }

      const clamped = Math.max(min, Math.min(max, parsed));
      const formatted = formatValue(clamped);
      setInputValue(formatted);
      onChange?.(formatted);
      onBlur?.(e);
    };

    // Base styles - updated for integrated stepper
    const baseInputStyles = [
      "w-full border transition-all duration-200 ease-in-out",
      "focus:outline-none focus:ring-2 focus:ring-offset-1",
      "disabled:opacity-50 disabled:cursor-not-allowed",
      "read-only:bg-gray-50 read-only:cursor-default",
      "dark:read-only:bg-gray-800",
      "text-center font-medium", // Center text and make it more prominent
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

    // Size styles - adjusted for integrated stepper
    const sizeStyles = {
      xs: "px-8 py-1.5 text-sm rounded-lg", // Extra padding for buttons
      sm: "px-10 py-2 text-base rounded-lg",
      md: "px-12 py-2.5 text-base rounded-xl",
      lg: "px-14 py-3 text-lg rounded-xl",
      xl: "px-16 py-4 text-xl rounded-2xl",
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

    // Stepper button styles - enhanced for better integration
    const stepperButtonStyles = [
      "absolute flex items-center justify-center",
      "w-8 h-8 rounded-md text-gray-600 hover:text-gray-800 hover:bg-gray-100",
      "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 focus:rounded-md",
      "disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-gray-400",
      "dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-700",
      "transition-all duration-200 z-10 active:scale-95",
      "border border-transparent hover:border-gray-200 dark:hover:border-gray-600",
    ].join(" ");

    // Combine input styles - adjusted for integrated stepper
    const inputStyles = [
      ...baseInputStyles,
      ...variantStyles[safeVariant],
      sizeStyles[safeSize],
      stateStyles,
      showStepper ? "pl-10 pr-10" : "", // Add padding for integrated buttons
    ].join(" ");

    const currentValue = useMemo(() => {
      const parsed = parseNumber(inputValue);
      if (parsed !== null) return parsed;
      return Math.max(Number(min) || 0, 0);
    }, [inputValue, min]);

    const canIncrement = currentValue < max && !disabled && !readOnly;
    const canDecrement = currentValue > min && !disabled && !readOnly;

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

        <div className="relative">
          {/* Input with integrated stepper buttons */}
          <motion.input
            ref={ref}
            id={inputId}
            name={name}
            type="text"
            inputMode="decimal"
            value={inputValue}
            onChange={handleChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholder={placeholder}
            disabled={disabled}
            readOnly={readOnly}
            required={required}
            min={min}
            max={max}
            step={step}
            autoComplete={autoComplete}
            autoFocus={autoFocus}
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

          {/* Integrated Stepper Buttons */}
          {showStepper && (
            <>
              {/* Decrement Button - positioned on the left */}
              <button
                type="button"
                onClick={handleDecrement}
                disabled={!canDecrement}
                className={`${stepperButtonStyles} left-1 top-1/2 transform -translate-y-1/2`}
                aria-label="Decrease value"
              >
                <Minus className="w-4 h-4" />
              </button>

              {/* Increment Button - positioned on the right */}
              <button
                type="button"
                onClick={handleIncrement}
                disabled={!canIncrement}
                className={`${stepperButtonStyles} right-1 top-1/2 transform -translate-y-1/2`}
                aria-label="Increase value"
              >
                <Plus className="w-4 h-4" />
              </button>
            </>
          )}
        </div>

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
  }
);

NumberInput.displayName = "NumberInput";

export default NumberInput;
