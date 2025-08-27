import React, { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { IconButton } from "../../atoms";

/**
 * Advanced DateRangePicker component similar to Airbnb's calendar.
 * Features:
 * - Date range selection
 * - Availability calendar
 * - Price display per date
 * - Disabled dates
 * - Responsive design
 * - i18n support
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

  // Handle date selection (Airbnb-like behavior)
  const handleDateClick = (date) => {
    if (isDateDisabled(date) || !isDateAvailable(date)) return;

    if (!startDate || (startDate && endDate)) {
      // Start new selection or reset if both dates are selected
      onDateChange?.({ startDate: date, endDate: null });
    } else if (startDate && !endDate) {
      if (date < startDate) {
        // Selected date is before start date, make it the new start
        onDateChange?.({ startDate: date, endDate: null });
      } else if (isSameDay(date, startDate)) {
        // Clicking the same start date, reset
        onDateChange?.({ startDate: null, endDate: null });
      } else {
        // Complete the range
        onDateChange?.({ startDate, endDate: date });
      }
    }
    // Don't close automatically - let user continue selecting
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
    // Guard against undefined month
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
    // Guard against undefined month
    if (!month || typeof month.getFullYear !== "function") {
      return (
        <div className="p-4">
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
      <div className="p-4">
        {/* Month header */}
        <div className="flex items-center justify-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {monthName}
          </h3>
        </div>

        {/* Week headers */}
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
            const isInRange =
              isDateInRange(day) ||
              (startDate &&
                hoverDate &&
                !endDate &&
                day > startDate &&
                day <= hoverDate);
            const isDisabled = isDateDisabled(day) || !isDateAvailable(day);
            const price = getDatePrice(day);
            const isToday = isSameDay(day, new Date());

            return (
              <motion.button
                key={index}
                className={`
                  relative h-12 flex flex-col items-center justify-center
                  text-sm rounded-lg transition-all duration-150
                  ${!isCurrentMonth ? "text-gray-300 dark:text-gray-600" : ""}
                  ${
                    isDisabled
                      ? "text-gray-300 dark:text-gray-600 cursor-not-allowed"
                      : "hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                  }
                  ${
                    isSelected
                      ? "bg-brand-500 text-white"
                      : isInRange
                      ? "bg-brand-100 dark:bg-brand-900 text-brand-700 dark:text-brand-300"
                      : ""
                  }
                  ${isToday && !isSelected ? "ring-2 ring-brand-500" : ""}
                `}
                onClick={() => handleDateClick(day)}
                onMouseEnter={() => setHoverDate(day)}
                disabled={isDisabled}
                whileHover={{ scale: isDisabled ? 1 : 1.05 }}
                whileTap={{ scale: isDisabled ? 1 : 0.95 }}
              >
                <span
                  className={`font-medium ${isSelected ? "text-white" : ""}`}
                >
                  {day.getDate()}
                </span>
                {showPrices && price && isCurrentMonth && !isDisabled && (
                  <span
                    className={`text-xs ${
                      isSelected ? "text-white" : "text-gray-500"
                    }`}
                  >
                    ${price}
                  </span>
                )}
              </motion.button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div ref={containerRef} className={`relative ${className}`} {...props}>
      {/* Input trigger */}
      <button
        className={`
          w-full px-4 py-3 text-left border rounded-lg
          bg-white dark:bg-gray-800
          border-gray-300 dark:border-gray-600
          hover:border-brand-500 dark:hover:border-brand-400
          focus:outline-none focus:ring-2 focus:ring-brand-500/20
          transition-all duration-200
          ${isOpen ? "border-brand-500 dark:border-brand-400" : ""}
        `}
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-3">
          <Calendar className="w-5 h-5 text-gray-400" />
          <div className="flex-1">
            {startDate || endDate ? (
              <div className="flex items-center gap-2 text-sm">
                <span className="font-medium">
                  {startDate ? formatDate(startDate) : "Start"}
                </span>
                <span className="text-gray-400">→</span>
                <span className="font-medium">
                  {endDate ? formatDate(endDate) : "End"}
                </span>
              </div>
            ) : (
              <span className="text-gray-500">{placeholder}</span>
            )}
          </div>
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
              ${numberOfMonths === 1 ? "w-80" : "w-[720px]"}
            `}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {/* Navigation */}
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
                    <span className="mx-2">-</span>
                  )}
                  {numberOfMonths === 2 && (
                    <span>
                      {new Date(
                        currentMonth.getFullYear(),
                        currentMonth.getMonth() + 1
                      ).toLocaleDateString("en-US", {
                        month: "long",
                        year: "numeric",
                      })}
                    </span>
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
                  <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                    {getDaysBetween()} {getDaysBetween() === 1 ? 'night' : 'nights'}
                  </span>
                )}
                {(startDate || endDate) && (
                  <button
                    onClick={clearDates}
                    className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 underline"
                  >
                    Clear dates
                  </button>
                )}
              </div>
            </div>
                size="sm"
                onClick={() => navigateMonth(-1)}
              />

              <div className="flex items-center gap-2">
                {startDate && endDate && (
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24))}{" "}
                    nights
                  </div>
                )}
              </div>

              <IconButton
                icon={ChevronRight}
                variant="ghost"
                size="sm"
                onClick={() => navigateMonth(1)}
              />
            </div>

            {/* Calendars */}
            <div
              className={`flex ${
                numberOfMonths === 1
                  ? ""
                  : "divide-x divide-gray-200 dark:divide-gray-700"
              }`}
            >
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

            {/* Footer */}
            {(startDate || endDate) && (
              <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                  onClick={() => {
                    onDateChange?.({ startDate: null, endDate: null });
                    setHoverDate(null);
                  }}
                >
                  Clear dates
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DateRangePicker;
