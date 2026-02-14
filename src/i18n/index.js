import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

// Import translation files
import en from "./en.json";
import es from "./es.json";

const resources = {
  en: {
    translation: en,
  },
  es: {
    translation: es,
  },
};

i18n
  // Detecta el idioma del usuario
  .use(LanguageDetector)
  // Conecta con React
  .use(initReactI18next)
  // Inicializa i18next
  .init({
    resources,

    // Idioma por defecto
    fallbackLng: "es",

    // Idiomas soportados
    supportedLngs: ["en", "es"],

    // Detección de idioma
    detection: {
      // Orden de detección
      order: ["localStorage", "navigator", "htmlTag"],

      // Cache en localStorage
      caches: ["localStorage"],

      // Key para localStorage
      lookupLocalStorage: "i18nextLng",

      // No cambiar automáticamente si se detecta un idioma diferente
      checkWhitelist: true,
    },

    // Para SEO y mejor performance
    interpolation: {
      escapeValue: false, // React ya escapa por defecto
    },

    // Configuración para desarrollo
    debug: import.meta.env.DEV,

    // Configuración para mejor SEO
    cleanCode: true,

    // Configuración de namespace
    defaultNS: "translation",

    // Configuración para mejor performance
    load: "languageOnly", // Solo cargar 'en' en lugar de 'en-US'

    // Configuración de react
    react: {
      // Usar Suspense para mejor UX
      useSuspense: false,

      // Bind i18n instance - solo re-render cuando cambia el idioma
      bindI18n: "languageChanged",

      // Bind i18n store - vacío para evitar re-renders innecesarios
      bindI18nStore: "",

      // Configuración para mejor performance
      transSupportBasicHtmlNodes: true,
      transKeepBasicHtmlNodesFor: ["br", "strong", "i"],

      // Optimización: solo re-renderizar componentes cuando realmente cambian las traducciones
      transEmptyNodeValue: "",
      transSupportBasicHtmlNodes: true,
      transKeepBasicHtmlNodesFor: ["br", "strong", "i", "b", "p"],
    },
  });

export default i18n;
