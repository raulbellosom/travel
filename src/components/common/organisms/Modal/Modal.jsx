import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { IconButton } from "../../atoms";

const Modal = ({
  isOpen = false,
  onClose,
  title,
  children,
  size = "md",
  variant = "default",
  showCloseButton = true,
  closeOnBackdrop = true,
  closeOnEscape = true,
  className = "",
  ...props
}) => {
  const { t } = useTranslation();

  const MotionDiv = motion.div;

  const sizeStyles = {
    xs: "max-w-md",
    sm: "max-w-lg",
    md: "max-w-2xl",
    lg: "max-w-4xl",
    xl: "max-w-6xl",
    full: "max-w-[95vw]",
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

  useEffect(() => {
    const handleEscape = (event) => {
      if (closeOnEscape && event.key === "Escape" && isOpen) {
        onClose?.();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, closeOnEscape, onClose]);

  const handleBackdropClick = (event) => {
    if (closeOnBackdrop && event.target === event.currentTarget) {
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
      y: -20,
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
      y: -20,
      transition: {
        duration: 0.2,
      },
    },
  };

  const safeSize = sizeStyles[size] ? size : "md";
  const safeVariant = variantStyles[variant] ? variant : "default";
  const modalStyles = [
    "relative w-full rounded-xl shadow-xl border",
    "max-h-[90vh] flex flex-col",
    sizeStyles[safeSize],
    variantStyles[safeVariant],
    className,
  ].join(" ");

  return (
    <AnimatePresence>
      {isOpen && (
        <MotionDiv
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          variants={backdropVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
          onClick={handleBackdropClick}
          {...props}
        >
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

          <MotionDiv
            className={modalStyles}
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? "modal-title" : undefined}
          >
            {(title || showCloseButton) && (
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                {title && (
                  <h2
                    id="modal-title"
                    className="text-lg font-semibold text-gray-900 dark:text-gray-100"
                  >
                    {title}
                  </h2>
                )}
                {showCloseButton && (
                  <IconButton
                    icon={X}
                    variant="ghost"
                    size="sm"
                    onClick={onClose}
                    aria-label={t("modal.close")}
                    className="ml-auto"
                  />
                )}
              </div>
            )}

            <div className="flex-1 overflow-auto p-6">{children}</div>
          </MotionDiv>
        </MotionDiv>
      )}
    </AnimatePresence>
  );
};

export default Modal;



