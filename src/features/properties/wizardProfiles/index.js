/**
 * wizardProfiles/index.js
 * Registry + helpers to resolve the correct profile by resourceType.
 *
 * Expected usage (wizard engine):
 *   import { getProfile, getAllProfiles } from "../wizardProfiles";
 *   const profile = getProfile(context.resourceType);
 */

import propertyProfile from "./property";
import serviceProfile from "./service";
import musicProfile from "./music";
import vehicleProfile from "./vehicle";
import experienceProfile from "./experience";
import venueProfile from "./venue";

const PROFILES = [
  propertyProfile,
  serviceProfile,
  musicProfile,
  vehicleProfile,
  experienceProfile,
  venueProfile,
];

export function getAllProfiles() {
  return [...PROFILES];
}

/**
 * @param {string} resourceType - one of: property, service, music, vehicle, experience, venue
 */
export function getProfile(resourceType) {
  if (!resourceType) return null;
  return PROFILES.find((p) => p.resourceType === resourceType) || null;
}

export function assertProfile(resourceType) {
  const p = getProfile(resourceType);
  if (!p) {
    const known = PROFILES.map((x) => x.resourceType).join(", ");
    throw new Error(`Unknown resourceType "${resourceType}". Known: ${known}`);
  }
  return p;
}

export default {
  getAllProfiles,
  getProfile,
  assertProfile,
};
