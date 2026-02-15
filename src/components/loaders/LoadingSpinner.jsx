import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";

/**
 * LoadingSpinner - Elegant loading indicator for in-component use
 * Unlike LoadingScreen (full-page), this is designed to be embedded within sections
 *
 * @param {string} size - 'sm' | 'md' | 'lg' | 'xl' (default: 'md')
 * @param {string} message - Custom loading message (optional)
 * @param {boolean} showMessage - Whether to show the message (default: true)
 * @param {string} variant - 'default' | 'minimal' (default: 'default')
 */
const LoadingSpinner = ({
  size = "md",
  message,
  showMessage = true,
  variant = "default",
  className = "",
}) => {
  const { t } = useTranslation();

  const sizeConfig = {
    sm: {
      container: "h-24",
      spinner: "h-10 w-10",
      innerSpinner: "h-6 w-6",
      dots: 3,
      dotSize: "3px",
      text: "text-xs",
    },
    md: {
      container: "h-32",
      spinner: "h-16 w-16",
      innerSpinner: "h-10 w-10",
      dots: 4,
      dotSize: "4px",
      text: "text-sm",
    },
    lg: {
      container: "h-48",
      spinner: "h-24 w-24",
      innerSpinner: "h-16 w-16",
      dots: 5,
      dotSize: "5px",
      text: "text-base",
    },
    xl: {
      container: "h-64",
      spinner: "h-32 w-32",
      innerSpinner: "h-20 w-20",
      dots: 6,
      dotSize: "6px",
      text: "text-lg",
    },
  };

  const config = sizeConfig[size] || sizeConfig.md;
  const resolvedMessage = message || t("client:common.loading", "Cargando...");

  if (variant === "minimal") {
    return (
      <div className={`flex items-center justify-center gap-3 ${className}`}>
        <div className="relative">
          <svg
            className={`${config.spinner} animate-spin`}
            viewBox="0 0 100 100"
          >
            <defs>
              <linearGradient id="spinGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.9" />
                <stop offset="50%" stopColor="#0ea5e9" stopOpacity="0.6" />
                <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
              </linearGradient>
            </defs>
            <circle
              cx="50"
              cy="50"
              r="42"
              fill="none"
              stroke="url(#spinGrad)"
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray="264"
              strokeDashoffset="132"
            />
          </svg>
        </div>
        {showMessage && (
          <span
            className={`${config.text} font-medium text-slate-600 dark:text-slate-400 animate-pulse`}
          >
            {resolvedMessage}
          </span>
        )}
      </div>
    );
  }

  return (
    <div
      className={`flex flex-col items-center justify-center gap-4 ${config.container} ${className}`}
    >
      {/* Animated Spinner */}
      <div className="relative">
        {/* Outer orbit ring */}
        <motion.div
          className={`${config.spinner} relative`}
          animate={{ rotate: 360 }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "linear",
          }}
        >
          <svg className="h-full w-full" viewBox="0 0 100 100">
            <defs>
              <linearGradient
                id="outerSpinGrad"
                x1="0%"
                y1="0%"
                x2="100%"
                y2="100%"
              >
                <stop offset="0%" stopColor="#818cf8" stopOpacity="0.9" />
                <stop offset="50%" stopColor="#38bdf8" stopOpacity="0.6" />
                <stop offset="100%" stopColor="#a78bfa" stopOpacity="0" />
              </linearGradient>
            </defs>
            <circle
              cx="50"
              cy="50"
              r="42"
              fill="none"
              stroke="rgba(148,163,184,0.15)"
              strokeWidth="3"
            />
            <circle
              cx="50"
              cy="50"
              r="42"
              fill="none"
              stroke="url(#outerSpinGrad)"
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray="264"
              strokeDashoffset="132"
            />
          </svg>
        </motion.div>

        {/* Inner counter-rotating ring */}
        <motion.div
          className={`absolute inset-0 flex items-center justify-center ${config.innerSpinner}`}
          animate={{ rotate: -360 }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "linear",
          }}
        >
          <svg className="h-full w-full" viewBox="0 0 100 100">
            <defs>
              <linearGradient
                id="innerSpinGrad"
                x1="0%"
                y1="0%"
                x2="100%"
                y2="0%"
              >
                <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0" />
              </linearGradient>
            </defs>
            <circle
              cx="50"
              cy="50"
              r="38"
              fill="none"
              stroke="url(#innerSpinGrad)"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeDasharray="238"
              strokeDashoffset="170"
            />
          </svg>
        </motion.div>

        {/* Center pulse dot */}
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <div
            className="rounded-full"
            style={{
              width: config.dotSize,
              height: config.dotSize,
              background: "linear-gradient(135deg, #06b6d4 0%, #0ea5e9 100%)",
              boxShadow: "0 0 12px rgba(6, 182, 212, 0.6)",
            }}
          />
        </motion.div>
      </div>

      {/* Loading message */}
      {showMessage && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className={`${config.text} font-medium text-slate-600 dark:text-slate-400`}
        >
          <motion.span
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            {resolvedMessage}
          </motion.span>
        </motion.p>
      )}

      {/* Animated dots indicator */}
      <div className="flex items-center gap-1.5">
        {Array.from({ length: config.dots }).map((_, i) => (
          <motion.span
            key={i}
            className="rounded-full"
            style={{
              width: config.dotSize,
              height: config.dotSize,
              background:
                "linear-gradient(135deg, rgba(99, 102, 241, 0.7), rgba(14, 165, 233, 0.7))",
            }}
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.3, 1, 0.3],
            }}
            transition={{
              duration: 1,
              repeat: Infinity,
              delay: i * 0.15,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default LoadingSpinner;
