import { useEffect, useId, useMemo, useRef, useState } from "react";

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
}) => {
  const inputId = useId();
  const listboxId = `${inputId}-listbox`;
  const containerRef = useRef(null);
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [activeIndex, setActiveIndex] = useState(-1);
  const [isUserTyping, setIsUserTyping] = useState(false);

  const selectedOption = useMemo(
    () => options.find((option) => option.value === value) || null,
    [options, value]
  );

  useEffect(() => {
    if (isUserTyping) return;
    setInputValue(selectedOption?.label || "");
  }, [isUserTyping, selectedOption]);

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
      .filter((option) => normalizeText(option.searchText).includes(normalizedQuery))
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

  const commitValue = (option) => {
    const nextValue = option?.value || "";
    const nextLabel = option?.label || "";

    if (nextValue !== value) {
      onChange?.(nextValue);
    }

    setIsUserTyping(false);
    setInputValue(nextLabel);
    setIsOpen(false);
    setActiveIndex(-1);
  };

  const resolveExactMatch = (text) => {
    const normalizedInput = normalizeText(text);
    if (!normalizedInput) return null;

    return (
      options.find((option) => normalizeText(option.label) === normalizedInput) || null
    );
  };

  const commitOrClearCurrentInput = () => {
    if (!inputValue.trim()) {
      commitValue(null);
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

    setIsOpen(true);
  };

  const handleBlur = () => {
    window.setTimeout(() => {
      if (containerRef.current?.contains(document.activeElement)) {
        return;
      }

      commitOrClearCurrentInput();
    }, 0);
  };

  const handleKeyDown = (event) => {
    if (disabled) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (!isOpen) {
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

  return (
    <div ref={containerRef} className="relative">
      <input
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
          isOpen && activeIndex >= 0 ? `${listboxId}-option-${activeIndex}` : undefined
        }
        onChange={handleInputChange}
        onFocus={() => setIsOpen(true)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
      />

      {isOpen ? (
        <div className="absolute z-30 mt-1 w-full overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900">
          {filteredOptions.length > 0 ? (
            <ul
              id={listboxId}
              role="listbox"
              className="max-h-64 overflow-y-auto py-1"
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
                    {option.label}
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="px-3 py-2 text-sm text-slate-500 dark:text-slate-400">
              {noResultsText}
            </p>
          )}
        </div>
      ) : null}
    </div>
  );
};

export default Combobox;
