const get = (key, fallback = "") => {
  const value = import.meta.env[key];
  return value === undefined || value === null || value === "" ? fallback : value;
};

const toBool = (value, fallback = false) => {
  if (value === undefined || value === null || value === "") return fallback;
  return String(value).toLowerCase() === "true";
};

const env = {
  appwrite: {
    endpoint: get("VITE_APPWRITE_ENDPOINT"),
    projectId: get("VITE_APPWRITE_PROJECT_ID"),
    databaseId: get("VITE_APPWRITE_DATABASE_ID", "main"),
    collections: {
      users: get("VITE_APPWRITE_COLLECTION_USERS_ID"),
      userPreferences: get("VITE_APPWRITE_COLLECTION_USER_PREFERENCES_ID"),
      properties: get("VITE_APPWRITE_COLLECTION_PROPERTIES_ID"),
      propertyImages: get("VITE_APPWRITE_COLLECTION_PROPERTY_IMAGES_ID"),
      amenities: get("VITE_APPWRITE_COLLECTION_AMENITIES_ID"),
      propertyAmenities: get("VITE_APPWRITE_COLLECTION_PROPERTY_AMENITIES_ID"),
      leads: get("VITE_APPWRITE_COLLECTION_LEADS_ID"),
      emailVerifications: get("VITE_APPWRITE_COLLECTION_EMAIL_VERIFICATIONS_ID"),
    },
    buckets: {
      propertyImages: get("VITE_APPWRITE_BUCKET_PROPERTY_IMAGES_ID"),
      avatars: get("VITE_APPWRITE_BUCKET_AVATARS_ID"),
    },
    functions: {
      createLead: get("VITE_APPWRITE_FUNCTION_CREATE_LEAD_ID"),
      emailVerification: get("VITE_APPWRITE_FUNCTION_EMAIL_VERIFICATION_ID"),
      syncUserProfile: get("VITE_APPWRITE_FUNCTION_SYNC_USER_PROFILE_ID"),
      propertyViewCounter: get("VITE_APPWRITE_FUNCTION_PROPERTY_VIEW_COUNTER_ID"),
    },
  },
  app: {
    name: get("VITE_APP_NAME", "Real Estate SaaS"),
    env: get("VITE_APP_ENV", "development"),
    url: get("VITE_APP_URL", "http://localhost:5173"),
    version: get("VITE_APP_VERSION", "1.0.0"),
    rootPanelPath: get("VITE_ROOT_PANEL_PATH", "/__root/activity"),
    rootAmenitiesPath: get("VITE_ROOT_AMENITIES_PATH", "/__root/amenities"),
  },
  features: {
    geolocation: toBool(import.meta.env.VITE_FEATURE_GEOLOCATION, true),
    darkMode: toBool(import.meta.env.VITE_FEATURE_DARK_MODE, true),
    i18n: toBool(import.meta.env.VITE_FEATURE_I18N, true),
  },
  external: {
    googleMapsApiKey: get("VITE_GOOGLE_MAPS_API_KEY"),
    mapboxToken: get("VITE_MAPBOX_ACCESS_TOKEN"),
    gaId: get("VITE_GA_MEASUREMENT_ID"),
  },
};

export const getMissingCriticalEnv = () => {
  const required = [
    "VITE_APPWRITE_ENDPOINT",
    "VITE_APPWRITE_PROJECT_ID",
    "VITE_APPWRITE_DATABASE_ID",
    "VITE_APPWRITE_COLLECTION_USERS_ID",
    "VITE_APPWRITE_COLLECTION_PROPERTIES_ID",
    "VITE_APPWRITE_COLLECTION_LEADS_ID",
  ];

  return required.filter((key) => !import.meta.env[key]);
};

export default env;
