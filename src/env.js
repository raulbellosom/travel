const runtimeEnv = globalThis.__TRAVEL_ENV__ || {};

const hasValue = (value) =>
  value !== undefined && value !== null && String(value).trim() !== "";

const getLegacyValue = (key) => {
  if (key === "APP_BASE_URL" && hasValue(import.meta.env.APP_URL)) {
    return import.meta.env.APP_URL;
  }

  const viteKey = `VITE_${key}`;
  if (hasValue(import.meta.env[viteKey])) {
    return import.meta.env[viteKey];
  }

  if (hasValue(import.meta.env[key])) {
    return import.meta.env[key];
  }

  return "";
};

const get = (key, fallback = "") => {
  const rawValue = hasValue(runtimeEnv[key])
    ? runtimeEnv[key]
    : getLegacyValue(key);
  return hasValue(rawValue) ? rawValue : fallback;
};

const toBool = (value, fallback = false) => {
  if (!hasValue(value)) return fallback;
  return String(value).toLowerCase() === "true";
};

const env = {
  appwrite: {
    endpoint: get("APPWRITE_ENDPOINT"),
    projectId: get("APPWRITE_PROJECT_ID"),
    databaseId: get("APPWRITE_DATABASE_ID", "main"),
    collections: {
      users: get("APPWRITE_COLLECTION_USERS_ID"),
      userPreferences: get("APPWRITE_COLLECTION_USER_PREFERENCES_ID"),
      properties: get("APPWRITE_COLLECTION_PROPERTIES_ID"),
      propertyImages: get("APPWRITE_COLLECTION_PROPERTY_IMAGES_ID"),
      amenities: get("APPWRITE_COLLECTION_AMENITIES_ID"),
      propertyAmenities: get("APPWRITE_COLLECTION_PROPERTY_AMENITIES_ID"),
      leads: get("APPWRITE_COLLECTION_LEADS_ID"),
      reservations: get("APPWRITE_COLLECTION_RESERVATIONS_ID"),
      reservationPayments: get("APPWRITE_COLLECTION_RESERVATION_PAYMENTS_ID"),
      reservationVouchers: get("APPWRITE_COLLECTION_RESERVATION_VOUCHERS_ID"),
      reviews: get("APPWRITE_COLLECTION_REVIEWS_ID"),
      analyticsDaily: get("APPWRITE_COLLECTION_ANALYTICS_DAILY_ID"),
      activityLogs: get("APPWRITE_COLLECTION_ACTIVITY_LOGS_ID"),
      emailVerifications: get("APPWRITE_COLLECTION_EMAIL_VERIFICATIONS_ID"),
    },
    buckets: {
      propertyImages: get("APPWRITE_BUCKET_PROPERTY_IMAGES_ID"),
      avatars: get("APPWRITE_BUCKET_AVATARS_ID"),
      documents: get("APPWRITE_BUCKET_DOCUMENTS_ID"),
    },
    functions: {
      createLead: get("APPWRITE_FUNCTION_CREATE_LEAD_ID"),
      emailVerification: get("APPWRITE_FUNCTION_EMAIL_VERIFICATION_ID"),
      syncUserProfile: get("APPWRITE_FUNCTION_SYNC_USER_PROFILE_ID"),
      userCreateProfile: get("APPWRITE_FUNCTION_USER_CREATE_PROFILE_ID"),
      sendLeadNotification: get("APPWRITE_FUNCTION_SEND_LEAD_NOTIFICATION_ID"),
      propertyViewCounter: get("APPWRITE_FUNCTION_PROPERTY_VIEW_COUNTER_ID"),
      createReservation: get("APPWRITE_FUNCTION_CREATE_RESERVATION_ID"),
      reservationCreatedNotification: get(
        "APPWRITE_FUNCTION_RESERVATION_CREATED_NOTIFICATION_ID",
      ),
      createPaymentSession: get("APPWRITE_FUNCTION_CREATE_PAYMENT_SESSION_ID"),
      paymentWebhookStripe: get("APPWRITE_FUNCTION_PAYMENT_WEBHOOK_STRIPE_ID"),
      paymentWebhookMercadoPago: get(
        "APPWRITE_FUNCTION_PAYMENT_WEBHOOK_MERCADOPAGO_ID",
      ),
      issueReservationVoucher: get(
        "APPWRITE_FUNCTION_ISSUE_RESERVATION_VOUCHER_ID",
      ),
      createReview: get("APPWRITE_FUNCTION_CREATE_REVIEW_ID"),
      moderateReview: get("APPWRITE_FUNCTION_MODERATE_REVIEW_ID"),
      dashboardMetrics: get("APPWRITE_FUNCTION_DASHBOARD_METRICS_ID"),
      staffUserManagement: get("APPWRITE_FUNCTION_STAFF_USER_MANAGEMENT_ID"),
      activityLogQuery: get("APPWRITE_FUNCTION_ACTIVITY_LOG_QUERY_ID"),
      rootDiagnostics: get("APPWRITE_FUNCTION_ROOT_DIAGNOSTICS_ID"),
      deepSearchQuery: get("APPWRITE_FUNCTION_DEEP_SEARCH_QUERY_ID"),
    },
  },
  app: {
    name: get("APP_NAME", "Inmobo"),
    env: get("APP_ENV", "development"),
    url: get("APP_BASE_URL", "http://localhost:5173"),
    version: get("APP_VERSION", "1.0.0"),
  },
  payments: {
    defaultProvider: get("PAYMENT_DEFAULT_PROVIDER", "stripe"),
    successUrl: get("PAYMENT_SUCCESS_URL"),
    cancelUrl: get("PAYMENT_CANCEL_URL"),
    stripe: {
      publishableKey: get("STRIPE_PUBLISHABLE_KEY"),
    },
    mercadopago: {
      publicKey: get("MERCADOPAGO_PUBLIC_KEY"),
    },
  },
  features: {
    geolocation: toBool(get("FEATURE_GEOLOCATION"), true),
    darkMode: toBool(get("FEATURE_DARK_MODE"), true),
    i18n: toBool(get("FEATURE_I18N"), true),
    verboseLogs: toBool(get("FEATURE_VERBOSE_LOGS"), false),
  },
  external: {
    googleMapsApiKey: get("GOOGLE_MAPS_API_KEY"),
    mapboxToken: get("MAPBOX_ACCESS_TOKEN"),
    gaId: get("GA_MEASUREMENT_ID"),
  },
};

export const getMissingCriticalEnv = () => {
  const required = [
    "APPWRITE_ENDPOINT",
    "APPWRITE_PROJECT_ID",
    "APPWRITE_DATABASE_ID",
    "APPWRITE_COLLECTION_USERS_ID",
    "APPWRITE_COLLECTION_PROPERTIES_ID",
    "APPWRITE_COLLECTION_LEADS_ID",
    "APPWRITE_COLLECTION_RESERVATIONS_ID",
    "APPWRITE_COLLECTION_RESERVATION_PAYMENTS_ID",
    "APPWRITE_COLLECTION_RESERVATION_VOUCHERS_ID",
    "APPWRITE_COLLECTION_REVIEWS_ID",
    "APPWRITE_COLLECTION_ACTIVITY_LOGS_ID",
    "APPWRITE_FUNCTION_CREATE_LEAD_ID",
    "APPWRITE_FUNCTION_CREATE_RESERVATION_ID",
    "APPWRITE_FUNCTION_CREATE_PAYMENT_SESSION_ID",
    "APPWRITE_FUNCTION_CREATE_REVIEW_ID",
  ];

  return required.filter((key) => !hasValue(get(key)));
};

export default env;
