export const AMENITY_CATEGORY_VALUES = [
  "general",
  "security",
  "outdoor",
  "services",
  "tech",
];

const CATEGORY_ICONS = {
  general: "🏠",
  security: "🛡️",
  outdoor: "🌿",
  services: "🧰",
  tech: "💻",
};

const ICON_EMOJI_BY_KEY = {
  sofa: "🛋️",
  kitchen: "🍳",
  utensils: "🍽️",
  "utensils-crossed": "🍴",
  armchair: "🪑",
  "washing-machine": "🧺",
  wind: "💨",
  "paw-print": "🐾",
  baby: "👨‍👩‍👧",
  cigarette: "🚬",
  accessibility: "♿",
  "alarm-smoke": "🚨",
  "badge-alert": "⚠️",
  flame: "🔥",
  cross: "⛑️",
  cctv: "📹",
  "shield-alert": "🛡️",
  gate: "🚪",
  "lock-keyhole": "🔐",
  vault: "🧰",
  waves: "🏊",
  droplets: "💧",
  flower: "🌼",
  sun: "☀️",
  building: "🏢",
  beef: "🍖",
  fence: "🏡",
  "tree-palm": "🌴",
  umbrella: "🏖️",
  mountain: "⛰️",
  sparkles: "✨",
  bell: "🛎️",
  bus: "🚌",
  coffee: "☕",
  "hand-platter": "🍱",
  "key-round": "🔑",
  luggage: "🧳",
  briefcase: "💼",
  dumbbell: "🏋️",
  "heart-pulse": "💆",
  wifi: "📶",
  "radio-tower": "📡",
  monitor: "🖥️",
  tv: "📺",
  play: "▶️",
  snowflake: "❄️",
  "flame-kindling": "🔥",
  "battery-charging": "🔋",
  zap: "⚡",
  "sun-medium": "🌞",
};

