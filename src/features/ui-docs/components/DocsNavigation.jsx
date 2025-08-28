import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Home, Atom, Component, Layers } from "lucide-react";
import { useUIDocsTranslation } from "../../../hooks/useUIDocsTranslation";

const navigationStructure = [
  {
    id: "overview",
    type: "section",
    icon: Home,
  },
  {
    id: "atoms",
    type: "section",
    icon: Atom,
  },
  {
    id: "molecules",
    type: "section",
    icon: Component,
  },
  {
    id: "organisms",
    type: "section",
    icon: Layers,
  },
];

export default React.memo(function DocsNavigation({ className = "" }) {
  const { t } = useUIDocsTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("overview");

  // Detectar scroll simplificado - solo secciones principales
  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const navbarHeight = 80;
          const scrollPosition = window.scrollY + navbarHeight + 50;

          let newActiveSection = "overview";

          // Solo buscar secciones principales: atoms, molecules, organisms
          const sections = ["organisms", "molecules", "atoms"];
          for (const section of sections) {
            const element = document.getElementById(section);
            if (element && element.offsetTop <= scrollPosition) {
              newActiveSection = section;
              break;
            }
          }

          setActiveSection(newActiveSection);
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      const navbarHeight = 80;
      const extraOffset = 20;

      const elementTop = element.offsetTop;
      const targetScrollY = elementTop - navbarHeight - extraOffset;

      window.scrollTo({
        top: Math.max(0, targetScrollY),
        behavior: "smooth",
      });
    }
    setIsOpen(false);
  };

  const NavigationContent = () => (
    <nav className="space-y-1">
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
          {t("navigation.title")}
        </h3>
      </div>

      {navigationStructure.map((item) => {
        const Icon = item.icon;
        const isActive = activeSection === item.id;

        return (
          <motion.button
            key={item.id}
            onClick={() => scrollToSection(item.id)}
            className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
              isActive
                ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-200"
            }`}
            whileHover={{ x: 2 }}
            whileTap={{ scale: 0.98 }}
          >
            <Icon
              size={16}
              className={isActive ? "text-blue-600 dark:text-blue-400" : ""}
            />
            <span>{t(`navigation.${item.id}`)}</span>
          </motion.button>
        );
      })}
    </nav>
  );

  return (
    <>
      {/* Botón toggle para mobile */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-20 left-4 z-30 p-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        {isOpen ? <X size={20} /> : <Menu size={20} />}
      </motion.button>

      {/* Overlay para mobile */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="lg:hidden fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
          />
        )}
      </AnimatePresence>

      {/* Navegación lateral - Desktop */}
      <div
        className={`hidden lg:block fixed left-0 top-16 h-[calc(100vh-4rem)] w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 z-30 ${className}`}
      >
        <div className="p-6 h-full overflow-y-auto">
          <div className="mb-8">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              {t("header.title")}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t("header.subtitle")}
            </p>
          </div>

          <NavigationContent />
        </div>
      </div>

      {/* Navegación lateral - Mobile */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="lg:hidden fixed left-0 top-16 h-[calc(100vh-4rem)] w-72 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 z-50 shadow-xl"
          >
            <div className="p-6 h-full overflow-y-auto">
              <div className="mb-8">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                  {t("header.title")}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {t("header.subtitle")}
                </p>
              </div>

              <NavigationContent />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
});
