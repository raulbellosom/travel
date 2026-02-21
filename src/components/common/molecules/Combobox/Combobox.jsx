import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";

const normalizeText = (value = "") =>
  String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

const Combobox = ({
  options = [],
  value = "",
  onChange,
  placeholder = "",
  noResultsText = "",
  required = false,
  disabled = false,
  inputClassName = "",
  maxResults = 12,
  keepOpenAfterSelect = false, // New prop for multi-select behavior
  renderOption = null, // Optional: (option, { isHighlighted, isSelected }) => ReactNode
}) => {
  const inputId = useId();
  const listboxId = `${inputId}-listbox`;
  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [activeIndex, setActiveIndex] = useState(-1);
  const [isUserTyping, setIsUserTyping] = useState(false);
  const [dropdownLayout, setDropdownLayout] = useState({
    left: 0,
    top: 0,
    width: 0,
    maxHeight: 256,
  });

  const selectedOption = useMemo(
    () => options.find((option) => option.value === value) || null,
    [options, value],
  );

  useEffect(() => {
    if (isUserTyping) return;
    // In multi-select mode (keepOpenAfterSelect), keep input empty for searching
    if (keepOpenAfterSelect) {
      setInputValue("");
      return;
    }
    // Show option label if found, otherwise show the raw value as fallback
    // (e.g. city name from geocoding that isn't in the country-state-city library)
    setInputValue(selectedOption?.label || value || "");
  }, [isUserTyping, keepOpenAfterSelect, selectedOption, value]);

  const filteredOptions = useMemo(() => {
    const normalizedQuery = normalizeText(inputValue);
    const optionsWithFallback = options.map((option) => ({
      ...option,
      searchText: option.searchText || option.label,
    }));

    if (!normalizedQuery) {
      return optionsWithFallback.slice(0, maxResults);
    }

    return optionsWithFallback
      .filter((option) =>
        normalizeText(option.searchText).includes(normalizedQuery),
      )
      .slice(0, maxResults);
  }, [inputValue, maxResults, options]);

  useEffect(() => {
    if (!isOpen) {
      setActiveIndex(-1);
      return;
    }

    if (filteredOptions.length === 0) {
      setActiveIndex(-1);
      return;
    }

    setActiveIndex((previous) => {
      if (previous < 0 || previous >= filteredOptions.length) return 0;
      return previous;
    });
  }, [filteredOptions, isOpen]);

  const updateDropdownLayout = useCallback(() => {
    if (typeof window === "undefined") return;
    const triggerRect = inputRef.current?.getBoundingClientRect();
    if (!triggerRect) return;

    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;
    const safeOffset = 12;
    const preferredMenuHeight =
      filteredOptions.length > 0
        ? Math.min(
            320,
            Math.max(44, Math.min(filteredOptions.length, 8) * 36 + 8),
          )
        : 52;
    const spaceBelow = viewportHeight - triggerRect.bottom - safeOffset;
    const spaceAbove = triggerRect.top - safeOffset;
    const openUp = spaceBelow < preferredMenuHeight && spaceAbove > spaceBelow;
    const availableHeight = Math.max(
      80,
      (openUp ? spaceAbove : spaceBelow) - 8,
    );
    const nextMaxHeight = Math.min(320, availableHeight);
    const renderedHeight = Math.min(nextMaxHeight, preferredMenuHeight);
    const width = Math.max(160, triggerRect.width);
    const left = Math.max(
      safeOffset,
      Math.min(triggerRect.left, viewportWidth - width - safeOffset),
    );
    const top = openUp
      ? Math.max(safeOffset, triggerRect.top - renderedHeight - 6)
      : Math.min(
          triggerRect.bottom + 6,
          viewportHeight - renderedHeight - safeOffset,
        );

    setDropdownLayout({
      left,
      top,
      width,
      maxHeight: nextMaxHeight,
    });
  }, [filteredOptions.length]);

  const commitValue = (option) => {
    const nextValue = option?.value || "";
    const nextLabel = option?.label || "";

    if (nextValue !== value) {
      onChange?.(nextValue);
    }

    if (keepOpenAfterSelect) {
      // For multi-select mode: clear input, stay open, keep focus
      setIsUserTyping(false);
      setInputValue("");
      setActiveIndex(-1);
      // Keep dropdown open and update layout
      updateDropdownLayout();
      inputRef.current?.focus();
    } else {
      // Default single-select mode: close and show selected
      setIsUserTyping(false);
      setInputValue(nextLabel);
      setIsOpen(false);
      setActiveIndex(-1);
    }
  };

  const resolveExactMatch = (text) => {
    const normalizedInput = normalizeText(text);
    if (!normalizedInput) return null;

    return (
      options.find(
        (option) => normalizeText(option.label) === normalizedInput,
      ) || null
    );
  };

  const commitOrClearCurrentInput = () => {
    if (!inputValue.trim()) {
      if (!keepOpenAfterSelect) {
        commitValue(null);
      }
      return;
    }

    if (keepOpenAfterSelect) {
      // In multi-select mode, just clear the input on blur
      setInputValue("");
      setIsUserTyping(false);
      return;
    }

    const exactMatch = resolveExactMatch(inputValue);
    if (exactMatch) {
      commitValue(exactMatch);
      return;
    }

    commitValue(null);
  };

  const handleInputChange = (event) => {
    const query = event.target.value;
    setIsUserTyping(true);
    setInputValue(query);

    if (value) {
      onChange?.("");
    }

    updateDropdownLayout();
    setIsOpen(true);
  };

  const handleBlur = () => {
    window.setTimeout(() => {
      if (containerRef.current?.contains(document.activeElement)) {
        return;
      }

      commitOrClearCurrentInput();
      setIsOpen(false);
      setActiveIndex(-1);
    }, 0);
  };

  const handleKeyDown = (event) => {
    if (disabled) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (!isOpen) {
        updateDropdownLayout();
        setIsOpen(true);
        return;
      }
      setActiveIndex((previous) => {
        if (filteredOptions.length === 0) return -1;
        return previous >= filteredOptions.length - 1 ? 0 : previous + 1;
      });
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      if (!isOpen) {
        updateDropdownLayout();
        setIsOpen(true);
        return;
      }
      setActiveIndex((previous) => {
        if (filteredOptions.length === 0) return -1;
        return previous <= 0 ? filteredOptions.length - 1 : previous - 1;
      });
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      if (!isOpen) {
        updateDropdownLayout();
        setIsOpen(true);
        return;
      }

      const highlightedOption = filteredOptions[activeIndex];
      if (highlightedOption) {
        commitValue(highlightedOption);
        return;
      }

      commitOrClearCurrentInput();
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      setIsOpen(false);
      setIsUserTyping(false);
      setInputValue(selectedOption?.label || "");
      setActiveIndex(-1);
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    updateDropdownLayout();

    const recalculatePosition = () => updateDropdownLayout();
    window.addEventListener("resize", recalculatePosition);
    window.addEventListener("scroll", recalculatePosition, true);

    return () => {
      window.removeEventListener("resize", recalculatePosition);
      window.removeEventListener("scroll", recalculatePosition, true);
    };
  }, [isOpen, updateDropdownLayout]);

  return (
    <div ref={containerRef} className="relative">
      <input
        ref={inputRef}
        role="combobox"
        id={inputId}
        type="text"
        value={inputValue}
        required={required}
        disabled={disabled}
        placeholder={placeholder}
        className={inputClassName}
        aria-autocomplete="list"
        aria-expanded={isOpen}
        aria-controls={listboxId}
        aria-activedescendant={
          isOpen && activeIndex >= 0
            ? `${listboxId}-option-${activeIndex}`
            : undefined
        }
        onChange={handleInputChange}
        onFocus={() => {
          updateDropdownLayout();
          setIsOpen(true);
        }}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
      />

      {isOpen && typeof document !== "undefined"
        ? createPortal(
            <div
              className="fixed z-[120] overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900"
              style={{
                left: `${dropdownLayout.left}px`,
                top: `${dropdownLayout.top}px`,
                width: `${dropdownLayout.width}px`,
              }}
            >
              {filteredOptions.length > 0 ? (
                <ul
                  id={listboxId}
                  role="listbox"
                  className="overflow-y-auto py-1"
                  style={{ maxHeight: `${dropdownLayout.maxHeight}px` }}
                >
                  {filteredOptions.map((option, index) => {
                    const isHighlighted = index === activeIndex;
                    const isSelected = option.value === value;

                    return (
                      <li
                        key={`${option.value}-${index}`}
                        id={`${listboxId}-option-${index}`}
                        role="option"
                        aria-selected={isSelected}
                        className={`cursor-pointer px-3 py-2 text-sm transition ${
                          isHighlighted
                            ? "bg-sky-50 text-sky-700 dark:bg-sky-900/30 dark:text-sky-100"
                            : "text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                        }`}
                        onMouseDown={(event) => {
                          event.preventDefault();
                          commitValue(option);
                        }}
                      >
                        {renderOption
                          ? renderOption(option, { isHighlighted, isSelected })
                          : option.label}
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="px-3 py-2 text-sm text-slate-500 dark:text-slate-400">
                  {noResultsText}
                </p>
              )}
            </div>,
            document.body,
          )
        : null}
    </div>
  );
};

export default Combobox;
