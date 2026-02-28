import React, { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { m, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { IconButton } from "../../atoms";

const Modal = ({
  isOpen = false,
  onClose,
  title,
  description,
  children,
  footer,
  size = "md",
  variant = "default",
  showCloseButton = true,
  closeOnBackdrop = true,
  closeOnEscape = true,
  className = "",
  ...props
}) => {
  const { t } = useTranslation();

  const MotionDiv = m.div;

  // Tamaños según design system (04_design_system_mobile_first.md)
  const sizeStyles = {
    sm: "max-w-[400px]", // 400px según specs
    md: "max-w-[600px]", // 600px según specs
    lg: "max-w-[800px]", // 800px según specs
    xl: "max-w-2xl", // 672px - tamaño extra
    "2xl": "max-w-3xl", // 768px - tamaño extra
    full: "max-w-[95vw]", // 95vw según specs
  };

  const variantStyles = {
    default: "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700",
    primary:
      "bg-brand-50 dark:bg-brand-950 border-brand-200 dark:border-brand-800",
    success:
      "bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800",
    warning:
      "bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800",
    danger: "bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800",
  };

  // Handle Escape key
  useEffect(() => {
    if (!closeOnEscape) return;

    const handleEscape = (event) => {
      if (event.key === "Escape" && isOpen) {
        onClose?.();
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen, closeOnEscape, onClose]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      // Store original values
      const originalBodyOverflow = document.body.style.overflow;
      const originalHtmlOverflow = document.documentElement.style.overflow;

      // Lock scroll on both html and body
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";

      return () => {
        document.body.style.overflow = originalBodyOverflow;
        document.documentElement.style.overflow = originalHtmlOverflow;
      };
    }
  }, [isOpen]);

  const mouseDownTarget = useRef(null);

  const handleBackdropMouseDown = (event) => {
    mouseDownTarget.current = event.target;
  };

  const handleBackdropClick = (event) => {
    if (
      closeOnBackdrop &&
      event.target === event.currentTarget &&
      mouseDownTarget.current === event.currentTarget
    ) {
      onClose?.();
    }
  };

  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  };

  const modalVariants = {
    hidden: {
      opacity: 0,
      scale: 0.95,
      y: 10,
    },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        type: "spring",
        damping: 25,
        stiffness: 300,
      },
    },
    exit: {
      opacity: 0,
      scale: 0.95,
      y: 10,
      transition: {
        duration: 0.15,
      },
    },
  };

  const safeSize = sizeStyles[size] ? size : "md";
  const safeVariant = variantStyles[variant] ? variant : "default";
  const modalStyles = [
    "relative w-full rounded-xl shadow-2xl border",
    "max-h-[85vh] sm:max-h-[90vh] flex flex-col",
    sizeStyles[safeSize],
    variantStyles[safeVariant],
    className,
  ].join(" ");

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <MotionDiv
          className="fixed inset-0 z-[110] flex items-center justify-center p-4 overflow-hidden"
          variants={backdropVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
          onMouseDown={handleBackdropMouseDown}
          onClick={handleBackdropClick}
          {...props}
        >
          {/* Overlay */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

          {/* Modal */}
          <MotionDiv
            className={modalStyles}
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? "modal-title" : undefined}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header - Fixed */}
            {(title || description || showCloseButton) && (
              <div className="shrink-0 px-6 pt-6 pb-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    {title && (
                      <h2
                        id="modal-title"
                        className="text-xl font-bold text-gray-900 dark:text-gray-100 tracking-tight"
                      >
                        {title}
                      </h2>
                    )}
                    {description && (
                      <p className="mt-1.5 text-sm text-gray-600 dark:text-gray-400">
                        {description}
                      </p>
                    )}
                  </div>

                  {/* Close button */}
                  {showCloseButton && (
                    <IconButton
                      icon={X}
                      variant="ghost"
                      size="sm"
                      onClick={onClose}
                      aria-label={t("modal.close")}
                      className="shrink-0"
                    />
                  )}
                </div>
              </div>
            )}

            {/* Content - Scrollable */}
            <div className="flex-1 overflow-y-auto overscroll-contain px-6 py-4 min-h-0">
              {children}
            </div>

            {/* Footer - Fixed (Optional) */}
            {footer && (
              <div className="shrink-0 px-6 py-4 border-t border-gray-200 dark:border-gray-700 rounded-b-xl">
                {footer}
              </div>
            )}
          </MotionDiv>
        </MotionDiv>
      )}
    </AnimatePresence>
  );

  if (typeof document === "undefined") {
    return null;
  }

  return createPortal(modalContent, document.body);
};

/**
 * Modal footer component for action buttons
 * Layouts buttons in a responsive way:
 * - Mobile: stacked vertically (reverse order)
 * - Desktop: horizontal row aligned to the right
 */
export function ModalFooter({ children, className = "" }) {
  return (
    <div
      className={`flex flex-col-reverse gap-2 sm:flex-row sm:justify-end ${className}`}
    >
      {children}
    </div>
  );
}

export default Modal;
