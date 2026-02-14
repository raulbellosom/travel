import { useMemo } from "react";
import PropTypes from "prop-types";

/**
 * TextInputWithCharCounter - Input de texto con indicador circular de progreso
 * y contador de caracteres restantes.
 *
 * @param {number} maxLength - Máximo de caracteres permitidos
 * @param {string} value - Valor actual del input
 * @param {string} [className] - Clases CSS adicionales para el input
 * @param {string} [containerClassName] - Clases CSS para el contenedor
 * @param {boolean} [showProgress=true] - Mostrar el indicador circular
 * @param {boolean} [showCounter=true] - Mostrar el contador de caracteres
 * @param {...any} props - Props adicionales para el input
 */
const TextInputWithCharCounter = ({
  maxLength,
  value = "",
  className = "",
  containerClassName = "",
  showProgress = true,
  showCounter = true,
  ...props
}) => {
  const currentLength = String(value || "").length;
  const remaining = maxLength - currentLength;
  const percentage = maxLength > 0 ? (currentLength / maxLength) * 100 : 0;

  // Color basado en el porcentaje
  const progressColor = useMemo(() => {
    if (percentage >= 100) return "text-red-500 dark:text-red-400";
    if (percentage >= 90) return "text-amber-500 dark:text-amber-400";
    if (percentage >= 75) return "text-yellow-500 dark:text-yellow-400";
    return "text-cyan-500 dark:text-cyan-400";
  }, [percentage]);

  // SVG circle stroke color
  const strokeColor = useMemo(() => {
    if (percentage >= 100) return "#ef4444"; // red-500
    if (percentage >= 90) return "#f59e0b"; // amber-500
    if (percentage >= 75) return "#eab308"; // yellow-500
    return "#06b6d4"; // cyan-500
  }, [percentage]);

  // Radius y circumference para el círculo SVG
  const radius = 14;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className={`relative ${containerClassName}`}>
      <input
        type="text"
        maxLength={maxLength}
        value={value}
        className={`w-full ${showProgress || showCounter ? "pr-20" : ""} ${className}`}
        {...props}
      />

      {/* Indicador y contador */}
      {(showProgress || showCounter) && (
        <div className="absolute inset-y-0 right-0 flex items-center gap-2 pr-3 pointer-events-none">
          {/* Indicador circular */}
          {showProgress && (
            <div className="relative h-8 w-8">
              <svg className="h-full w-full -rotate-90 transform">
                {/* Círculo de fondo */}
                <circle
                  cx="16"
                  cy="16"
                  r={radius}
                  stroke="currentColor"
                  strokeWidth="2.5"
                  fill="none"
                  className="text-slate-200 dark:text-slate-700"
                />
                {/* Círculo de progreso */}
                <circle
                  cx="16"
                  cy="16"
                  r={radius}
                  stroke={strokeColor}
                  strokeWidth="2.5"
                  fill="none"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  className="transition-all duration-300 ease-out"
                />
              </svg>
            </div>
          )}

          {/* Contador de caracteres */}
          {showCounter && (
            <span className={`text-xs font-medium tabular-nums ${progressColor}`}>
              {remaining >= 0 ? remaining : 0}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

TextInputWithCharCounter.propTypes = {
  maxLength: PropTypes.number.isRequired,
  value: PropTypes.string,
  className: PropTypes.string,
  containerClassName: PropTypes.string,
  showProgress: PropTypes.bool,
  showCounter: PropTypes.bool,
};

export default TextInputWithCharCounter;
