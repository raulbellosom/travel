// src/main.jsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import "./i18n"; // Inicializar i18n
import App from "./App.jsx";

// Registrar Service Worker para PWA
import { registerSW } from "virtual:pwa-register";

// Registrar el SW con auto-update
const updateSW = registerSW({
  onNeedRefresh() {
    // Se puede mostrar un toast o notificación al usuario
    console.log("Nueva versión disponible, actualizando...");
  },
  onOfflineReady() {
    console.log("App lista para funcionar offline");
  },
  onRegistered(registration) {
    console.log("Service Worker registrado");
    // Chequear por actualizaciones cada hora
    if (registration) {
      setInterval(
        () => {
          registration.update();
        },
        60 * 60 * 1000,
      ); // 1 hora
    }
  },
  onRegisterError(error) {
    console.error("Error al registrar Service Worker:", error);
  },
});

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
