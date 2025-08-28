import React from "react";
import { motion } from "framer-motion";
import { useUI } from "../../contexts/UIContext";
import { Select } from "../../components/common";
import { AtomsSection, MoleculesSection, OrganismsSection } from "./sections";
import { TechNotice, DocsNavigation } from "./components";
import { useUIDocsTranslation } from "../../hooks/useUIDocsTranslation";
import {
  Palette,
  Zap,
  Layout,
  Smartphone,
  Monitor,
  Sun,
  Moon,
  Settings,
} from "lucide-react";

export default function Page() {
  const { theme } = useUI();
  const { t, interpolate, tHtml } = useUIDocsTranslation();

  const [selectedSize, setSelectedSize] = React.useState("md");
  const [selectedVariant, setSelectedVariant] = React.useState("primary");

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      {/* Navegación lateral */}
      <DocsNavigation />

      {/* Contenido principal con margen para la navegación */}
      <div className="lg:ml-64">
        <div className="container mx-auto px-4 py-8 lg:px-8">
          {/* Header Elegante y Profesional */}
          <motion.div
            id="overview"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-16 scroll-mt-8"
          >
            {/* Título principal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="mb-8"
            >
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-black mb-4 text-gray-900 dark:text-white leading-tight">
                <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 dark:from-blue-400 dark:via-purple-400 dark:to-indigo-400 bg-clip-text text-transparent">
                  {t("header.title")}
                </span>
                <br />
                <span className="text-gray-800 dark:text-gray-100">
                  {t("header.subtitle")}
                </span>
              </h1>

              <p
                className="text-xl md:text-2xl text-gray-600 dark:text-gray-400 max-w-4xl mx-auto leading-relaxed"
                dangerouslySetInnerHTML={tHtml("header.description", {
                  variants: t("header.variants"),
                  sizes: t("header.sizes"),
                  themes: t("header.themes"),
                })}
              />
            </motion.div>

            {/* Badges de tecnologías */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="flex flex-wrap justify-center gap-3 mb-12"
            >
              {[
                { name: t("header.technologies.react"), icon: Zap },
                { name: t("header.technologies.tailwind"), icon: Palette },
                { name: t("header.technologies.framerMotion"), icon: Layout },
                { name: t("header.technologies.lucideIcons"), icon: Settings },
                { name: t("header.technologies.i18nReady"), icon: Monitor },
              ].map(({ name, icon: Icon }, index) => (
                <motion.div
                  key={name}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5 + index * 0.1, duration: 0.4 }}
                  className="group"
                >
                  <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-full text-gray-700 dark:text-gray-300 text-sm font-medium border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-300 cursor-default group-hover:shadow-md">
                    <Icon
                      size={16}
                      className="text-blue-600 dark:text-blue-400"
                    />
                    {name}
                  </div>
                </motion.div>
              ))}
            </motion.div>

            {/* Controles Globales */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.6 }}
              className="max-w-4xl mx-auto"
            >
              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-8 shadow-lg">
                <div className="flex items-center justify-center gap-3 mb-6">
                  <Settings className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    {t("header.globalControls.title")}
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
                  {/* Control de Tamaño */}
                  <div className="space-y-3">
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                      <Smartphone className="w-4 h-4" />
                      {t("header.globalControls.sizeLabel")}
                    </label>
                    <Select
                      value={selectedSize}
                      onChange={setSelectedSize}
                      size="md"
                      options={[
                        {
                          value: "xs",
                          label: t("header.globalControls.sizes.xs"),
                        },
                        {
                          value: "sm",
                          label: t("header.globalControls.sizes.sm"),
                        },
                        {
                          value: "md",
                          label: t("header.globalControls.sizes.md"),
                        },
                        {
                          value: "lg",
                          label: t("header.globalControls.sizes.lg"),
                        },
                        {
                          value: "xl",
                          label: t("header.globalControls.sizes.xl"),
                        },
                      ]}
                    />
                  </div>

                  {/* Control de Variante */}
                  <div className="space-y-3">
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                      <Palette className="w-4 h-4" />
                      {t("header.globalControls.variantLabel")}
                    </label>
                    <Select
                      value={selectedVariant}
                      onChange={setSelectedVariant}
                      size="md"
                      options={[
                        {
                          value: "primary",
                          label: t("header.globalControls.variants.primary"),
                        },
                        {
                          value: "secondary",
                          label: t("header.globalControls.variants.secondary"),
                        },
                        {
                          value: "success",
                          label: t("header.globalControls.variants.success"),
                        },
                        {
                          value: "warning",
                          label: t("header.globalControls.variants.warning"),
                        },
                        {
                          value: "danger",
                          label: t("header.globalControls.variants.danger"),
                        },
                        {
                          value: "info",
                          label: t("header.globalControls.variants.info"),
                        },
                      ]}
                    />
                  </div>

                  {/* Indicador de Tema */}
                  <div className="space-y-3">
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                      {theme === "dark" ? (
                        <Moon className="w-4 h-4" />
                      ) : (
                        <Sun className="w-4 h-4" />
                      )}
                      {t("header.globalControls.themeLabel")}
                    </label>
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 px-4 py-3 h-12 flex items-center justify-center">
                      <span className="text-gray-700 dark:text-gray-300 font-semibold capitalize">
                        {theme}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Stats del sistema */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
                  {[
                    { label: t("header.components"), value: "50+" },
                    { label: t("header.variants"), value: "200+" },
                    { label: t("header.sizes"), value: "5" },
                    { label: t("header.themes"), value: "3" },
                  ].map((stat, index) => (
                    <motion.div
                      key={stat.label}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.8 + index * 0.1, duration: 0.4 }}
                      className="text-center"
                    >
                      <div className="text-2xl md:text-3xl font-black text-blue-600 dark:text-blue-400 mb-1">
                        {stat.value}
                      </div>
                      <div className="text-gray-500 dark:text-gray-400 text-sm uppercase tracking-wide">
                        {stat.label}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>

          <div className="max-w-4xl mx-auto mb-8">
            <TechNotice />
          </div>

          {/* Secciones */}
          <AtomsSection
            id="atoms"
            selectedSize={selectedSize}
            selectedVariant={selectedVariant}
          />
          <MoleculesSection id="molecules" selectedSize={selectedSize} />
          <OrganismsSection
            id="organisms"
            selectedSize={selectedSize}
            selectedVariant={selectedVariant}
          />
        </div>
      </div>
    </div>
  );
}
