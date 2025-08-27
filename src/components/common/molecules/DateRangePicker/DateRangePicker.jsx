import React, { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, ChevronLeft, ChevronRight, X } from "lucide-react";
import { IconButton, Button } from "../../atoms";

/**
 * Enhanced DateRangePicker component with Airbnb-like behavior.
 * Features:
 * - Date range selection with improved UX
 * - Doesn't close on selection
 * - Clear button and day counter
 * - Third click resets selection
 * - Better spacing and layout
 */
const DateRangePicker = ({
  startDate = null,
  endDate = null,
  onDateChange,
  availableDates = [],
  pricing = {},
  disabledDates = [],
  minDate = new Date(),
  maxDate = null,
  numberOfMonths = 2,
  showPrices = true,
  className = "",
  placeholder = "Select dates",
  ...props
}) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [hoverDate, setHoverDate] = useState(null);
  const containerRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Helper functions
  const formatDate = (date) => {
    if (!date) return "";
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
    }).format(date);
  };

  const isSameDay = (date1, date2) => {
    if (!date1 || !date2) return false;
    return date1.toDateString() === date2.toDateString();
  };

  const isDateInRange = (date) => {
    if (!startDate || !endDate) return false;
    return date >= startDate && date <= endDate;
  };

  const isDateDisabled = (date) => {
    if (date < minDate) return true;
    if (maxDate && date > maxDate) return true;
    return disabledDates.some((disabled) => isSameDay(date, disabled));
  };

  const isDateAvailable = (date) => {
    if (availableDates.length === 0) return true;
    return availableDates.some((available) => isSameDay(date, available));
  };

  const getDatePrice = (date) => {
    const dateKey = date.toISOString().split("T")[0];
    return pricing[dateKey];
  };

  // Enhanced date selection logic (Airbnb-like)
  const handleDateClick = (date) => {
    if (isDateDisabled(date) || !isDateAvailable(date)) return;

    if (!startDate) {
      // First selection
      onDateChange?.({ startDate: date, endDate: null });
    } else if (!endDate) {
      if (isSameDay(date, startDate)) {
        // Clicking same start date - reset
        onDateChange?.({ startDate: null, endDate: null });
      } else if (date < startDate) {
        // New start date
        onDateChange?.({ startDate: date, endDate: null });
      } else {
        // Complete range
        onDateChange?.({ startDate, endDate: date });
      }
    } else {
      // Both dates selected - third click resets and starts new selection
      onDateChange?.({ startDate: date, endDate: null });
    }
  };

  // Calculate days between dates
  const getDaysBetween = () => {
    if (!startDate || !endDate) return 0;
    const timeDiff = Math.abs(endDate.getTime() - startDate.getTime());
    return Math.ceil(timeDiff / (1000 * 3600 * 24));
  };

  // Clear all dates
  const clearDates = () => {
    onDateChange?.({ startDate: null, endDate: null });
  };

  // Handle month navigation
  const navigateMonth = (direction) => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(currentMonth.getMonth() + direction);
    setCurrentMonth(newMonth);
  };

  // Generate calendar days
  const generateCalendarDays = (month) => {
    if (!month || typeof month.getFullYear !== "function") {
      return [];
    }

    const start = new Date(month.getFullYear(), month.getMonth(), 1);
    const end = new Date(month.getFullYear(), month.getMonth() + 1, 0);
    const startOfWeek = new Date(start);
    startOfWeek.setDate(start.getDate() - start.getDay());

    const days = [];
    const current = new Date(startOfWeek);

    while (current <= end || current.getDay() !== 0) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }

    return days;
  };

  // Calendar component
  const Calendar = ({ month }) => {
    if (!month || typeof month.getFullYear !== "function") {
      return (
        <div className="p-4 w-80">
          <div className="text-center text-gray-500">Loading calendar...</div>
        </div>
      );
    }

    const days = generateCalendarDays(month);
    const monthName = month.toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });

    return (
      <div className="p-6 w-80">
        {/* Month title */}
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 text-center">
            {monthName}
          </h3>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
            <div key={day} className="h-8 flex items-center justify-center">
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                {day}
              </span>
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1">
          {days.map((day, index) => {
            const isCurrentMonth = day.getMonth() === month.getMonth();
            const isSelected =
              isSameDay(day, startDate) || isSameDay(day, endDate);
            const isInRange = isDateInRange(day);
            const isDisabled = isDateDisabled(day);
            const isAvailable = isDateAvailable(day);
            const price = getDatePrice(day);

            return (
              <button
                key={index}
                onClick={() => handleDateClick(day)}
                onMouseEnter={() => setHoverDate(day)}
                onMouseLeave={() => setHoverDate(null)}
                disabled={isDisabled || !isAvailable}
                className={`
                  relative h-12 w-full flex flex-col items-center justify-center
                  text-sm transition-all duration-200 rounded-lg
                  ${
                    !isCurrentMonth
                      ? "text-gray-300 dark:text-gray-600"
                      : "text-gray-900 dark:text-gray-100"
                  }
                  ${
                    isSelected
                      ? "bg-blue-500 text-white shadow-md"
                      : isInRange
                      ? "bg-blue-100 dark:bg-blue-900/30 text-blue-900 dark:text-blue-100"
                      : "hover:bg-gray-100 dark:hover:bg-gray-700"
                  }
                  ${
                    isDisabled || !isAvailable
                      ? "opacity-25 cursor-not-allowed line-through"
                      : "cursor-pointer"
                  }
                `}
              >
                <span className="font-medium">{day.getDate()}</span>
                {showPrices && price && isCurrentMonth && !isDisabled && (
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    ${price}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  // Display selected dates
  const getDisplayText = () => {
    if (!startDate) return placeholder;
    if (!endDate) return formatDate(startDate);
    return `${formatDate(startDate)} - ${formatDate(endDate)}`;
  };

  return (
    <div ref={containerRef} className={`relative ${className}`} {...props}>
      {/* Input trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 text-left bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
      >
        <div className="flex items-center justify-between">
          <span
            className={
              startDate
                ? "text-gray-900 dark:text-gray-100"
                : "text-gray-500 dark:text-gray-400"
            }
          >
            {getDisplayText()}
          </span>
          <Calendar className="w-5 h-5 text-gray-400" />
        </div>
      </button>

      {/* Dropdown calendar */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className={`
              absolute top-full mt-2 z-50 left-0
              bg-white dark:bg-gray-800 
              border border-gray-200 dark:border-gray-700
              rounded-xl shadow-xl
              ${numberOfMonths === 1 ? "w-80" : "w-[680px]"}
            `}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {/* Header with navigation and controls */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-4">
                <IconButton
                  icon={ChevronLeft}
                  variant="ghost"
                  size="sm"
                  onClick={() => navigateMonth(-1)}
                />
                <div className="text-lg font-semibold text-gray-900 dark:text-gray-100 min-w-[200px] text-center">
                  {currentMonth.toLocaleDateString("en-US", {
                    month: "long",
                    year: "numeric",
                  })}
                  {numberOfMonths === 2 && (
                    <>
                      <span className="mx-2">-</span>
                      <span>
                        {new Date(
                          currentMonth.getFullYear(),
                          currentMonth.getMonth() + 1
                        ).toLocaleDateString("en-US", {
                          month: "long",
                          year: "numeric",
                        })}
                      </span>
                    </>
                  )}
                </div>
                <IconButton
                  icon={ChevronRight}
                  variant="ghost"
                  size="sm"
                  onClick={() => navigateMonth(1)}
                />
              </div>

              {/* Clear button and day counter */}
              <div className="flex items-center gap-4">
                {startDate && endDate && (
                  <span className="text-sm text-gray-600 dark:text-gray-400 font-medium px-3 py-1 bg-blue-50 dark:bg-blue-900/20 rounded-full">
                    {getDaysBetween()}{" "}
                    {getDaysBetween() === 1 ? "night" : "nights"}
                  </span>
                )}
                {(startDate || endDate) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearDates}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    Clear dates
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Calendars */}
            <div className="flex">
              <Calendar month={currentMonth} />
              {numberOfMonths === 2 && (
                <Calendar
                  month={
                    new Date(
                      currentMonth.getFullYear(),
                      currentMonth.getMonth() + 1
                    )
                  }
                />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DateRangePicker;
