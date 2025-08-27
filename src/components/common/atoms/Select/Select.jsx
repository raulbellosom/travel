import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";

/**
 * Select component with dropdown functionality, keyboard navigation, and accessibility.
 * Supports icons, descriptions, and segmented variants.
 */
const Select = React.forwardRef(
  (
    {
      label,
      placeholder = "Select an option...",
      value,
      onChange,
      options = [],
      disabled = false,
      required = false,
      error,
      success,
      helperText,
      size = "md",
      variant = "outlined",
      className = "",
      id,
      name,
      "aria-describedby": ariaDescribedBy,
      ...props
    },
    ref
  ) => {
    const [isOpen, setIsOpen] = useState(false);
    const [activeIndex, setActiveIndex] = useState(-1);
    const [internalValue, setInternalValue] = useState(value || "");

    const selectRef = useRef(null);
    const listRef = useRef(null);
    const optionRefs = useRef([]);

    // Generate unique ID if not provided
    const selectId = id || `select-${Math.random().toString(36).substr(2, 9)}`;
    const listboxId = `${selectId}-listbox`;
    const helperTextId = `${selectId}-helper`;
    const errorId = `${selectId}-error`;

    // Determine state
    const hasError = Boolean(error);
    const hasSuccess = Boolean(success) && !hasError;
    const selectedOption = options.find(
      (option) => option.value === (value !== undefined ? value : internalValue)
    );

    // Base styles
    const baseSelectStyles = [
      "relative w-full border transition-all duration-200 ease-in-out cursor-pointer",
      "focus:outline-none focus:ring-2 focus:ring-offset-1",
      "disabled:opacity-50 disabled:cursor-not-allowed",
    ];

    // Variant styles (matching TextInput)
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

    // Size styles (matching TextInput exactly)
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
      ? "border-red-500 focus:border-red-500 focus:ring-red-500 dark:border-red-400"
      : hasSuccess
      ? "border-green-500 focus:border-green-500 focus:ring-green-500 dark:border-green-400"
      : isOpen
      ? "border-blue-500 ring-2 ring-blue-500 dark:border-blue-400 dark:ring-blue-400"
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

    // Combine select styles
    const selectStyles = [
      ...baseSelectStyles,
      ...variantStyles[safeVariant],
      sizeStyles[safeSize],
      stateStyles,
      "text-gray-900 dark:text-white",
      className,
    ].join(" ");

    const handleToggle = () => {
      if (disabled) return;
      setIsOpen(!isOpen);
      setActiveIndex(-1);
    };

    const handleOptionSelect = (option) => {
      const newValue = option.value;
      setInternalValue(newValue);
      onChange?.(newValue, option);
      setIsOpen(false);
      setActiveIndex(-1);

      // Focus back to the select button
      selectRef.current?.focus();
    };

    const handleKeyDown = (e) => {
      if (disabled) return;

      switch (e.key) {
        case "Enter":
        case " ":
          e.preventDefault();
          if (!isOpen) {
            setIsOpen(true);
          } else if (activeIndex >= 0) {
            handleOptionSelect(options[activeIndex]);
          }
          break;

        case "Escape":
          if (isOpen) {
            e.preventDefault();
            setIsOpen(false);
            setActiveIndex(-1);
          }
          break;

        case "ArrowDown":
          e.preventDefault();
          if (!isOpen) {
            setIsOpen(true);
          } else {
            setActiveIndex((prev) => (prev + 1) % options.length);
          }
          break;

        case "ArrowUp":
          e.preventDefault();
          if (!isOpen) {
            setIsOpen(true);
          } else {
            setActiveIndex((prev) =>
              prev <= 0 ? options.length - 1 : prev - 1
            );
          }
          break;

        case "Home":
          if (isOpen) {
            e.preventDefault();
            setActiveIndex(0);
          }
          break;

        case "End":
          if (isOpen) {
            e.preventDefault();
            setActiveIndex(options.length - 1);
          }
          break;
      }
    };

    // Close dropdown when clicking outside
    useEffect(() => {
      const handleClickOutside = (event) => {
        if (selectRef.current && !selectRef.current.contains(event.target)) {
          setIsOpen(false);
          setActiveIndex(-1);
        }
      };

      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Scroll active option into view
    useEffect(() => {
      if (isOpen && activeIndex >= 0 && optionRefs.current[activeIndex]) {
        optionRefs.current[activeIndex].scrollIntoView({
          block: "nearest",
          behavior: "smooth",
        });
      }
    }, [activeIndex, isOpen]);

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={selectId} className={labelStyles}>
            {label}
            {required && (
              <span className="text-red-500 ml-1" aria-label="required">
                *
              </span>
            )}
          </label>
        )}

        <div ref={selectRef} className="relative">
          <button
            ref={ref}
            id={selectId}
            name={name}
            type="button"
            className={selectStyles}
            disabled={disabled}
            onClick={handleToggle}
            onKeyDown={handleKeyDown}
            aria-haspopup="listbox"
            aria-expanded={isOpen}
            aria-labelledby={label ? undefined : selectId}
            aria-describedby={
              [
                ariaDescribedBy,
                helperText ? helperTextId : null,
                error ? errorId : null,
              ]
                .filter(Boolean)
                .join(" ") || undefined
            }
            aria-invalid={hasError}
            {...props}
          >
            <span className="flex items-center justify-between w-full">
              <span className="flex items-center gap-2">
                {selectedOption?.icon && (
                  <selectedOption.icon
                    className="w-5 h-5 text-gray-400"
                    aria-hidden="true"
                  />
                )}
                <span
                  className={
                    selectedOption
                      ? "text-gray-900 dark:text-white"
                      : "text-gray-500 dark:text-gray-400"
                  }
                >
                  {selectedOption ? selectedOption.label : placeholder}
                </span>
              </span>
              <motion.svg
                className="w-5 h-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                animate={{ rotate: isOpen ? 180 : 0 }}
                transition={{ duration: 0.2 }}
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </motion.svg>
            </span>
          </button>

          <AnimatePresence>
            {isOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-auto"
              >
                <ul
                  ref={listRef}
                  id={listboxId}
                  role="listbox"
                  aria-labelledby={selectId}
                  className="py-1"
                >
                  {options.map((option, index) => {
                    const isActive = index === activeIndex;
                    const isSelected =
                      option.value ===
                      (value !== undefined ? value : internalValue);

                    return (
                      <li
                        key={option.value}
                        ref={(el) => (optionRefs.current[index] = el)}
                        role="option"
                        aria-selected={isSelected}
                        className={[
                          "px-4 py-2 cursor-pointer flex items-center gap-2 transition-colors duration-150",
                          isActive ? "bg-blue-100 dark:bg-blue-900" : "",
                          isSelected
                            ? "bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400"
                            : "text-gray-900 dark:text-white",
                          "hover:bg-gray-100 dark:hover:bg-gray-700",
                        ].join(" ")}
                        onClick={() => handleOptionSelect(option)}
                        onMouseEnter={() => setActiveIndex(index)}
                      >
                        {option.icon && (
                          <option.icon
                            className="w-5 h-5 text-gray-400"
                            aria-hidden="true"
                          />
                        )}
                        <div className="flex-1">
                          <div className="font-medium">{option.label}</div>
                          {option.description && (
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {option.description}
                            </div>
                          )}
                        </div>
                        {isSelected && (
                          <svg
                            className="w-5 h-5 text-blue-600 dark:text-blue-400"
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
                      </li>
                    );
                  })}
                </ul>
              </motion.div>
            )}
          </AnimatePresence>
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

Select.displayName = "Select";

export default Select;
