// src/components/common/OfflineIndicator.jsx
import { usePWA } from "../../hooks/usePWA";
import { useEffect, useState } from "react";

/**
 * Indicador de estado offline/online
 *
 * Muestra una notificación cuando el usuario pierde o recupera conexión
 *
 * Para usarlo, agrégalo en tu layout principal:
 *
 * import OfflineIndicator from './components/common/OfflineIndicator';
 *
 * <OfflineIndicator />
 */
export default function OfflineIndicator() {
  const { isOnline } = usePWA();
  const [showNotification, setShowNotification] = useState(false);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    // Si acaba de perder conexión
    if (!isOnline && !wasOffline) {
      setShowNotification(true);
      setWasOffline(true);
    }

    // Si acaba de recuperar conexión
    if (isOnline && wasOffline) {
      setShowNotification(true);
      setWasOffline(false);

      // Ocultar la notificación de "online" después de 3 segundos
      const timer = setTimeout(() => {
        setShowNotification(false);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [isOnline, wasOffline]);

  // Mantener visible la notificación de offline hasta que vuelva la conexión
  useEffect(() => {
    if (!isOnline) {
      setShowNotification(true);
    }
  }, [isOnline]);

  if (!showNotification && isOnline) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 flex justify-center p-4 pointer-events-none">
      <div
        className={`
          pointer-events-auto
          flex items-center gap-2 rounded-lg px-4 py-3 shadow-lg
          transition-all duration-300
          ${
            isOnline
              ? "bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-400"
              : "bg-yellow-50 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400"
          }
        `}
      >
        {isOnline ? (
          // Icono de online (check)
          <svg
            className="h-5 w-5 flex-shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        ) : (
          // Icono de offline (wifi off)
          <svg
            className="h-5 w-5 flex-shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414"
            />
          </svg>
        )}

        <div className="flex flex-col">
          <span className="text-sm font-medium">
            {isOnline ? "Conexión restaurada" : "Sin conexión"}
          </span>
          <span className="text-xs opacity-90">
            {isOnline
              ? "Estás de nuevo en línea"
              : "Trabajando en modo offline"}
          </span>
        </div>

        {/* Botón de cerrar solo para notificación de online */}
        {isOnline && (
          <button
            onClick={() => setShowNotification(false)}
            className="ml-2 rounded-md p-1 hover:bg-green-100 dark:hover:bg-green-800/30"
            aria-label="Cerrar notificación"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
