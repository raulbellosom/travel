/**
 * getResourceDetails.js
 *
 * Returns an array of { icon, label, value } tuples for the "Details" column
 * of the resource listing table. Adapts dynamically per resourceType.
 *
 * Each resourceType shows only the fields relevant to it.
 */

/**
 * @param {Object} item - Resource document from Appwrite
 * @param {Function} t - i18n translate function
 * @returns {Array<{icon: string, label: string, value: string|number}>}
 */
export const getResourceDetails = (item, t) => {
  const resourceType = String(item.resourceType || "property").toLowerCase();
  const ns = "myResourcesPage.details";
  const details = [];

  switch (resourceType) {
    case "property":
      return getPropertyDetails(item, t, ns);
    case "vehicle":
      return getVehicleDetails(item, t, ns);
    case "service":
      return getServiceDetails(item, t, ns);
    case "experience":
      return getExperienceDetails(item, t, ns);
    case "venue":
      return getVenueDetails(item, t, ns);
    default:
      return getPropertyDetails(item, t, ns);
  }
};

function getPropertyDetails(item, t, ns) {
  const details = [];

  if (item.bedrooms != null && item.bedrooms > 0) {
    details.push({
      icon: "BedDouble",
      label: t(`${ns}.bedrooms`),
      value: item.bedrooms,
    });
  }

  if (item.bathrooms != null && item.bathrooms > 0) {
    details.push({
      icon: "Bath",
      label: t(`${ns}.bathrooms`),
      value: item.bathrooms,
    });
  }

  if (item.totalArea) {
    details.push({
      icon: "Ruler",
      label: t(`${ns}.totalArea`),
      value: `${item.totalArea} m²`,
    });
  }

  if (item.parkingSpaces > 0) {
    details.push({
      icon: "ParkingCircle",
      label: t(`${ns}.parkingSpaces`),
      value: item.parkingSpaces,
    });
  }

  // Short-term specific
  if (item.maxGuests > 1) {
    details.push({
      icon: "Users",
      label: t(`${ns}.maxGuests`),
      value: item.maxGuests,
    });
  }

  return details.slice(0, 3);
}

function getVehicleDetails(item, t, ns) {
  const details = [];
  const attrs = parseAttributes(item.attributes);

  if (attrs.vehicleSeats) {
    details.push({
      icon: "Armchair",
      label: t(`${ns}.seats`),
      value: attrs.vehicleSeats,
    });
  }

  if (attrs.vehicleDoors) {
    details.push({
      icon: "DoorOpen",
      label: t(`${ns}.doors`),
      value: attrs.vehicleDoors,
    });
  }

  if (attrs.vehicleTransmission) {
    details.push({
      icon: "Settings2",
      label: t(`${ns}.transmission`),
      value: capitalizeFirst(attrs.vehicleTransmission),
    });
  }

  if (attrs.vehicleModelYear) {
    details.push({
      icon: "Calendar",
      label: "Año",
      value: attrs.vehicleModelYear,
    });
  }

  return details.slice(0, 3);
}

