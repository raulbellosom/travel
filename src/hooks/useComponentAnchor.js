import { useEffect } from "react";

// Hook para registrar secciones de componentes individuales para navegación
export const useComponentAnchor = (componentId, sectionId) => {
  useEffect(() => {
    // Registrar el elemento cuando se monta
    const element = document.getElementById(`${sectionId}-${componentId}`);
    if (element) {
      // Agregar clase para detección de scroll
      element.classList.add("component-anchor");
      element.setAttribute("data-component", componentId);
      element.setAttribute("data-section", sectionId);
    }

    return () => {
      // Limpiar cuando se desmonta
      if (element) {
        element.classList.remove("component-anchor");
        element.removeAttribute("data-component");
        element.removeAttribute("data-section");
      }
    };
  }, [componentId, sectionId]);
};

export default useComponentAnchor;
