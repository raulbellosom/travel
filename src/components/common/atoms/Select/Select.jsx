import React, { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

/**
 * Select component with dropdown functionality, keyboard navigation, and accessibility.
 * Supports icons, descriptions, and segmented variants.
 *
 * NOTE: AnimatePresence was removed intentionally — motion/react v12's PopChild
 * passes `ref` as a regular prop which triggers a React 18.3 deprecation warning.
 * CSS transitions provide the same enter/exit animation without the warning.
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
    ref,
  ) => {
    const [isOpen, setIsOpen] = useState(false);
    const [shouldRender, setShouldRender] = useState(false);
    const [activeIndex, setActiveIndex] = useState(-1);
    const [internalValue, setInternalValue] = useState(value ?? "");
    const [openDirection, setOpenDirection] = useState("down");
    const [dropdownLayout, setDropdownLayout] = useState({
      left: 0,
      top: 0,
      width: 0,
      maxHeight: 288,
    });

    const selectRef = useRef(null);
    const dropdownRef = useRef(null);
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
      (option) =>
        option.value === (value !== undefined ? value : internalValue),
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
      xs: "min-h-8 px-2 py-1 text-xs rounded-md",
      sm: "min-h-9 px-3 py-1.5 text-sm rounded-lg",
      md: "min-h-11 px-3 py-2 text-sm rounded-xl",
      lg: "min-h-12 px-4 py-3 text-base rounded-xl",
      xl: "min-h-14 px-5 py-4 text-lg rounded-2xl",
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

    const updateDropdownLayout = useCallback(() => {
      if (typeof window === "undefined") return;
      const triggerRect = selectRef.current?.getBoundingClientRect();
      if (!triggerRect) {
        setOpenDirection("down");
        return;
      }

      const visibleOptions = Math.max(1, Math.min(options.length, 7));
      const preferredMenuHeight = visibleOptions * 40 + 16;
      const viewportHeight = window.innerHeight;
      const viewportWidth = window.innerWidth;
      const safeOffset = 12;
      const spaceBelow = viewportHeight - triggerRect.bottom - safeOffset;
      const spaceAbove = triggerRect.top - safeOffset;
      const nextDirection =
        spaceBelow < preferredMenuHeight && spaceAbove > spaceBelow
          ? "up"
          : "down";

      const availableHeight =
        nextDirection === "up"
          ? Math.max(80, spaceAbove - 8)
          : Math.max(80, spaceBelow - 8);

      const nextMaxHeight = Math.min(320, availableHeight);
      const renderedHeight = Math.min(nextMaxHeight, preferredMenuHeight);
      const width = Math.max(140, triggerRect.width);
      const left = Math.max(
        safeOffset,
        Math.min(triggerRect.left, viewportWidth - width - safeOffset),
      );
      const top =
        nextDirection === "up"
          ? Math.max(safeOffset, triggerRect.top - renderedHeight - 6)
          : Math.min(
              triggerRect.bottom + 6,
              viewportHeight - renderedHeight - safeOffset,
            );

      setOpenDirection(nextDirection);
      setDropdownLayout({
        left,
        top,
        width,
        maxHeight: nextMaxHeight,
      });
    }, [options.length]);

    const handleToggle = () => {
      if (disabled) return;
      if (!isOpen) {
        updateDropdownLayout();
        setShouldRender(true);
      }
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
            updateDropdownLayout();
            setShouldRender(true);
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
            updateDropdownLayout();
            setShouldRender(true);
            setIsOpen(true);
          } else {
            setActiveIndex((prev) => (prev + 1) % options.length);
          }
          break;

        case "ArrowUp":
          e.preventDefault();
          if (!isOpen) {
            updateDropdownLayout();
            setShouldRender(true);
            setIsOpen(true);
          } else {
            setActiveIndex((prev) =>
              prev <= 0 ? options.length - 1 : prev - 1,
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
        const target = event.target;
        const isTriggerClick = selectRef.current?.contains(target);
        const isMenuClick = dropdownRef.current?.contains(target);
        if (isTriggerClick || isMenuClick) return;
        setIsOpen(false);
        setActiveIndex(-1);
      };

      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
        document.removeEventListener("touchstart", handleClickOutside);
      };
    }, []);

    useEffect(() => {
      if (!isOpen) return;

      const recalculatePosition = () => updateDropdownLayout();
      window.addEventListener("resize", recalculatePosition);
      window.addEventListener("scroll", recalculatePosition, true);

      return () => {
        window.removeEventListener("resize", recalculatePosition);
        window.removeEventListener("scroll", recalculatePosition, true);
      };
    }, [isOpen, updateDropdownLayout]);

    // Scroll active option into view
    useEffect(() => {
      if (isOpen && activeIndex >= 0 && optionRefs.current[activeIndex]) {
        optionRefs.current[activeIndex].scrollIntoView({
          block: "nearest",
          behavior: "smooth",
        });
      }
    }, [activeIndex, isOpen]);

    // Unmount dropdown after exit transition ends
    const handleTransitionEnd = useCallback(() => {
      if (!isOpen) setShouldRender(false);
    }, [isOpen]);

    // Ensure shouldRender is true when isOpen becomes true
    useEffect(() => {
      if (isOpen) setShouldRender(true);
    }, [isOpen]);

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
            <span className="flex items-center justify-between w-full gap-2">
              <span className="flex min-w-0 flex-1 items-center gap-2">
                {selectedOption?.icon && (
                  <selectedOption.icon
                    className="w-5 h-5 text-gray-400"
                    aria-hidden="true"
                  />
                )}
                <span
                  className={
                    selectedOption
                      ? "truncate whitespace-nowrap text-left text-gray-900 dark:text-white"
                      : "truncate whitespace-nowrap text-left text-gray-500 dark:text-gray-400"
                  }
                >
                  {selectedOption ? selectedOption.label : placeholder}
                </span>
              </span>
              <svg
                className="w-5 h-5 text-gray-400 transition-transform duration-200"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                style={{
                  transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                }}
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </span>
          </button>

          {typeof document !== "undefined" && shouldRender
            ? createPortal(
                <div
                  ref={dropdownRef}
                  onTransitionEnd={handleTransitionEnd}
                  className="fixed z-120 overflow-hidden rounded-xl border border-slate-300 bg-white shadow-xl dark:border-slate-600 dark:bg-slate-800"
                  style={{
                    left: `${dropdownLayout.left}px`,
                    top: `${dropdownLayout.top}px`,
                    width: `${dropdownLayout.width}px`,
                    transformOrigin:
                      openDirection === "down" ? "top center" : "bottom center",
                    opacity: isOpen ? 1 : 0,
                    transform: isOpen
                      ? "translateY(0) scale(1)"
                      : `translateY(${openDirection === "down" ? "-8px" : "8px"}) scale(0.98)`,
                    transition:
                      "opacity 0.18s ease-out, transform 0.18s ease-out",
                    pointerEvents: isOpen ? "auto" : "none",
                  }}
                >
                  <ul
                    ref={listRef}
                    id={listboxId}
                    role="listbox"
                    aria-labelledby={selectId}
                    className="overflow-auto py-1"
                    style={{ maxHeight: `${dropdownLayout.maxHeight}px` }}
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
                            "flex cursor-pointer items-center gap-2 px-3 py-2 text-sm transition-colors duration-150",
                            isActive
                              ? "bg-cyan-100/70 dark:bg-cyan-900/40"
                              : "",
                            isSelected
                              ? "bg-cyan-50 text-cyan-700 dark:bg-cyan-900/50 dark:text-cyan-200"
                              : "text-slate-800 dark:text-slate-100",
                            "hover:bg-slate-100 dark:hover:bg-slate-700",
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
                              <div className="text-xs text-slate-500 dark:text-slate-300">
                                {option.description}
                              </div>
                            )}
                          </div>
                          {isSelected && (
                            <svg
                              className="h-4 w-4 text-cyan-600 dark:text-cyan-300"
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
                </div>,
                document.body,
              )
            : null}
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
  },
);

Select.displayName = "Select";

export default Select;
