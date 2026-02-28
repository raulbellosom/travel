import {
  Armchair,
  Bath,
  BedDouble,
  Calendar,
  Clock,
  DoorOpen,
  ParkingCircle,
  Ruler,
  Settings2,
  Timer,
  Users,
} from "lucide-react";

/**
 * Map icon name strings to lucide-react components.
 * Keeps the getResourceDetails utility free of React dependencies.
 */
const ICON_MAP = {
  BedDouble,
  Bath,
  Ruler,
  ParkingCircle,
  Users,
  Armchair,
  DoorOpen,
  Settings2,
  Calendar,
  Clock,
  Timer,
};

/**
 * ResourceDetailsCell
 *
 * Renders adaptive detail items (icon + value) based on resource type.
 * Receives pre-computed detail tuples from getResourceDetails().
 *
 * @param {Array<{icon: string, label: string, value: string|number}>} details
 */
const EMPTY_ARRAY = [];
const ResourceDetailsCell = ({ details = EMPTY_ARRAY }) => {
  if (details.length === 0) {
    return (
      <span className="text-xs text-slate-400 dark:text-slate-500">—</span>
    );
  }

  return (
    <div className="grid gap-1 text-slate-600 dark:text-slate-300">
      {details.map((detail) => {
        const IconComponent = ICON_MAP[detail.icon] || null;

        return (
          <span
            key={detail.label}
            className="inline-flex items-center gap-1.5 text-xs"
            title={detail.label}
          >
            {IconComponent ? (
              <IconComponent size={13} className="shrink-0 text-slate-400" />
            ) : null}
            <span className="truncate">{detail.value}</span>
          </span>
        );
      })}
    </div>
  );
};

export default ResourceDetailsCell;
