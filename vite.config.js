import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

const PUBLIC_ENV_KEYS = [
  "APP_NAME",
  "APP_ENV",
  "APP_BASE_URL",
  "APP_VERSION",
  "APPWRITE_ENDPOINT",
  "APPWRITE_PROJECT_ID",
  "APPWRITE_DATABASE_ID",
  "APPWRITE_COLLECTION_USERS_ID",
  "APPWRITE_COLLECTION_USER_PREFERENCES_ID",
  "APPWRITE_COLLECTION_PROPERTIES_ID",
  "APPWRITE_COLLECTION_PROPERTY_IMAGES_ID",
  "APPWRITE_COLLECTION_AMENITIES_ID",
  "APPWRITE_COLLECTION_PROPERTY_AMENITIES_ID",
  "APPWRITE_COLLECTION_LEADS_ID",
  "APPWRITE_COLLECTION_RESERVATIONS_ID",
  "APPWRITE_COLLECTION_RESERVATION_PAYMENTS_ID",
  "APPWRITE_COLLECTION_RESERVATION_VOUCHERS_ID",
  "APPWRITE_COLLECTION_REVIEWS_ID",
  "APPWRITE_COLLECTION_ANALYTICS_DAILY_ID",
  "APPWRITE_COLLECTION_ACTIVITY_LOGS_ID",
  "APPWRITE_COLLECTION_EMAIL_VERIFICATIONS_ID",
  "APPWRITE_BUCKET_PROPERTY_IMAGES_ID",
  "APPWRITE_BUCKET_AVATARS_ID",
  "APPWRITE_BUCKET_DOCUMENTS_ID",
  "APPWRITE_FUNCTION_CREATE_LEAD_ID",
  "APPWRITE_FUNCTION_EMAIL_VERIFICATION_ID",
  "APPWRITE_FUNCTION_SYNC_USER_PROFILE_ID",
  "APPWRITE_FUNCTION_USER_CREATE_PROFILE_ID",
  "APPWRITE_FUNCTION_SEND_LEAD_NOTIFICATION_ID",
  "APPWRITE_FUNCTION_PROPERTY_VIEW_COUNTER_ID",
  "APPWRITE_FUNCTION_CREATE_RESERVATION_ID",
  "APPWRITE_FUNCTION_RESERVATION_CREATED_NOTIFICATION_ID",
  "APPWRITE_FUNCTION_CREATE_PAYMENT_SESSION_ID",
  "APPWRITE_FUNCTION_PAYMENT_WEBHOOK_STRIPE_ID",
  "APPWRITE_FUNCTION_PAYMENT_WEBHOOK_MERCADOPAGO_ID",
  "APPWRITE_FUNCTION_ISSUE_RESERVATION_VOUCHER_ID",
  "APPWRITE_FUNCTION_CREATE_REVIEW_ID",
  "APPWRITE_FUNCTION_MODERATE_REVIEW_ID",
  "APPWRITE_FUNCTION_DASHBOARD_METRICS_ID",
  "APPWRITE_FUNCTION_STAFF_USER_MANAGEMENT_ID",
  "APPWRITE_FUNCTION_ACTIVITY_LOG_QUERY_ID",
  "APPWRITE_FUNCTION_ROOT_DIAGNOSTICS_ID",
  "PAYMENT_DEFAULT_PROVIDER",
  "PAYMENT_SUCCESS_URL",
  "PAYMENT_CANCEL_URL",
  "STRIPE_PUBLISHABLE_KEY",
  "MERCADOPAGO_PUBLIC_KEY",
  "FEATURE_GEOLOCATION",
  "FEATURE_DARK_MODE",
  "FEATURE_I18N",
  "FEATURE_VERBOSE_LOGS",
  "GOOGLE_MAPS_API_KEY",
  "MAPBOX_ACCESS_TOKEN",
  "GA_MEASUREMENT_ID",
  "EMAIL_VERIFICATION_TTL_MINUTES",
];

const hasValue = (value) =>
  value !== undefined && value !== null && String(value).trim() !== "";

const getPublicEnvValue = (rawEnv, key) => {
  if (hasValue(rawEnv[key])) return rawEnv[key];
  if (key === "APP_BASE_URL" && hasValue(rawEnv.APP_URL)) return rawEnv.APP_URL;

  const legacyViteKey = `VITE_${key}`;
  if (hasValue(rawEnv[legacyViteKey])) return rawEnv[legacyViteKey];

  return "";
};

const rootDir = dirname(fileURLToPath(import.meta.url));

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const rawEnv = loadEnv(mode, rootDir, "");
  const publicEnv = Object.fromEntries(
    PUBLIC_ENV_KEYS.map((key) => [key, getPublicEnvValue(rawEnv, key)]),
  );

  return {
    resolve: {
      dedupe: ["react", "react-dom"],
    },
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
          name: "Inmobo - Plataforma Inmobiliaria",
          short_name: "Inmobo",
          description:
            "Plataforma integral para compra, venta y renta de inmuebles. Encuentra tu hogar ideal o publica tus propiedades de manera facil y segura.",
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
          maximumFileSizeToCacheInBytes: 15 * 1024 * 1024,
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: "CacheFirst",
              options: {
                cacheName: "google-fonts-cache",
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365,
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
                  maxAgeSeconds: 60 * 60 * 24 * 365,
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
                  maxAgeSeconds: 60 * 60 * 24 * 30,
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
          ],
        },
        devOptions: {
          enabled: false,
          type: "module",
        },
      }),
    ],
    define: {
      "globalThis.__TRAVEL_ENV__": JSON.stringify(publicEnv),
    },
  };
});
