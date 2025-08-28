import { useUI } from "../contexts/UIContext";
import uiDocsEs from "../i18n/ui-docs-es.json";
import uiDocsEn from "../i18n/ui-docs-en.json";

const translations = {
  es: uiDocsEs,
  en: uiDocsEn,
};

export const useUIDocsTranslation = () => {
  const { language } = useUI();

  const t = (key, interpolations = {}) => {
    const keys = key.split(".");
    let value = translations[language] || translations.es;

    for (const k of keys) {
      value = value[k];
      if (!value) break;
    }

    if (!value || typeof value !== "string") {
      return key;
    }

    // Handle interpolations with {{}} syntax for HTML content
    let result = value;
    Object.entries(interpolations).forEach(([k, v]) => {
      result = result.replace(new RegExp(`{{${k}}}`, "g"), v);
    });

    return result;
  };

  const interpolate = (template, values) => {
    if (!template || typeof template !== "string") return template;

    return template.replace(/\{(\w+)\}/g, (match, key) => {
      return values[key] || match;
    });
  };

  const tHtml = (key, interpolations = {}) => {
    const translation = t(key, interpolations);
    return { __html: translation };
  };

  return { t, interpolate, tHtml };
};
