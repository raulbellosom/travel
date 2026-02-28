import {
  Accessibility,
  AirVent,
  AlarmSmoke,
  Armchair,
  Baby,
  BadgeAlert,
  BatteryCharging,
  Bed,
  BedDouble,
  Beef,
  Bell,
  Bike,
  Blinds,
  Bolt,
  Briefcase,
  Building,
  Bus,
  Car,
  Cctv,
  ChevronsUp,
  Cigarette,
  CircleParking,
  Coffee,
  Compass,
  ConciergeBell,
  Construction,
  CookingPot,
  Cross,
  DoorOpen,
  Droplets,
  Dumbbell,
  Eye,
  Fan,
  Fence,
  Flame,
  FlameKindling,
  Flower,
  Footprints,
  Hammer,
  HandPlatter,
  HeartPulse,
  House,
  KeyRound,
  LandPlot,
  Lightbulb,
  LockKeyhole,
  Luggage,
  MapPin,
  Monitor,
  Mountain,
  PawPrint,
  Phone,
  Pipette,
  Play,
  Plug,
  RadioTower,
  Refrigerator,
  Ruler,
  School,
  Shield,
  ShieldAlert,
  ShoppingBag,
  ShowerHead,
  Snowflake,
  Sofa,
  Sparkles,
  SquareParking,
  Store,
  Sun,
  SunMedium,
  Thermometer,
  Trash2,
  TreePalm,
  Trees,
  Truck,
  Tv,
  Umbrella,
  UtensilsCrossed,
  Vault,
  Video,
  Warehouse,
  WashingMachine,
  ArrowUpDown,
  Waves,
  Wifi,
  Wind,
  Wine,
  Wrench,
  Zap,
} from "lucide-react";
import PropTypes from "prop-types";

/**
 * Maps each amenity icon key to a Lucide React icon component.
 * Keys correspond to the `icon` field in DEFAULT_AMENITIES_CATALOG.
 */
const ICON_COMPONENT_MAP = {
  /* ── general ───────────────────────────────────── */
  sofa: Sofa,
  armchair: Armchair,
  "utensils-crossed": UtensilsCrossed,
  "cooking-pot": CookingPot,
  refrigerator: Refrigerator,
  "washing-machine": WashingMachine,
  wind: Wind,
  shower: ShowerHead,
  "paw-print": PawPrint,
  baby: Baby,
  cigarette: Cigarette,
  accessibility: Accessibility,
  bed: Bed,
  "bed-double": BedDouble,
  "door-open": DoorOpen,
  blinds: Blinds,
  fan: Fan,

  /* ── security ──────────────────────────────────── */
  "alarm-smoke": AlarmSmoke,
  "badge-alert": BadgeAlert,
  flame: Flame,
  cross: Cross,
  cctv: Cctv,
  "shield-alert": ShieldAlert,
  shield: Shield,
  "lock-keyhole": LockKeyhole,
  vault: Vault,
  eye: Eye,

  /* ── outdoor ───────────────────────────────────── */
  waves: Waves,
  droplets: Droplets,
  flower: Flower,
  sun: Sun,
  building: Building,
  beef: Beef,
  fence: Fence,
  "tree-palm": TreePalm,
  trees: Trees,
  umbrella: Umbrella,
  mountain: Mountain,
  footprints: Footprints,
  compass: Compass,
  bike: Bike,

  /* ── services ──────────────────────────────────── */
  sparkles: Sparkles,
  bell: Bell,
  "concierge-bell": ConciergeBell,
  bus: Bus,
  car: Car,
  coffee: Coffee,
  "hand-platter": HandPlatter,
  "key-round": KeyRound,
  luggage: Luggage,
  briefcase: Briefcase,
  dumbbell: Dumbbell,
  "heart-pulse": HeartPulse,
  phone: Phone,
  "shopping-bag": ShoppingBag,
  wine: Wine,
  "trash-2": Trash2,
  store: Store,
  school: School,
  truck: Truck,
  wrench: Wrench,
  hammer: Hammer,
  construction: Construction,

  /* ── tech ───────────────────────────────────────── */
  wifi: Wifi,
  "radio-tower": RadioTower,
  monitor: Monitor,
  tv: Tv,
  play: Play,
  video: Video,
  snowflake: Snowflake,
  "flame-kindling": FlameKindling,
  "battery-charging": BatteryCharging,
  zap: Zap,
  "sun-medium": SunMedium,
  "air-vent": AirVent,
  plug: Plug,
  bolt: Bolt,
  lightbulb: Lightbulb,
  thermometer: Thermometer,

  /* ── infrastructure (for land / commercial) ────── */
  "land-plot": LandPlot,
  ruler: Ruler,
  warehouse: Warehouse,
  "square-parking": SquareParking,
  "circle-parking": CircleParking,
  "map-pin": MapPin,
  house: House,
  elevator: ArrowUpDown,
  "chevrons-up": ChevronsUp,
  pipette: Pipette,
};

/** Category fallback icons */
const CATEGORY_ICON_MAP = {
  general: House,
  security: Shield,
  outdoor: Trees,
  services: ConciergeBell,
  tech: Monitor,
};

/**
 * Resolves an amenity icon key to a Lucide component.
 * Returns the component reference (not a rendered element).
 */
// eslint-disable-next-line react-refresh/only-export-components
export const resolveAmenityIcon = (iconKey, category) => {
  if (iconKey && ICON_COMPONENT_MAP[iconKey]) {
    return ICON_COMPONENT_MAP[iconKey];
  }
  if (category && CATEGORY_ICON_MAP[category]) {
    return CATEGORY_ICON_MAP[category];
  }
  return Sparkles;
};

/**
 * Renders a Lucide icon for an amenity.
 *
 * Props:
 * - `iconKey`  – the `icon` field from the amenity record
 * - `category` – fallback category when iconKey is missing/unknown
 * - `size`     – icon pixel size (default 16)
 * - `className`– additional CSS classes
 *
 * The icon inherits color from its parent via `currentColor` by default,
 * but you can pass Tailwind text‑color classes to override.
 */
const AmenityIcon = ({
  iconKey,
  category,
  size = 16,
  className = "text-cyan-500 dark:text-cyan-400",
}) => {
  const IconComp = resolveAmenityIcon(iconKey, category);
  return <IconComp size={size} className={className} aria-hidden="true" />;
};

AmenityIcon.propTypes = {
  iconKey: PropTypes.string,
  category: PropTypes.string,
  size: PropTypes.number,
  className: PropTypes.string,
};

export default AmenityIcon;
