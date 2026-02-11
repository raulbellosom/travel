import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: [
        "web/favicon.ico",
        "web/apple-touch-icon.png",
        "web/icon-192.png",
        "web/icon-512.png",
        "web/icon-192-maskable.png",
        "web/icon-512-maskable.png",
      ],
      manifest: {
        name: "Travel - Plataforma Inmobiliaria",
        short_name: "Travel",
        description:
          "Plataforma integral para compra, venta y renta de inmuebles. Encuentra tu hogar ideal o publica tus propiedades de manera fácil y segura.",
        theme_color: "#3B82F6",
        background_color: "#ffffff",
        display: "standalone",
        scope: "/",
        start_url: "/",
        orientation: "portrait-primary",
        lang: "es",
        dir: "ltr",
        categories: ["business", "lifestyle", "real estate"],
        icons: [
          {
            src: "/web/icon-192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/web/icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/web/icon-192-maskable.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "maskable",
          },
          {
            src: "/web/icon-512-maskable.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
        screenshots: [],
        shortcuts: [
          {
            name: "Buscar Propiedades",
            short_name: "Buscar",
            description: "Encuentra propiedades en venta o renta",
            url: "/",
            icons: [{ src: "/web/icon-192.png", sizes: "192x192" }],
          },
          {
            name: "Mis Propiedades",
            short_name: "Propiedades",
            description: "Administra tus publicaciones",
            url: "/properties",
            icons: [{ src: "/web/icon-192.png", sizes: "192x192" }],
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,json,woff,woff2}"],
        maximumFileSizeToCacheInBytes: 15 * 1024 * 1024, // 15 MB para archivos JS grandes
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts-cache",
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 año
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "gstatic-fonts-cache",
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 año
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            urlPattern: /^https:\/\/.*\.(png|jpg|jpeg|svg|gif|webp)$/i,
            handler: "CacheFirst",
            options: {
              cacheName: "images-cache",
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 días
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
      },
      devOptions: {
        enabled: false, // Cambiar a true si quieres probar PWA en desarrollo
        type: "module",
      },
    }),
  ],
});