function getServiceDetails(item, t, ns) {
  const details = [];
  const attrs = parseAttributes(item.attributes);
  const category = String(item.category || "").toLowerCase();

  // Show category as first detail
  if (category) {
    details.push({
      icon: "Wrench",
      label: t(`${ns}.serviceCategory`, { defaultValue: "Categoría" }),
      value: capitalizeFirst(category),
    });
  }

  // Per-category key details
  switch (category) {
    case "dj":
      if (attrs.djMusicGenre)
        details.push({
          icon: "Music",
          label: t(`${ns}.musicGenre`, { defaultValue: "Género" }),
          value: capitalizeFirst(attrs.djMusicGenre),
        });
      if (Number(attrs.djMaxEventCapacity) > 0)
        details.push({
          icon: "Users",
          label: t(`${ns}.eventCapacity`, { defaultValue: "Capacidad" }),
          value: attrs.djMaxEventCapacity,
        });
      break;
    case "cleaning":
      if (attrs.cleaningType)
        details.push({
          icon: "Sparkles",
          label: t(`${ns}.cleaningType`, { defaultValue: "Tipo" }),
          value: capitalizeFirst(attrs.cleaningType),
        });
      if (Number(attrs.cleaningMaxArea) > 0)
        details.push({
          icon: "Ruler",
          label: t(`${ns}.maxArea`, { defaultValue: "Área máx." }),
          value: `${attrs.cleaningMaxArea} m²`,
        });
      break;
    case "chef":
      if (attrs.chefCuisineType)
        details.push({
          icon: "UtensilsCrossed",
          label: t(`${ns}.cuisine`, { defaultValue: "Cocina" }),
          value: capitalizeFirst(attrs.chefCuisineType),
        });
      if (Number(attrs.chefMaxDiners) > 0)
        details.push({
          icon: "Users",
          label: t(`${ns}.maxDiners`, { defaultValue: "Comensales" }),
          value: attrs.chefMaxDiners,
        });
      break;
    case "photography":
      if (attrs.photoSpecialty)
        details.push({
          icon: "Camera",
          label: t(`${ns}.specialty`, { defaultValue: "Especialidad" }),
          value: capitalizeFirst(attrs.photoSpecialty),
        });
      if (Number(attrs.photoEditedCount) > 0)
        details.push({
          icon: "Camera",
          label: t(`${ns}.editedPhotos`, { defaultValue: "Fotos" }),
          value: `~${attrs.photoEditedCount}`,
        });
      break;
    case "catering":
      if (attrs.cateringServiceType)
        details.push({
          icon: "UtensilsCrossed",
          label: t(`${ns}.serviceType`, { defaultValue: "Tipo" }),
          value: capitalizeFirst(attrs.cateringServiceType),
        });
      if (Number(attrs.cateringMaxGuests) > 0)
        details.push({
          icon: "Users",
          label: t(`${ns}.maxGuests`, { defaultValue: "Comensales" }),
          value: `${attrs.cateringMinGuests || 1}–${attrs.cateringMaxGuests}`,
        });
      break;
    case "maintenance":
      if (attrs.maintenanceSpecialty)
        details.push({
          icon: "Wrench",
          label: t(`${ns}.specialty`, { defaultValue: "Especialidad" }),
          value: capitalizeFirst(attrs.maintenanceSpecialty),
        });
      if (Number(attrs.maintenanceResponseTimeHours) > 0)
        details.push({
          icon: "Timer",
          label: t(`${ns}.responseTime`, { defaultValue: "Respuesta" }),
          value: `${attrs.maintenanceResponseTimeHours}h`,
        });
      break;
    default:
      break;
  }

  if (item.slotDurationMinutes && item.slotDurationMinutes !== 60) {
    details.push({
      icon: "Timer",
      label: t(`${ns}.slotDuration`),
      value: `${item.slotDurationMinutes} min`,
    });
  }

  return details.slice(0, 3);
}

function getExperienceDetails(item, t, ns) {
  const details = [];
  const attrs = parseAttributes(item.attributes);

  if (attrs.experienceDurationMinutes) {
    details.push({
      icon: "Clock",
      label: t(`${ns}.duration`),
      value: `${attrs.experienceDurationMinutes} min`,
    });
  }

  if (attrs.experienceMaxParticipants) {
    details.push({
      icon: "Users",
      label: t(`${ns}.participants`),
      value: `${attrs.experienceMinParticipants || 1}-${attrs.experienceMaxParticipants}`,
    });
  }

  if (item.maxGuests > 1) {
    details.push({
      icon: "Users",
      label: t(`${ns}.maxGuests`),
      value: item.maxGuests,
    });
  }

  return details.slice(0, 3);
}

function getVenueDetails(item, t, ns) {
  const details = [];
  const attrs = parseAttributes(item.attributes);

  if (attrs.venueCapacitySeated) {
    details.push({
      icon: "Armchair",
      label: t(`${ns}.capacitySeated`),
      value: attrs.venueCapacitySeated,
    });
  }

  if (attrs.venueCapacityStanding) {
    details.push({
      icon: "Users",
      label: t(`${ns}.capacityStanding`),
      value: attrs.venueCapacityStanding,
    });
  }

  if (item.totalArea) {
    details.push({
      icon: "Ruler",
      label: t(`${ns}.totalArea`),
      value: `${item.totalArea} m²`,
    });
  }

  return details.slice(0, 3);
}

// ─── Helpers ────────────────────────────────────────────────────

function parseAttributes(attrs) {
  if (!attrs) return {};
  if (typeof attrs === "object" && !Array.isArray(attrs)) return attrs;
  if (typeof attrs === "string") {
    try {
      return JSON.parse(attrs);
    } catch {
      return {};
    }
  }
  return {};
}

function capitalizeFirst(str) {
  const s = String(str || "").trim();
  return s.charAt(0).toUpperCase() + s.slice(1);
}
