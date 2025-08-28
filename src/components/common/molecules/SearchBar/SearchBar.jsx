import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Search, MapPin, Calendar, Users, X } from "lucide-react";
import { Button } from "../../atoms";
import DateRangePicker from "../DateRangePicker";

/**
 * SearchBar component with tabbed interface for different search types.
 * Supports location search, date range selection, guest selection, and responsive design.
 */
const SearchBar = ({
  onSearch,
  onTabChange,
  defaultTab = "rentals",
  className = "",
  collapsed = false,
  onToggleCollapse,
  ...props
}) => {
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [searchQuery, setSearchQuery] = useState("");
  const [guests, setGuests] = useState(1);
  const [dateRange, setDateRange] = useState(null);
  const [isExpanded, setIsExpanded] = useState(!collapsed);

  // Tab configuration
  const tabs = [
    { id: "rentals", label: "Rentals", icon: MapPin },
    { id: "real-estate", label: "Real Estate", icon: MapPin },
    { id: "services", label: "Services", icon: Users },
  ];

  // Handle tab change
  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    onTabChange?.(tabId);
  };

  // Handle search
  const handleSearch = () => {
    const searchData = {
      tab: activeTab,
      query: searchQuery,
      guests,
      dateRange,
    };
    onSearch?.(searchData);
  };

  // Handle mobile toggle
  const handleToggle = () => {
    setIsExpanded(!isExpanded);
    onToggleCollapse?.(!isExpanded);
  };

  // Guest options
  const guestOptions = Array.from({ length: 10 }, (_, i) => ({
    value: i + 1,
    label: `${i + 1} guest${i + 1 > 1 ? "s" : ""}`,
  }));

  return (
    <div className={`w-full ${className}`} {...props}>
      {/* Mobile Toggle Button */}
      <div className="md:hidden mb-4">
        <Button
          onClick={handleToggle}
          variant="outlined"
          className="w-full justify-center"
          leftIcon={isExpanded ? X : Search}
        >
          {isExpanded ? "Hide Search" : "Show Search"}
        </Button>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
              {/* Tabs */}
              <div className="flex space-x-1 mb-6 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;

                  return (
                    <button
                      key={tab.id}
                      onClick={() => handleTabChange(tab.id)}
                      className={`
                        flex-1 flex items-center justify-center px-4 py-2 rounded-md text-sm font-medium
                        transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500
                        ${
                          isActive
                            ? "bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-sm"
                            : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                        }
                      `}
                    >
                      <Icon className="w-4 h-4 mr-2" />
                      <span className="hidden sm:inline">{tab.label}</span>
                      <span className="sm:hidden">{tab.label.slice(0, 4)}</span>
                    </button>
                  );
                })}
              </div>

              {/* Search Form */}
              <div className="space-y-4">
                {/* Location Search */}
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder={`Search ${tabs
                      .find((t) => t.id === activeTab)
                      ?.label.toLowerCase()}...`}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="
                      w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600
                      rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                      placeholder-gray-500 dark:placeholder-gray-400
                      focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                      transition-colors duration-200
                    "
                  />
                </div>

                {/* Date Range and Guests Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Date Range */}
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 z-10" />
                    <DateRangePicker
                      value={dateRange}
                      onChange={setDateRange}
                      placeholder="Check-in / Check-out"
                      className="w-full"
                      inputClassName="
                        pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600
                        rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                        placeholder-gray-500 dark:placeholder-gray-400
                        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                        transition-colors duration-200
                      "
                    />
                  </div>

                  {/* Guests */}
                  <div className="relative">
                    <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 z-10" />
                    <select
                      value={guests}
                      onChange={(e) => setGuests(Number(e.target.value))}
                      className="
                        w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600
                        rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                        transition-colors duration-200 appearance-none
                      "
                    >
                      {guestOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    {/* Custom dropdown arrow */}
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                      <svg
                        className="w-5 h-5 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Search Button */}
                <Button
                  onClick={handleSearch}
                  size="lg"
                  className="w-full justify-center"
                  leftIcon={Search}
                >
                  Search {tabs.find((t) => t.id === activeTab)?.label}
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SearchBar;
