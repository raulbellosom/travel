import { resolveAmenityIcon } from "../components/common/atoms/AmenityIcon";

/* ───────────────────────────────────────────────────────────────────────────
 *  Amenity categories (matches Appwrite enum for `amenities.category`)
 * ─────────────────────────────────────────────────────────────────────────── */
export const AMENITY_CATEGORY_VALUES = [
  "general",
  "security",
  "outdoor",
  "services",
  "tech",
];

/* ───────────────────────────────────────────────────────────────────────────
 *  Default amenities catalog
 *
 *  - `icon` is a key that maps to a Lucide React component via AmenityIcon.
 *  - Covers property types: house, apartment, land, commercial, office, warehouse
 *  - Covers operation types: sale, rent, vacation_rental
 * ─────────────────────────────────────────────────────────────────────────── */
export const DEFAULT_AMENITIES_CATALOG = [
  /* ================  GENERAL  ================ */
  {
    slug: "furnished",
    name_es: "Amueblado",
    name_en: "Furnished",
    category: "general",
    icon: "sofa",
  },
  {
    slug: "semi-furnished",
    name_es: "Semi amueblado",
    name_en: "Semi furnished",
    category: "general",
    icon: "armchair",
  },
  {
    slug: "kitchen",
    name_es: "Cocina equipada",
    name_en: "Equipped kitchen",
    category: "general",
    icon: "cooking-pot",
  },
  {
    slug: "dining-area",
    name_es: "Comedor",
    name_en: "Dining area",
    category: "general",
    icon: "utensils-crossed",
  },
  {
    slug: "living-room",
    name_es: "Sala de estar",
    name_en: "Living room",
    category: "general",
    icon: "armchair",
  },
  {
    slug: "washer",
    name_es: "Lavadora",
    name_en: "Washer",
    category: "general",
    icon: "washing-machine",
  },
  {
    slug: "dryer",
    name_es: "Secadora",
    name_en: "Dryer",
    category: "general",
    icon: "wind",
  },
  {
    slug: "refrigerator",
    name_es: "Refrigerador",
    name_en: "Refrigerator",
    category: "general",
    icon: "refrigerator",
  },
  {
    slug: "hot-water",
    name_es: "Agua caliente",
    name_en: "Hot water",
    category: "general",
    icon: "shower",
  },
  {
    slug: "pet-friendly",
    name_es: "Pet friendly",
    name_en: "Pet friendly",
    category: "general",
    icon: "paw-print",
  },
  {
    slug: "family-friendly",
    name_es: "Ideal para familias",
    name_en: "Family friendly",
    category: "general",
    icon: "baby",
  },
  {
    slug: "smoking-area",
    name_es: "Area para fumar",
    name_en: "Smoking area",
    category: "general",
    icon: "cigarette",
  },
  {
    slug: "wheelchair-access",
    name_es: "Acceso para silla de ruedas",
    name_en: "Wheelchair access",
    category: "general",
    icon: "accessibility",
  },
  {
    slug: "extra-beds",
    name_es: "Camas extras disponibles",
    name_en: "Extra beds available",
    category: "general",
    icon: "bed-double",
  },
  {
    slug: "closet-storage",
    name_es: "Closet / almacenamiento",
    name_en: "Closet / storage",
    category: "general",
    icon: "door-open",
  },
  {
    slug: "window-blinds",
    name_es: "Persianas / cortinas",
    name_en: "Window blinds / curtains",
    category: "general",
    icon: "blinds",
  },
  {
    slug: "ceiling-fan",
    name_es: "Ventilador de techo",
    name_en: "Ceiling fan",
    category: "general",
    icon: "fan",
  },
  {
    slug: "high-ceilings",
    name_es: "Techos altos",
    name_en: "High ceilings",
    category: "general",
    icon: "chevrons-up",
  },

  /* ================  SECURITY  ================ */
  {
    slug: "smoke-detector",
    name_es: "Detector de humo",
    name_en: "Smoke detector",
    category: "security",
    icon: "alarm-smoke",
  },
  {
    slug: "co-detector",
    name_es: "Detector de CO",
    name_en: "CO detector",
    category: "security",
    icon: "badge-alert",
  },
  {
    slug: "fire-extinguisher",
    name_es: "Extintor",
    name_en: "Fire extinguisher",
    category: "security",
    icon: "flame",
  },
  {
    slug: "first-aid-kit",
    name_es: "Botiquin",
    name_en: "First aid kit",
    category: "security",
    icon: "cross",
  },
  {
    slug: "security-cameras",
    name_es: "Camaras de seguridad",
    name_en: "Security cameras",
    category: "security",
    icon: "cctv",
  },
  {
    slug: "alarm-system",
    name_es: "Sistema de alarma",
    name_en: "Alarm system",
    category: "security",
    icon: "shield-alert",
  },
  {
    slug: "gated-community",
    name_es: "Fraccionamiento privado",
    name_en: "Gated community",
    category: "security",
    icon: "shield",
  },
  {
    slug: "smart-lock",
    name_es: "Cerradura inteligente",
    name_en: "Smart lock",
    category: "security",
    icon: "lock-keyhole",
  },
  {
    slug: "safe-box",
    name_es: "Caja fuerte",
    name_en: "Safe box",
    category: "security",
    icon: "vault",
  },
  {
    slug: "24h-security",
    name_es: "Vigilancia 24 h",
    name_en: "24h security",
    category: "security",
    icon: "eye",
  },
  {
    slug: "controlled-access",
    name_es: "Acceso controlado",
    name_en: "Controlled access",
    category: "security",
    icon: "door-open",
  },

  /* ================  OUTDOOR  ================ */
  {
    slug: "pool",
    name_es: "Alberca",
    name_en: "Pool",
    category: "outdoor",
    icon: "waves",
  },
  {
    slug: "private-pool",
    name_es: "Alberca privada",
    name_en: "Private pool",
    category: "outdoor",
    icon: "droplets",
  },
  {
    slug: "garden",
    name_es: "Jardin",
    name_en: "Garden",
    category: "outdoor",
    icon: "flower",
  },
  {
    slug: "terrace",
    name_es: "Terraza",
    name_en: "Terrace",
    category: "outdoor",
    icon: "sun",
  },
  {
    slug: "balcony",
    name_es: "Balcon",
    name_en: "Balcony",
    category: "outdoor",
    icon: "building",
  },
  {
    slug: "bbq-grill",
    name_es: "Asador / BBQ",
    name_en: "BBQ grill",
    category: "outdoor",
    icon: "beef",
  },
  {
    slug: "patio",
    name_es: "Patio",
    name_en: "Patio",
    category: "outdoor",
    icon: "fence",
  },
  {
    slug: "outdoor-dining",
    name_es: "Comedor exterior",
    name_en: "Outdoor dining",
    category: "outdoor",
    icon: "tree-palm",
  },
  {
    slug: "beach-access",
    name_es: "Acceso a playa",
    name_en: "Beach access",
    category: "outdoor",
    icon: "umbrella",
  },
  {
    slug: "mountain-view",
    name_es: "Vista a la montana",
    name_en: "Mountain view",
    category: "outdoor",
    icon: "mountain",
  },
  {
    slug: "ocean-view",
    name_es: "Vista al mar",
    name_en: "Ocean view",
    category: "outdoor",
    icon: "waves",
  },
  {
    slug: "lake-view",
    name_es: "Vista al lago",
    name_en: "Lake view",
    category: "outdoor",
    icon: "droplets",
  },
  {
    slug: "rooftop",
    name_es: "Rooftop",
    name_en: "Rooftop",
    category: "outdoor",
    icon: "building",
  },
  {
    slug: "playground",
    name_es: "Area de juegos",
    name_en: "Playground",
    category: "outdoor",
    icon: "baby",
  },
  {
    slug: "green-areas",
    name_es: "Areas verdes",
    name_en: "Green areas",
    category: "outdoor",
    icon: "trees",
  },
  {
    slug: "hiking-trails",
    name_es: "Senderos",
    name_en: "Hiking trails",
    category: "outdoor",
    icon: "footprints",
  },
  {
    slug: "bike-parking",
    name_es: "Estacionamiento para bicicletas",
    name_en: "Bike parking",
    category: "outdoor",
    icon: "bike",
  },

  /* ================  SERVICES  ================ */
  {
    slug: "housekeeping",
    name_es: "Limpieza",
    name_en: "Housekeeping",
    category: "services",
    icon: "sparkles",
  },
  {
    slug: "concierge",
    name_es: "Concierge",
    name_en: "Concierge",
    category: "services",
    icon: "concierge-bell",
  },
  {
    slug: "airport-shuttle",
    name_es: "Transporte al aeropuerto",
    name_en: "Airport shuttle",
    category: "services",
    icon: "bus",
  },
  {
    slug: "breakfast-included",
    name_es: "Desayuno incluido",
    name_en: "Breakfast included",
    category: "services",
    icon: "coffee",
  },
  {
    slug: "room-service",
    name_es: "Room service",
    name_en: "Room service",
    category: "services",
    icon: "hand-platter",
  },
  {
    slug: "self-check-in",
    name_es: "Self check-in",
    name_en: "Self check-in",
    category: "services",
    icon: "key-round",
  },
  {
    slug: "luggage-dropoff",
    name_es: "Resguardo de equipaje",
    name_en: "Luggage dropoff",
    category: "services",
    icon: "luggage",
  },
  {
    slug: "workspace",
    name_es: "Area de trabajo",
    name_en: "Workspace",
    category: "services",
    icon: "briefcase",
  },
  {
    slug: "gym",
    name_es: "Gimnasio",
    name_en: "Gym",
    category: "services",
    icon: "dumbbell",
  },
  {
    slug: "spa",
    name_es: "Spa",
    name_en: "Spa",
    category: "services",
    icon: "heart-pulse",
  },
  {
    slug: "reception-24h",
    name_es: "Recepcion 24 h",
    name_en: "24h reception",
    category: "services",
    icon: "phone",
  },
  {
    slug: "parking",
    name_es: "Estacionamiento",
    name_en: "Parking",
    category: "services",
    icon: "square-parking",
  },
  {
    slug: "covered-parking",
    name_es: "Estacionamiento techado",
    name_en: "Covered parking",
    category: "services",
    icon: "circle-parking",
  },
  {
    slug: "valet-parking",
    name_es: "Valet parking",
    name_en: "Valet parking",
    category: "services",
    icon: "car",
  },
  {
    slug: "laundry-service",
    name_es: "Servicio de lavanderia",
    name_en: "Laundry service",
    category: "services",
    icon: "washing-machine",
  },
  {
    slug: "bar-lounge",
    name_es: "Bar / lounge",
    name_en: "Bar / lounge",
    category: "services",
    icon: "wine",
  },
  {
    slug: "trash-collection",
    name_es: "Recoleccion de basura",
    name_en: "Trash collection",
    category: "services",
    icon: "trash-2",
  },
  {
    slug: "nearby-shopping",
    name_es: "Comercios cercanos",
    name_en: "Nearby shopping",
    category: "services",
    icon: "shopping-bag",
  },
  {
    slug: "nearby-schools",
    name_es: "Escuelas cercanas",
    name_en: "Nearby schools",
    category: "services",
    icon: "school",
  },
  {
    slug: "nearby-transport",
    name_es: "Transporte publico cercano",
    name_en: "Nearby public transport",
    category: "services",
    icon: "bus",
  },
  {
    slug: "maintenance-included",
    name_es: "Mantenimiento incluido",
    name_en: "Maintenance included",
    category: "services",
    icon: "wrench",
  },
  {
    slug: "loading-dock",
    name_es: "Anden de carga",
    name_en: "Loading dock",
    category: "services",
    icon: "truck",
  },

  /* ================  TECH  ================ */
  {
    slug: "wifi",
    name_es: "Wi-Fi",
    name_en: "Wi-Fi",
    category: "tech",
    icon: "wifi",
  },
  {
    slug: "high-speed-wifi",
    name_es: "Wi-Fi alta velocidad",
    name_en: "High speed Wi-Fi",
    category: "tech",
    icon: "radio-tower",
  },
  {
    slug: "smart-tv",
    name_es: "Smart TV",
    name_en: "Smart TV",
    category: "tech",
    icon: "monitor",
  },
  {
    slug: "cable-tv",
    name_es: "TV por cable",
    name_en: "Cable TV",
    category: "tech",
    icon: "tv",
  },
  {
    slug: "streaming-services",
    name_es: "Streaming",
    name_en: "Streaming services",
    category: "tech",
    icon: "play",
  },
  {
    slug: "air-conditioning",
    name_es: "Aire acondicionado",
    name_en: "Air conditioning",
    category: "tech",
    icon: "snowflake",
  },
  {
    slug: "central-ac",
    name_es: "Aire acondicionado central",
    name_en: "Central A/C",
    category: "tech",
    icon: "air-vent",
  },
  {
    slug: "heating",
    name_es: "Calefaccion",
    name_en: "Heating",
    category: "tech",
    icon: "flame-kindling",
  },
  {
    slug: "ev-charger",
    name_es: "Cargador para EV",
    name_en: "EV charger",
    category: "tech",
    icon: "battery-charging",
  },
  {
    slug: "generator",
    name_es: "Generador electrico",
    name_en: "Power generator",
    category: "tech",
    icon: "zap",
  },
  {
    slug: "solar-panels",
    name_es: "Paneles solares",
    name_en: "Solar panels",
    category: "tech",
    icon: "sun-medium",
  },
  {
    slug: "smart-home",
    name_es: "Sistema domotico",
    name_en: "Smart home system",
    category: "tech",
    icon: "lightbulb",
  },
  {
    slug: "intercom",
    name_es: "Intercomunicador",
    name_en: "Intercom",
    category: "tech",
    icon: "phone",
  },
  {
    slug: "fiber-optic",
    name_es: "Fibra optica",
    name_en: "Fiber optic internet",
    category: "tech",
    icon: "bolt",
  },
  {
    slug: "cctv-system",
    name_es: "Sistema CCTV",
    name_en: "CCTV system",
    category: "tech",
    icon: "video",
  },
  {
    slug: "backup-power",
    name_es: "Energia de respaldo",
    name_en: "Backup power",
    category: "tech",
    icon: "plug",
  },
  {
    slug: "thermostat",
    name_es: "Termostato programable",
    name_en: "Programmable thermostat",
    category: "tech",
    icon: "thermometer",
  },

  /* ================  INFRASTRUCTURE (land / commercial / warehouse)  ================ */
  {
    slug: "paved-access",
    name_es: "Acceso pavimentado",
    name_en: "Paved road access",
    category: "general",
    icon: "compass",
  },
  {
    slug: "electricity-supply",
    name_es: "Suministro electrico",
    name_en: "Electricity supply",
    category: "tech",
    icon: "zap",
  },
  {
    slug: "water-supply",
    name_es: "Suministro de agua",
    name_en: "Water supply",
    category: "general",
    icon: "droplets",
  },
  {
    slug: "sewer-connection",
    name_es: "Conexion a drenaje",
    name_en: "Sewer connection",
    category: "general",
    icon: "pipette",
  },
  {
    slug: "perimeter-fence",
    name_es: "Barda perimetral",
    name_en: "Perimeter fence",
    category: "security",
    icon: "fence",
  },
  {
    slug: "natural-gas",
    name_es: "Gas natural",
    name_en: "Natural gas",
    category: "general",
    icon: "flame",
  },
  {
    slug: "elevator",
    name_es: "Elevador",
    name_en: "Elevator",
    category: "general",
    icon: "elevator",
  },
  {
    slug: "warehouse-storage",
    name_es: "Bodega / almacen",
    name_en: "Warehouse / storage",
    category: "general",
    icon: "warehouse",
  },
  {
    slug: "street-level",
    name_es: "Nivel de calle",
    name_en: "Street level",
    category: "general",
    icon: "store",
  },
  {
    slug: "signage-allowed",
    name_es: "Permite rotulacion",
    name_en: "Signage allowed",
    category: "general",
    icon: "map-pin",
  },
  {
    slug: "open-floor-plan",
    name_es: "Planta libre",
    name_en: "Open floor plan",
    category: "general",
    icon: "land-plot",
  },
  {
    slug: "private-office",
    name_es: "Oficina privada",
    name_en: "Private office",
    category: "general",
    icon: "door-open",
  },
  {
    slug: "meeting-rooms",
    name_es: "Salas de juntas",
    name_en: "Meeting rooms",
    category: "services",
    icon: "briefcase",
  },
  {
    slug: "conference-room",
    name_es: "Sala de conferencias",
    name_en: "Conference room",
    category: "services",
    icon: "monitor",
  },
];

