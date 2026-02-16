import React from "react";
import { Home, Building2, Store, Warehouse, Square } from "lucide-react";
import { cn } from "../../../utils/cn";

/**
 * Beautiful placeholder for property images with geometric pattern
 */
const PropertyImagePlaceholder = ({
  propertyType = "house",
  className = "",
  iconSize = 48,
}) => {
  const getPropertyIcon = (type) => {
    const normalized = String(type || "")
      .trim()
      .replace(/\s+/g, "_")
      .toLowerCase();

    switch (normalized) {
      case "apartment":
      case "condo":
        return Building2;
      case "land":
      case "lot":
        return Square;
      case "commercial":
      case "office":
        return Store;
      case "industrial":
      case "warehouse":
        return Warehouse;
      default:
        return Home;
    }
  };

  const PropertyIcon = getPropertyIcon(propertyType);

  return (
    <div
      className={cn(
        "relative flex h-full w-full items-center justify-center overflow-hidden bg-gradient-to-br from-slate-100 via-slate-50 to-cyan-50 dark:from-slate-800 dark:via-slate-850 dark:to-slate-900",
        className,
      )}
    >
      {/* Geometric Pattern Background */}
      <svg
        className="absolute inset-0 h-full w-full opacity-30 dark:opacity-20"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern
            id="property-pattern"
            x="0"
            y="0"
            width="80"
            height="80"
            patternUnits="userSpaceOnUse"
          >
            {/* Diagonal lines */}
            <line
              x1="0"
              y1="0"
              x2="80"
              y2="80"
              stroke="currentColor"
              strokeWidth="0.5"
              className="text-cyan-400 dark:text-cyan-600"
            />
            <line
              x1="0"
              y1="80"
              x2="80"
              y2="0"
              stroke="currentColor"
              strokeWidth="0.5"
              className="text-cyan-300 dark:text-cyan-700"
            />

            {/* Circles */}
            <circle
              cx="40"
              cy="40"
              r="15"
              fill="none"
              stroke="currentColor"
              strokeWidth="0.5"
              className="text-slate-400 dark:text-slate-600"
            />
            <circle
              cx="40"
              cy="40"
              r="8"
              fill="none"
              stroke="currentColor"
              strokeWidth="0.5"
              className="text-slate-300 dark:text-slate-700"
            />

            {/* Small dots at corners */}
            <circle
              cx="0"
              cy="0"
              r="2"
              fill="currentColor"
              className="text-cyan-500 dark:text-cyan-600"
            />
            <circle
              cx="80"
              cy="0"
              r="2"
              fill="currentColor"
              className="text-cyan-500 dark:text-cyan-600"
            />
            <circle
              cx="0"
              cy="80"
              r="2"
              fill="currentColor"
              className="text-cyan-500 dark:text-cyan-600"
            />
            <circle
              cx="80"
              cy="80"
              r="2"
              fill="currentColor"
              className="text-cyan-500 dark:text-cyan-600"
            />

            {/* Grid squares */}
            <rect
              x="10"
              y="10"
              width="20"
              height="20"
              fill="none"
              stroke="currentColor"
              strokeWidth="0.5"
              className="text-slate-300 dark:text-slate-700"
            />
            <rect
              x="50"
              y="50"
              width="20"
              height="20"
              fill="none"
              stroke="currentColor"
              strokeWidth="0.5"
              className="text-slate-300 dark:text-slate-700"
            />
          </pattern>

          {/* Gradient overlay */}
          <linearGradient
            id="icon-gradient"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
          >
            <stop
              offset="0%"
              className="text-cyan-400 dark:text-cyan-500"
              style={{ stopColor: "currentColor", stopOpacity: 0.8 }}
            />
            <stop
              offset="100%"
              className="text-slate-400 dark:text-slate-500"
              style={{ stopColor: "currentColor", stopOpacity: 0.6 }}
            />
          </linearGradient>
        </defs>

        <rect width="100%" height="100%" fill="url(#property-pattern)" />
      </svg>

      {/* Center Icon with gradient */}
      <div className="relative z-10 rounded-2xl bg-white/50 p-6 backdrop-blur-sm dark:bg-slate-800/50">
        <PropertyIcon
          size={iconSize}
          className="text-slate-400 dark:text-slate-500"
          style={{ filter: "url(#icon-gradient)" }}
        />
      </div>

      {/* Subtle decorative circles */}
      <div className="absolute left-4 top-4 h-24 w-24 rounded-full bg-gradient-to-br from-cyan-200/20 to-transparent blur-2xl dark:from-cyan-600/10" />
      <div className="absolute bottom-4 right-4 h-32 w-32 rounded-full bg-gradient-to-tl from-slate-300/20 to-transparent blur-2xl dark:from-slate-600/10" />
    </div>
  );
};

export default PropertyImagePlaceholder;
