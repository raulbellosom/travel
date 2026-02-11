// src/components/common/PWAUpdateNotification.jsx
import { useEffect, useState } from "react";
import { useRegisterSW } from "virtual:pwa-register/react";

/**
 * Componente para notificar al usuario sobre actualizaciones de la PWA
 *
 * Para usarlo, agrega este componente en App.jsx o en tu layout principal:
 *
 * import PWAUpdateNotification from './components/common/PWAUpdateNotification';
 *
 * function App() {
 *   return (
 *     <>
 *       <PWAUpdateNotification />
 *       {/* resto de tu app *\/}
 *     </>
 *   );
 * }
 */
export default function PWAUpdateNotification() {
  const [showReload, setShowReload] = useState(false);

  const {
    needRefresh: [needRefresh, setNeedRefresh],
    offlineReady: [offlineReady, setOfflineReady],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(registration) {
      console.log("✅ Service Worker registrado");

      // Chequear actualizaciones cada hora
      if (registration) {
        setInterval(
          () => {
            registration.update();
          },
          60 * 60 * 1000,
        );
      }
    },
    onRegisterError(error) {
      console.error("❌ Error al registrar SW:", error);
    },
  });

  useEffect(() => {
    if (needRefresh || offlineReady) {
      setShowReload(true);
    }
  }, [needRefresh, offlineReady]);

  const handleClose = () => {
    setShowReload(false);
    setNeedRefresh(false);
    setOfflineReady(false);
  };

  const handleUpdate = () => {
    updateServiceWorker(true);
  };

  if (!showReload) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm">
      <div className="rounded-lg bg-white p-4 shadow-lg ring-1 ring-black/5 dark:bg-gray-800 dark:ring-white/10">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            {needRefresh ? (
              // Icono de actualización
              <svg
                className="h-6 w-6 text-blue-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            ) : (
              // Icono de offline ready
              <svg
                className="h-6 w-6 text-green-500"
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
            )}
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {needRefresh
                ? "Nueva versión disponible"
                : "App lista para usar offline"}
            </p>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {needRefresh
                ? "Haz clic en actualizar para obtener la última versión"
                : "Ya puedes usar la app sin conexión"}
            </p>
          </div>

          <button
            onClick={handleClose}
            className="flex-shrink-0 rounded-md text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
          >
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>

        {needRefresh && (
          <div className="mt-3 flex gap-2">
            <button
              onClick={handleUpdate}
              className="flex-1 rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-500"
            >
              Actualizar ahora
            </button>
            <button
              onClick={handleClose}
              className="flex-1 rounded-md bg-gray-100 px-3 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-200 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
            >
              Más tarde
            </button>
          </div>
        )}

        {offlineReady && (
          <div className="mt-3">
            <button
              onClick={handleClose}
              className="w-full rounded-md bg-green-600 px-3 py-2 text-sm font-semibold text-white hover:bg-green-500"
            >
              Entendido
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