/* ───────────────────────────────────────────────────────────────────────────
 *  Helper: resolve an amenity object (or slug string) to a Lucide component
 * ─────────────────────────────────────────────────────────────────────────── */

const ICON_BY_SLUG = DEFAULT_AMENITIES_CATALOG.reduce((acc, item) => {
  acc[item.slug] = item.icon;
  return acc;
}, {});

const CATEGORY_BY_SLUG = DEFAULT_AMENITIES_CATALOG.reduce((acc, item) => {
  acc[item.slug] = item.category;
  return acc;
}, {});

/**
 * Returns a Lucide React component for the given amenity.
 *
 * @param {object|string} amenity - amenity object { icon, slug, category } or slug string
 * @returns {import("react").ComponentType} Lucide icon component
 */
export const getAmenityIcon = (amenity = {}) => {
  // If a raw slug string is passed, normalise to an object-like lookup
  if (typeof amenity === "string") {
    const slug = amenity;
    return resolveAmenityIcon(ICON_BY_SLUG[slug], CATEGORY_BY_SLUG[slug]);
  }

  // Object with `icon` key
  if (amenity.icon) {
    return resolveAmenityIcon(amenity.icon, amenity.category);
  }

  // Fallback via slug
  if (amenity.slug && ICON_BY_SLUG[amenity.slug]) {
    return resolveAmenityIcon(ICON_BY_SLUG[amenity.slug], amenity.category);
  }

  // Category-only fallback
  return resolveAmenityIcon(null, amenity.category);
};
