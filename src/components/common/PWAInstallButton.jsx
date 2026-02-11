// src/components/common/PWAInstallButton.jsx
import { usePWA } from "../../hooks/usePWA";

/**
 * Botón para instalar la PWA
 *
 * Este componente se mostrará automáticamente solo cuando:
 * - La app sea instalable
 * - No esté ya instalada
 * - El navegador soporte instalación PWA
 *
 * Para usarlo, simplemente importa y agrega en tu layout:
 *
 * import PWAInstallButton from './components/common/PWAInstallButton';
 *
 * <PWAInstallButton />
 */
export default function PWAInstallButton() {
  const { isInstalled, isInstallable, handleInstall } = usePWA();

  // No mostrar el botón si ya está instalada o no es instalable
  if (isInstalled || !isInstallable) {
    return null;
  }

  return (
    <button
      onClick={handleInstall}
      className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:ring-offset-gray-900"
      aria-label="Instalar aplicación"
    >
      {/* Icono de descarga/instalación */}
      <svg
        className="h-5 w-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
        />
      </svg>
      <span>Instalar App</span>
    </button>
  );
}