export const DEFAULT_AMENITIES_CATALOG = [
  { slug: "furnished", name_es: "Amueblado", name_en: "Furnished", category: "general", icon: "sofa" },
  { slug: "kitchen", name_es: "Cocina", name_en: "Kitchen", category: "general", icon: "utensils" },
  { slug: "dining-area", name_es: "Comedor", name_en: "Dining area", category: "general", icon: "utensils-crossed" },
  { slug: "living-room", name_es: "Sala de estar", name_en: "Living room", category: "general", icon: "armchair" },
  { slug: "washer", name_es: "Lavadora", name_en: "Washer", category: "general", icon: "washing-machine" },
  { slug: "dryer", name_es: "Secadora", name_en: "Dryer", category: "general", icon: "wind" },
  { slug: "pet-friendly", name_es: "Pet friendly", name_en: "Pet friendly", category: "general", icon: "paw-print" },
  { slug: "family-friendly", name_es: "Ideal para familias", name_en: "Family friendly", category: "general", icon: "baby" },
  { slug: "smoking-area", name_es: "Area para fumar", name_en: "Smoking area", category: "general", icon: "cigarette" },
  { slug: "wheelchair-access", name_es: "Acceso para silla de ruedas", name_en: "Wheelchair access", category: "general", icon: "accessibility" },
  { slug: "smoke-detector", name_es: "Detector de humo", name_en: "Smoke detector", category: "security", icon: "alarm-smoke" },
  { slug: "co-detector", name_es: "Detector de CO", name_en: "CO detector", category: "security", icon: "badge-alert" },
  { slug: "fire-extinguisher", name_es: "Extintor", name_en: "Fire extinguisher", category: "security", icon: "flame" },
  { slug: "first-aid-kit", name_es: "Botiquin", name_en: "First aid kit", category: "security", icon: "cross" },
  { slug: "security-cameras", name_es: "Camaras de seguridad", name_en: "Security cameras", category: "security", icon: "cctv" },
  { slug: "alarm-system", name_es: "Sistema de alarma", name_en: "Alarm system", category: "security", icon: "shield-alert" },
  { slug: "gated-community", name_es: "Fraccionamiento privado", name_en: "Gated community", category: "security", icon: "gate" },
  { slug: "smart-lock", name_es: "Cerradura inteligente", name_en: "Smart lock", category: "security", icon: "lock-keyhole" },
  { slug: "safe-box", name_es: "Caja fuerte", name_en: "Safe box", category: "security", icon: "vault" },
  { slug: "pool", name_es: "Alberca", name_en: "Pool", category: "outdoor", icon: "waves" },
  { slug: "private-pool", name_es: "Alberca privada", name_en: "Private pool", category: "outdoor", icon: "droplets" },
  { slug: "garden", name_es: "Jardin", name_en: "Garden", category: "outdoor", icon: "flower" },
  { slug: "terrace", name_es: "Terraza", name_en: "Terrace", category: "outdoor", icon: "sun" },
  { slug: "balcony", name_es: "Balcon", name_en: "Balcony", category: "outdoor", icon: "building" },
  { slug: "bbq-grill", name_es: "Asador", name_en: "BBQ grill", category: "outdoor", icon: "beef" },
  { slug: "patio", name_es: "Patio", name_en: "Patio", category: "outdoor", icon: "fence" },
  { slug: "outdoor-dining", name_es: "Comedor exterior", name_en: "Outdoor dining", category: "outdoor", icon: "tree-palm" },
  { slug: "beach-access", name_es: "Acceso a playa", name_en: "Beach access", category: "outdoor", icon: "umbrella" },
  { slug: "mountain-view", name_es: "Vista a la montana", name_en: "Mountain view", category: "outdoor", icon: "mountain" },
  { slug: "housekeeping", name_es: "Limpieza", name_en: "Housekeeping", category: "services", icon: "sparkles" },
  { slug: "concierge", name_es: "Concierge", name_en: "Concierge", category: "services", icon: "bell" },
  { slug: "airport-shuttle", name_es: "Transporte al aeropuerto", name_en: "Airport shuttle", category: "services", icon: "bus" },
  { slug: "breakfast-included", name_es: "Desayuno incluido", name_en: "Breakfast included", category: "services", icon: "coffee" },
  { slug: "room-service", name_es: "Room service", name_en: "Room service", category: "services", icon: "hand-platter" },
  { slug: "self-check-in", name_es: "Self check-in", name_en: "Self check-in", category: "services", icon: "key-round" },
  { slug: "luggage-dropoff", name_es: "Resguardo de equipaje", name_en: "Luggage dropoff", category: "services", icon: "luggage" },
  { slug: "workspace", name_es: "Area de trabajo", name_en: "Workspace", category: "services", icon: "briefcase" },
  { slug: "gym", name_es: "Gimnasio", name_en: "Gym", category: "services", icon: "dumbbell" },
  { slug: "spa", name_es: "Spa", name_en: "Spa", category: "services", icon: "heart-pulse" },
  { slug: "wifi", name_es: "Wifi", name_en: "Wi-Fi", category: "tech", icon: "wifi" },
  { slug: "high-speed-wifi", name_es: "Wifi alta velocidad", name_en: "High speed Wi-Fi", category: "tech", icon: "radio-tower" },
  { slug: "smart-tv", name_es: "Smart TV", name_en: "Smart TV", category: "tech", icon: "monitor" },
  { slug: "cable-tv", name_es: "TV por cable", name_en: "Cable TV", category: "tech", icon: "tv" },
  { slug: "streaming-services", name_es: "Streaming", name_en: "Streaming services", category: "tech", icon: "play" },
  { slug: "air-conditioning", name_es: "Aire acondicionado", name_en: "Air conditioning", category: "tech", icon: "snowflake" },
  { slug: "heating", name_es: "Calefaccion", name_en: "Heating", category: "tech", icon: "flame-kindling" },
  { slug: "ev-charger", name_es: "Cargador para EV", name_en: "EV charger", category: "tech", icon: "battery-charging" },
  { slug: "generator", name_es: "Generador electrico", name_en: "Power generator", category: "tech", icon: "zap" },
  { slug: "solar-panels", name_es: "Paneles solares", name_en: "Solar panels", category: "tech", icon: "sun-medium" },
];

const ICON_BY_SLUG = DEFAULT_AMENITIES_CATALOG.reduce((acc, item) => {
  acc[item.slug] = item.icon;
  return acc;
}, {});

export const getAmenityIcon = (amenity = {}) => {
  if (amenity.icon && ICON_EMOJI_BY_KEY[amenity.icon]) {
    return ICON_EMOJI_BY_KEY[amenity.icon];
  }

  if (amenity.icon && !ICON_EMOJI_BY_KEY[amenity.icon]) {
    return amenity.icon;
  }

  if (amenity.slug && ICON_BY_SLUG[amenity.slug]) {
    return ICON_EMOJI_BY_KEY[ICON_BY_SLUG[amenity.slug]] || CATEGORY_ICONS[amenity.category] || "✨";
  }

  return CATEGORY_ICONS[amenity.category] || "✨";
};
