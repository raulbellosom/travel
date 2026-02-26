import { Building2, Car, Compass, Landmark, Music, Wrench } from "lucide-react";

/**
 * Map resource type to its icon and a color class for visual distinction.
 */
const TYPE_CONFIG = {
  property: { Icon: Building2, color: "text-sky-600 dark:text-sky-400" },
  service: { Icon: Wrench, color: "text-emerald-600 dark:text-emerald-400" },
  music: { Icon: Music, color: "text-fuchsia-600 dark:text-fuchsia-400" },
  vehicle: { Icon: Car, color: "text-amber-600 dark:text-amber-400" },
  experience: { Icon: Compass, color: "text-violet-600 dark:text-violet-400" },
  venue: { Icon: Landmark, color: "text-rose-600 dark:text-rose-400" },
};

const DEFAULT_CONFIG = TYPE_CONFIG.property;

/**
 * ResourceTypeBadge
 *
 * Displays resource type as a small badge with icon + translated label.
 *
 * @param {string} resourceType - e.g. "property", "vehicle"
 * @param {string} label - Already-translated label
 */
const ResourceTypeBadge = ({ resourceType, label }) => {
  const config =
    TYPE_CONFIG[String(resourceType || "").toLowerCase()] || DEFAULT_CONFIG;
  const { Icon, color } = config;

  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-medium ${color}`}
    >
      <Icon size={13} className="shrink-0" />
      <span className="truncate">{label}</span>
    </span>
  );
};

export default ResourceTypeBadge;
