// src/hooks/usePWA.js
import { useState, useEffect } from "react";

/**
 * Hook personalizado para detectar y manejar capacidades PWA
 *
 * @returns {Object} Estado y métodos relacionados con PWA
 *
 * @example
 * const {
 *   isInstalled,
 *   isInstallable,
 *   isOnline,
 *   installPrompt,
 *   handleInstall
 * } = usePWA();
 *
 * // Mostrar botón de instalación solo si es posible
 * {isInstallable && !isInstalled && (
 *   <button onClick={handleInstall}>
 *     Instalar App
 *   </button>
 * )}
 */
export function usePWA() {
  const [isInstalled, setIsInstalled] = useState(false);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [installPrompt, setInstallPrompt] = useState(null);

  useEffect(() => {
    // Detectar si la app ya está instalada
    const checkIfInstalled = () => {
      // Chequear si se está ejecutando como PWA standalone
      const isStandalone =
        window.matchMedia("(display-mode: standalone)").matches ||
        window.navigator.standalone === true ||
        document.referrer.includes("android-app://");

      setIsInstalled(isStandalone);
    };

    checkIfInstalled();

    // Escuchar el evento beforeinstallprompt
    const handleBeforeInstallPrompt = (e) => {
      // Prevenir que Chrome 67 y anteriores muestren el prompt automáticamente
      e.preventDefault();

      // Guardar el evento para poder dispararlo después
      setInstallPrompt(e);
      setIsInstallable(true);
    };

    // Escuchar cuando la app es instalada
    const handleAppInstalled = () => {
      console.log("✅ PWA instalada exitosamente");
      setIsInstalled(true);
      setIsInstallable(false);
      setInstallPrompt(null);
    };

    // Listeners para estado online/offline
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    // Agregar event listeners
    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Cleanup
    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt,
      );
      window.removeEventListener("appinstalled", handleAppInstalled);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  /**
   * Muestra el prompt de instalación de PWA
   */
  const handleInstall = async () => {
    if (!installPrompt) {
      console.warn("No hay prompt de instalación disponible");
      return;
    }

    // Mostrar el prompt de instalación
    installPrompt.prompt();

    // Esperar a que el usuario responda al prompt
    const { outcome } = await installPrompt.userChoice;

    console.log(`Usuario respondió: ${outcome}`);

    if (outcome === "accepted") {
      console.log("✅ Usuario aceptó la instalación");
    } else {
      console.log("❌ Usuario rechazó la instalación");
    }

    // Limpiar el prompt
    setInstallPrompt(null);
    setIsInstallable(false);
  };

  /**
   * Verifica si el Service Worker está activo
   */
  const isServiceWorkerActive = () => {
    return "serviceWorker" in navigator && navigator.serviceWorker.controller;
  };

  /**
   * Obtiene información del Service Worker
   */
  const getServiceWorkerInfo = async () => {
    if (!("serviceWorker" in navigator)) {
      return null;
    }

    const registration = await navigator.serviceWorker.getRegistration();

    return {
      hasRegistration: !!registration,
      hasController: !!navigator.serviceWorker.controller,
      state: registration?.active?.state || "no-registration",
    };
  };

  return {
    isInstalled,
    isInstallable,
    isOnline,
    installPrompt,
    handleInstall,
    isServiceWorkerActive: isServiceWorkerActive(),
    getServiceWorkerInfo,
  };
}

export default usePWA;
